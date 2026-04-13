(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const forms = document.querySelectorAll(".needs-validation");

    Array.from(forms).forEach((form) => {
      form.addEventListener("submit", (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add("was-validated");
      });
    });

    const stars = document.querySelectorAll(".star");
    const ratingInput = document.getElementById("rating-value");

    if (stars.length && ratingInput) {
      const paintStars = (value) => {
        stars.forEach((star) => {
          star.style.color =
            Number(star.dataset.value) <= value ? "#ff385c" : "#ccc";
        });
      };

      paintStars(Number(ratingInput.value || 0));

      stars.forEach((star) => {
        star.addEventListener("click", () => {
          const value = Number(star.dataset.value);
          ratingInput.value = value;
          paintStars(value);
        });

        star.addEventListener("mouseover", () => {
          paintStars(Number(star.dataset.value));
        });

        star.addEventListener("mouseout", () => {
          paintStars(Number(ratingInput.value || 0));
        });
      });
    }

    function createUniqueMarker() {
      const marker = document.createElement("div");
      marker.className = "custom-marker";

      marker.innerHTML = `
        <div class="marker-float">
          <div class="marker-pin">
            <div class="marker-inner">
              <svg viewBox="0 0 24 24" class="marker-icon" aria-hidden="true">
                <path d="M12 2L4 8v10h5v-5h6v5h5V8L12 2z"></path>
              </svg>
            </div>
          </div>
        </div>
      `;

      return marker;
    }

    const mapEl = document.getElementById("map");

    if (mapEl && typeof mapboxgl !== "undefined") {
      const token = mapEl.dataset.token ? mapEl.dataset.token.trim() : "";
      const title = mapEl.dataset.title || "Listing";
      const location = mapEl.dataset.location || "";
      const country = mapEl.dataset.country || "";

      let coords = null;

      try {
        coords = JSON.parse(mapEl.dataset.coords || "null");
      } catch (err) {
        console.error("Invalid map coordinates:", err);
      }

      if (token && Array.isArray(coords) && coords.length === 2) {
        mapboxgl.accessToken = token;

        const map = new mapboxgl.Map({
          container: "map",
          style: "mapbox://styles/mapbox/streets-v12",
          center: coords,
          zoom: 10,
        });

        map.addControl(new mapboxgl.NavigationControl());

        const customMarker = createUniqueMarker();

        new mapboxgl.Marker({
          element: customMarker,
          anchor: "bottom",
        })
          .setLngLat(coords)
          .setPopup(
            new mapboxgl.Popup({ offset: 30 }).setHTML(`
              <h6>${title}</h6>
              <p>${location}, ${country}</p>
            `)
          )
          .addTo(map);

        map.on("load", () => {
          map.resize();
        });
      } else {
        console.warn("Map not initialized: missing token or invalid coordinates");
      }
    }

    const toggleBtns = document.querySelectorAll(".airbnb-toggle-item");

    if (toggleBtns.length) {
      toggleBtns.forEach((btn) => {
        btn.addEventListener("click", function () {
          const filter = this.dataset.filter;
          const url = new URL(window.location.href);

          if (filter === "All") {
            url.searchParams.delete("category");
          } else {
            url.searchParams.set("category", filter);
          }

          window.location.href = url.toString();
        });
      });
    }
  });
})();