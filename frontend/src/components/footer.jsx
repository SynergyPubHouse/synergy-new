import { FaTwitter, FaLinkedin, FaGithub, FaEnvelope } from "react-icons/fa";
import { Link } from "react-router-dom";

const BASE = "/journal/Journal-of-Intelligent-Computing-Systems";

function Footer() {
	return (
		<footer className="bg-[#1f3247] text-white py-12">
			<div className="container mx-auto px-6 md:px-20">
				{/* Footer Grid */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
					{/* About Section */}
					<div>
						<h3 className="text-xl font-bold text-[#BAFFF5] mb-4">
							About Synergy World Press
						</h3>
						<p className="text-[#BADDFF]">
							Synergy World Press is a platform for researchers to
							publish, share, and collaborate on groundbreaking
							research.
						</p>
					</div>

					{/* Quick Links Section */}
					<div>
						<h3 className="text-xl font-bold text-[#BAFFF5] mb-4">
							Quick Links
						</h3>
						<ul className="space-y-2">
							<li>
								<Link
									to={`${BASE}/publish`}
									className="text-[#BADDFF] hover:text-[#BAFFF5] transition-colors"
								>
									Publish With Us
								</Link>
							</li>
							<li>
								<Link
									to={`${BASE}/editors`}
									className="text-[#BADDFF] hover:text-[#BAFFF5] transition-colors"
								>
									For Editors
								</Link>
							</li>
							<li>
								<Link
									to={`${BASE}/reviewers`}
									className="text-[#BADDFF] hover:text-[#BAFFF5] transition-colors"
								>
									For Reviewers
								</Link>
							</li>
							<li>
								<Link
									to={`${BASE}/track`}
									className="text-[#BADDFF] hover:text-[#BAFFF5] transition-colors"
								>
									Track Your Research
								</Link>
							</li>
							<li>
								<Link
									to={`${BASE}/contactus`}
									className="text-[#BADDFF] hover:text-[#BAFFF5] transition-colors"
								>
									Contact Us
								</Link>
							</li>
							<li>
								<Link
									to={`${BASE}/about`}
									className="text-[#BADDFF] hover:text-[#BAFFF5] transition-colors"
								>
									About Us
								</Link>
							</li>
						</ul>
					</div>

					{/* Legal Section */}
					<div>
						<h3 className="text-xl font-bold text-[#BAFFF5] mb-4">
							Legal
						</h3>
						<ul className="space-y-2">
							<li>
								<Link
									to={`${BASE}/termsofservice`}
									className="text-[#BADDFF] hover:text-[#BAFFF5] transition-colors"
								>
									Terms of Service
								</Link>
							</li>
							<li>
								<Link
									to={`${BASE}/privacy`}
									className="text-[#BADDFF] hover:text-[#BAFFF5] transition-colors"
								>
									Privacy Policy
								</Link>
							</li>
							<li>
								<a
									href="https://www.example.com/cookies"
									target="_blank"
									rel="noopener noreferrer"
									className="text-[#BADDFF] hover:text-[#BAFFF5] transition-colors"
								>
									Cookie Policy(to be addded)
								</a>
							</li>
						</ul>
					</div>

					{/* Social Media Section */}
					<div>
						<h3 className="text-xl font-bold text-[#BAFFF5] mb-4">
							Follow Us
						</h3>
						<div className="flex space-x-4">
							<a
								href="https://twitter.com/papersphere"
								target="_blank"
								rel="noopener noreferrer"
								className="text-[#BADDFF] hover:text-[#BAFFF5] transition-colors"
							>
								<FaTwitter className="w-6 h-6" />
							</a>
							<a
								href="https://linkedin.com/company/papersphere"
								target="_blank"
								rel="noopener noreferrer"
								className="text-[#BADDFF] hover:text-[#BAFFF5] transition-colors"
							>
								<FaLinkedin className="w-6 h-6" />
							</a>
							<a
								href="https://github.com/papersphere"
								target="_blank"
								rel="noopener noreferrer"
								className="text-[#BADDFF] hover:text-[#BAFFF5] transition-colors"
							>
								<FaGithub className="w-6 h-6" />
							</a>
							<a
								href="mailto:support@papersphere.com"
								className="text-[#BADDFF] hover:text-[#BAFFF5] transition-colors"
							>
								<FaEnvelope className="w-6 h-6" />
							</a>
						</div>
					</div>
				</div>

				{/* Divider */}
				<hr className="border-[#496580] my-8" />

				{/* Copyright Section */}
				<div className="text-center text-[#BADDFF]">
					<p>
						&copy; {new Date().getFullYear()} Synergy World Press.
						All rights reserved.
					</p>
					<p className="mt-2">
						Designed with ❤️ by the
						<Link
							to={`${BASE}/teamDev`}
							className="ml-2 text-[#BAFFF5] hover:text-[#a8e6dc] transition-colors"
						>
							Synergy World Press Team
						</Link>
					</p>
				</div>
			</div>
		</footer>
	);
}

export default Footer;
