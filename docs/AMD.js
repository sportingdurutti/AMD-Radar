
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

function openModal1(content) 
{
  const modal = document.getElementById("blipModal");
  const modalText = document.getElementById("modalText");
  modalText.innerHTML = content;
  modal.style.display = "block";
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

// Close on X click
document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".close-btn").onclick = closeModal;
  window.onclick = function(event) {
    if (event.target.id === "blipModal") {
      closeModal();
    }
  };
});

