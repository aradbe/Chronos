export const getSpokenDialogue = (text = "") => {
  const quotes = [...text.matchAll(/[“"]([^”"]+)[”"]/g)]
    .map((match) => match[1].trim())
    .filter(Boolean);

  return quotes.length ? quotes.join(" ") : text.trim();
};
