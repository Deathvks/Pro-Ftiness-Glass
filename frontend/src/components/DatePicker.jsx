import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const parseLocalDate = (value) => {
  if (!value) return new Date();
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const toDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DatePicker = ({ value, onChange, maxDate, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initialDate = parseLocalDate(value);
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });
  const pickerRef = useRef(null);
  const selectedDate = parseLocalDate(value);
  const max = maxDate ? parseLocalDate(maxDate) : null;

  useEffect(() => {
    if (!isOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!pickerRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    const nextSelected = parseLocalDate(value);
    setVisibleMonth(new Date(nextSelected.getFullYear(), nextSelected.getMonth(), 1));
  }, [value]);

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingDays = (new Date(year, month, 1).getDay() + 6) % 7;
    return [
      ...Array.from({ length: leadingDays }, (_, index) => ({ key: `empty-${index}`, date: null })),
      ...Array.from({ length: daysInMonth }, (_, index) => {
        const date = new Date(year, month, index + 1);
        return { key: toDateValue(date), date };
      })
    ];
  }, [visibleMonth]);

  const monthLabel = visibleMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const todayValue = toDateValue(new Date());

  const moveMonth = (amount) => {
    setVisibleMonth(current => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  const isAfterMaxMonth = max && (
    visibleMonth.getFullYear() > max.getFullYear()
    || (visibleMonth.getFullYear() === max.getFullYear() && visibleMonth.getMonth() >= max.getMonth())
  );

  return (
    <div ref={pickerRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(open => !open)}
        className="flex w-full items-center justify-between gap-3 rounded-[16px] border border-black/5 bg-black/5 px-4 py-3 text-left text-text-primary transition hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
      >
        <span className="flex min-w-0 items-center gap-3">
          <CalendarDays size={18} className="shrink-0 text-accent" />
          <span className="truncate text-sm font-semibold">
            {selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </span>
        <ChevronDown size={16} className={`shrink-0 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Seleccionar fecha"
          className="absolute left-0 top-full z-[130] mt-2 w-full min-w-[280px] rounded-[20px] border border-black/5 bg-bg-primary p-4 text-text-primary shadow-2xl dark:border-white/5"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              className="rounded-xl p-2 text-text-secondary transition hover:bg-glass-bg hover:text-text-primary"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <p className="text-sm font-bold capitalize">{monthLabel}</p>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              disabled={isAfterMaxMonth}
              className="rounded-xl p-2 text-text-secondary transition hover:bg-glass-bg hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Mes siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-bold text-text-muted">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => <span key={`${day}-${index}`} className="py-2">{day}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(({ key, date }) => {
              if (!date) return <span key={key} />;
              const dateValue = toDateValue(date);
              const isSelected = dateValue === value;
              const isToday = dateValue === todayValue;
              const isDisabled = Boolean(max && dateValue > maxDate);
              return (
                <button
                  key={key}
                  type="button"
                  disabled={isDisabled}
                  aria-label={date.toLocaleDateString('es-ES', { dateStyle: 'full' })}
                  aria-pressed={isSelected}
                  onClick={() => {
                    onChange(dateValue);
                    setIsOpen(false);
                  }}
                  className={`aspect-square rounded-xl text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-25 ${
                    isSelected
                      ? 'bg-accent text-accent-contrast shadow-sm'
                      : isToday
                        ? 'bg-glass-bg text-text-primary ring-1 ring-accent/40'
                        : 'text-text-secondary hover:bg-glass-bg hover:text-text-primary'
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
