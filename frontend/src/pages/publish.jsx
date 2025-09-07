import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const BASE = "/journal/jics";

function Publish() {
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
					Publish With Us
				</motion.h1>

				<motion.p
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 1, delay: 0.5 }}
					className="mt-4 text-lg text-[#496580] max-w-2xl"
				>
					Join a global community of researchers and share your
					groundbreaking work with the world. Our platform ensures a
					seamless publishing experience with rigorous peer review and
					AI-powered tools.
				</motion.p>

				{/* Highlighted Submit Button */}
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 1, delay: 1 }}
					className="mt-10"
				>
					<Link
						to="/submit"
						className="px-8 py-4 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold text-lg rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
					>
						Submit Your Research
					</Link>
				</motion.div>
			</section>

			{/* Why Publish With Us Section */}
			<motion.section
				initial={{ opacity: 0, y: 50 }}
				whileInView={{ opacity: 1, y: 0 }}
				transition={{ duration: 1 }}
				className="py-20 bg-white text-center"
			>
				<h2 className="text-3xl font-bold text-[#496580]">
					Why Publish With Us?
				</h2>
				<p className="mt-4 text-lg text-[#496580] max-w-3xl mx-auto">
					We provide a platform that values quality, transparency, and
					innovation. Here's why researchers choose us:
				</p>
				<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 px-6 md:px-20">
					<div className="p-6 bg-[#f8fafc] rounded-lg shadow-md border border-[#e2e8f0]">
						<h3 className="text-xl font-semibold text-[#496580]">
							Rigorous Peer Review
						</h3>
						<p className="mt-2 text-[#496580]">
							Our expert reviewers ensure the highest standards of
							academic integrity.
						</p>
					</div>
					<div className="p-6 bg-[#f8fafc] rounded-lg shadow-md border border-[#e2e8f0]">
						<h3 className="text-xl font-semibold text-[#496580]">
							Global Reach
						</h3>
						<p className="mt-2 text-[#496580]">
							Your work will be accessible to researchers and
							institutions worldwide.
						</p>
					</div>
					<div className="p-6 bg-[#f8fafc] rounded-lg shadow-md border border-[#e2e8f0]">
						<h3 className="text-xl font-semibold text-[#496580]">
							AI-Powered Tools
						</h3>
						<p className="mt-2 text-[#496580]">
							Our advanced tools streamline the submission and
							review process.
						</p>
					</div>
				</div>
			</motion.section>

			{/* Call to Action Section */}
			<motion.section
				initial={{ opacity: 0, y: 50 }}
				whileInView={{ opacity: 1, y: 0 }}
				transition={{ duration: 1 }}
				className="py-20 bg-[#f8fafc] text-center"
			>
				<h2 className="text-3xl font-bold text-[#496580]">
					Ready to Publish?
				</h2>
				<p className="mt-4 text-lg text-[#496580]">
					Join thousands of researchers who trust us to share their
					work with the world.
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
						Submit Your Article
					</Link>
				</motion.div>
			</motion.section>

			{/* Testimonials Section */}
			<motion.section
				initial={{ opacity: 0, y: 50 }}
				whileInView={{ opacity: 1, y: 0 }}
				transition={{ duration: 1 }}
				className="py-20 bg-white text-center"
			>
				<h2 className="text-3xl font-bold text-[#496580]">
					What Researchers Say
				</h2>
				<p className="mt-4 text-lg text-[#496580] max-w-3xl mx-auto">
					Hear from researchers who have successfully published their
					work with us.
				</p>
				<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 px-6 md:px-20">
					<div className="p-6 bg-[#f8fafc] rounded-lg shadow-md border border-[#e2e8f0]">
						<p className="text-[#496580] italic">
							"The submission process was seamless, and the
							feedback from reviewers was incredibly helpful."
						</p>
						<p className="mt-4 font-semibold text-[#496580]">
							- Dr. Sarah Johnson
						</p>
					</div>
					<div className="p-6 bg-[#f8fafc] rounded-lg shadow-md border border-[#e2e8f0]">
						<p className="text-[#496580] italic">
							"Publishing with this platform has significantly
							increased the visibility of my research."
						</p>
						<p className="mt-4 font-semibold text-[#496580]">
							- Prof. Michael Lee
						</p>
					</div>
					<div className="p-6 bg-[#f8fafc] rounded-lg shadow-md border border-[#e2e8f0]">
						<p className="text-[#496580] italic">
							"The AI-powered tools saved me a lot of time during
							the submission process."
						</p>
						<p className="mt-4 font-semibold text-[#496580]">
							- Dr. Emily Carter
						</p>
					</div>
				</div>
			</motion.section>
		</div>
	);
}

export default Publish;
