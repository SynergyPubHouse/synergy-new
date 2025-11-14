import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/reset-password`, { token, password });
      setMessage(res?.data?.message || "Password has been reset successfully");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to reset password";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
        <p className="text-gray-600 mb-6">Enter a new password for your account.</p>

        {message && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{message}</div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="mt-1 w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-4 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Password"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
