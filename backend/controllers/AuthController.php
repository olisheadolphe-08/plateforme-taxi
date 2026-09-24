<?php

class AuthController
{
    private Admin $adminModel;

    public function __construct(Admin $adminModel)
    {
        $this->adminModel = $adminModel;
    }

    public function login(): never
    {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!is_array($input)) {
            Response::error('Le corps de la requête doit être un JSON valide.', null, 400);
        }

        $email = trim($input['email'] ?? '');
        $password = (string) ($input['password'] ?? '');

        if ($email === '' || $password === '') {
            Response::error(
                'Email et mot de passe sont obligatoires.',
                [
                    'email' => $email === '' ? 'Champ requis.' : null,
                    'password' => $password === '' ? 'Champ requis.' : null
                ],
                422
            );
        }

        $admin = $this->adminModel->findByEmail($email);

        if ($admin === null || !password_verify($password, $admin['password'])) {
            Response::error('Identifiants incorrects.', null, 401);
        }

        $token = Jwt::encode([
            'sub' => $admin['id'],
            'email' => $admin['email']
        ]);

        Response::success('Connexion réussie.', [
            'token' => $token,
            'admin' => [
                'id' => $admin['id'],
                'nom' => $admin['nom'],
                'prenom' => $admin['prenom'],
                'email' => $admin['email']
            ]
        ]);
    }

    public function me(array $payload): never
    {
        Response::success('Session valide.', [
            'id' => $payload['sub'],
            'email' => $payload['email']
        ]);
    }
}
