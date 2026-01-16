from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
import math
import copy

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = "kingston_data.json"

# --- Models ---

class Weights(BaseModel):
    canopy: float = 0.4
    impervious: float = 0.3
    seniors: float = 0.2
    income: float = 0.1

class Scenario(BaseModel):
    name: str # "avg_summer", "extreme_heat"
    severity_mult: float = 1.0

class SimulationRequest(BaseModel):
    weights: Weights
    scenario: Scenario
    interventions: dict # { "zone_id": { "add_trees": 100, "new_centre": 1 } }

class OptimizationRequest(BaseModel):
    budget: float
    weights: Weights
    scenario: Scenario
    costs: dict # { "tree": 500, "centre": 50000 }

# --- Helpers ---

def load_data():
    if not os.path.exists(DATA_FILE):
        # Generate if missing (first run)
        import data_gen
        data_gen.generate_kingston_data()
    
    with open(DATA_FILE, "r") as f:
        return json.load(f)

def calculate_hvi(props, weights, scenario):
    # Normalize inputs approx 0-1 range for calculation
    # High HVI = Bad
    
    # 1. Environmental Risk
    # Low canopy is bad. High impervious is bad.
    # We invert canopy (1 - canopy) so higher is worse.
    env_score = (
        (1.0 - props["environment"]["tree_canopy_pct"]) * weights.canopy + 
        (props["environment"]["impervious_surface_pct"]) * weights.impervious
    )
    
    # 2. Social Vulnerability
    # High senior % is bad. High low_income % is bad.
    social_score = (
        (props["demographics"]["seniors_pct"]) * weights.seniors + 
        (props["demographics"]["low_income_pct"]) * weights.income
    )
    
    # 3. Assets Mitigation
    # Cooling centres reduce risk directly
    asset_mitigation = props["assets"]["cooling_centres"] * 0.15 # Each centre reduces score by 0.15 purely
    
    raw_score = (env_score + social_score) * scenario.severity_mult - asset_mitigation
    
    # Clamp 0-1
    return max(0.0, min(1.0, raw_score))

# --- Endpoints ---

@app.get("/api/data")
async def get_base_data():
    data = load_data()
    # Pre-calculate HVI with defaults so map isn't blank
    default_weights = Weights()
    default_scenario = Scenario(name="avg_summer", severity_mult=1.0)
    
    for feature in data["features"]:
        feature["properties"]["hvi"] = calculate_hvi(feature["properties"], default_weights, default_scenario)
        # Also populate breakdown for chart
        feature["properties"]["hvi_breakdown"] = {
            "env_risk": round((1.0 - feature["properties"]["environment"]["tree_canopy_pct"]) * default_weights.canopy + 
                              (feature["properties"]["environment"]["impervious_surface_pct"]) * default_weights.impervious, 2),
            "social_risk": round((feature["properties"]["demographics"]["seniors_pct"]) * default_weights.seniors + 
                                 (feature["properties"]["demographics"]["low_income_pct"]) * default_weights.income, 2)
        }
        
    return data

@app.post("/api/simulate")
async def simulate(req: SimulationRequest):
    data = load_data()
    
    # Apply interventions
    # Assumption: 100 trees adds ~2% canopy (0.02) for a standard zone size
    # Assumption: 1 new cooling centre increments count
    
    total_hvi = 0
    count = 0
    
    for feature in data["features"]:
        zid = feature["properties"]["id"]
        props = feature["properties"]
        
        # Modify state based on interventions
        if zid in req.interventions:
            actions = req.interventions[zid]
            
            # Tree planting
            trees_added = actions.get("add_trees", 0)
            if trees_added > 0:
                # Diminishing returns or cap at 100%
                current_canopy = props["environment"]["tree_canopy_pct"]
                # Rough model: 100 trees = +0.02
                boost = (trees_added / 100.0) * 0.02
                props["environment"]["tree_canopy_pct"] = min(0.8, current_canopy + boost)
                
            # Cooling centres
            centres_added = actions.get("new_centre", 0)
            props["assets"]["cooling_centres"] += centres_added
            
        # Calculate HVI with new state
        hvi = calculate_hvi(props, req.weights, req.scenario)
        feature["properties"]["hvi"] = hvi
        
        # Add breakdown for UI
        feature["properties"]["hvi_breakdown"] = {
            "env_risk": round((1.0 - props["environment"]["tree_canopy_pct"]) * req.weights.canopy + 
                              (props["environment"]["impervious_surface_pct"]) * req.weights.impervious, 2),
            "social_risk": round((props["demographics"]["seniors_pct"]) * req.weights.seniors + 
                                 (props["demographics"]["low_income_pct"]) * req.weights.income, 2)
        }
        
        total_hvi += hvi
        count += 1
        
    return {
        "geojson": data,
        "avg_hvi": total_hvi / count if count > 0 else 0
    }

@app.post("/api/optimize")
async def optimize(req: OptimizationRequest):
    """
    Greedy algorithm to spend budget effectively.
    We try adding 1 "unit" of intervention to each zone and see which gives best HVI reduction per dollar.
    """
    data = load_data()
    features = data["features"]
    
    recommendations = []
    current_budget = req.budget
    
    # Potential actions
    # 1. Plant 50 Trees (Cost: $25,000) -> Adds 0.01 canopy
    # 2. Build Cooling Centre (Cost: $100,000) -> Reduces HVI flat 0.15
    
    ACTION_TREES = {"type": "trees", "cost": 25000, "amount": 50, "hvi_impact_est": 0.0} 
    ACTION_CENTRE = {"type": "center", "cost": 100000, "amount": 1, "hvi_impact_est": 0.15} # Rough direct impact
    
    # Simple loop: find best single move, execute, repeat until budget empty
    # For speed, we will just do one pass of ranking candidates since re-evaluating every step is slow for this demo
    
    candidates = []
    
    for f in features:
        props = f["properties"]
        base_hvi = calculate_hvi(props, req.weights, req.scenario)
        
        # Test Tree Impact
        # Gain is diff in valid range
        curr_canopy = props["environment"]["tree_canopy_pct"]
        new_canopy = min(0.8, curr_canopy + 0.01)
        # Recalculate HVI manually for speed
        # Only env part changes
        # Delta HVI = ( (1-curr) - (1-new) ) * weight
        #           = ( -curr + new ) * weight ?? No.
        #           = ( (1-curr)*w ) - ( (1-new)*w )
        #           = w * (1 - curr - 1 + new) = w * (new - curr) ... wait
        # (1 - 0.1) = 0.9 risk. (1 - 0.2) = 0.8 risk. Diff is 0.1.
        # So reduction is roughly weight * canopy_gain
        tree_hvi_reduction = req.weights.canopy * (new_canopy - curr_canopy) * req.scenario.severity_mult
        
        if tree_hvi_reduction > 0.0001:
            eff = tree_hvi_reduction / ACTION_TREES["cost"]
            candidates.append({
                "zone_id": props["id"],
                "zone_name": props["name"],
                "action": "plant_trees",
                "cost": ACTION_TREES["cost"],
                "desc": "Plant 50 Trees",
                "reduction": tree_hvi_reduction,
                "efficiency": eff
            })
            
        # Test Centre Impact
        # Impact is flat 0.15 reduction (clamped)
        # Effective reduction might be less if HVI is already low
        post_centre_hvi = max(0.0, base_hvi - 0.15)
        centre_reduction = base_hvi - post_centre_hvi
        
        if centre_reduction > 0.0001:
            eff = centre_reduction / ACTION_CENTRE["cost"]
            candidates.append({
                "zone_id": props["id"],
                "zone_name": props["name"],
                "action": "build_centre",
                "cost": ACTION_CENTRE["cost"],
                "desc": "New Cooling Centre",
                "reduction": centre_reduction,
                "efficiency": eff
            })

    # Sort by efficiency
    candidates.sort(key=lambda x: x["efficiency"], reverse=True)
    
    # Fill budget
    final_plan = []
    total_spent = 0
    total_impact = 0
    
    for cand in candidates:
        if total_spent + cand["cost"] <= current_budget:
            total_spent += cand["cost"]
            total_impact += cand["reduction"]
            final_plan.append(cand)
            
    return {
        "recommendations": final_plan,
        "total_spent": total_spent,
        "projected_hvi_reduction": total_impact
    }

if __name__ == "__main__":
    import uvicorn
    # Generate data first
    import data_gen
    data_gen.generate_kingston_data()
    uvicorn.run(app, host="0.0.0.0", port=8000)
