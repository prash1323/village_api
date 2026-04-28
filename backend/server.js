const express = require("express");
const cors = require("cors");

const data = require("./final_india_dataset_clean.json");

const app = express();
app.use(cors());

// Test route
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

// Get states
app.get("/states", (req, res) => {
  const states = [...new Set(data.map(d => d.State))];
  res.json(states);
});

// Get districts
app.get("/districts", (req, res) => {
  const { state } = req.query;

  const districts = data
    .filter(d => d.State === state)
    .map(d => d.District);

  res.json([...new Set(districts)]);
});

// Get subdistricts
app.get("/subdistricts", (req, res) => {
  const { state, district } = req.query;

  const subs = data
    .filter(d => d.State === state && d.District === district)
    .map(d => d.SubDistrict);

  res.json([...new Set(subs)]);
});

// Get villages
app.get("/villages", (req, res) => {
  const { state, district, subDistrict } = req.query;

  const villages = data.filter(d =>
    d.State === state &&
    d.District === district &&
    d.SubDistrict === subDistrict
  );

  res.json(villages);
});

// Start server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});