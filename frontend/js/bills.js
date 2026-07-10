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
		const labelWrapper = input.closest(".file-drop-label");
		const dropZone = labelWrapper.querySelector(".file-drop-zone");
		const filePreview = labelWrapper.querySelector(".file-preview");
		const removeBtn = labelWrapper.querySelector(".remove-file");

		// Click to open file dialog
		dropZone.addEventListener("click", (e) => {
			// Only trigger if clicking the drop zone itself, not the preview
			if (!dropZone.contains(e.target)) return;
			input.click();
		});

		// Prevent default drag behavior on the entire document
		// so the browser doesn't try to navigate to the file
		const preventDefaults = (e) => {
			e.preventDefault();
			e.stopPropagation();
		};

		// Listen on the wrapper for enter/leave (broader capture)
		labelWrapper.addEventListener("dragenter", preventDefaults);
		labelWrapper.addEventListener("dragover", preventDefaults);
		labelWrapper.addEventListener("dragleave", (e) => {
			// Only remove highlight if leaving the wrapper entirely
			if (!labelWrapper.contains(e.relatedTarget)) {
				dropZone.classList.remove("drag-over");
			}
		});

		// Handle the drop on the wrapper (catches all child elements too)
		labelWrapper.addEventListener("drop", (e) => {
			preventDefaults(e);
			dropZone.classList.remove("drag-over");

			const files = e.dataTransfer.files;
			if (files.length > 0) {
				// Use DataTransfer to assign files (modern approach)
				try {
					const dt = new DataTransfer();
					dt.items.add(files[0]);
					input.files = dt.files;
				} catch {
					// Fallback for older browsers
					input.files = files;
				}
				handleFileSelect(input, labelWrapper);
			}
		});

		// Also add a window-level drag handler to prevent browser default navigation
		window.addEventListener(
			"dragover",
			(e) => {
				// If a drop zone has the file and user is dragging another file,
				// prevent browser from opening the file
				if (salesInput.files[0] || purchasesInput.files[0]) {
					e.preventDefault();
				}
			},
			false
		);

		window.addEventListener("drop", (e) => {
			// Prevent browser from navigating to dropped file
			if (
				salesInput.files[0] ||
				purchasesInput.files[0] ||
				e.dataTransfer.files.length > 0
			) {
				e.preventDefault();
			}
		});

		// File input change
		input.addEventListener("change", () => handleFileSelect(input, labelWrapper));

		// Remove file
		if (removeBtn) {
			removeBtn.addEventListener("click", (e) => {
				e.preventDefault();
				e.stopPropagation();
				input.value = "";
				updateFilePreview(labelWrapper, null);
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
			dropZone.querySelector(".file-drop-text strong").textContent =
				dropZone.dataset.label || "Upload CSV";
			dropZone.querySelector(".file-drop-text span").textContent =
				dropZone.dataset.hint || "Drag and drop or click to browse";
			return;
		}

		// Update drop zone text
		dropZone.querySelector(".file-drop-text strong").textContent = file.name;
		dropZone.querySelector(".file-drop-text span").textContent = formatFileSize(
			file
		);

		// Show file preview
		const ext = file.name.split(".").pop().toLowerCase();
		const icon = ext === "csv" ? "📊" : "📄";

		filePreview.querySelector(".file-info .icon").textContent = icon;
		filePreview.querySelector(".file-info .name").textContent = file.name;
		filePreview.querySelector(".file-info .meta").textContent = formatFileSize(
			file
		);
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
