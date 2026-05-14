import axios from 'axios';
import { message } from 'antd';
import {
  MOCK_DASHBOARD_OVERVIEW, MOCK_DASHBOARD_PIPELINE, MOCK_DASHBOARD_ALERTS,
  MOCK_DQ_SUMMARY, MOCK_DQ_TREND, MOCK_DQ_RULES, MOCK_DQ_ISSUES,
  MOCK_MPI_SUMMARY, MOCK_MPI_SOURCES_DIST,
  MOCK_DRUG_ALERTS,
  MOCK_EXPENSE_SUMMARY, MOCK_EXPENSE_BY_TUMOR,
  MOCK_INPATIENT_QUALITY,
} from './mock-data';

const IS_DEMO = !import.meta.env.VITE_API_BASE_URL;

const MOCK_MAP: Record<string, unknown> = {
  '/api/auth/login': { token: 'demo-token', username: 'admin', role: 'admin', permissions: [] },
  '/api/dashboard/overview':        MOCK_DASHBOARD_OVERVIEW,
  '/api/dashboard/pipeline-status': MOCK_DASHBOARD_PIPELINE,
  '/api/dashboard/alerts':          MOCK_DASHBOARD_ALERTS,
  '/api/dq/summary':                MOCK_DQ_SUMMARY,
  '/api/dq/trend':                  MOCK_DQ_TREND,
  '/api/dq/rules':                  MOCK_DQ_RULES,
  '/api/dq/issues':                 MOCK_DQ_ISSUES,
  '/api/mpi/summary':               MOCK_MPI_SUMMARY,
  '/api/mpi/sources/distribution':  MOCK_MPI_SOURCES_DIST,
  '/api/drug/alerts':               MOCK_DRUG_ALERTS,
  '/api/expense/summary':           MOCK_EXPENSE_SUMMARY,
  '/api/expense/by-tumor-type':     MOCK_EXPENSE_BY_TUMOR,
  '/api/inpatient/quality':         MOCK_INPATIENT_QUALITY,
};

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
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

function mockLookup(url: string): unknown | undefined {
  const path = url.split('?')[0];
  return MOCK_MAP[path];
}

export async function get<T = any>(url: string, params?: object): Promise<T> {
  if (IS_DEMO) {
    const mock = mockLookup(url);
    if (mock !== undefined) return Promise.resolve(mock as T);
  }
  return instance.get<any, T>(url, { params });
}

export async function post<T = any>(url: string, data?: object): Promise<T> {
  if (IS_DEMO) {
    const mock = mockLookup(url);
    if (mock !== undefined) return Promise.resolve(mock as T);
  }
  return instance.post<any, T>(url, data);
}

export default instance;
