import axios, { AxiosResponse } from 'axios';
import { message } from 'antd';

const instance = axios.create({
  baseURL: 'http://localhost:8000',
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
  const res = await instance.get<T, AxiosResponse<T>>(url, { params });
  return res.data;
}

export async function post<T = any>(url: string, data?: object): Promise<T> {
  const res = await instance.post<T, AxiosResponse<T>>(url, data);
  return res.data;
}

export default instance;
