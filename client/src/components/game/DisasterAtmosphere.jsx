import "./DisasterAtmosphere.css";

export function DisasterAtmosphere({ stage }) {
  return (
    <div className={`disaster-atmosphere disaster-atmosphere--${stage.id}`} aria-hidden="true">
      <div className="disaster-atmosphere__particles">
        {Array.from({ length: 18 }, (_, index) => <i key={index} />)}
      </div>
      <span>{stage.label}</span>
    </div>
  );
}
