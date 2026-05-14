import axios from 'axios';
import { message } from 'antd';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 15000,
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    if (error.response) {
      message.error(error.response.data?.detail || '服务异常');
    } else {
      message.error('服务不可用，请检查网络');
    }
    return Promise.reject(error);
  }
);

export async function get<T = any>(url: string, params?: object): Promise<T> {
  return instance.get<any, T>(url, { params });
}

export async function post<T = any>(url: string, data?: object): Promise<T> {
  return instance.post<any, T>(url, data);
}

export default instance;
