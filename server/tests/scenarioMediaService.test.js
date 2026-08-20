const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const { MediaError } = require("../services/mediaError");
const {
  attachImageUrl,
  resolveTarget,
} = require("../services/scenarioMediaService");

const createScenario = () => ({
  coverImageUrl: "",
  locations: [
    { id: "forum", name: "The Forum", imageUrl: "" },
    { id: "market", name: "The Market", imageUrl: "" },
  ],
  characters: [{ id: "marcus", name: "Marcus", imageUrl: "" }],
  items: [{ id: "bread", name: "Loaf of Bread", imageUrl: "" }],
});

const URL = "https://res.cloudinary.com/demo/image/upload/forum.jpg";

describe("scenario media service", () => {
  it("attaches a cover image to the scenario", () => {
    const scenario = createScenario();

    const result = attachImageUrl(scenario, {
      target: "cover",
      imageUrl: URL,
    });

    assert.equal(scenario.coverImageUrl, URL);
    assert.deepEqual(result, { target: "cover", targetId: null, imageUrl: URL });
  });

  it("attaches an image to one location and leaves the others alone", () => {
    const scenario = createScenario();

    attachImageUrl(scenario, {
      target: "location",
      targetId: "forum",
      imageUrl: URL,
    });

    assert.equal(scenario.locations[0].imageUrl, URL);
    assert.equal(scenario.locations[1].imageUrl, "");
    assert.equal(scenario.coverImageUrl, "");
  });

  it("attaches images to characters and items", () => {
    const scenario = createScenario();

    attachImageUrl(scenario, {
      target: "character",
      targetId: "marcus",
      imageUrl: URL,
    });
    attachImageUrl(scenario, {
      target: "item",
      targetId: "bread",
      imageUrl: URL,
    });

    assert.equal(scenario.characters[0].imageUrl, URL);
    assert.equal(scenario.items[0].imageUrl, URL);
  });

  it("trims whitespace off the url", () => {
    const scenario = createScenario();

    attachImageUrl(scenario, {
      target: "cover",
      imageUrl: `  ${URL}  `,
    });

    assert.equal(scenario.coverImageUrl, URL);
  });

  it("replaces an image that was already there", () => {
    const scenario = createScenario();
    scenario.locations[0].imageUrl = "https://example.com/old.jpg";

    attachImageUrl(scenario, {
      target: "location",
      targetId: "forum",
      imageUrl: URL,
    });

    assert.equal(scenario.locations[0].imageUrl, URL);
  });

  it("rejects an unknown target", () => {
    const scenario = createScenario();

    assert.throws(
      () => attachImageUrl(scenario, { target: "objective", imageUrl: URL }),
      (error) =>
        error instanceof MediaError && error.code === "INVALID_MEDIA_TARGET",
    );
  });

  it("rejects a missing url", () => {
    const scenario = createScenario();

    assert.throws(
      () => attachImageUrl(scenario, { target: "cover", imageUrl: "   " }),
      (error) => error instanceof MediaError && error.code === "VALIDATION_ERROR",
    );
  });

  it("rejects a missing id when the target needs one", () => {
    const scenario = createScenario();

    assert.throws(
      () => attachImageUrl(scenario, { target: "location", imageUrl: URL }),
      (error) => error instanceof MediaError && error.code === "VALIDATION_ERROR",
    );
  });

  it("rejects an id that is not in the scenario", () => {
    const scenario = createScenario();

    assert.throws(
      () =>
        attachImageUrl(scenario, {
          target: "location",
          targetId: "atlantis",
          imageUrl: URL,
        }),
      (error) =>
        error instanceof MediaError && error.code === "MEDIA_TARGET_NOT_FOUND",
    );
  });

  it("does not write anything when the target is invalid", () => {
    const scenario = createScenario();

    assert.throws(() =>
      attachImageUrl(scenario, {
        target: "location",
        targetId: "atlantis",
        imageUrl: URL,
      }),
    );

    assert.equal(scenario.coverImageUrl, "");
    assert.equal(scenario.locations[0].imageUrl, "");
  });

  it("resolves a target without changing anything", () => {
    const scenario = createScenario();

    const resolved = resolveTarget(scenario, {
      target: "item",
      targetId: "bread",
    });

    assert.equal(resolved.target, "item");
    assert.equal(resolved.targetId, "bread");
    assert.equal(resolved.entry.name, "Loaf of Bread");
    assert.equal(scenario.items[0].imageUrl, "");
  });
});
