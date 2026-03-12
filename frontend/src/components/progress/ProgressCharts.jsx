import React from 'react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import GlassCard from '../GlassCard';
import Spinner from '../Spinner';

const ModernTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const date = payload[0]?.payload?.date || payload[0]?.payload?.timestamp || label;
    const fDate = new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    
    return (
        <div className="bg-bg-secondary border border-white/5 rounded-lg shadow-xl p-3 text-sm">
            <p className="font-semibold text-text-primary mb-2">{fDate !== 'Invalid Date' ? fDate : label}</p>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
                    <span className="text-text-secondary">{p.name || p.dataKey}:</span>
                    <span className="font-medium text-text-primary">{Number(p.value).toLocaleString()} {p.unit}</span>
                </div>
            ))}
        </div>
    );
};

const ChartBase = ({ title, isLoading, data, children }) => (
    <GlassCard className="p-5 mb-5 border-white/5">
        <h3 className="text-base font-semibold text-text-primary mb-4">{title}</h3>
        {isLoading ? <div className="flex justify-center items-center h-52"><Spinner/></div> : 
         !data?.length ? <div className="flex justify-center items-center h-52 text-text-muted text-sm">Sin datos suficientes</div> :
         <div className="h-52 w-full [&_*]:!outline-none">
            <ResponsiveContainer>{children}</ResponsiveContainer>
         </div>}
    </GlassCard>
);

const axisConfig = (color) => ({ stroke: color, fontSize: 11, tickLine: false, axisLine: false, tickMargin: 8 });
const grid = <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />;
const formatTick = (t) => new Date(t).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });

export const NutritionCharts = ({ chartData: d, axisColor: c, isLoading }) => {
    const ax = axisConfig(c);
    return (
        <>
            <ChartBase title="Calorías Consumidas" isLoading={isLoading} data={d}>
                <BarChart data={d}>
                    {grid}
                    <XAxis dataKey="day" {...ax} />
                    <YAxis {...ax} />
                    <Tooltip content={<ModernTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Bar dataKey="Calorías" fill="#fbbf24" radius={[6,6,0,0]} maxBarSize={32} unit="kcal" />
                </BarChart>
            </ChartBase>

            <ChartBase title="Macronutrientes" isLoading={isLoading} data={d}>
                <BarChart data={d}>
                    {grid}
                    <XAxis dataKey="day" {...ax} />
                    <YAxis {...ax} />
                    <Tooltip content={<ModernTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Bar dataKey="Proteínas" stackId="a" fill="#f87171" unit="g" maxBarSize={32} />
                    <Bar dataKey="Carbs" stackId="a" fill="#60a5fa" unit="g" maxBarSize={32} />
                    <Bar dataKey="Grasas" stackId="a" fill="#34d399" radius={[6,6,0,0]} unit="g" maxBarSize={32} />
                </BarChart>
            </ChartBase>

            <ChartBase title="Hidratación" isLoading={isLoading} data={d}>
                <AreaChart data={d}>
                    <defs>
                        <linearGradient id="colorAgua" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    {grid}
                    <XAxis dataKey="day" {...ax} />
                    <YAxis {...ax} />
                    <Tooltip content={<ModernTooltip />} />
                    <Area type="monotone" dataKey="Agua" stroke="#60a5fa" strokeWidth={3} fill="url(#colorAgua)" unit="ml" />
                </AreaChart>
            </ChartBase>
        </>
    );
};

export const ExerciseChart = ({ data, axisColor, exerciseName }) => (
    <ChartBase title={`Progreso: ${exerciseName || ''}`} data={data}>
        <LineChart data={data}>
            {grid}
            <XAxis dataKey="date" tickFormatter={formatTick} {...axisConfig(axisColor)} />
            <YAxis domain={['auto', 'auto']} {...axisConfig(axisColor)} />
            <Tooltip content={<ModernTooltip />} />
            <Line type="monotone" dataKey="Peso Máximo (kg)" stroke="#818cf8" strokeWidth={3} dot={{ r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} name="Máximo" unit="kg" />
            <Line type="monotone" dataKey="1RM Estimado (kg)" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} name="1RM" unit="kg" />
        </LineChart>
    </ChartBase>
);

export const BodyWeightChart = ({ data, axisColor }) => (
    <ChartBase title="Peso Corporal" data={data}>
        <AreaChart data={data}>
            <defs>
                <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
            </defs>
            {grid}
            <XAxis dataKey="timestamp" tickFormatter={formatTick} {...axisConfig(axisColor)} />
            <YAxis domain={['auto', 'auto']} {...axisConfig(axisColor)} />
            <Tooltip content={<ModernTooltip />} />
            <Area type="monotone" dataKey="Peso (kg)" stroke="#10b981" strokeWidth={3} fill="url(#colorPeso)" activeDot={{ r: 6 }} unit="kg" />
        </AreaChart>
    </ChartBase>
);