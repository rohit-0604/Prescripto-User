// src/context/AppContext.jsx
import { createContext, useEffect, useState, useCallback } from "react";
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom"; // Import useNavigate

export const AppContext = createContext();

const AppContextProvider = (props) => {
    const currencySymbol = '$';
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const [doctors, setDoctors] = useState([]);
    const [token, setToken] = useState(localStorage.getItem('token') || false);
    const [userData, setUserData] = useState(null);

    const navigate = useNavigate(); // Initialize useNavigate hook

    // Centralized logout function
    const logoutUser = () => {
        setToken(false); // Set token state to false
        // FIX: Changed localStorage.log to console.log
        console.log("Token set to false, removing from local storage."); // Debugging
        localStorage.removeItem('token'); // Remove token from local storage
        setUserData(null); // Clear user data
        toast.info("Your session has expired. Please log in again."); // Inform the user
        navigate("/login"); // Redirect to the login page
    };

    // Axios Interceptor for handling session expiration globally
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response, // Pass through successful responses
            (error) => {
                // Check if the error response indicates 401 Unauthorized
                if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
                    // Only logout if a token was actually present (meaning user was logged in)
                    if (token) { // Check if token existed before the 401
                        logoutUser();
                    }
                }
                return Promise.reject(error); // Re-throw the error for component-specific catch blocks
            }
        );

        // Clean up the interceptor when the component unmounts
        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, [token, navigate]); // Depend on token and navigate to ensure interceptor has latest values

    // getDoctorsData is now wrapped in useCallback
    // It will only be re-created if backendUrl changes
    const getDoctorsData = useCallback(async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/doctor/list');
            if (data.success) {
                setDoctors(data.doctors);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.log("Error fetching doctors data:", error);
            // The interceptor will handle 401s, so no explicit toast.error for 401 here
            if (!(axios.isAxiosError(error) && error.response && error.response.status === 401)) {
                toast.error(error.message);
            }
        }
    }, [backendUrl]); // Only depends on backendUrl

    // This useEffect now calls getDoctorsData on initial mount AND whenever the token changes
    // This ensures doctors data is refreshed after login/logout, and after bookings/cancellations
    useEffect(() => {
        getDoctorsData();
    }, [token, getDoctorsData]); // Added token and getDoctorsData as dependencies

    const loadUserProfileData = useCallback(async () => {
        if (!token) {
            setUserData(null);
            return;
        }
        try {
            const response = await axios.get(backendUrl + '/api/user/get-profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log("Response from get-profile:", response.data);

            const data = response.data;

            if (data.success) {
                setUserData(data.userData);
                console.log("User Data Set:", data.userData);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Error in loadUserProfileData:", error.response?.data || error.message);
            // The interceptor now handles 401 errors, no need for explicit logout/toast here
            if (!(axios.isAxiosError(error) && error.response && error.response.status === 401)) {
                toast.error(error.response?.data?.message || error.message);
            }
        }
    }, [backendUrl, token]);


    const updateProfileFrontend = useCallback(async (formData) => {
        if (!token) {
            toast.error("Not authenticated. Please log in.");
            return false;
        }

        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            };

            const { data } = await axios.post(backendUrl + '/api/user/update-profile', formData, config);

            if (data.success) {
                toast.success(data.message);
                loadUserProfileData();
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            if (!(axios.isAxiosError(error) && error.response && error.response.status === 401)) {
                toast.error(error.response?.data?.message || error.message);
            }
            return false;
        }
    }, [backendUrl, token, loadUserProfileData]);

    // This useEffect handles initial user profile load or when token changes
    useEffect(() => {
        if (token) {
            loadUserProfileData();
        } else {
            setUserData(null); // Ensure userData is null if no token
        }
    }, [token, loadUserProfileData]);

    const value = {
        doctors, getDoctorsData,
        currencySymbol,
        token, setToken,
        backendUrl,
        userData, setUserData,
        loadUserProfileData,
        updateProfileFrontend,
        logoutUser,
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};

export default AppContextProvider;