/* Espace équipe : tableau de bord, demandes, bénévoles, planning, arrivées, attestations, réglages. */
(function () {
  const D = S.D, esc = U.esc;
  // État d'affichage (non enregistré)
  const V = window.V = { filtre: "a-traiter", recherche: "", choisi: null, edition: false, pole: "Restaurant", semaine: 0, jour: null, ongletAtt: "signée", choisiAtt: null, ongletReg: "poles", modele: "rappel", langModele: "FR" };
  const A = window.A = window.A || {};
  const ok = (msg) => { S.sauver(); if (msg) U.toast(msg); R(); };

  // =====================================================================
  // Tableau de bord
  // =====================================================================
  window.vueTableau = function () {
    const auj = S.aujourdhui(), dans7 = D.ajouter(auj, 7);
    const presents = S.presents(auj);
    const capa = S.etat.reglages.poles.filter((p) => p.actif).reduce((t, p) => t + p.capacite, 0);
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
      const pct = p.capacite ? Math.min(100, Math.round(moy / p.capacite * 100)) : 0;
      return `<div style="margin-bottom:12px"><div class="ligne" style="padding:0 0 4px"><span style="color:var(--encre)">${esc(p.nom)}</span><strong>${moy} / ${p.capacite}</strong></div><div class="jauge ${pct < 75 ? "basse" : ""}"><div style="width:${pct}%"></div></div></div>`;
    }).join("");
    const evts = S.etat.reglages.evenements.filter((e) => e.fin >= auj).slice(0, 3).map((e) => `<div class="encart" style="margin-top:8px"><strong>${esc(e.nom)}</strong> · ${D.court(e.debut)}${e.fin !== e.debut ? " → " + D.court(e.fin) : ""}</div>`).join("");

    const tuile = (t, n, s) => `<div class="carte"><div class="doux">${t}</div><div class="chiffre">${n}</div><div class="doux petit">${s}</div></div>`;
    return U.entete(`${D.jour(auj)} ${D.fr(auj)}`, "Bonjour, voici la journée", `<a class="btn" href="#/demandes" onclick="A.nouvelleSaisie()">+ Saisie manuelle</a>`) +
      `<div class="grille g4">${tuile("Présents aujourd'hui", presents.length, `pour ${capa} places au total`)}${tuile("Demandes à traiter", aTraiter.length, `${aTraiter.filter((s) => s.statut === "Reçue").length} nouvelles`)}${tuile("Arrivées (7 jours)", arrivees.length, `${navettes} navette(s) sans horaire`)}${tuile("Départs (7 jours)", departs.length, `${signees} attestation(s) signée(s)`)}</div>
      <div class="grille g21"><section class="carte"><h2>À traiter en priorité</h2>${items}</section>
      <section class="carte"><h2>Charge des pôles</h2><div class="doux petit" style="margin:-6px 0 12px">Moyenne au travail / capacité, cette semaine</div>${charges}${evts}</section></div>`;
  };

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
    const capa = (S.pole(pic) || { capacite: 0 }).capacite;
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
    const issues = S.enCours(s) || s.statut === "Confirmée" ? `<div class="actions petit"><button class="btn lien" onclick="A.statut(${s.id},'Liste d\\'attente')">Liste d'attente</button><button class="btn lien" onclick="A.statut(${s.id},'Refusée')">Refuser</button><button class="btn lien" onclick="A.statut(${s.id},'Désistée')">Désistement</button></div>` : "";
    const edition = V.edition ? `<div class="grille g2"><div><label for="e-arr">Arrivée</label><input type="date" id="e-arr" value="${s.arrivee}"></div><div><label for="e-dep">Départ</label><input type="date" id="e-dep" value="${s.depart}"></div></div>
      <div class="actions"><button class="btn" onclick="A.dates(${s.id})">Enregistrer les dates</button><button class="btn sec" onclick="V.edition=false;R()">Annuler</button></div>` : "";
    const hist = S.historiqueDe(s.id).map((h) => `<div class="petit" style="padding:3px 0"><span class="doux">${D.fr(h.date)}</span> · ${esc(h.texte)}</div>`).join("") || `<div class="doux petit">Aucun événement.</div>`;
    return `<aside class="carte panneau" aria-label="Détail de la demande">
      <div class="entete" style="align-items:center"><h2><a href="#/benevoles/${b.id}">${esc(S.nom(b))}</a></h2>${U.statutPuce(s.statut)}</div>
      <div class="doux petit">${b.id} · ${esc(b.pays)} · mails en ${b.langue === "FR" ? "français" : "anglais"}</div>
      ${al.filter((a) => a.type === "alerte").map((a) => `<div class="encart alerte"><strong>${esc(a.txt)}</strong></div>`).join("")}
      <div><div class="ligne"><span>Séjour</span><strong>${U.periode(s)} (${D.ecart(s.arrivee, s.depart)} j)</strong></div>
      <div class="ligne"><span>Souhaits</span><span>${esc(s.souhaits.join(", "))}</span></div>
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
    s.statut = statut;
    S.tracer(id, `${avant} → ${statut}`);
    if (mail) S.envoyerMail(s, mail);
    ok(`${S.nom(S.benevole(s.benevole))} : ${statut}`);
  };
  A.relancer = (id) => { S.envoyerMail(S.sejour(id), "invitation"); ok("Relance envoyée (simulée)"); };
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
    if (!a || !d || d <= a) { U.toast("Dates invalides"); return; }
    S.tracer(id, `Dates modifiées : ${D.fr(s.arrivee)}–${D.fr(s.depart)} → ${D.fr(a)}–${D.fr(d)}`);
    s.arrivee = a; s.depart = d; s.repos = s.repos.filter((j) => j > a && j < d); V.edition = false;
    ok("Dates mises à jour");
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
  window.vuePlanning = function () {
    const r = S.etat.reglages, auj = S.aujourdhui();
    const debut = D.ajouter(D.lundi(auj), V.semaine * 7), jours = D.plage(debut, 14);
    const pole = S.pole(V.pole) || r.poles[0];
    const sejours = S.etat.sejours.filter((s) => s.pole === pole.nom && jours.some((j) => S.presentLe(s, j))).sort((a, b) => a.arrivee.localeCompare(b.arrivee));
    const opts = r.poles.filter((p) => p.actif).map((p) => `<option ${p.nom === pole.nom ? "selected" : ""}>${esc(p.nom)}</option>`).join("");
    const tete = jours.map((j) => `<th class="${j === auj ? "aujourdhui" : ""}">${D.jour(j)}<br><strong style="font-size:14px">${D.court(j)}</strong></th>`).join("");
    const evts = jours.map((j) => { const e = S.evenementLe(j); return `<td>${e.length ? `<div class="evt" title="${esc(e.join(" / "))}">${esc(e[0].replace("Retraite ", "Retr. "))}</div>` : ""}</td>`; }).join("");
    const compte = jours.map((j) => { const n = S.auTravail(pole.nom, j); return `<td class="compteur ${n < pole.capacite ? "bas" : "bon"}">${n}</td>`; }).join("");
    const lignes = sejours.map((s) => {
      const b = S.benevole(s.benevole);
      const manque = S.blocsRepos(s).filter((x) => !x.ok).length;
      const cases = jours.map((j) => {
        const e = S.etatJour(s, j);
        if (!e) return `<td class="j hors"></td>`;
        const txt = { arr: "Arr" + (s.heureArrivee ? `<br><span style="font-weight:400">${s.heureArrivee}</span>` : ""), dep: "Dép", travail: "✓", repos: "Repos" }[e];
        const clic = e === "travail" || e === "repos" ? ` onclick="A.repos(${s.id},'${j}')" title="Cliquer pour ${e === "repos" ? "retirer" : "poser"} un repos"` : "";
        return `<td class="j ${e}"${clic}>${txt}</td>`;
      }).join("");
      return `<tr><td class="nom"><a href="#/benevoles/${b.id}">${esc(S.nom(b))}</a>${manque ? ` <span title="Repos insuffisants sur ${manque} bloc(s) de 7 jours">${U.puce("repos ?", "alerte")}</span>` : ""}</td>${cases}</tr>`;
    }).join("");
    const bas = jours.filter((j) => S.auTravail(pole.nom, j) < pole.capacite && D.jourSemaine(j) !== 0).length;
    return U.entete("Espace responsable de pôle", `${esc(pole.nom)} — du ${D.court(jours[0])} au ${D.court(jours[13])}`,
      `<button class="btn sec" onclick="V.semaine--;R()">← Semaine précédente</button><button class="btn sec" onclick="V.semaine=0;R()">Aujourd'hui</button><button class="btn sec" onclick="V.semaine++;R()">Semaine suivante →</button><button class="btn" onclick="print()">Imprimer</button>`) +
      `<div class="filtres noprint"><label for="pole" style="margin:0">Pôle</label><select id="pole" style="max-width:240px" onchange="V.pole=this.value;R()">${opts}</select><span class="doux">Capacité : ${pole.capacite} au travail par jour · modifiable dans Réglages</span></div>
      <section class="carte planning"><table><thead><tr><th style="text-align:left">Bénévole</th>${tete}</tr></thead><tbody>
        <tr><td class="nom doux petit" style="font-weight:400">Événements</td>${evts}</tr>
        <tr><td class="nom doux petit" style="font-weight:400">Au travail / ${pole.capacite}</td>${compte}</tr>${lignes}</tbody></table>
        ${sejours.length ? "" : `<div class="vide">Aucun bénévole confirmé sur ces deux semaines.</div>`}</section>
      <div class="legende"><span><i style="background:var(--ok)"></i>Au travail</span><span><i style="background:var(--repos)"></i>Repos</span><span><i style="background:var(--info)"></i>Arrivée / départ</span><span><i style="background:var(--violet)"></i>Événement</span>
        <span class="doux">Règle : ${r.regles.reposParBloc} repos par bloc de 7 jours de présence.</span>${bas ? `<span class="puce alerte">${bas} jour(s) sous la capacité</span>` : ""}</div>`;
  };
  A.repos = function (id, j) {
    const s = S.sejour(id);
    s.repos = s.repos.includes(j) ? s.repos.filter((x) => x !== j) : [...s.repos, j].sort();
    ok();
  };

  // =====================================================================
  // Arrivées et navettes
  // =====================================================================
  window.vueArrivees = function () {
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
    return U.entete(`Accueil · plage navette bénévoles ${r.navettePlage}`, `Arrivées et départs du ${D.jour(j)} ${D.court(j)}`,
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
    const t = S.etat.reglages.tarifs;
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
        <td class="centre">${a && Object.keys(a.jours).length ? S.compte(a, "b") : "—"}</td><td class="centre masquable">${a && Object.keys(a.jours).length ? S.compte(a, "r") : "—"}</td><td class="centre masquable">${a ? a.jetons : "—"}</td>
        <td>${!a || a.statut === "en cours" ? U.puce(s.depart < S.aujourdhui() ? "En retard" : "Départ le " + D.court(s.depart), s.depart < S.aujourdhui() ? "alerte" : "neutre") : ec ? U.puce(ec + " écart(s) avec le planning", "alerte") : U.puce("Conforme au planning", "ok")}</td>
        <td class="num gras">${m && a.statut !== "en cours" ? U.euros(m.total) : "—"}</td></tr>`;
    }).join("");
    const onglets = Object.keys(noms).map((k) => `<button class="filtre ${V.ongletAtt === k ? "on" : ""}" onclick="V.ongletAtt='${k}';V.choisiAtt=null;R()">${noms[k]} (${groupes[k].length})</button>`).join("");
    const choisi = S.sejour(V.choisiAtt);
    return U.entete("Justification du bénévolat · remboursement des frais de séjour", "Attestations",
      `<a class="btn sec" href="#/reglages" onclick="V.ongletReg='regles'">Tarifs (fictifs)</a>${groupes["validée"].length ? `<button class="btn" onclick="A.transmettre()">Transmettre ${groupes["validée"].length} validée(s) à la compta</button>` : ""}`) +
      `<div class="filtres">${onglets}</div>
      <div class="duo"><section class="carte" style="padding:8px 16px">${liste.length ? `<table class="liste"><thead><tr><th>Bénévole</th><th>Séjour</th><th class="centre">Bénévolat</th><th class="centre masquable">Repos</th><th class="centre masquable">Lessive</th><th>Contrôle</th><th class="num">Remboursable</th></tr></thead><tbody>${lignes}</tbody></table>` : `<div class="vide">Rien ici.</div>`}</section>
      ${choisi ? panneauAttestation(choisi) : `<aside class="carte panneau"><div class="vide">Choisissez une attestation.</div><div class="doux petit">Tarifs de démonstration : nuitée ${U.euros(t.nuitDortoir)}, repas ${U.euros(t.repasJour)}/jour, jeton ${U.euros(t.jetonLessive)}.</div></aside>`}</div>`;
  };

  function panneauAttestation(s) {
    const b = S.benevole(s.benevole), a = s.attestation;
    if (!a || a.statut === "en cours") return `<aside class="carte panneau"><h2>${esc(S.nom(b))}</h2><div class="doux">Attestation pas encore signée. Départ le ${D.fr(s.depart)}.</div>
      <button class="btn" onclick="A.lienAttestation(${s.id})">Envoyer le lien (${b.langue})</button><a class="btn sec" href="#/attestation/${s.id}">Ouvrir comme le bénévole</a></aside>`;
    const m = S.montant(s), ec = S.ecarts(s), t = S.etat.reglages.tarifs;
    const cal = Object.keys(a.jours).length ? `<div class="cal" style="margin:6px 0">${Object.entries(a.jours).map(([j, v]) => { const e = ec.find((x) => x.jour === j); return `<div title="${D.fr(j)}" style="height:34px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;background:var(--${v === "b" ? "ok" : v === "r" ? "repos" : "violet"});${e ? "outline:2px solid var(--alerte-t)" : ""}">${Number(j.slice(8))}</div>`; }).join("")}</div>` : "";
    const ecarts = ec.map((e) => `<div class="encart alerte">Le ${D.fr(e.jour)} : déclaré <strong>${e.declare === "b" ? "bénévolat" : "repos"}</strong>, planning <strong>${e.planning === "b" ? "travail" : "repos"}</strong>.
      <div class="actions" style="margin-top:6px"><button class="btn lien" onclick="A.trancher(${s.id},'${e.jour}','declare')">Retenir la déclaration</button><button class="btn lien" onclick="A.trancher(${s.id},'${e.jour}','planning')">Retenir le planning</button></div></div>`).join("");
    return `<aside class="carte panneau"><div class="entete" style="align-items:center"><h2>${esc(S.nom(b))}</h2>${U.puce(a.statut, a.statut === "signée" ? "" : "ok")}</div>
      <div class="doux petit">Signée le ${a.signeLe ? D.fr(a.signeLe.slice(0, 10)) + " à " + a.signeLe.slice(11, 16) : "—"} · code e-mail confirmé · ${esc(s.pole)}</div>
      ${cal}${ecarts}
      <div><div class="ligne"><span>Nuitées en dortoir (${m.joursBenevolat} j × ${U.euros(t.nuitDortoir)})</span><span>${U.euros(m.nuits)}</span></div>
      <div class="ligne"><span>Repas (${m.joursBenevolat} j × ${U.euros(t.repasJour)})</span><span>${U.euros(m.repas)}</span></div>
      <div class="ligne"><span>Lessive (${a.jetons} jeton(s))</span><span>${U.euros(m.lessive)}</span></div>
      <div class="ligne" style="border-top:1px solid var(--trait2);font-weight:700"><span style="color:var(--encre)">Total remboursable</span><span>${U.euros(m.total)}</span></div></div>
      <div class="doux petit">Tarifs fictifs de démonstration, réglables dans Réglages.</div>
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
    const onglets = [["poles", "Pôles et capacités"], ["fermetures", "Fermetures et événements"], ["regles", "Règles et tarifs"], ["mails", "Modèles de mails"], ["donnees", "Données de démo"]];
    const tabs = onglets.map(([k, t]) => `<button class="onglet ${V.ongletReg === k ? "on" : ""}" onclick="V.ongletReg='${k}';R()">${t}</button>`).join("");
    return U.entete("Tout ce qui change se règle ici, sans code", "Réglages") + `<div class="onglets">${tabs}</div>` + ({ poles: regPoles, fermetures: regFermetures, regles: regRegles, mails: regMails, donnees: regDonnees }[V.ongletReg])();
  };
  function regPoles() {
    const lignes = S.etat.reglages.poles.map((p, i) => `<tr><td><input type="text" aria-label="Nom du pôle" value="${esc(p.nom)}" onchange="A.pole(${i},'nom',this.value)"></td>
      <td style="width:120px"><input type="number" min="0" aria-label="Capacité" value="${p.capacite}" onchange="A.pole(${i},'capacite',Number(this.value))"></td>
      <td><input type="email" aria-label="Responsable" value="${esc(p.responsable)}" placeholder="adresse du responsable" onchange="A.pole(${i},'responsable',this.value)"></td>
      <td class="centre"><input type="checkbox" aria-label="Actif" ${p.actif ? "checked" : ""} onchange="A.pole(${i},'actif',this.checked)"></td></tr>`).join("");
    return `<section class="carte"><h2>Pôles</h2><div class="doux petit" style="margin:-6px 0 10px">La même liste sert au formulaire, aux affectations et aux plannings. Un pôle inactif disparaît du formulaire.</div>
      <table class="liste"><thead><tr><th>Nom</th><th>Capacité / jour</th><th>Responsable (accès à son planning)</th><th class="centre">Actif</th></tr></thead><tbody>${lignes}</tbody></table>
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
    const r = S.etat.reglages.regles, t = S.etat.reglages.tarifs;
    const champ = (obj, k, lab, type = "number") => `<div><label for="r-${k}">${lab}</label><input type="${type}" id="r-${k}" value="${esc(S.etat.reglages[obj][k])}" onchange="A.regle('${obj}','${k}',this.value,'${type}')"></div>`;
    return `<div class="grille g2"><section class="carte"><h2>Règles</h2><div class="grille g2">
      ${champ("regles", "dureeMin", "Durée minimale de séjour (jours)")}${champ("regles", "exceptionDuree", "Pôle sans durée minimale", "text")}
      ${champ("regles", "reposParBloc", "Repos par bloc de 7 jours")}${champ("regles", "rappelJours", "Rappel avant l'arrivée (jours)")}
      ${champ("regles", "navettePlage", "Plage de navette bénévoles", "text")}${champ("regles", "navetteDelaiJours", "Réservation navette (jours avant)")}
      ${champ("regles", "lessiveMaxParSemaine", "Jetons de lessive max / semaine")}${champ("regles", "ageMin", "Âge minimum")}</div></section>
      <section class="carte"><h2>Tarifs de remboursement</h2><div class="encart alerte" style="margin-bottom:8px">Valeurs fictives pour la démo : à remplacer par les tarifs réduits réels.</div><div class="grille g2">
      ${champ("tarifs", "nuitDortoir", "Nuitée en dortoir (€)")}${champ("tarifs", "repasJour", "Repas par jour (€)")}${champ("tarifs", "jetonLessive", "Jeton de lessive (€)")}</div></section></div>`;
  }
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

  function regDonnees() {
    return `<section class="carte"><h2>Données de démonstration</h2><p class="doux">Vos modifications sont gardées dans ce navigateur uniquement. Rien n'est envoyé nulle part.</p>
      <div class="actions"><button class="btn sec" onclick="A.toutExporter()">Exporter toutes les données (JSON)</button><button class="btn" onclick="A.reinit()">Réinitialiser la démo</button></div></section>`;
  }
  A.toutExporter = function () { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(S.etat, null, 2)], { type: "application/json" })); a.download = "benevolat-demo.json"; a.click(); };
  A.reinit = () => { if (confirm("Revenir aux données de démonstration d'origine ?")) { S.reinitialiser(); location.hash = "#/"; R(); U.toast("Démo réinitialisée"); } };
})();
