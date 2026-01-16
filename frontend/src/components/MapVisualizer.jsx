import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAX_HEIGHT = 1000;

const MapVisualizer = ({ data, onZoneSelect, selectedZoneId, flyToZoneId }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const dataRef = useRef(data);

    // Keep data ref updated for initial load
    useEffect(() => {
        dataRef.current = data;

        // If map is already ready, update it immediately
        if (map.current && map.current.getSource('kingston-data') && data) {
            map.current.getSource('kingston-data').setData(data);
        }
    }, [data]);

    // Initialize Map
    useEffect(() => {
        if (map.current) return;

        const style = {
            "version": 8,
            "name": "Dark",
            "metadata": {},
            "light": {
                "anchor": "viewport",
                "color": "#ffffff",
                "intensity": 0.6,
                "position": [1.15, 210, 30]
            },
            "sources": {
                "carto-dark": {
                    "type": "raster",
                    "tiles": ["https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png"],
                    "tileSize": 256,
                    "attribution": "&copy; OpenStreetMap &copy; CARTO"
                }
            },
            "layers": [
                {
                    "id": "carto-dark-layer",
                    "type": "raster",
                    "source": "carto-dark",
                    "minzoom": 0,
                    "maxzoom": 22
                }
            ]
        };

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: style,
            center: [-76.48098, 44.2312], // Kingston
            zoom: 12.5,
            pitch: 55, // 3D View
            bearing: -10,
            antialias: true
        });

        const nav = new maplibregl.NavigationControl();
        map.current.addControl(nav, 'top-right');

        map.current.on('load', () => {
            // Add Source - Check both the passed prop 'data' and the ref.
            // If this runs before data is loaded, it will be empty.
            // But the useEffect([data]) above handles the update when data arrives.
            const initialData = dataRef.current || { type: 'FeatureCollection', features: [] };

            if (map.current.getSource('kingston-data')) return;

            map.current.addSource('kingston-data', {
                type: 'geojson',
                data: initialData
            });

            // Add 3D Extrusion Layer
            map.current.addLayer({
                'id': 'kingston-hvi-3d',
                'type': 'fill-extrusion',
                'source': 'kingston-data',
                'paint': {
                    'fill-extrusion-color': [
                        'interpolate',
                        ['linear'],
                        ['get', 'hvi'],
                        0.0, '#34d399', // Bright Green
                        0.5, '#fbbf24', // Bright Yellow/Orange
                        1.0, '#ef4444'  // Bright Red
                    ],
                    'fill-extrusion-height': ['*', ['get', 'hvi'], 1200], // Visible height
                    'fill-extrusion-base': 0,
                    'fill-extrusion-opacity': 0.9,
                    'fill-extrusion-vertical-gradient': true
                }
            });

            // Add Grid Lines
            map.current.addLayer({
                'id': 'hvi-grid-lines',
                'type': 'line',
                'source': 'kingston-data',
                'paint': {
                    'line-color': '#ffffff',
                    'line-width': 1,
                    'line-opacity': 0.3
                }
            });

            // Click Handler
            map.current.on('click', 'kingston-hvi-3d', (e) => {
                if (e.features && e.features[0]) {
                    onZoneSelect(e.features[0].properties);
                }
            });

            // Cursor
            map.current.on('mouseenter', 'kingston-hvi-3d', () => {
                map.current.getCanvas().style.cursor = 'pointer';
            });
            map.current.on('mouseleave', 'kingston-hvi-3d', () => {
                map.current.getCanvas().style.cursor = '';
            });
        });

    }, []);

    // Fly to specific zone when requested
    useEffect(() => {
        if (!map.current || !data || !flyToZoneId) return;

        const feature = data.features.find(f => f.properties.id === flyToZoneId);
        if (feature) {
            // Calculate center of polygon roughly or use first coordinate
            // Polygon coords are [[ [lon, lat], ... ]]
            const coords = feature.geometry.coordinates[0];
            // Simple centroid approximation
            const lng = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
            const lat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;

            map.current.flyTo({
                center: [lng, lat],
                zoom: 14.5,
                pitch: 60,
                bearing: -20,
                speed: 1.2,
                curve: 1
            });

            // Also select it visually if possible (optional, but good UX)
            onZoneSelect(feature.properties);
        }
    }, [flyToZoneId, data]);

    return (
        <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    );
};

export default MapVisualizer;
