export type DashboardState = 'Create' | 'Config' | 'View' | 'FullScreen';

export type Rollup = 'SUM' | 'AVERAGE' | 'COUNTA' | 'MAX' | 'MIN';

export interface TableMeta {
  id: string;
  name: string;
}

export interface FieldMeta {
  fieldId: string;
  fieldName: string;
  fieldType?: string | number;
}

export interface DataRange {
  type: string;
  viewId?: string;
  viewName?: string;
  filterInfo?: unknown;
}

export interface SeriesItem {
  fieldId: string;
  rollup: Rollup;
}

export interface DataCondition {
  tableId: string;
  dataRange?: DataRange;
  series?: SeriesItem[] | 'COUNTA';
}

export interface CustomConfig {
  title: string;
  currentLabel: string;
  targetLabel: string;
  accentColor: string;
  showDetail: boolean;
}

export interface PluginConfig {
  dataConditions: DataCondition | DataCondition[];
  customConfig: CustomConfig;
}

export interface ValueSourceForm {
  tableId: string;
  dataRangeKey: string;
  valueMode: 'FIELD' | 'COUNT';
  fieldId: string;
  rollup: Rollup;
}

export interface FormState {
  current: ValueSourceForm;
  target: ValueSourceForm;
  title: string;
  currentLabel: string;
  targetLabel: string;
  accentColor: string;
  showDetail: boolean;
}

export interface DataItem {
  value: string | number | null;
  text: string | null;
  groupKey?: string | null;
}

export type DashboardData = DataItem[][];

export interface GaugeDatum {
  current: number;
  target: number;
  rate: number | null;
}
