// ===== NAVBAR SCROLL EFFECT =====
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ===== MOBILE NAV TOGGLE =====
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navToggle) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
    });
  });
}

// ===== SCROLL REVEAL ANIMATION =====
function initScrollReveal() {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
  });
}

initScrollReveal();

// ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;

    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      const navHeight = navbar.offsetHeight;
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// ===== CMS CONTENT LOADER =====
// Fetches content/site.json via GitHub API so CMS changes
// take effect immediately — no Netlify redeploy required.

const GITHUB_API = 'https://api.github.com/repos/muhammadharoonbro/Rotors-website/contents/content/site.json?ref=main';

async function loadContent() {
  try {
    let data;

    // Try GitHub API first (no CDN caching — always returns latest)
    try {
      const ghRes = await fetch(GITHUB_API, {
        headers: { 'Accept': 'application/vnd.github.v3.raw' },
        cache: 'no-store'
      });
      if (ghRes.ok) data = await ghRes.json();
    } catch (e) { /* GitHub unavailable */ }

    if (!data) {
      const localRes = await fetch('content/site.json');
      if (!localRes.ok) return;
      data = await localRes.json();
    }

    // Check maintenance mode (bypass with ?preview=true in URL)
    const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
    if (data.maintenance && data.maintenance.enabled && !isPreview) {
      const overlay = document.getElementById('maintenanceOverlay');
      const msg = document.getElementById('maintenanceMessage');
      if (overlay) {
        if (msg && data.maintenance.message) msg.textContent = data.maintenance.message;
        overlay.style.display = 'flex';
        return; // Don't load the rest of the page
      }
    }

    populatePage(data);
  } catch (e) {
    // JSON not available — static HTML content remains visible
  }
}

function populatePage(data) {
  // === HERO ===
  const heroBadge = document.querySelector('.hero-badge');
  const heroH1 = document.querySelector('.hero h1');
  const heroText = document.querySelector('.hero-text');
  const heroImg = document.querySelector('.hero-image img');

  if (heroBadge && data.hero) heroBadge.textContent = data.hero.badge;
  if (heroH1 && data.hero) heroH1.innerHTML = data.hero.headline + ' <span class="highlight">' + data.hero.headline_highlight + '</span>';
  if (heroText && data.hero) heroText.textContent = data.hero.description;
  if (heroImg && data.hero) heroImg.setAttribute('src', data.hero.image);

  // === PROBLEM ===
  if (data.problem) {
    const probH2 = document.querySelector('.problem h2');
    const probTexts = document.querySelectorAll('.problem .problem-text');
    const probImg = document.querySelector('.problem-image img');
    const probCaption = document.querySelector('.problem-image .caption');

    if (probH2) probH2.textContent = data.problem.headline;
    if (probTexts[0]) probTexts[0].textContent = data.problem.text1;
    if (probTexts[1]) probTexts[1].textContent = data.problem.text2;
    if (probImg) probImg.setAttribute('src', data.problem.image);
    if (probCaption) probCaption.textContent = data.problem.caption;

    const statNumbers = document.querySelectorAll('.stat-number');
    const statLabels = document.querySelectorAll('.stat-label');
    if (data.problem.stats) {
      data.problem.stats.forEach((stat, i) => {
        if (statNumbers[i]) statNumbers[i].textContent = stat.number;
        if (statLabels[i]) statLabels[i].textContent = stat.label;
      });
    }
  }

  // === SOLUTION ===
  if (data.solution) {
    const solH2 = document.querySelector('.solution-header h2');
    const solP = document.querySelector('.solution-header p');
    if (solH2) solH2.textContent = data.solution.headline;
    if (solP) solP.textContent = data.solution.description;

    const cards = document.querySelectorAll('.solution-card');
    data.solution.cards.forEach((card, i) => {
      if (cards[i]) {
        const icon = cards[i].querySelector('.card-icon');
        const title = cards[i].querySelector('h3');
        const desc = cards[i].querySelector('p');
        if (icon) icon.textContent = card.icon;
        if (title) title.textContent = card.title;
        if (desc) desc.textContent = card.description;
      }
    });
  }

  // === TECHNOLOGY GALLERY — rebuild from JSON ===
  if (data.technology) {
    const techH2 = document.querySelector('.showcase-header h2');
    const techP = document.querySelector('.showcase-header p');
    if (techH2) techH2.textContent = data.technology.headline;
    if (techP) techP.textContent = data.technology.description;

    const gallery = document.querySelector('.showcase-gallery');
    if (gallery && data.technology.items) {
      gallery.innerHTML = '';
      data.technology.items.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'showcase-item fade-in' + (item.featured ? ' featured' : '');
        div.setAttribute('data-lightbox', i);
        div.innerHTML = '<img src="' + item.image + '" alt="' + item.title + '">' +
          '<span class="zoom-hint">&#128269;</span>' +
          '<div class="overlay"><h4>' + item.title + '</h4><p>' + item.description + '</p></div>';
        gallery.appendChild(div);
      });

      // Re-add lightbox markup
      const lbMarkup = document.createElement('div');
      lbMarkup.className = 'lightbox-overlay';
      lbMarkup.id = 'lightbox';
      lbMarkup.innerHTML = '<div class="lightbox-content">' +
        '<button class="lightbox-close" id="lightboxClose">&times;</button>' +
        '<button class="lightbox-nav lightbox-prev" id="lightboxPrev">&#8249;</button>' +
        '<button class="lightbox-nav lightbox-next" id="lightboxNext">&#8250;</button>' +
        '<img src="" alt="" id="lightboxImg">' +
        '<div class="lightbox-caption"><h4 id="lightboxTitle"></h4><p id="lightboxDesc"></p></div>' +
        '</div>';
      gallery.appendChild(lbMarkup);

      // Re-init lightbox
      initImageLightbox();
    }
  }

  // === VIDEOS — rebuild from JSON ===
  if (data.videos) {
    const vidH2 = document.querySelector('.videos-header h2');
    const vidP = document.querySelector('.videos-header p');
    if (vidH2) vidH2.textContent = data.videos.headline;
    if (vidP) vidP.textContent = data.videos.description;

    const videoGrid = document.querySelector('.video-grid');
    if (videoGrid && data.videos.items) {
      videoGrid.innerHTML = '';
      data.videos.items.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'video-card fade-in' + (item.featured ? ' featured-video' : '');
        div.setAttribute('data-video-lightbox', i);

        const ext = item.video.split('.').pop().toLowerCase();
        const isMP4 = ext === 'mp4';
        const sources = isMP4
          ? '<source src="' + item.video + '" type="video/mp4">'
          : '<source src="' + item.video + '" type="video/quicktime"><source src="' + item.video + '" type="video/mp4">';

        div.innerHTML = '<div class="video-thumb">' +
          '<video muted playsinline preload="metadata">' + sources + '</video>' +
          '<div class="video-play-btn">&#9654;</div></div>' +
          '<div class="video-info"><h4>' + item.title + '</h4><p>' + item.description + '</p></div>';
        videoGrid.appendChild(div);
      });

      // Re-add video lightbox markup
      const vlbMarkup = document.createElement('div');
      vlbMarkup.className = 'lightbox-overlay video-lightbox-overlay';
      vlbMarkup.id = 'videoLightbox';
      vlbMarkup.innerHTML = '<div class="lightbox-content video-lightbox-content">' +
        '<button class="lightbox-close" id="videoLightboxClose">&times;</button>' +
        '<button class="lightbox-nav lightbox-prev" id="videoLightboxPrev">&#8249;</button>' +
        '<button class="lightbox-nav lightbox-next" id="videoLightboxNext">&#8250;</button>' +
        '<video id="videoLightboxPlayer" controls autoplay playsinline style="width:100%;max-height:75vh;border-radius:8px;background:#000;">Your browser does not support the video tag.</video>' +
        '<div class="lightbox-caption"><h4 id="videoLightboxTitle"></h4><p id="videoLightboxDesc"></p></div>' +
        '</div>';
      videoGrid.appendChild(vlbMarkup);

      // Re-init video lightbox
      initVideoLightbox();
    }
  }

  // === PLATFORM ===
  if (data.platform) {
    const platH2 = document.querySelector('.platform-content h2');
    const platP = document.querySelector('.platform-content > p');
    const platImg = document.querySelector('.platform-image img');
    if (platH2) platH2.textContent = data.platform.headline;
    if (platP) platP.textContent = data.platform.description;
    if (platImg) platImg.setAttribute('src', data.platform.image);

    const features = document.querySelectorAll('.feature-list li');
    data.platform.features.forEach((feat, i) => {
      if (features[i]) {
        const icon = features[i].querySelector('.feature-icon');
        const title = features[i].querySelector('h4');
        const desc = features[i].querySelector('p');
        if (icon) icon.textContent = feat.icon;
        if (title) title.textContent = feat.title;
        if (desc) desc.textContent = feat.description;
      }
    });
  }

  // === BRANDS ===
  if (data.brands) {
    const brandsH2 = document.querySelector('.brands-header h2');
    const brandsP = document.querySelector('.brands-header p');
    if (brandsH2) brandsH2.textContent = data.brands.headline;
    if (brandsP) brandsP.textContent = data.brands.description;

    const brandCards = document.querySelectorAll('.brand-card');
    data.brands.cards.forEach((card, i) => {
      if (brandCards[i]) {
        const name = brandCards[i].querySelector('h3');
        const tagline = brandCards[i].querySelector('.tagline');
        const ul = brandCards[i].querySelector('ul');
        if (name) name.textContent = card.name;
        if (tagline) tagline.textContent = card.tagline;
        if (ul) {
          ul.innerHTML = '';
          card.bullets.forEach(b => {
            const li = document.createElement('li');
            li.textContent = b;
            ul.appendChild(li);
          });
        }
      }
    });
  }

  // === CTA ===
  if (data.cta) {
    const ctaH2 = document.querySelector('.cta-section h2');
    const ctaP = document.querySelector('.cta-section p');
    const ctaEmail = document.querySelector('.cta-section .btn-gold');
    if (ctaH2) ctaH2.innerHTML = data.cta.headline;
    if (ctaP) ctaP.textContent = data.cta.description;
    if (ctaEmail) ctaEmail.setAttribute('href', 'mailto:' + data.cta.email);
  }

  // === FOOTER ===
  if (data.footer) {
    const copy = document.querySelector('.footer-text');
    const notice = document.querySelector('.footer-notice');
    if (copy) copy.textContent = data.footer.copyright;
    if (notice) notice.textContent = data.footer.notice;
  }

  // Re-init scroll reveal for any new elements
  initScrollReveal();
}

// ===== IMAGE LIGHTBOX =====
function initImageLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxDesc = document.getElementById('lightboxDesc');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');

  const showcaseItems = document.querySelectorAll('.showcase-item[data-lightbox]');
  let currentIndex = 0;

  const galleryData = [];
  showcaseItems.forEach(item => {
    const img = item.querySelector('img');
    const title = item.querySelector('.overlay h4');
    const desc = item.querySelector('.overlay p');
    galleryData.push({
      src: img.getAttribute('src'),
      alt: img.getAttribute('alt'),
      title: title ? title.innerHTML : '',
      desc: desc ? desc.innerHTML : ''
    });
  });

  function openLightbox(index) {
    currentIndex = index;
    updateLightbox();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function updateLightbox() {
    const data = galleryData[currentIndex];
    lightboxImg.setAttribute('src', data.src);
    lightboxImg.setAttribute('alt', data.alt);
    lightboxTitle.innerHTML = data.title;
    lightboxDesc.innerHTML = data.desc;
  }

  function nextImage() {
    currentIndex = (currentIndex + 1) % galleryData.length;
    updateLightbox();
  }

  function prevImage() {
    currentIndex = (currentIndex - 1 + galleryData.length) % galleryData.length;
    updateLightbox();
  }

  showcaseItems.forEach((item, i) => {
    item.addEventListener('click', () => openLightbox(i));
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  lightboxNext.addEventListener('click', (e) => {
    e.stopPropagation();
    nextImage();
  });
  lightboxPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    prevImage();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
  });
}

// ===== VIDEO LIGHTBOX =====
function initVideoLightbox() {
  const videoLightbox = document.getElementById('videoLightbox');
  if (!videoLightbox) return;

  const videoPlayer = document.getElementById('videoLightboxPlayer');
  const videoLightboxTitle = document.getElementById('videoLightboxTitle');
  const videoLightboxDesc = document.getElementById('videoLightboxDesc');
  const videoLightboxClose = document.getElementById('videoLightboxClose');
  const videoLightboxPrev = document.getElementById('videoLightboxPrev');
  const videoLightboxNext = document.getElementById('videoLightboxNext');

  const videoCards = document.querySelectorAll('.video-card[data-video-lightbox]');
  let currentVideoIndex = 0;

  const videoData = [];
  videoCards.forEach(card => {
    const sources = card.querySelectorAll('.video-thumb video source');
    const title = card.querySelector('.video-info h4');
    const desc = card.querySelector('.video-info p');
    const srcList = [];
    sources.forEach(s => {
      srcList.push({ src: s.getAttribute('src'), type: s.getAttribute('type') });
    });
    videoData.push({
      sources: srcList,
      title: title ? title.innerHTML : '',
      desc: desc ? desc.innerHTML : ''
    });
  });

  function openVideoLightbox(index) {
    currentVideoIndex = index;
    updateVideoLightbox();
    videoLightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeVideoLightbox() {
    videoLightbox.classList.remove('active');
    document.body.style.overflow = '';
    videoPlayer.pause();
    videoPlayer.removeAttribute('src');
    videoPlayer.innerHTML = '';
    videoPlayer.load();
  }

  function updateVideoLightbox() {
    const data = videoData[currentVideoIndex];
    videoPlayer.innerHTML = '';
    data.sources.forEach(s => {
      const source = document.createElement('source');
      source.setAttribute('src', s.src);
      source.setAttribute('type', s.type);
      videoPlayer.appendChild(source);
    });
    videoPlayer.load();
    videoPlayer.play().catch(() => {});
    videoLightboxTitle.innerHTML = data.title;
    videoLightboxDesc.innerHTML = data.desc;
  }

  function nextVideo() {
    videoPlayer.pause();
    currentVideoIndex = (currentVideoIndex + 1) % videoData.length;
    updateVideoLightbox();
  }

  function prevVideo() {
    videoPlayer.pause();
    currentVideoIndex = (currentVideoIndex - 1 + videoData.length) % videoData.length;
    updateVideoLightbox();
  }

  videoCards.forEach((card, i) => {
    card.addEventListener('click', () => openVideoLightbox(i));
  });

  videoLightboxClose.addEventListener('click', closeVideoLightbox);
  videoLightbox.addEventListener('click', (e) => {
    if (e.target === videoLightbox) closeVideoLightbox();
  });

  videoLightboxNext.addEventListener('click', (e) => {
    e.stopPropagation();
    nextVideo();
  });
  videoLightboxPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    prevVideo();
  });

  document.addEventListener('keydown', (e) => {
    if (!videoLightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeVideoLightbox();
    if (e.key === 'ArrowRight') nextVideo();
    if (e.key === 'ArrowLeft') prevVideo();
  });
}

// ===== INITIALIZE =====
// Init lightboxes from static HTML first
initImageLightbox();
initVideoLightbox();

// Then load CMS content (overrides static HTML with JSON data)
loadContent();
