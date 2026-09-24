/* Routeur : lit l'adresse (#/...) et affiche la bonne vue. */
(function () {
  const racine = document.getElementById("app");
  function route() {
    const h = location.hash.replace(/^#\/?/, "");
    const [chemin, requete] = h.split("?");
    const [page, param] = chemin.split("/");
    return { page: page || "", param, requete: new URLSearchParams(requete || "") };
  }
  // Un champ qui perd le focus pendant l'affichage peut relancer R() : on diffère ce second rendu.
  let enCours = false;
  window.R = function () {
    if (enCours) { setTimeout(R, 0); return; }
    enCours = true;
    try { rendre(); } finally { enCours = false; }
  };
  function rendre() {
    const { page, param, requete } = route();
    let html;
    switch (page) {
      case "formulaire": html = vueFormulaire(requete.get("interne") === "1"); break;
      case "attestation": html = vueAttestation(param); break;
      case "demandes": html = U.coquille("demandes", vueDemandes()); break;
      case "benevoles": html = U.coquille("benevoles", vueBenevoles(param)); break;
      case "planning": html = U.coquille("planning", vuePlanning()); break;
      case "arrivees": html = U.coquille("arrivees", vueArrivees()); break;
      case "attestations": html = U.coquille("attestations", vueAttestations()); break;
      case "reglages": html = U.coquille("reglages", vueReglages()); break;
      case "satellite": html = vueSatellitePole(decodeURIComponent(param || "")); break;
      case "satellite-accueil": html = vueSatelliteAccueil(); break;
      case "kbs": html = U.coquille("kbs", vueKbs()); break;
      case "espace": html = U.coquille("espace", vueEspace()); break;
      default: html = U.coquille("", vueTableau());
    }
    racine.innerHTML = html;
    if (window.apres) { const f = window.apres; window.apres = null; f(); }
    document.title = ({ formulaire: "Demande de séjour", attestation: "Attestation de bénévolat", satellite: "Satellite " + decodeURIComponent(param || ""), "satellite-accueil": "Satellite accueil" }[page] || "Bénévolat") + " · CMK France (prototype)";
  }
  let dernier = null;
  window.addEventListener("hashchange", () => { U.fermerFenetre(); const p = route().page; if (p !== dernier) { V.recherche = ""; V.defil = null; V.allerAuj = true; V.passe = 0; scrollTo(0, 0); } dernier = p; R(); });
  dernier = route().page;
  R();
})();
