<?php
require_once '../../includes/db.php';
require_once '../../includes/session.php';

header('Content-Type: application/json');

// 1. Verificam daca utilizatorul este admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acces interzis. Doar pentru administratori.']);
    exit;
}

// 2. Verificam metoda HTTP
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Metoda nepermisă.']);
    exit;
}

// 3. Preluam si decodam datele
$data = json_decode(file_get_contents("php://input"), true);

if (empty($data) || !is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Date invalide sau goale. Te rog, încarcă un fișier CSV sau JSON valid.']);
    exit;
}

$pdo->beginTransaction();

try {
    $insertStmt = $pdo->prepare("INSERT INTO children (name, parent_id) VALUES (:name, :parent_id)");
    // Pregatim statement-ul pentru verificarea parintelui
    $checkParentStmt = $pdo->prepare("SELECT id FROM users WHERE id = ? AND role = 'parent'");

    $importedCount = 0;
    $skippedCount = 0;

    foreach ($data as $child) {
        // Validam campurile esentiale din fiecare rand/obiect
        if (isset($child['child_name']) && isset($child['parent_id'])) {
            $name = trim($child['child_name']);
            $parent_id = filter_var($child['parent_id'], FILTER_VALIDATE_INT);

            if ($name && $parent_id) {
                // Verificam daca parent_id exista si are rolul corect
                $checkParentStmt->execute([$parent_id]);
                if ($checkParentStmt->fetch()) {
                    // Parintele exista, inseram copilul
                    $insertStmt->execute(['name' => $name, 'parent_id' => $parent_id]);
                    $importedCount++;
                } else {
                    // Parintele nu exista, contorizam ca omis
                    $skippedCount++;
                }
            } else {
                $skippedCount++;
            }
        } else {
            $skippedCount++;
        }
    }

    $pdo->commit();
    
    if ($importedCount > 0) {
        $message = "$importedCount copii au fost importați cu succes!";
        if ($skippedCount > 0) {
            $message .= " $skippedCount înregistrări au fost omise din cauza datelor invalide sau a ID-ului de părinte inexistent.";
        }
        echo json_encode(['success' => true, 'message' => $message]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Niciun copil nu a fost importat. Verifică formatul fișierului și corectitudinea datelor.']);
    }

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    error_log('Eroare import: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'A apărut o eroare internă la server.']);
}
?>