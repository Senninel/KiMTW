<?php
session_start();


if (!isset($_GET['page'])) {
    if (isset($_SESSION['user_id']) && isset($_SESSION['role'])) {
        if ($_SESSION['role'] === 'admin') {
            // Redirectioneaza catre pagina de admin
            header('Location: index.php?page=admin');
            exit;
        } elseif ($_SESSION['role'] === 'parent') {
            // Redirectioneaza catre pagina de parinte
            header('Location: index.php?page=parent');
            exit;
        }
    }
}


// Stabileste ce pagina sa fie afisata.
$page = $_GET['page'] ?? 'login';

// Directioneaza cererea catre vizualizarea corecta (fisierul .html corespunzator).
switch ($page) {
    case 'admin':
        // Verificare de securitate: Doar un admin autentificat poate accesa aceasta pagina.
        if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
            http_response_code(403); // Eroare 'Forbidden'
            echo "Acces interzis. Trebuie sa fiti autentificat ca administrator.";
            exit;
        }
        require __DIR__ . '/views/admin/dashboard.html';
        break;

    case 'parent':
        // Verificare de securitate: Doar un parinte autentificat poate accesa.
        if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'parent') {
            http_response_code(403); // Eroare 'Forbidden'
            echo "Acces interzis. Trebuie sa fiti autentificat ca parinte.";
            exit;
        }
        require __DIR__ . '/views/parent/map.html';
        break;

    case 'login':
        // Pagina de login/inregistrare
        require __DIR__ . '/views/auth/index.html';
        break;

    default:
        // Daca valoarea parametrului 'page' nu corespunde niciunei pagini
        http_response_code(404);
        echo "Eroare 404: Pagina nu a fost gasita.";
        break;
}