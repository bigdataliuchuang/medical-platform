import axios from 'axios';
import { message } from 'antd';

const request = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 15000,
});

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      message.error(error.response.data?.detail || '服务异常');
    } else {
      message.error('服务不可用，请检查网络');
    }
    return Promise.reject(error);
  }
);

export const { get, post } = request;
export default request;
