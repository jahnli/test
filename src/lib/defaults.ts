import type { CustomConfig, DashboardData, FormState, Rollup } from '../types/dashboard';

export const rollupOptions: Array<{ label: string; value: Rollup }> = [
  { label: '求和', value: 'SUM' },
  { label: '平均值', value: 'AVERAGE' },
  { label: '计数', value: 'COUNTA' },
  { label: '最大值', value: 'MAX' },
  { label: '最小值', value: 'MIN' },
];

export const defaultCustomConfig: CustomConfig = {
  title: '目标完成率',
  currentLabel: '当前',
  targetLabel: '目标',
  accentColor: '#25A8FF',
  showDetail: true,
};

export const defaultFormState: FormState = {
  tableId: '',
  dataRangeKey: 'ALL',
  currentFieldId: '',
  targetFieldId: '',
  rollup: 'SUM',
  title: defaultCustomConfig.title,
  currentLabel: defaultCustomConfig.currentLabel,
  targetLabel: defaultCustomConfig.targetLabel,
  accentColor: defaultCustomConfig.accentColor,
  showDetail: defaultCustomConfig.showDetail,
};

export const emptyData: DashboardData = [];
