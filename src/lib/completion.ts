import type { DashboardData, GaugeDatum } from '../types/dashboard';

export function getCompletionRate(current: number, target: number) {
  if (!Number.isFinite(current) || !Number.isFinite(target) || target === 0) {
    return null;
  }

  return target >= 0 ? current / target : 2 - current / target;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(rate: number | null) {
  if (rate === null) {
    return '--';
  }

  return `${Math.round(rate * 100)}%`;
}

export function parseNumber(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.replace(/[%¥,\s]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function dataToGaugeDatum(data: DashboardData): GaugeDatum | null {
  const numericValues = data
    .flat()
    .map((item) => parseNumber(item.value ?? item.text))
    .filter((value): value is number => value !== null);

  if (numericValues.length < 2) {
    return null;
  }

  const [current, target] = numericValues;
  return {
    current,
    target,
    rate: getCompletionRate(current, target),
  };
}

export function firstNumericValue(data: DashboardData) {
  return (
    data
      .flat()
      .map((item) => parseNumber(item.value ?? item.text))
      .find((value): value is number => value !== null) ?? null
  );
}

export function composeGaugeData(currentData: DashboardData, targetData: DashboardData): DashboardData {
  const current = firstNumericValue(currentData);
  const target = firstNumericValue(targetData);

  if (current === null || target === null) {
    return [];
  }

  return [
    [
      { value: '当前', text: '当前' },
      { value: '目标', text: '目标' },
    ],
    [
      { value: current, text: formatNumber(current) },
      { value: target, text: formatNumber(target) },
    ],
  ];
}
