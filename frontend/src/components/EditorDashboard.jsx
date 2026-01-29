import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../App";
import axios from "axios";

import { exportNotesToWord } from '../components/exportNotesToWord.jsx';
import PdfUploadModal from '../components/PdfUploadModal';
// import { calcGeneratorDuration } from "framer-motion";
function EditorDashboard() {
	const { user } = useAuth();
	console.log("EditorDashboard user:", user);
	// Helper function to format full name including middle name if it exists
	const formatFullName = (user) => {
		if (!user) return "Unknown";

		const { firstName, middleName, lastName } = user;
		let fullName = firstName || "";

		if (middleName && middleName.trim() !== "") {
			fullName += ` ${middleName}`;
		}

		if (lastName) {
			fullName += ` ${lastName}`;
		}

		return fullName.trim() || "Unknown";
	};

	const [users, setUsers] = useState([]);
	const [selectedUser, setSelectedUser] = useState(null);
	const [manuscripts, setManuscripts] = useState([]);
	const [forceRender, setForceRender] = useState(false);
	const [noteText, setNoteText] = useState("");
	const [revisionNoteText, setRevisionNoteText] = useState("");
	const [selectedManuscript, setSelectedManuscript] = useState(null);
	const [showNoteInput, setShowNoteInput] = useState(null); // 'reject' or 'revision' or null
	const [reviewers, setReviewers] = useState([]);
	const [showAcceptDialog, setShowAcceptDialog] = useState(null);
	const [acceptanceNote, setAcceptanceNote] = useState("");
	const [selectedManuscriptIds, setSelectedManuscriptIds] = useState([]);
	const [showBulkActions, setShowBulkActions] = useState(false);
	const [expandedNotes, setExpandedNotes] = useState({});
	const [showInviteDialog, setShowInviteDialog] = useState(false);
	const [inviteEmails, setInviteEmails] = useState([""]);
	const [inviteManuscript, setInviteManuscript] = useState(null);
	const [editorNote, setEditorNote] = useState("");
	const [isSendingInvitations, setIsSendingInvitations] = useState(false);
	const [filterType, setFilterType] = useState("all"); // "all", "status", "activity"
	const [filterValue, setFilterValue] = useState(""); // The specific status or activity to filter by
	const [showPdfUploadDialog, setShowPdfUploadDialog] = useState(false);
	const [uploadManuscript, setUploadManuscript] = useState(null);
	// Statistics Modal States
	const [showStatisticsModal, setShowStatisticsModal] = useState(false);
	const [statisticsDateRange, setStatisticsDateRange] = useState({
		startDate: "",
		endDate: "",
	});
	const [statisticsData, setStatisticsData] = useState(null);
	// Simple toast system to replace browser alerts
	const [toasts, setToasts] = useState([]);

	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleteManuscript, setDeleteManuscript] = useState(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const addToast = (message, type = "info", duration = 6000) => {
		const id = Date.now() + Math.random();
		setToasts((prev) => [...prev, { id, message, type }]);
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, duration);
	};

	const removeToast = (id) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	};

	// Fetch users with manuscripts
	const fetchUsers = useCallback(async () => {
		try {
			if (!user?.token) {
				console.error("No user token found");
				return;
			}
			console.log("Fetching users...");
			const response = await axios.get(
				`${import.meta.env.VITE_BACKEND_URL}/api/auth/editor/users-with-manuscripts`,
				{
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				}
			);
			console.log("=== Fetch Users Debug ===");
			console.log("API Response:", response.data);

			const processedUsers = (response.data || []).map((userRecord) => {
				const authorName = formatFullName(userRecord);
				console.log(`Processing user: ${authorName} (${userRecord._id})`);
				console.log(`Raw manuscripts count: ${userRecord.manuscripts?.length || 0}`);
				console.log(`Raw manuscripts:`, userRecord.manuscripts);

				const manuscriptsWithAuthor = (userRecord.manuscripts || []).map(
					(manuscript) => ({
						...manuscript,
						authorName: manuscript.authorName || authorName,
					})
				);

				console.log(`Processed manuscripts count: ${manuscriptsWithAuthor.length}`);
				console.log(`Processed manuscripts:`, manuscriptsWithAuthor);

				// Sort manuscripts for this author: newest submissions first
				manuscriptsWithAuthor.sort((a, b) => {
					const dateB =
						new Date(b.submissionDate || b.createdAt || b.updatedAt || 0).getTime();
					const dateA =
						new Date(a.submissionDate || a.createdAt || a.updatedAt || 0).getTime();
					return dateB - dateA;
				});

				const processedUser = {
					...userRecord,
					authorName,
					manuscripts: manuscriptsWithAuthor,
				};

				console.log(`Final processed user:`, processedUser);
				return processedUser;
			});

			console.log("=== All Processed Users ===");
			processedUsers.forEach(user => {
				console.log(`User: ${user.authorName} - Manuscripts: ${user.manuscripts.length}`);
				user.manuscripts.forEach(manuscript => {
					console.log(`  - ${manuscript.customId || manuscript.title} (${manuscript.status})`);
				});
			});

			setUsers(processedUsers);
			// When showing all manuscripts, also sort newest-first globally
			const allManuscripts = processedUsers
				.flatMap((user) => user.manuscripts || [])
				.sort((a, b) => {
					const dateB =
						new Date(b.submissionDate || b.createdAt || b.updatedAt || 0).getTime();
					const dateA =
						new Date(a.submissionDate || a.createdAt || a.updatedAt || 0).getTime();
					return dateB - dateA;
				});
			setManuscripts(allManuscripts);
		} catch (error) {
			console.error("Error fetching users:", error);
			if (error.response?.status === 401) {
				addToast("Session expired. Please login again.", "error");
				localStorage.removeItem("user");
				window.location.href = "/login";
			}
		}
	}, [user]);

	// Fetch reviewers
	const fetchReviewers = useCallback(async () => {
		try {
			if (!user?.token) {
				console.error("No user token found");
				return;
			}

			console.log("Fetching reviewers with token:", user.token); // Debug log
			const response = await axios.get(
				`${import.meta.env.VITE_BACKEND_URL}/api/auth/editor/reviewers`,
				{
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				}
			);
			console.log("Reviewers fetched successfully:", response.data);
			setReviewers(response.data);
		} catch (error) {
			console.error("Error fetching reviewers:", error.response?.data || error.message);
			if (error.response?.status === 401) {
				addToast("Session expired. Please login again.", "error");
				localStorage.removeItem("user");
				window.location.href = "/login";
			}
		}
	}, [user]);

	useEffect(() => {
		fetchUsers();
		fetchReviewers();
	}, [user, fetchUsers, fetchReviewers]);

	// Handle user click to fetch manuscripts
	const handleUserClick = async (author) => {
		console.log("=== Editor Dashboard Debug ===");
		console.log("Clicked author:", author);
		console.log("Author manuscripts count:", author.manuscripts?.length || 0);
		console.log("Author manuscripts:", author.manuscripts);

		setSelectedUser(author);
		try {
			if (!user?.token) {
				// If no token, use cached manuscripts
				console.log("No token found, using cached manuscripts");
				setManuscripts(author.manuscripts || []);
			} else {
				// Fetch fresh data from API
				console.log("Fetching from API for author ID:", author._id);
				const response = await axios.get(
					`${import.meta.env.VITE_BACKEND_URL}/api/auth/editor/manuscripts/${author._id}`,
					{
						headers: { Authorization: `Bearer ${user.token}` },
					}
				);
				// If API returns data, use it; otherwise fallback to cached data
				const apiManuscripts = response.data || [];
				console.log("API response manuscripts count:", apiManuscripts.length);
				console.log("API response manuscripts:", apiManuscripts);

				if (apiManuscripts.length > 0) {
					setManuscripts(apiManuscripts);
					console.log("Using API data");
				} else {
					setManuscripts(author.manuscripts || []);
					console.log("Using cached data - API returned empty");
				}
			}
		} catch (err) {
			console.error("Error fetching manuscripts for author:", err);
			console.error("Error details:", err.response?.data || err.message);
			// Fallback to cached manuscripts
			setManuscripts(author.manuscripts || []);
			console.log("Using cached data due to error");
		}

		// Clear filters and selections
		setFilterType("all");
		setFilterValue("");
		setSelectedManuscriptIds([]);
		setShowBulkActions(false);

		// Force re-render by updating a dummy state
		setForceRender(prev => !prev);

		console.log("=== End Debug ===");
	};

	// Handle showing all manuscripts (clear user selection)
	const handleShowAllManuscripts = () => {
		setSelectedUser(null);
		const allManuscripts = users.flatMap(user => user.manuscripts || []);
		setManuscripts(allManuscripts);
		// Clear any active filters
		setFilterType("all");
		setFilterValue("");
		// Clear bulk selections
		setSelectedManuscriptIds([]);
		setShowBulkActions(false);
	};

	// Handle manuscript click to open PDF
	const handleManuscriptClick = (manuscript) => {
		console.log("Manuscript data:", manuscript);

		if (!manuscript?.mergedFileUrl) {
			console.error("No mergedFileUrl found in manuscript:", manuscript);
			addToast("PDF URL not available", "error");
			return;
		}

		// Ensure the URL is properly formatted
		const fullUrl = manuscript.mergedFileUrl.startsWith("http")
			? manuscript.mergedFileUrl
			: `${import.meta.env.VITE_BACKEND_URL}${manuscript.mergedFileUrl}`;

		console.log("Opening PDF at:", fullUrl);
		window.open(fullUrl, "_blank");
	};

	const handleStatusUpdate = async (manuscriptId, newStatus) => {
		try {
			// Create note object only if there's text
			if (noteText.trim()) {
				const noteData = {
					text: noteText,
					action: newStatus,
					visibility: ["editor", "reviewer"], // Make note visible to both editors and reviewers
				};

				// Add the note first
				await axios.post(
					`${import.meta.env.VITE_BACKEND_URL
					}/api/auth/editor/manuscripts/${manuscriptId}/notes`,
					noteData,
					{
						headers: {
							Authorization: `Bearer ${user.token}`,
						},
					}
				);
			}

			// Update the status
			const response = await axios.patch(
				`${import.meta.env.VITE_BACKEND_URL
				}/api/auth/editor/manuscripts/${manuscriptId}/status`,
				{ status: newStatus },
				{
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				}
			);

			const updatedData = response.data?.manuscript;

			// Update manuscripts list with new status
			const updatedManuscripts = manuscripts.map((m) =>
				m._id === manuscriptId
					? {
						...m,
						status: updatedData?.status || newStatus,
						revisionLocked:
							typeof updatedData?.revisionLocked === "boolean"
								? updatedData.revisionLocked
								: m.revisionLocked,
						revisionAttempts:
							updatedData?.revisionAttempts ?? m.revisionAttempts,
						maxRevisionAttempts:
							updatedData?.maxRevisionAttempts ?? m.maxRevisionAttempts,
					}
					: m
			);
			setManuscripts(updatedManuscripts);

			// Reset states
			setNoteText("");
			setShowNoteInput(null);
			setSelectedManuscript(null);

			addToast(
				newStatus === "Rejected"
					? "Manuscript rejected successfully"
					: `Manuscript status updated to "${newStatus}" successfully`,
				"success"
			);

			// Refresh data from server to ensure UI matches backend
			try {
				await fetchUsers();
			} catch (e) {
				console.warn("Failed to refresh manuscripts after status update:", e);
			}
		} catch (error) {
			console.error("Error updating manuscript:", error);

			// Check for specific error about rejected manuscripts
			if (
				error.response?.status === 403 &&
				error.response?.data?.message?.includes("rejected")
			) {
				addToast(
					"Cannot modify status of a rejected manuscript. Rejected manuscripts are immutable.",
					"error"
				);
			} else {
				addToast("Failed to update manuscript", "error");
			}
		}
	};

	const handleActionClick = async (manuscript, action) => {
		try {
			console.log("1. handleActionClick called:", { manuscript, action });

			// Reset states first
			setSelectedManuscript(null);
			setShowNoteInput(null);
			setNoteText("");

			// Small delay to ensure state reset
			await new Promise((resolve) => setTimeout(resolve, 0));

			// Then set new states
			console.log(
				"2. Setting new states for manuscript:",
				manuscript._id
			);
			setSelectedManuscript(manuscript);
			setShowNoteInput(action);

			console.log("3. States being updated:", {
				manuscriptId: manuscript._id,
				action,
				reviewersAvailable: reviewers.length,
			});
		} catch (error) {
			console.error("Error in handleActionClick:", error);
		}
	};

	// Handle direct status updates without notes or reviewers
	const handleDirectStatusUpdate = async (manuscriptId, newStatus) => {
		try {
			console.log(
				`Updating manuscript ${manuscriptId} to status: ${newStatus}`
			);

			const response = await axios.patch(
				`${import.meta.env.VITE_BACKEND_URL
				}/api/auth/editor/manuscripts/${manuscriptId}/status`,
				{ status: newStatus },
				{
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				}
			);

			const updatedData = response.data?.manuscript;

			// Update local state
			const updatedManuscripts = manuscripts.map((m) =>
				m._id === manuscriptId
					? {
						...m,
						status: updatedData?.status || newStatus,
						revisionLocked:
							typeof updatedData?.revisionLocked === "boolean"
								? updatedData.revisionLocked
								: m.revisionLocked,
						revisionAttempts:
							updatedData?.revisionAttempts ??
							m.revisionAttempts,
						maxRevisionAttempts:
							updatedData?.maxRevisionAttempts ??
							m.maxRevisionAttempts,
					}
					: m
			);
			setManuscripts(updatedManuscripts);

			addToast(
				response.data?.message ||
				`Manuscript status updated to "${newStatus}" successfully!`,
				"success"
			);

			// Refresh manuscript list
			try {
				await fetchUsers();
			} catch (e) {
				console.warn("Failed to refresh manuscripts after direct status update:", e);
			}
		} catch (error) {
			console.error("Error updating manuscript status:", error);

			// Check for specific error about rejected manuscripts
			if (
				error.response?.status === 403 &&
				error.response?.data?.message?.includes("rejected")
			) {
				addToast(
					"Cannot modify status of a rejected manuscript. Rejected manuscripts are immutable.",
					"error"
				);
			} else {
				addToast(`Failed to update manuscript status to "${newStatus}"`, "error");
			}
		}
	};

	// Handle bulk status updates
	const handleBulkStatusUpdate = async (
		manuscriptIds,
		newStatus,
		note = ""
	) => {
		try {
			console.log(
				`Bulk updating ${manuscriptIds.length} manuscripts to status: ${newStatus}`
			);

			await axios.patch(
				`${import.meta.env.VITE_BACKEND_URL
				}/api/auth/editor/manuscripts/bulk-update-status`,
				{
					manuscriptIds,
					status: newStatus,
					note,
				},
				{
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				}
			);

			// Update local state
			const updatedManuscripts = manuscripts.map((m) =>
				manuscriptIds.includes(m._id) ? { ...m, status: newStatus } : m
			);
			setManuscripts(updatedManuscripts);

			// Clear selections
			setSelectedManuscriptIds([]);
			setShowBulkActions(false);

			addToast(`${manuscriptIds.length} manuscripts updated to "${newStatus}" successfully!`, "success");

			// Refresh manuscript list
			try {
				await fetchUsers();
			} catch (e) {
				console.warn("Failed to refresh manuscripts after bulk update:", e);
			}
		} catch (error) {
			console.error("Error bulk updating manuscript status:", error);

			// Check for specific error about rejected manuscripts
			if (
				error.response?.status === 403 ||
				error.response?.data?.message?.includes("rejected")
			) {
				addToast(
					"Some manuscripts could not be updated because they are rejected. Rejected manuscripts cannot be modified.",
					"error"
				);
			} else {
				addToast(`Failed to bulk update manuscripts to "${newStatus}"`, "error");
			}
		}
	};

	// Toggle manuscript selection for bulk actions
	const toggleManuscriptSelection = (manuscriptId) => {
		setSelectedManuscriptIds((prev) =>
			prev.includes(manuscriptId)
				? prev.filter((id) => id !== manuscriptId)
				: [...prev, manuscriptId]
		);
	};

	// Handle revision required
	const handleRevisionRequired = async (manuscriptId) => {
		try {
			if (!revisionNoteText.trim()) {
				addToast("Please enter a revision note", "error");
				return;
			}

			const response = await axios.post(
				`${import.meta.env.VITE_BACKEND_URL
				}/api/auth/editor/manuscripts/${manuscriptId}/revision-required`,
				{ text: revisionNoteText },
				{
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				}
			);

			const updatedData = response.data?.manuscript;

			// Update manuscripts list with new status/info
			const updatedManuscripts = manuscripts.map((m) =>
				m._id === manuscriptId
					? {
						...m,
						status: updatedData?.status || "Revision Required",
						revisionAttempts:
							updatedData?.revisionAttempts ??
							m.revisionAttempts,
						maxRevisionAttempts:
							updatedData?.maxRevisionAttempts ??
							m.maxRevisionAttempts,
						revisionLocked:
							typeof updatedData?.revisionLocked === "boolean"
								? updatedData.revisionLocked
								: m.revisionLocked,
					}
					: m
			);
			setManuscripts(updatedManuscripts);

			// Reset states
			setRevisionNoteText("");
			setShowNoteInput(null);
			setSelectedManuscript(null);

			addToast(response.data?.message || "Revision required note added successfully", "success");

			// Refresh manuscript list
			try {
				await fetchUsers();
			} catch (e) {
				console.warn("Failed to refresh manuscripts after revision required:", e);
			}
		} catch (error) {
			console.error("Error adding revision required note:", error);

			// Check for specific error about rejected manuscripts
			const errorMessage =
				error.response?.data?.message ||
				"Failed to add revision required note";
			addToast(errorMessage, "error");
		}
	};

	const handleCancel = () => {
		setShowNoteInput(null);
		setSelectedManuscript(null);
		setNoteText("");
		setRevisionNoteText("");
	};

	const handleAcceptClick = (manuscript) => {
		setSelectedManuscript(manuscript);
		setShowAcceptDialog(true);
	};

	const handleAcceptManuscript = async () => {
		try {
			// Use the editor controller endpoint that properly handles notes
			await axios.patch(
				`${import.meta.env.VITE_BACKEND_URL
				}/api/auth/editor/manuscripts/${selectedManuscript._id}/status`,
				{
					status: "Accepted",
					note: acceptanceNote.trim() || undefined, // Only send note if there's content
				},
				{
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				}
			);

			// Update local state
			const updatedManuscripts = manuscripts.map((m) =>
				m._id === selectedManuscript._id
					? { ...m, status: "Accepted" }
					: m
			);
			setManuscripts(updatedManuscripts);

			// Reset state
			setShowAcceptDialog(false);
			setSelectedManuscript(null);
			setAcceptanceNote("");
			addToast("Manuscript accepted successfully!", "success");

			// Refresh manuscript list
			try {
				await fetchUsers();
			} catch (e) {
				console.warn("Failed to refresh manuscripts after accept:", e);
			}
		} catch (error) {
			console.error("Error accepting manuscript:", error);
			addToast("Failed to accept manuscript", "error");
		}
	};

	// Handle invite reviewers click
	const handleInviteReviewers = (manuscript) => {
		setInviteManuscript(manuscript);
		setShowInviteDialog(true);
		setInviteEmails([""]);
		setEditorNote("");
	};

	// Handle send invitations
	const handleSendInvitations = async () => {
		setIsSendingInvitations(true);
		try {
			const emailArray = inviteEmails
				.map((email) => email.trim())
				.filter((email) => email.length > 0);

			// Validation 1: Empty check
			if (emailArray.length === 0) {
				addToast("Please enter at least one email address", "error");
				setIsSendingInvitations(false);
				return;
			}

			// Validation 2: Email format
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			const invalidEmails = emailArray.filter(
				(email) => !emailRegex.test(email)
			);

			if (invalidEmails.length > 0) {
				addToast(
					`Invalid email addresses: ${invalidEmails.join(", ")}`,
					"error"
				);
				setIsSendingInvitations(false);
				return;
			}

			// Validation 3: Duplicate emails in input
			const hasDuplicates = (emails) => {
				const lowercased = emails.map(e => e.toLowerCase());
				return new Set(lowercased).size !== lowercased.length;
			};

			if (hasDuplicates(emailArray)) {
				const getDuplicates = (emails) => {
					const lowercased = emails.map(e => e.toLowerCase());
					const seen = new Set();
					const duplicates = new Set();

					lowercased.forEach(email => {
						if (seen.has(email)) duplicates.add(email);
						seen.add(email);
					});

					return Array.from(duplicates);
				};

				addToast(
					`Duplicate emails found: ${getDuplicates(emailArray).join(", ")}. Please remove duplicates.`,
					"error"
				);
				setIsSendingInvitations(false);
				return;
			}

			// Validation 4: Already invited check
			const alreadyInvited = emailArray.filter((email) =>
				inviteManuscript.invitations?.some(
					(inv) => inv.email.toLowerCase() === email.toLowerCase()
				)
			);

			if (alreadyInvited.length > 0) {
				addToast(
					`Following reviewers are already invited: ${alreadyInvited.join(", ")}`,
					"error"
				);
				setIsSendingInvitations(false);
				return;
			}

			// Rest of your API call...
			const requestData = {
				emails: emailArray,
			};

			if (editorNote.trim()) {
				requestData.editorNote = editorNote.trim();
				requestData.id = user._id;
				requestData.fullName = formatFullName(user);
				requestData.edittorEmail = user.email;
			}

			await axios.post(
				`${import.meta.env.VITE_BACKEND_URL}/api/auth/editor/manuscripts/${inviteManuscript._id}/invite-reviewers`,
				requestData,
				{
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				}
			);

			addToast(
				`Invitations sent successfully to ${emailArray.length} reviewers!`,
				"success"
			);
			setShowInviteDialog(false);
			setInviteEmails([""]);
			setEditorNote("");
			setInviteManuscript(null);

			await fetchUsers();
			setForceRender(prev => !prev);
		} catch (error) {
			console.error("Error sending invitations:", error);
			addToast("Failed to send invitations", "error");
		} finally {
			setIsSendingInvitations(false);
		}
	};

	// Add a new email input field
	const addEmailField = () => {
		setInviteEmails([...inviteEmails, ""]);
	};

	// Remove an email input field
	const removeEmailField = (index) => {
		if (inviteEmails.length > 1) {
			const newEmails = inviteEmails.filter((_, i) => i !== index);
			setInviteEmails(newEmails);
		}
	};

	// Update email at specific index
	const updateEmailField = (index, value) => {
		const newEmails = [...inviteEmails];
		newEmails[index] = value;
		setInviteEmails(newEmails);
	};

	// Bulk add emails from text input
	const handleBulkEmailAdd = () => {
		const bulkText = prompt(
			"Paste multiple email addresses (separated by commas, semicolons, or new lines):"
		);
		if (bulkText && bulkText.trim()) {
			const newEmails = bulkText
				.split(/[,;\n]+/)
				.map((email) => email.trim())
				.filter((email) => email.length > 0);

			if (newEmails.length > 0) {
				// Remove any empty email fields and add the new ones
				const currentEmails = inviteEmails.filter(
					(email) => email.trim().length > 0
				);
				setInviteEmails([...currentEmails, ...newEmails]);
			}
		}
	};

	// Clear all email fields
	const clearAllEmails = () => {
		setInviteEmails([""]);
	};

	// Filter manuscripts based on current filter
	const getFilteredManuscripts = useCallback(() => {
		// If no user is selected, show all manuscripts from all users
		const allManuscripts = selectedUser
			? manuscripts
			: users.flatMap(user => user.manuscripts || []);

		console.log("=== getFilteredManuscripts Debug ===");
		console.log("selectedUser:", selectedUser?.firstName || 'None');
		console.log("manuscripts state length:", manuscripts.length);
		console.log("allManuscripts length:", allManuscripts.length);
		console.log("filterType:", filterType);
		console.log("filterValue:", filterValue);

		if (filterType === "all") {
			console.log("Returning all manuscripts:", allManuscripts.length);
			return allManuscripts;
		}

		if (filterType === "status") {
			return allManuscripts.filter(
				(manuscript) => manuscript.status === filterValue
			);
		}

		if (filterType === "activity") {
			const today = new Date();
			const weekAgo = new Date();
			weekAgo.setDate(weekAgo.getDate() - 7);

			switch (filterValue) {
				case "todaySubmissions":
					return allManuscripts.filter((manuscript) => {
						if (!manuscript.submissionDate) return false;
						const submissionDate = new Date(
							manuscript.submissionDate
						);
						return (
							submissionDate.toDateString() ===
							today.toDateString()
						);
					});
				case "weeklyUpdates":
					return allManuscripts.filter((manuscript) => {
						if (!manuscript.updatedAt) return false;
						const updatedDate = new Date(manuscript.updatedAt);
						return updatedDate >= weekAgo;
					});
				case "pendingAction":
					return allManuscripts.filter(
						(manuscript) =>
							manuscript.status === "Pending" ||
							manuscript.status === "Reviewed" ||
							manuscript.status === "Revision Required"
					);
				default:
					return allManuscripts;
			}
		}

		return allManuscripts;
	}, [selectedUser, manuscripts, users, filterType, filterValue, forceRender]);

	// Handle filter clicks
	const handleStatusFilter = (status) => {
		setFilterType("status");
		setFilterValue(status);
	};

	const handleActivityFilter = (activity) => {
		setFilterType("activity");
		setFilterValue(activity);
	};

	const clearFilter = () => {
		setFilterType("all");
		setFilterValue("");
	};



	// Calculate Statistics based on date range
	const calculateStatistics = useCallback(() => {
		const allManuscripts = users.flatMap((user) => user.manuscripts || []);

		let filteredManuscripts = allManuscripts;

		// Apply date filter if dates are selected
		if (statisticsDateRange.startDate && statisticsDateRange.endDate) {
			const startDate = new Date(statisticsDateRange.startDate);
			startDate.setHours(0, 0, 0, 0);

			const endDate = new Date(statisticsDateRange.endDate);
			endDate.setHours(23, 59, 59, 999);

			filteredManuscripts = allManuscripts.filter((manuscript) => {
				const manuscriptDate = new Date(manuscript.submissionDate || manuscript.createdAt);
				return manuscriptDate >= startDate && manuscriptDate <= endDate;
			});
		}

		// Calculate status counts
		const statusCounts = filteredManuscripts.reduce((acc, manuscript) => {
			acc[manuscript.status] = (acc[manuscript.status] || 0) + 1;
			return acc;
		}, {});

		// Calculate type counts
		const typeCounts = filteredManuscripts.reduce((acc, manuscript) => {
			const type = manuscript.type || "Unknown";
			acc[type] = (acc[type] || 0) + 1;
			return acc;
		}, {});

		// Calculate monthly submissions
		const monthlySubmissions = filteredManuscripts.reduce((acc, manuscript) => {
			const date = new Date(manuscript.submissionDate || manuscript.createdAt);
			const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
			acc[monthYear] = (acc[monthYear] || 0) + 1;
			return acc;
		}, {});

		// Calculate author statistics
		const authorStats = filteredManuscripts.reduce((acc, manuscript) => {
			const authorName = manuscript.authorName || "Unknown";
			if (!acc[authorName]) {
				acc[authorName] = { total: 0, accepted: 0, rejected: 0, pending: 0 };
			}
			acc[authorName].total += 1;
			if (manuscript.status === "Accepted" || manuscript.status === "Published") {
				acc[authorName].accepted += 1;
			} else if (manuscript.status === "Rejected") {
				acc[authorName].rejected += 1;
			} else {
				acc[authorName].pending += 1;
			}
			return acc;
		}, {});

		// Calculate average processing time (for accepted/rejected manuscripts)
		const processedManuscripts = filteredManuscripts.filter(
			(m) => m.status === "Accepted" || m.status === "Rejected" || m.status === "Published"
		);

		let avgProcessingDays = 0;
		if (processedManuscripts.length > 0) {
			const totalDays = processedManuscripts.reduce((sum, m) => {
				const start = new Date(m.submissionDate || m.createdAt);
				const end = new Date(m.updatedAt);
				const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
				return sum + days;
			}, 0);
			avgProcessingDays = Math.round(totalDays / processedManuscripts.length);
		}

		// Revision statistics
		const revisionStats = filteredManuscripts.reduce((acc, manuscript) => {
			if (manuscript.revisionAttempts > 0) {
				acc.totalRevisions += manuscript.revisionAttempts;
				acc.manuscriptsWithRevisions += 1;
			}
			return acc;
		}, { totalRevisions: 0, manuscriptsWithRevisions: 0 });

		// Daily submissions for the selected range
		const dailySubmissions = filteredManuscripts.reduce((acc, manuscript) => {
			const date = new Date(manuscript.submissionDate || manuscript.createdAt);
			const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
			acc[dateStr] = (acc[dateStr] || 0) + 1;
			return acc;
		}, {});

		setStatisticsData({
			totalManuscripts: filteredManuscripts.length,
			statusCounts,
			typeCounts,
			monthlySubmissions,
			authorStats,
			avgProcessingDays,
			revisionStats,
			dailySubmissions,
			filteredManuscripts, // For detailed table
			dateRange: {
				start: statisticsDateRange.startDate,
				end: statisticsDateRange.endDate,
			},
		});
	}, [users, statisticsDateRange]);

	// Open statistics modal
	const handleOpenStatistics = () => {
		// Set default date range (last 30 days)
		const today = new Date();
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		setStatisticsDateRange({
			startDate: thirtyDaysAgo.toISOString().split('T')[0],
			endDate: today.toISOString().split('T')[0],
		});

		setShowStatisticsModal(true);
	};

	// Effect to recalculate when date range changes
	useEffect(() => {
		if (showStatisticsModal) {
			calculateStatistics();
		}
	}, [showStatisticsModal, statisticsDateRange, calculateStatistics]);



	const handleDeleteClick = (manuscript) => {
		setDeleteManuscript(manuscript);
		setShowDeleteConfirm(true);
	};

	const handleConfirmDelete = async () => {
		if (!deleteManuscript) return;

		setIsDeleting(true);
		try {
			await axios.delete(
				`${import.meta.env.VITE_BACKEND_URL}/api/${deleteManuscript._id}`,
				{
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				}
			);

			// Update local state - remove deleted manuscript
			setManuscripts((prev) => prev.filter((m) => m._id !== deleteManuscript._id));

			// Also update users state
			setUsers((prevUsers) =>
				prevUsers.map((u) => ({
					...u,
					manuscripts: (u.manuscripts || []).filter((m) => m._id !== deleteManuscript._id),
				}))
			);

			addToast(`Manuscript "${deleteManuscript.title}" deleted successfully!`, "success");

			// Reset states
			setShowDeleteConfirm(false);
			setDeleteManuscript(null);

			// Refresh data
			await fetchUsers();

		} catch (error) {
			console.error("Error deleting manuscript:", error);
			addToast(
				error.response?.data?.message || "Failed to delete manuscript",
				"error"
			);
		} finally {
			setIsDeleting(false);
		}
	};

	const handleCancelDelete = () => {
		setShowDeleteConfirm(false);
		setDeleteManuscript(null);
	}

	return (
		<div className="min-h-screen bg-[#f8fafc] p-6">
			{/* Toast container */}
			<div className="fixed top-4 right-4 z-50 flex flex-col space-y-2">
				{toasts.map((t) => (
					<div
						key={t.id}
						onClick={() => removeToast(t.id)}
						className={`max-w-sm px-4 py-2 rounded shadow cursor-pointer transform transition-all duration-150 hover:scale-105 break-words ${t.type === "success"
							? "bg-green-500 text-white"
							: t.type === "error"
								? "bg-red-500 text-white"
								: "bg-gray-800 text-white"
							}`}
					>
						{t.message}
					</div>
				))}
			</div>
			<div className="max-w-6xl mx-auto">
				<h1 className="text-4xl font-bold text-[#496580] mb-8 text-center">
					Editor Dashboard
				</h1>

				{!user?.token && (
					<div className="text-red-500 text-center mb-4">
						Not authenticated. Please login again.
					</div>
				)}

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{/* Status Overview */}
					<div className="bg-white rounded-lg p-6 shadow-md border border-[#e2e8f0] md:col-span-3 mb-6">
						<h2 className="text-2xl font-semibold text-[#496580] mb-4">
							📊 Manuscript Status Overview
						</h2>

					<div className="flex items-center gap-4">
    {/* View Statistics Button */}
    <button
        onClick={handleOpenStatistics}
        className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-md flex items-center space-x-2 font-medium"
    >
        <span className="text-lg">Chart</span>
        <span>View Statistics</span>
    </button>

    {/* Current Issue Button - Only show if any article is Published */}
    {users.flatMap(u => u.manuscripts || []).some(m => m.status === "Published") && (
        <a
            href="/journal/jics/articles/current"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 shadow-md flex items-center space-x-2 font-medium"
        >
            <span className="text-lg">Journal</span>
            <span>Current Issue</span>
        </a>
    )}
</div>
						{/* <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
							<p className="text-sm text-yellow-800">
								<strong>📝 Note:</strong> Rejected manuscripts
								are not displayed in the editor dashboard. Once
								a manuscript is rejected, its status becomes
								immutable and it&apos;s removed from editor
								view.
							</p>
						</div> */}
						{(() => {
							// Calculate status counts from all users' manuscripts
							// Note: Rejected manuscripts are not fetched for editors, so they won't appear in counts
							const allManuscripts = users.flatMap(
								(user) => user.manuscripts || []
							);
							const statusCounts = allManuscripts.reduce(
								(acc, manuscript) => {
									acc[manuscript.status] =
										(acc[manuscript.status] || 0) + 1;
									return acc;
								},
								{}
							);

							// Only show statuses that editors can see (excluding Rejected)
							const statusOrder = [
								"Pending",
								"Under Review",
								"Reviewed",
								"Revision Required",
								"Accepted",
								"Rejected",
								"Published",
							];
							const statusColors = {
								Pending: "bg-blue-500",
								"Under Review": "bg-yellow-500",
								Reviewed: "bg-purple-500",
								"Revision Required": "bg-orange-500",
								Accepted: "bg-green-500",
								Rejected: "bg-red-500",
								Published: "bg-teal-600",
							};

							return (
								<div>
									<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 mt-6">
										{statusOrder.map((status) => (
											<button
												key={status}
												onClick={() =>
													handleStatusFilter(status)
												}
												className={`${statusColors[status]
													} text-white p-4 rounded-lg text-center transition-all duration-200 transform hover:scale-105 hover:shadow-lg cursor-pointer ${filterType === "status" &&
														filterValue === status
														? "ring-4 ring-white ring-opacity-50 shadow-xl"
														: ""
													}`}
											>
												<div className="text-2xl font-bold">
													{statusCounts[status] || 0}
												</div>
												<div className="text-sm">
													{status}
												</div>
												{filterType === "status" &&
													filterValue === status && (
														<div className="text-xs mt-1 opacity-90">
															📌 Filtered
														</div>
													)}
											</button>
										))}
									</div>

									{/* Recent Activity Summary */}
									<div className="bg-gray-50 p-4 rounded-lg border">
										<h3 className="text-lg font-semibold text-gray-700 mb-3">
											⏰ Recent Activity
										</h3>
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
											<button
												onClick={() =>
													handleActivityFilter(
														"todaySubmissions"
													)
												}
												className={`bg-white p-3 rounded border transition-all duration-200 hover:shadow-md hover:bg-blue-50 text-left ${filterType === "activity" &&
													filterValue ===
													"todaySubmissions"
													? "ring-2 ring-blue-400 bg-blue-50 shadow-md"
													: ""
													}`}
											>
												<div className="font-semibold text-blue-600">
													📥 Today&apos;s Submissions
													{filterType ===
														"activity" &&
														filterValue ===
														"todaySubmissions" && (
															<span className="ml-2 text-xs">
																📌
															</span>
														)}
												</div>
												<div className="text-lg font-bold">
													{
														allManuscripts.filter(
															(m) => {
																const today =
																	new Date();
																const submissionDate =
																	new Date(
																		m.submissionDate
																	);
																return (
																	submissionDate.toDateString() ===
																	today.toDateString()
																);
															}
														).length
													}
												</div>
											</button>
											<button
												onClick={() =>
													handleActivityFilter(
														"weeklyUpdates"
													)
												}
												className={`bg-white p-3 rounded border transition-all duration-200 hover:shadow-md hover:bg-yellow-50 text-left ${filterType === "activity" &&
													filterValue ===
													"weeklyUpdates"
													? "ring-2 ring-yellow-400 bg-yellow-50 shadow-md"
													: ""
													}`}
											>
												<div className="font-semibold text-yellow-600">
													🔄 Updated This Week
													{filterType ===
														"activity" &&
														filterValue ===
														"weeklyUpdates" && (
															<span className="ml-2 text-xs">
																📌
															</span>
														)}
												</div>
												<div className="text-lg font-bold">
													{
														allManuscripts.filter(
															(m) => {
																const weekAgo =
																	new Date();
																weekAgo.setDate(
																	weekAgo.getDate() -
																	7
																);
																const updatedDate =
																	new Date(
																		m.updatedAt
																	);
																return (
																	updatedDate >=
																	weekAgo
																);
															}
														).length
													}
												</div>
											</button>
											<button
												onClick={() =>
													handleActivityFilter(
														"pendingAction"
													)
												}
												className={`bg-white p-3 rounded border transition-all duration-200 hover:shadow-md hover:bg-green-50 text-left ${filterType === "activity" &&
													filterValue ===
													"pendingAction"
													? "ring-2 ring-green-400 bg-green-50 shadow-md"
													: ""
													}`}
											>
												<div className="font-semibold text-green-600">
													⚡ Pending Action
													{filterType ===
														"activity" &&
														filterValue ===
														"pendingAction" && (
															<span className="ml-2 text-xs">
																📌
															</span>
														)}
												</div>
												<div className="text-lg font-bold">
													{
														allManuscripts.filter(
															(m) =>
																m.status ===
																"Pending" ||
																m.status ===
																"Reviewed" ||
																m.status ===
																"Revision Required"
														).length
													}
												</div>
											</button>
										</div>
									</div>
								</div>
							);
						})()}
					</div>

					{/* Users List */}
					<div className="bg-white rounded-lg p-6 shadow-md border border-[#e2e8f0]">
						<h2 className="text-2xl font-semibold text-[#496580] mb-4">
							Users with Manuscripts
						</h2>
						<div className="space-y-2">
							{/* Show All Manuscripts Button */}
							<button
								onClick={handleShowAllManuscripts}
								className={`w-full text-left p-3 rounded-lg transition-all font-medium ${!selectedUser
									? "bg-[#496580] text-white"
									: "bg-[#e3f2fd] text-[#1976d2] hover:bg-[#bbdefb] border border-[#1976d2]"
									}`}
							>
								📋 Show All Manuscripts
							</button>

							{users.map((user, index) => (
								<button
									key={index}
									onClick={() => handleUserClick(user)}
									className={`w-full text-left p-3 rounded-lg transition-all ${selectedUser === user
										? "bg-[#496580] text-white"
										: "bg-[#f8fafc] text-[#1a365d] hover:bg-gray-100"
										}`}
								>
									{`${user.firstName} ${user.middleName || ""
										} ${user.lastName}`}{" "}
									- {user.email}
								</button>
							))}
						</div>
					</div>

					{/* Manuscripts List */}
					<div className="bg-white rounded-lg p-6 shadow-md border border-[#e2e8f0] col-span-2">
						<div className="flex justify-between items-center mb-4">
							<div className="flex flex-col">
								<h2 className="text-2xl font-semibold text-[#496580]">
									{selectedUser
										? `Manuscripts by ${formatFullName(
											selectedUser
										)}`
										: "Select a User"}
								</h2>
								{filterType !== "all" && selectedUser && (
									<div className="flex items-center space-x-2 mt-2">
										<span className="text-sm text-gray-600">
											Filtered by:
										</span>
										<span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
											{filterType === "status"
												? `Status: ${filterValue}`
												: filterType === "activity"
													? `Activity: ${filterValue ===
														"todaySubmissions"
														? "Today's Submissions"
														: filterValue ===
															"weeklyUpdates"
															? "Updated This Week"
															: filterValue ===
																"pendingAction"
																? "Pending Action"
																: filterValue
													}`
													: filterValue}
										</span>
										<button
											onClick={clearFilter}
											className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs rounded transition-colors"
											title="Clear filter"
										>
											✕ Clear
										</button>
										<span className="text-xs text-gray-500">
											({getFilteredManuscripts().length}{" "}
											manuscripts)
										</span>
									</div>
								)}
							</div>

							{/* Bulk Actions Toggle */}
							{getFilteredManuscripts().length > 0 && (
								<div className="flex items-center space-x-2">
									<button
										onClick={() =>
											setShowBulkActions(!showBulkActions)
										}
										className={`px-3 py-1 text-sm rounded ${showBulkActions
											? "bg-red-500 text-white hover:bg-red-600"
											: "bg-blue-500 text-white hover:bg-blue-600"
											}`}
									>
										{showBulkActions
											? "❌ Cancel Bulk"
											: "☑️ Bulk Actions"}
									</button>
									{showBulkActions &&
										selectedManuscriptIds.length > 0 && (
											<span className="text-sm text-gray-600">
												{selectedManuscriptIds.length}{" "}
												selected
											</span>
										)}
								</div>
							)}
						</div>

						{/* Bulk Actions Panel */}
						{showBulkActions &&
							getFilteredManuscripts().length > 0 && (
								<div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
									<h3 className="text-lg font-semibold text-blue-700 mb-3">
										🔧 Bulk Actions
									</h3>
									<div className="flex flex-wrap gap-2 mb-3">
										<button
											onClick={() =>
												setSelectedManuscriptIds(
													getFilteredManuscripts().map(
														(m) => m._id
													)
												)
											}
											className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
										>
											Select All
										</button>
										<button
											onClick={() =>
												setSelectedManuscriptIds([])
											}
											className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
										>
											Clear All
										</button>
									</div>

									{selectedManuscriptIds.length > 0 && (
										<div className="flex flex-wrap gap-2">
											<button
												onClick={() =>
													handleBulkStatusUpdate(
														selectedManuscriptIds,
														"Pending"
													)
												}
												className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
											>
												🔄 Set to Pending (
												{selectedManuscriptIds.length})
											</button>
											<button
												onClick={() =>
													handleBulkStatusUpdate(
														selectedManuscriptIds,
														"Reviewed"
													)
												}
												className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
											>
												✅ Mark Reviewed (
												{selectedManuscriptIds.length})
											</button>
											<button
												onClick={() =>
													handleBulkStatusUpdate(
														selectedManuscriptIds,
														"Revision Required"
													)
												}
												className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
											>
												📝 Revision Required (
												{selectedManuscriptIds.length})
											</button>
											<button
												onClick={() =>
													handleBulkStatusUpdate(
														selectedManuscriptIds,
														"Accepted"
													)
												}
												className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
											>
												🎉 Accept All (
												{selectedManuscriptIds.length})
											</button>
										</div>
									)}
								</div>
							)}

						<div className="space-y-4" key={`${selectedUser?._id || 'all'}-${forceRender}`}>
							{getFilteredManuscripts().map((manuscript) => (
								<div
									key={`${manuscript._id}-${forceRender}`}
									data-manuscript-id={manuscript._id}
									className="bg-[#f8fafc] p-4 rounded-lg border border-[#e2e8f0]"
								>
									<div className="flex justify-between items-start">
										<div className="flex items-start space-x-3 flex-1">
											{/* Bulk Selection Checkbox */}
											{showBulkActions && (
												<input
													type="checkbox"
													checked={selectedManuscriptIds.includes(
														manuscript._id
													)}
													onChange={() =>
														toggleManuscriptSelection(
															manuscript._id
														)
													}
													className="mt-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
												/>
											)}

											<div className="flex-1">
												<h3 className="text-xl font-semibold text-[#1a365d] mb-2">
													{manuscript.title}
												</h3>
												<div className="flex items-center justify-between mb-2">
													<p className="text-[#496580] text-sm">
														Type: {manuscript.type}
													</p>
													<p className="text-[#00796b] text-sm font-medium">
														ID: {manuscript.customId || manuscript._id.slice(-6).toUpperCase()}
													</p>
												</div>
												{/* Show author info when viewing all manuscripts */}
												{!selectedUser && (
													<div className="mb-2">
														<p className="text-[#496580] text-sm">
															Author: {(() => {
																const author = users.find(user =>
																	user.manuscripts?.some(m => m._id === manuscript._id)
																);
																return author ? formatFullName(author) : "Unknown Author";
															})()}
														</p>
													</div>
												)}
												<div className="flex items-center space-x-2 mb-1">
													<p className="text-[#496580] text-sm">
														Status:
													</p>
													<span
														className={`px-2 py-1 rounded text-xs font-semibold ${manuscript.status ===
															"Pending"
															? "bg-blue-100 text-blue-800"
															: manuscript.status ===
																"Under Review"
																? "bg-yellow-100 text-yellow-800"
																: manuscript.status ===
																	"Reviewed"
																	? "bg-purple-100 text-purple-800"
																	: manuscript.status ===
																		"Revision Required"
																		? "bg-orange-100 text-orange-800"
																		: manuscript.status ===
																			"Accepted"
																			? "bg-green-100 text-green-800"
																			: manuscript.status ===
																				"Rejected"
																				? "bg-red-100 text-red-800"
																				: "bg-gray-100 text-gray-800"
															}`}
													>
														{manuscript.status}
													</span>
													{typeof manuscript.revisionAttempts ===
														"number" && (
															<span className="text-xs text-[#496580]">
																Attempts:{" "}
																{manuscript.revisionAttempts}/
																{manuscript.maxRevisionAttempts ||
																	3}
															</span>
														)}
												</div>
												{manuscript.revisionLocked && (
													<p className="text-xs text-red-600 font-semibold mb-2">
														⚠ All revision attempts exhausted. Manuscript automatically rejected.
													</p>
												)}
												{/* Time Information */}
												<div className="text-xs text-gray-600 space-y-1">
													{manuscript.submissionDate && (
														<div className="flex items-center space-x-1">
															<span>
																📅 Submitted:
															</span>
															<span>
																{new Date(
																	manuscript.submissionDate
																).toLocaleDateString(
																	"en-US",
																	{
																		year: "numeric",
																		month: "short",
																		day: "numeric",
																		hour: "2-digit",
																		minute: "2-digit",
																	}
																)}
															</span>
														</div>
													)}
													{manuscript.updatedAt && (
														<div className="flex items-center space-x-1">
															<span>
																🔄 Last Updated:
															</span>
															<span>
																{new Date(
																	manuscript.updatedAt
																).toLocaleDateString(
																	"en-US",
																	{
																		year: "numeric",
																		month: "short",
																		day: "numeric",
																		hour: "2-digit",
																		minute: "2-digit",
																	}
																)}
															</span>
														</div>
													)}
													{manuscript.createdAt &&
														!manuscript.submissionDate && (
															<div className="flex items-center space-x-1">
																<span>
																	📝 Created:
																</span>
																<span>
																	{new Date(
																		manuscript.createdAt
																	).toLocaleDateString(
																		"en-US",
																		{
																			year: "numeric",
																			month: "short",
																			day: "numeric",
																			hour: "2-digit",
																			minute: "2-digit",
																		}
																	)}
																</span>
															</div>
														)}

													{/* Invitations Status */}
													{manuscript.invitations &&
														manuscript.invitations
															.length > 0 && (
															<div className="mt-3 border-t border-gray-200 pt-3">
																<h4 className="text-sm font-semibold text-gray-700 mb-2">
																	📧 Reviewer
																	Invitations
																	(
																	{
																		manuscript
																			.invitations
																			.length
																	}
																	)
																</h4>
																<div className="space-y-2">
																	{manuscript.invitations.map(
																		(
																			invitation,
																			index
																		) => (
																			<div
																				key={
																					index
																				}
																				className={`text-xs p-2 rounded border ${invitation.status ===
																					"accepted"
																					? "bg-green-50 border-green-200"
																					: invitation.status ===
																						"rejected"
																						? "bg-red-50 border-red-200"
																						: "bg-yellow-50 border-yellow-200"
																					}`}
																			>
																				<div className="flex items-center justify-between">
																					<span className="font-medium">
																						{
																							invitation.email
																						}
																					</span>
																					<span
																						className={`px-2 py-1 rounded text-xs font-semibold ${invitation.status ===
																							"accepted"
																							? "bg-green-100 text-green-800"
																							: invitation.status ===
																								"rejected"
																								? "bg-red-100 text-red-800"
																								: "bg-yellow-100 text-yellow-800"
																							}`}
																					>
																						{invitation.status
																							.charAt(
																								0
																							)
																							.toUpperCase() +
																							invitation.status.slice(
																								1
																							)}
																					</span>
																				</div>
																				<div className="text-gray-600 mt-1">
																					Invited:{" "}
																					{new Date(
																						invitation.invitedAt
																					).toLocaleDateString()}
																					{invitation.acceptedAt && (
																						<span className="ml-2">
																							•
																							Accepted:{" "}
																							{new Date(
																								invitation.acceptedAt
																							).toLocaleDateString()}
																						</span>
																					)}
																					{invitation.rejectedAt && (
																						<span className="ml-2">
																							•
																							Rejected:{" "}
																							{new Date(
																								invitation.rejectedAt
																							).toLocaleDateString()}
																						</span>
																					)}
																				</div>
																				{invitation.rejectionReason && (
																					<div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs">
																						<span className="font-semibold text-red-800">
																							Rejection
																							Reason:
																						</span>
																						<p className="text-red-700 mt-1">
																							{
																								invitation.rejectionReason
																							}
																						</p>
																					</div>
																				)}
																			</div>
																		)
																	)}
																</div>
															</div>
														)}
												</div>
											</div>
										</div>

										{/* Action Buttons */}
										<div className="flex flex-col space-y-2">
											{/* View PDF Button - Always Available */}
											{manuscript.mergedFileUrl && (
												<button
													onClick={() => window.open(manuscript.mergedFileUrl, "_blank")}
													className="w-full px-3 py-2 text-sm bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors flex items-center justify-center space-x-2"
												>
													<span>📄</span>
													<span>Original PDF</span>
												</button>
											)}
	{manuscript.status === "Published" && (
		<button
			onClick={() => window.open(`/journal/jics/articles/${manuscript._id}`, "_blank")}
			className="w-full px-3 py-2 text-sm bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded hover:from-indigo-600 hover:to-purple-700 transition-all font-medium flex items-center justify-center space-x-2 shadow-md"
		>
			<span>🌐</span>
			<span>View Published Article</span>
			<span className="text-xs opacity-75">({manuscript.customId || manuscript._id})</span>
		</button>
	)}
											{/* Clean Final Manuscript Download - Yeh sabse upar rakhna, priority highest */}
											{manuscript.authorResponse?.withoutHighlightedFileUrl && (
												<button
													onClick={() => {
														let url = manuscript.authorResponse.withoutHighlightedFileUrl;

														// Google Drive file link handle
														if (url.includes("drive.google.com/file/d/")) {
															const fileId = url.split("/d/")[1].split("/")[0];
															const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
															window.open(downloadUrl, "_blank");
														}
														// Direct link ya S3/etc
														else {
															const link = document.createElement("a");
															link.href = url;
															link.download = `${manuscript.customId || manuscript._id}-FINAL-CLEAN.docx`;
															link.target = "_blank";
															document.body.appendChild(link);
															link.click();
															document.body.removeChild(link);
														}
													}}
													className="w-full px-3 py-2 text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded hover:from-green-600 hover:to-emerald-700 transition-all font-medium flex items-center justify-center space-x-2 shadow-md"
												>
													<span>⭐</span>
													<span>Download Final Clean Manuscript</span>

												</button>
											)}

											{/* Response Sheet (PDF) */}
											{manuscript.authorResponse?.docxUrl && (
												<button
													onClick={() => window.open(manuscript.authorResponse.docxUrl, "_blank")}
													className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
												>
													<span>📝</span>
													<span>Response Sheet</span>
												</button>
											)}

											{/* Highlighted Document (PDF) */}
											{manuscript.authorResponse?.highlightedFileUrl && (
												<button
													onClick={() => window.open(manuscript.authorResponse.highlightedFileUrl, "_blank")}
													className="w-full px-3 py-2 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors flex items-center justify-center space-x-2"
												>
													<span>✏️</span>
													<span>Highlighted Doc</span>
												</button>
											)}

											{/* Without Highlighted Document (DOCX/LaTeX) */}
											{manuscript.authorResponse?.withoutHighlightedFileUrl && (
												<button
													onClick={() => {
														const url = manuscript.authorResponse.withoutHighlightedFileUrl;

														// Check if Google Drive URL
														if (url.includes('drive.google.com')) {
															// Extract file ID
															const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
															const fileId = match?.[1];

															if (fileId) {
																// Check if ZIP file - Download it
																const isZip = url.toLowerCase().includes('.zip');

																if (isZip) {
																	// Download ZIP
																	const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
																	window.open(downloadUrl, '_blank');
																	addToast("ZIP download started!", "success");
																} else {
																	// View DOC/DOCX in Google Drive Preview
																	const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
																	window.open(previewUrl, '_blank');
																}
															} else {
																window.open(url, '_blank');
															}
														} else {
															// Non-Google Drive URL
															const isZip = url.toLowerCase().includes('.zip');
															const isPdf = url.toLowerCase().includes('.pdf');

															if (isZip) {
																// Download ZIP
																const link = document.createElement('a');
																link.href = url;
																link.download = 'clean-document.zip';
																link.target = '_blank';
																document.body.appendChild(link);
																link.click();
																document.body.removeChild(link);
															} else if (isPdf) {
																window.open(url, "_blank");
															} else {
																// View DOC in Google Docs Viewer
																const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
																window.open(viewerUrl, "_blank");
															}
														}
													}}
													className="px-2 py-1 text-xs border border-green-600 text-green-600 rounded hover:bg-green-50 transition-colors"
												>
													without highlighted Doc
												</button>
											)}

											{/* Invite Reviewers Button */}
											<button
												onClick={() =>
													handleInviteReviewers(
														manuscript
													)
												}
												className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
											>
												✉️ Invite Reviewers
											</button>

											{/* View Notes Button */}
											{(manuscript.editorNotes?.length >
												0 ||
												manuscript.editorNotesForAuthor
													?.length > 0 ||
												manuscript.reviewerNotes
													?.length > 0) && (
													<button
														className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
														title={`View ${(manuscript.editorNotes
															?.length || 0) +
															(manuscript
																.editorNotesForAuthor
																?.length || 0) +
															(manuscript
																.reviewerNotes
																?.length || 0)
															} notes`}
														onClick={() => {
															// Scroll to notes section
															const element =
																document.querySelector(
																	`[data-manuscript-id="${manuscript._id}"] .notes-section`
																);
															if (element) {
																element.scrollIntoView(
																	{
																		behavior:
																			"smooth",
																		block: "center",
																	}
																);
															}
														}}
													>
														📝 Notes (
														{(manuscript.editorNotes
															?.length || 0) +
															(manuscript
																.editorNotesForAuthor
																?.length || 0) +
															(manuscript
																.reviewerNotes
																?.length || 0)}
														)
													</button>
												)}

											{/* Manual Status Control Buttons */}
											<div className="bg-gray-50 p-3 rounded border">
												<h4 className="text-sm font-semibold text-gray-700 mb-2">
													📋 Manual Status Control
												</h4>
												<div className="grid grid-cols-1 gap-1">
													{/* Set to Pending */}
													<button
														onClick={() =>
															handleDirectStatusUpdate(
																manuscript._id,
																"Pending"
															)
														}
														className={`px-3 py-1 text-sm rounded ${manuscript.status ===
															"Pending"
															? "bg-gray-400 text-white cursor-not-allowed"
															: "bg-blue-500 text-white hover:bg-blue-600"
															}`}
														disabled={
															manuscript.status ===
															"Pending"
														}
													>
														{manuscript.status ===
															"Pending"
															? "✓ Currently Pending"
															: "🔄 Set to Pending"}
													</button>

													{/* Set to Reviewed */}
													<button
														onClick={() =>
															handleDirectStatusUpdate(
																manuscript._id,
																"Reviewed"
															)
														}
														className={`px-3 py-1 text-sm rounded ${manuscript.status ===
															"Reviewed"
															? "bg-gray-400 text-white cursor-not-allowed"
															: "bg-purple-500 text-white hover:bg-purple-600"
															}`}
														disabled={
															manuscript.status ===
															"Reviewed"
														}
													>
														{manuscript.status ===
															"Reviewed"
															? "✓ Reviewed"
															: "✅ Mark as Reviewed"}
													</button>

													{/* Accept */}
													<button
														onClick={() =>
															handleAcceptClick(
																manuscript
															)
														}
														className={`px-3 py-1 text-sm rounded ${manuscript.status === "Accepted" || manuscript.status === "Published"
															? "bg-gray-400 text-white cursor-not-allowed"
															: "bg-green-500 text-white hover:bg-green-600"
															}`}
														disabled={manuscript.status === "Accepted" || manuscript.status === "Published"}
													>
														{manuscript.status ===
															"Accepted"
															? "✓ Accepted"
															: "🎉 Accept"}
													</button>

													{/* Reject */}
													<button
														onClick={() =>
															handleActionClick(
																manuscript,
																"reject"
															)
														}
														className={`px-3 py-1 text-sm rounded ${manuscript.status ===
															"Rejected"
															? "bg-gray-400 text-white cursor-not-allowed"
															: "bg-red-500 text-white hover:bg-red-600"
															}`}
														disabled={
															manuscript.status ===
															"Rejected"
														}
													>
														{manuscript.status ===
															"Rejected"
															? "✓ Rejected"
															: "❌ Reject"}
													</button>

													{/* Revision Required */}
													<button
														onClick={() =>
															handleActionClick(manuscript, "revision")
														}
														className={`px-3 py-1 text-sm rounded ${manuscript.revisionAttempts >= (manuscript.maxRevisionAttempts || 3)
															? "bg-gray-400 text-white cursor-not-allowed"
															: "bg-orange-500 text-white hover:bg-orange-600"
															}`}
														disabled={manuscript.revisionAttempts >= (manuscript.maxRevisionAttempts || 3)}
													>
														📝 Revision Required
													</button>

													<button
														onClick={() => {
															setUploadManuscript(manuscript);
															setShowPdfUploadDialog(true);
														}}
														className={`px-3 py-1 text-sm rounded text-white 
    ${manuscript.status === "Published"
																? "bg-gray-500 cursor-not-allowed"
																: "bg-indigo-500 hover:bg-indigo-600"}`}
														disabled={manuscript.status === "Published"}
													>
														{manuscript.status === "Published" ? "✓ Published" : "Publish"}
													</button>
													<button
														onClick={() => handleDeleteClick(manuscript)}
														className="px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700 mt-2 flex items-center justify-center space-x-1"
													>
														<span>🗑️</span>
														<span>Delete Manuscript</span>
													</button>

												</div>
											</div>

											{/* Quick Actions Section */}
											<div className="bg-yellow-50 p-3 rounded border">
												<button
													className="px-4 py-2 bg-blue-600 text-white rounded"
													onClick={() => exportNotesToWord(manuscript, user)}
												>
													📄 Export Notes to Word
												</button>
												<h4 className="text-sm font-semibold text-yellow-700 mb-2">
													⚡ Quick Actions
												</h4>
												<div className="grid grid-cols-1 gap-1">
													{/* Auto-workflow buttons */}
													{manuscript.status ===
														"Under Review" && (
															<button
																onClick={() =>
																	handleDirectStatusUpdate(
																		manuscript._id,
																		"Pending"
																	)
																}
																className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
															>
																🔙 Reset to Pending
															</button>
														)}

													{manuscript.status ===
														"Pending" && (
															<button
																onClick={() =>
																	handleDirectStatusUpdate(
																		manuscript._id,
																		"Under Review"
																	)
																}
																className="px-3 py-1 text-sm bg-[#496580] text-white rounded hover:bg-[#3a5269]"
															>
																🚀 Quick Send to
																Review
															</button>
														)}

													{manuscript.status ===
														"Under Review" && (
															<button
																onClick={() =>
																	handleDirectStatusUpdate(
																		manuscript._id,
																		"Reviewed"
																	)
																}
																className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
															>
																✅ Auto-Mark
																Reviewed
															</button>
														)}

													{manuscript.status ===
														"Reviewed" && (
															<button
																onClick={() =>
																	handleDirectStatusUpdate(
																		manuscript._id,
																		"Accepted"
																	)
																}
																className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
															>
																🎯 Auto-Accept
															</button>
														)}

													{manuscript.status ===
														"Revision Required" && (
															<button
																onClick={() =>
																	handleDirectStatusUpdate(
																		manuscript._id,
																		"Pending"
																	)
																}
																className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
															>
																🔄 Reset to Pending
															</button>
														)}
												</div>
											</div>
										</div>
									</div>

									{/* Notes History Section */}
									{(manuscript.editorNotes?.length > 0 ||
										manuscript.editorNotesForAuthor
											?.length > 0 ||
										manuscript.reviewerNotes?.length >
										0) && (
											<div className="notes-section mt-4 border-t border-[#e2e8f0] pt-4">
												<h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
													📝 Notes & Reviews History
												</h4>

												<div className="space-y-3 max-h-60 overflow-y-auto">
													{/* Show limited or all notes based on expanded state */}
													{(() => {
														const isExpanded =
															expandedNotes[
															manuscript._id
															];
														const allNotes = [
															...(
																manuscript.editorNotes ||
																[]
															)
																.filter((note) => {
																	// Filter out notes that contain schema definitions or invalid content
																	const text =
																		note.text ||
																		"";
																	return (
																		!text.includes(
																			"rejectionReason: { type: String"
																		) &&
																		!text.includes(
																			"required: function"
																		) &&
																		!text.includes(
																			"type: String"
																		) &&
																		text.trim()
																			.length >
																		0
																	);
																})
																.map((note) => ({
																	...note,
																	type: "editor",
																})),
															...(
																manuscript.editorNotesForAuthor ||
																[]
															)
																.filter((note) => {
																	// Filter out notes that contain schema definitions or invalid content
																	const text =
																		note.text ||
																		"";
																	return (
																		!text.includes(
																			"rejectionReason: { type: String"
																		) &&
																		!text.includes(
																			"required: function"
																		) &&
																		!text.includes(
																			"type: String"
																		) &&
																		text.trim()
																			.length >
																		0
																	);
																})
																.map((note) => ({
																	...note,
																	type: "editorForAuthor",
																})),
															...(
																manuscript.reviewerNotes ||
																[]
															)
																.filter((note) => {
																	// Filter out notes that contain schema definitions or invalid content
																	const text =
																		note.text ||
																		"";
																	return (
																		!text.includes(
																			"rejectionReason: { type: String"
																		) &&
																		!text.includes(
																			"required: function"
																		) &&
																		!text.includes(
																			"type: String"
																		) &&
																		text.trim()
																			.length >
																		0
																	);
																})
																.map((note) => ({
																	...note,
																	type: "reviewer",
																})),
														].sort(
															(a, b) =>
																new Date(
																	a.addedAt
																) -
																new Date(b.addedAt)
														);

														const displayNotes =
															isExpanded
																? allNotes
																: allNotes.slice(
																	0,
																	3
																);

														return displayNotes.map(
															(item, index) => {
																if (
																	item.type ===
																	"editor"
																) {
																	return (
																		<div
																			key={`editor-${index}`}
																			className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400"
																		>
																			<div className="flex items-center justify-between mb-1">
																				<div className="flex items-center space-x-2">
																					<span className="text-sm font-semibold text-blue-700">
																						👨‍💼
																						Editor:{" "}
																						{item
																							.addedBy
																							?.name ||
																							"Unknown"}
																					</span>
																					{item.action && (
																						<span className="px-2 py-1 text-xs bg-blue-200 text-blue-800 rounded">
																							{
																								item.action
																							}
																						</span>
																					)}
																				</div>
																				<span className="text-xs text-blue-600">
																					{new Date(
																						item.addedAt
																					).toLocaleDateString(
																						"en-US",
																						{
																							month: "short",
																							day: "numeric",
																							hour: "2-digit",
																							minute: "2-digit",
																						}
																					)}
																				</span>
																			</div>
																			<p className="text-sm text-gray-700">
																				{
																					item.text
																				}
																			</p>
																		</div>
																	);
																} else if (
																	item.type ===
																	"editorForAuthor"
																) {
																	return (
																		<div
																			key={`editorForAuthor-${index}`}
																			className="bg-orange-50 p-3 rounded-lg border-l-4 border-orange-400"
																		>
																			<div className="flex items-center justify-between mb-1">
																				<div className="flex items-center space-x-2">
																					<span className="text-sm font-semibold text-orange-700">
																						📝
																						Editor
																						Note
																						for
																						Author:{" "}
																						{item
																							.addedBy
																							?.name ||
																							"Unknown"}
																					</span>
																					{item.action && (
																						<span className="px-2 py-1 text-xs bg-orange-200 text-orange-800 rounded">
																							{
																								item.action
																							}
																						</span>
																					)}
																				</div>
																				<span className="text-xs text-orange-600">
																					{new Date(
																						item.addedAt
																					).toLocaleDateString(
																						"en-US",
																						{
																							month: "short",
																							day: "numeric",
																							hour: "2-digit",
																							minute: "2-digit",
																						}
																					)}
																				</span>
																			</div>
																			<p className="text-sm text-gray-700">
																				{
																					item.text
																				}
																			</p>
																		</div>
																	);
																} else if (
																	item.type ===
																	"reviewer"
																) {
																	return (
																		<div
																			key={`reviewer-note-${index}`}
																			className="bg-purple-50 p-3 rounded-lg border-l-4 border-purple-400"
																		>
																			<div className="flex items-center justify-between mb-1">
																				<div className="flex items-center space-x-2">
																					<span className="text-sm font-semibold text-purple-700">
																						👥
																						Reviewer:{" "}
																						{item
																							.addedBy
																							?.name ||
																							"Anonymous"}
																					</span>
																					{item.action && (
																						<span className="px-2 py-1 text-xs bg-purple-200 text-purple-800 rounded">
																							{
																								item.action
																							}
																						</span>
																					)}
																				</div>
																				<span className="text-xs text-purple-600">
																					{new Date(
																						item.addedAt
																					).toLocaleDateString(
																						"en-US",
																						{
																							month: "short",
																							day: "numeric",
																							hour: "2-digit",
																							minute: "2-digit",
																						}
																					)}
																				</span>
																			</div>
																			<p className="text-sm text-gray-700">
																				{
																					item.text
																				}
																			</p>
																		</div>
																	);
																} else if (
																	item.type ===
																	"review"
																) {
																	return (
																		<div
																			key={`review-${index}`}
																			className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400"
																		>
																			<div className="flex items-center justify-between mb-1">
																				<div className="flex items-center space-x-2">
																					<span className="text-sm font-semibold text-green-700">
																						📋
																						Review
																						by
																						Reviewer
																					</span>
																					<span
																						className={`px-2 py-1 text-xs rounded ${item.recommendation ===
																							"Accept"
																							? "bg-green-200 text-green-800"
																							: item.recommendation ===
																								"Minor Revision"
																								? "bg-yellow-200 text-yellow-800"
																								: item.recommendation ===
																									"Major Revision"
																									? "bg-orange-200 text-orange-800"
																									: "bg-red-200 text-red-800"
																							}`}
																					>
																						{
																							item.recommendation
																						}
																					</span>
																				</div>
																				<span className="text-xs text-green-600">
																					{new Date(
																						item.submittedAt
																					).toLocaleDateString(
																						"en-US",
																						{
																							month: "short",
																							day: "numeric",
																							hour: "2-digit",
																							minute: "2-digit",
																						}
																					)}
																				</span>
																			</div>
																			<p className="text-sm text-gray-700">
																				{
																					item.comments
																				}
																			</p>
																		</div>
																	);
																}
															}
														);
													})()}
												</div>

												{/* Toggle View All Notes Button */}
												{(() => {
													const totalNotes =
														(manuscript.editorNotes
															?.length || 0) +
														(manuscript
															.editorNotesForAuthor
															?.length || 0) +
														(manuscript.reviewerNotes
															?.length || 0);
													const isExpanded =
														expandedNotes[
														manuscript._id
														];

													if (totalNotes > 3) {
														return (
															<button
																className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
																onClick={() => {
																	setExpandedNotes(
																		(prev) => ({
																			...prev,
																			[manuscript._id]:
																				!prev[
																				manuscript
																					._id
																				],
																		})
																	);
																}}
															>
																{isExpanded
																	? "📋 Show Less"
																	: `📋 View All Notes (${totalNotes} total)`}
															</button>
														);
													}
													return null;
												})()}
											</div>
										)}

									{/* Note Input Section */}
									{showNoteInput &&
										selectedManuscript?._id ===
										manuscript._id && (
											<div className="mt-4 border-t border-[#e2e8f0] pt-4">
												{showNoteInput === "reject" && (
													<>
														<div className="mb-4">
															<label className="block text-[#1a365d] mb-2 font-semibold">
																Add a rejection
																note:
															</label>
															<textarea
																value={noteText}
																onChange={(e) =>
																	setNoteText(
																		e.target
																			.value
																	)
																}
																className="w-full h-32 p-2 rounded bg-white text-[#1a365d] border border-[#e2e8f0]"
																placeholder="Enter your rejection note here..."
																required
															/>
														</div>

														<div className="flex justify-end space-x-2">
															<button
																onClick={
																	handleCancel
																}
																className="px-4 py-2 bg-gray-300 text-[#1a365d] rounded hover:bg-gray-400"
															>
																Cancel
															</button>
															<button
																onClick={() =>
																	handleStatusUpdate(
																		manuscript._id,
																		"Rejected"
																	)
																}
																disabled={
																	!noteText.trim()
																}
																className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
															>
																Confirm
																Rejection
															</button>
														</div>
													</>
												)}

												{showNoteInput ===
													"revision" && (
														<>
															<div className="mb-4">
																<label className="block text-[#1a365d] mb-2 font-semibold">
																	Add a revision
																	required note:
																</label>
																<textarea
																	value={
																		revisionNoteText
																	}
																	onChange={(e) =>
																		setRevisionNoteText(
																			e.target
																				.value
																		)
																	}
																	className="w-full h-32 p-2 rounded bg-white text-[#1a365d] border border-[#e2e8f0]"
																	placeholder="Enter revision requirements and feedback for the author..."
																	required
																/>
															</div>

															<div className="flex justify-end space-x-2">
																<button
																	onClick={
																		handleCancel
																	}
																	className="px-4 py-2 bg-gray-300 text-[#1a365d] rounded hover:bg-gray-400"
																>
																	Cancel
																</button>
																<button
																	onClick={() =>
																		handleRevisionRequired(
																			manuscript._id
																		)
																	}
																	disabled={
																		!revisionNoteText.trim()
																	}
																	className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
																>
																	Request Revision
																</button>
															</div>
														</>
													)}
											</div>
										)}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Accept Manuscript Dialog */}
			{showAcceptDialog && selectedManuscript && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
					<div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#e2e8f0]">
						<h2 className="text-2xl font-semibold text-[#1a365d] mb-4">
							Accept Manuscript
						</h2>

						{/* Acceptance Note Input */}
						<div className="mb-6">
							<label className="block text-[#1a365d] mb-2">
								Add Acceptance Note (Optional):
							</label>
							<textarea
								value={acceptanceNote}
								onChange={(e) =>
									setAcceptanceNote(e.target.value)
								}
								className="w-full h-32 bg-white text-[#1a365d] rounded p-2 border border-[#e2e8f0]"
								placeholder="Enter any additional notes..."
							/>
						</div>

						<div className="flex justify-end space-x-3">
							<button
								onClick={() => {
									setShowAcceptDialog(false);
									setSelectedManuscript(null);
									setAcceptanceNote("");
								}}
								className="px-4 py-2 bg-gray-300 text-[#1a365d] rounded hover:bg-gray-400"
							>
								Cancel
							</button>
							<button
								onClick={handleAcceptManuscript}
								className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
							>
								Confirm Accept
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Invite Reviewers Dialog */}
			{showInviteDialog && inviteManuscript && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
					<div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#e2e8f0]">
						<h2 className="text-2xl font-semibold text-[#1a365d] mb-4">
							Invite Reviewers
						</h2>

						<div className="mb-4">
							<h3 className="text-lg font-medium text-[#496580] mb-2">
								Manuscript: {inviteManuscript.title}
							</h3>
							<p className="text-sm text-gray-600 mb-2">
								Type: {inviteManuscript.type}
							</p>
							<div className="flex items-center space-x-2">
								<span className="text-sm text-gray-600">
									📧 Emails to invite:
								</span>
								<span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded font-medium">
									{
										inviteEmails.filter(
											(email) => email.trim().length > 0
										).length
									}{" "}
									reviewer(s)
								</span>
							</div>
						</div>

						{/* Email Input Section */}
						<div className="mb-6">
							<label className="block text-[#1a365d] mb-2 font-semibold">
								Reviewer Email Addresses:
							</label>

							<div className="space-y-3">
								{inviteEmails.map((email, index) => {
									const emailRegex =
										/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
									const isValidEmail =
										email.length === 0 ||
										emailRegex.test(email.trim());

									return (
										<div
											key={index}
											className="flex items-center space-x-2"
										>
											<div className="flex-1">
												<div className="relative">
													<input
														type="email"
														value={email}
														onChange={(e) =>
															updateEmailField(
																index,
																e.target.value
															)
														}
														className={`w-full bg-white text-[#1a365d] rounded p-2 border focus:ring-2 focus:ring-[#496580]/20 outline-none transition-colors ${isValidEmail
															? "border-[#e2e8f0] focus:border-[#496580]"
															: "border-red-300 focus:border-red-500"
															}`}
														placeholder={`Reviewer ${index + 1
															} email address...`}
													/>
													{email.length > 0 && (
														<div className="absolute right-2 top-1/2 transform -translate-y-1/2">
															{isValidEmail ? (
																<span
																	className="text-green-500"
																	title="Valid email"
																>
																	✅
																</span>
															) : (
																<span
																	className="text-red-500"
																	title="Invalid email format"
																>
																	❌
																</span>
															)}
														</div>
													)}
												</div>
												{!isValidEmail &&
													email.length > 0 && (
														<p className="text-red-500 text-xs mt-1">
															Please enter a valid
															email address
														</p>
													)}
											</div>

											{/* Remove button (only show if more than 1 email field) */}
											{inviteEmails.length > 1 && (
												<button
													type="button"
													onClick={() =>
														removeEmailField(index)
													}
													className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex-shrink-0"
													title="Remove this email field"
												>
													🗑️
												</button>
											)}
										</div>
									);
								})}

								{/* Add more email buttons */}
								<div className="flex space-x-2">
									<button
										type="button"
										onClick={addEmailField}
										className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors border-2 border-dashed border-transparent hover:border-blue-300"
									>
										➕ Add Another Email
									</button>
									<button
										type="button"
										onClick={handleBulkEmailAdd}
										className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
										title="Paste multiple emails at once"
									>
										📋 Bulk Add
									</button>
									{inviteEmails.filter(
										(email) => email.trim().length > 0
									).length > 0 && (
											<button
												type="button"
												onClick={clearAllEmails}
												className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
												title="Clear all email fields"
											>
												🗑️ Clear All
											</button>
										)}
								</div>
							</div>

							<p className="text-sm text-gray-600 mt-3">
								💡 <strong>Tip:</strong> Add multiple reviewer
								email addresses above. Each reviewer will
								receive an invitation email with a link to
								register/login and accept or reject the review
								invitation.
							</p>
						</div>

						{/* Editor Notes Section */}
						<div className="mb-6">
							<label className="block text-[#1a365d] mb-2 font-semibold">
								Editor Notes (Optional):
							</label>
							<textarea
								value={editorNote}
								onChange={(e) => setEditorNote(e.target.value)}
								className="w-full bg-white text-[#1a365d] rounded p-3 border border-[#e2e8f0] focus:ring-2 focus:ring-[#496580]/20 focus:border-[#496580] outline-none transition-colors resize-vertical"
								rows="4"
								placeholder="Add any specific instructions, requirements, or information for the reviewers (e.g., deadline, special focus areas, manuscript requirements)..."
								maxLength="1000"
							/>
							<div className="flex justify-between items-center mt-2">
								<p className="text-sm text-gray-500">
									💬 This note will be included in the
									invitation email and visible to reviewers
								</p>
								<span className="text-xs text-gray-400">
									{editorNote.length}/1000 characters
								</span>
							</div>
						</div>

						<div className="flex justify-end space-x-3">
							<button
								onClick={() => {
									setShowInviteDialog(false);
									setInviteEmails([""]);
									setEditorNote("");
									setInviteManuscript(null);
								}}
								className="px-4 py-2 bg-gray-300 text-[#1a365d] rounded hover:bg-gray-400"
							>
								Cancel
							</button>
							<button
								onClick={handleSendInvitations}
								disabled={
									isSendingInvitations ||
									inviteEmails.filter(
										(email) => email.trim().length > 0
									).length === 0
								}
								className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
							>
								{isSendingInvitations ? (
									<>
										<span className="inline-block animate-spin mr-2">
											⏳
										</span>
										Sending...
									</>
								) : (
									<>
										✉️ Send{" "}
										{inviteEmails.filter(
											(email) => email.trim().length > 0
										).length > 0
											? `${inviteEmails.filter(
												(email) =>
													email.trim()
														.length > 0
											).length
											} Invitation${inviteEmails.filter(
												(email) =>
													email.trim()
														.length > 0
											).length !== 1
												? "s"
												: ""
											}`
											: "Invitations"}
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Loading Overlay for Sending Invitations */}
			{isSendingInvitations && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center shadow-2xl">
						<div className="mb-4">
							<div className="inline-block animate-spin text-4xl mb-4">
								⏳
							</div>
						</div>
						<h3 className="text-xl font-semibold text-gray-800 mb-2">
							Sending Invitations
						</h3>
						<p className="text-gray-600 mb-4">
							Please wait while we send invitations to the
							selected reviewers...
						</p>
						<div className="flex justify-center">
							<div className="flex space-x-1">
								<div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
								<div
									className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
									style={{ animationDelay: "0.1s" }}
								></div>
								<div
									className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
									style={{ animationDelay: "0.2s" }}
								></div>
							</div>
						</div>
						<p className="text-sm text-gray-500 mt-4">
							This may take a few moments...
						</p>
					</div>
				</div>
			)}

			{/* PDF Upload Modal */}
			<PdfUploadModal
				isOpen={showPdfUploadDialog}
				onClose={() => {
					setShowPdfUploadDialog(false);
					setUploadManuscript(null);
				}}
				manuscript={uploadManuscript}
				userToken={user?.token}
				onSuccess={(data) => {
					addToast("PDF has been successfully uploaded!", "success");
					fetchUsers(); // Data refresh karo
				}}
			/>


			{/* Statistics Modal */}
			{showStatisticsModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
						{/* Modal Header */}
						<div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
							<div className="flex justify-between items-center">
								<div>
									<h2 className="text-2xl font-bold flex items-center space-x-2">
										<span>📊</span>
										<span>Manuscript Statistics Dashboard</span>
									</h2>
									<p className="text-indigo-100 mt-1">
										Comprehensive analytics and insights
									</p>
								</div>
								<button
									onClick={() => setShowStatisticsModal(false)}
									className="p-2 hover:bg-white/20 rounded-full transition-colors"
								>
									<span className="text-2xl">✕</span>
								</button>
							</div>

							{/* Date Range Filter */}
							<div className="mt-4 flex flex-wrap items-center gap-4 bg-white/10 p-4 rounded-lg">
								<div className="flex items-center space-x-2">
									<label className="text-sm font-medium">📅 From:</label>
									<input
										type="date"
										value={statisticsDateRange.startDate}
										onChange={(e) =>
											setStatisticsDateRange((prev) => ({
												...prev,
												startDate: e.target.value,
											}))
										}
										className="px-3 py-2 rounded-lg text-gray-800 border-0 focus:ring-2 focus:ring-indigo-300"
									/>
								</div>
								<div className="flex items-center space-x-2">
									<label className="text-sm font-medium">📅 To:</label>
									<input
										type="date"
										value={statisticsDateRange.endDate}
										onChange={(e) =>
											setStatisticsDateRange((prev) => ({
												...prev,
												endDate: e.target.value,
											}))
										}
										className="px-3 py-2 rounded-lg text-gray-800 border-0 focus:ring-2 focus:ring-indigo-300"
									/>
								</div>
								{/* Quick Date Filters */}
								<div className="flex space-x-2">
									<button
										onClick={() => {
											const today = new Date();
											const weekAgo = new Date();
											weekAgo.setDate(weekAgo.getDate() - 7);
											setStatisticsDateRange({
												startDate: weekAgo.toISOString().split('T')[0],
												endDate: today.toISOString().split('T')[0],
											});
										}}
										className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm transition-colors"
									>
										Last 7 Days
									</button>
									<button
										onClick={() => {
											const today = new Date();
											const monthAgo = new Date();
											monthAgo.setDate(monthAgo.getDate() - 30);
											setStatisticsDateRange({
												startDate: monthAgo.toISOString().split('T')[0],
												endDate: today.toISOString().split('T')[0],
											});
										}}
										className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm transition-colors"
									>
										Last 30 Days
									</button>
									<button
										onClick={() => {
											const today = new Date();
											const yearAgo = new Date();
											yearAgo.setFullYear(yearAgo.getFullYear() - 1);
											setStatisticsDateRange({
												startDate: yearAgo.toISOString().split('T')[0],
												endDate: today.toISOString().split('T')[0],
											});
										}}
										className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm transition-colors"
									>
										Last Year
									</button>
									<button
										onClick={() => {
											setStatisticsDateRange({
												startDate: "",
												endDate: "",
											});
										}}
										className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm transition-colors"
									>
										All Time
									</button>
								</div>
							</div>
						</div>

						{/* Modal Body */}
						<div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
							{statisticsData ? (
								<div className="space-y-6">
									{/* Summary Cards */}
									<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
										<div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-lg">
											<div className="text-3xl font-bold">{statisticsData.totalManuscripts}</div>
											<div className="text-blue-100">Total Manuscripts</div>
											<div className="text-xs text-blue-200 mt-1">
												{statisticsData.dateRange.start && statisticsData.dateRange.end
													? `${statisticsData.dateRange.start} to ${statisticsData.dateRange.end}`
													: "All Time"}
											</div>
										</div>
										<div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl shadow-lg">
											<div className="text-3xl font-bold">
												{(statisticsData.statusCounts["Accepted"] || 0) + (statisticsData.statusCounts["Published"] || 0)}
											</div>
											<div className="text-green-100">Accepted/Published</div>
											<div className="text-xs text-green-200 mt-1">
												{statisticsData.totalManuscripts > 0
													? `${Math.round((((statisticsData.statusCounts["Accepted"] || 0) + (statisticsData.statusCounts["Published"] || 0)) / statisticsData.totalManuscripts) * 100)}% acceptance rate`
													: "0% acceptance rate"}
											</div>
										</div>
										<div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-xl shadow-lg">
											<div className="text-3xl font-bold">{statisticsData.avgProcessingDays}</div>
											<div className="text-orange-100">Avg. Processing Days</div>
											<div className="text-xs text-orange-200 mt-1">From submission to decision</div>
										</div>
										<div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-xl shadow-lg">
											<div className="text-3xl font-bold">{statisticsData.revisionStats.manuscriptsWithRevisions}</div>
											<div className="text-purple-100">With Revisions</div>
											<div className="text-xs text-purple-200 mt-1">
												{statisticsData.revisionStats.totalRevisions} total revision attempts
											</div>
										</div>
									</div>

									{/* Status Breakdown */}
									<div className="bg-gray-50 rounded-xl p-6">
										<h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
											<span>📋</span>
											<span>Status Breakdown</span>
										</h3>
										<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
											{[
												{ status: "Pending", color: "bg-blue-500", icon: "⏳" },
												{ status: "Under Review", color: "bg-yellow-500", icon: "🔍" },
												{ status: "Reviewed", color: "bg-purple-500", icon: "✅" },
												{ status: "Revision Required", color: "bg-orange-500", icon: "📝" },
												{ status: "Accepted", color: "bg-green-500", icon: "🎉" },
												{ status: "Rejected", color: "bg-red-500", icon: "❌" },
												{ status: "Published", color: "bg-teal-600", icon: "📰" },
											].map(({ status, color, icon }) => (
												<div
													key={status}
													className={`${color} text-white p-4 rounded-lg text-center`}
												>
													<div className="text-lg">{icon}</div>
													<div className="text-2xl font-bold">
														{statisticsData.statusCounts[status] || 0}
													</div>
													<div className="text-xs font-medium truncate">{status}</div>
													<div className="text-xs opacity-75">
														{statisticsData.totalManuscripts > 0
															? `${Math.round(((statisticsData.statusCounts[status] || 0) / statisticsData.totalManuscripts) * 100)}%`
															: "0%"}
													</div>
												</div>
											))}
										</div>
									</div>

									{/* Two Column Layout */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										{/* Manuscript Types */}
										<div className="bg-gray-50 rounded-xl p-6">
											<h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
												<span>📁</span>
												<span>By Manuscript Type</span>
											</h3>
											<div className="space-y-3">
												{Object.entries(statisticsData.typeCounts)
													.sort((a, b) => b[1] - a[1])
													.map(([type, count]) => (
														<div key={type} className="flex items-center justify-between">
															<span className="text-gray-700">{type}</span>
															<div className="flex items-center space-x-2">
																<div className="w-32 bg-gray-200 rounded-full h-2">
																	<div
																		className="bg-indigo-500 h-2 rounded-full"
																		style={{
																			width: `${(count / statisticsData.totalManuscripts) * 100}%`,
																		}}
																	></div>
																</div>
																<span className="text-sm font-semibold text-gray-600 w-8">
																	{count}
																</span>
															</div>
														</div>
													))}
											</div>
										</div>

										{/* Monthly Submissions */}
										<div className="bg-gray-50 rounded-xl p-6">
											<h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
												<span>📅</span>
												<span>Monthly Submissions</span>
											</h3>
											<div className="space-y-3 max-h-60 overflow-y-auto">
												{Object.entries(statisticsData.monthlySubmissions)
													.sort((a, b) => {
														const dateA = new Date(a[0]);
														const dateB = new Date(b[0]);
														return dateB - dateA;
													})
													.map(([month, count]) => (
														<div key={month} className="flex items-center justify-between">
															<span className="text-gray-700">{month}</span>
															<div className="flex items-center space-x-2">
																<div className="w-32 bg-gray-200 rounded-full h-2">
																	<div
																		className="bg-green-500 h-2 rounded-full"
																		style={{
																			width: `${(count / Math.max(...Object.values(statisticsData.monthlySubmissions))) * 100}%`,
																		}}
																	></div>
																</div>
																<span className="text-sm font-semibold text-gray-600 w-8">
																	{count}
																</span>
															</div>
														</div>
													))}
											</div>
										</div>
									</div>

									{/* Top Authors Table */}
									<div className="bg-gray-50 rounded-xl p-6">
										<h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
											<span>👥</span>
											<span>Author Statistics</span>
										</h3>
										<div className="overflow-x-auto">
											<table className="w-full text-sm">
												<thead>
													<tr className="bg-gray-200">
														<th className="px-4 py-3 text-left font-semibold text-gray-700">Author</th>
														<th className="px-4 py-3 text-center font-semibold text-gray-700">Total</th>
														<th className="px-4 py-3 text-center font-semibold text-gray-700">Accepted</th>
														<th className="px-4 py-3 text-center font-semibold text-gray-700">Rejected</th>
														<th className="px-4 py-3 text-center font-semibold text-gray-700">Pending</th>
														<th className="px-4 py-3 text-center font-semibold text-gray-700">Success Rate</th>
													</tr>
												</thead>
												<tbody>
													{Object.entries(statisticsData.authorStats)
														.sort((a, b) => b[1].total - a[1].total)
														.slice(0, 10)
														.map(([author, stats], index) => (
															<tr key={author} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
																<td className="px-4 py-3 text-gray-800 font-medium">{author}</td>
																<td className="px-4 py-3 text-center">
																	<span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
																		{stats.total}
																	</span>
																</td>
																<td className="px-4 py-3 text-center">
																	<span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
																		{stats.accepted}
																	</span>
																</td>
																<td className="px-4 py-3 text-center">
																	<span className="px-2 py-1 bg-red-100 text-red-800 rounded-full font-semibold">
																		{stats.rejected}
																	</span>
																</td>
																<td className="px-4 py-3 text-center">
																	<span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full font-semibold">
																		{stats.pending}
																	</span>
																</td>
																<td className="px-4 py-3 text-center">
																	<span className={`px-2 py-1 rounded-full font-semibold ${stats.total > 0 && (stats.accepted / stats.total) >= 0.5
																		? "bg-green-100 text-green-800"
																		: "bg-gray-100 text-gray-800"
																		}`}>
																		{stats.total > 0
																			? `${Math.round((stats.accepted / stats.total) * 100)}%`
																			: "0%"}
																	</span>
																</td>
															</tr>
														))}
												</tbody>
											</table>
										</div>
									</div>

									{/* Detailed Manuscripts Table */}
									<div className="bg-gray-50 rounded-xl p-6">
										<h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-between">
											<div className="flex items-center space-x-2">
												<span>📄</span>
												<span>Detailed Manuscript List</span>
											</div>
											<span className="text-sm font-normal text-gray-500">
												{statisticsData.filteredManuscripts.length} manuscripts
											</span>
										</h3>
										<div className="overflow-x-auto max-h-96">
											<table className="w-full text-sm">
												<thead className="sticky top-0 bg-gray-200">
													<tr>
														<th className="px-3 py-3 text-left font-semibold text-gray-700">ID</th>
														<th className="px-3 py-3 text-left font-semibold text-gray-700">Title</th>
														<th className="px-3 py-3 text-left font-semibold text-gray-700">Author</th>
														<th className="px-3 py-3 text-left font-semibold text-gray-700">Type</th>
														<th className="px-3 py-3 text-center font-semibold text-gray-700">Status</th>
														<th className="px-3 py-3 text-left font-semibold text-gray-700">Submitted</th>
														<th className="px-3 py-3 text-left font-semibold text-gray-700">Updated</th>
													</tr>
												</thead>
												<tbody>
													{statisticsData.filteredManuscripts
														.sort((a, b) => new Date(b.submissionDate || b.createdAt) - new Date(a.submissionDate || a.createdAt))
														.map((manuscript, index) => (
															<tr key={manuscript._id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
																<td className="px-3 py-2 text-gray-600 font-mono text-xs">
																	{manuscript.customId || manuscript._id.slice(-6).toUpperCase()}
																</td>
																<td className="px-3 py-2 text-gray-800 font-medium max-w-xs truncate" title={manuscript.title}>
																	{manuscript.title}
																</td>
																<td className="px-3 py-2 text-gray-600">
																	{manuscript.authorName || "Unknown"}
																</td>
																<td className="px-3 py-2 text-gray-600">
																	{manuscript.type || "N/A"}
																</td>
																<td className="px-3 py-2 text-center">
																	<span className={`px-2 py-1 rounded text-xs font-semibold ${manuscript.status === "Pending"
																		? "bg-blue-100 text-blue-800"
																		: manuscript.status === "Under Review"
																			? "bg-yellow-100 text-yellow-800"
																			: manuscript.status === "Reviewed"
																				? "bg-purple-100 text-purple-800"
																				: manuscript.status === "Revision Required"
																					? "bg-orange-100 text-orange-800"
																					: manuscript.status === "Accepted"
																						? "bg-green-100 text-green-800"
																						: manuscript.status === "Rejected"
																							? "bg-red-100 text-red-800"
																							: manuscript.status === "Published"
																								? "bg-teal-100 text-teal-800"
																								: "bg-gray-100 text-gray-800"
																		}`}>
																		{manuscript.status}
																	</span>
																</td>
																<td className="px-3 py-2 text-gray-600 text-xs">
																	{new Date(manuscript.submissionDate || manuscript.createdAt).toLocaleDateString()}
																</td>
																<td className="px-3 py-2 text-gray-600 text-xs">
																	{new Date(manuscript.updatedAt).toLocaleDateString()}
																</td>
															</tr>
														))}
												</tbody>
											</table>
										</div>
									</div>

									{/* Export Button */}
									<div className="flex justify-end space-x-3">
										<button
											onClick={() => {
												// Export to CSV
												const headers = ["ID", "Title", "Author", "Type", "Status", "Submitted", "Updated"];
												const rows = statisticsData.filteredManuscripts.map((m) => [
													m.customId || m._id.slice(-6).toUpperCase(),
													`"${m.title.replace(/"/g, '""')}"`,
													m.authorName || "Unknown",
													m.type || "N/A",
													m.status,
													new Date(m.submissionDate || m.createdAt).toLocaleDateString(),
													new Date(m.updatedAt).toLocaleDateString(),
												]);

												const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
												const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
												const link = document.createElement("a");
												link.href = URL.createObjectURL(blob);
												link.download = `manuscript-statistics-${new Date().toISOString().split("T")[0]}.csv`;
												link.click();

												addToast("Statistics exported to CSV!", "success");
											}}
											className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
										>
											<span>📥</span>
											<span>Export to CSV</span>
										</button>
										<button
											onClick={() => setShowStatisticsModal(false)}
											className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
										>
											Close
										</button>
									</div>
								</div>
							) : (
								<div className="flex items-center justify-center py-12">
									<div className="text-center">
										<div className="animate-spin text-4xl mb-4">⏳</div>
										<p className="text-gray-600">Calculating statistics...</p>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}


			{/* Delete Confirmation Modal - Add before closing </div> of component */}
			{showDeleteConfirm && deleteManuscript && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
						{/* Header */}
						<div className="bg-red-500 text-white p-6">
							<div className="flex items-center space-x-3">
								<div className="text-4xl">⚠️</div>
								<div>
									<h2 className="text-xl font-bold">Delete Manuscript</h2>
									<p className="text-red-100 text-sm">This action cannot be undone</p>
								</div>
							</div>
						</div>

						{/* Body */}
						<div className="p-6">
							<div className="mb-4">
								<p className="text-gray-700 mb-4">
									Are you sure you want to delete this manuscript?
								</p>

								{/* Manuscript Details */}
								<div className="bg-gray-50 rounded-lg p-4 border">
									<div className="space-y-2">
										<div className="flex items-start">
											<span className="text-gray-500 w-20 text-sm">ID:</span>
											<span className="text-gray-800 font-mono text-sm">
												{deleteManuscript.customId || deleteManuscript._id.slice(-6).toUpperCase()}
											</span>
										</div>
										<div className="flex items-start">
											<span className="text-gray-500 w-20 text-sm">Title:</span>
											<span className="text-gray-800 font-medium text-sm">
												{deleteManuscript.title}
											</span>
										</div>
										<div className="flex items-start">
											<span className="text-gray-500 w-20 text-sm">Status:</span>
											<span className={`px-2 py-0.5 rounded text-xs font-semibold ${deleteManuscript.status === "Pending"
												? "bg-blue-100 text-blue-800"
												: deleteManuscript.status === "Under Review"
													? "bg-yellow-100 text-yellow-800"
													: deleteManuscript.status === "Reviewed"
														? "bg-purple-100 text-purple-800"
														: deleteManuscript.status === "Accepted"
															? "bg-green-100 text-green-800"
															: deleteManuscript.status === "Rejected"
																? "bg-red-100 text-red-800"
																: deleteManuscript.status === "Published"
																	? "bg-teal-100 text-teal-800"
																	: "bg-gray-100 text-gray-800"
												}`}>
												{deleteManuscript.status}
											</span>
										</div>
										<div className="flex items-start">
											<span className="text-gray-500 w-20 text-sm">Author:</span>
											<span className="text-gray-800 text-sm">
												{deleteManuscript.authorName || "Unknown"}
											</span>
										</div>
									</div>
								</div>
							</div>

							{/* Warning */}
							<div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
								<p className="text-red-700 text-sm flex items-start space-x-2">
									<span>⚠️</span>
									<span>
										<strong>Warning:</strong> All associated files, notes, and review history will be permanently deleted.
									</span>
								</p>
							</div>
						</div>

						{/* Footer */}
						<div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
							<button
								onClick={handleCancelDelete}
								disabled={isDeleting}
								className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
							>
								Cancel
							</button>
							<button
								onClick={handleConfirmDelete}
								disabled={isDeleting}
								className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
							>
								{isDeleting ? (
									<>
										<span className="animate-spin">⏳</span>
										<span>Deleting...</span>
									</>
								) : (
									<>
										<span>🗑️</span>
										<span>Delete Permanently</span>
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default EditorDashboard;
