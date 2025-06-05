import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    // Handle token expiration
    if (response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    // Handle server errors
    if (response?.status >= 500) {
      console.error('Server Error:', response.data);
      // You might want to show a global error notification here
    }

    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/api/auth/register', userData),
  login: (credentials) => api.post('/api/auth/login', credentials),
  getProfile: () => api.get('/api/auth/profile'),
  updateProfile: (profileData) => api.put('/api/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/api/auth/change-password', passwordData),
};

// Vehicles API calls
export const vehiclesAPI = {
  getMyVehicles: () => api.get('/api/vehicles/my-vehicles'),
  addVehicle: (vehicleData) => api.post('/api/vehicles', vehicleData),
  updateVehicle: (id, vehicleData) => api.put(`/api/vehicles/${id}`, vehicleData),
  deleteVehicle: (id) => api.delete(`/api/vehicles/${id}`),
};

// Service Requests API calls
export const requestsAPI = {
  getMyRequests: () => api.get('/api/requests/my-requests'),
  getAllRequests: (filters) => api.get('/api/requests', { params: filters }),
  getRequest: (id) => api.get(`/api/requests/${id}`),
  createRequest: (requestData) => api.post('/api/requests', requestData),
  updateRequestStatus: (id, status) => api.put(`/api/requests/${id}/status`, { status }),
};

// Quotes API calls
export const quotesAPI = {
  getMyQuotes: () => api.get('/api/quotes/my-quotes'),
  getRequestQuotes: (requestId) => api.get(`/api/quotes/request/${requestId}`),
  createQuote: (quoteData) => api.post('/api/quotes', quoteData),
  acceptQuote: (id) => api.put(`/api/quotes/${id}/accept`),
};

// Bookings API calls
export const bookingsAPI = {
  getMyBookings: () => api.get('/api/bookings/my-bookings'),
  createBooking: (bookingData) => api.post('/api/bookings', bookingData),
  updateBookingStatus: (id, status) => api.put(`/api/bookings/${id}/status`, { status }),
  completeBooking: (id) => api.post(`/api/bookings/${id}/complete`),
};

// Reviews API calls
export const reviewsAPI = {
  getMechanicReviews: (mechanicId, params) => 
    api.get(`/api/reviews/mechanic/${mechanicId}`, { params }),
  getMyReviews: (params) => api.get('/api/reviews/my-reviews', { params }),
  createReview: (reviewData) => api.post('/api/reviews', reviewData),
  updateReview: (id, reviewData) => api.put(`/api/reviews/${id}`, reviewData),
  deleteReview: (id) => api.delete(`/api/reviews/${id}`),
};

// Mechanics API calls
export const mechanicsAPI = {
  getAllMechanics: (filters) => api.get('/api/mechanics', { params: filters }),
  getMechanic: (id) => api.get(`/api/mechanics/${id}`),
  submitVerification: (documents) => api.post('/api/mechanics/verify', documents),
  updateAvailability: (availability) => api.put('/api/mechanics/availability', availability),
};

export default api; 