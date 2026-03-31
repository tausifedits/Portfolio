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

const formatCount = (target) => `${target}${target === 48 ? "h" : "+"}`;

const createParticles = () => {
  if (!particleField || reduceMotion) {
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
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("is-visible", entry.isIntersecting);
        });
      },
      {
        threshold: 0.18,
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
    link.addEventListener("click", closeMenu);
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
    if (reduceMotion || !parallaxElements.length) {
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
  if (reduceMotion || !tiltElements.length) {
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
