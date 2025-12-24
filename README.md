## Vision fonctionnelle synthétique

La plateforme permet à des utilisateurs authentifiés de :

- Créer un compte et se connecter.

- Publier une prédiction de score avant le coup d’envoi d’un match.

- Joindre une preuve horodatée (ex: capture d’écran de leur modèle).

- Modifier leur prédiction jusqu’au coup d’envoi uniquement.

- Consulter les prédictions des autres utilisateurs après le coup d’envoi.

- Recevoir automatiquement le résultat de leur prédiction à la fin du match.

- Afficher un classement des gagnants (un ou plusieurs).

⚠️ Contraintes clés

[!IMPORTANT]
Le respect de l'équité repose sur trois piliers fondamentaux :

- Verrouillage temporel strict : Interdiction de modifier ou de parier dès que le match débute.

- Traçabilité des preuves : Archivage sécurisé des captures d'écran pour vérification.

- Résultats officiels et fiables : Intégration de données de confiance pour la clôture des matchs.



### Rôle Administrateur — périmètre

L’administrateur peut :

- gérer les utilisateurs,

- gérer les matchs et leurs horaires,

- contrôler les prédictions et les preuves,

- superviser les résultats et les gagnants,

- assurer la conformité et la modération,

- suivre des indicateurs clés.


 * ARCHITECTURE PROPOSÉE : CLEAN ARCHITECTURE (SANS BACKEND)
 * * Structure des dossiers :
 - src/app/
 - ├── core/              <- DOMAIN & USE CASES (Cœur métier, indépendant d'Angular)
 - │   ├── models/        <- Interfaces (Match, Prediction, User)
 - │   ├── services/      <- Abstractions (Interfaces de repository)
 - │   └── use-cases/     <- Logique métier pure (Valider une prédiction, calculer gagnant)
 - ├── data/              <- INFRASTRUCTURE / ADAPTERS
 - │   ├── repositories/  <- Implémentations concrètes (LocalStorage, MockAPI)
 - │   └── mappers/       <- Transformation des données brutes en modèles du domaine
 - ├── shared/            <- UI COMPONENTS & PIPES (Composants réutilisables)
 - └── features/          <- PRESENTATION LAYER (Pages et logique de vue)
 - ├── auth/
 - ├── predictions/
 - └── admin/

