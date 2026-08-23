import { useMemo, useState } from "react";
import "./CharacterDialogue.css";
import { GAME_COSTS } from "../../constants/gameCosts";
import { useNpcSpeech } from "../../hooks/useNpcSpeech";

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

const getSuggestedQuestions = (character) => {
  const questionsByCharacter = {
    livia: [
      "What do the tremors mean?",
      "How much time does the city have?",
      "What should I look for before I leave?",
    ],
    lucius: [
      "What do you need before we can sail?",
      "How much time do we have?",
      "Will you take me out of Pompeii?",
    ],
    marcus: [
      "What do you know about the mountain?",
      "How can I reach the harbor?",
      "Do you have anything that can help me find the road?",
    ],
    quintus: [
      "Have you noticed anything strange?",
      "Can you spare food or water?",
      "Do you know a safe way out?",
    ],
  };

  return questionsByCharacter[character?.id] || [
    "What is happening here?",
    "How can you help me?",
    "Where should I go next?",
  ];
};

export function CharacterDialogue({
  characters,
  currentLocationId,
  disabled = false,
  error,
  interaction,
  messages = [],
  messagesError = null,
  messagesLoading = false,
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
  const speech = useNpcSpeech();

  const selectedCharacter = availableCharacters.find(
    (character) => character.id === preferredCharacterId,
  ) || availableCharacters[0];
  const characterId = selectedCharacter?.id || "";
  const intentLabel = getIntentLabel(interaction?.intent);
  const suggestedQuestions = getSuggestedQuestions(selectedCharacter);
  const shouldShowInteraction = Boolean(interaction && selectedCharacter);
  const characterMessages = useMemo(
    () =>
      characterId
        ? messages.filter((message) => message.characterId === characterId)
        : [],
    [characterId, messages],
  );
  const hasCharacterMessages = characterMessages.length > 0;
  const shouldShowReplyInResult = shouldShowInteraction && !hasCharacterMessages;
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
        {shouldShowInteraction ? (
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
        <>
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

            <div className="character-dialogue__suggestions">
              <span>Ask about</span>
              <div>
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => setMessage(question)}
                    disabled={disabled || pending}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={isSubmitDisabled}>
              {pending
                ? "Listening..."
                : `Send · ${GAME_COSTS.dialogue} min`}
            </button>
            <small className="character-dialogue__time-note">
              Speak freely. Every exchange advances the clock by {GAME_COSTS.dialogue} minutes.
            </small>
          </form>

          <div className="character-dialogue__history" aria-live="polite">
            <div className="character-dialogue__history-header">
              <span>Conversation history</span>
              {messagesLoading ? <small>Loading...</small> : null}
            </div>

            {messagesError ? (
              <p className="character-dialogue__error" role="alert">
                {messagesError.message}
              </p>
            ) : null}

            {hasCharacterMessages ? (
              <ol className="character-dialogue__messages">
                {characterMessages.map((entry, index) => (
                  <li
                    className={`character-dialogue__message character-dialogue__message--${entry.role}`}
                    key={entry._id || `${entry.characterId}-${entry.role}-${index}`}
                  >
                    <div className="character-dialogue__message-head">
                      <span>
                        {entry.role === "player" ? "You" : selectedCharacter.name}
                      </span>
                      {entry.role === "character" && speech.supported ? (
                        <button
                          type="button"
                          className="character-dialogue__speak"
                          onClick={() =>
                            speech.speak({
                              characterId,
                              id: entry._id || `${characterId}-${index}`,
                              text: entry.content,
                            })
                          }
                          aria-label={`${speech.speakingId === (entry._id || `${characterId}-${index}`) ? "Stop" : "Read"} ${selectedCharacter.name}'s reply aloud`}
                        >
                          {speech.speakingId ===
                          (entry._id || `${characterId}-${index}`)
                            ? "■ Stop"
                            : "▶ Listen"}
                        </button>
                      ) : null}
                    </div>
                    <p>{entry.content}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="character-dialogue__empty">
                No messages with {selectedCharacter.name} yet.
              </p>
            )}
          </div>
        </>
      )}

      {error ? (
        <p className="character-dialogue__error" role="alert">
          {error.message}
        </p>
      ) : null}

      {shouldShowInteraction ? (
        <div className="character-dialogue__result" aria-live="polite">
          {shouldShowReplyInResult ? <p>{interaction.reply}</p> : null}
          {interaction.newClues?.length ? (
            <span>{interaction.newClues.length} clue discovered</span>
          ) : null}
          {interaction.completedObjectives?.length ? (
            <span>{interaction.completedObjectives.length} objective updated</span>
          ) : null}
          {intentLabel ? <span>{intentLabel}</span> : null}
          {interaction.guideEvents?.length ? (
            <div className="character-dialogue__guide">
              {interaction.guideEvents.map((event, index) => (
                <article
                  className={`character-dialogue__guide-event character-dialogue__guide-event--${event.type}`}
                  key={`${event.type}-${index}`}
                >
                  <small>Chronos Guide</small>
                  <strong>
                    {event.title}
                    {event.change
                      ? ` (${event.change > 0 ? "+" : ""}${event.change})`
                      : ""}
                  </strong>
                  <p>{event.message}</p>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
