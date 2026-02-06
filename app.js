(() => {
    "use strict";

    // DOM elements
    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("fileInput");
    const uploadSection = document.getElementById("uploadSection");
    const settingsSection = document.getElementById("settingsSection");
    const columnSelect = document.getElementById("columnSelect");
    const delimiterSelect = document.getElementById("delimiterSelect");
    const translateBtn = document.getElementById("translateBtn");
    const progressSection = document.getElementById("progressSection");
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");
    const previewSection = document.getElementById("previewSection");
    const previewHead = document.getElementById("previewHead");
    const previewBody = document.getElementById("previewBody");
    const exportBtn = document.getElementById("exportBtn");
    const resetBtn = document.getElementById("resetBtn");
    const errorMessage = document.getElementById("errorMessage");

    let rawText = "";
    let parsedRows = [];
    let headers = [];
    let translatedRows = [];

    // ---- CSV parsing ----

    function parseCSV(text, delimiter) {
        const rows = [];
        let current = "";
        let inQuotes = false;
        const result = [];

        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            const next = text[i + 1];

            if (inQuotes) {
                if (ch === '"' && next === '"') {
                    current += '"';
                    i++;
                } else if (ch === '"') {
                    inQuotes = false;
                } else {
                    current += ch;
                }
            } else {
                if (ch === '"') {
                    inQuotes = true;
                } else if (ch === delimiter) {
                    result.push(current);
                    current = "";
                } else if (ch === "\r" && next === "\n") {
                    result.push(current);
                    current = "";
                    rows.push(result.slice());
                    result.length = 0;
                    i++;
                } else if (ch === "\n") {
                    result.push(current);
                    current = "";
                    rows.push(result.slice());
                    result.length = 0;
                } else {
                    current += ch;
                }
            }
        }

        // last field / row
        if (current || result.length > 0) {
            result.push(current);
            rows.push(result);
        }

        // remove trailing empty rows
        while (rows.length > 0 && rows[rows.length - 1].every((c) => c === "")) {
            rows.pop();
        }

        return rows;
    }

    function detectDelimiter(text) {
        const firstLine = text.split(/\r?\n/)[0] || "";
        const semicolons = (firstLine.match(/;/g) || []).length;
        const commas = (firstLine.match(/,/g) || []).length;
        const tabs = (firstLine.match(/\t/g) || []).length;

        if (tabs >= commas && tabs >= semicolons && tabs > 0) return "\t";
        if (semicolons > commas) return ";";
        return ",";
    }

    // ---- Translation via MyMemory API ----

    async function translateText(text, sourceLang, targetLang) {
        if (!text || !text.trim()) return "";
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Translation API error: ${res.status}`);
        const data = await res.json();
        if (data.responseStatus === 200 || data.responseStatus === "200") {
            return data.responseData.translatedText;
        }
        throw new Error(data.responseDetails || "Translation failed");
    }

    async function translateWithRetry(text, sourceLang, targetLang, retries = 2) {
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await translateText(text, sourceLang, targetLang);
            } catch (err) {
                if (attempt === retries) throw err;
                await delay(1000 * (attempt + 1));
            }
        }
    }

    function delay(ms) {
        return new Promise((r) => setTimeout(r, ms));
    }

    // ---- File handling ----

    function handleFile(file) {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith(".csv")) {
            showError("Prosim nahrajte soubor s priponou .csv");
            return;
        }
        hideError();

        const reader = new FileReader();
        reader.onload = (e) => {
            rawText = e.target.result;

            const detected = detectDelimiter(rawText);
            delimiterSelect.value = detected === "\t" ? "\\t" : detected;

            const delim = detected;
            const rows = parseCSV(rawText, delim);
            if (rows.length < 2) {
                showError("CSV soubor musi obsahovat hlavicku a alespon jeden radek dat.");
                return;
            }

            headers = rows[0];
            parsedRows = rows.slice(1);

            // populate column selector
            columnSelect.innerHTML = "";
            headers.forEach((h, i) => {
                const opt = document.createElement("option");
                opt.value = i;
                opt.textContent = h || `Sloupec ${i + 1}`;
                columnSelect.appendChild(opt);
            });

            uploadSection.hidden = true;
            settingsSection.hidden = false;
            previewSection.hidden = true;
            progressSection.hidden = true;
        };
        reader.readAsText(file, "UTF-8");
    }

    // ---- Translation orchestration ----

    async function runTranslation() {
        const colIndex = parseInt(columnSelect.value, 10);
        const delimiter = delimiterSelect.value === "\\t" ? "\t" : delimiterSelect.value;

        // re-parse if delimiter changed
        const rows = parseCSV(rawText, delimiter);
        headers = rows[0];
        parsedRows = rows.slice(1);

        settingsSection.hidden = true;
        progressSection.hidden = false;
        previewSection.hidden = true;
        hideError();

        const total = parsedRows.length;
        translatedRows = [];

        const targetLangs = [
            { code: "en", label: "English" },
            { code: "de", label: "Deutsch" },
            { code: "sk", label: "Slovensky" },
        ];

        for (let i = 0; i < total; i++) {
            const row = parsedRows[i];
            const czechName = (row[colIndex] || "").trim();
            const newRow = [...row];

            // translate to each target language sequentially (to respect rate limits)
            for (const lang of targetLangs) {
                try {
                    const translated = await translateWithRetry(czechName, "cs", lang.code);
                    newRow.push(translated);
                } catch {
                    newRow.push("");
                }
                // small delay between API calls to avoid rate-limiting
                await delay(300);
            }

            translatedRows.push(newRow);

            // update progress
            const pct = Math.round(((i + 1) / total) * 100);
            progressBar.style.width = pct + "%";
            progressText.textContent = `${i + 1} / ${total}`;
        }

        // build result headers
        const newHeaders = [
            ...headers,
            ...targetLangs.map((l) => l.label),
        ];

        showPreview(newHeaders, translatedRows);
        progressSection.hidden = true;
        previewSection.hidden = false;
    }

    // ---- Preview table ----

    function showPreview(hdrs, rows) {
        previewHead.innerHTML = "";
        previewBody.innerHTML = "";

        const tr = document.createElement("tr");
        hdrs.forEach((h) => {
            const th = document.createElement("th");
            th.textContent = h;
            tr.appendChild(th);
        });
        previewHead.appendChild(tr);

        rows.forEach((row) => {
            const tr = document.createElement("tr");
            hdrs.forEach((_, ci) => {
                const td = document.createElement("td");
                td.textContent = row[ci] !== undefined ? row[ci] : "";
                tr.appendChild(td);
            });
            previewBody.appendChild(tr);
        });
    }

    // ---- CSV export ----

    function exportCSV() {
        const delimiter = delimiterSelect.value === "\\t" ? "\t" : delimiterSelect.value;
        const targetLangs = ["English", "Deutsch", "Slovensky"];
        const newHeaders = [...headers, ...targetLangs];

        const lines = [newHeaders, ...translatedRows];
        const csvContent = lines
            .map((row) =>
                row
                    .map((cell) => {
                        const str = String(cell);
                        if (
                            str.includes(delimiter) ||
                            str.includes('"') ||
                            str.includes("\n")
                        ) {
                            return '"' + str.replace(/"/g, '""') + '"';
                        }
                        return str;
                    })
                    .join(delimiter)
            )
            .join("\r\n");

        // BOM for Excel UTF-8 compatibility
        const blob = new Blob(["\uFEFF" + csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "products_translated.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ---- Reset ----

    function resetApp() {
        rawText = "";
        parsedRows = [];
        headers = [];
        translatedRows = [];
        fileInput.value = "";

        uploadSection.hidden = false;
        settingsSection.hidden = true;
        progressSection.hidden = true;
        previewSection.hidden = true;
        hideError();
    }

    // ---- Error helpers ----

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.hidden = false;
    }

    function hideError() {
        errorMessage.hidden = true;
    }

    // ---- Event listeners ----

    // Drag & drop
    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("drag-over");
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("drag-over");
    });

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("drag-over");
        const file = e.dataTransfer.files[0];
        handleFile(file);
    });

    // File input
    fileInput.addEventListener("change", () => {
        handleFile(fileInput.files[0]);
    });

    // Translate
    translateBtn.addEventListener("click", () => {
        runTranslation().catch((err) => {
            progressSection.hidden = true;
            settingsSection.hidden = false;
            showError("Chyba pri prekladu: " + err.message);
        });
    });

    // Export
    exportBtn.addEventListener("click", exportCSV);

    // Reset
    resetBtn.addEventListener("click", resetApp);
})();
