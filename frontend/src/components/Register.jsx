import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
	});

	const [errorMessage, setErrorMessage] = useState("");
	const navigate = useNavigate();

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
				`${import.meta.env.VITE_BACKEND_URL}/api/auth/register`,
				formData
			);
			alert("Registration Successful!");
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
					Register
				</h2>

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
							placeholder="First Name"
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
							placeholder="Middle Name"
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
						placeholder="Last Name"
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
						placeholder="Email"
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
						placeholder="Username"
						value={formData.username}
						onChange={handleChange}
						required
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
						placeholder="Password"
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
						placeholder="Re-enter Password"
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
					Register
				</button>

				<div className="mt-4 text-center">
					<p className="text-[#64748b] text-sm">
						&copy; 2025 PaperSphere. All rights reserved.
					</p>
				</div>
			</form>
		</div>
	);
}

export default Register;
