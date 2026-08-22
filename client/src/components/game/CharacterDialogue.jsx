import { useMemo, useState } from "react";
import "./CharacterDialogue.css";

const getIntentLabel = (intent) => {
  if (!intent?.action) {
    return "";
  }

  if (intent.type === "MOVE") {
    return `Suggested action: move to ${intent.action.payload.locationId}`;
  }

  if (intent.type === "PICK_UP_ITEM") {
    return `Suggested action: pick up ${intent.action.payload.itemId}`;
  }

  if (intent.type === "USE_ITEM") {
    return `Suggested action: use ${intent.action.payload.itemId}`;
  }

  return "";
};

export function CharacterDialogue({
  characters,
  currentLocationId,
  disabled = false,
  error,
  interaction,
  onSend,
  pending = false,
}) {
  const availableCharacters = useMemo(
    () =>
      characters.filter(
        (character) => character.startingLocationId === currentLocationId,
      ),
    [characters, currentLocationId],
  );
  const [preferredCharacterId, setPreferredCharacterId] = useState("");
  const [message, setMessage] = useState("");

  const selectedCharacter = availableCharacters.find(
    (character) => character.id === preferredCharacterId,
  ) || availableCharacters[0];
  const characterId = selectedCharacter?.id || "";
  const intentLabel = getIntentLabel(interaction?.intent);
  const isSubmitDisabled =
    disabled || pending || !selectedCharacter || !message.trim();

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isSubmitDisabled) {
      return;
    }

    const nextMessage = message.trim();
    setMessage("");
    onSend(characterId, nextMessage);
  };

  return (
    <section className="character-dialogue" aria-labelledby="dialogue-title">
      <div className="character-dialogue__header">
        <div>
          <span className="character-dialogue__eyebrow">Dialogue</span>
          <h2 id="dialogue-title">Talk to someone here</h2>
        </div>
        {interaction ? (
          <span className="character-dialogue__trust">
            Trust {interaction.trust}
            {interaction.trustChange ? ` (${interaction.trustChange > 0 ? "+" : ""}${interaction.trustChange})` : ""}
          </span>
        ) : null}
      </div>

      {availableCharacters.length === 0 ? (
        <p className="character-dialogue__empty">
          There is no one nearby to speak with.
        </p>
      ) : (
        <form className="character-dialogue__form" onSubmit={handleSubmit}>
          <label>
            <span>Character</span>
            <select
              value={characterId}
              onChange={(event) => setPreferredCharacterId(event.target.value)}
              disabled={disabled || pending}
            >
              {availableCharacters.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.name} - {character.role}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Message</span>
            <textarea
              rows="3"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={disabled || pending}
              placeholder={`Ask ${selectedCharacter?.name || "them"} what they know`}
            />
          </label>

          <button type="submit" disabled={isSubmitDisabled}>
            {pending ? "Listening..." : "Send"}
          </button>
        </form>
      )}

      {error ? (
        <p className="character-dialogue__error" role="alert">
          {error.message}
        </p>
      ) : null}

      {interaction ? (
        <div className="character-dialogue__result" aria-live="polite">
          <p>{interaction.reply}</p>
          {interaction.newClues?.length ? (
            <span>{interaction.newClues.length} clue discovered</span>
          ) : null}
          {interaction.completedObjectives?.length ? (
            <span>{interaction.completedObjectives.length} objective updated</span>
          ) : null}
          {intentLabel ? <span>{intentLabel}</span> : null}
        </div>
      ) : null}
    </section>
  );
}
