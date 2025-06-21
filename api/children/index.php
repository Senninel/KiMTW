<?php
require_once '../../includes/db.php';
require_once '../../includes/session.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Neautorizat']);
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $name = trim($data['name'] ?? '');

    if (!$name) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Numele este necesar']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO children (name, parent_id) VALUES (?, ?)");
    $stmt->execute([$name, $_SESSION['user_id']]);

    echo json_encode(['success' => true]);

} elseif ($method === 'GET') {
    $stmt = $pdo->prepare("SELECT id, name FROM children WHERE parent_id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    echo json_encode($stmt->fetchAll());
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Metodă invalidă']);
}
