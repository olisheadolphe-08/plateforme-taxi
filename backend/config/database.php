<?php

class Database
{
    private ?PDO $connection = null;

    public function connect(): PDO
    {
        if ($this->connection !== null) {
            return $this->connection;
        }

        $host = env('DB_HOST', 'localhost');
        $port = env('DB_PORT', '5432');
        $dbName = env('DB_NAME', 'plateforme_taxi');
        $username = env('DB_USER', 'postgres');
        $password = env('DB_PASSWORD', '');

        try {
            $dsn = "pgsql:host={$host};port={$port};dbname={$dbName}";

            $this->connection = new PDO(
                $dsn,
                $username,
                $password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );

            return $this->connection;

        } catch (PDOException $e) {

            error_log('Erreur connexion DB : ' . $e->getMessage());

            http_response_code(500);

            echo json_encode([
                'success' => false,
                'message' => 'Erreur de connexion à la base de données.'
            ]);

            exit;
        }
    }
}
