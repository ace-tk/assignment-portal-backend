const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");

// ── Helper ───────────────────────────────────────────────────────────────────
const createError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

// ── STUDENT: Submit Answer ────────────────────────────────────────────────────
// POST /api/assignments/:id/submit
const submitAnswer = async (req, res, next) => {
  try {
    const { answer } = req.body;
    if (!answer || answer.trim() === "") {
      return next(createError("Answer is required", 400));
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return next(createError("Assignment not found", 404));

    // Only allow submission on Published assignments
    if (assignment.status !== "published") {
      return next(createError("Submissions are only allowed for published assignments", 400));
    }

    // Block submission after due date
    if (new Date() > new Date(assignment.dueDate)) {
      return next(createError("Submission deadline has passed", 400));
    }

    // Check for existing submission (unique index will also guard this)
    const existing = await Submission.findOne({
      assignment: assignment._id,
      student: req.user._id,
    });
    if (existing) {
      return next(createError("You have already submitted an answer for this assignment", 409));
    }

    const submission = await Submission.create({
      assignment: assignment._id,
      student: req.user._id,
      answer: answer.trim(),
    });

    await submission.populate("assignment", "title dueDate");
    await submission.populate("student", "name email");

    res.status(201).json({ success: true, submission });
  } catch (err) {
    // Handle MongoDB duplicate key error (compound unique index)
    if (err.code === 11000) {
      return next(createError("You have already submitted an answer for this assignment", 409));
    }
    next(err);
  }
};

// ── STUDENT: View Own Submission ──────────────────────────────────────────────
// GET /api/assignments/:id/my-submission
const getMySubmission = async (req, res, next) => {
  try {
    const submission = await Submission.findOne({
      assignment: req.params.id,
      student: req.user._id,
    })
      .populate("assignment", "title description dueDate status")
      .populate("student", "name email");

    if (!submission) {
      return res.json({ success: true, submission: null, message: "No submission found" });
    }

    res.json({ success: true, submission });
  } catch (err) {
    next(err);
  }
};

// ── TEACHER: Get All Submissions for an Assignment ────────────────────────────
// GET /api/assignments/:id/submissions
const getSubmissionsForAssignment = async (req, res, next) => {
  try {
    // Ensure the assignment belongs to this teacher
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!assignment) return next(createError("Assignment not found", 404));

    const submissions = await Submission.find({ assignment: req.params.id })
      .populate("student", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      assignmentTitle: assignment.title,
      totalSubmissions: submissions.length,
      submissions,
    });
  } catch (err) {
    next(err);
  }
};

// ── TEACHER: Mark Submission as Reviewed ──────────────────────────────────────
// PATCH /api/submissions/:submissionId/review
const markReviewed = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.submissionId).populate(
      "assignment",
      "createdBy"
    );
    if (!submission) return next(createError("Submission not found", 404));

    // Ensure only the assignment's teacher can mark it reviewed
    if (submission.assignment.createdBy.toString() !== req.user._id.toString()) {
      return next(createError("Not authorised to review this submission", 403));
    }

    submission.reviewed = true;
    await submission.save();

    res.json({ success: true, message: "Submission marked as reviewed", submission });
  } catch (err) {
    next(err);
  }
};

module.exports = { submitAnswer, getMySubmission, getSubmissionsForAssignment, markReviewed };
