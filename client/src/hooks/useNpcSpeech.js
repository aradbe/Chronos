import { useEffect, useState } from "react";

const VOICE_PROFILES = {
  livia: {
    pitch: 1.08,
    rate: 0.92,
    preferredNames: ["zira", "samantha", "ava", "susan", "hazel", "female"],
  },
  marcus: {
    pitch: 0.92,
    rate: 1,
    preferredNames: ["david", "daniel", "mark", "george", "male"],
  },
  quintus: {
    pitch: 1,
    rate: 0.9,
    preferredNames: ["mark", "david", "daniel", "male"],
  },
  lucius: {
    pitch: 0.82,
    rate: 1.04,
    preferredNames: ["george", "daniel", "david", "male"],
  },
};

const findVoice = (voices, profile) => {
  const englishVoices = voices.filter((voice) => voice.lang?.toLowerCase().startsWith("en"));
  const pool = englishVoices.length ? englishVoices : voices;

  return (
    pool.find((voice) =>
      profile.preferredNames.some((name) => voice.name.toLowerCase().includes(name)),
    ) || pool[0]
  );
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
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = profile.pitch;
    utterance.rate = profile.rate;
    utterance.voice = findVoice(voices, profile) || null;
    utterance.onend = () => setSpeakingId("");
    utterance.onerror = () => setSpeakingId("");
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  return { speak, speakingId, stop, supported };
}
