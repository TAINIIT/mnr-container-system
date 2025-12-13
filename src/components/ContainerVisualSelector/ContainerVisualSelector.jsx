import { useState } from 'react';
import { Eye, List, RotateCcw } from 'lucide-react';
import './ContainerVisualSelector.css';

/**
 * ContainerVisualSelector - An optional visual container part selector
 * Users can toggle between visual (SVG diagram) or manual (dropdown) selection
 */
export default function ContainerVisualSelector({
    value,
    onChange,
    locationCodes = [],
    disabled = false,
    damageHistory = {} // Optional: { locationCode: count } to show damage indicators
}) {
    const [mode, setMode] = useState('manual'); // 'visual' or 'manual'
    const [hoveredPart, setHoveredPart] = useState(null);

    // Container parts with SVG coordinates for visual selection
    const containerParts = [
        { code: 'ROOF', name: 'Roof', x: 50, y: 10, width: 300, height: 30 },
        { code: 'FREN', name: 'Front End', x: 10, y: 50, width: 30, height: 100 },
        { code: 'REEN', name: 'Rear End', x: 360, y: 50, width: 30, height: 100 },
        { code: 'LSP', name: 'Left Side Panel', x: 50, y: 40, width: 300, height: 20 },
        { code: 'RSP', name: 'Right Side Panel', x: 50, y: 140, width: 300, height: 20 },
        { code: 'FLR', name: 'Floor', x: 50, y: 160, width: 300, height: 25 },
        { code: 'DOOR', name: 'Door', x: 360, y: 60, width: 25, height: 80 },
        { code: 'UR', name: 'Under Rail', x: 50, y: 185, width: 300, height: 10 },
        { code: 'CCR', name: 'Corner Casting', corners: true },
        { code: 'CFT', name: 'Corner Fitting', corners: true },
        { code: 'FORK', name: 'Forklift Pocket', x: 120, y: 190, width: 40, height: 8 },
        { code: 'SEAL', name: 'Door Seal', x: 355, y: 55, width: 5, height: 90 },
        { code: 'LOCK', name: 'Lock Rod', x: 385, y: 70, width: 8, height: 60 }
    ];

    const handlePartClick = (code) => {
        if (disabled) return;
        onChange(code);
    };

    const getPartColor = (code) => {
        if (value === code) return '#10B981'; // Selected - green
        if (hoveredPart === code) return '#3B82F6'; // Hovered - blue
        if (damageHistory[code] > 0) return '#EF4444'; // Has damage history - red
        return '#64748B'; // Default - gray
    };

    const getDamageCount = (code) => {
        return damageHistory[code] || 0;
    };

    return (
        <div className="container-visual-selector">
            {/* Mode Toggle */}
            <div className="cvs-mode-toggle">
                <button
                    type="button"
                    className={`cvs-toggle-btn ${mode === 'manual' ? 'active' : ''}`}
                    onClick={() => setMode('manual')}
                >
                    <List size={14} />
                    <span>Manual</span>
                </button>
                <button
                    type="button"
                    className={`cvs-toggle-btn ${mode === 'visual' ? 'active' : ''}`}
                    onClick={() => setMode('visual')}
                >
                    <Eye size={14} />
                    <span>Visual</span>
                </button>
            </div>

            {mode === 'manual' ? (
                /* Manual Dropdown Selection */
                <select
                    className="form-input cvs-dropdown"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                >
                    <option value="">Select location...</option>
                    {locationCodes.map(l => (
                        <option key={l.code} value={l.code}>
                            {l.code} - {l.name}
                            {damageHistory[l.code] > 0 ? ` (${damageHistory[l.code]} previous damages)` : ''}
                        </option>
                    ))}
                </select>
            ) : (
                /* Visual SVG Selection */
                <div className="cvs-visual-container">
                    <div className="cvs-diagram-wrapper">
                        <svg
                            viewBox="0 0 420 220"
                            className="cvs-diagram"
                            style={{ opacity: disabled ? 0.5 : 1 }}
                        >
                            {/* Container outline */}
                            <rect
                                x="40" y="35"
                                width="340" height="165"
                                fill="none"
                                stroke="#334155"
                                strokeWidth="2"
                                rx="4"
                            />

                            {/* Roof */}
                            <rect
                                x="50" y="40"
                                width="300" height="25"
                                fill={getPartColor('ROOF')}
                                fillOpacity="0.3"
                                stroke={getPartColor('ROOF')}
                                strokeWidth="2"
                                rx="2"
                                className="cvs-part"
                                onMouseEnter={() => setHoveredPart('ROOF')}
                                onMouseLeave={() => setHoveredPart(null)}
                                onClick={() => handlePartClick('ROOF')}
                                style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                            />
                            <text x="200" y="57" textAnchor="middle" className="cvs-label">ROOF</text>

                            {/* Front End */}
                            <rect
                                x="45" y="70"
                                width="25" height="90"
                                fill={getPartColor('FREN')}
                                fillOpacity="0.3"
                                stroke={getPartColor('FREN')}
                                strokeWidth="2"
                                rx="2"
                                className="cvs-part"
                                onMouseEnter={() => setHoveredPart('FREN')}
                                onMouseLeave={() => setHoveredPart(null)}
                                onClick={() => handlePartClick('FREN')}
                                style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                            />
                            <text x="57" y="120" textAnchor="middle" className="cvs-label cvs-label-vertical">FREN</text>

                            {/* Rear End / Door Area */}
                            <rect
                                x="330" y="70"
                                width="25" height="90"
                                fill={getPartColor('REEN')}
                                fillOpacity="0.3"
                                stroke={getPartColor('REEN')}
                                strokeWidth="2"
                                rx="2"
                                className="cvs-part"
                                onMouseEnter={() => setHoveredPart('REEN')}
                                onMouseLeave={() => setHoveredPart(null)}
                                onClick={() => handlePartClick('REEN')}
                                style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                            />
                            <text x="342" y="120" textAnchor="middle" className="cvs-label cvs-label-vertical">REEN</text>

                            {/* Door */}
                            <rect
                                x="360" y="75"
                                width="15" height="80"
                                fill={getPartColor('DOOR')}
                                fillOpacity="0.4"
                                stroke={getPartColor('DOOR')}
                                strokeWidth="2"
                                rx="2"
                                className="cvs-part"
                                onMouseEnter={() => setHoveredPart('DOOR')}
                                onMouseLeave={() => setHoveredPart(null)}
                                onClick={() => handlePartClick('DOOR')}
                                style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                            />
                            <text x="368" y="120" textAnchor="middle" className="cvs-label cvs-label-small">DOOR</text>

                            {/* Left Side Panel */}
                            <rect
                                x="75" y="70"
                                width="250" height="15"
                                fill={getPartColor('LSP')}
                                fillOpacity="0.3"
                                stroke={getPartColor('LSP')}
                                strokeWidth="2"
                                rx="2"
                                className="cvs-part"
                                onMouseEnter={() => setHoveredPart('LSP')}
                                onMouseLeave={() => setHoveredPart(null)}
                                onClick={() => handlePartClick('LSP')}
                                style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                            />
                            <text x="200" y="82" textAnchor="middle" className="cvs-label">LSP (Left Side)</text>

                            {/* Interior Space */}
                            <rect
                                x="75" y="90"
                                width="250" height="55"
                                fill="#1E293B"
                                fillOpacity="0.5"
                                stroke="none"
                                rx="2"
                            />
                            <text x="200" y="122" textAnchor="middle" className="cvs-interior-label">INTERIOR</text>

                            {/* Right Side Panel */}
                            <rect
                                x="75" y="150"
                                width="250" height="15"
                                fill={getPartColor('RSP')}
                                fillOpacity="0.3"
                                stroke={getPartColor('RSP')}
                                strokeWidth="2"
                                rx="2"
                                className="cvs-part"
                                onMouseEnter={() => setHoveredPart('RSP')}
                                onMouseLeave={() => setHoveredPart(null)}
                                onClick={() => handlePartClick('RSP')}
                                style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                            />
                            <text x="200" y="162" textAnchor="middle" className="cvs-label">RSP (Right Side)</text>

                            {/* Floor */}
                            <rect
                                x="50" y="170"
                                width="300" height="20"
                                fill={getPartColor('FLR')}
                                fillOpacity="0.3"
                                stroke={getPartColor('FLR')}
                                strokeWidth="2"
                                rx="2"
                                className="cvs-part"
                                onMouseEnter={() => setHoveredPart('FLR')}
                                onMouseLeave={() => setHoveredPart(null)}
                                onClick={() => handlePartClick('FLR')}
                                style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                            />
                            <text x="200" y="184" textAnchor="middle" className="cvs-label">FLOOR</text>

                            {/* Corner Castings */}
                            {[
                                { x: 42, y: 37, label: 'TL' },
                                { x: 348, y: 37, label: 'TR' },
                                { x: 42, y: 178, label: 'BL' },
                                { x: 348, y: 178, label: 'BR' }
                            ].map((corner, i) => (
                                <g key={`ccr-${i}`}>
                                    <rect
                                        x={corner.x} y={corner.y}
                                        width="12" height="12"
                                        fill={getPartColor('CCR')}
                                        fillOpacity="0.5"
                                        stroke={getPartColor('CCR')}
                                        strokeWidth="1"
                                        className="cvs-part"
                                        onMouseEnter={() => setHoveredPart('CCR')}
                                        onMouseLeave={() => setHoveredPart(null)}
                                        onClick={() => handlePartClick('CCR')}
                                        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                                    />
                                </g>
                            ))}

                            {/* Under Rail */}
                            <rect
                                x="50" y="193"
                                width="300" height="8"
                                fill={getPartColor('UR')}
                                fillOpacity="0.4"
                                stroke={getPartColor('UR')}
                                strokeWidth="1"
                                className="cvs-part"
                                onMouseEnter={() => setHoveredPart('UR')}
                                onMouseLeave={() => setHoveredPart(null)}
                                onClick={() => handlePartClick('UR')}
                                style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                            />

                            {/* Forklift Pockets */}
                            {[{ x: 100 }, { x: 280 }].map((fp, i) => (
                                <rect
                                    key={`fork-${i}`}
                                    x={fp.x} y="195"
                                    width="40" height="10"
                                    fill={getPartColor('FORK')}
                                    fillOpacity="0.5"
                                    stroke={getPartColor('FORK')}
                                    strokeWidth="1"
                                    rx="2"
                                    className="cvs-part"
                                    onMouseEnter={() => setHoveredPart('FORK')}
                                    onMouseLeave={() => setHoveredPart(null)}
                                    onClick={() => handlePartClick('FORK')}
                                    style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                                />
                            ))}

                            {/* Lock Rod */}
                            <rect
                                x="378" y="85"
                                width="6" height="60"
                                fill={getPartColor('LOCK')}
                                fillOpacity="0.5"
                                stroke={getPartColor('LOCK')}
                                strokeWidth="1"
                                rx="2"
                                className="cvs-part"
                                onMouseEnter={() => setHoveredPart('LOCK')}
                                onMouseLeave={() => setHoveredPart(null)}
                                onClick={() => handlePartClick('LOCK')}
                                style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                            />

                            {/* Door Seal */}
                            <rect
                                x="355" y="72"
                                width="4" height="86"
                                fill={getPartColor('SEAL')}
                                fillOpacity="0.5"
                                stroke={getPartColor('SEAL')}
                                strokeWidth="1"
                                className="cvs-part"
                                onMouseEnter={() => setHoveredPart('SEAL')}
                                onMouseLeave={() => setHoveredPart(null)}
                                onClick={() => handlePartClick('SEAL')}
                                style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                            />
                        </svg>

                        {/* Hover tooltip */}
                        {hoveredPart && (
                            <div className="cvs-tooltip">
                                <strong>{hoveredPart}</strong>
                                <span>{containerParts.find(p => p.code === hoveredPart)?.name}</span>
                                {getDamageCount(hoveredPart) > 0 && (
                                    <span className="cvs-damage-count">
                                        {getDamageCount(hoveredPart)} previous damage(s)
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Legend and Selected Part Info */}
                    <div className="cvs-info-panel">
                        <div className="cvs-selected">
                            <span className="cvs-selected-label">Selected:</span>
                            {value ? (
                                <span className="cvs-selected-value">
                                    {value} - {containerParts.find(p => p.code === value)?.name || locationCodes.find(l => l.code === value)?.name}
                                </span>
                            ) : (
                                <span className="cvs-selected-none">Click on a part to select</span>
                            )}
                            {value && !disabled && (
                                <button
                                    type="button"
                                    className="cvs-clear-btn"
                                    onClick={() => onChange('')}
                                >
                                    <RotateCcw size={12} />
                                </button>
                            )}
                        </div>
                        <div className="cvs-legend">
                            <div className="cvs-legend-item">
                                <span className="cvs-legend-dot" style={{ background: '#10B981' }}></span>
                                <span>Selected</span>
                            </div>
                            <div className="cvs-legend-item">
                                <span className="cvs-legend-dot" style={{ background: '#EF4444' }}></span>
                                <span>Has damage history</span>
                            </div>
                            <div className="cvs-legend-item">
                                <span className="cvs-legend-dot" style={{ background: '#64748B' }}></span>
                                <span>Available</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
