import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../App";
import { FaGoogle, FaArrowRight } from "react-icons/fa";
import { SiOrcid } from "react-icons/si";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

// Directly import the Client ID from frontend environment variables
// Ensure you have a .env file with VITE_GOOGLE_CLIENT_ID="your-id"
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const ORCID_CLIENT_ID = import.meta.env.VITE_ORCID_CLIENT_ID;

// Use localhost for development, production URL for production
const ORCID_REDIRECT_URI = import.meta.env.DEV
  ? `http://localhost:5173/orcid-callback`
  : `https://synergyworldpress.com/orcid-callback`;
const ORCID_AUTH_URL = `https://orcid.org/oauth/authorize?client_id=${ORCID_CLIENT_ID}&response_type=code&scope=/authenticate%20/read-limited&redirect_uri=${encodeURIComponent(
  ORCID_REDIRECT_URI
)}`;

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState({ show: false, message: "" });
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [editorPassKey, setEditorPassKey] = useState("");
  const [showEditorKeyInput, setShowEditorKeyInput] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";
  const { login } = useAuth();
  console.log("from", from);

  // NO LONGER NEEDED: const [googleClientId, setGoogleClientId] = useState('');

  // Success Notification Component
  const SuccessNotification = () => {
    if (!success.show) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="animate-fade-in-up bg-white p-6 rounded-xl shadow-2xl border border-green-200 max-w-md mx-4 flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg
              className="h-8 w-8 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Success!</h3>
            <p className="text-sm text-gray-500">{success.message}</p>
          </div>
        </div>
      </div>
    );
  };

  // NO LONGER NEEDED: The useEffect to fetch the client ID is removed.

  // Auto-hide success message
  useEffect(() => {
    if (success.show) {
      const timer = setTimeout(() => {
        setSuccess({ show: false, message: "" });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success.show]);

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/google`,
        { token: credentialResponse.credential }
      );

      if (response.data) {
        localStorage.setItem("user", JSON.stringify(response.data));
        login(response.data);
        setSuccess({
          show: true,
          message: "Successfully Logged In !! Welcome back..",
        });
        setTimeout(() => navigate(from, { replace: true }), 2000);
      } else {
        setError("Login Failed: User data missing");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Google Login Failed";

      console.log("errormsg", errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleFailure = () => {
    setError("Google login failed. Please try again.");
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e, role, passKey = "") => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`;
      const payload = { ...formData };

      if (role === "Editor") {
        payload.passKey = passKey; // send the editor key to backend
      }

      const response = await axios.post(url, payload);

      if (response.data) {
        console.log("Login response data:", response.data);
        const userData = { ...response.data, loginTime: Date.now() };
        let redirectPath = from;
        if (
          userData.accountType === "editor" ||
          userData.availableRoles?.includes("editor")
        ) {
          redirectPath = "/journal/jics/editor/dashboard";
        } else if (
          userData.accountType === "reviewer" ||
          userData.availableRoles?.includes("reviewer")
        ) {
          redirectPath = "/journal/jics/reviewer/dashboard";
        }

        localStorage.setItem("user", JSON.stringify(userData));
        login(userData);
        setSuccess({
          show: true,
          message: `Login successful as ${role}! Taking you to your account...`,
        });
        setTimeout(() => navigate(redirectPath, { replace: true }), 2000);
      } else {
        setError("Login Failed: User data missing");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login Failed";

      // ══════════════════════════════════════════════════════════════
      // 🆕 NEW: Handle email verification required error
      // ══════════════════════════════════════════════════════════════
      if (error.response?.data?.needsVerification) {
        setNeedsVerification(true);
        setVerificationEmail(error.response?.data?.email || formData.email);
        setError("Please verify your email before logging in.");
      } else if (errorMessage === "Editor key required") {
        setShowEditorKeyInput(true);
        setError(errorMessage);
      } else {
        setError(errorMessage);
      }
      // ══════════════════════════════════════════════════════════════
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrcidLogin = async () => {
    try {
      // Hit the ORCID "login URL" endpoint, not callback
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/orcid`
      );

      // Redirect browser to ORCID login page
      window.location.href = res.data.url;
    } catch (err) {
      console.error("ORCID redirect error:", err);
      alert("ORCID login failed. Please try again.");
    }
  };

  // Add this new function
  const handleResendVerification = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/resend-verification`,
        { email: verificationEmail }
      );

      if (response.data.success) {
        setSuccess({
          show: true,
          message: "Verification email sent! Please check your inbox.",
        });
        setNeedsVerification(false);
      }
    } catch (error) {
      if (error.response?.data?.alreadyVerified) {
        setError("Email is already verified. Please try logging in again.");
        setNeedsVerification(false);
      } else {
        setError(error.response?.data?.message || "Failed to send verification email.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 relative">
      <SuccessNotification />

      <div className="w-full max-w-4xl flex flex-col lg:flex-row rounded-3xl overflow-hidden shadow-2xl">
        {/* Branding Panel */}
        <div className="bg-gradient-to-br from-teal-600 to-cyan-500 p-8 lg:p-12 flex flex-col justify-center items-center lg:items-start text-white lg:w-2/5">
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl mb-8">
            <img
              src="/images/JICSLogo.png"
              alt="Synergy World Press Logo"
              className="w-20 h-20 object-contain"
            />
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold mb-2 text-center lg:text-left">
            Journal of Intelligent Computing System
          </h1>
          <p className="text-cyan-100 text-center lg:text-left">
            Access your account to continue your publishing journey
          </p>

          <div className="mt-12 hidden lg:block">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center mr-3">
                <FaArrowRight className="text-white" />
              </div>
              <span className="text-sm font-medium">Secure authentication</span>
            </div>
            <div className="flex items-center mt-3">
              <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center mr-3">
                <FaArrowRight className="text-white" />
              </div>
              <span className="text-sm font-medium">
                Multiple login options
              </span>
            </div>
          </div>
        </div>

        {/* Form Panel */}
        <div className="bg-white p-8 lg:p-12 flex flex-col justify-center lg:w-3/5">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-3xl font-bold text-gray-900 mb-1">
              Welcome back
            </h2>
            <p className="text-gray-500 mb-6">Please Enter the Following</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Username / Email:
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password:
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition-all"
                />
              </div>
              {showEditorKeyInput && (
                <div className="mt-3 space-y-2">
                  <label
                    htmlFor="editorKey"
                    className="text-sm font-medium text-gray-700"
                  >
                    Enter SSH / Editor Key:
                  </label>
                  <input
                    id="editorKey"
                    type="password"
                    placeholder="Enter editor pass key"
                    value={editorPassKey}
                    onChange={(e) => setEditorPassKey(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, "Editor", editorPassKey)}
                    disabled={isLoading || !editorPassKey}
                    className="w-full py-2.5 px-4 rounded-lg bg-cyan-500 text-white font-medium hover:bg-cyan-600 disabled:opacity-50"
                  >
                    {isLoading ? "..." : "Submit Key & Login"}
                  </button>
                </div>
              )}
              {/* Role-based Login Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, "Author")}
                  disabled={isLoading}
                  className="py-2.5 px-4 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 hover:from-cyan-50 hover:to-cyan-100 text-gray-700 hover:text-cyan-700 font-medium text-sm transition-all border border-gray-300 hover:border-cyan-400 disabled:opacity-50"
                >
                  {isLoading ? "..." : "Author Login"}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, "Reviewer")}
                  disabled={isLoading}
                  className="py-2.5 px-4 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 hover:from-cyan-50 hover:to-cyan-100 text-gray-700 hover:text-cyan-700 font-medium text-sm transition-all border border-gray-300 hover:border-cyan-400 disabled:opacity-50"
                >
                  {isLoading ? "..." : "Reviewer Login"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditorKeyInput(true)}
                  disabled={isLoading}
                  className="py-2.5 px-4 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 hover:from-cyan-50 hover:to-cyan-100 text-gray-700 hover:text-cyan-700 font-medium text-sm transition-all border border-gray-300 hover:border-cyan-400 disabled:opacity-50"
                >
                  {isLoading ? "..." : "Editor Login"}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, "Publisher")}
                  disabled={isLoading}
                  className="py-2.5 px-4 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 hover:from-cyan-50 hover:to-cyan-100 text-gray-700 hover:text-cyan-700 font-medium text-sm transition-all border border-gray-300 hover:border-cyan-400 disabled:opacity-50"
                >
                  {isLoading ? "..." : "Publisher Login"}
                </button>
              </div>
            </form>

            {/* Social Login Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-sm text-gray-500">
                  Or Login via:
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              {/* ORCID Login */}
              <button
                onClick={handleOrcidLogin}
                type="button"
                className="flex items-center justify-center w-full bg-white text-gray-700 font-medium py-3 px-4 rounded-xl border-2 border-gray-200 hover:border-[#a6ce39] hover:bg-gray-50 transition-all group"
              >
                <SiOrcid className="w-6 h-6 mr-2 text-[#a6ce39] group-hover:scale-110 transition-transform" />
                <span className="flex items-center">
                  Sign in with ORCID
                  <span className="ml-2 text-xs text-gray-500">
                    What is ORCID?
                  </span>
                </span>
              </button>

              {/* Google Login */}
              <div className="flex justify-center">
                <div className="w-full">
                  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleFailure}
                      useOneTap
                      theme="outline"
                      size="large"
                      shape="pill"
                      text="continue_with"
                      width="100%"
                    />
                  </GoogleOAuthProvider>
                </div>
              </div>
            </div>

            {/* Helper Links */}
            <div className="mt-6 flex flex-wrap justify-center items-center gap-3 text-sm">
              <span
                onClick={() => navigate("/send-login-details")}
                className="text-cyan-600 hover:text-cyan-700 hover:underline cursor-pointer"
              >
                Send Login Details
              </span>
              <span className="text-gray-300">•</span>
              <span
                onClick={() => navigate("/register")}
                className="text-cyan-600 hover:text-cyan-700 hover:underline cursor-pointer"
              >
                Register Now
              </span>
              <span className="text-gray-300">•</span>
              <a
                href="#"
                className="text-cyan-600 hover:text-cyan-700 hover:underline"
              >
                Login Help
              </a>
            </div>

            <div className="mt-6 text-center">
              <p className="text-[#64748b] text-sm">
                &copy; {new Date().getFullYear()} Synergy World Press. All
                rights reserved.
              </p>
            </div>
            {/* {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )} */}

            {/* Add this NEW block right after the error block: */}
            {needsVerification && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm mb-3">
                  Your email is not verified. Please check your inbox for the verification link.
                </p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isLoading}
                  className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {isLoading ? "Sending..." : "Resend Verification Email"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
