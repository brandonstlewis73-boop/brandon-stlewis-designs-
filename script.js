const CONFIG = {
  domain: "brandonstlewisdesign.shop",
  email: "brandonstlewis73@gmail.com",
  phone: "",
  instagram: "https://www.instagram.com/brandonstlewisdesigns/",
};

const pricingPlans = [
  { selector: "#paypal-starter", value: "95.00", name: "Starter Design Package" },
  { selector: "#paypal-brand", value: "275.00", name: "Brand Identity Package" },
  { selector: "#paypal-premium", value: "650.00", name: "Website / Premium Build" },
  { selector: "#paypal-social", value: "220.00", name: "Social Media Management" },
];

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const lowEndDevice =
  navigator.hardwareConcurrency <= 4 ||
  window.matchMedia("(max-width: 620px)").matches ||
  reducedMotion;

if (lowEndDevice) {
  document.body.classList.add("low-motion");
}

function configureContactLinks() {
  const callLink = document.getElementById("call-link");
  const phoneChip = document.getElementById("phone-chip");
  const instagramChip = document.getElementById("instagram-chip");

  if (CONFIG.phone) {
    callLink?.setAttribute("href", `tel:${CONFIG.phone}`);
    phoneChip?.setAttribute("href", `tel:${CONFIG.phone}`);
  } else {
    callLink?.remove();
    phoneChip?.remove();
  }

  if (CONFIG.instagram) {
    instagramChip?.setAttribute("href", CONFIG.instagram);
  } else {
    instagramChip?.remove();
  }
}

configureContactLinks();

const navbar = document.querySelector(".navbar");
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.querySelectorAll(".nav-links");
const pageSections = document.querySelectorAll("[data-page]");
const validPages = new Set(["home", "services", "projects", "process", "pricing", "policies", "contact", "reviews"]);

function getCurrentPage() {
  const page = window.location.hash.replace("#", "") || "home";
  return validPages.has(page) ? page : "home";
}

function showPage(page = getCurrentPage()) {
  pageSections.forEach((section) => {
    const isVisible = section.dataset.page === page;
    section.classList.toggle("is-page-hidden", !isVisible);
    if (isVisible) {
      section.querySelectorAll(".reveal").forEach((item) => item.classList.add("is-visible"));
    }
  });

  document.querySelectorAll(".nav-links a, [data-page-target]").forEach((link) => {
    const target = link.dataset.pageTarget || link.getAttribute("href")?.replace("#", "");
    link.classList.toggle("is-current", target === page);
  });

  window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
}

function navigateToPage(page) {
  if (!validPages.has(page)) return;
  if (window.location.hash !== `#${page}`) {
    window.history.pushState(null, "", `#${page}`);
  }
  showPage(page);
  setMenuOpen(false);
}

function setMenuOpen(isOpen) {
  menuToggle?.setAttribute("aria-expanded", String(isOpen));
  navbar?.classList.toggle("is-open", isOpen);
  document.body.classList.toggle("menu-open", isOpen);
}

menuToggle?.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  setMenuOpen(!isExpanded);
});

navLinks.forEach((group) => {
  group.querySelectorAll("a, [data-page-target]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = link.dataset.pageTarget || link.getAttribute("href")?.replace("#", "");
      if (target && validPages.has(target)) {
        event.preventDefault();
        event.stopPropagation();
        navigateToPage(target);
        return;
      }

      setMenuOpen(false);
    });
  });
});

document.querySelectorAll("[data-page-target]").forEach((button) => {
  button.addEventListener("touchend", (event) => {
    const target = button.dataset.pageTarget;
    if (!target || !validPages.has(target)) return;
    event.preventDefault();
    navigateToPage(target);
  }, { passive: false });
});

document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;

  const target = link.getAttribute("href")?.replace("#", "");
  if (!target || !validPages.has(target)) return;

  event.preventDefault();
  navigateToPage(target);
});

window.addEventListener("hashchange", () => {
  showPage();
  setMenuOpen(false);
});

showPage();

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenuOpen(false);
  }
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 6, 5) * 55}ms`;
  revealObserver.observe(element);
});

document.querySelectorAll(".magnetic").forEach((button) => {
  if (reducedMotion) return;

  button.addEventListener("mousemove", (event) => {
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    button.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
  });

  button.addEventListener("mouseleave", () => {
    button.style.transform = "";
  });
});

const leadForm = document.getElementById("lead-form");
const formStatus = document.getElementById("form-status");
const reviewForm = document.getElementById("review-form");
const reviewStatus = document.getElementById("review-status");

leadForm?.addEventListener("submit", (event) => {
  if (!leadForm.checkValidity()) {
    event.preventDefault();
    formStatus.textContent = "Please complete every required field before submitting.";
    formStatus.classList.add("is-error");
    leadForm.reportValidity();
    return;
  }

  formStatus.textContent = "Sending your project request...";
  formStatus.classList.remove("is-error");
  leadForm.querySelector('button[type="submit"]').disabled = true;
});

reviewForm?.addEventListener("submit", (event) => {
  if (!reviewForm.checkValidity()) {
    event.preventDefault();
    reviewStatus.textContent = "Please complete every review field before submitting.";
    reviewStatus.classList.add("is-error");
    reviewForm.reportValidity();
    return;
  }

  reviewStatus.textContent = "Sending your review to BSD...";
  reviewStatus.classList.remove("is-error");
  reviewForm.querySelector('button[type="submit"]').disabled = true;
});

function renderFallbackButton(container, plan) {
  container.innerHTML = "";
  const fallback = document.createElement("a");
  fallback.className = "paypal-fallback";
  fallback.href = "#contact";
  fallback.textContent = `Request ${plan.name}`;
  container.appendChild(fallback);
}

function initializePayPalButtons() {
  pricingPlans.forEach((plan) => {
    const container = document.querySelector(plan.selector);
    if (!container) return;

    if (!window.paypal?.Buttons) {
      renderFallbackButton(container, plan);
      return;
    }

    window.paypal
      .Buttons({
        style: {
          shape: "pill",
          color: "blue",
          label: "paypal",
          height: 48,
        },
        createOrder(_, actions) {
          return actions.order.create({
            purchase_units: [
              {
                description: plan.name,
                amount: {
                  currency_code: "USD",
                  value: plan.value,
                },
              },
            ],
          });
        },
        onApprove(_, actions) {
          return actions.order.capture().then(() => {
            container.innerHTML = '<div class="paypal-fallback">Payment approved. Thank you.</div>';
          });
        },
        onError() {
          renderFallbackButton(container, plan);
        },
      })
      .render(plan.selector)
      .catch(() => renderFallbackButton(container, plan));
  });
}

window.addEventListener("load", () => {
  initializePayPalButtons();
  window.setTimeout(() => {
    pricingPlans.forEach((plan) => {
      const container = document.querySelector(plan.selector);
      if (container && !container.children.length) {
        renderFallbackButton(container, plan);
      }
    });
  }, 1800);
});

async function initShowroom() {
  const canvas = document.getElementById("showroom-canvas");
  const loader = document.getElementById("canvas-loader");
  const fallback = document.getElementById("canvas-fallback");

  if (!canvas || lowEndDevice) {
    loader?.remove();
    fallback?.classList.add("is-visible");
    return;
  }

  try {
    const THREE = await import("https://unpkg.com/three@0.160.0/build/three.module.js");

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070b, 0.038);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 2.2, 11);

    const group = new THREE.Group();
    scene.add(group);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0x8fc6ff, 2.4);
    key.position.set(4, 7, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const rim = new THREE.PointLight(0x147dff, 7, 24);
    rim.position.set(-4, 2, 4);
    scene.add(rim);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 18),
      new THREE.MeshStandardMaterial({
        color: 0x05070b,
        roughness: 0.48,
        metalness: 0.58,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.2;
    floor.receiveShadow = true;
    scene.add(floor);

    const blueMat = new THREE.MeshStandardMaterial({
      color: 0x0b65ff,
      emissive: 0x073b9d,
      emissiveIntensity: 0.95,
      roughness: 0.22,
      metalness: 0.65,
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.32,
      metalness: 0.72,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xdbeafe,
      roughness: 0.08,
      metalness: 0.12,
      transparent: true,
      opacity: 0.28,
      transmission: 0.25,
    });
    const lineMat = new THREE.LineBasicMaterial({ color: 0x42a5ff, transparent: true, opacity: 0.55 });

    function makeTextSprite(text, width = 420) {
      const canvas2d = document.createElement("canvas");
      canvas2d.width = width;
      canvas2d.height = 120;
      const ctx = canvas2d.getContext("2d");
      ctx.clearRect(0, 0, canvas2d.width, canvas2d.height);
      ctx.fillStyle = "rgba(5, 8, 15, 0.72)";
      ctx.fillRect(0, 0, canvas2d.width, canvas2d.height);
      ctx.strokeStyle = "rgba(66,165,255,0.65)";
      ctx.strokeRect(4, 4, canvas2d.width - 8, canvas2d.height - 8);
      ctx.fillStyle = "#f7f9ff";
      ctx.font = "700 32px Inter, Arial";
      ctx.fillText(text, 28, 72);
      const texture = new THREE.CanvasTexture(canvas2d);
      texture.colorSpace = THREE.SRGBColorSpace;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
      sprite.scale.set(2.5, 0.72, 1);
      return sprite;
    }

    function panel(label, x, y, z, w, h, depth = 0.12) {
      const root = new THREE.Group();
      root.position.set(x, y, z);
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, depth), darkMat);
      body.castShadow = true;
      body.receiveShadow = true;
      root.add(body);

      const face = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.92, h * 0.78), glassMat);
      face.position.z = depth / 2 + 0.006;
      root.add(face);

      for (let i = 0; i < 4; i += 1) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(w * (0.55 + i * 0.08), 0.045, 0.02), blueMat);
        bar.position.set(-w * 0.12, h * 0.22 - i * 0.18, depth / 2 + 0.045);
        root.add(bar);
      }

      const badge = makeTextSprite(label, 500);
      badge.position.set(0, -h * 0.58, depth / 2 + 0.08);
      root.add(badge);
      group.add(root);
      return root;
    }

    const website = panel("Website", -2.8, 0.4, 0, 3.4, 2.05);
    const pos = panel("POS Dashboard", 2.4, 0.7, -0.9, 3.0, 1.78);
    const mobile = panel("Mobile Store", 0.15, -0.75, 0.75, 1.05, 2.35, 0.16);
    const chatbot = panel("AI Receptionist", 3.4, -1.1, 0.6, 2.05, 1.28);
    const booking = panel("Bookings", -3.9, -1.25, 0.8, 1.9, 1.16);

    website.rotation.y = 0.35;
    pos.rotation.y = -0.34;
    mobile.rotation.y = 0.08;
    chatbot.rotation.y = -0.4;
    booking.rotation.y = 0.42;

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.9, 0.025, 12, 140),
      new THREE.MeshStandardMaterial({ color: 0x42a5ff, emissive: 0x147dff, emissiveIntensity: 1.2 })
    );
    ring.rotation.x = Math.PI / 2.25;
    ring.position.y = -0.35;
    group.add(ring);

    const points = [
      new THREE.Vector3(-2.8, 0.4, 0),
      new THREE.Vector3(0.15, -0.75, 0.75),
      new THREE.Vector3(2.4, 0.7, -0.9),
      new THREE.Vector3(3.4, -1.1, 0.6),
      new THREE.Vector3(-3.9, -1.25, 0.8),
      new THREE.Vector3(-2.8, 0.4, 0),
    ];
    const connection = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMat);
    group.add(connection);

    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 160;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 11;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({ color: 0x9bd0ff, size: 0.025, transparent: true, opacity: 0.72 })
    );
    group.add(particles);

    const mouse = { x: 0, y: 0 };
    window.addEventListener("pointermove", (event) => {
      mouse.x = (event.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (event.clientY / window.innerHeight - 0.5) * 2;
    });

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    loader?.remove();
    const clock = new THREE.Clock();
    let frameId = 0;

    function animate() {
      const t = clock.getElapsedTime();
      group.rotation.y = Math.sin(t * 0.22) * 0.08 + mouse.x * 0.08;
      group.rotation.x = mouse.y * 0.035;
      group.position.y = Math.sin(t * 0.6) * 0.08;
      [website, pos, mobile, chatbot, booking].forEach((item, index) => {
        item.position.y += Math.sin(t * 0.9 + index) * 0.0018;
      });
      ring.rotation.z += 0.002;
      particles.rotation.y += 0.0009;
      camera.position.x += (mouse.x * 0.45 - camera.position.x) * 0.03;
      camera.position.y += (2.2 + -mouse.y * 0.25 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    }

    animate();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(frameId);
      else animate();
    });
  } catch (error) {
    console.error("3D showroom failed to load", error);
    loader?.remove();
    fallback?.classList.add("is-visible");
  }
}

if ("requestIdleCallback" in window) {
  requestIdleCallback(initShowroom, { timeout: 1200 });
} else {
  window.addEventListener("load", initShowroom);
}

function initCookieNotice() {
  const banner = document.getElementById("cookie-banner");
  const acceptButton = document.getElementById("accept-cookies");
  if (!banner || !acceptButton) return;

  const consentKey = "bsd_cookie_consent";
  if (localStorage.getItem(consentKey) === "accepted") return;

  window.setTimeout(() => banner.classList.add("is-visible"), 700);
  acceptButton.addEventListener("click", () => {
    localStorage.setItem(consentKey, "accepted");
    banner.classList.remove("is-visible");
  });
}

initCookieNotice();

const root = document.documentElement;

function initImmersiveIntro() {
  const intro = document.getElementById("intro-sequence");
  const skip = document.getElementById("intro-skip");
  if (!intro || reducedMotion) {
    intro?.classList.add("is-hidden");
    return;
  }

  const seenKey = "bsd_intro_seen";
  const closeIntro = () => {
    intro.classList.add("is-hidden");
    localStorage.setItem(seenKey, "true");
  };

  if (localStorage.getItem(seenKey) === "true") {
    intro.classList.add("is-hidden");
    return;
  }

  skip?.addEventListener("click", closeIntro);
  window.setTimeout(closeIntro, 2600);
}

function initCustomCursor() {
  const cursor = document.getElementById("cursor-orb");
  const label = document.getElementById("cursor-label");
  if (!cursor || !label || lowEndDevice || window.matchMedia("(pointer: coarse)").matches) return;

  window.addEventListener("pointermove", (event) => {
    root.style.setProperty("--cursor-x", `${event.clientX}px`);
    root.style.setProperty("--cursor-y", `${event.clientY}px`);
  });

  document.querySelectorAll("a, button, .service-card, .project-frame, input, select, textarea").forEach((element) => {
    element.addEventListener("pointerenter", () => {
      cursor.classList.add("is-active");
      label.textContent = element.dataset.cursor || (element.matches(".project-frame") ? "VIEW" : "START");
    });
    element.addEventListener("pointerleave", () => {
      cursor.classList.remove("is-active");
      label.textContent = "";
    });
  });
}

function initScrollChoreography() {
  const update = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 0;
    root.style.setProperty("--scroll", progress.toFixed(2));
  };
  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

function initServiceModules() {
  const cards = [...document.querySelectorAll(".service-card")];
  const title = document.getElementById("service-orbit-title");
  const copy = document.getElementById("service-orbit-copy");
  if (!cards.length || !title || !copy) return;

  const activate = (card) => {
    cards.forEach((item) => item.classList.toggle("is-active", item === card));
    title.textContent = card.querySelector("h3")?.textContent || "Active Module";
    copy.textContent = card.dataset.service || card.querySelector("p")?.textContent || "";
  };

  cards.forEach((card) => {
    card.addEventListener("pointerenter", () => activate(card));
    card.addEventListener("focus", () => activate(card));
    card.addEventListener("click", () => activate(card));
  });
}

function initProjectExhibits() {
  const modal = document.getElementById("project-modal");
  const close = document.getElementById("modal-close");
  const modalImage = document.getElementById("modal-image");
  const modalType = document.getElementById("modal-type");
  const modalTitle = document.getElementById("modal-title");
  const modalCopy = document.getElementById("modal-copy");
  const modalLink = document.getElementById("modal-link");
  if (!modal || !modalImage || !modalType || !modalTitle || !modalCopy || !modalLink) return;

  document.querySelectorAll(".project-frame").forEach((project) => {
    project.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      modalImage.src = project.dataset.image || project.querySelector("img")?.src || "";
      modalImage.alt = `${project.dataset.title || "Project"} preview`;
      modalType.textContent = project.dataset.type || project.querySelector("span")?.textContent || "Project";
      modalTitle.textContent = project.dataset.title || project.querySelector("h3")?.textContent || "Project";
      modalCopy.textContent = project.dataset.copy || project.querySelector("p")?.textContent || "";
      const link = project.dataset.link;
      modalLink.hidden = !link;
      if (link) modalLink.href = link;
      modal.showModal();
    });
  });

  close?.addEventListener("click", () => modal.close());
  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.close();
  });
}

function initTransmission() {
  leadForm?.addEventListener("submit", () => {
    if (leadForm.checkValidity()) {
      leadForm.classList.add("is-transmitting");
      const panel = leadForm.querySelector(".transmission-panel small");
      if (panel) panel.textContent = "Brief transmitting to BSD";
    }
  });
}

function initLiveBackground() {
  const canvas = document.getElementById("live-background");
  if (!canvas || reducedMotion) return;

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;

  const density = lowEndDevice ? 42 : 90;
  const trails = lowEndDevice ? 4 : 9;
  const pointer = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.42 };
  const particles = Array.from({ length: density }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    z: Math.random() * 0.9 + 0.1,
    vx: (Math.random() - 0.5) * 0.25,
    vy: (Math.random() - 0.5) * 0.2,
  }));

  function resizeBackground() {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  window.addEventListener("resize", resizeBackground);
  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  }, { passive: true });

  resizeBackground();
  let frame = 0;

  function drawLiveBackground() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const time = performance.now() * 0.001;
    const scrollShift = Number.parseFloat(getComputedStyle(root).getPropertyValue("--scroll")) || 0;

    context.clearRect(0, 0, width, height);
    const bg = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, Math.max(width, height) * 0.72);
    bg.addColorStop(0, "rgba(20,125,255,0.16)");
    bg.addColorStop(0.35, "rgba(6,18,38,0.08)");
    bg.addColorStop(1, "rgba(2,4,9,0)");
    context.fillStyle = bg;
    context.fillRect(0, 0, width, height);

    context.save();
    context.globalCompositeOperation = "lighter";

    for (let i = 0; i < trails; i += 1) {
      const y = height * (0.16 + i * 0.095) + Math.sin(time * 0.7 + i) * 28 + scrollShift * 0.45;
      const startX = ((time * 54 * (i + 1)) % (width + 480)) - 360;
      const gradient = context.createLinearGradient(startX, y, startX + 360, y + 28);
      gradient.addColorStop(0, "rgba(20,125,255,0)");
      gradient.addColorStop(0.45, "rgba(20,125,255,0.18)");
      gradient.addColorStop(1, "rgba(247,249,255,0)");
      context.strokeStyle = gradient;
      context.lineWidth = i % 3 === 0 ? 1.6 : 0.8;
      context.beginPath();
      context.moveTo(startX, y);
      context.bezierCurveTo(startX + 100, y - 38, startX + 230, y + 46, startX + 420, y - 10);
      context.stroke();
    }

    particles.forEach((particle, index) => {
      const pullX = (pointer.x - width * 0.5) * 0.00005 * particle.z;
      const pullY = (pointer.y - height * 0.5) * 0.00004 * particle.z;
      particle.x += particle.vx + pullX;
      particle.y += particle.vy + pullY + Math.sin(time + index) * 0.02;

      if (particle.x < -20) particle.x = width + 20;
      if (particle.x > width + 20) particle.x = -20;
      if (particle.y < -20) particle.y = height + 20;
      if (particle.y > height + 20) particle.y = -20;

      const size = particle.z * 1.8;
      context.fillStyle = `rgba(95,180,255,${0.08 + particle.z * 0.28})`;
      context.beginPath();
      context.arc(particle.x, particle.y, size, 0, Math.PI * 2);
      context.fill();
    });

    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 9) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 118) {
          context.strokeStyle = `rgba(66,165,255,${(1 - distance / 118) * 0.09})`;
          context.lineWidth = 0.6;
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.stroke();
        }
      }
    }

    context.restore();
    frame = requestAnimationFrame(drawLiveBackground);
  }

  drawLiveBackground();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(frame);
    else drawLiveBackground();
  });
}

initImmersiveIntro();
initCustomCursor();
initScrollChoreography();
initServiceModules();
initProjectExhibits();
initTransmission();
initLiveBackground();
