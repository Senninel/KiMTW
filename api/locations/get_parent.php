<?php
require_once '../../includes/session.php';
require_once '../../includes/db.php';
header('Content-Type: application/json');

// Verificam daca utilizatorul este parinte si este logat
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'parent') {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Acces interzis."]);
    exit;
}

$parent_id = $_SESSION['user_id'];

try {
    // Preluam ultima locatie a parintelui din baza de date
    $stmt = $pdo->prepare("SELECT latitude, longitude FROM parent_locations WHERE parent_id = :parent_id");
    $stmt->execute([':parent_id' => $parent_id]);
    $location = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($location) {
        // Trimitem locatia daca a fost gasita
        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $location]);
    } else {
        // Mesaj de eroare daca nu exista nicio locatie salvata
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Nicio locație salvată pentru acest părinte.']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Eroare la baza de date: ' . $e->getMessage()]);
}
?>