import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';

const BASE_URL = '';

function OrcidCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuth();
    const [status, setStatus] = useState('processing');

    useEffect(() => {
        const handleOrcidCallback = async () => {
            console.log("ORCID Callback: Processing...");

            // Check if we have token and user data (new backend flow)
            const token = searchParams.get('token');
            const userStr = searchParams.get('user');
            const code = searchParams.get('code'); // Legacy flow

            console.log("URL params:", { token: !!token, user: !!userStr, code: !!code });

            if (token && userStr) {
                // New flow: Backend already processed OAuth and sent token+user data
                try {
                    console.log("Parsing user data...");
                    const user = JSON.parse(decodeURIComponent(userStr));

                    // Store token and user data for compatibility with existing auth system
                    localStorage.setItem("token", token);
                    localStorage.setItem("user", JSON.stringify(user));

                    console.log("Data stored in localStorage");
                    console.log("User:", user);
                    console.log("Token:", token.substring(0, 20) + "...");

                    // Update auth context
                    login(user);

                    console.log("Auth context updated");
                    setStatus('success');

                    // Small delay to ensure auth context is updated
                    setTimeout(() => {
                        console.log("Navigating to home page...");
                        navigate('/'); // Redirect to home page instead of /account
                    }, 500);

                } catch (error) {
                    console.error('Error parsing auth data:', error);
                    setStatus('error');
                    alert("Login Failed: Invalid authentication data");
                    navigate(`${BASE_URL}/login`);
                }
            } else if (code) {
                // Legacy flow: Need to exchange code for token (kept for compatibility)
                try {
                    setStatus('processing');
                    const response = await axios.post(
                        `${import.meta.env.VITE_BACKEND_URL}/api/auth/orcid/callback`,
                        { code }
                    );

                    if (response.data) {
                        localStorage.setItem("user", JSON.stringify(response.data));
                        login(response.data);
                        setStatus('success');

                        setTimeout(() => {
                            navigate('/'); // Redirect to home page
                        }, 500);
                    } else {
                        console.error("User data not found in the response");
                        setStatus('error');
                        alert("Login Failed: User data missing");
                        navigate(`${BASE_URL}/login`);
                    }
                } catch (error) {
                    console.error("ORCID callback error:", error);
                    setStatus('error');
                    alert(error.response?.data?.message || "ORCID Login Failed");
                    navigate(`${BASE_URL}/login`);
                }
            } else {
                console.error('No authorization code or token received from ORCID');
                setStatus('error');
                navigate(`${BASE_URL}/login`);
            }
        };

        handleOrcidCallback();
    }, [navigate, login, searchParams]);

    if (status === 'success') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-green-600 mb-4">
                        Login Successful!
                    </h2>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Redirecting to your account...</p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-red-600 mb-4">
                        Login Failed
                    </h2>
                    <p className="text-gray-600">There was an error with your login.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
            <div className="text-center">
                <h2 className="text-2xl font-semibold text-[#496580] mb-4">
                    Processing ORCID Login...
                </h2>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#496580] mx-auto"></div>
                <p className="mt-4 text-gray-600">Completing your authentication...</p>
                <p className="mt-2 text-sm text-gray-500">Status: {status}</p>
            </div>
        </div>
    );
}

export default OrcidCallback; 