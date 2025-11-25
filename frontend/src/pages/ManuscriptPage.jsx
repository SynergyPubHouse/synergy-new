import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../App";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BASE_URL = "/journal/jics";

const ManuscriptPage = () => {
	const { user } = useAuth();
	const navigate = useNavigate();
	const [currentSection, setCurrentSection] = useState(1);
	const totalSections = 6;
	const [pdfBuilt, setPdfBuilt] = useState(false);

	const [formData, setFormData] = useState({
		type: "",
		classification: [],
		additionalInfo: [],
		comments: "",
		title: "",
		keywords: "",
		abstract: "",
		author: [],
		funding: "",
		billingInfo: {
			name: "",
			organization: "",
			address: "",
			city: "",
			state: "",
			postalCode: "",
			country: "",
			awardNumber: "",
			grantRecipient: "",
		},
	});

	const [files, setFiles] = useState({
		manuscript: null,
		coverLetter: null,
		declaration: null,
	});

	const [uploadedFiles, setUploadedFiles] = useState({
		manuscript: false,
		coverLetter: false,
		declaration: false,
	});

	const [dragOver, setDragOver] = useState(false);

	const [completedSections, setCompletedSections] = useState([]);

	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	const [authors, setAuthors] = useState([]);
	const [selectedAuthors, setSelectedAuthors] = useState([]);
	const [allAuthors, setAllAuthors] = useState([]);
	const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
	const [correspondingAuthorId, setCorrespondingAuthorId] = useState(null);

	const [users, setUsers] = useState([]);

	const [newAuthor, setNewAuthor] = useState({
		title: "",
		firstName: "",
		middleName: "",
		lastName: "",
		academicDegree: "",
		email: "",
		institution: "",
		country: "",
		isCorresponding: false,
	});

	// Institution autocomplete state
	const [instQuery, setInstQuery] = useState("");
	const [instSuggestions, setInstSuggestions] = useState([]);
	const [instOpen, setInstOpen] = useState(false);
	const instDebounceRef = useRef(null);
	const isCreatingInstRef = useRef(false);

	// Helper to create institution and apply selection
	const createInstitutionIfNeeded = async (rawName) => {
		const name = (rawName || "").trim();
		if (!name) return;
		if (isCreatingInstRef.current) return; // guard against double-trigger
		try {
			isCreatingInstRef.current = true;
			const resp = await axios.post(
				`${import.meta.env.VITE_BACKEND_URL}/api/institutions`,
				{ name }
			);
			setNewAuthor((prev) => ({ ...prev, institution: resp.data.name }));
			setInstOpen(false);
			toast.success(`Added "${resp.data.name}"`, { position: "top-center", autoClose: 1500 });
		} catch (err) {
			toast.error(
				`Failed to add institution: ${err.response?.data?.message || err.message}`,
				{ position: "top-center", autoClose: 2500 }
			);
		} finally {
			isCreatingInstRef.current = false;
		}
	};

	const [isEmailVerified, setIsEmailVerified] = useState(false);

	const [extractionDone, setExtractionDone] = useState(false);
	const [lastExtractedFile, setLastExtractedFile] = useState(null);
	const [isExtracting, setIsExtracting] = useState(false);

	// State for step 4 item input
	const [itemInput, setItemInput] = useState("");

	// Calculate progress percentage
	const progress = ((currentSection - 1) / (totalSections - 1)) * 100;

	// Step labels for the stepper
	const stepLabels = [
		"Article Type",
		"Upload Files",
		"Classification",
		"Add Items",
		"Comments",
		"Manuscript Details"
	];

	// Short labels for display in circles
	const stepShortLabels = [
		"Type",
		"Upload",
		"Class",
		"Items",
		"Notes",
		"Details"
	];

	const classificationOptions = [
		"Science and Technology – Engineering, Science & Technology (All Branch)",
		"Pharmacy All – Pharmacy (All Branch)",
		"Management All – Management (All Branch)",
		"Mathematics All – Mathematics",
		"Physics All – Physics",
		"Chemistry All – Chemistry",
		"Science All – Science (All Branch)",
		"Arts All – Arts (All Branch)",
		"Arts1 All – Arts and Social Science (All Branch)",
		"Commerce All – Commerce (All Branch)",
		"Life Sciences All – Life Sciences (All Branch)",
		"Languages – Languages (All Branch)",
		"Health Science All – Health Science (All Branch)",
		"Social Science All – Social Science (All Branch)",
		"Medical Science All – Medical Science (All Branch)",
		"Humanities All – Humanities",
		"Commerce and Management, MBA All Branch – Commerce and Management, MBA (All Branch)",
		"Biological Science – Biological Science (All Branch)",
		"Applied Mathematics – Applied Mathematics",
		"Applied Instrumentation – Applied Instrumentation",
		"Others area – Other Research Area Not in this List, Select this",
	];

	// Add countries array at the top of the component
	const countries = [
		"Afghanistan",
		"Albania",
		"Algeria",
		"Andorra",
		"Angola",
		"Antigua and Barbuda",
		"Argentina",
		"Armenia",
		"Australia",
		"Austria",
		"Azerbaijan",
		"Bahamas",
		"Bahrain",
		"Bangladesh",
		"Barbados",
		"Belarus",
		"Belgium",
		"Belize",
		"Benin",
		"Bhutan",
		"Bolivia",
		"Bosnia and Herzegovina",
		"Botswana",
		"Brazil",
		"Brunei",
		"Bulgaria",
		"Burkina Faso",
		"Burundi",
		"Cabo Verde",
		"Cambodia",
		"Cameroon",
		"Canada",
		"Central African Republic",
		"Chad",
		"Chile",
		"China",
		"Colombia",
		"Comoros",
		"Congo",
		"Costa Rica",
		"Croatia",
		"Cuba",
		"Cyprus",
		"Czech Republic",
		"Denmark",
		"Djibouti",
		"Dominica",
		"Dominican Republic",
		"Ecuador",
		"Egypt",
		"El Salvador",
		"Equatorial Guinea",
		"Eritrea",
		"Estonia",
		"Eswatini",
		"Ethiopia",
		"Fiji",
		"Finland",
		"France",
		"Gabon",
		"Gambia",
		"Georgia",
		"Germany",
		"Ghana",
		"Greece",
		"Grenada",
		"Guatemala",
		"Guinea",
		"Guinea-Bissau",
		"Guyana",
		"Haiti",
		"Honduras",
		"Hungary",
		"Iceland",
		"India",
		"Indonesia",
		"Iran",
		"Iraq",
		"Ireland",
		"Israel",
		"Italy",
		"Jamaica",
		"Japan",
		"Jordan",
		"Kazakhstan",
		"Kenya",
		"Kiribati",
		"Korea, North",
		"Korea, South",
		"Kuwait",
		"Kyrgyzstan",
		"Laos",
		"Latvia",
		"Lebanon",
		"Lesotho",
		"Liberia",
		"Libya",
		"Liechtenstein",
		"Lithuania",
		"Luxembourg",
		"Madagascar",
		"Malawi",
		"Malaysia",
		"Maldives",
		"Mali",
		"Malta",
		"Marshall Islands",
		"Mauritania",
		"Mauritius",
		"Mexico",
		"Micronesia",
		"Moldova",
		"Monaco",
		"Mongolia",
		"Montenegro",
		"Morocco",
		"Mozambique",
		"Myanmar",
		"Namibia",
		"Nauru",
		"Nepal",
		"Netherlands",
		"New Zealand",
		"Nicaragua",
		"Niger",
		"Nigeria",
		"North Macedonia",
		"Norway",
		"Oman",
		"Pakistan",
		"Palau",
		"Palestine",
		"Panama",
		"Papua New Guinea",
		"Paraguay",
		"Peru",
		"Philippines",
		"Poland",
		"Portugal",
		"Qatar",
		"Romania",
		"Russia",
		"Rwanda",
		"Saint Kitts and Nevis",
		"Saint Lucia",
		"Saint Vincent and the Grenadines",
		"Samoa",
		"San Marino",
		"Sao Tome and Principe",
		"Saudi Arabia",
		"Senegal",
		"Serbia",
		"Seychelles",
		"Sierra Leone",
		"Singapore",
		"Slovakia",
		"Slovenia",
		"Solomon Islands",
		"Somalia",
		"South Africa",
		"South Sudan",
		"Spain",
		"Sri Lanka",
		"Sudan",
		"Suriname",
		"Sweden",
		"Switzerland",
		"Syria",
		"Taiwan",
		"Tajikistan",
		"Tanzania",
		"Thailand",
		"Timor-Leste",
		"Togo",
		"Tonga",
		"Trinidad and Tobago",
		"Tunisia",
		"Turkey",
		"Turkmenistan",
		"Tuvalu",
		"Uganda",
		"Ukraine",
		"United Arab Emirates",
		"United Kingdom",
		"United States",
		"Uruguay",
		"Uzbekistan",
		"Vanuatu",
		"Vatican City",
		"Venezuela",
		"Vietnam",
		"Yemen",
		"Zambia",
		"Zimbabwe",
	];

	// Check authentication on mount
	useEffect(() => {
		if (!user || !user.token) {
			navigate("/login", {
				state: { from: location.pathname },
			});
		}
	}, [user, navigate]);

	// Add useEffect to initialize the authors list with the current user
	useEffect(() => {
		if (user) {
			// Create main author object from user data
			const mainAuthor = {
				_id: user._id,
				title: user.title || "",
				firstName: user.firstName,
				middleName: user.middleName || "",
				lastName: user.lastName,
				email: user.email,
				institution: user.institution || "",
				country: user.country || "",
				isCorresponding: true,
			};

			// Initialize authors list with main author
			setAuthors([mainAuthor]);
			setSelectedAuthors([user._id]);
			setCorrespondingAuthorId(user._id);
		}
	}, [user]);

	const handleFileChange = (e, doc) => {
		const file = e.target.files[0];
		if (file) {
			// Validate file type
			const validTypes = ['.docx', '.pdf'];
			const fileExtension = file.name.split('.').pop().toLowerCase();

			if (!validTypes.includes(`.${fileExtension}`)) {
				toast.error('Please upload only DOCX or PDF files', {
					position: "top-center",
					autoClose: 3000,
				});
				return;
			}

			setFiles((prev) => ({ ...prev, [doc]: file }));
			setUploadedFiles((prev) => ({ ...prev, [doc]: true }));
		}
	};

	const handleInputChange = (e) => {
		const { name, value, checked } = e.target;
		if (name === "classification") {
			setFormData((prevData) => ({
				...prevData,
				classification: checked
					? [...prevData.classification, value]
					: prevData.classification.filter((item) => item !== value),
			}));
		} else {
			setFormData({ ...formData, [name]: value });
		}
	};

	// Handle adding items in step 4
	const handleAddItem = () => {
		if (itemInput.trim() === "") {
			toast.warning("Please enter an item before adding", {
				position: "top-center",
				autoClose: 2000,
			});
			return;
		}

		const newList = [...formData.additionalInfo, itemInput.trim()];

		setFormData(prev => ({
			...prev,
			additionalInfo: newList,
		}));

		setItemInput("");

		toast.success("Item added successfully", {
			position: "top-center",
			autoClose: 2000,
		});

		// Auto move to next section ONLY once
		if (newList.length === 3) {
			setTimeout(() => {
				setCurrentSection(5);
				setCompletedSections([1, 2, 3, 4]) // section 4 → section 5
			}, 300);
		}
	};


	// Handle billing info nested fields
	const handleBillingInfoChange = (e) => {
		const { name, value } = e.target;
		setFormData((prevData) => ({
			...prevData,
			billingInfo: {
				...prevData.billingInfo,
				[name]: value,
			},
		}));
	};

	const validateSection = (section) => {
		switch (section) {
			case 1:
				if (formData.type === "") {
					toast.error("Please select the type of article", {
						position: "top-center",
						autoClose: 3000,
					});
					return false;
				}
				return true;
			case 2:
				// Check if all required documents are uploaded
				const missingDocs = [];
				if (!files.manuscript) missingDocs.push("Manuscript");
				if (!files.coverLetter) missingDocs.push("Cover Letter");
				if (!files.declaration) missingDocs.push("Declaration");

				if (missingDocs.length > 0) {
					toast.error(`Please upload the following required documents: ${missingDocs.join(", ")}`, {
						position: "top-center",
						autoClose: 4000,
					});
					return false;
				}
				return true;
			case 3:
				if (formData.classification.length === 0) {
					toast.error("Please select at least one classification", {
						position: "top-center",
						autoClose: 3000,
					});
					return false;
				}
				return true;
			case 4:
				if (formData.additionalInfo.length < 3) {
					toast.error("Please add at least 3 items to proceed", {
						position: "top-center",
						autoClose: 3000,
					});
					return false;
				}
				return true;
			case 5:
				// Comments are optional, no validation needed
				return true;
			case 6:
				const errors = [];
				if (formData.title.trim() === "") errors.push("Title");
				if (formData.keywords.trim() === "") errors.push("Keywords");
				if (formData.abstract.trim() === "") errors.push("Abstract");
				if (selectedAuthors.length === 0) errors.push("At least one author");
				if (correspondingAuthorId === null) errors.push("Corresponding author");
				if (formData.funding !== "Yes" && formData.funding !== "No") errors.push("Funding information");

				if (errors.length > 0) {
					toast.error(`Please provide the following required information: ${errors.join(", ")}`, {
						position: "top-center",
						autoClose: 4000,
					});
					return false;
				}
				return true;
			default:
				return false;
		}
	};

	const clearForm = () => {
		setFormData({
			type: "",
			classification: [],
			additionalInfo: [],
			comments: "",
			title: "",
			keywords: "",
			abstract: "",
			author: [],
			funding: "",
		});
		setFiles({ manuscript: null, coverLetter: null });
		setCurrentSection(1);
		setCompletedSections([]);
	};

	const extractTitleAndAbstract = async () => {
		if (!files.manuscript || extractionDone) return;

		setIsExtracting(true);
		try {
			const data = new FormData();
			data.append("manuscript", files.manuscript);
			const response = await axios.post(
				`${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/extract`,
				data,
				{
					headers: {
						"Content-Type": "multipart/form-data",
						Authorization: `Bearer ${user.token}`,
					},
					timeout: 30000, // 30 second timeout
				}
			);
			if (response.data.extractedTitle) {
				setFormData((prev) => ({
					...prev,
					title: response.data.extractedTitle,
				}));
			}
			if (response.data.extractedAbstract) {
				setFormData((prev) => ({
					...prev,
					abstract: response.data.extractedAbstract,
				}));
			}
			if (response.data.extractedKeywords) {
				setFormData((prev) => ({
					...prev,
					keywords: response.data.extractedKeywords,
				}));
			}
			setExtractionDone(true);
			setLastExtractedFile(files.manuscript.name);
		} catch (error) {
			console.error("Error extracting title/abstract/keywords:", error);
			if (error.code === 'ECONNABORTED') {
				toast.error("Extraction timed out. Please try again or enter details manually.", {
					position: "top-center",
					autoClose: 5000,
				});
			} else {
				toast.warning("Could not extract information automatically. Please enter details manually.", {
					position: "top-center",
					autoClose: 4000,
				});
			}
			// Mark as done so user can proceed manually
			setExtractionDone(true);
			setLastExtractedFile(files.manuscript.name);
		} finally {
			setIsExtracting(false);
		}
	};

	const handleNext = async () => {
		if (validateSection(currentSection)) {
			// If moving from section 2 to 3, trigger extraction
			if (currentSection === 2 && files.manuscript && !extractionDone) {
				await extractTitleAndAbstract();
			}
			// Add current section to completed sections if not already there
			if (!completedSections.includes(currentSection)) {
				setCompletedSections((prev) => [...prev, currentSection]);
			}
			setCurrentSection((prev) => Math.min(prev + 1, totalSections));
		}
		// Validation function now handles alert messages
	};

	const handlePrev = () => {
		setCurrentSection((prev) => {
			const newSection = Math.max(prev - 1, 1);
			// Remove current section from completed sections when going back
			setCompletedSections((completed) =>
				completed.filter((section) => section < prev)
			);
			return newSection;
		});
	};

	const handleStepClick = (step) => {
		// Only allow navigation to completed steps or the next sequential step
		if (
			step === 1 ||
			completedSections.includes(step - 1) ||
			step === currentSection + 1
		) {
			setCurrentSection(step);
		} else {
			toast.warning(
				`Please complete the current section before proceeding to step ${step}`,
				{
					position: "top-center",
					autoClose: 3000,
				}
			);
		}
	};

	// DnD: reorder authors on drag end
	const handleAuthorDragEnd = (result) => {
		const { source, destination } = result || {};
		if (!destination) return;
		if (source.index === destination.index) return;
		setSelectedAuthors((prev) => {
			const updated = Array.from(prev);
			const [moved] = updated.splice(source.index, 1);
			updated.splice(destination.index, 0, moved);
			return updated;
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!user?.token) {
			toast.error("Please log in to submit a manuscript", {
				position: "top-center",
				autoClose: 3000,
			});
			return;
		}

		for (let section = 1; section <= 6; section++) {
			if (!validateSection(section)) {
				toast.error(
					`Please complete all required fields in Section ${section}`,
					{
						position: "top-center",
						autoClose: 3000,
					}
				);
				setCurrentSection(section);
				return;
			}
		}

		const data = new FormData();
		Object.keys(formData).forEach((key) => {
			if (key === "additionalInfo") {
				data.append(key, JSON.stringify(formData[key]));
			} else {
				data.append(key, formData[key]);
			}
		});

		// Append files
		if (files.manuscript) {
			data.append("manuscript", files.manuscript);
		}
		if (files.coverLetter) {
			data.append("coverLetter", files.coverLetter);
		}
		if (files.declaration) {
			data.append("declaration", files.declaration);
		}

		try {
			const response = await axios.post(
				`${import.meta.env.VITE_BACKEND_URL}/api/manuscripts`,
				data,
				{
					headers: {
						"Content-Type": "multipart/form-data",
						Authorization: `Bearer ${user.token}`,
					},
				}
			);

			// Auto-fill title and abstract if extracted
			if (response.data.extractedTitle) {
				setFormData((prev) => ({
					...prev,
					title: response.data.extractedTitle,
				}));
			}
			if (response.data.extractedAbstract) {
				setFormData((prev) => ({
					...prev,
					abstract: response.data.extractedAbstract,
				}));
			}

			if (response.data.success) {
				toast.success("Manuscript submitted successfully!", {
					position: "top-center",
					autoClose: 3000,
				});
				clearForm();
				setTimeout(() => navigate(`${BASE_URL}/my-submissions`), 1500);
			} else {
				throw new Error(response.data.message || "Submission failed");
			}
		} catch (error) {
			console.error("Error submitting manuscript:", error);
			if (error.response?.status === 401) {
				toast.error("Your session has expired. Please log in again.", {
					position: "top-center",
					autoClose: 4000,
				});
			} else {
				toast.error(
					"Submission failed: " +
					(error.response?.data?.message || error.message),
					{
						position: "top-center",
						autoClose: 4000,
					}
				);
			}
		}
	};

	const dropdownRef = useRef(null);

	// Handle clicks outside dropdown
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target)
			) {
				setIsDropdownOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	// Add a new function to handle save and submit later

	const [manuscriptId, setManuscriptId] = useState(null);

	// Add a new function to handle save and submit later
	const proceedbeforebuildpdf = async (e) => {
		e.preventDefault();

		if (!user?.token) {
			toast.error("Please log in to submit a manuscript", {
				position: "top-center",
				autoClose: 3000,
			});
			return;
		}

		// Validate all sections
		for (let section = 1; section <= 6; section++) {
			if (!validateSection(section)) {
				toast.error(
					`Please complete all required fields in Section ${section}`,
					{
						position: "top-center",
						autoClose: 3000,
					}
				);
				setCurrentSection(section);
				return;
			}
		}

		// Check if all required files are present
		if (!files.manuscript || !files.coverLetter || !files.declaration) {
			toast.error(
				"Please upload all required files: manuscript, cover letter, and declaration",
				{
					position: "top-center",
					autoClose: 4000,
				}
			);
			setCurrentSection(2); // Navigate to the files section
			return;
		}

		const data = new FormData();
		Object.keys(formData).forEach((key) => {
			if (key === "additionalInfo" || key === "billingInfo") {
				data.append(key, JSON.stringify(formData[key]));
			} else if (key === "classification") {
				data.append(key, JSON.stringify(formData[key]));
			} else {
				data.append(key, formData[key]);
			}
		});

		// Append files
		if (files.manuscript) {
			data.append("manuscript", files.manuscript);
		}
		if (files.coverLetter) {
			data.append("coverLetter", files.coverLetter);
		}
		if (files.declaration) {
			data.append("declaration", files.declaration);
		}

		// Add authors data
		// Add authors data with full author details
		const authorsData = authors.filter(author => selectedAuthors.includes(author._id));
		data.append("authorsData", JSON.stringify(authorsData));
		data.append("authors", JSON.stringify(selectedAuthors));
		data.append("correspondingAuthorId", correspondingAuthorId);

		try {
			const response = await axios.post(
				`${import.meta.env.VITE_BACKEND_URL}/api/manuscripts`,
				data,
				{
					headers: {
						"Content-Type": "multipart/form-data",
						Authorization: `Bearer ${user.token}`,
					},
					timeout: 60000, // 60 second timeout
				}
			);

			if (
				response.data.success &&
				response.data.data &&
				response.data.data._id
			) {
				const id = response.data.data._id;
				setManuscriptId(id);

				// Update status to "Under Review"
				await axios.put(
					`${import.meta.env.VITE_BACKEND_URL
					}/api/manuscripts/${id}/status`,
					{ status: "Under Review" },
					{
						headers: {
							Authorization: `Bearer ${user.token}`,
						},
					}
				);
				// Don't show toast here, let handleProceedAndBuildPdf handle it
				return {
					manuscriptId: response.data.data._id,
					mergedFileUrl: response.data.mergedPdfUrl,
				};
			} else {
				throw new Error(response.data?.message || "Submission failed");
			}
		} catch (error) {
			console.error("Error saving manuscript:", error);
			setIsBuildingPdf(false);

			if (error.code === 'ECONNABORTED') {
				toast.error("Request timed out. Please check your connection and try again.", {
					position: "top-center",
					autoClose: 5000,
				});
			} else if (error.response?.status === 401) {
				toast.error("Your session has expired. Please log in again.", {
					position: "top-center",
					autoClose: 4000,
				});
				navigate("/login", {
					state: { from: location.pathname },
				});
			} else {
				toast.error(
					"Save failed: " +
					(error.response?.data?.message || error.message),
					{
						position: "top-center",
						autoClose: 4000,
					}
				);
			}
			return null;
		}
	};

	const handleAcceptPdf = async () => {
		try {
			await axios.put(
				`${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/${manuscriptId}/status`,
				{ status: "Under Review" },  // 👈 Saved → Pending
				{
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				}
			);

			setAcceptOrRejectPdf(false);

			// Editor ko request chali jayegi, user ko list par redirect
			navigate(`${BASE_URL}/my-submissions`);

		} catch (error) {
			console.error("Error accepting manuscript:", error);
			toast.error("Failed to accept manuscript. Please try again.", {
				position: "top-center",
				autoClose: 3000,
			});
		}
	};

	const handleRejectPdf = async () => {
		try {
			await axios.put(
				`${import.meta.env.VITE_BACKEND_URL
				}/api/manuscripts/${manuscriptId}/status`,
				{ status: "Rejected" },
				{
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				}
			);
			setAcceptOrRejectPdf(false);
			// Redirect to my submissions page
			navigate(`${BASE_URL}/my-submissions`);
		} catch (error) {
			console.error("Error rejecting manuscript:", error);
			toast.error("Failed to reject manuscript. Please try again.", {
				position: "top-center",
				autoClose: 3000,
			});
		}
	};

	const handleBuildPdf = (manuscriptId, mergedFileUrl) => {
		if (mergedFileUrl) {
			window.open(mergedFileUrl, "_blank");
			setPdfBuiltManuscripts((prev) => new Set([...prev, manuscriptId]));
		} else {
			toast.warning("PDF is not available yet.", {
				position: "top-center",
				autoClose: 3000,
			});
		}
	};
	const [pdfBuiltManuscripts, setPdfBuiltManuscripts] = useState(new Set());
	const [isBuildingPdf, setIsBuildingPdf] = useState(false);
	const [pdfUrl, setPdfUrl] = useState(null);
	const [buildError, setBuildError] = useState(null);
	const [AcceptOrRejectPdf, setAcceptOrRejectPdf] = useState(false);
	const [pdfViewed, setPdfViewed] = useState(false);
	console.log("pdfUrl", pdfUrl)
	const handleProceedAndBuildPdf = async (e) => {
		setIsBuildingPdf(true);
		setPdfUrl(null);
		setBuildError(null);
		setPdfViewed(false);

		// Save manuscript
		const result = await proceedbeforebuildpdf(e);
		console.log("result", result)
		if (!result) {
			setIsBuildingPdf(false);
			setBuildError("Failed to save manuscript.");
			return;
		}

		// Check if PDF URL is already available from the result
		let url = result.mergedFileUrl;

		// If URL not available, poll for PDF
		if (!url) {
			let attempts = 0;
			try {
				while (attempts < 12) {
					// Poll for up to 1 minute (12 x 5s)
					const resp = await axios.get(
						`${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/${result.manuscriptId
						}`,
						{
							headers: { Authorization: `Bearer ${user.token}` },
							timeout: 10000 // 10 second timeout per request
						}
					);
					url = resp.data.manuscript.mergedFileUrl;
					if (url) break;
					await new Promise((res) => setTimeout(res, 5000)); // wait 5 seconds
					attempts++;
				}
			} catch (pollError) {
				console.error("Error polling for PDF:", pollError);
				setIsBuildingPdf(false);
				toast.error("Failed to check PDF status. Please try again.", {
					position: "top-center",
					autoClose: 4000,
				});
				return;
			}
		}

		setIsBuildingPdf(false);
		if (url) {
			setPdfUrl(url);
			setManuscriptId(result.manuscriptId); // Store the manuscript ID
			setAcceptOrRejectPdf(true); // Show accept/reject buttons after PDF is built
			toast.success("PDF built successfully!", {
				position: "top-center",
				autoClose: 3000,
			});
		} else {
			setBuildError("PDF generation is taking longer than expected. Please check 'My Submissions' later.");
			toast.warning("PDF generation is taking longer than expected. You can check your submission later.", {
				position: "top-center",
				autoClose: 5000,
			});
		}
	};

	const buildPdf = async (e) => {
		e.preventDefault();

		if (!user?.token) {
			toast.error("Please log in to preview the manuscript", {
				position: "top-center",
				autoClose: 3000,
			});
			return;
		}

		for (let section = 1; section <= 6; section++) {
			if (!validateSection(section)) {
				toast.error(
					`Please complete all required fields in Section ${section}`,
					{
						position: "top-center",
						autoClose: 3000,
					}
				);
				setCurrentSection(section);
				return;
			}
		}

		const data = new FormData();
		Object.keys(formData).forEach((key) => {
			if (key === "additionalInfo") {
				data.append(key, JSON.stringify(formData[key]));
			} else {
				data.append(key, formData[key]);
			}
		});

		// Append files
		if (files.manuscript) {
			data.append("manuscript", files.manuscript);
		}
		if (files.coverLetter) {
			data.append("coverLetter", files.coverLetter);
		}
		if (files.declaration) {
			data.append("declaration", files.declaration);
		}

		try {
			const response = await axios.post(
				`${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/preview`,
				data,
				{
					headers: {
						"Content-Type": "multipart/form-data",
						Authorization: `Bearer ${user.token}`,
					},
				}
			);

			if (response.data.success) {
				const mergedPdfPath = response.data.mergedPdfPath;
				const downloadUrl = `${import.meta.env.VITE_BACKEND_URL
					}/${mergedPdfPath}`;
				window.open(downloadUrl, "_blank");
				setPdfBuilt(true);
			}
		} catch (error) {
			console.error("Error building PDF:", error);
			if (error.response?.status === 401) {
				toast.error("Your session has expired. Please log in again.", {
					position: "top-center",
					autoClose: 4000,
				});
			} else {
				toast.error(
					"Failed to build PDF: " +
					(error.response?.data?.message || error.message),
					{
						position: "top-center",
						autoClose: 4000,
					}
				);
			}
		}
	};

	const handleAddAuthors = () => {
		setIsAuthorModalOpen(true);
	};

	const handleNewAuthorChange = async (e) => {
		const { name, value, type, checked } = e.target;
		setNewAuthor((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));

		// Institution autocomplete: debounce search
		if (name === "institution") {
			setInstQuery(value);
			if (instDebounceRef.current) clearTimeout(instDebounceRef.current);
			if (value && value.trim().length >= 2) {
				instDebounceRef.current = setTimeout(async () => {
					try {
						const resp = await axios.get(
							`${import.meta.env.VITE_BACKEND_URL}/api/institutions/search`,
							{ params: { q: value.trim() } }
						);
						setInstSuggestions(resp.data || []);
						setInstOpen(true);
					} catch (err) {
						setInstSuggestions([]);
						setInstOpen(false);
					}
				}, 700);
			} else {
				setInstSuggestions([]);
				setInstOpen(false);
			}
		}

		// If email field is being changed, verify it
		if (name === "email" && value) {
			// Check if the email is the same as the current user's email
			if (value.toLowerCase() === user.email.toLowerCase()) {
				setIsEmailVerified(false);
				toast.error("You cannot add yourself as a co-author.", {
					position: "top-center",
					autoClose: 3000,
				});
				return;
			}

			try {
				const response = await axios.post(
					`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify-email`,
					{ email: value },
					{
						headers: {
							Authorization: `Bearer ${user.token}`,
						},
					}
				);

				if (response.data.exists) {
					// Check if this author is already in the list
					const isAlreadyAdded = authors.some(
						(author) =>
							author.email.toLowerCase() === value.toLowerCase()
					);

					if (isAlreadyAdded) {
						setIsEmailVerified(false);
						toast.warning("This author is already in the list.", {
							position: "top-center",
							autoClose: 3000,
						});
						return;
					}

					// If user exists and not already added, pre-fill their information
					const userData = response.data.user;
					setNewAuthor((prev) => ({
						...prev,
						title: userData.title || prev.title,
						firstName: userData.firstName || prev.firstName,
						middleName: userData.middleName || prev.middleName,
						lastName: userData.lastName || prev.lastName,
						academicDegree:
							userData.academicDegree || prev.academicDegree,
						institution: userData.institution || prev.institution,
						country: userData.country || prev.country,
						email: userData.email,
					}));
					setIsEmailVerified(true);
				} else {
					setIsEmailVerified(false);
				}
			} catch (error) {
				console.error("Error verifying email:", error);
				setIsEmailVerified(false);
			}
		} else if (name === "email" && !value) {
			setIsEmailVerified(false);
		}
	};

	const handleAddNewAuthor = async () => {
		// Validate required fields
		const requiredFields = [
			"title",
			"firstName",
			"lastName",
			"email",
			"institution",
			"country",
		];
		const missingFields = requiredFields.filter(
			(field) => !newAuthor[field]
		);

		if (missingFields.length > 0) {
			toast.error(
				`Please fill in all required fields: ${missingFields.join(
					", "
				)}`,
				{
					position: "top-center",
					autoClose: 3000,
				}
			);
			return;
		}

		// Check if trying to add self
		if (newAuthor.email.toLowerCase() === user.email.toLowerCase()) {
			toast.error("You cannot add yourself as a co-author.", {
				position: "top-center",
				autoClose: 3000,
			});
			return;
		}

		// Check if author is already in the list
		const isAlreadyAdded = authors.some(
			(author) =>
				author.email.toLowerCase() === newAuthor.email.toLowerCase()
		);

		if (isAlreadyAdded) {
			toast.warning("This author is already in the list.", {
				position: "top-center",
				autoClose: 3000,
			});
			return;
		}

		try {
			// Verify email exists in database
			const response = await axios.post(
				`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify-email`,
				{ email: newAuthor.email },
				{
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				}
			);

			if (!response.data.exists) {
				toast.error(
					"Cannot add author: Email does not exist in our database. Please enter a valid registered email.",
					{
						position: "top-center",
						autoClose: 4000,
					}
				);
				return;
			}

			// Create new author object with the actual user ID from the response
			const author = {
				_id: response.data.user._id, // Use the actual MongoDB ObjectId from the user
				...newAuthor,
			};

			// Update authors list
			setAuthors((prev) => [...prev, author]);
			setSelectedAuthors((prev) => [...prev, author._id]);

			// If marked as corresponding author, update corresponding author
			if (newAuthor.isCorresponding) {
				setCorrespondingAuthorId(author._id);
			}

			// Reset form and close modal
			setNewAuthor({
				title: "",
				firstName: "",
				middleName: "",
				lastName: "",
				academicDegree: "",
				email: "",
				institution: "",
				country: "",
				isCorresponding: false,
			});
			setIsAuthorModalOpen(false);
		} catch (error) {
			console.error("Error adding author:", error);
			toast.error("Error adding author. Please try again.", {
				position: "top-center",
				autoClose: 3000,
			});
		}
	};

	const handleAuthorSelection = (authorId) => {
		if (!selectedAuthors.includes(authorId)) {
			setSelectedAuthors((prev) => [...prev, authorId]);
		} else {
			setSelectedAuthors((prev) => prev.filter((id) => id !== authorId));
		}
	};

	const handleConfirmAuthors = () => {
		setIsAuthorModalOpen(false);
	};

	const handleRemoveAuthor = (authorId) => {
		setSelectedAuthors((prev) => prev.filter((id) => id !== authorId));
	};

	const renderNextButton = (section) => {
		if (section < 6) {
			return (
				<motion.button
					type="button"
					onClick={handleNext}
					className="mt-4 px-8 py-3 bg-[#00796b] text-white font-semibold text-lg rounded-lg shadow-lg hover:bg-[#00acc1] transition-all duration-300 transform hover:scale-105 block ml-auto"
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
				>
					Next
				</motion.button>
			);
		}
		return null;
	};

	const renderBackButton = (section) => {
		if (section > 1) {
			return (
				<motion.button
					type="button"
					onClick={handlePrev}
					className="mt-4 px-6 py-2 bg-[#00796b] text-white rounded-lg hover:bg-[#3a5269] transition-colors block mr-auto"
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
				>
					Back
				</motion.button>
			);
		}
		return null;
	};

	const sectionVariants = {
		hidden: { opacity: 0, x: -50 },
		visible: { opacity: 1, x: 0 },
		exit: { opacity: 0, x: 50 },
	};

	const onDragEnd = (result) => {
		if (!result.destination) return;

		const reorderedAuthors = Array.from(selectedAuthors);
		const [removed] = reorderedAuthors.splice(result.source.index, 1);
		reorderedAuthors.splice(result.destination.index, 0, removed);

		setSelectedAuthors(reorderedAuthors);
	};

	const moveAuthorUp = (index) => {
		if (index > 0) {
			const newAuthors = [...selectedAuthors];
			[newAuthors[index - 1], newAuthors[index]] = [
				newAuthors[index],
				newAuthors[index - 1],
			];
			setSelectedAuthors(newAuthors);
		}
	};

	const moveAuthorDown = (index) => {
		if (index < selectedAuthors.length - 1) {
			const newAuthors = [...selectedAuthors];
			[newAuthors[index + 1], newAuthors[index]] = [
				newAuthors[index],
				newAuthors[index + 1],
			];
			setSelectedAuthors(newAuthors);
		}
	};

	// Reset extraction state if manuscript file changes
	useEffect(() => {
		if (files.manuscript && files.manuscript.name !== lastExtractedFile) {
			setExtractionDone(false);
		}
		// eslint-disable-next-line
	}, [files.manuscript]);
	const handleEdit = () => {
		setCurrentSection(2); // User goes back to Step 1 (File Upload)
		setPdfBuilt(false);   // PDF build screen hide
		setPdfViewed(false);  // So buttons disable again
		setAcceptOrRejectPdf(false); // Hide accept/reject buttons
		setCompletedSections([1])
		setPdfUrl(null);

	};
	return (
		<div className="min-h-screen bg-[#f8fafc] p-6 text-[#212121] relative">
			{/* Toast Container for notifications */}
			<ToastContainer />

			{/* PDF Building Loading Overlay */}
			{isBuildingPdf && (
				<div className="fixed inset-0 bg-opacity-50 z-50 flex items-center justify-center">
					<div className="bg-white rounded-lg p-8 shadow-2xl max-w-md mx-4">
						<div className="text-center">
							<div className="animate-spin rounded-full h-20 w-20 border-b-4 border-[#00796b] mx-auto mb-6"></div>
							<div className="text-xl font-semibold text-[#00796b] mb-3">
								Building Your PDF...
							</div>
							<div className="text-sm text-gray-600 mb-4">
								Please wait while we compile your manuscript,
								cover letter, and declaration into a single PDF
								document.
							</div>
							<div className="text-xs text-gray-500 mb-4">
								This process may take a few moments.
							</div>
							<div className="flex justify-center space-x-1">
								<div
									className="h-2 w-2 bg-[#00796b] rounded-full animate-bounce"
									style={{
										animationDelay: "0ms",
									}}
								></div>
								<div
									className="h-2 w-2 bg-[#00796b] rounded-full animate-bounce"
									style={{
										animationDelay: "150ms",
									}}
								></div>
								<div
									className="h-2 w-2 bg-[#00796b] rounded-full animate-bounce"
									style={{
										animationDelay: "300ms",
									}}
								></div>
							</div>
						</div>
					</div>
				</div>
			)}

			<h1 className="mt-20 text-3xl font-bold text-center text-[#00796b] mb-6">
				Submit Manuscript
			</h1>

			{/* Stepper */}
			<div className="flex justify-center items-center mb-6 relative">
				{[...Array(totalSections)].map((_, i) => (
					<React.Fragment key={i}>
						<motion.div
							className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mx-2 
					${currentSection === i + 1
									? "bg-[#00796b] text-white cursor-default"
									: completedSections.includes(i + 1)
										? "bg-[#BAFFF5] text-[#00796b] cursor-pointer"
										: i + 1 <= Math.max(...completedSections) + 1
											? "bg-[#e2e8f0] text-[#00796b] cursor-pointer"
											: "bg-gray-300 text-gray-500 cursor-not-allowed"
								}`}
							whileHover={{
								scale:
									i + 1 <= Math.max(...completedSections) + 1
										? 1.1
										: 1,
								cursor:
									i + 1 <= Math.max(...completedSections) + 1
										? "pointer"
										: "not-allowed",
							}}
							onClick={() => {
								if (
									i + 1 <=
									Math.max(...completedSections) + 1
								) {
									handleStepClick(i + 1);
								}
							}}
							title={stepLabels[i]}
						>
							{i + 1}
						</motion.div>

						{/* Progress Bar */}
						{i < totalSections - 1 && (
							<motion.div
								className="h-1 bg-[#e2e8f0] flex-1 mx-2 relative overflow-hidden"
								initial={{ width: "100%" }}
								animate={{ width: "100%" }}
								transition={{ duration: 0.5 }}
							>
								<motion.div
									className="h-1 bg-[#00796b] absolute left-0 top-0"
									initial={{ width: "0%" }}
									animate={{
										width: completedSections.includes(i + 1) ? "100%" : "0%"
									}}
									transition={{ duration: 0.5 }}
								/>
							</motion.div>
						)}
					</React.Fragment>
				))}
			</div>

			<form
				onSubmit={handleSubmit}
				className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg border border-[#e0e0e0]"
			>
				<AnimatePresence mode="wait">
					{currentSection === 1 && (
						<motion.div
							key="section1"
							variants={sectionVariants}
							initial="hidden"
							animate="visible"
							exit="exit"
							className="mb-6 p-6 bg-white shadow-lg rounded-lg"
						>
							<label className="block text-lg font-semibold text-[#00796b] mb-4 text-center">
								Type of Article
							</label>
							<div className="flex justify-center">
								<select
									name="type"
									value={formData.type}
									onChange={handleInputChange}
									className="px-4 py-2 rounded-lg bg-white text-[#00796b] border border-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#00796b]"
								>
									<option value="">Select Type</option>
									<option value="Manuscript">
										Manuscript
									</option>
								</select>
							</div>
							<div className="flex justify-between mt-6">
								{renderBackButton(1)}
								{renderNextButton(1)}
							</div>
						</motion.div>
					)}

					{currentSection === 2 && (
						<motion.div
							key="section2"
							variants={sectionVariants}
							initial="hidden"
							animate="visible"
							exit="exit"
							className="mb-4 relative"
						>
							{/* Loading Overlay */}
							{isExtracting && (
								<div className="absolute inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center rounded-lg">
									<div className="text-center">
										<div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#00796b] mx-auto mb-4"></div>
										<div className="text-lg font-semibold text-[#00796b] mb-2">
											Extracting Text Content...
										</div>
										<div className="text-sm text-gray-600">
											Please wait while we analyze your
											manuscript
										</div>
										<div className="mt-4">
											<div className="flex justify-center space-x-1">
												<div
													className="h-2 w-2 bg-[#00796b] rounded-full animate-bounce"
													style={{
														animationDelay: "0ms",
													}}
												></div>
												<div
													className="h-2 w-2 bg-[#00796b] rounded-full animate-bounce"
													style={{
														animationDelay: "150ms",
													}}
												></div>
												<div
													className="h-2 w-2 bg-[#00796b] rounded-full animate-bounce"
													style={{
														animationDelay: "300ms",
													}}
												></div>
											</div>
										</div>
									</div>
								</div>
							)}

							<div className="flex space-x-4">
								<div className="w-1/2">
									<h3 className="text-lg font-semibold mb-4 text-[#00796b]">
										Required Documents
									</h3>
									<div className="space-y-2">
										{[
											"manuscript",
											"coverLetter",
											"declaration",
										].map((doc) => (
											<div
												key={doc}
												className="flex items-center"
											>
												<input
													type="checkbox"
													checked={uploadedFiles[doc]}
													readOnly // Make it read-only
													className="mr-2 cursor-default"
												/>
												<span className="capitalize text-[#00796b]">
													{doc}
													<span className="text-red-500 ml-1">
														*
													</span>
												</span>
											</div>
										))}
									</div>
								</div>
								<div className="w-1/2">
									<h3 className="text-lg font-semibold mb-4 text-[#00796b]">
										Upload Files (DOCX only)
									</h3>
									{[
										"manuscript",
										"coverLetter",
										"declaration",
									].map((doc) => (
										<div key={doc} className="mb-4">
											<div className="flex items-center">
												<input
													type="checkbox"
													checked={uploadedFiles[doc]}
													readOnly
													className="mr-2 cursor-default"
													title={uploadedFiles[doc] ? "File uploaded" : "No file uploaded"}
												/>
												<label
													className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-white ${dragOver
														? "border-[#00796b] bg-[#e0f7fa]"
														: "border-[#e0e0e0] hover:bg-[#e0f7fa]"
														}`}
													onDragEnter={(e) => {
														e.preventDefault();
														e.stopPropagation();
														setDragOver(true);
													}}
													onDragOver={(e) => {
														e.preventDefault();
														e.stopPropagation();
														setDragOver(true);
													}}
													onDragLeave={(e) => {
														e.preventDefault();
														e.stopPropagation();
														setDragOver(false);
													}}
													onDrop={(e) => {
														e.preventDefault();
														e.stopPropagation();
														setDragOver(false);

														// Check if files were dropped
														if (
															e.dataTransfer
																.files &&
															e.dataTransfer.files
																.length > 0
														) {
															const file =
																e.dataTransfer
																	.files[0];

															// Check file type
															const validTypes = [
																".docx",
																".pdf",
															];
															const fileExtension =
																file.name
																	.split(".")
																	.pop()
																	.toLowerCase();

															if (
																validTypes.includes(
																	`.${fileExtension}`
																)
															) {
																// Create a synthetic event to reuse your existing handler
																const syntheticEvent =
																{
																	target: {
																		files: e
																			.dataTransfer
																			.files,
																		name: doc,
																	},
																};
																handleFileChange(
																	syntheticEvent,
																	doc
																);
															} else {
																toast.error(
																	"Please upload only DOCX or PDF files",
																	{
																		position: "top-center",
																		autoClose: 3000,
																	}
																);
															}
														}
													}}
												>
													<div className="flex flex-col items-center justify-center pt-5 pb-6">
														<p className="mb-2 text-sm text-[#00796b]">
															<span className="font-semibold">
																Click to upload
															</span>{" "}
															or drag and drop
														</p>
														<p className="text-xs text-[#00796b]">
															Upload {doc} (DOCX
															or PDF)
															<span className="text-red-500 ml-1">
																*
															</span>
														</p>
													</div>
													<input
														type="file"
														name={doc}
														accept=".docx,.pdf"
														onChange={(e) =>
															handleFileChange(
																e,
																doc
															)
														}
														className="hidden"
													/>
												</label>
											</div>
											{files[doc] && (
												<div className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded">
													<p className="text-sm text-[#00796b] truncate flex-1">
														{files[doc].name}
													</p>
													<button
														type="button"
														onClick={() => {
															setFiles((prev) => ({ ...prev, [doc]: null }));
															setUploadedFiles((prev) => ({ ...prev, [doc]: false }));
														}}
														className="ml-2 text-red-600 hover:text-red-800 text-sm font-medium"
														title="Remove file"
													>
														✕
													</button>
												</div>
											)}
										</div>
									))}
								</div>
							</div>

							<div className="flex justify-between gap-4">
								{renderBackButton(2)}
								{/* Next Button */}
								<motion.button
									type="button"
									onClick={handleNext}
									className="mt-4 px-6 py-2 bg-[#00796b] text-white rounded-lg hover:bg-[#3a5269] transition-colors block"
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
								>
									Next
								</motion.button>
							</div>
						</motion.div>
					)}
					{currentSection === 3 && (
						<motion.div
							key="section3"
							variants={sectionVariants}
							initial="hidden"
							animate="visible"
							exit="exit"
							className="mb-4"
						>
							<label className="block font-medium mb-2 text-[#00796b]">
								Classification:
							</label>
							<p className="text-sm text-gray-500 mb-3">
								Note: Multiple classifications can be selected
							</p>
							<div className="relative" ref={dropdownRef}>
								<div
									className="cursor-pointer p-2 border border-[#e0e0e0] rounded-lg bg-white text-[#00796b]"
									onClick={() =>
										setIsDropdownOpen(!isDropdownOpen)
									}
								>
									{formData.classification.length > 0
										? formData.classification.join(", ")
										: "Select Classification"}
								</div>
								{isDropdownOpen && (
									<div
										className="absolute z-10 mt-2 w-full bg-white border border-[#e0e0e0] rounded-lg shadow-lg max-h-60 overflow-y-auto 
							[&::-webkit-scrollbar]:w-2
							[&::-webkit-scrollbar-track]:bg-[#e0f7fa]
							[&::-webkit-scrollbar-thumb]:bg-[#00796b]
							[&::-webkit-scrollbar-thumb]:rounded-full"
									>
										{classificationOptions.map((option) => (
											<div
												key={option}
												className={`p-3 cursor-pointer transition-all duration-200 ${formData.classification.includes(
													option
												)
													? "bg-[#BAFFF5] text-[#00796b] font-semibold border-l-4 border-[#00796b]"
													: "hover:bg-[#e0f7fa] text-[#00796b]"
													}`}
												onClick={(e) => {
													e.stopPropagation();
													handleInputChange({
														target: {
															name: "classification",
															value: option,
															checked:
																!formData.classification.includes(
																	option
																),
														},
													});
												}}
											>
												{option}
											</div>
										))}
									</div>
								)}
							</div>
							<div className="flex justify-between">
								{renderBackButton(3)}
								{renderNextButton(3)}
							</div>
						</motion.div>
					)}

					{/* In the step 4 section */}
					{currentSection === 4 && (
						<motion.div
							key="section4"
							variants={sectionVariants}
							initial="hidden"
							animate="visible"
							exit="exit"
							className="mb-4"
						>
							<p className="text-sm text-gray-500 mb-4">
								Add specifications (minimum 3 required)
							</p>

							<textarea
								value={formData.additionalInfo.join("\n")}
								readOnly
								rows={8}
								className="w-full border border-[#e0e0e0] rounded-lg p-3 bg-gray-50 text-[#00796b] mb-4 font-mono"
								placeholder="Your added specifications will appear here..."
							/>

							<div className="flex gap-2 mb-4">
								<input
									type="text"
									value={itemInput}
									onChange={(e) => setItemInput(e.target.value)}
									onKeyPress={(e) => {
										if (e.key === "Enter") {
											handleAddItem();
										}
									}}
									placeholder="Enter specification..."
									className="flex-1 border border-[#e0e0e0] rounded-lg p-3 text-[#00796b] focus:outline-none focus:ring-2 focus:ring-[#00796b]"
								/>
								<motion.button
									type="button"
									onClick={handleAddItem}
									className="px-6 py-3 bg-[#00796b] text-white rounded-lg hover:bg-[#3a5269] transition-colors font-medium"
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
								>
									Add
								</motion.button>
							</div>

							<div className="flex justify-between">
								{renderBackButton(4)}
								{renderNextButton(4)}
							</div>
						</motion.div>
					)}

					{currentSection === 5 && (
						<motion.div
							key="section5"
							variants={sectionVariants}
							initial="hidden"
							animate="visible"
							exit="exit"
							className="mb-4"
						>
							<label className="block font-medium mb-2 text-[#00796b]">
								Comments:
							</label>
							<textarea
								name="comments"
								value={formData.comments}
								onChange={handleInputChange}
								rows={4}
								className="w-full border border-[#e0e0e0] rounded-lg p-2 bg-white text-[#00796b]"
							></textarea>
							<div className="flex justify-between">
								{renderBackButton(5)}
								{renderNextButton(5)}
							</div>
						</motion.div>
					)}

					{currentSection === 6 && (
						<motion.div
							key="section6"
							variants={sectionVariants}
							initial="hidden"
							animate="visible"
							exit="exit"
						>
							<div className="mb-4">
								<label className="block font-medium mb-2 text-[#00796b]">
									Title:
								</label>
								<input
									type="text"
									name="title"
									value={formData.title}
									onChange={handleInputChange}
									className="w-full border border-[#e0e0e0] rounded-lg p-2 bg-white text-[#00796b]"
								/>
							</div>

							<div className="mb-4">
								<label className="block font-medium mb-2 text-[#00796b]">
									Keywords:
								</label>
								<input
									type="text"
									name="keywords"
									value={formData.keywords}
									onChange={handleInputChange}
									className="w-full border border-[#e0e0e0] rounded-lg p-2 bg-white text-[#00796b]"
								/>
							</div>

							<div className="mb-4">
								<label className="block font-medium mb-2 text-[#00796b]">
									Abstract:
								</label>
								<textarea
									name="abstract"
									value={formData.abstract}
									onChange={handleInputChange}
									rows={4}
									className="w-full border border-[#e0e0e0] rounded-lg p-2 bg-white text-[#00796b]"
								></textarea>
							</div>

							<div className="mb-4">
								<label className="block font-medium mb-2 text-[#00796b]">
									Author:
								</label>
								{user && (
									<div className="w-full border border-[#e0e0e0] rounded-lg p-2 bg-white text-[#00796b]">
										{user.title} {user.firstName}{" "}
										{user.middleName
											? `${user.middleName} `
											: ""}
										{user.lastName}
										{user.academicDegree &&
											`, ${user.academicDegree}`}
									</div>
								)}
							</div>

							<button
								type="button"
								onClick={handleAddAuthors}
								className="mt-2 px-4 py-2 bg-[#00796b] text-white rounded-lg hover:bg-[#3a5269]"
							>
								Add Co-Authors
							</button>

							{/* Selected authors list */}
							<div className="mt-4">
								<h3 className="text-lg font-semibold mb-4 text-[#00796b]">
									Authors List:
								</h3>
								<div className="bg-white rounded-lg overflow-hidden border border-[#e0e0e0]">
									<table className="min-w-full divide-y divide-[#e0e0e0]">
										<thead className="bg-[#e0f7fa]">
											<tr>
												<th className="px-4 py-3 text-left text-xs font-medium text-[#00796b] uppercase tracking-wider">
													Move
												</th>
												<th className="px-4 py-3 text-left text-xs font-medium text-[#00796b] uppercase tracking-wider">
													Name
												</th>
												<th className="px-4 py-3 text-left text-xs font-medium text-[#00796b] uppercase tracking-wider">
													Email
												</th>
												<th className="px-4 py-3 text-left text-xs font-medium text-[#00796b] uppercase tracking-wider">
													Roles
												</th>
												<th className="px-4 py-3 text-left text-xs font-medium text-[#00796b] uppercase tracking-wider">
													Actions
												</th>
											</tr>
										</thead>
										<DragDropContext onDragEnd={handleAuthorDragEnd}>
											<Droppable droppableId="authors-droppable" direction="vertical">
												{(provided) => (
													<tbody
														className="divide-y divide-[#e0e0e0]"
														ref={provided.innerRef}
														{...provided.droppableProps}
													>
														{selectedAuthors.map(
															(authorId, index) => {
																const author = authors.find(
																	(a) =>
																		a._id === authorId
																);
																if (!author) return null;

																const isCorrespondingAuthor =
																	authorId ===
																	correspondingAuthorId;

																return (
																	<Draggable draggableId={String(authorId)} index={index} key={authorId}>
																		{(provided) => (
																			<tr
																				ref={provided.innerRef}
																				{...provided.draggableProps}
																				{...provided.dragHandleProps}
																				style={provided.draggableProps.style}
																				className="text-[#00796b] cursor-grab active:cursor-grabbing"
																			>
																				<td className="px-4 py-3">
																					<div className="flex items-center space-x-2">
																						<span
																							className="inline-flex h-6 w-6 items-center justify-center rounded border border-[#e0e0e0] text-[#00796b] cursor-grab active:cursor-grabbing select-none"
																							title="Drag to reorder"
																							aria-label="Drag to reorder"
																							{...provided.dragHandleProps}
																						>
																							⋮⋮
																						</span>
																						<div className="flex space-x-1">
																							<button
																								onClick={() =>
																									moveAuthorUp(
																										index
																									)
																								}
																								disabled={
																									index ===
																									0
																								}
																								className="bg-[#e2e8f0] hover:bg-[#e0e0e0] text-[#00796b] px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
																							>
																								↑
																							</button>
																							<button
																								onClick={() =>
																									moveAuthorDown(
																										index
																									)
																								}
																								disabled={
																									index ===
																									selectedAuthors.length -
																									1
																								}
																								className="bg-[#e2e8f0] hover:bg-[#e0e0e0] text-[#00796b] px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
																							>
																								↓
																							</button>
																						</div>
																					</div>
																				</td>
																				<td className="px-4 py-3">
																					<div className="text-sm">
																						{
																							author.title
																						}{" "}
																						{
																							author.firstName
																						}{" "}
																						{author.middleName
																							? `${author.middleName} `
																							: ""}
																						{
																							author.lastName
																						}
																						{author.academicDegree && (
																							<span className="text-[#9e9e9e]">
																								, {author.academicDegree}
																							</span>
																						)}
																					</div>
																				</td>
																				<td className="px-4 py-3">
																					<div className="text-sm">
																						{author.email}
																					</div>
																				</td>
																				<td className="px-4 py-3">
																					<div className="text-sm">
																						<div>
																							Author
																						</div>
																						{isCorrespondingAuthor && (
																							<div className="text-[#00796b] text-xs mt-1">
																								Corresponding
																								Author
																							</div>
																						)}
																					</div>
																				</td>
																				<td className="px-4 py-3">
																					{authorId !==
																						user._id && (
																							<div className="flex space-x-2">
																								<button
																									onClick={() =>
																										handleRemoveAuthor(
																											authorId
																										)
																									}
																									className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
																								>
																									Remove
																								</button>
																								<button
																									onClick={() =>
																										setCorrespondingAuthorId(
																											authorId
																										)
																									}
																									className={`px-3 py-1 rounded text-sm transition-colors ${isCorrespondingAuthor
																										? "bg-[#BAFFF5] text-[#00796b] cursor-default"
																										: "bg-[#00796b] hover:bg-[#3a5269] text-white"
																										}`}
																									disabled={
																										isCorrespondingAuthor
																									}
																								>
																									{isCorrespondingAuthor
																										? "Current Corresponding"
																										: "Make Corresponding"}
																								</button>
																							</div>
																						)}
																				</td>
																			</tr>
																		)}
																	</Draggable>
																);
															}
														)}
														{provided.placeholder}
													</tbody>
												)}
											</Droppable>
										</DragDropContext>
									</table>
								</div>
							</div>

							{/* Modal for selecting authors */}
							{isAuthorModalOpen && (
								<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
									<div className="bg-white p-4 rounded text-[#212121] w-[500px]">
										<div className="flex justify-between items-center mb-2">
											<h3 className="font-bold">
												Add New Author
											</h3>
											<button
												onClick={() =>
													setIsAuthorModalOpen(false)
												}
												className="text-[#9e9e9e] hover:text-[#212121]"
											>
												×
											</button>
										</div>

										<div className="space-y-2">
											<div className="grid grid-cols-[120px,1fr] items-center gap-1">
												<label className="text-sm">
													Title
													<span className="text-red-500">
														*
													</span>
												</label>
												<select
													name="title"
													value={newAuthor.title}
													onChange={
														handleNewAuthorChange
													}
													className="w-full border rounded px-2 py-1 text-sm border-[#e0e0e0]"
													required
												>
													<option value="">
														Select Title
													</option>
													<option value="Mr">
														Mr
													</option>
													<option value="Mrs">
														Mrs
													</option>
													<option value="Miss">
														Miss
													</option>
													<option value="Dr">
														Dr
													</option>
													<option value="Er">
														Er
													</option>
												</select>
											</div>

											<div className="grid grid-cols-[120px,1fr] items-center gap-1">
												<label className="text-sm">
													Given/First Name
													<span className="text-red-500">
														*
													</span>
												</label>
												<input
													type="text"
													name="firstName"
													value={newAuthor.firstName}
													onChange={
														handleNewAuthorChange
													}
													className="w-full border rounded px-2 py-1 text-sm border-[#e0e0e0]"
													required
												/>
											</div>

											<div className="grid grid-cols-[120px,1fr] items-center gap-1">
												<label className="text-sm">
													Middle Name
												</label>
												<input
													type="text"
													name="middleName"
													value={newAuthor.middleName}
													onChange={
														handleNewAuthorChange
													}
													className="w-full border rounded px-2 py-1 text-sm border-[#e0e0e0]"
												/>
											</div>

											<div className="grid grid-cols-[120px,1fr] items-center gap-1">
												<label className="text-sm">
													Family/Last Name
													<span className="text-red-500">
														*
													</span>
												</label>
												<input
													type="text"
													name="lastName"
													value={newAuthor.lastName}
													onChange={
														handleNewAuthorChange
													}
													className="w-full border rounded px-2 py-1 text-sm border-[#e0e0e0]"
													required
												/>
											</div>

											<div className="grid grid-cols-[120px,1fr] items-center gap-1">
												<label className="text-sm">
													Academic Degree(s)
												</label>
												<input
													type="text"
													name="academicDegree"
													value={
														newAuthor.academicDegree
													}
													onChange={
														handleNewAuthorChange
													}
													className="w-full border rounded px-2 py-1 text-sm border-[#e0e0e0]"
												/>
											</div>

											<div className="grid grid-cols-[120px,1fr] items-center gap-1">
												<label className="text-sm">
													E-mail Address
													<span className="text-red-500">
														*
													</span>
												</label>
												<div className="relative">
													<input
														type="email"
														name="email"
														value={newAuthor.email}
														onChange={
															handleNewAuthorChange
														}
														className={`w-full border rounded px-2 py-1 text-sm border-[#e0e0e0] ${isEmailVerified
															? "border-green-500"
															: ""
															}`}
														required
													/>
													{isEmailVerified && (
														<span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500">
															✓
														</span>
													)}
												</div>
											</div>

											<div className="grid grid-cols-[120px,1fr] items-center gap-1">
												<label className="text-sm">
													Institution
													<span className="text-red-500">
														*
													</span>
												</label>
												<div className="relative">
													<input
														type="text"
														name="institution"
														value={newAuthor.institution}
														onChange={handleNewAuthorChange}
														onFocus={() => {
															if (newAuthor.institution?.trim().length >= 2) setInstOpen(true);
														}}
														onKeyDown={async (ev) => {
															if (ev.key === 'Enter') {
																ev.preventDefault();
																// Only create when search has zero results
																if ((instSuggestions || []).length === 0 && newAuthor.institution?.trim().length >= 2) {
																	await createInstitutionIfNeeded(newAuthor.institution);
																}
															}
														}}
														className="w-full border rounded px-2 py-1 text-sm border-[#e0e0e0]"
														required
													/>
													{instOpen && (
														<ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded border border-[#e0e0e0] bg-white shadow">
															{instSuggestions.map((s) => (
																<li
																	key={s.id}
																	onMouseDown={(e) => e.preventDefault()}
																	onClick={() => {
																		setNewAuthor(prev => ({ ...prev, institution: s.name }));
																		setInstOpen(false);
																	}}
																	className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
																>
																	{s.name}
																</li>
															))}
															{/* Show add option only when there are zero search results */}
															{newAuthor.institution?.trim().length >= 2 && (instSuggestions || []).length === 0 && (
																<li
																	onMouseDown={(e) => e.preventDefault()}
																	onClick={async () => {
																		await createInstitutionIfNeeded(newAuthor.institution);
																	}}
																	className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer text-cyan-700 flex items-center gap-2 border-t border-[#e0e0e0]"
																>
																	<span className="text-cyan-600 font-semibold">+</span>
																	Add "{newAuthor.institution.trim()}"
																</li>
															)}
														</ul>
													)}
												</div>
											</div>

											<div className="grid grid-cols-[120px,1fr] items-center gap-1">
												<label className="text-sm">
													Country or Region
													<span className="text-red-500">
														*
													</span>
												</label>
												<select
													name="country"
													value={newAuthor.country}
													onChange={
														handleNewAuthorChange
													}
													className="w-full border rounded px-2 py-1 text-sm border-[#e0e0e0]"
													required
												>
													<option value="">
														Please select from the
														list below
													</option>
													{countries.map(
														(country) => (
															<option
																key={country}
																value={country}
															>
																{country}
															</option>
														)
													)}
												</select>
											</div>

											<div className="flex items-center mt-2">
												<input
													type="checkbox"
													name="isCorresponding"
													checked={
														newAuthor.isCorresponding
													}
													onChange={
														handleNewAuthorChange
													}
													className="mr-2"
												/>
												<label className="text-sm">
													This is the corresponding
													author
												</label>
											</div>

											<div className="flex justify-end gap-2 mt-4">
												<button
													type="button"
													onClick={() =>
														setIsAuthorModalOpen(
															false
														)
													}
													className="px-3 py-1 bg-[#e2e8f0] text-[#00796b] rounded text-sm hover:bg-[#e0e0e0]"
												>
													Cancel
												</button>
												<button
													type="button"
													onClick={handleAddNewAuthor}
													className="px-3 py-1 bg-[#00796b] text-white rounded text-sm hover:bg-[#3a5269]"
												>
													Add Author
												</button>
											</div>
										</div>
									</div>
								</div>
							)}

							<div className="mb-4">
								<span className="block font-medium mb-2 text-[#00796b]">
									Funding:
								</span>
								<div className="flex items-center gap-4">
									<label className="flex items-center text-[#00796b]">
										<input
											type="radio"
											name="funding"
											value="Yes"
											checked={formData.funding === "Yes"}
											onChange={handleInputChange}
											className="mr-2"
										/>
										Yes
									</label>
									<label className="flex items-center text-[#00796b]">
										<input
											type="radio"
											name="funding"
											value="No"
											checked={formData.funding === "No"}
											onChange={handleInputChange}
											className="mr-2"
										/>
										No
									</label>
								</div>
							</div>

							{formData.funding === "Yes" && (
								<div className="mb-4 mt-4 p-4 border border-[#e0e0e0] rounded-lg bg-gray-50">
									<h3 className="font-semibold mb-3 text-[#00796b]">
										Billing Information
									</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium mb-1 text-[#00796b]">
												Name *
											</label>
											<input
												type="text"
												name="name"
												value={formData.billingInfo.name}
												onChange={handleBillingInfoChange}
												placeholder="Full name"
												className="w-full border border-[#e0e0e0] rounded-lg p-2 bg-white text-[#00796b] focus:outline-none focus:ring-2 focus:ring-[#00796b]"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium mb-1 text-[#00796b]">
												Organization *
											</label>
											<input
												type="text"
												name="organization"
												value={formData.billingInfo.organization}
												onChange={handleBillingInfoChange}
												placeholder="Organization name"
												className="w-full border border-[#e0e0e0] rounded-lg p-2 bg-white text-[#00796b] focus:outline-none focus:ring-2 focus:ring-[#00796b]"
											/>
										</div>
										<div className="md:col-span-2">
											<label className="block text-sm font-medium mb-1 text-[#00796b]">
												Address *
											</label>
											<input
												type="text"
												name="address"
												value={formData.billingInfo.address}
												onChange={handleBillingInfoChange}
												placeholder="Street address"
												className="w-full border border-[#e0e0e0] rounded-lg p-2 bg-white text-[#00796b] focus:outline-none focus:ring-2 focus:ring-[#00796b]"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium mb-1 text-[#00796b]">
												City *
											</label>
											<input
												type="text"
												name="city"
												value={formData.billingInfo.city}
												onChange={handleBillingInfoChange}
												placeholder="City"
												className="w-full border border-[#e0e0e0] rounded-lg p-2 bg-white text-[#00796b] focus:outline-none focus:ring-2 focus:ring-[#00796b]"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium mb-1 text-[#00796b]">
												State/Province
											</label>
											<input
												type="text"
												name="state"
												value={formData.billingInfo.state}
												onChange={handleBillingInfoChange}
												placeholder="State or Province"
												className="w-full border border-[#e0e0e0] rounded-lg p-2 bg-white text-[#00796b] focus:outline-none focus:ring-2 focus:ring-[#00796b]"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium mb-1 text-[#00796b]">
												Postal Code *
											</label>
											<input
												type="text"
												name="postalCode"
												value={formData.billingInfo.postalCode}
												onChange={handleBillingInfoChange}
												placeholder="Postal code"
												className="w-full border border-[#e0e0e0] rounded-lg p-2 bg-white text-[#00796b] focus:outline-none focus:ring-2 focus:ring-[#00796b]"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium mb-1 text-[#00796b]">
												Country *
											</label>
											<input
												type="text"
												name="country"
												value={formData.billingInfo.country}
												onChange={handleBillingInfoChange}
												placeholder="Country"
												className="w-full border border-[#e0e0e0] rounded-lg p-2 bg-white text-[#00796b] focus:outline-none focus:ring-2 focus:ring-[#00796b]"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium mb-1 text-[#00796b]">
												Award Number
											</label>
											<input
												type="text"
												name="awardNumber"
												value={formData.billingInfo.awardNumber}
												onChange={handleBillingInfoChange}
												placeholder="Grant award number"
												className="w-full border border-[#e0e0e0] rounded-lg p-2 bg-white text-[#00796b] focus:outline-none focus:ring-2 focus:ring-[#00796b]"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium mb-1 text-[#00796b]">
												Grant Recipient
											</label>
											<input
												type="text"
												name="grantRecipient"
												value={formData.billingInfo.grantRecipient}
												onChange={handleBillingInfoChange}
												placeholder="Grant recipient name"
												className="w-full border border-[#e0e0e0] rounded-lg p-2 bg-white text-[#00796b] focus:outline-none focus:ring-2 focus:ring-[#00796b]"
											/>
										</div>
									</div>
								</div>
							)}

							<div className="flex justify-between">
								{renderBackButton(6)}

								<div className="flex flex-col space-y-4">
									<div className="flex space-x-4">
										{!pdfUrl && (
											<button
												type="button"
												onClick={
													handleProceedAndBuildPdf
												}
												disabled={isBuildingPdf}
												className="px-6 py-2 bg-[#00796b] text-white rounded-lg hover:bg-[#3a5269] disabled:bg-gray-400 disabled:cursor-not-allowed"
											>
												{isBuildingPdf
													? "Building PDF..."
													: "Build PDF"}
											</button>
										)}

										{pdfUrl && (
											<button
												type="button"
												onClick={() => {
													window.open(
														pdfUrl,
														"_blank"
													);
													setPdfViewed(true); // Mark PDF as viewed when clicked
												}}
												className="px-6 py-2 bg-[#00acc1] text-white rounded-lg hover:bg-[#00796b]"
											>
												View PDF
											</button>
										)}

										{AcceptOrRejectPdf && (
											<button
												type="button"
												onClick={handleAcceptPdf}
												disabled={!pdfViewed}
												className={`px-6 py-2 rounded-lg ${pdfViewed
													? "bg-green-600 text-white hover:bg-green-700 cursor-pointer"
													: "bg-gray-400 text-gray-700 cursor-not-allowed"
													}`}
												title={
													!pdfViewed
														? "Please view the PDF first"
														: "Accept the manuscript"
												}
											>
												Accept
											</button>
										)}

										{AcceptOrRejectPdf && (
											<button
												type="button"
												onClick={handleRejectPdf}
												disabled={!pdfViewed}
												className={`px-6 py-2 rounded-lg ${pdfViewed
													? "bg-red-600 text-white hover:bg-red-700 cursor-pointer"
													: "bg-gray-400 text-gray-700 cursor-not-allowed"
													}`}
												title={
													!pdfViewed
														? "Please view the PDF first"
														: "Reject the manuscript"
												}
											>
												Reject
											</button>
										)}
										{AcceptOrRejectPdf && (
											<button
												type="button"
												onClick={handleEdit}
												disabled={!pdfViewed}
												className={`px-6 py-2 rounded-lg ${pdfViewed
													? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
													: "bg-gray-400 text-gray-700 cursor-not-allowed"
													}`}
												title={
													!pdfViewed
														? "Please view the PDF first"
														: "Edit and restart from File Upload"
												}
											>
												Edit
											</button>
										)}
									</div>


									{/* Show message when accept/reject buttons are visible but PDF not viewed */}
									{AcceptOrRejectPdf && !pdfViewed && (
										<div className="text-sm text-orange-600 bg-orange-50 p-2 rounded-md border border-orange-200">
											<span className="font-medium">
												⚠️ Important:
											</span>{" "}
											Please view the PDF before accepting
											or rejecting the manuscript.
										</div>
									)}
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</form>
		</div>
	);
};

export default ManuscriptPage;
