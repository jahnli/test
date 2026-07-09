import { base, dashboard } from '@lark-base-open/js-sdk';
import { defaultCustomConfig, mockConfig, mockData } from './defaults';
import type {
  DashboardData,
  DashboardState,
  DataCondition,
  DataRange,
  FieldMeta,
  PluginConfig,
  TableMeta,
} from '../types/dashboard';

type Off = () => void;

interface LooseDashboard {
  state?: DashboardState;
  getCategories?: (tableId: string) => Promise<unknown>;
  getTableDataRange?: (tableId?: string) => Promise<unknown>;
  getConfig?: () => Promise<unknown>;
  saveConfig?: (config: PluginConfig) => Promise<boolean>;
  getData?: () => Promise<unknown>;
  getPreviewData?: (conditions: DataCondition | DataCondition[]) => Promise<unknown>;
  setRendered?: () => Promise<boolean>;
  onDataChange?: (handler: (event: { data: DashboardData }) => void) => Off;
  onConfigChange?: (handler: (event: { data: PluginConfig }) => void) => Off;
}

interface LooseBase {
  getTableList?: () => Promise<unknown>;
}

const dashboardApi = dashboard as unknown as LooseDashboard;
const baseApi = base as unknown as LooseBase;
const sdkTimeoutMs = 900;

async function withTimeout<T>(promise: Promise<T> | undefined, fallback: T): Promise<T> {
  if (!promise) {
    return fallback;
  }

  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      window.setTimeout(() => resolve(fallback), sdkTimeoutMs);
    }),
  ]);
}

function normalizeTableList(value: unknown): TableMeta[] {
  const source = Array.isArray(value)
    ? value
    : Array.isArray((value as { tables?: unknown[] })?.tables)
      ? (value as { tables: unknown[] }).tables
      : [];

  return source
    .map((item) => {
      const record = item as Record<string, unknown>;
      const id = record.id ?? record.tableId;
      const name = record.name ?? record.tableName;
      return {
        id: String(id ?? ''),
        name: String(name ?? '未命名数据表'),
      };
    })
    .filter((item) => item.id);
}

function normalizeFieldList(value: unknown): FieldMeta[] {
  const source = Array.isArray(value)
    ? value
    : Array.isArray((value as { fields?: unknown[] })?.fields)
      ? (value as { fields: unknown[] }).fields
      : [];

  return source
    .map((item) => {
      const record = item as Record<string, unknown>;
      const id = record.fieldId ?? record.id;
      const name = record.fieldName ?? record.name;
      return {
        fieldId: String(id ?? ''),
        fieldName: String(name ?? '未命名字段'),
        fieldType: record.fieldType as string | number | undefined,
      };
    })
    .filter((item) => item.fieldId);
}

function normalizeRanges(value: unknown): DataRange[] {
  const source = Array.isArray(value)
    ? value
    : Array.isArray((value as { ranges?: unknown[] })?.ranges)
      ? (value as { ranges: unknown[] }).ranges
      : [];

  const ranges = source.map((item) => item as DataRange).filter((item) => item.type);
  return ranges.length > 0 ? ranges : [{ type: 'ALL' }];
}

function normalizeConfig(value: unknown): PluginConfig {
  const config = value as Partial<PluginConfig> | undefined;

  return {
    dataConditions: {
      tableId: config?.dataConditions?.tableId ?? '',
      dataRange: config?.dataConditions?.dataRange,
      series: config?.dataConditions?.series,
    },
    customConfig: {
      ...defaultCustomConfig,
      ...config?.customConfig,
    },
  };
}

export function getDashboardState(): DashboardState {
  const forcedState = new URLSearchParams(window.location.search).get('state');
  if (forcedState === 'Create' || forcedState === 'Config' || forcedState === 'View' || forcedState === 'FullScreen') {
    return forcedState;
  }

  return dashboardApi.state ?? 'Config';
}

export async function getTables() {
  try {
    const tables = await withTimeout(baseApi.getTableList?.(), []);
    const normalized = normalizeTableList(tables);
    if (normalized.length > 0) {
      return normalized;
    }
  } catch {
    // Local browser preview runs outside the Feishu host iframe.
  }

  return [{ id: 'mock-table', name: '示例数据表' }];
}

export async function getFields(tableId: string) {
  try {
    const fields = await withTimeout(dashboardApi.getCategories?.(tableId), []);
    const normalized = normalizeFieldList(fields);
    if (normalized.length > 0) {
      return normalized;
    }
  } catch {
    // Local browser preview runs outside the Feishu host iframe.
  }

  return [
    { fieldId: 'current', fieldName: '当前' },
    { fieldId: 'target', fieldName: '目标' },
  ];
}

export async function getRanges(tableId: string) {
  try {
    const ranges = await withTimeout(dashboardApi.getTableDataRange?.(tableId), [{ type: 'ALL' }]);
    return normalizeRanges(ranges);
  } catch {
    // Local browser preview runs outside the Feishu host iframe.
  }

  return [{ type: 'ALL' }];
}

export async function getConfig() {
  try {
    const config = await withTimeout(dashboardApi.getConfig?.(), mockConfig);
    return normalizeConfig(config);
  } catch {
    return mockConfig;
  }
}

export async function saveConfig(config: PluginConfig) {
  try {
    return await withTimeout(dashboardApi.saveConfig?.(config), true);
  } catch {
    return true;
  }
}

export async function getData() {
  try {
    const data = await withTimeout(dashboardApi.getData?.(), mockData);
    return (data as DashboardData) ?? mockData;
  } catch {
    return mockData;
  }
}

export async function getPreviewData(condition: DataCondition) {
  try {
    const data = await withTimeout(dashboardApi.getPreviewData?.(condition), mockData);
    return (data as DashboardData) ?? mockData;
  } catch {
    return mockData;
  }
}

export async function setRendered() {
  try {
    return await withTimeout(dashboardApi.setRendered?.(), true);
  } catch {
    return true;
  }
}

export function onDataChange(handler: (data: DashboardData) => void) {
  try {
    return dashboardApi.onDataChange?.((event) => handler(event.data)) ?? (() => undefined);
  } catch {
    return () => undefined;
  }
}

export function onConfigChange(handler: (config: PluginConfig) => void) {
  try {
    return dashboardApi.onConfigChange?.((event) => handler(normalizeConfig(event.data))) ?? (() => undefined);
  } catch {
    return () => undefined;
  }
}
