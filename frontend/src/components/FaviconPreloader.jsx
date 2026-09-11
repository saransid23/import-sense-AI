import React from 'react';

export default function FaviconPreloader({ 
    text = "Loading...", 
    subtext = "", 
    size = "md", // sm | md | lg
    fullScreen = false 
}) {
    const dimensions = {
        sm: { container: 'w-16 h-16', logo: 'w-8 h-8', aura: '-inset-2', text: 'text-xs' },
        md: { container: 'w-24 h-24', logo: 'w-12 h-12', aura: '-inset-3', text: 'text-sm' },
        lg: { container: 'w-32 h-32', logo: 'w-16 h-16', aura: '-inset-4', text: 'text-base' }
    }[size] || dimensions.md;

    const content = (
        <div className="flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            {/* Favicon Radar Rings Widget */}
            <div className={`relative flex items-center justify-center ${dimensions.container} mb-5`}>
                {/* Radial Glow Aura */}
                <div className={`favicon-aura ${dimensions.aura}`} />
                
                {/* Rotating Outer Gradient Ring */}
                <div className="favicon-outer-ring" />
                
                {/* Counter-rotating Inner Ring */}
                <div className="favicon-inner-ring" />
                
                {/* Glowing Favicon Logo */}
                <img
                    src="/emerald-icon-3d.png"
                    onError={(e) => { 
                        if (e.target.src.includes('emerald-icon-3d.png')) {
                            e.target.src = '/emerald-icon.png';
                        } else {
                            e.target.src = '/apple-touch-icon.png';
                        }
                    }}
                    alt="ImportSense AI Favicon Logo"
                    className={`${dimensions.logo} favicon-logo object-contain drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]`}
                />
            </div>

            {/* Label & Subtext */}
            {text && (
                <h3 className={`font-bold text-emerald-300 tracking-wide ${dimensions.text} mb-1 animate-pulse`}>
                    {text}
                </h3>
            )}
            {subtext && (
                <p className="text-xs text-white/70 font-medium max-w-xs">
                    {subtext}
                </p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060913]/95 backdrop-blur-md">
                {content}
            </div>
        );
    }

    return content;
}
