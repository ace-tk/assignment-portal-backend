const express = require("express");
const router = express.Router();
const {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  getPublishedAssignments,
  getTeacherAnalytics,
} = require("../controllers/assignmentController");
const { protect, teacherOnly, studentOnly } = require("../middleware/authMiddleware");

// ── Teacher Routes (protected + teacherOnly) ─────────────────────────────────
router.post("/", protect, teacherOnly, createAssignment);
router.get("/", protect, teacherOnly, getAssignments);
router.get("/analytics", protect, teacherOnly, getTeacherAnalytics);
router.get("/:id", protect, teacherOnly, getAssignmentById);
router.patch("/:id", protect, teacherOnly, updateAssignment);
router.delete("/:id", protect, teacherOnly, deleteAssignment);

// ── Student Routes (protected + studentOnly) ─────────────────────────────────
router.get("/student/published", protect, studentOnly, getPublishedAssignments);

module.exports = router;
