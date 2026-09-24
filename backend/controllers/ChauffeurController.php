<?php

class ChauffeurController
{
    private Chauffeur $chauffeurModel;

    public function __construct(Chauffeur $chauffeurModel)
    {
        $this->chauffeurModel = $chauffeurModel;
    }

    public function index(): never
    {
        $statut = $_GET['statut'] ?? null;

        if ($statut !== null && !in_array($statut, ['disponible', 'indisponible', 'en_course'], true)) {
            Response::error('Statut de filtre invalide.', null, 422);
        }

        Response::success('Liste des chauffeurs.', $this->chauffeurModel->all($statut));
    }

    public function show(int $id): never
    {
        $chauffeur = $this->chauffeurModel->find($id);

        if ($chauffeur === null) {
            Response::error('Chauffeur introuvable.', null, 404);
        }

        Response::success('Détail du chauffeur.', $chauffeur);
    }

    public function store(): never
    {
        $data = $this->readInput();
        $errors = $this->validate($data);

        if (!empty($errors)) {
            Response::error('Les données fournies sont invalides.', $errors, 422);
        }

        if ($this->chauffeurModel->permisExists($data['numero_permis'])) {
            Response::error(
                'Un chauffeur avec ce numéro de permis existe déjà.',
                ['numero_permis' => 'Numéro de permis déjà utilisé.'],
                422
            );
        }

        $id = $this->chauffeurModel->create($data);

        Response::success('Chauffeur créé avec succès.', $this->chauffeurModel->find($id), 201);
    }

    public function update(int $id): never
    {
        $existing = $this->chauffeurModel->find($id);

        if ($existing === null) {
            Response::error('Chauffeur introuvable.', null, 404);
        }

        $data = $this->readInput();
        $errors = $this->validate($data);

        if (!empty($errors)) {
            Response::error('Les données fournies sont invalides.', $errors, 422);
        }

        if ($this->chauffeurModel->permisExists($data['numero_permis'], $id)) {
            Response::error(
                'Un chauffeur avec ce numéro de permis existe déjà.',
                ['numero_permis' => 'Numéro de permis déjà utilisé.'],
                422
            );
        }

        $this->chauffeurModel->update($id, $data);

        Response::success('Chauffeur mis à jour avec succès.', $this->chauffeurModel->find($id));
    }

    public function destroy(int $id): never
    {
        $existing = $this->chauffeurModel->find($id);

        if ($existing === null) {
            Response::error('Chauffeur introuvable.', null, 404);
        }

        $this->chauffeurModel->delete($id);

        Response::success('Chauffeur supprimé avec succès.');
    }

    private function readInput(): array
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        return [
            'nom' => trim($input['nom'] ?? ''),
            'prenom' => trim($input['prenom'] ?? ''),
            'telephone' => trim($input['telephone'] ?? ''),
            'numero_permis' => trim($input['numero_permis'] ?? ''),
            'statut' => $input['statut'] ?? 'disponible'
        ];
    }

    private function validate(array $data): array
    {
        $errors = [];

        if ($data['nom'] === '') {
            $errors['nom'] = 'Le nom est obligatoire.';
        }

        if ($data['prenom'] === '') {
            $errors['prenom'] = 'Le prénom est obligatoire.';
        }

        if ($data['telephone'] === '') {
            $errors['telephone'] = 'Le téléphone est obligatoire.';
        } elseif (!preg_match('/^[0-9+\s()-]{8,20}$/', $data['telephone'])) {
            $errors['telephone'] = 'Le numéro de téléphone est invalide.';
        }

        if ($data['numero_permis'] === '') {
            $errors['numero_permis'] = 'Le numéro de permis est obligatoire.';
        }

        if (!in_array($data['statut'], ['disponible', 'indisponible', 'en_course'], true)) {
            $errors['statut'] = 'Statut invalide.';
        }

        return $errors;
    }
}
