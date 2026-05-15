import { useState, useRef, useCallback } from 'react';
import { getSchema, getRelationships } from '../lib/database';
import Icon from './Icon';

const COL_H = 26;
const HDR_H = 36;
const TBL_W = 180;
const COLS_PER_ROW = 3;
const GAP_X = 80;
const GAP_Y = 60;
const PAD = 32;

function layoutTables(tables) {
  // First pass: compute each table's height
  const withH = tables.map((tbl) => ({
    ...tbl,
    w: TBL_W,
    h: HDR_H + tbl.columns.length * COL_H + 1,
  }));

  // Second pass: compute row max-heights so rows don't overlap
  const rows = [];
  for (let i = 0; i < withH.length; i += COLS_PER_ROW) {
    rows.push(withH.slice(i, i + COLS_PER_ROW));
  }

  let curY = PAD;
  const placed = [];
  for (const row of rows) {
    const maxH = Math.max(...row.map((t) => t.h));
    row.forEach((tbl, ci) => {
      placed.push({ ...tbl, x: PAD + ci * (TBL_W + GAP_X), y: curY });
    });
    curY += maxH + GAP_Y;
  }
  return placed;
}

function getColY(tbl, colName) {
  const idx = tbl.columns.findIndex((c) => c.col === colName);
  const row = idx >= 0 ? idx : 0;
  return tbl.y + HDR_H + row * COL_H + COL_H / 2;
}

// Inline key icon for SVG (React Icon can't be used inside SVG text)
function KeyIcon({ x, y, size = 12 }) {
  const s = size / 24;
  return (
    <g transform={`translate(${x}, ${y - size * 0.75}) scale(${s})`} stroke="#e3b341" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
    </g>
  );
}

export default function ERDiagram({ onClose }) {
  const schema = getSchema();
  const rels = getRelationships();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null);

  const tables = layoutTables(schema);
  const tblMap = Object.fromEntries(tables.map((t) => [t.name, t]));

  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    setDragging(true);
    dragRef.current = { startX: e.clientX - pan.x, startY: e.clientY - pan.y };
  }, [pan]);

  const onMouseMove = useCallback((e) => {
    if (!dragging || !dragRef.current) return;
    setPan({ x: e.clientX - dragRef.current.startX, y: e.clientY - dragRef.current.startY });
  }, [dragging]);

  const onMouseUp = useCallback(() => setDragging(false), []);

  const zoomIn = () => setZoom((z) => Math.min(2, +(z + 0.15).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.3, +(z - 0.15).toFixed(2)));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // SVG color tokens (use CSS vars — they work in inline SVG)
  const C = {
    headerBg: '#3b82f6',
    headerText: '#ffffff',
    bodyBg: 'var(--bg1)',
    border: 'var(--border)',
    colText: 'var(--text1)',
    mutedText: 'var(--text2)',
    pkText: '#d97706',
    fkLine: '#60a5fa',
    fkDot: '#3b82f6',
    divider: 'var(--border2)',
  };

  return (
    <div className="er-overlay">
      <div className="er-header">
        <span className="er-title">ER 다이어그램</span>
        <div className="er-controls">
          <button className="er-btn" onClick={zoomOut} title="축소">
            <Icon name="minimize" style={{ width: 14, height: 14 }} />
          </button>
          <span className="er-zoom">{Math.round(zoom * 100)}%</span>
          <button className="er-btn" onClick={zoomIn} title="확대">
            <Icon name="maximize" style={{ width: 14, height: 14 }} />
          </button>
          <button className="er-btn" onClick={resetView} title="초기화">
            <Icon name="target" style={{ width: 14, height: 14 }} />
          </button>
          <button className="er-btn er-btn-close" onClick={onClose} title="닫기">
            <Icon name="close" style={{ width: 14, height: 14 }} />
            닫기
          </button>
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
          width="100%"
          height="100%"
          style={{ display: 'block' }}
        >
          <defs>
            <marker id="er-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={C.fkDot} />
            </marker>
            <marker id="er-dot" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <circle cx="3" cy="3" r="2.5" fill={C.fkDot} />
            </marker>
          </defs>

          <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
            {/* FK relationship lines */}
            {rels.map((rel, i) => {
              const fromTbl = tblMap[rel.from];
              const toTbl = tblMap[rel.to];
              if (!fromTbl || !toTbl) return null;
              const fy = getColY(fromTbl, rel.fromCol);
              const ty = getColY(toTbl, rel.toCol);
              const fromCX = fromTbl.x + fromTbl.w / 2;
              const toCX = toTbl.x + toTbl.w / 2;
              let x1, x2;
              if (fromCX <= toCX) {
                x1 = fromTbl.x + fromTbl.w; x2 = toTbl.x;
              } else {
                x1 = fromTbl.x; x2 = toTbl.x + toTbl.w;
              }
              const mx = (x1 + x2) / 2;
              return (
                <path
                  key={i}
                  d={`M ${x1} ${fy} C ${mx} ${fy} ${mx} ${ty} ${x2} ${ty}`}
                  fill="none"
                  stroke={C.fkLine}
                  strokeWidth={1.5}
                  strokeDasharray="6,3"
                  opacity={0.8}
                  markerStart="url(#er-dot)"
                  markerEnd="url(#er-arrow)"
                />
              );
            })}

            {/* Table boxes */}
            {tables.map((tbl) => {
              const fkCols = new Set(
                rels.filter((r) => r.from === tbl.name).map((r) => r.fromCol)
              );
              return (
                <g key={tbl.name}>
                  {/* Drop shadow */}
                  <rect
                    x={tbl.x + 3} y={tbl.y + 3}
                    width={tbl.w} height={tbl.h}
                    rx={8} fill="rgba(0,0,0,0.08)"
                  />
                  {/* Body */}
                  <rect
                    x={tbl.x} y={tbl.y}
                    width={tbl.w} height={tbl.h}
                    rx={8}
                    fill={C.bodyBg}
                    stroke={C.border}
                    strokeWidth={1.5}
                  />
                  {/* Header background */}
                  <rect
                    x={tbl.x} y={tbl.y}
                    width={tbl.w} height={HDR_H}
                    rx={8} fill={C.headerBg}
                  />
                  {/* Cover header bottom corners (make header flat at bottom) */}
                  <rect
                    x={tbl.x} y={tbl.y + HDR_H - 8}
                    width={tbl.w} height={8}
                    fill={C.headerBg}
                  />
                  {/* Header text */}
                  <text
                    x={tbl.x + TBL_W / 2}
                    y={tbl.y + HDR_H / 2 + 5}
                    textAnchor="middle"
                    fontSize={13}
                    fontWeight="700"
                    fontFamily="system-ui, sans-serif"
                    fill={C.headerText}
                    letterSpacing="0.3"
                  >
                    {tbl.name}
                  </text>

                  {/* Columns */}
                  {tbl.columns.map((col, ci) => {
                    const cy = tbl.y + HDR_H + ci * COL_H;
                    const isPK = col.col === 'id';
                    const isFK = fkCols.has(col.col);
                    const isLast = ci === tbl.columns.length - 1;
                    const textColor = isPK ? C.pkText : C.colText;
                    return (
                      <g key={col.col}>
                        {/* Row separator */}
                        {ci > 0 && (
                          <line
                            x1={tbl.x + 1} y1={cy}
                            x2={tbl.x + tbl.w - 1} y2={cy}
                            stroke={C.divider}
                            strokeWidth={0.5}
                            opacity={0.5}
                          />
                        )}
                        {/* Even row shading */}
                        {ci % 2 === 1 && (
                          <rect
                            x={tbl.x + 1} y={cy}
                            width={tbl.w - 2}
                            height={COL_H}
                            fill="rgba(0,0,0,0.025)"
                            rx={isLast ? 7 : 0}
                          />
                        )}
                        {/* PK key icon */}
                        {isPK && <KeyIcon x={tbl.x + 10} y={cy + COL_H / 2 + 1} size={12} />}
                        {/* FK link icon */}
                        {isFK && !isPK && (
                          <g transform={`translate(${tbl.x + 10}, ${cy + COL_H / 2 - 6}) scale(0.5)`}
                            stroke="#60a5fa" strokeWidth="2" fill="none" strokeLinecap="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                          </g>
                        )}
                        {/* Column name */}
                        <text
                          x={tbl.x + (isPK || isFK ? 26 : 12)}
                          y={cy + COL_H / 2 + 4}
                          fontSize={11}
                          fontFamily="system-ui, sans-serif"
                          fill={textColor}
                          fontWeight={isPK ? '700' : '400'}
                        >
                          {col.col}
                        </text>
                        {/* Column type */}
                        <text
                          x={tbl.x + tbl.w - 8}
                          y={cy + COL_H / 2 + 4}
                          textAnchor="end"
                          fontSize={9}
                          fontFamily="monospace, system-ui"
                          fill={C.mutedText}
                          opacity={0.8}
                        >
                          {col.type}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className="er-legend">
        <svg width="12" height="12">
          <circle cx="6" cy="6" r="4" fill="#d97706" />
        </svg>
        <span>PK</span>
        <svg width="14" height="10">
          <line x1="0" y1="5" x2="14" y2="5" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="4,2" />
        </svg>
        <span>FK 관계</span>
        <svg width="12" height="12">
          <path d="M3 6a3 3 0 0 0 4.24.36l1.5-1.5A3 3 0 0 0 4.5 1.26L3.64 2.12" stroke="#60a5fa" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
        <span>외래키</span>
      </div>
    </div>
  );
}
