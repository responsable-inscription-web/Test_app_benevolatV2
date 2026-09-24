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

  // Coquille de l'espace équipe : menu + contenu.
  U.coquille = function (actif, html) {
    const aTraiter = S.etat.sejours.filter(S.enCours).length;
    const aValider = S.etat.sejours.filter((s) => s.attestation && s.attestation.statut === "signée").length;
    const lien = (h, t, extra = "") => `<a href="#/${h}" class="${actif === h ? "actif" : ""}">${t}${extra}</a>`;
    return `<div class="coquille">
      <nav class="menu" aria-label="Navigation principale">
        <div class="marque">Bénévolat</div><div class="sous">CMK France · prototype</div>
        ${lien("", "Tableau de bord")}
        ${lien("demandes", "Demandes", aTraiter ? `<span class="pastille">${aTraiter}</span>` : "")}
        ${lien("benevoles", "Bénévoles")}
        ${lien("planning", "Plannings des pôles")}
        ${lien("arrivees", "Arrivées et navettes")}
        ${lien("attestations", "Attestations", aValider ? `<span class="pastille">${aValider}</span>` : "")}
        ${lien("reglages", "Réglages")}
        <div class="sep">Côté bénévole</div>
        ${lien("formulaire", "Formulaire public")}
        ${lien("espace", "Liens d'attestation")}
        <div class="bas">Date de démo : ${S.D.fr(S.aujourdhui())}</div>
      </nav>
      <main class="contenu" id="principal">${html}</main></div>`;
  };
  U.entete = (sur, titre, actions = "") => `<div class="entete"><div><div class="sur">${sur}</div><h1>${titre}</h1></div><div class="actions">${actions}</div></div>`;

  window.U = U;
})();
