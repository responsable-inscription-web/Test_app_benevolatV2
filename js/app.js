/* Routeur : lit l'adresse (#/...) et affiche la bonne vue. */
(function () {
  const racine = document.getElementById("app");
  function route() {
    const h = location.hash.replace(/^#\/?/, "");
    const [chemin, requete] = h.split("?");
    const [page, param] = chemin.split("/");
    return { page: page || "", param, requete: new URLSearchParams(requete || "") };
  }
  window.R = function () {
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
      case "espace": html = U.coquille("espace", vueEspace()); break;
      default: html = U.coquille("", vueTableau());
    }
    racine.innerHTML = html;
    document.title = ({ formulaire: "Demande de séjour", attestation: "Attestation de bénévolat" }[page] || "Bénévolat") + " · CMK France (prototype)";
  };
  let dernier = null;
  window.addEventListener("hashchange", () => { const p = route().page; if (p !== dernier) { V.recherche = ""; scrollTo(0, 0); } dernier = p; R(); });
  dernier = route().page;
  R();
})();
