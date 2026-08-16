import "./LocationMap.css";

export function LocationMap({ locations, currentLocationId }) {
  const currentLocation = locations.find(
    (location) => location.id === currentLocationId,
  );
  const reachableIds = currentLocation?.connectedLocationIds ?? [];

  return (
    <section className="location-map" aria-labelledby="map-title">
      <h2 id="map-title">Location map</h2>
      <div className="location-map__list">
        {locations.map((location) => {
          const isCurrent = location.id === currentLocationId;
          const isReachable = reachableIds.includes(location.id);
          const state = isCurrent
            ? "Current location"
            : isReachable
              ? "Reachable"
              : "Not reachable";

          return (
            <div
              className={`location-map__node${isCurrent ? " location-map__node--current" : ""}`}
              key={location.id}
            >
              <strong>{location.name}</strong>
              <span>{state}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
