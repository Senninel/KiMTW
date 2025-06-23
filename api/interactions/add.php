function saveInteraction($child1, $child2, $distance, $conn) {
    // Verificăm dacă interacțiunea nu a fost deja salvată recent (în ultimele X minute)
    $stmt = $conn->prepare("SELECT * FROM interactions WHERE 
        ((child_id_1 = ? AND child_id_2 = ?) OR (child_id_1 = ? AND child_id_2 = ?))
        AND interacted_at > NOW() - INTERVAL 5 MINUTE");
    $stmt->execute([$child1, $child2, $child2, $child1]);

    if ($stmt->rowCount() === 0) {
        $insert = $conn->prepare("INSERT INTO interactions (child_id_1, child_id_2, distance) VALUES (?, ?, ?)");
        $insert->execute([$child1, $child2, $distance]);
    }
}
