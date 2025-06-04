import React from "react";
import Header from "../components/Header";
import Navigation from "../components/Navigation";

const LandingPage = () => (
	<div className="min-h-screen bg-gray-50 font-sans">
		<Header />
		<Navigation />

		{/* About Us Card */}
		<section className="bg-white max-w-3xl mx-auto my-8 rounded-xl shadow-lg p-8">
			<h2 className="text-2xl font-bold text-indigo-900 mb-4">
				About Us
			</h2>
			<div className="space-y-4">
				<p className="text-gray-700">
					Synergy World Press is a dynamic and forward-thinking
					publishing house committed to advancing knowledge across
					disciplines, with a strong emphasis on computer science,
					engineering, and interdisciplinary research. Our mission is
					to empower researchers, academics, and professionals by
					offering a global platform for high-quality scholarly
					publications, including books, conference proceedings,
					edited volumes, and academic journals. With a focus on
					innovation, academic integrity, and global collaboration,
					Synergy World Press supports both emerging and established
					scholars through comprehensive, end-to-end publishing
					solutions—from concept development to international
					dissemination. We actively promote impactful research that
					bridges the gap between academia and industry, catalyzing
					technological innovation and societal advancement.
					<br />
					<br />
					As part of our academic publishing ecosystem, Synergy World
					Press proudly publishes the Journal of Intelligent Computing
					System (JICS)—a peer-reviewed, open-access international
					journal dedicated to intelligent computing research and its
					real-world applications. Importantly, JICS does not charge
					any Article Processing Charges (APCs), ensuring that all
					authors can publish without facing financial barriers.
					<br />
					<br />
					Whether you are an author, editor, or conference organizer,
					Synergy World Press is your trusted partner in scholarly
					publishing, ensuring global visibility, rigorous quality
					standards, and lasting academic impact—all while maintaining
					a no-APC policy that supports inclusive and accessible
					academic dissemination.
				</p>
			</div>
		</section>
	</div>
);

export default LandingPage;
