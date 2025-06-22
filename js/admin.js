document.addEventListener("DOMContentLoaded", () => {
    // Verificare sesiune
    async function checkSession() {
        const res = await fetch("/Kim/api/users/auth.php", { credentials: "include" });
        const data = await res.json();

        if (!data.logged_in || data.role !== 'admin') {
            window.location.href = "/Kim/";
        } else {
            document.getElementById("welcomeMsg").textContent = `Salut, ${data.username}!`;
            loadChildren();
        }
    }

    // Delogare
    async function logout() {
        await fetch("/Kim/api/users/auth.php", { method: "DELETE" });
        window.location.href = "/Kim/";
    }
    document.getElementById("logoutBtnNav").addEventListener("click", logout);

    // Navigare taburi
    const addBtn = document.getElementById("addBtn");
    const updateBtn = document.getElementById("updateBtn");
    const deleteBtn = document.getElementById("deleteBtn");
    const exportBtn = document.getElementById("exportBtn");

    const addContent = document.getElementById("addContent");
    const updateContent = document.getElementById("updateContent");
    const deleteContent = document.getElementById("deleteContent");
    const exportContent = document.getElementById("exportContent");
    
    const buttons = [addBtn, updateBtn, deleteBtn, exportBtn];
    const contents = [addContent, updateContent, deleteContent, exportContent];

    function showContent(index) {
        buttons.forEach((btn, i) => {
            btn.classList.toggle("active", i === index);
            contents[i].style.display = i === index ? "block" : "none";
        });
    }

    addBtn.addEventListener("click", (e) => { e.preventDefault(); showContent(0); });
    updateBtn.addEventListener("click", (e) => { e.preventDefault(); showContent(1); });
    deleteBtn.addEventListener("click", (e) => { e.preventDefault(); showContent(2); });
    exportBtn.addEventListener("click", (e) => { e.preventDefault(); showContent(3); });

    // Logica pentru export
    const exportForm = document.getElementById("exportForm");
    exportForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const format = document.getElementById("exportFormat").value;
        const msgBox = document.getElementById("exportMsg");
        msgBox.textContent = "Se generează fișierul...";
        msgBox.style.color = "#8EB69B";

        try {
            const res = await fetch("/Kim/api/export/children_data.php", { credentials: "include" });
            if (!res.ok) {
                throw new Error(`Eroare server: ${res.statusText}`);
            }
            const data = await res.json();

            if (format === "json") {
                downloadFile(JSON.stringify(data, null, 2), "copii.json", "application/json");
            } else if (format === "csv") {
                const csvContent = convertToCSV(data);
                downloadFile(csvContent, "copii.csv", "text/csv;charset=utf-8;");
            }
            msgBox.textContent = "Fișier descărcat cu succes!";
        } catch (error) {
            msgBox.textContent = `Eroare: ${error.message}`;
            msgBox.style.color = "#ff5c5c";
        }
    });

    function convertToCSV(data) {
        if (data.length === 0) return "";
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(",")];
        for (const row of data) {
            const values = headers.map(header => {
                let value = row[header] === null || row[header] === undefined ? "" : String(row[header]);
                if (value.includes(",")) {
                    value = `"${value}"`;
                }
                return value;
            });
            csvRows.push(values.join(","));
        }
        return csvRows.join("\n");
    }

    function downloadFile(content, fileName, contentType) {
        const blob = new Blob([content], { type: contentType });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }

    // Adaugare copil
    const addChildForm = document.getElementById("addChildForm");
    addChildForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("childName").value.trim();
        const parent_id = parseInt(document.getElementById("parentId").value.trim());
        const msgBox = document.getElementById("childMsg");

        const res = await fetch("/Kim/api/children/index.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ name, parent_id })
        });

        const data = await res.json();
        msgBox.textContent = data.message || (data.success ? "Copil adăugat!" : "Eroare.");
        msgBox.style.color = data.success ? "#8EB69B" : "#ff5c5c";
        if (data.success) {
            addChildForm.reset();
            loadChildren();
        }
    });
    
    // Actualizare copil
    const updateChildForm = document.getElementById("updateChildForm");
    updateChildForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = parseInt(document.getElementById("updateChildId").value.trim());
        const name = document.getElementById("updateChildName").value.trim();
        const parent_id = document.getElementById("updateParentId").value.trim();
        const msgBox = document.getElementById("updateMsg");

        let body = { id };
        if (name) body.name = name;
        if (parent_id) body.parent_id = parseInt(parent_id);
        
        if (Object.keys(body).length <= 1) {
            msgBox.textContent = "Trebuie să completezi cel puțin un câmp pentru actualizare (nume sau ID părinte).";
            msgBox.style.color = "#ff5c5c";
            return;
        }

        const res = await fetch("/Kim/api/children/index.php", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(body)
        });
        
        const data = await res.json();
        msgBox.textContent = data.message || "Eroare.";
        msgBox.style.color = data.success ? "#8EB69B" : "#ff5c5c";
        if (data.success) {
            updateChildForm.reset();
            loadChildren();
        }
    });

    // Stergere copil
    const deleteChildForm = document.getElementById("deleteChildForm");
    deleteChildForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = parseInt(document.getElementById("deleteChildId").value.trim());
        const msgBox = document.getElementById("deleteMsg");

        if (!id || id <= 0) {
             msgBox.textContent = "ID copil invalid.";
             msgBox.style.color = "#ff5c5c";
             return;
        }

        const res = await fetch("/Kim/api/children/index.php", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ id })
        });

        const data = await res.json();
        msgBox.textContent = data.message || "Eroare.";
        msgBox.style.color = data.success ? "#8EB69B" : "#ff5c5c";
        if(data.success) {
            deleteChildForm.reset();
            loadChildren();
        }
    });

    // Incarcare lista copii
    async function loadChildren() {
        const res = await fetch("/Kim/api/children/index.php", { credentials: "include" });
        const data = await res.json();
        const list = document.getElementById("childrenList");
        list.innerHTML = "";

        if (Array.isArray(data)) {
            data.forEach(child => {
                const li = document.createElement("li");
                li.innerHTML = `<span>#${child.id} ${child.name}</span> <span>Părinte: ${child.parent_username} (ID: ${child.parent_id})</span>`;
                list.appendChild(li);
            });
        }
    }

    checkSession();
    showContent(0);
});