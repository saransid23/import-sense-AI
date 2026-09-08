import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function CostBreakdownChart({ breakdown }) {
    const labels = Object.keys(breakdown);
    const values = Object.values(breakdown);

    const data = {
        labels,
        datasets: [
            {
                data: values,
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(236, 72, 153, 0.8)',
                    'rgba(249, 115, 22, 0.8)',
                    'rgba(6, 182, 212, 0.8)',
                ],
                borderColor: [
                    'rgba(99, 102, 241, 1)',
                    'rgba(236, 72, 153, 1)',
                    'rgba(249, 115, 22, 1)',
                    'rgba(6, 182, 212, 1)',
                ],
                borderWidth: 2,
                hoverOffset: 8,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#94a3b8',
                    padding: 16,
                    font: { size: 12, family: 'Inter' },
                    usePointStyle: true,
                    pointStyleWidth: 10,
                },
            },
            tooltip: {
                backgroundColor: 'rgba(15, 12, 41, 0.95)',
                borderColor: 'rgba(99, 102, 241, 0.3)',
                borderWidth: 1,
                padding: 12,
                titleFont: { family: 'Inter' },
                bodyFont: { family: 'Inter' },
                callbacks: {
                    label: (ctx) => ` ₹${ctx.parsed.toLocaleString('en-IN')}`,
                },
            },
        },
    };

    return (
        <div style={{ height: '260px' }}>
            <Doughnut data={data} options={options} />
        </div>
    );
}
