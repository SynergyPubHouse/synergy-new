import React from "react";
import { Link } from "react-router-dom";

const PageNotAvailable = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9f9f9] px-4">
      <div className="max-w-2xl mx-auto text-center p-8 rounded-3xl shadow-lg bg-white border border-[#e0e0e0]">
        <div className="relative mb-8">
          <div className="absolute -top-8 -left-8 w-24 h-24 rounded-full bg-[#00acc1] opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-8 -right-8 w-16 h-16 rounded-full bg-[#00796b] opacity-20 animate-pulse"></div>
          <div className="relative">
            <svg
              className="w-40 h-40 mx-auto text-[#00796b]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#00796b] mb-4">
          Page Not Available
        </h1>
        <p className="text-xl text-[#212121] mb-8">
          Sorry, the page you are looking for does not exist, has been moved,
          or is temporarily unavailable.
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-8 py-3 bg-[#00796b] text-white font-semibold rounded-lg shadow hover:bg-[#00acc1] transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default PageNotAvailable;
