/* =========================================================
   COACH NEIRAM — Consentement à la mesure d'audience
   -----------------------------------------------------------------
   Google Analytics n'est PAS chargé au démarrage. Le script n'est
   injecté qu'après un accord explicite du visiteur. Un refus est
   respecté, mémorisé, et n'est jamais redemandé avant six mois.

   Ce fichier est volontairement autonome et sans dépendance : il doit
   fonctionner même si tout le reste échoue.
   ========================================================= */

(function () {
  "use strict";

  var MESURE_ID = "G-BFBJ2LXR71";
  var CLE = "coachneiram-consentement";

  // Durées de validité, en jours. La CNIL recommande de ne pas
  // resolliciter un visiteur qui a refusé avant plusieurs mois, et de
  // limiter la durée de vie d'un accord.
  var VALIDITE_ACCEPTE = 390; // ~13 mois
  var VALIDITE_REFUSE = 182;  // ~6 mois

  var banniere, boutonAccepter, boutonRefuser;

  /* ---------- Stockage ----------
     localStorage peut lever une exception (navigation privée, stockage
     désactivé). Dans ce cas on se comporte comme si aucun choix n'était
     enregistré : la bannière réapparaît, et rien n'est déposé sans accord. */

  function lire() {
    try {
      var brut = window.localStorage.getItem(CLE);
      if (!brut) return null;

      var donnee = JSON.parse(brut);
      if (!donnee || !donnee.choix || !donnee.date) return null;

      var joursEcoules = (Date.now() - new Date(donnee.date).getTime()) / 86400000;
      var limite = donnee.choix === "accepte" ? VALIDITE_ACCEPTE : VALIDITE_REFUSE;
      if (joursEcoules > limite) return null;

      return donnee.choix;
    } catch (e) {
      return null;
    }
  }

  function ecrire(choix) {
    try {
      window.localStorage.setItem(CLE, JSON.stringify({
        choix: choix,
        date: new Date().toISOString()
      }));
    } catch (e) {
      /* Choix non mémorisable : la question sera reposée. Sans gravité. */
    }
  }

  /* ---------- Chargement de la mesure d'audience ---------- */

  var dejaCharge = false;

  function chargerMesure() {
    if (dejaCharge || !MESURE_ID) return;
    dejaCharge = true;

    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + MESURE_ID;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", MESURE_ID, {
      // On limite ce qui est transmis au strict nécessaire à la mesure.
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
  }

  /* ---------- Nettoyage après un refus ----------
     Un visiteur ayant navigué sur l'ancienne version du site peut encore
     porter des cookies _ga. Un refus doit aussi les supprimer. */

  function supprimerCookiesMesure() {
    var domaines = [location.hostname, "." + location.hostname];

    var pointDomaine = location.hostname.split(".");
    if (pointDomaine.length > 2) {
      domaines.push("." + pointDomaine.slice(-2).join("."));
    }

    document.cookie.split(";").forEach(function (entree) {
      var nom = entree.split("=")[0].trim();
      if (nom.indexOf("_ga") !== 0 && nom.indexOf("_gid") !== 0) return;

      domaines.forEach(function (domaine) {
        document.cookie = nom + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=" + domaine;
      });
      document.cookie = nom + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    });
  }

  /* ---------- Bannière ---------- */

  function ouvrir() {
    if (!banniere) return;
    banniere.classList.add("is-open");
    banniere.removeAttribute("inert");
  }

  function fermer() {
    if (!banniere) return;
    banniere.classList.remove("is-open");
    banniere.setAttribute("inert", "");
  }

  function accepter() {
    ecrire("accepte");
    chargerMesure();
    fermer();
  }

  function refuser() {
    ecrire("refuse");
    supprimerCookiesMesure();
    fermer();
  }

  function init() {
    banniere = document.getElementById("consent");
    if (!banniere) return;

    boutonAccepter = banniere.querySelector("[data-consent-accept]");
    boutonRefuser = banniere.querySelector("[data-consent-refuse]");

    if (boutonAccepter) boutonAccepter.addEventListener("click", accepter);
    if (boutonRefuser) boutonRefuser.addEventListener("click", refuser);

    // Permet de revenir sur son choix à tout moment (lien du pied de page).
    document.querySelectorAll("[data-consent-reopen]").forEach(function (lien) {
      lien.addEventListener("click", function (e) {
        e.preventDefault();
        ouvrir();
        if (boutonRefuser) boutonRefuser.focus();
      });
    });

    var choix = lire();

    // Hors accord explicite, aucun cookie de mesure ne doit subsister —
    // y compris ceux hérités de l'ancienne version du site, qui déposait
    // Google Analytics sans rien demander.
    if (choix !== "accepte") supprimerCookiesMesure();

    if (choix === "accepte") {
      chargerMesure();
    } else if (choix === "refuse") {
      /* Rien à faire de plus : le nettoyage a déjà eu lieu. */
    } else {
      // Aucun choix valide : on demande. Léger délai pour ne pas
      // percuter l'animation d'entrée du hero.
      window.setTimeout(ouvrir, 900);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
