import React, { useState } from "react";
import axios from "axios";

function ReviewerForgotPassword() {
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();
		setMessage("");
		setError("");

		try {
			const response = await axios.post(
				`${
					import.meta.env.VITE_BACKEND_URL
				}/api/auth/reviewer/forgot-password`,
				{ email }
			);
			setMessage(response.data.message);
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
					Forgot Password
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
							htmlFor="email"
							className="block text-sm font-medium text-[#496580] mb-2"
						>
							Email
						</label>
						<input
							type="email"
							id="email"
							name="email"
							value={email}
							placeholder="Enter your email"
							onChange={(e) => setEmail(e.target.value)}
							required
							className="w-full px-4 py-3 rounded-xl bg-[#f8fafc] text-[#1a365d] border border-[#cbd5e1] focus:border-[#496580] focus:ring-2 focus:ring-[#496580]/50 outline-none transition-all"
						/>
					</div>

					<button
						type="submit"
						className="w-full bg-[#496580] hover:bg-[#3a5269] text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-[#496580]/30"
					>
						Send Password Reset Link
					</button>
				</div>

				<div className="mt-6 text-center">
					<a
						href="/login"
						className="text-sm text-[#496580] hover:underline"
					>
						Back to Login
					</a>
				</div>
			</form>
		</div>
	);
}

export default ReviewerForgotPassword;
