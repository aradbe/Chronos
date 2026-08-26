export function formatYear(year) {
  const numericYear = Number(year);

  if (!Number.isFinite(numericYear)) {
    return "Unknown year";
  }

  if (numericYear < 0) {
    return `${Math.abs(numericYear)} BC`;
  }

  return `${numericYear} AD`;
}
