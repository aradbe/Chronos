const ROW_TOLERANCE = 12;
const NODE_SPACING = 116;
const ROW_SPACING = 138;
const EDGE_PADDING = 52;

const fallbackPosition = (index) => ({
  x: 20 + (index % 3) * 30,
  y: 15 + Math.floor(index / 3) * 30,
});

export const buildMapLayout = (locations = []) => {
  const positioned = locations
    .map((location, index) => ({
      location,
      position: location.mapPosition || fallbackPosition(index),
    }))
    .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);

  const rows = [];
  for (const entry of positioned) {
    const row = rows.find(
      (candidate) => Math.abs(candidate.averageY - entry.position.y) <= ROW_TOLERANCE,
    );
    if (row) {
      row.entries.push(entry);
      row.averageY =
        row.entries.reduce((sum, item) => sum + item.position.y, 0) /
        row.entries.length;
    } else {
      rows.push({ averageY: entry.position.y, entries: [entry] });
    }
  }

  rows.sort((a, b) => a.averageY - b.averageY);
  const widestRow = Math.max(1, ...rows.map(({ entries }) => entries.length));
  const width = Math.max(520, widestRow * NODE_SPACING + EDGE_PADDING * 2);
  const height = Math.max(440, rows.length * ROW_SPACING + EDGE_PADDING * 2);
  const positions = new Map();

  rows.forEach((row, rowIndex) => {
    row.entries.sort((a, b) => a.position.x - b.position.x);
    const gap = (width - EDGE_PADDING * 2) / (row.entries.length + 1);
    row.entries.forEach(({ location }, columnIndex) => {
      positions.set(location.id, {
        x: EDGE_PADDING + gap * (columnIndex + 1),
        y: EDGE_PADDING + ((height - EDGE_PADDING * 2) * (rowIndex + 1)) / (rows.length + 1),
      });
    });
  });

  return { width, height, positions };
};
