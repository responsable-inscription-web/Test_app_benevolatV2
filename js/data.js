/* Données de démonstration — toutes les personnes sont fictives.
   La « date du jour » est figée pour que la démo reste cohérente. */
window.DEMO_TODAY = "2026-09-24";

window.SEED = {
  reglages: {
    poles: [
      { nom: "Restaurant", capacite: 3, dureeMin: 8, capaSemaines: { "2026-09-28": 2 }, responsable: "responsable-restauration@example.org", actif: true },
      { nom: "Gouvernance", capacite: 3, dureeMin: 8, capaSemaines: {}, responsable: "gouvernance@example.org", actif: true },
      { nom: "Espaces verts", capacite: 2, dureeMin: 8, capaSemaines: {}, responsable: "", actif: true },
      { nom: "Travaux", capacite: 2, dureeMin: 8, capaSemaines: {}, responsable: "", actif: true },
      { nom: "Maintenance", capacite: 1, dureeMin: 8, capaSemaines: {}, responsable: "", actif: true },
      { nom: "Studio d'Art", capacite: 2, dureeMin: 0, capaSemaines: {}, responsable: "", actif: true },
      { nom: "CPS Com", capacite: 1, dureeMin: 8, capaSemaines: {}, responsable: "", actif: true },
      { nom: "World Peace Café", capacite: 2, dureeMin: 8, capaSemaines: {}, responsable: "", actif: true },
    ],
    fermetures: [
      { nom: "Fermeture d'automne", debut: "2026-10-06", fin: "2026-10-19" },
      { nom: "Fermeture de novembre", debut: "2026-11-26", fin: "2026-11-30" },
    ],
    evenements: [
      { nom: "Conférence grand public", debut: "2026-09-23", fin: "2026-09-23" },
      { nom: "Retraite G. Sangyé", debut: "2026-09-25", fin: "2026-09-27" },
      { nom: "Retraite P. Chauvel", debut: "2026-10-02", fin: "2026-10-04" },
    ],
    regles: {
      tranchesAge: ["Moins de 18 ans", "18–25", "26–35", "36–50", "51–65", "Plus de 65 ans"],
      reposParBloc: 2, rappelJours: 10,
      navettePlage: "12h30–18h30", navetteGare: "gare d'Écommoy", navetteDelaiJours: 3,
      lessiveMaxParSemaine: 1,
    },
    // Grilles tarifaires FICTIVES : une grille par période (changement au 1er mars et au 1er septembre).
    // Chaque jour de bénévolat est remboursé au tarif de la grille en vigueur ce jour-là.
    tarifs: [
      { debut: "2026-03-01", nuitDortoir: 11, repasJour: 14, jetonLessive: 4 },
      { debut: "2026-09-01", nuitDortoir: 12, repasJour: 15, jetonLessive: 4 },
    ],
    modeles: {
      invitation: {
        nom: "Invitation au RDV", declencheur: "RDV proposé",
        FR: { objet: "Réservez votre appel vidéo — CMK France", corps: "Bonjour {prénom},\n\nMerci pour votre demande de séjour de bénévolat du {date_arrivée} au {date_départ}.\nChoisissez un créneau pour un court appel vidéo (30 min) : {lien_rdv}\n\nAu plaisir d'échanger avec vous,\nLe pôle Bénévolat" },
        EN: { objet: "Book your video call — KMC France", corps: "Hello {prénom},\n\nThank you for your volunteering request from {date_arrivée} to {date_départ}.\nPlease pick a time for a short video call (30 min): {lien_rdv}\n\nLooking forward to talking with you,\nThe Volunteer Team" },
      },
      confirmation: {
        nom: "Confirmation de séjour", declencheur: "Confirmée",
        FR: { objet: "Votre séjour au CMK France est confirmé", corps: "Bonjour {prénom},\n\nVotre séjour de bénévolat est confirmé du {date_arrivée} au {date_départ}, au pôle {pôle}.\nNavette depuis la {gare} : {plage_navette}, à réserver au plus tard le {date_limite_navette}.\n\nÀ très bientôt,\nLe pôle Bénévolat" },
        EN: { objet: "Your stay at KMC France is confirmed", corps: "Hello {prénom},\n\nYour volunteering stay is confirmed from {date_arrivée} to {date_départ}, in the {pôle} team.\nShuttle from {gare}: {plage_navette}, to be booked by {date_limite_navette}.\n\nSee you soon,\nThe Volunteer Team" },
      },
      rappel: {
        nom: "Rappel J-10", declencheur: "10 jours avant l'arrivée",
        FR: { objet: "Confirmez votre arrivée au CMK France — le {date_arrivée}", corps: "Bonjour {prénom},\n\nNous préparons votre venue, prévue le {date_arrivée}. Merci de confirmer votre arrivée en répondant à ce mail.\n\nNavette depuis la {gare} : {plage_navette}. Réservez au plus tard le {date_limite_navette}.\n\nÀ très bientôt,\nL'équipe bénévolat du CMK France" },
        EN: { objet: "Confirm your arrival at KMC France — {date_arrivée}", corps: "Hello {prénom},\n\nWe are preparing your stay, starting on {date_arrivée}. Please confirm your arrival by replying to this email.\n\nShuttle from {gare}: {plage_navette}. Please book by {date_limite_navette}.\n\nSee you very soon,\nThe Volunteering Team, KMC France" },
      },
      refus: {
        nom: "Refus de la demande (à valider)", declencheur: "Refusée",
        FR: { objet: "Votre demande de bénévolat au CMK France", corps: "Bonjour {prénom},\n\nMerci pour votre intérêt pour le CMK France. Nous ne pouvons malheureusement pas donner suite à votre demande pour la période du {date_arrivée} au {date_départ}.\n\nBien à vous,\nL'équipe bénévolat" },
        EN: { objet: "Your volunteering request at KMC France", corps: "Hello {prénom},\n\nThank you for your interest in KMC France. Unfortunately we cannot accept your request for {date_arrivée} to {date_départ}.\n\nKind regards,\nThe Volunteer Team" },
      },
      attente: {
        nom: "Liste d'attente (à valider)", declencheur: "Liste d'attente",
        FR: { objet: "Votre demande est en liste d'attente", corps: "Bonjour {prénom},\n\nLes pôles sont complets du {date_arrivée} au {date_départ}. Votre demande est en liste d'attente : nous vous recontactons si une place se libère.\n\nL'équipe bénévolat" },
        EN: { objet: "Your request is on the waiting list", corps: "Hello {prénom},\n\nOur teams are full from {date_arrivée} to {date_départ}. Your request is on the waiting list: we will contact you if a place becomes available.\n\nThe Volunteer Team" },
      },
      desistement: {
        nom: "Désistement confirmé (à valider)", declencheur: "Désistée",
        FR: { objet: "Annulation de votre séjour", corps: "Bonjour {prénom},\n\nNous avons bien noté l'annulation de votre séjour du {date_arrivée} au {date_départ}. Au plaisir de vous accueillir une autre fois.\n\nL'équipe bénévolat" },
        EN: { objet: "Your stay has been cancelled", corps: "Hello {prénom},\n\nWe have noted the cancellation of your stay from {date_arrivée} to {date_départ}. We hope to welcome you another time.\n\nThe Volunteer Team" },
      },
      attestation: {
        nom: "Lien d'attestation (phase 2)", declencheur: "La veille du départ",
        FR: { objet: "Votre attestation de bénévolat", corps: "Bonjour {prénom},\n\nVotre séjour se termine le {date_départ}. Pour le remboursement de vos frais, confirmez vos jours de bénévolat et signez ici : {lien_attestation}\n\nMerci pour votre aide,\nLe pôle Bénévolat" },
        EN: { objet: "Your volunteering certificate", corps: "Hello {prénom},\n\nYour stay ends on {date_départ}. To get your costs refunded, please confirm your volunteering days and sign here: {lien_attestation}\n\nThank you for your help,\nThe Volunteer Team" },
      },
    },
  },

  benevoles: [
    { id: "BEN-00090", prenom: "Chloé", nom: "BERNARD", email: "chloe.b@example.org", indicatif: "+33", tel: "611223344", pays: "France", langue: "FR", regime: "Végétarien", urgence: "", commentaires: [], signale: false, motifSignalement: "" },
    { id: "BEN-00101", prenom: "Léa", nom: "MARTIN", email: "lea.martin@example.com", indicatif: "+33", tel: "612345678", pays: "France", langue: "FR", regime: "Végétarien", urgence: "Paul Martin +33 6 98 76 54 32", commentaires: [], signale: false, motifSignalement: "" },
    { id: "BEN-00102", prenom: "Kenji", nom: "SATO", email: "kenji.sato@example.com", indicatif: "+81", tel: "9012345678", pays: "Japon", langue: "EN", regime: "Végétarien", urgence: "Aiko Sato +81 90 8765 4321", commentaires: [{ auteur: "Coordination", date: "2026-05-18", texte: "Très autonome en cuisine, apprécié de l'équipe." }], signale: false, motifSignalement: "" },
    { id: "BEN-00103", prenom: "Anna", nom: "SCHMIDT", email: "anna.schmidt@example.com", indicatif: "+49", tel: "15112345678", pays: "Allemagne", langue: "EN", regime: "Végétarien", urgence: "", commentaires: [], signale: false, motifSignalement: "" },
    { id: "BEN-00104", prenom: "Omar", nom: "HADDAD", email: "omar.haddad@example.com", indicatif: "+33", tel: "687654321", pays: "France", langue: "FR", regime: "Vegan sans gluten", urgence: "", commentaires: [], signale: false, motifSignalement: "" },
    { id: "BEN-00105", prenom: "Elena", nom: "PETROVA", email: "elena.petrova@example.com", indicatif: "+359", tel: "881234567", pays: "Bulgarie", langue: "EN", regime: "Végétarien", urgence: "", commentaires: [], signale: false, motifSignalement: "" },
    { id: "BEN-00106", prenom: "Hugo", nom: "LEFÈVRE", email: "hugo.lefevre@example.com", indicatif: "+33", tel: "644556677", pays: "France", langue: "FR", regime: "Végétarien", urgence: "", commentaires: [], signale: false, motifSignalement: "" },
    { id: "BEN-00107", prenom: "Julie", nom: "FONTAINE", email: "julie.fontaine@example.com", indicatif: "+32", tel: "471234567", pays: "Belgique", langue: "FR", regime: "Végétarien", urgence: "", commentaires: [], signale: false, motifSignalement: "" },
    { id: "BEN-00108", prenom: "Marc", nom: "DUBOIS", email: "marc.dubois@example.com", indicatif: "+41", tel: "781234567", pays: "Suisse", langue: "FR", regime: "Végétarien", urgence: "", commentaires: [], signale: false, motifSignalement: "" },
    { id: "BEN-00109", prenom: "Maya", nom: "COHEN", email: "maya.cohen@example.com", indicatif: "+44", tel: "7700900123", pays: "Royaume-Uni", langue: "EN", regime: "Végétarien", urgence: "", commentaires: [], signale: false, motifSignalement: "" },
    { id: "BEN-00110", prenom: "Nadia", nom: "AMRANI", email: "nadia.amrani@example.com", indicatif: "+33", tel: "655443322", pays: "France", langue: "FR", regime: "Vegan sans gluten", urgence: "", commentaires: [], signale: false, motifSignalement: "" },
    { id: "BEN-00111", prenom: "Tomás", nom: "RIVERA", email: "tomas.rivera@example.com", indicatif: "+34", tel: "612987654", pays: "Espagne", langue: "EN", regime: "Végétarien", urgence: "", commentaires: [], signale: false, motifSignalement: "" },
    { id: "BEN-00112", prenom: "Chloé", nom: "BERNARD", email: "chloe.bernard@example.com", indicatif: "+33", tel: "611223344", pays: "France", langue: "FR", regime: "Végétarien", urgence: "", commentaires: [], signale: false, motifSignalement: "" },
    { id: "BEN-00113", prenom: "Jonas", nom: "WEBER", email: "jonas.weber@example.com", indicatif: "+49", tel: "15198765432", pays: "Allemagne", langue: "EN", regime: "Végétarien", urgence: "", commentaires: [], signale: false, motifSignalement: "" },
    { id: "BEN-00114", prenom: "Sofia", nom: "ROSSI", email: "sofia.rossi@example.com", indicatif: "+39", tel: "3123456789", pays: "Italie", langue: "EN", regime: "Végétarien", urgence: "", commentaires: [], signale: false, motifSignalement: "" },
    { id: "BEN-00115", prenom: "Priya", nom: "NAIR", email: "priya.nair@example.com", indicatif: "+44", tel: "7700900456", pays: "Royaume-Uni", langue: "EN", regime: "Vegan sans gluten", urgence: "", commentaires: [], signale: false, motifSignalement: "" },
    { id: "BEN-00116", prenom: "Ines", nom: "DUARTE", email: "ines.duarte@example.com", indicatif: "+351", tel: "912345678", pays: "Portugal", langue: "EN", regime: "Végétarien", urgence: "", commentaires: [], signale: false, motifSignalement: "" },
  ],

  sejours: [
    { id: 1, benevole: "BEN-00101", arrivee: "2026-09-16", depart: "2026-09-30", heureArrivee: "14:12", heureDepart: "11:00", navette: "Oui", souhaits: ["Restaurant", "Gouvernance"], pole: "Restaurant", statut: "Arrivé·e", canal: "Bouche à oreille", sante: "", repos: ["2026-09-20", "2026-09-21", "2026-09-27", "2026-09-28"], lit: "Dortoir B · lit 2", attestation: null },
    { id: 2, benevole: "BEN-00104", arrivee: "2026-09-12", depart: "2026-10-05", heureArrivee: "", heureDepart: "", navette: "Non", souhaits: ["Restaurant"], pole: "Restaurant", statut: "Arrivé·e", canal: "Workaway", sante: "", repos: ["2026-09-16", "2026-09-17", "2026-09-23", "2026-09-24", "2026-09-30", "2026-10-01"], lit: "Dortoir A · lit 1", attestation: null },
    { id: 3, benevole: "BEN-00105", arrivee: "2026-09-19", depart: "2026-10-04", heureArrivee: "16:28", heureDepart: "", navette: "Oui", souhaits: ["Restaurant", "Espaces verts"], pole: "Restaurant", statut: "Arrivé·e", canal: "Worldpackers", sante: "", repos: ["2026-09-21", "2026-09-27", "2026-09-28", "2026-10-03"], lit: "Dortoir B · lit 3", attestation: null },
    { id: 4, benevole: "BEN-00106", arrivee: "2026-09-13", depart: "2026-09-25", heureArrivee: "", heureDepart: "", navette: "Non", souhaits: ["Espaces verts"], pole: "Espaces verts", statut: "Arrivé·e", canal: "HelpX", sante: "", repos: ["2026-09-19", "2026-09-20"], lit: "Dortoir A · lit 5",
      attestation: { statut: "signée", jetons: 2, signeLe: "2026-09-24T09:12", jours: { "2026-09-14": "b", "2026-09-15": "b", "2026-09-16": "b", "2026-09-17": "b", "2026-09-18": "b", "2026-09-19": "r", "2026-09-20": "b", "2026-09-21": "b", "2026-09-22": "b", "2026-09-23": "b", "2026-09-24": "b" } } },
    { id: 5, benevole: "BEN-00107", arrivee: "2026-09-10", depart: "2026-09-22", heureArrivee: "", heureDepart: "", navette: "Oui", souhaits: ["Gouvernance"], pole: "Gouvernance", statut: "Parti·e", canal: "Déjà venu·e", sante: "", repos: ["2026-09-13", "2026-09-14", "2026-09-19", "2026-09-20"], lit: "",
      attestation: { statut: "signée", jetons: 1, signeLe: "2026-09-21T19:40", jours: { "2026-09-11": "b", "2026-09-12": "b", "2026-09-13": "r", "2026-09-14": "r", "2026-09-15": "b", "2026-09-16": "b", "2026-09-17": "a", "2026-09-18": "b", "2026-09-19": "r", "2026-09-20": "r", "2026-09-21": "b" } } },
    { id: 6, benevole: "BEN-00108", arrivee: "2026-08-24", depart: "2026-09-12", heureArrivee: "", heureDepart: "", navette: "Non", souhaits: ["Travaux"], pole: "Travaux", statut: "Parti·e", canal: "Workaway", sante: "", repos: ["2026-08-29", "2026-08-30", "2026-09-05", "2026-09-06"], lit: "",
      attestation: { statut: "validée", jetons: 2, signeLe: "2026-09-11T20:02", jours: {} } },
    { id: 7, benevole: "BEN-00109", arrivee: "2026-09-26", depart: "2026-10-05", heureArrivee: "14:40", heureDepart: "", navette: "Oui", souhaits: ["Restaurant"], pole: "Restaurant", statut: "Confirmée", canal: "Workaway", sante: "", repos: [], lit: "Dortoir B · lit 4", attestation: null },
    { id: 8, benevole: "BEN-00110", arrivee: "2026-09-27", depart: "2026-10-05", heureArrivee: "", heureDepart: "", navette: "Je confirmerai plus tard", souhaits: ["Gouvernance", "Restaurant"], pole: "Gouvernance", statut: "Confirmée", canal: "Bouche à oreille", sante: "", repos: [], lit: "", attestation: null },
    { id: 9, benevole: "BEN-00102", arrivee: "2026-11-02", depart: "2026-11-20", heureArrivee: "", heureDepart: "", navette: "Oui", souhaits: ["Restaurant"], pole: null, statut: "Acceptée", canal: "Déjà venu·e", sante: "", repos: [], lit: "", attestation: null },
    { id: 10, benevole: "BEN-00102", arrivee: "2026-05-04", depart: "2026-05-18", heureArrivee: "", heureDepart: "", navette: "Oui", souhaits: ["Restaurant"], pole: "Restaurant", statut: "Parti·e", canal: "Workaway", sante: "", repos: [], lit: "", attestation: { statut: "transmise", jetons: 2, signeLe: "2026-05-17T18:00", jours: {} } },
    { id: 11, benevole: "BEN-00103", arrivee: "2026-11-05", depart: "2026-11-24", heureArrivee: "", heureDepart: "", navette: "Oui", souhaits: ["Restaurant", "Gouvernance"], pole: null, statut: "Reçue", canal: "Workaway", sante: "", repos: [], lit: "", attestation: null },
    { id: 12, benevole: "BEN-00111", arrivee: "2026-10-20", depart: "2026-11-03", heureArrivee: "", heureDepart: "", navette: "Non", souhaits: ["Travaux"], pole: null, statut: "Reçue", canal: "Worldpackers", sante: "", repos: [], lit: "", attestation: null },
    { id: 13, benevole: "BEN-00112", arrivee: "2026-11-03", depart: "2026-11-17", heureArrivee: "", heureDepart: "", navette: "Oui", souhaits: ["Gouvernance", "Restaurant"], pole: null, statut: "Reçue", canal: "Bouche à oreille", sante: "", repos: [], lit: "", attestation: null },
    { id: 14, benevole: "BEN-00113", arrivee: "2026-10-20", depart: "2026-11-10", heureArrivee: "", heureDepart: "", navette: "Oui", souhaits: ["Espaces verts"], pole: null, statut: "RDV proposé", canal: "Workaway", sante: "", repos: [], lit: "", attestation: null },
    { id: 15, benevole: "BEN-00114", arrivee: "2026-10-20", depart: "2026-11-05", heureArrivee: "", heureDepart: "", navette: "Oui", souhaits: ["Restaurant"], pole: null, statut: "RDV proposé", canal: "HelpX", sante: "", repos: [], lit: "", attestation: null },
    { id: 16, benevole: "BEN-00115", arrivee: "2026-10-20", depart: "2026-11-09", heureArrivee: "", heureDepart: "", navette: "Non", souhaits: ["Studio d'Art"], pole: null, statut: "RDV fait", canal: "Bouche à oreille", sante: "", repos: [], lit: "", attestation: null },
    { id: 17, benevole: "BEN-00116", arrivee: "2026-11-01", depart: "2026-11-15", heureArrivee: "", heureDepart: "", navette: "Oui", souhaits: ["Restaurant"], pole: null, statut: "Liste d'attente", canal: "Workaway", sante: "", repos: [], lit: "", attestation: null },
  ],

  // Modifications faites après l'envoi de la fiche KBS : à ressaisir à la main dans KBS.
  kbs: [
    { sejour: 8, date: "2026-09-22", quoi: "Dates", avant: "26/09/2026 → 05/10/2026", apres: "27/09/2026 → 05/10/2026", fait: false },
    { sejour: 7, date: "2026-09-18", quoi: "Navette", avant: "Non", apres: "Oui", fait: true },
  ],

  historique: [
    { sejour: 11, date: "2026-09-21", texte: "Demande reçue par le formulaire" },
    { sejour: 12, date: "2026-09-20", texte: "Demande reçue par le formulaire" },
    { sejour: 13, date: "2026-09-22", texte: "Demande reçue par le formulaire" },
    { sejour: 14, date: "2026-09-18", texte: "Mail « Invitation au RDV » envoyé (EN)" },
    { sejour: 15, date: "2026-09-19", texte: "Mail « Invitation au RDV » envoyé (EN)" },
    { sejour: 16, date: "2026-09-23", texte: "RDV visio réalisé" },
    { sejour: 9, date: "2026-09-22", texte: "Acceptée sans RDV (bénévole déjà venu)" },
    { sejour: 7, date: "2026-09-15", texte: "Confirmée · pôle Restaurant · fiche KBS envoyée" },
    { sejour: 8, date: "2026-09-17", texte: "Confirmée · pôle Gouvernance · fiche KBS envoyée" },
  ],
};

// Tranche d'âge des bénévoles de démonstration.
window.SEED.benevoles.forEach((b, i) => { b.trancheAge = b.trancheAge || window.SEED.reglages.regles.tranchesAge[1 + (i % 5)]; });

// Textes de la fenêtre qui explique pourquoi le formulaire ne peut pas être envoyé.
window.SEED.reglages.messagesRefus = {
  fermeture: { nom: "Dates pendant une fermeture", FR: "Le Centre est fermé du {debut} au {fin} : merci de choisir d'autres dates.", EN: "The Centre is closed from {debut} to {fin}: please choose other dates." },
  duree: { nom: "Séjour trop court pour le pôle", FR: "Pour le pôle {pole}, le séjour dure au moins {min} jours (vous : {n} jours).", EN: "For the {pole} team, stays last at least {min} days (yours: {n} days)." },
  ordre: { nom: "Départ avant l'arrivée", FR: "La date de départ doit suivre la date d'arrivée.", EN: "The departure date must be after the arrival date." },
  passe: { nom: "Arrivée dans le passé", FR: "La date d'arrivée est déjà passée.", EN: "The arrival date is already past." },
  age: { nom: "Moins de 18 ans", FR: "Les séjours de bénévolat sont réservés aux personnes majeures (18 ans et plus).", EN: "Volunteering stays are for adults only (18 and over)." },
};
