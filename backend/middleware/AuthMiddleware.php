<?php

/**
 * Protège les routes /api/admin/* : exige un Authorization: Bearer <token>
 * valide (voir Jwt.php). Retourne le payload décodé (id, email...) en cas
 * de succès, sinon envoie une réponse 401 et arrête l'exécution.
 */
class AuthMiddleware
{
    public static function handle(): array
    {
        $headers = self::getAuthorizationHeader();

        if ($headers === null || !str_starts_with($headers, 'Bearer ')) {
            Response::error('Authentification requise.', null, 401);
        }

        $token = trim(substr($headers, 7));

        $payload = Jwt::decode($token);

        if ($payload === null) {
            Response::error('Session invalide ou expirée.', null, 401);
        }

        return $payload;
    }

    private static function getAuthorizationHeader(): ?string
    {
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            return $_SERVER['HTTP_AUTHORIZATION'];
        }

        if (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();

            foreach ($headers as $name => $value) {
                if (strcasecmp($name, 'Authorization') === 0) {
                    return $value;
                }
            }
        }

        return null;
    }
}
