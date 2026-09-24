/* === MOBILE MENU === */
const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', isOpen);
  });
}

/* === COOKIE CONSENT === */
const cookieBanner = document.getElementById('cookieBanner');
const cookieAccept = document.getElementById('cookieAccept');
const cookieDecline = document.getElementById('cookieDecline');

function initCookieBanner() {
  const choice = localStorage.getItem('cookieConsent');
  if (!choice && cookieBanner) {
    cookieBanner.classList.add('active');
  } else if (choice === 'accepted') {
    loadAnalytics();
  }
}

function loadAnalytics() {
  // Privacy-first: only load if user explicitly accepted.
  // Replace with your analytics snippet if needed.
  if (window._analyticsLoaded) return;
  window._analyticsLoaded = true;
  console.log('Analytics loaded (privacy-first).');
}

if (cookieAccept) {
  cookieAccept.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'accepted');
    cookieBanner.classList.remove('active');
    loadAnalytics();
  });
}
if (cookieDecline) {
  cookieDecline.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'declined');
    cookieBanner.classList.remove('active');
  });
}

/* === PROMO MODAL === */
const promoModal = document.getElementById('promoModal');
const modalClose = document.getElementById('modalClose');

function initPromoModal() {
  if (!promoModal) return;
  if (localStorage.getItem('promoDismissed')) return;
  setTimeout(() => {
    promoModal.classList.add('active');
    modalClose && modalClose.focus();
  }, 4000);
}

function closeModal() {
  if (promoModal) promoModal.classList.remove('active');
  localStorage.setItem('promoDismissed', 'true');
}

if (modalClose) modalClose.addEventListener('click', closeModal);
if (promoModal) {
  promoModal.addEventListener('click', (e) => {
    if (e.target === promoModal) closeModal();
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && promoModal && promoModal.classList.contains('active')) {
    closeModal();
  }
});

/* === BOOKING FORM === */
const bookingForm = document.getElementById('bookingForm');
const bookingSuccess = document.getElementById('bookingSuccess');
const bookingSummary = document.getElementById('bookingSummary');

if (bookingForm) {
  // Set minimum date to today
  const dateInput = document.getElementById('bookingDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }

  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();

    const data = {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      email: document.getElementById('email').value.trim(),
      service: document.getElementById('service').value,
      barber: document.getElementById('barber').value,
      date: document.getElementById('bookingDate').value,
      time: document.getElementById('bookingTime').value,
      consent: document.getElementById('termsConsent').checked
    };

    const errors = validateBooking(data);
    if (Object.keys(errors).length > 0) {
      showErrors(errors);
      return;
    }

    renderSummary(data);
    bookingForm.style.display = 'none';
    bookingSuccess.classList.add('visible');
    bookingSuccess.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function validateBooking(data) {
  const errors = {};
  if (!data.firstName) errors.firstName = 'First name is required.';
  if (!data.lastName) errors.lastName = 'Last name is required.';
  if (!data.phone || !/^[0-9+\-\s()]{7,}$/.test(data.phone)) {
    errors.phone = 'Please enter a valid phone number.';
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!data.service) errors.service = 'Please select a service.';
  if (!data.date) errors.date = 'Please select a date.';
  if (!data.time) errors.time = 'Please select a time.';
  if (!data.consent) errors.consent = 'You must agree to the terms to continue.';

  // Validate shop hours (Tue-Sat, 9am-6pm)
  if (data.date) {
    const d = new Date(data.date + 'T' + (data.time || '09:00'));
    const day = d.getDay(); // 0=Sun, 6=Sat
    if (day === 0 || day === 1) {
      errors.date = 'We are closed on Sunday and Monday.';
    }
  }
  return errors;
}

function showErrors(errors) {
  Object.keys(errors).forEach((key) => {
    const el = document.getElementById('error-' + key);
    if (el) {
      el.textContent = errors[key];
      el.classList.add('visible');
    }
  });
}

function clearErrors() {
  document.querySelectorAll('.form-error').forEach((el) => {
    el.textContent = '';
    el.classList.remove('visible');
  });
}

function renderSummary(data) {
  if (!bookingSummary) return;
  const serviceLabel = document.querySelector(`#service option[value="${data.service}"]`)?.textContent || data.service;
  const barberLabel = data.barber === 'no-preference'
    ? 'First available'
    : (document.querySelector(`#barber option[value="${data.barber}"]`)?.textContent || data.barber);

  const dateObj = new Date(data.date + 'T' + data.time);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const formattedTime = dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit'
  });

  bookingSummary.innerHTML = `
    <dl>
      <dt>Name</dt><dd>${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}</dd>
      <dt>Service</dt><dd>${escapeHtml(serviceLabel)}</dd>
      <dt>Barber</dt><dd>${escapeHtml(barberLabel)}</dd>
      <dt>Date</dt><dd>${formattedDate}</dd>
      <dt>Time</dt><dd>${formattedTime}</dd>
      <dt>Location</dt><dd>123 Main Street, Suite 100</dd>
    </dl>
  `;

  // Attach calendar download handler
  const calBtn = document.getElementById('downloadCalendar');
  if (calBtn) {
    calBtn.onclick = () => downloadCalendarEvent({
      firstName: data.firstName,
      lastName: data.lastName,
      service: serviceLabel,
      barber: barberLabel,
      date: data.date,
      time: data.time
    });
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* === DYNAMIC ICS CALENDAR GENERATION === */
function downloadCalendarEvent(bookingData) {
  const start = new Date(`${bookingData.date}T${bookingData.time}`);
  const end = new Date(start.getTime() + 45 * 60000); // 45 min appointment

  const pad = (n) => n.toString().padStart(2, '0');
  const formatICS = (d) => {
    return d.getUTCFullYear() +
           pad(d.getUTCMonth() + 1) +
           pad(d.getUTCDate()) + 'T' +
           pad(d.getUTCHours()) +
           pad(d.getUTCMinutes()) +
           pad(d.getUTCSeconds()) + 'Z';
  };

  const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@ironandcomb.com`;

  const description = [
    `Service: ${bookingData.service}`,
    `Barber: ${bookingData.barber}`,
    `Client: ${bookingData.firstName} ${bookingData.lastName}`,
    `Please arrive 5 minutes early.`,
    `Cancellations require 24 hours notice.`
  ].join('\\n');

  const icsData = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Iron & Comb Barbershop//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICS(new Date())}`,
    `DTSTART:${formatICS(start)}`,
    `DTEND:${formatICS(end)}`,
    'SUMMARY:Haircut at Iron & Comb Barbershop',
    `DESCRIPTION:${description}`,
    'LOCATION:123 Bree Street\\, Cape Town\\, 8001\\, South Africa',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'iron-and-comb-appointment.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/* === INIT === */
document.addEventListener('DOMContentLoaded', () => {
  initCookieBanner();
  initPromoModal();
});