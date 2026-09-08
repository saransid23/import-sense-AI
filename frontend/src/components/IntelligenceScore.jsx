export default function IntelligenceScore({ score, label, color }) {
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-36 h-36">
                <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
                    {/* Score circle */}
                    <circle
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke={color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className="score-circle"
                        style={{ filter: `drop-shadow(0 0 10px ${color})` }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white" style={{ textShadow: `0 0 12px ${color}` }}>{score}</span>
                    <span className="text-xs text-white/80 font-extrabold">/ 100</span>
                </div>
            </div>
            <p className="mt-3 text-base font-black text-white">{label}</p>
            <p className="text-xs text-emerald-300 font-bold mt-1">Import Intelligence Score</p>
        </div>
    );
}
