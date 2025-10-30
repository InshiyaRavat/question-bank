"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook for fetching and using site content
 * @param {Object} options - Options for filtering content
 * @returns {Object} Site content and loading state
 */
export function useSiteContent(options = {}) {
  const [content, setContent] = useState({
    settings: {},
    contentBlocks: {},
    featureToggles: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (options.settingsCategory) params.append("settingsCategory", options.settingsCategory);
        if (options.contentCategory) params.append("contentCategory", options.contentCategory);
        if (options.featuresCategory) params.append("featuresCategory", options.featuresCategory);

        const response = await fetch(`/api/site-content?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch site content");
        }

        const data = await response.json();
        if (data.success) {
          setContent({
            settings: data.settings || {},
            contentBlocks: data.contentBlocks || {},
            featureToggles: data.featureToggles || {},
          });
        } else {
          throw new Error(data.error || "Failed to fetch site content");
        }
      } catch (err) {
        console.error("Error fetching site content:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [options.settingsCategory, options.contentCategory, options.featuresCategory]);

  return {
    ...content,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      // Re-trigger the effect
      setContent({
        settings: {},
        contentBlocks: {},
        featureToggles: {},
      });
    },
  };
}

/**
 * Custom hook for checking if a feature is enabled
 * @param {string} featureKey - The feature key to check
 * @returns {boolean} Whether the feature is enabled
 */
export function useFeatureToggle(featureKey) {
  const { featureToggles, loading } = useSiteContent();

  return {
    isEnabled: featureToggles[featureKey]?.isEnabled || false,
    loading,
    feature: featureToggles[featureKey] || null,
  };
}

/**
 * Custom hook for getting a specific setting
 * @param {string} key - The setting key
 * @param {any} defaultValue - Default value if setting not found
 * @returns {any} The setting value or default value
 */
export function useSetting(key, defaultValue = null) {
  const { settings, loading } = useSiteContent();

  return {
    value: settings[key] !== undefined ? settings[key] : defaultValue,
    loading,
    exists: settings[key] !== undefined,
  };
}

/**
 * Custom hook for getting a specific content block
 * @param {string} key - The content block key
 * @returns {Object|null} The content block or null if not found
 */
export function useContentBlock(key) {
  const { contentBlocks, loading } = useSiteContent();

  return {
    block: contentBlocks[key] || null,
    loading,
    exists: contentBlocks[key] !== undefined,
  };
}

/**
 * Custom hook for getting branding settings
 * @returns {Object} Branding settings
 */
export function useBranding() {
  return useSiteContent({ settingsCategory: "branding" });
}

/**
 * Custom hook for getting SEO settings
 * @returns {Object} SEO settings
 */
export function useSEO() {
  return useSiteContent({ settingsCategory: "seo" });
}

/**
 * Custom hook for getting contact settings
 * @returns {Object} Contact settings
 */
export function useContact() {
  return useSiteContent({ settingsCategory: "contact" });
}

/**
 * Custom hook for getting social media settings
 * @returns {Object} Social media settings
 */
export function useSocial() {
  return useSiteContent({ settingsCategory: "social" });
}

/**
 * Custom hook for checking maintenance mode
 * @returns {boolean} Whether maintenance mode is enabled
 */
export function useMaintenanceMode() {
  const { isEnabled } = useFeatureToggle("maintenanceMode");
  return isEnabled;
}
