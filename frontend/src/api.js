import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const getBaseData = async () => {
    const res = await axios.get(`${API_URL}/data`);
    return res.data;
};

export const runSimulation = async (scenario, weights, interventions) => {
    const res = await axios.post(`${API_URL}/simulate`, {
        scenario,
        weights,
        interventions
    });
    return res.data;
};

export const runOptimizer = async (budget, weights, scenario) => {
    const res = await axios.post(`${API_URL}/optimize`, {
        budget,
        weights,
        scenario,
        costs: {} // Using defaults on backend
    });
    return res.data;
};
