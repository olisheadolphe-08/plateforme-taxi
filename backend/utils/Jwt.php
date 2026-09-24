<?php

/**
 * Jeton d'authentification "JWT-lite" (HMAC-SHA256), sans dépendance.
 * Format : base64url(payload).base64url(signature)
 * Le payload contient l'id admin et une date d'expiration ; la signature
 * garantit l'intégrité du jeton côté serveur (stateless, pas de table de
 * sessions à gérer).
 */
class Jwt
{
    public static function encode(array $payload): string
    {
        $payload['exp'] = time() + (int) env('JWT_TTL', 86400);

        $payloadJson = json_encode($payload, JSON_UNESCAPED_UNICODE);
        $payloadB64 = self::base64UrlEncode($payloadJson);

        $signature = hash_hmac('sha256', $payloadB64, self::secret());
        $signatureB64 = self::base64UrlEncode($signature);

        return "{$payloadB64}.{$signatureB64}";
    }

    public static function decode(string $token): ?array
    {
        $parts = explode('.', $token);

        if (count($parts) !== 2) {
            return null;
        }

        [$payloadB64, $signatureB64] = $parts;

        $expectedSignature = self::base64UrlEncode(
            hash_hmac('sha256', $payloadB64, self::secret())
        );

        if (!hash_equals($expectedSignature, $signatureB64)) {
            return null;
        }

        $payload = json_decode(self::base64UrlDecode($payloadB64), true);

        if (!is_array($payload) || !isset($payload['exp'])) {
            return null;
        }

        if ($payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }

    private static function secret(): string
    {
        return (string) env('JWT_SECRET', 'insecure-default-secret');
    }

    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
