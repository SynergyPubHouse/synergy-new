import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function ReviewerDashboard() {
	const [users, setUsers] = useState([]);
	const [selectedUser, setSelectedUser] = useState(null);
	const [manuscripts, setManuscripts] = useState([]);
	const navigate = useNavigate();
	const [showReviewForm, setShowReviewForm] = useState(null); // Store manuscript ID when showing form
	const [reviewText, setReviewText] = useState("");
	const [recommendation, setRecommendation] = useState(""); // For storing review recommendation
	const [pendingInvitations, setPendingInvitations] = useState([]);
	const [showRejectForm, setShowRejectForm] = useState(null); // Store manuscript ID when showing reject form
	const [rejectionReason, setRejectionReason] = useState(""); // For storing rejection reason

	useEffect(() => {
		const fetchManuscripts = async () => {
			try {
				const userData = JSON.parse(localStorage.getItem("user"));
				if (!userData || !userData.token) {
					console.error("No token found");
					navigate("/reviewer/login");
					return;
				}

				console.log("Fetching manuscripts with token:", userData.token);
				const response = await axios.get(
					`${
						import.meta.env.VITE_BACKEND_URL
					}/api/auth/reviewer/assigned-manuscripts`,
					{
						headers: {
							Authorization: `Bearer ${userData.token}`,
						},
					}
				);

				console.log("Received manuscripts:", response.data);

				// Group manuscripts by author's full name
				const userManuscripts = {};
				response.data.forEach((manuscript) => {
					console.log("Processing manuscript:", manuscript.title);
					console.log(
						"Manuscript author object (raw):",
						manuscript.author
					); // Added log

					let authorFullName = "Unknown Author";
					let firstName = "";
					let lastName = "";
					let authorId = ""; // Initialize authorId

					// Assuming manuscript.author is always an object now due to backend populate
					if (
						manuscript.author &&
						typeof manuscript.author === "object"
					) {
						firstName = manuscript.author.firstName || "";
						lastName = manuscript.author.lastName || "";
						authorFullName = `${firstName} ${lastName}`.trim();
						authorId = manuscript.author._id || "";
					} else {
						// Fallback if manuscript.author is unexpectedly not an object or null
						console.warn(
							"Manuscript author is not an object or is null/undefined:",
							manuscript.author
						);
						authorId = manuscript._id; // Use manuscript ID as a fallback for grouping
					}

					// If authorFullName is still empty (e.g., if firstName/lastName were empty),
					// ensure it defaults to 'Unknown Author' and use a reliable ID for grouping.
					if (!authorFullName || authorFullName.trim() === "") {
						authorFullName = "Unknown Author";
					}
					if (!authorId) {
						authorId = manuscript._id; // Ensure an ID for grouping if author._id is missing
					}

					// Use authorId for grouping to ensure unique authors are correctly identified
					const groupKey = authorId;

					if (!userManuscripts[groupKey]) {
						userManuscripts[groupKey] = {
							_id: authorId,
							firstName,
							lastName,
							fullName: authorFullName,
							manuscripts: [],
						};
					}
					userManuscripts[groupKey].manuscripts.push(manuscript);
				});

				const usersList = Object.values(userManuscripts);
				console.log("Grouped manuscripts by author:", usersList);

				setUsers(usersList);
				if (usersList.length > 0) {
					setSelectedUser(usersList[0]);
					setManuscripts(usersList[0].manuscripts);
				}
			} catch (error) {
				console.error("Error fetching manuscripts:", error);
				if (error.response?.status === 401) {
					navigate("/reviewer/login");
				}
			}
		};

		const fetchInvitations = async () => {
			try {
				const userData = JSON.parse(localStorage.getItem("user"));
				if (!userData || !userData.token) {
					return;
				}

				const response = await axios.get(
					`${
						import.meta.env.VITE_BACKEND_URL
					}/api/auth/reviewer/pending-invitations`,
					{
						headers: {
							Authorization: `Bearer ${userData.token}`,
						},
					}
				);
				setPendingInvitations(response.data);
			} catch (error) {
				console.error("Error fetching invitations:", error);
			}
		};

		fetchManuscripts();
		fetchInvitations();
	}, [navigate]);

	const handleUserClick = (user) => {
		setSelectedUser(user);
		setManuscripts(user.manuscripts || []);
	};

	const handleViewPDF = (manuscriptUrl) => {
		console.log("Attempting to open PDF with URL:", manuscriptUrl);
		if (manuscriptUrl) {
			// The URL should already be properly formatted from the backend
			console.log("Opening PDF at:", manuscriptUrl);
			window.open(manuscriptUrl, "_blank");
		} else {
			console.error("No PDF URL available for manuscript");
			alert("PDF not available");
		}
	};

	const handleAddReview = async (manuscriptId) => {
		try {
			const userData = JSON.parse(localStorage.getItem("user"));
			if (!reviewText.trim() || !recommendation) {
				alert(
					"Please provide both review comments and a recommendation"
				);
				return;
			}

			// Create a properly structured reviewer note
			const reviewerNote = {
				text: reviewText,
				action: recommendation,
				addedBy: {
					name: `${userData.firstName} ${userData.lastName}`,
					role: "reviewer",
				},
				addedAt: new Date(),
			};

			// Submit the review with the structured note
			const response = await axios.post(
				`${
					import.meta.env.VITE_BACKEND_URL
				}/api/auth/reviewer/manuscripts/${manuscriptId}/review`,
				{
					comments: reviewText,
					recommendation: recommendation,
					reviewerNote: reviewerNote,
				},
				{
					headers: {
						Authorization: `Bearer ${userData.token}`,
					},
				}
			);

			console.log("Review submission response:", response.data);

			// Update the manuscript status directly first
			const statusResponse = await axios.put(
				`${
					import.meta.env.VITE_BACKEND_URL
				}/api/manuscripts/${manuscriptId}/status`,
				{ status: "Reviewed" },
				{
					headers: {
						Authorization: `Bearer ${userData.token}`,
					},
				}
			);

			console.log("Status update response:", statusResponse.data);

			// Fetch updated manuscript data
			const updatedResponse = await axios.get(
				`${
					import.meta.env.VITE_BACKEND_URL
				}/api/auth/reviewer/assigned-manuscripts`,
				{
					headers: {
						Authorization: `Bearer ${userData.token}`,
					},
				}
			);

			console.log("Updated manuscripts data:", updatedResponse.data);

			// Update manuscripts state with fresh data
			const userManuscripts = {};
			updatedResponse.data.forEach((manuscript) => {
				const authorFullName =
					typeof manuscript.author === "string"
						? manuscript.author
						: manuscript.author.fullName ||
						  `${manuscript.author.firstName} ${manuscript.author.lastName}`;

				if (!userManuscripts[authorFullName]) {
					userManuscripts[authorFullName] = {
						_id: manuscript._id,
						firstName:
							typeof manuscript.author === "string"
								? manuscript.author.split(" ")[0]
								: manuscript.author.firstName,
						lastName:
							typeof manuscript.author === "string"
								? manuscript.author.split(" ")[1] || ""
								: manuscript.author.lastName,
						fullName: authorFullName,
						manuscripts: [],
					};
				}
				userManuscripts[authorFullName].manuscripts.push({
					...manuscript,
					status:
						manuscript._id === manuscriptId
							? "Reviewed"
							: manuscript.status,
					reviewerNotes:
						manuscript._id === manuscriptId
							? [
									...(manuscript.reviewerNotes || []),
									reviewerNote,
							  ]
							: manuscript.reviewerNotes,
				});
			});

			console.log("Processed user manuscripts:", userManuscripts);

			const usersList = Object.values(userManuscripts);
			setUsers(usersList);
			if (selectedUser) {
				const updatedSelectedUser = usersList.find(
					(u) => u.fullName === selectedUser.fullName
				);
				if (updatedSelectedUser) {
					console.log(
						"Setting updated manuscripts:",
						updatedSelectedUser.manuscripts
					);
					setSelectedUser(updatedSelectedUser);
					setManuscripts(updatedSelectedUser.manuscripts);
				}
			}

			// Reset form
			setReviewText("");
			setRecommendation("");
			setShowReviewForm(null);
			alert("Review submitted successfully!");
		} catch (error) {
			console.error("Error submitting review:", error);
			alert("Failed to submit review");
		}
	};

	// Handle accepting invitation
	const handleAcceptInvitation = async (manuscriptId) => {
		try {
			const userData = JSON.parse(localStorage.getItem("user"));
			await axios.post(
				`${
					import.meta.env.VITE_BACKEND_URL
				}/api/auth/reviewer/manuscripts/${manuscriptId}/accept-invitation`,
				{},
				{
					headers: {
						Authorization: `Bearer ${userData.token}`,
					},
				}
			);

			// Remove from pending invitations
			setPendingInvitations((prev) =>
				prev.filter((inv) => inv._id !== manuscriptId)
			);
			alert("Invitation accepted successfully!");

			// Refresh manuscripts to show the newly accepted one
			window.location.reload();
		} catch (error) {
			console.error("Error accepting invitation:", error);
			alert("Failed to accept invitation");
		}
	};

	// Handle rejecting invitation
	const handleRejectInvitation = async (manuscriptId) => {
		if (!rejectionReason.trim()) {
			alert("Please provide a reason for rejection");
			return;
		}

		try {
			const userData = JSON.parse(localStorage.getItem("user"));
			await axios.post(
				`${
					import.meta.env.VITE_BACKEND_URL
				}/api/auth/reviewer/manuscripts/${manuscriptId}/reject-invitation`,
				{
					rejectionReason: rejectionReason.trim(),
				},
				{
					headers: {
						Authorization: `Bearer ${userData.token}`,
					},
				}
			);

			// Remove from pending invitations
			setPendingInvitations((prev) =>
				prev.filter((inv) => inv._id !== manuscriptId)
			);
			setShowRejectForm(null);
			setRejectionReason("");
			alert("Invitation rejected successfully!");
		} catch (error) {
			console.error("Error rejecting invitation:", error);
			alert(
				error.response?.data?.message || "Failed to reject invitation"
			);
		}
	};

	return (
		<div className="min-h-screen bg-[#f8fafc] p-6">
			<div className="max-w-6xl mx-auto">
				<h1 className="text-4xl font-bold text-[#1a365d] mb-8 text-center">
					Reviewer Dashboard
				</h1>

				{/* Pending Invitations Section */}
				{pendingInvitations.length > 0 && (
					<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
						<h2 className="text-2xl font-semibold text-yellow-800 mb-4">
							📧 Pending Review Invitations (
							{pendingInvitations.length})
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{pendingInvitations.map((invitation) => (
								<div
									key={invitation._id}
									className="bg-white border border-yellow-300 rounded-lg p-4"
								>
									<h3 className="text-lg font-semibold text-gray-800 mb-2">
										{invitation.title}
									</h3>
									<p className="text-sm text-gray-600 mb-2">
										Type: {invitation.type}
									</p>
									<p className="text-sm text-gray-600 mb-2">
										Keywords: {invitation.keywords}
									</p>
									<p className="text-xs text-gray-500 mb-3">
										Invited:{" "}
										{new Date(
											invitation.invitedAt
										).toLocaleDateString()}
									</p>
									<div className="text-sm text-gray-700 mb-4">
										<strong>Abstract:</strong>
										<p className="mt-1 text-gray-600">
											{invitation.abstract.length > 150
												? `${invitation.abstract.substring(
														0,
														150
												  )}...`
												: invitation.abstract}
										</p>
									</div>

									{showRejectForm === invitation._id ? (
										<div className="mt-4 border-t border-gray-200 pt-4">
											<h4 className="text-sm font-semibold text-red-700 mb-2">
												Rejection Reason (Required)
											</h4>
											<textarea
												value={rejectionReason}
												onChange={(e) =>
													setRejectionReason(
														e.target.value
													)
												}
												className="w-full h-24 p-2 border border-gray-300 rounded text-sm"
												placeholder="Please provide a detailed reason for rejecting this invitation..."
												required
											/>
											<div className="flex space-x-2 mt-3">
												<button
													onClick={() => {
														setShowRejectForm(null);
														setRejectionReason("");
													}}
													className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
												>
													Cancel
												</button>
												<button
													onClick={() =>
														handleRejectInvitation(
															invitation._id
														)
													}
													disabled={
														!rejectionReason.trim()
													}
													className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
												>
													Confirm Rejection
												</button>
											</div>
										</div>
									) : (
										<div className="flex space-x-2">
											<button
												onClick={() =>
													handleAcceptInvitation(
														invitation._id
													)
												}
												className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
											>
												✅ Accept
											</button>
											<button
												onClick={() => {
													setShowRejectForm(
														invitation._id
													);
													setRejectionReason("");
												}}
												className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
											>
												❌ Reject
											</button>
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				)}

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{/* Users List */}
					<div className="bg-white rounded-lg p-6 shadow-lg border border-[#e2e8f0]">
						<h2 className="text-2xl font-semibold text-[#496580] mb-4">
							Authors with Manuscripts Under Review
						</h2>
						<div className="space-y-2">
							{users.map((user) => (
								<button
									key={user._id}
									onClick={() => handleUserClick(user)}
									className={`w-full text-left p-3 rounded-lg transition-all ${
										selectedUser === user
											? "bg-[#496580] text-white"
											: "bg-[#f8fafc] text-[#1a365d] hover:bg-[#e2e8f0]"
									}`}
								>
									{user.fullName}
								</button>
							))}
						</div>
					</div>

					{/* Manuscripts List */}
					<div className="bg-white rounded-lg p-6 shadow-lg border border-[#e2e8f0] col-span-2">
						<h2 className="text-2xl font-semibold text-[#496580] mb-4">
							{selectedUser
								? `Manuscripts Under Review by ${selectedUser.firstName} ${selectedUser.lastName}`
								: "Select an Author"}
						</h2>
						<div className="space-y-4">
							{manuscripts.map((manuscript) => (
								<div
									key={manuscript._id}
									className="bg-[#f8fafc] p-4 rounded-lg border border-[#e2e8f0]"
								>
									<div className="flex justify-between items-start">
										<div>
											<h3 className="text-xl font-semibold text-[#1a365d] mb-2">
												{manuscript.title}
											</h3>
											<p className="text-[#64748b] text-sm">
												Status: {manuscript.status}
											</p>
											<p className="text-[#64748b] text-sm">
												Submitted:{" "}
												{new Date(
													manuscript.submissionDate
												).toLocaleDateString()}
											</p>
										</div>
										<div className="flex flex-col space-y-2">
											<button
												onClick={() =>
													handleViewPDF(
														manuscript.mergedFileUrl
													)
												}
												className="px-4 py-2 bg-[#496580] text-white rounded hover:bg-[#3a5269]"
											>
												View PDF
											</button>
										</div>
									</div>

									{/* Editor Notes Section */}
									{manuscript.editorNotes?.length > 0 && (
										<div className="mt-4 border-t border-[#e2e8f0] pt-4">
											<h4 className="text-[#496580] text-sm font-semibold mb-2">
												Editor Notes:
											</h4>
											<div className="space-y-2">
												{manuscript.editorNotes
													.filter((note) =>
														note.visibility.includes(
															"reviewer"
														)
													)
													.map((note, index) => (
														<div
															key={index}
															className="bg-white p-3 rounded border border-[#e2e8f0]"
														>
															<p className="text-[#1a365d]">
																{note.text}
															</p>
															{note.action && (
																<span
																	className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
																		note.action ===
																		"Under Review"
																			? "bg-[#f59e0b]"
																			: note.action ===
																			  "Reviewed"
																			? "bg-[#3b82f6]"
																			: note.action ===
																			  "Accepted"
																			? "bg-[#10b981]"
																			: "bg-[#ef4444]"
																	} text-white`}
																>
																	{
																		note.action
																	}
																</span>
															)}
															<p className="text-[#64748b] text-xs mt-2">
																Added by:{" "}
																{
																	note.addedBy
																		.name
																}{" "}
																on{" "}
																{new Date(
																	note.addedAt
																).toLocaleString()}
															</p>
														</div>
													))}
											</div>
										</div>
									)}

									{/* Review Form */}
									<div className="mt-4 flex justify-end">
										{showReviewForm !== manuscript._id ? (
											<button
												onClick={() =>
													setShowReviewForm(
														manuscript._id
													)
												}
												className="px-4 py-2 bg-[#10b981] text-white rounded hover:bg-[#059669]"
											>
												Add Review
											</button>
										) : (
											<div className="w-full border-t border-[#e2e8f0] pt-4">
												<h4 className="text-[#10b981] text-lg font-semibold mb-4">
													Add Your Review
												</h4>
												<div className="space-y-4">
													<div>
														<label className="block text-[#1a365d] mb-2">
															Review Comments:
														</label>
														<textarea
															value={reviewText}
															onChange={(e) =>
																setReviewText(
																	e.target
																		.value
																)
															}
															className="w-full h-32 bg-white text-[#1a365d] rounded p-2 border border-[#e2e8f0]"
															placeholder="Enter your review comments here..."
														/>
													</div>
													<div>
														<label className="block text-[#1a365d] mb-2">
															Recommendation:
														</label>
														<select
															value={
																recommendation
															}
															onChange={(e) =>
																setRecommendation(
																	e.target
																		.value
																)
															}
															className="w-full bg-white text-[#1a365d] rounded p-2 border border-[#e2e8f0]"
														>
															<option value="">
																Select a
																recommendation
															</option>
															<option value="Accept">
																Accept
															</option>
															<option value="Minor Revision">
																Minor Revision
															</option>
															<option value="Major Revision">
																Major Revision
															</option>
															<option value="Reject">
																Reject
															</option>
														</select>
													</div>
													<div className="flex justify-end space-x-2">
														<button
															onClick={() => {
																setShowReviewForm(
																	null
																);
																setReviewText(
																	""
																);
																setRecommendation(
																	""
																);
															}}
															className="px-4 py-2 bg-[#64748b] text-white rounded hover:bg-[#475569]"
														>
															Cancel
														</button>
														<button
															onClick={() =>
																handleAddReview(
																	manuscript._id
																)
															}
															disabled={
																!reviewText.trim() ||
																!recommendation
															}
															className="px-4 py-2 bg-[#10b981] text-white rounded hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed"
														>
															Submit Review
														</button>
													</div>
												</div>
											</div>
										)}
									</div>

									{/* Display Reviewer's Previous Notes */}
									{manuscript.reviewerNotes?.length > 0 && (
										<div className="mt-4 border-t border-[#e2e8f0] pt-4">
											<h4 className="text-[#10b981] text-sm font-semibold mb-2">
												Your Previous Reviews:
											</h4>
											<div className="space-y-2">
												{manuscript.reviewerNotes.map(
													(note, index) => (
														<div
															key={index}
															className="bg-white p-3 rounded border border-[#e2e8f0]"
														>
															<p className="text-[#1a365d]">
																{note.text}
															</p>
															{note.action && (
																<span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-[#10b981] text-white">
																	{
																		note.action
																	}
																</span>
															)}
															<p className="text-[#64748b] text-xs mt-2">
																Added on:{" "}
																{new Date(
																	note.addedAt
																).toLocaleString()}
															</p>
														</div>
													)
												)}
											</div>
										</div>
									)}
								</div>
							))}
							{manuscripts.length === 0 && (
								<div className="text-center text-[#64748b]">
									No manuscripts under review from this
									author.
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default ReviewerDashboard;
