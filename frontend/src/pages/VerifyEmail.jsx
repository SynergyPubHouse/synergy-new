import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../App";

function VerifyEmail() {
    const { token } = useParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    const [status, setStatus] = useState("verifying"); // verifying, success, error, expired
    const [message, setMessage] = useState("");
    const [email, setEmail] = useState("");

    useEffect(() => {

        const urlParams = new URLSearchParams(window.location.search);
        const queryToken = urlParams.get("verify");

        if (queryToken) {
            verifyEmail(queryToken);
        } else if (token) {
            verifyEmail(token);
        }
    }, [token]);

    const verifyEmail = async (verificationToken) => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/auth/verify-email-token`,
                { token: verificationToken }
            );

            if (response.data.success) {
                setStatus("success");
                setMessage(response.data.message);


                if (response.data.token && response.data.user) {
                    const userData = {
                        ...response.data.user,
                        token: response.data.token,
                        accountType: response.data.user.roles.includes("editor")
                            ? "editor"
                            : response.data.user.roles.includes("reviewer")
                                ? "reviewer"
                                : "author",
                        availableRoles: response.data.user.roles || [],
                    };

                    localStorage.setItem("user", JSON.stringify(userData));
                    login(userData);


                    const redirectPath = userData.accountType === "editor"
                        ? "/journal/jics/editor/dashboard"
                        : userData.accountType === "reviewer"
                            ? "/journal/jics/reviewer/dashboard"
                            : "/";

                    setTimeout(() => {
                        navigate(redirectPath, { replace: true });
                    }, 2500);
                }
            }
        } catch (error) {
            if (error.response?.data?.expired) {
                setStatus("expired");
                setMessage("Verification link has expired. Please request a new one.");
            } else {
                setStatus("error");
                setMessage(error.response?.data?.message || "Verification failed.");
            }
        }
    };

    const handleResendVerification = async () => {
        if (!email) {
            setMessage("Please enter your email address.");
            return;
        }

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/auth/resend-verification`,
                { email }
            );

            if (response.data.success) {
                setStatus("resent");
                setMessage("Verification email sent! Please check your inbox.");
            }
        } catch (error) {
            setMessage(error.response?.data?.message || "Failed to send verification email.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">

                {/* Verifying State */}
                {status === "verifying" && (
                    <>
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-600 mx-auto mb-6"></div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Verifying Your Email</h2>
                        <p className="text-gray-500">Please wait while we verify your email address...</p>
                    </>
                )}

                {/* Success State */}
                {status === "success" && (
                    <>
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-green-600 mb-2">Email Verified!</h2>
                        <p className="text-gray-500 mb-4">{message}</p>
                        <p className="text-sm text-gray-400">Redirecting to homepage...</p>
                    </>
                )}

                {/* Error State */}
                {status === "error" && (
                    <>
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-red-600 mb-2">Verification Failed</h2>
                        <p className="text-gray-500 mb-6">{message}</p>
                        <button
                            onClick={() => navigate("/login")}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                            Go to Login
                        </button>
                    </>
                )}

                {/* Expired State */}
                {status === "expired" && (
                    <>
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-yellow-600 mb-2">Link Expired</h2>
                        <p className="text-gray-500 mb-6">{message}</p>

                        <div className="space-y-4">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none"
                            />
                            <button
                                onClick={handleResendVerification}
                                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg transition-colors"
                            >
                                Resend Verification Email
                            </button>
                        </div>
                    </>
                )}

                {/* Resent State */}
                {status === "resent" && (
                    <>
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-green-600 mb-2">Email Sent!</h2>
                        <p className="text-gray-500 mb-6">{message}</p>
                        <button
                            onClick={() => navigate("/login")}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                            Go to Login
                        </button>
                    </>
                )}

            </div>
        </div>
    );
}

export default VerifyEmail;