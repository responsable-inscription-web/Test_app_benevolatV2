/* Stockage et règles métier.
   Les données sont gardées dans le navigateur (localStorage) pour que la démo
   survive à un rechargement. Bouton « Réinitialiser la démo » dans Réglages. */
(function () {
  const CLE = "benevolat-cmk-demo-v3";
  const S = {};

  S.charger = function () {
    try {
      const brut = localStorage.getItem(CLE);
      if (brut) return JSON.parse(brut);
    } catch (e) { /* stockage indisponible : on repart des données de démo */ }
    return JSON.parse(JSON.stringify(window.SEED));
  };
  S.etat = S.charger();
  S.sauver = function () {
    try { localStorage.setItem(CLE, JSON.stringify(S.etat)); } catch (e) { /* ignoré */ }
  };
  S.reinitialiser = function () {
    try { localStorage.removeItem(CLE); } catch (e) { /* ignoré */ }
    S.etat = JSON.parse(JSON.stringify(window.SEED));
  };

  // ---------- Dates (chaînes AAAA-MM-JJ, calculs en UTC) ----------
  const D = {};
  D.parse = (iso) => { const [a, m, j] = iso.split("-").map(Number); return Date.UTC(a, m - 1, j); };
  D.iso = (t) => new Date(t).toISOString().slice(0, 10);
  D.ajouter = (iso, n) => D.iso(D.parse(iso) + n * 86400000);
  D.ecart = (a, b) => Math.round((D.parse(b) - D.parse(a)) / 86400000);
  D.jourSemaine = (iso) => new Date(D.parse(iso)).getUTCDay(); // 0 = dimanche
  D.lundi = (iso) => D.ajouter(iso, -((D.jourSemaine(iso) + 6) % 7));
  D.plage = (debut, n) => Array.from({ length: n }, (_, i) => D.ajouter(debut, i));
  const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const MOIS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
  D.court = (iso, lang) => { const d = new Date(D.parse(iso)); return lang === "EN" ? `${MOIS_EN[d.getUTCMonth()]} ${d.getUTCDate()}` : `${d.getUTCDate()} ${MOIS[d.getUTCMonth()]}`; };
  D.jour = (iso) => JOURS[D.jourSemaine(iso)];
  D.fr = (iso) => { const [a, m, j] = iso.split("-"); return `${j}/${m}/${a}`; };
  D.chevauche = (a1, b1, a2, b2) => a1 <= b2 && b1 >= a2;
  S.D = D;
  S.aujourdhui = () => window.DEMO_TODAY;

  // ---------- Accès ----------
  S.benevole = (id) => S.etat.benevoles.find((b) => b.id === id);
  S.sejour = (id) => S.etat.sejours.find((s) => s.id === Number(id));
  S.sejoursDe = (idB) => S.etat.sejours.filter((s) => s.benevole === idB).sort((a, b) => b.arrivee.localeCompare(a.arrivee));
  S.nom = (b) => (b ? `${b.prenom} ${b.nom}` : "?");
  S.pole = (nom) => S.etat.reglages.poles.find((p) => p.nom === nom);
  S.historiqueDe = (idS) => S.etat.historique.filter((h) => h.sejour === idS).sort((a, b) => b.date.localeCompare(a.date));
  S.tracer = (idS, texte) => S.etat.historique.push({ sejour: idS, date: S.aujourdhui(), texte });

  // ---------- Parcours ----------
  S.STATUTS = ["Reçue", "RDV proposé", "RDV fait", "Acceptée", "Confirmée", "Arrivé·e", "Parti·e"];
  S.ISSUES = ["Liste d'attente", "Refusée", "Désistée"];
  S.enCours = (s) => ["Reçue", "RDV proposé", "RDV fait", "Acceptée"].includes(s.statut);
  S.dejaVenu = (s) => S.etat.sejours.some((x) => x.benevole === s.benevole && x.id !== s.id && x.statut === "Parti·e");

  // Contrôles automatiques : ils alertent, ils ne décident jamais.
  S.alertes = function (s) {
    const r = S.etat.reglages, out = [];
    const b = S.benevole(s.benevole);
    for (const f of r.fermetures) if (D.chevauche(s.arrivee, s.depart, f.debut, f.fin)) out.push({ type: "alerte", txt: `Fermeture ${D.court(f.debut)} – ${D.court(f.fin)}` });
    const pDuree = s.pole || s.souhaits[0], min = S.dureeMin(pDuree);
    if (D.ecart(s.arrivee, s.depart) < min) out.push({ type: "alerte", txt: `Moins de ${min} jours (${pDuree})` });
    if (b && b.signale) out.push({ type: "alerte", txt: "Bénévole signalé" });
    const doublon = S.etat.benevoles.find((x) => x.id !== b.id && ((x.tel && x.tel === b.tel && x.indicatif === b.indicatif) || (x.nom === b.nom && x.prenom.toLowerCase() === b.prenom.toLowerCase())));
    if (doublon) out.push({ type: "alerte", txt: `Doublon possible : ${doublon.id}` });
    const chevauchement = S.etat.sejours.find((x) => x.benevole === s.benevole && x.id !== s.id && !S.ISSUES.includes(x.statut) && D.chevauche(s.arrivee, s.depart, x.arrivee, x.depart));
    if (chevauchement) out.push({ type: "alerte", txt: "Chevauche un autre séjour" });
    if (S.dejaVenu(s)) out.push({ type: "ok", txt: "Déjà venu · RDV facultatif" });
    return out;
  };

  // Contrôles bloquants du formulaire (et de la saisie manuelle) : renvoie les motifs de refus.
  S.dureeMin = (nom) => { const p = S.pole(nom); return p && p.dureeMin != null ? p.dureeMin : 8; };
  S.controles = function (a, d, pole, tranche, lang) {
    const r = S.etat.reglages, M = r.messagesRefus, L = lang === "EN" ? "EN" : "FR", out = [];
    const msg = (k, v) => ({ code: k, titre: M[k].nom, txt: M[k][L].replace(/\{(\w+)\}/g, (m, x) => (x in v ? v[x] : m)) });
    if (tranche && tranche === r.regles.tranchesAge[0]) out.push(msg("age", {}));
    if (!a || !d) return out;
    if (d <= a) { out.push(msg("ordre", {})); return out; }
    if (a < S.aujourdhui()) out.push(msg("passe", {}));
    for (const f of r.fermetures) if (D.chevauche(a, d, f.debut, f.fin)) out.push(msg("fermeture", { debut: D.court(f.debut, L), fin: D.court(f.fin, L) }));
    const min = S.dureeMin(pole), n = D.ecart(a, d);
    if (n < min) out.push(msg("duree", { pole, min, n }));
    return out;
  };
  // Capacité d'un pôle un jour donné : celle saisie par le responsable pour la semaine, sinon la capacité par défaut.
  S.capacite = function (nom, j) {
    const p = S.pole(nom); if (!p) return 0;
    const w = (p.capaSemaines || {})[D.lundi(j)];
    return w != null ? w : p.capacite;
  };
  // KBS n'est jamais mis à jour automatiquement : on note ce qui change après l'envoi de la fiche.
  S.ficheKbsEnvoyee = (s) => ["Confirmée", "Arrivé·e"].includes(s.statut);
  S.noterKbs = function (s, quoi, avant, apres) {
    if (!S.ficheKbsEnvoyee(s) || avant === apres) return;
    S.etat.kbs.push({ sejour: s.id, date: S.aujourdhui(), quoi, avant, apres, fait: false });
    S.tracer(s.id, `À reporter dans KBS : ${quoi} (${avant} → ${apres})`);
  };
  S.kbsAFaire = () => S.etat.kbs.filter((k) => !k.fait);

  // Mail simulé : on l'inscrit dans l'historique (aucun envoi réel dans la démo).
  S.envoyerMail = function (s, cle) {
    const b = S.benevole(s.benevole);
    const m = S.etat.reglages.modeles[cle];
    S.tracer(s.id, `Mail « ${m.nom} » envoyé (${b.langue}) à ${b.email}`);
  };
  S.remplir = function (texte, s, lang) {
    const b = S.benevole(s.benevole), r = S.etat.reglages.regles;
    const champs = {
      "prénom": b.prenom, "date_arrivée": D.fr(s.arrivee), "date_départ": D.fr(s.depart), "pôle": s.pole || s.souhaits[0],
      "gare": r.navetteGare, "plage_navette": r.navettePlage, "date_limite_navette": D.fr(D.ajouter(s.arrivee, -r.navetteDelaiJours)),
      "lien_rdv": lang === "EN" ? "https://cal.com/…/30minen" : "https://cal.com/…/30minfr",
      "lien_attestation": location.href.split("#")[0] + "#/attestation/" + s.id,
    };
    return texte.replace(/\{([^}]+)\}/g, (m, k) => (k in champs ? champs[k] : m));
  };

  // ---------- Présence et planning ----------
  S.presentLe = (s, j) => ["Confirmée", "Arrivé·e", "Parti·e"].includes(s.statut) && j >= s.arrivee && j <= s.depart;
  // État d'un jour pour un séjour : "arr", "dep", "travail", "repos" ou null.
  S.etatJour = function (s, j) {
    if (!S.presentLe(s, j)) return null;
    if (j === s.arrivee) return "arr";
    if (j === s.depart) return "dep";
    return s.repos.includes(j) ? "repos" : "travail";
  };
  S.auTravail = (pole, j) => S.etat.sejours.filter((s) => s.pole === pole && S.etatJour(s, j) === "travail").length;
  S.presents = (j) => S.etat.sejours.filter((s) => S.presentLe(s, j) && s.statut !== "Parti·e");
  S.evenementLe = (j) => S.etat.reglages.evenements.filter((e) => j >= e.debut && j <= e.fin).map((e) => e.nom).concat(
    S.etat.reglages.fermetures.filter((e) => j >= e.debut && j <= e.fin).map((e) => e.nom));
  // Règle des repos : pour chaque bloc complet de 7 jours de présence, au moins N repos.
  S.blocsRepos = function (s) {
    const n = S.etat.reglages.regles.reposParBloc, res = [];
    const jours = D.plage(D.ajouter(s.arrivee, 1), Math.max(0, D.ecart(s.arrivee, s.depart) - 1));
    for (let i = 0; i + 7 <= jours.length; i += 7) {
      const bloc = jours.slice(i, i + 7);
      const nb = bloc.filter((j) => s.repos.includes(j)).length;
      res.push({ fin: bloc[6], nb, ok: nb >= n });
    }
    return res;
  };

  // ---------- Attestation et remboursement ----------
  S.joursAttestables = (s) => D.plage(D.ajouter(s.arrivee, 1), Math.max(0, D.ecart(s.arrivee, s.depart) - 1));
  S.nouvelleAttestation = function (s) {
    const jours = {};
    for (const j of S.joursAttestables(s)) jours[j] = s.repos.includes(j) ? "r" : "b";
    return { statut: "en cours", jetons: 0, signeLe: null, jours };
  };
  S.compte = (att, code) => Object.values(att.jours || {}).filter((v) => v === code).length;
  S.ecarts = function (s) {
    const att = s.attestation; if (!att) return [];
    return Object.entries(att.jours)
      .map(([j, v]) => ({ jour: j, declare: v, planning: s.repos.includes(j) ? "r" : "b" }))
      .filter((e) => e.declare !== "a" && e.declare !== e.planning);
  };
  // Grilles tarifaires : changement au 1er mars et au 1er septembre (mois réglables).
  S.MOIS_TARIF = ["03-01", "09-01"];
  S.grilles = () => S.etat.reglages.tarifs.slice().sort((a, b) => a.debut.localeCompare(b.debut));
  // Grille en vigueur un jour donné (la plus récente dont le début est passé).
  S.tarifLe = function (j) {
    const g = S.grilles(); let t = g[0];
    for (const x of g) if (x.debut <= j) t = x;
    return t;
  };
  S.finGrille = function (g) {
    const suiv = S.grilles().find((x) => x.debut > g.debut);
    return suiv ? D.ajouter(suiv.debut, -1) : null;
  };
  // Prochaine date de changement après la dernière grille saisie.
  S.prochaineGrille = function () {
    const der = S.grilles().slice(-1)[0].debut; let an = Number(der.slice(0, 4));
    for (let k = 0; k < 4; k++) { for (const md of S.MOIS_TARIF) { const d = `${an}-${md}`; if (d > der) return d; } an++; }
  };
  S.joursBenevolat = function (s) {
    const att = s.attestation;
    if (att && Object.keys(att.jours).length) return Object.keys(att.jours).filter((j) => att.jours[j] === "b").sort();
    return S.joursAttestables(s).filter((j) => !s.repos.includes(j));
  };
  // Montant ventilé par grille : un séjour à cheval sur le 1er mars ou le 1er septembre a deux lignes.
  S.montant = function (s) {
    const att = s.attestation; if (!att) return null;
    const parGrille = new Map();
    for (const j of S.joursBenevolat(s)) {
      const t = S.tarifLe(j);
      if (!parGrille.has(t.debut)) parGrille.set(t.debut, { grille: t, jours: 0 });
      parGrille.get(t.debut).jours++;
    }
    const lignes = [...parGrille.values()].map((l) => ({ ...l, nuits: l.jours * l.grille.nuitDortoir, repas: l.jours * l.grille.repasJour }));
    // Jetons de lessive : tarif de la grille en vigueur le jour du départ (règle à valider avec la compta).
    const tJeton = S.tarifLe(s.depart);
    const lessive = (att.jetons || 0) * tJeton.jetonLessive;
    const jb = lignes.reduce((n, l) => n + l.jours, 0);
    return { joursBenevolat: jb, lignes, tJeton, nuits: lignes.reduce((n, l) => n + l.nuits, 0), repas: lignes.reduce((n, l) => n + l.repas, 0), lessive,
      total: lignes.reduce((n, l) => n + l.nuits + l.repas, 0) + lessive };
  };
  S.jetonsMax = (s) => Math.max(1, Math.ceil(D.ecart(s.arrivee, s.depart) / 7)) * S.etat.reglages.regles.lessiveMaxParSemaine;

  // ---------- Téléphone : longueur attendue du numéro national par indicatif ----------
  S.INDICATIFS = [
    ["France", "+33", 9, 9], ["Belgique", "+32", 8, 9], ["Suisse", "+41", 9, 9], ["Allemagne", "+49", 10, 11], ["Espagne", "+34", 9, 9],
    ["Italie", "+39", 9, 10], ["Portugal", "+351", 9, 9], ["Royaume-Uni", "+44", 10, 10], ["Irlande", "+353", 9, 9], ["Pays-Bas", "+31", 9, 9],
    ["Bulgarie", "+359", 8, 9], ["Pologne", "+48", 9, 9], ["États-Unis / Canada", "+1", 10, 10], ["Brésil", "+55", 10, 11], ["Mexique", "+52", 10, 10],
    ["Japon", "+81", 10, 10], ["Australie", "+61", 9, 9], ["Autre", "+", 6, 14],
  ];
  S.telValide = function (ind, num) {
    const n = num.replace(/\D/g, "").replace(/^0/, "");
    const def = S.INDICATIFS.find((x) => x[1] === ind) || S.INDICATIFS[S.INDICATIFS.length - 1];
    return { ok: n.length >= def[2] && n.length <= def[3], national: n };
  };
  S.telAffiche = (b) => `${b.indicatif} ${b.tel.replace(/(\d{1,3})(?=(\d{2})+$)/g, "$1 ").trim()}`;

  S.nouvelId = () => "BEN-" + String(Math.max(...S.etat.benevoles.map((b) => Number(b.id.slice(4)))) + 1).padStart(5, "0");

  window.S = S;
})();
