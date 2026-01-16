import React, { useState } from 'react';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { AlertCircle, TreeDeciduous, ThermometerSun, DollarSign, BrainCircuit } from 'lucide-react';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const Sidebar = ({
    selectedZone,
    scenario,
    setScenario,
    onAddTree,
    onAddCentre,
    budget,
    setBudget,
    runOptimizer,
    recommendations,
    onViewZone
}) => {
    // Debug logging
    if (selectedZone) {
        console.log("Sidebar selectedZone:", selectedZone);
        console.log("Type of demographics:", typeof selectedZone.demographics);
        console.log("Value of demographics:", selectedZone.demographics);
    }

    const [activeTab, setActiveTab] = useState('inspect'); // inspect, simulate, optimize

    // Helper to safely access properties that might be stringified
    const getProp = (obj, key) => {
        if (!obj) return {};
        if (typeof obj === 'string') {
            try {
                return JSON.parse(obj);
            } catch (e) {
                console.error("Failed to parse property", key, obj);
                return {};
            }
        }
        return obj;
    };

    // -- Chart Data --
    const getChartData = () => {
        if (!selectedZone) return null;

        const props = selectedZone;
        const demographics = getProp(props.demographics, 'demographics');
        const environment = getProp(props.environment, 'environment');

        return {
            labels: ['Low Canopy', 'Impervious', 'Seniors %', 'Low Income', 'Heat Exposure'],
            datasets: [
                {
                    label: 'Vulnerability Factors',
                    data: [
                        (1.0 - (environment.tree_canopy_pct || 0)) * 100,
                        (environment.impervious_surface_pct || 0) * 100,
                        (demographics.seniors_pct || 0) * 100,
                        (demographics.low_income_pct || 0) * 100,
                        (props.hvi || 0) * 100
                    ],
                    backgroundColor: 'rgba(56, 189, 248, 0.2)',
                    borderColor: '#38bdf8',
                    borderWidth: 2,
                },
            ],
        };
    };

    const chartOptions = {
        scales: {
            r: {
                angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                pointLabels: { color: '#94a3b8', font: { size: 10 } },
                ticks: { display: false, max: 100, min: 0 }
            }
        },
        plugins: {
            legend: { display: false }
        }
    };

    return (
        <div className="glass-panel" style={{ height: '90vh', width: '350px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 className="title-gradient" style={{ fontSize: '1.5rem', margin: 0 }}>HeatSafe Kingston</h1>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                    Municipal Decision Support System
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                {['inspect', 'simulate', 'optimize'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            flex: 1,
                            background: activeTab === tab ? '#38bdf8' : 'rgba(255,255,255,0.05)',
                            color: activeTab === tab ? '#0f172a' : '#94a3b8',
                            border: 'none',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            textTransform: 'capitalize',
                            fontWeight: 600
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* CONTENT */}

            {activeTab === 'inspect' && (
                <div>
                    {!selectedZone ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                            <AlertCircle size={32} style={{ marginBottom: '0.5rem' }} />
                            <p>Select a neighborhood on the map to inspect vulnerability data.</p>
                        </div>
                    ) : (
                        <div>
                            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>{selectedZone.name}</h2>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span style={{ color: '#94a3b8' }}>HVI Score</span>
                                <span style={{
                                    fontWeight: 'bold',
                                    color: selectedZone.hvi > 0.7 ? '#ef4444' : selectedZone.hvi > 0.4 ? '#eab308' : '#22c55e'
                                }}>
                                    {(selectedZone.hvi || 0).toFixed(2)}
                                </span>
                            </div>

                            <div style={{ height: '250px', marginBottom: '1rem' }}>
                                <Radar data={getChartData()} options={chartOptions} />
                            </div>

                            <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
                                <h3 style={{ fontSize: '0.9rem', color: '#94a3b8', borderBottom: '1px solid #333', paddingBottom: '0.2rem' }}>At a Glance</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    <div className="stat-box">
                                        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Seniors</div>
                                        <div>{((getProp(selectedZone.demographics, 'demo').seniors_pct || 0) * 100).toFixed(0)}%</div>
                                    </div>
                                    <div className="stat-box">
                                        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Canopy</div>
                                        <div>{((getProp(selectedZone.environment, 'env').tree_canopy_pct || 0) * 100).toFixed(0)}%</div>
                                    </div>
                                    <div className="stat-box">
                                        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Cooling Centres</div>
                                        <div>{getProp(selectedZone.assets, 'assets').cooling_centres || 0}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'simulate' && (
                <div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Climate Scenario</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button
                                onClick={() => setScenario({ ...scenario, name: 'avg', severity_mult: 1.0 })}
                                style={{ opacity: scenario.name === 'avg' ? 1 : 0.5, border: '1px solid #38bdf8', background: 'transparent', color: '#fff', borderRadius: '6px', padding: '0.4rem', flex: 1 }}
                            >
                                Avg Summer
                            </button>
                            <button
                                onClick={() => setScenario({ ...scenario, name: 'extreme', severity_mult: 1.2 })}
                                style={{ opacity: scenario.name === 'extreme' ? 1 : 0.5, border: '1px solid #ef4444', background: 'transparent', color: '#fff', borderRadius: '6px', padding: '0.4rem', flex: 1 }}
                            >
                                Heat Wave
                            </button>
                        </div>
                    </div>

                    {selectedZone ? (
                        <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <h3 style={{ fontSize: '0.9rem', marginTop: 0 }}>Intervene in {selectedZone.name}</h3>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <TreeDeciduous size={18} color="#22c55e" />
                                    <span style={{ fontSize: '0.85rem' }}>Plant 100 Trees</span>
                                </div>
                                <button className="btn-primary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={() => onAddTree(selectedZone.id)}>
                                    +$25k
                                </button>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <ThermometerSun size={18} color="#f97316" />
                                    <span style={{ fontSize: '0.85rem' }}>Split A/C Program</span>
                                </div>
                                <button className="btn-primary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={() => onAddCentre(selectedZone.id)}>
                                    +$100k
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Select a zone to apply local interventions.</p>
                    )}
                </div>
            )}

            {activeTab === 'optimize' && (
                <div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Total Budget Available</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '8px' }}>
                            <DollarSign size={18} color="#22c55e" />
                            <input
                                type="number"
                                value={budget}
                                onChange={(e) => setBudget(Number(e.target.value))}
                                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1rem', width: '100%', outline: 'none' }}
                            />
                        </div>
                    </div>

                    <button
                        className="btn-primary"
                        style={{ width: '100%', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}
                        onClick={runOptimizer}
                    >
                        <BrainCircuit size={18} />
                        Run AI Allocation Impact
                    </button>

                    {recommendations && (
                        <div>
                            <h3 style={{ fontSize: '0.9rem', color: '#94a3b8', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>Recommended Actions</h3>
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {recommendations.recommendations.map((rec, idx) => (
                                    <div
                                        key={idx}
                                        style={{ marginBottom: '0.8rem', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid #38bdf8', cursor: 'pointer' }}
                                        onClick={() => onViewZone(rec.zone_id)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Grid Location: {rec.zone_name}</span>
                                            <span style={{ fontSize: '0.8rem', color: '#22c55e' }}>-${rec.reduction.toFixed(4)} Risk</span>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{rec.desc}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Cost: ${rec.cost.toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #333', fontSize: '0.85rem' }}>
                                <div>Total Spent: <span style={{ color: '#fff' }}>${recommendations.total_spent.toLocaleString()}</span></div>
                                <div>Projected Risk Reduction: <span style={{ color: '#22c55e' }}>{recommendations.projected_hvi_reduction.toFixed(2)}</span></div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Sidebar;
