import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation, Link } from "react-router-dom";

const BASE_URL = "/journal/jics";

// Utility function to get the correct login URL
const getReviewerLoginUrl = () => {
	return "/login";
};

function ReviewerRegister() {
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
	});

	const [errorMessage, setErrorMessage] = useState("");
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		// Check if coming from an invitation link
		const urlParams = new URLSearchParams(location.search);
		const invitationEmail = urlParams.get("email");

		if (invitationEmail) {
			setFormData((prev) => ({
				...prev,
				email: decodeURIComponent(invitationEmail),
			}));
		}
	}, [location]);

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (formData.password !== formData.confirmPassword) {
			setErrorMessage("Passwords do not match!");
			return;
		}

		try {
			await axios.post(
				`${
					import.meta.env.VITE_BACKEND_URL
				}/api/auth/reviewer/register`,
				formData
			);
			alert("Reviewer Registration Successful!");
			navigate("/login");
		} catch (error) {
			setErrorMessage(
				error.response?.data?.message || "Registration Failed"
			);
		}
	};

	return (
		<div className="flex items-center justify-center min-h-screen bg-[#f8fafc] p-4">
			<form
				onSubmit={handleSubmit}
				className="mt-15 bg-white p-8 rounded-2xl shadow-lg w-full max-w-lg space-y-6 border border-[#e2e8f0]"
			>
				<h2 className="text-4xl font-extrabold text-[#496580] mb-4 text-center">
					Reviewer Registration
				</h2>

				{/* Invitation Notice */}
				{new URLSearchParams(location.search).get("email") && (
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
						<div className="flex items-center">
							<span className="text-blue-600 mr-2">📧</span>
							<p className="text-blue-800 text-sm">
								You&apos;re registering from a review
								invitation. Your email has been pre-filled.
								After registration, you can view and respond to
								invitations in your dashboard.
							</p>
						</div>
					</div>
				)}

				<div>
					<label className="block text-sm font-medium text-[#496580] mb-1">
						Title
					</label>
					<select
						name="title"
						value={formData.title}
						onChange={handleChange}
						className="w-full px-4 py-2 rounded-lg bg-[#f8fafc] text-[#1a365d] border border-[#cbd5e1] focus:border-[#496580] focus:ring-2 focus:ring-[#496580]/50 outline-none"
					>
						<option value="">Select Title</option>
						<option value="Mr">Mr</option>
						<option value="Mrs">Mrs</option>
						<option value="Miss">Miss</option>
						<option value="Dr">Dr</option>
						<option value="Er">Er</option>
					</select>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-[#496580] mb-1">
							First Name
						</label>
						<input
							type="text"
							name="firstName"
							value={formData.firstName}
							onChange={handleChange}
							required
							className="w-full px-4 py-2 rounded-lg bg-[#f8fafc] text-[#1a365d] border border-[#cbd5e1] focus:border-[#496580] focus:ring-2 focus:ring-[#496580]/50 outline-none"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-[#496580] mb-1">
							Middle Name
						</label>
						<input
							type="text"
							name="middleName"
							value={formData.middleName}
							onChange={handleChange}
							className="w-full px-4 py-2 rounded-lg bg-[#f8fafc] text-[#1a365d] border border-[#cbd5e1] focus:border-[#496580] focus:ring-2 focus:ring-[#496580]/50 outline-none"
						/>
					</div>
				</div>

				<div>
					<label className="block text-sm font-medium text-[#496580] mb-1">
						Last Name
					</label>
					<input
						type="text"
						name="lastName"
						value={formData.lastName}
						onChange={handleChange}
						required
						className="w-full px-4 py-2 rounded-lg bg-[#f8fafc] text-[#1a365d] border border-[#cbd5e1] focus:border-[#496580] focus:ring-2 focus:ring-[#496580]/50 outline-none"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-[#496580] mb-1">
						Email
					</label>
					<input
						type="email"
						name="email"
						value={formData.email}
						onChange={handleChange}
						required
						className="w-full px-4 py-2 rounded-lg bg-[#f8fafc] text-[#1a365d] border border-[#cbd5e1] focus:border-[#496580] focus:ring-2 focus:ring-[#496580]/50 outline-none"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-[#496580] mb-1">
						Username
					</label>
					<input
						type="text"
						name="username"
						value={formData.username}
						onChange={handleChange}
						required
						className="w-full px-4 py-2 rounded-lg bg-[#f8fafc] text-[#1a365d] border border-[#cbd5e1] focus:border-[#496580] focus:ring-2 focus:ring-[#496580]/50 outline-none"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-[#496580] mb-1">
						Specialization
					</label>
					<input
						type="text"
						name="specialization"
						value={formData.specialization}
						onChange={handleChange}
						required
						className="w-full px-4 py-2 rounded-lg bg-[#f8fafc] text-[#1a365d] border border-[#cbd5e1] focus:border-[#496580] focus:ring-2 focus:ring-[#496580]/50 outline-none"
						placeholder="e.g., Computer Science, Biology, etc."
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-[#496580] mb-1">
						Years of Experience
					</label>
					<input
						type="number"
						name="experience"
						value={formData.experience}
						onChange={handleChange}
						required
						min="0"
						className="w-full px-4 py-2 rounded-lg bg-[#f8fafc] text-[#1a365d] border border-[#cbd5e1] focus:border-[#496580] focus:ring-2 focus:ring-[#496580]/50 outline-none"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-[#496580] mb-1">
						Password
					</label>
					<input
						type="password"
						name="password"
						value={formData.password}
						onChange={handleChange}
						required
						className="w-full px-4 py-2 rounded-lg bg-[#f8fafc] text-[#1a365d] border border-[#cbd5e1] focus:border-[#496580] focus:ring-2 focus:ring-[#496580]/50 outline-none"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-[#496580] mb-1">
						Confirm Password
					</label>
					<input
						type="password"
						name="confirmPassword"
						value={formData.confirmPassword}
						onChange={handleChange}
						required
						className="w-full px-4 py-2 rounded-lg bg-[#f8fafc] text-[#1a365d] border border-[#cbd5e1] focus:border-[#496580] focus:ring-2 focus:ring-[#496580]/50 outline-none"
					/>
				</div>

				{errorMessage && (
					<p className="text-red-500 text-sm text-center">
						{errorMessage}
					</p>
				)}

				<button
					type="submit"
					className="w-full bg-[#496580] hover:bg-[#3a5269] text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-[#496580]/30"
				>
					Register as Reviewer
				</button>

				{/* Login Redirect Section */}
				<div className="mt-6 pt-4 border-t border-[#e2e8f0]">
					<p className="text-center text-[#496580] text-sm mb-3">
						Already have a reviewer account?
					</p>
					<div className="text-center space-y-2">
						<Link
							to={getReviewerLoginUrl()}
							className="inline-block w-full px-4 py-2 bg-white border border-[#496580] text-[#496580] rounded-lg hover:bg-[#496580] hover:text-white transition-all duration-300 font-medium"
						>
							🔐 Login as Reviewer
						</Link>
						<p className="text-xs text-gray-500 mt-1">
							Use your existing reviewer credentials to access
							invitations and reviews
						</p>
					</div>
				</div>

				<div className="mt-4 text-center">
					<p className="text-[#64748b] text-sm">
						&copy; 2025 Synergy World Press. All rights reserved.
					</p>
				</div>
			</form>
		</div>
	);
}

export default ReviewerRegister;
