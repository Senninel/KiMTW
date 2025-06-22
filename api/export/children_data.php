<?php
require_once '../../includes/db.php';
require_once '../../includes/session.php';
header('Content-Type: application/json');

//  Verificam daca utilizatorul este admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acces interzis. Doar pentru administratori.']);
    exit;
}

// 2. Query SQL pentru a extrage datele complete
// - Folosim un LEFT JOIN pentru a include si copiii care nu au inca locatii inregistrate.
// - Folosim o sub-interogare pentru a gasi cel mai recent ID de locatie pentru fiecare copil.
$query = "
    SELECT 
        c.id AS child_id, 
        c.name AS child_name, 
        u.username AS parent_username,
        c.parent_id,
        l.latitude,
        l.longitude,
        l.timestamp
    FROM 
        children c
    JOIN 
        users u ON c.parent_id = u.id
    LEFT JOIN
        locations l ON l.id = (
            SELECT MAX(id) 
            FROM locations 
            WHERE child_id = c.id
        )
    ORDER BY 
        c.id;
";

try {
    $stmt = $pdo->query($query);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($results);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Eroare la baza de date: ' . $e->getMessage()]);
}
?>