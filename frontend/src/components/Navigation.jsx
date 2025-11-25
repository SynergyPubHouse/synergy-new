import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";

const Navigation = () => {
  const { user } = useAuth();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownTimeout, setDropdownTimeout] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [isSmall, setIsSmall] = useState(false);
  const [clickedAuthorLogin, setClickedAuthorLogin] = useState(false);
  const navRef = useRef(null);
  const navigate = useNavigate();

  const peerReviewItems = [
    { name: "Initial Editorial Screening", path: "/peer-review/initial-editorial-screening" },
    { name: "Double-Blind Peer Review", path: "/peer-review/double-blind-peer-review" },
    { name: "Feedback and Revisions", path: "/peer-review/feedback-and-revisions" },
    { name: "Final Evaluation and Acceptance", path: "/peer-review/final-evaluation-and-acceptance" },
    { name: "Publication Integrity and Timeline", path: "/peer-review/publication-integrity-and-timeline" },
  ];

  const journalsItems = [
    { name: "Journal of Intelligent Computing System (JICS)", path: "/journal/jics" },
  ];

  // Scroll detection for sticky behavior
  useEffect(() => {
    const handleScroll = () => {
      if (!navRef.current) return;
      const header = document.querySelector('header');
      const headerBottom = header?.offsetTop + header?.offsetHeight || 0;
      if (window.scrollY > headerBottom) {
        setIsSticky(true);
        setIsSmall(true);
      } else {
        setIsSticky(false);
        setIsSmall(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMouseEnter = (dropdownName) => {
    clearTimeout(dropdownTimeout);
    setActiveDropdown(dropdownName);
    setClickedAuthorLogin(false); // Reset on any menu interaction
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setActiveDropdown(null);
    }, 200);
    setDropdownTimeout(timeout);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setClickedAuthorLogin(false); // Reset on menu toggle
  };

  const handleAuthorLoginClick = (e) => {
    if (user) {
      e.preventDefault();
      setClickedAuthorLogin(true);
      setTimeout(() => setClickedAuthorLogin(false), 3000);
    } else {
      navigate("/login", {
        state: { from: location.pathname },
      });
    }
  };

  return (
    <nav
      ref={navRef}
      className={`bg-[#f9f9f9] shadow-sm z-40 transition-all duration-300 ${isSticky
        ? "fixed left-0 right-0 top-[75px] border-b border-[#e0e0e0]"
        : "relative"
        } ${isSmall ? "h-12" : "h-16"}`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className={`flex justify-between items-center h-full transition-all duration-300 ${isSmall ? "py-1" : "py-2"
          }`}>
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-[#212121] hover:text-[#00796b] hover:bg-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#00acc1]"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${isMobileMenuOpen ? "hidden" : "block"} ${isSmall ? "h-5 w-5" : "h-6 w-6"}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isMobileMenuOpen ? "block" : "hidden"} ${isSmall ? "h-5 w-5" : "h-6 w-6"}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center w-full space-x-8">
            <Link
              to="/"
              className={`inline-flex items-center px-3 py-2 text-[#212121] hover:text-[#00796b] font-medium transition-colors duration-200 ${isSmall ? "text-sm" : "text-base"
                }`}
            >
              About Us
            </Link>

            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("peerReview")}
              onMouseLeave={handleMouseLeave}
            >
              <button className={`inline-flex items-center px-3 py-2 text-[#212121] hover:text-[#00796b] font-medium transition-colors duration-200 ${isSmall ? "text-sm" : "text-base"
                }`}>
                Peer Review Process
                <svg
                  className={`ml-2 transform transition-transform duration-200 ${isSmall ? "h-4 w-4" : "h-5 w-5"
                    } ${activeDropdown === "peerReview" ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {activeDropdown === "peerReview" && (
                <div className={`absolute left-0 w-72 rounded-md shadow-lg bg-white ring-1 ring-[#e0e0e0] transform transition-all duration-200 ease-out ${isSticky ? "mt-1" : "mt-2"
                  }`}>
                  <div className="py-1">
                    {peerReviewItems.map((item, index) => (
                      <Link
                        key={index}
                        to={item.path}
                        className="block px-4 py-2 text-sm text-[#212121] hover:bg-[#00acc1] hover:text-white transition-colors duration-200"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("journals")}
              onMouseLeave={handleMouseLeave}
            >
              <button className={`inline-flex items-center px-3 py-2 text-[#212121] hover:text-[#00796b] font-medium transition-colors duration-200 ${isSmall ? "text-sm" : "text-base"
                }`}>
                JOURNALS
                <svg
                  className={`ml-2 transform transition-transform duration-200 ${isSmall ? "h-4 w-4" : "h-5 w-5"
                    } ${activeDropdown === "journals" ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {activeDropdown === "journals" && (
                <div className={`absolute left-0 w-72 rounded-md shadow-lg bg-white ring-1 ring-[#e0e0e0] transform transition-all duration-200 ease-out ${isSticky ? "mt-1" : "mt-2"
                  }`}>
                  <div className="py-1">
                    {journalsItems.map((item, index) => (
                      <Link
                        key={index}
                        to={item.path}
                        className="block px-4 py-2 text-sm text-[#212121] hover:bg-[#00acc1] hover:text-white transition-colors duration-200"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/books"
              className={`inline-flex items-center px-3 py-2 text-[#212121] hover:text-[#00796b] font-medium transition-colors duration-200 ${isSmall ? "text-sm" : "text-base"
                }`}
            >
              Book Publication
            </Link>

            <Link
              to="/web-series-cast"
              className={`inline-flex items-center px-3 py-2 text-[#212121] hover:text-[#00796b] font-medium transition-colors duration-200 ${isSmall ? "text-sm" : "text-base"
                }`}
            >
              Web Series Cast
            </Link>

            <Link
              to="/conference-publication"
              className={`inline-flex items-center px-3 py-2 text-[#212121] hover:text-[#00796b] font-medium transition-colors duration-200 ${isSmall ? "text-sm" : "text-base"
                }`}
            >
              Conference Publication
            </Link>

            <span
              onClick={handleAuthorLoginClick}
              className={`inline-flex items-center px-3 py-2 cursor-pointer ${isSmall ? "text-sm" : "text-base"
                } ${user && clickedAuthorLogin
                  ? "text-[#00796b] font-medium"
                  : "text-[#212121] hover:text-[#00796b] font-medium transition-colors duration-200"
                }`}
            >
              {user && clickedAuthorLogin ? "User already logged in" : "AUTHOR LOGIN"}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`${isMobileMenuOpen ? "block" : "hidden"
          } md:hidden bg-white shadow-lg absolute w-full ${isSticky ? "top-[100%]" : "top-[calc(100%-1px)]"
          } border-t border-[#e0e0e0]`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link
            to="/"
            className="block px-3 py-2 rounded-md text-base font-medium text-[#212121] hover:text-[#00796b] hover:bg-[#f9f9f9]"
          >
            About Us
          </Link>

          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "peerReview" ? null : "peerReview")}
              className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-[#212121] hover:text-[#00796b] hover:bg-[#f9f9f9]"
            >
              Peer Review Process
              <svg
                className={`ml-2 h-5 w-5 inline transform transition-transform duration-200 ${activeDropdown === "peerReview" ? "rotate-180" : ""
                  }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {activeDropdown === "peerReview" && (
              <div className="pl-4">
                {peerReviewItems.map((item, index) => (
                  <Link
                    key={index}
                    to={item.path}
                    className="block px-3 py-2 rounded-md text-base font-medium text-[#212121] hover:text-[#00796b] hover:bg-[#f9f9f9]"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "journals" ? null : "journals")}
              className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-[#212121] hover:text-[#00796b] hover:bg-[#f9f9f9]"
            >
              JOURNALS
              <svg
                className={`ml-2 h-5 w-5 inline transform transition-transform duration-200 ${activeDropdown === "journals" ? "rotate-180" : ""
                  }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {activeDropdown === "journals" && (
              <div className="pl-4">
                {journalsItems.map((item, index) => (
                  <Link
                    key={index}
                    to={item.path}
                    className="block px-3 py-2 rounded-md text-base font-medium text-[#212121] hover:text-[#00796b] hover:bg-[#f9f9f9]"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/books"
            className="block px-3 py-2 rounded-md text-base font-medium text-[#212121] hover:text-[#00796b] hover:bg-[#f9f9f9]"
          >
            Book Publication
          </Link>

          <span
            onClick={handleAuthorLoginClick}
            className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer ${user && clickedAuthorLogin
              ? "text-[#00796b]"
              : "text-[#212121] hover:text-[#00796b] hover:bg-[#f9f9f9]"
              }`}
          >
            {user && clickedAuthorLogin ? "User already logged in" : "AUTHOR LOGIN"}
          </span>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
