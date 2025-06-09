import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';

const BASE_URL = '';

function OrcidCallback() {
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const handleOrcidCallback = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');

            if (!code) {
                console.error('No authorization code received from ORCID');
                navigate(`${BASE_URL}/login`);
                return;
            }

            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/api/auth/orcid/callback`,
                    { code }
                );

                if (response.data) {
                    localStorage.setItem("user", JSON.stringify(response.data));
                    login(response.data);
                    navigate(BASE_URL);
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
        };

        handleOrcidCallback();
    }, [navigate, login]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
            <div className="text-center">
                <h2 className="text-2xl font-semibold text-[#496580] mb-4">
                    Processing ORCID Login...
                </h2>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#496580] mx-auto"></div>
            </div>
        </div>
    );
}

export default OrcidCallback; 