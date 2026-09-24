/* Côté bénévole : formulaire de demande et attestation de bénévolat sur téléphone. */
(function () {
  const D = S.D, esc = U.esc, A = window.A;

  // =====================================================================
  // Formulaire de demande (FR / EN)
  // =====================================================================
  const T = {
    FR: { titre: "Venir en séjour de bénévolat", intro: "Remplissez ce formulaire : l'équipe bénévolat vous répond sous quelques jours.", ferme: "Le Centre est fermé", vous: "Vous", prenom: "Prénom", nom: "Nom", email: "Adresse e-mail", tel: "Téléphone portable", telAide: "Choisissez l'indicatif de votre pays, puis tapez votre numéro.", genre: "Vous êtes", femme: "Une femme", homme: "Un homme", pays: "Pays de votre passeport", age: "Âge", niveau: "Niveau de français", niv: ["1 · un peu", "2 · correct", "3 · très bien"], sejour: "Votre séjour", arr: "Date d'arrivée", harr: "Heure d'arrivée (gare ou sur place)", dep: "Date de départ", p1: "Pôle souhaité (1er choix)", p2: "2e choix (facultatif)", canal: "Vous venez grâce à", navette: "Navette depuis la gare d'Écommoy ?", nav: ["Oui", "Non", "Je confirmerai plus tard"], sante: "Santé et contact", besoins: "Un besoin particulier (santé, traitement) à signaler ?", urgence: "Contact en cas d'urgence (nom)", urgTel: "Téléphone du contact d'urgence", repas: "Repas", engage: "Engagements", cond: "Je m'engage à respecter les règles de vie du Centre (pas d'alcool, de tabac ni de viande sur la propriété).", rgpd: "J'autorise le CMK France à utiliser mes coordonnées uniquement pour organiser mon séjour. Mes données sont effacées au plus tard 3 ans après mon dernier séjour.", envoyer: "Envoyer ma demande", merci: "Merci, votre demande est bien arrivée !", merciTxt: "Vous allez recevoir un e-mail de confirmation. L'équipe bénévolat revient vers vous rapidement." },
    EN: { titre: "Come as a volunteer", intro: "Fill in this form: the volunteer team will get back to you within a few days.", ferme: "The Centre is closed", vous: "About you", prenom: "First name", nom: "Family name", email: "Email", tel: "Mobile phone", telAide: "Choose your country code, then type your number.", genre: "You are", femme: "A woman", homme: "A man", pays: "Country of your passport", age: "Age", niveau: "Level of French", niv: ["1 · a little", "2 · fair", "3 · very good"], sejour: "Your stay", arr: "Arrival date", harr: "Arrival time (station or on site)", dep: "Departure date", p1: "Preferred area (1st choice)", p2: "2nd choice (optional)", canal: "You found us through", navette: "Shuttle from Écommoy station?", nav: ["Yes", "No", "I will confirm later"], sante: "Health and contact", besoins: "Any special need (health, treatment) we should know about?", urgence: "Emergency contact (name)", urgTel: "Emergency contact phone", repas: "Meals", engage: "Commitments", cond: "I agree to respect the rules of the Centre (no alcohol, smoking or meat on the premises).", rgpd: "I allow KMC France to use my details only to organise my stay. My data is deleted at the latest 3 years after my last stay.", envoyer: "Send my request", merci: "Thank you, we have received your request!", merciTxt: "You will receive a confirmation email. The volunteer team will get back to you soon." },
  };
  const F = window.F = { lang: "FR", envoye: null, v: { indicatif: "+33", urgInd: "+33", navette: "Oui", repas: "Végétarien", niveau: "3", age: "30-50", genre: "Une femme", canal: "Workaway" } };
  const val = (k) => esc(F.v[k] || "");

  window.vueFormulaire = function (interne) {
    const t = T[F.lang], r = S.etat.reglages;
    const langue = `<span class="langue" role="group" aria-label="Langue"><button class="${F.lang === "FR" ? "on" : ""}" onclick="F.lang='FR';R()">FR</button><button class="${F.lang === "EN" ? "on" : ""}" onclick="F.lang='EN';R()">EN</button></span>`;
    const haut = `<div class="haut"><span class="marque">CMK France</span>${langue}</div>` + (interne ? `<div class="encart"><strong>Saisie manuelle par la coordination.</strong> <a href="#/demandes">Retour aux demandes</a></div>` : "");
    if (F.envoye) {
      return `<div class="public">${haut}<div class="coche"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2F5222" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
        <h1 style="text-align:center">${t.merci}</h1><p style="text-align:center">${t.merciTxt}</p>
        <div class="carte"><div class="doux petit">Ce que voit la coordination (démo)</div><div class="ligne"><span>Fiche</span><strong>${esc(F.envoye.fiche)}</strong></div><div class="ligne"><span>Contrôles</span><span>${F.envoye.alertes || "aucune alerte"}</span></div></div>
        <div class="actions"><button class="btn sec" onclick="F.envoye=null;F.v={indicatif:'+33',urgInd:'+33',navette:'Oui',repas:'Végétarien',niveau:'3',age:'30-50',genre:'Une femme',canal:'Workaway'};R()">Nouvelle demande</button><a class="btn" href="#/demandes" onclick="V.filtre='recues'">Voir dans les demandes</a></div></div>`;
    }
    const ind = (k) => S.INDICATIFS.map(([p, c]) => `<option value="${c}" ${F.v[k] === c ? "selected" : ""}>${esc(p)} ${c}</option>`).join("");
    const poles = (k, vide) => (vide ? `<option value="">—</option>` : "") + r.poles.filter((p) => p.actif).map((p) => `<option ${F.v[k] === p.nom ? "selected" : ""}>${esc(p.nom)}</option>`).join("");
    const radios = (k, opts) => opts.map((o, i) => `<label class="inline"><input type="radio" name="${k}" value="${esc(o[0])}" ${F.v[k] === o[0] ? "checked" : ""} onchange="F.v.${k}=this.value"> ${esc(o[1])}</label>`).join("");
    const inp = (k, lab, type = "text", extra = "") => `<label for="f-${k}">${lab}</label><input type="${type}" id="f-${k}" value="${val(k)}" oninput="F.v.${k}=this.value" ${extra}>`;
    const tel = S.telValide(F.v.indicatif, F.v.tel || "");
    const fermetures = r.fermetures.map((f) => `${D.court(f.debut, F.lang)} → ${D.court(f.fin, F.lang)}`).join(" · ");
    return `<div class="public">${haut}<h1>${t.titre}</h1><p class="doux" style="margin:0">${t.intro}</p>
      <div class="encart">${t.ferme} : ${fermetures}. ${F.lang === "FR" ? `Séjour de ${r.regles.dureeMin} jours minimum.` : `Minimum stay: ${r.regles.dureeMin} days.`}</div>
      <section class="carte"><h2>${t.vous}</h2>
        <div class="grille g2"><div>${inp("prenom", t.prenom)}</div><div>${inp("nom", t.nom)}</div></div>
        ${inp("email", t.email, "email")}
        <label for="f-tel">${t.tel}</label><div class="tel"><select aria-label="Indicatif" onchange="F.v.indicatif=this.value;A.majTel()">${ind("indicatif")}</select><input type="tel" id="f-tel" value="${val("tel")}" placeholder="6 12 34 56 78" oninput="F.v.tel=this.value;A.majTel()"></div>
        <div id="tel-etat" class="${F.v.tel ? (tel.ok ? "valide" : "erreur") : "doux petit"}" style="margin-top:6px">${F.v.tel ? (tel.ok ? `✓ ${F.v.indicatif} ${tel.national}` : (F.lang === "FR" ? "Numéro incomplet pour cet indicatif" : "Number incomplete for this country code")) : t.telAide}</div>
        <div role="radiogroup" aria-label="${t.genre}" style="margin-top:8px"><div class="gras petit">${t.genre}</div>${radios("genre", [["Une femme", t.femme], ["Un homme", t.homme]])}</div>
        <div class="grille g2"><div>${inp("pays", t.pays)}</div><div><label for="f-age">${t.age}</label><select id="f-age" onchange="F.v.age=this.value"><option value="18-30" ${F.v.age === "18-30" ? "selected" : ""}>18–30</option><option value="30-50" ${F.v.age === "30-50" ? "selected" : ""}>30–50</option><option value="50+" ${F.v.age === "50+" ? "selected" : ""}>50 +</option></select></div></div>
        <label for="f-niv">${t.niveau}</label><select id="f-niv" onchange="F.v.niveau=this.value">${t.niv.map((n, i) => `<option value="${i + 1}" ${F.v.niveau == i + 1 ? "selected" : ""}>${n}</option>`).join("")}</select></section>
      <section class="carte"><h2>${t.sejour}</h2>
        <div class="grille g2"><div>${inp("arrivee", t.arr, "date", `onchange="A.majDates()"`)}</div><div>${inp("depart", t.dep, "date", `onchange="A.majDates()"`)}</div></div>
        <div id="dates-etat"></div>
        ${inp("heure", t.harr, "time")}
        <div class="grille g2"><div><label for="f-p1">${t.p1}</label><select id="f-p1" onchange="F.v.p1=this.value">${poles("p1")}</select></div><div><label for="f-p2">${t.p2}</label><select id="f-p2" onchange="F.v.p2=this.value">${poles("p2", true)}</select></div></div>
        <label for="f-canal">${t.canal}</label><select id="f-canal" onchange="F.v.canal=this.value">${["Workaway", "Worldpackers", "HelpX", "Bouche à oreille", "Déjà venu·e"].map((c) => `<option ${F.v.canal === c ? "selected" : ""}>${c}</option>`).join("")}</select>
        <div role="radiogroup" aria-label="${t.navette}" style="margin-top:10px"><div class="gras petit">${t.navette}</div>${radios("navette", T.FR.nav.map((n, i) => [n, t.nav[i]]))}<div class="doux petit">${F.lang === "FR" ? `Navette bénévoles ${r.regles.navettePlage}, à réserver ${r.regles.navetteDelaiJours} jours avant.` : `Volunteer shuttle ${r.regles.navettePlage}, to book ${r.regles.navetteDelaiJours} days ahead.`}</div></div></section>
      <section class="carte"><h2>${t.sante}</h2>
        <label for="f-besoins">${t.besoins}</label><textarea id="f-besoins" rows="2" oninput="F.v.besoins=this.value">${val("besoins")}</textarea>
        ${inp("urgNom", t.urgence)}
        <label for="f-urgTel">${t.urgTel}</label><div class="tel"><select aria-label="Indicatif du contact d'urgence" onchange="F.v.urgInd=this.value">${ind("urgInd")}</select><input type="tel" id="f-urgTel" value="${val("urgTel")}" oninput="F.v.urgTel=this.value"></div>
        <div role="radiogroup" aria-label="${t.repas}" style="margin-top:10px"><div class="gras petit">${t.repas}</div>${radios("repas", [["Végétarien", F.lang === "FR" ? "Végétarien" : "Vegetarian"], ["Vegan sans gluten", F.lang === "FR" ? "Vegan sans gluten" : "Vegan gluten free"]])}</div></section>
      <section class="carte"><h2>${t.engage}</h2>
        <label class="inline"><input type="checkbox" ${F.v.cond ? "checked" : ""} onchange="F.v.cond=this.checked"> ${t.cond}</label>
        <label class="inline"><input type="checkbox" ${F.v.rgpd ? "checked" : ""} onchange="F.v.rgpd=this.checked"> ${t.rgpd}</label></section>
      <div id="f-erreurs" class="erreur" role="alert"></div>
      <button class="btn" style="min-height:52px;font-size:17px" onclick="A.envoyer(${interne ? "true" : "false"})">${t.envoyer}</button></div>`;
  };

  A.majTel = function () {
    const e = document.getElementById("tel-etat"), t = S.telValide(F.v.indicatif, F.v.tel || "");
    if (!F.v.tel) { e.className = "doux petit"; e.textContent = T[F.lang].telAide; return; }
    e.className = t.ok ? "valide" : "erreur";
    e.textContent = t.ok ? `✓ ${F.v.indicatif} ${t.national}` : (F.lang === "FR" ? "Numéro incomplet pour cet indicatif" : "Number incomplete for this country code");
  };
  function problemesDates(a, d) {
    const r = S.etat.reglages, out = [];
    if (!a || !d) return out;
    if (d <= a) { out.push(F.lang === "FR" ? "La date de départ doit suivre l'arrivée." : "Departure must be after arrival."); return out; }
    if (a < S.aujourdhui()) out.push(F.lang === "FR" ? "La date d'arrivée est passée." : "Arrival date is in the past.");
    for (const f of r.fermetures) if (D.chevauche(a, d, f.debut, f.fin)) out.push((F.lang === "FR" ? "Le Centre est fermé du " : "The Centre is closed from ") + `${D.court(f.debut, F.lang)} → ${D.court(f.fin, F.lang)}`);
    if (F.v.p1 !== r.regles.exceptionDuree && D.ecart(a, d) < r.regles.dureeMin) out.push(F.lang === "FR" ? `Séjour de ${r.regles.dureeMin} jours minimum (vous : ${D.ecart(a, d)}).` : `Minimum stay ${r.regles.dureeMin} days (yours: ${D.ecart(a, d)}).`);
    return out;
  }
  A.majDates = function () {
    const p = problemesDates(F.v.arrivee, F.v.depart), e = document.getElementById("dates-etat");
    e.innerHTML = p.map((x) => `<div class="erreur">${esc(x)}</div>`).join("") || (F.v.arrivee && F.v.depart ? `<div class="valide">✓ ${D.ecart(F.v.arrivee, F.v.depart)} ${F.lang === "FR" ? "jours" : "days"}</div>` : "");
  };
  A.envoyer = function (interne) {
    const v = F.v, err = [], fr = F.lang === "FR";
    if (!v.prenom || !v.nom) err.push(fr ? "Prénom et nom obligatoires." : "First and family name required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email || "")) err.push(fr ? "Adresse e-mail invalide." : "Invalid email.");
    const tel = S.telValide(v.indicatif, v.tel || "");
    if (!tel.ok) err.push(fr ? "Téléphone : numéro invalide pour l'indicatif choisi." : "Phone: invalid number for this country code.");
    if (!v.arrivee || !v.depart) err.push(fr ? "Dates d'arrivée et de départ obligatoires." : "Arrival and departure dates required.");
    err.push(...problemesDates(v.arrivee, v.depart));
    if (!v.urgNom) err.push(fr ? "Contact d'urgence obligatoire." : "Emergency contact required.");
    if (!interne && (!v.cond || !v.rgpd)) err.push(fr ? "Merci d'accepter les engagements." : "Please accept the commitments.");
    document.getElementById("f-erreurs").innerHTML = err.map(esc).join("<br>");
    if (err.length) { document.getElementById("f-erreurs").scrollIntoView({ behavior: "smooth", block: "center" }); return; }

    // Même e-mail = même personne : on rattache le séjour à la fiche existante.
    let b = S.etat.benevoles.find((x) => x.email && x.email.toLowerCase() === v.email.toLowerCase());
    const connu = !!b;
    if (!b) {
      const cap = (x) => x.trim().toLowerCase().replace(/(^|[\s-])\S/g, (m) => m.toUpperCase());
      b = { id: S.nouvelId(), prenom: cap(v.prenom), nom: v.nom.trim().toUpperCase(), email: v.email.trim(), indicatif: v.indicatif, tel: tel.national, pays: v.pays || "", langue: Number(v.niveau) >= 2 ? "FR" : "EN", regime: v.repas, urgence: `${v.urgNom} ${v.urgInd} ${v.urgTel || ""}`.trim(), commentaires: [], signale: false, motifSignalement: "" };
      S.etat.benevoles.push(b);
    }
    const id = Math.max(...S.etat.sejours.map((s) => s.id)) + 1;
    const s = { id, benevole: b.id, arrivee: v.arrivee, depart: v.depart, heureArrivee: v.heure || "", heureDepart: "", navette: v.navette, souhaits: [v.p1 || S.etat.reglages.poles[0].nom, v.p2].filter(Boolean), pole: null, statut: "Reçue", canal: v.canal, sante: v.besoins || "", repos: [], lit: "", attestation: null };
    S.etat.sejours.push(s);
    S.tracer(id, interne ? "Séjour saisi à la main par la coordination" : "Demande reçue par le formulaire");
    S.tracer(id, `Mail « Accusé de réception » envoyé (${b.langue}) à ${b.email}`);
    const al = S.alertes(s).map((a) => a.txt).join(", ");
    F.envoye = { fiche: `${b.id}${connu ? " (bénévole déjà connu)" : " (nouvelle fiche)"}`, alertes: al };
    V.choisi = id; S.sauver(); R(); scrollTo(0, 0);
  };

  // =====================================================================
  // Attestation de bénévolat (téléphone)
  // =====================================================================
  const TA = {
    FR: { etape: "Étape", sur: "sur", bonjour: "Bonjour", fin: "votre séjour se termine le", intro: "Pour le remboursement de vos nuitées en dortoir, de vos repas et de vos jetons de lessive, confirmez les jours où vous avez fait du bénévolat, puis signez.", sejour: "Séjour", pole: "Pôle", prerempli: "Jours préremplis", jb: "bénévolat", jr: "repos", preAide: "Préremplis d'après le planning de votre pôle. Vous pouvez les corriger.", rembourse: "Remboursé : dortoir et repas les jours de bénévolat, lessive (1 jeton par semaine).", nonRemb: "Non remboursé : chambre individuelle, enseignements de retraite, transport.", commencer: "Commencer (2 minutes)", titre2: "Mes jours de bénévolat", tapez: "Touchez un jour pour le changer : bénévolat → repos → autre formule", ja: "autre formule (non remboursée)", jetons: "Jetons de lessive utilisés", honneur: "Je certifie sur l'honneur avoir effectué du bénévolat les jours indiqués.", signer: "Signez avec le doigt dans le cadre", effacer: "Effacer", continuer: "Continuer", titre3: "Confirmez votre signature", codeEnvoye: "Nous avons envoyé un code à 6 chiffres à", demo: "Démo : le code est", recap: "Récapitulatif", valider: "Valider mon attestation", retour: "Revenir au calendrier", codeFaux: "Code incorrect.", merci: "Merci", envoyee: "Votre attestation est signée et transmise à l'équipe. Une copie vous a été envoyée par e-mail.", signeLe: "Signée le", ref: "Référence", statut: "Statut", suite: "Le responsable de votre pôle vérifie les jours, puis la comptabilité calcule le remboursement.", pdf: "Télécharger ma copie", jours: ["L", "M", "M", "J", "V", "S", "D"], arr: "Arr", dep: "Dép" },
    EN: { etape: "Step", sur: "of", bonjour: "Hello", fin: "your stay ends on", intro: "To get your dormitory nights, meals and laundry tokens refunded, confirm the days you volunteered, then sign.", sejour: "Stay", pole: "Team", prerempli: "Pre-filled days", jb: "volunteering", jr: "rest", preAide: "Pre-filled from your team's schedule. You can correct them.", rembourse: "Refunded: dormitory and meals on volunteering days, laundry (1 token per week).", nonRemb: "Not refunded: single room, retreat teachings, travel.", commencer: "Start (2 minutes)", titre2: "My volunteering days", tapez: "Tap a day to change it: volunteering → rest → other", ja: "other (not refunded)", jetons: "Laundry tokens used", honneur: "I certify on my honour that I volunteered on the days indicated.", signer: "Sign with your finger in the box", effacer: "Clear", continuer: "Continue", titre3: "Confirm your signature", codeEnvoye: "We sent a 6-digit code to", demo: "Demo: the code is", recap: "Summary", valider: "Confirm my certificate", retour: "Back to the calendar", codeFaux: "Wrong code.", merci: "Thank you", envoyee: "Your certificate is signed and sent to the team. A copy was emailed to you.", signeLe: "Signed on", ref: "Reference", statut: "Status", suite: "Your team leader checks the days, then the accounts team calculates the refund.", pdf: "Download my copy", jours: ["M", "T", "W", "T", "F", "S", "S"], arr: "Arr", dep: "Dep" },
  };
  const AT = window.AT = { id: null, etape: 1, lang: null, code: null, signe: false, honneur: false };

  window.vueAttestation = function (id) {
    const s = S.sejour(id);
    if (!s) return `<div class="public"><div class="vide">Lien invalide.</div></div>`;
    const b = S.benevole(s.benevole);
    if (AT.id !== s.id) Object.assign(AT, { id: s.id, etape: s.attestation && !["en cours"].includes(s.attestation.statut) ? 4 : 1, lang: b.langue, code: null, signe: false, honneur: false });
    if (!s.attestation) { s.attestation = S.nouvelleAttestation(s); S.sauver(); }
    const a = s.attestation, t = TA[AT.lang];
    const langue = `<span class="langue" role="group" aria-label="Langue"><button class="${AT.lang === "FR" ? "on" : ""}" onclick="AT.lang='FR';R()">FR</button><button class="${AT.lang === "EN" ? "on" : ""}" onclick="AT.lang='EN';R()">EN</button></span>`;
    const haut = `<div class="haut"><span class="marque">CMK France</span>${langue}</div>` + (AT.etape < 4 ? `<div class="doux petit">${t.etape} ${AT.etape} ${t.sur} 3</div><div class="etapes"><div class="on"></div><div class="${AT.etape >= 2 ? "on" : ""}"></div><div class="${AT.etape >= 3 ? "on" : ""}"></div></div>` : "");
    const nb = Object.keys(a.jours).length ? S.compte(a, "b") : null;
    let corps = "";
    if (AT.etape === 1) {
      corps = `<h1>${t.bonjour} ${esc(b.prenom)}, ${t.fin} ${D.court(s.depart, AT.lang)}</h1><p style="margin:0;line-height:1.5">${t.intro}</p>
        <div class="carte"><div class="ligne"><span>${t.sejour}</span><strong>${U.periode(s, AT.lang)}</strong></div><div class="ligne"><span>${t.pole}</span><strong>${esc(s.pole)}</strong></div>
        <div class="ligne"><span>${t.prerempli}</span><strong>${S.compte(a, "b")} ${t.jb} · ${S.compte(a, "r")} ${t.jr}</strong></div><div class="doux petit">${t.preAide}</div></div>
        <div class="encart" style="line-height:1.5">${t.rembourse}<br>${t.nonRemb}</div>
        <button class="btn" style="min-height:52px" onclick="AT.etape=2;R();scrollTo(0,0)">${t.commencer}</button>`;
    } else if (AT.etape === 2) {
      const jours = S.joursAttestables(s);
      const decal = (D.jourSemaine(s.arrivee) + 6) % 7;
      const cases = `<div></div>`.repeat(decal) + `<button class="fixe" disabled>${Number(s.arrivee.slice(8))}<br>${t.arr}</button>` +
        jours.map((j) => `<button class="${a.jours[j]}" aria-label="${D.fr(j)} : ${{ b: t.jb, r: t.jr, a: t.ja }[a.jours[j]]}" onclick="A.basculerJour('${j}')">${Number(j.slice(8))}</button>`).join("") +
        `<button class="fixe" disabled>${Number(s.depart.slice(8))}<br>${t.dep}</button>`;
      corps = `<h1>${t.titre2}</h1><div class="carte" style="padding:14px"><div class="doux petit" style="margin-bottom:8px">${t.tapez}</div>
        <div class="cal">${t.jours.map((x) => `<div class="tete">${x}</div>`).join("")}${cases}</div>
        <div class="legende petit" style="margin-top:10px"><span><i style="background:var(--ok)"></i>${t.jb} (${S.compte(a, "b")})</span><span><i style="background:var(--repos)"></i>${t.jr} (${S.compte(a, "r")})</span><span><i style="background:var(--violet)"></i>${t.ja} (${S.compte(a, "a")})</span></div></div>
        <div class="carte" style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px"><span class="gras">${t.jetons}</span><span class="stepper"><button aria-label="-1" onclick="A.jetons(-1)">−</button><output>${a.jetons}</output><button aria-label="+1" onclick="A.jetons(1)">+</button></span></div>
        <div class="carte" style="padding:14px"><label class="inline" style="margin-top:0"><input type="checkbox" ${AT.honneur ? "checked" : ""} onchange="AT.honneur=this.checked;A.majContinuer()"> ${t.honneur}</label>
          <div class="doux petit" style="margin:6px 0">${t.signer}</div><canvas class="signature" id="sig" aria-label="${t.signer}"></canvas>
          <button class="btn lien petit" onclick="A.effacerSig()">${t.effacer}</button></div>
        <button class="btn" id="continuer" style="min-height:52px" onclick="A.versCode()" ${AT.honneur && AT.signe ? "" : "disabled"}>${t.continuer}</button>`;
    } else if (AT.etape === 3) {
      if (!AT.code) AT.code = String(Math.floor(100000 + Math.random() * 900000));
      const masque = b.email.replace(/^(.).*(@.*)$/, "$1•••$2");
      corps = `<h1>${t.titre3}</h1><p style="margin:0">${t.codeEnvoye} <strong>${esc(masque)}</strong>.</p>
        <div class="encart">${t.demo} <strong>${AT.code}</strong></div>
        <div class="code">${[0, 1, 2, 3, 4, 5].map((i) => `<input inputmode="numeric" maxlength="1" aria-label="Chiffre ${i + 1}" id="c${i}" oninput="A.chiffre(${i},this)">`).join("")}</div>
        <div id="code-err" class="erreur" style="text-align:center"></div>
        <div class="carte" style="padding:14px"><div class="gras" style="margin-bottom:6px">${t.recap}</div><div class="ligne"><span>${t.jb}</span><span>${S.compte(a, "b")}</span></div><div class="ligne"><span>${t.jr}</span><span>${S.compte(a, "r")}</span></div><div class="ligne"><span>${t.ja}</span><span>${S.compte(a, "a")}</span></div><div class="ligne"><span>${t.jetons}</span><span>${a.jetons}</span></div></div>
        <button class="btn" style="min-height:52px" onclick="A.validerCode()">${t.valider}</button><button class="btn sec" onclick="AT.etape=2;AT.signe=false;R()">${t.retour}</button>`;
    } else {
      corps = `<div class="coche"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2F5222" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
        <h1 style="text-align:center">${t.merci} ${esc(b.prenom)} !</h1><p style="text-align:center;margin:0;line-height:1.5">${t.envoyee}</p>
        <div class="carte" style="padding:14px"><div class="ligne"><span>${t.signeLe}</span><span>${a.signeLe ? D.fr(a.signeLe.slice(0, 10)) + " " + a.signeLe.slice(11, 16) : "—"}</span></div><div class="ligne"><span>${t.ref}</span><span>ATT-${s.arrivee.slice(0, 4)}-${String(s.id).padStart(4, "0")}</span></div><div class="ligne"><span>${t.statut}</span>${U.puce(a.statut, "ok")}</div>${nb !== null ? `<div class="ligne"><span>${t.jb}</span><span>${nb}</span></div>` : ""}</div>
        <p class="doux petit" style="margin:0">${t.suite}</p>
        <button class="btn sec" onclick="A.copie(${s.id})">${t.pdf}</button><a class="btn lien" href="#/attestations">→ Côté coordination (démo)</a>`;
    }
    setTimeout(A.initSig, 0);
    return `<div class="public">${haut}${corps}</div>`;
  };

  A.basculerJour = function (j) {
    const a = S.sejour(AT.id).attestation;
    a.jours[j] = { b: "r", r: "a", a: "b" }[a.jours[j]];
    S.sauver(); const sig = AT.signe; AT.signe = false; R(); if (sig) U.toast(AT.lang === "FR" ? "Jours modifiés : merci de signer à nouveau" : "Days changed: please sign again");
  };
  A.jetons = function (d) {
    const s = S.sejour(AT.id), a = s.attestation;
    a.jetons = Math.max(0, Math.min(S.jetonsMax(s), a.jetons + d)); S.sauver(); AT.signe = false; R();
  };
  A.majContinuer = () => { const b = document.getElementById("continuer"); if (b) b.disabled = !(AT.honneur && AT.signe); };
  A.initSig = function () {
    const c = document.getElementById("sig"); if (!c || c.dataset.pret) return;
    c.dataset.pret = "1";
    const r = c.getBoundingClientRect(), ratio = window.devicePixelRatio || 1;
    c.width = r.width * ratio; c.height = r.height * ratio;
    const ctx = c.getContext("2d"); ctx.scale(ratio, ratio); ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.strokeStyle = "#231F1A";
    let trace = false;
    const pos = (e) => { const b = c.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    c.addEventListener("pointerdown", (e) => { trace = true; c.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.moveTo(...pos(e)); });
    c.addEventListener("pointermove", (e) => { if (!trace) return; ctx.lineTo(...pos(e)); ctx.stroke(); if (!AT.signe) { AT.signe = true; A.majContinuer(); } });
    c.addEventListener("pointerup", () => { trace = false; });
  };
  A.effacerSig = function () { const c = document.getElementById("sig"); c.getContext("2d").clearRect(0, 0, c.width, c.height); AT.signe = false; A.majContinuer(); };
  A.versCode = () => { AT.etape = 3; AT.code = null; R(); setTimeout(() => { const e = document.getElementById("c0"); if (e) e.focus(); }, 50); };
  A.chiffre = function (i, el) {
    el.value = el.value.replace(/\D/g, "");
    if (el.value && i < 5) document.getElementById("c" + (i + 1)).focus();
    if (i === 5 && el.value) A.validerCode();
  };
  A.validerCode = function () {
    const saisi = [0, 1, 2, 3, 4, 5].map((i) => document.getElementById("c" + i).value).join("");
    if (saisi !== AT.code) { document.getElementById("code-err").textContent = TA[AT.lang].codeFaux; return; }
    const s = S.sejour(AT.id), now = new Date();
    s.attestation.statut = "signée";
    s.attestation.signeLe = `${S.aujourdhui()}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    S.tracer(s.id, "Attestation signée par le bénévole (code e-mail confirmé)");
    AT.etape = 4; S.sauver(); R(); scrollTo(0, 0);
  };
  A.copie = function (id) {
    const s = S.sejour(id), b = S.benevole(s.benevole), a = s.attestation;
    const lignes = Object.entries(a.jours).map(([j, v]) => `${D.fr(j)}  ${{ b: "bénévolat", r: "repos", a: "autre formule" }[v]}`).join("\n");
    const txt = `ATTESTATION DE BÉNÉVOLAT — CMK France\n\n${S.nom(b)} (${b.id})\nSéjour du ${D.fr(s.arrivee)} au ${D.fr(s.depart)} · pôle ${s.pole}\n\n${lignes}\n\nJetons de lessive : ${a.jetons}\nSignée le ${a.signeLe}\n\nJe certifie sur l'honneur avoir effectué du bénévolat les jours indiqués.\n(Copie de démonstration — dans l'outil réel, un PDF signé.)`;
    const el = document.createElement("a"); el.href = URL.createObjectURL(new Blob([txt], { type: "text/plain" })); el.download = `attestation-${b.id}.txt`; el.click();
  };

  // =====================================================================
  // Page « liens d'attestation » (démo : simule les liens reçus par e-mail)
  // =====================================================================
  window.vueEspace = function () {
    const liste = S.etat.sejours.filter((s) => ["Arrivé·e", "Parti·e"].includes(s.statut)).sort((a, b) => a.depart.localeCompare(b.depart));
    const lignes = liste.map((s) => { const b = S.benevole(s.benevole), a = s.attestation; return `<div class="item"><div class="qui"><strong>${esc(S.nom(b))}</strong> <span class="doux">· départ ${D.court(s.depart)} · ${esc(s.pole)}</span></div>${a ? U.puce(a.statut, a.statut === "en cours" ? "neutre" : "ok") : U.puce("pas commencée", "neutre")}<a class="btn sec" href="#/attestation/${s.id}">Ouvrir le lien</a></div>`; }).join("");
    return U.entete("Démo : les liens que les bénévoles reçoivent par e-mail", "Liens d'attestation") +
      `<div class="encart">Ouvrez un lien sur votre téléphone (ou réduisez la fenêtre) pour tester la justification du bénévolat comme un bénévole. Essayez <strong>Léa Martin</strong>, qui part le 30 septembre.</div>
      <section class="carte">${lignes}</section>`;
  };
})();
