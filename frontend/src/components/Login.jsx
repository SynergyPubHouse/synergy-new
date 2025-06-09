import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { FaGoogle, FaArrowRight } from "react-icons/fa";
import { SiOrcid } from "react-icons/si";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const BASE_URL = '/';

// ORCID OAuth configuration
const ORCID_CLIENT_ID = import.meta.env.VITE_ORCID_CLIENT_ID;
const ORCID_REDIRECT_URI = `https://synergyworldpress.com/orcid-callback`;
const ORCID_AUTH_URL = `https://orcid.org/oauth/authorize?client_id=${ORCID_CLIENT_ID}&response_type=code&scope=openid&&redirect_uri=${encodeURIComponent(ORCID_REDIRECT_URI)}`;

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState({ show: false, message: "" });
  const navigate = useNavigate();
  const { login } = useAuth();
  const [googleClientId, setGoogleClientId] = useState('');

  // Success Notification Component
  const SuccessNotification = () => {
    if (!success.show) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="animate-fade-in-up bg-white p-6 rounded-xl shadow-2xl border border-green-200 max-w-md mx-4 flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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

  // Fetch Google Client ID
  useEffect(() => {
    const fetchClientId = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/auth/google-client-id`
        );
        setGoogleClientId(response.data.clientId);
      } catch (error) {
        console.error("Failed to fetch Google Client ID:", error);
        // setError("Failed to initialize Google login. Please refresh the page."); fr
      }
    };
    fetchClientId();
  }, []);

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
          message: "Successfully Logged In !! Welcome back.."
        });
        setTimeout(() => navigate(BASE_URL), 2000);
      } else {
        setError("Login Failed: User data missing");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Google Login Failed";
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`,
        formData
      );
      
      if (response.data) {
        localStorage.setItem("user", JSON.stringify(response.data));
        login(response.data);
        setSuccess({
          show: true,
          message: "Login successful! Taking you to your account..."
        });
        setTimeout(() => navigate(BASE_URL), 2000);
      } else {
        setError("Login Failed: User data missing");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login Failed";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrcidLogin = () => {
    window.location.href = ORCID_AUTH_URL;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 relative">
      <SuccessNotification />
      
      <div className="w-full max-w-4xl flex flex-col lg:flex-row rounded-3xl overflow-hidden shadow-2xl">
        {/* Branding Panel */}
        <div className="bg-gradient-to-br from-teal-600 to-cyan-500 p-8 lg:p-12 flex flex-col justify-center items-center lg:items-start text-white lg:w-2/5">
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl mb-8">
            <img
              src="/images/SynergyLogo.png"
              alt="Synergy World Press Logo"
              className="w-20 h-20 object-contain"
            />
          </div>
          
          <h1 className="text-3xl lg:text-4xl font-bold mb-2 text-center lg:text-left">
            Synergy World Press
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
              <span className="text-sm font-medium">Multiple login options</span>
            </div>
          </div>
        </div>

        {/* Form Panel */}
        <div className="bg-white p-8 lg:p-12 flex flex-col justify-center lg:w-3/5">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-3xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-gray-500 mb-8">Sign in to your account</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <a href="#" className="text-sm text-cyan-600 hover:text-cyan-700">
                    Forgot?
                  </a>
                </div>
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center"
              >
                {isLoading ? (
                  <span className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                ) : null}
                Sign In
              </button>
            </form>

            {/* Social Login Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-sm text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-6">
              {/* ORCID Login */}
              <button
                onClick={handleOrcidLogin}
                className="flex items-center justify-center w-full bg-white text-[#212121] font-semibold py-3 px-4 rounded-xl border border-[#e0e0e0] hover:border-[#00acc1] transition-all"
              >
                <SiOrcid className="w-6 h-6 mr-2 text-[#a6ce39]" />
                Sign in with ORCID
              </button>

              {/* Google Login */}
              {/* {googleClientId ? ( */}
                <div className="flex justify-center">
    <div className="w-full">
                <GoogleOAuthProvider clientId={googleClientId}>
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
{/*                 
              ) : (
                <button
                  type="button"
                  className="flex items-center justify-center w-full bg-white text-[#212121] font-semibold py-3 px-4 rounded-xl border border-[#e0e0e0] hover:border-[#4285F4] transition-all"
                  disabled
                >
                  <FaGoogle className="w-6 h-6 mr-2 text-[#4285F4]" />
                  Loading Google...
                </button>
              )} */}
            </div>

            <div className="mt-6 text-center">
              <p className="text-[#64748b] text-sm">
                &copy; {new Date().getFullYear()} Synergy World Press. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;