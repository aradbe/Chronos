const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const mongoose = require("mongoose");
const { playAsGuest } = require("../controllers/authController");
const User = require("../models/User");

const createResponse = () => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  return response;
};

const stubUser = (created) => ({
  _id: new mongoose.Types.ObjectId(),
  name: created.name,
  email: created.email,
  passwordHash: created.passwordHash,
  role: "player",
  isGuest: created.isGuest,
  avatar: {},
});

describe("playAsGuest", () => {
  it("creates a guest account and returns a token", async (test) => {
    process.env.JWT_SECRET = "test-secret";
    let created;

    test.mock.method(User, "create", async (document) => {
      created = document;
      return stubUser(document);
    });

    const response = createResponse();

    await playAsGuest({}, response);

    assert.equal(response.statusCode, 201);
    assert.equal(typeof response.body.token, "string");
    assert.ok(response.body.token.length > 0);
    assert.equal(response.body.user.name, "Guest");
    assert.equal(response.body.user.isGuest, true);
    assert.equal(response.body.user.role, "player");

    assert.equal(created.name, "Guest");
    assert.equal(created.isGuest, true);
    assert.match(created.email, /^guest_[0-9a-f]{12}@chronos\.guest$/);
  });

  it("never returns the password hash", async (test) => {
    process.env.JWT_SECRET = "test-secret";

    test.mock.method(User, "create", async (document) => stubUser(document));

    const response = createResponse();

    await playAsGuest({}, response);

    assert.equal(response.body.user.passwordHash, undefined);
  });

  // Two guests arriving at the same moment must not collide on the unique
  // email index, so the random part has to differ every time.
  it("gives each guest a different email", async (test) => {
    process.env.JWT_SECRET = "test-secret";
    const emails = [];

    test.mock.method(User, "create", async (document) => {
      emails.push(document.email);
      return stubUser(document);
    });

    await playAsGuest({}, createResponse());
    await playAsGuest({}, createResponse());

    assert.equal(emails.length, 2);
    assert.notEqual(emails[0], emails[1]);
  });

  // The password is thrown away on purpose: a guest account must be
  // impossible to log back into.
  it("gives each guest a different unusable password", async (test) => {
    process.env.JWT_SECRET = "test-secret";
    const hashes = [];

    test.mock.method(User, "create", async (document) => {
      hashes.push(document.passwordHash);
      return stubUser(document);
    });

    await playAsGuest({}, createResponse());
    await playAsGuest({}, createResponse());

    assert.notEqual(hashes[0], hashes[1]);
  });

  it("answers 500 when the account cannot be created", async (test) => {
    process.env.JWT_SECRET = "test-secret";

    test.mock.method(User, "create", async () => {
      throw new Error("database unavailable");
    });

    const response = createResponse();

    await playAsGuest({}, response);

    assert.equal(response.statusCode, 500);
    assert.equal(response.body.error.code, "SERVER_ERROR");
  });
});
