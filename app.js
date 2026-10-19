(() => {
  "use strict";

  const email = "jaxhong@gmail.com";
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const carouselRefreshers = [];
  const refreshCarousels = () => carouselRefreshers.forEach((refresh) => refresh());

  // Keep the mobile menu state out of the desktop layout rules.
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const siteNav = document.getElementById("site-nav");
  const closeMenu = () => {
    siteNav?.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
  };

  if (menuToggle && siteNav) {
    menuToggle.setAttribute("aria-controls", siteNav.id);
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.addEventListener("click", () => {
      const isOpen = siteNav.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
    siteNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && siteNav.classList.contains("is-open")) {
        closeMenu();
        menuToggle.focus();
      }
    });
    document.addEventListener("click", (event) => {
      if (!siteNav.contains(event.target) && !menuToggle.contains(event.target)) {
        closeMenu();
      }
    });
  }

  // All image buttons share one keyboard-accessible, native dialog gallery.
  const gallery = [...document.querySelectorAll(".image-link[data-src]")];
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightbox-image");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const lightboxCounter = document.getElementById("lightbox-counter");
  const lightboxClose = document.querySelector("[data-lightbox-close]");
  let galleryIndex = 0;
  let galleryOpener = null;

  const renderImage = (index) => {
    if (!gallery.length || !lightboxImage) return;
    galleryIndex = ((index % gallery.length) + gallery.length) % gallery.length;
    const source = gallery[galleryIndex];
    const sourceImage = source.querySelector("img");
    const caption = source.dataset.caption || sourceImage?.alt || "Project image";
    lightboxImage.src = source.dataset.src;
    lightboxImage.alt = sourceImage?.alt || caption;
    if (lightboxCaption) lightboxCaption.textContent = caption;
    if (lightboxCounter) {
      lightboxCounter.textContent = `${galleryIndex + 1} / ${gallery.length}`;
    }
  };

  const closeLightbox = () => {
    if (!lightbox?.open) return;
    if (typeof lightbox.close === "function") {
      lightbox.close();
    } else {
      lightbox.removeAttribute("open");
      galleryOpener?.focus({ preventScroll: true });
    }
    document.body.classList.remove("lightbox-open");
    refreshCarousels();
  };

  if (lightbox && lightboxImage && gallery.length) {
    gallery.forEach((button, index) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        galleryOpener = button;
        renderImage(index);
        if (!lightbox.open) {
          if (typeof lightbox.showModal === "function") {
            lightbox.showModal();
          } else {
            lightbox.setAttribute("open", "");
          }
        }
        document.body.classList.add("lightbox-open");
        refreshCarousels();
        lightboxClose?.focus({ preventScroll: true });
      });
    });

    lightboxClose?.addEventListener("click", closeLightbox);
    document.querySelector("[data-lightbox-prev]")?.addEventListener("click", () => {
      renderImage(galleryIndex - 1);
    });
    document.querySelector("[data-lightbox-next]")?.addEventListener("click", () => {
      renderImage(galleryIndex + 1);
    });
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
    lightbox.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        renderImage(galleryIndex + (event.key === "ArrowRight" ? 1 : -1));
      }
    });
    lightbox.addEventListener("close", () => {
      document.body.classList.remove("lightbox-open");
      refreshCarousels();
      if (galleryOpener?.isConnected) galleryOpener.focus({ preventScroll: true });
    });
  }

  const copyEmail = document.getElementById("copy-email");
  const copyFeedback = document.getElementById("copy-feedback");
  copyEmail?.addEventListener("click", async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(email);
      if (copyFeedback) copyFeedback.textContent = "Email copied.";
    } catch {
      if (copyFeedback) copyFeedback.textContent = `Copy this address: ${email}`;
    }
  });

  // Follow the visitor's system preference without an extra footer control.
  const motionPreference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const applyMotionPreference = (reduce) => {
    document.body.classList.toggle("reduce-motion", reduce);
    refreshCarousels();
  };
  applyMotionPreference(Boolean(motionPreference?.matches));
  motionPreference?.addEventListener?.("change", (event) => {
    applyMotionPreference(event.matches);
  });

  const duckMessage = document.getElementById("duck-message");
  const duckTimers = new WeakMap();
  const quacks = ["quack.", "quack quack.", "…quack?"];
  let quackCount = 0;
  document.querySelectorAll("[data-duck]").forEach((duck) => {
    duck.addEventListener("click", () => {
      clearTimeout(duckTimers.get(duck));
      duck.classList.add("is-quacking");
      duckTimers.set(duck, setTimeout(() => duck.classList.remove("is-quacking"), 600));
      if (duckMessage) duckMessage.textContent = quacks[quackCount++ % quacks.length];
    });
  });

  // Slides rotate only while the visitor is free to watch them. A manual
  // selection starts a fresh six-second interval once the gallery is eligible.
  document.querySelectorAll("[data-carousel]").forEach((carousel) => {
    const track = carousel.querySelector(".carousel-track");
    const slides = [...carousel.querySelectorAll(".carousel-slide")];
    if (!slides.length) return;

    const previous = carousel.querySelector("[data-carousel-prev]");
    const next = carousel.querySelector("[data-carousel-next]");
    const count = carousel.querySelector("[data-carousel-count]");
    const dots = [...carousel.querySelectorAll("[data-carousel-dot]")];
    let activeIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains("is-active")));
    let isHovered = carousel.matches(":hover");
    let hasFocus = carousel.contains(document.activeElement);
    let inViewport = false;
    let timer = null;
    let touchStart = null;
    let ignoreClickUntil = 0;

    const prefersLessMotion = () => document.body.classList.contains("reduce-motion");
    const canRotate = () => slides.length > 1 && !isHovered
      && !hasFocus && inViewport && !document.hidden && !lightbox?.open
      && !document.body.classList.contains("lightbox-open") && !prefersLessMotion();

    const renderSlide = (index, announce = false) => {
      activeIndex = ((index % slides.length) + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === activeIndex;
        slide.hidden = !active;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
        slide.setAttribute("role", "group");
        slide.setAttribute("aria-roledescription", "slide");
        const label = slide.dataset.label;
        slide.setAttribute("aria-label", `${slideIndex + 1} of ${slides.length}${label ? `: ${label}` : ""}`);
      });
      dots.forEach((dot, dotIndex) => {
        const indexValue = Number(dot.dataset.slideIndex ?? dotIndex);
        dot.setAttribute("aria-current", String(indexValue === activeIndex));
        dot.classList.toggle("is-active", indexValue === activeIndex);
      });
      if (count) {
        count.setAttribute("aria-live", announce ? "polite" : "off");
        count.setAttribute("aria-atomic", "true");
        count.textContent = `${activeIndex + 1} / ${slides.length}`;
      }
    };

    const synchronize = () => {
      const mayRotate = canRotate();
      carousel.dataset.autoplay = mayRotate ? "playing" : "paused";
      if (!mayRotate && timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      if (mayRotate && timer === null) {
        timer = setTimeout(() => {
          timer = null;
          if (canRotate()) renderSlide(activeIndex + 1);
          synchronize();
        }, 6000);
      }
    };

    const navigate = (index) => {
      const focusWasInSlide = slides[activeIndex].contains(document.activeElement);
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      renderSlide(index, true);
      if (focusWasInSlide) {
        // Hiding a focused image would otherwise drop keyboard focus onto the
        // page. Keep consecutive arrow presses within the newly visible slide.
        slides[activeIndex].querySelector(".image-link")?.focus({ preventScroll: true });
      }
      synchronize();
    };

    track?.setAttribute("aria-live", "off");
    previous?.addEventListener("click", () => navigate(activeIndex - 1));
    next?.addEventListener("click", () => navigate(activeIndex + 1));
    if (previous) previous.disabled = slides.length < 2;
    if (next) next.disabled = slides.length < 2;
    dots.forEach((dot, dotIndex) => {
      dot.addEventListener("click", () => {
        const index = Number(dot.dataset.slideIndex ?? dotIndex);
        if (Number.isInteger(index)) navigate(index);
      });
    });
    carousel.addEventListener("mouseenter", () => {
      isHovered = true;
      synchronize();
    });
    carousel.addEventListener("mouseleave", () => {
      isHovered = false;
      synchronize();
    });
    carousel.addEventListener("focusin", () => {
      hasFocus = true;
      synchronize();
    });
    carousel.addEventListener("focusout", () => {
      // Focus can move between controls in the same gallery.
      queueMicrotask(() => {
        hasFocus = carousel.contains(document.activeElement);
        synchronize();
      });
    });
    carousel.addEventListener("keydown", (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || lightbox?.open) return;
      if (event.target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        navigate(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
      }
    });

    // Vertical gestures remain available for page scrolling. Suppress the
    // following image click only when a clear horizontal swipe changed slides.
    track?.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch" || event.pointerType === "pen") {
        touchStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
      }
    }, { passive: true });
    track?.addEventListener("pointerup", (event) => {
      if (!touchStart || touchStart.id !== event.pointerId) return;
      const deltaX = event.clientX - touchStart.x;
      const deltaY = event.clientY - touchStart.y;
      touchStart = null;
      if (Math.abs(deltaX) >= 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
        ignoreClickUntil = Date.now() + 500;
        navigate(activeIndex + (deltaX < 0 ? 1 : -1));
      }
    }, { passive: true });
    track?.addEventListener("pointercancel", () => { touchStart = null; });
    track?.addEventListener("click", (event) => {
      if (Date.now() < ignoreClickUntil) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);

    carouselRefreshers.push(synchronize);
    renderSlide(activeIndex);
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        inViewport = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.1);
        synchronize();
      }, { threshold: [0, 0.1] });
      observer.observe(carousel);
    } else {
      const checkViewport = () => {
        const bounds = carousel.getBoundingClientRect();
        inViewport = bounds.bottom > 0 && bounds.top < window.innerHeight;
        synchronize();
      };
      window.addEventListener("scroll", checkViewport, { passive: true });
      window.addEventListener("resize", checkViewport, { passive: true });
      checkViewport();
    }
    synchronize();
  });
  document.addEventListener("visibilitychange", refreshCarousels);

  const sectionLinks = [...document.querySelectorAll("[data-section-link]")];
  const sections = [...document.querySelectorAll("[data-section][id]")];
  const progress = document.getElementById("reading-progress");
  let currentSection = "";
  let scrollFrame = 0;

  const setCurrentSection = (id) => {
    if (!id || currentSection === id) return;
    currentSection = id;
    sectionLinks.forEach((link) => {
      let target = link.getAttribute("href") || "";
      try { target = decodeURIComponent(target); } catch { /* Keep the original href. */ }
      const activeTarget = link.closest("#site-nav")
        ? (["shop", "contact", "about", "top"].includes(id) ? id : "work")
        : (id === "shop" ? "work" : id);
      if (target === `#${activeTarget}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  const sectionAtReadingPosition = () => {
    const root = document.documentElement;
    const viewportHeight = window.innerHeight || root.clientHeight;
    const documentHeight = Math.max(root.scrollHeight, document.body.scrollHeight || 0);
    const viewportBottom = (window.scrollY || root.scrollTop || 0) + viewportHeight;
    if (documentHeight > viewportHeight && viewportBottom >= documentHeight - 4) {
      return sections.find((section) => section.id === "contact") || sections[sections.length - 1];
    }
    const readingLine = window.innerHeight * 0.28;
    let containingSection = null;
    let precedingSection = sections[0];
    for (const section of sections) {
      const bounds = section.getBoundingClientRect();
      if (bounds.top <= readingLine) precedingSection = section;
      // Later matching entries are nested sections such as Manufacturing.
      // Once a nested section ends, its surrounding project becomes current.
      if (bounds.top <= readingLine && bounds.bottom > readingLine) containingSection = section;
    }
    return containingSection
      || precedingSection?.parentElement?.closest("[data-section][id]")
      || precedingSection;
  };

  let sectionObserver = null;
  if (sections.length && "IntersectionObserver" in window) {
    sectionObserver = new IntersectionObserver(() => {
      setCurrentSection(sectionAtReadingPosition()?.id);
    }, {
      rootMargin: "-15% 0px -55% 0px",
      threshold: [0, 0.25, 0.5, 0.75, 1],
    });
    sections.forEach((section) => sectionObserver.observe(section));
  }

  const updateScroll = () => {
    scrollFrame = 0;
    const root = document.documentElement;
    const distance = Math.max(0, root.scrollHeight - root.clientHeight);
    const scrollTop = window.scrollY || root.scrollTop || 0;
    const completion = distance > 0 ? clamp(scrollTop / distance, 0, 1) : 0;
    if (progress) progress.style.transform = `scaleX(${completion})`;
    if (sections.length) setCurrentSection(sectionAtReadingPosition()?.id);
  };

  const scheduleScrollUpdate = () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
  };
  window.addEventListener("scroll", scheduleScrollUpdate, { passive: true });
  window.addEventListener("resize", scheduleScrollUpdate, { passive: true });
  window.addEventListener("load", scheduleScrollUpdate, { once: true });
  setCurrentSection(sectionAtReadingPosition()?.id);
  updateScroll();
})();
