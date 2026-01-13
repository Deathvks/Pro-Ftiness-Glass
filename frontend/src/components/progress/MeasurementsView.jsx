/* frontend/src/components/progress/MeasurementsView.jsx */
import React, { useState, useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Plus, Ruler } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import BodyMeasurementModal from '../BodyMeasurementModal';
import CustomSelect from '../CustomSelect';

const MEASUREMENT_TYPES = [
    { value: 'cintura', label: 'Cintura' },
    { value: 'pecho', label: 'Pecho' },
    { value: 'biceps', label: 'Bíceps' },
    { value: 'muslos', label: 'Muslos' },
    { value: 'caderas', label: 'Caderas' },
    { value: 'hombros', label: 'Hombros' },
    { value: 'gemelos', label: 'Gemelos' },
    { value: 'cuello', label: 'Cuello' },
    { value: 'antebrazos', label: 'Antebrazos' },
];

const MeasurementsView = ({ axisColor }) => {
    const { bodyMeasurementsLog, logBodyMeasurement } = useAppStore(state => ({
        bodyMeasurementsLog: state.bodyMeasurementsLog || [],
        logBodyMeasurement: state.logBodyMeasurement
    }));

    const [selectedType, setSelectedType] = useState('cintura');
    const [showModal, setShowModal] = useState(false);

    // Filtrar y ordenar datos para el gráfico
    const chartData = useMemo(() => {
        if (!bodyMeasurementsLog) return [];

        return bodyMeasurementsLog
            .filter(log => log.measure_type === selectedType)
            .map(log => ({
                timestamp: new Date(log.log_date).getTime(),
                value: parseFloat(log.value),
                dateStr: new Date(log.log_date).toLocaleDateString()
            }))
            .sort((a, b) => a.timestamp - b.timestamp);
    }, [bodyMeasurementsLog, selectedType]);

    const handleSave = async (data) => {
        await logBodyMeasurement(data);
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-bg-secondary p-3 border border-glass-border rounded-lg shadow-xl">
                    <p className="text-text-primary font-bold">{new Date(label).toLocaleDateString()}</p>
                    <p className="text-accent">
                        {payload[0].value} cm
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full flex flex-col items-center animate-fade-in gap-6">

            {/* Controles: Selector y Botón Añadir */}
            <div className="flex flex-wrap justify-center gap-4 w-full max-w-2xl bg-bg-secondary/50 p-4 rounded-xl border border-glass-border backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                    {/* Reemplazado select nativo por CustomSelect */}
                    <div className="w-full sm:w-64 z-10">
                        <CustomSelect
                            value={selectedType}
                            onChange={setSelectedType}
                            options={MEASUREMENT_TYPES}
                            placeholder="Filtrar por zona"
                        />
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-accent text-bg-secondary px-6 py-2 rounded-xl font-bold hover:brightness-110 transition shadow-lg shadow-accent/20 active:scale-95 whitespace-nowrap"
                    >
                        <Plus size={18} />
                        Registrar
                    </button>
                </div>
            </div>

            {/* Gráfico */}
            <div className="w-full h-[300px] md:h-[400px] max-w-4xl bg-bg-secondary/30 rounded-2xl p-4 border border-glass-border shadow-sm backdrop-blur-sm relative z-0">
                <h3 className="text-center text-text-secondary text-sm mb-4 font-medium uppercase tracking-wider">Evolución de {MEASUREMENT_TYPES.find(t => t.value === selectedType)?.label}</h3>

                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        {/* CORRECCIÓN: Aumentado el margen inferior (bottom: 25) para que quepan las fechas */}
                        <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 25, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={axisColor} opacity={0.1} vertical={false} />
                            <XAxis
                                dataKey="timestamp"
                                stroke={axisColor}
                                tick={{ fill: axisColor, fontSize: 10 }}
                                tickFormatter={(unix) => new Date(unix).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}
                                domain={['dataMin', 'dataMax']}
                                type="number"
                                scale="time"
                                tickMargin={8}
                                minTickGap={30} // Evita que se solapen si hay muchos puntos
                            />
                            <YAxis
                                stroke={axisColor}
                                tick={{ fill: axisColor, fontSize: 10 }}
                                domain={['auto', 'auto']}
                                unit=" cm"
                                tickMargin={10}
                                axisLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="var(--color-accent)"
                                strokeWidth={3}
                                dot={{ fill: 'var(--color-bg-primary)', stroke: 'var(--color-accent)', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, fill: 'var(--color-accent)' }}
                                animationDuration={1000}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-text-tertiary gap-3">
                        <div className="p-4 rounded-full bg-white/5">
                            <Ruler size={32} className="opacity-40" />
                        </div>
                        <p>No hay registros de {selectedType} aún.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <BodyMeasurementModal
                    onSave={handleSave}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
};

export default MeasurementsView;