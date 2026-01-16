# 🔥 HeatSafe Kingston

**HeatSafe Kingston** is a municipal decision-support tool that helps cities identify neighbourhood-level heat vulnerability and prioritize heat mitigation interventions in a transparent, data-driven way.

Built for **KingHacks – City of Kingston Municipal AI Track**, HeatSafe Kingston focuses on public health, equity, and practical planning, enabling municipal teams to make better decisions under limited resources.

---

## 🌍 Problem
Extreme heat is an increasing public health risk, but its impact is unevenly distributed across neighbourhoods due to differences in land cover, demographics, and access to cooling infrastructure.

Municipal planners often struggle to:
- Identify where heat vulnerability is highest
- Allocate limited interventions effectively
- Justify intervention priorities using clear data

---

## 💡 Solution
HeatSafe Kingston is a purely software-based system that:
1. Computes an area-level **Heat Vulnerability Index (HVI)**
2. Visualizes heat risk through an interactive map
3. Simulates the impact of heat mitigation interventions
4. Recommends high-impact intervention allocations under a constrained budget
5. Generates a clear, exportable action plan for planners

---

## 🧠 Key Features

### 📊 Heat Vulnerability Index (HVI)
- Combines environmental and demographic indicators such as:
  - Tree canopy or land cover
  - Impervious surface
  - Age distribution (e.g. seniors)
  - Income proxy
  - Housing density (optional)
- Fully explainable with configurable weights
- Neighbourhood-level aggregation only

### 🗺️ Interactive Heat Map
- Choropleth map displaying heat vulnerability by neighbourhood
- Toggleable data layers
- Clickable areas with detailed score breakdowns
- Clear legends and tooltips

### 🔁 Intervention Simulator
Simulate the impact of:
- Adding cooling centres
- Increasing tree canopy coverage
- Deploying outreach programs
- Different heat severity scenarios

Heat vulnerability scores update dynamically based on selected interventions.

### 🤖 Intervention Recommender
- Budget-constrained optimization engine
- Identifies neighbourhoods where interventions yield the greatest reduction in heat vulnerability
- Produces a ranked list of recommended actions with clear explanations

### 🧾 Action Plan Export
- One-page summary of prioritized interventions
- Overview of assumptions and parameters
- Exportable for internal planning or presentation

---

## 🛠️ Tech Stack
- **Frontend:** Interactive web application with map visualization
- **Backend:** Python-based API for scoring and simulation
- **Data:** Public or synthetic datasets (GeoJSON and CSV)
- **Models:** Composite scoring and lightweight optimization

The system is designed to be interpretable, maintainable, and suitable for municipal pilots.

---

## 🏛️ Intended Users
- Municipal planners
- Public health teams
- Climate resilience and sustainability staff
- Emergency management teams

---

## 📍 Built For
**KingHacks – City of Kingston Municipal AI Track**  
Focused on civic innovation, scalable software solutions, and community impact.
