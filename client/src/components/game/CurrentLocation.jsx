import { ImageFrame } from "../media/ImageFrame";
import "./CurrentLocation.css";

export function CurrentLocation({ location }) {
  if (!location) {
    return (
      <section className="current-location current-location--missing">
        <h2>Unknown location</h2>
        <p>The current location could not be loaded.</p>
      </section>
    );
  }

  return (
    <section className="current-location" aria-labelledby="location-title">
      <span className="current-location__eyebrow">Current location</span>
      <div className="current-location__title">
        <span aria-hidden="true">{location.symbol || "◈"}</span>
        <h2 id="location-title">{location.name}</h2>
      </div>
      {location.imageUrl ? (
        <ImageFrame
          src={location.imageUrl}
          alt={location.name}
          ratio="21 / 9"
          className="current-location__image"
        />
      ) : (
        <div className="current-location__vista" aria-hidden="true">
          <span>{location.symbol || "◈"}</span>
          <i />
        </div>
      )}
      <p>{location.description}</p>
      {location.visualCue ? (
        <p className="current-location__cue">
          <span>Look closer</span>
          {location.visualCue}
        </p>
      ) : null}
    </section>
  );
}
