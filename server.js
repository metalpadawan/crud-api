// ✅ Load environment variables first
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const passport = require("passport"); // 🆕 Add passport

// 🔐 Auth middleware (protect routes)
const { requireAuth, requireRole } = require("./middleware/auth");

// Routers
const usersRouter = require("./routes/users");
const booksRouter = require("./routes/books");
const authRouter = require("./routes/auth");

// 🧩 Load passport configuration (make sure config/passport.js exists)
require("./config/passport")(passport); // 🆕 initialize passport strategies

const app = express();
const PORT = process.env.PORT || 8080;

// 🧩 Debug: Check if environment variable loaded correctly
console.log("🧩 MONGO_URI value check:", process.env.MONGO_URI ? "✅ Found" : "❌ Not Found");

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// 🆕 Initialize passport middleware before using routes
app.use(passport.initialize());
app.use(passport.session && passport.session()); // optional (needed only if using sessions)

// Swagger setup
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Project 2 API",
      version: "1.0.0",
      description: "CRUD API with Users and Books + Authentication & Validation",
    },
    servers: [
      { url: `http://localhost:${PORT}/api` },
      { url: "https://crud-api-5ytk.onrender.com/api" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./routes/*.js"],
};
const swaggerSpec = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root route
app.get("/", (req, res) => {
  res.send("🚀 Welcome to Project 2 CRUD API! Visit /api-docs for Swagger documentation.");
});

// -------------------------
// ✅ AUTH ROUTES COME FIRST
// -------------------------
app.use("/auth", authRouter); // 👈 correct path for Google OAuth routes

// -------------------------
// ✅ API ROUTES
// -------------------------
app.use("/api/users", usersRouter);
app.use("/api/books", booksRouter);

// ✅ Example of protecting a route globally (optional)
app.get("/api/secret", requireAuth, (req, res) => {
  res.json({ message: `Welcome ${req.user.email}, this is a protected route.` });
});

// ✅ Example of admin-only route
app.delete("/api/admin-only", requireAuth, requireRole("admin"), (req, res) => {
  res.json({ message: "Admin privilege confirmed. Route executed successfully." });
});

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

// ✅ Centralized Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 Error caught by handler:", err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});
