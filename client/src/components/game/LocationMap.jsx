import { useLayoutEffect, useRef, useState } from "react";
import { describeLocations, LOCATION_STATES } from "../../utils/mapState";
import { buildMapLayout } from "../../utils/mapLayout";
import "./LocationMap.css";
import { GAME_COSTS } from "../../constants/gameCosts";

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
  const [expanded, setExpanded] = useState(false);
  const [travelTarget, setTravelTarget] = useState(null);
  const viewportRef = useRef(null);
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
  const hasCityMap = inventory.some(({ itemId }) => itemId === "city_map");
  const nearbyIds = new Set(
    locations
      .find(({ id }) => id === currentLocationId)
      ?.connectedLocationIds || [],
  );
  const visibleIds = new Set(
    hasCityMap
      ? locations.map(({ id }) => id)
      : rows
          .filter(
            ({ location, isDiscovered }) =>
              isDiscovered ||
              location.id === currentLocationId ||
              nearbyIds.has(location.id),
          )
          .map(({ location }) => location.id),
  );
  const rowsById = new Map(rows.map((row) => [row.location.id, row]));
  const layout = buildMapLayout(locations, { scale: expanded ? 1.22 : 1 });
  const routes = locations.flatMap((location) =>
    location.connectedLocationIds
      .filter((connectedId) => location.id < connectedId)
      .map((connectedId) => ({
        from: location,
        to: locations.find(({ id }) => id === connectedId),
      })),
  );

  const getPosition = (location) => layout.positions.get(location.id);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const currentPosition = layout.positions.get(currentLocationId);
    if (!viewport || !currentPosition) return;

    viewport.scrollTo({
      left: Math.max(0, currentPosition.x - viewport.clientWidth / 2),
      top: Math.max(0, currentPosition.y - viewport.clientHeight / 2),
      behavior: "instant",
    });
  }, [currentLocationId, expanded, layout.height, layout.positions, layout.width]);

  const getRouteState = ({ from, to }) => {
    const destination =
      from.id === currentLocationId
        ? rowsById.get(to.id)
        : to.id === currentLocationId
          ? rowsById.get(from.id)
          : null;

    return destination?.state || "known";
  };

  return (
    <section
      className={`location-map ${expanded ? "location-map--expanded" : ""}`}
      aria-labelledby="map-title"
    >
      <div className="location-map__header">
        <h2 id="map-title">Location map</h2>
        <button
          className="location-map__expand"
          type="button"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Close map" : "Expand map"}
        </button>
      </div>

      <p className="location-map__here">
        <span className="location-map__here-label">You are at</span>
        <strong>{here ? here.location.name : "Unknown"}</strong>
        <span className="location-map__explored">
          {exploredCount} of {rows.length} explored
        </span>
      </p>

      <div
        className={`location-map__map-status ${hasCityMap ? "location-map__map-status--owned" : ""}`}
      >
        <span aria-hidden="true">{hasCityMap ? "⌖" : "?"}</span>
        <div>
          <strong>{hasCityMap ? "City map acquired" : "Mapping from memory"}</strong>
          <small>
            {hasCityMap
              ? "The full road network is visible."
              : "Only explored and nearby places are visible."}
          </small>
        </div>
      </div>

      {error ? (
        <p className="location-map__error" role="alert">
          {error}
        </p>
      ) : null}

      {travelTarget ? (
        <div className="location-map__travel" role="dialog" aria-label={`Travel to ${travelTarget.name}`}>
          <div>
            <span>Choose your pace</span>
            <strong>{travelTarget.name}</strong>
          </div>
          <button type="button" disabled={disabled} onClick={() => { onMove(travelTarget.id, "steady"); setTravelTarget(null); }}>
            <strong>Take the road</strong>
            <small>{GAME_COSTS.move} min · no health cost</small>
          </button>
          <button className="location-map__travel-risk" type="button" disabled={disabled} onClick={() => { onMove(travelTarget.id, "rush"); setTravelTarget(null); }}>
            <strong>Risk a shortcut</strong>
            <small>{GAME_COSTS.rushMove} min · −6 health</small>
          </button>
          <button className="location-map__travel-cancel" type="button" onClick={() => setTravelTarget(null)}>Cancel</button>
        </div>
      ) : null}

      <div className="location-map__viewport" ref={viewportRef}>
      <div
        className="location-map__diagram"
        style={{ width: `${layout.width}px`, height: `${layout.height}px` }}
      >
        <svg
          className="location-map__routes"
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {routes
            .filter(
              ({ from, to }) =>
                to && visibleIds.has(from.id) && visibleIds.has(to.id),
            )
            .map((route) => {
              const from = getPosition(route.from);
              const to = getPosition(route.to);
              const state = getRouteState(route);

              return (
                <line
                  className={`location-map__route location-map__route--${state}`}
                  key={`${route.from.id}-${route.to.id}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                />
              );
            })}
        </svg>

        {rows.map(({ location, state, label, isDiscovered, canMove, blockedAttemptPenaltyMinutes }) => {
          if (!visibleIds.has(location.id)) {
            return null;
          }

          const position = getPosition(location);

          return (
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
            onClick={() => setTravelTarget(location)}
            style={{ "--map-x": `${position.x}px`, "--map-y": `${position.y}px` }}
          >
            <span className="location-map__node-marker" aria-hidden="true" />
            <strong>{location.name}</strong>
            <span>
              {isDiscovered ? label : `Unexplored · ${label}`}
              {state === LOCATION_STATES.GATED
                ? blockedAttemptPenaltyMinutes
                  ? ` · attempt costs ${blockedAttemptPenaltyMinutes} min`
                  : ""
                : canMove
                  ? ` · ${GAME_COSTS.move} min`
                  : ""}
            </span>
            {location.id === objectiveLocationId ? (
              <em>Current objective</em>
            ) : null}
          </button>
          );
        })}

        {!hasCityMap ? (
          <div className="location-map__fog" aria-hidden="true">
            <span>Unknown roads</span>
          </div>
        ) : null}
      </div>
      </div>

      <div className="location-map__legend" aria-label="Map legend">
        <span><i className="location-map__key location-map__key--current" />Here</span>
        <span><i className="location-map__key location-map__key--reachable" />Reachable</span>
        <span><i className="location-map__key location-map__key--locked" />Locked</span>
      </div>
    </section>
  );
}
