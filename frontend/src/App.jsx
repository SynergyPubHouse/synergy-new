import React, { useState, createContext, useContext, useEffect } from "react";
import {
    BrowserRouter as Router,
    Route,
    Routes,
    Navigate,
    useLocation
} from "react-router-dom";
import Login from "./components/Login";
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
import EditorLogin from "./components/EditorLogin";
import EditorDashboard from "./components/EditorDashboard";
import MySubmissions from "./pages/MySubmissions";
import ReviewerRegister from "./components/ReviewerRegister";
import ReviewerLogin from "./components/ReviewerLogin";
import ReviewerDashboard from "./components/ReviewerDashboard";
// Import Peer Review Pages
import InitialEditorialScreening from "./pages/peer-review/InitialEditorialScreening";
import DoubleBlindPeerReview from "./pages/peer-review/DoubleBlindPeerReview";
import FeedbackAndRevisions from "./pages/peer-review/FeedbackAndRevisions";
import FinalEvaluationAndAcceptance from "./pages/peer-review/FinalEvaluationAndAcceptance";
import PublicationIntegrityAndTimeline from "./pages/peer-review/PublicationIntegrityAndTimeline";

// Create Authentication Context
const AuthContext = createContext(null);

function AppContent() {
    const location = useLocation();
    const [user, setUser] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        console.log('Current Path:', location.pathname, 'Hide Navbar:', location.pathname === "/" || location.pathname.startsWith("/jics") || location.pathname.startsWith("/peer-review"));
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
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                Loading...
            </div>
        );
    }

    // Hide Navbar on landing and JICS journal pages
    const hideNavbar =
        location.pathname === "/" ||
        location.pathname.startsWith("/jics") ||
        location.pathname.startsWith("/peer-review");

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {!hideNavbar && <Navbar />}
            <Routes>
                <Route path="/" element={<LandingPage />} />
                
                {/* JICS Journal Routes */}
                <Route path="/jics/*" element={<JICSJournal />} />
                
                {/* Peer Review Process Routes */}
                <Route path="/peer-review/initial-editorial-screening" element={<InitialEditorialScreening />} />
                <Route path="/peer-review/double-blind-peer-review" element={<DoubleBlindPeerReview />} />
                <Route path="/peer-review/feedback-and-revisions" element={<FeedbackAndRevisions />} />
                <Route path="/peer-review/final-evaluation-and-acceptance" element={<FinalEvaluationAndAcceptance />} />
                <Route path="/peer-review/publication-integrity-and-timeline" element={<PublicationIntegrityAndTimeline />} />

                {/* Journal Management Routes */}
                <Route path="/journal/Journal-of-Intelligent-Computing-Systems" element={<HomePage />} />
                <Route path="/journal/Journal-of-Intelligent-Computing-Systems/publish" element={<Publish />} />
                <Route path="/journal/Journal-of-Intelligent-Computing-Systems/editors" element={<Editors />} />
                <Route path="/journal/Journal-of-Intelligent-Computing-Systems/reviewers" element={<Reviewers />} />
                <Route path="/journal/Journal-of-Intelligent-Computing-Systems/track" element={<TrackResearch />} />
                <Route path="/journal/Journal-of-Intelligent-Computing-Systems/contactus" element={<ContactUs />} />
                <Route path="/journal/Journal-of-Intelligent-Computing-Systems/termsofservice" element={<TermsOfService />} />
                <Route path="/journal/Journal-of-Intelligent-Computing-Systems/privacy" element={<PrivacyPolicy />} />
                <Route path="/journal/Journal-of-Intelligent-Computing-Systems/login" element={<Login />} />
                <Route path="/journal/Journal-of-Intelligent-Computing-Systems/register" element={<Register />} />
                <Route path="/journal/Journal-of-Intelligent-Computing-Systems/account" element={<MyAccount />} />
                <Route path="/journal/Journal-of-Intelligent-Computing-Systems/subscriptions" element={<MySubscriptions />} />
                <Route path="/journal/Journal-of-Intelligent-Computing-Systems/teamDev" element={<TeamDevPage />} />
                <Route path="/journal/Journal-of-Intelligent-Computing-Systems/settings" element={<Settings />} />
                <Route path="/journal/Journal-of-Intelligent-Computing-Systems/about" element={<AboutUs />} />
                <Route path="/journal/Journal-of-Intelligent-Computing-Systems/editor/register" element={<EditorRegister />} />
                <Route path="/journal/Journal-of-Intelligent-Computing-Systems/editor/login" element={<EditorLogin />} />
                <Route
                    path="/journal/Journal-of-Intelligent-Computing-Systems/editor/dashboard"
                    element={
                        user?.editor?.role === "editor" ? (
                            <EditorDashboard />
                        ) : (
                            <Navigate to="/journal/Journal-of-Intelligent-Computing-Systems/editor/login" replace />
                        )
                    }
                />
                <Route path="/journal/Journal-of-Intelligent-Computing-Systems/reviewer/register" element={<ReviewerRegister />} />
                <Route path="/journal/Journal-of-Intelligent-Computing-Systems/reviewer/login" element={<ReviewerLogin />} />
                <Route
                    path="/journal/Journal-of-Intelligent-Computing-Systems/reviewer/dashboard"
                    element={
                        user?.reviewer?.role === "reviewer" ? (
                            <ReviewerDashboard />
                        ) : (
                            <Navigate to="/journal/Journal-of-Intelligent-Computing-Systems/reviewer/login" replace />
                        )
                    }
                />
                <Route
                    path="/journal/Journal-of-Intelligent-Computing-Systems/profile"
                    element={
                        user ? <ProfilePage /> : <Navigate to="/journal/Journal-of-Intelligent-Computing-Systems/login" replace />
                    }
                />
                <Route
                    path="/journal/Journal-of-Intelligent-Computing-Systems/submit"
                    element={
                        user ? <ManuscriptPage /> : <Navigate to="/journal/Journal-of-Intelligent-Computing-Systems/login" replace />
                    }
                />
                <Route path="/journal/Journal-of-Intelligent-Computing-Systems/my-submissions" element={<MySubmissions />} />
            </Routes>
            <Footer />
        </AuthContext.Provider>
    );
}

// Custom hook to use the AuthContext
export const useAuth = () => React.useContext(AuthContext);

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
