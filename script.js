const particleField = document.querySelector(".particle-field");
const revealElements = document.querySelectorAll(".reveal");
const countElements = document.querySelectorAll("[data-count]");
const parallaxElements = document.querySelectorAll("[data-parallax]");
const tiltElements = document.querySelectorAll("[data-tilt]");
const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const navBackdrop = document.querySelector(".nav-backdrop");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isSmallViewport =
  window.matchMedia("(max-width: 768px)").matches ||
  window.matchMedia("(max-height: 900px)").matches;
const hasLowMemory =
  typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4;
const isLiteMode = reduceMotion || isSmallViewport || hasLowMemory;

document.body.classList.toggle("is-lite-mode", isLiteMode);

const formatCount = (target) => `${target}${target === 48 ? "h" : "+"}`;

const createParticles = () => {
  if (!particleField || isLiteMode) {
    return;
  }

  const particleCount = 26;

  for (let index = 0; index < particleCount; index += 1) {
    const particle = document.createElement("span");
    const size = (Math.random() * 3.6 + 2.2).toFixed(2);
    const x = (Math.random() * 100).toFixed(2);
    const y = (Math.random() * 100).toFixed(2);
    const opacity = (Math.random() * 0.45 + 0.25).toFixed(2);
    const duration = (Math.random() * 8 + 10).toFixed(2);
    const delay = (Math.random() * -18).toFixed(2);
    const driftX = (Math.random() * 44 - 22).toFixed(2);
    const driftY = (Math.random() * -50 - 10).toFixed(2);

    particle.style.setProperty("--size", `${size}px`);
    particle.style.setProperty("--x", `${x}%`);
    particle.style.setProperty("--y", `${y}%`);
    particle.style.setProperty("--opacity", opacity);
    particle.style.setProperty("--duration", `${duration}s`);
    particle.style.setProperty("--delay", `${delay}s`);
    particle.style.setProperty("--drift-x", `${driftX}px`);
    particle.style.setProperty("--drift-y", `${driftY}px`);
    particleField.appendChild(particle);
  }
};

const animateCount = (element) => {
  const target = Number(element.dataset.count || 0);
  const duration = 1400;
  const start = performance.now();

  const step = (currentTime) => {
    const progress = Math.min((currentTime - start) / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    const value = Math.floor(target * eased);

    element.textContent = formatCount(value);

    if (progress < 1) {
      window.requestAnimationFrame(step);
      return;
    }

    element.textContent = formatCount(target);
  };

  window.requestAnimationFrame(step);
};

const setupRevealObserver = () => {
  if (!revealElements.length && !countElements.length) {
    return;
  }

  if (!("IntersectionObserver" in window) || reduceMotion) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
    countElements.forEach((element) => {
      element.textContent = formatCount(Number(element.dataset.count || 0));
    });
    return;
  }

  const animatedCounts = new WeakSet();

  if (revealElements.length) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    revealElements.forEach((element) => revealObserver.observe(element));
  }

  if (countElements.length) {
    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || animatedCounts.has(entry.target)) {
            return;
          }

          animatedCounts.add(entry.target);
          animateCount(entry.target);
        });
      },
      {
        threshold: 0.55,
      }
    );

    countElements.forEach((element) => countObserver.observe(element));
  }
};

const setupMenu = (syncScrollEffects, showHeader) => {
  if (!siteNav || !menuToggle) {
    return;
  }

  const setMenuState = (isOpen) => {
    siteNav.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    navBackdrop?.classList.toggle("is-open", isOpen);
    document.body.classList.toggle("menu-open", isOpen);

    if (isOpen) {
      showHeader();
    }

    syncScrollEffects();
  };

  const closeMenu = () => {
    setMenuState(false);
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    setMenuState(!isOpen);
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetSelector = link.getAttribute("href");
      const shouldDelayNavigation =
        window.innerWidth <= 860 &&
        targetSelector &&
        targetSelector.startsWith("#");

      if (!shouldDelayNavigation) {
        closeMenu();
        return;
      }

      event.preventDefault();
      closeMenu();

      window.setTimeout(() => {
        const target = document.querySelector(targetSelector);

        target?.scrollIntoView({
          behavior: isLiteMode ? "auto" : "smooth",
          block: "start",
        });

        history.replaceState(null, "", targetSelector);
      }, isLiteMode ? 90 : 170);
    });
  });

  navBackdrop?.addEventListener("click", closeMenu);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) {
      closeMenu();
    }
  });
};

const setupScrollEffects = () => {
  let currentScrollY = window.scrollY || window.pageYOffset;
  let lastScrollY = currentScrollY;
  let lastToggleScrollY = currentScrollY;
  let headerVisible = true;
  let ticking = false;
  let headerHeight = header ? header.offsetHeight : 0;

  const updateParallax = (scrollY) => {
    if (isLiteMode || !parallaxElements.length) {
      return;
    }

    parallaxElements.forEach((element) => {
      const speed = Number(element.dataset.speed || 0);
      element.style.transform = `translate3d(0, ${scrollY * speed}px, 0)`;
    });
  };

  const showHeader = () => {
    headerVisible = true;
    lastToggleScrollY = currentScrollY;

    if (header) {
      header.classList.remove("is-hidden");
    }
  };

  const applyScrollEffects = () => {
    const scrollDelta = currentScrollY - lastScrollY;
    const menuIsOpen = siteNav?.classList.contains("is-open");

    if (header) {
      header.classList.toggle("is-scrolled", currentScrollY > 18);

      if (menuIsOpen || currentScrollY <= 12) {
        showHeader();
      } else if (scrollDelta > 1) {
        const hasPassedHeader = currentScrollY > headerHeight + 24;
        const hideDistance = currentScrollY - lastToggleScrollY;

        if (headerVisible && hasPassedHeader && hideDistance > 18) {
          headerVisible = false;
          lastToggleScrollY = currentScrollY;
          header.classList.add("is-hidden");
        }
      } else if (scrollDelta < -1) {
        const showDistance = lastToggleScrollY - currentScrollY;

        if (!headerVisible && showDistance > 12) {
          showHeader();
        }
      }
    }

    updateParallax(currentScrollY);
    lastScrollY = currentScrollY;
    ticking = false;
  };

  const syncScrollEffects = () => {
    currentScrollY = window.scrollY || window.pageYOffset;

    if (ticking) {
      return;
    }

    ticking = true;
    window.requestAnimationFrame(applyScrollEffects);
  };

  updateParallax(currentScrollY);
  syncScrollEffects();

  window.addEventListener("scroll", syncScrollEffects, { passive: true });
  window.addEventListener(
    "resize",
    () => {
      headerHeight = header ? header.offsetHeight : 0;
      syncScrollEffects();
    },
    { passive: true }
  );

  return {
    syncScrollEffects,
    showHeader,
  };
};

const setupTilt = () => {
  if (isLiteMode || !tiltElements.length) {
    return;
  }

  tiltElements.forEach((element) => {
    let frame = null;

    const reset = () => {
      element.style.transform = "";
    };

    element.addEventListener("pointermove", (event) => {
      const bounds = element.getBoundingClientRect();
      const percentX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      const percentY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;

      if (frame) {
        cancelAnimationFrame(frame);
      }

      frame = requestAnimationFrame(() => {
        element.style.transform = `perspective(1600px) rotateX(${percentY * -4}deg) rotateY(${percentX * 5}deg) translateY(-4px)`;
      });
    });

    element.addEventListener("pointerleave", reset);
    element.addEventListener("pointercancel", reset);
  });
};

createParticles();
setupRevealObserver();

const { syncScrollEffects, showHeader } = setupScrollEffects();

setupMenu(syncScrollEffects, showHeader);
setupTilt();

const setupVideoFeatures = () => {
  const workCards = document.querySelectorAll(".work-card");
  
  workCards.forEach(card => {
    const video = card.querySelector(".work-video");
    const progress = card.querySelector(".work-progress span");
    const previewContainer = card.querySelector(".work-preview");
    
    if (video && previewContainer) {
      const controls = document.createElement("div");
      controls.className = "video-controls";
      controls.innerHTML = `
        <button class="control-btn mute-btn" aria-label="Toggle sound">
          <svg class="icon-mute" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
          <svg class="icon-unmute" viewBox="0 0 24 24" style="display:none;"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
        </button>
        <button class="control-btn fullscreen-btn" aria-label="Fullscreen">
          <svg viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
        </button>
      `;
      previewContainer.appendChild(controls);

      const muteBtn = controls.querySelector(".mute-btn");
      const fullscreenBtn = controls.querySelector(".fullscreen-btn");

      if (progress) {
        video.addEventListener("timeupdate", () => {
          if (video.duration) {
            const percent = (video.currentTime / video.duration) * 100;
            progress.style.width = `${percent}%`;
          }
        });
      }

      muteBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        video.muted = !video.muted;
        const iconMute = muteBtn.querySelector(".icon-mute");
        const iconUnmute = muteBtn.querySelector(".icon-unmute");
        if (video.muted) {
          iconMute.style.display = "block";
          iconUnmute.style.display = "none";
        } else {
          iconMute.style.display = "none";
          iconUnmute.style.display = "block";
        }
      });

      fullscreenBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (video.requestFullscreen) {
          video.requestFullscreen();
        } else if (video.webkitRequestFullscreen) {
          video.webkitRequestFullscreen();
        } else if (video.msRequestFullscreen) {
          video.msRequestFullscreen();
        }
      });

      card.addEventListener("mouseleave", () => {
        if (!video.muted) {
          video.muted = true;
          const iconMute = muteBtn.querySelector(".icon-mute");
          const iconUnmute = muteBtn.querySelector(".icon-unmute");
          if (iconMute) iconMute.style.display = "block";
          if (iconUnmute) iconUnmute.style.display = "none";
        }
      });
    }
  });
};

setupVideoFeatures();

const setupAdaptiveHeader = () => {
  if (!header || !("IntersectionObserver" in window)) return;

  const sections = document.querySelectorAll("[data-header-color]");
  if (!sections.length) return;

  // Track which sections are currently intersecting
  const visibleSections = new Map();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const color = entry.target.dataset.headerColor;
        if (entry.isIntersecting) {
          visibleSections.set(entry.target, color);
        } else {
          visibleSections.delete(entry.target);
        }
      });

      // Use the last (lowest on page = most in view) intersecting section
      let activeColor = null;
      sections.forEach((section) => {
        if (visibleSections.has(section)) {
          activeColor = visibleSections.get(section);
        }
      });

      header.style.setProperty("--header-accent", activeColor || "transparent");
    },
    {
      threshold: 0.15,
      rootMargin: "-60px 0px 0px 0px",
    }
  );

  sections.forEach((section) => observer.observe(section));
};

setupAdaptiveHeader();
