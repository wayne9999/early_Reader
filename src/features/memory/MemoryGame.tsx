import { useMemo, useState } from "react";
import { memoryCards } from "../../data/content";
import { recordMemoryWin } from "../../services/progressRepository";
import { celebrate, speak } from "../../shared/speech";
import type { MemoryCardContent, Progress } from "../../types";

type MemoryCardInstance = MemoryCardContent & {
  instanceId: string;
};

type MemoryGameProps = {
  progress: Progress;
  onProgressChange: (progress: Progress) => void;
};

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function buildDeck() {
  return shuffle(
    memoryCards.flatMap((card) => [
      { ...card, instanceId: `${card.id}-a` },
      { ...card, instanceId: `${card.id}-b` }
    ])
  );
}

export function MemoryGame({ progress, onProgressChange }: MemoryGameProps) {
  const [deck, setDeck] = useState<MemoryCardInstance[]>(() => buildDeck());
  const [selected, setSelected] = useState<MemoryCardInstance[]>([]);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(() => new Set());
  const [turns, setTurns] = useState(0);
  const [locked, setLocked] = useState(false);
  const [completed, setCompleted] = useState(false);

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
    setDeck(buildDeck());
    setSelected([]);
    setMatchedIds(new Set());
    setTurns(0);
    setLocked(false);
    setCompleted(false);
  }

  function selectCard(card: MemoryCardInstance) {
    if (locked || completed || matchedIds.has(card.id) || selected.some((item) => item.instanceId === card.instanceId)) {
      return;
    }

    const nextSelected = [...selected, card];
    setSelected(nextSelected);

    if (nextSelected.length !== 2) {
      return;
    }

    const nextTurns = turns + 1;
    setTurns(nextTurns);

    const [first, second] = nextSelected;
    if (first.id === second.id) {
      const nextMatchedIds = new Set(matchedIds).add(first.id);
      setMatchedIds(nextMatchedIds);
      setSelected([]);
      celebrate(`You found a match: ${first.label}!`);

      if (nextMatchedIds.size === memoryCards.length) {
        setCompleted(true);
        onProgressChange(recordMemoryWin(progress, nextTurns));
        celebrate(`Amazing work! You finished the board in ${nextTurns} turns.`);
      }
      return;
    }

    speak("Try again. Look carefully for the matching card.", { rate: 0.88, pitch: 1.16 });
    setLocked(true);
    window.setTimeout(() => {
      setSelected([]);
      setLocked(false);
    }, 850);
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

      <div className="memory-status">
        <span>
          {turns} {turns === 1 ? "turn" : "turns"} taken
        </span>
        <span>
          {matchedIds.size} of {memoryCards.length} pairs matched
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
              <span className="memory-front">?</span>
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
