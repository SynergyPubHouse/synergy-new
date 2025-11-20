import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../App";
import { Link, useNavigate } from "react-router-dom";
import { CLOSING } from "ws";

const BASE_URL = "/journal/jics";

const MySubmissions = () => {
	const { user } = useAuth();
	const [manuscripts, setManuscripts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [showConfirmation, setShowConfirmation] = useState(null);
	const [showNotes, setShowNotes] = useState(null);
	const [uploadingResponseFor, setUploadingResponseFor] = useState(null);
	const [buildingPdfFor, setBuildingPdfFor] = useState(null);
	const [pdfViewedIds, setPdfViewedIds] = useState(new Set());
	const navigate = useNavigate();
	console.log("menuscript", manuscripts)
	useEffect(() => {
		fetchManuscripts();
	}, [user?.token]);

	const fetchManuscripts = async () => {
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_BACKEND_URL
				}/api/manuscripts/my-submissions`,
				{
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				}
			);
			setManuscripts(response.data);
			setPdfViewedIds((prev) => {
				const updated = new Set();
				(response.data || []).forEach((manuscript) => {
					if (prev.has(manuscript._id)) {
						updated.add(manuscript._id);
					}
				});
				return updated;
			});
			setLoading(false);
		} catch (err) {
			console.error("Error fetching manuscripts:", err);
			setError("Failed to fetch manuscripts");
			setLoading(false);
		}
	};

	const handleViewPdf = (manuscriptId, mergedFileUrl) => {
		if (mergedFileUrl) {
			window.open(mergedFileUrl, "_blank");
			setPdfViewedIds((prev) => {
				const updated = new Set(prev);
				updated.add(manuscriptId);
				return updated;
			});
		} else {
			alert("PDF is not available yet.");
		}
	};

	const handleResponseUpload = async (manuscriptId, file) => {
		if (!file) return;
		if (!file.name.toLowerCase().endsWith(".docx")) {
			alert("Please upload a DOCX file for your response.");
			return;
		}

		const manuscript = manuscripts.find((m) => m._id === manuscriptId);
		if (!manuscript) {
			alert("Manuscript not found.");
			return;
		}
		if (manuscript.revisionLocked || manuscript.status === "Rejected") {
			alert(
				"All revision attempts are exhausted. You cannot upload additional responses."
			);
			return;
		}

		try {
			setUploadingResponseFor(manuscriptId);
			const formData = new FormData();
			formData.append("responseDoc", file);
			await axios.post(
				`${import.meta.env.VITE_BACKEND_URL
				}/api/manuscripts/${manuscriptId}/upload-response`,
				formData,
				{
					headers: {
						"Content-Type": "multipart/form-data",
						Authorization: `Bearer ${user.token}`,
					},
				}
			);
			alert("Response document uploaded successfully.");
			await fetchManuscripts();
		} catch (error) {
			console.error("Error uploading response document:", error);
			alert("Failed to upload response document. Please try again.");
		} finally {
			setUploadingResponseFor(null);
		}
	};

	const handleBuildRevisionPdf = async (manuscriptId) => {
		const manuscript = manuscripts.find((m) => m._id === manuscriptId);
		if (!manuscript) {
			alert("Manuscript not found.");
			return;
		}
		if (manuscript.revisionLocked || manuscript.status === "Rejected") {
			alert(
				"All revision attempts are exhausted. You cannot build a new PDF."
			);
			return;
		}

		try {
			setBuildingPdfFor(manuscriptId);
			const response = await axios.post(
				`${import.meta.env.VITE_BACKEND_URL
				}/api/manuscripts/${manuscriptId}/build-revision-pdf`,
				{},
				{
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				}
			);

			if (response.data?.success) {
				alert(
					"Updated PDF built successfully. Please review it before sending to the editor."
				);
				await fetchManuscripts();
			} else {
				alert("PDF build completed, but no URL was returned.");
			}
		} catch (error) {
			console.error("Error building updated PDF:", error);
			alert(
				error.response?.data?.message ||
				"Failed to build updated PDF. Please try again."
			);
		} finally {
			setBuildingPdfFor(null);
		}
	};

	const handleSendToEditor = async (manuscriptId) => {
		const manuscript = manuscripts.find((m) => m._id === manuscriptId);
		if (!manuscript) {
			alert("Manuscript not found.");
			return;
		}
		if (manuscript.revisionLocked || manuscript.status === "Rejected") {
			alert(
				"All revision attempts are exhausted. This manuscript is already rejected."
			);
			return;
		}

		try {
			await axios.put(
				`${import.meta.env.VITE_BACKEND_URL
				}/api/manuscripts/${manuscriptId}/status`,
				{ status: "Pending" },
				{
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				}
			);
			alert("Revision sent to the editor successfully.");
			setPdfViewedIds((prev) => {
				const updated = new Set(prev);
				updated.delete(manuscriptId);
				return updated;
			});
			await fetchManuscripts();
		} catch (error) {
			console.error("Error sending manuscript to editor:", error);
			alert("Failed to update manuscript status. Please try again.");
		}
	};

	const handleDownloadReviewDocx = (reviewDocxUrl) => {
		if (reviewDocxUrl) {
			window.open(reviewDocxUrl, "_blank");
		} else {
			alert("Review comments document is not available yet.");
		}
	};

	const handleWithdrawal = async (manuscriptId) => {
		try {
			await axios.delete(
				`${import.meta.env.VITE_BACKEND_URL
				}/api/manuscripts/${manuscriptId}`,
				{
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				}
			);
			setShowConfirmation(null);
			fetchManuscripts();
			alert("Manuscript withdrawn successfully");
		} catch (error) {
			console.error("Error withdrawing manuscript:", error);
			alert("Failed to withdraw manuscript");
		}
	};

	const handleAccept = async (manuscriptId) => {
		try {
			await axios.put(
				`${import.meta.env.VITE_BACKEND_URL
				}/api/manuscripts/${manuscriptId}/status`,
				{ status: "Pending" },
				{
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				}
			);
			fetchManuscripts();
			alert(
				"Manuscript submitted successfully and pending editor review"
			);
		} catch (error) {
			console.error("Error accepting manuscript:", error);
			alert("Failed to submit manuscript");
		}
	};

	const handleNotesClick = (manuscriptId) => {
		setShowNotes(manuscriptId);
	};

	const renderNotes = (manuscript) => {
		if (!manuscript) return null;

		// Authors can only see editorNotesForAuthor
		const notes = manuscript.editorNotesForAuthor;
		const title = "Editor Notes for Author";

		return (
			<div className="mt-4 p-4 bg-[#e0f7fa] rounded-lg border border-[#e0e0e0]">
				<h3 className="text-lg font-semibold text-[#00796b] mb-3">
					{title}
				</h3>
				{notes && notes.length > 0 ? (
					<div className="space-y-3">
						{notes.map((note, index) => (
							<div
								key={index}
								className="bg-white p-3 rounded border border-[#e0e0e0]"
							>
								<p className="text-[#212121]">{note.text}</p>
								<div className="mt-2 flex justify-between items-center">
									<span className="text-sm text-[#00796b]">
										By: {note.addedBy.name} (
										{note.addedBy.role})
									</span>
									<span className="text-sm text-[#00796b]">
										{new Date(
											note.addedAt
										).toLocaleString()}
									</span>
								</div>
								{note.action && (
									<div className="mt-2">
										<span
											className={`px-2 py-1 text-xs rounded ${note.action === "Rejected"
												? "bg-red-500"
												: note.action ===
													"Under Review"
													? "bg-yellow-500"
													: note.action === "Accepted"
														? "bg-green-500"
														: "bg-blue-500"
												} text-white`}
										>
											{note.action}
										</span>
									</div>
								)}
							</div>
						))}
					</div>
				) : (
					<p className="text-[#00796b]">
						No {title.toLowerCase()} available.
					</p>
				)}
			</div>
		);
	};

	const getStatusColor = (status) => {
		switch (status) {
			case "Under Review":
				return "text-[#00796b]";
			case "Rejected":
				return "text-red-500";
			case "Accepted":
				return "text-green-500";
			default:
				return "text-[#00796b]";
		}
	};

	const handleViewManuscript = (manuscriptId) => {
		navigate(`${BASE_URL}/manuscript/${manuscriptId}`);
	};

	const handleEditManuscript = (manuscriptId) => {
		navigate(`${BASE_URL}/edit-manuscript/${manuscriptId}`);
	};

	const handleSubmitNewManuscript = () => {
		navigate(`${BASE_URL}/submit-manuscript`);
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center">
				<div className="text-[#00796b] text-xl">Loading...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center">
				<div className="text-red-500 text-xl">{error}</div>
			</div>
		);
	}



	const handleUploadHighlightedFile = async (manuscriptId, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("highlightedFile", file);

    try {
        await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/${manuscriptId}/upload-highlighted`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${user.token}`,
                },
            }
        );

        alert("Highlighted revision file uploaded successfully.");
        await fetchManuscripts();
    } catch (err) {
        alert("Failed to upload highlighted file");
        console.error(err);
    }
};





	return (
		<div className="min-h-screen bg-[#f9f9f9] p-6 text-[#212121] mt-20 md:mt-16">
			<div className="max-w-6xl mx-auto">
				<div className="flex justify-between items-center mb-8">
					<h1 className="text-3xl font-bold text-[#00796b] font-serif">
						My Submissions
					</h1>
					<Link
						to={`${BASE_URL}/submit`}
						className="px-4 py-2 bg-[#00796b] hover:bg-[#00acc1] text-white font-semibold rounded-lg transition-colors"
					>
						Submit New Manuscript
					</Link>
				</div>

				{manuscripts.length === 0 ? (
					<div className="text-center py-8 bg-white rounded-lg border border-[#e0e0e0]">
						<p className="text-[#00796b]">
							No manuscripts submitted yet.
						</p>
					</div>
				) : (
					<div className="space-y-6">
						{manuscripts.map((manuscript) => {
							const attemptsUsed = manuscript.revisionAttempts || 0;
							const maxAttempts = manuscript.maxRevisionAttempts || 3;
							const attemptsExhausted =
								manuscript.revisionLocked ||
								attemptsUsed >= maxAttempts ||
								manuscript.status === "Rejected";
							const hasResponseDoc =
								Boolean(manuscript.authorResponse?.pdfUrl) ||
								Boolean(manuscript.authorResponse?.docxUrl);
							const hasBuiltRevision = Boolean(
								manuscript.revisedPdfBuiltAt
							);
							const canSendToEditor =
								manuscript.status === "Revision Required" &&
								hasBuiltRevision &&
								pdfViewedIds.has(manuscript._id) &&
								!attemptsExhausted;


							return (
								<div
									key={manuscript._id}
									className="bg-white rounded-lg p-6 shadow-md border border-[#e0e0e0]"
								>
									<div className="flex justify-between items-center mb-4 border-b border-[#e0e0e0] pb-4">
										<h2 className="text-xl font-bold text-[#00796b]">
											{manuscript.title}
										</h2>
										<div className="text-right">
											<div className="text-sm text-[#00796b] font-medium">
												Manuscript ID:{" "}
												{manuscript.customId || manuscript._id
													.slice(-6)
													.toUpperCase()}
											</div>
											<div className="text-xs text-gray-500 mt-1">
												{manuscript.createdAt
													? `Submitted: ${new Date(
														manuscript.createdAt
													).toLocaleDateString(
														"en-US",
														{
															month: "short",
															day: "numeric",
															year: "numeric",
														}
													)} at ${new Date(
														manuscript.createdAt
													).toLocaleTimeString(
														"en-US",
														{
															hour: "2-digit",
															minute: "2-digit",
														}
													)}`
													: "Date not available"}
											</div>
										</div>
									</div>

									{/* Timestamp Section */}
									<div className="mb-4 bg-[#f5f5f5] p-3 rounded-lg border border-[#e0e0e0]">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
											<div className="flex items-center">
												<span className="font-semibold text-[#00796b] mr-2">
													Submitted:
												</span>
												<span className="text-[#212121]">
													{manuscript.createdAt
														? new Date(
															manuscript.createdAt
														).toLocaleDateString(
															"en-US",
															{
																year: "numeric",
																month: "long",
																day: "numeric",
															}
														)
														: "N/A"}
												</span>
											</div>
											<div className="flex items-center">
												<span className="font-semibold text-[#00796b] mr-2">
													Time:
												</span>
												<span className="text-[#212121]">
													{manuscript.createdAt
														? new Date(
															manuscript.createdAt
														).toLocaleTimeString(
															"en-US",
															{
																hour: "2-digit",
																minute: "2-digit",
																hour12: true,
															}
														)
														: "N/A"}
												</span>
											</div>
											{manuscript.updatedAt &&
												manuscript.updatedAt !==
												manuscript.createdAt && (
													<>
														<div className="flex items-center">
															<span className="font-semibold text-[#00796b] mr-2">
																Last Updated:
															</span>
															<span className="text-[#212121]">
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
															</span>
														</div>
														<div className="flex items-center">
															<span className="font-semibold text-[#00796b] mr-2">
																Updated Time:
															</span>
															<span className="text-[#212121]">
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
															</span>
														</div>
													</>
												)}
										</div>
									</div>

									<div className="grid grid-cols-3 gap-4">
										<div className="flex items-center justify-center">
											<div className="text-lg font-semibold text-[#00796b]">
												{manuscript.type}
											</div>
										</div>

										<div className="flex flex-col space-y-3 items-center">
											{manuscript.reviewDocxUrl && (
												<button
													onClick={() =>
														handleDownloadReviewDocx(
															manuscript.reviewDocxUrl
														)
													}
													className="w-full px-4 py-2 bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-semibold rounded-lg transition-colors"
												>
													📄 Download Review Comments
												</button>
											)}
											{manuscript.reviewDocxUrl  && (
												<button
													onClick={() =>
														handleBuildRevisionPdf(
															manuscript._id
														)
													}
													disabled={
														!hasResponseDoc ||
														buildingPdfFor ===
														manuscript._id ||
														attemptsExhausted
													}
													className={`w-full px-4 py-2 font-semibold rounded-lg transition-colors ${!hasResponseDoc
														? "bg-gray-300 text-gray-500 cursor-not-allowed"
														: buildingPdfFor ===
															manuscript._id
															? "bg-[#ff9800] text-white cursor-wait"
															: attemptsExhausted
																? "bg-gray-300 text-gray-500 cursor-not-allowed"
																: "bg-[#ff9800] hover:bg-[#fb8c00] text-white"
														}`}
												>
													{buildingPdfFor === manuscript._id
														? "Building..."
														: "Build Updated PDF"}
												</button>
											)}
										{/* Original PDF */}
{manuscript.mergedFileUrl && (
  <button
    onClick={() => {
      window.open(manuscript.mergedFileUrl, "_blank");
      setPdfViewedIds((prev) => {
        const updated = new Set(prev);
        updated.add(manuscript._id);
        return updated;
      });
    }}
    className="w-full px-4 py-2 bg-[#00796b] hover:bg-[#00acc1] text-white font-semibold rounded-lg transition-colors mb-2"
  >
    📄 View Original PDF
  </button>
)}

{/* Highlighted Revision */}
{manuscript.highlightedRevisionFileUrl && (
  <button
    onClick={() => {
      const url = manuscript.highlightedRevisionFileUrl;
      const viewerUrl = url.endsWith(".pdf")
        ? url
        : `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
      window.open(viewerUrl, "_blank");
    }}
    className="w-full px-4 py-2 bg-[#00796b] hover:bg-[#00acc1] text-white font-semibold rounded-lg transition-colors mb-2"
  >
    ✏️ View Highlighted Revision
  </button>
)}

{/* Combined Revision PDF */}
{manuscript.revisionCombinedPdfUrl && (
  <button
    onClick={() => {
      window.open(manuscript.revisionCombinedPdfUrl, "_blank");
      setPdfViewedIds((prev) => {
        const updated = new Set(prev);
        updated.add(manuscript._id);
        return updated;
      });
    }}
    className="w-full px-4 py-2 bg-[#00796b] hover:bg-[#00acc1] text-white font-semibold rounded-lg transition-colors"
  >
    📑 View Combined Revision PDF
  </button>
)}

											{manuscript.revisedPdfBuiltAt &&
												!pdfViewedIds.has(manuscript._id) &&
												manuscript.status ===
												"Revision Required" && (
													<p className="text-xs text-[#00796b] text-center">
														View the updated PDF to
														enable "Send to Editor".
													</p>
												)}
											{canSendToEditor && (
												<button
													onClick={() =>
														handleSendToEditor(
															manuscript._id
														)
													}
													className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
												>
													Send to Editor
												</button>
											)}
											<button
												onClick={() =>
													handleNotesClick(manuscript._id)
												}
												className={`w-full px-4 py-2 
												 bg-purple-500 hover:bg-purple-600 text-white
													
											 font-semibold rounded-lg transition-colors`}
											>
												Notes
											</button>
										</div>

										<div className="flex items-center justify-center">
											<span
												className={`text-lg font-semibold ${getStatusColor(
													manuscript.status
												)}`}
											>
												{manuscript.status || "Pending"}
											</span>
										</div>
									</div>

									{manuscript.status === "Revision Required" && (
										<p className="text-xs text-[#496580] mt-2">
											Revision attempts used: {attemptsUsed}/
											{maxAttempts}
										</p>
									)}
									{attemptsExhausted && (
										<p className="text-xs text-red-600 font-semibold mt-1">
											All revision attempts exhausted. Manuscript automatically rejected.
										</p>
									)}

									{manuscript.reviewDocxUrl && (
	<div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
		<p className="text-sm font-semibold text-[#00796b] mb-2">
			Response to Reviewers
		</p>

		{/* RESPONSE DOCX UPLOAD */}
		<div className="flex flex-col md:flex-row gap-3">
			<input
				type="file"
				accept=".docx"
				onChange={(e) => {
					handleResponseUpload(
						manuscript._id,
						e.target.files?.[0]
					);
					e.target.value = null;
				}}
				disabled={
					uploadingResponseFor === manuscript._id ||
					attemptsExhausted
				}
				className="w-full border border-dashed border-[#00796b] rounded-lg px-3 py-2 text-sm text-[#00796b] bg-white"
			/>
			{manuscript.authorResponse?.docxUrl && (
				<a
					href={manuscript.authorResponse.docxUrl}
					target="_blank"
					rel="noreferrer"
					className="text-sm text-[#00796b] underline"
				>
					View uploaded response
				</a>
			)}
		</div>

		{/* Show uploading text */}
		{uploadingResponseFor === manuscript._id && (
			<p className="text-xs text-[#00796b] mt-2">Uploading response...</p>
		)}

		{/* HIGHLIGHTED FILE UPLOAD */}
		<div className="mt-3">
			<p className="text-sm font-semibold text-[#00796b] mb-1">
				Upload Highlighted Revision File
			</p>

			<input
				type="file"
				accept=".doc,.docx,.pdf"
				onChange={(e) => {
					handleUploadHighlightedFile(
						manuscript._id,
						e.target.files?.[0]
					);
					e.target.value = null;
				}}
				disabled={attemptsExhausted}
				className="w-full border border-dashed border-[#00796b] rounded-lg px-3 py-2 text-sm text-[#00796b] bg-white"
			/>

			{manuscript.highlightedRevisionFileUrl && (
				<a
					href={manuscript.highlightedRevisionFileUrl}
					target="_blank"
					rel="noreferrer"
					className="text-sm text-[#00796b] underline mt-2 inline-block"
				>
					View Uploaded Highlighted File
				</a>
			)}
		</div>

		{/* Disable messages */}
		{!hasResponseDoc && (
			<p className="text-xs text-[#00796b] mt-2">
				Upload your response DOCX to enable the updated PDF build.
			</p>
		)}

		{attemptsExhausted && (
			<p className="text-xs text-red-600 font-semibold mt-2">
				Uploads disabled because all revision attempts are exhausted.
			</p>
		)}
	</div>
)}

									{showNotes === manuscript._id && (
										<div className="mt-4">
											{renderNotes(manuscript)}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>
			

			{showConfirmation && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 border border-[#e0e0e0]">
						<h3 className="text-xl font-bold text-[#00796b] mb-4">
							Warning!
						</h3>
						<p className="text-[#00796b] mb-6">
							Are you sure you want to withdraw this manuscript?
							This action cannot be undone and all data will be
							permanently deleted.
						</p>
						<div className="flex justify-end space-x-4">
							<button
								onClick={() => setShowConfirmation(null)}
								className="px-4 py-2 bg-[#f9f9f9] text-[#00796b] rounded-lg hover:bg-[#e0e0e0] transition-colors border border-[#e0e0e0]"
							>
								Cancel
							</button>
							<button
								onClick={() =>
									handleWithdrawal(showConfirmation)
								}
								className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
							>
								Confirm Withdrawal
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default MySubmissions;
