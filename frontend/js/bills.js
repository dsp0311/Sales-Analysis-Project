const API_BASE = "/api";

document.addEventListener("DOMContentLoaded", () => {
  const analyzeBtn = document.getElementById("analyzeBtn");
  const salesInput = document.getElementById("salesFile");
  const purchasesInput = document.getElementById("purchasesFile");
  const toast = document.getElementById("toast");

  if (!analyzeBtn) return;

  analyzeBtn.addEventListener("click", async () => {
    if (!salesInput.files[0] || !purchasesInput.files[0]) {
      showToast("Please upload both Sales and Purchases CSVs", true);
      return;
    }

    const formData = new FormData();
    formData.append("sales", salesInput.files[0]);
    formData.append("purchases", purchasesInput.files[0]);

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Analyzing... ⏳";

    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        showToast("Analysis complete! Redirecting...");
        setTimeout(() => {
          window.location.href = "results.html";
        }, 1500);
      } else {
        const errData = await response.json();
        throw new Error(errData.message || "Analysis failed");
      }
    } catch (err) {
      showToast(err.message, true);
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = "Upload & Analyze 📊";
    }
  });

  function showToast(msg, isError = false) {
    toast.textContent = msg;
    toast.className = `toast ${isError ? "error" : "success"} show`;
    setTimeout(() => {
      toast.className = "toast";
    }, 3000);
  }
});
