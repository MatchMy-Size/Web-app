import type { CSSProperties } from 'react';

import menFigure from '@/assets/images/menfigure-clean.png';
import womenFigure from '@/assets/images/womenfigure-clean.png';
import type { CustomerGender, MeasurementFieldKey } from '@/lib/measurement';

type Crop = { scale: number; x: string; y: string };

const CROPS: Record<MeasurementFieldKey, Crop> = {
  neck: { scale: 2.5, x: '50%', y: '11%' },
  chest: { scale: 2.15, x: '50%', y: '26%' },
  bust: { scale: 2.15, x: '50%', y: '27%' },
  shoulder: { scale: 2.2, x: '50%', y: '20%' },
  sleeve: { scale: 1.9, x: '69%', y: '31%' },
  length: { scale: 1.75, x: '38%', y: '34%' },
  waist: { scale: 2.1, x: '50%', y: '43%' },
  hip: { scale: 2, x: '50%', y: '50%' },
  thigh: { scale: 2.05, x: '40%', y: '57%' },
  inseam: { scale: 1.5, x: '50%', y: '70%' },
  outseam: { scale: 1.5, x: '68%', y: '68%' },
};

function ActiveMeasurement({ field }: { field: MeasurementFieldKey }) {
  const common = { fill: 'none', stroke: '#496657', strokeWidth: 12, strokeLinecap: 'round' as const };
  const line = (x1: number, y1: number, x2: number, y2: number) => (
    <line {...common} x1={x1} y1={y1} x2={x2} y2={y2} markerStart="url(#guide-arrow-start)" markerEnd="url(#guide-arrow-end)" />
  );
  const ellipse = (cx: number, cy: number, rx: number, ry: number) => (
    <ellipse {...common} cx={cx} cy={cy} rx={rx} ry={ry} strokeDasharray="22 15" />
  );

  switch (field) {
    case 'neck': return ellipse(512, 218, 76, 28);
    case 'chest': return ellipse(512, 418, 188, 48);
    case 'bust': return ellipse(512, 420, 180, 50);
    case 'shoulder': return line(330, 302, 694, 302);
    case 'sleeve': return line(684, 315, 757, 708);
    case 'length': return line(350, 304, 376, 650);
    case 'waist': return ellipse(512, 650, 158, 40);
    case 'hip': return ellipse(512, 758, 186, 45);
    case 'thigh': return ellipse(417, 865, 90, 36);
    case 'inseam': return line(512, 810, 535, 1382);
    case 'outseam': return line(674, 690, 682, 1382);
  }
}

export function MeasurementFigureGuide({
  gender,
  field,
  label,
  className = '',
}: {
  gender: CustomerGender;
  field: MeasurementFieldKey;
  label: string;
  className?: string;
}) {
  const crop = CROPS[field];
  const stageStyle = {
    '--measurement-scale': crop.scale,
    '--measurement-origin': `${crop.x} ${crop.y}`,
  } as CSSProperties;

  return (
    <div className={`measurement-figure-guide ${className}`.trim()}>
      <div className="measurement-guide-stage" style={stageStyle}>
        <img src={gender === 'women' ? womenFigure : menFigure} alt="" aria-hidden="true" />
        <svg viewBox="0 0 1024 1536" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${label} measurement guide`}>
          <defs>
            <filter id="guide-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="22" />
            </filter>
            <marker id="guide-arrow-start" viewBox="0 0 10 10" refX="4" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M10 0 0 5l10 5Z" fill="#496657" />
            </marker>
            <marker id="guide-arrow-end" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 10 5 0 10Z" fill="#496657" />
            </marker>
          </defs>
          <g opacity=".22" filter="url(#guide-glow)" stroke="#7A9E78" strokeWidth="58"><ActiveMeasurement field={field} /></g>
          <ActiveMeasurement field={field} />
        </svg>
      </div>
      <span className="measurement-guide-label">{label}</span>
    </div>
  );
}
