import { useState, useEffect } from "react";
import { useAuth } from "../App";
import axios from "axios";

function EditorDashboard() {
	const { user } = useAuth();

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

	useEffect(() => {
		const fetchUsers = async () => {
			try {
				if (!user?.token) {
					console.error("No user token found");
					return;
				}

				console.log("Fetching users with token:", user.token); // Debug log
				const response = await axios.get(
					`${
						import.meta.env.VITE_BACKEND_URL
					}/api/auth/editor/users-with-manuscripts`,
					{
						headers: {
							Authorization: `Bearer ${user.token}`,
						},
					}
				);
				setUsers(response.data);
			} catch (error) {
				console.error("Error fetching users:", error);
				if (error.response?.status === 401) {
					alert("Session expired. Please login again.");
					// Clear user data and redirect to login
					localStorage.removeItem("user");
					window.location.href = "/editor/login";
				}
			}
		};

		const fetchReviewers = async () => {
			try {
				if (!user?.token) {
					console.error("No user token found");
					return;
				}

				console.log("Fetching reviewers with token:", user.token); // Debug log
				const response = await axios.get(
					`${
						import.meta.env.VITE_BACKEND_URL
					}/api/auth/editor/reviewers`,
					{
						headers: {
							Authorization: `Bearer ${user.token}`,
						},
					}
				);
				console.log("Reviewers fetched successfully:", response.data);
				setReviewers(response.data);
			} catch (error) {
				console.error(
					"Error fetching reviewers:",
					error.response?.data || error.message
				);
				if (error.response?.status === 401) {
					alert("Session expired. Please login again.");
					// Clear user data and redirect to login
					localStorage.removeItem("user");
					window.location.href = "/editor/login";
				}
			}
		};

		fetchUsers();
		fetchReviewers();
	}, [user]);

	// Handle user click to fetch manuscripts
	const handleUserClick = (user) => {
		setSelectedUser(user);
		setManuscripts(user.manuscripts || []);
	};

	// Handle manuscript click to open PDF
	const handleManuscriptClick = (manuscript) => {
		console.log("Manuscript data:", manuscript);

		if (!manuscript?.mergedFileUrl) {
			console.error("No mergedFileUrl found in manuscript:", manuscript);
			alert("PDF URL not available");
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
					`${
						import.meta.env.VITE_BACKEND_URL
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
			await axios.patch(
				`${
					import.meta.env.VITE_BACKEND_URL
				}/api/auth/editor/manuscripts/${manuscriptId}/status`,
				{ status: newStatus },
				{
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				}
			);

			// Update manuscripts list with new status
			const updatedManuscripts = manuscripts.map((m) =>
				m._id === manuscriptId ? { ...m, status: newStatus } : m
			);
			setManuscripts(updatedManuscripts);

			// Reset states
			setNoteText("");
			setShowNoteInput(null);
			setSelectedManuscript(null);

			alert(
				newStatus === "Rejected"
					? "Manuscript rejected successfully"
					: `Manuscript status updated to "${newStatus}" successfully`
			);
		} catch (error) {
			console.error("Error updating manuscript:", error);

			// Check for specific error about rejected manuscripts
			if (
				error.response?.status === 403 &&
				error.response?.data?.message?.includes("rejected")
			) {
				alert(
					"Cannot modify status of a rejected manuscript. Rejected manuscripts are immutable."
				);
			} else {
				alert("Failed to update manuscript");
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

			await axios.patch(
				`${
					import.meta.env.VITE_BACKEND_URL
				}/api/auth/editor/manuscripts/${manuscriptId}/status`,
				{ status: newStatus },
				{
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				}
			);

			// Update local state
			const updatedManuscripts = manuscripts.map((m) =>
				m._id === manuscriptId ? { ...m, status: newStatus } : m
			);
			setManuscripts(updatedManuscripts);

			alert(`Manuscript status updated to "${newStatus}" successfully!`);
		} catch (error) {
			console.error("Error updating manuscript status:", error);

			// Check for specific error about rejected manuscripts
			if (
				error.response?.status === 403 &&
				error.response?.data?.message?.includes("rejected")
			) {
				alert(
					"Cannot modify status of a rejected manuscript. Rejected manuscripts are immutable."
				);
			} else {
				alert(`Failed to update manuscript status to "${newStatus}"`);
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
				`${
					import.meta.env.VITE_BACKEND_URL
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

			alert(
				`${manuscriptIds.length} manuscripts updated to "${newStatus}" successfully!`
			);
		} catch (error) {
			console.error("Error bulk updating manuscript status:", error);

			// Check for specific error about rejected manuscripts
			if (
				error.response?.status === 403 ||
				error.response?.data?.message?.includes("rejected")
			) {
				alert(
					"Some manuscripts could not be updated because they are rejected. Rejected manuscripts cannot be modified."
				);
			} else {
				alert(`Failed to bulk update manuscripts to "${newStatus}"`);
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
				alert("Please enter a revision note");
				return;
			}

			await axios.post(
				`${
					import.meta.env.VITE_BACKEND_URL
				}/api/auth/editor/manuscripts/${manuscriptId}/revision-required`,
				{ text: revisionNoteText },
				{
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				}
			);

			// Update manuscripts list with new status
			const updatedManuscripts = manuscripts.map((m) =>
				m._id === manuscriptId
					? { ...m, status: "Revision Required" }
					: m
			);
			setManuscripts(updatedManuscripts);

			// Reset states
			setRevisionNoteText("");
			setShowNoteInput(null);
			setSelectedManuscript(null);

			alert("Revision required note added successfully");
		} catch (error) {
			console.error("Error adding revision required note:", error);

			// Check for specific error about rejected manuscripts
			if (
				error.response?.status === 403 &&
				error.response?.data?.message?.includes("rejected")
			) {
				alert(
					"Cannot modify status of a rejected manuscript. Rejected manuscripts are immutable."
				);
			} else {
				alert("Failed to add revision required note");
			}
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
				`${
					import.meta.env.VITE_BACKEND_URL
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
			alert("Manuscript accepted successfully!");
		} catch (error) {
			console.error("Error accepting manuscript:", error);
			alert("Failed to accept manuscript");
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
		setIsSendingInvitations(true); // Start loading
		try {
			// Filter out empty emails and trim whitespace
			const emailArray = inviteEmails
				.map((email) => email.trim())
				.filter((email) => email.length > 0);

			if (emailArray.length === 0) {
				alert("Please enter at least one email address");
				setIsSendingInvitations(false);
				return;
			}

			// Validate email format
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			const invalidEmails = emailArray.filter(
				(email) => !emailRegex.test(email)
			);

			if (invalidEmails.length > 0) {
				alert(`Invalid email addresses: ${invalidEmails.join(", ")}`);
				setIsSendingInvitations(false);
				return;
			}

			const requestData = {
				emails: emailArray,
			};

			// Add editor note if provided
			if (editorNote.trim()) {
				requestData.editorNote = editorNote.trim();
			}

			await axios.post(
				`${
					import.meta.env.VITE_BACKEND_URL
				}/api/auth/editor/manuscripts/${
					inviteManuscript._id
				}/invite-reviewers`,
				requestData,
				{
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				}
			);

			alert(
				`Invitations sent successfully to ${emailArray.length} reviewers!`
			);
			setShowInviteDialog(false);
			setInviteEmails([""]);
			setEditorNote("");
			setInviteManuscript(null);
		} catch (error) {
			console.error("Error sending invitations:", error);
			alert("Failed to send invitations");
		} finally {
			setIsSendingInvitations(false); // Stop loading
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

	return (
		<div className="min-h-screen bg-[#f8fafc] p-6">
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
						<div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
							<p className="text-sm text-yellow-800">
								<strong>📝 Note:</strong> Rejected manuscripts
								are not displayed in the editor dashboard. Once
								a manuscript is rejected, its status becomes
								immutable and it&apos;s removed from editor
								view.
							</p>
						</div>
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
							];
							const statusColors = {
								Pending: "bg-blue-500",
								"Under Review": "bg-yellow-500",
								Reviewed: "bg-purple-500",
								"Revision Required": "bg-orange-500",
								Accepted: "bg-green-500",
							};

							return (
								<div>
									<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
										{statusOrder.map((status) => (
											<div
												key={status}
												className={`${statusColors[status]} text-white p-4 rounded-lg text-center`}
											>
												<div className="text-2xl font-bold">
													{statusCounts[status] || 0}
												</div>
												<div className="text-sm">
													{status}
												</div>
											</div>
										))}
									</div>

									{/* Recent Activity Summary */}
									<div className="bg-gray-50 p-4 rounded-lg border">
										<h3 className="text-lg font-semibold text-gray-700 mb-3">
											⏰ Recent Activity
										</h3>
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
											<div className="bg-white p-3 rounded border">
												<div className="font-semibold text-blue-600">
													📥 Today&apos;s Submissions
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
											</div>
											<div className="bg-white p-3 rounded border">
												<div className="font-semibold text-yellow-600">
													🔄 Updated This Week
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
											</div>
											<div className="bg-white p-3 rounded border">
												<div className="font-semibold text-green-600">
													⚡ Pending Action
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
											</div>
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
							{users.map((user, index) => (
								<button
									key={index}
									onClick={() => handleUserClick(user)}
									className={`w-full text-left p-3 rounded-lg transition-all ${
										selectedUser === user
											? "bg-[#496580] text-white"
											: "bg-[#f8fafc] text-[#1a365d] hover:bg-gray-100"
									}`}
								>
									{`${user.firstName} ${
										user.middleName || ""
									} ${user.lastName}`}{" "}
									- {user.email}
								</button>
							))}
						</div>
					</div>

					{/* Manuscripts List */}
					<div className="bg-white rounded-lg p-6 shadow-md border border-[#e2e8f0] col-span-2">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-2xl font-semibold text-[#496580]">
								{selectedUser
									? `Manuscripts by ${formatFullName(
											selectedUser
									  )}`
									: "Select a User"}
							</h2>

							{/* Bulk Actions Toggle */}
							{manuscripts.length > 0 && (
								<div className="flex items-center space-x-2">
									<button
										onClick={() =>
											setShowBulkActions(!showBulkActions)
										}
										className={`px-3 py-1 text-sm rounded ${
											showBulkActions
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
						{showBulkActions && manuscripts.length > 0 && (
							<div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
								<h3 className="text-lg font-semibold text-blue-700 mb-3">
									🔧 Bulk Actions
								</h3>
								<div className="flex flex-wrap gap-2 mb-3">
									<button
										onClick={() =>
											setSelectedManuscriptIds(
												manuscripts.map((m) => m._id)
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

						<div className="space-y-4">
							{manuscripts.map((manuscript) => (
								<div
									key={manuscript._id}
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
												<p className="text-[#496580] text-sm">
													Type: {manuscript.type}
												</p>
												<div className="flex items-center space-x-2 mb-1">
													<p className="text-[#496580] text-sm">
														Status:
													</p>
													<span
														className={`px-2 py-1 rounded text-xs font-semibold ${
															manuscript.status ===
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
												</div>
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
																				className={`text-xs p-2 rounded border ${
																					invitation.status ===
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
																						className={`px-2 py-1 rounded text-xs font-semibold ${
																							invitation.status ===
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
											<button
												onClick={() =>
													handleManuscriptClick(
														manuscript
													)
												}
												className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
											>
												📄 View PDF
											</button>

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
													title={`View ${
														(manuscript.editorNotes
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
														className={`px-3 py-1 text-sm rounded ${
															manuscript.status ===
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
														className={`px-3 py-1 text-sm rounded ${
															manuscript.status ===
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
														className={`px-3 py-1 text-sm rounded ${
															manuscript.status ===
															"Accepted"
																? "bg-gray-400 text-white cursor-not-allowed"
																: "bg-green-500 text-white hover:bg-green-600"
														}`}
														disabled={
															manuscript.status ===
															"Accepted"
														}
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
														className={`px-3 py-1 text-sm rounded ${
															manuscript.status ===
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
															handleActionClick(
																manuscript,
																"revision"
															)
														}
														className={`px-3 py-1 text-sm rounded ${
															manuscript.status ===
															"Revision Required"
																? "bg-gray-400 text-white cursor-not-allowed"
																: "bg-orange-500 text-white hover:bg-orange-600"
														}`}
														disabled={
															manuscript.status ===
															"Revision Required"
														}
													>
														{manuscript.status ===
														"Revision Required"
															? "✓ Revision Required"
															: "📝 Revision Required"}
													</button>
												</div>
											</div>

											{/* Quick Actions Section */}
											<div className="bg-yellow-50 p-3 rounded border">
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
																					className={`px-2 py-1 text-xs rounded ${
																						item.recommendation ===
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
														className={`w-full bg-white text-[#1a365d] rounded p-2 border focus:ring-2 focus:ring-[#496580]/20 outline-none transition-colors ${
															isValidEmail
																? "border-[#e2e8f0] focus:border-[#496580]"
																: "border-red-300 focus:border-red-500"
														}`}
														placeholder={`Reviewer ${
															index + 1
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
											? `${
													inviteEmails.filter(
														(email) =>
															email.trim()
																.length > 0
													).length
											  } Invitation${
													inviteEmails.filter(
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
		</div>
	);
}

export default EditorDashboard;
