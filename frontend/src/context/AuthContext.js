import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const token = localStorage.getItem("token");
		if (token) {
			fetchUserData(token);
		} else {
			setLoading(false);
		}
	}, []);

	const fetchUserData = async (token) => {
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_BACKEND_URL}/api/auth/profile`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);
			setUser(response.data);
		} catch (error) {
			localStorage.removeItem("token");
		} finally {
			setLoading(false);
		}
	};

	const login = (userData) => {
		setUser(userData);
		localStorage.setItem("token", userData.token);
	};

	const logout = () => {
		setUser(null);
		localStorage.removeItem("token");
		window.location.href = "/journal/jics/about/overview";
	};

	return (
		<AuthContext.Provider value={{ user, login, logout, loading }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};
