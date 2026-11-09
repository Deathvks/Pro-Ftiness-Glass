import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Line,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import { ContentCardBackdrop } from '@/components/ui/ContentCardBackdrop';
import {
  Activity,
  TrendingUp,
  Flame,
  PieChart,
  Droplet,
  Ruler,
  Trophy,
  Award,
  Target,
  Sparkles,
  LucideIcon,
} from 'lucide-react-native';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { PeriodFilter, PeriodType, filterDataByPeriod } from './PeriodFilter';
import { StatBadge } from './StatBadge';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ==========================================
// Base Card Container for Liquid Glass Charts
// ==========================================
interface ChartBaseProps {
  title: string;
  icon?: LucideIcon;
  periods?: PeriodType[];
  activePeriod?: PeriodType;
  onPeriodChange?: (period: PeriodType) => void;
  kpis?: Array<{
    label: string;
    value: string | number;
    unit?: string;
    trend?: string;
    isPositive?: boolean;
    icon?: LucideIcon;
    onPress?: () => void;
  }>;
  alertsContent?: React.ReactNode;
  headerExtra?: React.ReactNode;
  emptyMessage?: string;
  children: React.ReactNode;
}

export function ChartBase({
  title,
  icon: Icon,
  periods,
  activePeriod,
  onPeriodChange,
  kpis,
  alertsContent,
  headerExtra,
  emptyMessage = 'Sin datos suficientes',
  children,
}: ChartBaseProps) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  return (
    <View
      style={[
        styles.cardContainer,
        {
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        },
      ]}
    >
      <ContentCardBackdrop
        colorScheme={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          {Icon && (
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
            >
              <Icon size={18} color={colors.tint} strokeWidth={2.2} />
            </View>
          )}
          <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
        </View>

        {periods && activePeriod && onPeriodChange && (
          <PeriodFilter
            periods={periods}
            activePeriod={activePeriod}
            onChange={onPeriodChange}
          />
        )}
      </View>

      {headerExtra && <View style={styles.extraHeaderWrap}>{headerExtra}</View>}

      {/* KPIs Grid */}
      {kpis && kpis.length > 0 && (
        <View style={styles.kpiGrid}>
          {kpis.map((kpi, idx) => (
            <StatBadge key={idx} {...kpi} />
          ))}
        </View>
      )}

      {/* Alerts */}
      {alertsContent && <View style={styles.alertsWrap}>{alertsContent}</View>}

      {/* Chart Canvas */}
      <View style={styles.chartCanvas}>{children}</View>
    </View>
  );
}

// ==========================================
// 1. Gráfica de Peso Corporal (Apple Health)
// ==========================================
interface BodyWeightDataPoint {
  timestamp: number;
  'Peso (kg)': number;
}

export function BodyWeightChart({
  data,
  compactHeading = false,
}: {
  data: BodyWeightDataPoint[];
  compactHeading?: boolean;
}) {
  const [period, setPeriod] = useState<PeriodType>('3M');
  const colors = useAppColors();

  const filteredData = useMemo(() => {
    return filterDataByPeriod(data, period, item => item.timestamp);
  }, [data, period]);

  const stats = useMemo(() => {
    if (!filteredData.length) return null;
    const weights = filteredData.map(d => d['Peso (kg)']).filter(w => w > 0);
    if (!weights.length) return null;

    const current = weights[weights.length - 1];
    const start = weights[0];
    const delta = Math.round((current - start) * 10) / 10;
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const avg = Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10;

    return { current, start, delta, min, max, avg, count: weights.length };
  }, [filteredData]);

  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const chartWidth = containerWidth > 0 ? containerWidth : Math.max(windowWidth - 64, 220);
  const chartHeight = 180;
  const paddingX = 24;
  const paddingY = 28;

  // Path generator for SVG area
  const svgPaths = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return null;

    const weights = filteredData.map(d => d['Peso (kg)']);
    const minVal = Math.min(...weights) - 1;
    const maxVal = Math.max(...weights) + 1;
    const valRange = maxVal - minVal || 1;

    const points = filteredData.map((d, index) => {
      const x =
        filteredData.length === 1
          ? chartWidth / 2
          : paddingX + (index / (filteredData.length - 1)) * (chartWidth - paddingX * 2);
      const y =
        chartHeight -
        paddingY -
        ((d['Peso (kg)'] - minVal) / valRange) * (chartHeight - paddingY * 2);
      return { x, y, weight: d['Peso (kg)'], timestamp: d.timestamp };
    });

    // Build line path
    const lineD = points.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    // Build closed area path
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const bottomY = chartHeight - paddingY;
    const areaD = `${lineD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

    // Average Y line
    let avgY = null;
    if (stats?.avg) {
      avgY =
        chartHeight -
        paddingY -
        ((stats.avg - minVal) / valRange) * (chartHeight - paddingY * 2);
    }

    return { points, lineD, areaD, avgY, minVal, maxVal };
  }, [filteredData, chartWidth, chartHeight, stats?.avg]);

  return (
    <ChartBase
      title={compactHeading ? 'Evolución en el tiempo' : 'Evolución de Peso'}
      icon={Activity}
      periods={['7D', '1M', '3M', '6M', '1A', 'Todo']}
      activePeriod={period}
      onPeriodChange={setPeriod}
      kpis={
        stats
          ? [
              {
                label: 'Peso Actual',
                value: stats.current,
                unit: 'kg',
                trend:
                  stats.count > 1
                    ? `${stats.delta > 0 ? '+' : ''}${stats.delta} kg`
                    : '1 reg.',
                isPositive: stats.delta <= 0,
                icon: Activity,
              },
              {
                label: 'Media',
                value: stats.avg,
                unit: 'kg',
                trend: period,
                icon: Target,
              },
              {
                label: 'Mínimo',
                value: stats.min,
                unit: 'kg',
              },
              {
                label: 'Máximo',
                value: stats.max,
                unit: 'kg',
              },
            ]
          : undefined
      }
    >
      {!svgPaths || svgPaths.points.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Sin registros de peso en este período
          </Text>
          {period !== 'Todo' && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setPeriod('Todo')}
              style={[
                styles.seeAllBtn,
                {
                  backgroundColor: colors.tint + '18',
                  borderColor: colors.tint + '35',
                },
              ]}
            >
              <Text style={[styles.seeAllText, { color: colors.tint }]}>
                Ver todo el historial
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View
          onLayout={e => {
            const w = e.nativeEvent.layout.width;
            if (w > 0 && Math.abs(w - containerWidth) > 2) {
              setContainerWidth(w);
            }
          }}
          style={{ width: '100%', height: chartHeight, alignItems: 'center' }}
        >
          <Svg width={chartWidth} height={chartHeight}>
            <Defs>
              <LinearGradient id="pesoGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                <Stop offset="70%" stopColor="#10b981" stopOpacity="0.08" />
                <Stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </LinearGradient>
            </Defs>

            {/* Average Reference Line */}
            {svgPaths.avgY !== null && (
              <>
                <Line
                  x1={paddingX}
                  y1={svgPaths.avgY}
                  x2={chartWidth - paddingX}
                  y2={svgPaths.avgY}
                  stroke="#10b981"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  opacity={0.5}
                />
                <Rect
                  x={paddingX + 4}
                  y={svgPaths.avgY - 10}
                  width={80}
                  height={18}
                  rx={9}
                  fill="#064e3b"
                  opacity={0.8}
                />
                <SvgText
                  x={paddingX + 44}
                  y={svgPaths.avgY + 3}
                  fontSize={10}
                  fontWeight="bold"
                  fill="#6ee7b7"
                  textAnchor="middle"
                >
                  {`Media: ${stats?.avg}kg`}
                </SvgText>
              </>
            )}

            {/* Filled Area */}
            <Path d={svgPaths.areaD} fill="url(#pesoGrad)" />

            {/* Line Stroke */}
            <Path
              d={svgPaths.lineD}
              fill="none"
              stroke="#10b981"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Points */}
            {svgPaths.points.map((pt, idx) => (
              <Circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r={4}
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth={1.5}
              />
            ))}
          </Svg>

          {/* Date Range Labels */}
          <View style={[styles.axisRow, { paddingHorizontal: paddingX }]}>
            <Text style={[styles.axisText, { color: colors.textSecondary }]}>
              {new Date(svgPaths.points[0].timestamp).toLocaleDateString('es-ES', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <Text style={[styles.axisText, { color: colors.textSecondary }]}>
              {new Date(
                svgPaths.points[svgPaths.points.length - 1].timestamp
              ).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
        </View>
      )}
    </ChartBase>
  );
}

// ==========================================
// 2. Gráfica de Ejercicios (Apple Fitness)
// ==========================================
interface ExerciseProgressPoint {
  date: number;
  'Peso Máximo (kg)': number;
  '1RM Estimado (kg)': number;
}

export function ExerciseChart({
  data,
  exerciseName,
}: {
  data: ExerciseProgressPoint[];
  exerciseName: string;
}) {
  const [period, setPeriod] = useState<PeriodType>('3M');
  const colors = useAppColors();

  const sortedData = useMemo(() => {
    if (!data || !data.length) return [];
    return [...data].sort((a, b) => a.date - b.date);
  }, [data]);

  const filteredData = useMemo(() => {
    return filterDataByPeriod(sortedData, period, item => item.date);
  }, [sortedData, period]);

  const allTimePR = useMemo(() => {
    if (!data || !data.length) return 0;
    return Math.max(...data.map(d => d['Peso Máximo (kg)'] || 0), 0);
  }, [data]);

  const allTime1RM = useMemo(() => {
    if (!data || !data.length) return 0;
    return Math.max(...data.map(d => d['1RM Estimado (kg)'] || 0), 0);
  }, [data]);

  const stats = useMemo(() => {
    if (!filteredData.length) return null;
    const weights = filteredData.map(d => d['Peso Máximo (kg)'] || 0);
    const lastWeight = weights[weights.length - 1] || 0;
    const firstWeight = weights[0] || 0;
    const gain = Math.round((lastWeight - firstWeight) * 10) / 10;
    return { lastWeight, gain, count: filteredData.length };
  }, [filteredData]);

  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const chartWidth = containerWidth > 0 ? containerWidth : Math.max(windowWidth - 64, 220);
  const chartHeight = 180;
  const paddingX = 24;
  const paddingY = 28;

  const svgPaths = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return null;

    const allValues = filteredData.flatMap(d => [
      d['Peso Máximo (kg)'] || 0,
      d['1RM Estimado (kg)'] || 0,
    ]);
    const minVal = Math.max(Math.min(...allValues) - 2, 0);
    const maxVal = Math.max(...allValues) + 5;
    const valRange = maxVal - minVal || 1;

    const pointsMax = filteredData.map((d, index) => {
      const x =
        filteredData.length === 1
          ? chartWidth / 2
          : paddingX + (index / (filteredData.length - 1)) * (chartWidth - paddingX * 2);
      const y =
        chartHeight -
        paddingY -
        (((d['Peso Máximo (kg)'] || 0) - minVal) / valRange) *
          (chartHeight - paddingY * 2);
      return { x, y, val: d['Peso Máximo (kg)'], date: d.date };
    });

    const points1RM = filteredData.map((d, index) => {
      const x =
        filteredData.length === 1
          ? chartWidth / 2
          : paddingX + (index / (filteredData.length - 1)) * (chartWidth - paddingX * 2);
      const y =
        chartHeight -
        paddingY -
        (((d['1RM Estimado (kg)'] || 0) - minVal) / valRange) *
          (chartHeight - paddingY * 2);
      return { x, y, val: d['1RM Estimado (kg)'], date: d.date };
    });

    const lineMaxD = pointsMax.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    const line1RMD = points1RM.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    let prY = null;
    if (allTimePR > 0) {
      prY =
        chartHeight -
        paddingY -
        ((allTimePR - minVal) / valRange) * (chartHeight - paddingY * 2);
    }

    return { pointsMax, points1RM, lineMaxD, line1RMD, prY };
  }, [filteredData, chartWidth, chartHeight, allTimePR]);

  return (
    <ChartBase
      title={`Progreso: ${exerciseName || 'Ejercicio'}`}
      icon={TrendingUp}
      periods={['1M', '3M', '6M', '1A', 'Todo']}
      activePeriod={period}
      onPeriodChange={setPeriod}
      headerExtra={
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#818cf8' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              Peso Real
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f43f5e' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              1RM Estimado
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              PR
            </Text>
          </View>
        </View>
      }
      kpis={
        stats
          ? [
              {
                label: 'Última Carga',
                value: stats.lastWeight,
                unit: 'kg',
                trend:
                  stats.count > 1
                    ? `${stats.gain >= 0 ? '+' : ''}${stats.gain} kg`
                    : '1 sesión',
                isPositive: stats.gain >= 0,
                icon: TrendingUp,
              },
              {
                label: 'Récord PR',
                value: allTimePR,
                unit: 'kg',
                isPositive: true,
                icon: Trophy,
              },
              {
                label: '1RM Máximo',
                value: allTime1RM,
                unit: 'kg',
                icon: Award,
              },
            ]
          : undefined
      }
    >
      {!svgPaths || svgPaths.pointsMax.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Sin entrenamientos registrados para este ejercicio
          </Text>
          {period !== 'Todo' && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setPeriod('Todo')}
              style={[
                styles.seeAllBtn,
                {
                  backgroundColor: colors.tint + '18',
                  borderColor: colors.tint + '35',
                },
              ]}
            >
              <Text style={[styles.seeAllText, { color: colors.tint }]}>
                Ver todo el historial
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View
          onLayout={e => {
            const w = e.nativeEvent.layout.width;
            if (w > 0 && Math.abs(w - containerWidth) > 2) {
              setContainerWidth(w);
            }
          }}
          style={{ width: '100%', height: chartHeight, alignItems: 'center' }}
        >
          <Svg width={chartWidth} height={chartHeight}>
            {/* PR Reference Line */}
            {svgPaths.prY !== null && (
              <>
                <Line
                  x1={paddingX}
                  y1={svgPaths.prY}
                  x2={chartWidth - paddingX}
                  y2={svgPaths.prY}
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  opacity={0.6}
                />
                <Rect
                  x={paddingX + 4}
                  y={svgPaths.prY - 10}
                  width={65}
                  height={18}
                  rx={9}
                  fill="#78350f"
                  opacity={0.85}
                />
                <SvgText
                  x={paddingX + 36}
                  y={svgPaths.prY + 3}
                  fontSize={10}
                  fontWeight="bold"
                  fill="#fde68a"
                  textAnchor="middle"
                >
                  {`PR: ${allTimePR}kg`}
                </SvgText>
              </>
            )}

            {/* 1RM Line (Dashed rose) */}
            <Path
              d={svgPaths.line1RMD}
              fill="none"
              stroke="#f43f5e"
              strokeWidth={2}
              strokeDasharray="5 5"
              opacity={0.8}
            />

            {/* Real Weight Line (Purple) */}
            <Path
              d={svgPaths.lineMaxD}
              fill="none"
              stroke="#818cf8"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Points for Real Weight */}
            {svgPaths.pointsMax.map((pt, idx) => {
              const isPR = pt.val === allTimePR && allTimePR > 0;
              return (
                <Circle
                  key={idx}
                  cx={pt.x}
                  cy={pt.y}
                  r={isPR ? 6 : 4}
                  fill={isPR ? '#fbbf24' : '#818cf8'}
                  stroke="#ffffff"
                  strokeWidth={isPR ? 2 : 1.5}
                />
              );
            })}
          </Svg>

          {/* Dates */}
          <View style={[styles.axisRow, { paddingHorizontal: paddingX }]}>
            <Text style={[styles.axisText, { color: colors.textSecondary }]}>
              {new Date(svgPaths.pointsMax[0].date).toLocaleDateString('es-ES', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <Text style={[styles.axisText, { color: colors.textSecondary }]}>
              {new Date(
                svgPaths.pointsMax[svgPaths.pointsMax.length - 1].date
              ).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
        </View>
      )}
    </ChartBase>
  );
}

// ==========================================
// 3. Gráficas de Nutrición (Calorías, Macros, Agua)
// ==========================================
interface NutritionPoint {
  day: number;
  date: string;
  Calorías: number;
  Proteínas: number;
  Carbs: number;
  Grasas: number;
  Agua: number;
}

export function NutritionCharts({
  chartData,
}: {
  chartData: NutritionPoint[];
}) {
  const colors = useAppColors();

  const calStats = useMemo(() => {
    if (!chartData || !chartData.length) return null;
    const cals = chartData.map(x => x.Calorías || 0).filter(x => x > 0);
    if (!cals.length) return null;
    const avg = Math.round(cals.reduce((a, b) => a + b, 0) / cals.length);
    const max = Math.max(...cals);
    return { avg, max, days: cals.length };
  }, [chartData]);

  const macroStats = useMemo(() => {
    if (!chartData || !chartData.length) return null;
    const valid = chartData.filter(
      x => (x.Proteínas || 0) + (x.Carbs || 0) + (x.Grasas || 0) > 0
    );
    if (!valid.length) return null;

    const totalP = valid.reduce((a, b) => a + (b.Proteínas || 0), 0);
    const totalC = valid.reduce((a, b) => a + (b.Carbs || 0), 0);
    const totalG = valid.reduce((a, b) => a + (b.Grasas || 0), 0);

    const avgP = Math.round(totalP / valid.length);
    const avgC = Math.round(totalC / valid.length);
    const avgG = Math.round(totalG / valid.length);
    const totalGrams = avgP + avgC + avgG || 1;

    return {
      avgP,
      avgC,
      avgG,
      pctP: Math.round((avgP / totalGrams) * 100),
      pctC: Math.round((avgC / totalGrams) * 100),
      pctG: Math.round((avgG / totalGrams) * 100),
    };
  }, [chartData]);

  const waterStats = useMemo(() => {
    if (!chartData || !chartData.length) return null;
    const waters = chartData.map(x => x.Agua || 0).filter(x => x > 0);
    if (!waters.length) return null;
    const avgMl = Math.round(waters.reduce((a, b) => a + b, 0) / waters.length);
    const avgL = Math.round((avgMl / 1000) * 10) / 10;
    const goalMet = waters.filter(w => w >= 2000).length;
    return { avgL, goalMet, count: waters.length };
  }, [chartData]);

  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const chartWidth = containerWidth > 0 ? containerWidth : Math.max(windowWidth - 64, 220);
  const chartHeight = 150;
  const paddingX = 16;
  const paddingY = 20;

  // Calories Bar Chart Calculations
  const maxCalories = Math.max(...(chartData?.map(d => d.Calorías) || [0]), 2500);

  return (
    <View style={{ gap: 20 }}>
      {/* 1. Calorías Diarias */}
      <ChartBase
        title="Calorías Diarias"
        icon={Flame}
        kpis={
          calStats
            ? [
                {
                  label: 'Promedio',
                  value: calStats.avg.toLocaleString('es-ES'),
                  unit: 'kcal',
                  trend: `${calStats.days} días reg.`,
                  icon: Flame,
                },
                {
                  label: 'Pico Máximo',
                  value: calStats.max.toLocaleString('es-ES'),
                  unit: 'kcal',
                },
              ]
            : undefined
        }
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ width: Math.max(chartData.length * 20 + 32, chartWidth), height: chartHeight }}>
            <Svg
              width={Math.max(chartData.length * 20 + 32, chartWidth)}
              height={chartHeight}
            >
              <Defs>
                <LinearGradient id="barCalGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
                </LinearGradient>
              </Defs>

              {/* Bars */}
              {chartData.map((d, idx) => {
                const barWidth = 12;
                const barX = paddingX + idx * 20;
                const barHeight = Math.max(
                  ((d.Calorías || 0) / maxCalories) * (chartHeight - paddingY * 2),
                  0
                );
                const barY = chartHeight - paddingY - barHeight;

                return (
                  <React.Fragment key={idx}>
                    {/* Background capsule */}
                    <Rect
                      x={barX}
                      y={paddingY}
                      width={barWidth}
                      height={chartHeight - paddingY * 2}
                      rx={6}
                      fill="rgba(150, 150, 150, 0.08)"
                    />
                    {barHeight > 0 && (
                      <Rect
                        x={barX}
                        y={barY}
                        width={barWidth}
                        height={barHeight}
                        rx={6}
                        fill="url(#barCalGrad)"
                      />
                    )}
                    <SvgText
                      x={barX + barWidth / 2}
                      y={chartHeight - 4}
                      fontSize={9}
                      fill={colors.textSecondary}
                      textAnchor="middle"
                    >
                      {d.day}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>
        </ScrollView>
      </ChartBase>

      {/* 2. Macronutrientes */}
      <ChartBase
        title="Macronutrientes"
        icon={PieChart}
        headerExtra={
          macroStats ? (
            <View style={styles.macroPill}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#f87171' }}>
                {macroStats.pctP}% P
              </Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>·</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#60a5fa' }}>
                {macroStats.pctC}% C
              </Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>·</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#34d399' }}>
                {macroStats.pctG}% G
              </Text>
            </View>
          ) : undefined
        }
        kpis={
          macroStats
            ? [
                {
                  label: 'Proteínas',
                  value: macroStats.avgP,
                  unit: 'g',
                  trend: `${macroStats.pctP}%`,
                  icon: Sparkles,
                },
                {
                  label: 'Carbos',
                  value: macroStats.avgC,
                  unit: 'g',
                  trend: `${macroStats.pctC}%`,
                  icon: PieChart,
                },
                {
                  label: 'Grasas',
                  value: macroStats.avgG,
                  unit: 'g',
                  trend: `${macroStats.pctG}%`,
                  icon: Target,
                },
              ]
            : undefined
        }
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ width: Math.max(chartData.length * 20 + 32, chartWidth), height: chartHeight }}>
            <Svg
              width={Math.max(chartData.length * 20 + 32, chartWidth)}
              height={chartHeight}
            >
              {chartData.map((d, idx) => {
                const totalGrams = (d.Proteínas || 0) + (d.Carbs || 0) + (d.Grasas || 0);
                const maxTotal = 400;
                const barWidth = 12;
                const barX = paddingX + idx * 20;

                const pH = ((d.Proteínas || 0) / maxTotal) * (chartHeight - paddingY * 2);
                const cH = ((d.Carbs || 0) / maxTotal) * (chartHeight - paddingY * 2);
                const gH = ((d.Grasas || 0) / maxTotal) * (chartHeight - paddingY * 2);

                const pY = chartHeight - paddingY - pH;
                const cY = pY - cH;
                const gY = cY - gH;

                return (
                  <React.Fragment key={idx}>
                    {pH > 0 && (
                      <Rect
                        x={barX}
                        y={pY}
                        width={barWidth}
                        height={pH}
                        rx={3}
                        fill="#f87171"
                      />
                    )}
                    {cH > 0 && (
                      <Rect
                        x={barX}
                        y={cY}
                        width={barWidth}
                        height={cH}
                        rx={3}
                        fill="#60a5fa"
                      />
                    )}
                    {gH > 0 && (
                      <Rect
                        x={barX}
                        y={gY}
                        width={barWidth}
                        height={gH}
                        rx={3}
                        fill="#34d399"
                      />
                    )}
                    <SvgText
                      x={barX + barWidth / 2}
                      y={chartHeight - 4}
                      fontSize={9}
                      fill={colors.textSecondary}
                      textAnchor="middle"
                    >
                      {d.day}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>
        </ScrollView>
      </ChartBase>

      {/* 3. Hidratación */}
      <ChartBase
        title="Hidratación Diaria"
        icon={Droplet}
        kpis={
          waterStats
            ? [
                {
                  label: 'Media Diaria',
                  value: waterStats.avgL,
                  unit: 'L',
                  trend: `${waterStats.count} días reg.`,
                  icon: Droplet,
                },
                {
                  label: 'Meta (≥2L)',
                  value: waterStats.goalMet,
                  unit: 'días',
                  isPositive: true,
                  icon: Target,
                },
              ]
            : undefined
        }
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ width: Math.max(chartData.length * 20 + 32, chartWidth), height: chartHeight }}>
            <Svg
              width={Math.max(chartData.length * 20 + 32, chartWidth)}
              height={chartHeight}
            >
              <Defs>
                <LinearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                  <Stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </LinearGradient>
              </Defs>

              {/* 2000 ml goal line */}
              <Line
                x1={0}
                y1={chartHeight - paddingY - (2000 / 3500) * (chartHeight - paddingY * 2)}
                x2={Math.max(chartData.length * 20 + 32, chartWidth)}
                y2={chartHeight - paddingY - (2000 / 3500) * (chartHeight - paddingY * 2)}
                stroke="#38bdf8"
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.6}
              />

              {/* Water Bars */}
              {chartData.map((d, idx) => {
                const barWidth = 12;
                const barX = paddingX + idx * 20;
                const barHeight = Math.max(
                  ((d.Agua || 0) / 3500) * (chartHeight - paddingY * 2),
                  0
                );
                const barY = chartHeight - paddingY - barHeight;

                return (
                  <React.Fragment key={idx}>
                    <Rect
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={barHeight}
                      rx={6}
                      fill="#38bdf8"
                    />
                    <SvgText
                      x={barX + barWidth / 2}
                      y={chartHeight - 4}
                      fontSize={9}
                      fill={colors.textSecondary}
                      textAnchor="middle"
                    >
                      {d.day}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>
        </ScrollView>
      </ChartBase>
    </View>
  );
}

// ==========================================
// 4. Gráfica de Medidas Corporales (Purple)
// ==========================================
interface MeasurementDataPoint {
  timestamp: number;
  value: number;
}

export function MeasurementChart({
  data,
  measureLabel,
}: {
  data: MeasurementDataPoint[];
  measureLabel?: string;
}) {
  const [period, setPeriod] = useState<PeriodType>('3M');
  const colors = useAppColors();

  const filteredData = useMemo(() => {
    return filterDataByPeriod(data, period, item => item.timestamp);
  }, [data, period]);

  const stats = useMemo(() => {
    if (!filteredData.length) return null;
    const vals = filteredData.map(d => d.value).filter(v => v > 0);
    if (!vals.length) return null;

    const current = vals[vals.length - 1];
    const start = vals[0];
    const delta = Math.round((current - start) * 10) / 10;
    const min = Math.min(...vals);
    const max = Math.max(...vals);

    return { current, delta, min, max, count: vals.length };
  }, [filteredData]);

  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const chartWidth = containerWidth > 0 ? containerWidth : Math.max(windowWidth - 64, 220);
  const chartHeight = 180;
  const paddingX = 24;
  const paddingY = 28;

  const svgPaths = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return null;

    const values = filteredData.map(d => d.value);
    const minVal = Math.min(...values) - 1;
    const maxVal = Math.max(...values) + 1;
    const valRange = maxVal - minVal || 1;

    const points = filteredData.map((d, index) => {
      const x =
        filteredData.length === 1
          ? chartWidth / 2
          : paddingX + (index / (filteredData.length - 1)) * (chartWidth - paddingX * 2);
      const y =
        chartHeight -
        paddingY -
        ((d.value - minVal) / valRange) * (chartHeight - paddingY * 2);
      return { x, y, value: d.value, timestamp: d.timestamp };
    });

    const lineD = points.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const bottomY = chartHeight - paddingY;
    const areaD = `${lineD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

    return { points, lineD, areaD };
  }, [filteredData, chartWidth, chartHeight]);

  return (
    <ChartBase
      title={`Evolución de ${measureLabel || 'Medida'}`}
      icon={Ruler}
      periods={['1M', '3M', '6M', '1A', 'Todo']}
      activePeriod={period}
      onPeriodChange={setPeriod}
      kpis={
        stats
          ? [
              {
                label: 'Última Medida',
                value: stats.current,
                unit: 'cm',
                trend:
                  stats.count > 1
                    ? `${stats.delta > 0 ? '+' : ''}${stats.delta} cm`
                    : '1 reg.',
                isPositive: stats.delta <= 0,
                icon: Ruler,
              },
              {
                label: 'Mínimo',
                value: stats.min,
                unit: 'cm',
              },
              {
                label: 'Máximo',
                value: stats.max,
                unit: 'cm',
              },
            ]
          : undefined
      }
    >
      {!svgPaths || svgPaths.points.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Sin registros de medida en este período
          </Text>
        </View>
      ) : (
        <View
          onLayout={e => {
            const w = e.nativeEvent.layout.width;
            if (w > 0 && Math.abs(w - containerWidth) > 2) {
              setContainerWidth(w);
            }
          }}
          style={{ width: '100%', height: chartHeight, alignItems: 'center' }}
        >
          <Svg width={chartWidth} height={chartHeight}>
            <Defs>
              <LinearGradient id="medidaGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                <Stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
              </LinearGradient>
            </Defs>

            <Path d={svgPaths.areaD} fill="url(#medidaGrad)" />
            <Path
              d={svgPaths.lineD}
              fill="none"
              stroke="#a855f7"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {svgPaths.points.map((pt, idx) => (
              <Circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r={4}
                fill="#a855f7"
                stroke="#ffffff"
                strokeWidth={1.5}
              />
            ))}
          </Svg>

          <View style={[styles.axisRow, { paddingHorizontal: paddingX }]}>
            <Text style={[styles.axisText, { color: colors.textSecondary }]}>
              {new Date(svgPaths.points[0].timestamp).toLocaleDateString('es-ES', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <Text style={[styles.axisText, { color: colors.textSecondary }]}>
              {new Date(
                svgPaths.points[svgPaths.points.length - 1].timestamp
              ).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
        </View>
      )}
    </ChartBase>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    gap: 12,
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  extraHeaderWrap: {
    marginBottom: 12,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  alertsWrap: {
    marginBottom: 14,
  },
  chartCanvas: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  seeAllBtn: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  axisText: {
    fontSize: 10,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '700',
  },
  macroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
});
