const body = document.body;
const header = document.querySelector('[data-header]');
const nav = document.querySelector('[data-nav]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const progressBar = document.querySelector('.scroll-progress span');

// Header, progress indicator and subtle image movement.
function updateOnScroll() {
  const y = window.scrollY;
  header?.classList.toggle('is-scrolled', y > 24);

  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? Math.min(y / max, 1) : 0;
  if (progressBar) progressBar.style.transform = `scaleX(${progress})`;

  const parallax = document.querySelector('[data-parallax] img');
  if (parallax && y < window.innerHeight * 1.1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const shift = Math.min(y * 0.035, window.innerHeight * 0.035);
    parallax.style.setProperty('--hero-shift', `${shift}px`);
  }
}

window.addEventListener('scroll', updateOnScroll, { passive: true });
updateOnScroll();

// Mobile menu.
function closeMenu() {
  nav?.classList.remove('is-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.setAttribute('aria-label', 'Menü öffnen');
  body.classList.remove('menu-open');
}

menuToggle?.addEventListener('click', () => {
  const willOpen = !nav.classList.contains('is-open');
  nav.classList.toggle('is-open', willOpen);
  menuToggle.setAttribute('aria-expanded', String(willOpen));
  menuToggle.setAttribute('aria-label', willOpen ? 'Menü schließen' : 'Menü öffnen');
  body.classList.toggle('menu-open', willOpen);
});

nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
window.addEventListener('resize', () => { if (window.innerWidth > 1050) closeMenu(); });

// Reveal elements as they enter the viewport.
const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

// Highlight the current navigation item.
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    nav?.querySelectorAll('a').forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`);
    });
  });
}, { rootMargin: '-35% 0px -55%', threshold: 0 });

document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));

// Portfolio filters.
const filters = document.querySelectorAll('[data-filter]');
const cards = [...document.querySelectorAll('.work-card[data-category]')];

filters.forEach((filter) => {
  filter.addEventListener('click', () => {
    const category = filter.dataset.filter;
    filters.forEach((item) => item.classList.toggle('is-active', item === filter));

    cards.forEach((card, index) => {
      const matches = category === 'all' || card.dataset.category.split(' ').includes(category);
      card.classList.toggle('is-hidden', !matches);
      if (matches) {
        card.animate(
          [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: 420, delay: index * 45, easing: 'cubic-bezier(.22,1,.36,1)' }
        );
      }
    });
  });
});

// Portfolio lightbox.
const lightbox = document.querySelector('[data-lightbox]');
const lightboxImage = lightbox?.querySelector('img');
const lightboxTitle = lightbox?.querySelector('figcaption b');
const lightboxSubtitle = lightbox?.querySelector('figcaption span');
let currentIndex = 0;

function visibleCards() {
  return cards.filter((card) => !card.classList.contains('is-hidden'));
}

function setLightboxContent(card) {
  if (!card || !lightboxImage) return;
  lightboxImage.src = card.dataset.image;
  lightboxImage.alt = card.querySelector('img')?.alt || '';
  lightboxTitle.textContent = card.dataset.title;
  lightboxSubtitle.textContent = card.dataset.subtitle;
}

function openLightbox(card) {
  const items = visibleCards();
  currentIndex = items.indexOf(card);
  setLightboxContent(card);
  lightbox.showModal();
  body.classList.add('lightbox-open');
}

function closeLightbox() {
  lightbox?.close();
  body.classList.remove('lightbox-open');
}

function moveLightbox(direction) {
  const items = visibleCards();
  currentIndex = (currentIndex + direction + items.length) % items.length;
  setLightboxContent(items[currentIndex]);
  lightboxImage?.animate([{ opacity: .15 }, { opacity: 1 }], { duration: 280 });
}

cards.forEach((card) => card.addEventListener('click', () => openLightbox(card)));
document.querySelector('[data-lightbox-close]')?.addEventListener('click', closeLightbox);
document.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => moveLightbox(-1));
document.querySelector('[data-lightbox-next]')?.addEventListener('click', () => moveLightbox(1));
lightbox?.addEventListener('click', (event) => { if (event.target === lightbox) closeLightbox(); });
lightbox?.addEventListener('close', () => body.classList.remove('lightbox-open'));
document.addEventListener('keydown', (event) => {
  if (!lightbox?.open) return;
  if (event.key === 'ArrowLeft') moveLightbox(-1);
  if (event.key === 'ArrowRight') moveLightbox(1);
});

// Friendly demo confirmation. Connect this to a form service before publishing.
const contactForm = document.querySelector('[data-contact-form]');
contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const submit = contactForm.querySelector('button[type="submit"]');
  const status = contactForm.querySelector('.form-status');
  submit.disabled = true;
  submit.textContent = 'Wird gesendet …';

  window.setTimeout(() => {
    const firstName = new FormData(contactForm).get('name')?.toString().trim().split(' ')[0] || 'du';
    status.textContent = `Danke, ${firstName}! Deine Anfrage ist vorgemerkt.`;
    submit.innerHTML = 'Anfrage gesendet <span>✓</span>';
    contactForm.reset();
    window.setTimeout(() => {
      submit.disabled = false;
      submit.innerHTML = 'Anfrage senden <span>↗</span>';
    }, 4000);
  }, 650);
});

document.querySelector('[data-year]').textContent = new Date().getFullYear();
