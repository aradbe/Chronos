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
      <h2 id="location-title">{location.name}</h2>
      <ImageFrame
        src={location.imageUrl}
        alt={location.name}
        ratio="21 / 9"
        className="current-location__image"
      />
      <p>{location.description}</p>
    </section>
  );
}
