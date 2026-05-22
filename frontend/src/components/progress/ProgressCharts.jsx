/* frontend/src/components/progress/ProgressCharts.jsx */
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Flame, PieChart, Droplet, TrendingUp, Activity } from 'lucide-react';
import GlassCard from '../GlassCard';
import Spinner from '../Spinner';

const ModernTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const date = payload[0]?.payload?.date || payload[0]?.payload?.timestamp || label;
    const fDate = new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    
    return (
        <div className="bg-bg-primary/95 backdrop-blur-xl ring-1 ring-black/10 dark:ring-white/20 rounded-[20px] shadow-2xl p-4 text-sm min-w-[160px] animate-[scale-in_0.2s_ease-out]">
            <p className="font-extrabold text-text-primary mb-3 pb-2 border-b border-black/5 dark:border-white/10 tracking-tight">
                {fDate !== 'Invalid Date' ? fDate : label}
            </p>
            <div className="space-y-2.5">
                {payload.map((p, i) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-3 h-3 rounded-full shadow-sm ring-1 ring-black/10 dark:ring-white/20" style={{ background: p.color || p.fill }} />
                            <span className="text-text-secondary font-bold text-xs">{p.name || p.dataKey}</span>
                        </div>
                        <span className="font-black text-text-primary tracking-tight text-base font-mono">
                            {Number(p.value).toLocaleString()} 
                            <span className="text-[10px] font-bold text-text-tertiary ml-1 tracking-normal uppercase">{p.unit}</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ChartBase = ({ title, icon: Icon, isLoading, data, children }) => (
    <GlassCard className="glass p-5 sm:p-6 mb-6 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 shadow-sm animate-[fade-in_0.4s_ease-out]">
        <div className="flex items-center gap-3 mb-6">
            {Icon && (
                <div className="p-2.5 bg-black/5 dark:bg-white/5 rounded-[16px] text-accent ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
                    <Icon size={20} strokeWidth={2.5} />
                </div>
            )}
            <h3 className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight">{title}</h3>
        </div>
        
        {isLoading ? (
            <div className="flex justify-center items-center h-52 bg-black/5 dark:bg-white/5 rounded-[24px] ring-1 ring-black/5 dark:ring-white/10 shadow-inner">
                <Spinner size={32} />
            </div>
        ) : !data?.length ? (
            <div className="flex justify-center items-center h-52 bg-black/5 dark:bg-white/5 rounded-[24px] ring-1 ring-black/5 dark:ring-white/10 shadow-inner">
                <span className="text-text-muted text-sm font-medium bg-bg-primary px-4 py-2 rounded-full ring-1 ring-black/5 dark:ring-white/10">Sin datos suficientes</span>
            </div>
        ) : (
            <div className="h-52 w-full [&_*]:!outline-none">
                <ResponsiveContainer>{children}</ResponsiveContainer>
            </div>
        )}
    </GlassCard>
);

// Hacemos el grid y los axis un poco más sutiles pero definidos
const axisConfig = (color) => ({ stroke: color, fontSize: 10, fontWeight: 600, tickLine: false, axisLine: false, tickMargin: 12 });
const grid = <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border, rgba(150, 150, 150, 0.15))" />;
const formatTick = (t) => new Date(t).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });

export const NutritionCharts = ({ chartData: d, axisColor: c, isLoading }) => {
    const ax = axisConfig(c);
    return (
        <>
            <ChartBase title="Calorías Consumidas" icon={Flame} isLoading={isLoading} data={d}>
                <BarChart data={d} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    {grid}
                    <XAxis dataKey="day" {...ax} />
                    <YAxis {...ax} />
                    <Tooltip content={<ModernTooltip />} cursor={{ fill: 'rgba(150, 150, 150, 0.1)' }} />
                    <Bar dataKey="Calorías" fill="#fbbf24" radius={[8, 8, 4, 4]} maxBarSize={36} unit="kcal" />
                </BarChart>
            </ChartBase>

            <ChartBase title="Macronutrientes" icon={PieChart} isLoading={isLoading} data={d}>
                <BarChart data={d} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    {grid}
                    <XAxis dataKey="day" {...ax} />
                    <YAxis {...ax} />
                    <Tooltip content={<ModernTooltip />} cursor={{ fill: 'rgba(150, 150, 150, 0.1)' }} />
                    <Bar dataKey="Proteínas" stackId="a" fill="#f87171" unit="g" maxBarSize={36} />
                    <Bar dataKey="Carbs" stackId="a" fill="#60a5fa" unit="g" maxBarSize={36} />
                    <Bar dataKey="Grasas" stackId="a" fill="#34d399" radius={[8, 8, 0, 0]} unit="g" maxBarSize={36} />
                </BarChart>
            </ChartBase>

            <ChartBase title="Hidratación" icon={Droplet} isLoading={isLoading} data={d}>
                <AreaChart data={d} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorAgua" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    {grid}
                    <XAxis dataKey="day" {...ax} />
                    <YAxis {...ax} />
                    <Tooltip content={<ModernTooltip />} />
                    <Area type="monotone" dataKey="Agua" stroke="#60a5fa" strokeWidth={4} fill="url(#colorAgua)" activeDot={{ r: 6, strokeWidth: 0, fill: "#3b82f6" }} unit="ml" />
                </AreaChart>
            </ChartBase>
        </>
    );
};

export const ExerciseChart = ({ data, axisColor, exerciseName }) => (
    <ChartBase title={`Progreso: ${exerciseName || ''}`} icon={TrendingUp} data={data}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            {grid}
            <XAxis dataKey="date" tickFormatter={formatTick} {...axisConfig(axisColor)} />
            <YAxis domain={['auto', 'auto']} {...axisConfig(axisColor)} />
            <Tooltip content={<ModernTooltip />} />
            <Line type="monotone" dataKey="Peso Máximo (kg)" stroke="#818cf8" strokeWidth={4} dot={{ r: 4, strokeWidth: 0, fill: "#818cf8" }} activeDot={{ r: 7, strokeWidth: 2, stroke: "#fff" }} name="Máximo" unit="kg" />
            <Line type="monotone" dataKey="1RM Estimado (kg)" stroke="#f43f5e" strokeWidth={3} strokeDasharray="6 6" dot={{ r: 3, strokeWidth: 0, fill: "#f43f5e" }} activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }} name="1RM" unit="kg" />
        </LineChart>
    </ChartBase>
);

export const BodyWeightChart = ({ data, axisColor }) => (
    <ChartBase title="Peso Corporal" icon={Activity} data={data}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
                <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
            </defs>
            {grid}
            <XAxis dataKey="timestamp" tickFormatter={formatTick} {...axisConfig(axisColor)} />
            <YAxis domain={['auto', 'auto']} {...axisConfig(axisColor)} />
            <Tooltip content={<ModernTooltip />} />
            <Area type="monotone" dataKey="Peso (kg)" stroke="#10b981" strokeWidth={4} fill="url(#colorPeso)" activeDot={{ r: 7, strokeWidth: 2, stroke: "#fff", fill: "#10b981" }} unit="kg" />
        </AreaChart>
    </ChartBase>
);