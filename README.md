# Outil bénévolat — prototype (direction A)

Prototype cliquable de l'outil de gestion des bénévoles du Centre de Méditation Kadampa France.
Il sert à **tester les parcours** avec la coordination bénévolat avant de développer la vraie version.

> ⚠️ **Données 100 % fictives.** Aucun vrai bénévole, aucun envoi de mail, aucune signature ayant valeur légale.
> Les tarifs de remboursement (phase 2) sont **inventés** et modifiables dans Réglages.

## Ce qu'on peut tester

Le prototype suit le **document de conception, version 5**. Il montre la **phase 1** (ce qui est validé) et, à part, une démo de la **phase 2** (idée non validée : attestation et remboursement).

### Phase 1

| Écran | Ce qu'il montre |
|---|---|
| Tableau de bord | Présents du jour, demandes à traiter, **RDV à venir mis à jour en direct par Cal.com** et RDV à rattacher, arrivées/départs à 7 jours, charge des pôles, modifications à reporter dans KBS |
| Demandes | Date du RDV Cal.com, alerte « pas de RDV réservé » et « RDV annulé », filtres par statut, recherche, alertes (doublon, bénévole signalé, chevauchement, déjà venu), passage d'un statut à l'autre, choix du pôle à la confirmation, mails de refus / liste d'attente / désistement (à valider) |
| Bénévoles | Fiche avec identifiant stable (BEN-xxxxx), tranche d'âge, historique des séjours, commentaires, signalement, export et effacement RGPD |
| Planning global | **Tous les pôles sur une seule page**, jours en colonnes, **défilement horizontal** de la semaine en cours jusqu'au dernier départ connu (on peut remonter dans le passé), dates et noms fixes, bouton « Aujourd'hui », clic sur une case pour poser/enlever un repos |
| Satellite d'un pôle | Vue déportée du responsable (`#/satellite/Restaurant`) : son seul pôle, **capacité semaine par semaine**, repos, arrivées/départs à 7 jours, impression |
| Satellite accueil | Vue déportée de l'accueil (`#/satellite-accueil`) : arrivées et départs du jour, pointage, heures, navettes, arrivées à 7 jours |
| Arrivées et navettes | Arrivées/départs du jour, heure de navette, pointage arrivé·e / parti·e |
| À reporter dans KBS | KBS ne se met jamais à jour tout seul : chaque modification d'un séjour déjà envoyé à KBS (dates, annulation…) apparaît ici, à cocher une fois ressaisie |
| Réglages | Pôles (capacité par défaut, **durée minimale par pôle**), fermetures, événements, **textes de la fenêtre de refus** et **tranches d'âge**, règles, modèles de mails FR/EN avec aperçu, **connexion Cal.com et simulateur de webhook**, réinitialisation |
| Formulaire public | FR/EN, indicatif téléphonique obligatoire, tranche d'âge. **Envoi bloqué** si les dates touchent une fermeture, si le séjour est trop court pour le pôle choisi ou si la personne a moins de 18 ans : une fenêtre explique pourquoi |

### Phase 2 (idée à valider)

| Écran | Ce qu'il montre |
|---|---|
| Attestations | Attestations signées à valider, écarts avec le planning, montant remboursable, grilles tarifaires (1er mars / 1er septembre), envoi à la compta |
| Attestation (téléphone) | Parcours mobile du bénévole : jours de bénévolat / repos / autre formule, jetons de lessive, signature au doigt, code de confirmation |

## Scénario de démo (10 minutes)

La date de démo est fixée au **24 septembre 2026**.

**Phase 1**

1. **Formulaire public** : choisir des dates début octobre (fermeture) puis envoyer → la fenêtre explique le refus. Essayer 4 jours au Restaurant (8 jours minimum), puis le Studio d'Art (pas de minimum) : la demande part et apparaît dans Demandes.
2. **Demandes** : ouvrir **Kenji SATO** (Acceptée) → « Confirmer le séjour » en choisissant le pôle. Ouvrir **Anna SCHMIDT** (Reçue) → « Inviter au RDV », ou « Refuser » (mail de refus, à valider).
3. **Modifier les dates d'un séjour confirmé** (Tout → **Maya COHEN**) : la modification apparaît dans **À reporter dans KBS**. Des dates en fermeture sont refusées, comme dans le formulaire.
4. **Planning global** : faire défiler les semaines, cliquer sur un jour pour poser un repos. Ouvrir le **satellite Restaurant** (lien à côté du nom du pôle) : la capacité de la semaine du 28 sept. est à 2 (saisie par le responsable) ; la modifier, puis revenir au planning global : c'est pris en compte. Ouvrir aussi le **satellite accueil** (menu « Vues déportées »).
5. **RDV Cal.com** : **Réglages → Cal.com** → simuler une réservation pour **Sofia ROSSI** (signalée « pas de RDV réservé »), puis une annulation pour **Jonas WEBER** : le tableau de bord et les demandes se mettent à jour. Une adresse inconnue arrive dans « RDV à rattacher ».
6. **Réglages → Formulaire** : modifier le texte d'un refus, cliquer « Voir la fenêtre ». **Réglages → Pôles** : durée minimale par pôle.

**Phase 2**

7. **Attestation sur téléphone** : mode mobile du navigateur (F12 → icône téléphone), « Liens d'attestation » → **Léa MARTIN**. Cocher les jours, signer, saisir le code affiché.
8. **Attestations** : **Hugo LEFÈVRE** (1 écart avec le planning) → trancher, valider. Onglet « Validées » → **Marc DUBOIS** : séjour à cheval sur deux grilles tarifaires.

**Réglages → Données de démo → Réinitialiser** remet tout à zéro.

Les modifications sont gardées dans le navigateur (localStorage) : elles survivent à un rechargement, mais chaque personne a sa propre copie.

## Grilles tarifaires (phase 2)

La grille de remboursement change **deux fois par an, au 1er mars et au 1er septembre**.

- Chaque grille a une date de début ; elle s'applique jusqu'à la veille de la suivante.
- Chaque **jour de bénévolat** est remboursé au tarif de la grille en vigueur **ce jour-là** : un séjour à cheval sur un changement donne deux lignes de calcul.
- Les **jetons de lessive** sont comptés au tarif en vigueur le jour du départ (règle à valider avec la comptabilité).
- Une grille déjà utilisée par une attestation validée ou transmise est verrouillée, pour ne jamais changer un montant déjà envoyé à la compta.

## Tester en local

Aucune installation : ouvrir `index.html` dans un navigateur (double-clic).

## Mettre en ligne avec GitHub Pages

1. Créer un dépôt sur GitHub (public, ou privé avec un compte qui permet Pages).
2. Déposer **le contenu** du dossier à la racine du dépôt (`index.html`, `css/`, `js/`, `.nojekyll`, `README.md`) — via « Add file → Upload files » ou `git push`.
3. Dans le dépôt : **Settings → Pages → Source : Deploy from a branch → Branch : `main` / `(root)`** → Save.
4. Après une minute, le site est disponible à `https://<compte>.github.io/<dépôt>/`.

Le lien d'attestation d'un bénévole a la forme `https://<compte>.github.io/<dépôt>/#/attestation/<n° de séjour>`.

## Organisation du code

Pas de framework ni de build : HTML + CSS + JavaScript simple.

```
index.html        point d'entrée
css/style.css     charte visuelle (direction A)
js/data.js        données fictives et réglages de départ
js/store.js       stockage + règles métier (statuts, contrôles du formulaire, alertes, capacité, KBS, repos, attestations, téléphone)
js/ui.js          petits composants d'affichage
js/admin.js       écrans de l'équipe (coordination, pôles, accueil, compta)
js/public.js      écrans côté bénévole (formulaire, attestation mobile)
js/app.js         routeur (#/demandes, #/planning, …)
```

## Limites connues (c'est un prototype)

- Pas de comptes ni de droits : tous les écrans sont visibles par tous.
- Mails et code de confirmation simulés (le code est affiché à l'écran).
- Le webhook Cal.com est simulé : un vrai webhook demande un serveur en ligne (impossible sur GitHub Pages).
- La fiche KBS et le report dans KBS sont simulés : rien n'est envoyé à KBS.
- Données stockées uniquement dans le navigateur, pas de serveur.
- La signature dessinée n'est pas une signature électronique au sens réglementaire.
