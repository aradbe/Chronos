import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { PixelAvatar } from "../../components/avatar/PixelAvatar";
import {
  AVATAR_DEFAULTS,
  AVATAR_OPTIONS,
} from "../../components/avatar/avatarOptions";
import { useStores } from "../../stores/useStores";
import "./CharacterCreatorPage.css";

const GROUPS = [
  ["body", "Build"],
  ["pronouns", "Pronouns"],
  ["skin", "Skin tone"],
  ["hair", "Hair"],
  ["hairColor", "Hair color"],
  ["outfit", "Outfit"],
];

export const CharacterCreatorPage = observer(function CharacterCreatorPage() {
  const { authStore } = useStores();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(authStore.user?.name || "");
  const [avatar, setAvatar] = useState({
    ...AVATAR_DEFAULTS,
    name: authStore.user?.avatar?.name || authStore.user?.name || "Traveler",
    ...(authStore.user?.avatar || {}),
  });
  const [message, setMessage] = useState("");

  const choose = (group, id) => {
    setAvatar((current) => ({ ...current, [group]: id }));
    setMessage("");
  };

  const save = async () => {
    setMessage("");
    try {
      await authStore.saveAvatar({ ...avatar, displayName });
      setMessage("Traveler saved. The timeline is ready for you.");
    } catch {
      setMessage(authStore.error?.message || "Your character could not be saved.");
    }
  };

  return (
    <main className="character-creator">
      <header className="character-creator__intro">
        <h1>Create your character</h1>
      </header>

      <div className="character-creator__layout">
        <aside className="character-creator__preview">
          <div className="character-creator__portal" aria-hidden="true" />
          <PixelAvatar avatar={avatar} label={`${avatar.name || "Traveler"}'s character`} />
          <strong>{avatar.name || "Unknown traveler"}</strong>
          <small>{AVATAR_OPTIONS.pronouns.find(({ id }) => id === avatar.pronouns)?.label}</small>
        </aside>

        <section className="character-creator__controls" aria-label="Character options">
          <label className="character-creator__name">
            <span>Display name</span>
            <input
              maxLength={50}
              minLength={2}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Shown on your Chronos account"
              value={displayName}
            />
          </label>
          <label className="character-creator__name">
            <span>Traveler name</span>
            <input
              maxLength={30}
              onChange={(event) => setAvatar((current) => ({ ...current, name: event.target.value }))}
              placeholder="Name your traveler"
              value={avatar.name}
            />
          </label>
          {GROUPS.map(([group, title]) => (
            <div
              aria-label={title}
              className={`character-creator__group character-creator__group--${group}`}
              key={group}
              role="group"
            >
              <span className="character-creator__group-title">{title}</span>
              <div className="character-creator__choices">
                {AVATAR_OPTIONS[group].map((option) => (
                  <button
                    aria-pressed={avatar[group] === option.id}
                    className={avatar[group] === option.id ? "is-selected" : ""}
                    key={option.id}
                    onClick={() => choose(group, option.id)}
                    type="button"
                  >
                    {option.color ? (
                      <i style={{ background: option.color }} aria-hidden="true" />
                    ) : null}
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {message ? <p className="character-creator__message" role="status">{message}</p> : null}
          <div className="character-creator__actions">
            <button disabled={authStore.loading} onClick={save} type="button">
              {authStore.loading ? "Saving traveler..." : "Save character"}
            </button>
            <button onClick={() => navigate("/scenarios")} type="button">
              Enter the archive
            </button>
          </div>
        </section>
      </div>
    </main>
  );
});
