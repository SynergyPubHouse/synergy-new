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



import PageNotAvailable from "./pages/pagenotavailable";
// Create Authentication Context
const AuthContext = createContext(null);

// const JICS_URL = '/journal/Journal-of-Intelligent-Computing-Systems';
const JICS_URL = '/journal/jics';
// const BASE_URL = '/';
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
    // const hideNavbar =
    //     location.pathname === "/" ||
    //     location.pathname.startsWith("/jics") ||
    //     location.pathname.startsWith("/peer-review");

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {/* {!hideNavbar && <Navbar />} */}
            <Navbar />
            <Routes>
                {/* Landing Page */}
                <Route path="/" element={<LandingPage />} />
                
                {/* JICS Journal Routes */}
                <Route path={`${JICS_URL}/*`} element={<JICSJournal />} />
                
                {/* Peer Review Process Routes */}
                <Route path={`${JICS_URL}/peer-review/initial-editorial-screening`} element={<InitialEditorialScreening />} />
                <Route path={`${JICS_URL}/peer-review/double-blind-peer-review`} element={<DoubleBlindPeerReview />} />
                <Route path={`${JICS_URL}/peer-review/feedback-and-revisions`} element={<FeedbackAndRevisions />} />
                <Route path={`${JICS_URL}/peer-review/final-evaluation-and-acceptance`} element={<FinalEvaluationAndAcceptance />} />
                <Route path={`${JICS_URL}/peer-review/publication-integrity-and-timeline`} element={<PublicationIntegrityAndTimeline />} />




                <Route path="/books*" element={<PageNotAvailable />} />

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
                <Route path={`/register`} element={<Register />} />
                <Route path={`/account`} element={<MyAccount />} />
                <Route path={`/subscriptions`} element={<MySubscriptions />} />
                <Route path={`/team`} element={<TeamDevPage />} />
                <Route path={`/settings`} element={<Settings />} />
                <Route path={`/about`} element={<AboutUs />} />

                {/* Editor Routes */}
                <Route path={`${JICS_URL}/editor/register`} element={<EditorRegister />} />
                <Route path={`${JICS_URL}/editor/login`} element={<EditorLogin />} />
                <Route
                    path={`${JICS_URL}/editor/dashboard`}
                    element={
                        user?.editor?.role === "editor" ? (
                            <EditorDashboard />
                        ) : (
                            <Navigate to={`${JICS_URL}/editor/login`} replace />
                        )
                    }
                />

                {/* Reviewer Routes */}
                <Route path={`${JICS_URL}/reviewer/register`} element={<ReviewerRegister />} />
                <Route path={`${JICS_URL}/reviewer/login`} element={<ReviewerLogin />} />
                <Route
                    path={`${JICS_URL}/reviewer/dashboard`}
                    element={
                        user?.reviewer?.role === "reviewer" ? (
                            <ReviewerDashboard />
                        ) : (
                            <Navigate to={`${JICS_URL}/reviewer/login`} replace />
                        )
                    }
                />

                {/* Protected Routes */}
                <Route
                    path={`/profile`}
                    element={
                        user ? <ProfilePage /> : <Navigate to={`${JICS_URL}/login`} replace />
                    }
                />
                <Route
                    path={`${JICS_URL}/submit`}
                    element={
                        user ? <ManuscriptPage /> : <Navigate to={`/login`} replace />
                    }
                />
                <Route path={`${JICS_URL}/my-submissions`} element={<MySubmissions />} />
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
