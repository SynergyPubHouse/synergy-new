import React, { useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const BASE_URL = "/journal/jics";

function ReviewerResetPassword() {
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const { token } = useParams();
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setMessage("");
		setError("");

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		try {
			const response = await axios.post(
				`${
					import.meta.env.VITE_BACKEND_URL
				}/api/auth/reviewer/reset-password/${token}`,
				{ password }
			);
			setMessage(response.data.message);
			setTimeout(() => {
				navigate("/login");
			}, 3000);
		} catch (err) {
			setError(err.response?.data?.message || "An error occurred");
		}
	};

	return (
		<div className="flex items-center justify-center min-h-screen bg-[#f8fafc] p-6">
			<form
				className="bg-white p-10 rounded-2xl shadow-lg w-full max-w-md border border-[#e2e8f0]"
				onSubmit={handleSubmit}
			>
				<h2 className="text-4xl font-extrabold text-[#496580] mb-6 text-center">
					Reset Password
				</h2>

				{message && (
					<div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
						{message}
					</div>
				)}
				{error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
						{error}
					</div>
				)}

				<div className="space-y-6">
					<div>
						<label
							htmlFor="password"
							className="block text-sm font-medium text-[#496580] mb-2"
						>
							New Password
						</label>
						<input
							type="password"
							id="password"
							name="password"
							value={password}
							placeholder="Enter your new password"
							onChange={(e) => setPassword(e.target.value)}
							required
							className="w-full px-4 py-3 rounded-xl bg-[#f8fafc] text-[#1a365d] border border-[#cbd5e1] focus:border-[#496580] focus:ring-2 focus:ring-[#496580]/50 outline-none transition-all"
						/>
					</div>
					<div>
						<label
							htmlFor="confirmPassword"
							className="block text-sm font-medium text-[#496580] mb-2"
						>
							Confirm New Password
						</label>
						<input
							type="password"
							id="confirmPassword"
							name="confirmPassword"
							value={confirmPassword}
							placeholder="Confirm your new password"
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
							className="w-full px-4 py-3 rounded-xl bg-[#f8fafc] text-[#1a365d] border border-[#cbd5e1] focus:border-[#496580] focus:ring-2 focus:ring-[#496580]/50 outline-none transition-all"
						/>
					</div>

					<button
						type="submit"
						className="w-full bg-[#496580] hover:bg-[#3a5269] text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-[#496580]/30"
					>
						Reset Password
					</button>
				</div>
			</form>
		</div>
	);
}

export default ReviewerResetPassword;
