import { defaultCustomConfig, defaultFormState } from './defaults';
import type { DataRange, FormState, PluginConfig } from '../types/dashboard';

export function rangeToKey(range?: DataRange) {
  if (!range || range.type === 'ALL') {
    return 'ALL';
  }

  return range.viewId ? `VIEW:${range.viewId}` : range.type;
}

export function rangeFromKey(key: string, ranges: DataRange[]) {
  if (key === 'ALL') {
    return ranges.find((range) => range.type === 'ALL') ?? { type: 'ALL' };
  }

  if (key.startsWith('VIEW:')) {
    const viewId = key.replace('VIEW:', '');
    return ranges.find((range) => range.viewId === viewId) ?? { type: 'VIEW', viewId };
  }

  return ranges.find((range) => range.type === key);
}

export function configToForm(config?: Partial<PluginConfig>): FormState {
  const condition = Array.isArray(config?.dataConditions) ? config?.dataConditions[0] : config?.dataConditions;
  const custom = {
    ...defaultCustomConfig,
    ...config?.customConfig,
  };

  const series = Array.isArray(condition?.series) ? condition?.series : [];

  return {
    ...defaultFormState,
    tableId: condition?.tableId ?? '',
    dataRangeKey: rangeToKey(condition?.dataRange),
    currentFieldId: series[0]?.fieldId ?? '',
    targetFieldId: series[1]?.fieldId ?? '',
    rollup: series[0]?.rollup ?? 'SUM',
    title: custom.title,
    currentLabel: custom.currentLabel,
    targetLabel: custom.targetLabel,
    accentColor: custom.accentColor,
    showDetail: custom.showDetail,
  };
}

export function formToConfig(form: FormState, ranges: DataRange[]): PluginConfig {
  return {
    dataConditions: {
      tableId: form.tableId,
      dataRange: rangeFromKey(form.dataRangeKey, ranges),
      series: [
        {
          fieldId: form.currentFieldId,
          rollup: form.rollup,
        },
        {
          fieldId: form.targetFieldId,
          rollup: form.rollup,
        },
      ],
    },
    customConfig: {
      title: form.title,
      currentLabel: form.currentLabel,
      targetLabel: form.targetLabel,
      accentColor: form.accentColor,
      showDetail: form.showDetail,
    },
  };
}
