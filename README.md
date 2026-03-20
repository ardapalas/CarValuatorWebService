# Car Valuator — Used Car Price Prediction Web Service

Car Valuator is an end-to-end machine learning web service for estimating used car prices.  
The project uses a trained RandomForest regression model to generate real-time price predictions from user inputs and presents SHAP-based feature contribution analysis to explain what drives each prediction.

---

## 🚀 Features

- Used car price prediction with a trained ML model  
- Real-time inference via FastAPI backend  
- Interactive web interface for user input  
- Cascading dropdowns (brand → model → car name)  
- SHAP-based explanation of predictions  
- Visualization of feature contributions (increase/decrease)  

---

## 🧠 Tech Stack

- Backend: FastAPI  
- Frontend: HTML, CSS, JavaScript  
- ML/Data: scikit-learn, pandas, numpy, joblib  
- Explainability: SHAP  

---

## 📁 Project Structure

CarValuator/  
├── main.py  
├── model.pkl  
├── transformer.pkl  
├── freq_maps.pkl  
├── templates/  
│   └── index.html  
├── static/  
│   ├── style.css  
│   ├── script.js  
│   └── car_data.json  
├── cardekho.csv  
├── CarDekho.ipynb  
└── README.md  

---

## ⚙️ How It Works

The application takes user inputs such as:

- brand  
- model  
- car name  
- vehicle age  
- kilometers driven  
- fuel type  
- transmission type  
- seller type  
- mileage  
- engine  
- max power  
- seats  

These inputs are transformed using a preprocessing pipeline and frequency encoding mappings, then passed to the trained regression model for prediction.

After prediction, SHAP values are computed to explain:

- which features increased the price  
- which features decreased the price  
- how much each feature contributed  

---

## 📦 Required Files

Make sure the following files exist in the root directory:

- model.pkl  
- transformer.pkl  
- freq_maps.pkl  

---

## 🛠 Installation

git clone https://github.com/ardapalas/CarValuator.git  
cd CarValuator  
pip install -r requirements.txt  

---

## ▶️ Run Locally

uvicorn main:app --reload  

Open in browser:

http://127.0.0.1:8000  

---

## 🔌 API Endpoint

POST /predict  

---

