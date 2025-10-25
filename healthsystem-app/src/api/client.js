// healthsystem-app/src/api/client.js
// FIXED: Added timeout, better error handling, and response interceptor

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const client = axios.create({ 
  baseURL: API_BASE,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add auth token
client.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error reading token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle common errors
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Timeout error
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout. Please check your internet connection.';
    } 
    // Network error (no response)
    else if (!error.response) {
      error.message = 'Network error. Please check your internet connection.';
    }
    // Unauthorized - token expired
    else if (error.response?.status === 401) {
      try {
        await AsyncStorage.removeItem("token");
        // You might want to navigate to login screen here
        error.message = 'Session expired. Please login again.';
      } catch (e) {
        console.error("Error clearing token:", e);
      }
    }
    // Server errors
    else if (error.response?.status >= 500) {
      error.message = 'Server error. Please try again later.';
    }
    // Use server error message if available
    else if (error.response?.data?.error) {
      error.message = error.response.data.error;
    }

    return Promise.reject(error);
  }
);

export default client;