const express = require("express");
const Task = require("../models/task");
const auth = require("../middleware/auth");

// Create new router
const router = new express.Router();

// Resource Create Task
router.post("/tasks", auth, async (req, res) => {
  // store task from req.body and link owner from auth
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });
  try {
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

// Read tasks by user
router.get("/tasks", auth, async (req, res) => {
  // object to store search criteria
  const match = {};
  // Object to store sort criteria
  const sort = {};

  // GET {{url}}/tasks?completed=true
  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }

  // GET {{url}}/tasks?sortBy=createdAt:desc
  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = sort[parts[1]] === "desc" ? -1 : 1;
  }

  try {
    await req.user
      .populate({
        path: "tasks",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
      })
      .execPopulate();
    res.send(req.user.tasks);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Resource Reading by id
router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    // const task = await Task.findById(_id);
    const task = await Task.findOne({ _id, owner: req.user._id });
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (e) {
    res.status(500).send();
  }
});

// Resource Updating
router.patch("/tasks/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["task", "description", "completed"];
  const isValidOperation = updates.every(update => {
    return allowedUpdates.includes(update);
  });

  if (!isValidOperation)
    return res.status(400).send({ error: "Invalid Updates" });
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!task) {
      return res.status(404).send();
    }
    updates.forEach(update => (task[update] = req.body[update]));
    await task.save();

    res.status(200).send(task);
  } catch (e) {
    res.status(400).send();
  }
});

// resource deleting
router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!task) {
      return res.status(404).send();
    }
    res.status(200).send(task);
  } catch (e) {
    res.status(400).send(e.message);
  }
});

module.exports = router;
