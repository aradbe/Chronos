# Recap — Assignment #7: Scenario media

**Branch:** `feature/scenario-media`
**Trello cards:** Person B, Sprint 2 — *Cloudinary setup*, *Scenario media upload*
**Date:** 2026-08-20

Every assignment so far moved data the project already owned. This one is the first to
send something out of the building and trust an outside company to hold it.

---

## Part 0 — What we built

An admin can now upload a picture and attach it to four kinds of thing: the scenario's
cover, one location, one character, one item. The picture goes to Cloudinary. Only the
resulting web address is kept in MongoDB. Four screens show the picture when there is
one, and look exactly as they did before when there is not.

---

## Part 1 — The question that decides everything

Someone picks a photograph of the Forum on their laptop and uploads it. That file is now
a few hundred kilobytes sitting in the server's memory. It has to live somewhere
permanent. There are three answers, and choosing between them is the whole assignment.

**Put it in MongoDB.** You can turn a picture into a very long string of text — this is
called *base64*, a way of writing raw bytes using only ordinary letters and numbers — and
store that string on the document.

It works, and it is a bad idea. A database is built for small structured values: a title,
a number, an id. Pictures are large and *binary*, meaning raw bytes rather than text.
Worse, remember what `GET /api/scenarios` does — it loads scenarios and sends them to the
browser. Every scenario-list request would start dragging megabytes of image data behind
it, including for the visitor who only wanted to read the titles.

**Put it on the server's own disk.** Write it to `server/uploads/forum.png` and serve it
from there. This is the classic answer and it breaks in three ways:

- *The folder disappears.* Hosts like Render or Railway rebuild the app from Git on every
  deploy. Anything written to disk after that deploy is wiped. The name for this is an
  **ephemeral filesystem** — "ephemeral" meaning short-lived. The images vanish.
- *It assumes one server.* If the host runs two copies of the app, a file uploaded to
  copy A does not exist on copy B.
- *Express gains a second job.* The server would have to read bytes off disk and push
  them out on every page load — slow work with nothing to do with game logic.

**Hand it to a service built for this.** That is Cloudinary, and that is what the board
asked for. The server never stores the picture at all. It passes the bytes straight
through and keeps one short string.

---

## Part 2 — What comes back

Cloudinary's whole product, in one sentence: you give them bytes, they give you a URL.

```
https://res.cloudinary.com/xh1ekjt2/image/upload/v1787232930/chronos/scenarios/<id>-cover.png
```

Three things come with that address, and none of them cost extra work:

- **A CDN** — Content Delivery Network. Copies of the image sit on machines in many
  countries and each visitor is served from the nearest one.
- **Resizing through the address.** Inserting `w_400` into the path returns a
  400-pixel-wide version. One upload covers the small card thumbnail and the large
  detail header.
- **HTTPS.** `mediaService.js` sets `secure: true` and returns `result.secure_url`, not
  `result.url`. Browsers block insecure images on a secure page, so this matters.

What is stored in Mongo is only ever a string. The schema says so plainly:
`imageUrl: { type: String, default: "" }`. The picture never touches the database.

---

## Part 3 — The journey of one upload

Four new files, in order:

```
1. middleware/uploadImage.js       multer receives the file, holds it in memory
2. controllers/mediaController.js  validates, then orchestrates
3. services/mediaService.js        streams the bytes to Cloudinary, returns secure_url
4. services/scenarioMediaService.js writes that string onto the right place
                                    → scenario.save()
```

This is the same layering as every other feature in the project: the route knows nothing,
the controller handles `req`/`res` and nothing else, and the two services hold the
thinking. `scenarioMediaService.js` in particular knows nothing about Cloudinary at all —
which is exactly why its tests need no account and no network.

---

## Part 4 — The file never touches the disk

```js
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
  fileFilter: ...
});
```

**multer** is the library that understands file uploads. A normal form sends JSON;
a file upload sends a different format called *multipart*, and `express.json()` cannot
read it. multer parses that format and hands the result to the controller as `req.file`.

`memoryStorage()` means the file is held in RAM as a **Buffer** — Node's object for raw
bytes — and never written to the file system. It only needs to survive long enough to be
sent onward. Nothing to clean up, nothing left behind after a crash.

Two limits are enforced before any of our own code runs: 5 MB, and only `image/jpeg`,
`image/png`, `image/webp`, `image/gif`.

Then `mediaService.js` wraps Cloudinary's `upload_stream`. A **stream** sends data in
pieces rather than all at once. Cloudinary reports its result through a *callback* — a
function handed over to be called later — rather than a promise, so it is wrapped once:

```js
return new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
    if (error) { reject(error); return; }
    resolve(result.secure_url);
  });
  stream.end(buffer);
});
```

Wrapped once here, every caller gets to write `await`. That single wrapper is why the
controller line reads as cleanly as it does.

---

## Part 5 — Check before you spend

The controller resolves the target **before** uploading:

```js
const { target, targetId } = resolveTarget(scenario, {
  target: req.body.target,
  targetId: req.body.targetId,
});
```

Order matters here. A typo in a location id now costs nothing. Upload first and it would
cost a full round trip to Cloudinary plus an orphaned file sitting in the account
forever, attached to nothing.

The general shape: **validate everything you can locally before doing anything expensive
or irreversible.** Both halves of that sentence apply — the network call is slow *and* it
leaves a permanent trace.

`resolveTarget` also carries the map of what may hold a picture:

```js
const MEDIA_TARGETS = Object.freeze({
  cover: null, location: "locations", character: "characters", item: "items",
});
```

`cover` is the scenario's own field; the other three name a list to search by id. Adding
"a picture per objective" later means one line here, not a new branch in the controller.

---

## Part 6 — The server still boots without an account

```js
if (!mediaService.isConfigured()) {
  return res.status(503).json({ error: { ..., code: "CLOUDINARY_NOT_CONFIGURED" } });
}
```

Someone cloning this repo with no Cloudinary keys can still install, seed, run and play.
Only uploading is unavailable, and it says so honestly with **503 Service Unavailable** —
the status that means *this server cannot do this right now*, as opposed to 500, which
means *something broke*.

The lazy alternative — calling `cloudinary.config()` when the file first loads — would
make the entire server refuse to start for anyone without an account, including a marker
opening the project for the first time. `configure()` is therefore called on first
upload, not on import.

---

## Part 7 — The first use of `authorize`, and the wall behind it

```js
router.post("/:id/media",
  authenticate,          // who are you?
  authorize("admin"),    // are you allowed?
  uploadSingleImage,     // parse the file
  handleUploadErrors,    // turn multer's failures into our error shape
  mediaController.uploadScenarioMedia,
);
```

This is the first route in the project to call `server/middleware/authorize.js`. Person A
wrote it during Sprint 1 and until today nothing had ever used it.

Note the two-step split. `authenticate` answers *who are you* by verifying the token and
loading the user from Mongo. `authorize("admin")` answers *are you allowed*, reading
`req.user.role`. Keeping them separate is what lets the admin pages reuse the same pair
without rewriting either.

`handleUploadErrors` sits in the middle of the chain, which looks odd. It works because
Express identifies error-handling middleware by its **four** arguments
(`err, req, res, next`) instead of three, and runs it only when something before it
throws. Without it, a 6 MB upload would fall through to the global handler and return a
generic `500 Server error` instead of a clear `400 FILE_TOO_LARGE`.

### The wall

**There is no admin user in the database.** All nine accounts have `role: "player"`. The
route is correct and it is unreachable by every human on this project.

Roles and the `User` model are Person A's territory, so this is not something to fix
here. It needs raising with Ilan — and it needs raising now, because all three Sprint 3
admin cards sit behind the same door.

---

## Part 8 — One component, four screens

`client/src/components/media/ImageFrame.jsx` is the entire frontend of this assignment.

```jsx
if (!src || failed) {
  return null;
}
```

Two rules, both deliberate:

**No url means draw nothing.** Not a grey placeholder, not an empty box — nothing. The
surrounding text layout is the fallback, and every screen looks exactly as it did before
pictures existed. This is why the assignment could ship against a database whose only
scenario has no images at all.

**A broken url also means draw nothing.** A scenario can hold an address for a file since
deleted from Cloudinary. `onError` catches that and hides the frame, because a broken
image icon looks worse than no image.

Used in four places, with the ratio doing the work:

| Screen | Target | Ratio |
|---|---|---|
| `ScenarioListPage` | `scenario.coverImageUrl` | 16 / 9 (default) |
| `ScenarioDetailPage` | `scenario.coverImageUrl` | 21 / 9 |
| `CurrentLocation` | `location.imageUrl` | 21 / 9 |
| `ItemCard` | `item.imageUrl` | 1 / 1, 56px thumb |

`aspectRatio` plus `object-fit: cover` means the layout never jumps: the box reserves its
shape before the picture arrives, and whatever arrives is cropped to fit rather than
stretched. `loading="lazy"` tells the browser not to fetch a picture until it is near the
screen — worth having on a list page.

---

## Part 9 — The lint error, found and fixed

The first version of `ImageFrame` failed `npm run lint`. One error:

```
ImageFrame.jsx
  17:5  error  Calling setState synchronously within an effect can trigger
               cascading renders   react-hooks/set-state-in-effect
```

The offending code resets the failure flag whenever the url changes, so that one broken
image does not keep the frame hidden after an admin uploads a working replacement:

```js
useEffect(() => { setFailed(false); }, [src]);
```

The intent is right; the mechanism is wrong. Setting state inside an effect makes React
render, run the effect, set state, and render again — two passes where one would do.

The fix removed the effect entirely by storing **which url failed** instead of a
yes/no flag:

```js
const [failedSrc, setFailedSrc] = useState(null);
if (!src || failedSrc === src) return null;
// ...
<img src={src} onError={() => setFailedSrc(src)} />
```

A new url is automatically not equal to the failed one, so it retries with no effect, no
extra render, and no `useEffect` import at all. The rule worth keeping: **if state can be
worked out from what you already have, do not synchronise it — derive it.**

Applied. `npm run lint` is clean.

---

## Part 10 — Words to remember

| Word | What it means |
|---|---|
| **Binary** | Raw bytes, not text |
| **Base64** | Writing binary data using only ordinary letters and numbers |
| **Buffer** | Node's object for holding raw bytes in memory |
| **Stream** | Sending data in pieces instead of all at once |
| **Callback** | A function handed to another function to be called later |
| **Multipart** | The request format used to send files, which `express.json()` cannot read |
| **Ephemeral filesystem** | A disk that is wiped on every deploy |
| **CDN** | Copies of a file worldwide, each visitor served from the nearest |
| **503** | *I cannot do this right now* — as opposed to 500, *something broke* |

---

## Part 11 — Files

**New — server**

| File | What it does |
|---|---|
| `middleware/uploadImage.js` | multer in memory, 5 MB and image-type limits, multer errors in our shape |
| `services/mediaService.js` | Cloudinary config, `isConfigured()`, promise-wrapped upload |
| `services/scenarioMediaService.js` | Where a picture may attach; writes the url. No network, no Cloudinary |
| `services/mediaError.js` | `MediaError`, so media failures are one `instanceof` apart from game ones |
| `controllers/mediaController.js` | Validates id, file, scenario, target — then uploads and saves |
| `tests/scenarioMediaService.test.js` | 11 unit tests over the pure attach/resolve logic |

**New — client**

| File | What it does |
|---|---|
| `components/media/ImageFrame.jsx` | Draws a picture, or nothing at all |
| `components/media/ImageFrame.css` | Fixed ratio, cropped fit, thumbnail variant |

**Changed**

| File | What changed |
|---|---|
| `models/Scenario.js` | `coverImageUrl` on the scenario; `imageUrl` on location, character, item |
| `routes/scenarioRoutes.js` | `POST /:id/media`, admin only — first use of `authorize` |
| `package.json` | Added `cloudinary` and `multer` |
| `ScenarioListPage.jsx` · `ScenarioDetailPage.jsx` · `CurrentLocation.jsx` · `ItemCard.jsx` | Each renders one `ImageFrame` |
| four matching `.css` files | Spacing for the new frame |

---

## Part 12 — What comes next

**Sprint 2 is complete** once this merges — 11 of 11.

One open item to carry forward:

- **`"Escape Pompeii"` in Mongo has no `coverImageUrl` field**, because Mongoose defaults
  apply only to new documents. Harmless — `ImageFrame` draws nothing — but a re-run of
  `npm run seed` would add it.

`client/src/mocks/scenario.js` was updated in this assignment to carry `coverImageUrl`
and the three `imageUrl` fields, all empty — which is what the API returns for a scenario
with no pictures. The mocks are reference documents, imported by no code; their job is to
record the shape of the contract, so they follow the schema and hold no invented urls.

Then Sprint 3, the last three Person B cards: **Admin scenarios page**, **Create
Scenario**, **Edit Scenario**. Two notes before starting:

- All three need an admin user to exist (Part 7).
- `server.js` allows `GET, POST, PATCH, DELETE` through CORS but **not `PUT`**. If Edit
  Scenario is built as `PUT /api/scenarios/:id`, browser calls will fail. That file is
  shared, so it is a conversation, not an edit.

---

## Checks

| Check | Result |
|---|---|
| `npm test` (server) | **100 pass, 0 fail** — 11 of them new |
| `npm run build` (client) | Succeeded, 79 modules |
| `npm run lint` (client) | Clean, no warnings — after the Part 9 fix |
| Upload, end to end, real Cloudinary | **11 of 11 checks passed** |

The end-to-end run used a throwaway database on the same cluster, a temporary admin, and
the real route stack — `authenticate` → `authorize` → multer → controller → Cloudinary →
`save()`. Nothing mocked.

```
no token             -> 401 NOT_AUTHENTICATED
player role          -> 403 NOT_AUTHORIZED
no file              -> 400 NO_FILE_UPLOADED
non-image file       -> 400 UNSUPPORTED_FILE_TYPE
bad target           -> 400 INVALID_MEDIA_TARGET
unknown location id  -> 404 MEDIA_TARGET_NOT_FOUND
cover upload         -> 200, https://res.cloudinary.com/… url returned
uploaded image       -> publicly fetchable, HTTP 200, image/png
cover url            -> persisted in mongo
location upload      -> 200
location url         -> persisted in mongo
```

The scratch database was dropped and the two test images deleted from Cloudinary
afterwards. The team database was verified untouched.

**Not checked: how it looks — and this was decided, not forgotten.**

There are 19 slots for pictures in Pompeii — 1 cover, 8 locations, 4 characters, 6 items
— and all 19 are empty. The Cloudinary account holds nothing but the demo samples that
came with the free plan. So no frame has ever drawn a real picture, and the 21/9 cover
crop, the 16/9 card and the 56px item thumbnail have not been looked at by anyone.

Choosing what a Roman forum or a merchant called Marcus looks like is content work, and
it was deliberately put off on 2026-08-20 in favour of the Sprint 3 admin cards. The
plumbing is finished and stays in place: schema fields, upload route, Cloudinary account
and keys, and `ImageFrame` in four screens. Adding pictures later is upload-and-done —
no code changes.

What that leaves open, for whenever the pictures arrive:

- the frames have never been seen with a real image in them, and
- an admin user still has to exist before anyone can upload one (Part 7).
