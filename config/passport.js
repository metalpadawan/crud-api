// config/passport.js
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user");

module.exports = function (passport) {
  // ✅ No serializeUser / deserializeUser needed since we aren’t using sessions

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

          // Try to find an existing user
          let user = await User.findOne({
            $or: [
              { provider: "google", providerId: profile.id },
              { email },
            ],
          });

          // If user doesn’t exist, create a new one
          if (!user) {
            user = await User.create({
              provider: "google",
              providerId: profile.id,
              email,
              username: profile.displayName,
            });
          } else {
            // Update provider info if missing
            user.provider = "google";
            user.providerId = profile.id;
            await user.save();
          }

          return done(null, user);
        } catch (err) {
          return done(err, false);
        }
      }
    )
  );
};
