/* frontend/src/components/progress/ProgressCharts.jsx */
import React, { useState, useMemo } from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ReferenceLine
} from 'recharts';
import {
    Flame,
    PieChart,
    Droplet,
    TrendingUp,
    Activity,
    Trophy,
    Award,
    ArrowUpRight,
    ArrowDownRight,
    Target,
    Ruler,
    Sparkles
} from 'lucide-react';
import GlassCard from '../GlassCard';
import Spinner from '../Spinner';

// --- FILTRO DE PERIODOS (APPLE PILL SEGMENTED CONTROL) ---
export const PeriodFilter = ({ periods = ['7D', '1M', '3M', '6M', '1A', 'Todo'], activePeriod, onChange }) => {
    return (
        <div className="flex items-center gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-full ring-1 ring-black/5 dark:ring-white/10 shrink-0">
            {periods.map((p) => {
                const isActive = activePeriod === p;
                return (
                    <button
                        key={p}
                        type="button"
                        onClick={() => onChange(p)}
                        className={`px-2.5 py-1 text-[11px] font-black rounded-full transition-all duration-200 outline-none ${
                            isActive
                                ? 'bg-accent text-accent-contrast shadow-sm scale-[1.03]'
                                : 'text-text-muted hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                    >
                        {p}
                    </button>
                );
            })}
        </div>
    );
};

// Helper para filtrar datos por periodo
export const filterByPeriod = (data, period, dateKey = 'date') => {
    if (!data || !data.length || period === 'Todo') return data;
    const now = Date.now();
    let days = 30;
    if (period === '7D') days = 7;
    else if (period === '14D') days = 14;
    else if (period === '1M') days = 30;
    else if (period === '3M') days = 90;
    else if (period === '6M') days = 180;
    else if (period === '1A') days = 365;

    const cutoff = now - days * 24 * 60 * 60 * 1000;
    const filtered = data.filter((item) => {
        const val = item[dateKey] ?? item.timestamp ?? item.date;
        const time = typeof val === 'number' ? val : new Date(val).getTime();
        return !isNaN(time) && time >= cutoff;
    });

    return filtered.length > 0 ? filtered : data;
};

// --- TOOLTIP FLOTANTE LIQUID GLASS ---
export const ModernTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const rawDate = payload[0]?.payload?.date || payload[0]?.payload?.timestamp || label;
    let formattedDate = label;
    if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
            formattedDate = d.toLocaleDateString('es-ES', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
            });
        }
    }

    return (
        <div className="bg-bg-primary/95 dark:bg-[#121216]/95 backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 rounded-[22px] shadow-2xl p-3.5 sm:p-4 text-sm min-w-[170px] animate-[scale-in_0.15s_ease-out]">
            <p className="font-black text-text-primary mb-2.5 pb-2 border-b border-black/5 dark:border-white/10 tracking-tight capitalize text-xs">
                {formattedDate}
            </p>
            <div className="space-y-2">
                {payload.map((p, i) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 min-w-0">
                            <div
                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ring-1 ring-black/10 dark:ring-white/20"
                                style={{ background: p.color || p.fill }}
                            />
                            <span className="text-text-secondary font-bold text-xs truncate">
                                {p.name || p.dataKey}
                            </span>
                        </div>
                        <span className="font-black text-text-primary tracking-tight text-sm font-mono shrink-0">
                            {Number(p.value).toLocaleString('es-ES')}
                            {p.unit && (
                                <span className="text-[10px] font-bold text-text-muted ml-1 tracking-normal uppercase">
                                    {p.unit}
                                </span>
                            )}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- KPI STAT BADGE (APPLE HEALTH STYLE) ---
const StatBadge = ({ label, value, unit, trend, isPositive, icon: Icon }) => {
    return (
        <div className="p-3 sm:p-3.5 rounded-[20px] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 flex flex-col justify-between min-w-[110px] sm:min-w-[130px] flex-1">
            <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-text-muted truncate">
                    {label}
                </span>
                {Icon && <Icon size={13} className="text-text-muted shrink-0" />}
            </div>
            <div className="flex items-baseline gap-1 my-0.5">
                <span className="text-xl sm:text-2xl font-black text-text-primary tracking-tight font-mono">
                    {value}
                </span>
                {unit && (
                    <span className="text-[10px] sm:text-[11px] font-bold text-text-muted uppercase">
                        {unit}
                    </span>
                )}
            </div>
            {trend && (
                <div className="flex items-center gap-1 mt-0.5">
                    <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 truncate ${
                            isPositive
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : isPositive === false
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                : 'bg-black/5 dark:bg-white/10 text-text-secondary'
                        }`}
                    >
                        {isPositive === true && <ArrowUpRight size={10} className="shrink-0" />}
                        {isPositive === false && <ArrowDownRight size={10} className="shrink-0" />}
                        <span className="truncate">{trend}</span>
                    </span>
                </div>
            )}
        </div>
    );
};

// --- BASE DE GRÁFICA PREMIUM CON HEADER Y KPIS ---
const ChartBase = ({
    title,
    icon: Icon,
    isLoading,
    data,
    periods,
    activePeriod,
    onPeriodChange,
    kpis,
    headerExtra,
    emptyMessage = 'Sin datos suficientes',
    children
}) => (
    <GlassCard className="glass p-4 sm:p-6 mb-6 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 shadow-sm animate-[fade-in_0.4s_ease-out]">
        {/* Cabecera Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
                {Icon && (
                    <div className="p-2.5 bg-accent/10 dark:bg-accent/15 rounded-[16px] text-accent ring-1 ring-accent/20 shadow-sm shrink-0">
                        <Icon size={19} strokeWidth={2.5} />
                    </div>
                )}
                <div>
                    <h3 className="text-base sm:text-lg font-black text-text-primary tracking-tight leading-tight">
                        {title}
                    </h3>
                </div>
            </div>

            <div className="flex items-center gap-2 justify-between sm:justify-end flex-wrap">
                {headerExtra}
                {periods && onPeriodChange && (
                    <PeriodFilter
                        periods={periods}
                        activePeriod={activePeriod}
                        onChange={onPeriodChange}
                    />
                )}
            </div>
        </div>

        {/* Tarjetas KPI Hero (Apple Health Style) */}
        {kpis && kpis.length > 0 && !isLoading && data?.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 mb-5">
                {kpis.map((kpi, idx) => (
                    <StatBadge key={idx} {...kpi} />
                ))}
            </div>
        )}

        {/* Lienzo de la Gráfica */}
        {isLoading ? (
            <div className="flex justify-center items-center h-60 sm:h-72 bg-black/5 dark:bg-white/5 rounded-[24px] ring-1 ring-black/5 dark:ring-white/10 shadow-inner">
                <Spinner size={32} />
            </div>
        ) : !data?.length ? (
            <div className="flex flex-col justify-center items-center h-60 sm:h-72 bg-black/5 dark:bg-white/5 rounded-[24px] ring-1 ring-black/5 dark:ring-white/10 shadow-inner text-center p-6 gap-2">
                <span className="text-text-muted text-sm font-semibold bg-bg-primary px-4 py-2 rounded-full ring-1 ring-black/5 dark:ring-white/10">
                    {emptyMessage}
                </span>
            </div>
        ) : (
            <div className="h-60 sm:h-72 w-full [&_*]:!outline-none pt-2">
                <ResponsiveContainer width="100%" height="100%">
                    {children}
                </ResponsiveContainer>
            </div>
        )}
    </GlassCard>
);

// Configuraciones visuales sutiles y armónicas
const axisConfig = (color) => ({
    stroke: color,
    fontSize: 10,
    fontWeight: 700,
    tickLine: false,
    axisLine: false,
    tickMargin: 10
});

const grid = (
    <CartesianGrid
        strokeDasharray="3 3"
        vertical={false}
        stroke="var(--color-border, rgba(150, 150, 150, 0.12))"
    />
);

const formatTick = (t) => {
    if (!t) return '';
    const d = new Date(t);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
};

// Punto Personalizado para Récord Personal (PR)
const PRCustomDot = ({ cx, cy, payload, maxWeight }) => {
    if (!cx || !cy) return null;
    const isPR = payload['Peso Máximo (kg)'] === maxWeight && maxWeight > 0;
    if (isPR) {
        return (
            <g key={`${cx}-${cy}`}>
                <circle cx={cx} cy={cy} r={10} fill="#f59e0b" fillOpacity={0.25} />
                <circle cx={cx} cy={cy} r={5.5} fill="#fbbf24" stroke="#ffffff" strokeWidth={2} />
            </g>
        );
    }
    return <circle cx={cx} cy={cy} r={3} fill="#818cf8" stroke="transparent" />;
};

// Píldora opaca para líneas de referencia (impide que las líneas de la gráfica tapen el texto)
const ReferencePill = ({ viewBox, text, stroke = '#f59e0b', color = '#f59e0b', position = 'left' }) => {
    if (!viewBox) return null;
    const x = typeof viewBox.x === 'number' ? viewBox.x : 0;
    const y = typeof viewBox.y === 'number' ? viewBox.y : 0;
    const width = typeof viewBox.width === 'number' ? viewBox.width : 300;

    const textWidth = Math.max(82, text.length * 6.5 + 24);
    const height = 22;
    // Se coloca a la izquierda (x + 14) para despejar el último punto del historial y la barra del día actual
    const pillX = position === 'left' ? x + 14 : Math.max(x + 10, x + width - textWidth - 10);
    const pillY = Math.max(2, y - height / 2);

    return (
        <g className="pointer-events-none select-none" style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.45))' }}>
            <rect
                x={pillX}
                y={pillY}
                width={textWidth}
                height={height}
                rx={11}
                ry={11}
                fill="var(--bg-secondary, #1e293b)"
                style={{ fill: 'var(--bg-secondary, #1e293b)' }}
                fillOpacity={1}
                stroke={stroke}
                strokeWidth={1.5}
            />
            <text
                x={pillX + textWidth / 2}
                y={pillY + height / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fill={color}
                fontSize={10}
                fontWeight={800}
                letterSpacing="0.02em"
            >
                {text}
            </text>
        </g>
    );
};

// ============================================================
// 1. GRÁFICA DE PESO CORPORAL (APPLE HEALTH STYLE)
// ============================================================
export const BodyWeightChart = ({ data, axisColor }) => {
    const [period, setPeriod] = useState('3M');

    const sortedData = useMemo(() => {
        if (!data || !data.length) return [];
        return [...data].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    }, [data]);

    const filteredData = useMemo(() => {
        return filterByPeriod(sortedData, period, 'timestamp');
    }, [sortedData, period]);

    const stats = useMemo(() => {
        if (!filteredData.length) return null;
        const weights = filteredData.map((d) => d['Peso (kg)']).filter((w) => w > 0);
        if (!weights.length) return null;

        const current = weights[weights.length - 1];
        const start = weights[0];
        const delta = Math.round((current - start) * 10) / 10;
        const min = Math.min(...weights);
        const max = Math.max(...weights);
        const avg = Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10;

        return { current, start, delta, min, max, avg };
    }, [filteredData]);

    const ax = axisConfig(axisColor);

    return (
        <ChartBase
            title="Evolución de Peso Corporal"
            icon={Activity}
            data={filteredData}
            periods={['7D', '1M', '3M', '6M', '1A', 'Todo']}
            activePeriod={period}
            onPeriodChange={setPeriod}
            kpis={
                stats
                    ? [
                          {
                              label: 'Peso Actual',
                              value: stats.current,
                              unit: 'kg',
                              trend:
                                  stats.delta !== 0
                                      ? `${stats.delta > 0 ? '+' : ''}${stats.delta} kg`
                                      : 'Estable',
                              isPositive: stats.delta <= 0,
                              icon: Activity
                          },
                          {
                              label: 'Promedio',
                              value: stats.avg,
                              unit: 'kg',
                              trend: `${period}`,
                              icon: Target
                          },
                          {
                              label: 'Mínimo',
                              value: stats.min,
                              unit: 'kg',
                              icon: ArrowDownRight
                          },
                          {
                              label: 'Máximo',
                              value: stats.max,
                              unit: 'kg',
                              icon: ArrowUpRight
                          }
                      ]
                    : null
            }
        >
            <AreaChart data={filteredData} margin={{ top: 28, right: 12, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorPesoApple" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="60%" stopColor="#10b981" stopOpacity={0.08} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <filter id="glowPeso" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                {grid}
                <XAxis dataKey="timestamp" tickFormatter={formatTick} {...ax} />
                <YAxis domain={['dataMin - 1.5', 'dataMax + 2.5']} {...ax} />
                <Tooltip content={<ModernTooltip />} cursor={{ stroke: 'rgba(16, 185, 129, 0.3)', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                <Area
                    type="monotone"
                    dataKey="Peso (kg)"
                    stroke="#10b981"
                    strokeWidth={3.5}
                    fill="url(#colorPesoApple)"
                    filter="url(#glowPeso)"
                    activeDot={{ r: 7, strokeWidth: 2.5, stroke: '#fff', fill: '#10b981' }}
                    unit="kg"
                />
                {stats?.avg && (
                    <ReferenceLine
                        y={stats.avg}
                        stroke="rgba(16, 185, 129, 0.45)"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={(props) => (
                            <ReferencePill
                                {...props}
                                position="left"
                                text={`Media: ${stats.avg} kg`}
                                stroke="#10b981"
                                color="#10b981"
                            />
                        )}
                    />
                )}
            </AreaChart>
        </ChartBase>
    );
};

// ============================================================
// 2. GRÁFICA DE EJERCICIOS CON PR Y 1RM (APPLE FITNESS STYLE)
// ============================================================
export const ExerciseChart = ({ data, axisColor, exerciseName }) => {
    const [period, setPeriod] = useState('3M');

    const sortedData = useMemo(() => {
        if (!data || !data.length) return [];
        return [...data].sort((a, b) => (a.date || 0) - (b.date || 0));
    }, [data]);

    const filteredData = useMemo(() => {
        return filterByPeriod(sortedData, period, 'date');
    }, [sortedData, period]);

    const stats = useMemo(() => {
        if (!filteredData.length) return null;
        const maxWeights = filteredData.map((d) => d['Peso Máximo (kg)'] || 0);
        const est1RMs = filteredData.map((d) => d['1RM Estimado (kg)'] || 0);

        const currentWeight = maxWeights[maxWeights.length - 1] || 0;
        const prWeight = Math.max(...maxWeights, 0);
        const max1RM = Math.max(...est1RMs, 0);
        const firstWeight = maxWeights[0] || 0;
        const gain = Math.round((currentWeight - firstWeight) * 10) / 10;

        return { currentWeight, prWeight, max1RM, gain };
    }, [filteredData]);

    const ax = axisConfig(axisColor);

    return (
        <ChartBase
            title={`Progreso: ${exerciseName || 'Ejercicio'}`}
            icon={TrendingUp}
            data={filteredData}
            periods={['1M', '3M', '6M', '1A', 'Todo']}
            activePeriod={period}
            onPeriodChange={setPeriod}
            headerExtra={
                <div className="flex items-center gap-2 flex-wrap text-[10px] font-bold text-text-muted bg-black/5 dark:bg-white/5 px-2.5 py-1.5 rounded-full ring-1 ring-black/5 dark:ring-white/10">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-1 bg-[#818cf8] rounded-full inline-block" />
                        Peso Real
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-500">
                        <span className="w-2.5 h-0.5 border-b-2 border-dashed border-[#f43f5e] inline-block" />
                        1RM Estimado
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-500">
                        <span className="w-2.5 h-0.5 border-b-2 border-dotted border-amber-500 inline-block" />
                        Récord PR
                    </span>
                </div>
            }
            kpis={
                stats
                    ? [
                          {
                              label: 'Última Carga',
                              value: stats.currentWeight,
                              unit: 'kg',
                              trend:
                                  stats.gain > 0
                                      ? `+${stats.gain} kg`
                                      : stats.gain < 0
                                      ? `${stats.gain} kg`
                                      : 'Constante',
                              isPositive: stats.gain >= 0,
                              icon: TrendingUp
                          },
                          {
                              label: 'Récord Personal (PR)',
                              value: stats.prWeight,
                              unit: 'kg',
                              trend: 'Récord histórico',
                              isPositive: true,
                              icon: Trophy
                          },
                          {
                              label: '1RM Estimado Máx',
                              value: stats.max1RM,
                              unit: 'kg',
                              trend: 'Fuerza teórica',
                              icon: Award
                          }
                      ]
                    : null
            }
        >
            <LineChart data={filteredData} margin={{ top: 30, right: 14, left: -20, bottom: 0 }}>
                <defs>
                    <filter id="glowExercise" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                {grid}
                <XAxis dataKey="date" tickFormatter={formatTick} {...ax} />
                <YAxis domain={['dataMin - 2', 'dataMax + 5']} {...ax} />
                <Tooltip content={<ModernTooltip />} cursor={{ stroke: 'rgba(129, 140, 248, 0.3)', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                <Line
                    type="monotone"
                    dataKey="Peso Máximo (kg)"
                    stroke="#818cf8"
                    strokeWidth={3.5}
                    filter="url(#glowExercise)"
                    dot={<PRCustomDot maxWeight={stats?.prWeight} />}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff', fill: '#818cf8' }}
                    name="Peso Máximo"
                    unit="kg"
                />
                <Line
                    type="monotone"
                    dataKey="1RM Estimado (kg)"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={{ r: 2.5, strokeWidth: 0, fill: '#f43f5e' }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#f43f5e' }}
                    name="1RM Estimado"
                    unit="kg"
                />
                {stats?.prWeight > 0 && (
                    <ReferenceLine
                        y={stats.prWeight}
                        stroke="rgba(245, 158, 11, 0.55)"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={(props) => (
                            <ReferencePill
                                {...props}
                                position="left"
                                text={`PR: ${stats.prWeight} kg`}
                                stroke="#f59e0b"
                                color="#f59e0b"
                            />
                        )}
                    />
                )}
            </LineChart>
        </ChartBase>
    );
};

// ============================================================
// 3. GRÁFICAS DE NUTRICIÓN (BARRAS CÁPSULA + GHOST TRACK + MACROS)
// ============================================================
export const NutritionCharts = ({ chartData: d, axisColor: c, isLoading }) => {
    const ax = axisConfig(c);

    // Métricas calculadas para Calorías
    const calStats = useMemo(() => {
        if (!d || !d.length) return null;
        const cals = d.map((x) => x.Calorías || 0).filter((x) => x > 0);
        if (!cals.length) return null;
        const avg = Math.round(cals.reduce((a, b) => a + b, 0) / cals.length);
        const max = Math.max(...cals);
        return { avg, max, days: cals.length };
    }, [d]);

    // Métricas calculadas para Macros
    const macroStats = useMemo(() => {
        if (!d || !d.length) return null;
        const validDays = d.filter((x) => (x.Proteínas || 0) + (x.Carbs || 0) + (x.Grasas || 0) > 0);
        if (!validDays.length) return null;

        const totalP = validDays.reduce((a, b) => a + (b.Proteínas || 0), 0);
        const totalC = validDays.reduce((a, b) => a + (b.Carbs || 0), 0);
        const totalG = validDays.reduce((a, b) => a + (b.Grasas || 0), 0);

        const avgP = Math.round(totalP / validDays.length);
        const avgC = Math.round(totalC / validDays.length);
        const avgG = Math.round(totalG / validDays.length);

        const sumGrams = avgP + avgC + avgG || 1;
        const pctP = Math.round((avgP / sumGrams) * 100);
        const pctC = Math.round((avgC / sumGrams) * 100);
        const pctG = Math.round((avgG / sumGrams) * 100);

        return { avgP, avgC, avgG, pctP, pctC, pctG };
    }, [d]);

    // Métricas calculadas para Hidratación
    const waterStats = useMemo(() => {
        if (!d || !d.length) return null;
        const waters = d.map((x) => x.Agua || 0).filter((x) => x > 0);
        if (!waters.length) return null;
        const avgMl = Math.round(waters.reduce((a, b) => a + b, 0) / waters.length);
        const avgL = Math.round((avgMl / 1000) * 10) / 10;
        const daysGoal = waters.filter((w) => w >= 2000).length;
        return { avgL, daysGoal, totalDays: waters.length };
    }, [d]);

    return (
        <>
            {/* Gráfica 1: Calorías Consumidas con Ghost Track */}
            <ChartBase
                title="Calorías Diarias"
                icon={Flame}
                isLoading={isLoading}
                data={d}
                kpis={
                    calStats
                        ? [
                              {
                                  label: 'Promedio Diario',
                                  value: calStats.avg.toLocaleString(),
                                  unit: 'kcal',
                                  trend: `${calStats.days} días reg.`,
                                  icon: Flame
                              },
                              {
                                  label: 'Pico Máximo',
                                  value: calStats.max.toLocaleString(),
                                  unit: 'kcal',
                                  icon: ArrowUpRight
                              }
                          ]
                        : null
                }
            >
                <BarChart data={d} margin={{ top: 28, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="barCalorias" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.8} />
                        </linearGradient>
                    </defs>
                    {grid}
                    <XAxis dataKey="day" {...ax} />
                    <YAxis domain={[0, 'dataMax + 300']} {...ax} />
                    <Tooltip content={<ModernTooltip />} cursor={{ fill: 'rgba(150, 150, 150, 0.08)' }} />
                    <Bar
                        dataKey="Calorías"
                        fill="url(#barCalorias)"
                        radius={[10, 10, 10, 10]}
                        maxBarSize={34}
                        background={{ fill: 'rgba(150, 150, 150, 0.08)', radius: 10 }}
                        unit="kcal"
                    />
                    {calStats?.avg && (
                        <ReferenceLine
                            y={calStats.avg}
                            stroke="rgba(251, 191, 36, 0.45)"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            label={(props) => (
                                <ReferencePill
                                    {...props}
                                    position="left"
                                    text={`Media: ${calStats.avg} kcal`}
                                    stroke="#f59e0b"
                                    color="#f59e0b"
                                />
                            )}
                        />
                    )}
                </BarChart>
            </ChartBase>

            {/* Gráfica 2: Macronutrientes con Píldora de Distribución */}
            <ChartBase
                title="Distribución de Macronutrientes"
                icon={PieChart}
                isLoading={isLoading}
                data={d}
                headerExtra={
                    macroStats ? (
                        <div className="flex items-center gap-1.5 p-1 px-2.5 rounded-full bg-black/5 dark:bg-white/5 text-[10px] font-black">
                            <span className="text-[#f87171]">{macroStats.pctP}% P</span>
                            <span className="text-text-muted">·</span>
                            <span className="text-[#60a5fa]">{macroStats.pctC}% C</span>
                            <span className="text-text-muted">·</span>
                            <span className="text-[#34d399]">{macroStats.pctG}% G</span>
                        </div>
                    ) : null
                }
                kpis={
                    macroStats
                        ? [
                              {
                                  label: 'Proteínas Media',
                                  value: macroStats.avgP,
                                  unit: 'g',
                                  trend: `${macroStats.pctP}% del total`,
                                  icon: Sparkles
                              },
                              {
                                  label: 'Carbohidratos',
                                  value: macroStats.avgC,
                                  unit: 'g',
                                  trend: `${macroStats.pctC}% del total`,
                                  icon: PieChart
                              },
                              {
                                  label: 'Grasas Media',
                                  value: macroStats.avgG,
                                  unit: 'g',
                                  trend: `${macroStats.pctG}% del total`,
                                  icon: Target
                              }
                          ]
                        : null
                }
            >
                <BarChart data={d} margin={{ top: 15, right: 0, left: -20, bottom: 0 }}>
                    {grid}
                    <XAxis dataKey="day" {...ax} />
                    <YAxis {...ax} />
                    <Tooltip content={<ModernTooltip />} cursor={{ fill: 'rgba(150, 150, 150, 0.08)' }} />
                    <Bar dataKey="Proteínas" stackId="a" fill="#f87171" unit="g" maxBarSize={34} />
                    <Bar dataKey="Carbs" stackId="a" fill="#60a5fa" unit="g" maxBarSize={34} />
                    <Bar
                        dataKey="Grasas"
                        stackId="a"
                        fill="#34d399"
                        radius={[10, 10, 0, 0]}
                        unit="g"
                        maxBarSize={34}
                    />
                </BarChart>
            </ChartBase>

            {/* Gráfica 3: Hidratación con Curva Fluida */}
            <ChartBase
                title="Hidratación Diaria"
                icon={Droplet}
                isLoading={isLoading}
                data={d}
                kpis={
                    waterStats
                        ? [
                              {
                                  label: 'Media Diaria',
                                  value: waterStats.avgL,
                                  unit: 'L',
                                  trend: `${waterStats.totalDays} días reg.`,
                                  icon: Droplet
                              },
                              {
                                  label: 'Meta Cumplida (≥2L)',
                                  value: waterStats.daysGoal,
                                  unit: 'días',
                                  trend: `${Math.round((waterStats.daysGoal / (waterStats.totalDays || 1)) * 100)}% éxito`,
                                  isPositive: true,
                                  icon: Target
                              }
                          ]
                        : null
                }
            >
                <AreaChart data={d} margin={{ top: 28, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorAguaApple" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.4} />
                            <stop offset="60%" stopColor="#38bdf8" stopOpacity={0.08} />
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.0} />
                        </linearGradient>
                        <filter id="glowAgua" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="2.5" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    {grid}
                    <XAxis dataKey="day" {...ax} />
                    <YAxis domain={[0, 'dataMax + 300']} {...ax} />
                    <Tooltip content={<ModernTooltip />} cursor={{ stroke: 'rgba(56, 189, 248, 0.3)', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                    <Area
                        type="monotone"
                        dataKey="Agua"
                        stroke="#38bdf8"
                        strokeWidth={3.5}
                        fill="url(#colorAguaApple)"
                        filter="url(#glowAgua)"
                        activeDot={{ r: 7, strokeWidth: 2.5, stroke: '#fff', fill: '#0284c7' }}
                        unit="ml"
                    />
                    <ReferenceLine
                        y={2000}
                        stroke="rgba(56, 189, 248, 0.45)"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={(props) => (
                            <ReferencePill
                                {...props}
                                position="left"
                                text="Meta: 2.000 ml"
                                stroke="#38bdf8"
                                color="#38bdf8"
                            />
                        )}
                    />
                </AreaChart>
            </ChartBase>
        </>
    );
};

// ============================================================
// 4. GRÁFICA DE MEDIDAS CORPORALES (VIOLETA / PÚRPURA CON KPIS)
// ============================================================
export const MeasurementChart = ({ data, axisColor, measureLabel }) => {
    const [period, setPeriod] = useState('3M');

    const sortedData = useMemo(() => {
        if (!data || !data.length) return [];
        return [...data].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    }, [data]);

    const filteredData = useMemo(() => {
        return filterByPeriod(sortedData, period, 'timestamp');
    }, [sortedData, period]);

    const stats = useMemo(() => {
        if (!filteredData.length) return null;
        const vals = filteredData.map((d) => d.value).filter((v) => v > 0);
        if (!vals.length) return null;

        const current = vals[vals.length - 1];
        const start = vals[0];
        const delta = Math.round((current - start) * 10) / 10;
        const min = Math.min(...vals);
        const max = Math.max(...vals);

        return { current, delta, min, max };
    }, [filteredData]);

    const ax = axisConfig(axisColor);

    return (
        <ChartBase
            title={`Evolución de ${measureLabel || 'Medida'}`}
            icon={Ruler}
            data={filteredData}
            periods={['1M', '3M', '6M', '1A', 'Todo']}
            activePeriod={period}
            onPeriodChange={setPeriod}
            kpis={
                stats
                    ? [
                          {
                              label: 'Última Medida',
                              value: stats.current,
                              unit: 'cm',
                              trend:
                                  stats.delta !== 0
                                      ? `${stats.delta > 0 ? '+' : ''}${stats.delta} cm`
                                      : 'Constante',
                              isPositive: stats.delta <= 0,
                              icon: Ruler
                          },
                          {
                              label: 'Mínimo',
                              value: stats.min,
                              unit: 'cm',
                              icon: ArrowDownRight
                          },
                          {
                              label: 'Máximo',
                              value: stats.max,
                              unit: 'cm',
                              icon: ArrowUpRight
                          }
                      ]
                    : null
            }
        >
            <AreaChart data={filteredData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorMedidaApple" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                        <stop offset="60%" stopColor="#a855f7" stopOpacity={0.08} />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity={0.0} />
                    </linearGradient>
                    <filter id="glowMedida" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                {grid}
                <XAxis dataKey="timestamp" tickFormatter={formatTick} {...ax} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} {...ax} />
                <Tooltip content={<ModernTooltip />} cursor={{ stroke: 'rgba(168, 85, 247, 0.3)', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                <Area
                    type="monotone"
                    dataKey="value"
                    name="Medida"
                    stroke="#a855f7"
                    strokeWidth={3.5}
                    fill="url(#colorMedidaApple)"
                    filter="url(#glowMedida)"
                    activeDot={{ r: 7, strokeWidth: 2.5, stroke: '#fff', fill: '#9333ea' }}
                    unit="cm"
                />
            </AreaChart>
        </ChartBase>
    );
};