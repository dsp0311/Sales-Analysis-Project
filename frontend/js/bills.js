const API_BASE = "/api";

document.addEventListener("DOMContentLoaded", () => {
  const analyzeBtn = document.getElementById("analyzeBtn");
  const salesInput = document.getElementById("salesFile");
  const purchasesInput = document.getElementById("purchasesFile");
  const toast = document.getElementById("toast");

  if (!analyzeBtn) return;

  // File drop zones
  setupFileDropZone("salesFile");
  setupFileDropZone("purchasesFile");

  analyzeBtn.addEventListener("click", async () => {
    if (!salesInput.files[0] || !purchasesInput.files[0]) {
      showToast("Please upload both Sales and Purchases CSVs", true);
      return;
    }

    const formData = new FormData();
    formData.append("sales", salesInput.files[0]);
    formData.append("purchases", purchasesInput.files[0]);

    analyzeBtn.disabled = true;
    analyzeBtn.querySelector(".btn-text").textContent = "Analyzing...";
    analyzeBtn.querySelector(".btn-loader").style.display = "block";

    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        showToast("Analysis complete! Redirecting...");
        setTimeout(() => {
          window.location.href = "results.html";
        }, 1200);
      } else {
        const errData = await response.json();
        throw new Error(errData.message || "Analysis failed");
      }
    } catch (err) {
      showToast(err.message, true);
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.querySelector(".btn-text").textContent = "Upload & Analyze";
      analyzeBtn.querySelector(".btn-loader").style.display = "none";
    }
  });

  function setupFileDropZone(inputId) {
    const input = document.getElementById(inputId);
    const label = input.closest("label.file-drop-label");
    const dropZone = label.querySelector(".file-drop-zone");
    const filePreview = label.querySelector(".file-preview");
    const removeBtn = label.querySelector(".remove-file");

    // Click to open file dialog
    label.addEventListener("click", (e) => {
      if (e.target === label || e.target.closest(".file-drop-zone")) {
        input.click();
      }
    });

    // Drag and drop events
    label.addEventListener("dragenter", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add("drag-over");
    });

    label.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    label.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!label.contains(e.relatedTarget)) {
        dropZone.classList.remove("drag-over");
      }
    });

    label.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove("drag-over");

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        input.files = files;
        handleFileSelect(input, label);
      }
    });

    // File input change
    input.addEventListener("change", () => handleFileSelect(input, label));

    // Remove file
    if (removeBtn) {
      removeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        input.value = "";
        updateFilePreview(label, null);
        dropZone.classList.remove("has-file");
      });
    }
  }

  function handleFileSelect(input, label) {
    const file = input.files[0];
    updateFilePreview(label, file);
    if (file) {
      label.querySelector(".file-drop-zone").classList.add("has-file");
    } else {
      label.querySelector(".file-drop-zone").classList.remove("has-file");
    }
  }

  function updateFilePreview(label, file) {
    const dropZone = label.querySelector(".file-drop-zone");
    const filePreview = label.querySelector(".file-preview");

    if (!file) {
      filePreview.style.display = "none";
      dropZone.querySelector(".file-drop-text strong").textContent = dropZone.dataset.label || "Upload CSV";
      dropZone.querySelector(".file-drop-text span").textContent = dropZone.dataset.hint || "Drag and drop or click to browse";
      return;
    }

    // Update drop zone text
    dropZone.querySelector(".file-drop-text strong").textContent = file.name;
    dropZone.querySelector(".file-drop-text span").textContent = formatFileSize(file);

    // Show file preview
    const ext = file.name.split(".").pop().toLowerCase();
    const icon = ext === "csv" ? "📊" : "📄";

    filePreview.querySelector(".file-info .icon").textContent = icon;
    filePreview.querySelector(".file-info .name").textContent = file.name;
    filePreview.querySelector(".file-info .meta").textContent = formatFileSize(file);
    filePreview.style.display = "flex";
  }

  function formatFileSize(file) {
    const kb = file.size / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  }

  function showToast(msg, isError = false) {
    toast.textContent = msg;
    toast.className = `toast ${isError ? "error" : "success"} show`;
    setTimeout(() => {
      toast.className = "toast";
    }, 3000);
  }
});