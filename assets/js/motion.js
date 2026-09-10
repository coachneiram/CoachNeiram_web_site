/* =========================================================
   COACH NEIRAM — Mouvement
   -----------------------------------------------------------------
   Règle de conduite : l'animation sert la narration, jamais l'inverse.
   Tout est lent, tenu, et se coupe proprement dès que l'appareil
   ou l'utilisateur ne veut pas de mouvement.
   ========================================================= */

(function () {
  "use strict";

  var root = document.documentElement;

  /* ---------- 1. Faut-il animer ? ---------- */

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /** Heuristique d'appareil faible : on préfère un site rapide
      à un site animé qui saccade. */
  function isLowPower() {
    var cores = navigator.hardwareConcurrency || 8;
    var memory = navigator.deviceMemory || 8;
    return cores <= 4 || memory <= 4;
  }

  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  if (prefersReducedMotion() || !hasGsap) {
    // Contenu rendu dans son état final : le site reste parfaitement utilisable.
    root.classList.add("no-motion");
    return;
  }

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  var lightMode = isLowPower();
  if (lightMode) root.classList.add("is-light-motion");

  /* ---------- 2. Smooth scroll (Lenis) ----------
     Désactivé sur appareil faible et sur pointeur tactile : le scroll
     natif y est plus fluide que n'importe quelle inertie simulée. */

  var wantsLenis =
    typeof window.Lenis !== "undefined" &&
    !lightMode &&
    window.matchMedia("(min-width: 1000px)").matches;

  if (wantsLenis) {
    var lenis = new window.Lenis({
      duration: 1.1,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      touchMultiplier: 1.6
    });

    window.__lenis = lenis;
    root.classList.add("lenis-active");

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- 3. Hero ----------
     Le titre monte ligne par ligne depuis son masque, puis l'image
     dérive lentement pendant le scroll. */

  var heroLines = document.querySelectorAll("[data-reveal-lines] .line-mask > span");

  if (heroLines.length) {
    // On repart d'un état explicite : le CSS pose translateY(105%), que GSAP
    // interprète en pixels. Sans redéclarer y ET yPercent ici, la translation
    // en pixels resterait en place et le titre ne remonterait jamais.
    gsap.fromTo(heroLines,
      { yPercent: 105, y: 0, opacity: 0 },
      {
        yPercent: 0,
        y: 0,
        opacity: 1,
        duration: 1.25,
        ease: "expo.out",
        stagger: 0.12,
        delay: 0.15
      }
    );
  }

  var heroReveals = document.querySelectorAll(".hero [data-reveal]");

  if (heroReveals.length) {
    gsap.to(heroReveals, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power2.out",
      stagger: 0.1,
      delay: 0.55
    });
  }

  var heroMedia = document.querySelector("[data-parallax-hero] .media");

  if (heroMedia && !lightMode) {
    gsap.to(heroMedia, {
      "--hero-shift": "-7%",
      "--hero-zoom": 1.16,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });
  }

  /* ---------- 4. Révélations génériques ----------
     Un seul ScrollTrigger par élément, joué une fois : c'est ce qui
     coûte le moins cher tout en restant lisible. */

  gsap.utils.toArray("[data-reveal]").forEach(function (el) {
    // Le hero est déjà animé au chargement, on ne le rejoue pas au scroll.
    if (el.closest(".hero")) return;

    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.85,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        once: true
      }
    });
  });

  /* ---------- 5. Révélation des images par clip-path ---------- */

  gsap.utils.toArray("[data-reveal-media]").forEach(function (el) {
    gsap.to(el, {
      clipPath: "inset(0 0 0% 0)",
      duration: 1.3,
      ease: "expo.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        once: true
      }
    });
  });

  /* ---------- 6. Séquence sticky « la transformation » ---------- */

  var seq = document.querySelector("[data-seq]");

  if (seq) {
    var steps = seq.querySelectorAll("[data-step]");
    var counter = seq.querySelector("[data-seq-current]");

    steps.forEach(function (step, i) {
      ScrollTrigger.create({
        trigger: step,
        start: "top 65%",
        end: "bottom 45%",
        onToggle: function (self) {
          step.classList.toggle("is-active", self.isActive);
          if (self.isActive && counter) {
            counter.textContent = String(i + 1).padStart(2, "0");
          }
        }
      });
    });
  }

  /* ---------- 7. Méthode : piliers + barre de progression ---------- */

  var method = document.querySelector("[data-method]");

  if (method) {
    var fill = method.querySelector("[data-method-fill]");

    if (fill) {
      gsap.to(fill, {
        height: "100%",
        ease: "none",
        scrollTrigger: {
          trigger: method,
          start: "top 70%",
          end: "bottom 70%",
          scrub: 0.4
        }
      });
    }

    method.querySelectorAll("[data-pillar]").forEach(function (pillar) {
      ScrollTrigger.create({
        trigger: pillar,
        start: "top 72%",
        end: "bottom 40%",
        onToggle: function (self) { pillar.classList.toggle("is-active", self.isActive); }
      });
    });
  }

  /* ---------- 8. Galerie : scroll horizontal contrôlé ----------
     Uniquement sur grand écran. En dessous, le CSS rend la main au
     défilement tactile natif, plus fiable et plus rapide. */

  gsap.matchMedia().add("(min-width: 1000px)", function () {
    var wrap = document.querySelector("[data-gallery]");
    var track = document.querySelector("[data-gallery-track]");
    if (!wrap || !track) return;

    var distance = function () { return track.scrollWidth - window.innerWidth; };
    if (distance() <= 0) return;

    var tween = gsap.to(track, {
      x: function () { return -distance(); },
      ease: "none",
      scrollTrigger: {
        trigger: wrap,
        start: "top 12%",
        end: function () { return "+=" + distance(); },
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    return function () { tween.scrollTrigger && tween.scrollTrigger.kill(); tween.kill(); };
  });

  /* ---------- 9. Parallax du CTA final ---------- */

  var finaleMedia = document.querySelector("[data-parallax-finale] .media > img");

  if (finaleMedia && !lightMode) {
    gsap.fromTo(finaleMedia,
      { yPercent: -4 },
      {
        yPercent: 4,
        ease: "none",
        scrollTrigger: { trigger: ".finale", start: "top bottom", end: "bottom top", scrub: true }
      }
    );
  }

  /* ---------- 10. Recalcul après chargement des images ----------
     Les photos déposées plus tard changent la hauteur du document :
     sans ce refresh, les déclencheurs seraient décalés. */

  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
