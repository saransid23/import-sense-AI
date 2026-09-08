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
    const labels = ['Import Cost'];
    const importData = [importCost];
    const amazonData = [amazonPrice || 0];
    const flipkartData = [flipkartPrice || 0];

    if (amazonPrice) labels[0] = 'Compare';

    const data = {
        labels: ['Import Cost', 'Amazon India', 'Flipkart'],
        datasets: [
            {
                label: 'Price (₹)',
                data: [importCost, amazonPrice || 0, flipkartPrice || 0],
                backgroundColor: [
                    'rgba(236, 72, 153, 0.7)',
                    'rgba(249, 115, 22, 0.7)',
                    'rgba(6, 182, 212, 0.7)',
                ],
                borderColor: [
                    'rgba(236, 72, 153, 1)',
                    'rgba(249, 115, 22, 1)',
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
                backgroundColor: 'rgba(15, 12, 41, 0.95)',
                borderColor: 'rgba(99, 102, 241, 0.3)',
                borderWidth: 1,
                padding: 12,
                titleFont: { family: 'Inter' },
                bodyFont: { family: 'Inter' },
                callbacks: {
                    label: (ctx) => ` ₹${ctx.parsed.x.toLocaleString('en-IN')}`,
                },
            },
        },
        scales: {
            x: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: {
                    color: '#94a3b8',
                    font: { family: 'Inter' },
                    callback: (val) => '₹' + val.toLocaleString('en-IN'),
                },
            },
            y: {
                grid: { display: false },
                ticks: { color: '#e2e8f0', font: { family: 'Inter', weight: 600 } },
            },
        },
    };

    return (
        <div style={{ height: '200px' }}>
            <Bar data={data} options={options} />
        </div>
    );
}
