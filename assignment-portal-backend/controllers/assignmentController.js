const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");

// ── Helper ───────────────────────────────────────────────────────────────────
const createError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

// ── TEACHER: Create Assignment ────────────────────────────────────────────────
// POST /api/assignments
const createAssignment = async (req, res, next) => {
  try {
    const { title, description, dueDate } = req.body;

    if (!title || !description || !dueDate) {
      return next(createError("Title, description, and dueDate are required", 400));
    }

    const assignment = await Assignment.create({
      title,
      description,
      dueDate,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, assignment });
  } catch (err) {
    next(err);
  }
};

// ── TEACHER: Get All Assignments (with optional status filter + pagination) ───
// GET /api/assignments?status=draft&page=1&limit=10
const getAssignments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { createdBy: req.user._id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [assignments, total] = await Promise.all([
      Assignment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Assignment.countDocuments(filter),
    ]);

    res.json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      assignments,
    });
  } catch (err) {
    next(err);
  }
};

// ── TEACHER: Get Single Assignment ───────────────────────────────────────────
// GET /api/assignments/:id
const getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!assignment) return next(createError("Assignment not found", 404));
    res.json({ success: true, assignment });
  } catch (err) {
    next(err);
  }
};

// ── TEACHER: Update Assignment ────────────────────────────────────────────────
// PATCH /api/assignments/:id
const updateAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!assignment) return next(createError("Assignment not found", 404));

    // Completed assignments are fully locked
    if (assignment.status === "completed") {
      return next(createError("Completed assignments cannot be modified", 403));
    }

    const { title, description, dueDate, status } = req.body;

    // Validate state transition if status is being changed
    if (status && status !== assignment.status) {
      const isValid = Assignment.validTransition(assignment.status, status);
      if (!isValid) {
        return next(
          createError(
            `Invalid transition: ${assignment.status} → ${status}. Allowed: draft→published, published→completed`,
            400
          )
        );
      }
      assignment.status = status;
    }

    // Only allow field edits on Draft
    if (assignment.status === "draft") {
      if (title) assignment.title = title;
      if (description) assignment.description = description;
      if (dueDate) assignment.dueDate = dueDate;
    }

    await assignment.save();
    res.json({ success: true, assignment });
  } catch (err) {
    next(err);
  }
};

// ── TEACHER: Delete Assignment (Draft only) ───────────────────────────────────
// DELETE /api/assignments/:id
const deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!assignment) return next(createError("Assignment not found", 404));

    if (assignment.status !== "draft") {
      return next(createError("Only draft assignments can be deleted", 403));
    }

    await assignment.deleteOne();
    res.json({ success: true, message: "Assignment deleted" });
  } catch (err) {
    next(err);
  }
};

// ── STUDENT: Get Published Assignments ───────────────────────────────────────
// GET /api/assignments/published?page=1&limit=10
const getPublishedAssignments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const now = new Date();

    const [assignments, total] = await Promise.all([
      Assignment.find({ status: "published" })
        .populate("createdBy", "name email")
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Assignment.countDocuments({ status: "published" }),
    ]);

    res.json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      assignments,
    });
  } catch (err) {
    next(err);
  }
};

// ── TEACHER: Analytics – submission counts per assignment ─────────────────────
// GET /api/assignments/analytics
const getTeacherAnalytics = async (req, res, next) => {
  try {
    const assignments = await Assignment.find({ createdBy: req.user._id }).lean();

    const analytics = await Promise.all(
      assignments.map(async (a) => {
        const submissionCount = await Submission.countDocuments({ assignment: a._id });
        return {
          assignmentId: a._id,
          title: a.title,
          status: a.status,
          dueDate: a.dueDate,
          submissionCount,
        };
      })
    );

    res.json({ success: true, analytics });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  getPublishedAssignments,
  getTeacherAnalytics,
};
