import json
import random

def generate_kingston_data():
    # Approximate bounding box for Kingston core
    # Top-Left: 44.26, -76.55
    # Bottom-Right: 44.21, -76.45
    lat_start = 44.26
    lat_end = 44.21
    lon_start = -76.55
    lon_end = -76.45
    
    # Create a 4x4 grid
    rows = 4
    cols = 4
    
    lat_step = (lat_end - lat_start) / rows
    lon_step = (lon_end - lon_start) / cols
    
    neighborhood_names = [
        "Sydenham", "Portsmouth", "Williamsville", "King's Town", 
        "Pittsburgh", "Collins-Bayridge", "Lakeside", "Loyalist", 
        "Cataraqui North", "Meadowbrook", "Rideau Heights", "Kingscourt",
        "Strathcona Park", "Grenadier", "Polson Park", "Calvin Park"
    ]
    
    features = []
    
    for r in range(rows):
        for c in range(cols):
            # Define Polygon (Counter Clockwise)
            p_lat = lat_start + r * lat_step
            p_lon = lon_start + c * lon_step
            
            # 4 corners
            p1 = [p_lon, p_lat]
            p2 = [p_lon + lon_step, p_lat]
            p3 = [p_lon + lon_step, p_lat + lat_step]
            p4 = [p_lon, p_lat + lat_step]
            p5 = p1 # Close loop

            # Exclude Water Tiles (Manual Adjustment)
            # Grid (Rows 0-3 top-down, Cols 0-3 left-right)
            # River/Lake is bottom-right.
            if (r == 3 and c == 3): continue # Deep water
            if (r == 3 and c == 2): continue # Water edge
            if (r == 2 and c == 3): continue # Water edge

            
            name = neighborhood_names[(r * cols + c) % len(neighborhood_names)]
            
            # Synthesize Data
            # Correlation: High canopy often correlates with high income (general urban trend)
            income_proxy = random.uniform(0.2, 1.0) # 1.0 is high income
            
            # Canopy: correlated with income somewhat, plus random noise
            # Force more extreme "heat islands" by allowing canopy to go very low
            canopy_base = list(map(lambda x: x * 0.5, [income_proxy]))[0] # Slightly more range
            # Range: 0.02 (2%) to 0.7 (70%)
            canopy_pct = min(0.7, max(0.02, canopy_base + random.uniform(-0.15, 0.2)))
            
            # Impervious: inverse to canopy largely
            # If canopy is low, impervious likely very high (asphalt jungle)
            impervious_pct = min(0.98, max(0.3, 1.0 - canopy_pct * 1.2 - random.uniform(0.0, 0.1)))
            
            # Seniors: Random distribution
            seniors_pct = random.uniform(0.10, 0.35)
            
            # Cooling centres: Random, scarce
            cooling_centres = 1 if random.random() < 0.3 else 0
            
            feature = {
                "type": "Feature",
                "properties": {
                    "id": f"zone_{r}_{c}",
                    "name": name,
                    "demographics": {
                        "pop_density": int(random.uniform(2000, 8000)),
                        "seniors_pct": round(seniors_pct, 2),
                        "low_income_pct": round(1.0 - income_proxy, 2),
                        "social_isolation_risk": round(random.uniform(0.1, 0.6), 2)
                    },
                    "environment": {
                        "tree_canopy_pct": round(canopy_pct, 2),
                        "impervious_surface_pct": round(impervious_pct, 2),
                        "avg_surface_temp_summer": round(25 + (impervious_pct * 10) - (canopy_pct * 5), 1)
                    },
                    "assets": {
                        "cooling_centres": cooling_centres,
                        "libraries": 1 if random.random() < 0.2 else 0
                    }
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[p1, p2, p3, p4, p5]]
                }
            }
            features.append(feature)
            
    geojson = {
        "type": "FeatureCollection",
        "features": features
    }
    
    with open("kingston_data.json", "w") as f:
        json.dump(geojson, f, indent=2)
        
    print("Generated kingston_data.json")

if __name__ == "__main__":
    generate_kingston_data()
