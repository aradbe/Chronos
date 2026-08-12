const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Chronos server is running");
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use("/api/users", require("./routes/userRoutes"));


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
  res.status(err.status || 500).json(
  {
  error: {
    message: "Server error",
    code: "SERVER_ERROR"
  }
})
})

startServer();
