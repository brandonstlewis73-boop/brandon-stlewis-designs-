const CONFIG = {
  domain: "https://www.brandonstlewisdesign.shop",
  email: "brandonstlewis73@gmail.com",
  phone: "",
  instagram: "https://www.instagram.com/bsd_designs_/",
};

const PAGES = new Map([
  ["home", { path: "/", title: "BSD | Brandon St Lewis Designs" }],
  ["services", { path: "/services", title: "Services | BSD" }],
  ["projects", { path: "/projects", title: "Featured Work | BSD" }],
  ["process", { path: "/process", title: "Process | BSD" }],
  ["pricing", { path: "/pricing", title: "Pricing | BSD" }],
  ["policies", { path: "/policies", title: "Policies | BSD" }],
  ["contact", { path: "/contact", title: "Contact | BSD" }],
  ["reviews", { path: "/reviews", title: "Reviews | BSD" }],
]);

const PAYMENT_PACKAGES = {
  starter: { name: "Starter Design Package", amount: "95.00" },
  brand: { name: "Brand Identity Package", amount: "275.00" },
  premium: { name: "Website / Premium Build", amount: "650.00" },
  social: { name: "Social Media Management", amount: "220.00" },
};

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const lowPowerDevice =
  reducedMotion ||
  window.matchMedia("(max-width: 620px)").matches ||
  (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

if (lowPowerDevice) {
  document.documentElement.classList.add("low-motion");
}

function track(eventName, detail = {}) {
  window.dispatchEvent(new CustomEvent("bsd:analytics", { detail: { eventName, ...detail } }));
}

window.BSDTrack = track;

function safeStorage(type) {
  try {
    const storage = window[type];
    const key = "__bsd_test__";
    storage.setItem(key, key);
    storage.removeItem(key);
    return storage;
  } catch {
    return null;
  }
}

const localStore = safeStorage("localStorage");
const sessionStore = safeStorage("sessionStorage");

function normalizePath(pathname) {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return clean.toLowerCase();
}

function pathToPage(pathname) {
  const path = normalizePath(pathname);
  if (path === "/" || path === "/home" || path === "/index.html") return "home";
  for (const [page, meta] of PAGES) {
    if (normalizePath(meta.path) === path) return page;
  }
  return null;
}

function hashToPage(hash) {
  const value = hash.replace("#", "").trim().toLowerCase();
  return PAGES.has(value) ? value : null;
}

function currentPageFromLocation() {
  return hashToPage(window.location.hash) || pathToPage(window.location.pathname) || "home";
}

function pathForPage(page) {
  return PAGES.get(page)?.path || "/";
}

const pageSections = Array.from(document.querySelectorAll("[data-page]"));
const routeLinks = Array.from(document.querySelectorAll("[data-route]"));
const main = document.getElementById("main");
const navbar = document.querySelector(".navbar");
const menuToggle = document.getElementById("menu-toggle");
const siteMenu = document.getElementById("site-menu");
const menuBackdrop = document.getElementById("menu-backdrop");
let activePage = currentPageFromLocation();
let lastMenuFocus = null;

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

function updateRouteLinks(page) {
  routeLinks.forEach((link) => {
    const isCurrent = link.dataset.route === page;
    if (isCurrent) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function closeOpenDialogs() {
  document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
}

function setMenuOpen(isOpen) {
  if (!menuToggle || !siteMenu) return;
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  siteMenu.setAttribute("aria-hidden", String(!isOpen));
  navbar?.classList.toggle("is-open", isOpen);
  document.body.classList.toggle("menu-open", isOpen);

  if (isOpen) {
    lastMenuFocus = document.activeElement;
    window.setTimeout(() => siteMenu.querySelector("a")?.focus({ preventScroll: true }), 80);
  } else if (lastMenuFocus instanceof HTMLElement) {
    lastMenuFocus.focus({ preventScroll: true });
    lastMenuFocus = null;
  }
}

function routeTo(page, options = {}) {
  if (!PAGES.has(page)) page = "home";
  activePage = page;
  closeOpenDialogs();
  setMenuOpen(false);

  pageSections.forEach((section) => {
    const isActive = section.dataset.page === page;
    section.hidden = !isActive;
    section.setAttribute("aria-hidden", String(!isActive));
    if (isActive) {
      section.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
    }
  });

  document.body.dataset.page = page;
  document.title = PAGES.get(page)?.title || "BSD";
  updateRouteLinks(page);

  if (options.replace) {
    history.replaceState({ page }, "", pathForPage(page));
  } else if (options.push !== false && normalizePath(location.pathname) !== normalizePath(pathForPage(page))) {
    history.pushState({ page }, "", pathForPage(page));
  }

  if (options.scroll !== false) {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  if (options.focusMain) {
    window.requestAnimationFrame(() => main?.focus({ preventScroll: true }));
  }

  if (page === "pricing") {
    preparePayments();
  }
}

function routeFromLink(anchor) {
  const explicit = anchor.dataset.route;
  if (explicit && PAGES.has(explicit)) return explicit;

  const href = anchor.getAttribute("href") || "";
  if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) return null;
  if (href.startsWith("#")) return hashToPage(href);

  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return null;
    return pathToPage(url.pathname);
  } catch {
    return null;
  }
}

function initRouting() {
  routeTo(activePage, { replace: true, scroll: true });

  document.addEventListener("click", (event) => {
    const anchor = event.target.closest("a");
    if (!anchor) return;

    if (anchor.dataset.track) {
      track(anchor.dataset.track, { href: anchor.href });
    }

    if (anchor.target === "_blank" || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const route = routeFromLink(anchor);
    if (!route) return;

    event.preventDefault();
    routeTo(route, { focusMain: true });
  });

  window.addEventListener("popstate", () => {
    routeTo(currentPageFromLocation(), { push: false, focusMain: true });
  });
}

function initMenu() {
  menuToggle?.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    setMenuOpen(!isOpen);
  });

  menuBackdrop?.addEventListener("click", () => setMenuOpen(false));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeOpenDialogs();
      setMenuOpen(false);
    }
  });

  siteMenu?.addEventListener("keydown", (event) => {
    if (event.key !== "Tab" || !document.body.classList.contains("menu-open")) return;
    const focusable = Array.from(siteMenu.querySelectorAll("a"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

function initContactLinks() {
  const phoneChip = document.getElementById("phone-chip");
  const instagramChip = document.getElementById("instagram-chip");

  if (CONFIG.phone) {
    phoneChip?.setAttribute("href", `tel:${CONFIG.phone}`);
    phoneChip?.removeAttribute("data-route");
  } else {
    phoneChip?.remove();
  }

  if (CONFIG.instagram) {
    instagramChip?.setAttribute("href", CONFIG.instagram);
  } else {
    instagramChip?.remove();
  }
}

function initReveal() {
  const reveals = Array.from(document.querySelectorAll(".reveal"));
  if (reducedMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  reveals.forEach((element) => observer.observe(element));
}

function initIntro() {
  const intro = document.getElementById("intro-sequence");
  const skip = document.getElementById("intro-skip");
  if (!intro) return;

  const seenKey = "bsd_intro_seen";
  const closeIntro = () => {
    intro.classList.add("is-hidden");
    sessionStore?.setItem(seenKey, "true");
  };

  if (reducedMotion || sessionStore?.getItem(seenKey) === "true") {
    closeIntro();
    return;
  }

  skip?.addEventListener("click", closeIntro);
  window.setTimeout(closeIntro, 1050);
}

function initCookieNotice() {
  const banner = document.getElementById("cookie-banner");
  const accept = document.getElementById("accept-cookies");
  const key = "bsd_cookie_consent";
  if (!banner || !accept || localStore?.getItem(key) === "accepted") {
    document.body.classList.remove("cookie-visible");
    return;
  }

  window.setTimeout(() => {
    banner.classList.add("is-visible");
    document.body.classList.add("cookie-visible");
  }, 900);
  accept.addEventListener("click", () => {
    localStore?.setItem(key, "accepted");
    banner.classList.remove("is-visible");
    document.body.classList.remove("cookie-visible");
  });
}

function setActiveService(card) {
  document.querySelectorAll("[data-service-card]").forEach((item) => {
    item.classList.toggle("is-active", item === card);
  });

  const title = document.getElementById("active-service-title");
  const copy = document.getElementById("active-service-copy");
  if (title) title.textContent = card.dataset.title || "Service";
  if (copy) copy.textContent = card.dataset.copy || "";
}

function fillServiceModal(card) {
  const modal = document.getElementById("service-modal");
  const image = document.getElementById("service-modal-image");
  const type = document.getElementById("service-modal-type");
  const title = document.getElementById("service-modal-title");
  const copy = document.getElementById("service-modal-copy");
  const list = document.getElementById("service-modal-list");
  if (!modal || !image || !type || !title || !copy || !list) return;

  image.src = card.dataset.image || "/assets/anchorwheel-website-project.png";
  image.alt = `${card.dataset.title || "Service"} example`;
  type.textContent = card.dataset.type || "Service";
  title.textContent = card.dataset.title || "Service";
  copy.textContent = card.dataset.copy || "";
  list.innerHTML = "";

  (card.dataset.items || "")
    .split("|")
    .filter(Boolean)
    .forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });

  openDialog(modal, card);
  track("service_view", { service: card.dataset.title || "" });
}

function initServices() {
  const cards = Array.from(document.querySelectorAll("[data-service-card]"));
  if (!cards.length) return;
  setActiveService(cards[0]);

  cards.forEach((card) => {
    card.addEventListener("pointerenter", () => setActiveService(card));
    card.addEventListener("focus", () => setActiveService(card));
    card.addEventListener("click", () => {
      setActiveService(card);
      fillServiceModal(card);
    });
  });
}

let lastDialogFocus = null;

function openDialog(dialog, opener) {
  lastDialogFocus = opener instanceof HTMLElement ? opener : document.activeElement;
  document.body.classList.add("modal-open");

  if (typeof dialog.showModal === "function") {
    if (!dialog.open) dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }

  dialog.scrollTop = 0;
  dialog.querySelector(".modal-close")?.focus({ preventScroll: true });
}

function closeDialog(dialog) {
  if (!dialog) return;
  if (dialog.open && typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

function initDialogs() {
  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("close", () => {
      document.body.classList.remove("modal-open");
      if (lastDialogFocus instanceof HTMLElement) {
        lastDialogFocus.focus({ preventScroll: true });
      }
      lastDialogFocus = null;
    });

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });
  });

  document.querySelectorAll(".modal-close").forEach((button) => {
    button.addEventListener("click", () => closeDialog(button.closest("dialog")));
  });
}

function initProjects() {
  const modal = document.getElementById("project-modal");
  const image = document.getElementById("project-modal-image");
  const status = document.getElementById("project-modal-status");
  const type = document.getElementById("project-modal-type");
  const title = document.getElementById("project-modal-title");
  const copy = document.getElementById("project-modal-copy");
  const list = document.getElementById("project-modal-list");
  const link = document.getElementById("project-modal-link");
  if (!modal || !image || !status || !type || !title || !copy || !list || !link) return;

  document.querySelectorAll("[data-project-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest("[data-project-card]");
      if (!card) return;

      image.src = card.dataset.image || "/assets/anchorwheel-website-project.png";
      image.alt = `${card.dataset.title || "Project"} preview`;
      status.textContent = card.dataset.status || "Project";
      type.textContent = card.dataset.type || "";
      title.textContent = card.dataset.title || "Project";
      copy.textContent = card.dataset.copy || "";
      list.innerHTML = "";

      (card.dataset.items || "")
        .split("|")
        .filter(Boolean)
        .forEach((item) => {
          const li = document.createElement("li");
          li.textContent = item;
          list.appendChild(li);
        });

      if (card.dataset.link) {
        link.href = card.dataset.link;
        link.textContent = "View Live Project";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.removeAttribute("data-route");
      } else {
        link.href = "/contact";
        link.textContent = "Discuss Similar Work";
        link.removeAttribute("target");
        link.removeAttribute("rel");
        link.dataset.route = "contact";
      }

      openDialog(modal, button);
      track("project_view", { project: card.dataset.title || "" });
    });
  });
}

function markInvalidFields(form) {
  Array.from(form.elements).forEach((field) => {
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
    if (field.type === "hidden") return;
    field.setAttribute("aria-invalid", String(!field.checkValidity()));
  });
}

function formPayload(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function nativeFallbackSubmit(form, status) {
  if (!form.action) return false;
  status.textContent = "Secure email fallback is opening...";
  form.dataset.nativeSubmit = "true";
  HTMLFormElement.prototype.submit.call(form);
  return true;
}

function initAsyncForm(formId, statusId, successMessage, eventName) {
  const form = document.getElementById(formId);
  const status = document.getElementById(statusId);
  if (!form || !status) return;

  form.addEventListener("input", () => markInvalidFields(form));
  form.addEventListener("change", () => markInvalidFields(form));

  form.addEventListener("submit", async (event) => {
    if (form.dataset.nativeSubmit === "true") return;
    event.preventDefault();

    const submit = form.querySelector('button[type="submit"]');
    const payload = formPayload(form);

    if (payload.website_url) {
      status.textContent = "Submission blocked.";
      status.className = "form-status is-error";
      return;
    }

    markInvalidFields(form);
    if (!form.checkValidity()) {
      status.textContent = "Please complete the required fields before submitting.";
      status.className = "form-status is-error";
      form.reportValidity();
      return;
    }

    submit.disabled = true;
    status.textContent = "Sending...";
    status.className = "form-status";

    try {
      const response = await fetch(form.dataset.api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        form.reset();
        markInvalidFields(form);
        status.textContent = successMessage;
        status.className = "form-status is-success";
        submit.disabled = false;
        track(eventName);
        return;
      }
    } catch {
      // The static local server does not run Vercel functions. Fall back below.
    }

    if (!nativeFallbackSubmit(form, status)) {
      status.textContent = "Submission could not be sent. Please email BSD directly.";
      status.className = "form-status is-error";
      submit.disabled = false;
    }
  });
}

let paymentsPrepared = false;
let paypalLoading = null;

function renderPaymentFallback(slot, plan) {
  slot.innerHTML = "";
  const link = document.createElement("a");
  link.className = "button button-primary";
  link.href = "/contact";
  link.dataset.route = "contact";
  link.textContent = "Request Quote";

  const note = document.createElement("p");
  note.className = "payment-note";
  note.textContent = `${plan.name} starts from $${plan.amount}. Final scope is confirmed before payment.`;

  slot.append(link, note);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function preparePayments() {
  if (paymentsPrepared) return;
  paymentsPrepared = true;

  const slots = Array.from(document.querySelectorAll(".payment-slot[data-package]"));
  slots.forEach((slot) => {
    const plan = PAYMENT_PACKAGES[slot.dataset.package];
    if (plan) renderPaymentFallback(slot, plan);
  });

  let config;
  try {
    const response = await fetch("/api/paypal-config");
    if (!response.ok) return;
    config = await response.json();
  } catch {
    return;
  }

  if (!config?.enabled || !config.clientId || lowPowerDevice) return;

  paypalLoading =
    paypalLoading ||
    loadScript(
      `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(config.clientId)}&currency=${encodeURIComponent(
        config.currency || "USD"
      )}&intent=capture`
    );

  try {
    await paypalLoading;
  } catch {
    return;
  }

  if (!window.paypal?.Buttons) return;

  slots.forEach((slot) => {
    const packageId = slot.dataset.package;
    const plan = PAYMENT_PACKAGES[packageId];
    if (!plan) return;
    slot.innerHTML = "";

    const status = document.createElement("p");
    status.className = "paypal-status";
    status.textContent = "PayPal checkout available for approved package payment.";
    slot.appendChild(status);

    window.paypal
      .Buttons({
        style: {
          shape: "pill",
          color: "blue",
          label: "paypal",
          height: 48,
        },
        createOrder() {
          track("checkout_start", { packageId });
          return fetch("/api/create-paypal-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ packageId }),
          })
            .then((response) => {
              if (!response.ok) throw new Error("PayPal order creation failed");
              return response.json();
            })
            .then((order) => order.id);
        },
        onApprove(data) {
          return fetch("/api/capture-paypal-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: data.orderID }),
          })
            .then((response) => {
              if (!response.ok) throw new Error("PayPal capture failed");
              return response.json();
            })
            .then(() => {
              slot.innerHTML = '<p class="paypal-status">Payment approved. BSD will review the project details.</p>';
              track("payment_success", { packageId });
            });
        },
        onError() {
          renderPaymentFallback(slot, plan);
        },
      })
      .render(slot)
      .catch(() => renderPaymentFallback(slot, plan));
  });
}

function initLiveBackground() {
  const canvas = document.getElementById("live-background");
  if (!canvas || reducedMotion) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const pointer = { x: window.innerWidth * 0.55, y: window.innerHeight * 0.35 };
  const density = lowPowerDevice ? 70 : 150;
  const streakCount = lowPowerDevice ? 8 : 18;
  const stars = Array.from({ length: density }, () => ({
    x: Math.random(),
    y: Math.random(),
    z: Math.random() * 0.85 + 0.15,
    phase: Math.random() * Math.PI * 2,
  }));
  const streaks = Array.from({ length: streakCount }, (_, index) => ({
    lane: index / streakCount,
    speed: 0.05 + Math.random() * 0.08,
    offset: Math.random(),
  }));
  let frameId = 0;
  let running = false;
  let ratio = 1;

  function resize() {
    ratio = Math.min(window.devicePixelRatio || 1, lowPowerDevice ? 1.25 : 1.7);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function draw() {
    if (!running) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const time = performance.now() * 0.001;
    const horizon = height * (width < 760 ? 0.67 : 0.6);

    ctx.clearRect(0, 0, width, height);

    const field = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, Math.max(width, height) * 0.85);
    field.addColorStop(0, "rgba(41,155,255,0.22)");
    field.addColorStop(0.32, "rgba(20,80,170,0.12)");
    field.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = field;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    stars.forEach((star, index) => {
      const drift = (time * 0.004 * star.z + index * 0.00001) % 1;
      const x = ((star.x + drift) % 1) * width;
      const y = (star.y + Math.sin(time * 0.18 + star.phase) * 0.006) * height;
      const alpha = 0.1 + Math.abs(Math.sin(time * 1.4 + star.phase)) * 0.36 * star.z;
      ctx.fillStyle = `rgba(185,225,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.5, star.z * 1.35), 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.save();
    ctx.translate(width * 0.5 + (pointer.x - width * 0.5) * 0.035, horizon);
    ctx.scale(width < 760 ? 1.1 : 1.28, width < 760 ? 0.33 : 0.25);
    for (let ring = 0; ring < 8; ring += 1) {
      const pulse = (time * 0.48 + ring * 0.14) % 1;
      const radius = 100 + ring * 82 + pulse * 68;
      ctx.strokeStyle = `rgba(80,228,255,${0.19 - ring * 0.014})`;
      ctx.lineWidth = ring % 2 ? 1.1 : 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, radius, radius * 0.54, 0, Math.PI * 0.04, Math.PI * 0.96);
      ctx.stroke();
    }
    ctx.restore();

    streaks.forEach((streak, index) => {
      const progress = (time * streak.speed + streak.offset) % 1;
      const startX = width * (1.15 - progress * 1.45);
      const y = height * (0.12 + streak.lane * 0.56) + Math.sin(time + index) * 20;
      const tail = 180 + streak.lane * 160;
      const gradient = ctx.createLinearGradient(startX + tail, y - 34, startX, y);
      gradient.addColorStop(0, "rgba(80,228,255,0)");
      gradient.addColorStop(0.52, "rgba(80,228,255,0.32)");
      gradient.addColorStop(1, "rgba(247,249,255,0.75)");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = index % 4 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(startX + tail, y - 34);
      ctx.quadraticCurveTo(startX + tail * 0.55, y - 10, startX, y);
      ctx.stroke();
    });

    ctx.restore();
    frameId = window.requestAnimationFrame(draw);
  }

  function start() {
    if (running) return;
    running = true;
    frameId = window.requestAnimationFrame(draw);
  }

  function stop() {
    running = false;
    window.cancelAnimationFrame(frameId);
  }

  resize();
  start();
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener(
    "pointermove",
    (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    },
    { passive: true }
  );
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });
}

function initPointerParallax() {
  const frame = document.querySelector(".scene-frame");
  if (!frame || lowPowerDevice) return;

  window.addEventListener(
    "pointermove",
    (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      frame.style.transform = `rotateY(${(-4 + x * 3).toFixed(2)}deg) rotateX(${(2 - y * 2).toFixed(2)}deg)`;
    },
    { passive: true }
  );
}

function init() {
  initContactLinks();
  initRouting();
  initMenu();
  initReveal();
  initIntro();
  initCookieNotice();
  initDialogs();
  initServices();
  initProjects();
  initAsyncForm("lead-form", "form-status", "Project request received. BSD will review it and respond by email.", "quote_submission");
  initAsyncForm("review-form", "review-status", "Review submitted for approval. Thank you.", "review_submission");
  initLiveBackground();
  initPointerParallax();
}

init();
