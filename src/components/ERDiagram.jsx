import { useState, useRef } from 'react';
import { getSchema, getRelationships } from '../lib/database';

const COL_H = 24;
const HDR_H = 32;
const TBL_W = 160;
const PAD = 40;

function layoutTables(tables) {
  const cols = Math.ceil(Math.sqrt(tables.length));
  return tables.map((tbl, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const h = HDR_H + tbl.columns.length * COL_H + 8;
    return {
      ...tbl,
      x: PAD + col * (TBL_W + PAD * 2),
      y: PAD + row * (h + PAD),
      w: TBL_W,
      h,
    };
  });
}

function getColY(tbl, colName) {
  const idx = tbl.columns.findIndex(c => c.col === colName);
  return tbl.y + HDR_H + (idx >= 0 ? idx * COL_H + COL_H / 2 : COL_H / 2);
}

export default function ERDiagram({ onClose }) {
  const schema = getSchema();
  const rels = getRelationships();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const svgRef = useRef(null);

  const tables = layoutTables(schema);
  const totalW = tables.reduce((m, t) => Math.max(m, t.x + t.w + PAD), 400);
  const totalH = tables.reduce((m, t) => Math.max(m, t.y + t.h + PAD), 300);

  const tblMap = Object.fromEntries(tables.map(t => [t.name, t]));

  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const onMouseMove = (e) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const onMouseUp = () => setDragging(false);

  return (
    <div className="er-overlay">
      <div className="er-header">
        <span className="er-title">ER 다이어그램</span>
        <div className="er-controls">
          <button className="er-btn" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>+</button>
          <span className="er-zoom">{Math.round(zoom * 100)}%</span>
          <button className="er-btn" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}>-</button>
          <button className="er-btn" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>리셋</button>
          <button className="er-btn er-btn-close" onClick={onClose}>✕ 닫기</button>
        </div>
      </div>
      <div
        className="er-canvas"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
      >
        <svg
          ref={svgRef}
          width={totalW * zoom}
          height={totalH * zoom}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px)`, transformOrigin: '0 0' }}
        >
          <g transform={`scale(${zoom})`}>
            {/* Relationship lines */}
            {rels.map((rel, i) => {
              const fromTbl = tblMap[rel.from];
              const toTbl = tblMap[rel.to];
              if (!fromTbl || !toTbl) return null;
              const x1 = fromTbl.x + fromTbl.w;
              const y1 = getColY(fromTbl, rel.fromCol);
              const x2 = toTbl.x;
              const y2 = getColY(toTbl, rel.toCol);
              const mx = (x1 + x2) / 2;
              return (
                <g key={i}>
                  <path
                    d={`M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`}
                    fill="none" stroke="#388bfd" strokeWidth={1.5} strokeDasharray="5,3" opacity={0.7}
                  />
                  <circle cx={x1} cy={y1} r={3} fill="#388bfd" />
                  <polygon points={`${x2},${y2} ${x2+8},${y2-4} ${x2+8},${y2+4}`} fill="#388bfd" />
                </g>
              );
            })}
            {/* Tables */}
            {tables.map(tbl => (
              <g key={tbl.name}>
                {/* Header */}
                <rect x={tbl.x} y={tbl.y} width={tbl.w} height={tbl.h} rx={6}
                  fill="var(--bg1)" stroke="var(--border)" strokeWidth={1.5} />
                <rect x={tbl.x} y={tbl.y} width={tbl.w} height={HDR_H} rx={6}
                  fill="#388bfd" opacity={0.85} />
                <rect x={tbl.x} y={tbl.y + 20} width={tbl.w} height={HDR_H - 20}
                  fill="#388bfd" opacity={0.85} />
                <text x={tbl.x + tbl.w / 2} y={tbl.y + 20} textAnchor="middle"
                  fontSize={12} fontWeight="700" fill="#fff">
                  {tbl.name}
                </text>
                {/* Columns */}
                {tbl.columns.map((col, ci) => {
                  const cy = tbl.y + HDR_H + ci * COL_H;
                  const isPK = col.col === 'id';
                  return (
                    <g key={col.col}>
                      <line x1={tbl.x} y1={cy} x2={tbl.x + tbl.w} y2={cy}
                        stroke="var(--border2)" strokeWidth={0.5} />
                      <text x={tbl.x + 10} y={cy + 16} fontSize={11}
                        fill={isPK ? '#e3b341' : 'var(--text1)'} fontWeight={isPK ? '700' : 'normal'}>
                        {isPK ? '🔑 ' : ''}{col.col}
                      </text>
                      <text x={tbl.x + tbl.w - 6} y={cy + 16} textAnchor="end"
                        fontSize={9} fill="var(--text3)">
                        {col.type}
                      </text>
                    </g>
                  );
                })}
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
