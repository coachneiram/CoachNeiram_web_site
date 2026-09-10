/* =========================================================
   COACH NEIRAM — Comportements d'interface
   Aucune dépendance : ce fichier fonctionne même si GSAP
   ou Lenis ne se chargent pas (CDN bloqué, réseau lent).
   ========================================================= */

(function () {
  "use strict";

  var doc = document;

  /* ---------- Année du copyright ---------- */
  doc.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Barre de navigation ----------
     Opaque dès qu'on quitte le haut, escamotée quand on descend,
     rendue au moindre retour vers le haut. */

  var nav = doc.getElementById("nav");
  var lastY = window.scrollY;
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;

    if (nav) {
      nav.classList.toggle("is-stuck", y > 40);

      var goingDown = y > lastY && y > 400;
      // Tant que le menu mobile est ouvert, la barre reste visible.
      if (!doc.body.classList.contains("menu-open")) {
        nav.classList.toggle("is-hidden", goingDown);
      }
    }

    // Le CTA mobile n'apparaît qu'une fois le hero dépassé.
    if (mobileCta) {
      mobileCta.classList.toggle("is-visible", y > window.innerHeight * 0.85);
    }

    lastY = y;
    ticking = false;
  }

  var mobileCta = doc.getElementById("mobileCta");
  if (mobileCta) doc.body.classList.add("has-mobile-cta");

  window.addEventListener("scroll", function () {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });

  onScroll();

  /* ---------- Menu plein écran ----------
     `inert` retire tout le menu fermé du parcours clavier et des
     lecteurs d'écran : pas besoin de gérer les tabindex à la main. */

  var burger = doc.getElementById("burger");
  var menu = doc.getElementById("menu");

  function setMenu(open) {
    if (!menu || !burger) return;

    menu.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    doc.body.classList.toggle("menu-open", open);
    doc.body.style.overflow = open ? "hidden" : "";

    if (open) {
      menu.removeAttribute("inert");
      var first = menu.querySelector(".menu__link");
      if (first) first.focus();
    } else {
      menu.setAttribute("inert", "");
    }
  }

  if (burger) {
    burger.addEventListener("click", function () {
      setMenu(burger.getAttribute("aria-expanded") !== "true");
    });
  }

  if (menu) {
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { setMenu(false); });
    });
  }

  doc.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && doc.body.classList.contains("menu-open")) {
      setMenu(false);
      if (burger) burger.focus();
    }
  });

  /* ---------- Profils « tu te reconnais ? » ----------
     Survol et focus clavier changent l'image affichée à droite. */

  var profileBlock = doc.querySelector("[data-profiles]");

  if (profileBlock) {
    var rows = profileBlock.querySelectorAll("[data-profile]");
    var frames = profileBlock.querySelectorAll("[data-profile-media]");

    var show = function (index) {
      rows.forEach(function (row) {
        row.classList.toggle("is-active", row.dataset.profile === String(index));
      });
      frames.forEach(function (frame) {
        frame.classList.toggle("is-showing", frame.dataset.profileMedia === String(index));
      });
    };

    rows.forEach(function (row) {
      var idx = row.dataset.profile;
      row.addEventListener("mouseenter", function () { show(idx); });
      row.addEventListener("focus", function () { show(idx); });
    });

    // Premier profil affiché par défaut : la colonne image n'est jamais vide.
    show(0);
  }

  /* ---------- Rail des avis ----------
     Les flèches gauche/droite font défiler quand le rail a le focus. */

  doc.querySelectorAll("[data-rail]").forEach(function (rail) {
    rail.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      var step = rail.clientWidth * 0.8;
      rail.scrollBy({ left: e.key === "ArrowRight" ? step : -step, behavior: "smooth" });
    });
  });

  /* ---------- Ancres ----------
     Décalage pour ne pas passer sous la barre fixe. */

  doc.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (!id || id === "#") return;

      var target = doc.querySelector(id);
      if (!target) return;

      e.preventDefault();

      var top = target.getBoundingClientRect().top + window.scrollY - 70;

      // Lenis pilote le scroll s'il est disponible, sinon on retombe
      // sur l'API native.
      if (window.__lenis) {
        window.__lenis.scrollTo(top, { duration: 1.1 });
      } else {
        window.scrollTo({ top: top, behavior: "smooth" });
      }

      // On garde l'ancre dans l'URL sans provoquer de saut.
      if (history.replaceState) history.replaceState(null, "", id);
    });
  });
})();
