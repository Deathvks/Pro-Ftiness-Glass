import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { LayoutGrid, PieChart, Flame, Beef, Wheat, Salad, IceCream, AlertTriangle } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';

interface Totals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  sugar: number;
}

interface Targets {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  sugar: number;
}

interface DailySummaryProps {
  totals: Totals;
  targets: Targets;
  onOpenSugarModal: () => void;
}

interface NutritionStatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  value: string | number;
  unit: string;
  isDanger?: boolean;
  onPress?: () => void;
  isDark: boolean;
  colors: any;
}

const NutritionStatCard: React.FC<NutritionStatCardProps> = ({
  icon,
  iconBg,
  title,
  value,
  unit,
  isDanger = false,
  onPress,
  isDark,
  colors,
}) => {
  const content = (
    <View
      style={[
        styles.statCardWrapper,
        {
          backgroundColor: isDanger
            ? '#ef4444'
            : isDark
            ? 'rgba(255, 255, 255, 0.04)'
            : 'rgba(255, 255, 255, 0.65)',
          borderColor: isDanger
            ? '#ef4444'
            : isDark
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.06)',
        },
      ]}
    >
      {/* Icon badge - 48x48 rounded-2xl squircle centered */}
      <View
        style={[
          styles.statIconContainer,
          {
            backgroundColor: isDanger ? 'rgba(255, 255, 255, 0.2)' : iconBg,
          },
        ]}
      >
        {icon}
      </View>

      {/* Title uppercase tracking */}
      <Text
        style={[
          styles.statCardTitle,
          { color: isDanger ? 'rgba(255, 255, 255, 0.9)' : colors.textSecondary },
        ]}
      >
        {title}
      </Text>

      {/* Value & unit */}
      <View style={styles.statValRow}>
        <Text
          style={[
            styles.statCardValue,
            { color: isDanger ? '#ffffff' : colors.text },
          ]}
        >
          {value}
        </Text>
        <Text
          style={[
            styles.statCardUnit,
            { color: isDanger ? 'rgba(255, 255, 255, 0.8)' : colors.textMuted },
          ]}
        >
          {unit}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.statCardTouch}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.statCardTouch}>{content}</View>;
};

export const DailySummary: React.FC<DailySummaryProps> = ({
  totals,
  targets,
  onOpenSugarModal,
}) => {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const [summaryView, setSummaryView] = useState<'grid' | 'chart'>('grid');
  const [selectedMacro, setSelectedMacro] = useState<'protein' | 'carbs' | 'fats' | 'sugar' | null>(null);

  const isSugarHigh = totals.sugar >= targets.sugar;

  // Macro calories calculation
  const pCals = totals.protein * 4;
  const fCals = totals.fats * 9;
  const sugarCals = totals.sugar * 4;
  const remainingCarbCals = Math.max(0, totals.carbs * 4 - sugarCals);
  const totalMacroCals = pCals + fCals + sugarCals + remainingCarbCals;

  const pPct = totalMacroCals > 0 ? (pCals / totalMacroCals) * 100 : 0;
  const remainingCPct = totalMacroCals > 0 ? (remainingCarbCals / totalMacroCals) * 100 : 0;
  const sugarPct = totalMacroCals > 0 ? (sugarCals / totalMacroCals) * 100 : 0;
  const fPct = totalMacroCals > 0 ? (fCals / totalMacroCals) * 100 : 0;
  const totalCarbsPct = remainingCPct + sugarPct;

  // Donut SVG circumference calculation
  const radius = 55;
  const circumference = 2 * Math.PI * radius;

  const pOffset = 0;
  const pStroke = (pPct / 100) * circumference;

  const cOffset = -pStroke;
  const cStroke = (remainingCPct / 100) * circumference;

  const sOffset = -(pStroke + cStroke);
  const sStroke = (sugarPct / 100) * circumference;

  const fOffset = -(pStroke + cStroke + sStroke);
  const fStroke = (fPct / 100) * circumference;

  const handleToggleView = (mode: 'grid' | 'chart') => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setSummaryView(mode);
    setSelectedMacro(null);
  };

  const handleSelectMacro = (macro: 'protein' | 'carbs' | 'fats' | 'sugar') => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSelectedMacro(prev => (prev === macro ? null : macro));
  };

  const renderCenterInfo = () => {
    if (selectedMacro === 'protein') {
      return (
        <View style={styles.chartCenter}>
          <Text style={[styles.centerSubLabel, { color: '#ef4444' }]}>PROTEÍNAS</Text>
          <Text style={[styles.centerMainVal, { color: colors.text }]}>
            {Math.round(totals.protein)}
            <Text style={[styles.centerUnit, { color: colors.textMuted }]}>/{targets.protein}g</Text>
          </Text>
          <Text style={[styles.centerSubText, { color: colors.textMuted }]}>
            {Math.round(pPct)}% ({Math.round(pCals)} kcal)
          </Text>
        </View>
      );
    }
    if (selectedMacro === 'carbs') {
      return (
        <View style={styles.chartCenter}>
          <Text style={[styles.centerSubLabel, { color: '#3b82f6' }]}>CARBOS</Text>
          <Text style={[styles.centerMainVal, { color: colors.text }]}>
            {Math.round(totals.carbs)}
            <Text style={[styles.centerUnit, { color: colors.textMuted }]}>/{targets.carbs}g</Text>
          </Text>
          <Text style={[styles.centerSubText, { color: colors.textMuted }]}>
            {Math.round(totalCarbsPct)}% ({Math.round(remainingCarbCals + sugarCals)} kcal)
          </Text>
        </View>
      );
    }
    if (selectedMacro === 'sugar') {
      return (
        <View style={styles.chartCenter}>
          <Text style={[styles.centerSubLabel, { color: '#ec4899' }]}>AZÚCAR</Text>
          <Text style={[styles.centerMainVal, { color: colors.text }]}>
            {Math.round(totals.sugar)}
            <Text style={[styles.centerUnit, { color: colors.textMuted }]}>/{targets.sugar}g</Text>
          </Text>
          <Text style={[styles.centerSubText, { color: colors.textMuted }]}>
            {Math.round(sugarPct)}% ({Math.round(sugarCals)} kcal)
          </Text>
        </View>
      );
    }
    if (selectedMacro === 'fats') {
      return (
        <View style={styles.chartCenter}>
          <Text style={[styles.centerSubLabel, { color: '#22c55e' }]}>GRASAS</Text>
          <Text style={[styles.centerMainVal, { color: colors.text }]}>
            {Math.round(totals.fats)}
            <Text style={[styles.centerUnit, { color: colors.textMuted }]}>/{targets.fats}g</Text>
          </Text>
          <Text style={[styles.centerSubText, { color: colors.textMuted }]}>
            {Math.round(fPct)}% ({Math.round(fCals)} kcal)
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.chartCenter}>
        <Text style={[styles.centerMainVal, { color: colors.text }]}>{Math.round(totals.calories)}</Text>
        <Text style={[styles.centerSubText, { color: colors.textMuted }]}>/ {targets.calories} kcal</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.glassWrapper}>
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.card,
            {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.4)',
            },
          ]}
        >
          {/* Header with Switcher */}
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.text }]}>Resumen del Día</Text>
            <View
              style={[
                styles.toggleContainer,
                {
                  backgroundColor: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.06)',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => handleToggleView('grid')}
                style={[
                  styles.toggleBtn,
                  summaryView === 'grid' && {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.9)',
                  },
                ]}
                activeOpacity={0.7}
              >
                <LayoutGrid size={16} color={summaryView === 'grid' ? colors.tint : colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleToggleView('chart')}
                style={[
                  styles.toggleBtn,
                  summaryView === 'chart' && {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.9)',
                  },
                ]}
                activeOpacity={0.7}
              >
                <PieChart size={16} color={summaryView === 'chart' ? colors.tint : colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* VIEW: GRID (Exact frontend Bento Grid with large vertical StatCards) */}
          {summaryView === 'grid' ? (
            <View style={styles.gridContainer}>
              {/* Row 1: Calorías & Proteínas */}
              <View style={styles.gridRow}>
                <NutritionStatCard
                  icon={<Flame size={24} color="#f97316" />}
                  iconBg="rgba(249, 115, 22, 0.15)"
                  title="Calorías"
                  value={Math.round(totals.calories).toLocaleString('es-ES')}
                  unit={`/ ${targets.calories.toLocaleString('es-ES')} kcal`}
                  isDark={isDark}
                  colors={colors}
                />
                <NutritionStatCard
                  icon={<Beef size={24} color="#ef4444" />}
                  iconBg="rgba(239, 68, 68, 0.15)"
                  title="Proteínas"
                  value={totals.protein.toFixed(1)}
                  unit={`/ ${targets.protein} g`}
                  isDark={isDark}
                  colors={colors}
                />
              </View>

              {/* Row 2: Carbos & Grasas */}
              <View style={styles.gridRow}>
                <NutritionStatCard
                  icon={<Wheat size={24} color="#3b82f6" />}
                  iconBg="rgba(59, 130, 246, 0.15)"
                  title="Carbos"
                  value={totals.carbs.toFixed(1)}
                  unit={`/ ${targets.carbs} g`}
                  isDark={isDark}
                  colors={colors}
                />
                <NutritionStatCard
                  icon={<Salad size={24} color="#22c55e" />}
                  iconBg="rgba(34, 197, 94, 0.15)"
                  title="Grasas"
                  value={totals.fats.toFixed(1)}
                  unit={`/ ${targets.fats} g`}
                  isDark={isDark}
                  colors={colors}
                />
              </View>

              {/* Row 3: Azúcar (Full-width card, red danger if limit exceeded) */}
              <NutritionStatCard
                icon={
                  isSugarHigh ? (
                    <AlertTriangle size={24} color="#ffffff" />
                  ) : (
                    <IceCream size={24} color="#ec4899" />
                  )
                }
                iconBg="rgba(236, 72, 153, 0.15)"
                title={isSugarHigh ? 'Azúcar (Límite Superado)' : 'Azúcar'}
                value={totals.sugar.toFixed(1)}
                unit={`/ ${targets.sugar} g`}
                isDanger={isSugarHigh}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                  onOpenSugarModal();
                }}
                isDark={isDark}
                colors={colors}
              />
            </View>
          ) : (
            /* VIEW: CHART */
            <View style={styles.chartContainer}>
              <View style={styles.chartWrapper}>
                <Svg width={140} height={140} viewBox="0 0 140 140" style={{ transform: [{ rotate: '-90deg' }] }}>
                  {/* Background Track */}
                  <Circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}
                    strokeWidth="10"
                    fill="none"
                  />
                  {totalMacroCals > 0 && (
                    <G>
                      {/* Proteínas */}
                      {pPct > 0 && (
                        <Circle
                          cx="70"
                          cy="70"
                          r={radius}
                          stroke="#ef4444"
                          strokeWidth={selectedMacro === 'protein' ? 14 : 10}
                          strokeDasharray={`${pStroke} ${circumference}`}
                          strokeDashoffset={pOffset}
                          strokeLinecap="round"
                          fill="none"
                          opacity={selectedMacro && selectedMacro !== 'protein' ? 0.35 : 1}
                        />
                      )}
                      {/* Carbos */}
                      {remainingCPct > 0 && (
                        <Circle
                          cx="70"
                          cy="70"
                          r={radius}
                          stroke="#3b82f6"
                          strokeWidth={selectedMacro === 'carbs' ? 14 : 10}
                          strokeDasharray={`${cStroke} ${circumference}`}
                          strokeDashoffset={cOffset}
                          strokeLinecap="round"
                          fill="none"
                          opacity={selectedMacro && selectedMacro !== 'carbs' ? 0.35 : 1}
                        />
                      )}
                      {/* Azúcar */}
                      {sugarPct > 0 && (
                        <Circle
                          cx="70"
                          cy="70"
                          r={radius}
                          stroke="#ec4899"
                          strokeWidth={selectedMacro === 'sugar' ? 14 : 10}
                          strokeDasharray={`${sStroke} ${circumference}`}
                          strokeDashoffset={sOffset}
                          strokeLinecap="round"
                          fill="none"
                          opacity={selectedMacro && selectedMacro !== 'sugar' ? 0.35 : 1}
                        />
                      )}
                      {/* Grasas */}
                      {fPct > 0 && (
                        <Circle
                          cx="70"
                          cy="70"
                          r={radius}
                          stroke="#22c55e"
                          strokeWidth={selectedMacro === 'fats' ? 14 : 10}
                          strokeDasharray={`${fStroke} ${circumference}`}
                          strokeDashoffset={fOffset}
                          strokeLinecap="round"
                          fill="none"
                          opacity={selectedMacro && selectedMacro !== 'fats' ? 0.35 : 1}
                        />
                      )}
                    </G>
                  )}
                </Svg>
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                  {renderCenterInfo()}
                </View>
              </View>

              {/* Macro Pills Row */}
              <View style={styles.macroPillsRow}>
                <TouchableOpacity
                  onPress={() => handleSelectMacro('protein')}
                  activeOpacity={0.7}
                  style={[
                    styles.macroPill,
                    {
                      borderColor: selectedMacro === 'protein' ? '#ef4444' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                      backgroundColor: selectedMacro === 'protein' ? 'rgba(239,68,68,0.15)' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)',
                    },
                  ]}
                >
                  <View style={[styles.macroDot, { backgroundColor: '#ef4444' }]} />
                  <Text style={[styles.macroPillTitle, { color: colors.textSecondary }]}>Prot</Text>
                  <Text style={[styles.macroPillVal, { color: colors.text }]}>{Math.round(totals.protein)}g</Text>
                  <Text style={[styles.macroPillPct, { color: colors.textMuted }]}>{Math.round(pPct)}%</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleSelectMacro('carbs')}
                  activeOpacity={0.7}
                  style={[
                    styles.macroPill,
                    {
                      borderColor: selectedMacro === 'carbs' ? '#3b82f6' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                      backgroundColor: selectedMacro === 'carbs' ? 'rgba(59,130,246,0.15)' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)',
                    },
                  ]}
                >
                  <View style={[styles.macroDot, { backgroundColor: '#3b82f6' }]} />
                  <Text style={[styles.macroPillTitle, { color: colors.textSecondary }]}>Carb</Text>
                  <Text style={[styles.macroPillVal, { color: colors.text }]}>{Math.round(totals.carbs)}g</Text>
                  <Text style={[styles.macroPillPct, { color: colors.textMuted }]}>{Math.round(totalCarbsPct)}%</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleSelectMacro('fats')}
                  activeOpacity={0.7}
                  style={[
                    styles.macroPill,
                    {
                      borderColor: selectedMacro === 'fats' ? '#22c55e' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                      backgroundColor: selectedMacro === 'fats' ? 'rgba(34,197,94,0.15)' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)',
                    },
                  ]}
                >
                  <View style={[styles.macroDot, { backgroundColor: '#22c55e' }]} />
                  <Text style={[styles.macroPillTitle, { color: colors.textSecondary }]}>Gras</Text>
                  <Text style={[styles.macroPillVal, { color: colors.text }]}>{Math.round(totals.fats)}g</Text>
                  <Text style={[styles.macroPillPct, { color: colors.textMuted }]}>{Math.round(fPct)}%</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    handleSelectMacro('sugar');
                    onOpenSugarModal();
                  }}
                  activeOpacity={0.7}
                  style={[
                    styles.macroPill,
                    {
                      borderColor: isSugarHigh ? '#ef4444' : selectedMacro === 'sugar' ? '#ec4899' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                      backgroundColor: isSugarHigh
                        ? 'rgba(239,68,68,0.2)'
                        : selectedMacro === 'sugar'
                        ? 'rgba(236,72,153,0.15)'
                        : isDark
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(255,255,255,0.5)',
                    },
                  ]}
                >
                  <View style={[styles.macroDot, { backgroundColor: isSugarHigh ? '#ef4444' : '#ec4899' }]} />
                  <Text style={[styles.macroPillTitle, { color: isSugarHigh ? '#ef4444' : colors.textSecondary }]}>Azúc</Text>
                  <Text style={[styles.macroPillVal, { color: isSugarHigh ? '#ef4444' : colors.text }]}>{Math.round(totals.sugar)}g</Text>
                  <Text style={[styles.macroPillPct, { color: isSugarHigh ? '#ef4444' : colors.textMuted }]}>{Math.round(sugarPct)}%</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  glassWrapper: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  card: {
    padding: 18,
    borderRadius: 28,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
  },
  gridContainer: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCardTouch: {
    flex: 1,
  },
  statCardWrapper: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statValRow: {
    alignItems: 'center',
    gap: 2,
  },
  statCardValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statCardUnit: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  chartWrapper: {
    width: 140,
    height: 140,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  chartCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSubLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  centerMainVal: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  centerUnit: {
    fontSize: 13,
    fontWeight: '600',
  },
  centerSubText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  macroPillsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  macroPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  macroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  macroPillTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  macroPillVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  macroPillPct: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
});
