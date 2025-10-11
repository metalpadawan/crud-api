// config/passport.js
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user");

module.exports = function (passport) {
  // ✅ No serializeUser / deserializeUser (stateless JWT setup)

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const displayName = profile.displayName || "Google User";

          // Try to find an existing user
          let user = await User.findOne({
            $or: [
              { provider: "google", providerId: profile.id },
              { email },
            ],
          });

          // If user doesn’t exist, create one with defaults
          if (!user) {
            user = await User.create({
              provider: "google",
              providerId: profile.id,
              email,
              username: displayName,
              name: displayName, // ✅ satisfies Mongoose 'name' requirement
              age: 18, // ✅ default placeholder to pass validation
              role: "user", // optional, ensures user role consistency
            });
          } else {
            // Update provider info if missing
            user.provider = "google";
            user.providerId = profile.id;

            // Optional: fill in missing fields if old record incomplete
            if (!user.name) user.name = displayName;
            if (!user.age) user.age = 18;

            await user.save();
          }

          return done(null, user);
        } catch (err) {
          console.error("❌ Google OAuth error:", err);
          return done(err, false);
        }
      }
    )
  );
};
