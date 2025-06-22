<?php
require_once '../../includes/db.php';
require_once '../../includes/session.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['message' => 'Acces interzis']);
    exit;
}

$stmt = $pdo->query("SELECT id, name, parent_id FROM children ORDER BY id DESC");
echo json_encode($stmt->fetchAll());
