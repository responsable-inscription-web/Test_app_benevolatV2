# Outil bénévolat — prototype (direction A)

Prototype cliquable de l'outil de gestion des bénévoles du Centre de Méditation Kadampa France.
Il sert à **tester les parcours** avec la coordination bénévolat avant de développer la vraie version.

> ⚠️ **Données 100 % fictives.** Aucun vrai bénévole, aucun envoi de mail, aucune signature ayant valeur légale.
> Les tarifs de remboursement (nuitée, repas, jeton de lessive) sont **inventés** et modifiables dans Réglages.

## Ce qu'on peut tester

| Écran | Ce qu'il montre |
|---|---|
| Tableau de bord | Présents du jour, demandes à traiter, arrivées/départs à 7 jours, alertes |
| Demandes | Filtres par statut, recherche, alertes automatiques (fermeture, durée, doublon, bénévole signalé, déjà venu), passage d'un statut à l'autre, choix du pôle à la confirmation |
| Bénévoles | Fiche avec identifiant stable (BEN-xxxxx), historique des séjours, commentaires, signalement, export et effacement RGPD |
| Plannings des pôles | 14 jours par pôle, clic sur une case pour poser/enlever un repos, contrôle « 2 repos par bloc de 7 jours », capacité cible |
| Arrivées et navettes | Arrivées/départs du jour, heure de navette, pointage arrivé·e / parti·e |
| Attestations | Attestations signées à valider, écarts avec le planning à trancher, montant remboursable, transmission à la compta |
| Réglages | Pôles et capacités, fermetures, événements, règles, tarifs, **modèles de mails FR/EN** avec aperçu, réinitialisation |
| Formulaire public | Formulaire FR/EN avec **indicatif téléphonique obligatoire** et contrôle des dates en direct |
| Attestation (téléphone) | Parcours mobile du bénévole : jours de bénévolat / repos / absence, jetons de lessive, signature au doigt, code de confirmation |

## Scénario de démo (10 minutes)

La date de démo est fixée au **24 septembre 2026**.

1. **Attestation sur téléphone** : Réglages du navigateur en mode mobile (F12 → icône téléphone), ouvrir « Liens d'attestation » puis **Léa MARTIN**. Cocher les jours, signer, saisir le code affiché.
2. **Attestations** : ouvrir **Hugo LEFÈVRE** (1 écart avec le planning), trancher, valider, puis « Transmettre à la compta ».
3. **Demandes** : ouvrir **Kenji SATO** (Acceptée) → « Confirmer le séjour » en choisissant le pôle. Ouvrir **Anna SCHMIDT** (Reçue) → « Inviter au RDV ».
4. **Formulaire public** : essayer des dates pendant la fermeture d'octobre, un numéro trop court, puis envoyer : la demande apparaît dans Demandes.
5. **Réglages → Modèles de mails** : modifier un texte, insérer un champ `{prénom}`, voir l'aperçu.
6. **Réglages → Réinitialiser la démo** pour tout remettre à zéro.

Les modifications sont gardées dans le navigateur (localStorage) : elles survivent à un rechargement, mais chaque personne a sa propre copie.

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
js/store.js       stockage + règles métier (statuts, alertes, repos, attestations, téléphone)
js/ui.js          petits composants d'affichage
js/admin.js       écrans de l'équipe (coordination, pôles, accueil, compta)
js/public.js      écrans côté bénévole (formulaire, attestation mobile)
js/app.js         routeur (#/demandes, #/planning, …)
```

## Limites connues (c'est un prototype)

- Pas de comptes ni de droits : tous les écrans sont visibles par tous.
- Mails et code de confirmation simulés (le code est affiché à l'écran).
- Données stockées uniquement dans le navigateur, pas de serveur.
- La signature dessinée n'est pas une signature électronique au sens réglementaire.
