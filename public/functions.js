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