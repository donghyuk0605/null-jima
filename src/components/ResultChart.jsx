import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const COLORS = ['#388bfd','#3fb950','#f78166','#e3b341','#bc8cff','#39d353','#ff7b72','#79c0ff'];

function BarChart({ labels, values, width = 500, height = 260 }) {
  const maxVal = Math.max(...values, 1);
  const barW = Math.max(20, Math.min(60, (width - 80) / labels.length - 8));
  const chartH = height - 60;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      {/* Y axis gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = 20 + chartH * (1 - t);
        const val = maxVal * t;
        return (
          <g key={t}>
            <line x1={50} y1={y} x2={width - 10} y2={y} stroke="var(--border)" strokeDasharray="3,3" />
            <text x={44} y={y + 4} textAnchor="end" fontSize={10} fill="var(--text3)">
              {val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : val >= 1000 ? `${(val/1000).toFixed(0)}K` : Number.isInteger(val) ? val : val.toFixed(1)}
            </text>
          </g>
        );
      })}
      {/* Bars */}
      {labels.map((label, i) => {
        const barH = (values[i] / maxVal) * chartH;
        const x = 56 + i * ((width - 66) / labels.length);
        const y = 20 + chartH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill={COLORS[i % COLORS.length]} rx={3} opacity={0.85} />
            <text x={x + barW / 2} y={height - 8} textAnchor="middle" fontSize={10} fill="var(--text2)"
              style={{ maxWidth: barW }}>
              {String(label).length > 8 ? String(label).slice(0, 7) + '…' : label}
            </text>
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={10} fill="var(--text1)" fontWeight="600">
              {values[i] >= 1000000 ? `${(values[i]/1000000).toFixed(1)}M` : values[i] >= 1000 ? `${(values[i]/1000).toFixed(0)}K` : values[i]}
            </text>
          </g>
        );
      })}
      {/* X axis */}
      <line x1={50} y1={20 + chartH} x2={width - 10} y2={20 + chartH} stroke="var(--border)" />
    </svg>
  );
}

function LineChart({ labels, values, width = 500, height = 260 }) {
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;
  const chartH = height - 60;
  const chartW = width - 60;

  const points = labels.map((_, i) => ({
    x: 50 + (i / Math.max(labels.length - 1, 1)) * chartW,
    y: 20 + chartH - ((values[i] - minVal) / range) * chartH,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length-1].x} ${20 + chartH} L ${points[0].x} ${20 + chartH} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = 20 + chartH * (1 - t);
        const val = minVal + range * t;
        return (
          <g key={t}>
            <line x1={50} y1={y} x2={width - 10} y2={y} stroke="var(--border)" strokeDasharray="3,3" />
            <text x={44} y={y + 4} textAnchor="end" fontSize={10} fill="var(--text3)">
              {Number.isInteger(val) ? val : val.toFixed(1)}
            </text>
          </g>
        );
      })}
      <path d={areaD} fill={COLORS[0]} opacity={0.1} />
      <path d={pathD} fill="none" stroke={COLORS[0]} strokeWidth={2} strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill={COLORS[0]} stroke="var(--bg1)" strokeWidth={2} />
          <text x={p.x} y={height - 8} textAnchor="middle" fontSize={10} fill="var(--text2)">
            {String(labels[i]).length > 7 ? String(labels[i]).slice(0, 6) + '…' : labels[i]}
          </text>
        </g>
      ))}
      <line x1={50} y1={20 + chartH} x2={width - 10} y2={20 + chartH} stroke="var(--border)" />
    </svg>
  );
}

function PieChart({ labels, values, width = 340, height = 260 }) {
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const cx = 120, cy = height / 2, r = 90;
  const slices = values.reduce((acc, v, i) => {
    const startAngle = acc.angle;
    const sweep = (v / total) * 2 * Math.PI;
    const endAngle = startAngle + sweep;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const large = sweep > Math.PI ? 1 : 0;
    acc.items.push({ d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, color: COLORS[i % COLORS.length], label: labels[i], value: v, pct: ((v / total) * 100).toFixed(1) });
    return { angle: endAngle, items: acc.items };
  }, { angle: -Math.PI / 2, items: [] }).items;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
      {slices.map((s, i) => (
        <path key={i} d={s.d} fill={s.color} opacity={0.88} stroke="var(--bg1)" strokeWidth={1.5} />
      ))}
      {slices.map((s, i) => (
        <g key={i}>
          <rect x={cx + r + 16} y={16 + i * 22} width={12} height={12} rx={2} fill={s.color} />
          <text x={cx + r + 34} y={26 + i * 22} fontSize={11} fill="var(--text1)">
            {String(s.label).slice(0, 12)} ({s.pct}%)
          </text>
        </g>
      ))}
    </svg>
  );
}

function detectChartType(columns, values) {
  if (columns.length < 2) return null;
  const nums = values.map(r => Number(r[1])).filter(n => !isNaN(n));
  if (nums.length !== values.length) return null;
  const labels = values.map(r => r[0]);
  const looksLikeDate = labels.every(l => /\d{4}-\d{2}/.test(String(l)));
  if (looksLikeDate) return 'line';
  if (values.length <= 8) return 'pie';
  return 'bar';
}

export default function ResultChart({ columns, values }) {
  const { t } = useLanguage();
  const autoType = detectChartType(columns, values);
  const [chartType, setChartType] = useState(autoType || 'bar');

  if (!autoType) return (
    <div className="chart-no-data">{t('result.chart.nodata')}</div>
  );

  const labels = values.map(r => r[0]);
  const nums = values.map(r => Number(r[1]));

  return (
    <div className="result-chart">
      <div className="chart-toolbar">
        <span className="chart-col-info">{columns[0]} × {columns[1]}</span>
        <div className="chart-type-btns">
          {['bar','line','pie'].map(t => (
            <button key={t} className={`chart-type-btn ${chartType === t ? 'active' : ''}`} onClick={() => setChartType(t)}>
              {t === 'bar' ? '▌▌' : t === 'line' ? '📈' : '●'}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-area">
        {chartType === 'bar' && <BarChart labels={labels} values={nums} />}
        {chartType === 'line' && <LineChart labels={labels} values={nums} />}
        {chartType === 'pie' && <PieChart labels={labels} values={nums} />}
      </div>
    </div>
  );
}
