import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Plus, Ruler } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import BodyMeasurementModal from '../BodyMeasurementModal';
import CustomSelect from '../CustomSelect';
import GlassCard from '../GlassCard';

const TYPES = [
    { value: 'cintura', label: 'Cintura' }, { value: 'pecho', label: 'Pecho' },
    { value: 'biceps', label: 'Bíceps' }, { value: 'muslos', label: 'Muslos' },
    { value: 'caderas', label: 'Caderas' }, { value: 'hombros', label: 'Hombros' },
    { value: 'gemelos', label: 'Gemelos' }, { value: 'cuello', label: 'Cuello' },
    { value: 'antebrazos', label: 'Antebrazos' }
];

const ModernTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const date = new Date(label).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    
    return (
        <div className="bg-bg-secondary border border-white/5 rounded-lg shadow-xl p-3 text-sm">
            <p className="font-semibold text-text-primary mb-2">{date}</p>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: payload[0].color || payload[0].fill }} />
                <span className="text-text-secondary">Medida:</span>
                <span className="font-medium text-text-primary">{payload[0].value} cm</span>
            </div>
        </div>
    );
};

const axisConfig = (color) => ({ stroke: color, fontSize: 11, tickLine: false, axisLine: false, tickMargin: 8 });
const grid = <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />;

const MeasurementsView = ({ axisColor }) => {
    const { bodyMeasurementsLog = [], logBodyMeasurement } = useAppStore();
    const [type, setType] = useState('cintura');
    const [showModal, setShowModal] = useState(false);

    const chartData = useMemo(() => 
        bodyMeasurementsLog
            .filter(l => l.measure_type === type)
            .map(l => ({ timestamp: new Date(l.log_date).getTime(), value: parseFloat(l.value) }))
            .sort((a, b) => a.timestamp - b.timestamp)
    , [bodyMeasurementsLog, type]);

    const activeLabel = TYPES.find(t => t.value === type)?.label;

    return (
        <div className="flex flex-col gap-4">
            {/* Controles Superiores (Sin bordes ni fondos) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
                <div className="w-full sm:w-64 z-10">
                    <CustomSelect value={type} onChange={setType} options={TYPES} placeholder="Filtrar por zona" />
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent text-bg-secondary px-5 py-2.5 rounded-lg font-bold hover:brightness-110 transition active:scale-95"
                >
                    <Plus size={18} /> Registrar
                </button>
            </div>

            {/* Gráfico */}
            <GlassCard className="p-5 border-white/5 relative">
                <h3 className="text-base font-semibold text-text-primary mb-4">Evolución de {activeLabel}</h3>
                
                {chartData.length > 0 ? (
                    <div className="h-52 w-full [&_*]:!outline-none">
                        <ResponsiveContainer>
                            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorMedida" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                {grid}
                                <XAxis 
                                    dataKey="timestamp" 
                                    type="number" 
                                    domain={['dataMin', 'dataMax']} 
                                    tickFormatter={(t) => new Date(t).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} 
                                    {...axisConfig(axisColor)} 
                                />
                                <YAxis domain={['auto', 'auto']} {...axisConfig(axisColor)} />
                                <Tooltip content={<ModernTooltip />} />
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="var(--color-accent)" 
                                    strokeWidth={3} 
                                    fill="url(#colorMedida)" 
                                    activeDot={{ r: 6, strokeWidth: 0, fill: "var(--color-accent)" }} 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-52 text-text-muted text-sm gap-3">
                        <div className="p-3 rounded-full bg-white/5"><Ruler size={24} className="opacity-50" /></div>
                        <p>No hay registros de {type} aún.</p>
                    </div>
                )}
            </GlassCard>

            {showModal && <BodyMeasurementModal onSave={logBodyMeasurement} onClose={() => setShowModal(false)} />}
        </div>
    );
};

export default MeasurementsView;