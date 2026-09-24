<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use Jwt;

class JwtTest extends TestCase
{
    public function testEncodePuisDecodeRedonneLePayloadOriginal(): void
    {
        $token = Jwt::encode(['id' => 42]);
        $payload = Jwt::decode($token);

        $this->assertNotNull($payload);
        $this->assertSame(42, $payload['id']);
    }

    public function testDecodeAjouteUneExpiration(): void
    {
        $token = Jwt::encode(['id' => 1]);
        $payload = Jwt::decode($token);

        $this->assertArrayHasKey('exp', $payload);
        $this->assertGreaterThan(time(), $payload['exp']);
    }

    public function testJetonMalFormeEstRejete(): void
    {
        $this->assertNull(Jwt::decode('ceci-nest-pas-un-jeton'));
    }

    public function testSignatureAltereeEstRejetee(): void
    {
        $token = Jwt::encode(['id' => 1]);
        [$payload, $signature] = explode('.', $token);

        // On modifie légèrement la signature : le jeton doit être rejeté
        // même si le payload en lui-même reste un JSON valide.
        $signatureAlteree = substr($signature, 0, -1) . (substr($signature, -1) === 'a' ? 'b' : 'a');

        $this->assertNull(Jwt::decode("{$payload}.{$signatureAlteree}"));
    }

    public function testPayloadAltereEstRejeteMemeAvecLaBonneSignature(): void
    {
        $token = Jwt::encode(['id' => 1]);
        [$payload, $signature] = explode('.', $token);

        // On remplace le payload par celui d'un AUTRE jeton légitime : la
        // signature ne correspond plus, le jeton doit être rejeté (protège
        // contre un rejeu du payload d'un autre utilisateur).
        $autreToken = Jwt::encode(['id' => 999]);
        [$autrePayload] = explode('.', $autreToken);

        $this->assertNull(Jwt::decode("{$autrePayload}.{$signature}"));
    }
}
