<?php
require_once '../../includes/session.php';
require_once '../../includes/db.php';
header('Content-Type: application/json');

//  Verificam metoda si rolul utilizatorului
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'parent') {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Acces interzis. Doar pentru parinti."]);
    exit;
}

//  Preluam si validam datele primite
$data = json_decode(file_get_contents("php://input"), true);
$latitude = $data['latitude'] ?? null;
$longitude = $data['longitude'] ?? null;

if (!is_numeric($latitude) || !is_numeric($longitude)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Latitudine si longitudine invalide.']);
    exit;
}

$parent_id = $_SESSION['user_id'];

//  Folosim "INSERT ... ON DUPLICATE KEY UPDATE" pentru a crea sau actualiza locatia
$query = "
    INSERT INTO parent_locations (parent_id, latitude, longitude) 
    VALUES (:parent_id, :latitude, :longitude) 
    ON DUPLICATE KEY UPDATE latitude = :latitude, longitude = :longitude
";

try {
    $stmt = $pdo->prepare($query);
    $stmt->execute([
        ':parent_id' => $parent_id,
        ':latitude' => $latitude,
        ':longitude' => $longitude
    ]);

    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Locația a fost actualizată cu succes!']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Eroare la comunicarea cu baza de date: ' . $e->getMessage()]);
}
?>