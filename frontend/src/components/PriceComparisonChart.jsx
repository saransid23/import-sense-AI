import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function PriceComparisonChart({ importCost, amazonPrice, flipkartPrice }) {
    const data = {
        labels: ['Import Cost', 'Amazon India', 'Flipkart'],
        datasets: [
            {
                label: 'Price (₹)',
                data: [importCost, amazonPrice || 0, flipkartPrice || 0],
                backgroundColor: [
                    'rgba(244, 63, 94, 0.75)',
                    'rgba(245, 158, 11, 0.75)',
                    'rgba(6, 182, 212, 0.75)',
                ],
                borderColor: [
                    'rgba(244, 63, 94, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(6, 182, 212, 1)',
                ],
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
            legend: { display: false },
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
                    label: (ctx) => ` ₹${ctx.parsed.x.toLocaleString('en-IN')}`,
                },
            },
        },
        scales: {
            x: {
                grid: { color: 'rgba(255,255,255,0.1)' },
                ticks: {
                    color: '#ffffff',
                    font: { family: 'Inter', weight: 600 },
                    callback: (val) => '₹' + val.toLocaleString('en-IN'),
                },
            },
            y: {
                grid: { display: false },
                ticks: { color: '#ffffff', font: { family: 'Inter', weight: 700 } },
            },
        },
    };

    return (
        <div style={{ height: '200px' }}>
            <Bar data={data} options={options} />
        </div>
    );
}
