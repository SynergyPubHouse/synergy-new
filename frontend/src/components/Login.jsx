import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { FaGoogle } from "react-icons/fa";
import { SiOrcid } from "react-icons/si";

function Login() {
	const [formData, setFormData] = useState({ email: "", password: "" });
	const navigate = useNavigate();
	const { login } = useAuth();

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const response = await axios.post(
				`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`,
				formData
			);
			alert("Login Successful");
			if (response.data) {
				localStorage.setItem("user", JSON.stringify(response.data)); // Save user data
				login(response.data);
				navigate("/");
			} else {
				console.error("User data not found in the response");
				alert("Login Failed: User data missing");
			}
		} catch (error) {
			console.error("Login error:", error);
			alert(error.response?.data?.message || "Login Failed");
		}
	};

	const handleOrcidLogin = async () => {
		// Implement ORCID login functionality
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_BACKEND_URL}/api/auth/orcid`
			);
			alert("ORCID Login Successful");
			if (response.data) {
				login(response.data);
				navigate("/");
			} else {
				console.error("User data not found in the response");
				alert("Login Failed: User data missing");
			}
		} catch (error) {
			console.error("ORCID Login error:", error);
			alert(error.response?.data?.message || "ORCID Login Failed");
		}
	};

	const handleGoogleLogin = async () => {
		// Implement Google login functionality
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_BACKEND_URL}/api/auth/google`
			);
			alert("Google Login Successful");
			if (response.data) {
				login(response.data);
				navigate("/");
			} else {
				console.error("User data not found in the response");
				alert("Login Failed: User data missing");
			}
		} catch (error) {
			console.error("Google Login error:", error);
			alert(error.response?.data?.message || "Google Login Failed");
		}
	};

	const handleEmailLogin = async () => {
		// Implement Email login functionality
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_BACKEND_URL}/api/auth/email`
			);
			alert("Email Login Successful");
			if (response.data) {
				login(response.data);
				navigate("/");
			} else {
				console.error("User data not found in the response");
				alert("Login Failed: User data missing");
			}
		} catch (error) {
			console.error("Email Login error:", error);
			alert(error.response?.data?.message || "Email Login Failed");
		}
	};

	return (
		<div className="flex items-center justify-center min-h-screen bg-[#f8fafc] p-6">
			<form
				className="bg-white p-10 rounded-2xl shadow-lg w-full max-w-md border border-[#e2e8f0]"
				onSubmit={handleSubmit}
			>
				<h2 className="text-4xl font-extrabold text-[#496580] mb-6 text-center">
					Sign In
				</h2>

				<div className="space-y-6">
					<div>
						<label className="block text-sm font-medium text-[#496580] mb-2">
							Email
						</label>
						<input
							type="email"
							name="email"
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
							placeholder="Enter your password"
							onChange={handleChange}
							required
							className="w-full px-4 py-3 rounded-xl bg-[#f8fafc] text-[#1a365d] border border-[#cbd5e1] focus:border-[#496580] focus:ring-2 focus:ring-[#496580]/50 outline-none transition-all"
						/>
					</div>

					<button
						type="submit"
						className="w-full bg-[#496580] hover:bg-[#3a5269] text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-[#496580]/30"
					>
						Log In
					</button>

					<div className="flex justify-center items-center mt-1">
						<span className="text-[#64748b]">Or Login via:</span>
					</div>

					<div className="flex justify-around mt-1">
						<button
							type="button"
							className="flex items-center bg-white text-[#1a365d] font-semibold py-2 px-4 rounded-xl border border-[#cbd5e1] hover:border-[#496580] transition-all"
						>
							<SiOrcid className="w-6 h-6 mr-2 text-[#a6ce39]" />
							ORCID
						</button>

						<button
							type="button"
							className="flex items-center bg-white text-[#1a365d] font-semibold py-2 px-4 rounded-xl border border-[#cbd5e1] hover:border-[#496580] transition-all"
						>
							<FaGoogle className="w-6 h-6 mr-2 text-[#4285F4]" />
							Google
						</button>
					</div>

					<div className="flex justify-center mt-1">
						<button
							type="button"
							className="text-[#496580] font-semibold hover:text-[#3a5269] transition-all"
						>
							Login via Email
						</button>
					</div>
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

export default Login;
