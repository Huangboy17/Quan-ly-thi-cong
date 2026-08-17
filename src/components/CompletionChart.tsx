import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  LabelList
} from 'recharts';
import { BarChart3, Percent, CheckCircle2, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { Project } from '../types';
import { calculateCompletionQuartiles, getProjectCompletionPercentage } from '../utils/helpers';

interface CompletionChartProps {
  projects: Project[];
  selectedQuartile: string | null;
  onSelectQuartile: (quartileRange: string | null) => void;
}

export const CompletionChart: React.FC<CompletionChartProps> = ({
  projects,
  selectedQuartile,
  onSelectQuartile,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const quartiles = calculateCompletionQuartiles(projects);

  const totalProjects = projects.length;
  const averageCompletion = totalProjects > 0
    ? Math.round(
        projects.reduce((acc, p) => acc + getProjectCompletionPercentage(p), 0) / totalProjects
      )
    : 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs space-y-1">
          <div className="font-bold text-amber-300 flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5" />
            <span>Khoảng: {data.range}</span>
          </div>
          <p className="text-slate-300 font-medium">{data.quartileName}</p>
          <div className="pt-1 border-t border-slate-700 flex justify-between gap-4">
            <span className="text-slate-400">Số dự án:</span>
            <span className="font-bold text-white">{data.count} dự án ({data.percentage}%)</span>
          </div>
          <p className="text-[10px] text-slate-400 italic mt-1">Nhiệm thu đã hoàn tất theo 8 mốc</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all">
      {/* Header */}
      <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-md">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              Phân Bổ Tỷ Lệ Hoàn Thành Nghiệm Thu (Quartile Distribution)
            </h3>
            <p className="text-[11px] text-slate-400">
              Phân nhóm 52+ công trình theo 4 khoảng tiến độ nghiệm thu 8 mốc chuẩn
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
            <span className="text-slate-400">Tỷ lệ hoàn thành TB:</span>
            <span className="font-black text-emerald-400 text-sm flex items-center gap-0.5">
              {averageCompletion}%
            </span>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition cursor-pointer"
            title={isCollapsed ? 'Mở rộng biểu đồ' : 'Thu gọn biểu đồ'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Chart Body */}
      {!isCollapsed && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
            {/* Summary Stat Cards */}
            <div className="lg:col-span-1 space-y-2.5">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Trung Bình Toàn Bộ Dự Án
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-blue-700">{averageCompletion}%</span>
                  <span className="text-xs font-semibold text-slate-600">8 Mốc QCQS</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${averageCompletion}%` }}
                  />
                </div>
              </div>

              {/* Quartile Legend & Quick Selector Buttons */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
                  <span>Khoảng Quartile</span>
                  <span>Số lượng</span>
                </div>
                {quartiles.map((q) => {
                  const isSelected = selectedQuartile === q.range;
                  return (
                    <button
                      key={q.range}
                      onClick={() =>
                        onSelectQuartile(isSelected ? null : q.range)
                      }
                      className={`w-full text-left p-2 rounded-lg border transition cursor-pointer flex items-center justify-between text-xs ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/80 shadow-sm ring-1 ring-blue-500 font-bold'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: q.color }}
                        />
                        <span className="font-semibold text-slate-800">{q.range}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-700">
                        {q.count} CT <span className="text-slate-400 font-normal">({q.percentage}%)</span>
                      </span>
                    </button>
                  );
                })}

                {selectedQuartile && (
                  <button
                    onClick={() => onSelectQuartile(null)}
                    className="w-full py-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline text-center cursor-pointer"
                  >
                    ✕ Bỏ lọc Quartile
                  </button>
                )}
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="lg:col-span-3 h-64 bg-slate-50/60 rounded-xl p-3 border border-slate-200 relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={quartiles}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="range"
                    tick={{ fill: '#475569', fontSize: 12, fontWeight: 700 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                    label={{
                      value: 'Số dự án',
                      angle: -90,
                      position: 'insideLeft',
                      fill: '#64748b',
                      fontSize: 11,
                      style: { textAnchor: 'middle' },
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.8)' }} />
                  <Bar
                    dataKey="count"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={60}
                    onClick={(entry) =>
                      onSelectQuartile(selectedQuartile === entry.range ? null : entry.range)
                    }
                    className="cursor-pointer"
                  >
                    <LabelList
                      dataKey="count"
                      position="top"
                      fill="#1e293b"
                      fontSize={12}
                      fontWeight="bold"
                      formatter={(val: number) => (val > 0 ? `${val} CT` : '')}
                    />
                    {quartiles.map((entry) => (
                      <Cell
                        key={`cell-${entry.range}`}
                        fill={entry.color}
                        opacity={selectedQuartile && selectedQuartile !== entry.range ? 0.35 : 1}
                        stroke={selectedQuartile === entry.range ? '#000' : 'none'}
                        strokeWidth={selectedQuartile === entry.range ? 2 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
