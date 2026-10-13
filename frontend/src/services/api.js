import axios from 'axios';
import { normalizeAnalysisResponse } from '../utils/normalizeAnalysis';
import { auth } from '../firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Intercept requests to add the Firebase ID token
api.interceptors.request.use(async (config) => {
  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const analyzeResume = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    // Do NOT set Content-Type manually for FormData.
    // The browser sets it automatically with the correct multipart boundary.
    const response = await api.post('/api/resume/analyze', formData);
    return normalizeAnalysisResponse(response.data);
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail || error.response.data?.message;
      
      switch (status) {
        case 400:
          throw new Error(detail || 'Bad Request: The submitted data was invalid.');
        case 401:
          if (detail && detail.toLowerCase().includes('expired')) {
            throw new Error('Authentication expired. Please sign in again.');
          }
          throw new Error('Authentication failed. Please sign in again.');
        case 403:
          throw new Error('Forbidden: You do not have permission to perform this action.');
        case 413:
          throw new Error('File Too Large: The uploaded resume exceeds the maximum allowed size.');
        case 422:
          throw new Error(detail || 'Unprocessable Entity: The file could not be parsed.');
        case 429:
          throw new Error('Rate Limited: Too many requests. Please try again later.');
        case 500:
          throw new Error('Internal Server Error: Something went wrong on our end.');
        case 502:
        case 503:
        case 504:
          throw new Error(detail || 'Service Unavailable: We couldn\'t complete the AI analysis right now. Please try again in a moment.');
        default:
          throw new Error(detail || `Server error occurred (Status ${status}).`);
      }
    } else if (error.request) {
      throw new Error('Network Error: No response from the server. Please check your connection or try again later.');
    } else {
      throw new Error('Error: Unable to process your request.');
    }
  }
};

/**
 * User-driven job search.
 *
 * @param {string[]} locations  - Array of location strings selected by the user.
 * @param {string[]} roles      - Array of role strings selected by the user.
 * @param {boolean}  remote     - Whether the user wants remote jobs.
 * @param {object}  resumeProfile - Already-extracted profile from normalizeAnalysisResponse().
 * @returns {Promise<object[]>} - Array of JobMatch objects (already-normalized by backend).
 */
export const searchJobs = async (locations, roles, remote, resumeProfile) => {
  try {
    const response = await api.post('/api/jobs/search', {
      locations,
      roles,
      remote,
      resume_profile: resumeProfile,
      max_results: 10,
    });
    return response.data;  // Array of JobMatch objects with snake_case fields
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail || error.response.data?.message;
      throw new Error(detail || `Job search failed (Status ${status}).`);
    } else if (error.request) {
      throw new Error('Network Error: No response from the server.');
    } else {
      throw new Error('Error: Unable to search jobs.');
    }
  }
};
