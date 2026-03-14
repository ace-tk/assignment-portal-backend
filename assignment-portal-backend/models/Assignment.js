const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const VALID_STATUSES = ["draft", "published", "completed"];

const Assignment = sequelize.define("Assignment", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [3, 200],
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(...VALID_STATUSES),
    defaultValue: "draft",
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
  },
});

Assignment.validTransition = function (from, to) {
  const transitions = {
    draft: ["published"],
    published: ["completed"],
    completed: [],
  };
  return transitions[from] && transitions[from].includes(to);
};

module.exports = Assignment;
