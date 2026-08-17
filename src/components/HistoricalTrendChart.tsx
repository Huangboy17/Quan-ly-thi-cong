import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  Layers,
  ChevronUp,
  ChevronDown,
  Calendar,
  CheckCircle,
  FileCheck2,
  Info,
  Filter
} from 'lucide-react';
import { Project, MILESTONE_DEFINITIONS, MilestoneKey } from '../types';
import { calculateHistorical30DayTrends } from '../utils/helpers';

interface HistoricalTrendChartProps {
  projects: Project[];
}

type ChartViewMode = 'CUMULATIVE' | 'BOTTLENECK' | 'MILESTONE_BREAKDOWN';
type RangeDays = 30 | 14 | 7;

export const HistoricalTrendChart: React.FC<HistoricalTrendChartProps> = ({ projects }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<ChartViewMode>('BOTTLENECK');
  const [rangeDays, setRangeDays] = useState<RangeDays>(30);
  const [selectedMilestoneFilter, setSelectedMilestoneFilter] = useState<MilestoneKey | 'ALL'>('ALL');

  // Calculate 30 day trends
  const { points: allPoints, milestoneBottlenecks } = useMemo(() => {
    return calculateHistorical30DayTrends(projects);
  }, [projects]);

  // Filter trend points by selected range
  const filteredPoints = useMemo(() => {
    return allPoints.slice(allPoints.length - rangeDays);
  }, [allPoints, rangeDays]);

  // Calculate key 30-day bottleneck summary metrics
  const summaryMetrics = useMemo(() => {
    if (filteredPoints.length === 0) return { startQueue: 0, currentQueue: 0, delta: 0, maxDelayed: 0, avgDelayed: 0 };
    const startPoint = filteredPoints[0];
    const latestPoint = filteredPoints[filteredPoints.length - 1];

    const startQueue = startPoint.inSigningQueue;
    const currentQueue = latestPoint.inSigningQueue;
    const delta = currentQueue - startQueue;

    const maxDelayed = Math.max(...filteredPoints.map((p) => p.delayedOver7Days));
    const avgDelayed = Math.round(
      filteredPoints.reduce((sum, p) => sum + p.delayedOver7Days, 0) / filteredPoints.length
    );

    return {
      startQueue,
      currentQueue,
      delta,
      maxDelayed,
      avgDelayed,
      latestPoint,
    };
  }, [filteredPoints]);

  const topBottleneck = milestoneBottlenecks[0] || {
    label: 'M4. Chạy thử',
    code: 'M4_TC',
    delayedCount: 0,
    currentPending: 0,
    avgDaysPending: 0,
  };

  // Milestone line color palette
  const milestoneColors: Record<MilestoneKey, string> = {
    m1: '#ef4444', // Red (Phần thô)
    m2: '#f97316', // Orange (Vật tư ME)
    m3: '#eab308', // Yellow (Hoàn thành xây lắp)
    m4: '#06b6d4', // Cyan (Chạy thử - T&C)
    m5: '#3b82f6', // Blue (Vận hành)
    m6: '#8b5cf6', // Purple (PCCC/Giấy phép)
    m7: '#ec4899', // Pink (Bàn giao)
    m8: '#10b981', // Emerald (Thanh lý)
  };

  // Custom Tooltip Renderer
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-2 max-w-xs">
          <div className="flex justify-between items-center pb-1.5 border-b border-slate-700">
            <span className="font-bold text-amber-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Ngày {label} ({data.fullDate})
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700 font-mono">
              30-Day Trend
            </span>
          </div>

          {viewMode === 'CUMULATIVE' && (
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Tổng hồ sơ đã trình:</span>
                <span className="font-bold text-blue-400">{data.cumulativeSubmitted} mốc</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Tổng mốc đã ký duyệt:</span>
                <span className="font-bold text-emerald-400">{data.cumulativeSigned} mốc</span>
              </div>
              <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
                <span>Tồn đọng trong hàng chờ:</span>
                <span className="font-bold text-amber-400">{data.inSigningQueue} mốc</span>
              </div>
            </div>
          )}

          {viewMode === 'BOTTLENECK' && (
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Tổng hồ sơ đang trình ký:</span>
                <span className="font-bold text-amber-400">{data.inSigningQueue} hồ sơ</span>
              </div>
              <div className="flex justify-between text-rose-300 font-semibold bg-rose-950/60 p-1.5 rounded border border-rose-800/60">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  Chậm ký (&gt; 7 ngày):
                </span>
                <span className="font-bold text-rose-400">{data.delayedOver7Days} mốc</span>
              </div>
              <div className="pt-1 text-[11px] text-slate-400">
                Nút thắt lớn nhất: <span className="text-white font-bold">{data.topBottleneckLabel}</span>
              </div>
            </div>
          )}

          {viewMode === 'MILESTONE_BREAKDOWN' && (
            <div className="space-y-1 text-[11px]">
              <div className="font-semibold text-slate-300 pb-1 border-b border-slate-800">
                Hồ sơ đang tồn đọng theo từng mốc:
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {MILESTONE_DEFINITIONS.map((m) => {
                  const val = data[`${m.key}Pending` as keyof typeof data];
                  return (
                    <div key={m.key} className="flex justify-between text-slate-300">
                      <span className="truncate max-w-[100px]">{m.code}:</span>
                      <span
                        className="font-mono font-bold"
                        style={{ color: milestoneColors[m.key] }}
                      >
                        {val}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800 flex items-center justify-between">
            <span>Dữ liệu thực tế 8 mốc QCQS ME-CK</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="bg-gradient-to-br from-amber-500 to-rose-600 p-2 rounded-lg shadow-md">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              Xu Hướng Tiến Độ & Phân Tích Nút Thắt (Historical Completion Trends)
            </h3>
            <p className="text-[11px] text-slate-400">
              Theo dõi lịch sử 30 ngày gần nhất để phát hiện tắc nghẽn trong quy trình 8 mốc nghiệm thu
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Time Span Selector */}
          <div className="bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 flex text-xs">
            {([30, 14, 7] as RangeDays[]).map((d) => (
              <button
                key={d}
                onClick={() => setRangeDays(d)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  rangeDays === d
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {d} Ngày
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition cursor-pointer"
            title={isCollapsed ? 'Mở rộng biểu đồ trend' : 'Thu gọn biểu đồ trend'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-4 space-y-4">
          {/* Top Key Insight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Bottleneck #1 Stop */}
            <div className="bg-rose-50/80 border border-rose-200 p-3 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-rose-500 text-white rounded-lg shrink-0 shadow-sm">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                  Nút Thắt Lớn Nhất (Top Bottleneck)
                </span>
                <p className="text-sm font-black text-rose-950 truncate mt-0.5">
                  {topBottleneck.label}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-rose-800">
                  <span className="font-bold">{topBottleneck.delayedCount} mốc chậm &gt; 7d</span>
                  <span>•</span>
                  <span className="font-mono text-[11px]">TB {topBottleneck.avgDaysPending} ngày</span>
                </div>
              </div>
            </div>

            {/* Current Backlog Queue */}
            <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-lg shrink-0 shadow-sm">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                  Tồn Đọng Hàng Chờ Hiện Tại
                </span>
                <p className="text-xl font-black text-amber-950 mt-0.5">
                  {summaryMetrics.currentQueue} <span className="text-xs font-normal text-amber-800">hồ sơ</span>
                </p>
                <p className="text-[11px] text-amber-800 font-medium mt-1">
                  {summaryMetrics.delta > 0 ? (
                    <span className="text-rose-600 font-bold">▲ Tăng +{summaryMetrics.delta} hồ sơ ({rangeDays}d)</span>
                  ) : summaryMetrics.delta < 0 ? (
                    <span className="text-emerald-600 font-bold">▼ Giảm {summaryMetrics.delta} hồ sơ ({rangeDays}d)</span>
                  ) : (
                    <span className="text-slate-600 font-bold">▶ Không thay đổi ({rangeDays}d)</span>
                  )}
                </p>
              </div>
            </div>

            {/* Delayed Over 7 Days Peak */}
            <div className="bg-red-50/80 border border-red-200 p-3 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-red-600 text-white rounded-lg shrink-0 shadow-sm">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">
                  Đỉnh Điểm Chậm Ký (&gt;7 Ngày)
                </span>
                <p className="text-xl font-black text-red-950 mt-0.5">
                  {summaryMetrics.maxDelayed} <span className="text-xs font-normal text-red-800">mốc vi phạm</span>
                </p>
                <p className="text-[11px] text-red-800 font-medium mt-1">
                  Trung bình {summaryMetrics.avgDelayed} mốc trễ/ngày
                </p>
              </div>
            </div>

            {/* Total Signed Milestone Acceleration */}
            <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0 shadow-sm">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Tổng Mốc Đã Ký Tích Lũy
                </span>
                <p className="text-xl font-black text-emerald-950 mt-0.5">
                  {summaryMetrics.latestPoint?.cumulativeSigned || 0}{' '}
                  <span className="text-xs font-normal text-emerald-800">/ {summaryMetrics.latestPoint?.cumulativeSubmitted || 0} mốc</span>
                </p>
                <p className="text-[11px] text-emerald-800 font-medium mt-1">
                  Tỷ lệ duyệt thành công:{' '}
                  <span className="font-bold">
                    {summaryMetrics.latestPoint?.cumulativeSubmitted
                      ? Math.round(
                          (summaryMetrics.latestPoint.cumulativeSigned / summaryMetrics.latestPoint.cumulativeSubmitted) * 100
                        )
                      : 0}
                    %
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* View Mode Switching Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setViewMode('BOTTLENECK')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'BOTTLENECK'
                    ? 'bg-white text-rose-700 shadow-sm font-bold border border-rose-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Nút Thắt & Chậm Ký (&gt;7 Ngày)</span>
              </button>

              <button
                onClick={() => setViewMode('CUMULATIVE')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'CUMULATIVE'
                    ? 'bg-white text-blue-700 shadow-sm font-bold border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Tiến Độ Tích Lũy (Trình vs. Ký)</span>
              </button>

              <button
                onClick={() => setViewMode('MILESTONE_BREAKDOWN')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'MILESTONE_BREAKDOWN'
                    ? 'bg-white text-purple-700 shadow-sm font-bold border border-purple-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Chi Tiết Tồn Đọng 8 Mốc</span>
              </button>
            </div>

            {/* Optional Milestone Filter for Breakdown view */}
            {viewMode === 'MILESTONE_BREAKDOWN' && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-semibold flex items-center gap-1">
                  <Filter className="w-3 h-3 text-slate-600" />
                  Lọc Mốc:
                </span>
                <select
                  value={selectedMilestoneFilter}
                  onChange={(e) => setSelectedMilestoneFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-medium text-slate-800 focus:ring-1 focus:ring-purple-500 outline-none"
                >
                  <option value="ALL">Tất cả 8 Mốc</option>
                  {MILESTONE_DEFINITIONS.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label} ({m.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Main Line / Area Chart Container */}
          <div className="h-72 bg-slate-50/70 rounded-xl p-3 border border-slate-200 relative">
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'CUMULATIVE' ? (
                <AreaChart data={filteredPoints} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="gradSubmitted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="gradSigned" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="dateStr" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                  <Area
                    type="monotone"
                    dataKey="cumulativeSubmitted"
                    name="Tổng mốc đã trình hồ sơ"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#gradSubmitted)"
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulativeSigned"
                    name="Tổng mốc đã ký hoàn tất"
                    stroke="#059669"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#gradSigned)"
                  />
                </AreaChart>
              ) : viewMode === 'BOTTLENECK' ? (
                <LineChart data={filteredPoints} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="dateStr" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                  <ReferenceLine
                    y={5}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    label={{ value: 'Ngưỡng Cảnh Báo Bottleneck (5 mốc)', fill: '#e11d48', fontSize: 10, position: 'insideTopLeft' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="inSigningQueue"
                    name="Hồ sơ trong hàng chờ trình ký"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#f59e0b' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="delayedOver7Days"
                    name="🚨 Chậm ký quá 7 ngày (Nút thắt nguy hiểm)"
                    stroke="#e11d48"
                    strokeWidth={3.5}
                    dot={{ r: 4, fill: '#e11d48' }}
                    activeDot={{ r: 7, stroke: '#9f1239', strokeWidth: 2 }}
                  />
                </LineChart>
              ) : (
                <LineChart data={filteredPoints} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="dateStr" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                  {MILESTONE_DEFINITIONS.map((m) => {
                    if (selectedMilestoneFilter !== 'ALL' && selectedMilestoneFilter !== m.key) {
                      return null;
                    }
                    const dataKey = `${m.key}Pending`;
                    return (
                      <Line
                        key={m.key}
                        type="monotone"
                        dataKey={dataKey}
                        name={`${m.code} - ${m.label}`}
                        stroke={milestoneColors[m.key]}
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        activeDot={{ r: 5 }}
                      />
                    );
                  })}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* 8-Stop Bottleneck Ranking Cards */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                Xếp Hạng Nút Thắt Theo 8 Mốc Nghiệm Thu (30 Ngày Qua)
              </span>
              <span className="text-[11px] text-slate-500">
                Sắp xếp theo số lượng mốc bị chậm ký &gt; 7 ngày
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {milestoneBottlenecks.map((m, idx) => {
                const isWorst = idx === 0 && m.delayedCount > 0;
                return (
                  <div
                    key={m.key}
                    className={`p-2 rounded-xl border transition text-xs ${
                      isWorst
                        ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400 shadow-sm'
                        : m.delayedCount > 0
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                      <span className="truncate">{m.code}</span>
                      <span className={`px-1.5 py-0.2 rounded font-mono ${isWorst ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        #{idx + 1}
                      </span>
                    </div>

                    <p className="font-bold text-slate-900 truncate text-[11px]" title={m.label}>
                      {m.label}
                    </p>

                    <div className="mt-1.5 space-y-0.5 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Chờ ký:</span>
                        <span className="font-bold text-slate-800">{m.currentPending}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Chậm &gt;7d:</span>
                        <span className={`font-bold ${m.delayedCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {m.delayedCount}
                        </span>
                      </div>
                      <div className="flex justify-between pt-0.5 border-t border-slate-200/80">
                        <span className="text-slate-400">TB ngâm:</span>
                        <span className="font-mono text-slate-700">{m.avgDaysPending}d</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
