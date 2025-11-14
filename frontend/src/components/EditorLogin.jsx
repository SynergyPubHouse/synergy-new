import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";

const BASE_URL = "/journal/jics";

function EditorLogin() {
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const navigate = useNavigate();
	const { login } = useAuth();

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		try {
			const response = await axios.post(
				`${import.meta.env.VITE_BACKEND_URL}/api/auth/editor/login`,
				{
					email: formData.email,
					password: formData.password,
				}
			);

			if (response.data) {
				const userData = {
					token: response.data.token,
					editor: {
						...response.data.editor,
						role: "editor",
					},
				};

				localStorage.setItem("user", JSON.stringify(userData));
				login(userData);
				alert("Editor Login Successful");
				navigate(`${BASE_URL}/editor/dashboard`);
			} else {
				alert("Login Failed: Editor data missing");
			}
		} catch (error) {
			alert(error.response?.data?.message || "Login Failed");
		}
	};

	return (
		<div className="flex items-center justify-center min-h-screen bg-[#f8fafc] p-6">
			<form
				className="bg-white p-10 rounded-xl shadow-md w-full max-w-md border border-[#e2e8f0]"
				onSubmit={handleSubmit}
			>
				<h2 className="text-4xl font-extrabold text-[#496580] mb-6 text-center">
					Editor Sign In
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
							className="w-full px-4 py-3 rounded-lg bg-[#f8fafc] text-[#1a365d] border border-[#e2e8f0] focus:border-[#496580] focus:ring-2 focus:ring-[#496580]/30 outline-none transition-all duration-300"
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
							className="w-full px-4 py-3 rounded-lg bg-[#f8fafc] text-[#1a365d] border border-[#e2e8f0] focus:border-[#496580] focus:ring-2 focus:ring-[#496580]/30 outline-none transition-all duration-300"
						/>
					</div>

					<button
						type="submit"
						className="w-full bg-[#496580] hover:bg-[#3a5269] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow hover:shadow-md"
					>
						Login as Editor
					</button>
				</div>

				<div className="mt-6 text-center">
					<p className="text-[#496580] text-sm">
						&copy; 2025 Synergyworldress. All rights reserved.
					</p>
				</div>
			</form>
		</div>
	);
}

export default EditorLogin;
