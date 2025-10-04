// ✅ Load environment variables first
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const usersRouter = require("./routes/users");
const booksRouter = require("./routes/books");

const app = express();
const PORT = process.env.PORT || 8080;

// 🧩 Debug: Check if environment variable loaded correctly
console.log("🧩 MONGO_URI value check:", process.env.MONGO_URI ? "✅ Found" : "❌ Not Found");

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Swagger setup
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Project 2 API",
      version: "1.0.0",
      description: "CRUD API with Users and Books",
    },
    servers: [
      { url: `http://localhost:${PORT}/api` },
      { url: "https://crud-api-5ytk.onrender.com/api" },
    ],
  },
  apis: ["./routes/*.js"],
};
const swaggerSpec = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root route
app.get("/", (req, res) => {
  res.send("🚀 Welcome to Project 2 CRUD API! Visit /api-docs for Swagger documentation.");
});

// Routes
app.use("/api/users", usersRouter);
app.use("/api/books", booksRouter);

// ✅ MongoDB connection
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error("❌ MONGO_URI is missing. Please check your environment variables.");
  process.exit(1); // Stop the app if the URI isn't set
}

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));
