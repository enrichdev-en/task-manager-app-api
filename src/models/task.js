const mongoose = require("mongoose");

// Create schema for task model
const taskSchema = new mongoose.Schema(
  {
    task: {
      type: String,
      required: true,
      lowercase: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Define a Task model
const Task = new mongoose.model("Task", taskSchema);

module.exports = Task;
