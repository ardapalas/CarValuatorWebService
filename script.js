let CAR_DATA = null;

const brandSel    = document.getElementById("brand");
const modelSel    = document.getElementById("model");
const carNameSel  = document.getElementById("car_name");
const form        = document.getElementById("valuation-form");
const submitBtn   = document.getElementById("submit-btn");
const btnText     = document.getElementById("btn-text");
const spinner     = document.getElementById("btn-spinner");
const resultBox   = document.getElementById("result");
const priceEl     = document.getElementById("result-price");
const errorEl     = document.getElementById("error-msg");
const shapSection = document.getElementById("shap-section");
const shapChart   = document.getElementById("shap-chart");
const baseValEl   = document.getElementById("base-value");

// ── Load car data ──
async function init() {
  const res = await fetch("/static/car_data.json");
  CAR_DATA = await res.json();
  CAR_DATA.brands.forEach(b => {
    const opt = document.createElement("option");
    opt.value = opt.textContent = b;
    brandSel.appendChild(opt);
  });
}

// ── Cascade: Brand → Model ──
brandSel.addEventListener("change", () => {
  populateSelect(modelSel, CAR_DATA.models_by_brand[brandSel.value] || [], "Select model");
  modelSel.disabled = false;
  populateSelect(carNameSel, [], "Select car name");
  carNameSel.disabled = true;
});

// ── Cascade: Model → Car Name ──
modelSel.addEventListener("change", () => {
  populateSelect(carNameSel, CAR_DATA.names_by_model[modelSel.value] || [], "Select car name");
  carNameSel.disabled = false;
});

function populateSelect(sel, items, placeholder) {
  sel.innerHTML = "";
  const ph = document.createElement("option");
  ph.value = ""; ph.disabled = true; ph.selected = true;
  ph.textContent = placeholder;
  sel.appendChild(ph);
  items.forEach(item => {
    const opt = document.createElement("option");
    opt.value = opt.textContent = item;
    sel.appendChild(opt);
  });
}

// ── UI helpers ──
function setLoading(on) {
  submitBtn.disabled = on;
  btnText.textContent = on ? "Calculating…" : "Get Valuation";
  spinner.classList.toggle("hidden", !on);
}

const fmt = (v) => new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", maximumFractionDigits: 0,
}).format(v);

function showResult(price) {
  priceEl.textContent = fmt(price);
  resultBox.classList.remove("hidden");
  errorEl.classList.add("hidden");
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.remove("hidden");
  resultBox.classList.add("hidden");
  shapSection.classList.add("hidden");
}

// ── Top 3 factors ──
function renderTopFactors(contributions) {
  const container = document.getElementById("top-factors");
  container.innerHTML = "";

  contributions.slice(0, 3).forEach(c => {
    const isPos = c.value >= 0;
    const chip  = document.createElement("div");
    chip.className = `top-factor-chip ${isPos ? "pos" : "neg"}`;
    chip.innerHTML = `
      <span class="chip-sign">${isPos ? "+" : "−"}</span>
      <span class="chip-label">${c.feature}</span>
    `;
    container.appendChild(chip);
  });
}

// ── SHAP chart renderer ──
function renderShap(contributions, baseValue) {
  shapChart.innerHTML = "";
  baseValEl.textContent = fmt(baseValue);

  // Max absolute value → used to scale bar widths (each side = 50%)
  const maxAbs = Math.max(...contributions.map(c => Math.abs(c.value)));

  contributions.forEach((c, i) => {
    const isPos = c.value >= 0;
    const pct   = (Math.abs(c.value) / maxAbs) * 48; // max 48% of half-width

    const row = document.createElement("div");
    row.className = "shap-row";
    row.style.animationDelay = `${i * 40}ms`;

    const feat = document.createElement("div");
    feat.className = "shap-feat";
    feat.textContent = c.feature;
    feat.title = c.feature;

    const barWrap = document.createElement("div");
    barWrap.className = "shap-bar-wrap";

    const bar = document.createElement("div");
    bar.className = `shap-bar ${isPos ? "pos" : "neg"}`;
    // Start at 0 width for animation
    bar.style.width = "0%";
    barWrap.appendChild(bar);

    const val = document.createElement("div");
    val.className = `shap-val ${isPos ? "pos" : "neg"}`;
    val.textContent = (isPos ? "+" : "") + fmt(c.value);

    row.appendChild(feat);
    row.appendChild(barWrap);
    row.appendChild(val);
    shapChart.appendChild(row);

    // Animate bar width after paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { bar.style.width = pct + "%"; });
    });
  });

  shapSection.classList.remove("hidden");
  shapSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ── Form submit ──
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setLoading(true);
  resultBox.classList.add("hidden");
  shapSection.classList.add("hidden");
  errorEl.classList.add("hidden");

  const payload = {
    car_name:          carNameSel.value,
    brand:             brandSel.value,
    model:             modelSel.value,
    vehicle_age:       parseInt(document.getElementById("vehicle_age").value),
    km_driven:         parseInt(document.getElementById("km_driven").value),
    seller_type:       document.getElementById("seller_type").value,
    fuel_type:         document.getElementById("fuel_type").value,
    transmission_type: document.getElementById("transmission_type").value,
    mileage:           parseFloat(document.getElementById("mileage").value),
    engine:            parseInt(document.getElementById("engine").value),
    max_power:         parseFloat(document.getElementById("max_power").value),
    seats:             parseInt(document.getElementById("seats").value),
  };

  try {
    const res = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || `Server error (${res.status})`);
    }
    const data = await res.json();
    showResult(data.price);
    renderTopFactors(data.contributions);
    renderShap(data.contributions, data.base_value);
  } catch (err) {
    showError("Could not get valuation: " + err.message);
  } finally {
    setLoading(false);
  }
});

init();
