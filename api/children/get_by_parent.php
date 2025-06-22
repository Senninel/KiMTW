<?php
// Kim/api/children/get_by_parent.php

require_once '../../includes/session.php';
require_once '../../includes/db.php';

header('Content-Type: application/json');

// Verificam daca utilizatorul este un parinte logat
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'parent') {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Acces interzis."]);
    exit;
}

$parent_id = $_SESSION['user_id'];

try {
    // --- INTEROGARE SQL SIMPLIFICATA SI CORECTATA ---
    // Aceasta varianta este mai rapida si mai compatibila.
    // Gaseste ID-ul maxim (cel mai recent) pentru fiecare copil si apoi
    // se alatura tabelei de locatii o singura data.
    $query = "
        SELECT 
            c.id AS child_id, 
            c.name AS child_name,
            l.latitude,
            l.longitude
        FROM 
            children c
        LEFT JOIN
            locations l ON l.id = (
                SELECT MAX(id) 
                FROM locations 
                WHERE child_id = c.id
            )
        WHERE 
            c.parent_id = :parent_id
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([':parent_id' => $parent_id]);
    $children = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Setam o locatie de start implicita pentru copiii care nu au inca nicio locatie
    foreach ($children as &$child) {
        if (is_null($child['latitude']) || is_null($child['longitude'])) {
            $child['latitude'] = 47.1585; // O locatie implicita (ex: Iasi)
            $child['longitude'] = 27.6014;
        }
    }

    http_response_code(200);
    echo json_encode(['success' => true, 'data' => $children]);

} catch (PDOException $e) {
    http_response_code(500);
    // Trimitem eroarea reala in log-ul serverului pentru a o putea depana
    error_log("EROARE BAZA DE DATE in get_by_parent.php: " . $e->getMessage());
    // Trimitem un mesaj generic catre client
    echo json_encode(['success' => false, 'message' => 'Eroare interna la server. Verificati log-urile.']);
}
?>