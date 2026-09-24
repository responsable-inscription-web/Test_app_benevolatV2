/* Petits outils d'affichage partagés par toutes les vues. */
(function () {
  const U = {};
  U.esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  U.puce = (txt, type = "") => `<span class="puce ${type}">${U.esc(txt)}</span>`;
  U.statutPuce = (st) => U.puce(st, { "Reçue": "", "RDV proposé": "neutre", "RDV fait": "neutre", "Acceptée": "ok", "Confirmée": "ok", "Arrivé·e": "ok", "Parti·e": "neutre", "Liste d'attente": "violet", "Refusée": "alerte", "Désistée": "alerte" }[st] || "");
  U.alertesPuces = (s) => S.alertes(s).map((a) => U.puce(a.txt, a.type)).join(" ");
  U.periode = (s, lang) => `${S.D.court(s.arrivee, lang)} → ${S.D.court(s.depart, lang)}`;
  U.euros = (n) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

  U.toast = function (msg) {
    document.querySelectorAll(".toast").forEach((x) => x.remove());
    const t = document.createElement("div");
    t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  };

  // Fenêtre (boîte de dialogue) : explique au bénévole pourquoi sa demande ne peut pas partir.
  U.fenetre = function (titre, lignes, bouton) {
    U.fermerFenetre();
    const f = document.createElement("div");
    f.className = "voile"; f.id = "fenetre";
    f.innerHTML = `<div class="fenetre" role="dialog" aria-modal="true" aria-labelledby="fenetre-titre"><h2 id="fenetre-titre">${U.esc(titre)}</h2>
      <ul>${lignes.map((l) => `<li>${U.esc(l)}</li>`).join("")}</ul><button class="btn" onclick="U.fermerFenetre()">${U.esc(bouton)}</button></div>`;
    f.addEventListener("click", (e) => { if (e.target === f) U.fermerFenetre(); });
    document.body.appendChild(f);
    f.querySelector("button").focus();
  };
  U.fermerFenetre = () => { const f = document.getElementById("fenetre"); if (f) f.remove(); };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") U.fermerFenetre(); });

  // Coquille de l'espace équipe : menu + contenu.
  U.coquille = function (actif, html) {
    const aTraiter = S.etat.sejours.filter(S.enCours).length;
    const aValider = S.etat.sejours.filter((s) => s.attestation && s.attestation.statut === "signée").length;
    const kbs = S.kbsAFaire().length;
    const lien = (h, t, extra = "") => `<a href="#/${h}" class="${actif === h ? "actif" : ""}">${t}${extra}</a>`;
    return `<div class="coquille">
      <nav class="menu" aria-label="Navigation principale">
        <div class="marque">Bénévolat</div><div class="sous">CMK France · prototype</div>
        ${lien("", "Tableau de bord")}
        ${lien("demandes", "Demandes", aTraiter ? `<span class="pastille">${aTraiter}</span>` : "")}
        ${lien("benevoles", "Bénévoles")}
        ${lien("planning", "Plannings des pôles")}
        ${lien("arrivees", "Arrivées et navettes")}
        ${lien("kbs", "À reporter dans KBS", kbs ? `<span class="pastille">${kbs}</span>` : "")}
        ${lien("reglages", "Réglages")}
        <div class="sep">Côté bénévole</div>
        ${lien("formulaire", "Formulaire public")}
        <div class="sep">Phase 2 · idée à valider</div>
        ${lien("attestations", "Attestations", aValider ? `<span class="pastille">${aValider}</span>` : "")}
        ${lien("espace", "Liens d'attestation")}
        <div class="bas">Date de démo : ${S.D.fr(S.aujourdhui())}</div>
      </nav>
      <main class="contenu" id="principal">${html}</main></div>`;
  };
  U.entete = (sur, titre, actions = "") => `<div class="entete"><div><div class="sur">${sur}</div><h1>${titre}</h1></div><div class="actions">${actions}</div></div>`;

  window.U = U;
})();
