import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../App"; // Assuming you have an Auth context

const BASE = "/journal/jics";

function TrackResearch() {
	const { user } = useAuth(); // Fetch user details from Auth context

	// Mock data for submitted papers (replace with actual data from your backend)
	const submittedPapers = user
		? [
				{
					id: 1,
					title: "Advancements in Quantum Computing",
					status: "Under Review",
					submittedDate: "2023-10-01",
				},
				{
					id: 2,
					title: "Machine Learning for Climate Prediction",
					status: "Accepted",
					submittedDate: "2023-09-15",
				},
		  ]
		: [];

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
					Track Your Research
				</motion.h1>

				<motion.p
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 1, delay: 0.5 }}
					className="mt-4 text-lg text-[#496580] max-w-2xl"
				>
					{user
						? "Monitor the status of your submitted research papers and stay updated on the review process."
						: "Log in or register to submit and track your research papers with ease."}
				</motion.p>

				{/* Call to Action Buttons */}
				{!user && (
					<motion.div
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 1, delay: 1 }}
						className="mt-10 flex gap-4"
					>
						<Link
							to="/register"
							className="px-8 py-4 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold text-lg rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
						>
							Register
						</Link>
						<Link
							to="/login"
							state={{ from: location.pathname }}
							className="px-8 py-4 bg-white hover:bg-gray-100 text-[#496580] font-semibold text-lg rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
						>
							Login
						</Link>
					</motion.div>
				)}
			</section>

			{/* Research Tracking Section */}
			{user && (
				<motion.section
					initial={{ opacity: 0, y: 50 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 1 }}
					className="py-20 bg-white text-center"
				>
					<h2 className="text-3xl font-bold text-[#496580]">
						Your Submitted Papers
					</h2>
					<p className="mt-4 text-lg text-[#496580] max-w-3xl mx-auto">
						Here is the status of your submitted research papers.
						Click on a paper to view more details.
					</p>
					<div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-6 md:px-20">
						{submittedPapers.length > 0 ? (
							submittedPapers.map((paper) => (
								<motion.div
									key={paper.id}
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.5 }}
									className="p-6 bg-[#f8fafc] rounded-lg shadow-md text-left"
								>
									<h3 className="text-xl font-semibold text-[#496580]">
										{paper.title}
									</h3>
									<p className="mt-2 text-[#496580]">
										<span className="font-semibold">
											Status:
										</span>{" "}
										{paper.status}
									</p>
									<p className="mt-2 text-[#496580]">
										<span className="font-semibold">
											Submitted On:
										</span>{" "}
										{paper.submittedDate}
									</p>
									<button className="mt-4 px-4 py-2 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold rounded-lg">
										View Details
									</button>
								</motion.div>
							))
						) : (
							<p className="text-[#496580] col-span-full">
								You have not submitted any papers yet.
							</p>
						)}
					</div>
				</motion.section>
			)}

			{/* Call to Action Section */}
			{user && (
				<motion.section
					initial={{ opacity: 0, y: 50 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 1 }}
					className="py-20 bg-white text-center"
				>
					<h2 className="text-3xl font-bold text-[#496580]">
						Submit New Research
					</h2>
					<p className="mt-4 text-lg text-[#496580]">
						Ready to share your latest findings? Submit your
						research paper today.
					</p>
					<motion.div
						initial={{ opacity: 0, scale: 0.8 }}
						whileInView={{ opacity: 1, scale: 1 }}
						transition={{ duration: 1, delay: 0.5 }}
						className="mt-10"
					>
						<Link
							to="/submit"
							className="px-8 py-4 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold text-lg rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
						>
							Submit Your Paper
						</Link>
					</motion.div>
				</motion.section>
			)}
		</div>
	);
}

export default TrackResearch;
