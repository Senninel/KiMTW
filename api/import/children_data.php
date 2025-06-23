<?php
require_once '../../includes/db.php';
require_once '../../includes/session.php';

header('Content-Type: application/json');

// Verificam daca utilizatorul este admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acces interzis. Doar pentru administratori.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Metoda nepermisă.']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data) || !is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Date invalide sau goale.']);
    exit;
}

$pdo->beginTransaction();

try {
    $stmt = $pdo->prepare("INSERT INTO children (name, parent_id) VALUES (:name, :parent_id)");
    
    $importedCount = 0;
    foreach ($data as $child) {
        // Validare de baza
        if (isset($child['child_name']) && isset($child['parent_id'])) {
            $name = trim($child['child_name']);
            $parent_id = filter_var($child['parent_id'], FILTER_VALIDATE_INT);

            if ($name && $parent_id) {
                // Opțional: verificare dacă parent_id există în tabela users
                $checkParentStmt = $pdo->prepare("SELECT id FROM users WHERE id = ? AND role = 'parent'");
                $checkParentStmt->execute([$parent_id]);

                if ($checkParentStmt->fetch()) {
                    $stmt->execute(['name' => $name, 'parent_id' => $parent_id]);
                    $importedCount++;
                }
            }
        }
    }

    $pdo->commit();
    
    if ($importedCount > 0) {
        echo json_encode(['success' => true, 'message' => "$importedCount copii au fost importați cu succes!"]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Niciun copil nu a fost importat. Verificați formatul fișierului.']);
    }

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Eroare la baza de date: ' . $e->getMessage()]);
}
?>