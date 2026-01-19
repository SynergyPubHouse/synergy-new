import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../App";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BASE_URL = "/journal/jics";

const ManuscriptPage = () => {
	const { user } = useAuth();
	const navigate = useNavigate();
	const [currentSection, setCurrentSection] = useState(1);
	const totalSections = 6;
	const [pdfBuilt, setPdfBuilt] = useState(false);
	console.log("user", user)
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
			findFunder: "",
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
	const [correspondingAuthorIds, setCorrespondingAuthorIds] = useState([]);
	const [isEditAuthorModalOpen, setIsEditAuthorModalOpen] = useState(false);
	const [editingAuthorId, setEditingAuthorId] = useState(null);
	const [isAccepting, setIsAccepting] = useState(false);
	const [isRejecting, setIsRejecting] = useState(false); // For reject button too
	const [users, setUsers] = useState([]);
	// Add these with your other useState declarations
	const [classificationSearch, setClassificationSearch] = useState("");
	const [tempSelectedClassifications, setTempSelectedClassifications] = useState([]);
	const [expandedCategories, setExpandedCategories] = useState(["cse"]);
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
	const { manuscriptId: editManuscriptId } = useParams();
	const location = useLocation();


	const [isEditMode, setIsEditMode] = useState(false);
	const [isSavingDraft, setIsSavingDraft] = useState(false);
	const [draftSaved, setDraftSaved] = useState(false);
	const [isLoadingManuscript, setIsLoadingManuscript] = useState(false);
	const [existingManuscriptId, setExistingManuscriptId] = useState(null);
	const [isUpdatingDraft, setIsUpdatingDraft] = useState(false);
	const [draftPdfUrl, setDraftPdfUrl] = useState(null);
	const [existingFileUrls, setExistingFileUrls] = useState({
		manuscriptFile: null,
		coverLetterFile: null,
		declarationFile: null,
	});

	const [jobId, setJobId] = useState(null);
	const [jobProgress, setJobProgress] = useState(0);
	const [jobStep, setJobStep] = useState('');
	const [jobStatus, setJobStatus] = useState('idle');

	// 🔥 Add this useEffect - Load manuscript for editing
	useEffect(() => {
		if (editManuscriptId) {
			setIsEditMode(true);
			setExistingManuscriptId(editManuscriptId);
			loadExistingManuscript(editManuscriptId);
		}
	}, [editManuscriptId]);

	// 🔥 Add this function - Load existing manuscript data
	const loadExistingManuscript = async (manuscriptId) => {
		setIsLoadingManuscript(true);
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/${manuscriptId}`,
				{
					headers: { Authorization: `Bearer ${user.token}` },
				}
			);

			const manuscript = response.data.data || response.data.manuscript || response.data;
			console.log("Loaded manuscript for editing:", manuscript);

			// Check if user can edit
			if (!["Pending", "Saved"].includes(manuscript.status)) {
				toast.error("This manuscript cannot be edited anymore", {
					position: "top-center",
					autoClose: 3000,
				});
				navigate(`${BASE_URL}/my-submissions`);
				return;
			}

			// 🔥 FIX: Parse classification properly
			let parsedClassification = [];
			if (manuscript.classification) {
				if (Array.isArray(manuscript.classification)) {
					parsedClassification = manuscript.classification;
				} else if (typeof manuscript.classification === 'string') {
					// Check if it's a JSON string like '["item1","item2"]'
					try {
						const parsed = JSON.parse(manuscript.classification);
						parsedClassification = Array.isArray(parsed) ? parsed : [parsed];
					} catch (e) {
						// If not JSON, treat as single classification or comma-separated
						if (manuscript.classification.includes(',')) {
							parsedClassification = manuscript.classification.split(',').map(item => item.trim()).filter(Boolean);
						} else {
							parsedClassification = [manuscript.classification];
						}
					}
				}
			}
			console.log("Parsed classification:", parsedClassification);

			// 🔥 FIX: Parse additionalInfo properly
			let parsedAdditionalInfo = [];
			if (manuscript.additionalInfo) {
				if (Array.isArray(manuscript.additionalInfo)) {
					parsedAdditionalInfo = manuscript.additionalInfo;
				} else if (typeof manuscript.additionalInfo === 'string') {
					// Check if it's a JSON string
					try {
						const parsed = JSON.parse(manuscript.additionalInfo);
						parsedAdditionalInfo = Array.isArray(parsed) ? parsed : [parsed];
					} catch (e) {
						// If not JSON, split by comma or newline
						parsedAdditionalInfo = manuscript.additionalInfo
							.split(/[,\n]/)
							.map(item => item.trim())
							.filter(Boolean);
					}
				}
			}
			console.log("Parsed additionalInfo:", parsedAdditionalInfo);

			// Populate form data
			setFormData({
				type: manuscript.type || "",
				classification: parsedClassification,
				additionalInfo: parsedAdditionalInfo,
				comments: manuscript.comments || "",
				title: manuscript.title || "",
				keywords: manuscript.keywords || "",
				abstract: manuscript.abstract || "",
				author: [],
				funding: manuscript.funding || "",
				billingInfo: {
					findFunder: manuscript.billingInfo?.findFunder || "",
					awardNumber: manuscript.billingInfo?.awardNumber || "",
					grantRecipient: manuscript.billingInfo?.grantRecipient || "",
				},
			});

			// Store existing file URLs
			setExistingFileUrls({
				manuscriptFile: manuscript.manuscriptFile || null,
				coverLetterFile: manuscript.coverLetterFile || null,
				declarationFile: manuscript.declarationFile || null,
				mergedFileUrl: manuscript.mergedFileUrl || null,
			});

			// Mark files as uploaded if they exist
			setUploadedFiles({
				manuscript: !!manuscript.manuscriptFile,
				coverLetter: !!manuscript.coverLetterFile,
				declaration: !!manuscript.declarationFile,
			});

			// Load authors
			if (manuscript.authors && manuscript.authors.length > 0) {
				const loadedAuthors = [];
				const loadedSelectedAuthors = [];
				const loadedCorrespondingIds = [];

				for (const author of manuscript.authors) {
					if (typeof author === 'object' && author._id) {
						loadedAuthors.push({
							_id: author._id,
							title: author.title || "",
							firstName: author.firstName || "",
							middleName: author.middleName || "",
							lastName: author.lastName || "",
							academicDegree: author.academicDegree || "",
							email: author.email || "",
							institution: author.institution || "",
							country: author.country || "",
							isCorresponding: author._id.toString() === manuscript.correspondingAuthor?._id?.toString() ||
								author._id.toString() === manuscript.correspondingAuthor?.toString(),
						});
						loadedSelectedAuthors.push(author._id);

						if (author._id.toString() === manuscript.correspondingAuthor?._id?.toString() ||
							author._id.toString() === manuscript.correspondingAuthor?.toString()) {
							loadedCorrespondingIds.push(author._id);
						}
					}
				}

				// Ensure current user is in list
				const userInList = loadedAuthors.find(a => a._id?.toString() === user._id?.toString());
				if (!userInList && user) {
					loadedAuthors.unshift({
						_id: user._id,
						title: user.title || "",
						firstName: user.firstName || "",
						middleName: user.middleName || "",
						lastName: user.lastName || "",
						email: user.email || "",
						institution: user.institution || "",
						country: user.country || "",
						isCorresponding: true,
					});
					loadedSelectedAuthors.unshift(user._id);
					if (!loadedCorrespondingIds.includes(user._id)) {
						loadedCorrespondingIds.unshift(user._id);
					}
				}

				setAuthors(loadedAuthors.length > 0 ? loadedAuthors : [{
					_id: user._id,
					title: user.title || "",
					firstName: user.firstName || "",
					lastName: user.lastName || "",
					email: user.email || "",
					isCorresponding: true,
				}]);
				setSelectedAuthors(loadedSelectedAuthors.length > 0 ? loadedSelectedAuthors : [user._id]);
				setCorrespondingAuthorIds(loadedCorrespondingIds.length > 0 ? loadedCorrespondingIds : [user._id]);
			}

			// Mark all sections as completed
			setCompletedSections([1, 2, 3, 4, 5, 6]);
			setExtractionDone(true);

			toast.success("Manuscript loaded for editing", {
				position: "top-center",
				autoClose: 2000,
			});

		} catch (error) {
			console.error("Error loading manuscript:", error);
			toast.error("Failed to load manuscript", {
				position: "top-center",
				autoClose: 3000,
			});
			navigate(`${BASE_URL}/my-submissions`);
		} finally {
			setIsLoadingManuscript(false);
		}
	};
	// In loadExistingManuscript, after parsing

	// 🔥 Add this function for updating existing draft
	const handleUpdateDraft = async (e) => {
		e.preventDefault();

		if (!user?.token) {
			toast.error("Please log in", { position: "top-center", autoClose: 3000 });
			return;
		}

		setIsUpdatingDraft(true);

		try {
			const data = new FormData();

			// Add form fields
			Object.keys(formData).forEach((key) => {
				if (["additionalInfo", "billingInfo", "classification"].includes(key)) {
					data.append(key, JSON.stringify(formData[key]));
				} else {
					data.append(key, formData[key]);
				}
			});

			// Add NEW files only if uploaded
			if (files.manuscript) data.append("manuscript", files.manuscript);
			if (files.coverLetter) data.append("coverLetter", files.coverLetter);
			if (files.declaration) data.append("declaration", files.declaration);

			// Add existing file URLs if no new file
			if (!files.manuscript && existingFileUrls.manuscriptFile) {
				data.append("existingManuscriptFile", existingFileUrls.manuscriptFile);
			}
			if (!files.coverLetter && existingFileUrls.coverLetterFile) {
				data.append("existingCoverLetterFile", existingFileUrls.coverLetterFile);
			}
			if (!files.declaration && existingFileUrls.declarationFile) {
				data.append("existingDeclarationFile", existingFileUrls.declarationFile);
			}

			// Process authors
			const cleanSelectedAuthorsForDb = selectedAuthors.filter(id => isValidObjectId(id?.toString() || id));
			data.append("authors", JSON.stringify(cleanSelectedAuthorsForDb));
			data.append("correspondingAuthorId", correspondingAuthorIds[0] || user._id);

			// Call UPDATE API
			const response = await axios.put(
				`${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/${existingManuscriptId}/draft`,
				data,
				{
					headers: {
						"Content-Type": "multipart/form-data",
						Authorization: `Bearer ${user.token}`,
					},
					timeout: 120000,
				}
			);

			if (response.data.success) {
				toast.success("Draft updated successfully!", {
					position: "top-center",
					autoClose: 2000,
				});
				setTimeout(() => navigate(`${BASE_URL}/my-submissions`), 2000);
			} else {
				throw new Error(response.data.message || "Update failed");
			}

		} catch (error) {
			console.error("Error updating draft:", error);
			toast.error("Failed to update: " + (error.response?.data?.message || error.message), {
				position: "top-center",
				autoClose: 4000,
			});
		} finally {
			setIsUpdatingDraft(false);
		}
	};

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
	// 🔥 Helper function to extract filename from URL
	const getFileNameFromUrl = (url) => {
		if (!url) return "Unknown file";
		try {
			// Try to get filename from URL
			const urlParts = url.split('/');
			let fileName = urlParts[urlParts.length - 1];

			// Remove query parameters if any
			fileName = fileName.split('?')[0];

			// Decode URL encoding
			fileName = decodeURIComponent(fileName);

			// If filename is too long or looks like an ID, show generic name
			if (fileName.length > 50 || !fileName.includes('.')) {
				// Extract document type from the URL path
				if (url.includes('manuscript')) return "Manuscript.pdf";
				if (url.includes('coverLetter') || url.includes('cover')) return "Cover Letter.pdf";
				if (url.includes('declaration')) return "Declaration.pdf";
				return "Uploaded file";
			}

			return fileName;
		} catch (e) {
			return "Uploaded file";
		}
	};
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

	// Add this OUTSIDE the component (at the top of the file, after imports)
	const classificationCategories = [
		{
			id: "cse",
			name: "Computer Science & Engineering",
			icon: "💻",
			color: "#1E88E5",
			subClassifications: [
				"Artificial Intelligence & Machine Learning",
				"Deep Learning & Neural Networks",
				"Natural Language Processing",
				"Computer Vision",
				"Robotics & Automation",
				"Human–Computer Interaction",
				"Big Data & Analytics",
				"Cloud Computing",
				"Edge & Fog Computing",
				"Internet of Things (IoT)",
				"Distributed & Parallel Systems",
				"Algorithms & Theory",
				"Cybersecurity & Cryptography",
				"Blockchain & Decentralized Systems",
				"Software Engineering",
				"Computer Networks",
				"High-Performance Computing",
				"Digital Forensics",
				"Quantum Computing",
			],
		},
		{
			id: "dsis",
			name: "Data Science & Information Systems",
			icon: "📊",
			color: "#7B1FA2",
			subClassifications: [
				"Data Mining",
				"Predictive Analytics",
				"Business Intelligence",
				"Recommender Systems",
				"Information Retrieval",
				"Data Warehousing",
				"Text, Web & Social Media Analytics",
				"Knowledge Representation",
				"Information Management Systems",
				"Open-Source Data Ecosystems",
			],
		},
		{
			id: "bhs",
			name: "Biomedical & Health Sciences",
			icon: "🏥",
			color: "#D32F2F",
			subClassifications: [
				"Medical Imaging & Diagnostics",
				"AI in Healthcare",
				"Bioinformatics & Computational Biology",
				"Telemedicine & Digital Health",
				"Clinical Decision Support Systems",
				"Public Health Analytics",
				"Pharmaceutical Research",
				"Healthcare Management",
				"Biomechanics",
			],
		},
		{
			id: "ees",
			name: "Environmental & Earth Sciences",
			icon: "🌍",
			color: "#388E3C",
			subClassifications: [
				"Climate Change Studies",
				"Environmental Monitoring",
				"Sustainable Development",
				"Disaster Management",
				"Geospatial Technologies (GIS/RS)",
				"Water Resource Engineering",
				"Ecology & Biodiversity",
			],
		},
		{
			id: "ir",
			name: "Interdisciplinary Research",
			icon: "🔗",
			color: "#F57C00",
			subClassifications: [
				"Smart Cities",
				"Human–AI Collaboration",
				"Sustainable Technologies",
				"Computational Social Science",
				"STEM Education",
				"Digital Humanities",
				"Techno-Legal Studies",
				"Science & Society",
			],
		},
		{
			id: "et",
			name: "Emerging Technologies",
			icon: "🚀",
			color: "#00ACC1",
			subClassifications: [
				"Extended Reality (AR/VR/MR)",
				"Metaverse Technologies",
				"6G & Future Networks",
				"Autonomous & Intelligent Systems",
				"Brain–Computer Interface",
				"Digital Twins",
				"Generative AI",
				"Quantum Communication",
			],
		},
	];

	// Helper function to get category for a classification
	const getCategoryForClassification = (classification) => {
		for (const category of classificationCategories) {
			if (category.subClassifications.includes(classification)) {
				return category;
			}
		}
		return null;
	};

	// Get all classifications as flat array (for backward compatibility)
	const allClassifications = classificationCategories.flatMap(cat => cat.subClassifications);

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
	// Update this useEffect - skip if in edit mode
	useEffect(() => {
		if (user && !isEditMode) {  // 🔥 Add !isEditMode condition
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
			setAuthors([mainAuthor]);
			setSelectedAuthors([user._id]);
			setCorrespondingAuthorIds([user._id]);
		}
	}, [user, isEditMode]);  // 🔥 Add isEditMode to dependency

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
			setFormData((prevData) => {
				// Check if classification already exists
				const exists = prevData.classification.includes(value);

				let newClassification;
				if (checked && !exists) {
					// Add new classification
					newClassification = [...prevData.classification, value];
				} else if (!checked && exists) {
					// Remove existing classification
					newClassification = prevData.classification.filter((item) => item !== value);
				} else if (exists) {
					// Toggle - if already exists, remove it (for click toggle)
					newClassification = prevData.classification.filter((item) => item !== value);
				} else {
					// Toggle - if not exists, add it
					newClassification = [...prevData.classification, value];
				}

				return {
					...prevData,
					classification: newClassification,
				};
			});
		} else {
			setFormData({ ...formData, [name]: value });
		}
	};

	// Handle adding items in step 4
	// Handle adding items in step 4
	const handleAddItem = () => {
		if (itemInput.trim() === "") {
			toast.warning("Please enter a specification before adding", {
				position: "top-center",
				autoClose: 2000,
			});
			return;
		}

		// 🔥 Check maximum limit
		if (formData.additionalInfo.length >= 5) {
			toast.error("Maximum 5 specifications allowed", {
				position: "top-center",
				autoClose: 3000,
			});
			return;
		}

		// 🔥 Check for duplicate
		if (formData.additionalInfo.includes(itemInput.trim())) {
			toast.warning("This specification already exists", {
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

		toast.success(`Specification added (${newList.length}/5)`, {
			position: "top-center",
			autoClose: 2000,
		});
	};

	// Handle billing info nested fields
	const handleBillingInfoChange = (e) => {
		const { name, value } = e.target;
		console.log('Billing field change:', { name, value });
		setFormData((prevData) => {
			const newData = {
				...prevData,
				billingInfo: {
					...prevData.billingInfo,
					[name]: value,
				},
			};
			console.log('Updated billingInfo:', newData.billingInfo);
			return newData;
		});
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
				const hasManuscript = files.manuscript || existingFileUrls.manuscriptFile;
				const hasCoverLetter = files.coverLetter || existingFileUrls.coverLetterFile;
				const hasDeclaration = files.declaration || existingFileUrls.declarationFile;

				if (!hasManuscript || !hasCoverLetter || !hasDeclaration) {
					const missingDocs = [];
					if (!hasManuscript) missingDocs.push("Manuscript");
					if (!hasCoverLetter) missingDocs.push("Cover Letter");
					if (!hasDeclaration) missingDocs.push("Declaration");
					toast.error(`Please upload: ${missingDocs.join(", ")}`, {
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

				// 🔥 NEW: Minimum 3 check
				if (formData.classification.length < 3) {
					toast.error(`Please select at least 3 classifications. You have selected ${formData.classification.length}.`, {
						position: "top-center",
						autoClose: 3000,
					});
					return false;
				}

				// 🔥 NEW: Maximum 5 check
				if (formData.classification.length > 5) {
					toast.error(`Maximum 5 classifications allowed. Please remove ${formData.classification.length - 5} classification(s).`, {
						position: "top-center",
						autoClose: 3000,
					});
					return false;
				}

				return true;

			case 4:
				if (formData.additionalInfo.length < 3) {
					toast.error("Please add at least 3 specifications to proceed", {
						position: "top-center",
						autoClose: 3000,
					});
					return false;
				}
				if (formData.additionalInfo.length > 5) {
					toast.error("Maximum 5 specifications allowed", {
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
				if (selectedAuthors.length === 0) errors.push("At least one author");
				if (formData.funding !== "Yes" && formData.funding !== "No") {
					errors.push("Funding information");
				}

				if (errors.length > 0) {
					// toast.error(`Please provide the following required information: ${errors.join(", ")}`, {
					// 	position: "top-center",
					// 	autoClose: 4000,
					// });
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
				// toast.warning("Could not extract information automatically. Please enter details manually.", {
				// 	position: "top-center",
				// 	autoClose: 4000,
				// });
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
			// toast.warning(
			// 	`Please complete the current section before proceeding to step ${step}`,
			// 	{
			// 		position: "top-center",
			// 		autoClose: 3000,
			// 	}
			// );
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
				// toast.error(
				// 	`Please complete all required fields in Section ${section}`,
				// 	{
				// 		position: "top-center",
				// 		autoClose: 3000,
				// 	}
				// );
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
	// In ManuscriptPage.js, find the proceedbeforebuildpdf function
	// Replace the ENTIRE authors section with this:

	const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);
	// 🔥 NEW: Add this helper function BEFORE proceedbeforebuildpdf
	const pollJobStatus = async (jobId, token) => {
		return new Promise((resolve, reject) => {
			let attempts = 0;
			const maxAttempts = 240;      // 6 minutes at 1.5s
			const baseDelay = 1500;       // ms

			const poll = async () => {
				try {
					const response = await axios.get(
						`${import.meta.env.VITE_BACKEND_URL}/api/jobs/${jobId}`,
						{
							headers: { Authorization: `Bearer ${token}` },
						}
					);

					const job = response.data;

					// Update progress state if you added it
					if (typeof setProcessingProgress === "function") {
						setProcessingProgress(job.progress || 0);
					}
					if (typeof setProcessingStep === "function") {
						setProcessingStep(job.step || "Processing...");
					}

					if (job.status === "completed") {
						return resolve(job.result);
					}

					if (job.status === "failed") {
						return reject(new Error(job.error || "Processing failed"));
					}

					attempts++;
					if (attempts >= maxAttempts) {
						return reject(
							new Error("Processing timeout. Please check My Submissions later.")
						);
					}

					setTimeout(poll, baseDelay);
				} catch (error) {
					// If we got an HTTP response, inspect status
					const status = error.response?.status;

					// Auth / permission / job-not-found -> hard fail
					if (status === 401 || status === 403 || status === 404) {
						return reject(
							new Error(
								error.response?.data?.error ||
								error.response?.data?.message ||
								`Request failed with status ${status}`
							)
						);
					}

					// For 5xx or network errors, retry until maxAttempts
					attempts++;
					if (attempts >= maxAttempts) {
						return reject(
							new Error(
								"Processing failed due to repeated network/server errors. Please try again later."
							)
						);
					}

					console.warn(
						"[pollJobStatus] Transient error while polling, will retry:",
						error.message || error
					);

					// Small backoff for error cases
					setTimeout(poll, baseDelay * 2);
				}
			};

			poll();
		});
	};
	// 🔥 NEW: Add these state variables at the top of your component (with other useState)
	// const [processingProgress, setProcessingProgress] = useState(0);
	// const [processingStep, setProcessingStep] = useState('');

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
				setCurrentSection(section);
				return;
			}
		}

		// Check required files
		if (!files.manuscript || !files.coverLetter || !files.declaration) {
			toast.error("Please upload all required files: manuscript, cover letter, and declaration", {
				position: "top-center",
				autoClose: 4000,
			});
			setCurrentSection(2);
			return;
		}

		const data = new FormData();

		// Add form fields
		Object.keys(formData).forEach((key) => {
			if (["additionalInfo", "billingInfo", "classification"].includes(key)) {
				data.append(key, JSON.stringify(formData[key]));
			} else {
				data.append(key, formData[key]);
			}
		});

		// Add files
		if (files.manuscript) data.append("manuscript", files.manuscript);
		if (files.coverLetter) data.append("coverLetter", files.coverLetter);
		if (files.declaration) data.append("declaration", files.declaration);

		// ===================================
		// 🔥 FIXED AUTHOR LOGIC START
		// ===================================

		const submittingUserId = user?._id;
		console.log("👤 Submitting User ID:", submittingUserId);

		// Step 1: Get ALL selected authors with full details
		let authorsData = selectedAuthors
			.map(authorId => {
				const author = authors.find(a => a._id === authorId);
				if (!author) {
					console.log("❌ Author not found for ID:", authorId);
					return null;
				}

				return {
					_id: author._id,
					title: author.title || "",
					firstName: author.firstName || "",
					middleName: author.middleName || "",
					lastName: author.lastName || "",
					academicDegree: author.academicDegree || "",
					email: author.email || "",
					institution: author.institution || "",
					country: author.country || "",
					isCorresponding: author.isCorresponding || false,
					isTempUser: !isValidObjectId(author._id)
				};
			})
			.filter(Boolean);

		console.log("📋 Total authors collected:", authorsData.length);

		// Step 2: Ensure submitting user is in authors list
		const submittingUserInList = authorsData.find(a => a._id === submittingUserId);

		if (!submittingUserInList && submittingUserId && isValidObjectId(submittingUserId)) {
			console.log("➕ Adding submitting user to authors list");
			authorsData.unshift({
				_id: submittingUserId,
				title: user.title || "",
				firstName: user.firstName || "",
				middleName: user.middleName || "",
				lastName: user.lastName || "",
				academicDegree: user.academicDegree || "",
				email: user.email,
				institution: user.institution || "",
				country: user.country || "",
				isCorresponding: true,
				isTempUser: false
			});
		} else if (submittingUserInList) {
			authorsData = authorsData.map(a =>
				a._id === submittingUserId
					? { ...a, isCorresponding: true }
					: a
			);
		}

		// Step 3: Also mark the user-selected corresponding author

		const primaryCorrespondingId = (correspondingAuthorIds?.[0]) || submittingUserId;


		if (primaryCorrespondingId && primaryCorrespondingId !== submittingUserId) {
			authorsData = authorsData.map(a =>
				a._id?.toString() === primaryCorrespondingId?.toString()
					? { ...a, isCorresponding: true }
					: a
			);
		}

		// Step 4: Build MULTIPLE corresponding authors array
		const correspondingAuthorsArray = [];

		authorsData.forEach(author => {
			const isSubmittingUser = author._id?.toString() === submittingUserId?.toString();
			const isMarkedCorresponding = correspondingAuthorIds
				.map(id => id?.toString())
				.includes(author._id?.toString());
			const hasCorrespondingFlag = author.isCorresponding === true;

			if (isSubmittingUser || isMarkedCorresponding || hasCorrespondingFlag) {
				const fullName = [
					author.title,
					author.firstName,
					author.middleName,
					author.lastName
				].filter(Boolean).join(" ").trim();

				correspondingAuthorsArray.push({
					_id: author._id,
					fullName: fullName,
					title: author.title || "",
					firstName: author.firstName || "",
					middleName: author.middleName || "",
					lastName: author.lastName || "",
					academicDegree: author.academicDegree || "",
					email: author.email || "",
					institution: author.institution || "",
					country: author.country || "",
					isCorresponding: true,
					isTempUser: author.isTempUser || false,
					isSubmittingUser: isSubmittingUser
				});
			}
		});

		console.log("📧 Corresponding Authors Count:", correspondingAuthorsArray.length);

		// Step 5: Build authors list for PDF (ALL authors, names only)
		const authorsForPdf = authorsData.map(author => {
			const fullName = [
				author.title,
				author.firstName,
				author.middleName,
				author.lastName
			].filter(Boolean).join(" ").trim();

			return {
				_id: author._id,
				fullName: fullName,
				title: author.title || "",
				firstName: author.firstName || "",
				middleName: author.middleName || "",
				lastName: author.lastName || "",
				academicDegree: author.academicDegree || "",
				email: author.email || "",
				institution: author.institution || "",
				country: author.country || "",
				isCorresponding: author.isCorresponding,
				isTempUser: author.isTempUser || false
			};
		});

		// Step 6: Create strings for PDF
		const authorNamesString = authorsForPdf.map(a => a.fullName).join(", ");
		const correspondingNamesString = correspondingAuthorsArray
			.map(a => `${a.fullName} `)
			.join(", ");
		const correspondingNamesOnlyString = correspondingAuthorsArray
			.map(a => a.fullName)
			.join(", ");

		// Step 7: Filter for database storage
		const cleanAuthorsDataForDb = authorsData.filter(a => isValidObjectId(a._id));
		const cleanSelectedAuthorsForDb = selectedAuthors.filter(id => isValidObjectId(id));
		const cleanCorrespondingAuthorsForDb = correspondingAuthorsArray.filter(a => isValidObjectId(a._id));

		// Debug console logs
		console.log("\n=== FINAL AUTHOR DATA DEBUG ===");
		console.log("📤 Data being sent to backend:");
		console.log("───────────────────────────────");
		console.log("Submitting User ID:", submittingUserId);

		console.log("\n👥 ALL AUTHORS FOR PDF (Total):", authorsForPdf.length);
		authorsForPdf.forEach((author, index) => {
			console.log(`   ${index + 1}. ${author.fullName}`);
			console.log(`      Email: ${author.email}`);
			console.log(`      Corresponding: ${author.isCorresponding ? 'YES ✓' : 'No'}`);
			console.log(`      Temp User: ${author.isTempUser ? 'YES' : 'No'}`);
		});

		console.log("\n📧 CORRESPONDING AUTHORS FOR PDF (Total):", correspondingAuthorsArray.length);
		correspondingAuthorsArray.forEach((author, index) => {
			console.log(`   ${index + 1}. ${author.fullName} (${author.email})`);
			console.log(`      Submitting User: ${author.isSubmittingUser ? 'YES ✓' : 'No'}`);
		});

		console.log("\n📝 STRINGS FOR PDF:");
		console.log(`   Authors: ${authorNamesString}`);
		console.log(`   Corresponding (with email): ${correspondingNamesString}`);
		console.log(`   Corresponding (names only): ${correspondingNamesOnlyString}`);

		console.log("\n💾 AUTHORS FOR DATABASE (Valid IDs only):", cleanAuthorsDataForDb.length);
		console.log("═══════════════════════════════\n");

		// Step 8: Append to FormData
		data.append("authorsForPdf", JSON.stringify(authorsForPdf));
		data.append("authorNamesForPdf", authorNamesString);
		data.append("correspondingAuthorsForPdf", JSON.stringify(correspondingAuthorsArray));
		data.append("correspondingNamesForPdf", correspondingNamesString);
		data.append("correspondingNamesOnlyForPdf", correspondingNamesOnlyString);
		data.append("correspondingAuthorForPdf", JSON.stringify(correspondingAuthorsArray[0] || null));
		data.append("correspondingNameForPdf", correspondingAuthorsArray[0]?.fullName || "");
		data.append("authorsData", JSON.stringify(cleanAuthorsDataForDb));
		data.append("authors", JSON.stringify(cleanSelectedAuthorsForDb));

		const correspondingAuthorIdsForDb = cleanCorrespondingAuthorsForDb.map(a => a._id);



		data.append("correspondingAuthorIds", JSON.stringify(correspondingAuthorIdsForDb));
		data.append("correspondingAuthorId", correspondingAuthorIdsForDb[0] || "");
		data.append("correspondingAuthor", JSON.stringify(cleanCorrespondingAuthorsForDb[0] || null));
		data.append("allCorrespondingAuthors", JSON.stringify(cleanCorrespondingAuthorsForDb));

		data.append("allAuthorsWithDetails", JSON.stringify(authorsData));

		// ===================================
		// 🔥 FIXED AUTHOR LOGIC END
		// ===================================

		try {
			// =============================================
			// 🔥 CHANGED: Use async endpoint with job polling
			// =============================================

			console.log("[proceedbeforebuildpdf] Uploading files...");

			const response = await axios.post(
				`${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/async`,  // 🔥 CHANGED ENDPOINT
				data,
				{
					headers: {
						"Content-Type": "multipart/form-data",
						Authorization: `Bearer ${user.token}`,
					},
					timeout: 60000, // 60 seconds for upload only
				}
			);

			// 🔥 NEW: Handle job-based response
			if (response.data.success && response.data.jobId) {
				const jobId = response.data.jobId;

				console.log("[proceedbeforebuildpdf] Files uploaded, job created:", jobId);

				toast.info("Files uploaded! Processing your manuscript...", {
					position: "top-center",
					autoClose: 3000,
				});

				// 🔥 NEW: Poll for job completion with progress updates
				try {
					const result = await pollJobStatus(
						jobId,
						user.token,
						(progress, step) => {
							// Optional: Update UI with progress
							// setProcessingProgress(progress);
							// setProcessingStep(step);
							console.log(`[Progress] ${progress}% - ${step}`);
						}
					);

					console.log("[proceedbeforebuildpdf] Job completed:", result);

					const id = result.manuscriptId;
					setManuscriptId(id);

					// Update status to "Under Review"
					await axios.put(
						`${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/${id}/status`,
						{ status: "Under Review" },
						{
							headers: { Authorization: `Bearer ${user.token}` },
						}
					);

					return {
						manuscriptId: id,
						mergedFileUrl: result.mergedPdfUrl,
					};

				} catch (pollError) {
					console.error("[proceedbeforebuildpdf] Job polling failed:", pollError);
					setIsBuildingPdf(false);

					toast.error(pollError.message || "Processing failed. Please try again.", {
						position: "top-center",
						autoClose: 5000,
					});

					return null;
				}
			}
			// 🔥 FALLBACK: Handle old-style direct response (for backward compatibility)
			else if (response.data.success && response.data.data?._id) {
				const id = response.data.data._id;
				setManuscriptId(id);

				await axios.put(
					`${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/${id}/status`,
					{ status: "Under Review" },
					{
						headers: { Authorization: `Bearer ${user.token}` },
					}
				);

				return {
					manuscriptId: id,
					mergedFileUrl: response.data.mergedPdfUrl,
				};
			} else {
				throw new Error(response.data?.message || "Submission failed");
			}

		} catch (error) {
			console.error("Error saving manuscript:", error);
			setIsBuildingPdf(false);

			if (error.code === "ECONNABORTED") {
				toast.error("Upload timed out. Please check your connection and try again.", {
					position: "top-center",
					autoClose: 5000,
				});
			} else if (error.response?.status === 401) {
				toast.error("Your session has expired. Please log in again.", {
					position: "top-center",
					autoClose: 4000,
				});
				navigate("/login", { state: { from: location.pathname } });
			} else if (error.response?.status === 502 || error.response?.status === 504) {
				// 🔥 NEW: Handle gateway timeout gracefully
				toast.error("Server is busy. Please try again in a moment.", {
					position: "top-center",
					autoClose: 5000,
				});
			} else {
				toast.error("Save failed: " + (error.response?.data?.message || error.message), {
					position: "top-center",
					autoClose: 4000,
				});
			}

			return null;
		}
	};
	const handleSaveDraft = async (e) => {
		e.preventDefault();

		if (!user?.token) {
			toast.error("Please log in to save draft", {
				position: "top-center",
				autoClose: 3000,
			});
			return;
		}

		// Minimum validation
		if (!formData.type) {
			toast.error("Please select at least the article type", {
				position: "top-center",
				autoClose: 3000,
			});
			setCurrentSection(1);
			return;
		}

		if (!files.manuscript || !files.coverLetter || !files.declaration) {
			toast.error("Please upload all required files before saving", {
				position: "top-center",
				autoClose: 4000,
			});
			setCurrentSection(2);
			return;
		}

		setIsSavingDraft(true);

		try {
			const data = new FormData();

			// Add form fields
			Object.keys(formData).forEach((key) => {
				if (["additionalInfo", "billingInfo", "classification"].includes(key)) {
					data.append(key, JSON.stringify(formData[key]));
				} else {
					data.append(key, formData[key]);
				}
			});

			// Add files
			if (files.manuscript) data.append("manuscript", files.manuscript);
			if (files.coverLetter) data.append("coverLetter", files.coverLetter);
			if (files.declaration) data.append("declaration", files.declaration);

			// Build authors data
			const submittingUserId = user?._id;

			let authorsData = selectedAuthors
				.map(authorId => {
					const author = authors.find(a => a._id === authorId);
					if (!author) return null;
					return {
						_id: author._id,
						title: author.title || "",
						firstName: author.firstName || "",
						middleName: author.middleName || "",
						lastName: author.lastName || "",
						academicDegree: author.academicDegree || "",
						email: author.email || "",
						institution: author.institution || "",
						country: author.country || "",
						isCorresponding: correspondingAuthorIds.includes(author._id),
						isTempUser: !isValidObjectId(author._id)
					};
				})
				.filter(Boolean);

			const submittingUserInList = authorsData.find(a => a._id === submittingUserId);
			if (!submittingUserInList && submittingUserId && isValidObjectId(submittingUserId)) {
				authorsData.unshift({
					_id: submittingUserId,
					title: user.title || "",
					firstName: user.firstName || "",
					middleName: user.middleName || "",
					lastName: user.lastName || "",
					academicDegree: user.academicDegree || "",
					email: user.email,
					institution: user.institution || "",
					country: user.country || "",
					isCorresponding: true,
					isTempUser: false
				});
			}

			const correspondingAuthorsArray = authorsData
				.filter(author =>
					author._id === submittingUserId ||
					correspondingAuthorIds.includes(author._id) ||
					author.isCorresponding
				)
				.map(author => {
					const fullName = [author.title, author.firstName, author.middleName, author.lastName]
						.filter(Boolean).join(" ").trim();
					return { ...author, fullName, isSubmittingUser: author._id === submittingUserId };
				});

			const authorsForPdf = authorsData.map(author => {
				const fullName = [author.title, author.firstName, author.middleName, author.lastName]
					.filter(Boolean).join(" ").trim();
				return { ...author, fullName };
			});

			const authorNamesString = authorsForPdf.map(a => a.fullName).join(", ");
			const correspondingNamesString = correspondingAuthorsArray.map(a => a.fullName).join(", ");

			const cleanAuthorsDataForDb = authorsData.filter(a => isValidObjectId(a._id));
			const cleanSelectedAuthorsForDb = selectedAuthors.filter(id => isValidObjectId(id));
			const cleanCorrespondingAuthorsForDb = correspondingAuthorsArray.filter(a => isValidObjectId(a._id));

			data.append("authorsForPdf", JSON.stringify(authorsForPdf));
			data.append("authorNamesForPdf", authorNamesString);
			data.append("correspondingAuthorsForPdf", JSON.stringify(correspondingAuthorsArray));
			data.append("correspondingNamesForPdf", correspondingNamesString);
			data.append("correspondingNamesOnlyForPdf", correspondingNamesString);
			data.append("correspondingAuthorForPdf", JSON.stringify(correspondingAuthorsArray[0] || null));
			data.append("correspondingNameForPdf", correspondingAuthorsArray[0]?.fullName || "");
			data.append("authorsData", JSON.stringify(cleanAuthorsDataForDb));
			data.append("authors", JSON.stringify(cleanSelectedAuthorsForDb));

			const correspondingAuthorIdsForDb = cleanCorrespondingAuthorsForDb.map(a => a._id);
			data.append("correspondingAuthorIds", JSON.stringify(correspondingAuthorIdsForDb));
			data.append("correspondingAuthorId", correspondingAuthorIdsForDb[0] || "");
			data.append("correspondingAuthor", JSON.stringify(cleanCorrespondingAuthorsForDb[0] || null));
			data.append("allCorrespondingAuthors", JSON.stringify(cleanCorrespondingAuthorsForDb));
			data.append("allAuthorsWithDetails", JSON.stringify(authorsData));

			const response = await axios.post(
				`${import.meta.env.VITE_BACKEND_URL}/api/draft`,
				data,
				{
					headers: {
						"Content-Type": "multipart/form-data",
						Authorization: `Bearer ${user.token}`,
					},
					timeout: 120000,
				}
			);

			if (response.data.success && response.data.data?._id) {
				const id = response.data.data._id;

				// 🔥 Set status to Pending (not Under Review)
				await axios.put(
					`${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/${id}/status`,
					{ status: "Pending" },
					{
						headers: { Authorization: `Bearer ${user.token}` },
					}
				);

				setManuscriptId(id);
				setDraftPdfUrl(response.data.mergedPdfUrl);
				setDraftSaved(true);

				toast.success("Draft saved successfully! Redirecting to My Submissions...", {
					position: "top-center",
					autoClose: 3000,
				});

				setTimeout(() => {
					navigate(`${BASE_URL}/my-submissions`);
				}, 2000);

			} else {
				throw new Error(response.data?.message || "Failed to save draft");
			}

		} catch (error) {
			console.error("Error saving draft:", error);

			if (error.code === "ECONNABORTED") {
				toast.error("Request timed out. Please try again.", {
					position: "top-center",
					autoClose: 5000,
				});
			} else if (error.response?.status === 401) {
				toast.error("Session expired. Please log in again.", {
					position: "top-center",
					autoClose: 4000,
				});
			} else {
				toast.error("Failed to save draft: " + (error.response?.data?.message || error.message), {
					position: "top-center",
					autoClose: 4000,
				});
			}
		} finally {
			setIsSavingDraft(false);
		}
	};
	const handleAcceptPdf = async () => {
		// Prevent double click
		if (isAccepting) return;

		setIsAccepting(true);

		try {
			console.log('Starting manuscript acceptance process...');
			console.log('Manuscript ID:', manuscriptId);
			console.log('User token available:', !!user.token);

			// Show loading toast
			const loadingToast = toast.loading('Submitting manuscript...', {
				position: "top-center",
			});

			// First update the manuscript status
			console.log('Updating manuscript status...');
			const response = await axios.put(
				`${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/${manuscriptId}/status`,
				{ status: "Under Review" },
				{
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				}
			);
			console.log('Status update successful:', response.data);

			// Get manuscript details to fetch author information
			console.log('Fetching manuscript details...');
			const manuscriptResponse = await axios.get(
				`${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/${manuscriptId}`,
				{
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				}
			);
			console.log('Manuscript fetch successful');

			const manuscript = manuscriptResponse.data.data;
			console.log('Full manuscript data:', manuscript);

			// ============================================
			// 🔥 FIX: COLLECT ALL AUTHOR EMAILS PROPERLY
			// ============================================
			const authorEmails = new Set();

			// 1. Add corresponding author email
			if (manuscript.correspondingAuthor) {
				if (typeof manuscript.correspondingAuthor === 'object' && manuscript.correspondingAuthor.email) {
					authorEmails.add(manuscript.correspondingAuthor.email.toLowerCase());
					console.log('Added corresponding author email:', manuscript.correspondingAuthor.email);
				}
			}

			// 2. Add authors emails (if populated)
			if (manuscript.authors && manuscript.authors.length > 0) {
				manuscript.authors.forEach((author) => {
					if (typeof author === 'object' && author.email) {
						authorEmails.add(author.email.toLowerCase());
						console.log('Added author email:', author.email);
					}
				});
			}

			// 3. Always add current user (submitter) email
			if (user && user.email) {
				authorEmails.add(user.email.toLowerCase());
				console.log('Added current user email:', user.email);
			}

			console.log('All author emails collected:', Array.from(authorEmails));

			// Get manuscript details
			const manuscriptTitle = manuscript.title || manuscript.manuscriptTitle || 'Untitled Manuscript';
			const manuscriptIdForEmail = manuscript.customId || manuscript._id || manuscript.id || 'MS-' + Date.now();
			const frontendUrl = import.meta.env.VITE_FRONTEND_URL || "https://synergyworldpress.com";

			// ============================================
			// 🔥 FIX: AWAIT EDITOR NOTIFICATION
			// ============================================
			try {
				console.log('Sending editor notification...');
				const editorNotificationResponse = await axios.post(
					`${import.meta.env.VITE_BACKEND_URL}/api/auth/editor/notify-new-manuscript`,
					{
						manuscriptId: manuscriptIdForEmail,
						manuscriptTitle: manuscriptTitle,
						submittedBy: ((user.firstName || '') + ' ' + (user.lastName || '')).trim() || user.name || 'Unknown Author',
						submitterEmail: user.email,
						submissionDate: new Date().toLocaleString('en-US', {
							year: 'numeric',
							month: 'long',
							day: 'numeric',
							hour: '2-digit',
							minute: '2-digit'
						}),
						status: "Under Review",
						abstract: manuscript.abstract || '',
						keywords: manuscript.keywords || '',
						classification: manuscript.classification || []
					},
					{
						headers: {
							Authorization: `Bearer ${user.token}`,
							'Content-Type': 'application/json'
						},
						timeout: 10000 // 10 second timeout
					}
				);
				console.log('Editor notification sent successfully:', editorNotificationResponse.data);
			} catch (editorNotifyError) {
				console.error('Error notifying editors:', editorNotifyError);
				// Don't fail the whole process if editor notification fails
				toast.warning('Manuscript submitted, but editor notification may have failed', {
					position: "top-center",
					autoClose: 3000,
				});
			}

			// ============================================
			// 🔥 SEND EMAIL TO ALL AUTHORS (with await)
			// ============================================
			if (authorEmails.size > 0) {
				console.log('Sending emails to ' + authorEmails.size + ' author(s)');

				const emailHtml = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FFFFFF;">' +
					'<div style="background: linear-gradient(135deg, #00796B 0%, #00ACC1 100%); color: white; padding: 25px; text-align: center;">' +
					'<h1 style="margin: 0; font-size: 22px; color: #101010ff;">Manuscript Submitted Successfully</h1>' +
					'</div>' +
					'<div style="padding: 25px;">' +
					'<p style="color: #374151; font-size: 16px; margin-bottom: 20px;">Dear Author,</p>' +
					'<p style="color: #374151; font-size: 16px; margin-bottom: 20px; line-height: 1.6;">' +
					'Your manuscript entitled "<strong>' + manuscriptTitle + '</strong>" has been successfully submitted and is now with the editors for review.' +
					'</p>' +
					'<div style="background-color: #F0FDF4; padding: 20px; border-radius: 8px; border-left: 4px solid #00796B; margin-bottom: 25px;">' +
					'<p style="margin: 0 0 10px 0; font-size: 14px; color: #6B7280;"><strong>Manuscript ID:</strong></p>' +
					'<p style="margin: 0 0 15px 0; font-size: 18px; color: #1F2937; font-weight: 600;">' + manuscriptIdForEmail + '</p>' +
					'<p style="margin: 0 0 10px 0; font-size: 14px; color: #6B7280;"><strong>Status:</strong></p>' +
					'<p style="margin: 0; font-size: 16px; color: #00796B; font-weight: 600;">Under Review</p>' +
					'</div>' +
					'<p style="color: #374151; font-size: 15px; margin-bottom: 20px; line-height: 1.6;">' +
					'Please use this ID in all future correspondence regarding this manuscript.' +
					'</p>' +
					'<div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">' +
					'<p style="color: #92400E; font-size: 14px; margin: 0; line-height: 1.6;">' +
					'<strong>Note:</strong> Any change to the author list after submission is considered rare and exceptional. Once the list and order of authors has been established, it should not be altered without permission of all authors.' +
					'</p>' +
					'</div>' +
					'<div style="text-align: center; margin: 25px 0;">' +
					'<a href="' + frontendUrl + '/journal/jics/my-submissions" style="display: inline-block; background-color: #00796B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">View My Submissions</a>' +
					'</div>' +
					'<p style="color: #374151; font-size: 15px; margin-top: 25px;">Sincerely,<br><strong>Editorial Office</strong></p>' +
					'</div>' +
					'<div style="background-color: #F3F4F6; padding: 15px; text-align: center; border-top: 1px solid #E5E7EB;">' +
					'<p style="color: #6B7280; font-size: 12px; margin: 0;">Synergy World Press | support@synergyworldpress.com</p>' +
					'</div>' +
					'</div>';

				// 🔥 Use Promise.allSettled to send all emails in parallel and wait for all
				const emailPromises = Array.from(authorEmails).map((email) => {
					console.log('Sending email to:', email);
					return axios.post(
						`${import.meta.env.VITE_BACKEND_URL}/api/send-email`,
						{
							to: email,
							subject: 'Manuscript Successfully Submitted - ' + manuscriptIdForEmail,
							html: emailHtml
						},
						{
							headers: {
								Authorization: `Bearer ${user.token}`,
							},
							timeout: 10000 // 10 second timeout per email
						}
					).then((response) => {
						console.log('Email sent successfully to ' + email, response.data);
						return { email, success: true };
					}).catch((emailError) => {
						console.error('Failed to send email to ' + email + ':', emailError.response?.data || emailError.message);
						return { email, success: false, error: emailError.message };
					});
				});

				// Wait for all emails to complete
				const emailResults = await Promise.allSettled(emailPromises);

				const successCount = emailResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
				const failCount = emailResults.length - successCount;

				console.log(`Email sending complete: ${successCount} succeeded, ${failCount} failed`);

				if (failCount > 0) {
					toast.warning(`${successCount} emails sent, ${failCount} failed`, {
						position: "top-center",
						autoClose: 3000,
					});
				}
			} else {
				console.log('No author emails found to send');
			}

			// Dismiss loading toast and show success
			toast.dismiss(loadingToast);
			toast.success('Manuscript submitted successfully!', {
				position: "top-center",
				autoClose: 2000,
			});

			setAcceptOrRejectPdf(false);

			// 🔥 NOW redirect after all operations complete
			setTimeout(() => {
				navigate(`${BASE_URL}/my-submissions`);
			}, 1000);

		} catch (error) {
			console.error("Error accepting manuscript:", error);

			let errorMessage = "Failed to accept manuscript. Please try again.";

			if (error.response?.status === 401) {
				errorMessage = "Session expired. Please login again.";
			} else if (error.response?.status === 404) {
				errorMessage = "Manuscript not found.";
			} else if (error.response?.status === 403) {
				errorMessage = "You don't have permission to accept this manuscript.";
			} else if (error.message?.includes('Network Error')) {
				errorMessage = "Network error. Please check your connection.";
			}

			toast.dismiss();
			toast.error(errorMessage, {
				position: "top-center",
				autoClose: 3000,
			});
		} finally {
			setIsAccepting(false);
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
			// toast.warning("PDF is not available yet.", {
			// 	position: "top-center",
			// 	autoClose: 3000,
			// });
		}
	};



	// 🔥 Helper function to check if Section 6 is valid (without showing toast)
	const isSection6Valid = () => {
		// Check title
		if (!formData.title || formData.title.trim() === "") return false;

		// Check keywords
		if (!formData.keywords || formData.keywords.trim() === "") return false;

		// Check abstract
		if (!formData.abstract || formData.abstract.trim() === "") return false;

		// Check authors
		if (selectedAuthors.length === 0) return false;

		// Check funding
		if (formData.funding !== "Yes" && formData.funding !== "No") return false;

		return true;
	};
	const [pdfBuiltManuscripts, setPdfBuiltManuscripts] = useState(new Set());
	const [isBuildingPdf, setIsBuildingPdf] = useState(false);
	const [pdfUrl, setPdfUrl] = useState(null);
	const [buildError, setBuildError] = useState(null);
	const [AcceptOrRejectPdf, setAcceptOrRejectPdf] = useState(false);
	const [pdfViewed, setPdfViewed] = useState(false);
	console.log("pdfUrl", pdfUrl)
	const handleProceedAndBuildPdf = async (e) => {
		console.log("test ")
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
			// toast.warning("PDF generation is taking longer than expected. You can check your submission later.", {
			// 	position: "top-center",
			// 	autoClose: 5000,
			// });
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
	const isValidEmail = (email) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};


	const handleNewAuthorChange = async (e) => {
		const { name, value, type, checked } = e.target;
		if (name === "isCorresponding" && checked) {
			// Check if there's already a corresponding author (excluding main user)
			const existingCorresponding = authors.find(
				a => a._id !== user._id && a._id !== editingAuthorId && a.isCorresponding
			);

			if (existingCorresponding) {
				toast.warning(
					`${existingCorresponding.firstName} ${existingCorresponding.lastName} is already the corresponding author. Only one corresponding author is allowed.`,
					{
						position: "top-center",
						autoClose: 4000,
					}
				);
				return; // Don't allow checking
			}
		}

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
				`Please fill in all required fields: ${missingFields.join(", ")}`,
				{
					position: "top-center",
					autoClose: 3000,
				}
			);
			return;
		}

		// Validate email format
		if (!isValidEmail(newAuthor.email)) {
			toast.error("Please enter a valid email address.", {
				position: "top-center",
				autoClose: 3000,
			});
			return;
		}


		// Check if author already exists
		const isAlreadyAdded = authors.some((author) => {
			if (editingAuthorId && author._id === editingAuthorId) {
				return false;
			}
			return (
				author.email &&
				newAuthor.email &&
				author.email.toLowerCase() === newAuthor.email.toLowerCase()
			);
		});

		if (isAlreadyAdded) {
			// toast.warning("This author is already in the list.", {
			// 	position: "top-center",
			// 	autoClose: 3000,
			// });
			return;
		}

		try {
			// If editing an existing author
			if (editingAuthorId) {
				const updatedAuthor = {
					_id: editingAuthorId,
					...newAuthor,
				};

				setAuthors((prev) =>
					prev.map((a) => (a._id === editingAuthorId ? { ...a, ...updatedAuthor } : a))
				);

				if (newAuthor.isCorresponding) {
					setCorrespondingAuthorIds((prev) => {
						if (!prev.includes(editingAuthorId)) {
							return [...prev, editingAuthorId];
						}
						return prev;
					});
				} else {
					// Remove from corresponding if unchecked (but not if it's the main user)
					if (editingAuthorId !== user._id) {
						setCorrespondingAuthorIds((prev) =>
							prev.filter((id) => id !== editingAuthorId)
						);
					}
				}

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
				setIsEditAuthorModalOpen(false);
				setEditingAuthorId(null);
				setIsEmailVerified(false);

				// Show success message with role
				toast.success(
					`Author updated as ${newAuthor.isCorresponding ? 'Corresponding Author' : 'Author'}`,
					{
						position: "top-center",
						autoClose: 2000,
					}
				);
				return;
			}

			// ADD MODE: verify email and optionally send invitation
			let response;
			try {
				response = await axios.post(
					`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify-email`,
					{ email: newAuthor.email },
					{
						headers: {
							Authorization: `Bearer ${user.token}`,
						},
					}
				);
			} catch (verifyError) {
				console.error("Error verifying email:", verifyError);
			}

			let authorIdToUse = null;
			let authorFromDb = null;

			if (response && response.data && response.data.exists && response.data.user) {
				authorFromDb = response.data.user;
				authorIdToUse = authorFromDb._id;
			} else {
				authorIdToUse = `temp-${Date.now()}-${newAuthor.email}`;
				const frontendUrl = import.meta.env.VITE_FRONTEND_URL || "https://synergyworldpress.com";
				try {
					await axios.post(
						`${import.meta.env.VITE_BACKEND_URL}/api/send-email`,
						{
							to: newAuthor.email,
							subject:
								"You have been added as a corresponding author on a manuscript at SynergyWorldPress",
							html: `
                            <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; line-height: 1.6;">
                                <p style="font-size: 16px;">Dear Colleague,</p>
                                <p style="font-size: 16px;">
                                    You have been added as a corresponding author on a manuscript at <strong>SynergyWorldPress</strong>.
                                </p>
                                <p style="font-size: 16px;">
                                    To review your details, manage submissions, and complete your profile, please register on our platform using the link below:
                                </p>
                                <p style="font-size: 16px;">
                                    <a href="${frontendUrl}/register" target="_blank" rel="noopener noreferrer">${frontendUrl}/register</a>
                                </p>
                                <p style="font-size: 14px; color: #555;">
                                    If you did not expect this email, you may safely ignore it.
                                </p>
                                <p style="margin-top: 24px; font-size: 14px;">
                                    Best regards,<br />
                                    SynergyWorldPress Editorial Office
                                </p>
                            </div>
                        `,
						}
					);
					toast.info(
						`Invitation email sent to ${newAuthor.email}. They will need to register to access the platform.`,
						{
							position: "top-center",
							autoClose: 4000,
						}
					);
				} catch (inviteError) {
					console.error("Error sending invitation email:", inviteError);
				}
			}

			const author = {
				_id: authorIdToUse,
				...newAuthor,
				...(authorFromDb
					? {
						title: authorFromDb.title || newAuthor.title,
						firstName: authorFromDb.firstName || newAuthor.firstName,
						middleName: authorFromDb.middleName || newAuthor.middleName,
						lastName: authorFromDb.lastName || newAuthor.lastName,
						academicDegree: authorFromDb.academicDegree || newAuthor.academicDegree,
						institution: authorFromDb.institution || newAuthor.institution,
						country: authorFromDb.country || newAuthor.country,
						email: authorFromDb.email || newAuthor.email,
					}
					: {}),
			};

			setAuthors((prev) => [...prev, author]);
			setSelectedAuthors((prev) => [...prev, author._id]);

			// 🔥 UPDATE: Set corresponding author based on checkbox
			if (newAuthor.isCorresponding) {
				setCorrespondingAuthorIds((prev) => [...prev, author._id]);
				toast.success(
					`${author.firstName} ${author.lastName} added as Corresponding Author`,
					{
						position: "top-center",
						autoClose: 2000,
					}
				);
			} else {
				toast.success(
					`${author.firstName} ${author.lastName} added as Author`,
					{
						position: "top-center",
						autoClose: 2000,
					}
				);
			}

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
			setIsEditAuthorModalOpen(false);
			setEditingAuthorId(null);
			setIsEmailVerified(false);
		} catch (error) {
			console.error("Error adding author:", error);
			toast.error("Error adding author. Please try again.", {
				position: "top-center",
				autoClose: 3000,
			});
		}
	};

	const handleAddNewAuthorAndContinue = async () => {
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
				`Please fill in all required fields: ${missingFields.join(", ")}`,
				{
					position: "top-center",
					autoClose: 3000,
				}
			);
			return;
		}
		if (!isValidEmail(newAuthor.email)) {
			toast.error("Please enter a valid email address.", { position: "top-center", autoClose: 3000 });
			return;
		}

		// Check if trying to add self
		if (!editingAuthorId && newAuthor.email.toLowerCase() === user.email.toLowerCase()) {
			toast.error("You cannot add yourself as a co-author.", {
				position: "top-center",
				autoClose: 3000,
			});
			return;
		}

		// Check if author already exists
		const isAlreadyAdded = authors.some((author) => {
			if (editingAuthorId && author._id === editingAuthorId) {
				return false;
			}
			return (
				author.email &&
				newAuthor.email &&
				author.email.toLowerCase() === newAuthor.email.toLowerCase()
			);
		});

		if (isAlreadyAdded) {
			toast.warning("This author is already in the list.", {
				position: "top-center",
				autoClose: 3000,
			});
			return;
		}

		try {
			// Verify email
			let response;
			try {
				response = await axios.post(
					`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify-email`,
					{ email: newAuthor.email },
					{
						headers: {
							Authorization: `Bearer ${user.token}`,
						},
					}
				);
			} catch (verifyError) {
				console.error("Error verifying email:", verifyError);
			}

			let authorIdToUse = null;
			let authorFromDb = null;

			if (response && response.data && response.data.exists && response.data.user) {
				authorFromDb = response.data.user;
				authorIdToUse = authorFromDb._id;
			} else {
				authorIdToUse = `temp-${Date.now()}-${newAuthor.email}`;
				// Send invitation email for non-registered users
				const frontendUrl = "https://synergyworldpress.com";
				try {
					await axios.post(
						`${import.meta.env.VITE_BACKEND_URL}/api/send-email`,
						{
							to: newAuthor.email,
							subject: "You have been added as a corresponding author on a manuscript at SynergyWorldPress",
							html: `
                            <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; line-height: 1.6;">
                                <p style="font-size: 16px;">Dear Colleague,</p>
                                <p style="font-size: 16px;">
                                    You have been added as a corresponding author on a manuscript at <strong>SynergyWorldPress</strong>.
                                </p>
                                <p style="font-size: 16px;">
                                    To review your details, manage submissions, and complete your profile, please register on our platform using the link below:
                                </p>
                                <p style="font-size: 16px;">
                                    <a href="${frontendUrl}/register" target="_blank" rel="noopener noreferrer">${frontendUrl}/register</a>
                                </p>
                                <p style="font-size: 14px; color: #555;">
                                    If you did not expect this email, you may safely ignore it.
                                </p>
                                <p style="margin-top: 24px; font-size: 14px;">
                                    Best regards,<br />
                                    SynergyWorldPress Editorial Office
                                </p>
                            </div>
                        `,
						}
					);
					toast.info(
						`Invitation email sent to ${newAuthor.email}. They will need to register to access the platform.`,
						{
							position: "top-center",
							autoClose: 4000,
						}
					);
				} catch (inviteError) {
					console.error("Error sending invitation email:", inviteError);
				}
			}

			const author = {
				_id: authorIdToUse,
				...newAuthor,
				...(authorFromDb
					? {
						title: authorFromDb.title || newAuthor.title,
						firstName: authorFromDb.firstName || newAuthor.firstName,
						middleName: authorFromDb.middleName || newAuthor.middleName,
						lastName: authorFromDb.lastName || newAuthor.lastName,
						academicDegree: authorFromDb.academicDegree || newAuthor.academicDegree,
						institution: authorFromDb.institution || newAuthor.institution,
						country: authorFromDb.country || newAuthor.country,
						email: authorFromDb.email || newAuthor.email,
					}
					: {}),
			};

			setAuthors((prev) => [...prev, author]);
			setSelectedAuthors((prev) => [...prev, author._id]);

			if (newAuthor.isCorresponding) {
				setCorrespondingAuthorIds((prev) => [...prev, author._id]);  // ✅ NEW
			}

			toast.success(
				`${author.firstName} ${author.lastName} added successfully!`,
				{
					position: "top-center",
					autoClose: 2000,
				}
			);

			// 🔥 RESET FORM BUT KEEP MODAL OPEN
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
			setIsEmailVerified(false);
			// Modal stays open - NO setIsAuthorModalOpen(false)

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
		setSelectedAuthors((prev) => {
			if (prev.length <= 1) {
				return prev;
			}
			return prev.filter((id) => id !== authorId);
		});
		setAuthors((prev) => prev.filter((a) => a._id !== authorId));
		if (correspondingAuthorIds === authorId) {
			// Remove from corresponding array
			setCorrespondingAuthorIds((prev) =>
				prev.filter((id) => id !== authorId)
			);
		}
	};

	const handleEditAuthor = (authorId) => {
		const existing = authors.find((a) => a._id === authorId);
		if (!existing) return;
		setNewAuthor({
			title: existing.title || "",
			firstName: existing.firstName || "",
			middleName: existing.middleName || "",
			lastName: existing.lastName || "",
			academicDegree: existing.academicDegree || "",
			email: existing.email || "",
			institution: existing.institution || "",
			country: existing.country || "",
			// 🔥 UPDATE: Check in array
			isCorresponding:
				correspondingAuthorIds.includes(existing._id) || !!existing.isCorresponding,
		});
		setEditingAuthorId(existing._id);
		setIsEditAuthorModalOpen(true);
		setIsAuthorModalOpen(true);
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


	// 🔥 NEW FUNCTION: Update Draft and Build PDF (Edit Mode)
	// 🔥 UPDATED: Async Update Draft and Build PDF (Edit Mode)
	const handleUpdateAndBuildPdf = async (e) => {
		e.preventDefault();

		if (!user?.token) {
			toast.error("Please log in", { position: "top-center", autoClose: 3000 });
			return;
		}

		// Validate all sections
		for (let section = 1; section <= 6; section++) {
			if (!validateSection(section)) {
				toast.error(`Please complete Section ${section}`, {
					position: "top-center",
					autoClose: 3000,
				});
				setCurrentSection(section);
				return;
			}
		}

		// Check required files
		const hasManuscript = files.manuscript || existingFileUrls.manuscriptFile;
		const hasCoverLetter = files.coverLetter || existingFileUrls.coverLetterFile;
		const hasDeclaration = files.declaration || existingFileUrls.declarationFile;

		if (!hasManuscript || !hasCoverLetter || !hasDeclaration) {
			toast.error("Please ensure all required files are uploaded", {
				position: "top-center",
				autoClose: 4000,
			});
			setCurrentSection(2);
			return;
		}

		// 🔥 Reset all states
		setIsBuildingPdf(true);
		setJobProgress(0);
		setJobStep('Uploading files...');
		setJobStatus('uploading');
		setJobId(null);
		setPdfUrl(null);
		setBuildError(null);
		setPdfViewed(false);

		try {
			const data = new FormData();

			// ═══════════════════════════════════════════════════════════
			// Add form fields
			// ═══════════════════════════════════════════════════════════
			Object.keys(formData).forEach((key) => {
				if (["additionalInfo", "billingInfo", "classification"].includes(key)) {
					data.append(key, JSON.stringify(formData[key]));
				} else {
					data.append(key, formData[key]);
				}
			});

			// ═══════════════════════════════════════════════════════════
			// Add files
			// ═══════════════════════════════════════════════════════════
			if (files.manuscript) data.append("manuscript", files.manuscript);
			if (files.coverLetter) data.append("coverLetter", files.coverLetter);
			if (files.declaration) data.append("declaration", files.declaration);

			if (!files.manuscript && existingFileUrls.manuscriptFile) {
				data.append("existingManuscriptFile", existingFileUrls.manuscriptFile);
			}
			if (!files.coverLetter && existingFileUrls.coverLetterFile) {
				data.append("existingCoverLetterFile", existingFileUrls.coverLetterFile);
			}
			if (!files.declaration && existingFileUrls.declarationFile) {
				data.append("existingDeclarationFile", existingFileUrls.declarationFile);
			}

			// ═══════════════════════════════════════════════════════════
			// Author processing (same as before)
			// ═══════════════════════════════════════════════════════════
			const submittingUserId = user?._id;

			let authorsData = selectedAuthors
				.map(authorId => {
					const author = authors.find(a => a._id === authorId);
					if (!author) return null;
					return {
						_id: author._id,
						title: author.title || "",
						firstName: author.firstName || "",
						middleName: author.middleName || "",
						lastName: author.lastName || "",
						academicDegree: author.academicDegree || "",
						email: author.email || "",
						institution: author.institution || "",
						country: author.country || "",
						isCorresponding: author.isCorresponding || false,
						isTempUser: !isValidObjectId(author._id)
					};
				})
				.filter(Boolean);

			const submittingUserInList = authorsData.find(a => a._id === submittingUserId);
			if (!submittingUserInList && submittingUserId && isValidObjectId(submittingUserId)) {
				authorsData.unshift({
					_id: submittingUserId,
					title: user.title || "",
					firstName: user.firstName || "",
					middleName: user.middleName || "",
					lastName: user.lastName || "",
					academicDegree: user.academicDegree || "",
					email: user.email,
					institution: user.institution || "",
					country: user.country || "",
					isCorresponding: true,
					isTempUser: false
				});
			} else if (submittingUserInList) {
				authorsData = authorsData.map(a =>
					a._id === submittingUserId ? { ...a, isCorresponding: true } : a
				);
			}

			const primaryCorrespondingId = correspondingAuthorIds?.[0] || submittingUserId;
			if (primaryCorrespondingId && primaryCorrespondingId !== submittingUserId) {
				authorsData = authorsData.map(a =>
					a._id?.toString() === primaryCorrespondingId?.toString()
						? { ...a, isCorresponding: true }
						: a
				);
			}

			const correspondingAuthorsArray = [];
			authorsData.forEach(author => {
				const isSubmittingUser = author._id?.toString() === submittingUserId?.toString();
				const isMarkedCorresponding = correspondingAuthorIds
					.map(id => id?.toString())
					.includes(author._id?.toString());
				const hasCorrespondingFlag = author.isCorresponding === true;

				if (isSubmittingUser || isMarkedCorresponding || hasCorrespondingFlag) {
					const fullName = [author.title, author.firstName, author.middleName, author.lastName]
						.filter(Boolean).join(" ").trim();

					correspondingAuthorsArray.push({
						_id: author._id,
						fullName: fullName,
						title: author.title || "",
						firstName: author.firstName || "",
						middleName: author.middleName || "",
						lastName: author.lastName || "",
						academicDegree: author.academicDegree || "",
						email: author.email || "",
						institution: author.institution || "",
						country: author.country || "",
						isCorresponding: true,
						isTempUser: author.isTempUser || false,
						isSubmittingUser: isSubmittingUser
					});
				}
			});

			const authorsForPdf = authorsData.map(author => {
				const fullName = [author.title, author.firstName, author.middleName, author.lastName]
					.filter(Boolean).join(" ").trim();
				return { ...author, fullName };
			});

			const authorNamesString = authorsForPdf.map(a => a.fullName).join(", ");
			const correspondingNamesString = correspondingAuthorsArray.map(a => a.fullName).join(", ");

			const cleanAuthorsDataForDb = authorsData.filter(a => isValidObjectId(a._id));
			const cleanSelectedAuthorsForDb = selectedAuthors.filter(id => isValidObjectId(id?.toString() || id));
			const cleanCorrespondingAuthorsForDb = correspondingAuthorsArray.filter(a => isValidObjectId(a._id));

			data.append("authorsForPdf", JSON.stringify(authorsForPdf));
			data.append("authorNamesForPdf", authorNamesString);
			data.append("correspondingAuthorsForPdf", JSON.stringify(correspondingAuthorsArray));
			data.append("correspondingNamesForPdf", correspondingNamesString);
			data.append("correspondingNamesOnlyForPdf", correspondingNamesString);
			data.append("correspondingAuthorForPdf", JSON.stringify(correspondingAuthorsArray[0] || null));
			data.append("correspondingNameForPdf", correspondingAuthorsArray[0]?.fullName || "");
			data.append("authorsData", JSON.stringify(cleanAuthorsDataForDb));
			data.append("authors", JSON.stringify(cleanSelectedAuthorsForDb));

			const correspondingAuthorIdsForDb = cleanCorrespondingAuthorsForDb.map(a => a._id);
			data.append("correspondingAuthorIds", JSON.stringify(correspondingAuthorIdsForDb));
			data.append("correspondingAuthorId", correspondingAuthorIdsForDb[0] || "");
			data.append("correspondingAuthor", JSON.stringify(cleanCorrespondingAuthorsForDb[0] || null));
			data.append("allCorrespondingAuthors", JSON.stringify(cleanCorrespondingAuthorsForDb));
			data.append("allAuthorsWithDetails", JSON.stringify(authorsData));

			console.log("[handleUpdateAndBuildPdf] Sending async update request...");

			// ═══════════════════════════════════════════════════════════
			// 🔥 CALL ASYNC API ENDPOINT
			// ═══════════════════════════════════════════════════════════
			const response = await axios.put(
				`${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/${existingManuscriptId}/update-async`,
				data,
				{
					headers: {
						"Content-Type": "multipart/form-data",
						Authorization: `Bearer ${user.token}`,
					},
					timeout: 60000, // 60 seconds for upload only
				}
			);

			console.log("[handleUpdateAndBuildPdf] Initial response:", response.data);

			if (response.data.success && response.data.jobId) {
				// ═══════════════════════════════════════════════════════════
				// 🔥 START POLLING FOR PROGRESS
				// ═══════════════════════════════════════════════════════════
				const receivedJobId = response.data.jobId;
				setJobId(receivedJobId);
				setJobStatus('processing');
				setJobStep('Processing started...');

				toast.info("Files uploaded! Processing your manuscript...", {
					position: "top-center",
					autoClose: 2000,
				});

				try {
					const result = await pollJobStatus(receivedJobId, user.token);

					console.log("[handleUpdateAndBuildPdf] Job completed:", result);

					// ═══════════════════════════════════════════════════════════
					// 🔥 SUCCESS
					// ═══════════════════════════════════════════════════════════
					const pdfUrlResult = result.mergedDriveViewUrl ||
						result.mergedPdfUrl ||
						result.mergedFileUrl;

					setIsBuildingPdf(false);
					setJobProgress(100);
					setJobStep('Complete!');
					setJobStatus('completed');

					if (pdfUrlResult) {
						setPdfUrl(pdfUrlResult);
						setManuscriptId(existingManuscriptId);
						setAcceptOrRejectPdf(true);

						toast.success("PDF built successfully!", {
							position: "top-center",
							autoClose: 3000,
						});
					} else {
						// Fallback: fetch from manuscript
						try {
							const manuscriptResp = await axios.get(
								`${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/${existingManuscriptId}`,
								{ headers: { Authorization: `Bearer ${user.token}` } }
							);
							const url = manuscriptResp.data.data?.mergedFileUrl ||
								manuscriptResp.data.manuscript?.mergedFileUrl;
							if (url) {
								setPdfUrl(url);
								setManuscriptId(existingManuscriptId);
								setAcceptOrRejectPdf(true);
								toast.success("PDF built successfully!", {
									position: "top-center",
									autoClose: 3000,
								});
							} else {
								toast.warning("PDF is being generated. Check 'My Submissions' later.", {
									position: "top-center",
									autoClose: 5000,
								});
							}
						} catch (fetchErr) {
							console.error("Error fetching manuscript:", fetchErr);
							toast.warning("PDF generated. Please check 'My Submissions'.", {
								position: "top-center",
								autoClose: 5000,
							});
						}
					}

				} catch (pollError) {
					// ═══════════════════════════════════════════════════════════
					// 🔥 POLLING FAILED
					// ═══════════════════════════════════════════════════════════
					console.error("[handleUpdateAndBuildPdf] Polling failed:", pollError);
					setIsBuildingPdf(false);
					setJobStatus('failed');
					setBuildError(pollError.message);

					toast.error(pollError.message || "PDF generation failed", {
						position: "top-center",
						autoClose: 5000,
					});
				}

			} else if (response.data.success) {
				// ═══════════════════════════════════════════════════════════
				// 🔥 FALLBACK: Sync response (backward compatibility)
				// ═══════════════════════════════════════════════════════════
				const url = response.data.mergedPdfUrl ||
					response.data.mergedDriveViewUrl ||
					response.data.data?.mergedFileUrl;

				setIsBuildingPdf(false);
				setJobProgress(100);
				setJobStatus('completed');

				if (url) {
					setPdfUrl(url);
					setManuscriptId(existingManuscriptId);
					setAcceptOrRejectPdf(true);
					toast.success("PDF built successfully!", {
						position: "top-center",
						autoClose: 3000,
					});
				}
			} else {
				throw new Error(response.data.message || "Update failed");
			}

		} catch (error) {
			// ═══════════════════════════════════════════════════════════
			// 🔥 ERROR HANDLING
			// ═══════════════════════════════════════════════════════════
			console.error("[handleUpdateAndBuildPdf] Error:", error);

			setIsBuildingPdf(false);
			setJobStatus('failed');
			setJobProgress(0);
			setJobStep('');

			if (error.code === "ECONNABORTED") {
				toast.error("Upload timed out. Please try again.", {
					position: "top-center",
					autoClose: 5000,
				});
			} else if (error.response?.status === 401) {
				toast.error("Session expired. Please log in again.", {
					position: "top-center",
					autoClose: 4000,
				});
				navigate("/login", { state: { from: location.pathname } });
			} else if (error.response?.status === 403) {
				toast.error(error.response?.data?.message || "You don't have permission", {
					position: "top-center",
					autoClose: 4000,
				});
			} else if (error.response?.status === 404) {
				toast.error("Manuscript not found", {
					position: "top-center",
					autoClose: 4000,
				});
			} else {
				toast.error("Failed: " + (error.response?.data?.message || error.message), {
					position: "top-center",
					autoClose: 4000,
				});
			}
		}
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
				{isEditMode ? "Edit Manuscript" : "Submit Manuscript"}
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
									{/* <option value="Manuscript">Manuscript</option> */}
									<option value="Research Article">Research Article</option>
									<option value="Review Article">Review Article</option>
									<option value="SI: Data Driven Intelligent Computing and Applied AI Modeling for Smart Urban Systems">SI: Data Driven Intelligent Computing and Applied AI Modeling for Smart Urban Systems</option>
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
										Upload Files (PDF only)
									</h3>
									{["manuscript", "coverLetter", "declaration"].map((doc) => (
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

														if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
															const file = e.dataTransfer.files[0];

															// Only PDF allowed
															if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
																const syntheticEvent = {
																	target: {
																		files: e.dataTransfer.files,
																		name: doc,
																	},
																};
																handleFileChange(syntheticEvent, doc);
															} else {
																toast.error("Please upload only PDF files", {
																	position: "top-center",
																	autoClose: 3000,
																});
															}
														}
													}}
												>
													<div className="flex flex-col items-center justify-center pt-5 pb-6">
														<p className="mb-2 text-sm text-[#00796b]">
															<span className="font-semibold">Click to upload</span> or drag and drop
														</p>
														<p className="text-xs text-[#00796b]">
															Upload {doc.replace(/([A-Z])/g, " $1").toLowerCase()} (PDF only)
															<span className="text-red-500 ml-1">*</span>
														</p>
													</div>
													<input
														type="file"
														name={doc}
														accept=".pdf"
														onChange={(e) => handleFileChange(e, doc)}
														className="hidden"
													/>
												</label>
											</div>

											{/* File Display */}
											{files[doc] ? (
												<div className="mt-2 flex items-center justify-between bg-green-50 p-2 rounded border border-green-200">
													<p className="text-sm text-green-700 truncate flex-1">
														📄 {files[doc].name}
														{isEditMode && <span className="ml-1 text-green-600 font-medium">(New)</span>}
													</p>
													<button
														type="button"
														onClick={() => {
															setFiles((prev) => ({ ...prev, [doc]: null }));
															if (!existingFileUrls[`${doc}File`]) {
																setUploadedFiles((prev) => ({ ...prev, [doc]: false }));
															}
														}}
														className="ml-2 text-red-600 hover:text-red-800 text-sm font-medium"
														title="Remove file"
													>
														✕
													</button>
												</div>
											) : existingFileUrls[`${doc}File`] ? (
												<div className="mt-2 flex items-center justify-between bg-blue-50 p-2 rounded border border-blue-200">
													<p className="text-sm text-blue-700 truncate flex-1">
														📎 {getFileNameFromUrl(existingFileUrls[`${doc}File`])}
														<span className="ml-1 text-blue-500 text-xs">(Existing)</span>
													</p>
													<div className="flex items-center gap-2">
														<a
															href={existingFileUrls[`${doc}File`]}
															target="_blank"
															rel="noreferrer"
															className="text-blue-600 hover:text-blue-800 text-sm underline"
														>
															View
														</a>
														<button
															type="button"
															onClick={() => {
																setExistingFileUrls((prev) => ({ ...prev, [`${doc}File`]: null }));
																setUploadedFiles((prev) => ({ ...prev, [doc]: false }));
															}}
															className="text-red-600 hover:text-red-800 text-sm font-medium"
															title="Remove file"
														>
															✕
														</button>
													</div>
												</div>
											) : null}
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
							<div className="text-center mb-6">
								<h2 className="text-2xl font-bold text-[#00796b]">Select Classification</h2>
								<p className="text-gray-500">Click to add/remove classifications</p>
								{/* 🔥 NEW: Show min/max requirements */}
								<p className="text-sm text-gray-600 mt-2">
									<span className={formData.classification.length >= 3 ? "text-green-600" : "text-amber-600"}>
										Minimum: 3
									</span>
									{" | "}
									<span className={formData.classification.length <= 5 ? "text-green-600" : "text-red-600"}>
										Maximum: 5
									</span>
								</p>
							</div>

							{/* Search */}
							<div className="mb-4 max-w-md mx-auto">
								<input
									type="text"
									placeholder="🔍 Search..."
									value={classificationSearch}
									onChange={(e) => setClassificationSearch(e.target.value)}
									className="w-full border-2 border-[#00796b] rounded-full px-5 py-3 focus:outline-none"
								/>
							</div>

							<div className="flex flex-col lg:flex-row gap-4">
								{/* LEFT: Categories */}
								<div className="flex-1 border rounded-xl overflow-hidden bg-white shadow">
									<div className="bg-[#00796b] text-white px-4 py-3 font-semibold">
										📋 All Classifications
									</div>
									<div className="h-[400px] overflow-y-auto">
										{classificationCategories.map(category => {
											const isExpanded = expandedCategories.includes(category.id);
											const filteredSubs = category.subClassifications.filter(sub =>
												!classificationSearch || sub.toLowerCase().includes(classificationSearch.toLowerCase())
											);

											if (classificationSearch && filteredSubs.length === 0) return null;

											return (
												<div key={category.id} className="border-b">
													<button
														type="button"
														onClick={() => setExpandedCategories(prev =>
															prev.includes(category.id)
																? prev.filter(id => id !== category.id)
																: [...prev, category.id]
														)}
														className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50"
														style={{ borderLeft: `4px solid ${category.color}` }}
													>
														<span>{category.icon}</span>
														<span className="font-medium flex-1 text-left">{category.name}</span>
														<span className="text-gray-400">{isExpanded ? "▼" : "▶"}</span>
													</button>

													{(isExpanded || classificationSearch) && (
														<div className="bg-gray-50 p-2 space-y-1">
															{filteredSubs.map((sub, i) => {
																const isSelected = formData.classification.includes(sub);
																// 🔥 NEW: Check if max limit reached
																const isMaxReached = formData.classification.length >= 5;
																const isDisabled = !isSelected && isMaxReached;

																return (
																	<div
																		key={i}
																		onClick={() => {
																			// 🔥 NEW: Prevent adding if max reached
																			if (isDisabled) {
																				return;
																			}

																			setFormData(prev => ({
																				...prev,
																				classification: isSelected
																					? prev.classification.filter(c => c !== sub)
																					: [...prev.classification, sub]
																			}));
																		}}
																		className={`flex items-center gap-2 px-3 py-2 rounded transition-all ${isSelected
																			? "bg-[#00796b] text-white cursor-pointer"
																			: isDisabled
																				? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50"
																				: "bg-white hover:bg-[#e0f7fa] cursor-pointer"
																			}`}
																		title={isDisabled ? "Maximum 5 classifications allowed" : ""}
																	>
																		<span className={`w-4 h-4 border-2 rounded flex items-center justify-center ${isSelected
																			? "bg-white border-white"
																			: isDisabled
																				? "border-gray-400"
																				: "border-[#00796b]"
																			}`}>
																			{isSelected && <span className="text-[#00796b] text-xs">✓</span>}
																		</span>
																		<span className="text-sm">{sub}</span>
																		{isDisabled && (
																			<span className="ml-auto text-xs text-gray-400">🔒</span>
																		)}
																	</div>
																);
															})}
														</div>
													)}
												</div>
											);
										})}
									</div>
								</div>

								{/* RIGHT: Selected */}
								<div className="flex-1 border-2 border-[#00796b] rounded-xl overflow-hidden bg-white shadow">
									<div className="bg-[#00796b] text-white px-4 py-3 flex justify-between font-semibold">
										<span>✓ Selected</span>
										{/* 🔥 NEW: Show count with color based on validation */}
										<span className={`px-2 rounded-full text-sm ${formData.classification.length >= 3 && formData.classification.length <= 5
											? "bg-green-500 text-white"
											: formData.classification.length > 5
												? "bg-red-500 text-white"
												: "bg-white text-[#00796b]"
											}`}>
											{formData.classification.length}/5
										</span>
									</div>
									<div className="h-[400px] overflow-y-auto p-3">
										{formData.classification.length === 0 ? (
											<div className="h-full flex flex-col items-center justify-center text-gray-400">
												<span className="text-5xl mb-2">📭</span>
												<p>No selections yet</p>
												<p className="text-sm mt-2">Select at least 3 classifications</p>
											</div>
										) : (
											<div className="space-y-2">
												{formData.classification.map((item, index) => {
													const cat = getCategoryForClassification(item);
													return (
														<div
															key={item}
															className="flex items-center gap-2 p-2 bg-[#e0f7fa] rounded group"
															style={{ borderLeft: `3px solid ${cat?.color || "#00796b"}` }}
														>
															<span className="text-xs text-gray-500 font-bold w-5">{index + 1}.</span>
															<span className="text-xs text-gray-400">{cat?.icon}</span>
															<span className="text-sm text-[#00796b] flex-1">{item}</span>
															<button
																onClick={() => setFormData(prev => ({
																	...prev,
																	classification: prev.classification.filter(c => c !== item)
																}))}
																className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-100 rounded p-1 transition-opacity"
															>
																✕
															</button>
														</div>
													);
												})}
											</div>
										)}
									</div>

									{/* 🔥 NEW: Progress bar and clear button */}
									<div className="p-3 border-t bg-gray-50">
										{/* Progress bar */}
										<div className="mb-2">
											<div className="flex justify-between text-xs text-gray-500 mb-1">
												<span>Progress</span>
												<span>{formData.classification.length} of 3-5 required</span>
											</div>
											<div className="w-full bg-gray-200 rounded-full h-2">
												<div
													className={`h-2 rounded-full transition-all ${formData.classification.length >= 3 && formData.classification.length <= 5
														? "bg-green-500"
														: formData.classification.length > 5
															? "bg-red-500"
															: "bg-amber-500"
														}`}
													style={{
														width: `${Math.min((formData.classification.length / 5) * 100, 100)}%`
													}}
												></div>
											</div>
										</div>

										{formData.classification.length > 0 && (
											<button
												onClick={() => setFormData(prev => ({ ...prev, classification: [] }))}
												className="w-full py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
											>
												Clear All ({formData.classification.length})
											</button>
										)}
									</div>
								</div>
							</div>

							{/* 🔥 NEW: Validation messages */}
							{formData.classification.length === 0 && (
								<p className="mt-4 text-center text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
									⚠️ Please select at least 3 classifications (minimum required)
								</p>
							)}

							{formData.classification.length > 0 && formData.classification.length < 3 && (
								<p className="mt-4 text-center text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
									⚠️ Select {3 - formData.classification.length} more classification{3 - formData.classification.length > 1 ? 's' : ''} (minimum 3 required)
								</p>
							)}

							{formData.classification.length >= 3 && formData.classification.length <= 5 && (
								<p className="mt-4 text-center text-green-600 bg-green-50 p-3 rounded border border-green-200">
									✓ Valid selection! You have selected {formData.classification.length} classification{formData.classification.length > 1 ? 's' : ''}
									{formData.classification.length < 5 && ` (you can add ${5 - formData.classification.length} more)`}
								</p>
							)}

							{formData.classification.length > 5 && (
								<p className="mt-4 text-center text-red-600 bg-red-50 p-3 rounded border border-red-200">
									❌ Too many selections! Please remove {formData.classification.length - 5} classification{formData.classification.length - 5 > 1 ? 's' : ''} (maximum 5 allowed)
								</p>
							)}

							<div className="flex justify-between mt-6">
								{renderBackButton(3)}
								{/* 🔥 UPDATED: Disable next button if validation fails */}
								{renderNextButton(3, formData.classification.length < 3 || formData.classification.length > 5)}
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
							{/* Header with Counter */}
							<div className="flex items-center justify-between mb-4">
								<div>
									<h2 className="text-lg font-semibold text-[#00796b]">
										Add Specifications<span className="text-red-500 ml-1">*</span>
									</h2>
									<p className="text-sm text-gray-500">
										Add between 3 to 5 specifications
									</p>
								</div>

								{/* 🔥 Counter Badge */}
								<div className={`px-4 py-2 rounded-full font-semibold text-sm ${formData.additionalInfo.length < 3
									? "bg-red-100 text-red-600"
									: formData.additionalInfo.length === 5
										? "bg-amber-100 text-amber-600"
										: "bg-green-100 text-green-600"
									}`}>
									{formData.additionalInfo.length} / 5
									{formData.additionalInfo.length < 3 && (
										<span className="ml-1">(Min: 3)</span>
									)}
									{formData.additionalInfo.length === 5 && (
										<span className="ml-1">(Max)</span>
									)}
								</div>
							</div>

							{/* 🔥 Progress Bar */}
							<div className="mb-4">
								<div className="w-full bg-gray-200 rounded-full h-2">
									<div
										className={`h-2 rounded-full transition-all duration-300 ${formData.additionalInfo.length < 3
											? "bg-red-500"
											: formData.additionalInfo.length <= 5
												? "bg-green-500"
												: "bg-amber-500"
											}`}
										style={{ width: `${Math.min((formData.additionalInfo.length / 5) * 100, 100)}%` }}
									/>
								</div>
								<div className="flex justify-between text-xs text-gray-400 mt-1">
									<span>0</span>
									<span className={formData.additionalInfo.length >= 3 ? "text-green-600 font-medium" : ""}>
										3 (Min)
									</span>
									<span className={formData.additionalInfo.length === 5 ? "text-amber-600 font-medium" : ""}>
										5 (Max)
									</span>
								</div>
							</div>

							{/* 🔥 Specifications List with Delete */}
							<div className="w-full border border-[#e0e0e0] rounded-lg p-3 bg-gray-50 mb-4 min-h-[150px] max-h-[250px] overflow-y-auto">
								{formData.additionalInfo.length === 0 ? (
									<p className="text-gray-400 italic text-center py-4">
										No specifications added yet. Add between 3 to 5 items.
									</p>
								) : (
									<div className="space-y-2">
										{formData.additionalInfo.map((item, index) => (
											<div
												key={index}
												className="flex items-center justify-between bg-white p-3 rounded-lg border border-[#e0e0e0] group hover:border-[#00796b] transition-colors"
											>
												<div className="flex items-center gap-3 flex-1">
													<span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${index < 3
														? "bg-green-100 text-green-600"
														: "bg-amber-100 text-amber-600"
														}`}>
														{index + 1}
													</span>
													<span className="text-[#00796b] text-sm break-all">
														{item}
													</span>
													{index < 3 && (
														<span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
															Required
														</span>
													)}
												</div>
												<button
													type="button"
													onClick={() => {
														setFormData((prev) => ({
															...prev,
															additionalInfo: prev.additionalInfo.filter((_, i) => i !== index),
														}));
														toast.info("Specification removed", {
															position: "top-center",
															autoClose: 1500,
														});
													}}
													className="ml-2 text-red-500 hover:text-white hover:bg-red-500 p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100"
													title="Remove specification"
												>
													<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
													</svg>
												</button>
											</div>
										))}
									</div>
								)}
							</div>

							{/* 🔥 Clear All Button */}
							{formData.additionalInfo.length > 0 && (
								<div className="flex justify-end mb-2">
									<button
										type="button"
										onClick={() => {
											setFormData((prev) => ({
												...prev,
												additionalInfo: [],
											}));
											toast.info("All specifications cleared", {
												position: "top-center",
												autoClose: 1500,
											});
										}}
										className="text-xs text-red-600 hover:text-red-800 underline"
									>
										Clear All
									</button>
								</div>
							)}

							{/* 🔥 Input Field - Disabled when max reached */}
							<div className="flex gap-2 mb-4">
								<input
									type="text"
									value={itemInput}
									onChange={(e) => setItemInput(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											handleAddItem();
										}
									}}
									placeholder={
										formData.additionalInfo.length >= 5
											? "Maximum 5 specifications reached"
											: "Enter specification..."
									}
									disabled={formData.additionalInfo.length >= 5}
									className={`flex-1 border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#00796b] ${formData.additionalInfo.length >= 5
										? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
										: "bg-white text-[#00796b] border-[#e0e0e0]"
										}`}
								/>
								<motion.button
									type="button"
									onClick={handleAddItem}
									disabled={formData.additionalInfo.length >= 5}
									className={`px-6 py-3 rounded-lg font-medium transition-colors ${formData.additionalInfo.length >= 5
										? "bg-gray-300 text-gray-500 cursor-not-allowed"
										: "bg-[#00796b] text-white hover:bg-[#00695c]"
										}`}
									whileHover={formData.additionalInfo.length < 5 ? { scale: 1.05 } : {}}
									whileTap={formData.additionalInfo.length < 5 ? { scale: 0.95 } : {}}
								>
									Add
								</motion.button>
							</div>

							{/* 🔥 Validation Messages */}
							{formData.additionalInfo.length < 3 && (
								<div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
									<p className="text-red-600 text-sm flex items-center gap-2">
										<span>⚠️</span>
										<span>
											Please add at least <strong>{3 - formData.additionalInfo.length} more</strong> specification(s) to proceed
										</span>
									</p>
								</div>
							)}

							{formData.additionalInfo.length >= 3 && formData.additionalInfo.length < 5 && (
								<div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
									<p className="text-green-600 text-sm flex items-center gap-2">
										<span>✅</span>
										<span>
											Minimum requirement met! You can add <strong>{5 - formData.additionalInfo.length} more</strong> specification(s)
										</span>
									</p>
								</div>
							)}

							{formData.additionalInfo.length === 5 && (
								<div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
									<p className="text-amber-600 text-sm flex items-center gap-2">
										<span>📋</span>
										<span>
											<strong>Maximum limit reached!</strong> You have added all 5 specifications.
										</span>
									</p>
								</div>
							)}

							{/* Navigation Buttons */}
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

							{/* <div className="mb-4">
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
							</div> */}

							{/* <button
								type="button"
								onClick={handleAddAuthors}
								className="mt-2 px-4 py-2 bg-[#00796b] text-white rounded-lg hover:bg-[#3a5269]"
							>
								Add Co-Authors
							</button> */}

							{/* Selected authors list */}
							<div className="mt-4">
								{/* Header with Title and Top Right Button */}
								<div className="flex justify-between items-center bg-[#e0f7fa] px-4 py-3 rounded-t-lg border border-[#e0e0e0] border-b-0">
									<h3 className="text-lg font-semibold text-[#00796b]">
										Authors List:
									</h3>
									{/* 🔥 Top Right - Add Co-Authors Button */}
									<button
										type="button"
										onClick={handleAddAuthors}
										className="px-4 py-2 bg-[#00796b] text-white rounded-lg hover:bg-[#3a5269] text-sm font-medium transition-colors flex items-center gap-1"
									>
										<span>+</span> Add Co-Authors
									</button>
								</div>

								<div className="bg-white overflow-hidden border-x border-[#e0e0e0]">
									<table className="min-w-full divide-y divide-[#e0e0e0]">
										<thead className="bg-[#f0f9f8]">
											<tr>
												<th className="px-4 py-3 text-left text-xs font-medium text-[#00796b] uppercase tracking-wider">
													Move
												</th>
												<th className="px-4 py-3 text-left text-xs font-medium text-[#00796b] uppercase tracking-wider">
													Actions
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
														{selectedAuthors.map((authorId, index) => {
															const author = authors.find((a) => a._id === authorId);
															if (!author) return null;

															const isCorrespondingAuthor = correspondingAuthorIds.includes(authorId);

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
																				</div>
																			</td>
																			<td className="px-4 py-3">
																				<div className="flex space-x-2 items-center">
																					<button
																						onClick={() => handleEditAuthor(authorId)}
																						className="bg-[#e2e8f0] hover:bg-[#e0e0e0] text-[#00796b] px-3 py-1 rounded text-sm transition-colors"
																						title="Edit author"
																					>
																						✏️
																					</button>

																					{selectedAuthors.length > 1 && authorId !== user._id && (
																						<button
																							onClick={() => handleRemoveAuthor(authorId)}
																							className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
																							title="Delete author"
																						>
																							🗑
																						</button>
																					)}
																				</div>
																			</td>
																			<td className="px-4 py-3">
																				<div className="text-sm">
																					{author.title} {author.firstName}{" "}
																					{author.middleName ? `${author.middleName} ` : ""}
																					{author.lastName}
																					{author.academicDegree && (
																						<span className="text-[#9e9e9e]">
																							, {author.academicDegree}
																						</span>
																					)}
																				</div>
																			</td>
																			<td className="px-4 py-3">
																				<div className="text-sm">{author.email}</div>
																			</td>
																			<td className="px-4 py-3">
																				<div className="text-sm">
																					{authorId === user._id ? (
																						<div className="font-medium text-[#00796b]">
																							<div className="flex items-center gap-2">
																								<span>Corresponding Author</span>
																								<span className="text-xs bg-[#BAFFF5] px-2 py-0.5 rounded-full">
																									(You)
																								</span>
																							</div>
																						</div>
																					) : isCorrespondingAuthor ? (
																						<div className="font-medium text-[#00796b]">
																							Corresponding Author
																						</div>
																					) : (
																						<div className="font-medium text-[#00796b]">
																							Author
																						</div>
																					)}
																				</div>
																			</td>
																		</tr>
																	)}
																</Draggable>
															);
														})}
														{provided.placeholder}
													</tbody>
												)}
											</Droppable>
										</DragDropContext>
									</table>
								</div>

								{/* 🔥 Bottom Footer - Part of Table */}
								<div className="flex justify-start items-center bg-[#f0f9f8] px-4 py-3 rounded-b-lg border border-[#e0e0e0] border-t">
									<button
										type="button"
										onClick={handleAddAuthors}
										className="px-4 py-2 bg-[#00796b] text-white rounded-lg hover:bg-[#3a5269] text-sm font-medium transition-colors flex items-center gap-1"
									>
										<span>+</span> Add Co-Authors
									</button>
								</div>
							</div>

							{/* Modal for selecting authors */}
							{isAuthorModalOpen && (
								<div className="fixed inset-0 bg-transparent flex justify-center items-center z-50">
									{/* 🔥 Optional: Light overlay for better visibility */}
									{/* <div className="absolute inset-0 bg-black bg-opacity-10"></div> */}

									<div className="bg-white p-4 rounded-lg text-[#212121] w-[500px] shadow-2xl border border-[#e0e0e0] relative z-10">
										<div className="flex justify-between items-center mb-2">
											<h3 className="font-bold text-lg text-[#00796b]">
												{editingAuthorId ? "Edit Author" : "Add New Author"}
											</h3>
											<button
												onClick={() => {
													setIsAuthorModalOpen(false);
													setIsEditAuthorModalOpen(false);
													setEditingAuthorId(null);
													setIsEmailVerified(false);
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
												}}
												className="text-[#9e9e9e] hover:text-[#212121] text-2xl font-bold"
											>
												×
											</button>
										</div>

										<div className="space-y-2">
											<div className="grid grid-cols-[120px,1fr] items-center gap-1">
												<label className="text-sm">
													Title
													<span className="text-red-500">*</span>
												</label>
												<select
													name="title"
													value={newAuthor.title}
													onChange={handleNewAuthorChange}
													className="w-full border rounded px-2 py-1 text-sm border-[#e0e0e0]"
													required
												>
													<option value="">Select Title</option>
													<option value="Mr">Mr</option>
													<option value="Mrs">Mrs</option>
													<option value="Miss">Miss</option>
													<option value="Dr">Dr</option>
													<option value="Er">Er</option>
												</select>
											</div>

											<div className="grid grid-cols-[120px,1fr] items-center gap-1">
												<label className="text-sm">
													Given/First Name
													<span className="text-red-500">*</span>
												</label>
												<input
													type="text"
													name="firstName"
													value={newAuthor.firstName}
													onChange={handleNewAuthorChange}
													className="w-full border rounded px-2 py-1 text-sm border-[#e0e0e0]"
													required
												/>
											</div>

											<div className="grid grid-cols-[120px,1fr] items-center gap-1">
												<label className="text-sm">Middle Name</label>
												<input
													type="text"
													name="middleName"
													value={newAuthor.middleName}
													onChange={handleNewAuthorChange}
													className="w-full border rounded px-2 py-1 text-sm border-[#e0e0e0]"
												/>
											</div>

											<div className="grid grid-cols-[120px,1fr] items-center gap-1">
												<label className="text-sm">
													Family/Last Name
													<span className="text-red-500">*</span>
												</label>
												<input
													type="text"
													name="lastName"
													value={newAuthor.lastName}
													onChange={handleNewAuthorChange}
													className="w-full border rounded px-2 py-1 text-sm border-[#e0e0e0]"
													required
												/>
											</div>

											<div className="grid grid-cols-[120px,1fr] items-center gap-1">
												<label className="text-sm">Academic Degree(s)</label>
												<input
													type="text"
													name="academicDegree"
													value={newAuthor.academicDegree}
													onChange={handleNewAuthorChange}
													className="w-full border rounded px-2 py-1 text-sm border-[#e0e0e0]"
												/>
											</div>

											<div className="grid grid-cols-[120px,1fr] items-center gap-1">
												<label className="text-sm">
													E-mail Address
													<span className="text-red-500">*</span>
												</label>
												<div className="relative">
													<input
														type="email"
														name="email"
														value={newAuthor.email}
														onChange={handleNewAuthorChange}
														className={`w-full border rounded px-2 py-1 text-sm border-[#e0e0e0] ${isEmailVerified ? "border-green-500" : ""
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
													<span className="text-red-500">*</span>
												</label>
												<div className="relative">
													<input
														type="text"
														name="institution"
														value={newAuthor.institution}
														onChange={handleNewAuthorChange}
														onFocus={() => {
															if (newAuthor.institution?.trim().length >= 2)
																setInstOpen(true);
														}}
														onKeyDown={async (ev) => {
															if (ev.key === "Enter") {
																ev.preventDefault();
																if (
																	(instSuggestions || []).length === 0 &&
																	newAuthor.institution?.trim().length >= 2
																) {
																	await createInstitutionIfNeeded(
																		newAuthor.institution
																	);
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
																		setNewAuthor((prev) => ({
																			...prev,
																			institution: s.name,
																		}));
																		setInstOpen(false);
																	}}
																	className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
																>
																	{s.name}
																</li>
															))}
															{newAuthor.institution?.trim().length >= 2 &&
																(instSuggestions || []).length === 0 && (
																	<li
																		onMouseDown={(e) => e.preventDefault()}
																		onClick={async () => {
																			await createInstitutionIfNeeded(
																				newAuthor.institution
																			);
																		}}
																		className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer text-cyan-700 flex items-center gap-2 border-t border-[#e0e0e0]"
																	>
																		<span className="text-cyan-600 font-semibold">
																			+
																		</span>
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
													<span className="text-red-500">*</span>
												</label>
												<select
													name="country"
													value={newAuthor.country}
													onChange={handleNewAuthorChange}
													className="w-full border rounded px-2 py-1 text-sm border-[#e0e0e0]"
													required
												>
													<option value="">Please select from the list below</option>
													{countries.map((country) => (
														<option key={country} value={country}>
															{country}
														</option>
													))}
												</select>
											</div>

											<div className="flex items-center mt-2">
												<input
													type="checkbox"
													name="isCorresponding"
													checked={newAuthor.isCorresponding}
													onChange={handleNewAuthorChange}
													className="mr-2"
												/>
												<label className="text-sm">
													This is the corresponding author
												</label>
											</div>

											{newAuthor.isCorresponding && (
												<div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-lg">
													<div className="flex items-start gap-2">
														<span className="text-amber-600 text-lg">⚠️</span>
														<div>
															<p className="text-sm font-semibold text-amber-800 mb-1">
																PLEASE NOTE:
															</p>
															<p className="text-sm text-amber-700 leading-relaxed">
																If you continue with this author as the Corresponding Author,
																then once you build the PDF or exit the submission process,
																you will no longer have access to the submission. This author
																must then log into the system and approve the PDF to complete
																the submission of your manuscript.
															</p>
														</div>
													</div>
												</div>
											)}


											{/* 🔥 NEW: 3 BUTTONS */}
											<div className="flex justify-end gap-2 mt-4">
												<button
													type="button"
													onClick={() => {
														setIsAuthorModalOpen(false);
														setIsEditAuthorModalOpen(false);
														setEditingAuthorId(null);
														setIsEmailVerified(false);
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
													}}
													className="px-3 py-1 bg-[#e2e8f0] text-[#00796b] rounded text-sm hover:bg-[#e0e0e0]"
												>
													Cancel
												</button>

												{/* 🔥 Button 1: Add & Close Modal */}
												<button
													type="button"
													onClick={handleAddNewAuthor}
													className="px-3 py-1 bg-[#00796b] text-white rounded text-sm hover:bg-[#3a5269]"
												>
													{editingAuthorId ? "Save" : "Add & Close"}
												</button>

												{/* 🔥 Button 2: Add & Continue (Only show when NOT editing) */}
												{!editingAuthorId && (
													<button
														type="button"
														onClick={handleAddNewAuthorAndContinue}
														className="px-3 py-1 bg-[#00acc1] text-white rounded text-sm hover:bg-[#00796b]"
													>
														Add & Continue
													</button>
												)}
											</div>
										</div>
									</div>
								</div>
							)}
							<div className="mb-4">
								<span className="block font-medium mb-2 text-[#00796b]">
									Funding:<span className="text-red-500 ml-1">*</span>
								</span>
								<div className="flex items-center gap-4">
									<label className="flex items-center text-[#00796b] cursor-pointer">
										<input
											type="radio"
											name="funding"
											value="Yes"
											checked={formData.funding === "Yes"}
											onChange={handleInputChange}
											className="mr-2 w-4 h-4 accent-[#00796b]"
										/>
										Yes
									</label>
									<label className="flex items-center text-[#00796b] cursor-pointer">
										<input
											type="radio"
											name="funding"
											value="No"
											checked={formData.funding === "No"}
											onChange={handleInputChange}
											className="mr-2 w-4 h-4 accent-[#00796b]"
										/>
										No
									</label>
								</div>

								{/* Show warning if not selected */}
								{formData.funding !== "Yes" && formData.funding !== "No" && (
									<p className="text-red-500 text-sm mt-1">
										⚠️ Please select funding information
									</p>
								)}
							</div>

							{formData.funding === "Yes" && (
								<div className="mb-4 mt-4 p-4 border border-[#e0e0e0] rounded-lg bg-gray-50">
									<h3 className="font-semibold mb-3 text-[#00796b]">
										Billing Information
									</h3>
									<div className="grid grid-cols-1 md:grid-cols-1 gap-4">
										<div>
											<label className="block text-sm font-medium mb-1 text-[#00796b]">
												Find a Funder
											</label>
											<input
												type="text"
												name="findFunder"
												value={formData.billingInfo.findFunder}
												onChange={handleBillingInfoChange}
												placeholder="Funding organization or agency"
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

								<div className="flex flex-wrap gap-3">
									{/* ═══════════════════════════════════════════════════════════ */}
									{/* EDIT MODE BUTTONS                                           */}
									{/* ═══════════════════════════════════════════════════════════ */}

									{isEditMode && !pdfUrl && !AcceptOrRejectPdf && (
										<>
											{/* Update Draft Only */}
											<button
												type="button"
												onClick={handleUpdateDraft}
												disabled={isUpdatingDraft || isBuildingPdf || !isSection6Valid()}
												className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-all ${isUpdatingDraft || isBuildingPdf || !isSection6Valid()
													? "bg-gray-400 text-gray-200 cursor-not-allowed"
													: "bg-amber-500 text-white hover:bg-amber-600"
													}`}
												title={!isSection6Valid() ? "Please complete all required fields" : "Update Draft"}
											>
												{isUpdatingDraft ? (
													<>
														<svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
															<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
															<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
														</svg>
														Updating...
													</>
												) : (
													<>💾 Update Draft</>
												)}
											</button>

											{/* Update & Build PDF */}
											<button
												type="button"
												onClick={handleUpdateAndBuildPdf}
												disabled={isUpdatingDraft || isBuildingPdf || !isSection6Valid()}
												className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-all ${isUpdatingDraft || isBuildingPdf || !isSection6Valid()
													? "bg-gray-400 text-gray-200 cursor-not-allowed"
													: "bg-[#00796b] text-white hover:bg-[#00acc1]"
													}`}
												title={!isSection6Valid() ? "Please complete all required fields" : "Update & Build PDF"}
											>
												{isBuildingPdf ? (
													<>
														<svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
															<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
															<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
														</svg>
														Building PDF...
													</>
												) : (
													<>📄 Update & Build PDF</>
												)}
											</button>
										</>
									)}

									{/* ═══════════════════════════════════════════════════════════ */}
									{/* NEW SUBMISSION BUTTONS                                      */}
									{/* ═══════════════════════════════════════════════════════════ */}

									{!isEditMode && !pdfUrl && !draftSaved && (
										<>
											{/* Save Draft */}
											<button
												type="button"
												onClick={handleSaveDraft}
												disabled={isSavingDraft || isBuildingPdf || !isSection6Valid()}
												className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-all ${isSavingDraft || isBuildingPdf || !isSection6Valid()
													? "bg-gray-400 text-gray-200 cursor-not-allowed"
													: "bg-amber-500 text-white hover:bg-amber-600"
													}`}
												title={!isSection6Valid() ? "Please complete all required fields" : "Save Draft"}
											>
												{isSavingDraft ? (
													<>
														<svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
															<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
															<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
														</svg>
														Saving...
													</>
												) : (
													<>💾 Save Draft</>
												)}
											</button>

											{/* Build PDF & Submit */}
											<button
												type="button"
												onClick={handleProceedAndBuildPdf}
												disabled={isBuildingPdf || isSavingDraft || !isSection6Valid()}
												className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-all ${isBuildingPdf || isSavingDraft || !isSection6Valid()
													? "bg-gray-400 text-gray-200 cursor-not-allowed"
													: "bg-[#00796b] text-white hover:bg-[#3a5269]"
													}`}
												title={!isSection6Valid() ? "Please complete all required fields" : "Build PDF & Submit"}
											>
												{isBuildingPdf ? (
													<>
														<svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
															<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
															<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
														</svg>
														Building PDF...
													</>
												) : (
													<>📄 Build PDF & Submit</>
												)}
											</button>
										</>
									)}

									{/* ═══════════════════════════════════════════════════════════ */}
									{/* PDF PREVIEW BUTTONS                                         */}
									{/* ═══════════════════════════════════════════════════════════ */}

									{/* View PDF */}
									{pdfUrl && !draftSaved && (
										<button
											type="button"
											onClick={() => {
												window.open(pdfUrl, "_blank");
												setPdfViewed(true);
											}}
											className="px-6 py-2 bg-[#00acc1] text-white rounded-lg hover:bg-[#00796b]"
										>
											View PDF
										</button>
									)}

									{/* Accept */}
									{AcceptOrRejectPdf && !draftSaved && (
										<button
											type="button"
											onClick={handleAcceptPdf}
											disabled={!pdfViewed || isAccepting}
											className={`px-6 py-2 rounded-lg flex items-center justify-center min-w-[120px] ${pdfViewed && !isAccepting
												? "bg-green-600 text-white hover:bg-green-700 cursor-pointer"
												: "bg-gray-400 text-gray-700 cursor-not-allowed"
												}`}
											title={!pdfViewed ? "Please view the PDF first" : isAccepting ? "Submitting..." : "Accept the manuscript"}
										>
											{isAccepting ? (
												<>
													<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" viewBox="0 0 24 24">
														<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
														<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
													</svg>
													Submitting...
												</>
											) : 'Accept'}
										</button>
									)}

									{/* Reject */}
									{AcceptOrRejectPdf && !draftSaved && (
										<button
											type="button"
											onClick={handleRejectPdf}
											disabled={!pdfViewed}
											className={`px-6 py-2 rounded-lg ${pdfViewed
												? "bg-red-600 text-white hover:bg-red-700 cursor-pointer"
												: "bg-gray-400 text-gray-700 cursor-not-allowed"
												}`}
											title={!pdfViewed ? "Please view the PDF first" : "Reject the manuscript"}
										>
											Reject
										</button>
									)}

									{/* Edit */}
									{AcceptOrRejectPdf && !draftSaved && (
										<button
											type="button"
											onClick={handleEdit}
											disabled={!pdfViewed}
											className={`px-6 py-2 rounded-lg ${pdfViewed
												? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
												: "bg-gray-400 text-gray-700 cursor-not-allowed"
												}`}
											title={!pdfViewed ? "Please view the PDF first" : "Edit and restart from File Upload"}
										>
											Edit
										</button>
									)}
								</div>
							</div>

							{/* ═══════════════════════════════════════════════════════════ */}
							{/* VALIDATION WARNING MESSAGE                                  */}
							{/* ═══════════════════════════════════════════════════════════ */}

							{!pdfUrl && !draftSaved && !isSection6Valid() && (
								<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
									<p className="text-red-600 text-sm flex items-start gap-2">
										<span className="text-lg">⚠️</span>
										<span>
											<strong>Please complete the following required fields:</strong>
											<ul className="mt-2 list-disc list-inside space-y-1">
												{(!formData.title || formData.title.trim() === "") && (
													<li>Title</li>
												)}
												{(!formData.keywords || formData.keywords.trim() === "") && (
													<li>Keywords</li>
												)}
												{(!formData.abstract || formData.abstract.trim() === "") && (
													<li>Abstract</li>
												)}
												{selectedAuthors.length === 0 && (
													<li>At least one author</li>
												)}
												{formData.funding !== "Yes" && formData.funding !== "No" && (
													<li>Funding information</li>
												)}
											</ul>
										</span>
									</p>
								</div>
							)}

							{/* Draft Saved Success Message */}
							{draftSaved && (
								<div className="mt-4 text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
									<p className="flex items-center gap-2">
										<span className="text-lg">✅</span>
										<span><strong>Draft saved!</strong> Redirecting to My Submissions...</span>
									</p>
								</div>
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</form>
			{isEditMode && (
				<div className="max-w-4xl mx-auto mb-4">
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
							</svg>
							<div>
								<p className="font-semibold text-blue-800">Edit Mode</p>
								<p className="text-sm text-blue-600">Editing existing draft</p>
							</div>
						</div>
						<button
							onClick={() => navigate(`${BASE_URL}/my-submissions`)}
							className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
						>
							Cancel
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default ManuscriptPage;
