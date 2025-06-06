
function listofTags(entries) {
    const rawValues = entries.map(e => e.tag);
    const splitValues = rawValues.flatMap(val =>
        val ? val.split(/\r?\n/) : []
    );

    const uniqueTags = Array.from(
        new Set(splitValues.map(tag => tag.trim()).filter(Boolean))
    );

    // Optional: sort
    uniqueTags.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    const container = document.getElementById("tagDisplay");
    container.innerHTML = "";

    uniqueTags.forEach(tag => {
        const el = document.createElement("div");
        el.className = "tag";
        el.textContent = tag;

        el.addEventListener("click", () => {
            el.classList.toggle("selected");

            const isSelected = el.classList.contains("selected");
            const tagName = el.textContent;
            filterRadar(window.selectedZoomedQuadrant);
            const selectedTags = Array.from(
                document.querySelectorAll('.tag-container .tag.selected')
            ).map(tagEl => tagEl.textContent);

        });

        container.appendChild(el);
    });
}

function filterRadar(quadrant) {
    // 1. Get selected pills (tags)
    const selectedTags = Array.from(
        document.querySelectorAll('.tag-container .tag.selected')
    ).map(tagEl => tagEl.textContent);

    // 2. Clear radar content
    let radarSvg = document.getElementById("radar");
    radarSvg.innerHTML = "";

    // 3. Reload and filter CSV
    fetch('./AMD_Radar_vf.csv')
        .then(resp => resp.text())
        .then(csv => {
            const entries = d3.csvParse(csv, row => toEntry(row));

            if (selectedTags.length === 0) {
                // No selection — show full radar
                draw_radar(entries, quadrant);
                return;
            }

            // 4. Filter entries based on matching at least one tag
            const filtered_entries = entries.filter(entry => {
                const entryTags = entry.tag
                    ? entry.tag.split(/\r?\n/).map(t => t.trim())
                    : [];

                return selectedTags.some(tag => entryTags.includes(tag));
            });
            draw_radar(filtered_entries, quadrant);
        });
}

function openModal(content) {
  const existing = document.getElementById("modalContainer");
  if (existing) existing.remove();

  const container = document.createElement("div");
  container.id = "modalContainer";
  container.className = "modal-container";

  const modal = document.createElement("div");
  modal.className = "modal-content";
  modal.innerHTML = content;

  container.appendChild(modal);
  document.body.appendChild(container);

  container.addEventListener("click", () => {
    // Use same timing as opening
    modal.style.animation = "scaleOut 0.4s ease-in-out forwards";
    container.style.animation = "fadeOut 0.4s ease-in-out forwards";

    setTimeout(() => container.remove(), 400);
  });
}

function closeModal() {
  const modal = document.getElementById("blipModal");
  modal.style.display = "none";
}


function zoomToBlip(d) 
{
  openModal(`<div class="modal-title">${d.label}</div><div class="modal-description">${d.description}</div>`);
}


function zoomToQuadrant(quadrant) {
 {
      window.selectedZoomedQuadrant = quadrant ; 
      // Zoom to that quadrant
      onQuadrantClick(quadrant);

      // Optionally highlight all matching blips after zoom animation
      setTimeout(() => {
        matches.forEach(m => highlightBlip(m.label));
      }, 1000); // adjust delay to match zoom
    }
}

function highlightBlip(entry) {
  const blip = d3.selectAll(".blip").filter(d => d.id === entry.id);
  if (!blip.empty()) {
    blip.selectAll("circle, path")
      .classed("pulse", true)
      .transition()
      .duration(200)
      .attr("transform", "scale(2.2)")
      .transition()
      .duration(200)
      .attr("transform", "scale(1.8)");
  }
}

function centerViewOnBlip(entry) {
  const svgElement = d3.select("svg#radar");
  const viewBox = svgElement.attr("viewBox").split(" ").map(Number);
  const scale = viewBox[2] / config.width; // estimate current zoom level

  const centerX = entry.x;
  const centerY = entry.y;

  const newViewBox = [
    centerX - viewBox[2] / 2,
    centerY - viewBox[3] / 2,
    viewBox[2],
    viewBox[3]
  ];

  animateViewBox(svgElement, viewBox, newViewBox, 800, d3.easeCubicInOut);
}

// Hook to search input (example)
document.getElementById('searchInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    zoomToBlipByLabel(e.target.value.trim());
  }
});


// Close on X click
document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".close-btn").onclick = closeModal;
  window.onclick = function(event) {
    if (event.target.id === "blipModal") {
      closeModal();
    }
  };
});

