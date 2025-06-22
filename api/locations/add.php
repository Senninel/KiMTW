<?php


header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

require_once __DIR__ . '/../../includes/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Metoda nepermisa.']);
    exit();
}

$json_data = file_get_contents("php://input");
$data = json_decode($json_data);

if (!$data || !isset($data->child_id) || !isset($data->latitude) || !isset($data->longitude)) {
    http_response_code(400);
    echo json_encode(['message' => 'Date incomplete sau format JSON invalid.']);
    exit();
}

$child_id = filter_var($data->child_id, FILTER_SANITIZE_NUMBER_INT);
$latitude = htmlspecialchars($data->latitude);
$longitude = htmlspecialchars($data->longitude);

try {
    $query = "INSERT INTO locations (child_id, latitude, longitude) VALUES (:child_id, :latitude, :longitude)";

    $stmt = $pdo->prepare($query);

    $stmt->bindParam(':child_id', $child_id);
    $stmt->bindParam(':latitude', $latitude);
    $stmt->bindParam(':longitude', $longitude);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(['message' => 'Locatie adaugata cu succes.']);
    } else {
        http_response_code(503);
        echo json_encode(['message' => 'Eroare interna: Nu s-a putut adauga locatia.']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Eroare la baza de date: ' . $e->getMessage()]);
}
?>