import React from 'react';
import GlassCard from './GlassCard';

const StatCard = ({ icon, title, value, unit }) => (
  <GlassCard className="p-5">
    <div className="flex items-center gap-4">
      <div className="flex-shrink-0 text-accent">
        {icon}
      </div>
      <div className="flex flex-col">
        <p className="text-sm font-medium text-text-secondary">{title}</p>
        <p className="text-2xl font-bold text-text-primary">
          {value} <span className="text-base font-medium text-text-muted">{unit}</span>
        </p>
      </div>
    </div>
  </GlassCard>
);

export default StatCard;