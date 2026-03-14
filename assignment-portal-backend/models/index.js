const sequelize = require("../config/database");
const User = require("./User");
const Assignment = require("./Assignment");
const Submission = require("./Submission");

// User - Assignment (1:N)
User.hasMany(Assignment, { foreignKey: "createdBy", as: "assignments" });
Assignment.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

// Assignment - Submission (1:N)
Assignment.hasMany(Submission, { foreignKey: "assignmentId", as: "submissions" });
Submission.belongsTo(Assignment, { foreignKey: "assignmentId", as: "assignment" });

// User - Submission (1:N)
User.hasMany(Submission, { foreignKey: "studentId", as: "studentSubmissions" });
Submission.belongsTo(User, { foreignKey: "studentId", as: "student" });

module.exports = {
  sequelize,
  User,
  Assignment,
  Submission,
};
