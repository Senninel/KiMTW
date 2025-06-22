<?php
require_once '../../includes/db.php';
require_once '../../includes/session.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acces interzis. Trebuie sa fiti autentificat.']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$role = $_SESSION['role'];
$user_id = $_SESSION['user_id'];
$data = json_decode(file_get_contents("php://input"), true);

switch ($method) {
    case 'POST': // ADAUGARE
        $name = trim($data['name'] ?? '');

        if (empty($name)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Numele copilului este obligatoriu.']);
            exit;
        }

        $parent_id = 0;

        // Daca un parinte adauga un copil, ID-ul parintelui este cel din sesiune
        if ($role === 'parent') {
            $parent_id = $user_id;
        } 
        // Daca un admin adauga un copil, trebuie sa specifice ID-ul parintelui
        elseif ($role === 'admin') {
            $parent_id = intval($data['parent_id'] ?? 0);
            if (empty($parent_id)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID-ul părintelui este obligatoriu pentru admin.']);
                exit;
            }
        }

        try {
            // Verificam daca parintele exista (indiferent de rol)
            $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ? AND role = 'parent'");
            $stmt->execute([$parent_id]);
            if ($stmt->rowCount() == 0) {
                 http_response_code(404);
                 echo json_encode(['success' => false, 'message' => 'ID-ul părintelui nu există sau nu are rolul de părinte.']);
                 exit;
            }

            $stmt = $pdo->prepare("INSERT INTO children (name, parent_id) VALUES (?, ?)");
            $stmt->execute([$name, $parent_id]);
            echo json_encode(['success' => true, 'message' => 'Copil adăugat cu succes.']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Eroare la baza de date.']);
        }
        break;

    case 'GET': // LISTARE (Doar Admin)
    case 'PUT': // ACTUALIZARE (Doar Admin)
    case 'DELETE': // STERGERE (Doar Admin)
        if ($role !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Acces interzis. Doar pentru administratori.']);
            exit;
        }

        if ($method === 'GET') {
            $stmt = $pdo->query(
               "SELECT c.id, c.name, c.parent_id, u.username as parent_username 
                FROM children c 
                JOIN users u ON c.parent_id = u.id 
                ORDER BY c.id DESC"
            );
            echo json_encode($stmt->fetchAll());
        }
        elseif ($method === 'PUT') {
            $id = intval($data['id'] ?? 0);
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID-ul copilului este obligatoriu.']);
                exit;
            }
    
            $fields = [];
            if (isset($data['name']) && !empty(trim($data['name']))) {
                $fields['name'] = trim($data['name']);
            }
            if (isset($data['parent_id']) && !empty(intval($data['parent_id']))) {
                $parent_id = intval($data['parent_id']);
                $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ? AND role = 'parent'");
                $stmt->execute([$parent_id]);
                if ($stmt->rowCount() == 0) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'ID-ul nou al părintelui nu există sau nu este valid.']);
                    exit;
                }
                $fields['parent_id'] = $parent_id;
            }
    
            if (empty($fields)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Niciun câmp valid pentru actualizare.']);
                exit;
            }
            
            $query_parts = [];
            foreach (array_keys($fields) as $field) {
                $query_parts[] = "$field = :$field";
            }
            $query = "UPDATE children SET " . implode(', ', $query_parts) . " WHERE id = :id";
            $fields['id'] = $id;
            
            try {
                $stmt = $pdo->prepare($query);
                $stmt->execute($fields);
                if ($stmt->rowCount() > 0) {
                     echo json_encode(['success' => true, 'message' => 'Datele copilului au fost actualizate.']);
                } else {
                     echo json_encode(['success' => false, 'message' => 'Copilul nu a fost găsit sau datele sunt identice.']);
                }
            } catch (PDOException $e) {
                 http_response_code(500);
                 echo json_encode(['success' => false, 'message' => 'Eroare la baza de date.']);
            }
        }
        elseif ($method === 'DELETE') {
            $id = intval($data['id'] ?? 0);
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID-ul copilului este obligatoriu.']);
                exit;
            }
            
            try {
                $stmt = $pdo->prepare("DELETE FROM children WHERE id = ?");
                $stmt->execute([$id]);
                if ($stmt->rowCount() > 0) {
                    echo json_encode(['success' => true, 'message' => 'Copilul a fost șters cu succes.']);
                } else {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Copilul cu acest ID nu a fost găsit.']);
                }
            } catch (PDOException $e) {
                 http_response_code(500);
                 echo json_encode(['success' => false, 'message' => 'Eroare la baza de date.']);
            }
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Metodă nepermisă.']);
        break;
}
?>