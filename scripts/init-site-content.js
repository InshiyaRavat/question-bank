const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function initializeSiteContent() {
  console.log("Initializing site content...");

  try {
    // Default site settings
    const defaultSettings = [
      // Branding
      { key: "brandName", value: "Question Bank", type: "string", category: "branding" },
      { key: "brandTagline", value: "Master Your Exams with Our Question Bank", type: "string", category: "branding" },
      { key: "logoUrl", value: "", type: "string", category: "branding" },
      { key: "faviconUrl", value: "", type: "string", category: "branding" },
      { key: "primaryColor", value: "#3B82F6", type: "string", category: "branding" },
      { key: "secondaryColor", value: "#1E40AF", type: "string", category: "branding" },
      { key: "accentColor", value: "#F59E0B", type: "string", category: "branding" },
      { key: "fontFamily", value: "Inter", type: "string", category: "branding" },

      // SEO
      { key: "siteTitle", value: "Question Bank - Master Your Exams", type: "string", category: "seo" },
      {
        key: "metaDescription",
        value:
          "Comprehensive question bank for exam preparation. Practice with thousands of questions and track your progress.",
        type: "string",
        category: "seo",
      },

      // Contact
      { key: "contactEmail", value: "support@questionbank.com", type: "string", category: "contact" },
      { key: "contactPhone", value: "+1 (555) 123-4567", type: "string", category: "contact" },
      {
        key: "contactAddress",
        value: "123 Education St, Learning City, LC 12345",
        type: "string",
        category: "contact",
      },

      // Social
      { key: "socialTwitter", value: "", type: "string", category: "social" },
      { key: "socialLinkedin", value: "", type: "string", category: "social" },
      { key: "socialInstagram", value: "", type: "string", category: "social" },
      { key: "socialFacebook", value: "", type: "string", category: "social" },

      // Features
      { key: "maintenanceMode", value: "false", type: "boolean", category: "features" },
      { key: "showSignup", value: "true", type: "boolean", category: "features" },
    ];

    // Insert default settings
    for (const setting of defaultSettings) {
      await prisma.siteSettings.upsert({
        where: { key: setting.key },
        update: { value: setting.value, type: setting.type, category: setting.category },
        create: setting,
      });
    }

    // Default content blocks
    const defaultContentBlocks = [
      {
        key: "hero-headline",
        title: "Hero Headline",
        content: "Master Your Exams with Our Comprehensive Question Bank",
        type: "text",
        category: "hero",
        isActive: true,
        sortOrder: 1,
      },
      {
        key: "hero-subheadline",
        title: "Hero Subheadline",
        content: "Practice with thousands of questions, track your progress, and boost your confidence for any exam.",
        type: "text",
        category: "hero",
        isActive: true,
        sortOrder: 2,
      },
      {
        key: "hero-cta-text",
        title: "Hero CTA Text",
        content: "Get Started",
        type: "text",
        category: "hero",
        isActive: true,
        sortOrder: 3,
      },
      {
        key: "hero-cta-url",
        title: "Hero CTA URL",
        content: "/sign-up",
        type: "text",
        category: "hero",
        isActive: true,
        sortOrder: 4,
      },
      {
        key: "feature-1-title",
        title: "Feature 1 Title",
        content: "Comprehensive Question Bank",
        type: "text",
        category: "features",
        isActive: true,
        sortOrder: 1,
      },
      {
        key: "feature-1-description",
        title: "Feature 1 Description",
        content: "Access thousands of carefully curated questions across multiple subjects and difficulty levels.",
        type: "text",
        category: "features",
        isActive: true,
        sortOrder: 2,
      },
      {
        key: "feature-2-title",
        title: "Feature 2 Title",
        content: "Progress Tracking",
        type: "text",
        category: "features",
        isActive: true,
        sortOrder: 3,
      },
      {
        key: "feature-2-description",
        title: "Feature 2 Description",
        content: "Monitor your performance with detailed analytics and personalized insights.",
        type: "text",
        category: "features",
        isActive: true,
        sortOrder: 4,
      },
      {
        key: "feature-3-title",
        title: "Feature 3 Title",
        content: "Adaptive Learning",
        type: "text",
        category: "features",
        isActive: true,
        sortOrder: 5,
      },
      {
        key: "feature-3-description",
        title: "Feature 3 Description",
        content: "Get personalized recommendations based on your strengths and weaknesses.",
        type: "text",
        category: "features",
        isActive: true,
        sortOrder: 6,
      },
      {
        key: "footer-copyright",
        title: "Footer Copyright",
        content: "© 2024 Question Bank. All rights reserved.",
        type: "text",
        category: "footer",
        isActive: true,
        sortOrder: 1,
      },
    ];

    // Insert default content blocks
    for (const block of defaultContentBlocks) {
      await prisma.contentBlock.upsert({
        where: { key: block.key },
        update: {
          title: block.title,
          content: block.content,
          type: block.type,
          category: block.category,
          isActive: block.isActive,
          sortOrder: block.sortOrder,
        },
        create: block,
      });
    }

    // Default feature toggles
    const defaultFeatureToggles = [
      {
        key: "maintenanceMode",
        name: "Maintenance Mode",
        description: "Enable maintenance mode to show maintenance page to users",
        isEnabled: false,
        category: "features",
      },
      {
        key: "showSignup",
        name: "Show Signup",
        description: "Show signup functionality to new users",
        isEnabled: true,
        category: "features",
      },
      {
        key: "enableComments",
        name: "Enable Comments",
        description: "Allow users to comment on questions",
        isEnabled: true,
        category: "features",
      },
      {
        key: "enableFeedback",
        name: "Enable Feedback",
        description: "Allow users to submit feedback",
        isEnabled: true,
        category: "features",
      },
      {
        key: "enableAnalytics",
        name: "Enable Analytics",
        description: "Track user analytics and performance metrics",
        isEnabled: true,
        category: "features",
      },
    ];

    // Insert default feature toggles
    for (const toggle of defaultFeatureToggles) {
      await prisma.featureToggle.upsert({
        where: { key: toggle.key },
        update: {
          name: toggle.name,
          description: toggle.description,
          isEnabled: toggle.isEnabled,
          category: toggle.category,
        },
        create: toggle,
      });
    }

    console.log("✅ Site content initialized successfully!");
    console.log(`📊 Created ${defaultSettings.length} site settings`);
    console.log(`📝 Created ${defaultContentBlocks.length} content blocks`);
    console.log(`🔧 Created ${defaultFeatureToggles.length} feature toggles`);
  } catch (error) {
    console.error("❌ Error initializing site content:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initializeSiteContent()
  .then(() => {
    console.log("🎉 Site content initialization completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Site content initialization failed:", error);
    process.exit(1);
  });
