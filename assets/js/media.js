/* =========================================================
   COACH NEIRAM — Détection des emplacements photo vides
   -----------------------------------------------------------------
   Quand un fichier image est absent, le cadre bascule sur son état
   « emplacement » plutôt que d'afficher une image cassée. Dès que le
   fichier existe au bon chemin, la photo s'affiche : aucun code à
   modifier.

   Point de vigilance : l'état vide masque l'image avec `display: none`.
   On ne peut donc PAS l'appliquer par défaut — une image en
   `loading="lazy"` sans boîte de rendu n'est jamais téléchargée par le
   navigateur, ce qui la laisserait vide pour toujours. L'état vide est
   donc appliqué uniquement après un échec de chargement avéré.
   ========================================================= */

(function () {
  "use strict";

  /** Une image est chargée si elle a une largeur naturelle non nulle. */
  function estChargee(img) {
    return img.complete && img.naturalWidth > 0;
  }

  /** Une image est en échec si elle a fini son cycle sans pixel. */
  function estEnEchec(img) {
    return img.complete && img.naturalWidth === 0;
  }

  function surveiller(img) {
    var cadre = img.closest(".media");
    if (!cadre) return;

    var vider = function () { cadre.classList.add("is-empty"); };
    var remplir = function () { cadre.classList.remove("is-empty"); };

    // Cas déjà tranchés au moment où le script s'exécute.
    if (estChargee(img)) { remplir(); return; }
    if (estEnEchec(img)) { vider(); return; }

    // Sinon on laisse le navigateur travailler : l'image reste visible
    // (donc chargeable, y compris en lazy) et on ne tranche qu'aux
    // événements.
    img.addEventListener("load", remplir);
    img.addEventListener("error", vider);
  }

  function init() {
    document.querySelectorAll(".media > img").forEach(surveiller);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
