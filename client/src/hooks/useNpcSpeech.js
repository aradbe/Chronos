import { useEffect, useState } from "react";
import { getSpokenDialogue } from "../utils/dialogueText";

const MALE_VOICE_NAMES = [
  "david",
  "guy",
  "christopher",
  "eric",
  "roger",
  "stefan",
  "ryan",
  "thomas",
  "james",
  "daniel",
  "george",
  "mark",
  "alex",
  "fred",
  "male",
];

const VOICE_PROFILES = {
  livia: {
    pitch: 1.08,
    rate: 0.92,
    preferredNames: ["zira", "samantha", "ava", "susan", "hazel", "female"],
  },
  marcus: {
    pitch: 0.76,
    rate: 0.96,
    preferredNames: ["david", "guy", "christopher", "daniel", "mark"],
  },
  quintus: {
    pitch: 0.82,
    rate: 0.88,
    preferredNames: ["mark", "roger", "ryan", "david", "eric"],
  },
  lucius: {
    pitch: 0.68,
    rate: 0.94,
    preferredNames: ["guy", "george", "stefan", "daniel", "david"],
  },
};

const findVoice = (voices, profile, characterId) => {
  const englishVoices = voices.filter((voice) => voice.lang?.toLowerCase().startsWith("en"));
  const pool = englishVoices.length ? englishVoices : voices;

  const preferred = pool.find((voice) =>
      profile.preferredNames.some((name) => voice.name.toLowerCase().includes(name)),
    );

  if (preferred) return preferred;

  if (characterId !== "livia") {
    return (
      pool.find((voice) =>
        MALE_VOICE_NAMES.some((name) => voice.name.toLowerCase().includes(name)),
      ) || pool[0]
    );
  }

  return pool[0];
};

export function useNpcSpeech() {
  const supported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;
  const [voices, setVoices] = useState([]);
  const [speakingId, setSpeakingId] = useState("");

  useEffect(() => {
    if (!supported) return undefined;

    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const stop = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeakingId("");
  };

  const speak = ({ characterId, id, text }) => {
    if (!supported || !text) return;

    if (speakingId === id) {
      stop();
      return;
    }

    window.speechSynthesis.cancel();
    const profile = VOICE_PROFILES[characterId] || VOICE_PROFILES.marcus;
    const spokenText = getSpokenDialogue(text);
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.pitch = profile.pitch;
    utterance.rate = profile.rate;
    utterance.voice = findVoice(voices, profile, characterId) || null;
    utterance.onend = () => setSpeakingId("");
    utterance.onerror = () => setSpeakingId("");
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  return { speak, speakingId, stop, supported };
}
