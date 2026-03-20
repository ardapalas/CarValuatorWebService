# CarValuator

A full-stack machine learning web application that predicts used car prices using a Random Forest model. Features an interactive SHAP-powered explainability dashboard that shows which factors drive each prediction.

**Live Demo:** [Coming Soon]

## Overview

Users select their car's details through a cascading form (Brand → Model → Car Name), enter specifications like mileage, engine power, and kilometers driven, and receive an instant price prediction with a visual breakdown of the key factors influencing the valuation.

## Dataset

**Source:** [CarDekho - Used Car Price Prediction](https://www.kaggle.com/datasets/nehalbirla/vehicle-dataset-from-cardekho)

~13,000 used car listings with 12 features including vehicle age, kilometers driven, fuel type, transmission, engine specs, and seller type. Target variable: `selling_price` (continuous).

## Model

**RandomForestRegressor** optimized with RandomizedSearchCV (100 iterations, 3-fold CV).

| Parameter | Value |
|-----------|-------|
| n_estimators | 1000 |
| max_features | 5 |
| min_samples_split | 2 |
| max_depth | None |
| R² Score | 0.935 |

## Feature Engineering

- **Frequency Encoding:** car_name, brand, and model encoded by training set frequency (unknown values fall back to column mean)
- **Ordinal Mapping:** seller_type (Individual=0, Dealer=1, Trustmark Dealer=2), transmission_type (Manual=0, Automatic=1)
- **One-Hot Encoding:** fuel_type (Diesel, Electric, LPG, Petrol) via ColumnTransformer with drop="first"
- **Outlier Removal:** Removed extreme selling_price and km_driven outliers identified through scatter plot analysis
- **Data Cleaning:** Fixed zero-seat entries, removed duplicates

## Explainability

Each prediction includes a SHAP (SHapley Additive exPlanations) analysis powered by `TreeExplainer`:

- Top 3 contributing factors highlighted as chips
- Full feature contribution bar chart (positive/negative impacts)
- Base value reference showing the average prediction before feature adjustments

## Tech Stack

- **Model:** scikit-learn (RandomForestRegressor), SHAP
- **Backend:** FastAPI, Uvicorn, Jinja2
- **Frontend:** HTML, CSS, JavaScript
- **Data:** Pandas, NumPy, Matplotlib, Seaborn

## Project Structure

```
CarValuator/
├── main.py                  # FastAPI backend + SHAP endpoint
├── model.pkl                # Trained RandomForest model
├── transformer.pkl          # ColumnTransformer (OneHotEncoder pipeline)
├── freq_maps.pkl            # Frequency encoding maps
├── templates/
│   └── index.html           # Frontend UI
├── static/
│   ├── style.css            # Dark theme styling
│   ├── script.js            # Cascading form + SHAP chart renderer
│   └── car_data.json        # Brand → Model → Car Name mappings
├── CarDekho.ipynb           # Model training notebook
├── cardekho.csv             # Dataset
├── requirements.txt
└── README.md
```

## Setup & Run

```bash
git clone https://github.com/ardapalas/CarValuator.git
cd CarValuator
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Open `http://127.0.0.1:8000` in your browser.

## Key Implementation Details

- Cascading dropdown form: Brand selection filters available Models, Model selection filters Car Names
- SHAP values for one-hot encoded fuel type columns are merged into a single "Fuel Type" contribution
- Unknown car/brand/model values in the form gracefully fall back to the column's mean frequency
- Price displayed in USD format via `Intl.NumberFormat`

## Lessons Learned

- **Frequency Encoding is effective for high-cardinality categoricals** — car_name had 1,000+ unique values, one-hot encoding would have been impractical.
- **SHAP TreeExplainer is orders of magnitude faster** than the generic Explainer for tree-based models.
- **Saving the full preprocessing pipeline (model + transformer + freq_maps) is essential** — missing any component breaks inference.
- **Outlier removal significantly improved model performance** — a few extreme values were skewing predictions.

## Author

ARDALP — Mathematics & Computer Science Student at Istanbul Kültür University
