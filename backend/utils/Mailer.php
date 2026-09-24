<?php

/**
 * Envoi d'email très simple basé sur mail() natif de PHP.
 *
 * IMPORTANT : mail() dépend d'un serveur de mail (sendmail/SMTP) configuré
 * sur la machine qui exécute PHP. Sous XAMPP/Windows en local, ça ne
 * fonctionne pas sans configuration supplémentaire (voir php.ini,
 * section [mail function], ou utiliser un outil comme Mailtrap /
 * un vrai fournisseur SMTP en production avec une librairie comme
 * PHPMailer). Ici, l'échec d'envoi est volontairement silencieux
 * (loggé, sans jamais faire planter la requête HTTP en cours) : la
 * notification "en base" (table notifications, suivi de réservation)
 * reste la source de vérité, l'email est un bonus best-effort.
 */
class Mailer
{
    public static function send(string $to, string $subject, string $message): bool
    {
        $headers = "From: " . env('MAIL_FROM', 'no-reply@taxigo.local') . "\r\n" .
            "Content-Type: text/plain; charset=UTF-8\r\n";

        try {
            $sent = @mail($to, $subject, $message, $headers);

            if (!$sent) {
                error_log("Mailer: échec d'envoi à {$to} (mail() a retourné false, serveur mail probablement non configuré)");
            }

            return $sent;

        } catch (Throwable $e) {
            error_log('Mailer: exception — ' . $e->getMessage());
            return false;
        }
    }
}
