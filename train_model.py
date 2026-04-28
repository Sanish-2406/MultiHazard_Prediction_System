import pandas as pd
import numpy as np
import json
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import joblib

# Import XGBoost
from xgboost import XGBClassifier

def main():
    print("Loading dataset...")
    try:
        df = pd.read_csv('nasa_multihazard_dataset.csv')
    except Exception as e:
        print(f"Error loading CSV: {e}")
        return

    features = [
        'rainfall_mm', 'temperature_c', 'humidity_pct', 'pressure_hpa',
        'wind_speed_ms', 'soil_moisture_pct', 'elevation_m', 'slope_deg',
        'vegetation_index', 'drainage_density', 'distance_to_river_km',
        'antecedent_rainfall_mm'
    ]

    X = df[features]
    y = df['risk_class']

    print("Splitting data...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Original string classes for tracking / UI
    classes = ['Low', 'Medium', 'High']

    results = {}

    def get_metrics(y_true, y_pred):
        return {
            "accuracy": round(accuracy_score(y_true, y_pred), 4),
            "precision": round(precision_score(y_true, y_pred, average='weighted', zero_division=0), 4),
            "recall": round(recall_score(y_true, y_pred, average='weighted', zero_division=0), 4),
            "f1Score": round(f1_score(y_true, y_pred, average='weighted', zero_division=0), 4)
        }

    # --------- Random Forest ---------
    print("Training Random Forest (Tuned)...")
    rf = RandomForestClassifier(n_estimators=300, max_depth=15, min_samples_split=4, random_state=42)
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)
    
    rf_cm = confusion_matrix(y_test, rf_pred, labels=classes)
    
    # Feature Importances
    importances = rf.feature_importances_
    feat_imp_dict = {f: round(float(imp), 4) for f, imp in zip(features, importances)}
    feat_imp_dict = dict(sorted(feat_imp_dict.items(), key=lambda item: item[1], reverse=True))

    results['Random Forest'] = {
        'metrics': get_metrics(y_test, rf_pred),
        'confusion': rf_cm.tolist()
    }

    joblib.dump(rf, 'random_forest_model.pkl')
    print("Saved Random Forest.")

    # --------- XGBoost (Advanced) ---------
    print("Training XGBoost Classifier...")
    # XGBoost needs encoded labels
    le = LabelEncoder()
    # Ensure mapping matches the 'classes' order: 'Low' -> 0, 'Medium' -> 1, 'High' -> 2
    # To do this safely, we fit on the specific ordered list
    le.fit(classes)
    
    y_train_enc = le.transform(y_train)
    y_test_enc = le.transform(y_test)
    
    xgb = XGBClassifier(
        n_estimators=200, 
        learning_rate=0.05, 
        max_depth=8, 
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        eval_metric='mlogloss'
    )
    xgb.fit(X_train, y_train_enc)
    
    xgb_pred_enc = xgb.predict(X_test)
    xgb_pred = le.inverse_transform(xgb_pred_enc)
    
    xgb_cm = confusion_matrix(y_test, xgb_pred, labels=classes)

    results['XGBoost'] = {
        'metrics': get_metrics(y_test, xgb_pred),
        'confusion': xgb_cm.tolist()
    }

    joblib.dump(xgb, 'xgboost_model.pkl')
    joblib.dump(le, 'label_encoder.pkl')
    print("Saved XGBoost.")

    # Aggregate and Save Metadata for Frontend Simulation replacement
    output_data = {
        "classes": classes,
        "featureImportance": feat_imp_dict,
        "models": results
    }

    with open('src/data/model_training_results.json', 'w') as f:
        json.dump(output_data, f, indent=4)
    print("Saved evaluation results directly to src/data/model_training_results.json")

if __name__ == '__main__':
    main()
