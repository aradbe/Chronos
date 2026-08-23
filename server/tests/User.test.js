const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const User = require("../models/User");

const validUser = (overrides = {}) => ({
  name: "Mara",
  email: "mara@example.com",
  passwordHash: "hashed-password",
  ...overrides,
});

describe("User avatar", () => {
  it("gives existing and new players a complete default character", async () => {
    const user = new User(validUser());

    await user.validate();

    assert.equal(user.avatar.body, "masculine");
    assert.equal(user.avatar.name, "Traveler");
    assert.equal(user.avatar.pronouns, "they_them");
    assert.equal(user.avatar.hair, "short");
    assert.equal(user.avatar.completed, false);
  });

  it("stores a valid customized character", async () => {
    const user = new User(
      validUser({
        avatar: {
          body: "feminine",
          name: "Mara Voss",
          pronouns: "she_her",
          skin: "deep",
          face: "bright",
          hair: "braids",
          hairColor: "auburn",
          outfit: "explorer",
          accessory: "earring",
          completed: true,
        },
      }),
    );

    await user.validate();
    assert.equal(user.avatar.hair, "braids");
    assert.equal(user.avatar.completed, true);
  });

  it("rejects invented character options", async () => {
    const user = new User(validUser({ avatar: { hair: "laser_beams" } }));

    await assert.rejects(user.validate(), /valid enum value/);
  });
});
