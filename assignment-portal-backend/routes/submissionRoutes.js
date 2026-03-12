const express = require("express");
const router = express.Router();
const {
  submitAnswer,
  getMySubmission,
  getSubmissionsForAssignment,
  markReviewed,
} = require("../controllers/submissionController");
const { protect, teacherOnly, studentOnly } = require("../middleware/authMiddleware");

// ── Student routes ────────────────────────────────────────────────────────────

// POST /api/assignments/:id/submit
router.post("/assignments/:id/submit", protect, studentOnly, submitAnswer);

// GET /api/assignments/:id/my-submission
router.get("/assignments/:id/my-submission", protect, studentOnly, getMySubmission);

// ── Teacher routes ────────────────────────────────────────────────────────────

// GET /api/assignments/:id/submissions
router.get("/assignments/:id/submissions", protect, teacherOnly, getSubmissionsForAssignment);

// PATCH /api/submissions/:submissionId/review
router.patch("/submissions/:submissionId/review", protect, teacherOnly, markReviewed);

module.exports = router;
