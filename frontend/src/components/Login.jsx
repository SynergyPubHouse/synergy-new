import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { FaGoogle, FaArrowRight } from "react-icons/fa";
import { SiOrcid } from "react-icons/si";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const BASE_URL = '/';

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();
  const [googleClientId, setGoogleClientId] = useState('');
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch Google Client ID on component mount
  React.useEffect(() => {
    const fetchClientId = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/auth/google-client-id`
        );
        setGoogleClientId(response.data.clientId);
      } catch (error) {
        console.error("Failed to fetch Google Client ID:", error);
        setError("Failed to initialize Google login. Please refresh the page.");
      }
    };
    fetchClientId();
  }, []);

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
        navigate(BASE_URL);
      } else {
        setError("Login Failed: User data missing");
        console.error("User data not found in the response");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Google Login Failed";
      setError(errorMessage);
      console.error("Google Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleFailure = () => {
    setError("Google login failed. Please try again.");
    console.log("Google login failed");
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
	setSuccessMessage("");
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`,
        formData
      );
      
      if (response.data) {
        localStorage.setItem("user", JSON.stringify(response.data));
        login(response.data);
		setSuccessMessage("Logged in successfully!");
      // Optionally, wait a moment before redirecting to show the message
      setTimeout(() => {
        navigate(BASE_URL);
      }, 1500);
      } else {
        setError("Login Failed: User data missing");
        console.error("User data not found in the response");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login Failed";
      setError(errorMessage);
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrcidLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/orcid`
      );
      
      if (response.data) {
        localStorage.setItem("user", JSON.stringify(response.data));
        login(response.data);
        navigate(BASE_URL);
      } else {
        setError("Login Failed: User data missing");
        console.error("User data not found in the response");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "ORCID Login Failed";
      setError(errorMessage);
      console.error("ORCID Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      {/* Glassmorphism Card Container */}
      <div className="w-full max-w-4xl flex flex-col lg:flex-row rounded-3xl overflow-hidden shadow-2xl">
        {/* Branding Panel - Gradient Background */}
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

        {/* Login Form Panel */}
        <div className="bg-white p-8 lg:p-12 flex flex-col justify-center lg:w-3/5">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-3xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-gray-500 mb-8">Sign in to your account</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

			{successMessage && (
				<div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
					{successMessage}
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

            {/* Social Login Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{googleClientId ? (
					<div className="w-full">
					<GoogleOAuthProvider clientId={googleClientId}>
						<div className="flex items-center justify-center w-full bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-all">
						<FaGoogle className="w-5 h-5 mr-2 text-[#4285F4]" />
						<GoogleLogin
							onSuccess={handleGoogleSuccess}
							onError={handleGoogleFailure}
							text="continue_with"
							theme="outline"
							shape="pill"
							size="medium"
							width="100%"
							ux_mode="popup"
						/>
						</div>
					</GoogleOAuthProvider>
					</div>
				) : (
					<button
					type="button"
					className="flex items-center justify-center w-full bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
					disabled
					>
					<FaGoogle className="w-5 h-5 mr-2 text-[#4285F4]" />
					Loading...
					</button>
				)}

				<button
					onClick={handleOrcidLogin}
					disabled={isLoading}
					className="flex items-center justify-center w-full bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl border border-gray-200 hover:border-[#a6ce39] transition-all"
				>
					<SiOrcid className="w-5 h-5 mr-2 text-[#a6ce39]" />
					ORCID
				</button>
			</div>


            {/* Footer */}
            <div className="mt-8 text-center text-sm text-gray-500">
              <p>&copy; {new Date().getFullYear()} Synergy World Press. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;