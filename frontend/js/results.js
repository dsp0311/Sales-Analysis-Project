const API_BASE = "/api";
const LS_KEY = "business_report_cache";

// Simple HTML escape to prevent XSS when rendering backend data
function escapeHtml(str) {
	const div = document.createElement("div");
	div.textContent = str;
	return div.innerHTML;
}

// Try loading from localStorage if API fails
function loadFromCache() {
	const raw = localStorage.getItem(LS_KEY);
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

// Save report to localStorage for resilience
function saveToCache(user, report) {
	const payload = JSON.stringify({ user, report, savedAt: Date.now() });
	try {
		localStorage.setItem(LS_KEY, payload);
	} catch (e) {
		console.warn("Could not save to localStorage:", e);
	}
}

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

	let user, report;
	try {
		const response = await fetch(`${API_BASE}/results`);
		if (!response.ok) throw new Error("API_NOT_FOUND");

		const data = await response.json();
		user = data.user;
		report = data.report;

	} catch (apiErr) {
		console.warn("API unavailable, checking cache:", apiErr.message);

		const cached = loadFromCache();
		if (!cached || !cached.report) {
			renderError(
				"Session Expired",
				"The server session has ended (e.g., after printing or page refresh). Your report is no longer held in memory. Use the tab where you first viewed the results to re-print or export directly."
			);
			return;
		}
		user = cached.user;
		report = cached.report;
	}

	// Cache for future re-visits
	saveToCache(user, report);

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
		insightsList.innerHTML = report.insights
			.map(i => `<li>${escapeHtml(i)}</li>`)
			.join("");
	} else {
		insightsBox.style.display = "none";
	}

	// 4. Render Matplotlib Charts (Base64)
	renderCharts(report.charts);

	// 5. Setup export buttons
	setupExports(report, user);

	function renderError(title, message) {
		resultsCard.innerHTML = `
		<div style="text-align:center; padding: 3rem;">
			<h2>${escapeHtml(title)}</h2>
			<p style="color: #8b949e; margin-top: 0.5rem;">${escapeHtml(message)}</p>
			<p style="color: #8b949e; margin-top: 0.3rem; font-size: 13px;">Tip: If you still have the previous results tab open, re-print or export from there.</p>
			<a href="bills.html" class="btn btn-primary" style="margin-top: 1.5rem; display: inline-block;">Upload New Data</a>
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
			printBtn.addEventListener("click", () => {
				const overlay = document.createElement("div");
				overlay.className = "print-overlay";
				overlay.innerHTML = `
					<div class="print-overlay-box">
						<h3>Printing / PDF Export</h3>
						<p><strong>Important:</strong> Enable <strong>"Background graphics"</strong> in the print dialog to preserve the dark theme.</p>
						<div style="background: var(--bg-input); border: 1px solid var(--border-primary); border-radius: 8px; padding: 16px; margin: 12px 0; text-align: left; font-size: 13px;">
							<strong>How to enable:</strong><br>
							<strong>Chrome / Edge:</strong> Click "More settings" and enable <strong>"Background graphics"</strong><br>
							<strong>Firefox:</strong> Click "Page Setup" and enable <strong>"Print Background (colors &amp; images)"</strong>
						</div>
						<p style="font-size: 12px; color: var(--fg-muted); margin: 0;">This message will close when you click below.</p>
						<button class="btn btn-primary" id="printProceedBtn" style="margin-top: 12px;">Got it, Open Print Dialog</button>
					</div>
				`;
				overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:99999;";
				const box = overlay.querySelector(".print-overlay-box");
				box.style.cssText = "background:var(--bg-secondary);color:var(--fg-primary);border:1px solid var(--border-primary);border-radius:12px;padding:28px;max-width:480px;width:90%;text-align:center;";
				document.body.appendChild(overlay);

				const proceed = () => {
					overlay.remove();
					// Set a descriptive title so the saved PDF has a meaningful filename
					const bizName = (user && (user.businessName || user.fullName)) || "Business";
					const dateStr = new Date().toISOString().split("T")[0];
					const originalTitle = document.title;
					document.title = bizName + " - Sales Analysis Report - " + dateStr;
					setTimeout(() => {
						window.print();
						// Restore title after print dialog closes
						setTimeout(() => { document.title = originalTitle; }, 1000);
					}, 50);
				};

				overlay.querySelector("#printProceedBtn").addEventListener("click", proceed);
				overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
			});
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
