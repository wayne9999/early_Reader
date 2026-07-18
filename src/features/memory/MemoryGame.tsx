import { useEffect, useMemo, useState } from "react";
import { memoryCards } from "../../data/content";
import { contentAccessTier, contentTierSummary, filterContentForTier } from "../../services/contentAccess";
import { recordMemoryWin } from "../../services/progressRepository";
import { celebrate, speak } from "../../shared/speech";
import type { AppUser, MemoryCardContent, Progress, SubscriptionRecord, UserProfile } from "../../types";
import { recordLearningEvent } from "../../services/learningEventRepository";

type MemoryCardInstance = MemoryCardContent & {
  instanceId: string;
};

type MemoryGameProps = {
  progress: Progress;
  user: AppUser | null;
  profile?: UserProfile | null;
  subscription?: SubscriptionRecord | null;
  onProgressChange: (progress: Progress) => void;
};

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function buildDeck(cards: MemoryCardContent[]) {
  return shuffle(
    cards.flatMap((card) => [
      { ...card, instanceId: `${card.id}-a` },
      { ...card, instanceId: `${card.id}-b` }
    ])
  );
}

function useCompactMemoryBoard() {
  const [isCompact, setIsCompact] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 700px)").matches : false
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 700px)");
    const update = () => setIsCompact(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return isCompact;
}

function pairCountForTier(tier: ReturnType<typeof contentAccessTier>, isCompact: boolean) {
  if (isCompact) {
    return tier === "paid" ? 6 : tier === "registered" ? 5 : 4;
  }

  return tier === "paid" ? 10 : tier === "registered" ? 8 : 6;
}

export function MemoryGame({ progress, user, profile, subscription, onProgressChange }: MemoryGameProps) {
  const tier = contentAccessTier(user, profile, subscription);
  const tierSummary = contentTierSummary(tier);
  const isCompactBoard = useCompactMemoryBoard();
  const availableCards = useMemo(() => filterContentForTier(memoryCards, tier), [tier]);
  const practiceCards = useMemo(
    () => shuffle(availableCards).slice(0, pairCountForTier(tier, isCompactBoard)),
    [availableCards, isCompactBoard, tier]
  );
  const [deck, setDeck] = useState<MemoryCardInstance[]>(() => buildDeck(practiceCards));
  const [selected, setSelected] = useState<MemoryCardInstance[]>([]);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(() => new Set());
  const [turns, setTurns] = useState(0);
  const [locked, setLocked] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    void recordLearningEvent(user, "memory_started", "Memory board started", "workingMemory", {
      pairs: practiceCards.length,
      cards: practiceCards.length * 2,
      availablePairs: availableCards.length,
      contentTier: tier
    });
  }, [availableCards.length, practiceCards.length, tier, user]);

  useEffect(() => {
    setDeck(buildDeck(practiceCards));
    setSelected([]);
    setMatchedIds(new Set());
    setTurns(0);
    setLocked(false);
    setCompleted(false);
  }, [practiceCards]);

  const message = useMemo(() => {
    if (completed) {
      return `Board complete in ${turns} ${turns === 1 ? "turn" : "turns"}.`;
    }

    if (selected.length === 1) {
      return "One card is open. Pick one more card to finish the turn.";
    }

    return "Find matching pairs. One turn is two card picks.";
  }, [completed, selected.length, turns]);

  function resetGame() {
    setDeck(buildDeck(practiceCards));
    setSelected([]);
    setMatchedIds(new Set());
    setTurns(0);
    setLocked(false);
    setCompleted(false);
    void recordLearningEvent(user, "memory_started", "New memory board", "workingMemory", {
      pairs: practiceCards.length,
      cards: practiceCards.length * 2,
      availablePairs: availableCards.length,
      contentTier: tier,
      action: "new_game"
    });
  }

  function selectCard(card: MemoryCardInstance) {
    if (locked || completed || matchedIds.has(card.id) || selected.some((item) => item.instanceId === card.instanceId)) {
      return;
    }

    const nextSelected = [...selected, card];
    setSelected(nextSelected);
    void recordLearningEvent(user, "memory_card_revealed", card.label, "workingMemory", {
      turns,
      category: card.category,
      matchedPairs: matchedIds.size,
      pickInTurn: nextSelected.length
    });

    if (nextSelected.length !== 2) {
      return;
    }

    const nextTurns = turns + 1;
    setTurns(nextTurns);

    const [first, second] = nextSelected;
    void recordLearningEvent(user, "memory_attempt", `${first.label} + ${second.label}`, "workingMemory", {
      turns: nextTurns,
      firstCard: first.label,
      secondCard: second.label,
      correct: first.id === second.id
    });

    if (first.id === second.id) {
      const nextMatchedIds = new Set(matchedIds).add(first.id);
      setMatchedIds(nextMatchedIds);
      setSelected([]);
      void recordLearningEvent(user, "memory_match", first.label, "workingMemory", {
        turns: nextTurns,
        category: first.category
      });
      celebrate(`You found a match: ${first.label}!`);

      if (nextMatchedIds.size === practiceCards.length) {
        setCompleted(true);
        onProgressChange(recordMemoryWin(progress, nextTurns));
        void recordLearningEvent(user, "memory_completed", "Memory board completed", "workingMemory", {
          turns: nextTurns,
          matches: practiceCards.length,
          availablePairs: availableCards.length,
          contentTier: tier
        });
        celebrate(`Amazing work! You finished the board in ${nextTurns} turns.`);
      }
      return;
    }

    speak("Try again. Look carefully for the matching card.", { rate: 0.88, pitch: 1.05 });
    setLocked(true);
    window.setTimeout(() => {
      setSelected([]);
      setLocked(false);
    }, 1600);
  }

  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Remember and match</p>
          <h2>Memory cards with school-ready ideas</h2>
        </div>
        <button className="secondary-button" type="button" onClick={resetGame}>
          New game
        </button>
      </div>

      <article className={`content-tier-banner is-${tier}`}>
        <div>
          <p className="eyebrow">{tierSummary.label}</p>
          <h3>{tierSummary.message}</h3>
        </div>
        <span>{availableCards.length} memory pairs available</span>
      </article>

      <div className="memory-status">
        <span>
          {turns} {turns === 1 ? "turn" : "turns"} taken
        </span>
        <span>
          {matchedIds.size} of {practiceCards.length} pairs matched
        </span>
      </div>
      <p className="memory-message">{message}</p>
      <div className="memory-board">
        {deck.map((card) => {
          const isSelected = selected.some((item) => item.instanceId === card.instanceId);
          const isMatched = matchedIds.has(card.id);

          return (
            <button
              className={[
                "memory-card",
                isSelected ? "is-selected is-visible" : "",
                isMatched ? "is-matched is-visible" : ""
              ]
                .filter(Boolean)
                .join(" ")}
              disabled={isMatched || completed}
              key={card.instanceId}
              type="button"
              aria-label={isSelected || isMatched ? card.label : "Hidden memory card"}
              onClick={() => selectCard(card)}
            >
              <span className="memory-front">Tap</span>
              <span className="memory-back">
                <strong>{card.label}</strong>
                <small>{card.category}</small>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
