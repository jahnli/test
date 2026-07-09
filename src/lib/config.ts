import { defaultCustomConfig, defaultFormState } from './defaults';
import type { DataCondition, DataRange, FormState, PluginConfig, ValueSourceForm } from '../types/dashboard';

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

function sourceFromCondition(condition?: DataCondition): ValueSourceForm {
  const series = Array.isArray(condition?.series) ? condition.series : [];

  return {
    tableId: condition?.tableId ?? '',
    dataRangeKey: rangeToKey(condition?.dataRange),
    valueMode: condition?.series === 'COUNTA' ? 'COUNT' : 'FIELD',
    fieldId: series[0]?.fieldId ?? '',
    rollup: series[0]?.rollup ?? 'SUM',
  };
}

function conditionFromSource(source: ValueSourceForm, ranges: DataRange[]): DataCondition {
  return {
    tableId: source.tableId,
    dataRange: rangeFromKey(source.dataRangeKey, ranges),
    series:
      source.valueMode === 'COUNT'
        ? 'COUNTA'
        : [
            {
              fieldId: source.fieldId,
              rollup: source.rollup,
            },
          ],
  };
}

export function configToForm(config?: Partial<PluginConfig>): FormState {
  const conditions = Array.isArray(config?.dataConditions)
    ? config.dataConditions
    : config?.dataConditions
      ? [config.dataConditions]
      : [];
  const custom = {
    ...defaultCustomConfig,
    ...config?.customConfig,
  };

  const legacySeries = Array.isArray(conditions[0]?.series) ? conditions[0].series : [];
  const current: ValueSourceForm =
    conditions.length > 1
      ? sourceFromCondition(conditions[0])
      : {
          ...sourceFromCondition(conditions[0]),
          valueMode: 'FIELD' as const,
          fieldId: legacySeries[0]?.fieldId ?? '',
          rollup: legacySeries[0]?.rollup ?? 'SUM',
        };
  const target: ValueSourceForm =
    conditions.length > 1
      ? sourceFromCondition(conditions[1])
      : {
          ...sourceFromCondition(conditions[0]),
          valueMode: 'FIELD' as const,
          fieldId: legacySeries[1]?.fieldId ?? legacySeries[0]?.fieldId ?? '',
          rollup: legacySeries[1]?.rollup ?? legacySeries[0]?.rollup ?? 'SUM',
        };

  return {
    ...defaultFormState,
    current,
    target,
    title: custom.title,
    currentLabel: custom.currentLabel,
    targetLabel: custom.targetLabel,
    accentColor: custom.accentColor,
    showDetail: custom.showDetail,
  };
}

export function formToConfig(form: FormState, currentRanges: DataRange[], targetRanges: DataRange[]): PluginConfig {
  return {
    dataConditions: [
      conditionFromSource(form.current, currentRanges),
      conditionFromSource(form.target, targetRanges),
    ],
    customConfig: {
      title: form.title,
      currentLabel: form.currentLabel,
      targetLabel: form.targetLabel,
      accentColor: form.accentColor,
      showDetail: form.showDetail,
    },
  };
}
