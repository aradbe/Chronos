const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://chronos-game-six.vercel.app",
  process.env.CLIENT_ORIGIN,
].filter(Boolean));

app.use(express.json());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed"));
    },
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/", (req, res) => {
  res.send("Chronos server is running");
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/games", require("./routes/gameRoutes"));
app.use("/api/scenarios", require("./routes/scenarioRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));


async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "chronos",
    });

    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Chronos server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

//global catch
app.use((err,req,res,next) => {
  const status = Number.isInteger(err.status) ? err.status : 500;
  const knownError = Boolean(err.code && err.status);

  if (!knownError) console.error(err);

  const error = {
    message: knownError ? err.message : "Server error",
    code: knownError ? err.code : "SERVER_ERROR",
  };
  if (knownError && Array.isArray(err.details) && err.details.length) {
    error.details = err.details;
  }

  res.status(status).json({ error });
})

startServer();
