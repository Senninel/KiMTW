<?php
require_once '../../includes/db.php';
require_once '../../includes/session.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Neautentificat']);
    exit;
}

// ✅ GET: toate locațiile unui copil
if ($method === 'GET') {
    $childId = $_GET['child_id'] ?? null;

    if (!$childId || !is_numeric($childId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID copil invalid']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM locations WHERE child_id = ? ORDER BY timestamp DESC");
    $stmt->execute([$childId]);
    $locations = $stmt->fetchAll();

    echo json_encode(['success' => true, 'locations' => $locations]);
    exit;
}

// ✅ POST: înregistrează o nouă locație
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $childId = $data['child_id'] ?? null;
    $lat = $data['latitude'] ?? null;
    $lon = $data['longitude'] ?? null;

    if (!$childId || !$lat || !$lon) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Date lipsă']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO locations (child_id, latitude, longitude) VALUES (?, ?, ?)");
    $stmt->execute([$childId, $lat, $lon]);

    echo json_encode(['success' => true, 'message' => 'Locație adăugată']);
    exit;
}

// ❌ Orice altă metodă
http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Metodă neacceptată']);
