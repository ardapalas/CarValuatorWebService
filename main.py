import joblib
import shap
import numpy as np
import pandas as pd
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from pathlib import Path

BASE_DIR = Path(__file__).parent

model       = joblib.load(BASE_DIR / "model.pkl")
transformer = joblib.load(BASE_DIR / "transformer.pkl")
freq_maps   = joblib.load(BASE_DIR / "freq_maps.pkl")
explainer   = shap.TreeExplainer(model)

FREQ_MEAN = {col: freq_maps[col].mean() for col in freq_maps}

FEAT_LABELS = {
    "one_hot__fuel_type_Diesel":      "Fuel Type",
    "one_hot__fuel_type_Electric":    "Fuel Type",
    "one_hot__fuel_type_LPG":         "Fuel Type",
    "one_hot__fuel_type_Petrol":      "Fuel Type",
    "remainder__vehicle_age":         "Vehicle Age",
    "remainder__km_driven":           "KM Driven",
    "remainder__seller_type":         "Seller Type",
    "remainder__transmission_type":   "Transmission",
    "remainder__mileage":             "Mileage",
    "remainder__engine":              "Engine (cc)",
    "remainder__max_power":           "Max Power",
    "remainder__seats":               "Seats",
    "remainder__car_name_freq":       "Car Name",
    "remainder__brand_freq":          "Brand",
    "remainder__model_freq":          "Model",
}

app = FastAPI(title="Car Valuator")
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=BASE_DIR / "templates")

SELLER_TYPE_MAP  = {"Individual": 0, "Dealer": 1, "Trustmark Dealer": 2}
TRANSMISSION_MAP = {"Manual": 0, "Automatic": 1}


class CarInput(BaseModel):
    car_name:          str
    brand:             str
    model:             str
    vehicle_age:       int
    km_driven:         int
    seller_type:       str
    fuel_type:         str
    transmission_type: str
    mileage:           float
    engine:            int
    max_power:         float
    seats:             int


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/predict")
async def predict(car: CarInput):
    row = {
        "vehicle_age":      car.vehicle_age,
        "km_driven":        car.km_driven,
        "seller_type":      SELLER_TYPE_MAP.get(car.seller_type, 0),
        "fuel_type":        car.fuel_type,
        "transmission_type": TRANSMISSION_MAP.get(car.transmission_type, 0),
        "mileage":          car.mileage,
        "engine":           car.engine,
        "max_power":        car.max_power,
        "seats":            car.seats,
        "car_name_freq":    freq_maps["car_name"].get(car.car_name, FREQ_MEAN["car_name"]),
        "brand_freq":       freq_maps["brand"].get(car.brand, FREQ_MEAN["brand"]),
        "model_freq":       freq_maps["model"].get(car.model, FREQ_MEAN["model"]),
    }

    df    = pd.DataFrame([row])
    X_arr = transformer.transform(df)
    feat_names = transformer.get_feature_names_out()
    X     = pd.DataFrame(X_arr, columns=feat_names)

    price      = float(model.predict(X)[0])
    shap_vals  = explainer.shap_values(X)[0]
    base_value = float(explainer.expected_value[0])

    # Merge OHE fuel columns into one "Fuel Type" entry
    merged: dict[str, float] = {}
    for feat, shap_v in zip(feat_names, shap_vals):
        label = FEAT_LABELS.get(feat, feat)
        merged[label] = merged.get(label, 0.0) + float(shap_v)

    contributions = sorted(
        [{"feature": k, "value": round(v, 2)} for k, v in merged.items()],
        key=lambda x: abs(x["value"]),
        reverse=True,
    )

    return JSONResponse({
        "price":         price,
        "base_value":    round(base_value, 2),
        "contributions": contributions,
    })
