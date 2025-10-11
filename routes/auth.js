const express = require("express");
const router = express.Router();
const Joi = require("joi");
const User = require("../models/user");
const { signUser } = require("../utils/jwt");
const passport = require("passport");

// Joi schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  username: Joi.string().min(2).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// ✅ Register route
router.post("/register", async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const exists = await User.findOne({ email: value.email });
    if (exists) return res.status(409).json({ error: "Email already in use" });

    const user = new User({
      email: value.email,
      password: value.password,
      username: value.username,
    });
    await user.save();

    const token = signUser(user);
    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, username: user.username },
    });
  } catch (err) {
    next(err);
  }
});

// ✅ Login route
router.post("/login", async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const user = await User.findOne({ email: value.email });
    if (!user || !(await user.comparePassword(value.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signUser(user);
    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    next(err);
  }
});

// ✅ Google OAuth entry (stateless)
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false, // 👈 prevents passport session middleware
  })
);

// ✅ Google OAuth callback (stateless)
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/auth/google/fail",
  }),
  (req, res) => {
    const token = signUser(req.user);

    // 👇 redirect to backend success page for testing (recommended)
    const redirectUrl = `/auth/success?token=${token}`;
    res.redirect(redirectUrl);
  }
);

// ✅ Simple success route (for testing)
router.get("/success", (req, res) => {
  const { token } = req.query;
  res.send(`
    <h2>✅ Google OAuth Successful!</h2>
    <p>Copy your JWT token below:</p>
    <code style="background:#eee;padding:6px 12px;display:inline-block;">${token}</code>
    <p>Use this token in Swagger (Authorize > Bearer Token)</p>
    <a href="/api-docs" style="display:block;margin-top:10px;">Go to Swagger Docs</a>
  `);
});

// ✅ Google fail route
router.get("/google/fail", (req, res) =>
  res.status(401).json({ error: "Google auth failed" })
);

// ✅ Stateless logout (for JWT)
router.get("/logout", (req, res) => {
  res.json({ ok: true, message: "Logged out (stateless mode)" });
});

module.exports = router;
