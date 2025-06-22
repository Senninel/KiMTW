<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../includes/db.php'; 

if (!isset($_GET['child_id'])) {
    http_response_code(400);
    echo json_encode(['message' => 'ID-ul copilului este obligatoriu.']);
    exit();
}
$child_id = filter_var($_GET['child_id'], FILTER_SANITIZE_NUMBER_INT);

try {
    $query = "SELECT latitude, longitude, timestamp FROM locations WHERE child_id = :child_id ORDER BY timestamp DESC LIMIT 1";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':child_id', $child_id);
    $stmt->execute();
    $location = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($location) {
        echo json_encode($location);
    } else {
        http_response_code(404);
        echo json_encode(['message' => 'Nicio locatie gasita.']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Eroare DB.']);
}
?>