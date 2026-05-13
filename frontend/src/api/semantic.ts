import axios from 'axios';

const semanticClient = axios.create({
  baseURL: '/agent-api',
  timeout: 60000,
});

export interface SemanticMetric {
  name: string;
  display_name: string;
  description: string;
  dataset: string;
  formula: string;
  dimensions: string[];
  filters: SemanticFilter[];
  version: string;
  status: string;
  status_actor?: string;
  status_reason?: string;
  status_updated_at?: number;
  owner: string;
  approved_by?: string;
  lineage?: Record<string, unknown>;
}

export interface SemanticDimension {
  name: string;
  display_name: string;
  dataset: string;
  column: string;
  data_type: string;
  sensitivity: string;
  hierarchy: string[];
}

export interface SemanticDataset {
  name: string;
  display_name: string;
  table: string;
  time_field: string;
  fields: string[];
}

export interface SemanticFilter {
  field: string;
  op: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'in';
  value: string | number | string[] | number[];
}

export interface SemanticQueryRequest {
  tenant_id: string;
  role: string;
  metrics: string[];
  dimensions: string[];
  filters: SemanticFilter[];
  limit: number;
}

export interface SemanticCompileResponse {
  sql: string;
  dataset: string;
  metrics: string[];
  dimensions: string[];
}

export interface SemanticQueryResponse extends SemanticCompileResponse {
  columns: string[];
  rows: Record<string, unknown>[];
  row_count: number;
  elapsed_ms: number;
}

export interface SemanticAuditEvent {
  event_id: string;
  event_type: string;
  tenant_id: string;
  role: string;
  status: string;
  message: string;
  payload: Record<string, unknown>;
  created_at: number;
}

async function list<T>(path: string): Promise<T[]> {
  const res = await semanticClient.get<{ items: T[] }>(path);
  return res.data.items;
}

export function listSemanticMetrics() {
  return list<SemanticMetric>('/api/v1/semantic/metrics');
}

export function listSemanticDimensions() {
  return list<SemanticDimension>('/api/v1/semantic/dimensions');
}

export function listSemanticDatasets() {
  return list<SemanticDataset>('/api/v1/semantic/datasets');
}

export async function compileSemanticQuery(payload: SemanticQueryRequest) {
  const res = await semanticClient.post<SemanticCompileResponse>('/api/v1/semantic/compile', payload);
  return res.data;
}

export async function runSemanticQuery(payload: SemanticQueryRequest) {
  const res = await semanticClient.post<SemanticQueryResponse>('/api/v1/semantic/query', payload);
  return res.data;
}

export async function listSemanticAuditEvents() {
  const res = await semanticClient.get<{ items: SemanticAuditEvent[] }>('/api/v1/semantic/audit/events');
  return res.data.items;
}


export async function updateSemanticMetricStatus(
  metricName: string,
  payload: { status: 'draft' | 'published' | 'deprecated'; actor: string; reason: string },
) {
  const res = await semanticClient.post<{
    name: string;
    status: string;
    actor: string;
    reason: string;
    updated_at: number;
  }>(`/api/v1/semantic/governance/metrics/${metricName}/status`, payload);
  return res.data;
}


export interface MetricStatusRequest {
  request_id: string;
  metric_name: string;
  requested_status: 'draft' | 'published' | 'deprecated';
  requester: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer?: string;
  comment?: string;
  created_at: number;
  reviewed_at?: number;
}

export async function requestSemanticMetricStatus(payload: {
  metric_name: string;
  requested_status: 'draft' | 'published' | 'deprecated';
  requester: string;
  reason: string;
}) {
  const res = await semanticClient.post<MetricStatusRequest>('/api/v1/semantic/governance/metric-status-requests', payload);
  return res.data;
}

export async function listSemanticMetricStatusRequests() {
  const res = await semanticClient.get<{ items: MetricStatusRequest[] }>('/api/v1/semantic/governance/metric-status-requests');
  return res.data.items;
}

export async function approveSemanticMetricStatusRequest(requestId: string, payload: { reviewer: string; comment: string }) {
  const res = await semanticClient.post<MetricStatusRequest>(`/api/v1/semantic/governance/metric-status-requests/${requestId}/approve`, payload);
  return res.data;
}

export async function rejectSemanticMetricStatusRequest(requestId: string, payload: { reviewer: string; comment: string }) {
  const res = await semanticClient.post<MetricStatusRequest>(`/api/v1/semantic/governance/metric-status-requests/${requestId}/reject`, payload);
  return res.data;
}
