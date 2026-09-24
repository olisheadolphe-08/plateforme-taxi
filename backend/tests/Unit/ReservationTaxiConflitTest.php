<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use Reservation;

class ReservationTaxiConflitTest extends TestCase
{
    public function testMemeTrajetExactEstIdentique(): void
    {
        $this->assertTrue(Reservation::memeTrajet('Analakely', 'Ivato', 'Analakely', 'Ivato'));
    }

    public function testComparaisonInsensibleALaCasseEtAuxEspaces(): void
    {
        $this->assertTrue(Reservation::memeTrajet('  analakely ', 'IVATO', 'Analakely', 'Ivato'));
    }

    public function testDepartDifferentEstUnAutreTrajet(): void
    {
        $this->assertFalse(Reservation::memeTrajet('Analakely', 'Ivato', 'Ankorondrano', 'Ivato'));
    }

    public function testDestinationDifferenteEstUnAutreTrajet(): void
    {
        $this->assertFalse(Reservation::memeTrajet('Analakely', 'Ivato', 'Analakely', 'Antsirabe'));
    }

    public function testTrajetInverseEstUnAutreTrajet(): void
    {
        $this->assertFalse(Reservation::memeTrajet('Analakely', 'Ivato', 'Ivato', 'Analakely'));
    }
}
