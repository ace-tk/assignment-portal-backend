const { sequelize, User, Assignment, Submission } = require("../models");

const seed = async () => {
  try {
    // Sync and clear data
    await sequelize.sync({ force: true });
    console.log("Database synced and cleared.");

    // Create users
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

    console.log("✅ SQLite Seed complete! Accounts created:");
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
