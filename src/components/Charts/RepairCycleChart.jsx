import { useState, useMemo } from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart,
    Area
} from 'recharts';
import { useData } from '../../context/DataContext';
import { TrendingUp, Calendar } from 'lucide-react';
import './Charts.css';

export default function RepairCycleChart() {
    const { containers } = useData();
    const [period, setPeriod] = useState('weekly'); // 'weekly' or 'monthly'

    // Calculate repair data from containers
    const chartData = useMemo(() => {
        // Get completed containers with repair times
        const completedContainers = containers.filter(c =>
            c.status === 'COMPLETED' || c.status === 'AV'
        ).filter(c => c.repairStartTime && c.repairEndTime);

        // Group by week/month
        const groupedData = {};

        completedContainers.forEach(container => {
            const endDate = new Date(container.repairEndTime);
            let key;

            if (period === 'weekly') {
                // Get week number
                const startOfYear = new Date(endDate.getFullYear(), 0, 1);
                const weekNum = Math.ceil(((endDate - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
                key = `W${weekNum}`;
            } else {
                // Get month
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                key = monthNames[endDate.getMonth()];
            }

            if (!groupedData[key]) {
                groupedData[key] = {
                    period: key,
                    repairs: 0,
                    totalDuration: 0
                };
            }

            // Calculate duration in hours
            const start = new Date(container.repairStartTime);
            const end = new Date(container.repairEndTime);
            const durationHours = (end - start) / (1000 * 60 * 60);

            groupedData[key].repairs += 1;
            groupedData[key].totalDuration += durationHours;
        });

        // Convert to array and calculate averages
        const result = Object.values(groupedData).map(item => ({
            period: item.period,
            repairs: item.repairs,
            avgDuration: item.repairs > 0 ? Math.round(item.totalDuration / item.repairs) : 0
        }));

        // If no real data, generate sample data for demo
        if (result.length === 0) {
            const sampleData = period === 'weekly'
                ? [
                    { period: 'W45', repairs: 3, avgDuration: 48 },
                    { period: 'W46', repairs: 5, avgDuration: 52 },
                    { period: 'W47', repairs: 4, avgDuration: 45 },
                    { period: 'W48', repairs: 6, avgDuration: 38 },
                    { period: 'W49', repairs: 7, avgDuration: 42 },
                    { period: 'W50', repairs: 5, avgDuration: 36 },
                    { period: 'W51', repairs: 8, avgDuration: 32 },
                    { period: 'W52', repairs: 4, avgDuration: 35 }
                ]
                : [
                    { period: 'Jul', repairs: 12, avgDuration: 58 },
                    { period: 'Aug', repairs: 18, avgDuration: 52 },
                    { period: 'Sep', repairs: 15, avgDuration: 48 },
                    { period: 'Oct', repairs: 22, avgDuration: 42 },
                    { period: 'Nov', repairs: 25, avgDuration: 38 },
                    { period: 'Dec', repairs: 14, avgDuration: 35 }
                ];
            return sampleData;
        }

        return result.slice(-8); // Last 8 periods
    }, [containers, period]);

    // Calculate summary stats
    const stats = useMemo(() => {
        if (chartData.length === 0) return { avgDuration: 0, totalRepairs: 0, trend: 0 };

        const totalRepairs = chartData.reduce((sum, d) => sum + d.repairs, 0);
        const avgDuration = Math.round(chartData.reduce((sum, d) => sum + d.avgDuration, 0) / chartData.length);

        // Calculate trend (compare last vs first half)
        const half = Math.floor(chartData.length / 2);
        const firstHalf = chartData.slice(0, half);
        const secondHalf = chartData.slice(half);
        const firstAvg = firstHalf.reduce((s, d) => s + d.avgDuration, 0) / half;
        const secondAvg = secondHalf.reduce((s, d) => s + d.avgDuration, 0) / (chartData.length - half);
        const trend = firstAvg > 0 ? Math.round(((secondAvg - firstAvg) / firstAvg) * 100) : 0;

        return { avgDuration, totalRepairs, trend };
    }, [chartData]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="chart-tooltip">
                    <p className="tooltip-label">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="tooltip-value" style={{ color: entry.color }}>
                            {entry.name}: {entry.value} {entry.name === 'Avg Duration' ? 'hrs' : ''}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-card">
            <div className="chart-header">
                <div className="chart-title-section">
                    <TrendingUp size={20} className="chart-icon" />
                    <h3>Repair Cycle Time Trend</h3>
                </div>
                <div className="chart-controls">
                    <div className="chart-stats">
                        <div className="chart-stat">
                            <span className="stat-value">{stats.avgDuration}h</span>
                            <span className="stat-label">Avg Duration</span>
                        </div>
                        <div className="chart-stat">
                            <span className="stat-value">{stats.totalRepairs}</span>
                            <span className="stat-label">Total Repairs</span>
                        </div>
                        <div className={`chart-stat trend ${stats.trend < 0 ? 'positive' : stats.trend > 0 ? 'negative' : ''}`}>
                            <span className="stat-value">
                                {stats.trend > 0 ? '+' : ''}{stats.trend}%
                            </span>
                            <span className="stat-label">Trend</span>
                        </div>
                    </div>
                    <select
                        className="period-select"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                    >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
            </div>

            <div className="chart-body">
                <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <defs>
                            <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary-500)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--primary-500)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis
                            dataKey="period"
                            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                            axisLine={{ stroke: 'var(--border-color)' }}
                        />
                        <YAxis
                            yAxisId="left"
                            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                            axisLine={{ stroke: 'var(--border-color)' }}
                            label={{
                                value: 'Hours',
                                angle: -90,
                                position: 'insideLeft',
                                fill: 'var(--text-tertiary)',
                                fontSize: 11
                            }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                            axisLine={{ stroke: 'var(--border-color)' }}
                            label={{
                                value: 'Repairs',
                                angle: 90,
                                position: 'insideRight',
                                fill: 'var(--text-tertiary)',
                                fontSize: 11
                            }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ paddingTop: '10px' }}
                            iconType="circle"
                        />
                        <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="avgDuration"
                            stroke="var(--primary-500)"
                            strokeWidth={0}
                            fill="url(#colorDuration)"
                            legendType="none"
                        />
                        <Bar
                            yAxisId="right"
                            dataKey="repairs"
                            name="Repairs Completed"
                            fill="var(--neutral-300)"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="avgDuration"
                            name="Avg Duration"
                            stroke="var(--primary-500)"
                            strokeWidth={3}
                            dot={{ fill: 'var(--primary-500)', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="chart-footer">
                <span className="chart-note">
                    <Calendar size={14} />
                    Showing last {chartData.length} {period === 'weekly' ? 'weeks' : 'months'}
                </span>
            </div>
        </div>
    );
}
