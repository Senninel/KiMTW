document.addEventListener('DOMContentLoaded', () => {
    // Verificam daca suntem pe pagina cu harta
    if (!document.getElementById('map')) {
        return;
    }

    const MAX_DISTANCE_METERS = 100; // Distanta maxima admisa in metri
    const UPDATE_INTERVAL = 10000;   // Actualizam locatia copiilor la fiecare 10 secunde

    const childMarkers = {}; // Obiect pentru a stoca markerele copiilor
    let map;
    let parentLocation = null; // Variabila pentru a stoca locatia parintelui
    const alertContainer = document.getElementById('alertContainer');

    //  Functie pentru calculul distantei (formula Haversine)
    function getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Raza Pamantului in metri
        const phi1 = lat1 * Math.PI / 180;
        const phi2 = lat2 * Math.PI / 180;
        const deltaPhi = (lat2 - lat1) * Math.PI / 180;
        const deltaLambda = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
                  Math.cos(phi1) * Math.cos(phi2) *
                  Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distanta in metri
    }

    // Functie pentru a verifica distantele si a afisa alertele
    function checkDistances(child, childLocation) {
        if (!parentLocation) return; // Daca nu avem locatia parintelui, nu facem nimic

        const distance = getDistance(
            parentLocation.latitude,
            parentLocation.longitude,
            childLocation.latitude,
            childLocation.longitude
        );

        // Generam un ID unic pentru alerta acestui copil
        const alertId = `alert-${child.id}`;
        const existingAlert = document.getElementById(alertId);

        if (distance > MAX_DISTANCE_METERS) {
            const distanceInKm = (distance / 1000).toFixed(2);
            const message = `Atenție! ${child.name} este la ${distanceInKm} km distanță (prea departe!).`;
            
            if (existingAlert) {
                // Actualizam mesajul daca alerta deja exista
                existingAlert.textContent = message;
            } else {
                // Cream un element nou pentru alerta
                const alertDiv = document.createElement('div');
                alertDiv.id = alertId;
                alertDiv.className = 'distance-alert';
                alertDiv.textContent = message;
                alertContainer.appendChild(alertDiv);
            }
        } else {
            // Daca copilul este in raza, stergem alerta daca exista
            if (existingAlert) {
                existingAlert.remove();
            }
        }
    }
    
    // Initializarea Hartii
    function initializeMap() {
        map = L.map('map').setView([45.9432, 24.9668], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
    }

    // Functie pentru a prelua si afisa locatiile copiilor
    async function fetchAndDisplayChildLocations() {
        try {
            const childrenResponse = await fetch('/Kim/api/children/get_by_parent.php', { credentials: 'include' });
            if (!childrenResponse.ok) return;

            const children = await childrenResponse.json();
            if (children.length === 0) return;

            for (const child of children) {
                const locationResponse = await fetch(`/Kim/api/locations/get_latest.php?child_id=${child.id}`);
                if (locationResponse.ok) {
                    const loc = await locationResponse.json();
                    const latLng = [parseFloat(loc.latitude), parseFloat(loc.longitude)];

                    if (childMarkers[child.id]) {
                        childMarkers[child.id].setLatLng(latLng);
                    } else {
                        childMarkers[child.id] = L.marker(latLng).addTo(map)
                            .bindPopup(`<b>${child.name}</b><br>Actualizat: ${new Date(loc.timestamp).toLocaleString()}`);
                    }
                    // Dupa ce avem locatia copilului verificam distanta
                    checkDistances(child, loc);
                }
            }
        } catch (error) {
            console.error("A aparut o eroare la actualizarea locatiei copiilor:", error);
        }
    }

    // Functie pentru a prelua si afisa locatia parintelui
    async function fetchAndDisplayParentLocation() {
        try {
            const response = await fetch('/Kim/api/locations/get_parent.php', { credentials: 'include' });
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    // Stocam locatia parintelui in variabila globala
                    parentLocation = { 
                        latitude: parseFloat(result.data.latitude), 
                        longitude: parseFloat(result.data.longitude) 
                    };

                    const greenIcon = new L.Icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
                    });

                    L.marker([parentLocation.latitude, parentLocation.longitude], { icon: greenIcon }).addTo(map)
                        .bindPopup(`<b>Locația ta (Părinte)</b>`).openPopup();
                    
                    map.setView([parentLocation.latitude, parentLocation.longitude], 13);
                }
            }
        } catch (error) {
            console.error('Eroare la preluarea locației părintelui:', error);
        }
    }

    // --- Rularea logicii ---
    async function run() {
        initializeMap();
        await fetchAndDisplayParentLocation(); // Asteptam sa avem locatia parintelui
        await fetchAndDisplayChildLocations(); // Apoi afisam copiii si verificam distantele

        // Setam intervalul pentru actualizari
        setInterval(fetchAndDisplayChildLocations, UPDATE_INTERVAL);
    }

    run();

    // --- Sectiuni si Butoane Navigare ---
    const monitorizareBtn = document.getElementById("monitorizareBtn");
    const updateLocationBtn = document.getElementById("updateLocationBtn");

    const monitoringContent = document.getElementById("monitoringContent");
    const updateLocationContent = document.getElementById("updateLocationContent");

    // Afiseaza sectiunea de monitorizare
    monitorizareBtn.addEventListener("click", (e) => {
        e.preventDefault();
        monitoringContent.style.display = "block";
        updateLocationContent.style.display = "none";
        monitorizareBtn.classList.add("active");
        updateLocationBtn.classList.remove("active");
    });

    // Afiseaza sectiunea de update locatie
    updateLocationBtn.addEventListener("click", (e) => {
        e.preventDefault();
        monitoringContent.style.display = "none";
        updateLocationContent.style.display = "block";
        updateLocationBtn.classList.add("active");
        monitorizareBtn.classList.remove("active");
    });

    // --- Formular Update Locatie Parinte ---
    const updateForm = document.getElementById("updateParentLocationForm");
    const latInput = document.getElementById("parentLatitude");
    const lonInput = document.getElementById("parentLongitude");
    const updateMsgBox = document.getElementById("updateMsg");
    
    updateForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const latitude = latInput.value.trim();
        const longitude = lonInput.value.trim();

        const res = await fetch("/Kim/api/locations/update_parent.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ latitude, longitude })
        });

        const data = await res.json();
        updateMsgBox.textContent = data.message || "Eroare.";
        updateMsgBox.style.color = data.success ? "#8EB69B" : "#ff5c5c";
    });

    // --- Logica de deconectare ---
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            await fetch("/Kim/api/users/auth.php", { method: "DELETE" });
            window.location.href = "/Kim/";
        });
    }

    // --- Formular Adaugare Copil ---
    const addForm = document.getElementById("addChildForm");
    const nameInput = document.getElementById("childName");
    const msgBox = document.getElementById("childMsg");

    addForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = nameInput.value.trim();

        const res = await fetch("/Kim/api/children/index.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ name })
        });

        const data = await res.json();
        msgBox.textContent = data.success ? "Copil adăugat!" : (data.message || "Eroare.");
        msgBox.style.color = data.success ? "#8EB69B" : "#ff5c5c";
        if (data.success) {
            nameInput.value = "";
        }
    });
});