import "./LocationMap.css";

export function LocationMap({
  locations,
  currentLocationId,
  disabled = false,
  onMove,
}) {
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
            <button
              type="button"
              className={`location-map__node${isCurrent ? " location-map__node--current" : ""}`}
              disabled={disabled || !isReachable}
              key={location.id}
              onClick={() => onMove(location.id)}
            >
              <strong>{location.name}</strong>
              <span>{state}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
