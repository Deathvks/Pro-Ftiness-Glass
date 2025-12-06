/* frontend/src/components/PlateCalculatorModal.jsx */
import React, { useState, useEffect } from 'react';
import { X, Disc, Calculator } from 'lucide-react';
import CustomSelect from './CustomSelect';

const AVAILABLE_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

const BAR_OPTIONS = [
    { value: 20, label: 'Barra Olímpica (20 kg)' },
    { value: 15, label: 'Barra Femenina (15 kg)' },
    { value: 10, label: 'Barra Técnica (10 kg)' },
    { value: 0, label: 'Solo Discos (0 kg)' },
];

const PlateCalculatorModal = ({ onClose, initialWeight = '' }) => {
    const [targetWeight, setTargetWeight] = useState(initialWeight);
    const [barWeight, setBarWeight] = useState(20);
    const [plates, setPlates] = useState([]);
    const [remainder, setRemainder] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        // Limpiamos estados si el input está vacío
        if (targetWeight === '') {
            setPlates([]);
            setRemainder(0);
            setErrorMsg('');
            return;
        }

        const weight = parseFloat(targetWeight);

        // Validación: Peso inválido o menor que la barra
        if (isNaN(weight)) {
            setPlates([]);
            setErrorMsg('Peso inválido');
            return;
        }

        if (weight < barWeight) {
            setPlates([]);
            setErrorMsg(`El peso debe ser mayor a la barra (${barWeight}kg)`);
            return;
        }

        // Si es igual, barra vacía
        if (weight === barWeight) {
            setPlates([]);
            setRemainder(0);
            setErrorMsg('Barra vacía');
            return;
        }

        // Cálculo normal
        setErrorMsg('');
        let weightPerSide = (weight - barWeight) / 2;
        const calculatedPlates = [];

        AVAILABLE_PLATES.forEach(plate => {
            const count = Math.floor(weightPerSide / plate);
            if (count > 0) {
                for (let i = 0; i < count; i++) calculatedPlates.push(plate);
                weightPerSide = parseFloat((weightPerSide - count * plate).toFixed(2));
            }
        });

        setPlates(calculatedPlates);
        setRemainder(weightPerSide * 2);
    }, [targetWeight, barWeight]);

    const getPlateStyle = (weight) => {
        if (weight >= 25) return 'bg-red-600 h-24';
        if (weight >= 20) return 'bg-blue-600 h-24';
        if (weight >= 15) return 'bg-yellow-500 h-20';
        if (weight >= 10) return 'bg-green-600 h-16';
        if (weight >= 5) return 'bg-slate-100 h-14 border-slate-300';
        if (weight >= 2.5) return 'bg-slate-800 h-12';
        return 'bg-slate-400 h-10';
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-bg-secondary border border-glass-border rounded-xl shadow-2xl overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-glass-border bg-bg-primary/50">
                    <div className="flex items-center gap-2 text-accent">
                        <Calculator size={20} />
                        <h2 className="text-lg font-bold text-text-primary">Calculadora</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-text-muted hover:text-text-primary">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-5">
                    <div className="space-y-4">
                        {/* Input Peso Total */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-text-secondary uppercase">Peso Total (kg)</label>
                            <input
                                type="number"
                                inputMode="decimal"
                                value={targetWeight}
                                onChange={(e) => setTargetWeight(e.target.value)}
                                placeholder="0"
                                className="w-full bg-bg-primary border border-glass-border rounded-lg px-3 py-3 text-3xl font-bold text-center focus:ring-2 focus:ring-accent focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
                                autoFocus
                            />
                        </div>

                        {/* Selector Barra */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-text-secondary uppercase">Tipo de Barra</label>
                            <CustomSelect
                                options={BAR_OPTIONS}
                                value={barWeight}
                                onChange={setBarWeight}
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Visual Bar */}
                    <div className="bg-bg-primary/30 rounded-lg p-4 flex items-center justify-center min-h-[140px] border border-glass-border relative overflow-hidden transition-all">
                        {errorMsg ? (
                            <div className="text-text-muted text-sm font-medium text-center px-4 animate-fade-in">
                                {errorMsg}
                            </div>
                        ) : plates.length > 0 ? (
                            <div className="flex items-center justify-start overflow-x-auto w-full px-4 scrollbar-hide animate-fade-in">
                                {/* Barra gris de fondo */}
                                <div className="h-6 w-full absolute left-0 bg-gray-400/30 z-0"></div>
                                {/* Tope de la barra */}
                                <div className="h-6 w-12 bg-gray-400 rounded-l-sm z-10 flex-shrink-0 border-r border-black/30"></div>
                                {/* Discos */}
                                {plates.map((plate, idx) => (
                                    <div
                                        key={idx}
                                        className={`w-3.5 mx-[1px] rounded-[2px] flex-shrink-0 border-l border-r border-black/20 shadow-sm z-10 ${getPlateStyle(plate)}`}
                                    />
                                ))}
                                {/* Cierre (collar) */}
                                <div className="h-6 w-4 bg-gray-400 rounded-r-sm z-10 flex-shrink-0 ml-1 border-l border-black/30"></div>
                            </div>
                        ) : (
                            <div className="text-text-muted text-sm flex flex-col items-center gap-2 opacity-50">
                                <Disc size={40} />
                                <span>Introduce el peso total</span>
                            </div>
                        )}
                    </div>

                    {/* Resumen de Discos */}
                    {plates.length > 0 && (
                        <div className="animate-slide-up">
                            <h3 className="text-xs font-semibold text-text-secondary mb-2">Necesitas (por lado):</h3>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(plates.reduce((acc, curr) => {
                                    acc[curr] = (acc[curr] || 0) + 1;
                                    return acc;
                                }, {})).sort((a, b) => parseFloat(b[0]) - parseFloat(a[0])).map(([weight, count]) => (
                                    <div key={weight} className="flex items-center gap-1.5 bg-bg-primary px-3 py-1.5 rounded-lg border border-glass-border">
                                        <span className="text-lg font-bold text-accent">{count}</span>
                                        <span className="text-xs text-text-muted uppercase font-bold">x {weight} kg</span>
                                    </div>
                                ))}
                            </div>
                            {remainder > 0 && (
                                <p className="text-xs text-amber-500 mt-3 font-medium bg-amber-500/10 p-2 rounded border border-amber-500/20 inline-block">
                                    ⚠️ Sobran {remainder.toFixed(2)} kg que no cuadran con los discos.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlateCalculatorModal;