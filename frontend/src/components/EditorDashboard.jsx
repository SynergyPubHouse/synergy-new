import { useState, useEffect } from "react";
import { useAuth } from "../App";
import axios from "axios";

function EditorDashboard() {
	const { user } = useAuth();
	const [users, setUsers] = useState([]);
	const [selectedUser, setSelectedUser] = useState(null);
	const [manuscripts, setManuscripts] = useState([]);
	const [noteText, setNoteText] = useState("");
	const [selectedManuscript, setSelectedManuscript] = useState(null);
	const [showNoteInput, setShowNoteInput] = useState(null); // 'reject' or 'review' or null
	const [reviewers, setReviewers] = useState([]);
	const [selectedReviewers, setSelectedReviewers] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [showAcceptDialog, setShowAcceptDialog] = useState(null);
	const [acceptanceNote, setAcceptanceNote] = useState("");

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
				setIsLoading(true);
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
			} finally {
				setIsLoading(false);
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

			if (newStatus === "Under Review") {
				// First assign reviewers
				await axios.put(
					`${
						import.meta.env.VITE_BACKEND_URL
					}/api/manuscripts/${manuscriptId}/assign-reviewers`,
					{ reviewers: selectedReviewers },
					{
						headers: {
							Authorization: `Bearer ${user.token}`,
						},
					}
				);
			}

			// Then update the status
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
			setSelectedReviewers([]);

			alert(
				`Manuscript ${
					newStatus === "Rejected" ? "rejected" : "sent for review"
				} successfully`
			);
		} catch (error) {
			console.error("Error updating manuscript:", error);
			alert("Failed to update manuscript");
		}
	};

	const handleActionClick = async (manuscript, action) => {
		try {
			console.log("1. handleActionClick called:", { manuscript, action });

			// Reset states first
			setSelectedManuscript(null);
			setShowNoteInput(null);
			setNoteText("");
			setSelectedReviewers([]);

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

	const handleCancel = () => {
		setShowNoteInput(null);
		setSelectedManuscript(null);
		setNoteText("");
	};

	const handleAcceptClick = (manuscript) => {
		setSelectedManuscript(manuscript);
		setShowAcceptDialog(true);
	};

	const handleAcceptManuscript = async () => {
		try {
			const response = await axios.put(
				`${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/${
					selectedManuscript._id
				}/status`,
				{
					status: "Accepted",
					note: acceptanceNote,
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
						<h2 className="text-2xl font-semibold text-[#496580] mb-4">
							{selectedUser
								? `Manuscripts by ${selectedUser.firstName} ${selectedUser.lastName}`
								: "Select a User"}
						</h2>
						<div className="space-y-4">
							{manuscripts.map((manuscript) => (
								<div
									key={manuscript._id}
									className="bg-[#f8fafc] p-4 rounded-lg border border-[#e2e8f0]"
								>
									<div className="flex justify-between items-start">
										<div className="flex-1">
											<h3 className="text-xl font-semibold text-[#1a365d] mb-2">
												{manuscript.title}
											</h3>
											<p className="text-[#496580] text-sm">
												Type: {manuscript.type}
											</p>
											<p className="text-[#496580] text-sm">
												Status: {manuscript.status}
											</p>

											{/* Enhanced Timestamp Section */}
											<div className="mt-3 bg-white p-3 rounded border border-[#e2e8f0]">
												<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
													<div className="flex flex-col">
														<span className="font-semibold text-[#496580] mb-1">
															📅 Submitted:
														</span>
														<div className="text-[#1a365d]">
															{manuscript.submissionDate ||
															manuscript.createdAt ? (
																<>
																	<div className="font-medium">
																		{new Date(
																			manuscript.submissionDate ||
																				manuscript.createdAt
																		).toLocaleDateString(
																			"en-US",
																			{
																				year: "numeric",
																				month: "long",
																				day: "numeric",
																			}
																		)}
																	</div>
																	<div className="text-xs text-[#496580]">
																		{new Date(
																			manuscript.submissionDate ||
																				manuscript.createdAt
																		).toLocaleTimeString(
																			"en-US",
																			{
																				hour: "2-digit",
																				minute: "2-digit",
																				hour12: true,
																			}
																		)}
																	</div>
																</>
															) : (
																"N/A"
															)}
														</div>
													</div>

													{manuscript.updatedAt &&
														manuscript.updatedAt !==
															(manuscript.submissionDate ||
																manuscript.createdAt) && (
															<div className="flex flex-col">
																<span className="font-semibold text-[#496580] mb-1">
																	🔄 Last
																	Updated:
																</span>
																<div className="text-[#1a365d]">
																	<div className="font-medium">
																		{new Date(
																			manuscript.updatedAt
																		).toLocaleDateString(
																			"en-US",
																			{
																				year: "numeric",
																				month: "long",
																				day: "numeric",
																			}
																		)}
																	</div>
																	<div className="text-xs text-[#496580]">
																		{new Date(
																			manuscript.updatedAt
																		).toLocaleTimeString(
																			"en-US",
																			{
																				hour: "2-digit",
																				minute: "2-digit",
																				hour12: true,
																			}
																		)}
																	</div>
																</div>
															</div>
														)}
												</div>

												{/* Time since submission */}
												{manuscript.submissionDate ||
												manuscript.createdAt ? (
													<div className="mt-2 pt-2 border-t border-[#e2e8f0]">
														<span className="text-xs text-[#496580]">
															⏱️{" "}
															{(() => {
																const submissionDate =
																	new Date(
																		manuscript.submissionDate ||
																			manuscript.createdAt
																	);
																const now =
																	new Date();
																const diffTime =
																	Math.abs(
																		now -
																			submissionDate
																	);
																const diffDays =
																	Math.floor(
																		diffTime /
																			(1000 *
																				60 *
																				60 *
																				24)
																	);
																const diffHours =
																	Math.floor(
																		(diffTime %
																			(1000 *
																				60 *
																				60 *
																				24)) /
																			(1000 *
																				60 *
																				60)
																	);
																const diffMinutes =
																	Math.floor(
																		(diffTime %
																			(1000 *
																				60 *
																				60)) /
																			(1000 *
																				60)
																	);

																if (
																	diffDays > 0
																) {
																	return `Submitted ${diffDays} day${
																		diffDays >
																		1
																			? "s"
																			: ""
																	} ago`;
																} else if (
																	diffHours >
																	0
																) {
																	return `Submitted ${diffHours} hour${
																		diffHours >
																		1
																			? "s"
																			: ""
																	} ago`;
																} else {
																	return `Submitted ${diffMinutes} minute${
																		diffMinutes >
																		1
																			? "s"
																			: ""
																	} ago`;
																}
															})()}
														</span>
													</div>
												) : null}
											</div>
										</div>
										<div className="flex flex-col space-y-2">
											<button
												onClick={() =>
													handleActionClick(
														manuscript,
														"review"
													)
												}
												className="px-4 py-2 bg-[#496580] text-white rounded hover:bg-[#3a5269] disabled:opacity-50"
												disabled={
													manuscript.status ===
													"Under Review"
												}
											>
												{manuscript.status ===
												"Under Review"
													? "Already Under Review"
													: "Send to Review"}
											</button>
											{manuscript.status ===
												"Under Review" && (
												<button
													onClick={async () => {
														try {
															await axios.patch(
																`${
																	import.meta
																		.env
																		.BACKEND_URL
																}/api/auth/editor/manuscripts/${
																	manuscript._id
																}/status`,
																{
																	status: "Pending",
																},
																{
																	headers: {
																		Authorization: `Bearer ${user.token}`,
																	},
																}
															);

															const updatedManuscripts =
																manuscripts.map(
																	(m) =>
																		m._id ===
																		manuscript._id
																			? {
																					...m,
																					status: "Pending",
																			  }
																			: m
																);
															setManuscripts(
																updatedManuscripts
															);

															alert(
																"Manuscript status reset to Pending successfully"
															);
														} catch (error) {
															console.error(
																"Error resetting manuscript status:",
																error
															);
															alert(
																"Failed to reset manuscript status"
															);
														}
													}}
													className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
												>
													Reset to Pending
												</button>
											)}
											<button
												onClick={() =>
													handleActionClick(
														manuscript,
														"reject"
													)
												}
												className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
												disabled={
													manuscript.status ===
													"Rejected"
												}
											>
												Reject
											</button>
											<button
												onClick={() =>
													handleManuscriptClick(
														manuscript
													)
												}
												className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
											>
												View PDF
											</button>
											<button
												onClick={() =>
													handleAcceptClick(
														manuscript
													)
												}
												className={`px-4 py-2 rounded ${
													manuscript.status ===
													"Reviewed"
														? "bg-green-500 hover:bg-green-600 text-white"
														: "bg-gray-300 text-gray-500 cursor-not-allowed"
												}`}
												disabled={
													manuscript.status !==
													"Reviewed"
												}
											>
												Accept Manuscript
											</button>
										</div>
									</div>

									{/* Note Input Section */}
									{showNoteInput &&
										selectedManuscript?._id ===
											manuscript._id && (
											<div className="mt-4 border-t border-[#e2e8f0] pt-4">
												{showNoteInput === "review" && (
													<>
														<div className="mb-4 bg-[#f8fafc] p-4 rounded border border-[#e2e8f0]">
															<label className="block text-[#1a365d] mb-2 font-semibold text-lg">
																Select Reviewers
																(
																{reviewers?.length ||
																	0}{" "}
																available):
															</label>
															<div className="bg-white rounded border border-[#e2e8f0] p-2 max-h-60 overflow-y-auto">
																{reviewers?.map(
																	(
																		reviewer
																	) => (
																		<div
																			key={
																				reviewer._id
																			}
																			className="mb-2"
																		>
																			<label className="flex items-center space-x-2 text-[#1a365d] cursor-pointer hover:bg-gray-100 p-2 rounded">
																				<input
																					type="checkbox"
																					value={
																						reviewer._id
																					}
																					checked={selectedReviewers.includes(
																						reviewer._id
																					)}
																					onChange={(
																						e
																					) => {
																						const reviewerId =
																							e
																								.target
																								.value;
																						setSelectedReviewers(
																							(
																								prev
																							) =>
																								e
																									.target
																									.checked
																									? [
																											...prev,
																											reviewerId,
																									  ]
																									: prev.filter(
																											(
																												id
																											) =>
																												id !==
																												reviewerId
																									  )
																						);
																					}}
																					className="form-checkbox h-5 w-5 text-[#496580]"
																				/>
																				<span className="flex-1">
																					{`${reviewer.firstName} ${reviewer.lastName} - ${reviewer.specialization}`}
																				</span>
																			</label>
																		</div>
																	)
																)}
															</div>
															<p className="text-[#496580] text-sm mt-2">
																Select one or
																more reviewers
																from the list
																above
															</p>
														</div>

														<div className="mb-4">
															<label className="block text-[#1a365d] mb-2 font-semibold">
																Add a note
																(optional):
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
																placeholder="Enter your note here..."
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
																onClick={() => {
																	handleStatusUpdate(
																		selectedManuscript._id,
																		"Under Review"
																	);
																}}
																disabled={
																	selectedReviewers.length ===
																	0
																}
																className="px-4 py-2 bg-[#496580] text-white rounded hover:bg-[#3a5269] disabled:opacity-50 disabled:cursor-not-allowed"
															>
																{`Confirm Send to Review${
																	selectedReviewers.length >
																	0
																		? ` (${selectedReviewers.length} selected)`
																		: ""
																}`}
															</button>
														</div>
													</>
												)}

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
											</div>
										)}

									{/* Display notes section */}
									{(manuscript.editorNotes?.length > 0 ||
										manuscript.authorNotes?.length > 0 ||
										manuscript.reviewerNotes?.length >
											0) && (
										<div className="mt-4 border-t border-[#e2e8f0] pt-4">
											<h4 className="text-[#1a365d] font-semibold mb-2">
												Notes:
											</h4>

											{/* Editor Notes */}
											{manuscript.editorNotes?.length >
												0 && (
												<div className="mb-4">
													<h5 className="text-[#496580] text-sm font-semibold mb-2">
														Editor Notes:
													</h5>
													{manuscript.editorNotes.map(
														(note, noteIndex) => (
															<div
																key={`editor-${noteIndex}`}
																className="bg-white p-3 rounded mb-2 border border-[#e2e8f0]"
															>
																<div className="flex justify-between items-start">
																	<p className="text-[#1a365d]">
																		{
																			note.text
																		}
																	</p>
																	{note.action && (
																		<span
																			className={`px-2 py-1 rounded text-xs ${
																				note.action ===
																				"Rejected"
																					? "bg-red-500"
																					: note.action ===
																					  "Under Review"
																					? "bg-yellow-500"
																					: note.action ===
																					  "Accepted by Author(you)"
																					? "bg-green-500"
																					: "bg-blue-500"
																			} text-white`}
																		>
																			{
																				note.action
																			}
																		</span>
																	)}
																</div>
																<p className="text-[#496580] text-sm mt-2">
																	By:{" "}
																	{
																		note
																			.addedBy
																			.name
																	}{" "}
																	(
																	{
																		note
																			.addedBy
																			.role
																	}
																	)<br />
																	Added:{" "}
																	{new Date(
																		note.addedAt
																	).toLocaleString()}
																</p>
															</div>
														)
													)}
												</div>
											)}

											{/* Reviewer Status Buttons */}
											{manuscript.status ===
												"Under Review" &&
												manuscript.assignedReviewers
													?.length > 0 && (
													<div className="mb-4">
														<h5 className="text-[#496580] text-sm font-semibold mb-2">
															Reviewer Status:
														</h5>
														<div className="flex flex-wrap gap-2">
															{manuscript.assignedReviewers.map(
																(reviewer) => {
																	const hasReviewed =
																		manuscript.reviews?.some(
																			(
																				review
																			) =>
																				review.reviewerId.toString() ===
																				reviewer._id.toString()
																		);
																	const initials = `${reviewer.firstName.charAt(
																		0
																	)}${reviewer.lastName.charAt(
																		0
																	)}`;
																	return (
																		<div
																			key={
																				reviewer._id
																			}
																			className="relative group"
																		>
																			<button
																				className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold cursor-default
											${hasReviewed ? "bg-green-500" : "bg-red-500"}`}
																				title={`${reviewer.firstName} ${reviewer.lastName}`}
																			>
																				{
																					initials
																				}
																			</button>
																			<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
																				{`${reviewer.firstName} ${reviewer.lastName}`}
																			</div>
																		</div>
																	);
																}
															)}
														</div>
													</div>
												)}

											{/* Author Notes */}
											{manuscript.authorNotes?.length >
												0 && (
												<div className="mb-4">
													<h5 className="text-blue-500 text-sm font-semibold mb-2">
														Author Notes:
													</h5>
													{manuscript.authorNotes.map(
														(note, noteIndex) => (
															<div
																key={`author-${noteIndex}`}
																className="bg-white p-3 rounded mb-2 border border-[#e2e8f0]"
															>
																<div className="flex justify-between items-start">
																	<p className="text-[#1a365d]">
																		{
																			note.text
																		}
																	</p>
																	{note.action && (
																		<span className="px-2 py-1 rounded text-xs bg-blue-500 text-white">
																			{
																				note.action
																			}
																		</span>
																	)}
																</div>
																<p className="text-[#496580] text-sm mt-2">
																	By:{" "}
																	{
																		note
																			.addedBy
																			.name
																	}{" "}
																	(
																	{
																		note
																			.addedBy
																			.role
																	}
																	)<br />
																	Added:{" "}
																	{new Date(
																		note.addedAt
																	).toLocaleString()}
																</p>
															</div>
														)
													)}
												</div>
											)}

											{/* Reviewer Notes */}
											{manuscript.reviewerNotes?.length >
												0 && (
												<div className="mb-4">
													<h5 className="text-green-500 text-sm font-semibold mb-2">
														Reviewer Notes:
													</h5>
													{manuscript.reviewerNotes.map(
														(note, noteIndex) => (
															<div
																key={`reviewer-${noteIndex}`}
																className="bg-white p-3 rounded mb-2 border border-[#e2e8f0]"
															>
																<div className="flex justify-between items-start">
																	<p className="text-[#1a365d]">
																		{
																			note.text
																		}
																	</p>
																	{note.action && (
																		<span className="px-2 py-1 rounded text-xs bg-green-500 text-white">
																			{
																				note.action
																			}
																		</span>
																	)}
																</div>
																<p className="text-[#496580] text-sm mt-2">
																	By:{" "}
																	{
																		note
																			.addedBy
																			.name
																	}{" "}
																	(
																	{
																		note
																			.addedBy
																			.role
																	}
																	)<br />
																	Added:{" "}
																	{new Date(
																		note.addedAt
																	).toLocaleString()}
																</p>
															</div>
														)
													)}
												</div>
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

						{/* Reviewer Notes Section */}
						{selectedManuscript.reviewerNotes?.length > 0 && (
							<div className="mb-6">
								<h3 className="text-lg font-semibold text-green-500 mb-3">
									Reviewer Notes
								</h3>
								<div className="space-y-3">
									{selectedManuscript.reviewerNotes.map(
										(note, index) => (
											<div
												key={index}
												className="bg-[#f8fafc] p-4 rounded border border-[#e2e8f0]"
											>
												<p className="text-[#1a365d] mb-2">
													{note.text}
												</p>
												<div className="flex items-center justify-between">
													<span
														className={`px-2 py-1 text-xs rounded ${
															note.action ===
															"Accept"
																? "bg-green-500"
																: note.action ===
																  "Minor Revision"
																? "bg-yellow-500"
																: note.action ===
																  "Major Revision"
																? "bg-orange-500"
																: "bg-red-500"
														} text-white`}
													>
														{note.action}
													</span>
													<span className="text-[#496580] text-sm">
														By {note.addedBy.name} (
														{note.addedBy.role})
													</span>
												</div>
											</div>
										)
									)}
								</div>
							</div>
						)}

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
		</div>
	);
}

export default EditorDashboard;
