require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  ...(process.env.CLIENT_URL || "").split(",").map((origin) => origin.trim()).filter(Boolean),
];
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
}));
app.use(express.json());
app.get("/", (_req, res) => res.json({ message: "LifeTrack API is running" }));
app.use("/api/auth", require("./src/routes/auth"));
for (const name of ["tasks", "expenses", "bills", "appointments", "shopping", "habits"]) {
  app.use(`/api/${name}`, require(`./src/routes/${name}`));
}
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Server error" });
});
const port = process.env.PORT || 5000;
const mongodbUri = process.env.MONGODB_URI || process.env.MONGO_URI;

app.listen(port, () => console.log(`Server running on port ${port}`));

if (!mongodbUri) {
  console.error("MongoDB connection failed: MONGODB_URI is not set (MONGO_URI is also accepted).");
} else {
  mongoose.connect(mongodbUri)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection failed:", err.message));
}
