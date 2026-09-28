/* Offline research explorer. Coordinates and scientific data are read-only inputs. */
"use strict";
(() => {
  const $ = (id) => document.getElementById(id);
  const workspaces = [...document.querySelectorAll(".workspace")];
  const viewButtons = [...document.querySelectorAll("[data-view]")];
  let redrawModel = () => {};
  let currentRepresentation = "backbone";
  const presentationSteps = [
    { title: "Question & scope", view: "structure" },
    { title: "Sequence evidence", view: "sequence" },
    { title: "Evaluation & earlier panel", view: "evidence" },
    { title: "One starting point", view: "sequence" },
    { title: "Exact chemistry", view: "chemistry" },
    { title: "Inspect the molecule", view: "structure" },
    { title: "Structural limits", view: "validation" },
    { title: "Decision & next measurements", view: "handoff" }
  ];
  let presentationStep = 0;
  let lastPresentationStep = 1;
  function presentationMode(enabled) {
    document.body.classList.toggle("presentation-mode", enabled);
    $("presentation-controls").hidden = !enabled;
    $("presentation-map").hidden = false;
    $("workspace-disclosure").open = !enabled;
    $("start-presentation").hidden = enabled;
    if (!enabled) {
      presentationStep = 0;
      document.querySelectorAll("button[data-present-step]").forEach(button => button.removeAttribute("aria-current"));
      $("start-presentation").textContent = `Return to step ${lastPresentationStep}`;
      delete document.body.dataset.presentStep;
      document.querySelectorAll("[data-story-content]").forEach(node => { node.hidden = false; });
      document.querySelectorAll(".presentation-intro").forEach(section => { section.hidden = true; });
    }
  }
  function showPresentation(step, focus = true, updateHash = true) {
    const number = Number(step);
    if (!Number.isInteger(number) || number < 1 || number > presentationSteps.length) return;
    const definition = presentationSteps[number - 1];
    presentationStep = number;
    lastPresentationStep = number;
    presentationMode(true);
    document.body.dataset.presentStep = String(number);
    showView(definition.view, false, false, true);
    document.querySelectorAll(".presentation-intro").forEach(section => { section.hidden = section.id !== `present-${number}`; });
    document.querySelectorAll("button[data-present-step]").forEach(button => {
      if (Number(button.dataset.presentStep) === number) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    $("presentation-counter").textContent = `Step ${number} of 8`;
    $("presentation-progress-fill").style.width = `${number / 8 * 100}%`;
    $("presentation-jump").value = String(number);
    $("presentation-previous").disabled = number === 1;
    $("presentation-next").disabled = number === 8;
    $("presentation-next").title = number === 8 ? "Final step. Use the step menu to restart or explore full records." : "Continue the presentation";
    if (number === 1) showMechanism(false);
    if (number === 2) showSequencePanel("reference");
    if (number === 3) showStoryPanel("3", "calculation");
    if (number === 4) showStoryPanel("4", "selection");
    if (number === 5) showStoryPanel("5", "design-space");
    if (number === 6) showStoryPanel("6", "molecule");
    if (number === 1 || number === 6) {
      resetView();
      showRepresentation("backbone", false);
    }
    if (updateHash) {
      try { history.replaceState(null, "", `#present-${number}`); } catch (_) { /* Reader may restrict history. */ }
    }
    $("workspace-announcement").textContent = `Presentation step ${number} of 8: ${definition.title}`;
    if (focus) $(`present-title-${number}`).focus({ preventScroll: true });
    // Also reset an initial deep-link landing after the browser has laid out the new view.
    window.scrollTo({ top: 0, behavior: "instant" });
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
      redrawModel();
    });
  }
  $("start-presentation").addEventListener("click", () => showPresentation(lastPresentationStep));
  $("story-home").addEventListener("click", event => { event.preventDefault(); showPresentation(1); });
  $("presentation-previous").addEventListener("click", () => showPresentation(presentationStep - 1));
  $("presentation-next").addEventListener("click", () => showPresentation(presentationStep + 1));
  $("presentation-jump").addEventListener("change", event => showPresentation(event.target.value));
  $("presentation-exit").addEventListener("click", () => showView(presentationSteps[presentationStep - 1]?.view || "structure"));
  // An explanatory schematic only; this reveal changes no scientific data.
  function showMechanism(revealed) {
    $("myostatin-mechanism").classList.toggle("siRNA-revealed", revealed);
    $("mechanism-intervention").hidden = !revealed;
    $("mechanism-target").toggleAttribute("hidden", !revealed);
    $("mechanism-normal").hidden = revealed;
    $("mechanism-reveal").setAttribute("aria-expanded", String(revealed));
    $("mechanism-reveal").textContent = revealed ? "Back to normal signalling" : "siRNA";
    $("mechanism-state").textContent = revealed ? "2 / 2 · Intended siRNA action" : "1 / 2 · Normal signalling";
  }
  $("mechanism-reveal").addEventListener("click", () => {
    showMechanism($("mechanism-reveal").getAttribute("aria-expanded") !== "true");
  });
  document.querySelectorAll("button[data-present-step]").forEach(button => button.addEventListener("click", () => showPresentation(button.dataset.presentStep)));
  document.addEventListener("keydown", event => {
    if (!presentationStep || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target.closest("input, select, textarea, [contenteditable], canvas")) return;
    if (event.key !== "PageDown" && event.key !== "PageUp") return;
    event.preventDefault();
    showPresentation(presentationStep + (event.key === "PageDown" ? 1 : -1));
  });
  const legacyViews = ["handoff", "sequence", "evidence", "sequence", "chemistry", "structure", "validation", "handoff"];
  function viewFromHash() {
    const legacy = location.hash.match(/^#chapter-([1-8])$/);
    return legacy ? legacyViews[Number(legacy[1]) - 1] : location.hash.replace(/^#view-/, "");
  }
  function showView(name, focus = true, updateHash = true, preservePresentation = false) {
    if (!preservePresentation) {
      const currentStoryView = presentationSteps[lastPresentationStep - 1]?.view;
      if (name !== currentStoryView) {
        const correspondingStep = presentationSteps.findIndex(step => step.view === name);
        if (correspondingStep >= 0) lastPresentationStep = correspondingStep + 1;
      }
      presentationMode(false);
    }
    const target = workspaces.find(section => section.id === `view-${name}`) || $("view-structure");
    workspaces.forEach(section => { section.hidden = section !== target; section.classList.toggle("active", section === target); });
    viewButtons.forEach(button => {
      const active = target.id === `view-${button.dataset.view}`;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    const announcement = $("workspace-announcement");
    if (announcement) announcement.textContent = `${target.querySelector("h1").textContent} workspace`;
    if (updateHash) {
      try { history.replaceState(null, "", `#${target.id}`); } catch (_) { /* Some local readers restrict history. */ }
    }
    if (focus) {
      window.scrollTo({ top: 0, behavior: "instant" });
      const heading = target.querySelector("h1");
      heading.setAttribute("tabindex", "-1"); heading.focus({ preventScroll: true });
    }
    if (!preservePresentation && target.id === "view-structure") showRepresentation(currentRepresentation, false);
    requestAnimationFrame(redrawModel);
  }
  viewButtons.forEach(button => button.addEventListener("click", () => showView(button.dataset.view)));
  document.querySelectorAll("[data-open-view]").forEach(button => button.addEventListener("click", event => {
    event.preventDefault(); showView(button.dataset.openView);
  }));
  document.addEventListener("click", event => {
    const anchor = event.target.closest('a[href^="#view-"]');
    if (!anchor) return;
    event.preventDefault(); showView(anchor.getAttribute("href").slice(6));
  });
  window.addEventListener("hashchange", () => {
    const guided = location.hash.match(/^#present-([1-8])$/);
    if (guided) { showPresentation(Number(guided[1]), true, false); return; }
    const anchor = document.getElementById(location.hash.slice(1));
    const section = anchor?.closest(".workspace");
    if (section) {
      showView(section.id.slice(5), false, false);
      anchor.scrollIntoView({ block: "start" });
    } else if (!anchor) {
      const view = viewFromHash();
      if (workspaces.some(section => section.id === `view-${view}`)) showView(view);
      else showPresentation(1);
    }
  });

  // These tabs display frozen sequence evidence; they do not run an analysis.
  const sequenceTabs = [...document.querySelectorAll("[data-sequence-panel]")];
  function showSequencePanel(name, focus = false) {
    sequenceTabs.forEach(button => {
      const active = button.dataset.sequencePanel === name;
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
      $(button.getAttribute("aria-controls")).hidden = !active;
      if (active && focus) button.focus();
    });
  }
  sequenceTabs.forEach((button, index) => {
    button.addEventListener("click", () => showSequencePanel(button.dataset.sequencePanel));
    button.addEventListener("keydown", event => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % sequenceTabs.length;
      else if (event.key === "ArrowLeft") next = (index + sequenceTabs.length - 1) % sequenceTabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = sequenceTabs.length - 1;
      else return;
      event.preventDefault();
      showSequencePanel(sequenceTabs[next].dataset.sequencePanel, true);
    });
  });

  // Compact story tabs change only the visible evidence, never source data.
  function showStoryPanel(group, name, focus = false) {
    document.body.dataset.storyView = name;
    document.querySelectorAll(`[data-story-tabs="${group}"] [data-story-view]`).forEach(button => {
      const active = button.dataset.storyView === name;
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
      if (active && focus) button.focus({ preventScroll: true });
    });
    document.querySelectorAll(`[data-story-content^="${group}:"]`).forEach(node => { node.hidden = node.dataset.storyContent !== `${group}:${name}`; });
    requestAnimationFrame(() => { window.scrollTo({ top: 0, behavior: "instant" }); redrawModel(); });
  }
  document.querySelectorAll("[data-story-tabs]").forEach(group => {
    const buttons = [...group.querySelectorAll("[data-story-view]")];
    buttons.forEach((button, index) => {
      button.addEventListener("click", () => showStoryPanel(button.dataset.storyGroup, button.dataset.storyView));
      button.addEventListener("keydown", event => {
        let next;
        if (event.key === "ArrowRight") next = (index + 1) % buttons.length;
        else if (event.key === "ArrowLeft") next = (index + buttons.length - 1) % buttons.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = buttons.length - 1;
        else return;
        event.preventDefault();
        showStoryPanel(button.dataset.storyGroup, buttons[next].dataset.storyView, true);
      });
    });
  });
  window.addEventListener("load", () => { if (presentationStep) window.scrollTo({ top: 0, behavior: "instant" }); });

  // Candidate explorer: never recomputes eligibility or alters source rows.
  const candidates = Array.isArray(window.MSTN_CANDIDATES) ? window.MSTN_CANDIDATES.slice() : [];
  let candidatePage = 0;
  let sortKey = "start";
  let sortDirection = 1;
  const pageSize = 12;
  const numberText = (value) => Number.isFinite(Number(value)) ? Number(value).toLocaleString("en-US") : "Not recorded";
  function textNode(tag, value, className) {
    const node = document.createElement(tag);
    node.textContent = String(value);
    if (className) node.className = className;
    return node;
  }
  function renderCandidates() {
    const query = $("candidate-search").value.trim().toUpperCase();
    const filter = $("candidate-filter").value;
    const rows = candidates.filter((row) => {
      if (filter === "preference" && !row.preference_pass) return false;
      if (filter === "selected" && !row.selected) return false;
      return !query || [row.candidate_id, row.start, row.end, row.guide, row.passenger].join(" ").toUpperCase().includes(query);
    }).sort((a, b) => (Number(a[sortKey]) - Number(b[sortKey])) * sortDirection || Number(a.start) - Number(b.start) || String(a.candidate_id).localeCompare(String(b.candidate_id)));
    const pages = Math.max(1, Math.ceil(rows.length / pageSize));
    candidatePage = Math.min(candidatePage, pages - 1);
    const body = $("candidate-rows");
    body.replaceChildren();
    rows.slice(candidatePage * pageSize, (candidatePage + 1) * pageSize).forEach((row) => {
      const tr = document.createElement("tr");
      if (row.selected) tr.className = "selected-candidate";
      tr.appendChild(textNode("td", `[${row.start}, ${row.end})`));
      const status = document.createElement("td");
      status.appendChild(textNode("span", row.selected ? "Selected · preference met" : row.preference_pass ? "Preference met" : "Preference not met", "row-status"));
      tr.appendChild(status);
      [row.guide_seed, row.passenger_seed, row.seed_total].forEach((value) => tr.appendChild(textNode("td", numberText(value), "number")));
      const cell = document.createElement("td");
      const details = document.createElement("details");
      details.appendChild(textNode("summary", "View record"));
      const content = document.createElement("div");
      content.appendChild(textNode("p", `Identifier: ${row.candidate_id}`));
      [ ["Guide · 5′→3′", row.guide], ["Passenger · 5′→3′", row.passenger] ].forEach(([label, sequence]) => {
        const p = textNode("p", `${label}: `);
        p.appendChild(textNode("code", sequence));
        content.appendChild(p);
      });
      content.appendChild(textNode("p", `Other-gene full-core hits: guide ${numberText(row.guide_full_other)}; passenger ${numberText(row.passenger_full_other)}.`));
      content.appendChild(textNode("p", `GDF11 seed occurrences: ${numberText(row.gdf11_seed)}.`));
      if (row.exclusion_reasons) content.appendChild(textNode("p", `Selection preference record: ${row.exclusion_reasons}`));
      content.appendChild(textNode("p", "Historical sequence eligibility: retained."));
      details.appendChild(content); cell.appendChild(details); tr.appendChild(cell); body.appendChild(tr);
    });
    if (!rows.length) {
      const tr = document.createElement("tr");
      const td = textNode("td", candidates.length ? "No records match these display filters." : "The local candidate data bundle is unavailable. Use the linked TSV for the source records.");
      td.colSpan = 6; tr.appendChild(td); body.appendChild(tr);
    }
    $("candidate-count").textContent = candidates.length ? `${rows.length} of ${candidates.length} historical sequence-eligible records shown. ${candidates.filter((row) => row.preference_pass).length} meet the later selection preference.` : "Candidate data is not loaded; no scientific rows are inferred.";
    $("candidate-page").textContent = rows.length ? `${candidatePage * pageSize + 1}–${Math.min((candidatePage + 1) * pageSize, rows.length)} of ${rows.length}` : "0 records";
    $("candidate-prev").disabled = candidatePage === 0;
    $("candidate-next").disabled = candidatePage >= pages - 1;
    document.querySelectorAll("[data-sort]").forEach((button) => {
      const active = button.dataset.sort === sortKey;
      button.parentElement.setAttribute("aria-sort", active ? sortDirection === 1 ? "ascending" : "descending" : "none");
      button.querySelector("span").textContent = active ? sortDirection === 1 ? "↑" : "↓" : "↕";
    });
  }
  $("candidate-search").addEventListener("input", () => { candidatePage = 0; renderCandidates(); });
  $("candidate-filter").addEventListener("change", () => { candidatePage = 0; renderCandidates(); });
  $("candidate-prev").addEventListener("click", () => { candidatePage--; renderCandidates(); });
  $("candidate-next").addEventListener("click", () => { candidatePage++; renderCandidates(); });
  document.querySelectorAll("[data-sort]").forEach((button) => button.addEventListener("click", () => {
    if (sortKey === button.dataset.sort) sortDirection *= -1;
    else { sortKey = button.dataset.sort; sortDirection = 1; }
    candidatePage = 0; renderCandidates();
  }));
  renderCandidates();

  // Lightweight orthographic renderer. No geometry construction or relaxation occurs here.
  const canvas = $("molecule-canvas");
  const context = canvas.getContext("2d");
  const sourceModel = window.MSTN_MODEL;
  const palette = { guide: "#7cadff", passenger: "#79e0d0", linker: "#ba9afa", peptide: "#f2bd75", other: "#c2d0df" };
  const radii = { C: 1.6, N: 1.9, O: 1.9, P: 2.6, S: 2.5, H: 1.0 };
  let atoms = [], bonds = [], projected = [];
  let chosenAtom = null;
  let validModel = false;
  let view = { yaw: 25, pitch: -65, zoom: 100, center: [0, 0, 0], radius: 1 };
  const visibility = { guide: true, passenger: true, linker: true, peptide: true, other: true };
  function groupFor(atom) {
    const supplied = String(atom.display_component || "").toLowerCase();
    if (Object.hasOwn(palette, supplied)) return supplied;
    const raw = String(atom.component || "").toLowerCase();
    if (raw.includes("passenger")) return "passenger";
    if (raw.includes("guide")) return "guide";
    if (/connector|junction|linker|triazole/.test(raw)) return "linker";
    if (/peptide|scaffold/.test(raw)) return "peptide";
    return "other";
  }
  function loadModel() {
    if (!sourceModel || !Array.isArray(sourceModel.atoms) || !sourceModel.atoms.length || !Array.isArray(sourceModel.bonds)) return;
    if (/FAIL|BLOCK|NOT_RUN|PENDING/i.test(String(sourceModel.status || ""))) {
      $("model-state").textContent = "NOT AVAILABLE";
      return;
    }
    try {
      const byMap = new Map();
      atoms = sourceModel.atoms.map((atom) => {
        if (!Array.isArray(atom.xyz_angstrom) || atom.xyz_angstrom.length !== 3 || !atom.xyz_angstrom.every(Number.isFinite)) throw new Error("Invalid coordinate record");
        if (!Number.isInteger(atom.atom_map) || byMap.has(atom.atom_map)) throw new Error("Invalid atom identity");
        const display = { map: atom.atom_map, element: atom.element, group: groupFor(atom), component: atom.component, role: atom.atom_role, name: atom.atom_name, residue: atom.residue_name, position: atom.residue_position_1based, xyz: atom.xyz_angstrom.slice() };
        byMap.set(display.map, display); return display;
      });
      bonds = sourceModel.bonds.map((bond) => {
        if (!Array.isArray(bond.atom_maps) || bond.atom_maps.length !== 2 || !bond.atom_maps.every((map) => byMap.has(map))) throw new Error("Invalid bond record");
        return { a: byMap.get(bond.atom_maps[0]), b: byMap.get(bond.atom_maps[1]), type: String(bond.bond_type).toUpperCase() };
      });
      validModel = true;
      $("model-name").textContent = sourceModel.identifier || "Specified molecular identity";
      $("model-state").textContent = "GENERATED CONFORMATION";
      $("model-empty").hidden = true;
      const counts = Object.entries(palette).map(([key]) => [key, atoms.filter((atom) => atom.group === key).length]).filter(([,count]) => count);
      $("model-provenance").textContent = `${sourceModel.identifier || "Model"}: ${atoms.length.toLocaleString("en-US")} recorded atoms and ${bonds.length.toLocaleString("en-US")} recorded bonds. Display groups: ${counts.map(([key, count]) => `${key} ${count}`).join("; ")}. Source status: ${sourceModel.status || "See construction report"}. The local bundle supplies the exact coordinates; viewing does not change them.`;
    } catch (_) {
      atoms = []; bonds = [];
      $("model-state").textContent = "DATA CHECK FAILED";
      $("model-empty").querySelector("h2").textContent = "The local model data could not be displayed.";
      $("model-empty").querySelector("p").textContent = "An atom, bond or coordinate record is incomplete. No substitute geometry is displayed.";
    }
  }
  function syncControls() {
    view.yaw = ((view.yaw + 180) % 360 + 360) % 360 - 180;
    view.pitch = Math.max(-89, Math.min(89, view.pitch));
    view.zoom = Math.max(50, Math.min(400, view.zoom));
    $("rotation-y").value = view.yaw;
    $("rotation-x").value = view.pitch;
    $("model-zoom").value = view.zoom;
    $("rotation-y-value").textContent = `${Math.round(view.yaw)}°`;
    $("rotation-x-value").textContent = `${Math.round(view.pitch)}°`;
    $("model-zoom-value").textContent = `${Math.round(view.zoom)}%`;
  }
  function fit(onlyVisible) {
    const subset = atoms.filter((atom) => !onlyVisible || visibility[atom.group]);
    if (!subset.length) return;
    view.center = [0, 1, 2].map((i) => subset.reduce((sum, atom) => sum + atom.xyz[i], 0) / subset.length);
    view.radius = Math.max(1, ...subset.map((atom) => Math.hypot(...atom.xyz.map((value, i) => value - view.center[i]))));
    view.zoom = 100;
    syncControls(); drawModel();
  }
  function project(atom, width, height, scale) {
    const yaw = view.yaw * Math.PI / 180, pitch = view.pitch * Math.PI / 180;
    const [x, y, z] = atom.xyz.map((value, i) => value - view.center[i]);
    const x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
    const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
    const y1 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
    const z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);
    return { atom, x: width / 2 + x1 * scale, y: height / 2 - y1 * scale, z: z2 };
  }
  function drawModel() {
    if (!context || !validModel || currentRepresentation !== "interactive") return;
    // Hidden workspaces still receive a frame for the print layout.
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 900, height = rect.height || 480;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * ratio), pixelHeight = Math.round(height * ratio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) { canvas.width = pixelWidth; canvas.height = pixelHeight; }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    const scale = Math.min(width, height) / (2.1 * view.radius) * view.zoom / 100;
    projected = atoms.filter((atom) => visibility[atom.group]).map((atom) => project(atom, width, height, scale));
    projected.forEach(point => { point.displayRadius = (radii[point.atom.element] || 1.8) * Math.max(0.65, Math.min(1.6, 0.58 + scale * 0.13)); });
    const byMap = new Map(projected.map((point) => [point.atom.map, point]));
    const primitives = [];
    bonds.forEach((bond) => {
      if (!byMap.has(bond.a.map) || !byMap.has(bond.b.map)) return;
      const a = byMap.get(bond.a.map), b = byMap.get(bond.b.map);
      primitives.push({ type: "bond", bond, a, b, z: (a.z + b.z) / 2 });
    });
    projected.forEach((point) => primitives.push({ type: "atom", point, z: point.z }));
    primitives.sort((a, b) => a.z - b.z);
    const lineWidth = Math.max(0.7, Math.min(2, 0.65 + scale * 0.22));
    primitives.forEach((item) => {
      const depth = Math.max(0.5, Math.min(1, 0.74 + item.z / view.radius * 0.24));
      context.globalAlpha = depth;
      if (item.type === "bond") {
        const { a, b, bond } = item;
        const gradient = context.createLinearGradient(a.x, a.y, b.x + 0.001, b.y + 0.001);
        gradient.addColorStop(0, palette[a.atom.group]); gradient.addColorStop(1, palette[b.atom.group]);
        context.strokeStyle = gradient; context.lineWidth = lineWidth;
        const count = /TRIPLE|^3$/.test(bond.type) ? 3 : /DOUBLE|^2$/.test(bond.type) ? 2 : 1;
        const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const dx = -(b.y - a.y) / length * 1.6, dy = (b.x - a.x) / length * 1.6;
        context.setLineDash(bond.type === "AROMATIC" ? [3, 2] : []);
        for (let n = 0; n < count; n++) {
          const offset = n - (count - 1) / 2;
          context.beginPath(); context.moveTo(a.x + offset * dx, a.y + offset * dy); context.lineTo(b.x + offset * dx, b.y + offset * dy); context.stroke();
        }
        context.setLineDash([]);
      } else {
        const point = item.point;
        const radius = point.displayRadius;
        const shading = context.createRadialGradient(point.x - radius * .3, point.y - radius * .35, 0, point.x, point.y, radius);
        shading.addColorStop(0, "#e2f2ff"); shading.addColorStop(.3, palette[point.atom.group]); shading.addColorStop(1, "#24374c");
        context.fillStyle = shading; context.beginPath(); context.arc(point.x, point.y, radius, 0, Math.PI * 2); context.fill();
      }
    });
    context.globalAlpha = 1;
    // A projected scale is a view aid, not an interatomic-distance measurement.
    const barAngstrom = scale * 10 <= width * .23 ? 10 : 5;
    const barPixels = barAngstrom * scale;
    if (barPixels < width * .4) {
      context.strokeStyle = "#75879b"; context.lineWidth = 1;
      context.beginPath(); context.moveTo(24, height - 30); context.lineTo(24 + barPixels, height - 30);
      context.moveTo(24, height - 34); context.lineTo(24, height - 26);
      context.moveTo(24 + barPixels, height - 34); context.lineTo(24 + barPixels, height - 26); context.stroke();
      context.fillStyle = "#9cadc0"; context.font = "10px ui-monospace, monospace";
      context.fillText(`${barAngstrom} Å · projected scale`, 24, height - 12);
    }
    if (chosenAtom && byMap.has(chosenAtom.map)) {
      const selected = byMap.get(chosenAtom.map);
      context.strokeStyle = "#ffffff"; context.lineWidth = 1.5; context.beginPath(); context.arc(selected.x, selected.y, 7, 0, Math.PI * 2); context.stroke();
      if ($("atom-labels").checked) {
        const label = `${chosenAtom.element} · map ${chosenAtom.map}`;
        context.font = "12px -apple-system, sans-serif";
        const labelWidth = context.measureText(label).width + 16;
        const x = Math.min(width - labelWidth - 5, Math.max(5, selected.x + 11));
        const y = Math.min(height - 27, Math.max(5, selected.y - 30));
        context.fillStyle = "rgba(5, 14, 24, .94)"; context.fillRect(x, y, labelWidth, 25);
        context.fillStyle = "#ffffff"; context.fillText(label, x + 8, y + 17);
      }
    }
    $("model-count").textContent = `${projected.length.toLocaleString("en-US")} / ${atoms.length.toLocaleString("en-US")} atoms visible`;
    canvas.setAttribute("aria-label", `Generated molecular conformation of ${sourceModel.identifier}. ${projected.length} of ${atoms.length} atoms visible. Drag or use arrow keys to rotate; click an atom to inspect.`);
    if (!projected.length) {
      context.fillStyle = "#a4b7ca"; context.font = "16px -apple-system, sans-serif"; context.textAlign = "center";
      context.fillText("Turn on a component to view the molecule.", width / 2, height / 2); context.textAlign = "left";
    }
  }
  function chooseAt(x, y) {
    // Match the rendered front sphere when atom glyphs overlap in projection.
    const containing = projected.filter(point => Math.hypot(point.x - x, point.y - y) <= point.displayRadius);
    const near = containing.sort((a, b) => b.z - a.z)[0] || projected.filter(point => Math.hypot(point.x - x, point.y - y) <= 10).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y) || b.z - a.z)[0];
    if (!near) return;
    chosenAtom = near.atom;
    const status = $("selected-atom"); status.replaceChildren();
    status.appendChild(textNode("b", `${chosenAtom.element} · map ${chosenAtom.map}`)); status.appendChild(document.createElement("br"));
    status.appendChild(document.createTextNode(`${chosenAtom.group} · ${typeof chosenAtom.role === "string" ? chosenAtom.role : JSON.stringify(chosenAtom.role || chosenAtom.component)}`));
    if (chosenAtom.name || chosenAtom.residue) status.appendChild(textNode("p", `${chosenAtom.residue || ""} ${chosenAtom.position || ""} · ${chosenAtom.name || ""}`.trim()));
    const coordinates = textNode("p", `Source xyz / Å: ${chosenAtom.xyz.map(n => n.toFixed(3)).join(", ")}`); coordinates.className = "atom-coordinates"; status.appendChild(coordinates);
    drawModel();
  }
  loadModel();
  if (validModel) fit(false);
  else document.querySelectorAll(".model-controls input, .model-controls button").forEach((input) => { input.disabled = true; });
  redrawModel = drawModel;
  document.querySelectorAll("[data-component]").forEach((input) => input.addEventListener("change", () => { visibility[input.dataset.component] = input.checked; drawModel(); }));
  [["rotation-y", "yaw"], ["rotation-x", "pitch"], ["model-zoom", "zoom"]].forEach(([id, key]) => $(id).addEventListener("input", () => { view[key] = Number($(id).value); syncControls(); drawModel(); }));
  document.querySelectorAll("[data-rotate]").forEach((button) => button.addEventListener("click", () => { view.yaw += Number(button.dataset.rotate); syncControls(); drawModel(); }));
  $("fit-visible").addEventListener("click", () => fit(true));
  $("fit-all").addEventListener("click", () => fit(false));
  function syncFocus() {
    document.querySelectorAll("[data-focus]").forEach(button => {
      const mode = button.dataset.focus;
      const active = mode === "all" ? Object.values(visibility).every(Boolean)
        : mode === "rna" ? visibility.guide && visibility.passenger && !visibility.linker && !visibility.peptide
        : !visibility.guide && !visibility.passenger && visibility.linker && visibility.peptide;
      button.setAttribute("aria-pressed", String(active));
    });
  }
  document.querySelectorAll("[data-focus]").forEach(button => button.addEventListener("click", () => {
    const mode = button.dataset.focus;
    document.querySelectorAll("[data-component]").forEach(input => {
      input.checked = mode === "all" || (mode === "rna" ? ["guide", "passenger"].includes(input.dataset.component) : ["linker", "peptide"].includes(input.dataset.component));
      visibility[input.dataset.component] = input.checked;
    });
    chosenAtom = null;
    $("selected-atom").textContent = "Click an atom to inspect its identity.";
    syncFocus(); fit(true);
  }));
  document.querySelectorAll("[data-component]").forEach(input => input.addEventListener("change", syncFocus));
  document.querySelectorAll("[data-orientation]").forEach(button => button.addEventListener("click", () => {
    view.yaw = button.dataset.orientation === "end" ? 0 : 25;
    view.pitch = button.dataset.orientation === "end" ? 0 : -65;
    syncControls(); drawModel();
  }));
  function resetView() {
    view.yaw = 25; view.pitch = -65;
    document.querySelectorAll("[data-component]").forEach(input => { input.checked = true; visibility[input.dataset.component] = true; });
    chosenAtom = null; $("selected-atom").textContent = "Click an atom to inspect its identity.";
    syncFocus(); fit(false);
  }
  syncFocus();
  $("reset-view").addEventListener("click", resetView);
  $("atom-labels").addEventListener("change", drawModel);
  let drag = null;
  canvas.addEventListener("pointerdown", (event) => {
    if (!validModel || currentRepresentation !== "interactive" || event.button !== 0) return;
    canvas.focus({ preventScroll: true });
    drag = { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, moved: false, pointer: event.pointerId };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drag || drag.pointer !== event.pointerId) return;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 3) drag.moved = true;
    view.yaw += (event.clientX - drag.x) * 0.45; view.pitch += (event.clientY - drag.y) * 0.45;
    drag.x = event.clientX; drag.y = event.clientY; syncControls(); drawModel();
  });
  canvas.addEventListener("pointerup", (event) => {
    if (!drag || drag.pointer !== event.pointerId) return;
    if (!drag.moved) { const rect = canvas.getBoundingClientRect(); chooseAt(event.clientX - rect.left, event.clientY - rect.top); }
    drag = null; if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointercancel", () => { drag = null; });
  canvas.addEventListener("keydown", (event) => {
    if (!validModel || currentRepresentation !== "interactive" || event.altKey || event.ctrlKey || event.metaKey) return;
    const commands = {
      ArrowLeft: () => { view.yaw -= 5; }, ArrowRight: () => { view.yaw += 5; },
      ArrowUp: () => { view.pitch -= 5; }, ArrowDown: () => { view.pitch += 5; },
      "+": () => { view.zoom += 10; }, "=": () => { view.zoom += 10; }, "-": () => { view.zoom -= 10; },
      r: resetView, R: resetView
    };
    if (commands[event.key]) { event.preventDefault(); event.stopPropagation(); commands[event.key](); syncControls(); drawModel(); }
  });
  canvas.addEventListener("wheel", (event) => {
    if (!validModel || currentRepresentation !== "interactive" || document.activeElement !== canvas) return;
    event.preventDefault(); view.zoom += event.deltaY < 0 ? 10 : -10; syncControls(); drawModel();
  }, { passive: false });
  if (window.ResizeObserver) new ResizeObserver(() => requestAnimationFrame(drawModel)).observe(canvas);
  else window.addEventListener("resize", drawModel);
  window.addEventListener("beforeprint", drawModel);
  window.addEventListener("afterprint", drawModel);
  // The PyMOL images are fixed renders of the same saved conformation.
  // They never receive canvas rotation, atom picking or component-hiding controls.
  const representations = {
    backbone: {
      image: "pymol/backbone.png",
      presentationImage: "pymol/presentation-backbone.png",
      title: "Backbone & peptide loop",
      description: "RNA cartoon + peptide loop trace. No helix or sheet assignment.",
      alt: "Fixed PyMOL backbone render of the generated BCY17868_L6_M0 conformation. Blue guide RNA, cyan passenger RNA, violet linker and orange peptide/scaffold. RNA cartoon and peptide loop trace; no helix or sheet assignment."
    },
    solid: {
      image: "pymol/solid.png",
      presentationImage: "pymol/presentation-solid.png",
      title: "Heavy-atom solid view",
      description: "Heavy-atom spheres using declared radii, not an experimental or solvent-accessible surface.",
      alt: "Fixed PyMOL solid render of the generated BCY17868_L6_M0 conformation. Heavy-atom spheres use declared radii. Blue guide RNA, cyan passenger RNA, violet linker and orange peptide/scaffold. This is not an experimental or solvent-accessible surface."
    },
    attachment: {
      image: "pymol/attachment.png",
      presentationImage: "pymol/presentation-attachment.png",
      title: "Passenger–linker–peptide attachment",
      description: "U21 O3′ → L6 → peptide. Three Cys–TATB thioethers, not disulfide bridges.",
      alt: "Fixed PyMOL close-up of the generated BCY17868_L6_M0 attachment: passenger U21 O3 prime at the phosphate junction, L6 six-methylene spacer, and peptide with three Cys–TATB thioether connections. These are not disulfide bridges. Cyan passenger RNA, violet linker and orange peptide/scaffold."
    }
  };
  const renderImage = $("pymol-image");
  const imageFallback = $("render-unavailable");
  function imageLoaded() {
    renderImage.hidden = false;
    imageFallback.hidden = true;
  }
  function imageUnavailable() {
    renderImage.hidden = true;
    imageFallback.hidden = false;
    imageFallback.querySelector("h2").textContent = "This PyMOL image is unavailable in this copy.";
    imageFallback.querySelector("p").textContent = "The fixed render has not loaded. You can inspect the supplied coordinates in Interactive atoms.";
    imageFallback.querySelector("button").hidden = false;
  }
  renderImage.addEventListener("load", imageLoaded);
  renderImage.addEventListener("error", imageUnavailable);
  function showRepresentation(mode, announce = true) {
    document.body.dataset.representation = mode;
    if (mode !== "interactive" && !representations[mode]) return;
    currentRepresentation = mode;
    const interactive = mode === "interactive";
    document.querySelectorAll(".interactive-only").forEach(node => { node.hidden = !interactive; });
    document.querySelectorAll(".static-only").forEach(node => { node.hidden = interactive; });
    document.querySelectorAll("[data-representation]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.representation === mode));
    });
    document.querySelectorAll(".model-controls input, .model-controls button, #interactive-viewport button").forEach(control => {
      control.disabled = !interactive || !validModel;
    });
    canvas.tabIndex = interactive && validModel ? 0 : -1;
    canvas.setAttribute("aria-hidden", String(!interactive));
    $("representation-kind").textContent = interactive ? "INTERACTIVE · ATOMS + BONDS" : "PYMOL · FIXED RENDER";
    if (interactive) {
      // Draw immediately after unhiding: linked audience tabs can throttle
      // animation frames while the window is inactive.
      drawModel();
    } else {
      const definition = representations[mode];
      const imagePath = document.body.classList.contains("presentation-mode") ? definition.presentationImage : definition.image;
      $("render-title").textContent = definition.title;
      $("render-description").textContent = definition.description;
      $("render-image-link").href = imagePath;
      renderImage.alt = definition.alt;
      document.querySelectorAll("[data-render-annotation]").forEach(card => { card.hidden = card.dataset.renderAnnotation !== mode; });
      if (renderImage.getAttribute("src") !== imagePath) {
        renderImage.hidden = true;
        imageFallback.hidden = false;
        imageFallback.querySelector("h2").textContent = "Loading fixed PyMOL image…";
        imageFallback.querySelector("p").textContent = "The local render uses the unchanged standalone coordinates.";
        imageFallback.querySelector("button").hidden = true;
        renderImage.src = imagePath;
      } else if (renderImage.complete) {
        if (renderImage.naturalWidth > 0) imageLoaded();
        else imageUnavailable();
      }
    }
    if (announce) $("workspace-announcement").textContent = interactive
      ? "Interactive atom view. Drag or use the labeled controls to rotate and inspect the model."
      : `${representations[mode].title}. Fixed PyMOL image; generated conformation, not experimental.`;
  }
  document.querySelectorAll("[data-representation]").forEach(button => button.addEventListener("click", () => showRepresentation(button.dataset.representation)));
  document.querySelectorAll("[data-open-representation]").forEach(button => button.addEventListener("click", () => {
    showRepresentation(button.dataset.openRepresentation);
    const activeButton = document.querySelector(`[data-representation="${button.dataset.openRepresentation}"]`);
    activeButton?.focus({ preventScroll: true });
  }));
  showRepresentation("backbone", false);
  const initialGuided = location.hash.match(/^#present-([1-8])$/);
  const initialAnchor = document.getElementById(location.hash.slice(1));
  const initialWorkspace = initialAnchor?.closest(".workspace");
  if (initialGuided) showPresentation(Number(initialGuided[1]), false, false);
  else if (initialWorkspace) showView(initialWorkspace.id.slice(5), false, false);
  else {
    const initialView = viewFromHash();
    if (workspaces.some(section => section.id === `view-${initialView}`)) showView(initialView, false);
    else showPresentation(1, false);
  }
})();
