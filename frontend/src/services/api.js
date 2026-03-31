import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export async function register(payload) {
  const response = await api.post('/auth/register', payload);
  return response.data;
}

export async function login(payload) {
  const response = await api.post('/auth/login', payload);
  return response.data;
}

export async function getMe() {
  const response = await api.get('/auth/me');
  return response.data;
}

export async function verifyCccd(payload) {
  const response = await api.post('/auth/verify-cccd', payload);
  return response.data;
}

export async function sendPasswordResetOtp(payload) {
  const response = await api.post('/auth/send-password-reset-otp', payload);
  return response.data;
}

export async function resetPasswordWithOtp(payload) {
  const response = await api.post('/auth/reset-password-otp', payload);
  return response.data;
}

export async function listRooms(params = {}) {
  const response = await api.get('/rooms', { params });
  return response.data;
}

export async function getRoomDetail(roomId) {
  const response = await api.get(`/rooms/${roomId}`);
  return response.data;
}

export async function createSupportRequest(payload) {
  const response = await api.post('/support-requests', payload);
  return response.data;
}

export default api;
