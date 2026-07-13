const API_BASE = "/api";

document.addEventListener("DOMContentLoaded", () => {
    const analyzeBtn = document.getElementById("analyzeBtn");
    const salesInput = document.getElementById("salesFile");
    const purchasesInput = document.getElementById("purchasesFile");
    const toast = document.getElementById("toast");

    if (!analyzeBtn) return;

    setupFileDropZone("salesFile");
    setupFileDropZone("purchasesFile");

    analyzeBtn.addEventListener("click", async () => {
        if (!salesInput.files.length || !purchasesInput.files.length) {
            showToast("Please upload both Sales and Purchases CSVs", true);
            return;
        }

        const formData = new FormData();
        for (let i = 0; i < salesInput.files.length; i++) {
            formData.append("sales", salesInput.files[i]);
        }
        for (let i = 0; i < purchasesInput.files.length; i++) {
            formData.append("purchases", purchasesInput.files[i]);
        }

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
        const labelWrapper = input.closest(".file-drop-label");
        const dropZone = labelWrapper.querySelector(".file-drop-zone");
        const previewsList = labelWrapper.querySelector(".file-previews-list");

        const preventDefaults = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };

        // Track files by "name|size" to prevent duplicates
        function fileKey(f) {
            return f.name + "|" + f.size;
        }

        dropZone.addEventListener("click", (e) => {
            if (!dropZone.contains(e.target)) return;
            input.click();
        });

        labelWrapper.addEventListener("dragenter", preventDefaults);
        labelWrapper.addEventListener("dragover", preventDefaults);
        labelWrapper.addEventListener("dragleave", (e) => {
            if (!labelWrapper.contains(e.relatedTarget)) {
                dropZone.classList.remove("drag-over");
            }
        });

        labelWrapper.addEventListener("drop", (e) => {
            preventDefaults(e);
            dropZone.classList.remove("drag-over");
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                // Merge dropped files with any already selected, avoiding duplicates
                const dt = new DataTransfer();
                const seen = new Set();
                for (let i = 0; i < input.files.length; i++) {
                    const key = fileKey(input.files[i]);
                    if (!seen.has(key)) {
                        seen.add(key);
                        dt.items.add(input.files[i]);
                    }
                }
                for (let i = 0; i < files.length; i++) {
                    const key = fileKey(files[i]);
                    if (!seen.has(key)) {
                        seen.add(key);
                        dt.items.add(files[i]);
                    }
                }
                input.files = dt.files;
                handleFileSelect(input);
            }
        });

        // Global drag prevention
        window.addEventListener("dragover", (e) => {
            if (salesInput.files.length || purchasesInput.files.length) {
                e.preventDefault();
            }
        }, false);

        window.addEventListener("drop", (e) => {
            if (salesInput.files.length || purchasesInput.files.length || e.dataTransfer.files.length > 0) {
                e.preventDefault();
            }
        });

        input.addEventListener("change", () => {
            // Deduplicate against already-selected files
            const dt = new DataTransfer();
            const seen = new Set();
            for (let i = 0; i < input.files.length; i++) {
                const key = fileKey(input.files[i]);
                if (!seen.has(key)) {
                    seen.add(key);
                    dt.items.add(input.files[i]);
                }
            }
            input.files = dt.files;
            handleFileSelect(input);
        });
    }

    function handleFileSelect(input) {
        const files = input.files;
        const label = input.closest(".file-drop-label");
        const dropZone = label.querySelector(".file-drop-zone");
        const previewsList = label.querySelector(".file-previews-list");

        if (!files.length) {
            dropZone.classList.remove("has-file");
            dropZone.querySelector(".file-drop-text strong").textContent =
                dropZone.dataset.label || "Upload CSV";
            dropZone.querySelector(".file-drop-text span").textContent =
                dropZone.dataset.hint || "Drag and drop or click to browse";
            previewsList.innerHTML = "";
            return;
        }

        dropZone.classList.add("has-file");
        dropZone.querySelector(".file-drop-text strong").textContent =
            `${files.length} file(s) selected`;
        dropZone.querySelector(".file-drop-text span").textContent =
            "Click or drag to add more";

        renderPreviews(previewsList, input);
    }

    // Build all preview boxes from the current input.files
    function renderPreviews(previewsList, input) {
        previewsList.innerHTML = "";
        const files = input.files;

        for (let i = 0; i < files.length; i++) {
            const ext = files[i].name.split(".").pop().toLowerCase();
            const icon = ext === "csv" ? "📊" : "📄";
            const size = formatFileSize(files[i]);

            const preview = document.createElement("div");
            preview.className = "file-preview";
            preview.style.display = "flex";
            preview.dataset.index = i;
            preview.innerHTML = `
                <div class="file-info">
                    <span class="icon">${icon}</span>
                    <div class="details">
                        <span class="name">${files[i].name}</span>
                        <span class="meta">${size}</span>
                    </div>
                </div>
                <button type="button" class="remove-file" aria-label="Remove file">✕</button>
            `;

            preview.querySelector(".remove-file").addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();

                const idx = parseInt(preview.dataset.index, 10);
                removeFileFromInput(input, idx);
                handleFileSelect(input);

                // Refresh previews after the drop-zone state has been updated
                renderPreviews(previewsList, input);
            });

            previewsList.appendChild(preview);
        }
    }

    // Remove a file by index and update the input's FileList
    function removeFileFromInput(input, removeIndex) {
        const dt = new DataTransfer();
        const files = input.files;
        for (let i = 0; i < files.length; i++) {
            if (i !== removeIndex) {
                dt.items.add(files[i]);
            }
        }
        input.files = dt.files;
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
