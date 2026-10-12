/* frontend/src/components/progress/MeasurementsView.jsx */
import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import BodyMeasurementModal from '../BodyMeasurementModal';
import CustomSelect from '../CustomSelect';
import { MeasurementChart } from './ProgressCharts';

const TYPES = [
    { value: 'cintura', label: 'Cintura' }, { value: 'pecho', label: 'Pecho' },
    { value: 'biceps', label: 'Bíceps' }, { value: 'muslos', label: 'Muslos' },
    { value: 'caderas', label: 'Caderas' }, { value: 'hombros', label: 'Hombros' },
    { value: 'gemelos', label: 'Gemelos' }, { value: 'cuello', label: 'Cuello' },
    { value: 'antebrazos', label: 'Antebrazos' }
];

const MeasurementsView = ({ axisColor }) => {
    const { bodyMeasurementsLog = [], logBodyMeasurement } = useAppStore(
        useShallow((state) => ({
            bodyMeasurementsLog: state.bodyMeasurementsLog,
            logBodyMeasurement: state.logBodyMeasurement
        }))
    );
    const [type, setType] = useState('cintura');
    const [showModal, setShowModal] = useState(false);

    const chartData = useMemo(
        () =>
            bodyMeasurementsLog
                .filter((l) => l.measure_type === type)
                .map((l) => ({ timestamp: new Date(l.log_date).getTime(), value: parseFloat(l.value) }))
                .sort((a, b) => a.timestamp - b.timestamp),
        [bodyMeasurementsLog, type]
    );

    const activeLabel = TYPES.find((t) => t.value === type)?.label;

    return (
        <div className="flex flex-col gap-4">
            {/* Controles Superiores */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
                <div className="w-full sm:w-64 z-10">
                    <CustomSelect value={type} onChange={setType} options={TYPES} placeholder="Filtrar por zona" />
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent text-accent-contrast px-5 py-2.5 rounded-full font-bold hover:brightness-110 transition active:scale-95 shadow-md shadow-accent/20"
                >
                    <Plus size={18} strokeWidth={2.5} /> Registrar Medida
                </button>
            </div>

            {/* Gráfico Liquid Glass */}
            <MeasurementChart data={chartData} axisColor={axisColor} measureLabel={activeLabel} />

            {showModal && <BodyMeasurementModal onSave={logBodyMeasurement} onClose={() => setShowModal(false)} />}
        </div>
    );
};

export default MeasurementsView;
