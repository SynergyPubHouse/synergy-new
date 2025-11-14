/**
 * Utility functions for role checking and user data access
 * Provides consistent role checking across the application
 */

/**
 * Get the current user's role
 * @param {Object} user - User object from AuthContext
 * @returns {string|null} - Role string ('author', 'editor', 'reviewer') or null
 */
export const getUserRole = (user) => {
	if (!user) return null;
	
	// Check for editor role
	if (user.editor?.role === "editor") {
		return "editor";
	}
	
	// Check for reviewer role
	if (user.reviewer?.role === "reviewer") {
		return "reviewer";
	}
	
	// Default to author if user exists but no specific role
	if (user.token || user._id) {
		return "author";
	}
	
	return null;
};

/**
 * Check if user is an editor
 * @param {Object} user - User object from AuthContext
 * @returns {boolean}
 */
export const isEditor = (user) => {
	return getUserRole(user) === "editor";
};

/**
 * Check if user is a reviewer
 * @param {Object} user - User object from AuthContext
 * @returns {boolean}
 */
export const isReviewer = (user) => {
	return getUserRole(user) === "reviewer";
};

/**
 * Check if user is an author
 * @param {Object} user - User object from AuthContext
 * @returns {boolean}
 */
export const isAuthor = (user) => {
	return getUserRole(user) === "author";
};

/**
 * Get user's display name
 * @param {Object} user - User object from AuthContext
 * @returns {string} - Display name
 */
export const getUserDisplayName = (user) => {
	if (!user) return "Guest";
	
	// Try editor first
	if (user.editor) {
		return user.editor.firstName || user.editor.email || "Editor";
	}
	
	// Try reviewer
	if (user.reviewer) {
		return user.reviewer.firstName || user.reviewer.email || "Reviewer";
	}
	
	// Try author/user
	if (user.firstName) {
		return user.firstName;
	}
	
	if (user.email) {
		return user.email;
	}
	
	return "User";
};

/**
 * Get user's full name (including middle name if available)
 * @param {Object} user - User object from AuthContext
 * @returns {string} - Full name
 */
export const getUserFullName = (user) => {
	if (!user) return "Unknown";
	
	// Try editor first
	if (user.editor) {
		const { firstName, middleName, lastName } = user.editor;
		let fullName = firstName || "";
		if (middleName && middleName.trim() !== "") {
			fullName += ` ${middleName}`;
		}
		if (lastName) {
			fullName += ` ${lastName}`;
		}
		return fullName.trim() || "Editor";
	}
	
	// Try reviewer
	if (user.reviewer) {
		const { firstName, middleName, lastName } = user.reviewer;
		let fullName = firstName || "";
		if (middleName && middleName.trim() !== "") {
			fullName += ` ${middleName}`;
		}
		if (lastName) {
			fullName += ` ${lastName}`;
		}
		return fullName.trim() || "Reviewer";
	}
	
	// Try author/user
	const { firstName, middleName, lastName } = user;
	let fullName = firstName || "";
	if (middleName && middleName.trim() !== "") {
		fullName += ` ${middleName}`;
	}
	if (lastName) {
		fullName += ` ${lastName}`;
	}
	return fullName.trim() || "User";
};


