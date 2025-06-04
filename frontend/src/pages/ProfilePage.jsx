import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { FaUserCircle } from "react-icons/fa";

function ProfilePage() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();

	const handleLogout = () => {
		if (window.confirm("Are you sure you want to log out?")) {
			logout();
			navigate("/");
		}
	};

	return (
		<div className="min-h-screen flex flex-col bg-[#f8fafc]">
			<header className="bg-white shadow p-4">
				<div className="max-w-7xl mx-auto flex justify-between items-center">
					<h2 className="font-semibold text-xl text-[#1a365d]">
						Profile
					</h2>
					<div className="flex items-center space-x-4">
						<div className="flex items-center space-x-2">
							{user?.profilePic ? (
								<img
									src={user.profilePic}
									alt="Profile"
									className="w-8 h-8 rounded-full object-cover border border-[#496580]"
								/>
							) : (
								<FaUserCircle className="text-[#496580] w-8 h-8" />
							)}
							<p className="text-sm font-medium text-[#1a365d]">
								{user?.username}
							</p>
						</div>
						<Link
							to="/"
							onClick={handleLogout}
							className="bg-[#496580] hover:bg-[#3a5269] text-white font-bold py-2 px-4 rounded transition-colors duration-300"
						>
							Logout
						</Link>
					</div>
				</div>
			</header>
			<main className="flex-grow flex flex-col items-center justify-center p-6">
				<div className="bg-white shadow-md rounded-md p-8 text-center">
					<Link
						to="/submit"
						className="block bg-[#496580] hover:bg-[#3a5269] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300"
					>
						Submit Manuscript
					</Link>
				</div>
			</main>
		</div>
	);
}

export default ProfilePage;
