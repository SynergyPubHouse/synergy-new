import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../App";
import { isReviewer, getUserFullName } from "../utils/roleUtils";

const BASE_URL = "/journal/jics";

function Reviewers() {
	const { user } = useAuth();
	const userIsReviewer = isReviewer(user);
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
					{userIsReviewer
						? "Welcome Reviewer!"
						: "For Reviewers"}
				</motion.h1>

				<motion.p
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 1, delay: 0.5 }}
					className="mt-4 text-lg text-[#496580] max-w-2xl"
				>
					{userIsReviewer
						? `Welcome back ${userFullName}! Manage your review tasks and contribute to ensuring high-quality publications.`
						: "Join our reviewer team and contribute to the advancement of research by providing valuable feedback on manuscripts."}
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
								to={`${BASE_URL}/reviewer/register`}
								className="px-8 py-4 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold text-lg rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
							>
								Join as Reviewer
							</Link>
							<Link
								to="/login"
								className="px-8 py-4 bg-white hover:bg-gray-100 text-[#496580] font-semibold text-lg rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
							>
								Login as Reviewer
							</Link>
						</>
					) : !userIsReviewer ? (
						<Link
							to={`${BASE_URL}/reviewer/register`}
							className="px-8 py-4 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold text-lg rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
						>
							Apply to Become a Reviewer
						</Link>
					) : null}
				</motion.div>
			</section>

			{/* Benefits Section */}
			{(!user || !userIsReviewer) && (
				<motion.section
					initial={{ opacity: 0, y: 50 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 1 }}
					className="py-20 bg-white text-center"
				>
					<h2 className="text-3xl font-bold text-[#496580]">
						Why Become a Synergy World Press Reviewer?
					</h2>
					<p className="mt-4 text-lg text-[#496580] max-w-3xl mx-auto">
						As a reviewer, you will play a crucial role in
						maintaining the quality and integrity of academic
						research. Here are some benefits:
					</p>
					<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 px-6 md:px-20">
						<div className="p-6 bg-[#f8fafc] rounded-lg shadow-md">
							<h3 className="text-xl font-semibold text-[#496580]">
								Professional Growth
							</h3>
							<p className="mt-2 text-[#496580]">
								Enhance your expertise by reviewing cutting-edge
								research.
							</p>
						</div>
						<div className="p-6 bg-[#f8fafc] rounded-lg shadow-md">
							<h3 className="text-xl font-semibold text-[#496580]">
								Networking Opportunities
							</h3>
							<p className="mt-2 text-[#496580]">
								Connect with researchers and professionals
								worldwide.
							</p>
						</div>
						<div className="p-6 bg-[#f8fafc] rounded-lg shadow-md">
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

			{/* Reviewer Dashboard */}
			{userIsReviewer && (
				<motion.section
					initial={{ opacity: 0, y: 50 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 1 }}
					className="py-20 bg-white text-center"
				>
					<h2 className="text-3xl font-bold text-[#496580]">
						Reviewer Dashboard
					</h2>
					<p className="mt-4 text-lg text-[#496580]">
						Manage your review tasks and contribute to the peer
						review process.
					</p>
					<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 px-6 md:px-20">
						<div className="p-6 bg-[#f8fafc] rounded-lg shadow-md">
							<h3 className="text-xl font-semibold text-[#496580]">
								Pending Reviews
							</h3>
							<p className="mt-2 text-[#496580]">
								3 manuscripts awaiting your review.
							</p>
							<button className="mt-4 px-4 py-2 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold rounded-lg">
								View Manuscripts
							</button>
						</div>
						<div className="p-6 bg-[#f8fafc] rounded-lg shadow-md">
							<h3 className="text-xl font-semibold text-[#496580]">
								Completed Reviews
							</h3>
							<p className="mt-2 text-[#496580]">
								5 reviews completed this month.
							</p>
							<button className="mt-4 px-4 py-2 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold rounded-lg">
								View History
							</button>
						</div>
						<div className="p-6 bg-[#f8fafc] rounded-lg shadow-md">
							<h3 className="text-xl font-semibold text-[#496580]">
								Reviewer Stats
							</h3>
							<p className="mt-2 text-[#496580]">
								Your average review time: 7 days
							</p>
							<button className="mt-4 px-4 py-2 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold rounded-lg">
								View Stats
							</button>
						</div>
					</div>
				</motion.section>
			)}

			{/* Call to Action Section */}
			{(!user || !userIsReviewer) && (
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
						Press Reviewer today.
					</p>
					<motion.div
						initial={{ opacity: 0, scale: 0.8 }}
						whileInView={{ opacity: 1, scale: 1 }}
						transition={{ duration: 1, delay: 0.5 }}
						className="mt-10"
					>
						<Link
							to={`${BASE_URL}/reviewer/register`}
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

export default Reviewers;
