import React, { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

function VerificationPending() {
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email || "";
    const message = location.state?.message || "Please check your email to verify your account.";

    const [isLoading, setIsLoading] = useState(false);
    const [resendMessage, setResendMessage] = useState("");

    const handleResend = async () => {
        if (!email) {
            setResendMessage("Email not found. Please register again.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/auth/resend-verification`,
                { email }
            );

            if (response.data.success) {
                setResendMessage("Verification email sent! Please check your inbox.");
            }
        } catch (error) {
            setResendMessage(error.response?.data?.message || "Failed to resend email.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">

                {/* Email Icon */}
                <div className="w-20 h-20 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-2">Check Your Email</h2>
                <p className="text-gray-500 mb-2">{message}</p>

                {email && (
                    <p className="text-cyan-600 font-medium mb-6">{email}</p>
                )}

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-600">
                        Click the verification link in the email to activate your account.
                        The link will expire in <strong>10 Min</strong>.
                    </p>
                </div>

                {resendMessage && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${resendMessage.includes("sent")
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-600"
                        }`}>
                        {resendMessage}
                    </div>
                )}

                <div className="space-y-3">
                    <button
                        onClick={handleResend}
                        disabled={isLoading}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isLoading ? "Sending..." : "Resend Verification Email"}
                    </button>

                    <button
                        onClick={() => navigate("/login")}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg transition-colors"
                    >
                        Back to Login
                    </button>
                </div>

                <p className="mt-6 text-xs text-gray-400">
                    Didn't receive the email? Check your spam folder or click resend.
                </p>
            </div>
        </div>
    );
}

export default VerificationPending;