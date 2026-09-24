/* Stockage et règles métier.
   Les données sont gardées dans le navigateur (localStorage) pour que la démo
   survive à un rechargement. Bouton « Réinitialiser la démo » dans Réglages. */
(function () {
  const CLE = "benevolat-cmk-demo-v1";
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
    if (s.souhaits[0] !== r.regles.exceptionDuree && D.ecart(s.arrivee, s.depart) < r.regles.dureeMin) out.push({ type: "alerte", txt: `Moins de ${r.regles.dureeMin} jours` });
    if (b && b.signale) out.push({ type: "alerte", txt: "Bénévole signalé" });
    const doublon = S.etat.benevoles.find((x) => x.id !== b.id && ((x.tel && x.tel === b.tel && x.indicatif === b.indicatif) || (x.nom === b.nom && x.prenom.toLowerCase() === b.prenom.toLowerCase())));
    if (doublon) out.push({ type: "alerte", txt: `Doublon possible : ${doublon.id}` });
    const chevauchement = S.etat.sejours.find((x) => x.benevole === s.benevole && x.id !== s.id && !S.ISSUES.includes(x.statut) && D.chevauche(s.arrivee, s.depart, x.arrivee, x.depart));
    if (chevauchement) out.push({ type: "alerte", txt: "Chevauche un autre séjour" });
    if (S.dejaVenu(s)) out.push({ type: "ok", txt: "Déjà venu · RDV facultatif" });
    return out;
  };

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
  S.montant = function (s) {
    const t = S.etat.reglages.tarifs, att = s.attestation;
    if (!att) return null;
    const jb = Object.keys(att.jours).length ? S.compte(att, "b") : Math.max(0, D.ecart(s.arrivee, s.depart) - 1 - s.repos.length);
    return { joursBenevolat: jb, nuits: jb * t.nuitDortoir, repas: jb * t.repasJour, lessive: (att.jetons || 0) * t.jetonLessive, total: jb * (t.nuitDortoir + t.repasJour) + (att.jetons || 0) * t.jetonLessive };
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
