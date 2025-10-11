// config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');

module.exports = function(passportInstance) {
  passportInstance.serializeUser((user, done) => done(null, user._id));
  passportInstance.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  passportInstance.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      let user = await User.findOne({ provider: 'google', providerId: profile.id });
      if (!user) {
        // If an account with same email exists, link or use existing (optional)
        user = await User.findOne({ email });
      }
      if (!user) {
        user = await User.create({
          provider: 'google',
          providerId: profile.id,
          email,
          username: profile.displayName
        });
      } else {
        // ensure providerId set if linking
        user.provider = 'google';
        user.providerId = profile.id;
        await user.save();
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  }));
};
