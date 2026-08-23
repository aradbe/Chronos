# Chronos

AI-powered historical survival game.

## Tech Stack

- React
- Express
- MongoDB
- OpenAI

## AI dialogue

NPC replies use the OpenAI Responses API from the Express server. Add these values to `server/.env`:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5-mini
NPC_DIALOGUE_MODE=auto
```

The API key must stay on the server and should never use a `VITE_` prefix. When the key is missing or the OpenAI request fails, the game automatically uses its scripted dialogue instead. Set `NPC_DIALOGUE_MODE=scripted` to force that fallback during development.
