# Deploying Chronos

Chronos is deployed as two services from the same GitHub repository:

- The Express API runs on Render.
- The Vite client runs on Vercel.
- MongoDB Atlas remains the production database.

## 1. Deploy the API on Render

Create a new Web Service and connect the Chronos GitHub repository.

| Setting | Value |
| --- | --- |
| Branch | `main` |
| Root Directory | `server` |
| Runtime | Node |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Health Check Path | `/` |

Add the following environment variables in Render:

```env
MONGO_URI=<MongoDB Atlas connection string>
JWT_SECRET=<a long random secret>
CLIENT_ORIGIN=<add the Vercel URL after step 2>
GEMINI_API_KEY=<Gemini API key>
SCENARIO_AI_PROVIDER=gemini
SCENARIO_AI_MODEL=gemini-3.6-flash
NPC_DIALOGUE_MODE=scripted
CLOUDINARY_CLOUD_NAME=<Cloudinary cloud name>
CLOUDINARY_API_KEY=<Cloudinary API key>
CLOUDINARY_API_SECRET=<Cloudinary API secret>
```

Do not add `PORT`. Render supplies it automatically.

Open the Render URL after deployment. It should display `Chronos server is running`.

## 2. Deploy the client on Vercel

Import the same repository as a new Vercel project.

| Setting | Value |
| --- | --- |
| Branch | `main` |
| Root Directory | `client` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Add this environment variable before deploying:

```env
VITE_API_BASE_URL=https://<render-service-name>.onrender.com/api
```

The value must use the real Render URL from step 1.

## 3. Finish the connection

Copy the final Vercel production URL. In Render, set:

```env
CLIENT_ORIGIN=https://<vercel-project-name>.vercel.app
```

Save the variable and redeploy the Render service.

## 4. MongoDB Atlas access

The Atlas database user in `MONGO_URI` must have access to the Chronos database. Render must also be allowed through Atlas Network Access. For a simple student deployment, `0.0.0.0/0` works, provided the database password is strong and the connection string remains only in Render.

## 5. Production check

Verify these flows on the Vercel URL:

1. Register and log in.
2. Start and resume a game.
3. Refresh while on a nested route such as `/games/:id`.
4. Open the admin scenario page.
5. Generate a scenario with Gemini.
6. Upload an image if Cloudinary is configured.
