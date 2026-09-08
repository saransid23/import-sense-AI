import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLOR_MAP = {
    'Product Price': { bg: 'rgba(16, 185, 129, 0.85)', border: '#10b981' },             // Emerald Green
    'Shipping (CIF)': { bg: 'rgba(245, 158, 11, 0.85)', border: '#f59e0b' },            // Amber Orange
    'Customs Duty (BCD)': { bg: 'rgba(244, 63, 94, 0.85)', border: '#f43f5e' },         // Rose Red
    'Social Welfare Surcharge': { bg: 'rgba(139, 92, 246, 0.85)', border: '#8b5cf6' }, // Violet Purple
    'IGST': { bg: 'rgba(6, 182, 212, 0.85)', border: '#06b6d4' },                     // Cyan Blue
};

const FALLBACK_PALETTE = [
    { bg: 'rgba(16, 185, 129, 0.85)', border: '#10b981' },
    { bg: 'rgba(245, 158, 11, 0.85)', border: '#f59e0b' },
    { bg: 'rgba(244, 63, 94, 0.85)', border: '#f43f5e' },
    { bg: 'rgba(139, 92, 246, 0.85)', border: '#8b5cf6' },
    { bg: 'rgba(6, 182, 212, 0.85)', border: '#06b6d4' },
    { bg: 'rgba(236, 72, 153, 0.85)', border: '#ec4899' },
];

export default function CostBreakdownChart({ breakdown }) {
    const labels = Object.keys(breakdown);
    const values = Object.values(breakdown);

    const bgColors = labels.map((label, i) => COLOR_MAP[label]?.bg || FALLBACK_PALETTE[i % FALLBACK_PALETTE.length].bg);
    const borderColors = labels.map((label, i) => COLOR_MAP[label]?.border || FALLBACK_PALETTE[i % FALLBACK_PALETTE.length].border);

    const data = {
        labels,
        datasets: [
            {
                data: values,
                backgroundColor: bgColors,
                borderColor: borderColors,
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
                    color: '#ffffff',
                    padding: 14,
                    font: { size: 12, family: 'Inter', weight: 600 },
                    usePointStyle: true,
                    pointStyleWidth: 10,
                },
            },
            tooltip: {
                backgroundColor: 'rgba(2, 44, 21, 0.98)',
                borderColor: 'rgba(16, 185, 129, 0.5)',
                borderWidth: 1.5,
                padding: 12,
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                titleFont: { family: 'Inter', weight: 700 },
                bodyFont: { family: 'Inter', weight: 600 },
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
