import React from "react";
import { Link, Routes, Route, Navigate } from "react-router-dom";
import JICSNavigation from "../components/JICSNavigation";
import Overview from "./jics/Overview";
import AimsAndScope from "./jics/AimsAndScope";
import AcademicIntegrity from "./jics/AcademicIntegrity";
import SubmissionGuidelines from "./jics/SubmissionGuidelines";
import ManuscriptTemplate from "./jics/ManuscriptTemplate";
import EthicalGuidelines from "./jics/EthicalGuidelines";
import PeerReviewProcess from "./jics/PeerReviewProcess";
import ReviewTimeline from "./jics/ReviewTimeline";
import ReviewerEthics from "./jics/ReviewerEthics";
import DecisionCriteria from "./jics/DecisionCriteria";
import TransparencyMeasures from "./jics/TransparencyMeasures";

const BASE = "/journal/Journal-of-Intelligent-Computing-Systems";

const JICSJournal = () => (
	<div className="min-h-screen bg-gray-50 font-sans pb-8">
		<header className="bg-yellow-300 px-4 sm:px-8 pt-8 pb-4 border-b border-gray-200 relative">
			<div className="flex flex-col sm:flex-row items-center max-w-7xl mx-auto">
				{/* Logo */}
				<Link
					to="/"
					className="w-24 h-32 sm:w-32 sm:h-40 bg-gray-200 mb-4 sm:mb-0 sm:mr-8 flex-shrink-0 flex items-center justify-center text-gray-500"
				>
					<img
						src="/images/JICSLogo.png"
						alt="JICS Logo"
						className="max-h-full max-w-full object-contain"
					/>
				</Link>
				{/* Title and Description */}
				<div className="text-center sm:text-left">
					<h1 className="text-2xl sm:text-4xl font-bold text-indigo-900 mb-2">
						Journal of Intelligent Computing System (JICS)
					</h1>
					<p className="text-gray-700 text-base sm:text-lg">
						A peer-reviewed, open-access international journal
						dedicated to the advancement of intelligent computing
						research and its real-world applications.
					</p>
				</div>
			</div>
		</header>

		<JICSNavigation />

		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<Routes>
				<Route
					path="/"
					element={<Navigate to="/jics/about/overview" replace />}
				/>
				<Route path="/about/overview" element={<Overview />} />
				<Route path="/about/aims-scope" element={<AimsAndScope />} />
				<Route
					path="/about/integrity"
					element={<AcademicIntegrity />}
				/>
				<Route
					path="/authors/guidelines"
					element={<SubmissionGuidelines />}
				/>
				<Route
					path="/authors/template"
					element={<ManuscriptTemplate />}
				/>
				<Route path="/authors/ethics" element={<EthicalGuidelines />} />
				<Route
					path="/authors/submit"
					element={
						<Navigate
							to="/journal/Journal-of-Intelligent-Computing-Systems/submit"
							replace
						/>
					}
				/>
				<Route path="/review/process" element={<PeerReviewProcess />} />
				<Route path="/review/timeline" element={<ReviewTimeline />} />
				<Route path="/review/ethics" element={<ReviewerEthics />} />
				<Route path="/review/criteria" element={<DecisionCriteria />} />
				<Route
					path="/review/transparency"
					element={<TransparencyMeasures />}
				/>
			</Routes>
		</div>
	</div>
);

export default JICSJournal;
