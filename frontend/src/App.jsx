import React, { useState, createContext, useContext, useEffect } from "react";
import { HelmetProvider } from 'react-helmet-async';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";
import Login from "./components/Login";
import SendLoginDetails from "./pages/SendLoginDetails";
import ResetPassword from "./pages/ResetPassword";
import Register from "./components/Register";
import HomePage from "./pages/HomePage";
import LandingPage from "./pages/LandingPage";
import JICSJournal from "./pages/JICSJournal";
import Publish from "./pages/publish";
import Editors from "./pages/editor";
import Reviewers from "./pages/reviewer";
import TrackResearch from "./pages/track";
import ContactUs from "./pages/contactus";
import TermsOfService from "./pages/termsofservice";
import PrivacyPolicy from "./pages/privacypolicy";
import ManuscriptPage from "./pages/ManuscriptPage";
import ProfilePage from "./pages/ProfilePage";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import MyAccount from "./pages/account";
import MySubscriptions from "./pages/subscriptions";
import TeamDevPage from "./pages/teamDev";
import Settings from "./pages/settings";
import AboutUs from "./pages/about";
import EditorRegister from "./components/EditorRegister";
import EditorDashboard from "./components/EditorDashboard";
import MySubmissions from "./pages/MySubmissions";
import DocumentConversionTest from "./pages/DocumentConversionTest";
import ReviewerRegister from "./components/ReviewerRegister";
import ReviewerForgotPassword from "./components/ReviewerForgotPassword";
import ReviewerResetPassword from "./components/ReviewerResetPassword";
import ReviewerDashboard from "./components/ReviewerDashboard";
import OrcidCallback from "./components/OrcidCallback";
// Import Peer Review Pages
import InitialEditorialScreening from "./pages/peer-review/InitialEditorialScreening";
import DoubleBlindPeerReview from "./pages/peer-review/DoubleBlindPeerReview";
import FeedbackAndRevisions from "./pages/peer-review/FeedbackAndRevisions";
import FinalEvaluationAndAcceptance from "./pages/peer-review/FinalEvaluationAndAcceptance";
import PublicationIntegrityAndTimeline from "./pages/peer-review/PublicationIntegrityAndTimeline";

import PageNotAvailable from "./pages/pagenotavailable";
import PublicPdfProxy from "./pages/PublicPdfProxy";
// import BookPublication from "./pages/BookPublication";
import BookPublication from "./pages/BookPublication";
import WebSeriesCast from "./pages/WebSeriesCast";
import ConferencePublication from "./pages/ConferencePublication";
import CurrentIssue from "./pages/CurrentIssue";
import ArticleDetail from "./pages/journal/jics/articles/ArticleDetail";
import VerifyEmail from "./pages/VerifyEmail";
import VerificationPending from "./pages/VerificationPending";
import { useAutoLogout } from "./hooks/useAutoLogout";
// Create Authentication Context
const AuthContext = createContext(null);

// const JICS_URL = '/journal/jics';
const JICS_URL = "/journal/jics";
// const BASE_URL = '/';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
function AppContent() {
  const location = useLocation();
  const hideNavFooter =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname.startsWith("/pdf/");
  const [user, setUser] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    console.log(
      "Current Path:",
      location.pathname,
      "Hide Navbar:",
      location.pathname === "/" ||
      location.pathname.startsWith("/jics") ||
      location.pathname.startsWith("/peer-review")
    );
  }, [location.pathname]);

  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    window.location.href = "/journal/jics/about/overview";
  };
  useAutoLogout(logout);
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  // Hide Navbar on landing and JICS journal pages
  // const hideNavbar =
  //     location.pathname === "/" ||
  //     location.pathname.startsWith("/jics") ||
  //     location.pathname.startsWith("/peer-review");

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {/* {!hideNavbar && <Navbar />} */}
      {!hideNavFooter && <Navbar />}
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* JICS Journal Routes */}
        <Route path={`${JICS_URL}/*`} element={<JICSJournal />} />

        {/* Peer Review Process Routes */}
        <Route
          path={`/peer-review/initial-editorial-screening`}
          element={<InitialEditorialScreening />}
        />
        <Route
          path={`${JICS_URL}/peer-review/initial-editorial-screening`}
          element={<InitialEditorialScreening />}
        />
        <Route
          path={`/peer-review/double-blind-peer-review`}
          element={<DoubleBlindPeerReview />}
        />
        <Route
          path={`${JICS_URL}/peer-review/double-blind-peer-review`}
          element={<DoubleBlindPeerReview />}
        />
        <Route
          path={`/peer-review/feedback-and-revisions`}
          element={<FeedbackAndRevisions />}
        />
        <Route
          path={`${JICS_URL}/peer-review/feedback-and-revisions`}
          element={<FeedbackAndRevisions />}
        />
        <Route
          path={`/peer-review/final-evaluation-and-acceptance`}
          element={<FinalEvaluationAndAcceptance />}
        />
        <Route
          path={`${JICS_URL}/peer-review/final-evaluation-and-acceptance`}
          element={<FinalEvaluationAndAcceptance />}
        />
        <Route
          path={`/peer-review/publication-integrity-and-timeline`}
          element={<PublicationIntegrityAndTimeline />}
        />
        <Route
          path={`${JICS_URL}/peer-review/publication-integrity-and-timeline`}
          element={<PublicationIntegrityAndTimeline />}
        />

        <Route path="/orcid-callback" element={<OrcidCallback />} />

        <Route path="/books" element={<BookPublication />} />
        <Route path="/web-series-cast" element={<WebSeriesCast />} />
        <Route path="/conference-publication" element={<ConferencePublication />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/verification-pending" element={<VerificationPending />} />
        <Route path="/pdf/:filename" element={<PublicPdfProxy />} />
        {/* Journal Management Routes */}
        {/* <Route path={BASE_URL} element={<HomePage />} /> */}
        <Route path={`/publish`} element={<Publish />} />
        <Route path={`${JICS_URL}/editor`} element={<Editors />} />
        <Route path={`${JICS_URL}/reviewer`} element={<Reviewers />} />
        <Route path={`/track`} element={<TrackResearch />} />
        <Route path={`/contactus`} element={<ContactUs />} />
        <Route path={`/termsofservice`} element={<TermsOfService />} />
        <Route path={`/privacy`} element={<PrivacyPolicy />} />
        <Route path={`/login`} element={<Login />} />
        <Route path={`/send-login-details`} element={<SendLoginDetails />} />
        <Route path={`/reset-password/:token`} element={<ResetPassword />} />
        <Route path={`/register`} element={<Register />} />
        <Route path={`/account`} element={<MyAccount />} />
        <Route path={`/subscriptions`} element={<MySubscriptions />} />
        <Route path={`/team`} element={<TeamDevPage />} />
        <Route path={`/settings`} element={<Settings />} />
        <Route path={`/about`} element={<AboutUs />} />
        <Route path={`/journal/jics/articles/current`} element={<CurrentIssue />} />
        <Route path={`${JICS_URL}/articles/:id`} element={<ArticleDetail />} />
        <Route path={`/journal/jics/articles/:id`} element={<ArticleDetail />} />

        {/* Editor Routes */}
        <Route
          path={`${JICS_URL}/editor/register`}
          element={<EditorRegister />}
        />
        <Route
          path={`${JICS_URL}/editor/login`}
          element={<Navigate to="/login" replace />}
        />
        <Route
          path={`${JICS_URL}/editor/dashboard`}
          element={
            !user ? (
              <Navigate
                to="/login"
                state={{ from: location.pathname }}
                replace
              />
            ) : user?.accountType === "editor" || user?.availableRoles?.includes("editor") ? (
              <EditorDashboard />
            ) : (
              <VerifyEmail />
            )
          }
        />

        {/* Reviewer Routes */}
        <Route
          path={`/reviewer/reset-password/:token`}
          element={<ReviewerResetPassword />}
        />
        <Route
          path={`${JICS_URL}/reviewer/register`}
          element={<ReviewerRegister />}
        />
        <Route
          path={`${JICS_URL}/reviewer/login`}
          element={<Navigate to="/login" replace />}
        />
        <Route
          path={`${JICS_URL}/reviewer/forgot-password`}
          element={<ReviewerForgotPassword />}
        />
        <Route
          path={`${JICS_URL}/reviewer/reset-password/:token`}
          element={<ReviewerResetPassword />}
        />
        <Route
          path={`${JICS_URL}/reviewer/dashboard`}
          element={
            user?.accountType === "reviewer" ||
              user?.availableRoles?.includes("reviewer") ? (
              <ReviewerDashboard />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Protected Routes */}
        <Route
          path={`/profile`}
          element={
            user ? (
              <ProfilePage />
            ) : (
              <Navigate to={`${JICS_URL}/login`} replace />
            )
          }
        />

        <Route
          path={`${JICS_URL}/submit`}
          element={
            user ? (
              <ManuscriptPage />
            ) : (
              <Navigate
                to="/login"
                state={{ from: location.pathname }}
                replace
              />
            )
          }
        />
        <Route path="/journal/jics/edit-manuscript/:manuscriptId" element={<ManuscriptPage />} />
        <Route
          path={`${JICS_URL}/my-submissions`}
          element={<MySubmissions />}
        />
        <Route
          path={`${JICS_URL}/doc-conversion-test`}
          element={<DocumentConversionTest />}
        />
        <Route path="*" element={<PageNotAvailable />} />
      </Routes>
      {!hideNavFooter && <Footer />}
    </AuthContext.Provider>
  );
}

// Custom hook to use the AuthContext
export const useAuth = () => React.useContext(AuthContext);

function App() {
  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <AppContent />
      </Router>
    </HelmetProvider>
  );
}

export default App;
