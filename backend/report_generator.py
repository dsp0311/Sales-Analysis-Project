import matplotlib
matplotlib.use("Agg")   # non-GUI backend, required for server/Flask use
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import io
import base64


def fig_to_base64(fig):
    """Convert a matplotlib figure to a base64 string for embedding in HTML."""
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", dpi=110)
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode("utf-8")
    plt.close(fig)   # free memory
    return img_base64


def generate_report(purchase_df: pd.DataFrame, sales_df: pd.DataFrame) -> dict:
    """
    Takes raw purchase_df and sales_df (already read from uploaded CSVs).
    Expected columns in both: Date, Product, Quantity, Amount

    Returns a dict containing:
        - summary numbers (total_revenue, total_profit, etc.)
        - insights (list of text suggestions)
        - charts (dict of base64-encoded PNG strings)
    """

    # ---------- Standardize columns ----------
    purchase_df = purchase_df.rename(columns={"Amount": "Cost"}).copy()
    purchase_df["Price"] = 0
    purchase_df["Type"] = "Purchase"

    sales_df = sales_df.rename(columns={"Amount": "Price"}).copy()
    sales_df["Cost"] = 0
    sales_df["Type"] = "Sale"

    data = pd.concat([purchase_df, sales_df], ignore_index=True)
    data.dropna(subset=["Date", "Product", "Quantity"], inplace=True)
    data["Date"] = pd.to_datetime(data["Date"], dayfirst=True, errors="coerce")
    data.dropna(subset=["Date"], inplace=True)

    # ---------- Core calculations ----------
    data["Revenue"] = data["Quantity"] * data["Price"]
    data["Total_Cost"] = data["Quantity"] * data["Cost"]
    data["Profit"] = data["Revenue"] - data["Total_Cost"]

    sales_only = data[data["Type"] == "Sale"].copy()

    total_revenue = float(sales_only["Revenue"].sum())
    total_profit = float(data["Profit"].sum())
    total_cost = float(data["Total_Cost"].sum())

    product_sales = sales_only.groupby("Product")["Quantity"].sum()
    # Handle empty product_sales
    if len(product_sales) == 0:
        best_product = "None"
        worst_product = "None"
    else:
        best_product = product_sales.idxmax()
        worst_product = product_sales.idxmin()

    product_profit = data.groupby("Product")["Profit"].sum()
    # Handle empty product_profit
    if len(product_profit) == 0:
        best_profit_product = "None"
        least_profit_product = "None"
    else:
        best_profit_product = product_profit.idxmax()
        least_profit_product = product_profit.idxmin()

    sales_only["Month"] = sales_only["Date"].dt.month
    monthly_revenue = sales_only.groupby("Month")["Revenue"].sum().sort_index()
    # CORRECT FIX: Use ALL data (sales + purchases) for true monthly profit
    data["Month"] = data["Date"].dt.month
    monthly_profit = data.groupby("Month")["Profit"].sum().sort_index()

    # ---------- Trend detection ----------
    insights = []
    if len(monthly_revenue) > 1:
        slope = np.polyfit(monthly_revenue.index, monthly_revenue.values, 1)[0]
        if slope > 0:
            insights.append("Sales are trending upward. Consider expanding stock or marketing.")
        else:
            insights.append("Sales are trending downward. Review pricing or marketing strategy.")
    else:
        insights.append("Not enough monthly data to determine a trend yet.")

    insights.append(
        f"'{best_product}' is your best-selling product by quantity — keep it well stocked, "
        f"and consider a modest price increase if demand allows."
    )
    insights.append(
        f"'{worst_product}' sells the least — consider a discount, bundling it with popular items, "
        f"or reducing future stock purchases."
    )
    insights.append(
        f"'{best_profit_product}' generates the most profit — prioritize marketing spend here."
    )
    if product_profit.min() < 0:
        insights.append(
            f"'{least_profit_product}' is currently running at a loss — review its pricing or cost."
        )

    # ---------- CHARTS ----------
    charts = {}

    # 1. Monthly Revenue & Profit Trend (Line chart)
    if len(monthly_revenue) > 0 and len(monthly_profit) > 0:
        fig, ax = plt.subplots(figsize=(8, 5))
        if len(monthly_revenue) > 0:
            ax.plot(monthly_revenue.index, monthly_revenue.values, marker="o", label="Revenue", color="#2b7de9")
        if len(monthly_profit) > 0:
            ax.plot(monthly_profit.index, monthly_profit.values, marker="o", label="Profit", color="#2ecc71")
        ax.set_title("Monthly Revenue & Profit Trend")
        ax.set_xlabel("Month")
        ax.set_ylabel("Amount")
        ax.legend()
        charts["monthly_trend"] = fig_to_base64(fig)

    # 2. Top Selling Products (Bar chart)
    top_products = product_sales.sort_values(ascending=False).head(8)
    if len(top_products) > 0:
        fig, ax = plt.subplots(figsize=(8, 5))
        ax.bar(top_products.index, top_products.values, color="#3498db")
        ax.set_title("Top Selling Products (by Quantity)")
        ax.set_xlabel("Product")
        ax.set_ylabel("Quantity Sold")
        ax.set_xticks(range(len(top_products)))
        ax.set_xticklabels(top_products.index, rotation=45, ha="right")
        charts["top_products"] = fig_to_base64(fig)
    else:
        charts["top_products"] = None

    # 3. Profit / Loss by Product (Color-coded bar chart)
    if len(product_profit) > 0:
        colors = ["#2ecc71" if p >= 0 else "#e74c3c" for p in product_profit.values]
        fig, ax = plt.subplots(figsize=(8, 5))
        ax.bar(product_profit.index, product_profit.values, color=colors)
        ax.axhline(0, color="black", linewidth=0.8)
        ax.set_title("Profit / Loss by Product")
        ax.set_xlabel("Product")
        ax.set_ylabel("Profit")
        ax.set_xticks(range(len(product_profit)))
        ax.set_xticklabels(product_profit.index, rotation=45, ha="right")
        charts["profit_by_product"] = fig_to_base64(fig)
    else:
        charts["profit_by_product"] = None

    # 4. Revenue Share by Product (Pie chart, top 5 + Others)
    revenue_by_product = sales_only.groupby("Product")["Revenue"].sum().sort_values(ascending=False)
    if len(revenue_by_product) > 0:
        top5 = revenue_by_product.head(5)
        others_total = revenue_by_product.iloc[5:].sum()
        pie_data = top5.copy()
        if others_total > 0:
            pie_data["Others"] = others_total
        if len(pie_data) > 0:
            fig, ax = plt.subplots(figsize=(7, 7))
            ax.pie(pie_data.values, labels=pie_data.index, autopct="%1.1f%%", startangle=90, colors=plt.cm.Set2.colors)
            ax.set_title("Revenue Share by Product")
            charts["revenue_share"] = fig_to_base64(fig)
        else:
            charts["revenue_share"] = None
    else:
        charts["revenue_share"] = None

    # 5. Cost vs Profit (Pie chart, overall business health) -> if profit negative, use bar chart
    if total_cost > 0 or total_profit != 0:  # Only create if there's some financial activity
        fig, ax = plt.subplots(figsize=(6, 6))
        if total_profit >= 0:
            ax.pie([total_cost, total_profit], labels=["Total Cost", "Total Profit"],
                   autopct="%1.1f%%", startangle=90, colors=["#e67e22", "#2ecc71"])
            ax.set_title("Revenue Breakdown: Cost vs Profit")
        else:
            # Bar chart for loss scenario
            bars = ax.bar(["Total Cost", "Total Profit"], [total_cost, total_profit],
                          color=["#e67e22", "#e74c3c"])
            ax.set_title("Cost vs Profit (Bar Chart - Loss Indicated)")
            ax.set_ylabel("Amount (₹)")
            # Add value labels on bars
            for bar in bars:
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height,
                        f'₹{height:,.2f}',
                        ha='center', va='bottom' if height >= 0 else 'top')
        charts["cost_vs_profit"] = fig_to_base64(fig)
    else:
        charts["cost_vs_profit"] = None

    # Prepare transactions for export (CSV)
    export_data = data.copy()
    export_data["Date"] = export_data["Date"].dt.strftime("%Y-%m-%d")
    transactions_csv = export_data.to_csv(index=False)

    return {
        "total_revenue": round(total_revenue, 2),
        "total_profit": round(total_profit, 2),
        "total_cost": round(total_cost, 2),
        "best_product": best_product,
        "worst_product": worst_product,
        "best_profit_product": best_profit_product,
        "least_profit_product": least_profit_product,
        "insights": insights,
        "charts": charts,
        "_transactions_csv": transactions_csv,  # For CSV export
    }
