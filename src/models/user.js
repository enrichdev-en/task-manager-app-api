const validator = require("validator");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("./task");

// Define a userSchema for middleware usage
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "name required"], trim: true },
    age: { type: Number, required: true, min: [0, "Needs to be positive"] },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email invalid");
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minLength: [7, "Length must be greater than 6"],
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error("Cannot include 'password'");
        }
      },
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      type: Buffer,
    },
  },
  { timestamps: true }
);

// Store tasks model to user
userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner",
});

// For a user instance remove password and tokens
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();

  delete userObject.password;
  delete userObject.tokens;
  // remove avatar from showing
  delete userObject.avatar;
  return userObject;
};

// Generate user Auth token (this = user) on user instance
userSchema.methods.generateAuthToken = async function () {
  // this = user
  const token = await jwt.sign(
    { _id: this._id.toString() },
    "theSecretPhrase",
    {
      expiresIn: "7 days",
    }
  );
  this.tokens = this.tokens.concat({ token });
  await this.save();
  return token;
};

// Check user login email and password
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Unable to login");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Unable to login");
  }
  return user;
};

// Middleware PRE to hash user password just before save (standard function for this binding)
userSchema.pre("save", async function (next) {
  // check if password has been modified before hashing
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  // Call next to do the next thing when hashing is done.
  next();
});

// Delete user tasks when user is removed
userSchema.pre("remove", async function (next) {
  await Task.deleteMany({ owner: this._id });
  next();
});

// Define a User Model using userSchema
const User = mongoose.model("User", userSchema);

module.exports = User;
