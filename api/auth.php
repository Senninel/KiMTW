<?php
require_once '../includes/db.php';
require_once '../includes/session.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $username = trim($data['username'] ?? '');
    $password = trim($data['password'] ?? '');

    if (!$username || !$password) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Username si parola necesare']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];

        echo json_encode(['success' => true, 'role' => $user['role']]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Credentiale invalide']);
    }

}elseif ($method === 'DELETE') {

    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Logout reușit']);

} elseif ($method === 'GET') {

    if (isset($_SESSION['user_id'])) {
        echo json_encode([
            'logged_in' => true,
            'username' => $_SESSION['username'],
            'role' => $_SESSION['role']
        ]);
    } else {
        echo json_encode(['logged_in' => false]);
    }

} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Metoda invalidă']);
}
