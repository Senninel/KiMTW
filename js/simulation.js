let movementIntervals = [];
let accidentIntervals = [];

const accidentTypes = [
    "fall_detected",
    "possible_collision",
    "unusual_stop",
    "rapid_acceleration"
];

async function startSimulation() {
    stopSimulation(false);
    console.log("Se initiaza simularea de miscare si accidente...");

    try {
        const response = await fetch('/Kim/api/children/get_by_parent.php', { credentials: 'include' });
        const result = await response.json();

        if (!result.success || !result.data) {
            alert("Eroare la preluarea datelor pentru simulare: " + (result.message || "Raspuns invalid de la server."));
            return;
        }

        if (result.data.length === 0) {
            alert("Nu aveti niciun copil inregistrat pentru a porni simularea.");
            return;
        }

        const children = result.data;
        console.log(`Pornire simulare pentru ${children.length} copii...`);

        children.forEach(child => {
            let lat, lon;

            if (child.latitude && child.longitude && !isNaN(parseFloat(child.latitude))) {
                lat = parseFloat(child.latitude);
                lon = parseFloat(child.longitude);
                console.log(`Copilul #${child.child_id} porneste de la locatia salvata: ${lat}, ${lon}`);
            } else {
                lat = 47.1585 + (Math.random() - 0.5) * 0.02;
                lon = 27.6014 + (Math.random() - 0.5) * 0.02;
                console.warn(`Copilul #${child.child_id} nu are o locatie validă. Se foloseste locatia implicita: ${lat}, ${lon}`);
            }

            // Interval pentru simularea miscarii
            const moveInterval = setInterval(() => {
                lat += (Math.random() - 0.5) * 0.001;
                lon += (Math.random() - 0.5) * 0.001;

                fetch("/Kim/api/locations/add.php", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ child_id: child.child_id, latitude: lat.toFixed(6), longitude: lon.toFixed(6) })
                }).catch(err => console.error(`[Miscare] Eroare la trimiterea locatiei pentru copilul #${child.child_id}:`, err));

            }, 10000); // la 10 secunde

            // Interval pentru simularea accidentelor
            const accidentInterval = setInterval(() => {
                if (Math.random() < 0.2) {
                    const accidentType = accidentTypes[Math.floor(Math.random() * accidentTypes.length)];
                    

                    fetch("/Kim/api/alerts/create.php", {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            child_id: child.child_id,
                            type: accidentType,
                            description: `Accident simulat de tip ${accidentType} la locatia (${lat.toFixed(6)}, ${lon.toFixed(6)})`
                        })
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            console.log(`%c[Accident] Alerta de tip '${accidentType}' trimisa cu succes pentru copilul #${child.child_id}`, "color: green;");
                        } else {
                            console.warn(`[Accident] Esec la generarea alertei pentru copilul #${child.child_id}:`, data.message || 'Serverul nu a returnat un mesaj de eroare specific.');
                        }
                    })
                    .catch(err => console.error(`[Accident] Eroare importanta la crearea alertei pentru copilul #${child.child_id}:`, err));
                }
            }, 5000);

            movementIntervals.push(moveInterval);
            accidentIntervals.push(accidentInterval);
        });

        alert(`Simularea a inceput pentru ${children.length} copil/copii.`);

    } catch (error) {
        console.error("Eroare majora in funcția startSimulation:", error);
        alert("A aparut o eroare tehnica la pornirea simularii. Verificati consola.");
    }
}

function stopSimulation(showAlert = true) {
    const movementCount = movementIntervals.length;
    const accidentCount = accidentIntervals.length;

    movementIntervals.forEach(clearInterval);
    accidentIntervals.forEach(clearInterval);

    movementIntervals = [];
    accidentIntervals = [];

    if (movementCount > 0 && showAlert) {
        console.log(`Au fost oprite ${movementCount} simulari de miscare si ${accidentCount} simulari de accidente.`);
        alert("Simularea a fost oprita.");
    }
}
