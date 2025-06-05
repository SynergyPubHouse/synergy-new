import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";

function ReviewerLogin() {
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		accessKey: "",
	});
	const navigate = useNavigate();
	const { login } = useAuth();

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (formData.accessKey !== "REVIEWER123") {
			alert("Invalid Reviewer Access Key");
			return;
		}

		try {
			const response = await axios.post(
				`${import.meta.env.VITE_BACKEND_URL}/api/auth/reviewer/login`,
				{
					email: formData.email,
					password: formData.password,
				}
			);

			if (response.data && response.data.token) {
				const userData = {
					token: response.data.token,
					reviewer: response.data.reviewer,
				};
				localStorage.setItem("user", JSON.stringify(userData));
				login(userData);
				navigate(
					"/journal/Journal-of-Intelligent-Computing-Systems/reviewer/dashboard"
				);
			}
		} catch (error) {
			alert(error.response?.data?.message || "Login failed");
		}
	};

	return (
		<div className="flex items-center justify-center min-h-screen bg-[#f8fafc] p-6">
			<form
				className="bg-white p-10 rounded-2xl shadow-lg w-full max-w-md border border-[#e2e8f0]"
				onSubmit={handleSubmit}
			>
				<h2 className="text-4xl font-extrabold text-[#496580] mb-6 text-center">
					Reviewer Sign In
				</h2>

				<div className="space-y-6">
					<div>
						<label className="block text-sm font-medium text-[#496580] mb-2">
							Email
						</label>
						<input
							type="email"
							name="email"
							value={formData.email}
							placeholder="Enter your email"
							onChange={handleChange}
							required
							className="w-full px-4 py-3 rounded-xl bg-[#f8fafc] text-[#1a365d] border border-[#cbd5e1] focus:border-[#496580] focus:ring-2 focus:ring-[#496580]/50 outline-none transition-all"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-[#496580] mb-2">
							Password
						</label>
						<input
							type="password"
							name="password"
							value={formData.password}
							placeholder="Enter your password"
							onChange={handleChange}
							required
							className="w-full px-4 py-3 rounded-xl bg-[#f8fafc] text-[#1a365d] border border-[#cbd5e1] focus:border-[#496580] focus:ring-2 focus:ring-[#496580]/50 outline-none transition-all"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-[#496580] mb-2">
							Reviewer Access Key
						</label>
						<input
							type="password"
							name="accessKey"
							value={formData.accessKey}
							placeholder="Enter reviewer access key"
							onChange={handleChange}
							required
							className="w-full px-4 py-3 rounded-xl bg-[#f8fafc] text-[#1a365d] border border-[#cbd5e1] focus:border-[#496580] focus:ring-2 focus:ring-[#496580]/50 outline-none transition-all"
						/>
					</div>

					<button
						type="submit"
						className="w-full bg-[#496580] hover:bg-[#3a5269] text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-[#496580]/30"
					>
						Login as Reviewer
					</button>
				</div>

				<div className="mt-6 text-center">
					<p className="text-[#64748b] text-sm">
						&copy; 2025 PaperSphere. All rights reserved.
					</p>
				</div>
			</form>
		</div>
	);
}

export default ReviewerLogin;
