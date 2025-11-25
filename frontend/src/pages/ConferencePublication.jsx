import React from "react";
import { Link } from "react-router-dom";

const ConferencePublication = () => {
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
                                d="M12 8v4l3 3M12 2a10 10 0 100 20 10 10 0 000-20z"
                            ></path>
                        </svg>
                    </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-[#00796b] mb-4">
                    Coming Soon
                </h1>
                <p className="text-xl text-[#212121] mb-8">
                    This page is under construction and will be available shortly.
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

export default ConferencePublication;
