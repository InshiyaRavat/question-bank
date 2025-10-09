#!/usr/bin/env node

/**
 * Setup Free Trial System
 * This script initializes the free trial system with default settings
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function setupFreeTrial() {
  try {
    console.log("🚀 Setting up Free Trial System...");

    // Get all topics to set as default allowed topics
    const topics = await prisma.topic.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
    });

    console.log(`📚 Found ${topics.length} topics`);

    // Create default free trial settings
    const defaultSettings = {
      dailyQuestionLimit: 5,
      allowedTopics: topics.map((topic) => topic.id),
      isActive: true,
      description: "Free trial allows 5 questions per day from all available topics",
      updatedBy: "system",
    };

    // Deactivate any existing settings
    await prisma.freeTrialSettings.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new settings
    const settings = await prisma.freeTrialSettings.create({
      data: defaultSettings,
    });

    console.log("✅ Free Trial Settings Created:");
    console.log(`   - Daily Limit: ${settings.dailyQuestionLimit} questions`);
    console.log(`   - Allowed Topics: ${settings.allowedTopics.length} topics`);
    console.log(`   - Status: ${settings.isActive ? "Active" : "Inactive"}`);
    console.log(`   - Description: ${settings.description}`);

    console.log("\n🎉 Free Trial System setup complete!");
    console.log("\nNext steps:");
    console.log("1. Run the database migration: npx prisma migrate dev");
    console.log("2. Access admin panel: /admin/free-trial-settings");
    console.log("3. Customize settings as needed");
  } catch (error) {
    console.error("❌ Error setting up free trial system:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupFreeTrial();
