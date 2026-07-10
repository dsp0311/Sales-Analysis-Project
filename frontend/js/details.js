const API_BASE = "/api";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("detailsForm");
  const toast = document.getElementById("toast");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

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
        }, 1500);
      } else {
        throw new Error("Failed to save details");
      }
    } catch (err) {
      showToast(err.message, true);
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
