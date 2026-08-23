import { describeLocations, LOCATION_STATES } from "../../utils/mapState";
import "./LocationMap.css";

export function LocationMap({
  locations,
  events = [],
  currentLocationId,
  triggeredEventIds = [],
  discoveredLocationIds = [],
  inventory = [],
  locationGates = [],
  objectives = [],
  objectiveLocationId = null,
  disabled = false,
  onMove,
  error = "",
}) {
  const rows = describeLocations({
    locations,
    events,
    currentLocationId,
    triggeredEventIds,
    discoveredLocationIds,
    inventory,
    locationGates,
    objectives,
  });

  const here = rows.find((row) => row.state === LOCATION_STATES.CURRENT);
  const exploredCount = rows.filter((row) => row.isDiscovered).length;

  return (
    <section className="location-map" aria-labelledby="map-title">
      <h2 id="map-title">Location map</h2>

      <p className="location-map__here">
        <span className="location-map__here-label">You are at</span>
        <strong>{here ? here.location.name : "Unknown"}</strong>
        <span className="location-map__explored">
          {exploredCount} of {rows.length} explored
        </span>
      </p>

      {error ? (
        <p className="location-map__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="location-map__list">
        {rows.map(({ location, state, label, isDiscovered, canMove }) => (
          <button
            type="button"
            className={[
              "location-map__node",
              `location-map__node--${state}`,
              isDiscovered ? "" : "location-map__node--unexplored",
              location.id === objectiveLocationId
                ? "location-map__node--objective"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            disabled={disabled || !canMove}
            key={location.id}
            onClick={() => onMove(location.id)}
          >
            <strong>{location.name}</strong>
            <span>{isDiscovered ? label : `Unexplored · ${label}`}</span>
            {location.id === objectiveLocationId ? (
              <em>Current objective</em>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}
