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
