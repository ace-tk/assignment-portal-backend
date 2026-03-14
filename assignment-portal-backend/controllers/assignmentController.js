const { Assignment, Submission, User } = require("../models");

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
      createdBy: req.user.id,
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
    const filter = { createdBy: req.user.id };
    if (status) filter.status = status;

    const offset = (Number(page) - 1) * Number(limit);
    const { rows: assignments, count: total } = await Assignment.findAndCountAll({
      where: filter,
      order: [["createdAt", "DESC"]],
      offset,
      limit: Number(limit),
    });

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
      where: {
        id: req.params.id,
        createdBy: req.user.id,
      },
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
      where: {
        id: req.params.id,
        createdBy: req.user.id,
      },
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
      where: {
        id: req.params.id,
        createdBy: req.user.id,
      },
    });
    if (!assignment) return next(createError("Assignment not found", 404));

    if (assignment.status !== "draft") {
      return next(createError("Only draft assignments can be deleted", 403));
    }

    await assignment.destroy();
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
    const offset = (Number(page) - 1) * Number(limit);

    const { rows: assignments, count: total } = await Assignment.findAndCountAll({
      where: { status: "published" },
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["name", "email"],
        },
      ],
      order: [["dueDate", "ASC"]],
      offset,
      limit: Number(limit),
    });

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
    const assignments = await Assignment.findAll({
      where: { createdBy: req.user.id },
    });

    const analytics = await Promise.all(
      assignments.map(async (a) => {
        const submissionCount = await Submission.count({ where: { assignmentId: a.id } });
        return {
          assignmentId: a.id,
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
