import React from "react";
import { Link, Routes, Route, Navigate } from "react-router-dom";
import JICSNavigation from "../components/JICSNavigation";
import Overview from "./jics/Overview";
import AimsAndScope from "./jics/AimsAndScope";
import EditorialBoard from './jics/EditorialBoard';
import AcademicIntegrity from "./jics/AcademicIntegrity";
import SubmissionGuidelines from "./jics/SubmissionGuidelines";
import ManuscriptTemplate from "./jics/ManuscriptTemplate";
import EthicalGuidelines from "./jics/EthicalGuidelines";
import PeerReviewProcess from "./jics/PeerReviewProcess";
import ReviewTimeline from "./jics/ReviewTimeline";
import ReviewerEthics from "./jics/ReviewerEthics";
import DecisionCriteria from "./jics/DecisionCriteria";
import TransparencyMeasures from "./jics/TransparencyMeasures";

const JICSJournal = () => (
  <div className="min-h-screen bg-[#f9f9f9] font-sans pb-8">
    {/* Hero Header */}
    <header className="pt-[90px] relative overflow-hidden">
      {/* Background accent shapes */}
      <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-[#00acc1] opacity-10 animate-pulse"></div>
      <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-[#00796b] opacity-10 animate-pulse"></div>
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10 pb-8 md:pb-12 relative">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Logo */}
          <Link to="/journal/jics/about/overview" className="flex-shrink-0 relative group">
            <img
              src="/images/JICSLogo.png"
              alt="JICS Logo"
              className="w-28 h-36 md:w-36 md:h-48 object-contain bg-white  rounded-md shadow-lg group-hover:shadow-xl transition-all duration-300"
            />
          </Link>
          {/* Title, Description, and Button */}
          <div className="flex-1 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#00796b] mb-2 drop-shadow-sm">
                Journal of Intelligent Computing System (JICS)
              </h1>
              <p className="text-lg text-[#212121] max-w-2xl mx-auto md:mx-0">
                A peer-reviewed, open-access international journal dedicated to the advancement of intelligent computing research and its real-world applications.
              </p>
            </div>
            {/* Elegant Button */}
            <Link
              to="/journal/jics/submit"
              className="whitespace-nowrap inline-flex items-center justify-center px-6 py-3 bg-[#00796b] text-white font-semibold rounded-xl shadow hover:bg-[#00acc1] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              Submit your manuscript
              <svg
                className="ml-2 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
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
    </header>

    {/* Navigation */}
    <JICSNavigation />

    {/* Main Content */}
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <div className="p-8">
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/journal/jics/about/overview" replace />}
          />
          <Route path="/about/overview" element={<Overview />} />
          <Route path="/about/aims-scope" element={<AimsAndScope />} />
          <Route path="/about/editorial-board" element={<EditorialBoard />} />
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
                to="/journal/jics/submit"
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
          {/* Catch-All Route for invalid /journal/jics/* paths */}
          <Route path="*" element={<Navigate to="/journal/jics" replace />} />
        </Routes>
      </div>
    </main>
  </div>
);

export default JICSJournal;
