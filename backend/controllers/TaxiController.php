<?php

class TaxiController
{
    private Taxi $taxiModel;

    public function __construct(Taxi $taxiModel)
    {
        $this->taxiModel = $taxiModel;
    }

    public function index(): never
    {
        $statut = $_GET['statut'] ?? null;

        if ($statut !== null && !in_array($statut, ['disponible', 'indisponible', 'en_course'], true)) {
            Response::error('Statut de filtre invalide.', null, 422);
        }

        Response::success('Liste des taxis.', $this->taxiModel->all($statut));
    }

    public function show(int $id): never
    {
        $taxi = $this->taxiModel->find($id);

        if ($taxi === null) {
            Response::error('Taxi introuvable.', null, 404);
        }

        Response::success('Détail du taxi.', $taxi);
    }

    public function store(): never
    {
        $data = $this->readInput();
        $errors = $this->validate($data);

        if (!empty($errors)) {
            Response::error('Les données fournies sont invalides.', $errors, 422);
        }

        if ($this->taxiModel->immatriculationExists($data['immatriculation'])) {
            Response::error(
                'Un taxi avec cette immatriculation existe déjà.',
                ['immatriculation' => 'Immatriculation déjà utilisée.'],
                422
            );
        }

        $id = $this->taxiModel->create($data);

        Response::success('Taxi créé avec succès.', $this->taxiModel->find($id), 201);
    }

    public function update(int $id): never
    {
        $existing = $this->taxiModel->find($id);

        if ($existing === null) {
            Response::error('Taxi introuvable.', null, 404);
        }

        $data = $this->readInput();
        $errors = $this->validate($data);

        if (!empty($errors)) {
            Response::error('Les données fournies sont invalides.', $errors, 422);
        }

        if ($this->taxiModel->immatriculationExists($data['immatriculation'], $id)) {
            Response::error(
                'Un taxi avec cette immatriculation existe déjà.',
                ['immatriculation' => 'Immatriculation déjà utilisée.'],
                422
            );
        }

        $this->taxiModel->update($id, $data);

        Response::success('Taxi mis à jour avec succès.', $this->taxiModel->find($id));
    }

    public function destroy(int $id): never
    {
        $existing = $this->taxiModel->find($id);

        if ($existing === null) {
            Response::error('Taxi introuvable.', null, 404);
        }

        $this->taxiModel->delete($id);

        Response::success('Taxi supprimé avec succès.');
    }

    private function readInput(): array
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        return [
            'immatriculation' => trim($input['immatriculation'] ?? ''),
            'modele' => trim($input['modele'] ?? ''),
            'marque' => trim($input['marque'] ?? ''),
            'nombre_places' => $input['nombre_places'] ?? null,
            'statut' => $input['statut'] ?? 'disponible',
            'chauffeur_id' => $input['chauffeur_id'] ?? null
        ];
    }

    private function validate(array $data): array
    {
        $errors = [];

        if ($data['immatriculation'] === '') {
            $errors['immatriculation'] = 'L\'immatriculation est obligatoire.';
        }

        if ($data['modele'] === '') {
            $errors['modele'] = 'Le modèle est obligatoire.';
        }

        if ($data['marque'] === '') {
            $errors['marque'] = 'La marque est obligatoire.';
        }

        if ($data['nombre_places'] === null || $data['nombre_places'] === '') {
            $errors['nombre_places'] = 'Le nombre de places est obligatoire.';
        } elseif (
            filter_var($data['nombre_places'], FILTER_VALIDATE_INT) === false ||
            (int) $data['nombre_places'] < 1 ||
            (int) $data['nombre_places'] > 20
        ) {
            $errors['nombre_places'] = 'Le nombre de places doit être un entier entre 1 et 20.';
        }

        if (!in_array($data['statut'], ['disponible', 'indisponible', 'en_course'], true)) {
            $errors['statut'] = 'Statut invalide.';
        }

        return $errors;
    }
}
