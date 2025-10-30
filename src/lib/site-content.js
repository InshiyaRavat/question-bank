import { prisma } from "@/lib/db.js";

/**
 * Get site settings by category or all settings
 * @param {string} category - Optional category filter
 * @returns {Object} Settings object with key-value pairs
 */
export async function getSiteSettings(category = null) {
  try {
    const where = category ? { category } : {};

    const settings = await prisma.siteSettings.findMany({
      where,
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    // Convert settings to key-value pairs with proper type conversion
    const settingsMap = {};
    settings.forEach((setting) => {
      let value = setting.value;

      // Convert value based on type
      if (setting.type === "boolean") {
        value = value === "true";
      } else if (setting.type === "number") {
        value = Number(value);
      } else if (setting.type === "json") {
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = setting.value; // fallback to string if JSON parsing fails
        }
      }

      settingsMap[setting.key] = value;
    });

    return settingsMap;
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return {};
  }
}

/**
 * Get content blocks by category or all content blocks
 * @param {string} category - Optional category filter
 * @returns {Object} Content blocks object with key-value pairs
 */
export async function getContentBlocks(category = null) {
  try {
    const where = {
      isActive: true,
      ...(category ? { category } : {}),
    };

    const contentBlocks = await prisma.contentBlock.findMany({
      where,
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { title: "asc" }],
    });

    // Convert content blocks to key-value pairs
    const contentBlocksMap = {};
    contentBlocks.forEach((block) => {
      let content = block.content;

      // Parse metadata if it exists
      let metadata = null;
      if (block.metadata) {
        try {
          metadata = JSON.parse(block.metadata);
        } catch (e) {
          // ignore parsing errors
        }
      }

      contentBlocksMap[block.key] = {
        title: block.title,
        content,
        type: block.type,
        category: block.category,
        sortOrder: block.sortOrder,
        metadata,
      };
    });

    return contentBlocksMap;
  } catch (error) {
    console.error("Error fetching content blocks:", error);
    return {};
  }
}

/**
 * Get feature toggles by category or all feature toggles
 * @param {string} category - Optional category filter
 * @returns {Object} Feature toggles object with key-value pairs
 */
export async function getFeatureToggles(category = null) {
  try {
    const where = category ? { category } : {};

    const featureToggles = await prisma.featureToggle.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    // Convert feature toggles to key-value pairs
    const featureTogglesMap = {};
    featureToggles.forEach((toggle) => {
      featureTogglesMap[toggle.key] = {
        name: toggle.name,
        description: toggle.description,
        isEnabled: toggle.isEnabled,
        category: toggle.category,
      };
    });

    return featureTogglesMap;
  } catch (error) {
    console.error("Error fetching feature toggles:", error);
    return {};
  }
}

/**
 * Get all site content (settings, content blocks, feature toggles)
 * @param {Object} options - Options for filtering
 * @returns {Object} Complete site content object
 */
export async function getAllSiteContent(options = {}) {
  try {
    const { settingsCategory, contentCategory, featuresCategory } = options;

    const [settings, contentBlocks, featureToggles] = await Promise.all([
      getSiteSettings(settingsCategory),
      getContentBlocks(contentCategory),
      getFeatureToggles(featuresCategory),
    ]);

    return {
      settings,
      contentBlocks,
      featureToggles,
    };
  } catch (error) {
    console.error("Error fetching all site content:", error);
    return {
      settings: {},
      contentBlocks: {},
      featureToggles: {},
    };
  }
}

/**
 * Check if a feature is enabled
 * @param {string} featureKey - The feature key to check
 * @returns {boolean} Whether the feature is enabled
 */
export async function isFeatureEnabled(featureKey) {
  try {
    const featureToggles = await getFeatureToggles();
    return featureToggles[featureKey]?.isEnabled || false;
  } catch (error) {
    console.error("Error checking feature toggle:", error);
    return false;
  }
}

/**
 * Get a specific setting value
 * @param {string} key - The setting key
 * @param {any} defaultValue - Default value if setting not found
 * @returns {any} The setting value or default value
 */
export async function getSetting(key, defaultValue = null) {
  try {
    const settings = await getSiteSettings();
    return settings[key] !== undefined ? settings[key] : defaultValue;
  } catch (error) {
    console.error("Error getting setting:", error);
    return defaultValue;
  }
}

/**
 * Get a specific content block
 * @param {string} key - The content block key
 * @returns {Object|null} The content block or null if not found
 */
export async function getContentBlock(key) {
  try {
    const contentBlocks = await getContentBlocks();
    return contentBlocks[key] || null;
  } catch (error) {
    console.error("Error getting content block:", error);
    return null;
  }
}

/**
 * Check if site is in maintenance mode
 * @returns {boolean} Whether maintenance mode is enabled
 */
export async function isMaintenanceMode() {
  return await isFeatureEnabled("maintenanceMode");
}

/**
 * Get branding settings
 * @returns {Object} Branding settings object
 */
export async function getBrandingSettings() {
  return await getSiteSettings("branding");
}

/**
 * Get SEO settings
 * @returns {Object} SEO settings object
 */
export async function getSEOSettings() {
  return await getSiteSettings("seo");
}

/**
 * Get contact settings
 * @returns {Object} Contact settings object
 */
export async function getContactSettings() {
  return await getSiteSettings("contact");
}

/**
 * Get social media settings
 * @returns {Object} Social media settings object
 */
export async function getSocialSettings() {
  return await getSiteSettings("social");
}
