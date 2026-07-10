const API_BASE = "/api";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("detailsForm");
  const toast = document.getElementById("toast");
  const nextBtn = document.getElementById("nextBtn");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    nextBtn.disabled = true;
    nextBtn.querySelector(".btn-text").textContent = "Saving...";
    nextBtn.querySelector(".btn-loader").style.display = "block";

    try {
      const response = await fetch(`${API_BASE}/details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        showToast("Details saved successfully!");
        setTimeout(() => {
          window.location.href = "bills.html";
        }, 1000);
      } else {
        throw new Error("Failed to save details");
      }
    } catch (err) {
      showToast(err.message, true);
    } finally {
      nextBtn.disabled = false;
      nextBtn.querySelector(".btn-text").textContent = "Save & Continue →";
      nextBtn.querySelector(".btn-loader").style.display = "none";
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