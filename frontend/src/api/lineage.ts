import { get } from './request';

export interface LineageSummary {
  table_edge_count: number;
  column_edge_count: number;
  table_count: number;
  layers: string[];
  engines: string[];
  subjects: string[];
}

export interface LineageTable {
  table_name: string;
  layer: string;
  engine: string;
  sql_file: string;
  business_subject: string;
}

export interface TableLineageEdge {
  source_table: string;
  target_table: string;
  source_layer: string;
  target_layer: string;
  engine: string;
  sql_file: string;
}

export interface ColumnLineageEdge {
  source_table: string;
  source_column: string;
  target_table: string;
  target_column: string;
  source_layer: string;
  target_layer: string;
  engine: string;
  expression: string;
  sql_file: string;
}

export function getLineageSummary() {
  return get<LineageSummary>('/api/lineage/summary');
}

export function listLineageTables(params?: { layer?: string; engine?: string; subject?: string }) {
  return get<LineageTable[]>('/api/lineage/tables', params);
}

export function listTableLineageEdges(params?: { target_table?: string; source_table?: string }) {
  return get<TableLineageEdge[]>('/api/lineage/table-edges', params);
}

export function listColumnLineageEdges(params?: { target_table?: string; target_column?: string }) {
  return get<ColumnLineageEdge[]>('/api/lineage/column-edges', params);
}

