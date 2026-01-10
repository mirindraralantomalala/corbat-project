// js/script.js
(function(){
  const modal = document.getElementById('interestModal');
  const closeBtn = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelModal');
  const serviceNameEl = document.getElementById('serviceName');
  const serviceInput = document.getElementById('serviceInput');
  const interestForm = document.getElementById('interestForm');

  if (!interestForm) return;

  // === Ouvrir le modal ===
  document.querySelectorAll('.btn-interested').forEach(btn => {
    if (btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const svc = btn.dataset.service || '';
      if (serviceNameEl) serviceNameEl.textContent = svc;
      if (serviceInput) serviceInput.value = svc;
      modal?.classList.add('active');
      document.body.classList.add('modal-open');
    });
  });

  // === Fermer le modal ===
  const closeModal = () => {
    modal?.classList.remove('active');
    document.body.classList.remove('modal-open');
  };

  [closeBtn, cancelBtn].forEach(btn => {
    if (btn) btn.addEventListener('click', closeModal);
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('modal-overlay')) closeModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // === Soumission du formulaire ===
  interestForm.addEventListener('submit', async function(e){
    e.preventDefault();

    const fullname = this.fullname.value.trim();
    const email = this.email.value.trim();
    const phone = this.phone.value.trim();
    const message = this.message.value.trim();
    const service = this.service.value.trim();

    if (!fullname || !email || !phone) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const payload = {
      fullname,
      email,
      phone,
      message,
      service
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ Merci ! Votre demande a bien été envoyée.");
        this.reset();
        closeModal();
      } else {
        alert("❌ Erreur lors de l'envoi : " + (data.message || "Veuillez réessayer."));
      }
    } catch (err) {
      console.error("❌ Erreur de connexion:", err);
      alert("❌ Impossible de contacter le serveur. Veuillez vérifier votre connexion.");
    }
  });
})();
