"use client";

import { useMemo } from "react";

interface Signal {
  name: string;
  time: number[];
  voltage: number[];
  current: number[];
  power: number[];
}

export function WaveformViewer({ signal }: { signal: Signal }) {
  const data = useMemo(() => {
    if (signal.voltage.length > 0) {
      return {
        label: "Voltage (V)",
        values: signal.voltage,
        color: "#7C5CFC",
        yUnit: "V",
      };
    }
    if (signal.current.length > 0) {
      return {
        label: "Current (A)",
        values: signal.current,
        color: "#22C55E",
        yUnit: "A",
      };
    }
    if (signal.power.length > 0) {
      return {
        label: "Power (W)",
        values: signal.power,
        color: "#F59E0B",
        yUnit: "W",
      };
    }
    return null;
  }, [signal]);

  if (!data) return null;

  const isDC = signal.time.length <= 3;
  const width = 640;
  const height = 200;
  const pad = { top: 20, right: 20, bottom: 30, left: 50 };
  const pw = width - pad.left - pad.right;
  const ph = height - pad.top - pad.bottom;

  const xMin = Math.min(...signal.time);
  const xMax = Math.max(...signal.time);
  const xRange = xMax - xMin || 1;

  const yMin = Math.min(...data.values);
  const yMax = Math.max(...data.values);
  const yRange = yMax - yMin || 1;
  const yPad = yRange * 0.1 || 0.5;

  function x(v: number) {
    return pad.left + ((v - xMin) / xRange) * pw;
  }
  function y(v: number) {
    return pad.top + ph - ((v - (yMin - yPad)) / (yRange + 2 * yPad)) * ph;
  }

  const points = signal.time
    .map((t, i) => `${x(t).toFixed(1)},${y(data.values[i]).toFixed(1)}`)
    .join(" ");

  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks }, (_, i) => {
    return yMin - yPad + ((yRange + 2 * yPad) * i) / (yTicks - 1);
  });

  const xTicks = Math.min(5, signal.time.length);
  const xTickIndices =
    xTicks >= signal.time.length
      ? signal.time.map((_, i) => i)
      : Array.from({ length: xTicks }, (_, i) =>
          Math.round((i / (xTicks - 1)) * (signal.time.length - 1)),
        );

  return (
    <div className="rounded-lg border border-neutral-800 overflow-hidden">
      <div className="px-3 py-2 border-b border-neutral-800 flex items-center gap-2">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: data.color }}
        />
        <span className="text-xs font-medium text-neutral-300">{signal.name}</span>
        <span className="text-xs text-neutral-600 ml-2">{data.label}</span>
        {isDC && (
          <span className="text-xs text-[#7C5CFC] ml-auto font-mono">
            {data.values.length > 0 ? data.values[0]?.toPrecision(4) : "—"}
            {data.yUnit}
          </span>
        )}
      </div>
      <div className="p-3">
        {isDC && data.values.length > 0 ? (
          <div className="space-y-2">
            {data.values.map((v, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-neutral-600 font-mono w-16 text-right">
                  V({i})
                </span>
                <div className="flex-1 h-5 bg-neutral-950 rounded overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${Math.min(100, Math.max(0, (v / (yMax || 1)) * 100))}%`,
                      backgroundColor: data.color,
                      opacity: 0.7,
                    }}
                  />
                </div>
                <span className="text-xs text-neutral-400 font-mono w-20">
                  {v.toPrecision(4)} {data.yUnit}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full"
            style={{ maxHeight: height }}
          >
            {/* Grid */}
            {yTickValues.map((v) => (
              <g key={v}>
                <line
                  x1={pad.left}
                  y1={y(v)}
                  x2={width - pad.right}
                  y2={y(v)}
                  stroke="#1F2937"
                  strokeWidth={0.5}
                />
                <text
                  x={pad.left - 4}
                  y={y(v) + 4}
                  textAnchor="end"
                  className="text-[10px] fill-neutral-600 font-mono"
                >
                  {v.toPrecision(2)}
                </text>
              </g>
            ))}

            {/* X axis labels */}
            {xTickIndices.map((i) => (
              <text
                key={i}
                x={x(signal.time[i])}
                y={height - 6}
                textAnchor="middle"
                className="text-[10px] fill-neutral-600 font-mono"
              >
                {Number(signal.time[i]).toPrecision(2)}
              </text>
            ))}

            {/* Axes */}
            <line
              x1={pad.left}
              y1={pad.top}
              x2={pad.left}
              y2={height - pad.bottom}
              stroke="#374151"
              strokeWidth={1}
            />
            <line
              x1={pad.left}
              y1={height - pad.bottom}
              x2={width - pad.right}
              y2={height - pad.bottom}
              stroke="#374151"
              strokeWidth={1}
            />

            {/* Data polyline */}
            <polyline
              points={points}
              fill="none"
              stroke={data.color}
              strokeWidth={1.5}
              strokeLinejoin="round"
            />

            {/* Data points */}
            {signal.time.map((t, i) => (
              <circle
                key={i}
                cx={x(t)}
                cy={y(data.values[i])}
                r={2}
                fill={data.color}
              />
            ))}

            {/* Y label */}
            <text
              x={10}
              y={height / 2}
              textAnchor="middle"
              transform={`rotate(-90, 10, ${height / 2})`}
              className="text-[10px] fill-neutral-500"
            >
              {data.label}
            </text>
          </svg>
        )}
      </div>
    </div>
  );
}
