<?php

/**
 * Crée un compte administrateur en ligne de commande.
 *
 * Usage :
 *   php scripts/create-admin.php
 *
 * Le script demande le nom, prénom, email et mot de passe de façon
 * interactive, puis insère le compte avec un mot de passe correctement
 * haché (jamais en clair dans la base ni dans le code source).
 */

declare(strict_types=1);

require_once __DIR__ . '/../utils/Env.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Admin.php';

Env::load(__DIR__ . '/../.env');
function prompt(string $label): string
{
    echo $label;
    return trim(fgets(STDIN));
}

echo "=== Création d'un compte administrateur ===\n\n";

$nom = prompt('Nom : ');
$prenom = prompt('Prénom : ');
$email = prompt('Email : ');
$password = prompt('Mot de passe (8 caractères minimum) : ');

if ($nom === '' || $prenom === '' || $email === '') {
    fwrite(STDERR, "Erreur : nom, prénom et email sont obligatoires.\n");
    exit(1);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "Erreur : l'email n'est pas valide.\n");
    exit(1);
}

if (strlen($password) < 8) {
    fwrite(STDERR, "Erreur : le mot de passe doit faire au moins 8 caractères.\n");
    exit(1);
}

$database = new Database();
$db = $database->connect();

$adminModel = new Admin($db);

if ($adminModel->findByEmail($email) !== null) {
    fwrite(STDERR, "Erreur : un compte existe déjà avec cet email.\n");
    exit(1);
}

$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

$id = $adminModel->create($nom, $prenom, $email, $hashedPassword);

echo "\nCompte administrateur créé avec succès (id #{$id}).\n";
echo "Tu peux maintenant te connecter sur /admin/connexion avec cet email et ce mot de passe.\n";
