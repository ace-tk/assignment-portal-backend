/**
 * Seed script – drops existing data and creates sample users.
 * Run with:  npm run seed
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding …");

    // Clear existing data
    await Submission.deleteMany({});
    await Assignment.deleteMany({});
    await User.deleteMany({});
    console.log("Cleared existing data.");

    // Create users (passwords hashed by pre-save hook)
    const teacher = await User.create({
      name: "Alice Teacher",
      email: "teacher@portal.com",
      password: "Teacher@123",
      role: "teacher",
    });

    const student1 = await User.create({
      name: "Bob Student",
      email: "student1@portal.com",
      password: "Student@123",
      role: "student",
    });

    const student2 = await User.create({
      name: "Carol Student",
      email: "student2@portal.com",
      password: "Student@123",
      role: "student",
    });

    console.log("✅ Seed complete! Accounts created:");
    console.log(`   Teacher  → teacher@portal.com   / Teacher@123`);
    console.log(`   Student1 → student1@portal.com  / Student@123`);
    console.log(`   Student2 → student2@portal.com  / Student@123`);

    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err.message);
    process.exit(1);
  }
};

seed();
