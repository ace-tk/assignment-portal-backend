const { Submission, Assignment, User } = require("../models");

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

    const assignment = await Assignment.findByPk(req.params.id);
    if (!assignment) return next(createError("Assignment not found", 404));

    // Only allow submission on Published assignments
    if (assignment.status !== "published") {
      return next(createError("Submissions are only allowed for published assignments", 400));
    }

    // Block submission after due date
    if (new Date() > new Date(assignment.dueDate)) {
      return next(createError("Submission deadline has passed", 400));
    }

    // Check for existing submission
    const existing = await Submission.findOne({
      where: {
        assignmentId: assignment.id,
        studentId: req.user.id,
      },
    });
    if (existing) {
      return next(createError("You have already submitted an answer for this assignment", 409));
    }

    const submission = await Submission.create({
      assignmentId: assignment.id,
      studentId: req.user.id,
      answer: answer.trim(),
    });

    const populatedSubmission = await Submission.findByPk(submission.id, {
      include: [
        { model: Assignment, as: "assignment", attributes: ["title", "dueDate"] },
        { model: User, as: "student", attributes: ["name", "email"] },
      ],
    });

    res.status(201).json({ success: true, submission: populatedSubmission });
  } catch (err) {
    // Handle Unique constraint error in Sequelize
    if (err.name === "SequelizeUniqueConstraintError") {
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
      where: {
        assignmentId: req.params.id,
        studentId: req.user.id,
      },
      include: [
        { model: Assignment, as: "assignment", attributes: ["title", "description", "dueDate", "status"] },
        { model: User, as: "student", attributes: ["name", "email"] },
      ],
    });

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
      where: {
        id: req.params.id,
        createdBy: req.user.id,
      },
    });
    if (!assignment) return next(createError("Assignment not found", 404));

    const submissions = await Submission.findAll({
      where: { assignmentId: req.params.id },
      include: [{ model: User, as: "student", attributes: ["name", "email"] }],
      order: [["createdAt", "DESC"]],
    });

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
    const submission = await Submission.findByPk(req.params.submissionId, {
      include: [{ model: Assignment, as: "assignment" }],
    });
    if (!submission) return next(createError("Submission not found", 404));

    // Ensure only the assignment's teacher can mark it reviewed
    if (submission.assignment.createdBy !== req.user.id) {
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
