const { MediaError } = require("./mediaError");

// Where a picture is allowed to be attached. "cover" is the scenario's own
// image; the other three name a list to search by id.
const MEDIA_TARGETS = Object.freeze({
  cover: null,
  location: "locations",
  character: "characters",
  item: "items",
});

const TARGET_NAMES = Object.keys(MEDIA_TARGETS);

// Works out what is about to be written to, and fails loudly if it does not
// exist. The controller calls this *before* uploading, so a typo in an id costs
// nothing instead of a wasted upload to Cloudinary.
const resolveTarget = (scenario, { target, targetId } = {}) => {
  if (typeof target !== "string" || !TARGET_NAMES.includes(target)) {
    throw new MediaError(
      `Target must be one of: ${TARGET_NAMES.join(", ")}`,
      "INVALID_MEDIA_TARGET",
    );
  }

  if (target === "cover") {
    return { target, targetId: null, entry: null };
  }

  if (typeof targetId !== "string" || !targetId.trim()) {
    throw new MediaError(`A ${target} id is required`, "VALIDATION_ERROR");
  }

  const id = targetId.trim();
  const entry = (scenario[MEDIA_TARGETS[target]] || []).find(
    (candidate) => candidate.id === id,
  );

  if (!entry) {
    throw new MediaError(
      `No ${target} with id "${id}" in this scenario`,
      "MEDIA_TARGET_NOT_FOUND",
      404,
    );
  }

  return { target, targetId: id, entry };
};

// Pure: writes one url onto the scenario and returns where it went. Does no
// saving and knows nothing about Cloudinary, so it can be tested on a plain
// object with no account and no network.
const attachImageUrl = (scenario, { target, targetId, imageUrl }) => {
  if (typeof imageUrl !== "string" || !imageUrl.trim()) {
    throw new MediaError("An image URL is required", "VALIDATION_ERROR");
  }

  const url = imageUrl.trim();
  const resolved = resolveTarget(scenario, { target, targetId });

  if (resolved.target === "cover") {
    scenario.coverImageUrl = url;
  } else {
    resolved.entry.imageUrl = url;
  }

  return {
    target: resolved.target,
    targetId: resolved.targetId,
    imageUrl: url,
  };
};

module.exports = {
  MEDIA_TARGETS,
  TARGET_NAMES,
  attachImageUrl,
  resolveTarget,
};
