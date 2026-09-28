/* Presentation controls for saved molecular depictions; no model calculations. */
'use strict';
(() => {
  const controls = [...document.querySelectorAll('[data-chemistry-view]')];
  const views = [...document.querySelectorAll('[data-chemistry-content]')];
  function show(name, focus = false) {
    controls.forEach(button => {
      const selected = button.dataset.chemistryView === name;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (selected && focus) button.focus({preventScroll: true});
    });
    views.forEach(view => { view.hidden = view.dataset.chemistryContent !== name; });
  }
  controls.forEach((button, index) => {
    button.addEventListener('click', () => show(button.dataset.chemistryView));
    button.addEventListener('keydown', event => {
      const shift = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (!shift && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? controls.length - 1 : (index + shift + controls.length) % controls.length;
      show(controls[next].dataset.chemistryView, true);
    });
  });
  document.querySelectorAll('[data-chemistry-open-connectivity]').forEach(button => {
    button.addEventListener('click', () => document.getElementById('story-tab-5-connectivity').click());
  });
})();
