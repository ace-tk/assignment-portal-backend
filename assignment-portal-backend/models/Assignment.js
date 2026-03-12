const mongoose = require("mongoose");

const VALID_STATUSES = ["draft", "published", "completed"];

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    status: {
      type: String,
      enum: VALID_STATUSES,
      default: "draft",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Valid state transitions
assignmentSchema.statics.validTransition = function (from, to) {
  const transitions = {
    draft: ["published"],
    published: ["completed"],
    completed: [],
  };
  return transitions[from] && transitions[from].includes(to);
};

module.exports = mongoose.model("Assignment", assignmentSchema);
