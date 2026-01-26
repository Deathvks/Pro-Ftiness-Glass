/* frontend/src/components/progress/ProgressCharts.jsx */
import React from 'react';
import { ResponsiveContainer, LineChart, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import GlassCard from '../GlassCard';
import Spinner from '../Spinner';

// Tooltip personalizado para todos los gráficos
export const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const dateKey = payload[0]?.payload?.date; // Intentar obtener la fecha completa del payload
        // Si no está en el payload, intentamos usar el 'label' (que podría ser el timestamp)
        const dateValue = dateKey ? new Date(dateKey) : (label ? new Date(label) : null);
        const formattedDate = dateValue
            ? dateValue.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
            : 'Fecha desconocida';

        return (
            <div className="p-3 bg-bg-secondary border border-transparent dark:border dark:border-white/10 rounded-md shadow-lg text-sm">
                <p className="font-semibold text-text-secondary">Fecha: {formattedDate}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ color: p.color }}>
                        {/* Aseguramos que el nombre se muestre correctamente */}
                        {p.name || p.dataKey}: <strong>{Number(p.value).toLocaleString('es-ES')} {p.unit || ''}</strong>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};


// Gráfico de Calorías y Macronutrientes
export const NutritionCharts = ({ chartData, axisColor, isLoading }) => (
    <>
        <GlassCard className="p-6 border-transparent dark:border dark:border-white/10">
            <h2 className="text-xl font-bold mb-4">Consumo de Calorías</h2>
            {isLoading ? <div className="flex justify-center items-center h-[300px]"><Spinner/></div> :
            <ResponsiveContainer width="100%" height={300}>
                {/* --- INICIO DE LA MODIFICACIÓN --- */}
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                    {/* El eje X ahora muestra el 'día', pero el tooltip usará la 'fecha' completa */}
                    <XAxis dataKey="day" stroke={axisColor} fontSize={12} />
                    {/* --- FIN DE LA MODIFICACIÓN --- */}
                    <YAxis stroke={axisColor} fontSize={12} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-accent-transparent)' }} />
                    <Legend wrapperStyle={{ color: axisColor }} />
                    <Bar dataKey="Calorías" fill="#facc15" unit="kcal" />
                </BarChart>
            </ResponsiveContainer>
            }
        </GlassCard>

         <GlassCard className="p-6 border-transparent dark:border dark:border-white/10">
             <h2 className="text-xl font-bold mb-4">Resumen de Macros</h2>
             {isLoading ? <div className="flex justify-center items-center h-[300px]"><Spinner/></div> :
             <ResponsiveContainer width="100%" height={300}>
                 {/* --- INICIO DE LA MODIFICACIÓN --- */}
                 <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                     {/* El eje X ahora muestra el 'día', pero el tooltip usará la 'fecha' completa */}
                     <XAxis dataKey="day" stroke={axisColor} fontSize={12} />
                     {/* --- FIN DE LA MODIFICACIÓN --- */}
                     <YAxis stroke={axisColor} fontSize={12} />
                     <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-accent-transparent)' }}/>
                     <Legend wrapperStyle={{ color: axisColor }} />
                     <Bar dataKey="Proteínas" stackId="a" fill="#f87171" unit="g" />
                     <Bar dataKey="Carbs" stackId="a" fill="#60a5fa" unit="g" />
                     <Bar dataKey="Grasas" stackId="a" fill="#facc15" unit="g" />
                 </BarChart>
             </ResponsiveContainer>
             }
         </GlassCard>

        <GlassCard className="p-6 border-transparent dark:border dark:border-white/10">
            <h2 className="text-xl font-bold mb-4">Consumo de Agua</h2>
            {isLoading ? <div className="flex justify-center items-center h-[300px]"><Spinner/></div> :
            <ResponsiveContainer width="100%" height={300}>
                {/* --- INICIO DE LA MODIFICACIÓN --- */}
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                    {/* El eje X ahora muestra el 'día', pero el tooltip usará la 'fecha' completa */}
                    <XAxis dataKey="day" stroke={axisColor} fontSize={12} />
                    {/* --- FIN DE LA MODIFICACIÓN --- */}
                    <YAxis stroke={axisColor} fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ color: axisColor }} />
                    <Line type="monotone" dataKey="Agua" stroke="#60a5fa" strokeWidth={2} dot={false} unit="ml" />
                </LineChart>
            </ResponsiveContainer>
            }
        </GlassCard>
    </>
);

// Gráfico de Progreso por Ejercicio
export const ExerciseChart = ({ data, axisColor, exerciseName }) => (
    <GlassCard className="p-6 border-transparent dark:border dark:border-white/10">
        <h2 className="text-xl font-bold mb-4">Progresión de Fuerza (Último Mes)</h2>
        {data && data.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                    <XAxis
                        type="number"
                        dataKey="date"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                        stroke={axisColor}
                        fontSize={12}
                    />
                    <YAxis
                        stroke={axisColor}
                        fontSize={12}
                        // --- INICIO DE LA MODIFICACIÓN ---
                        // Ajusta el dominio para que quepan ambos valores (max weight y 1RM)
                        domain={[dataMin => Math.max(0, Math.floor(dataMin / 5) * 5 - 10), dataMax => Math.ceil(dataMax / 5) * 5 + 10]}
                        // --- FIN DE LA MODIFICACIÓN ---
                        allowDataOverflow={true}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ color: axisColor }} />
                    {/* Línea para el Peso Máximo levantado */}
                    <Line
                        type="monotone"
                        dataKey="Peso Máximo (kg)"
                        stroke="#818cf8" // Color índigo
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#818cf8' }}
                        activeDot={{ r: 8 }}
                        name="Peso Máx." // Nombre más corto para la leyenda
                    />
                    {/* --- INICIO DE LA MODIFICACIÓN --- */}
                    {/* Línea para el 1RM Estimado */}
                    <Line
                        type="monotone"
                        dataKey="1RM Estimado (kg)"
                        stroke="var(--color-accent)" // Usa el color de acento de la app
                        strokeWidth={2}
                        strokeDasharray="5 5" // Línea discontinua para diferenciar
                        dot={{ r: 4, fill: 'var(--color-accent)' }}
                        activeDot={{ r: 8 }}
                        name="1RM Est." // Nombre más corto para la leyenda
                    />
                     {/* --- FIN DE LA MODIFICACIÓN --- */}
                </LineChart>
            </ResponsiveContainer>
        ) : (
            <div className="flex items-center justify-center h-[300px] text-text-muted">
                <p>{exerciseName ? 'No hay datos de progreso para este ejercicio en el último mes.' : 'Selecciona un ejercicio para ver tu progreso.'}</p>
            </div>
        )}
    </GlassCard>
);


// Gráfico de Evolución del Peso Corporal
export const BodyWeightChart = ({ data, axisColor }) => (
    <GlassCard className="p-6 border-transparent dark:border dark:border-white/10">
        <h2 className="text-xl font-bold mb-4">Evolución del Peso</h2>
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                <XAxis type="number" dataKey="timestamp" domain={['dataMin', 'dataMax']} tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} stroke={axisColor} fontSize={12} />
                <YAxis stroke={axisColor} fontSize={12} domain={[dataMin => (Math.floor(dataMin / 5) * 5) - 5, dataMax => (Math.ceil(dataMax / 5) * 5) + 5]} allowDataOverflow={true} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: axisColor }} />
                <Line type="monotone" dataKey="Peso (kg)" stroke="#facc15" strokeWidth={2} dot={{ r: 4, fill: '#facc15' }} activeDot={{ r: 8 }} />
            </LineChart>
        </ResponsiveContainer>
    </GlassCard>
);