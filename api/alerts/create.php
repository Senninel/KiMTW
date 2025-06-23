<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

require_once '../../includes/session.php';
require_once '../../includes/db.php'; 

if (!isset($pdo)) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Eroare : Conexiunea PDO la baza de date nu a putut fi stabilita."]);
    exit();
}

// Sa fie parinte
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'parent') {
    http_response_code(403); // Forbidden
    echo json_encode(["success" => false, "message" => "Acces neautorizat."]);
    exit();
}

// Preluam datele JSON trimise de la client
$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->child_id) || !isset($data->type) || !isset($data->description)) {
    http_response_code(400); // Bad Request
    echo json_encode(["success" => false, "message" => "Date incomplete. Sunt necesare: child_id, type, description."]);
    exit();
}

try {
    $child_id = filter_var($data->child_id, FILTER_SANITIZE_NUMBER_INT);
    $type = htmlspecialchars(strip_tags($data->type));
    $message_text = htmlspecialchars(strip_tags($data->description));

    $sql = "INSERT INTO alerts (child_id, type, message) VALUES (:child_id, :type, :message)";
    
    $stmt = $pdo->prepare($sql);

    // prevenire SQL injection
    $stmt->bindParam(':child_id', $child_id, PDO::PARAM_INT);
    $stmt->bindParam(':type', $type, PDO::PARAM_STR);
    // Legăm variabila $message_text la placeholder-ul :message
    $stmt->bindParam(':message', $message_text, PDO::PARAM_STR);

    // Executam interogarea 
    if ($stmt->execute()) {
        http_response_code(201); // Created
        echo json_encode(["success" => true, "message" => "Alerta creata cu succes."]);
    } else {
        http_response_code(500); // Internal Server Error
        echo json_encode(["success" => false, "message" => "Eroare: Alerta nu a putut fi salvată în baza de date."]);
    }

} catch (PDOException $e) {
    // Prindem orice exceptie PDO (ex: eroare de sintaxa SQL, constrangere esuata)
    http_response_code(500);
    // Trimitem un mesaj de eroare generic catre client, dar logam eroarea reala pe server
    error_log("Eroare PDO în create.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Eroare la comunicarea cu baza de date.']);
}

?>
