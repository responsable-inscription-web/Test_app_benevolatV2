/* Espace équipe : tableau de bord, demandes, bénévoles, planning, arrivées, attestations, réglages. */
(function () {
  const D = S.D, esc = U.esc;
  // État d'affichage (non enregistré)
  const V = window.V = { filtre: "a-traiter", recherche: "", choisi: null, edition: false, pole: "Restaurant", semaine: 0, passe: 0, defil: null, allerAuj: true, jour: null, ongletAtt: "signée", choisiAtt: null, ongletReg: "poles", modele: "rappel", langModele: "FR" };
  const A = window.A = window.A || {};
  const ok = (msg) => { S.sauver(); if (msg) U.toast(msg); R(); };

  // =====================================================================
  // Tableau de bord
  // =====================================================================
  window.vueTableau = function () {
    const auj = S.aujourdhui(), dans7 = D.ajouter(auj, 7);
    const presents = S.presents(auj);
    const capa = S.etat.reglages.poles.filter((p) => p.actif).reduce((t, p) => t + S.capacite(p.nom, auj), 0);
    const kbs = S.kbsAFaire();
    const aTraiter = S.etat.sejours.filter(S.enCours);
    const arrivees = S.etat.sejours.filter((s) => ["Confirmée", "Arrivé·e"].includes(s.statut) && s.arrivee > auj && s.arrivee <= dans7);
    const departs = S.etat.sejours.filter((s) => s.statut === "Arrivé·e" && s.depart >= auj && s.depart <= dans7);
    const navettes = arrivees.filter((s) => s.navette !== "Non" && !s.heureArrivee).length;
    const signees = departs.filter((s) => s.attestation && s.attestation.statut !== "en cours").length;

    const prioritaires = aTraiter.map((s) => ({ s, al: S.alertes(s) })).sort((a, b) => b.al.filter((x) => x.type === "alerte").length - a.al.filter((x) => x.type === "alerte").length).slice(0, 6);
    const actionDe = { "Reçue": "Inviter au RDV", "RDV proposé": "Noter le RDV", "RDV fait": "Accepter", "Acceptée": "Affecter un pôle" };
    const items = prioritaires.map(({ s, al }) => {
      const b = S.benevole(s.benevole);
      return `<div class="item"><div class="qui"><strong>${esc(S.nom(b))}</strong> <span class="doux">· ${U.periode(s)} · ${esc(s.pole || s.souhaits.join(", "))}</span><div style="margin-top:4px">${U.statutPuce(s.statut)} ${al.map((a) => U.puce(a.txt, a.type)).join(" ")}</div></div>
        <a class="btn sec" href="#/demandes" onclick="V.choisi=${s.id};V.filtre='tout'">${actionDe[s.statut]}</a></div>`;
    }).join("") || `<div class="vide">Rien à traiter.</div>`;

    const semaine = D.plage(D.lundi(auj), 7);
    const charges = S.etat.reglages.poles.filter((p) => p.actif).map((p) => {
      const moy = Math.round(semaine.reduce((t, j) => t + S.auTravail(p.nom, j), 0) / 7 * 10) / 10;
      const cap = S.capacite(p.nom, auj);
      const pct = cap ? Math.min(100, Math.round(moy / cap * 100)) : 0;
      return `<div style="margin-bottom:12px"><div class="ligne" style="padding:0 0 4px"><span style="color:var(--encre)">${esc(p.nom)}</span><strong>${moy} / ${cap}</strong></div><div class="jauge ${pct < 75 ? "basse" : ""}"><div style="width:${pct}%"></div></div></div>`;
    }).join("");
    const evts = S.etat.reglages.evenements.filter((e) => e.fin >= auj).slice(0, 3).map((e) => `<div class="encart" style="margin-top:8px"><strong>${esc(e.nom)}</strong> · ${D.court(e.debut)}${e.fin !== e.debut ? " → " + D.court(e.fin) : ""}</div>`).join("");

    const tuile = (t, n, s) => `<div class="carte"><div class="doux">${t}</div><div class="chiffre">${n}</div><div class="doux petit">${s}</div></div>`;
    return U.entete(`${D.jour(auj)} ${D.fr(auj)}`, "Bonjour, voici la journée", `<a class="btn" href="#/demandes" onclick="A.nouvelleSaisie()">+ Saisie manuelle</a>`) +
      `<div class="grille g4">${tuile("Présents aujourd'hui", presents.length, `pour ${capa} places au total`)}${tuile("Demandes à traiter", aTraiter.length, `${aTraiter.filter((s) => s.statut === "Reçue").length} nouvelles`)}${tuile("Arrivées (7 jours)", arrivees.length, `${navettes} navette(s) sans horaire`)}${tuile("Départs (7 jours)", departs.length, `${signees} attestation(s) signée(s)`)}</div>
      <div class="grille g21"><div><section class="carte"><h2>À traiter en priorité</h2>${items}</section>
      ${carteRdv()}
      ${kbs.length ? `<section class="carte" style="margin-top:16px"><div class="entete" style="margin-bottom:6px"><h2>À reporter dans KBS</h2><a class="btn sec" href="#/kbs">Voir la liste</a></div><div class="doux petit" style="margin-bottom:6px">Modifications faites après l'envoi de la fiche KBS : KBS n'est jamais mis à jour automatiquement.</div>${kbs.slice(0, 3).map(ligneKbs).join("")}</section>` : ""}</div>
      <section class="carte"><h2>Charge des pôles</h2><div class="doux petit" style="margin:-6px 0 12px">Moyenne au travail / capacité, cette semaine</div>${charges}${evts}</section></div>`;
  };

  // Bloc « RDV à venir » : alimenté en direct par le webhook Cal.com.
  function carteRdv() {
    const rdvs = S.rdvAVenir(7), orph = S.etat.rdvARattacher;
    const lignes = rdvs.map((s) => { const b = S.benevole(s.benevole); return `<div class="item"><div class="qui"><strong>${D.jour(s.rdv.debut.slice(0, 10))} ${D.court(s.rdv.debut.slice(0, 10))} · ${s.rdv.debut.slice(11, 16)}</strong> <span class="doux">· ${esc(S.nom(b))} · ${b.langue} · ${esc(s.souhaits[0])}</span></div><a class="btn sec" href="#/demandes" onclick="V.choisi=${s.id};V.filtre='tout'">Ouvrir</a></div>`; }).join("") || `<div class="doux petit">Aucun RDV dans les 7 jours.</div>`;
    const cand = S.etat.sejours.filter((s) => ["Reçue", "RDV proposé"].includes(s.statut));
    const orphs = orph.map((r, i) => `<div class="encart alerte" style="margin-top:8px"><strong>RDV à rattacher</strong> · ${esc(r.nom)} (${esc(r.email)}) · ${S.heure(r.debut)}
      <div class="doux petit">Réservé avec une adresse inconnue de l'outil.</div>
      <div style="display:flex;gap:8px;margin-top:6px;align-items:center"><select id="rat-${i}" aria-label="Demande à rattacher">${cand.map((s) => `<option value="${s.id}">${esc(S.nom(S.benevole(s.benevole)))} · ${U.periode(s)}</option>`).join("")}</select><button class="btn sec" onclick="A.rattacher(${i})">Rattacher</button></div></div>`).join("");
    return `<section class="carte" style="margin-top:16px"><div class="entete" style="margin-bottom:6px"><h2>RDV à venir</h2><span class="puce ok" title="Mis à jour par Cal.com à chaque réservation">Cal.com · en direct</span></div>${lignes}${orphs}
      <div class="doux petit" style="margin-top:8px">Démo : <a href="#/reglages" onclick="V.ongletReg='calcom'">simuler une réservation Cal.com</a>.</div></section>`;
  }
  A.rattacher = function (i) { S.rattacher(i, Number(document.getElementById("rat-" + i).value)); ok("RDV rattaché à la demande"); };

  // =====================================================================
  // Demandes
  // =====================================================================
  const FILTRES = [
    ["a-traiter", "À traiter", (s) => S.enCours(s)],
    ["recues", "Reçues", (s) => s.statut === "Reçue"],
    ["rdv", "RDV", (s) => ["RDV proposé", "RDV fait"].includes(s.statut)],
    ["acceptees", "Acceptées", (s) => s.statut === "Acceptée"],
    ["alertes", "Avec alerte", (s) => S.enCours(s) && S.alertes(s).some((a) => a.type === "alerte")],
    ["confirmees", "Confirmées", (s) => s.statut === "Confirmée"],
    ["attente", "Liste d'attente", (s) => s.statut === "Liste d'attente"],
    ["closes", "Refusées / désistées", (s) => ["Refusée", "Désistée"].includes(s.statut)],
    ["tout", "Tout", () => true],
  ];
  window.vueDemandes = function () {
    const f = FILTRES.find((x) => x[0] === V.filtre) || FILTRES[0];
    const q = V.recherche.toLowerCase();
    const liste = S.etat.sejours.filter(f[2]).filter((s) => { const b = S.benevole(s.benevole); return !q || `${b.prenom} ${b.nom} ${b.email} ${b.tel}`.toLowerCase().includes(q); })
      .sort((a, b) => a.arrivee.localeCompare(b.arrivee));
    const chips = FILTRES.map(([k, t, fn]) => `<button class="filtre ${V.filtre === k ? "on" : ""}" onclick="V.filtre='${k}';R()">${t} (${S.etat.sejours.filter(fn).length})</button>`).join("");
    const lignes = liste.map((s) => {
      const b = S.benevole(s.benevole);
      return `<tr class="clic ${V.choisi === s.id ? "choisi" : ""}" onclick="V.choisi=${s.id};V.edition=false;R()">
        <td><strong>${esc(S.nom(b))}</strong><div class="doux petit">${esc(b.pays)} · ${b.langue}</div></td><td>${U.periode(s)}</td>
        <td class="masquable">${esc(s.pole || s.souhaits.join(" · "))}</td><td>${U.statutPuce(s.statut)}</td><td class="masquable">${U.alertesPuces(s)}</td></tr>`;
    }).join("");
    const table = liste.length ? `<table class="liste"><thead><tr><th>Bénévole</th><th>Séjour</th><th class="masquable">Pôle</th><th>Statut</th><th class="masquable">À noter</th></tr></thead><tbody>${lignes}</tbody></table>` : `<div class="vide">Aucune demande dans ce filtre.</div>`;
    const choisi = S.sejour(V.choisi);
    return U.entete("Parcours des demandes", "Demandes", `<button class="btn" onclick="A.nouvelleSaisie()">+ Saisie manuelle</button>`) +
      `<div class="filtres">${chips}<input type="search" id="recherche" aria-label="Rechercher" placeholder="Nom, e-mail, téléphone" value="${esc(V.recherche)}" oninput="A.chercher(this.value)" style="max-width:280px;margin-left:auto"></div>
      <div class="duo"><section class="carte" style="padding:8px 16px">${table}</section>${choisi ? panneauDemande(choisi) : `<aside class="carte panneau"><div class="vide">Choisissez une demande pour voir son détail et agir.</div></aside>`}</div>`;
  };

  function panneauDemande(s) {
    const b = S.benevole(s.benevole), r = S.etat.reglages;
    const al = S.alertes(s);
    const poles = r.poles.filter((p) => p.actif).map((p) => `<option ${p.nom === (s.pole || s.souhaits[0]) ? "selected" : ""}>${esc(p.nom)}</option>`).join("");
    const pic = s.pole || s.souhaits[0];
    const jours = D.plage(s.arrivee, D.ecart(s.arrivee, s.depart) + 1);
    const occupMax = Math.max(0, ...jours.map((j) => S.auTravail(pic, j)));
    const capa = S.capacite(pic, s.arrivee);
    let actions = "";
    switch (s.statut) {
      case "Reçue": actions = `<button class="btn" onclick="A.statut(${s.id},'RDV proposé','invitation')">Inviter au RDV (${b.langue})</button><button class="btn sec" onclick="A.statut(${s.id},'Acceptée')">Accepter sans RDV</button>`; break;
      case "RDV proposé": actions = `<button class="btn" onclick="A.statut(${s.id},'RDV fait')">RDV réalisé</button><button class="btn sec" onclick="A.relancer(${s.id})">Relancer</button>`; break;
      case "RDV fait": actions = `<button class="btn" onclick="A.statut(${s.id},'Acceptée')">Accepter</button>`; break;
      case "Acceptée": actions = `<label for="p-${s.id}">Pôle affecté</label><select id="p-${s.id}">${poles}</select>
        <div class="doux petit" style="margin-top:6px">${esc(pic)} : jusqu'à ${occupMax} / ${capa} au travail sur la période</div>
        <button class="btn" style="margin-top:10px" onclick="A.confirmer(${s.id})">Confirmer le séjour</button>`; break;
      case "Confirmée": actions = `<button class="btn" onclick="A.statut(${s.id},'Arrivé·e')">Marquer arrivé·e</button>`; break;
      case "Liste d'attente": actions = `<button class="btn" onclick="A.statut(${s.id},'Reçue')">Reprendre la demande</button>`; break;
    }
    const issues = S.enCours(s) || s.statut === "Confirmée" ? `<div class="actions petit"><button class="btn lien" onclick="A.statut(${s.id},'Liste d\\'attente','attente')">Liste d'attente</button><button class="btn lien" onclick="A.statut(${s.id},'Refusée','refus')">Refuser</button><button class="btn lien" onclick="A.statut(${s.id},'Désistée','desistement')">Désistement</button></div>` : "";
    const edition = V.edition ? `<div class="grille g2"><div><label for="e-arr">Arrivée</label><input type="date" id="e-arr" value="${s.arrivee}"></div><div><label for="e-dep">Départ</label><input type="date" id="e-dep" value="${s.depart}"></div></div>
      <div class="actions"><button class="btn" onclick="A.dates(${s.id})">Enregistrer les dates</button><button class="btn sec" onclick="V.edition=false;R()">Annuler</button></div>` : "";
    const hist = S.historiqueDe(s.id).map((h) => `<div class="petit" style="padding:3px 0"><span class="doux">${D.fr(h.date)}</span> · ${esc(h.texte)}</div>`).join("") || `<div class="doux petit">Aucun événement.</div>`;
    return `<aside class="carte panneau" aria-label="Détail de la demande">
      <div class="entete" style="align-items:center"><h2><a href="#/benevoles/${b.id}">${esc(S.nom(b))}</a></h2>${U.statutPuce(s.statut)}</div>
      <div class="doux petit">${b.id} · ${esc(b.pays)} · mails en ${b.langue === "FR" ? "français" : "anglais"}</div>
      ${al.filter((a) => a.type === "alerte").map((a) => `<div class="encart alerte"><strong>${esc(a.txt)}</strong></div>`).join("")}
      <div><div class="ligne"><span>Séjour</span><strong>${U.periode(s)} (${D.ecart(s.arrivee, s.depart)} j)</strong></div>
      <div class="ligne"><span>Souhaits</span><span>${esc(s.souhaits.join(", "))}</span></div>
      ${["RDV proposé", "RDV fait"].includes(s.statut) ? `<div class="ligne"><span>RDV (Cal.com)</span><span>${s.rdv ? (s.rdv.statut === "annulé" ? "annulé par le bénévole" : "<strong>" + S.heure(s.rdv.debut) + "</strong>") : `pas encore réservé${s.inviteLe ? " · invité le " + D.fr(s.inviteLe) : ""}`}</span></div>` : ""}
      <div class="ligne"><span>Canal</span><span>${esc(s.canal)}</span></div>
      <div class="ligne"><span>Navette</span><span>${esc(s.navette)}${s.heureArrivee ? " · " + s.heureArrivee : ""}</span></div>
      <div class="ligne"><span>Téléphone</span><span>${esc(S.telAffiche(b))}</span></div>
      <div class="ligne"><span>Repas</span><span>${esc(b.regime)}</span></div></div>
      ${edition || `<button class="btn lien" onclick="V.edition=true;R()">Modifier les dates</button>`}
      <div style="display:flex;flex-direction:column;gap:8px">${actions}</div>${issues}
      <div class="doux petit" style="border-top:1px solid var(--trait2);padding-top:10px">Historique</div>${hist}</aside>`;
  }

  A.statut = function (id, statut, mail) {
    const s = S.sejour(id), avant = s.statut;
    if (statut === "Désistée" && S.ficheKbsEnvoyee(s)) S.noterKbs(s, "Séjour annulé", avant, "Désistée");
    s.statut = statut;
    S.tracer(id, `${avant} → ${statut}`);
    if (mail) S.envoyerMail(s, mail);
    if (mail === "invitation") s.inviteLe = S.aujourdhui();
    ok(`${S.nom(S.benevole(s.benevole))} : ${statut}`);
  };
  A.relancer = (id) => { const s = S.sejour(id); S.envoyerMail(s, "invitation"); s.inviteLe = S.aujourdhui(); ok("Relance envoyée (simulée)"); };
  A.confirmer = function (id) {
    const s = S.sejour(id);
    s.pole = document.getElementById("p-" + id).value;
    s.statut = "Confirmée";
    S.tracer(id, `Confirmée · pôle ${s.pole}`);
    S.envoyerMail(s, "confirmation");
    S.tracer(id, "Fiche KBS envoyée à benevolat@ (simulé)");
    ok("Séjour confirmé · mail et fiche KBS envoyés (simulés)");
  };
  A.dates = function (id) {
    const s = S.sejour(id), a = document.getElementById("e-arr").value, d = document.getElementById("e-dep").value;
    if (!a || !d) { U.toast("Dates invalides"); return; }
    // Même contrôle que le formulaire public : fermetures, durée minimale du pôle.
    const refus = S.controles(a, d, s.pole || s.souhaits[0], null, "FR").filter((x) => x.code !== "passe");
    if (refus.length) { U.fenetre("Ces dates ne sont pas possibles", refus.map((x) => x.txt), "Corriger les dates"); return; }
    S.noterKbs(s, "Dates", `${D.fr(s.arrivee)} → ${D.fr(s.depart)}`, `${D.fr(a)} → ${D.fr(d)}`);
    S.tracer(id, `Dates modifiées : ${D.fr(s.arrivee)}–${D.fr(s.depart)} → ${D.fr(a)}–${D.fr(d)}`);
    s.arrivee = a; s.depart = d; s.repos = s.repos.filter((j) => j > a && j < d); V.edition = false;
    ok(S.ficheKbsEnvoyee(s) ? "Dates mises à jour · à reporter dans KBS" : "Dates mises à jour");
  };
  A.chercher = function (v) { V.recherche = v; R(); const e = document.getElementById("recherche"); if (e) { e.focus(); e.setSelectionRange(v.length, v.length); } };
  A.nouvelleSaisie = () => { location.hash = "#/formulaire?interne=1"; };

  // =====================================================================
  // Bénévoles et fiche
  // =====================================================================
  window.vueBenevoles = function (id) {
    if (id) return vueFiche(S.benevole(id));
    const q = V.recherche.toLowerCase();
    const liste = S.etat.benevoles.filter((b) => !b.efface && (!q || `${b.prenom} ${b.nom} ${b.email}`.toLowerCase().includes(q))).sort((a, b) => a.nom.localeCompare(b.nom));
    const lignes = liste.map((b) => {
      const ss = S.sejoursDe(b.id), dernier = ss[0];
      return `<tr class="clic" onclick="location.hash='#/benevoles/${b.id}'"><td><strong>${esc(S.nom(b))}</strong><div class="doux petit">${b.id}</div></td><td class="masquable">${esc(b.email)}</td><td>${esc(b.pays)}</td><td class="centre">${ss.length}</td><td>${dernier ? U.statutPuce(dernier.statut) + ` <span class="doux petit">${U.periode(dernier)}</span>` : ""}</td><td>${b.signale ? U.puce("Signalé", "alerte") : ""}</td></tr>`;
    }).join("");
    return U.entete("Une fiche par personne, tous ses séjours", "Bénévoles") +
      `<div class="filtres"><input type="search" id="recherche" aria-label="Rechercher un bénévole" placeholder="Nom, e-mail" value="${esc(V.recherche)}" oninput="A.chercher(this.value)" style="max-width:320px"></div>
      <section class="carte" style="padding:8px 16px"><table class="liste"><thead><tr><th>Bénévole</th><th class="masquable">E-mail</th><th>Pays</th><th class="centre">Séjours</th><th>Dernier séjour</th><th></th></tr></thead><tbody>${lignes}</tbody></table></section>`;
  };

  function frise(s) {
    const etapes = ["Reçue", "RDV", "Acceptée", "Confirmée", "Arrivé·e", "Parti·e"];
    const idx = { "Reçue": 0, "RDV proposé": 1, "RDV fait": 1, "Acceptée": 2, "Confirmée": 3, "Arrivé·e": 4, "Parti·e": 5 }[s.statut];
    if (idx === undefined) return `<div class="encart">${U.statutPuce(s.statut)} Séjour sorti du parcours.</div>`;
    return `<ol class="frise" style="grid-template-columns:repeat(6,minmax(0,1fr))">${etapes.map((e, i) => `<li class="${i < idx ? "fait" : i === idx ? "courant" : ""}"><div class="barre"></div><strong>${e}</strong><span class="doux petit">${i === 3 && s.pole ? esc(s.pole) : i === 4 ? D.court(s.arrivee) : i === 5 ? D.court(s.depart) : ""}</span></li>`).join("")}</ol>`;
  }

  function vueFiche(b) {
    if (!b) return `<div class="vide">Fiche introuvable.</div>`;
    const ss = S.sejoursDe(b.id);
    const courant = ss.find((s) => !["Parti·e", "Refusée", "Désistée"].includes(s.statut)) || ss[0];
    const sejours = ss.map((s) => `<div class="item"><div class="qui"><strong>${U.periode(s)} ${s.arrivee.slice(0, 4)}</strong> <span class="doux">· ${esc(s.pole || "pôle à choisir")} · ${D.ecart(s.arrivee, s.depart)} jours</span></div>${U.statutPuce(s.statut)}${s.attestation ? U.puce("Attestation " + s.attestation.statut, "neutre") : ""}<a class="btn lien" href="#/demandes" onclick="V.choisi=${s.id};V.filtre='tout'">Ouvrir</a></div>`).join("");
    const coms = b.commentaires.map((c) => `<div class="encart" style="margin-bottom:8px">« ${esc(c.texte)} » <span class="doux petit">— ${esc(c.auteur)}, ${D.fr(c.date)}</span></div>`).join("") || `<div class="doux petit">Aucun commentaire.</div>`;
    return `<div class="petit"><a href="#/benevoles">Bénévoles</a> / ${esc(S.nom(b))}</div>` +
      U.entete(`${b.id} · ${esc(b.pays)} · ${ss.length} séjour(s)`, esc(S.nom(b)), `<button class="btn sec" onclick="A.exporter('${b.id}')">Exporter ses données</button><button class="btn" onclick="A.nouvelleSaisie()">Nouveau séjour</button>`) +
      (b.signale ? `<div class="encart alerte"><strong>Bénévole signalé.</strong> ${esc(b.motifSignalement)} — la coordination est prévenue à chaque nouvelle demande.</div>` : "") +
      (courant ? `<section class="carte"><div class="entete" style="margin-bottom:14px"><h2>Séjour ${U.periode(courant)}</h2><span class="doux petit">${esc(courant.canal)}</span></div>${frise(courant)}</section>` : "") +
      `<div class="grille g3"><section class="carte"><h2>Coordonnées</h2>
        <div class="ligne"><span>E-mail</span><span>${esc(b.email)}</span></div><div class="ligne"><span>Téléphone</span><span>${esc(S.telAffiche(b))}</span></div>
        <div class="ligne"><span>Langue des mails</span><span>${b.langue}</span></div><div class="ligne"><span>Repas</span><span>${esc(b.regime)}</span></div>
        <div class="ligne"><span>Urgence</span><span>${esc(b.urgence || "—")}</span></div>
        <div class="encart petit" style="margin-top:10px">Santé et besoins particuliers : visibles par la coordination uniquement, effacés 1 mois après le départ.</div></section>
      <section class="carte"><h2>Séjours</h2>${sejours}</section>
      <section class="carte"><h2>Commentaires internes</h2>${coms}
        <label for="com">Ajouter un commentaire</label><textarea id="com" rows="2"></textarea>
        <div class="actions" style="margin-top:8px"><button class="btn" onclick="A.commenter('${b.id}')">Enregistrer</button></div>
        <label class="inline" style="margin-top:14px"><input type="checkbox" ${b.signale ? "checked" : ""} onchange="A.signaler('${b.id}', this.checked)"> Signaler ce bénévole (alerte seulement)</label></section></div>
      <section class="carte"><h2>Données personnelles</h2><div class="actions"><span class="doux">Droit d'accès : export JSON. Droit à l'effacement : la fiche et ses séjours sont anonymisés.</span><button class="btn sec" onclick="A.effacer('${b.id}')">Effacer ce bénévole</button></div></section>`;
  }

  A.commenter = function (id) {
    const t = document.getElementById("com").value.trim(); if (!t) return;
    S.benevole(id).commentaires.push({ auteur: "Coordination", date: S.aujourdhui(), texte: t });
    ok("Commentaire enregistré");
  };
  A.signaler = function (id, v) {
    const b = S.benevole(id);
    if (v) { const m = prompt("Motif du signalement (visible par la coordination) :", ""); if (m === null) { R(); return; } b.motifSignalement = m; }
    b.signale = v; ok(v ? "Bénévole signalé" : "Signalement retiré");
  };
  A.exporter = function (id) {
    const b = S.benevole(id), data = { benevole: b, sejours: S.sejoursDe(id) };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    a.download = `${id}.json`; a.click();
  };
  A.effacer = function (id) {
    if (!confirm("Effacer ce bénévole ? Ses données personnelles seront anonymisées (irréversible).")) return;
    const b = S.benevole(id);
    Object.assign(b, { prenom: "Anonyme", nom: id, email: "", tel: "", urgence: "", commentaires: [], signale: false, motifSignalement: "", efface: true });
    S.sejoursDe(id).forEach((s) => { s.sante = ""; S.tracer(s.id, "Données personnelles effacées à la demande du bénévole"); });
    location.hash = "#/benevoles"; ok("Bénévole anonymisé");
  };

  // =====================================================================
  // Planning d'un pôle
  // =====================================================================
  // Planning défilant : toutes les semaines, de la semaine en cours (ou avant) à la dernière date de départ connue.
  const PRESENTS = ["Confirmée", "Arrivé·e", "Parti·e"];
  function plageDefilante(poles) {
    const auj = S.aujourdhui();
    const debut = D.ajouter(D.lundi(auj), -7 * (V.passe || 0));
    const departs = S.etat.sejours.filter((s) => PRESENTS.includes(s.statut) && poles.includes(s.pole)).map((s) => s.depart);
    let fin = departs.reduce((m, d) => (d > m ? d : m), D.ajouter(debut, 27));
    fin = D.ajouter(D.lundi(fin), 6);
    return D.plage(debut, D.ecart(debut, fin) + 1);
  }
  // Grille d'un ou plusieurs pôles. opts.satellite : vue du responsable (capacité modifiable semaine par semaine).
  function grille(poles, jours, opts = {}) {
    const auj = S.aujourdhui(), MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
    const lundi = (j) => (D.jourSemaine(j) === 1 ? " lundi" : "");
    // Ligne des mois
    const mois = []; jours.forEach((j) => { const m = j.slice(0, 7); if (!mois.length || mois[mois.length - 1].m !== m) mois.push({ m, n: 1 }); else mois[mois.length - 1].n++; });
    const tMois = mois.map((x) => `<th colspan="${x.n}" class="mois">${MOIS[Number(x.m.slice(5)) - 1]} ${x.m.slice(0, 4)}</th>`).join("");
    const tJours = jours.map((j) => `<th class="jour${lundi(j)}${j === auj ? " aujourdhui" : ""}" ${j === auj ? 'id="col-auj"' : ""}>${D.jour(j).replace(".", "")}<br><strong>${Number(j.slice(8))}</strong></th>`).join("");
    const tEvts = jours.map((j) => { const e = S.evenementLe(j); return `<th class="ev${lundi(j)}">${e.length ? `<span class="pastev" title="${esc(e.join(" / "))}">${esc(e[0].split(" ")[0].slice(0, 5))}</span>` : ""}</th>`; }).join("");
    const nb = jours.length + 1;
    const blocs = poles.map((nom) => {
      const p = S.pole(nom);
      const ss = S.etat.sejours.filter((s) => s.pole === nom && PRESENTS.includes(s.statut) && s.depart >= jours[0] && s.arrivee <= jours[jours.length - 1]).sort((a, b) => a.arrivee.localeCompare(b.arrivee));
      const bandeau = opts.satellite ? "" : `<tr class="bandeau"><td class="nom" colspan="1"><strong>${esc(nom)}</strong> <a class="petit" href="#/satellite/${encodeURIComponent(nom)}" target="_blank" rel="noopener" title="Vue du responsable de pôle">satellite ↗</a></td><td colspan="${jours.length}"></td></tr>`;
      const capa = opts.satellite ? `<tr class="capa"><td class="nom doux petit">Capacité / jour (semaine)</td>${jours.filter((j) => D.jourSemaine(j) === 1 || j === jours[0]).map((l) => { const n = Math.min(7 - ((D.jourSemaine(l) + 6) % 7), D.ecart(l, jours[jours.length - 1]) + 1); const w = (p.capaSemaines || {})[D.lundi(l)]; return `<td colspan="${n}" class="lundi"><input type="number" min="0" aria-label="Capacité semaine du ${D.court(D.lundi(l))}" value="${w != null ? w : p.capacite}" onchange="A.capaSemaine('${esc(nom)}','${D.lundi(l)}',this.value)"${w != null ? "" : ' title="Capacité par défaut du pôle"'}></td>`; }).join("")}</tr>` : "";
      const compte = `<tr><td class="nom doux petit">Au travail / capacité</td>${jours.map((j) => { const n = S.auTravail(nom, j), cap = S.capacite(nom, j); return `<td class="compteur${lundi(j)} ${n < cap ? "bas" : "bon"}" title="${n} au travail / capacité ${cap}">${n}<span class="sur">/${cap}</span></td>`; }).join("")}</tr>`;
      const lignes = ss.map((s) => {
        const b = S.benevole(s.benevole), manque = S.blocsRepos(s).filter((x) => !x.ok).length;
        const cases = jours.map((j) => {
          const e = S.etatJour(s, j);
          if (!e) return `<td class="j hors${lundi(j)}"></td>`;
          const txt = { arr: "Arr", dep: "Dép", travail: "✓", repos: "R" }[e];
          const clic = e === "travail" || e === "repos" ? ` onclick="A.repos(${s.id},'${j}')" title="${esc(S.nom(b))} · ${D.fr(j)} : cliquer pour ${e === "repos" ? "retirer" : "poser"} un repos"` : ` title="${e === "arr" ? "Arrivée" + (s.heureArrivee ? " " + s.heureArrivee : "") : "Départ"}"`;
          return `<td class="j ${e}${lundi(j)}"${clic}>${txt}</td>`;
        }).join("");
        const nomB = opts.satellite ? esc(S.nom(b)) : `<a href="#/benevoles/${b.id}">${esc(S.nom(b))}</a>`;
        return `<tr><td class="nom">${nomB}${manque ? ` <span title="Repos insuffisants sur ${manque} bloc(s) de 7 jours">${U.puce("repos ?", "alerte")}</span>` : ""}</td>${cases}</tr>`;
      }).join("") || `<tr><td class="nom doux petit">Aucun bénévole confirmé</td><td colspan="${jours.length}"></td></tr>`;
      return bandeau + capa + compte + lignes;
    }).join("");
    return `<div class="defil" id="defil" onscroll="V.defil={x:this.scrollLeft,y:this.scrollTop}"><table class="gp"><thead>
      <tr><th class="coin" rowspan="3">${opts.satellite ? "Bénévole" : "Pôle / bénévole"}</th>${tMois}</tr><tr>${tJours}</tr><tr>${tEvts}</tr></thead><tbody>${blocs}</tbody></table></div>`;
  }
  // Après l'affichage : garder la position de défilement, ou se placer sur aujourd'hui.
  function defilement() {
    window.apres = () => {
      const d = document.getElementById("defil"); if (!d) return;
      if (V.defil && !V.allerAuj) { d.scrollLeft = V.defil.x; d.scrollTop = V.defil.y; return; }
      const c = document.getElementById("col-auj");
      if (c) d.scrollLeft = Math.max(0, d.scrollLeft + c.getBoundingClientRect().left - d.getBoundingClientRect().left - d.querySelector(".coin").offsetWidth - 4);
      V.allerAuj = false; V.defil = { x: d.scrollLeft, y: d.scrollTop };
    };
  }
  A.aujourdhui = () => { V.allerAuj = true; R(); };
  A.passe = (n) => { V.passe = Math.max(0, (V.passe || 0) + n); V.allerAuj = true; R(); };
  const legendePlanning = () => `<div class="legende"><span><i style="background:var(--ok)"></i>✓ Au travail</span><span><i style="background:var(--repos)"></i>R Repos</span><span><i style="background:var(--info)"></i>Arrivée / départ</span><span><i style="background:var(--violet)"></i>Événement</span>
      <span class="doux">Cliquer sur un jour pour poser ou retirer un repos. Règle : ${S.etat.reglages.regles.reposParBloc} repos par bloc de 7 jours de présence.</span></div>`;

  window.vuePlanning = function () {
    const poles = S.etat.reglages.poles.filter((p) => p.actif).map((p) => p.nom);
    const jours = plageDefilante(poles);
    defilement();
    return U.entete("Tous les pôles, toutes les semaines à venir", "Planning global",
      `<button class="btn sec" onclick="A.passe(4)">← 4 semaines passées</button>${V.passe ? `<button class="btn sec" onclick="A.passe(-${V.passe})">Masquer le passé</button>` : ""}<button class="btn sec" onclick="A.aujourdhui()">Aujourd'hui</button><button class="btn" onclick="print()">Imprimer</button>`) +
      `<div class="doux petit" style="margin:-8px 0 10px">Du ${D.fr(jours[0])} au ${D.fr(jours[jours.length - 1])} (dernier départ connu). Faites défiler vers la droite pour les semaines suivantes. Chaque responsable a sa propre vue : lien « satellite » à côté du nom du pôle.</div>
      <section class="carte" style="padding:6px">${grille(poles, jours)}</section>${legendePlanning()}`;
  };

  // Satellite d'un pôle : la vue du responsable, sans le reste de l'outil.
  window.vueSatellitePole = function (nom) {
    const p = S.pole(nom);
    if (!p) return `<div class="public"><div class="vide">Pôle introuvable.</div></div>`;
    const jours = plageDefilante([nom]), auj = S.aujourdhui(), dans7 = D.ajouter(auj, 7);
    defilement();
    const mouv = S.etat.sejours.filter((s) => s.pole === nom && ["Confirmée", "Arrivé·e"].includes(s.statut) && ((s.arrivee >= auj && s.arrivee <= dans7) || (s.depart >= auj && s.depart <= dans7)))
      .map((s) => { const b = S.benevole(s.benevole), arr = s.arrivee >= auj && s.arrivee <= dans7; return { d: arr ? s.arrivee : s.depart, t: `${arr ? "Arrivée" : "Départ"} de <strong>${esc(S.nom(b))}</strong>${arr && s.heureArrivee ? " vers " + s.heureArrivee : ""}` }; })
      .sort((a, b) => a.d.localeCompare(b.d)).map((x) => `<div class="item"><div class="qui">${D.jour(x.d)} ${D.court(x.d)} · ${x.t}</div></div>`).join("") || `<div class="doux petit">Aucun mouvement dans les 7 jours.</div>`;
    return `<div class="satellite"><div class="sat-haut"><div><div class="sur">Satellite · espace responsable de pôle</div><h1>Pôle ${esc(nom)}</h1><div class="doux petit">${esc(p.responsable || "responsable à renseigner")} · même base que la coordination : vos repos sont visibles tout de suite par tous.</div></div>
      <div class="actions noprint"><button class="btn sec" onclick="A.passe(4)">← Semaines passées</button><button class="btn sec" onclick="A.aujourdhui()">Aujourd'hui</button><button class="btn" onclick="print()">Imprimer</button></div></div>
      <section class="carte" style="padding:6px">${grille([nom], jours, { satellite: true })}</section>${legendePlanning()}
      <section class="carte" style="margin-top:16px"><h2>Arrivées et départs des 7 prochains jours</h2>${mouv}</section>
      <div class="doux petit noprint" style="margin-top:14px">Démo : dans l'outil réel, le responsable arrive ici par un lien personnel et ne voit que son pôle.</div></div>`;
  };

  // Satellite de l'accueil : arrivées, départs, navettes — sans le reste de l'outil.
  window.vueSatelliteAccueil = function () {
    const auj = S.aujourdhui(), dans7 = D.ajouter(auj, 7);
    const semaine = S.etat.sejours.filter((s) => ["Confirmée", "Arrivé·e"].includes(s.statut) && s.arrivee > auj && s.arrivee <= dans7).sort((a, b) => a.arrivee.localeCompare(b.arrivee));
    const lignes = semaine.map((s) => { const b = S.benevole(s.benevole); return `<tr><td>${D.jour(s.arrivee)} ${D.court(s.arrivee)}</td><td><strong>${esc(S.nom(b))}</strong><div class="doux petit">${esc(s.pole)}</div></td><td>${s.heureArrivee || "—"}</td><td>${s.navette === "Oui" ? U.puce("Navette", "ok") : s.navette === "Non" ? U.puce("Par ses moyens", "neutre") : U.puce("À confirmer", "alerte")}</td><td class="masquable">${esc(S.telAffiche(b))}</td></tr>`; }).join("");
    return `<div class="satellite"><div class="sat-haut"><div><div class="sur">Satellite · accueil et navettes</div><h1>Accueil</h1><div class="doux petit">Même base que la coordination : les arrivées pointées ici sont visibles tout de suite par tous.</div></div></div>
      ${window.vueArrivees(true)}
      <section class="carte"><h2>Arrivées des 7 prochains jours</h2>${semaine.length ? `<table class="liste"><thead><tr><th>Jour</th><th>Bénévole</th><th>Heure</th><th>Transport</th><th class="masquable">Téléphone</th></tr></thead><tbody>${lignes}</tbody></table>` : `<div class="vide">Aucune arrivée prévue.</div>`}</section>
      <div class="doux petit" style="margin-top:14px">Démo : dans l'outil réel, l'accueil arrive ici par son propre lien et ne voit ni les demandes, ni la santé, ni les commentaires internes.</div></div>`;
  };

  A.capaSemaine = function (nom, lundi, v) {
    const p = S.pole(nom); p.capaSemaines = p.capaSemaines || {};
    if (v === "") delete p.capaSemaines[lundi]; else p.capaSemaines[lundi] = Number(v);
    ok(`Capacité de la semaine du ${D.court(lundi)} : ${v}`);
  };

  // =====================================================================
  // À reporter dans KBS (KBS vit dans son propre système : pas de mise à jour automatique)
  // =====================================================================
  function ligneKbs(k) {
    const s = S.sejour(k.sejour), b = S.benevole(s.benevole), i = S.etat.kbs.indexOf(k);
    return `<div class="item"><div class="qui"><strong>${esc(S.nom(b))}</strong> <span class="doux">· ${esc(k.quoi)} · modifié le ${D.fr(k.date)}</span>
      <div class="petit" style="margin-top:4px"><span class="doux">Avant :</span> ${esc(k.avant)} &nbsp; <span class="doux">Maintenant :</span> <strong>${esc(k.apres)}</strong></div></div>
      <label class="inline" style="margin:0;white-space:nowrap"><input type="checkbox" ${k.fait ? "checked" : ""} onchange="A.kbsFait(${i},this.checked)"> Reporté dans KBS</label></div>`;
  }
  window.vueKbs = function () {
    const afaire = S.kbsAFaire(), faits = S.etat.kbs.filter((k) => k.fait);
    return U.entete("Espace inscriptions", "À reporter dans KBS") +
      `<div class="encart">KBS et cet outil ne se synchronisent pas. Quand un séjour change après l'envoi de la fiche KBS (dates, annulation…), il apparaît ici. Cochez une fois la modification ressaisie dans KBS.</div>
      <section class="carte"><h2>À faire (${afaire.length})</h2>${afaire.map(ligneKbs).join("") || `<div class="vide">Rien à reporter.</div>`}</section>
      <section class="carte"><h2>Déjà reportées (${faits.length})</h2>${faits.map(ligneKbs).join("") || `<div class="doux petit">Aucune.</div>`}</section>`;
  };
  A.kbsFait = (i, v) => { const k = S.etat.kbs[i]; k.fait = v; S.tracer(k.sejour, v ? `Reporté dans KBS : ${k.quoi}` : `Report KBS annulé : ${k.quoi}`); ok(v ? "Noté comme reporté dans KBS" : "Remis à faire"); };

  A.repos = function (id, j) {
    const s = S.sejour(id);
    s.repos = s.repos.includes(j) ? s.repos.filter((x) => x !== j) : [...s.repos, j].sort();
    ok();
  };

  // =====================================================================
  // Arrivées et navettes
  // =====================================================================
  window.vueArrivees = function (satellite) {
    const j = V.jour || S.aujourdhui(), r = S.etat.reglages.regles;
    const arr = S.etat.sejours.filter((s) => s.arrivee === j && ["Confirmée", "Arrivé·e"].includes(s.statut)).sort((a, b) => (a.heureArrivee || "99").localeCompare(b.heureArrivee || "99"));
    const dep = S.etat.sejours.filter((s) => s.depart === j && ["Arrivé·e", "Parti·e"].includes(s.statut));
    const nav = arr.filter((s) => s.navette === "Oui");
    const ligneArr = (s) => { const b = S.benevole(s.benevole); return `<tr><td><strong>${esc(S.nom(b))}</strong><div class="doux petit">${esc(s.pole)}</div></td>
      <td><input type="time" aria-label="Heure d'arrivée" value="${s.heureArrivee}" onchange="A.heure(${s.id},this.value)" style="max-width:120px"></td>
      <td>${s.navette === "Oui" ? U.puce("Navette", "ok") : s.navette === "Non" ? U.puce("Par ses moyens", "neutre") : U.puce("Navette à confirmer", "alerte")}</td>
      <td class="masquable">${esc(s.lit || "—")}</td><td class="masquable">${esc(S.telAffiche(b))}</td>
      <td><label class="inline"><input type="checkbox" ${s.statut === "Arrivé·e" ? "checked" : ""} onchange="A.arrive(${s.id},this.checked)"> Arrivé·e</label></td></tr>`; };
    const ligneDep = (s) => { const b = S.benevole(s.benevole), a = s.attestation; return `<tr><td><strong>${esc(S.nom(b))}</strong><div class="doux petit">${esc(s.pole)}</div></td>
      <td>${a && a.statut !== "en cours" ? U.puce("Attestation " + a.statut, "ok") : U.puce("Attestation non signée", "alerte")}</td>
      <td>${a && a.statut !== "en cours" ? "" : `<button class="btn sec" onclick="A.lienAttestation(${s.id})">Envoyer le lien</button> <a class="btn lien" href="#/attestation/${s.id}">Ouvrir sur place</a>`}</td>
      <td><label class="inline"><input type="checkbox" ${s.statut === "Parti·e" ? "checked" : ""} onchange="A.parti(${s.id},this.checked)"> Parti·e</label></td></tr>`; };
    return (satellite ? "" : `<div class="encart noprint" style="margin-bottom:12px">L'accueil a sa propre vue : <a href="#/satellite-accueil" target="_blank" rel="noopener">satellite accueil ↗</a></div>`) + U.entete(`Accueil · plage navette bénévoles ${r.navettePlage}`, `Arrivées et départs du ${D.jour(j)} ${D.court(j)}`,
      `<button class="btn sec" onclick="V.jour='${D.ajouter(j, -1)}';R()">← Veille</button><input type="date" aria-label="Choisir le jour" value="${j}" onchange="V.jour=this.value;R()" style="max-width:170px"><button class="btn sec" onclick="V.jour='${D.ajouter(j, 1)}';R()">Lendemain →</button><button class="btn" onclick="print()">Imprimer pour le chauffeur</button>`) +
      `<div class="grille g3"><div class="carte"><div class="doux">Arrivées</div><div class="chiffre">${arr.length}</div></div><div class="carte"><div class="doux">Trajets de navette</div><div class="chiffre">${nav.length}</div><div class="doux petit">${nav.map((s) => (s.heureArrivee || "heure ?") + " " + S.benevole(s.benevole).prenom).join(" · ") || "—"}</div></div><div class="carte"><div class="doux">Départs</div><div class="chiffre">${dep.length}</div></div></div>
      <section class="carte"><h2>Arrivées</h2>${arr.length ? `<table class="liste"><thead><tr><th>Bénévole</th><th>Heure (gare ou sur place)</th><th>Transport</th><th class="masquable">Couchage</th><th class="masquable">Téléphone</th><th></th></tr></thead><tbody>${arr.map(ligneArr).join("")}</tbody></table>` : `<div class="vide">Aucune arrivée ce jour-là.</div>`}</section>
      <section class="carte"><h2>Départs</h2>${dep.length ? `<table class="liste"><thead><tr><th>Bénévole</th><th>Attestation</th><th></th><th></th></tr></thead><tbody>${dep.map(ligneDep).join("")}</tbody></table>` : `<div class="vide">Aucun départ ce jour-là.</div>`}</section>
      <div class="encart">Astuce démo : allez au <button class="btn lien" onclick="V.jour='2026-09-25';R()">25 septembre</button> (départ de Hugo), au <button class="btn lien" onclick="V.jour='2026-09-26';R()">26 septembre</button> (arrivée de Maya en navette) ou au <button class="btn lien" onclick="V.jour='2026-09-30';R()">30 septembre</button> (départ de Léa).</div>`;
  };
  A.heure = (id, v) => { S.sejour(id).heureArrivee = v; ok("Heure enregistrée"); };
  A.arrive = (id, v) => { const s = S.sejour(id); s.statut = v ? "Arrivé·e" : "Confirmée"; S.tracer(id, v ? "Arrivée pointée par l'accueil" : "Arrivée annulée"); ok(); };
  A.parti = (id, v) => { const s = S.sejour(id); s.statut = v ? "Parti·e" : "Arrivé·e"; S.tracer(id, v ? "Départ pointé par l'accueil" : "Départ annulé"); ok(); };
  A.lienAttestation = (id) => { const s = S.sejour(id); if (!s.attestation) s.attestation = S.nouvelleAttestation(s); S.envoyerMail(s, "attestation"); ok("Lien d'attestation envoyé (simulé)"); };

  // =====================================================================
  // Attestations (coordination et compta)
  // =====================================================================
  window.vueAttestations = function () {
    const t = S.tarifLe(S.aujourdhui());
    const tous = S.etat.sejours.filter((s) => ["Arrivé·e", "Parti·e"].includes(s.statut));
    const groupes = {
      "signée": tous.filter((s) => s.attestation && s.attestation.statut === "signée"),
      "a-signer": tous.filter((s) => !s.attestation || s.attestation.statut === "en cours"),
      "validée": tous.filter((s) => s.attestation && s.attestation.statut === "validée"),
      "transmise": tous.filter((s) => s.attestation && s.attestation.statut === "transmise"),
    };
    const noms = { "signée": "À valider", "a-signer": "Pas encore signées", "validée": "Validées", "transmise": "Transmises à la compta" };
    const liste = groupes[V.ongletAtt];
    const lignes = liste.sort((a, b) => a.depart.localeCompare(b.depart)).map((s) => {
      const b = S.benevole(s.benevole), a = s.attestation, m = a ? S.montant(s) : null, ec = S.ecarts(s).length;
      return `<tr class="clic ${V.choisiAtt === s.id ? "choisi" : ""}" onclick="V.choisiAtt=${s.id};R()"><td><strong>${esc(S.nom(b))}</strong><div class="doux petit">${esc(s.pole)}</div></td><td>${U.periode(s)}</td>
        <td class="centre">${a && a.statut !== "en cours" ? S.joursBenevolat(s).length : "—"}</td><td class="centre masquable">${a && Object.keys(a.jours).length ? S.compte(a, "r") : "—"}</td><td class="centre masquable">${a ? a.jetons : "—"}</td>
        <td>${!a || a.statut === "en cours" ? U.puce(s.depart < S.aujourdhui() ? "En retard" : "Départ le " + D.court(s.depart), s.depart < S.aujourdhui() ? "alerte" : "neutre") : ec ? U.puce(ec + " écart(s) avec le planning", "alerte") : U.puce("Conforme au planning", "ok")}</td>
        <td class="num gras">${m && a.statut !== "en cours" ? U.euros(m.total) : "—"}</td></tr>`;
    }).join("");
    const onglets = Object.keys(noms).map((k) => `<button class="filtre ${V.ongletAtt === k ? "on" : ""}" onclick="V.ongletAtt='${k}';V.choisiAtt=null;R()">${noms[k]} (${groupes[k].length})</button>`).join("");
    const choisi = S.sejour(V.choisiAtt);
    return U.entete("Phase 2 · idée à valider — justification du bénévolat et remboursement des frais", "Attestations",
      `<a class="btn sec" href="#/reglages" onclick="V.ongletReg='regles'">Tarifs (fictifs)</a>${groupes["validée"].length ? `<button class="btn" onclick="A.transmettre()">Transmettre ${groupes["validée"].length} validée(s) à la compta</button>` : ""}`) +
      `<div class="filtres">${onglets}</div>
      <div class="duo"><section class="carte" style="padding:8px 16px">${liste.length ? `<table class="liste"><thead><tr><th>Bénévole</th><th>Séjour</th><th class="centre">Bénévolat</th><th class="centre masquable">Repos</th><th class="centre masquable">Lessive</th><th>Contrôle</th><th class="num">Remboursable</th></tr></thead><tbody>${lignes}</tbody></table>` : `<div class="vide">Rien ici.</div>`}</section>
      ${choisi ? panneauAttestation(choisi) : `<aside class="carte panneau"><div class="vide">Choisissez une attestation.</div><div class="doux petit">Grille en vigueur depuis le ${D.fr(t.debut)} (fictive) : nuitée ${U.euros(t.nuitDortoir)}, repas ${U.euros(t.repasJour)}/jour, jeton ${U.euros(t.jetonLessive)}.</div></aside>`}</div>`;
  };

  function panneauAttestation(s) {
    const b = S.benevole(s.benevole), a = s.attestation;
    if (!a || a.statut === "en cours") return `<aside class="carte panneau"><h2>${esc(S.nom(b))}</h2><div class="doux">Attestation pas encore signée. Départ le ${D.fr(s.depart)}.</div>
      <button class="btn" onclick="A.lienAttestation(${s.id})">Envoyer le lien (${b.langue})</button><a class="btn sec" href="#/attestation/${s.id}">Ouvrir comme le bénévole</a></aside>`;
    const m = S.montant(s), ec = S.ecarts(s);
    const cal = Object.keys(a.jours).length ? `<div class="cal" style="margin:6px 0">${Object.entries(a.jours).map(([j, v]) => { const e = ec.find((x) => x.jour === j); return `<div title="${D.fr(j)}" style="height:34px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;background:var(--${v === "b" ? "ok" : v === "r" ? "repos" : "violet"});${e ? "outline:2px solid var(--alerte-t)" : ""}">${Number(j.slice(8))}</div>`; }).join("")}</div>` : "";
    const ecarts = ec.map((e) => `<div class="encart alerte">Le ${D.fr(e.jour)} : déclaré <strong>${e.declare === "b" ? "bénévolat" : "repos"}</strong>, planning <strong>${e.planning === "b" ? "travail" : "repos"}</strong>.
      <div class="actions" style="margin-top:6px"><button class="btn lien" onclick="A.trancher(${s.id},'${e.jour}','declare')">Retenir la déclaration</button><button class="btn lien" onclick="A.trancher(${s.id},'${e.jour}','planning')">Retenir le planning</button></div></div>`).join("");
    return `<aside class="carte panneau"><div class="entete" style="align-items:center"><h2>${esc(S.nom(b))}</h2>${U.puce(a.statut, a.statut === "signée" ? "" : "ok")}</div>
      <div class="doux petit">Signée le ${a.signeLe ? D.fr(a.signeLe.slice(0, 10)) + " à " + a.signeLe.slice(11, 16) : "—"} · code e-mail confirmé · ${esc(s.pole)}</div>
      ${cal}${ecarts}
      <div>${m.lignes.length > 1 ? `<div class="encart" style="margin:6px 0">Séjour à cheval sur deux grilles tarifaires : chaque jour est compté au tarif en vigueur ce jour-là.</div>` : ""}
      ${m.lignes.map((l) => `${m.lignes.length > 1 ? `<div class="doux petit" style="margin-top:6px;font-weight:600">Grille du ${D.fr(l.grille.debut)}</div>` : ""}
      <div class="ligne"><span>Nuitées en dortoir (${l.jours} j × ${U.euros(l.grille.nuitDortoir)})</span><span>${U.euros(l.nuits)}</span></div>
      <div class="ligne"><span>Repas (${l.jours} j × ${U.euros(l.grille.repasJour)})</span><span>${U.euros(l.repas)}</span></div>`).join("")}
      <div class="ligne"><span>Lessive (${a.jetons} jeton(s) × ${U.euros(m.tJeton.jetonLessive)})</span><span>${U.euros(m.lessive)}</span></div>
      <div class="ligne" style="border-top:1px solid var(--trait2);font-weight:700"><span style="color:var(--encre)">Total remboursable</span><span>${U.euros(m.total)}</span></div></div>
      <div class="doux petit">Tarifs fictifs de démonstration, réglables dans Réglages → Règles et tarifs.</div>
      ${a.statut === "signée" ? `<button class="btn" ${ec.length ? "disabled title=\"Trancher d'abord les écarts\"" : ""} onclick="A.valider(${s.id})">Valider l'attestation</button>` : ""}
      <a class="btn sec" href="#/attestation/${s.id}">Voir comme le bénévole</a></aside>`;
  }
  A.trancher = function (id, j, choix) {
    const s = S.sejour(id), a = s.attestation;
    if (choix === "planning") a.jours[j] = s.repos.includes(j) ? "r" : "b";
    else s.repos = a.jours[j] === "r" ? [...s.repos, j] : s.repos.filter((x) => x !== j);
    S.tracer(id, `Écart du ${D.fr(j)} tranché (${choix === "planning" ? "planning" : "déclaration"} retenu)`);
    ok("Écart tranché");
  };
  A.valider = (id) => { S.sejour(id).attestation.statut = "validée"; S.tracer(id, "Attestation validée par la coordination"); V.choisiAtt = null; ok("Attestation validée"); };
  A.transmettre = function () {
    S.etat.sejours.filter((s) => s.attestation && s.attestation.statut === "validée").forEach((s) => { s.attestation.statut = "transmise"; S.tracer(s.id, "Attestation et montant transmis à la comptabilité"); });
    ok("Transmises à la comptabilité (simulé)");
  };

  // =====================================================================
  // Réglages
  // =====================================================================
  window.vueReglages = function () {
    const onglets = [["poles", "Pôles et capacités"], ["fermetures", "Fermetures et événements"], ["formulaire", "Formulaire"], ["regles", "Règles et tarifs"], ["mails", "Modèles de mails"], ["calcom", "Cal.com"], ["donnees", "Données de démo"]];
    const tabs = onglets.map(([k, t]) => `<button class="onglet ${V.ongletReg === k ? "on" : ""}" onclick="V.ongletReg='${k}';R()">${t}</button>`).join("");
    return U.entete("Tout ce qui change se règle ici, sans code", "Réglages") + `<div class="onglets">${tabs}</div>` + ({ poles: regPoles, fermetures: regFermetures, formulaire: regFormulaire, regles: regRegles, mails: regMails, calcom: regCalcom, donnees: regDonnees }[V.ongletReg])();
  };
  function regPoles() {
    const lignes = S.etat.reglages.poles.map((p, i) => `<tr><td><input type="text" aria-label="Nom du pôle" value="${esc(p.nom)}" onchange="A.pole(${i},'nom',this.value)"></td>
      <td style="width:110px"><input type="number" min="0" aria-label="Capacité par défaut" value="${p.capacite}" onchange="A.pole(${i},'capacite',Number(this.value))"></td>
      <td style="width:110px"><input type="number" min="0" aria-label="Durée minimale" value="${p.dureeMin ?? 8}" onchange="A.pole(${i},'dureeMin',Number(this.value))"></td>
      <td><input type="email" aria-label="Responsable" value="${esc(p.responsable)}" placeholder="adresse du responsable" onchange="A.pole(${i},'responsable',this.value)"></td>
      <td class="centre"><input type="checkbox" aria-label="Actif" ${p.actif ? "checked" : ""} onchange="A.pole(${i},'actif',this.checked)"></td>
      <td><a href="#/satellite/${encodeURIComponent(p.nom)}" target="_blank" rel="noopener">Ouvrir ↗</a></td></tr>`).join("");
    return `<section class="carte"><h2>Pôles</h2><div class="doux petit" style="margin:-6px 0 10px">La même liste sert au formulaire, aux affectations et aux plannings. Un pôle inactif disparaît du formulaire. La durée minimale bloque l'envoi du formulaire (0 = pas de minimum). Les responsables ajustent la capacité semaine par semaine dans leur planning.</div>
      <table class="liste"><thead><tr><th>Nom</th><th>Capacité par défaut / jour</th><th>Durée min. (jours)</th><th>Responsable (accès à son planning)</th><th class="centre">Actif</th><th>Satellite</th></tr></thead><tbody>${lignes}</tbody></table>
      <div class="actions" style="margin-top:12px"><button class="btn" onclick="A.ajoutPole()">+ Ajouter un pôle</button></div></section>`;
  }
  A.pole = (i, k, v) => { S.etat.reglages.poles[i][k] = v; ok("Pôle mis à jour"); };
  A.ajoutPole = () => { S.etat.reglages.poles.push({ nom: "Nouveau pôle", capacite: 1, responsable: "", actif: true }); ok(); };

  function regFermetures() {
    const bloc = (cle, titre, aide) => `<section class="carte"><h2>${titre}</h2><div class="doux petit" style="margin:-6px 0 10px">${aide}</div>
      ${S.etat.reglages[cle].map((f, i) => `<div class="item"><div class="qui"><strong>${esc(f.nom)}</strong> <span class="doux">· ${D.fr(f.debut)} → ${D.fr(f.fin)}</span></div><button class="btn lien" onclick="A.retirer('${cle}',${i})">Retirer</button></div>`).join("")}
      <div class="grille" style="grid-template-columns:2fr 1fr 1fr auto;align-items:end;margin-top:10px"><div><label for="${cle}-n">Nom</label><input type="text" id="${cle}-n"></div><div><label for="${cle}-d">Début</label><input type="date" id="${cle}-d"></div><div><label for="${cle}-f">Fin</label><input type="date" id="${cle}-f"></div><button class="btn" onclick="A.ajouter('${cle}')">Ajouter</button></div></section>`;
    return `<div class="grille g2">${bloc("fermetures", "Fermetures du Centre", "Bloquent les demandes et s'affichent dans le formulaire.")}${bloc("evenements", "Événements", "Retraites, festivals : affichés en bandeau sur les plannings.")}</div>`;
  }
  A.retirer = (cle, i) => { S.etat.reglages[cle].splice(i, 1); ok("Retiré"); };
  A.ajouter = function (cle) {
    const n = document.getElementById(cle + "-n").value.trim(), d = document.getElementById(cle + "-d").value, f = document.getElementById(cle + "-f").value;
    if (!n || !d || !f || f < d) { U.toast("Nom et dates valides requis"); return; }
    S.etat.reglages[cle].push({ nom: n, debut: d, fin: f }); S.etat.reglages[cle].sort((a, b) => a.debut.localeCompare(b.debut)); ok("Ajouté");
  };

  function regRegles() {
    const r = S.etat.reglages.regles, auj = S.aujourdhui(), enCoursG = S.tarifLe(auj);
    const champ = (obj, k, lab, type = "number") => `<div><label for="r-${k}">${lab}</label><input type="${type}" id="r-${k}" value="${esc(S.etat.reglages[obj][k])}" onchange="A.regle('${obj}','${k}',this.value,'${type}')"></div>`;
    return `<div class="grille g2"><section class="carte"><h2>Règles</h2><div class="grille g2">
      ${champ("regles", "reposParBloc", "Repos par bloc de 7 jours")}${champ("regles", "rappelJours", "Rappel avant l'arrivée (jours)")}
      ${champ("regles", "navettePlage", "Plage de navette bénévoles", "text")}${champ("regles", "navetteDelaiJours", "Réservation navette (jours avant)")}
      ${champ("regles", "lessiveMaxParSemaine", "Jetons de lessive max / semaine")}</div></section>
      <section class="carte"><h2>Grilles tarifaires de remboursement</h2>
      <div class="doux petit" style="margin:-6px 0 10px">La grille change deux fois par an, au 1<sup>er</sup> mars et au 1<sup>er</sup> septembre. Chaque jour de bénévolat est remboursé au tarif en vigueur ce jour-là ; les anciennes grilles restent pour les attestations déjà faites.</div>
      <div class="encart alerte" style="margin-bottom:8px">Valeurs fictives pour la démo : à remplacer par les tarifs réduits réels.</div>
      <table class="liste"><thead><tr><th>Période</th><th>Nuitée (€)</th><th>Repas / jour (€)</th><th>Jeton (€)</th><th></th></tr></thead><tbody>
      ${S.grilles().map((g) => { const i = S.etat.reglages.tarifs.indexOf(g), fin = S.finGrille(g), utilisee = S.etat.sejours.some((s) => s.attestation && ["validée", "transmise"].includes(s.attestation.statut) && S.joursBenevolat(s).some((j) => S.tarifLe(j) === g));
        const inp = (k) => `<input type="number" step="0.5" min="0" style="max-width:90px" aria-label="${k}" value="${g[k]}" ${utilisee ? "disabled title=\"Grille déjà utilisée par des attestations validées\"" : ""} onchange="A.tarif(${i},'${k}',this.value)">`;
        return `<tr><td><strong>${D.fr(g.debut)}</strong> → ${fin ? D.fr(fin) : "…"} ${g === enCoursG ? U.puce("En vigueur", "ok") : g.debut > auj ? U.puce("À venir", "neutre") : ""}</td><td>${inp("nuitDortoir")}</td><td>${inp("repasJour")}</td><td>${inp("jetonLessive")}</td>
          <td>${utilisee ? `<span class="doux petit">verrouillée</span>` : S.grilles().length > 1 ? `<button class="btn lien" onclick="A.retirerGrille(${i})">Retirer</button>` : ""}</td></tr>`; }).join("")}
      </tbody></table>
      <div class="actions" style="margin-top:12px"><button class="btn" onclick="A.ajoutGrille()">+ Préparer la grille du ${D.fr(S.prochaineGrille())}</button></div></section></div>`;
  }
  A.tarif = (i, k, v) => { S.etat.reglages.tarifs[i][k] = Number(v); ok("Tarif enregistré"); };
  A.ajoutGrille = function () {
    const der = S.grilles().slice(-1)[0];
    S.etat.reglages.tarifs.push({ ...der, debut: S.prochaineGrille() });
    ok("Nouvelle grille créée (tarifs recopiés, à ajuster)");
  };
  A.retirerGrille = (i) => { S.etat.reglages.tarifs.splice(i, 1); ok("Grille retirée"); };
  function regFormulaire() {
    const r = S.etat.reglages, M = r.messagesRefus;
    const lignes = Object.entries(M).map(([k, m]) => `<tr><td><strong>${esc(m.nom)}</strong></td>
      <td><textarea rows="2" aria-label="${esc(m.nom)} (FR)" onchange="A.msgRefus('${k}','FR',this.value)">${esc(m.FR)}</textarea></td>
      <td><textarea rows="2" aria-label="${esc(m.nom)} (EN)" onchange="A.msgRefus('${k}','EN',this.value)">${esc(m.EN)}</textarea></td></tr>`).join("");
    return `<section class="carte"><h2>Fenêtre de refus du formulaire</h2>
      <div class="doux petit" style="margin:-6px 0 10px">Quand une règle n'est pas respectée, la demande ne part pas : une fenêtre explique pourquoi au bénévole. Champs possibles : {debut}, {fin}, {pole}, {min}, {n}.</div>
      <table class="liste"><thead><tr><th>Cas</th><th>Français</th><th>Anglais</th></tr></thead><tbody>${lignes}</tbody></table>
      <div class="actions" style="margin-top:12px"><button class="btn sec" onclick="A.apercuRefus()">Voir la fenêtre</button></div></section>
      <section class="carte"><h2>Tranches d'âge</h2><div class="doux petit" style="margin:-6px 0 10px">Le formulaire demande une tranche d'âge, pas l'âge exact. La première tranche (moins de 18 ans) bloque l'envoi. Une tranche par ligne.</div>
      <textarea rows="6" aria-label="Tranches d'âge" onchange="A.tranches(this.value)">${esc(r.regles.tranchesAge.join("\n"))}</textarea></section>`;
  }
  A.msgRefus = (k, L, v) => { S.etat.reglages.messagesRefus[k][L] = v; ok("Message enregistré"); };
  A.tranches = (v) => { const t = v.split("\n").map((x) => x.trim()).filter(Boolean); if (t.length < 2) { U.toast("Au moins deux tranches"); return; } S.etat.reglages.regles.tranchesAge = t; ok("Tranches d'âge enregistrées"); };
  A.apercuRefus = function () {
    const f = S.etat.reglages.fermetures[0];
    U.fenetre("Votre demande ne peut pas être envoyée", S.controles(f.debut, D.ajouter(f.debut, 4), "Restaurant", null, "FR").map((x) => x.txt), "Modifier ma demande");
  };
  A.regle = (obj, k, v, type) => { S.etat.reglages[obj][k] = type === "number" ? Number(v) : v; ok("Réglage enregistré"); };

  function regMails() {
    const mods = S.etat.reglages.modeles, m = mods[V.modele], L = V.langModele, t = m[L];
    const ex = S.sejour(7);
    const liste = Object.entries(mods).map(([k, x]) => `<button class="filtre ${V.modele === k ? "on" : ""}" style="text-align:left;border-radius:10px" onclick="V.modele='${k}';R()"><strong>${esc(x.nom)}</strong><br><span class="petit" style="opacity:.8">${esc(x.declencheur)}</span></button>`).join("");
    const champs = ["prénom", "date_arrivée", "date_départ", "pôle", "gare", "plage_navette", "date_limite_navette", "lien_rdv", "lien_attestation"].map((c) => `<button class="puce violet" style="border:0;cursor:pointer" onclick="A.inserer('{${c}}')">{${c}}</button>`).join(" ");
    return `<div class="grille" style="grid-template-columns:260px minmax(0,1fr) minmax(0,1fr)"><section class="carte" style="display:flex;flex-direction:column;gap:6px;padding:14px">${liste}</section>
      <section class="carte"><div class="entete" style="align-items:center"><h2>${esc(m.nom)}</h2><span class="langue"><button class="${L === "FR" ? "on" : ""}" onclick="V.langModele='FR';R()">FR</button><button class="${L === "EN" ? "on" : ""}" onclick="V.langModele='EN';R()">EN</button></span></div>
        <label for="m-objet">Objet</label><input type="text" id="m-objet" value="${esc(t.objet)}" oninput="A.modele('objet',this.value)">
        <label for="m-corps">Message</label><textarea id="m-corps" rows="12" oninput="A.modele('corps',this.value)">${esc(t.corps)}</textarea>
        <div class="petit doux" style="margin-top:8px">Champs à insérer : ${champs}</div></section>
      <section class="carte" style="background:#FBF6EC"><div class="doux petit">Aperçu pour ${esc(S.nom(S.benevole(ex.benevole)))}</div>
        <h3 style="margin:8px 0" id="apercu-objet">${esc(S.remplir(t.objet, ex, L))}</h3><div id="apercu-corps" style="white-space:pre-line;font-size:15px;line-height:1.5">${esc(S.remplir(t.corps, ex, L))}</div></section></div>`;
  }
  A.modele = function (k, v) {
    S.etat.reglages.modeles[V.modele][V.langModele][k] = v; S.sauver();
    const ex = S.sejour(7);
    document.getElementById("apercu-" + k).textContent = S.remplir(v, ex, V.langModele);
  };
  A.inserer = function (champ) {
    const ta = document.getElementById("m-corps"), p = ta.selectionStart ?? ta.value.length;
    ta.value = ta.value.slice(0, p) + champ + ta.value.slice(p); A.modele("corps", ta.value); ta.focus();
  };

  function regCalcom() {
    const r = S.etat.reglages.regles;
    const cand = S.etat.sejours.filter((s) => ["Reçue", "RDV proposé"].includes(s.statut));
    const opts = cand.map((s) => { const b = S.benevole(s.benevole); return `<option value="${esc(b.email)}">${esc(S.nom(b))} — ${esc(b.email)}</option>`; }).join("") + `<option value="inconnu@example.org">Adresse inconnue — inconnu@example.org</option>`;
    return `<div class="grille g2"><section class="carte"><h2>Connexion Cal.com</h2>
      <div class="ligne"><span>Adresse de réception (webhook)</span><code>https://benevolat.cmk…/webhooks/calcom</code></div>
      <div class="ligne"><span>Événements écoutés</span><span>réservation, déplacement, annulation</span></div>
      <div class="ligne"><span>Rattachement</span><span>par l'adresse e-mail du bénévole</span></div>
      <div class="ligne"><span>Contrôle de sécurité</span><span>clé secrète partagée avec Cal.com</span></div>
      <div class="ligne"><span>Rattrapage</span><span>vérification chaque nuit auprès de Cal.com</span></div>
      <div style="margin-top:10px"><label for="r-relanceRdvJours">Alerte « pas de RDV réservé » après (jours)</label><input type="number" id="r-relanceRdvJours" value="${r.relanceRdvJours}" onchange="A.regle('regles','relanceRdvJours',this.value,'number')"></div></section>
      <section class="carte"><h2>Simulateur (démo)</h2><div class="doux petit" style="margin:-6px 0 10px">Reproduit ce que Cal.com envoie quand un bénévole réserve, déplace ou annule son RDV.</div>
      <label for="wh-email">Bénévole (adresse utilisée sur Cal.com)</label><select id="wh-email">${opts}</select>
      <label for="wh-type">Événement</label><select id="wh-type"><option value="BOOKING_CREATED">Réservation</option><option value="BOOKING_RESCHEDULED">Déplacement</option><option value="BOOKING_CANCELLED">Annulation</option></select>
      <label for="wh-date">Date et heure du RDV</label><input type="datetime-local" id="wh-date" value="${D.ajouter(S.aujourdhui(), 2)}T10:30">
      <div class="actions" style="margin-top:12px"><button class="btn" onclick="A.webhook()">Envoyer le webhook (simulé)</button></div></section></div>`;
  }
  A.webhook = function () {
    const email = document.getElementById("wh-email").value, type = document.getElementById("wh-type").value, debut = document.getElementById("wh-date").value;
    const b = S.etat.benevoles.find((x) => x.email === email);
    const s0 = b && S.etat.sejours.find((x) => x.benevole === b.id && x.rdv);
    const res = S.recevoirWebhook({ type, email, debut, uid: (s0 && s0.rdv && type !== "BOOKING_CREATED" ? s0.rdv.uid : "cal-" + Math.random().toString(16).slice(2, 6)), nom: b ? S.nom(b) : "Visiteur inconnu" });
    ok(res.rattache ? `Webhook reçu · ${S.nom(S.benevole(res.sejour.benevole))} : ${{ BOOKING_CREATED: "RDV réservé", BOOKING_RESCHEDULED: "RDV déplacé", BOOKING_CANCELLED: "RDV annulé" }[type]}` : "Webhook reçu · adresse inconnue : RDV à rattacher (tableau de bord)");
  };

  function regDonnees() {
    return `<section class="carte"><h2>Données de démonstration</h2><p class="doux">Vos modifications sont gardées dans ce navigateur uniquement. Rien n'est envoyé nulle part.</p>
      <div class="actions"><button class="btn sec" onclick="A.toutExporter()">Exporter toutes les données (JSON)</button><button class="btn" onclick="A.reinit()">Réinitialiser la démo</button></div></section>`;
  }
  A.toutExporter = function () { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(S.etat, null, 2)], { type: "application/json" })); a.download = "benevolat-demo.json"; a.click(); };
  A.reinit = () => { if (confirm("Revenir aux données de démonstration d'origine ?")) { S.reinitialiser(); location.hash = "#/"; R(); U.toast("Démo réinitialisée"); } };
})();
