const express = require("express");
const User = require("../models/user");
const auth = require("../middleware/auth");
// Create new router
const router = new express.Router();
const multer = require("multer");
const sharp = require("sharp");
const { sendWelcomeMessage, sendCancelMessage } = require("../emails/accounts");

// Create user
router.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    sendWelcomeMessage(user.email, user.name);
    // Call instance method to generate token
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

// User login in route
router.post("/users/login", async (req, res) => {
  try {
    // call static function created in user model
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    // Call instance method to generate token
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

// Logout User
router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.send("User has logged out");
  } catch (e) {
    res.status(500).send();
  }
});

// Logout User from all sessions
router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    // remove all tokens
    req.user.tokens = [];
    // save to db
    await req.user.save();
    res.send("User has logged out from all sessions");
  } catch (e) {
    res.status(500).send();
  }
});

// Resource Reading Routes:
// Read user's own profile with header authorization:token
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

// Resource updating endpoints
router.patch("/users/me", auth, async (req, res) => {
  // Validate if every update is allowed
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValidOperation = updates.every(update =>
    allowedUpdates.includes(update)
  );
  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }
  try {
    updates.forEach(update => (req.user[update] = req.body[update]));
    await req.user.save();

    res.send(req.user);
  } catch (e) {
    // validation error
    res.status(400).send(e.message);
  }
});

// resource deleting user
router.delete("/users/me", auth, async (req, res) => {
  try {
    // remove authenticated user
    await req.user.remove();
    sendCancelMessage(req.user.email, req.user.name);
    res.status(200).send(req.user);
  } catch (e) {
    res.status(400).send(e.message);
  }
});

// multer configuration
const upload = multer({
  // dest: "avatars", //don't save to local
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Upload must be an image file"));
    }
    cb(undefined, true);
  },
});

// Route for upload Avatars, save to db
router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    // resize image with sharp
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

// Delete an avatar
router.delete("/users/me/avatar", auth, async (req, res) => {
  try {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// Fetching an avatar image
router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    // Set response header to indicate file type
    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
});

// Export router
module.exports = router;
