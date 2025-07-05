import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const JICSNavigation = () => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navigationItems = [
    {
      label: "About the Journal",
      path: "/journal/jics/about/overview",
      dropdown: [
        { label: "Overview", path: "/journal/jics/about/overview" },
        { label: "Editorial Board", path: "/journal/jics/about/editorial-board" },
        { label: "Aims and Scope", path: "/journal/jics/about/aims-scope" },
        { label: "Academic Integrity", path: "/journal/jics/about/integrity" },
      ],
    },
    {
      label: "Articles/Issues",
      path: "/journal/jics/articles/current",
      dropdown: [
        { label: "Current Issue", path: "/journal/jics/articles/current" },
        {
          label: "Past Issues / Archives",
          path: "/journal/jics/articles/archives",
        },
        {
          label: "Article Download",
          path: "#",
          icon: (
            <svg
              className="w-5 h-5 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          ),
          download: true,
          disabled: true,
        },
      ],
    },
    {
      label: "For Authors",
      path: "/journal/jics/authors/guidelines",
      dropdown: [
        {
          label: "Submission Guidelines",
          path: "/journal/jics/authors/guidelines",
        },
        {
          label: "Manuscript Template",
          path: "/journal/jics/authors/template",
        },
        { label: "Ethical Guidelines", path: "/journal/jics/authors/ethics" },
        {
          label: "Submit Manuscript",
          path: "/journal/jics/authors/submit",
          icon: (
            <svg
              className="w-5 h-5 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          ),
        },
      ],
    },
    {
      label: "Peer Review",
      path: "/journal/jics/review/process",
      dropdown: [
        { label: "Review Process", path: "/journal/jics/review/process" },
        { label: "Review Timeline", path: "/journal/jics/review/timeline" },
        { label: "Reviewer Ethics", path: "/journal/jics/review/ethics" },
        { label: "Decision Criteria", path: "/journal/jics/review/criteria" },
        {
          label: "Transparency Measures",
          path: "/journal/jics/review/transparency",
        },
      ],
    },
    {
      label: "Journal Updates",
      path: "#",
      dropdown: [
        {
          label: "Follow on LinkedIn",
          path: "https://www.linkedin.com/company/synergy-world-press/about/?viewAsMember=true",
          icon: (
            <svg
              className="w-5 h-5 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          ),
          external: true,
        },
      ],
    },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-lg rounded-lg border-b border-[#e0e0e0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-[#212121] hover:text-[#00796b] hover:bg-[#f9f9f9] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#00acc1]"
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              <svg
                className={`${
                  isMobileMenuOpen ? "hidden" : "block"
                } h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Close icon */}
              <svg
                className={`${
                  isMobileMenuOpen ? "block" : "hidden"
                } h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1">
            {navigationItems.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setActiveDropdown(item.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  to={item.path}
                  className={`inline-flex items-center px-6 py-2 text-base font-semibold transition-colors duration-200 ${
                    isActive(item.path) ||
                    (item.dropdown &&
                      item.dropdown.some((d) => isActive(d.path)))
                      ? "text-[#00796b] border-b-2 border-[#00acc1]"
                      : "text-[#212121] hover:text-[#00796b] hover:border-b-2 hover:border-[#00acc1]"
                  }`}
                >
                  {item.label}
                  {item.dropdown && (
                    <svg
                      className="w-5 h-5 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </Link>
                {item.dropdown && activeDropdown === item.label && (
                  <div className="absolute left-0 mt-1 w-72 rounded-lg shadow-xl bg-white ring-1 ring-[#e0e0e0] z-50 transform transition-all duration-200 ease-out">
                    <div className="py-2">
                      {item.dropdown.map((dropdownItem) => {
                        if (dropdownItem.external) {
                          return (
                            <a
                              key={dropdownItem.label}
                              href={dropdownItem.path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center px-6 py-3 text-base text-[#212121] hover:bg-[#e0f7fa] hover:text-[#00796b] transition-colors duration-200"
                            >
                              {dropdownItem.label}
                              {dropdownItem.icon}
                            </a>
                          );
                        }
                        if (dropdownItem.disabled) {
                          return (
                            <div
                              key={dropdownItem.label}
                              title="Download Disabled"
                              className="flex items-center justify-between px-6 py-3 text-base rounded cursor-not-allowed hover:bg-red-100 transition"
                            >
                              <span className="flex">
                                {/* Ban Icon */}

                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728"
                                  />
                                {dropdownItem.label}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <Link
                            key={dropdownItem.label}
                            to={dropdownItem.path}
                            className={`flex items-center px-6 py-3 text-base transition-colors duration-200 ${
                              isActive(dropdownItem.path)
                                ? "bg-[#e0f7fa] text-[#00796b]"
                                : "text-[#212121] hover:bg-[#e0f7fa] hover:text-[#00796b]"
                            }`}
                          >
                            {dropdownItem.label}
                            {dropdownItem.icon}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`${
          isMobileMenuOpen ? "block" : "hidden"
        } md:hidden bg-white`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navigationItems.map((item) => (
            <div key={item.label}>
              <button
                onClick={() =>
                  setActiveDropdown(
                    activeDropdown === item.label ? null : item.label
                  )
                }
                className={`w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                  isActive(item.path) ||
                  (item.dropdown &&
                    item.dropdown.some((d) => isActive(d.path)))
                    ? "text-[#00796b] bg-[#e0f7fa]"
                    : "text-[#212121] hover:text-[#00796b] hover:bg-[#f9f9f9]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{item.label}</span>
                  {item.dropdown && (
                    <svg
                      className={`w-5 h-5 transform transition-transform duration-200 ${
                        activeDropdown === item.label ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </div>
              </button>
              {item.dropdown && activeDropdown === item.label && (
                <div className="pl-4">
                  {item.dropdown.map((dropdownItem) => {
                    if (dropdownItem.external) {
                      return (
                        <a
                          key={dropdownItem.label}
                          href={dropdownItem.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-3 py-2 rounded-md text-base font-medium text-[#212121] hover:text-[#00796b] hover:bg-[#f9f9f9]"
                        >
                          {dropdownItem.label}
                          {dropdownItem.icon}
                        </a>
                      );
                    }
                    if (dropdownItem.download) {
                      return (
                        <a
                          key={dropdownItem.label}
                          href={dropdownItem.path}
                          download
                          className="flex items-center px-3 py-2 rounded-md text-base font-medium text-[#212121] hover:text-[#00796b] hover:bg-[#f9f9f9]"
                        >
                          {dropdownItem.label}
                          {dropdownItem.icon}
                        </a>
                      );
                    }
                    return (
                      <Link
                        key={dropdownItem.label}
                        to={dropdownItem.path}
                        className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                          isActive(dropdownItem.path)
                            ? "text-[#00796b] bg-[#e0f7fa]"
                            : "text-[#212121] hover:text-[#00796b] hover:bg-[#f9f9f9]"
                        }`}
                      >
                        {dropdownItem.label}
                        {dropdownItem.icon}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default JICSNavigation;
