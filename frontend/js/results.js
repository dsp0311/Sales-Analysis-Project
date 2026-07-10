const API_BASE = "/api";

document.addEventListener("DOMContentLoaded", async () => {
  const statGrid = document.getElementById("statGrid");
  const insightsBox = document.getElementById("insightsBox");
  const insightsList = document.getElementById("insightsList");
  const userBanner = document.getElementById("userBanner");
  const userName = document.getElementById("userName");
  const userSub = document.getElementById("userSub");
  const resultsCard = document.getElementById("resultsCard");

  // Show skeleton stats while loading
  renderSkeletonStats();

  try {
    const response = await fetch(`${API_BASE}/results`);
    if (!response.ok) throw new Error("No results found. Please upload bills first.");

    const { user, report } = await response.json();

    // 1. User Banner
    if (user && Object.keys(user).length > 0) {
      userBanner.style.display = "flex";
      userName.textContent = user.fullName || "Business";
      userSub.textContent = user.businessName || "Your Business";
      const avatarEl = document.getElementById("userAvatar");
      if (avatarEl) {
        const name = user.fullName || user.businessName || "";
        avatarEl.textContent = name.trim().charAt(0).toUpperCase() || "U";
      }
      const userCategory = document.getElementById("userCategory");
      if (userCategory && user.category) {
        userCategory.textContent = user.category;
      }
    }

    // 2. KPI Stats with animation
    renderStats(report);

    // 3. Insights
    if (report.insights && report.insights.length > 0) {
      insightsBox.style.display = "block";
      insightsList.innerHTML = report.insights.map(i => `<li>${i}</li>`).join("");
    }

    // 4. Render Matplotlib Charts (Base64)
    renderCharts(report.charts);

    // 5. Setup export buttons
    setupExports(report, user);

  } catch (err) {
    console.error(err);
    resultsCard.innerHTML = `
      <div style="text-align:center; padding: 3rem;">
        <h2>Analysis Not Found</h2>
        <p>${err.message}</p>
        <a href="bills.html" class="btn btn-primary" style="margin-top: 1rem; display: inline-block;">Upload Data Now</a>
      </div>`;
  }

  function renderSkeletonStats() {
    statGrid.innerHTML = `
      <div class="stat-card skeleton revenue"><div class="stat-label"></div><div class="stat-value"></div></div>
      <div class="stat-card skeleton profit"><div class="stat-label"></div><div class="stat-value"></div></div>
      <div class="stat-card skeleton cost"><div class="stat-label"></div><div class="stat-value"></div></div>
      <div class="stat-card skeleton product"><div class="stat-label"></div><div class="stat-value"></div></div>
    `;
  }

  function renderStats(report) {
    const stats = [
      { label: "Total Revenue", value: `₹${report.total_revenue.toLocaleString()}`, class: "revenue" },
      { label: "Total Profit", value: `₹${report.total_profit.toLocaleString()}`, class: "profit" },
      { label: "Total Cost", value: `₹${report.total_cost.toLocaleString()}`, class: "cost" },
      { label: "Best Product", value: report.best_product || "—", class: "product" },
    ];

    statGrid.innerHTML = stats.map((s, i) => `
      <div class="stat-card ${s.class}" style="animation-delay: ${i * 80}ms; opacity: 0; animation: rise 0.4s ease ${i * 80}ms both;">
        <div class="stat-label">${s.label}</div>
        <div class="stat-value">${s.value}</div>
      </div>
    `).join("");
  }

  function renderCharts(charts) {
    Object.entries(charts).forEach(([id, base64]) => {
      const img = document.getElementById(`chart-${id}`);
      if (!img) return;

      const wrapper = img.closest(".chart-wrap");
      if (base64) {
        img.src = `data:image/png;base64,${base64}`;
        img.onload = () => {
          img.style.display = "block";
          wrapper.classList.remove("skeleton");
        };
        wrapper.classList.remove("skeleton");
      } else {
        // No data for this chart
        img.style.display = "none";
        wrapper.classList.add("skeleton");
        wrapper.innerHTML = '<div class="no-data">No data available</div>';
      }
    });
  }

  function setupExports(report, user) {
    const exportCsvBtn = document.getElementById("exportCsvBtn");
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener("click", () => {
        const csv = report._transactions_csv;
        if (!csv) {
          alert("No transaction data available for export.");
          return;
        }
        downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `transactions-${getDateStr()}.csv`);
      });
    }

    const exportJsonBtn = document.getElementById("exportJsonBtn");
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener("click", () => {
        const exportData = { user, report, exported_at: new Date().toISOString() };
        downloadBlob(new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" }), `business-sales-report-${getDateStr()}.json`);
      });
    }

    const printBtn = document.getElementById("printBtn");
    if (printBtn) {
      printBtn.addEventListener("click", () => window.print());
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function getDateStr() {
    return new Date().toISOString().split("T")[0];
  }
});