// Show modal by ID
    function showModal(id) {
      document.getElementById(id).classList.remove('hidden');
    }

    // Hide modal by ID
    function hideModal(id) {
      document.getElementById(id).classList.add('hidden');
    }

    // Buttons to open modals
    document.getElementById('loginBtn').addEventListener('click', () => showModal('loginModal'));
    document.getElementById('registerBtn').addEventListener('click', () => showModal('registerModal'));

    // Close buttons
    document.querySelectorAll('.close').forEach(btn => {
      btn.addEventListener('click', e => {
        hideModal(e.target.getAttribute('data-close'));
      });
    });

    // Click outside modal-content closes modal
    window.addEventListener('click', e => {
      if (e.target.classList.contains('modal')) {
        e.target.classList.add('hidden');
      }
    });


// CATPCHA FUNCTION

let captchaCode = '';

function createCaptcha() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  captchaCode = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

  const canvas = document.getElementById('captchaCanvas');
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = '22px monospace';
  ctx.fillStyle = '#5b21b6';
  ctx.fillText(captchaCode, 10, 30);
}

function checkCaptcha(e) {
  const userInput = document.getElementById('captchaInput').value.trim();
  if (userInput !== captchaCode) {
    e.preventDefault();
    alert('Incorrect CAPTCHA.');
    createCaptcha();
  }
}

document.getElementById('refreshCaptcha').onclick = createCaptcha;
document.getElementById('loginForm').onsubmit = checkCaptcha;

createCaptcha();