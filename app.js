const grid = document.querySelector('#equipmentGrid');
const categoryList = document.querySelector('#categoryList');
const modalBackdrop = document.querySelector('#modalBackdrop');
const modalContent = document.querySelector('#modalContent');
const catalogError = document.querySelector('#catalogError');
const money = new Intl.NumberFormat('fr-FR');
let listings = [];
let selectedCategory = '';
let marketType = 'all';
let transactionType = 'all';
let activeEquipment = null;
let activeProperty = null;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function formatXof(amount) {
  return `${money.format(amount)} FCFA`;
}

function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => toast.classList.remove('show'), 2800);
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Une erreur est survenue.');
  return result;
}

function renderCategories(items) {
  const matchingType = marketType === 'all' ? items : items.filter(item => item.listingType === marketType);
  const categories = [...new Set(matchingType.map(item => item.category))].sort((a, b) => a.localeCompare(b, 'fr'));
  categoryList.innerHTML = [
    `<button class="category-chip ${selectedCategory ? '' : 'active'}" data-category="">Tout voir</button>`,
    ...categories.map(category => `<button class="category-chip ${selectedCategory === category ? 'active' : ''}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`)
  ].join('');
}

function getVisibleEquipment() {
  const maxPrice = Number(document.querySelector('#maxPriceInput').value);
  return listings.filter(item =>
    (marketType === 'all' || item.listingType === marketType) &&
    (transactionType === 'all' || item.transactionType === transactionType) &&
    (!selectedCategory || item.category === selectedCategory) &&
    (!maxPrice || item.price <= maxPrice)
  );
}

function renderEquipment() {
  const visible = getVisibleEquipment();
  document.querySelector('#catalogCount').textContent = `${visible.length} annonce${visible.length === 1 ? '' : 's'}`;
  grid.innerHTML = visible.length ? visible.map(item => `
    <article class="equipment-card">
      <div class="equipment-art ${item.listingType === 'property' ? 'property-art' : 'equipment-photo-art'}">
        ${item.imageUrl ? `<img class="listing-photo" src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)} à ${escapeHtml(item.city)}" loading="lazy">` : ''}
        <span class="equipment-category">${item.listingType === 'property' ? (item.transactionType === 'sale' ? 'À vendre' : 'À louer') : escapeHtml(item.category)}</span>
        <span class="equipment-symbol" aria-hidden="true">${iconFor(item.category)}</span>
        ${item.listingType === 'property' ? `<button class="photo-open-button" data-listing-id="${item.id}" data-listing-type="property" aria-label="Voir les détails de ${escapeHtml(item.name)}">Voir le bien <span aria-hidden="true">↗</span></button>` : ''}
      </div>
      <div class="equipment-info">
        <div class="equipment-location"><span aria-hidden="true">⌖</span>${escapeHtml(item.city)} · ${item.listingType === 'property' ? escapeHtml(item.category) : 'Matériel BTP'}</div>
        <h3>${escapeHtml(item.name)}</h3>
        <div class="card-bottom">
          <span class="daily-price">${formatXof(item.price)} <small>${item.priceUnit === 'mois' ? '/ mois' : item.priceUnit === 'jour' ? '/ jour' : '· le bien'}</small></span>
          <span class="rating" aria-label="Note ${item.rating} sur 5">★ ${Number(item.rating).toFixed(1)}</span>
        </div>
        ${item.listingType === 'property' && (item.areaM2 || item.bedrooms) ? `<p class="listing-specs">${item.areaM2 ? `${item.areaM2} m²` : ''}${item.areaM2 && item.bedrooms ? ' · ' : ''}${item.bedrooms ? `${item.bedrooms} chambres` : ''}</p>` : ''}
        <button class="book-button" data-listing-id="${item.id}" data-listing-type="${item.listingType}">${item.listingType === 'property' ? 'Demander une visite' : 'Voir le devis'} <span aria-hidden="true">→</span></button>
      </div>
    </article>
  `).join('') : '<p class="empty-state">Aucun matériel ne correspond à ces filtres. Essayez une autre catégorie ou une autre ville.</p>';
}

function iconFor(category) {
  const label = category.toLowerCase();
  if (label.includes('terrain')) return '⌂';
  if (label.includes('maison') || label.includes('villa')) return '⌂';
  if (label.includes('appartement')) return '▥';
  if (label.includes('local')) return '▤';
  if (label.includes('grue')) return '↗';
  if (label.includes('énergie')) return 'ϟ';
  if (label.includes('sécurité')) return '⬡';
  if (label.includes('topographie')) return '⌖';
  if (label.includes('échafaudage')) return '▥';
  if (label.includes('compacteur')) return '◉';
  if (label.includes('béton')) return '▱';
  if (label.includes('outil')) return '⚒';
  return '⚙';
}

async function loadListings() {
  const params = new URLSearchParams();
  const search = document.querySelector('#searchInput').value.trim();
  const city = document.querySelector('#cityInput').value.trim();
  const maxPrice = Number(document.querySelector('#maxPriceInput').value);
  if (marketType !== 'all') params.set('type', marketType);
  if (search) params.set('search', search);
  if (city) params.set('city', city);
  if (maxPrice > 0) params.set('maxPrice', String(Math.floor(maxPrice)));
  grid.innerHTML = '<div class="loading-card">Chargement du catalogue…</div>';
  catalogError.hidden = true;
  try {
    const result = await requestJson(`/api/listings?${params}`);
    listings = result.items;
    if (selectedCategory && !listings.some(item => item.category === selectedCategory)) selectedCategory = '';
    renderCategories(listings);
    document.querySelector('#transactionTabs').hidden = marketType !== 'property';
    renderEquipment();
  } catch (error) {
    grid.innerHTML = '';
    catalogError.textContent = error.message;
    catalogError.hidden = false;
  }
}

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function openModal(content) {
  modalContent.innerHTML = content;
  modalBackdrop.hidden = false;
  document.body.style.overflow = 'hidden';
  modalBackdrop.querySelector('.modal-close').focus();
}

function closeModal() {
  modalBackdrop.hidden = true;
  document.body.style.overflow = '';
  activeEquipment = null;
  activeProperty = null;
}

function openPropertyDetails(property) {
  activeProperty = property;
  const priceUnit = property.priceUnit === 'mois' ? '/ mois' : 'pour le bien';
  openModal(`
    <div class="property-detail">
      ${property.imageUrl ? `<img class="property-detail-photo" src="${escapeHtml(property.imageUrl)}" alt="${escapeHtml(property.name)} à ${escapeHtml(property.city)}">` : ''}
      <div class="property-detail-content">
        <p class="eyebrow">${property.transactionType === 'sale' ? 'À vendre' : 'À louer'} · ${escapeHtml(property.category)}</p>
        <h2 id="modalTitle">${escapeHtml(property.name)}</h2>
        <p class="property-detail-location">⌖ ${escapeHtml(property.city)} <span>·</span> ${escapeHtml(property.category)}</p>
        <p class="property-detail-price">${formatXof(property.price)} <small>${priceUnit}</small></p>
        <div class="property-features">
          ${property.areaM2 ? `<span>${Number(property.areaM2).toLocaleString('fr-FR')} m²</span>` : ''}
          ${property.bedrooms ? `<span>${property.bedrooms} chambre${property.bedrooms === 1 ? '' : 's'}</span>` : ''}
          <span>★ ${Number(property.rating).toFixed(1)} <small>note indicative</small></span>
        </div>
        <h3>Description</h3>
        <p class="property-detail-description">${escapeHtml(property.description)}</p>
        <p class="fine-print">Photo et annonce de démonstration. Vérifiez l’identité de l’annonceur, l’état du bien, le prix et les documents avant tout engagement.</p>
        <button class="button button-primary" id="propertyVisitButton" style="width:100%;margin-top:12px">${property.transactionType === 'sale' ? 'Demander une visite ou des informations' : 'Demander une visite'} <span aria-hidden="true">→</span></button>
      </div>
    </div>
  `);
  document.querySelector('#propertyVisitButton').addEventListener('click', () => openPropertyInquiry(property));
}

function quoteFor(item, days, withDriver, withDelivery) {
  const rental = item.dailyRate * days;
  const driver = withDriver ? item.dailyDriverRate * days : 0;
  const delivery = withDelivery ? item.deliveryFee : 0;
  return { rental, driver, delivery, deposit: Math.round(rental * 0.3), total: rental + driver + delivery };
}

function selectedDays(form) {
  const start = form.elements.startDate.value;
  const end = form.elements.endDate.value;
  if (!start || !end || end < start) return 0;
  return Math.floor((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000) + 1;
}

function updateQuote(form) {
  const days = selectedDays(form);
  const withDriver = form.elements.withDriver?.checked === true;
  const withDelivery = form.elements.withDelivery.checked;
  const quote = quoteFor(activeEquipment, days, withDriver, withDelivery);
  form.querySelector('[data-quote-days]').textContent = days ? `${days} jour${days > 1 ? 's' : ''}` : 'Sélectionnez vos dates';
  form.querySelector('[data-quote-rental]').textContent = days ? formatXof(quote.rental) : '—';
  form.querySelector('[data-quote-driver]').textContent = days && withDriver ? formatXof(quote.driver) : '—';
  form.querySelector('[data-quote-delivery]').textContent = withDelivery ? formatXof(quote.delivery) : '—';
  form.querySelector('[data-quote-deposit]').textContent = days ? formatXof(quote.deposit) : '—';
  form.querySelector('[data-quote-total]').textContent = days ? formatXof(quote.total) : '—';
}

function openBooking(item) {
  activeEquipment = item;
  const today = localDateString();
  openModal(`
    <p class="eyebrow">Demande de location</p>
    <h2 id="modalTitle">${escapeHtml(item.name)}</h2>
    <p class="modal-intro">${escapeHtml(item.description)}<br>Situé à ${escapeHtml(item.city)} · ${formatXof(item.dailyRate)} / jour</p>
    <form id="bookingForm">
      <div class="form-grid">
        <label class="form-field"><span>Votre nom</span><input name="name" required minlength="2" maxlength="120" autocomplete="name" placeholder="Nom complet"></label>
        <label class="form-field"><span>Votre e-mail</span><input name="email" required type="email" maxlength="254" autocomplete="email" placeholder="nom@entreprise.com"></label>
        <label class="form-field"><span>Date de début</span><input name="startDate" type="date" min="${today}" required></label>
        <label class="form-field"><span>Date de fin</span><input name="endDate" type="date" min="${today}" required></label>
      </div>
      ${item.dailyDriverRate > 0 ? `<label class="option-row"><input name="withDriver" type="checkbox"><span><b>Ajouter un conducteur</b>${formatXof(item.dailyDriverRate)} par jour</span></label>` : ''}
      <label class="option-row"><input name="withDelivery" type="checkbox"><span><b>Livraison sur chantier</b>${formatXof(item.deliveryFee)} (forfait)</span></label>
      <div class="quote-box">
        <div class="quote-line"><span>Durée</span><strong data-quote-days>Sélectionnez vos dates</strong></div>
        <div class="quote-line"><span>Location</span><strong data-quote-rental>—</strong></div>
        <div class="quote-line"><span>Conducteur</span><strong data-quote-driver>—</strong></div>
        <div class="quote-line"><span>Livraison</span><strong data-quote-delivery>—</strong></div>
        <div class="quote-line"><span>Caution indicative (30%, non débitée)</span><strong data-quote-deposit>—</strong></div>
        <div class="quote-line quote-total"><span>Total estimatif hors caution</span><strong data-quote-total>—</strong></div>
      </div>
      <p class="form-error" id="bookingError" role="alert" hidden></p>
      <button class="button button-primary" type="submit" style="width:100%">Envoyer ma demande <span aria-hidden="true">→</span></button>
      <p class="fine-print">Aucun paiement n’est prélevé en ligne. Votre demande reste en attente de confirmation par le loueur; la caution affichée est indicative.</p>
    </form>
  `);
  const form = document.querySelector('#bookingForm');
  form.addEventListener('input', () => updateQuote(form));
  form.addEventListener('change', () => {
    if (form.elements.startDate.value) form.elements.endDate.min = form.elements.startDate.value;
    updateQuote(form);
  });
  form.addEventListener('submit', submitBooking);
}

function openPropertyInquiry(property) {
  const today = localDateString();
  openModal(`
    <p class="eyebrow">Demande immobilière</p>
    <h2 id="modalTitle">${escapeHtml(property.name)}</h2>
    <p class="modal-intro">${escapeHtml(property.description)}<br>${escapeHtml(property.city)} · ${escapeHtml(property.category)} · ${property.transactionType === 'sale' ? 'À vendre' : 'À louer'} · ${formatXof(property.price)} ${property.priceUnit === 'mois' ? '/ mois' : 'pour le bien'}</p>
    <form id="propertyInquiryForm">
      <div class="form-grid">
        <label class="form-field"><span>Votre nom</span><input name="name" required minlength="2" maxlength="120" autocomplete="name" placeholder="Nom complet"></label>
        <label class="form-field"><span>Votre e-mail</span><input name="email" required type="email" maxlength="254" autocomplete="email" placeholder="nom@example.com"></label>
        <label class="form-field full"><span>Votre demande</span>
          <select name="inquiryType" required>
            <option value="visit">Organiser une visite</option>
            <option value="information">Recevoir plus d’informations</option>
          </select>
        </label>
        <label class="form-field full"><span>Date de visite souhaitée (facultative)</span><input name="preferredDate" type="date" min="${today}"></label>
        <label class="form-field full"><span>Message (facultatif)</span><textarea name="message" maxlength="1000" rows="3" placeholder="Précisez votre projet ou vos disponibilités."></textarea></label>
      </div>
      <p class="form-error" id="propertyInquiryError" role="alert" hidden></p>
      <button class="button button-primary" type="submit" style="width:100%">Envoyer ma demande <span aria-hidden="true">→</span></button>
      <p class="fine-print">Votre demande sera transmise au responsable de l’annonce. Aucun achat ni contrat de location n’est engagé en ligne.</p>
    </form>
  `);
  document.querySelector('#propertyInquiryForm').addEventListener('submit', submitPropertyInquiry);
}

async function submitPropertyInquiry(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const errorElement = form.querySelector('#propertyInquiryError');
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Envoi en cours…';
  errorElement.hidden = true;
  try {
    const result = await requestJson('/api/property-inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: activeProperty.id,
        customer: { name: form.elements.name.value, email: form.elements.email.value },
        inquiryType: form.elements.inquiryType.value,
        preferredDate: form.elements.preferredDate.value || null,
        message: form.elements.message.value
      })
    });
    openModal(`
      <div class="success-mark" aria-hidden="true">✓</div>
      <p class="eyebrow">Demande enregistrée</p>
      <h2 id="modalTitle">Votre projet immobilier avance.</h2>
      <p class="modal-intro">Votre demande pour <b>${escapeHtml(result.property)}</b> a bien été enregistrée.</p>
      <div class="quote-box">
        <div class="quote-line"><span>Référence privée</span><strong>${escapeHtml(result.ref)}</strong></div>
        <div class="quote-line"><span>Votre demande</span><strong>${result.inquiryType === 'visit' ? 'Visite' : 'Informations'}</strong></div>
        ${result.preferredDate ? `<div class="quote-line"><span>Date souhaitée</span><strong>${escapeHtml(result.preferredDate)}</strong></div>` : ''}
        <div class="quote-line quote-total"><span>Annonce</span><strong>${formatXof(result.price)} ${result.priceUnit === 'mois' ? '/ mois' : '· le bien'}</strong></div>
      </div>
      <p class="fine-print">La référence permet de consulter le suivi de votre demande. Conservez-la et ne la partagez pas publiquement. Le bien et le prix doivent être vérifiés directement auprès de l’annonceur.</p>
      <button class="button button-primary" id="successCloseButton" style="width:100%;margin-top:15px">Terminer</button>
    `);
    document.querySelector('#successCloseButton').addEventListener('click', closeModal);
    showToast(`Demande ${result.ref} enregistrée`);
  } catch (error) {
    errorElement.textContent = error.message;
    errorElement.hidden = false;
    submitButton.disabled = false;
    submitButton.innerHTML = 'Envoyer ma demande <span aria-hidden="true">→</span>';
  }
}

async function submitBooking(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const errorElement = form.querySelector('#bookingError');
  const submitButton = form.querySelector('button[type="submit"]');
  const days = selectedDays(form);
  if (days < 1 || days > 90) {
    errorElement.textContent = 'Choisissez une période valide de 1 à 90 jours.';
    errorElement.hidden = false;
    return;
  }
  submitButton.disabled = true;
  submitButton.textContent = 'Envoi en cours…';
  errorElement.hidden = true;
  try {
    const result = await requestJson('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        equipmentId: activeEquipment.id,
        customer: { name: form.elements.name.value, email: form.elements.email.value },
        startDate: form.elements.startDate.value,
        endDate: form.elements.endDate.value,
        withDriver: form.elements.withDriver?.checked === true,
        withDelivery: form.elements.withDelivery.checked
      })
    });
    openModal(`
      <div class="success-mark" aria-hidden="true">✓</div>
      <p class="eyebrow">Demande enregistrée</p>
      <h2 id="modalTitle">Votre chantier avance.</h2>
      <p class="modal-intro">Votre demande pour <b>${escapeHtml(result.equipment)}</b> a bien été enregistrée. Le loueur doit encore la confirmer.</p>
      <div class="quote-box">
        <div class="quote-line"><span>Référence</span><strong>${escapeHtml(result.ref)}</strong></div>
        <div class="quote-line"><span>Durée</span><strong>${result.days} jour${result.days > 1 ? 's' : ''}</strong></div>
        <div class="quote-line quote-total"><span>Total estimatif</span><strong>${formatXof(result.totalAmount)}</strong></div>
        <div class="quote-line"><span>Caution indicative, non débitée</span><strong>${formatXof(result.securityDeposit)}</strong></div>
      </div>
      <p class="fine-print">Aucun paiement n’a été effectué. Conservez votre référence pour suivre cette demande.</p>
      <button class="button button-primary" id="successCloseButton" style="width:100%;margin-top:15px">Terminer</button>
    `);
    document.querySelector('#successCloseButton').addEventListener('click', closeModal);
    showToast(`Demande ${result.ref} enregistrée`);
  } catch (error) {
    errorElement.textContent = error.message;
    errorElement.hidden = false;
    submitButton.disabled = false;
    submitButton.innerHTML = 'Envoyer ma demande <span aria-hidden="true">→</span>';
  }
}

function openMyBookings() {
  openModal(`
    <p class="eyebrow">Votre espace</p>
    <h2 id="modalTitle">Suivre une demande</h2>
    <p class="modal-intro">Consultez une demande immobilière ou une réservation BTP avec sa référence privée. Gardez cette référence confidentielle.</p>
    <form id="lookupForm">
      <label class="form-field"><span>Référence de demande</span><input name="reference" required pattern="(?:LOC|IMMO)-[0-9]{8}-[A-Fa-f0-9]{32}" maxlength="46" placeholder="LOC-… ou IMMO-…"></label>
      <p class="form-error" id="lookupError" role="alert" hidden></p>
      <button class="button button-primary" type="submit" style="width:100%">Consulter la demande</button>
    </form>
    <div id="bookingResults"></div>
  `);
  document.querySelector('#lookupForm').addEventListener('submit', loadMyBookings);
}

async function loadMyBookings(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const errorElement = form.querySelector('#lookupError');
  const results = document.querySelector('#bookingResults');
  const button = form.querySelector('button');
  button.disabled = true;
  errorElement.hidden = true;
  try {
    const reference = form.elements.reference.value.trim().toUpperCase();
    const resource = reference.startsWith('IMMO-') ? 'property-inquiries' : 'bookings';
    const result = await requestJson(`/api/${resource}/${encodeURIComponent(reference)}`);
    const booking = result.booking;
    const inquiry = result.inquiry;
    results.innerHTML = inquiry ? `
      <div class="booking-row">
        <span><b>${escapeHtml(inquiry.property)}</b><small>${escapeHtml(inquiry.ref)} · ${inquiry.inquiryType === 'visit' ? 'Demande de visite' : 'Demande d’informations'}${inquiry.preferredDate ? ` · ${escapeHtml(inquiry.preferredDate)}` : ''}</small></span>
        <strong>${formatXof(inquiry.price)}<small>${inquiry.priceUnit === 'mois' ? '/ mois' : '· le bien'}</small><small>${escapeHtml(inquiry.status)}</small></strong>
      </div>
    ` : booking ? `
      <div class="booking-row">
        <span><b>${escapeHtml(booking.equipment)}</b><small>${escapeHtml(booking.ref)} · ${escapeHtml(booking.startDate)} au ${escapeHtml(booking.endDate)} · ${booking.days} jour${booking.days > 1 ? 's' : ''}</small></span>
        <strong>${formatXof(booking.totalAmount)}<small>${booking.status === 'pending' ? 'En attente du loueur' : escapeHtml(booking.status)}</small></strong>
      </div>
    ` : '<p class="fine-print">Demande introuvable.</p>';
  } catch (error) {
    errorElement.textContent = error.message;
    errorElement.hidden = false;
  } finally {
    button.disabled = false;
  }
}

categoryList.addEventListener('click', event => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  selectedCategory = button.dataset.category;
  renderCategories(listings);
  renderEquipment();
});

grid.addEventListener('click', event => {
  const button = event.target.closest('[data-listing-id]');
  if (!button) return;
  const item = listings.find(candidate => candidate.id === Number(button.dataset.listingId) && candidate.listingType === button.dataset.listingType);
  if (item?.listingType === 'property') {
    activeProperty = item;
    if (button.classList.contains('photo-open-button')) openPropertyDetails(item);
    else openPropertyInquiry(item);
  } else if (item) openBooking(item);
});
grid.addEventListener('error', event => {
  if (event.target instanceof HTMLImageElement && event.target.matches('.listing-photo')) {
    event.target.hidden = true;
    event.target.closest('.equipment-art')?.classList.add('photo-fallback');
  }
}, true);

document.querySelector('#searchButton').addEventListener('click', loadListings);
document.querySelector('#searchInput').addEventListener('keydown', event => {
  if (event.key === 'Enter') loadListings();
});
document.querySelector('#cityInput').addEventListener('keydown', event => {
  if (event.key === 'Enter') loadListings();
});
document.querySelector('#maxPriceInput').addEventListener('change', loadListings);
document.querySelector('#marketTabs').addEventListener('click', event => {
  const button = event.target.closest('[data-market-type]');
  if (!button) return;
  marketType = button.dataset.marketType;
  selectedCategory = '';
  transactionType = 'all';
  document.querySelectorAll('[data-transaction-type]').forEach(tab => {
    const active = tab.dataset.transactionType === 'all';
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('[data-market-type]').forEach(tab => {
    const active = tab === button;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-pressed', String(active));
  });
  loadListings();
});
document.querySelector('#transactionTabs').addEventListener('click', event => {
  const button = event.target.closest('[data-transaction-type]');
  if (!button) return;
  transactionType = button.dataset.transactionType;
  document.querySelectorAll('[data-transaction-type]').forEach(tab => {
    const active = tab === button;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-pressed', String(active));
  });
  renderEquipment();
});
document.querySelector('#myBookingsButton').addEventListener('click', openMyBookings);
document.querySelector('#closeModalButton').addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', event => {
  if (event.target === modalBackdrop) closeModal();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !modalBackdrop.hidden) closeModal();
});

loadListings();
