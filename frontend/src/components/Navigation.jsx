import React, { useState } from "react";
import { Link } from "react-router-dom";

const Navigation = () => {
	const [activeDropdown, setActiveDropdown] = useState(null);
	const [dropdownTimeout, setDropdownTimeout] = useState(null);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const peerReviewItems = [
		{
			name: "Initial Editorial Screening",
			path: "/peer-review/initial-editorial-screening",
		},
		{
			name: "Double-Blind Peer Review",
			path: "/peer-review/double-blind-peer-review",
		},
		{
			name: "Feedback and Revisions",
			path: "/peer-review/feedback-and-revisions",
		},
		{
			name: "Final Evaluation and Acceptance",
			path: "/peer-review/final-evaluation-and-acceptance",
		},
		{
			name: "Publication Integrity and Timeline",
			path: "/peer-review/publication-integrity-and-timeline",
		},
	];

	const journalsItems = [
		{
			name: "Journal of Intelligent Computing System (JICS)",
			path: "/jics",
		},
	];

	const handleMouseEnter = (dropdownName) => {
		clearTimeout(dropdownTimeout);
		setActiveDropdown(dropdownName);
	};

	const handleMouseLeave = () => {
		const timeout = setTimeout(() => {
			setActiveDropdown(null);
		}, 200);
		setDropdownTimeout(timeout);
	};

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	return (
		<nav className="bg-white shadow-md sticky top-0 z-50">
			<div className="max-w-7xl mx-auto px-4">
				<div className="flex justify-between h-16">
					{/* Mobile menu button */}
					<div className="flex items-center md:hidden">
						<button
							onClick={toggleMobileMenu}
							className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
						>
							<span className="sr-only">Open main menu</span>
							{/* Hamburger icon */}
							<svg
								className={`${
									isMobileMenuOpen ? "hidden" : "block"
								} h-6 w-6`}
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 6h16M4 12h16M4 18h16"
								/>
							</svg>
							{/* Close icon */}
							<svg
								className={`${
									isMobileMenuOpen ? "block" : "hidden"
								} h-6 w-6`}
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>

					{/* Desktop Navigation */}
					<div className="hidden md:flex items-center space-x-8">
						<Link
							to="/"
							className="inline-flex items-center px-3 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
						>
							About Us
						</Link>

						<div
							className="relative"
							onMouseEnter={() => handleMouseEnter("peerReview")}
							onMouseLeave={handleMouseLeave}
						>
							<button className="inline-flex items-center px-3 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200">
								Peer Review Process
								<svg
									className={`ml-2 h-5 w-5 transform transition-transform duration-200 ${
										activeDropdown === "peerReview"
											? "rotate-180"
											: ""
									}`}
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</button>
							{activeDropdown === "peerReview" && (
								<div className="absolute left-0 mt-2 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 transform transition-all duration-200 ease-out">
									<div className="py-1">
										{peerReviewItems.map((item, index) => (
											<Link
												key={index}
												to={item.path}
												className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
											>
												{item.name}
											</Link>
										))}
									</div>
								</div>
							)}
						</div>

						<div
							className="relative"
							onMouseEnter={() => handleMouseEnter("journals")}
							onMouseLeave={handleMouseLeave}
						>
							<button className="inline-flex items-center px-3 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200">
								JOURNALS
								<svg
									className={`ml-2 h-5 w-5 transform transition-transform duration-200 ${
										activeDropdown === "journals"
											? "rotate-180"
											: ""
									}`}
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</button>
							{activeDropdown === "journals" && (
								<div className="absolute left-0 mt-2 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 transform transition-all duration-200 ease-out">
									<div className="py-1">
										{journalsItems.map((item, index) => (
											<Link
												key={index}
												to={item.path}
												className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
											>
												{item.name}
											</Link>
										))}
									</div>
								</div>
							)}
						</div>

						<Link
							to="/books"
							className="inline-flex items-center px-3 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
						>
							BOOK PUBLISHED
						</Link>

						<Link
							to="/login"
							className="inline-flex items-center px-3 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
						>
							AUTHOR LOGIN
						</Link>
					</div>

					{/* Submit Article Button */}
					<div className="hidden md:flex items-center">
						<Link
							to="/journal/Journal-of-Intelligent-Computing-Systems/submit"
							className="inline-flex items-center px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-all duration-200 font-medium shadow-sm hover:shadow"
						>
							Submit your article
							<svg
								className="ml-2 h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M14 5l7 7m0 0l-7 7m7-7H3"
								/>
							</svg>
						</Link>
					</div>
				</div>
			</div>

			{/* Mobile menu */}
			<div
				className={`${
					isMobileMenuOpen ? "block" : "hidden"
				} md:hidden bg-white`}
			>
				<div className="px-2 pt-2 pb-3 space-y-1">
					<Link
						to="/"
						className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
					>
						About Us
					</Link>

					<div className="relative">
						<button
							onClick={() =>
								setActiveDropdown(
									activeDropdown === "peerReview"
										? null
										: "peerReview"
								)
							}
							className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
						>
							Peer Review Process
							<svg
								className={`ml-2 h-5 w-5 inline transform transition-transform duration-200 ${
									activeDropdown === "peerReview"
										? "rotate-180"
										: ""
								}`}
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</button>
						{activeDropdown === "peerReview" && (
							<div className="pl-4">
								{peerReviewItems.map((item, index) => (
									<Link
										key={index}
										to={item.path}
										className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
									>
										{item.name}
									</Link>
								))}
							</div>
						)}
					</div>

					<div className="relative">
						<button
							onClick={() =>
								setActiveDropdown(
									activeDropdown === "journals"
										? null
										: "journals"
								)
							}
							className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
						>
							JOURNALS
							<svg
								className={`ml-2 h-5 w-5 inline transform transition-transform duration-200 ${
									activeDropdown === "journals"
										? "rotate-180"
										: ""
								}`}
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</button>
						{activeDropdown === "journals" && (
							<div className="pl-4">
								{journalsItems.map((item, index) => (
									<Link
										key={index}
										to={item.path}
										className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
									>
										{item.name}
									</Link>
								))}
							</div>
						)}
					</div>

					<Link
						to="/books"
						className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
					>
						BOOK PUBLISHED
					</Link>

					<Link
						to="/login"
						className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
					>
						AUTHOR LOGIN
					</Link>

					<Link
						to="/journal/Journal-of-Intelligent-Computing-Systems/submit"
						className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
					>
						Submit your article
					</Link>
				</div>
			</div>
		</nav>
	);
};

export default Navigation;
