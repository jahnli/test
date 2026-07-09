import { useEffect } from 'react';
import { formatNumber, formatPercent } from '../lib/completion';
import { setRendered } from '../lib/sdk';
import type { CustomConfig, GaugeDatum } from '../types/dashboard';

interface GaugeChartProps {
  datum: GaugeDatum | null;
  config: CustomConfig;
  fullScreen?: boolean;
}

function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

export function GaugeChart({ datum, config, fullScreen = false }: GaugeChartProps) {
  const rate = datum?.rate ?? null;
  const progress = rate === null ? 0 : Math.min(Math.max(rate, 0), 1);
  const current = datum ? formatNumber(datum.current) : '--';
  const target = datum ? formatNumber(datum.target) : '--';
  const startAngle = 160;
  const endAngle = 380;
  const progressAngle = startAngle + (endAngle - startAngle) * progress;
  const trackPath = describeArc(150, 145, 112, startAngle, endAngle);
  const progressPath = describeArc(150, 145, 112, startAngle, progressAngle);

  useEffect(() => {
    void setRendered();
  }, [datum, config]);

  return (
    <section className={`gauge-card ${fullScreen ? 'is-fullscreen' : ''}`}>
      <div className="gauge-stage" aria-label={`完成率 ${formatPercent(rate)}`}>
        <svg className="gauge-svg" viewBox="0 0 300 240" role="img">
          <path className="gauge-track" d={trackPath} fill="none" pathLength="100" />
          <path
            className="gauge-progress"
            d={progressPath}
            fill="none"
            pathLength="100"
            stroke={config.accentColor}
          />
        </svg>
        <div className="gauge-value">{formatPercent(rate)}</div>
      </div>

      {config.showDetail ? (
        <div className="gauge-detail">
          <span className="detail-current">
            {config.currentLabel} {current}
          </span>
          <span className="detail-separator" />
          <span className="detail-target">
            {config.targetLabel} {target}
          </span>
        </div>
      ) : null}
    </section>
  );
}
