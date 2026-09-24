<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use Reservation;

class ReservationStatutTest extends TestCase
{
    /**
     * @dataProvider statutsConnus
     */
    public function testLibelleDesStatutsConnus(string $statut, string $libelleAttendu): void
    {
        $this->assertSame($libelleAttendu, Reservation::libelleStatut($statut));
    }

    public static function statutsConnus(): array
    {
        return [
            ['en_attente', 'En attente'],
            ['confirmee', 'Confirmée'],
            ['annulee', 'Annulée'],
            ['terminee', 'Terminée']
        ];
    }

    public function testStatutInconnuRenvoieLaValeurTelleQuelle(): void
    {
        // Filet de sécurité : un statut non prévu ne doit jamais planter
        // l'affichage, juste renvoyer la valeur brute.
        $this->assertSame('statut_bizarre', Reservation::libelleStatut('statut_bizarre'));
    }
}
