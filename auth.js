const USERS_KEY = 'cde_users';
const SESSION_KEY = 'cde_session';

// Lee un JSON de localStorage y devuelve el valor por defecto si no existe o está dañado
function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

// Calcula el hash SHA-256 de un texto y lo devuelve en hexadecimal
async function sha256(text) {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Genera una sal aleatoria que se guarda junto a cada cuenta
function makeSalt() {
  return [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Dibuja en la zona de cuenta el botón de acceso, o el nombre del usuario con su botón para salir
function renderAccount() {
  const box = document.getElementById('account');
  if (!box) return;
  const session = readJSON(SESSION_KEY, null);

  // Muestra el contenido protegido solo si hay sesión iniciada
  document.body.classList.toggle('member', Boolean(session));

  // El botón de la portada invita a iniciar sesión mientras no haya una
  const cta = document.getElementById('heroCta');
  if (cta) {
    cta.href = session ? '#schedules' : 'login.html';
    cta.textContent = session ? 'Ver horarios' : 'Iniciar sesión para ver más';
  }

  // Rellena nombre y correo del formulario de contacto con los de la sesión y los bloquea
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    [[contactForm.nombre, session?.name], [contactForm.correo, session?.email]].forEach(([field, value]) => {
      field.defaultValue = value ?? '';
      field.value = value ?? '';
      field.readOnly = Boolean(session);
    });
  }
  box.innerHTML = '';
  if (session) {
    const hello = document.createElement('span');
    hello.textContent = `Hola, ${session.name}`;
    const out = document.createElement('button');
    out.className = 'btn small';
    out.textContent = 'Cerrar sesión';
    out.addEventListener('click', () => { localStorage.removeItem(SESSION_KEY); renderAccount(); });
    box.append(hello, out);
  } else {
    const link = document.createElement('a');
    link.className = 'btn small';
    link.href = 'login.html';
    link.textContent = 'Iniciar sesión';
    box.append(link);
  }
}

// Guarda la sesión y vuelve a la página principal
function startSession(name, email) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ name, email }));
  location.href = 'index.html';
}

// Controla las pestañas y el envío del formulario de la página de acceso
function setupAuthForm(form) {
  if (readJSON(SESSION_KEY, null)) { location.replace('index.html'); return; }

  const tabs = document.querySelectorAll('.tab');
  const nameField = document.getElementById('nameField');
  const confirmField = document.getElementById('confirmField');
  const submitBtn = document.getElementById('submitBtn');
  const msg = document.getElementById('authMsg');
  let mode = 'login';

  // Cambia entre iniciar sesión y crear cuenta
  function setMode(next) {
    mode = next;
    tabs.forEach(t => t.setAttribute('aria-selected', t.dataset.mode === mode));
    nameField.classList.toggle('hidden', mode === 'login');
    confirmField.classList.toggle('hidden', mode === 'login');
    form.clave2.value = '';
    form.querySelectorAll('input').forEach(i => i.classList.remove('bad'));
    submitBtn.textContent = mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta';
    form.clave.autocomplete = mode === 'login' ? 'current-password' : 'new-password';
    msg.textContent = '';
  }
  tabs.forEach(t => t.addEventListener('click', () => setMode(t.dataset.mode)));

  // Cada botón muestra u oculta la contraseña del campo que tiene al lado
  form.querySelectorAll('.eye').forEach(btn => btn.addEventListener('click', () => {
    const input = btn.previousElementSibling;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.setAttribute('aria-pressed', show);
    btn.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
  }));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!crypto.subtle) {
      msg.textContent = 'Abre la página con Live Server (http://127.0.0.1) para poder iniciar sesión.';
      return;
    }
    const name = form.nombre.value.trim();
    const email = form.correo.value.trim().toLowerCase();
    const pass = form.clave.value;

    // Marca en rojo los campos inválidos
    const invalid = [
      [form.correo, !email || !form.correo.checkValidity()],
      [form.clave, pass.length < (mode === 'register' ? 6 : 1)],
      [form.nombre, mode === 'register' && !name],
      [form.clave2, mode === 'register' && form.clave2.value !== pass]
    ];
    invalid.forEach(([field, bad]) => field.classList.toggle('bad', bad));
    if (invalid.some(([, bad]) => bad)) {
      // Si lo único que falla es la repetición, se avisa de que no coinciden
      const onlyMismatch = !invalid.slice(0, 3).some(([, bad]) => bad);
      msg.textContent = mode === 'login'
        ? 'Escribe tu correo y tu contraseña.'
        : onlyMismatch
          ? 'Las contraseñas no coinciden.'
          : 'Completa los campos. La contraseña necesita al menos 6 caracteres.';
      return;
    }

    const users = readJSON(USERS_KEY, {});
    if (mode === 'register') {
      if (users[email]) { msg.textContent = 'Ese correo ya tiene una cuenta. Inicia sesión.'; return; }
      const salt = makeSalt();
      users[email] = { name, salt, hash: await sha256(salt + pass) };
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      startSession(name, email);
    } else {
      const user = users[email];
      if (!user || user.hash !== await sha256(user.salt + pass)) {
        msg.textContent = 'Correo o contraseña incorrectos.';
        return;
      }
      startSession(user.name, email);
    }
  });
}

renderAccount();
const authForm = document.getElementById('authForm');
if (authForm) setupAuthForm(authForm);