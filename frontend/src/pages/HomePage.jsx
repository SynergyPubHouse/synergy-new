import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../App"; // Import the same useAuth hook used in Navbar

const BASE_URL = "/journal/jics";

function HomePage() {
	const { user } = useAuth(); // Get the user object from the authentication context

	return (
		<div className="bg-[#f8fafc] text-[#1a365d] min-h-screen">
			{/* Background Video */}
			{/* <video
				autoPlay
				loop
				muted
				className="absolute top-0 left-0 w-full h-full object-cover z-0"
			>
				<source
					src="https://cdn.pixabay.com/video/2017/12/05/13232-246463976_large.mp4"
					type="video/mp4"
				/>
			</video> */}

			{/* Hero Section */}
			<section className="relative flex flex-col items-center justify-center h-screen text-center px-6">
				<motion.h1
					initial={{ opacity: 0, y: -50 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 1 }}
					className="text-4xl md:text-7xl font-extrabold text-[#496580] font-serif tracking-wide drop-shadow-lg"
				>
					Synergy World Press
				</motion.h1>

				<motion.p
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 1, delay: 0.5 }}
					className="mt-4 text-lg text-[#496580] max-w-2xl"
				>
					The leading platform for seamless research paper submission,
					peer review, and academic exploration.
				</motion.p>
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 1, delay: 1 }}
					className="mt-20 flex gap-4"
				>
					<Link
						to={`${BASE_URL}/submit`}
						className="px-6 py-3 rounded-lg bg-[#496580] hover:bg-[#3a5269] text-white font-semibold shadow-md transition-all duration-300 transform hover:scale-105"
					>
						Submit Your Paper
					</Link>
					<Link
						to={`${BASE_URL}/browse`}
						className="px-6 py-3 rounded-lg bg-[#BAFFF5] hover:bg-[#a8e6dc] text-[#496580] font-semibold shadow-md transition-all duration-300 transform hover:scale-105"
					>
						Browse Papers
					</Link>
				</motion.div>
			</section>

			{/* Features Section */}
			{!user && (
				<motion.section
					initial={{ opacity: 0, y: 50 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 1 }}
					className="py-20 bg-white text-center"
				>
					<h2 className="text-3xl font-bold text-[#496580]">
						Why Choose Synergy World Press?
					</h2>
					<p className="mt-4 text-lg text-[#496580] max-w-3xl mx-auto">
						Our platform simplifies the research lifecycle with
						AI-powered tools for submission, peer review, and
						collaboration.
					</p>
					<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 px-6 md:px-20">
						<div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
							<h3 className="text-xl font-semibold text-[#496580]">
								Effortless Submission
							</h3>
							<p className="mt-2 text-[#496580]">
								Submit research papers seamlessly with our
								user-friendly interface.
							</p>
						</div>
						<div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
							<h3 className="text-xl font-semibold text-[#496580]">
								AI-Powered Review
							</h3>
							<p className="mt-2 text-[#496580]">
								Advanced algorithms assist in quality checks and
								peer review.
							</p>
						</div>
						<div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
							<h3 className="text-xl font-semibold text-[#496580]">
								Global Community
							</h3>
							<p className="mt-2 text-[#496580]">
								Collaborate with researchers and explore
								groundbreaking work.
							</p>
						</div>
					</div>
				</motion.section>
			)}

			{/* Call to Action - Conditionally Rendered */}
			{!user && (
				<motion.section
					initial={{ opacity: 0, y: 50 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 1 }}
					className="py-20 bg-[#f8fafc] text-center"
				>
					<h2 className="text-3xl font-bold text-[#496580]">
						Join Synergy World Press Today
					</h2>
					<p className="mt-4 text-lg text-[#496580]">
						Enhance your research journey with our powerful tools
						and global community.
					</p>
					<Link
						to={`${BASE_URL}/register`}
						className="mt-6 inline-block px-8 py-4 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold text-lg rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
					>
						Register Now
					</Link>
				</motion.section>
			)}

			{/* Additional Sections for Non-Logged-In Users */}
			{!user && (
				<>
					{/* Testimonials Section */}
					<motion.section
						initial={{ opacity: 0, y: 50 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 1 }}
						className="py-20 bg-white text-center"
					>
						<h2 className="text-3xl font-bold text-[#496580]">
							What Our Users Say
						</h2>
						<p className="mt-4 text-lg text-[#496580]">
							Hear from researchers and academics who have
							transformed their work with Synergy World Press.
						</p>
						<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 px-6 md:px-20">
							<div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
								<p className="text-[#496580] italic">
									"Synergy World Press has revolutionized the
									way I submit and review papers. The platform
									is intuitive and efficient!"
								</p>
								<p className="mt-4 font-semibold text-[#496580]">
									- Dr. Jane Doe, Researcher
								</p>
							</div>
							<div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
								<p className="text-[#496580] italic">
									"The AI-powered tools have saved me
									countless hours. Highly recommend this
									platform to all researchers."
								</p>
								<p className="mt-4 font-semibold text-[#496580]">
									- Prof. John Smith, Academic
								</p>
							</div>
							<div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
								<p className="text-[#496580] italic">
									"Collaborating with other researchers has
									never been easier. Synergy World Press is a
									game-changer!"
								</p>
								<p className="mt-4 font-semibold text-[#496580]">
									- Dr. Emily Brown, Scientist
								</p>
							</div>
						</div>
					</motion.section>

					{/* Statistics Section */}
					<motion.section
						initial={{ opacity: 0, y: 50 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 1 }}
						className="py-20 bg-[#f8fafc] text-center"
					>
						<h2 className="text-3xl font-bold text-[#496580]">
							By the Numbers
						</h2>
						<p className="mt-4 text-lg text-[#496580]">
							Our impact in numbers.
						</p>
						<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 px-6 md:px-20">
							<div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
								<h3 className="text-4xl font-bold text-[#496580]">
									10,000+
								</h3>
								<p className="mt-2 text-[#496580]">
									Research Papers Submitted
								</p>
							</div>
							<div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
								<h3 className="text-4xl font-bold text-[#496580]">
									5,000+
								</h3>
								<p className="mt-2 text-[#496580]">
									Active Researchers
								</p>
							</div>
							<div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
								<h3 className="text-4xl font-bold text-[#496580]">
									95%
								</h3>
								<p className="mt-2 text-[#496580]">
									Satisfaction Rate
								</p>
							</div>
						</div>
					</motion.section>

					{/* How It Works Section */}
					<motion.section
						initial={{ opacity: 0, y: 50 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 1 }}
						className="py-20 bg-white text-center"
					>
						<h2 className="text-3xl font-bold text-[#496580]">
							How It Works
						</h2>
						<p className="mt-4 text-lg text-[#496580]">
							A step-by-step guide to getting started with Synergy
							World Press.
						</p>
						<div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-8 px-6 md:px-20">
							<div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
								<h3 className="text-xl font-semibold text-[#496580]">
									1. Register
								</h3>
								<p className="mt-2 text-[#496580]">
									Create an account to access all features.
								</p>
							</div>
							<div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
								<h3 className="text-xl font-semibold text-[#496580]">
									2. Submit
								</h3>
								<p className="mt-2 text-[#496580]">
									Upload your research paper with ease.
								</p>
							</div>
							<div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
								<h3 className="text-xl font-semibold text-[#496580]">
									3. Review
								</h3>
								<p className="mt-2 text-[#496580]">
									Get feedback from experts in your field.
								</p>
							</div>
							<div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
								<h3 className="text-xl font-semibold text-[#496580]">
									4. Publish
								</h3>
								<p className="mt-2 text-[#496580]">
									Share your work with the global community.
								</p>
							</div>
						</div>
					</motion.section>

					{/* Final Call to Action */}
					<motion.section
						initial={{ opacity: 0, y: 50 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 1 }}
						className="py-20 bg-[#f8fafc] text-center"
					>
						<h2 className="text-3xl font-bold text-[#496580]">
							Ready to Transform Your Research?
						</h2>
						<p className="mt-4 text-lg text-[#496580]">
							Join thousands of researchers who trust Synergy
							World Press for their academic needs.
						</p>
						<Link
							to={`${BASE_URL}/register`}
							className="mt-6 inline-block px-8 py-4 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold text-lg rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
						>
							Get Started Now
						</Link>
					</motion.section>
				</>
			)}

			{/* Additional Sections for Logged-In Users */}
			{user && (
				<>
					{/* User Dashboard Section */}
					<motion.section
						initial={{ opacity: 0, y: 50 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 1 }}
						className="py-20 bg-white text-center"
					>
						<h2 className="text-3xl font-bold text-[#496580]">
							Welcome Back, {user.name}!
						</h2>
						<p className="mt-4 text-lg text-[#496580]">
							Access your personalized dashboard to manage your
							submissions, reviews, and collaborations.
						</p>
						<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 px-6 md:px-20">
							<div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
								<h3 className="text-xl font-semibold text-[#496580]">
									My Submissions
								</h3>
								<p className="mt-2 text-[#496580]">
									View and manage your submitted papers.
								</p>
								<Link
									to={`${BASE_URL}/my-submissions`}
									className="mt-4 inline-block px-6 py-2 bg-[#496580] hover:bg-[#3a5269] text-gray-100 font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
								>
									View Submissions
								</Link>
							</div>
							<div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
								<h3 className="text-xl font-semibold text-[#496580]">
									My Reviews
								</h3>
								<p className="mt-2 text-[#496580]">
									Review papers assigned to you.
								</p>
								<Link
									to={`${BASE_URL}/my-reviews`}
									className="mt-4 inline-block px-6 py-2 bg-[#496580] hover:bg-[#3a5269] text-gray-100 font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
								>
									View Reviews
								</Link>
							</div>
							<div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
								<h3 className="text-xl font-semibold text-[#496580]">
									Incomplete Submissions
								</h3>
								<p className="mt-2 text-[#496580]">
									All your submissions that are incomplete.
								</p>
								<Link
									to={`${BASE_URL}/incomplete-submissions`}
									className="mt-4 inline-block px-6 py-2 bg-[#496580] hover:bg-[#3a5269] text-gray-100 font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
								>
									View Submissions
								</Link>
							</div>
						</div>
					</motion.section>

					{/* Below part was for editor Profile but now its not be included as said by meeny maam as they only will be the editors */}

					{/* Recent Activity Section
					<motion.section
						initial={{ opacity: 0, y: 50 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 1 }}
						className="py-20 bg-[#f8fafc] text-center"
					>
						<h2 className="text-3xl font-bold text-[#496580]">
							Welcome Back, {user.name}!
						</h2>
						<p className="mt-4 text-lg text-[#496580]">
							Access your personalized dashboard to manage your
							submissions, reviews, and collaborations.
						</p>
						<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 px-6 md:px-20">
							<div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
								<h3 className="text-xl font-semibold text-[#496580]">
									Submission sent back to Author
								</h3>
								<p className="mt-2 text-[#496580]">
									View and manage your submitted papers.
								</p>
								<Link
									to="/rejected-submissions"
									className="mt-4 inline-block px-6 py-2 bg-[#496580] hover:bg-[#3a5269] text-gray-100 font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
								>
									View Submissions
								</Link>
							</div>
							<div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
								<h3 className="text-xl font-semibold text-[#496580]">
									Submission waiting for Editor's approval
								</h3>
								<p className="mt-2 text-[#496580]">
									Submission is yet to be approved by the
									Editor.
								</p>
								<Link
									to="/editor-approval-pending-submissions"
									className="mt-4 inline-block px-6 py-2 bg-[#496580] hover:bg-[#3a5269] text-gray-100 font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
								>
									View Submissions
								</Link>
							</div>
							<div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
								<h3 className="text-xl font-semibold text-[#496580]">
									Submission being processed
								</h3>
								<p className="mt-2 text-[#496580]">
									Submission sent to reviewers by the Editor.
								</p>
								<Link
									to="/reviewer-processing-submissions"
									className="mt-4 inline-block px-6 py-2 bg-[#496580] hover:bg-[#3a5269] text-gray-100 font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
								>
									View Submissions
								</Link>
							</div>
						</div>
					</motion.section> */}

					{/* Recommended Papers Section */}
					<motion.section
						initial={{ opacity: 0, y: 50 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 1 }}
						className="py-20 bg-white text-center"
					>
						<h2 className="text-3xl font-bold text-[#496580]">
							Recommended Papers
						</h2>
						<p className="mt-4 text-lg text-[#496580]">
							Discover papers tailored to your research interests.
						</p>
						<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 px-6 md:px-20">
							<div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
								<h3 className="text-xl font-semibold text-[#496580]">
									Paper Title 1
								</h3>
								<p className="mt-2 text-[#496580]">
									A brief description of the paper and its
									relevance to your research.
								</p>
								<Link
									to="/paper-details/1"
									className="mt-4 inline-block px-6 py-2 bg-[#496580] hover:bg-[#3a5269] text-gray-100 font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
								>
									Read More
								</Link>
							</div>
							<div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
								<h3 className="text-xl font-semibold text-[#496580]">
									Paper Title 2
								</h3>
								<p className="mt-2 text-[#496580]">
									A brief description of the paper and its
									relevance to your research.
								</p>
								<Link
									to="/paper-details/2"
									className="mt-4 inline-block px-6 py-2 bg-[#496580] hover:bg-[#3a5269] text-gray-100 font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
								>
									Read More
								</Link>
							</div>
							<div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
								<h3 className="text-xl font-semibold text-[#496580]">
									Paper Title 3
								</h3>
								<p className="mt-2 text-[#496580]">
									A brief description of the paper and its
									relevance to your research.
								</p>
								<Link
									to="/paper-details/3"
									className="mt-4 inline-block px-6 py-2 bg-[#496580] hover:bg-[#3a5269] text-gray-100 font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
								>
									Read More
								</Link>
							</div>
						</div>
					</motion.section>
				</>
			)}
		</div>
	);
}

export default HomePage;
