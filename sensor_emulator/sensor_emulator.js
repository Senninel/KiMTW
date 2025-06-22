const http = require('http'); 


const API_HOST = 'localhost';
const API_PATH = '/kim/api/locations/add.php'; // Adresa unde trimitem datele
const API_PORT = 80; 
const UPDATE_INTERVAL = 10000; // Trimite un update la fiecare 10 secunde


// Preluam ID-ul copilului din linia de comanda la rulare
const childId = process.argv[2];

if (!childId) {
    console.error('Eroare: Trebuie sa specifici un ID de copil!');
    console.log('Exemplu de rulare: node sensor_emulator.js 1');
    process.exit(1);
}

// Locatia de start
let currentLocation = {
    latitude: 47.1585,
    longitude: 27.6014
};

console.log(`[Sensor] Pornit pentru copilul cu ID: ${childId}`);
console.log('--------------------------------------------------');

// Functia care efectiv trimite datele catre server
function sendLocationUpdate() {
    // "Mutam" locatia cu o valoare mica, aleatorie
    currentLocation.latitude += (Math.random() - 0.5) * 0.0005;
    currentLocation.longitude += (Math.random() - 0.5) * 0.0005;

    //  Pregatim datele in format JSON
    const data = JSON.stringify({
        child_id: childId,
        latitude: currentLocation.latitude.toFixed(6),
        longitude: currentLocation.longitude.toFixed(6)
    });

    //  Configuram cererea HTTP POST
    const options = {
        hostname: API_HOST,
        port: API_PORT,
        path: API_PATH,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    // Trimitem cererea
    const req = http.request(options, (res) => {
        res.on('data', (d) => {
            console.log(`[${new Date().toLocaleTimeString()}] Locatie trimisa. Raspuns server: ${d}`);
        });
    });

    req.on('error', (error) => {
        console.error(`[Eroare] Nu s-a putut conecta la API: ${error.message}`);
    });

    req.write(data);
    req.end();
}

// Pornim ciclul
setInterval(sendLocationUpdate, UPDATE_INTERVAL);