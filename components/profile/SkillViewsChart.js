'use client';

import { useEffect, useRef, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function SkillViewsChart({ data = null, loading = false }) {
    const chartRef = useRef(null);
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        if (data?.daily) {
            const labels = data.daily.map(item => item.label);
            const viewCounts = data.daily.map(item => item.count);

            setChartData({
                labels,
                datasets: [
                    {
                        label: 'Daily Views',
                        data: viewCounts,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: 'rgb(59, 130, 246)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointHoverBackgroundColor: 'rgb(59, 130, 246)',
                        pointHoverBorderColor: '#fff'
                    }
                ]
            });
        }
    }, [data]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: `Daily Skill Views (${data?.period || 'Last 30 Days'})`,
                font: {
                    size: 16,
                    weight: 'bold'
                },
                color: 'rgb(107, 114, 128)',
                padding: {
                    top: 10,
                    bottom: 20
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                    title: function (context) {
                        return context[0].label;
                    },
                    label: function (context) {
                        return `${context.parsed.y} views`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: 'rgb(107, 114, 128)',
                    maxTicksLimit: 7,
                    font: {
                        size: 12
                    }
                },
                border: {
                    color: 'rgba(107, 114, 128, 0.2)'
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(107, 114, 128, 0.1)',
                    drawBorder: false
                },
                ticks: {
                    color: 'rgb(107, 114, 128)',
                    stepSize: 1,
                    font: {
                        size: 12
                    },
                    callback: function (value) {
                        return Math.floor(value);
                    }
                },
                border: {
                    display: false
                }
            }
        },
        elements: {
            point: {
                hoverBackgroundColor: 'rgb(59, 130, 246)'
            }
        },
        interaction: {
            intersect: false,
            mode: 'index'
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                <div className="h-80 flex items-center justify-center">
                    <div className="animate-pulse space-y-4 w-full">
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mx-auto"></div>
                        <div className="space-y-2">
                            <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded"></div>
                            <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
                            <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded w-4/6"></div>
                            <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded w-3/6"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            {/* Chart Header with Stats */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Skill Views Trend
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Track how many people view your skills daily
                    </p>
                </div>
                {data && (
                    <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {data.total || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Total Views
                        </div>
                    </div>
                )}
            </div>

            {/* Chart Container */}
            <div style={{ height: '300px' }}>
                {chartData ? (
                    <Line ref={chartRef} data={chartData} options={options} />
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                            <div className="text-lg mb-2">📊</div>
                            <p>No skill view data available yet</p>
                            <p className="text-sm">Start sharing your skills to see analytics</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
