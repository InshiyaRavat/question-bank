/**
 * Comprehensive validation utilities for announcement data
 */

export const ANNOUNCEMENT_CONSTANTS = {
  TYPES: ["info", "warning", "success", "error"],
  PRIORITIES: ["low", "medium", "high", "urgent"],
  TARGET_ROLES: ["all", "student", "admin"],
  MAX_TITLE_LENGTH: 200,
  MAX_CONTENT_LENGTH: 2000,
  MIN_TITLE_LENGTH: 3,
  MIN_CONTENT_LENGTH: 10,
};

export class AnnouncementValidationError extends Error {
  constructor(message, field = null, code = null) {
    super(message);
    this.name = "AnnouncementValidationError";
    this.field = field;
    this.code = code;
  }
}

/**
 * Validates announcement data
 * @param {Object} data - The announcement data to validate
 * @param {boolean} isUpdate - Whether this is an update operation (allows partial data)
 * @returns {Object} - Validated and sanitized data
 * @throws {AnnouncementValidationError} - If validation fails
 */
export function validateAnnouncementData(data, isUpdate = false) {
  const errors = [];
  const validated = {};

  // Title validation
  if (data.title !== undefined) {
    if (typeof data.title !== "string") {
      errors.push({ field: "title", message: "Title must be a string" });
    } else {
      const title = data.title.trim();
      if (!isUpdate && !title) {
        errors.push({ field: "title", message: "Title is required" });
      } else if (title && title.length < ANNOUNCEMENT_CONSTANTS.MIN_TITLE_LENGTH) {
        errors.push({
          field: "title",
          message: `Title must be at least ${ANNOUNCEMENT_CONSTANTS.MIN_TITLE_LENGTH} characters long`,
        });
      } else if (title.length > ANNOUNCEMENT_CONSTANTS.MAX_TITLE_LENGTH) {
        errors.push({
          field: "title",
          message: `Title must be less than ${ANNOUNCEMENT_CONSTANTS.MAX_TITLE_LENGTH} characters`,
        });
      } else {
        validated.title = title;
      }
    }
  } else if (!isUpdate) {
    errors.push({ field: "title", message: "Title is required" });
  }

  // Content validation
  if (data.content !== undefined) {
    if (typeof data.content !== "string") {
      errors.push({ field: "content", message: "Content must be a string" });
    } else {
      const content = data.content.trim();
      if (!isUpdate && !content) {
        errors.push({ field: "content", message: "Content is required" });
      } else if (content && content.length < ANNOUNCEMENT_CONSTANTS.MIN_CONTENT_LENGTH) {
        errors.push({
          field: "content",
          message: `Content must be at least ${ANNOUNCEMENT_CONSTANTS.MIN_CONTENT_LENGTH} characters long`,
        });
      } else if (content.length > ANNOUNCEMENT_CONSTANTS.MAX_CONTENT_LENGTH) {
        errors.push({
          field: "content",
          message: `Content must be less than ${ANNOUNCEMENT_CONSTANTS.MAX_CONTENT_LENGTH} characters`,
        });
      } else {
        validated.content = content;
      }
    }
  } else if (!isUpdate) {
    errors.push({ field: "content", message: "Content is required" });
  }

  // Type validation
  if (data.type !== undefined) {
    if (!ANNOUNCEMENT_CONSTANTS.TYPES.includes(data.type)) {
      errors.push({
        field: "type",
        message: `Type must be one of: ${ANNOUNCEMENT_CONSTANTS.TYPES.join(", ")}`,
      });
    } else {
      validated.type = data.type;
    }
  }

  // Priority validation
  if (data.priority !== undefined) {
    if (!ANNOUNCEMENT_CONSTANTS.PRIORITIES.includes(data.priority)) {
      errors.push({
        field: "priority",
        message: `Priority must be one of: ${ANNOUNCEMENT_CONSTANTS.PRIORITIES.join(", ")}`,
      });
    } else {
      validated.priority = data.priority;
    }
  }

  // Target role validation
  if (data.targetRole !== undefined) {
    if (!ANNOUNCEMENT_CONSTANTS.TARGET_ROLES.includes(data.targetRole)) {
      errors.push({
        field: "targetRole",
        message: `Target role must be one of: ${ANNOUNCEMENT_CONSTANTS.TARGET_ROLES.join(", ")}`,
      });
    } else {
      validated.targetRole = data.targetRole;
    }
  }

  // Boolean validations
  if (data.isActive !== undefined) {
    if (typeof data.isActive !== "boolean") {
      errors.push({ field: "isActive", message: "isActive must be a boolean" });
    } else {
      validated.isActive = data.isActive;
    }
  }

  // Date validations
  if (data.startDate !== undefined) {
    if (data.startDate === null) {
      validated.startDate = null;
    } else {
      const startDate = new Date(data.startDate);
      if (isNaN(startDate.getTime())) {
        errors.push({ field: "startDate", message: "Start date must be a valid date" });
      } else {
        validated.startDate = startDate;
      }
    }
  }

  if (data.endDate !== undefined) {
    if (data.endDate === null) {
      validated.endDate = null;
    } else {
      const endDate = new Date(data.endDate);
      if (isNaN(endDate.getTime())) {
        errors.push({ field: "endDate", message: "End date must be a valid date" });
      } else {
        validated.endDate = endDate;
      }
    }
  }

  // Cross-field validations
  if (validated.startDate && validated.endDate) {
    if (validated.startDate > validated.endDate) {
      errors.push({
        field: "endDate",
        message: "End date cannot be before start date",
      });
    }
  }

  // Check for past end dates (warning, not error)
  if (validated.endDate && validated.endDate < new Date()) {
    // This could be a warning instead of an error
    console.warn("Announcement end date is in the past");
  }

  if (errors.length > 0) {
    const error = new AnnouncementValidationError(
      `Validation failed: ${errors.map((e) => e.message).join(", ")}`,
      errors[0].field,
      "VALIDATION_ERROR"
    );
    error.errors = errors;
    throw error;
  }

  return validated;
}

/**
 * Validates query parameters for fetching announcements
 * @param {Object} query - The query parameters
 * @returns {Object} - Validated query parameters
 */
export function validateAnnouncementQuery(query) {
  const validated = {};

  if (query.type && ANNOUNCEMENT_CONSTANTS.TYPES.includes(query.type)) {
    validated.type = query.type;
  }

  if (query.priority && ANNOUNCEMENT_CONSTANTS.PRIORITIES.includes(query.priority)) {
    validated.priority = query.priority;
  }

  if (query.targetRole && ANNOUNCEMENT_CONSTANTS.TARGET_ROLES.includes(query.targetRole)) {
    validated.targetRole = query.targetRole;
  }

  if (query.isActive !== undefined) {
    validated.isActive = query.isActive === "true";
  }

  // Pagination
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 10, 100); // Max 100 items per page

  validated.page = Math.max(1, page);
  validated.limit = Math.max(1, limit);

  return validated;
}

/**
 * Sanitizes announcement data for safe storage/display
 * @param {Object} data - The data to sanitize
 * @returns {Object} - Sanitized data
 */
export function sanitizeAnnouncementData(data) {
  const sanitized = { ...data };

  // Basic HTML sanitization (remove script tags, etc.)
  if (sanitized.title) {
    sanitized.title = sanitized.title
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<[^>]*>/g, "") // Remove all HTML tags
      .trim();
  }

  if (sanitized.content) {
    sanitized.content = sanitized.content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .trim();
  }

  return sanitized;
}

/**
 * Checks if user has permission to perform action on announcement
 * @param {string} action - The action to perform (create, read, update, delete)
 * @param {Object} user - The user object with role information
 * @param {Object} announcement - The announcement object (for update/delete)
 * @returns {boolean} - Whether the user has permission
 */
export function checkAnnouncementPermission(action, user, announcement = null) {
  const userRole = user?.publicMetadata?.role || user?.metadata?.role || "student";

  switch (action) {
    case "create":
    case "update":
    case "delete":
      return userRole === "admin";

    case "read":
      if (!announcement) return true; // Anyone can read announcements list

      // Check target role
      if (announcement.targetRole === "all") return true;
      if (announcement.targetRole === userRole) return true;
      if (userRole === "admin") return true; // Admins can read everything

      return false;

    default:
      return false;
  }
}

/**
 * Formats validation errors for API responses
 * @param {AnnouncementValidationError} error - The validation error
 * @returns {Object} - Formatted error response
 */
export function formatValidationError(error) {
  if (error instanceof AnnouncementValidationError) {
    return {
      error: error.message,
      field: error.field,
      code: error.code,
      details: error.errors || [],
    };
  }

  return {
    error: "Validation failed",
    details: [],
  };
}
