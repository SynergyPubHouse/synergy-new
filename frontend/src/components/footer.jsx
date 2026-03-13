import { FaTwitter, FaLinkedin, FaGithub, FaEnvelope } from "react-icons/fa";
import { Link } from "react-router-dom";

const BASE_URL = "";

function Footer() {
  return (
    <footer className="bg-[#00796b] text-[#e0e0e0] py-12 mt-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">
              About Synergy World Press
            </h3>
            <p className="leading-relaxed">
              Advancing interdisciplinary research through accessible publishing solutions.
              Committed to innovation, integrity, and global collaboration.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { name: "JICS", path: "/journal/jics" },
                { name: "About Us", path: "/about" },
                { name: "Developers", path: "/team" },
                // { name: "Publish With Us", path: "/publish" },
                // { name: "For Editors", path: "/editors" },
                // { name: "For Reviewers", path: "/reviewers" },
                // { name: "Track Research", path: "/track" },
                { name: "Contact Us", path: "/contactus" },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={`${BASE_URL}${link.path}`}
                    className="hover:text-[#00acc1] transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              {[
                { name: "Terms of Service", path: "/termsofservice" },
                { name: "Privacy Policy", path: "/privacy" },
                // { name: "Cookie Policy", path: "/cookies" },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={`${BASE_URL}${link.path}`}
                    className="hover:text-[#00acc1] transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social & Contact */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Connect</h3>
            <div className="flex gap-4 mb-4">
              {[
                { icon: <FaTwitter />, link: "https://twitter.com" },
                { icon: <FaLinkedin />, link: "https://linkedin.com" },
                { icon: <FaGithub />, link: "https://github.com" },
                { icon: <FaEnvelope />, link: "mailto:contact@synergyworldpress.com" },
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-2xl hover:text-[#00acc1] transition-colors"
                >
                  {social.icon}
                </a>
              ))}
            </div>
            <p className="mt-4">
              Need help? <br />
              <a href="mailto:support@synergyworldpress.com" className="text-[#00acc1] hover:text-[#0097a7]">
                support@synergyworldpress.com, synergyworldpress@gmail.com
              </a>
            </p>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-[#005f56] my-8" />

        {/* Copyright */}
        <div className="text-center text-sm">
          <p>
            © {new Date().getFullYear()} Synergy World Press. All rights reserved.<br />
            {/* ISSN: 1234-5678 | DOI Prefix: 10.12345 */}
          </p>
          <p className="mt-2">
            Designed by the{" "}
            <Link
              to={`/team`}
              className="text-[#00acc1] hover:text-[#0097a7]"
            >
              Synergy Team
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
