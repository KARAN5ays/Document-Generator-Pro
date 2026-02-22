import React, { createContext, useState, useEffect } from 'react';
import API from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            if (token) {
                try {
                    const res = await API.get('/users/me/', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUser(res.data);
                } catch (err) {
                    console.error("Failed to fetch user profile", err);
                    // Invalid token or expired, clear it
                    logout();
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        };

        fetchUser();
    }, [token]);

    const login = async (username, password) => {
        try {
            const res = await API.post('/token/', { username, password });
            const { access, refresh } = res.data;
            localStorage.setItem('token', access);
            localStorage.setItem('refresh_token', refresh);
            setToken(access);
            setUser({ username }); // Set basic user info
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const register = async (username, email, password) => {
        try {
            const res = await API.post('/register/', { username, email, password });
            const { access, refresh, user: registeredUser } = res.data;
            localStorage.setItem('token', access);
            localStorage.setItem('refresh_token', refresh);
            setToken(access);
            setUser(registeredUser);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        setToken(null);
        setUser(null);
    };

    // Listen to global logout events from axios interceptor
    useEffect(() => {
        const handleForceLogout = () => logout();
        window.addEventListener('auth:logout', handleForceLogout);
        return () => window.removeEventListener('auth:logout', handleForceLogout);
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
