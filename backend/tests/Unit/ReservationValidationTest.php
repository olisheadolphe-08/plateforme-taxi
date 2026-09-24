<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use ReflectionClass;
use ReservationController;

/**
 * ReservationController::validate() est privée : on l'invoque via
 * réflexion plutôt que de l'exposer publiquement rien que pour les tests.
 * On construit le contrôleur sans passer par son constructeur (qui exige
 * un vrai modèle Reservation connecté à la base), puisque validate() ne
 * touche jamais à la base de données.
 */
class ReservationValidationTest extends TestCase
{
    private function validate(array $overrides = []): array
    {
        $data = array_merge([
            'nom_client' => 'Rakoto',
            'prenom_client' => 'Jean',
            'telephone_client' => '0341234567',
            'email_client' => '',
            'lieu_depart' => 'Analakely',
            'destination' => 'Ivato',
            'date_heure' => (new \DateTime('+1 day'))->format('Y-m-d H:i'),
            'nombre_passagers' => 2,
            'remarque' => ''
        ], $overrides);

        $controller = (new ReflectionClass(ReservationController::class))
            ->newInstanceWithoutConstructor();

        $method = new \ReflectionMethod(ReservationController::class, 'validate');
        $method->setAccessible(true);

        return $method->invoke($controller, $data);
    }

    public function testDonneesValidesNeGenerentAucuneErreur(): void
    {
        $this->assertSame([], $this->validate());
    }

    public function testNomTropCourtEstRefuse(): void
    {
        $errors = $this->validate(['nom_client' => 'R']);
        $this->assertArrayHasKey('nom_client', $errors);
    }

    public function testNomVideEstRefuse(): void
    {
        $errors = $this->validate(['nom_client' => '']);
        $this->assertArrayHasKey('nom_client', $errors);
    }

    public function testTelephoneInvalideEstRefuse(): void
    {
        $errors = $this->validate(['telephone_client' => 'abc']);
        $this->assertArrayHasKey('telephone_client', $errors);
    }

    /**
     * @dataProvider telephonesValides
     */
    public function testFormatsDeTelephoneValides(string $telephone): void
    {
        $errors = $this->validate(['telephone_client' => $telephone]);
        $this->assertArrayNotHasKey('telephone_client', $errors);
    }

    public static function telephonesValides(): array
    {
        return [
            ['0341234567'],
            ['+261 34 12 345 67'],
            ['(034) 123-4567']
        ];
    }

    public function testEmailInvalideEstRefuse(): void
    {
        $errors = $this->validate(['email_client' => 'pas-un-email']);
        $this->assertArrayHasKey('email_client', $errors);
    }

    public function testEmailVideEstAccepte(): void
    {
        // L'email est optionnel : une chaîne vide ne doit jamais être
        // signalée comme invalide, contrairement à un format incorrect.
        $errors = $this->validate(['email_client' => '']);
        $this->assertArrayNotHasKey('email_client', $errors);
    }

    public function testDepartEtDestinationIdentiquesSontRefuses(): void
    {
        $errors = $this->validate(['lieu_depart' => 'Ivato', 'destination' => 'Ivato']);
        $this->assertArrayHasKey('destination', $errors);
    }

    public function testDepartEtDestinationIdentiquesInsensibleALaCasse(): void
    {
        $errors = $this->validate(['lieu_depart' => 'Ivato', 'destination' => 'IVATO']);
        $this->assertArrayHasKey('destination', $errors);
    }

    public function testDateDansLePasseEstRefusee(): void
    {
        $hier = (new \DateTime('-1 day'))->format('Y-m-d H:i');
        $errors = $this->validate(['date_heure' => $hier]);
        $this->assertArrayHasKey('date_heure', $errors);
    }

    public function testFormatDeDateInvalideEstRefuse(): void
    {
        $errors = $this->validate(['date_heure' => '09/09/2026']);
        $this->assertArrayHasKey('date_heure', $errors);
    }

    /**
     * @dataProvider nombresPassagersInvalides
     */
    public function testNombreDePassagersHorsLimitesEstRefuse($valeur): void
    {
        $errors = $this->validate(['nombre_passagers' => $valeur]);
        $this->assertArrayHasKey('nombre_passagers', $errors);
    }

    public static function nombresPassagersInvalides(): array
    {
        return [
            'zero' => [0],
            'negatif' => [-1],
            'trop_eleve' => [9],
            'vide' => [''],
            'non_numerique' => ['abc']
        ];
    }

    public function testNombreDePassagersALaLimiteHauteEstAccepte(): void
    {
        $errors = $this->validate(['nombre_passagers' => 8]);
        $this->assertArrayNotHasKey('nombre_passagers', $errors);
    }
}
