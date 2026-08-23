const STAGES = [
  { id: "calm", label: "Uneasy calm" },
  { id: "ashfall", label: "Ashfall" },
  { id: "storm", label: "Pumice storm" },
  { id: "critical", label: "City collapse" },
];

export const getDisasterStage = (currentTime, timeLimit) => {
  const progress = timeLimit ? currentTime / timeLimit : 0;
  if (progress >= 0.78) return STAGES[3];
  if (progress >= 0.52) return STAGES[2];
  if (progress >= 0.28) return STAGES[1];
  return STAGES[0];
};
