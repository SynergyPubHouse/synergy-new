import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../App"; // 1. Import useAuth to access the login function

const BASE_URL = '';

function Register() {
  const [formData, setFormData] = useState({
    title: "",
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    specialization: "",
    experience: "",
    specialKey: "",
  });
  const [role, setRole] = useState("Author");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // 2. Initialize useLocation
  const { login } = useAuth(); // 3. Get the login function from your Auth context

  // 4. Define the 'from' variable, defaulting to the homepage
  const from = location.state?.from || '/';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match!");
      setIsLoading(false);
      return;
    }

    if ((role === "Editor" || role === "Reviewer") && (!formData.specialization || !formData.experience)) {
      setErrorMessage("Please provide specialization and experience for this role.");
      setIsLoading(false);
      return;
    }

    try {
      const endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/auth/register`;

      const payload = { ...formData, role };
      if (role === "Editor") payload.specialKey = formData.specialKey || "";

      const response = await axios.post(endpoint, payload);

      // ══════════════════════════════════════════════════════════════
      // 🔄 CHANGED: Handle email verification response
      // ══════════════════════════════════════════════════════════════
      if (response.data.success) {
        // Registration successful - redirect to verification pending page
        navigate("/verification-pending", {
          state: {
            email: formData.email,
            message: response.data.message
          }
        });
      } else {
        setErrorMessage("Registration failed. Please try again.");
      }
      // ══════════════════════════════════════════════════════════════

    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Registration Failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="flex flex-col md:flex-row">
          {/* Branding Panel */}
          <div className="md:w-2/5 bg-gradient-to-br from-teal-600 to-cyan-500 p-8 flex flex-col items-center justify-center text-white">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl mb-6">
              <img
                src="/images/JICSLogo.png"
                alt="Logo"
                className="w-16 h-16 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-center">Journal of Intelligent Computing System</h1>
            <p className="text-sm text-cyan-100 text-center opacity-90">
              Join our community of scholars and researchers
            </p>
            <div className="mt-8 hidden md:block">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center mr-2">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-xs">Secure registration</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center mr-2">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-xs">Instant access to journals</span>
              </div>
            </div>
          </div>

          {/* Form Panel */}
          <div className="md:w-3/5 p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Create your account</h2>

            {errorMessage && (
              <div className="mb-4 p-2 bg-red-50 text-red-600 rounded text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                  <select
                    name="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded border border-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none"
                  >
                    <option>Author</option>
                    <option>Editor</option>
                    <option>Reviewer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                  <select
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded border border-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none"
                  >
                    <option value="">Select</option>
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Miss">Miss</option>
                    <option value="Dr">Dr</option>
                    <option value="Prof">Prof</option>
                  </select>
                </div>

                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-xs rounded border border-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Middle</label>
                    <input
                      type="text"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs rounded border border-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-xs rounded border border-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none"
                    />
                  </div>
                </div>
              </div>

              {(role === "Editor" || role === "Reviewer") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Specialization</label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-xs rounded border border-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Experience (years)</label>
                    <input
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      required
                      min="0"
                      className="w-full px-3 py-2 text-xs rounded border border-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-xs rounded border border-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-xs rounded border border-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-xs rounded border border-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-xs rounded border border-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none"
                  />
                </div>
              </div>
              {role === "Editor" && (
                <div className="grid grid-cols-1 gap-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Editor Key
                  </label>
                  <input
                    type="password"
                    name="specialKey"
                    value={formData.specialKey}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-xs rounded border border-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors mt-4 flex items-center justify-center"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                Register Account
              </button>

              <div className="mt-6 text-center text-xs text-gray-500">
                Already have an account?{' '}
                <a href={`${BASE_URL}/login`} className="text-cyan-600 hover:underline">
                  Sign in
                </a>
              </div>
            </form>

            <div className="mt-6 text-center text-xs text-gray-500">

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;