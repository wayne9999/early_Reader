import { memoryCards } from "../data/content.js";
import { recordMemoryWin } from "../services/progressStore.js";
import { celebrate, speak } from "./speech.js";

function shuffle(items) {
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

export function renderMemoryGame(root, progress, onProgressChange) {
  const template = document.querySelector("#memory-template");
  root.replaceChildren(template.content.cloneNode(true));

  const board = root.querySelector("[data-memory-board]");
  const turnsLabel = root.querySelector("[data-memory-turns]");
  const matchesLabel = root.querySelector("[data-memory-matches]");
  const message = root.querySelector("[data-memory-message]");
  const resetButton = root.querySelector("[data-reset-memory]");
  let currentProgress = progress;

  const state = {
    deck: buildDeck(),
    selected: [],
    matchedIds: new Set(),
    turns: 0,
    locked: false,
    completed: false
  };

  function updateStatus() {
    turnsLabel.textContent = `${state.turns} ${state.turns === 1 ? "turn" : "turns"} taken`;
    matchesLabel.textContent = `${state.matchedIds.size} of ${memoryCards.length} pairs matched`;

    if (state.completed) {
      message.textContent = `Board complete in ${state.turns} ${state.turns === 1 ? "turn" : "turns"}.`;
      return;
    }

    if (state.selected.length === 1) {
      message.textContent = "One card is open. Pick one more card to finish the turn.";
      return;
    }

    message.textContent = "Find matching pairs. One turn is two card picks.";
  }

  function renderBoard() {
    board.replaceChildren(
      ...state.deck.map((card) => {
        const isSelected = state.selected.some((item) => item.instanceId === card.instanceId);
        const isMatched = state.matchedIds.has(card.id);
        const button = document.createElement("button");
        button.className = [
          "memory-card",
          isSelected ? "is-selected" : "",
          isMatched ? "is-matched is-visible" : "",
          isSelected ? "is-visible" : ""
        ]
          .filter(Boolean)
          .join(" ");
        button.type = "button";
        button.disabled = isMatched || state.completed;
        button.dataset.cardId = card.id;
        button.setAttribute(
          "aria-label",
          isSelected || isMatched ? card.label : "Hidden memory card"
        );
        button.innerHTML = `
          <span class="memory-front">?</span>
          <span class="memory-back">
            <strong>${card.label}</strong>
            <small>${card.category}</small>
          </span>
        `;
        button.addEventListener("click", () => selectCard(card));
        return button;
      })
    );
    updateStatus();
  }

  function selectCard(card) {
    if (state.locked || state.completed || state.matchedIds.has(card.id)) {
      return;
    }

    if (state.selected.some((item) => item.instanceId === card.instanceId)) {
      return;
    }

    state.selected.push(card);

    if (state.selected.length === 2) {
      state.turns += 1;
      const [first, second] = state.selected;

      if (first.id === second.id) {
        state.matchedIds.add(first.id);
        state.selected = [];
        celebrate(`You found a match: ${first.label}!`);

        if (state.matchedIds.size === memoryCards.length) {
          state.completed = true;
          currentProgress = recordMemoryWin(currentProgress, state.turns);
          onProgressChange(currentProgress, { render: false });
          celebrate(`Amazing work! You finished the board in ${state.turns} turns.`);
        }
      } else {
        speak("Try again. Look carefully for the matching card.", { rate: 0.88, pitch: 1.16 });
        state.locked = true;
        setTimeout(() => {
          state.selected = [];
          state.locked = false;
          renderBoard();
        }, 850);
      }
    }

    renderBoard();
  }

  resetButton.addEventListener("click", () => {
    state.deck = buildDeck();
    state.selected = [];
    state.matchedIds = new Set();
    state.turns = 0;
    state.locked = false;
    state.completed = false;
    renderBoard();
  });

  renderBoard();
}
