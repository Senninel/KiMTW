
const runningSimulations = {};

// Functia care porneste simularea pentru un set de copii
async function startSimulation() {
    stopSimulation(); // Oprim orice simulare anterioara pentru a evita duplicatele

    try {
        // Apelam scriptul care ne returneaza copiii si ultima lor locatie
        const response = await fetch('/Kim/api/children/get_by_parent.php', { credentials: 'include' });
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            console.log("Pornire simulare pentru copiii:", result.data);

            result.data.forEach(child => {
                let currentLocation = {
                    latitude: parseFloat(child.latitude),
                    longitude: parseFloat(child.longitude)
                };

                // Salvam ID-ul intervalului pentru a-l putea opri mai tarziu
                runningSimulations[child.child_id] = setInterval(() => {
                    // "Misca" locatia cu o valoare mica, aleatorie
                    currentLocation.latitude += (Math.random() - 0.5) * 0.0005;
                    currentLocation.longitude += (Math.random() - 0.5) * 0.0005;

                    const data = {
                        child_id: child.child_id,
                        latitude: currentLocation.latitude.toFixed(6),
                        longitude: currentLocation.longitude.toFixed(6)
                    };

                    // Trimitem noua locatie catre server prin API-ul de adaugare
                    fetch('/Kim/api/locations/add.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    })
                    .then(res => res.json())
                    .then(resData => console.log(`[Simulare Copil #${child.child_id}] Locatie trimisa. Raspuns:`, resData.message))
                    .catch(err => console.error("Eroare la trimiterea locatiei:", err));

                }, 10000); // Trimitem un update la fiecare 10 secunde
            });

            alert("Simularea a inceput pentru toti copiii!");

        } else if (result.data.length === 0) {
            alert("Nu aveti niciun copil inregistrat pentru a porni simularea.");
        } else {
            alert("Eroare la pornirea simularii: " + result.message);
        }
    } catch (error) {
        console.error("Eroare majora la pornirea simularii:", error);
        alert("A aparut o eroare tehnica. Va rugam sa incercati din nou.");
    }
}

function stopSimulation() {
    let count = 0;
    for (const childId in runningSimulations) {
        clearInterval(runningSimulations[childId]);
        delete runningSimulations[childId];
        count++;
    }
    if (count > 0) {
        console.log(`Au fost oprite ${count} simulari.`);
        alert("Simularea a fost oprita.");
    }
}