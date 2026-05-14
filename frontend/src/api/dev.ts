import axios from 'axios';

const devClient = axios.create({
  baseURL: import.meta.env.VITE_AGENT_API_URL || '/agent-api',
  timeout: 60000,
});

export interface DqRuleDraft {
  rule_code: string;
  rule_name: string;
  check_sql: string;
  severity: string;
}

export interface MetricPlan {
  requirement: string;
  metric_code: string;
  metric_name: string;
  business_domain: string;
  source_tables: string[];
  dws_design: {
    table_name: string;
    grain: string[];
    measures: string[];
    description: string;
  };
  ads_design: {
    table_name: string;
    grain: string[];
    measures: string[];
    description: string;
  };
  sql_draft: string;
  dq_rules: DqRuleDraft[];
  lineage: {
    upstream: string[];
    dws: string;
    ads: string;
    known_graph_nodes: string[];
  };
  drilldown_policy: {
    default_layer: string;
    detail_layer: string;
    forbidden: string[];
    required_guards: string[];
  };
  warnings: string[];
}

export async function generateMetricPlan(requirement: string, domain?: string): Promise<MetricPlan> {
  const res = await devClient.post<MetricPlan>('/api/dev/metric-plan', {
    requirement,
    domain: domain || undefined,
  });
  return res.data;
}

export interface MetricAssetResult {
  metric_code: string;
  yaml_path: string;
  markdown_path: string;
}

export async function saveMetricAsset(plan: MetricPlan): Promise<MetricAssetResult> {
  const res = await devClient.post<MetricAssetResult>('/api/dev/metric-assets', { plan });
  return res.data;
}
