// Menú móvil: abre y cierra el panel lateral
const sidebar = document.getElementById('sidebar');
const toggle = document.querySelector('.menu-toggle');
toggle.addEventListener('click', () => {
  const open = sidebar.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});
sidebar.addEventListener('click', e => {
  if (e.target.tagName === 'A') {
    sidebar.classList.remove('open');
    toggle.setAttribute('aria-expanded', false);
  }
});

// Resalta en el menú la sección que está a la vista
const links = [...document.querySelectorAll('.sidebar a')];
const sections = links.map(a => document.querySelector(a.hash));
const spy = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      links.forEach(a => a.classList.toggle('active', a.hash === '#' + entry.target.id));
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(s => spy.observe(s));

// Anima la entrada de cada sección y arranca los contadores de "Nosotros"
const counters = document.querySelectorAll('[data-count]');
function countUp(el) {
  const target = +el.dataset.count;
  const start = performance.now();
  const step = now => {
    const p = Math.min((now - start) / 1200, 1);
    el.textContent = Math.round(target * p);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const reveal = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('in');
    if (entry.target.id === 'about') counters.forEach(countUp);
    reveal.unobserve(entry.target);
  });
}, { threshold: .15 });
document.querySelectorAll('.reveal').forEach(el => reveal.observe(el));

// Filtra la tabla de horarios por día
const chips = document.querySelectorAll('.chip');
const rows = document.querySelectorAll('tbody tr');
chips.forEach(chip => chip.addEventListener('click', () => {
  chips.forEach(c => c.classList.toggle('on', c === chip));
  rows.forEach(row => {
    const show = chip.dataset.day === 'all' || row.dataset.day === chip.dataset.day;
    row.classList.toggle('hide', !show);
    row.classList.remove('pop');
    if (show) { void row.offsetWidth; row.classList.add('pop'); }
  });
}));

// Calendario: eventos fijos por día del mes (se repiten cada mes)
const events = {
  5: 'Clínica de saque en voleibol, 6:00 p. m.',
  12: 'Torneo interno de baloncesto, 9:00 a. m.',
  19: 'Jornada de puertas abiertas, 10:00 a. m.',
  26: 'Final de la liga de fútbol sala, 5:00 p. m.'
};
const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const grid = document.getElementById('calGrid');
const label = document.getElementById('monthLabel');
const info = document.getElementById('calInfo');
let view = new Date();
view.setDate(1);

// Dibuja el mes que se está viendo
function renderCalendar() {
  grid.innerHTML = '';
  label.textContent = `${monthNames[view.getMonth()]} ${view.getFullYear()}`;
  ['L', 'M', 'M', 'J', 'V', 'S', 'D'].forEach(d => {
    const el = document.createElement('span');
    el.className = 'dow';
    el.textContent = d;
    grid.append(el);
  });
  const offset = (view.getDay() + 6) % 7;
  const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  for (let i = 0; i < offset; i++) grid.append(document.createElement('span'));
  const now = new Date();
  for (let d = 1; d <= days; d++) {
    const b = document.createElement('button');
    b.textContent = d;
    if (events[d]) {
      b.className = 'event';
      b.addEventListener('click', () => { info.textContent = `${d} de ${monthNames[view.getMonth()]}: ${events[d]}`; });
    }
    if (d === now.getDate() && view.getMonth() === now.getMonth() && view.getFullYear() === now.getFullYear()) {
      b.classList.add('today');
    }
    grid.append(b);
  }
}
document.getElementById('prev').addEventListener('click', () => { view.setMonth(view.getMonth() - 1); renderCalendar(); });
document.getElementById('next').addEventListener('click', () => { view.setMonth(view.getMonth() + 1); renderCalendar(); });
renderCalendar();

// Formulario: valida los campos y muestra la confirmación en la página
const form = document.getElementById('contactForm');
const msg = document.getElementById('formMsg');
let msgTimer;
form.addEventListener('submit', e => {
  e.preventDefault();
  let ok = true;
  form.querySelectorAll('input, textarea').forEach(f => {
    const bad = !f.value.trim() || (f.type === 'email' && !f.checkValidity());
    f.classList.toggle('bad', bad);
    if (bad) ok = false;
  });
  clearTimeout(msgTimer);
  msg.textContent = ok ? 'Mensaje enviado. Te respondemos pronto.' : 'Revisa los campos marcados.';
  if (ok) {
    form.reset();
    // El mensaje de confirmación desaparece a los 1,5 segundos
    msgTimer = setTimeout(() => { msg.textContent = ''; }, 1500);
  }
});

document.getElementById('year').textContent = new Date().getFullYear();