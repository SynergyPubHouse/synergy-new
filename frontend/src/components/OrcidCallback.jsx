import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';

const BASE_URL = '';

function OrcidCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuth();

    useEffect(() => {
        const handleOrcidCallback = async () => {
            // Check if we have token and user data (new backend flow)
            const token = searchParams.get('token');
            const userStr = searchParams.get('user');
            const code = searchParams.get('code'); // Legacy flow

            if (token && userStr) {
                // New flow: Backend already processed OAuth and sent token+user data
                try {
                    const user = JSON.parse(decodeURIComponent(userStr));

                    // Store token and user data for compatibility with existing auth system
                    localStorage.setItem("token", token);
                    localStorage.setItem("user", JSON.stringify(user));

                    // Update auth context
                    login(user);

                    console.log("ORCID Login successful:", user);
                    console.log("Token stored:", token);

                    // Redirect to account page or dashboard
                    navigate('/account');
                } catch (error) {
                    console.error('Error parsing auth data:', error);
                    alert("Login Failed: Invalid authentication data");
                    navigate(`${BASE_URL}/login`);
                }
            } else if (code) {
                // Legacy flow: Need to exchange code for token (kept for compatibility)
                try {
                    const response = await axios.post(
                        `${import.meta.env.VITE_BACKEND_URL}/api/auth/orcid/callback`,
                        { code }
                    );

                    if (response.data) {
                        localStorage.setItem("user", JSON.stringify(response.data));
                        login(response.data);
                        navigate('/account'); // or navigate(BASE_URL);
                    } else {
                        console.error("User data not found in the response");
                        alert("Login Failed: User data missing");
                        navigate(`${BASE_URL}/login`);
                    }
                } catch (error) {
                    console.error("ORCID callback error:", error);
                    alert(error.response?.data?.message || "ORCID Login Failed");
                    navigate(`${BASE_URL}/login`);
                }
            } else {
                console.error('No authorization code or token received from ORCID');
                navigate(`${BASE_URL}/login`);
            }
        };

        handleOrcidCallback();
    }, [navigate, login, searchParams]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
            <div className="text-center">
                <h2 className="text-2xl font-semibold text-[#496580] mb-4">
                    Processing ORCID Login...
                </h2>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#496580] mx-auto"></div>
                <p className="mt-4 text-gray-600">Completing your authentication...</p>
            </div>
        </div>
    );
}

export default OrcidCallback; 