# Business Sales Bill & Analysis

A web application for analyzing business sales and purchase data. Upload CSV files to generate comprehensive business reports with charts, insights, and export options.

## Features

- Upload sales and purchase CSV files
- Automatic generation of business metrics:
  - Total Revenue, Profit, Cost
  - Best/worst selling products
- Interactive charts:
  - Monthly Revenue & Profit Trend
  - Top Selling Products
  - Profit/Loss by Product
  - Revenue Share (Pie chart)
  - Cost vs Profit breakdown
- Business insights and recommendations
- Export data as CSV or JSON
- Print-friendly reports

## Requirements

- Python 3.8 or higher
- pip (Python package installer)

## Installation

1. Navigate to the project directory:
```bash
cd "C:\Users\DSP\OneDrive\Desktop\Medical_Sales_Analysis"
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

## How to Run

1. **Start the Flask server** (from the project root):
```bash
python backend/app.py
```
   *Server starts on `http://0.0.0.0:5000`*

2. **Open your browser** and go to:
```
http://localhost:5000
```

3. **Follow the workflow**:
   - Step 1: Enter your business details
   - Step 2: Upload Sales and Purchases CSV files
   - Step 3: View analysis, charts, and insights

## CSV File Format

Both CSV files must contain these columns (exact names required):

| Column   | Description                    |
|----------|--------------------------------|
| Date     | Transaction date (DD/MM/YYYY) |
| Product  | Product name                   |
| Quantity | Number of units                |
| Amount   | Total amount in Rupees (₹)     |

**Notes:**
- Sales CSV: `Amount` represents selling price
- Purchases CSV: `Amount` represents cost price
- Dates can be in any common format; the app uses `dayfirst=True`

## Buttons on Results Page

- **← Edit bills**: Return to upload page to change files
- **📥 Export CSV (Excel)**: Download all transactions as CSV
- **⬇ Export JSON**: Download complete report data (including charts as base64)
- **🖨️ Print Report**: Open print dialog with formatted report

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Failed to fetch" error | Make sure Flask server is running on port 5000. Access via `http://localhost:5000`, not file:// |
| Port 5000 already in use | Change `port=5000` to another port in `backend/app.py`, or stop the other process |
| CSV upload fails | Ensure both 'sales' and 'purchases' files are selected. Check column names match exactly |
| Charts not showing | Verify CSV has data. If no sales data, charts will show "No data available" |
| Import errors | Install all packages from requirements.txt. Use `pip install --upgrade pip` if needed |

## Project Structure

```
Business_Sales_Analysis/
├── backend/
│   ├── app.py              # Flask server
│   └── report_generator.py # Analytics engine
├── frontend/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── details.js
│   │   ├── bills.js
│   │   └── results.js
│   └── pages/
│       ├── index.html
│       ├── details.html
│       ├── bills.html
│       └── results.html
├── requirements.txt
└── README.md
```

## Stopping the Server

Press `Ctrl+C` in the terminal where the server is running.

## Notes

- Data is stored in memory only. Restarting the server clears all data.
- This is a demo application. For production, use a production WSGI server and persistent storage.
