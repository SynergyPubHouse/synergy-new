import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../App";
import { isEditor, getUserFullName } from "../utils/roleUtils";

const BASE_URL = "/journal/jics";

function Editors() {
	const { user } = useAuth();
	const userIsEditor = isEditor(user);
	const userFullName = getUserFullName(user);

	return (
		<div className="bg-[#f8fafc] text-[#1a365d] min-h-screen">
			{/* Hero Section */}
			<section className="relative flex flex-col items-center justify-center h-screen text-center px-6">
				<motion.h1
					initial={{ opacity: 0, y: -50 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 1 }}
					className="text-4xl md:text-6xl font-extrabold text-[#496580] font-serif tracking-wide drop-shadow-lg"
				>
					{userIsEditor
						? "Welcome Editor!"
						: "For Editors"}
				</motion.h1>

				<motion.p
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 1, delay: 0.5 }}
					className="mt-4 text-lg text-[#496580] max-w-2xl"
				>
					{userIsEditor
						? `Welcome back ${userFullName}! Manage your editorial tasks and collaborate with authors to ensure high-quality publications.`
						: "Join our editorial team and contribute to the advancement of research by ensuring the quality and integrity of publications."}
				</motion.p>

				{/* Call to Action Buttons */}
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 1, delay: 1 }}
					className="mt-10 flex gap-4"
				>
					{!user ? (
						<>
							<Link
								to={`${BASE_URL}/editor/register`}
								className="px-8 py-4 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold text-lg rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
							>
								Join as Editor
							</Link>
							<Link
								to="/login"
								className="px-8 py-4 bg-[#BAFFF5] hover:bg-[#a8e6dc] text-[#496580] font-semibold text-lg rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
							>
								Login as Editor
							</Link>
						</>
					) : !userIsEditor ? (
						<Link
							to={`${BASE_URL}/editor/register`}
							className="px-8 py-4 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold text-lg rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
						>
							Apply to Become an Editor
						</Link>
					) : null}
				</motion.div>
			</section>

			{/* Benefits Section */}
			{(!user || !userIsEditor) && (
				<motion.section
					initial={{ opacity: 0, y: 50 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 1 }}
					className="py-20 bg-white text-center"
				>
					<h2 className="text-3xl font-bold text-[#496580]">
						Why Become a Synergy World Press Editor?
					</h2>
					<p className="mt-4 text-lg text-[#496580] max-w-3xl mx-auto">
						As an editor, you will play a crucial role in
						maintaining the quality and integrity of academic
						research. Here are some benefits:
					</p>
					<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 px-6 md:px-20">
						<div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
							<h3 className="text-xl font-semibold text-[#496580]">
								Professional Growth
							</h3>
							<p className="mt-2 text-[#496580]">
								Enhance your expertise by working with
								cutting-edge research.
							</p>
						</div>
						<div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
							<h3 className="text-xl font-semibold text-[#496580]">
								Networking Opportunities
							</h3>
							<p className="mt-2 text-[#496580]">
								Connect with researchers and professionals
								worldwide.
							</p>
						</div>
						<div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
							<h3 className="text-xl font-semibold text-[#496580]">
								Recognition
							</h3>
							<p className="mt-2 text-[#496580]">
								Gain recognition for your contributions to the
								academic community.
							</p>
						</div>
					</div>
				</motion.section>
			)}

			{/* Editor Dashboard */}
			{userIsEditor && (
				<motion.section
					initial={{ opacity: 0, y: 50 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 1 }}
					className="py-20 bg-[#f8fafc] text-center"
				>
					<h2 className="text-3xl font-bold text-[#496580]">
						Editor Dashboard
					</h2>
					<p className="mt-4 text-lg text-[#496580]">
						Manage your editorial tasks and collaborate with
						authors.
					</p>
					<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 px-6 md:px-20">
						<div className="p-6 bg-white rounded-lg shadow-md">
							<h3 className="text-xl font-semibold text-[#496580]">
								Pending Requests
							</h3>
							<p className="mt-2 text-[#496580]">
								5 new requests awaiting your review.
							</p>
							<button className="mt-4 px-4 py-2 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold rounded-lg">
								View Requests
							</button>
						</div>
						<div className="p-6 bg-white rounded-lg shadow-md">
							<h3 className="text-xl font-semibold text-[#496580]">
								Assigned Papers
							</h3>
							<p className="mt-2 text-[#496580]">
								3 papers currently under your review.
							</p>
							<button className="mt-4 px-4 py-2 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold rounded-lg">
								View Papers
							</button>
						</div>
						<div className="p-6 bg-white rounded-lg shadow-md">
							<h3 className="text-xl font-semibold text-[#496580]">
								Completed Reviews
							</h3>
							<p className="mt-2 text-[#496580]">
								10 reviews completed this month.
							</p>
							<button className="mt-4 px-4 py-2 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold rounded-lg">
								View History
							</button>
						</div>
					</div>
				</motion.section>
			)}

			{/* Call to Action Section */}
			{(!user || !userIsEditor) && (
				<motion.section
					initial={{ opacity: 0, y: 50 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 1 }}
					className="py-20 bg-white text-center"
				>
					<h2 className="text-3xl font-bold text-[#496580]">
						Ready to Join Us?
					</h2>
					<p className="mt-4 text-lg text-[#496580]">
						Take the first step towards becoming a Synergy World
						Press Editor today.
					</p>
					<motion.div
						initial={{ opacity: 0, scale: 0.8 }}
						whileInView={{ opacity: 1, scale: 1 }}
						transition={{ duration: 1, delay: 0.5 }}
						className="mt-10"
					>
						<Link
							to={`${BASE_URL}/editor/register`}
							className="px-8 py-4 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold text-lg rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
						>
							Apply Now
						</Link>
					</motion.div>
				</motion.section>
			)}
		</div>
	);
}

export default Editors;
