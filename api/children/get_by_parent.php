<?php
require_once '../../includes/session.php';
require_once '../../includes/db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed"]);
    exit;
}

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'parent') {
    http_response_code(403);
    echo json_encode(["message" => "Acces interzis"]);
    exit;
}

$parent_id = $_SESSION['user_id'];

$stmt = $pdo->prepare("SELECT id, name FROM children WHERE parent_id = ?");
$stmt->execute([$parent_id]);
$children = $stmt->fetchAll();

echo json_encode($children);
?>