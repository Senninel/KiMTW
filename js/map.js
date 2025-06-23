// Kim/js/map.js

document.addEventListener('DOMContentLoaded', () => {
    // Verificam daca suntem pe pagina cu harta
    if (!document.getElementById('map')) {
        return;
    }

    const MAX_DISTANCE_METERS = 100; // Distanta maxima admisa in metri
    const UPDATE_INTERVAL = 500;   // Actualizam locatia copiilor la fiecare 0.5 secunde

    const childMarkers = {}; // Obiect pentru a stoca markerele copiilor
    let map;
    let parentLocation = null; // Variabila pentru a stoca locatia parintelui
    const alertContainer = document.getElementById('alertContainer');

    // Functie pentru calculul distantei (formula Haversine)
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
    function checkDistances(child) {
        // Verificam daca avem datele necesare
        if (!parentLocation || !child.latitude || !child.longitude) return;

        const distance = getDistance(
            parentLocation.latitude,
            parentLocation.longitude,
            child.latitude,
            child.longitude
        );

        const alertId = `alert-${child.child_id}`;
        const existingAlert = document.getElementById(alertId);

        if (distance > MAX_DISTANCE_METERS) {
            const distanceInKm = (distance / 1000).toFixed(2);
            const message = `Atentie! ${child.child_name} este la ${distanceInKm} km distanta (prea departe!).`;
            
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
        map = L.map('map').setView([45.9432, 24.9668], 7); // Centrat pe Romania
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
    }

    // *** FUNCTIE NOUA, OPTIMIZATA ***
    // Preia copiii si ultima lor locatie dintr-un singur apel API
    async function updateChildMarkers() {
        try {
            const response = await fetch('/Kim/api/children/get_by_parent.php', { credentials: 'include' });
            if (!response.ok) {
                console.error("Eroare la preluarea datelor despre copii.");
                return;
            }

            const result = await response.json();
            
            if (result.success && result.data) {
                result.data.forEach(child => {
                    // Verificam daca avem coordonate valide
                    if (child.latitude && child.longitude) {
                        const latLng = [parseFloat(child.latitude), parseFloat(child.longitude)];
                        
                        // Actualizam pozitia markerului daca exista deja
                        if (childMarkers[child.child_id]) {
                            childMarkers[child.child_id].setLatLng(latLng);
                        } else {
                            // Sau cream un marker nou daca nu exista
                            childMarkers[child.child_id] = L.marker(latLng).addTo(map)
                                .bindPopup(`<b>${child.child_name}</b>`);
                        }
                        
                        // Dupa ce avem locatia copilului, verificam distanta fata de parinte
                        checkDistances(child);
                    }
                });
		checkChildInteractions(result.data);
            }
        } catch (error) {
            console.error("A aparut o eroare la actualizarea locatiei copiilor:", error);
        }
    }

	
function checkChildInteractions(children) {
    for (let i = 0; i < children.length; i++) {
        for (let j = i + 1; j < children.length; j++) {
            const child1 = children[i];
            const child2 = children[j];

            if (!child1.latitude || !child1.longitude || !child2.latitude || !child2.longitude) continue;

            const distance = getDistance(
                parseFloat(child1.latitude),
                parseFloat(child1.longitude),
                parseFloat(child2.latitude),
                parseFloat(child2.longitude)
            );

            if (distance < 100) {
                showInteractionNotification(child1, child2, distance);

                // Trimite la server pentru salvare în DB
                fetch("/Kim/api/interactions/add.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        child_id_1: child1.child_id,
                        child_id_2: child2.child_id,
                        distance: distance.toFixed(2)
                    })
                });
            }
        }
    }
}

function showInteractionNotification(child1, child2, distance) {
    const alertId = `interaction-${child1.child_id}-${child2.child_id}`;
    if (!document.getElementById(alertId)) {
        const alertDiv = document.createElement("div");
        alertDiv.id = alertId;
        alertDiv.className = "interaction-alert";
        alertDiv.textContent = `Interacțiune: ${child1.child_name} și ${child2.child_name} sunt la ${distance.toFixed(1)}m unul de altul.`;
        document.getElementById("alertContainer").appendChild(alertDiv);

        // Dispare după 30 secunde
        setTimeout(() => alertDiv.remove(), 30000);
    }
}

    // Functie pentru a prelua si afisa locatia parintelui
    async function fetchAndDisplayParentLocation() {
        try {
            const response = await fetch('/Kim/api/locations/get_parent.php', { credentials: 'include' });
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
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
                        .bindPopup(`<b>Locatia ta (Parinte)</b>`).openPopup();
                    
                    map.setView([parentLocation.latitude, parentLocation.longitude], 13);
                }
            }
        } catch (error) {
            console.error('Eroare la preluarea locatiei parintelui:', error);
        }
    }

    // --- Rularea logicii ---
    async function run() {
        initializeMap();
        await fetchAndDisplayParentLocation(); // Asteptam sa avem locatia parintelui
        await updateChildMarkers(); // Apoi afisam copiii si verificam distantele

        // Setam intervalul pentru actualizarea periodica a hartii
        setInterval(updateChildMarkers, UPDATE_INTERVAL);
    }

    run();

    // --- Sectiuni si Butoane Navigare ---
    // (codul tau existent, neschimbat)
    const monitorizareBtn = document.getElementById("monitorizareBtn");
    const updateLocationBtn = document.getElementById("updateLocationBtn");
    const monitoringContent = document.getElementById("monitoringContent");
    const updateLocationContent = document.getElementById("updateLocationContent");

    monitorizareBtn.addEventListener("click", (e) => {
        e.preventDefault();
        monitoringContent.style.display = "block";
        updateLocationContent.style.display = "none";
        monitorizareBtn.classList.add("active");
        updateLocationBtn.classList.remove("active");
    });

    updateLocationBtn.addEventListener("click", (e) => {
        e.preventDefault();
        monitoringContent.style.display = "none";
        updateLocationContent.style.display = "block";
        updateLocationBtn.classList.add("active");
        monitorizareBtn.classList.remove("active");
    });
    
    // --- ADAUGARE NOUA: Butoane pentru Simulare ---
    const startSimBtn = document.getElementById("startSimBtn");
    const stopSimBtn = document.getElementById("stopSimBtn");

    if (startSimBtn) {
        startSimBtn.addEventListener("click", (e) => {
            e.preventDefault(); // Prevenim comportamentul default al link-ului
            // Apelam functia globala definita in simulation.js
            startSimulation(); 
        });
    }

    if (stopSimBtn) {
        stopSimBtn.addEventListener("click", (e) => {
            e.preventDefault(); // Prevenim comportamentul default al link-ului
            // Apelam functia globala definita in simulation.js
            stopSimulation();
        });
    }

    // --- Formular Update Locatie Parinte ---
    // (codul tau existent, neschimbat)
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
    // (codul tau existent, neschimbat)
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            await fetch("/Kim/api/users/auth.php", { method: "DELETE" });
            window.location.href = "/Kim/";
        });
    }

    // --- Formular Adaugare Copil ---
    // (codul tau existent, neschimbat)
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
        msgBox.textContent = data.success ? "Copil adaugat!" : (data.message || "Eroare.");
        msgBox.style.color = data.success ? "#8EB69B" : "#ff5c5c";
        if (data.success) {
            nameInput.value = "";
            updateChildMarkers(); // Actualizam imediat harta cu noul copil
        }
    });
});