// ================================
// HAMBURGER MENU
// ================================
const hamburger = document.getElementById("hamburger");
const navLinks = document.querySelector(".nav-links");

hamburger.addEventListener("click", () => {
  navLinks.style.display =
    navLinks.style.display === "flex" ? "none" : "flex";
});

// ================================
// HERO COUNTER ANIMATION
// ================================
const counters = document.querySelectorAll(".stat-num");

counters.forEach(counter => {
  const updateCount = () => {
    const target = +counter.getAttribute("data-target");
    const count = +counter.innerText;
    const increment = target / 100;

    if (count < target) {
      counter.innerText = Math.ceil(count + increment);
      setTimeout(updateCount, 20);
    } else {
      counter.innerText = target.toLocaleString();
    }
  };
  updateCount();
});

// ================================
// TERMINAL TYPING EFFECT
// ================================
const terminalCode = document.getElementById("terminalCode");

const codeText = `{
  "state": "Bihar",
  "district": "Patna",
  "subDistrict": "Danapur",
  "village": "Rampur",
  "country": "India"
}`;

let index = 0;

function typeEffect() {
  if (index < codeText.length) {
    terminalCode.innerHTML += codeText.charAt(index);
    index++;
    setTimeout(typeEffect, 20);
  }
}
typeEffect();

// ================================
// JSON DATA LOAD
// ================================
let fullData = [];

fetch("final_india_dataset_clean.json")
  .then(res => res.json())
  .then(data => {
    fullData = data;
    loadStates();
  })
  .catch(err => {
    console.error("Error loading JSON:", err);
  });

// ================================
// ELEMENTS
// ================================
const stateSelect = document.getElementById("demoState");
const districtSelect = document.getElementById("demoDistrict");
const subDistrictSelect = document.getElementById("demoSubDistrict");
const villageInput = document.getElementById("demoVillage");
const resultsDiv = document.getElementById("demoResults");
const searchBtn = document.getElementById("demoSearch");
const urlDiv = document.getElementById("demoUrl");

// ================================
// LOAD STATES
// ================================
function loadStates() {
  const states = [...new Set(fullData.map(d => d.State))];

  states.forEach(state => {
    const option = document.createElement("option");
    option.value = state;
    option.textContent = state;
    stateSelect.appendChild(option);
  });
}

// ================================
// STATE → DISTRICT
// ================================
stateSelect.addEventListener("change", () => {
  districtSelect.innerHTML = `<option>Select District</option>`;
  subDistrictSelect.innerHTML = `<option>Select Sub-District</option>`;

  const filtered = fullData.filter(d => d.State === stateSelect.value);
  const districts = [...new Set(filtered.map(d => d.District))];

  districts.forEach(d => {
    const option = document.createElement("option");
    option.value = d;
    option.textContent = d;
    districtSelect.appendChild(option);
  });
});

// ================================
// DISTRICT → SUBDISTRICT
// ================================
districtSelect.addEventListener("change", () => {
  subDistrictSelect.innerHTML = `<option>Select Sub-District</option>`;

  const filtered = fullData.filter(
    d => d.State === stateSelect.value &&
         d.District === districtSelect.value
  );

  const subs = [...new Set(filtered.map(d => d.SubDistrict))];

  subs.forEach(s => {
    const option = document.createElement("option");
    option.value = s;
    option.textContent = s;
    subDistrictSelect.appendChild(option);
  });
});

// ================================
// SEARCH FUNCTION
// ================================
searchBtn.addEventListener("click", () => {
  const state = stateSelect.value;
  const district = districtSelect.value;
  const subDistrict = subDistrictSelect.value;
  const villageQuery = villageInput.value.toLowerCase();

  resultsDiv.innerHTML = "";
  urlDiv.style.display = "block";

  if (!state || !district || !subDistrict) {
    resultsDiv.innerHTML = `<p>Please select all fields</p>`;
    return;
  }

  const filtered = fullData.filter(d =>
    d.State === state &&
    d.District === district &&
    d.SubDistrict === subDistrict &&
    d.Village.toLowerCase().includes(villageQuery)
  );

  if (filtered.length === 0) {
    resultsDiv.innerHTML = `<p>No results found</p>`;
    return;
  }

  filtered.forEach(v => {
    const chip = document.createElement("div");
    chip.className = "result-chip";
    chip.innerHTML = `
      <strong>${v.Village}</strong>
      <span>${v.SubDistrict}, ${v.District}, ${v.State}, India</span>
    `;
    resultsDiv.appendChild(chip);
  });

  // API URL preview
  urlDiv.innerText = `GET /api/v1/villages?state=${state}&district=${district}&subDistrict=${subDistrict}&search=${villageQuery}`;
});

// ================================
// PRICING TOGGLE
// ================================
const toggle = document.getElementById("billingToggle");
const amounts = document.querySelectorAll(".amount");
const monthlyLabel = document.getElementById("toggleMonthly");
const annualLabel = document.getElementById("toggleAnnual");

toggle.addEventListener("change", () => {
  amounts.forEach(el => {
    const monthly = el.getAttribute("data-monthly");
    const annual = el.getAttribute("data-annual");

    el.innerText = toggle.checked ? annual : monthly;
  });

  monthlyLabel.classList.toggle("active");
  annualLabel.classList.toggle("active");
});


// COVERAGE TABLE (STATIC)
const tableBody = document.getElementById("coverageTableBody");

const coverageData = [
  { state: "Maharashtra", districts: 36, sub: 355, villages: 43000 },
  { state: "Bihar", districts: 38, sub: 534, villages: 45000 },
  { state: "UP", districts: 75, sub: 822, villages: 100000 }
];

coverageData.forEach(row => {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${row.state}</td>
    <td>${row.districts}</td>
    <td>${row.sub}</td>
    <td>${row.villages}</td>
    <td>
      <div class="coverage-bar">
        <div class="coverage-bar-fill" style="width:${Math.random()*100}%"></div>
      </div>
    </td>
  `;

  tableBody.appendChild(tr);
});