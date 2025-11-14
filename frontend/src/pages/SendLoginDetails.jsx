import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function SendLoginDetails() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/send-login-details`, { email });
      const apiMsg = res?.data?.message || "Email sent";
      setMessage(apiMsg);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 404 && msg) {
        setError(msg); // "No account found with this email"
      } else {
        setError(msg || "Failed to send email");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Send Login Details</h1>
        <p className="text-gray-600 mb-6">Enter your registered email. We will email your login details if an account exists.</p>

        {message && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{message}</div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition-all"
              placeholder="you@example.com"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-4 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Email"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        </form>

        <div className="mt-6 text-xs text-gray-500">
          <p>
            This letter contains confidential information, is for your own use, and should not be forwarded to third parties.
          </p>
        </div>
      </div>
    </div>
  );
}
