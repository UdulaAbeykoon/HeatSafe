import React, { useEffect, useState } from 'react';
import MapVisualizer from './components/MapVisualizer';
import Sidebar from './components/Sidebar';
import { getBaseData, runSimulation, runOptimizer } from './api';
import './index.css';

function App() {
    const [data, setData] = useState(null);
    const [selectedZone, setSelectedZone] = useState(null);

    // Simulation State
    const [scenario, setScenario] = useState({ name: 'avg', severity_mult: 1.0 });
    const [interventions, setInterventions] = useState({}); // { zone_id: { add_trees: 0, new_centre: 0 } }

    // Optimization State
    const [budget, setBudget] = useState(500000);
    const [recommendations, setRecommendations] = useState(null);
    const [flyToZoneId, setFlyToZoneId] = useState(null);

    const weights = { canopy: 0.4, impervious: 0.3, seniors: 0.2, income: 0.1 };

    // Initial Load
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const raw = await getBaseData();
            setData(raw);
        } catch (e) {
            console.error("Failed to load data", e);
        }
    };

    // Re-run simulation when interventions or scenario change
    useEffect(() => {
        if (!data) return;

        // Debounce slightly or just run
        const executeSim = async () => {
            try {
                const res = await runSimulation(scenario, weights, interventions);
                setData(res.geojson);
                // Update selected zone reference if it exists
                if (selectedZone) {
                    const updatedFeature = res.geojson.features.find(f => f.properties.id === selectedZone.id);
                    if (updatedFeature) setSelectedZone(updatedFeature.properties);
                }
            } catch (e) {
                console.error(e);
            }
        };

        executeSim();
    }, [interventions, scenario]); // weights constant for now

    const handleZoneSelect = (zoneProps) => {
        setSelectedZone(zoneProps);
    };

    const handleAddTree = (zoneId) => {
        setInterventions(prev => {
            const z = prev[zoneId] || {};
            return {
                ...prev,
                [zoneId]: { ...z, add_trees: (z.add_trees || 0) + 100 }
            };
        });
    };

    const handleAddCentre = (zoneId) => {
        setInterventions(prev => {
            const z = prev[zoneId] || {};
            return {
                ...prev,
                [zoneId]: { ...z, new_centre: (z.new_centre || 0) + 1 }
            };
        });
    };

    const handleRunOptimizer = async () => {
        try {
            const res = await runOptimizer(budget, weights, scenario);
            setRecommendations(res);
        } catch (e) {
            console.error(e);
        }
    };

    const handleViewZone = (zoneId) => {
        setFlyToZoneId(zoneId);
        // Reset after a moment so it can be triggered again if needed
        setTimeout(() => setFlyToZoneId(null), 1000);
    };

    return (
        <div style={{ display: 'flex', width: '100vw', height: '100vh', position: 'relative' }}>
            {/* Map Layer */}
            <div style={{ flex: 1, position: 'relative', zIndex: 0 }}>
                <MapVisualizer
                    data={data}
                    onZoneSelect={handleZoneSelect}
                    selectedZoneId={selectedZone?.id}
                    flyToZoneId={flyToZoneId}
                />
            </div>

            {/* Floating Sidebar */}
            <div style={{
                position: 'absolute',
                left: '20px',
                top: '20px',
                zIndex: 1000,
                maxHeight: '95vh'
            }}>
                <Sidebar
                    selectedZone={selectedZone}
                    scenario={scenario}
                    setScenario={setScenario}
                    onAddTree={handleAddTree}
                    onAddCentre={handleAddCentre}
                    budget={budget}
                    setBudget={setBudget}
                    runOptimizer={handleRunOptimizer}
                    recommendations={recommendations}
                    onViewZone={handleViewZone}
                />
            </div>

            {/* Legend (Bottom Right) */}
            <div className="glass-panel" style={{
                position: 'absolute',
                right: '20px',
                bottom: '30px',
                zIndex: 1000,
                padding: '1rem',
                width: '150px'
            }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#94a3b8' }}>HVI Score</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 12, height: 12, background: '#ef4444', borderRadius: '2px' }}></div>
                        <span style={{ fontSize: '0.75rem' }}>High Risk</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 12, height: 12, background: '#f97316', borderRadius: '2px' }}></div>
                        <span style={{ fontSize: '0.75rem' }}>Moderate</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 12, height: 12, background: '#22c55e', borderRadius: '2px' }}></div>
                        <span style={{ fontSize: '0.75rem' }}>Low Risk</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
