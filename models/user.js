const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    age: { type: Number, required: true },

    // Added for authentication
    password: { type: String }, // only required for local accounts

    // OAuth support
    provider: { type: String, enum: ["local", "google"], default: "local" },
    providerId: { type: String },

    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

// Hash password before saving (only if modified or new)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  try {
    const hash = await bcrypt.hash(this.password, SALT_ROUNDS);
    this.password = hash;
    next();
  } catch (err) {
    next(err);
  }
});

// Compare candidate password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Optional: hide sensitive data when converting to JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
