'use client';

import { useEffect, useRef, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function ExchangesChart({ data = null, loading = false }) {
    const chartRef = useRef(null);
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        if (data?.weekly) {
            const labels = data.weekly.map(item => item.week);
            const exchangeCounts = data.weekly.map(item => item.count);

            setChartData({
                labels,
                datasets: [
                    {
                        label: 'Weekly Exchanges',
                        data: exchangeCounts,
                        backgroundColor: 'rgba(16, 185, 129, 0.6)',
                        borderColor: 'rgb(16, 185, 129)',
                        borderWidth: 1,
                        borderRadius: 4,
                        borderSkipped: false,
                        hoverBackgroundColor: 'rgba(16, 185, 129, 0.8)',
                        hoverBorderColor: 'rgb(16, 185, 129)'
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
                text: `Weekly Exchange Activity (${data?.period || 'Last 12 Weeks'})`,
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
                borderColor: 'rgb(16, 185, 129)',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                    title: function(context) {
                        return context[0].label;
                    },
                    label: function(context) {
                        const count = context.parsed.y;
                        return `${count} exchange${count !== 1 ? 's' : ''}`;
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
                    callback: function(value) {
                        return Math.floor(value);
                    }
                },
                border: {
                    display: false
                }
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
                        <div className="grid grid-cols-6 gap-2">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
                            ))}
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
                        Exchange Activity
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Track your weekly exchange activity and growth
                    </p>
                </div>
                {data && (
                    <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {data.total || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Total Exchanges
                        </div>
                    </div>
                )}
            </div>

            {/* Chart Container */}
            <div style={{ height: '300px' }}>
                {chartData ? (
                    <Bar ref={chartRef} data={chartData} options={options} />
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                            <div className="text-lg mb-2">📈</div>
                            <p>No exchange data available yet</p>
                            <p className="text-sm">Start exchanging skills to see analytics</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
