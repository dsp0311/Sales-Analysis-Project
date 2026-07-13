from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
from report_generator import generate_report
import os

# Get the absolute path to the frontend directory
# The backend is in /backend, frontend is in /frontend.
# So we go up one level from the backend folder, then into frontend.
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, '..', 'frontend')

app = Flask(__name__, static_folder=FRONTEND_DIR)
CORS(app)

# Simple in-memory storage for demo purposes
storage = {
    "user_details": {},
    "last_report": None
}

# ---------- Frontend Routes ----------

@app.route('/')
def serve_index():
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/<path:path>')
def serve_frontend(path):
    # This handles /css/style.css, /js/details.js, /pages/details.html, etc.
    return send_from_directory(FRONTEND_DIR, path)

# ---------- API Routes ----------

@app.route('/api/details', methods=['POST'])
def save_details():
    data = request.json
    storage["user_details"] = data
    return jsonify({"status": "success", "message": "Details saved"}), 200

@app.route('/api/analyze', methods=['POST'])
def analyze():
    if 'sales' not in request.files or 'purchases' not in request.files:
        return jsonify({"status": "error", "message": "Both sales and purchases CSVs are required"}), 400

    try:
        sales_files = request.files.getlist('sales')
        purchases_files = request.files.getlist('purchases')

        if not sales_files or not purchases_files:
            return jsonify({"status": "error", "message": "Both sales and purchases CSVs are required"}), 400

        sales_dfs = [pd.read_csv(f) for f in sales_files]
        purchases_dfs = [pd.read_csv(f) for f in purchases_files]

        sales_df = pd.concat(sales_dfs, ignore_index=True)
        purchases_df = pd.concat(purchases_dfs, ignore_index=True)

        report = generate_report(purchases_df, sales_df)
        storage["last_report"] = report

        return jsonify(report), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/results', methods=['GET'])
def get_results():
    if storage["last_report"] is None:
        return jsonify({"status": "error", "message": "No report generated yet"}), 404

    return jsonify({
        "user": storage["user_details"],
        "report": storage["last_report"]
    }), 200

if __name__ == '__main__':
    # host='0.0.0.0' allows external access; port=5000 is standard
    app.run(debug=True, host='0.0.0.0', port=5000)
