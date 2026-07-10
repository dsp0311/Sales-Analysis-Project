const API_BASE = "/api";

document.addEventListener("DOMContentLoaded", async () => {
  const statGrid = document.getElementById("statGrid");
  const insightsBox = document.getElementById("insightsBox");
  const insightsList = document.getElementById("insightsList");
  const userBanner = document.getElementById("userBanner");
  const userName = document.getElementById("userName");
  const userSub = document.getElementById("userSub");

  try {
    const response = await fetch(`${API_BASE}/results`);
    if (!response.ok) throw new Error("No results found. Please upload bills first.");

    const { user, report } = await response.json();

    // 1. User Banner
    if (user && Object.keys(user).length > 0) {
      userBanner.style.display = "flex";
      userName.textContent = user.fullName || "Business";
      userSub.textContent = user.businessName || "Your Business";
      const avatarEl = document.getElementById('userAvatar');
      if (avatarEl) {
        const name = user.fullName || user.businessName || "";
        avatarEl.textContent = name.trim().charAt(0).toUpperCase() || "U";
      }
      const userCategory = document.getElementById('userCategory');
      if (userCategory && user.category) {
        userCategory.textContent = user.category;
      }
    }

    // 2. KPI Stats
    const stats = [
      { label: "Total Revenue", value: `₹${report.total_revenue.toLocaleString()}`, color: "var(--accent-primary)" },
      { label: "Total Profit", value: `₹${report.total_profit.toLocaleString()}`, color: "var(--accent-success)" },
      { label: "Total Cost", value: `₹${report.total_cost.toLocaleString()}`, color: "var(--accent-danger)" },
      { label: "Best Product", value: report.best_product, color: "var(--accent-primary)" },
    ];

    statGrid.innerHTML = stats.map(s => `
      <div class="stat-card" style="border-top: 4px solid ${s.color}">
        <div class="stat-label">${s.label}</div>
        <div class="stat-value">${s.value}</div>
      </div>
    `).join("");

    // 3. Insights
    if (report.insights && report.insights.length > 0) {
      insightsBox.style.display = "block";
      insightsList.innerHTML = report.insights.map(i => `<li>${i}</li>`).join("");
    }

    // 4. Render Matplotlib Charts (Base64)
    Object.entries(report.charts).forEach(([id, base64]) => {
      const img = document.getElementById(`chart-${id}`);
      if (img) {
        if (base64) {
          img.src = `data:image/png;base64,${base64}`;
          img.onload = () => { img.style.display = "block"; };
        } else {
          // No data for this chart - hide it and show a message
          img.parentElement.innerHTML = '<div class="no-data">No data available</div>';
        }
      }
    });

    // 5. Export CSV button (transactions)
    const exportCsvBtn = document.getElementById("exportCsvBtn");
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener("click", () => {
        const csv = report._transactions_csv;
        if (!csv) {
          alert("No transaction data available for export.");
          return;
        }
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }

    // 6. Export JSON button (full report)
    const exportJsonBtn = document.getElementById("exportJsonBtn");
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener("click", () => {
        const exportData = {
          user: user,
          report: report,
          exported_at: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `business-sales-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }

    // 7. Print Report button
    const printBtn = document.getElementById("printBtn");
    if (printBtn) {
      printBtn.addEventListener("click", () => {
        window.print();
      });
    }

  } catch (err) {
    console.error(err);
    document.getElementById("resultsCard").innerHTML = `
      <div style="text-align:center; padding: 3rem;">
        <h2>Analysis Not Found</h2>
        <p>${err.message}</p>
        <a href="bills.html" class="btn btn-primary">Upload Data Now</a>
      </div>`;
  }
});
