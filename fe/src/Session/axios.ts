import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
  withCredentials: true, // Semua request akan otomatis membawa & menerima cookie
});

export default api;