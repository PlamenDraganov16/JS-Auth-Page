document.addEventListener('DOMContentLoaded', () => {
  // CAPTCHA
  let captchaCode = '';

  function createCaptcha() {

    
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    captchaCode = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

    const canvas = document.getElementById('captchaCanvas');
    if (!canvas) return; // exit if no canvas found (no captcha on this page)
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '22px monospace';
    ctx.fillStyle = '#5b21b6';
    ctx.fillText(captchaCode, 10, 30);
  }

  function checkCaptcha() {
    const userInput = document.getElementById('captchaInput').value.trim();
    if (userInput !== captchaCode) {
      alert('Incorrect CAPTCHA.');
      createCaptcha();
      return false;
    }
    return true;
  }

  // LOGIN
  async function login(email, password) {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = '/profile.html';
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Something went wrong, please try again.');
    }
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!checkCaptcha()) return;

      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      login(email, password);
    });
  }

  // REGISTER
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ name, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          alert(data.message);
          registerForm.reset();
          hideModal('registerModal');
        } else {
          alert(data.message);
        }
      } catch (error) {
        alert('Error connecting to server');
        console.error(error);
      }
    });
  }

  // PROFILE PAGE
  async function loadProfile() {
    const res = await fetch('/api/profile');
    const data = await res.json();
    if (!data.success) {
      window.location.href = '/index.html';
      return;
    }
    const nameEl = document.getElementById('name');
    const emailEl = document.getElementById('email');
    if (nameEl) nameEl.textContent = data.user.name;
    if (emailEl) emailEl.textContent = data.user.email;
  }

  async function changePassword(event) {
    event.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    const res = await fetch('/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `currentPassword=${encodeURIComponent(currentPassword)}&newPassword=${encodeURIComponent(newPassword)}`
    });

    const data = await res.json();
    alert(data.message);
  }

  const editProfileForm = document.getElementById('editProfileForm');
if (editProfileForm) {
  editProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const updatedName = document.getElementById('nameInput').value.trim();

    try {
      const res = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ name: updatedName })
      });

      const data = await res.json();
      alert(data.message);

      if (data.success) {
        // Update displayed name on profile
        const nameEl = document.getElementById('name');
        if (nameEl) nameEl.textContent = updatedName;
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed to update profile.');
    }
  });
}

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/index.html';
  }

  if (window.location.pathname.endsWith('/profile.html')) {
    loadProfile();
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) changePasswordForm.addEventListener('submit', changePassword);
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
  }


  // MODALS
  function showModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('hidden');
  }

  function hideModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('hidden');
  }

  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) loginBtn.addEventListener('click', () => showModal('loginModal'));

  const registerBtn = document.getElementById('registerBtn');
  if (registerBtn) registerBtn.addEventListener('click', () => showModal('registerModal'));

  document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', e => {
      const closeId = e.target.getAttribute('data-close');
      if (closeId) hideModal(closeId);
    });
  });

  window.addEventListener('click', e => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.add('hidden');
    }
  });

  const refreshCaptcha = document.getElementById('refreshCaptcha');
  if (refreshCaptcha) refreshCaptcha.onclick = createCaptcha;

  createCaptcha();
});


