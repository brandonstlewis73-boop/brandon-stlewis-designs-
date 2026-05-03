const projectData = {
  logo: {
    category: "Logo Design",
    title: "Northline Atelier",
    description:
      "A luxury identity direction built for a boutique interior styling brand, combining editorial typography, premium spacing, and polished presentation mockups.",
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80",
    alt: "Northline Atelier brand identity moodboard and presentation",
  },
  social: {
    category: "Social Media Branding",
    title: "Pulse House Fitness",
    description:
      "A launch-ready set of social visuals designed to keep the brand energetic, consistent, and premium across campaigns, promotions, and story content.",
    image:
      "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&w=1400&q=80",
    alt: "Pulse House Fitness social campaign visuals on mobile screens",
  },
  print: {
    category: "Business Cards / Print",
    title: "Oak & Ember Legal",
    description:
      "A refined stationery system created to make a legal brand feel elevated and trustworthy, with premium print applications and strong visual restraint.",
    image:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1400&q=80",
    alt: "Oak and Ember Legal print collateral and business card photography",
  },
  ui: {
    category: "Website UI Mockups",
    title: "Halo Commerce",
    description:
      "A clean digital storefront concept balancing bold imagery, structured copy, and modern product storytelling to create a conversion-ready brand presence.",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80",
    alt: "Halo Commerce website interface displayed on a large monitor",
  },
};

const pricingPlans = [
  { selector: "#paypal-starter", value: "95.00", name: "Starter Package" },
  { selector: "#paypal-brand", value: "275.00", name: "Brand Identity" },
  { selector: "#paypal-premium", value: "650.00", name: "Premium Package" },
];

const revealElements = document.querySelectorAll(".reveal");
const navbar = document.querySelector(".navbar");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const portfolioCards = document.querySelectorAll(".portfolio-card");
const modal = document.getElementById("project-modal");
const modalTitle = document.getElementById("modal-title");
const modalCategory = document.getElementById("modal-category");
const modalDescription = document.getElementById("modal-description");
const modalImage = document.getElementById("modal-image");
const closeModalTriggers = document.querySelectorAll("[data-close-modal]");
const contactForm = document.querySelector(".contact-form");
const cursorDot = document.querySelector(".cursor-dot");
const heroArt = document.getElementById("hero-art");
const heroShape = document.getElementById("hero-shape");

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

revealElements.forEach((element) => revealObserver.observe(element));

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    navbar.classList.toggle("is-open", !isExpanded);
  });
}

navLinks?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navbar.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

function openModal(projectKey) {
  const project = projectData[projectKey];
  if (!project) return;

  modalCategory.textContent = project.category;
  modalTitle.textContent = project.title;
  modalDescription.textContent = project.description;
  modalImage.src = project.image;
  modalImage.alt = project.alt;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

portfolioCards.forEach((card) => {
  const open = () => openModal(card.dataset.project);
  card.addEventListener("click", open);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  });
});

closeModalTriggers.forEach((trigger) => {
  trigger.addEventListener("click", closeModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("is-open")) {
    closeModal();
  }
});

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const submitButton = contactForm.querySelector('button[type="submit"]');
    submitButton.textContent = "Inquiry Sent";
    submitButton.disabled = true;
  });
}

function renderFallbackButton(container, plan) {
  container.innerHTML = "";
  const fallback = document.createElement("a");
  fallback.className = "paypal-fallback";
  fallback.href = "#contact";
  fallback.textContent = `Connect PayPal Client ID to enable ${plan.name}`;
  container.appendChild(fallback);
}

function initializePayPalButtons() {
  pricingPlans.forEach((plan) => {
    const container = document.querySelector(plan.selector);
    if (!container) return;

    if (!window.paypal || !window.paypal.Buttons) {
      renderFallbackButton(container, plan);
      return;
    }

    window.paypal
      .Buttons({
        style: {
          shape: "pill",
          color: "gold",
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

if (cursorDot && window.matchMedia("(pointer:fine)").matches) {
  document.addEventListener("mousemove", (event) => {
    cursorDot.style.opacity = "1";
    cursorDot.style.transform = `translate(${event.clientX - 9}px, ${event.clientY - 9}px)`;
  });

  document.querySelectorAll("a, button, .portfolio-card").forEach((target) => {
    target.addEventListener("mouseenter", () => {
      cursorDot.style.width = "34px";
      cursorDot.style.height = "34px";
    });
    target.addEventListener("mouseleave", () => {
      cursorDot.style.width = "18px";
      cursorDot.style.height = "18px";
    });
  });
}

if (heroArt && heroShape) {
  heroArt.addEventListener("mousemove", (event) => {
    const rect = heroArt.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    heroShape.style.transform = `translate(${x * 26}px, ${y * 20}px) rotate(${x * 18}deg)`;
  });

  heroArt.addEventListener("mouseleave", () => {
    heroShape.style.transform = "";
  });
}

window.addEventListener("load", () => {
  initializePayPalButtons();

  setTimeout(() => {
    pricingPlans.forEach((plan) => {
      const container = document.querySelector(plan.selector);
      if (container && !container.children.length) {
        renderFallbackButton(container, plan);
      }
    });
  }, 1600);
});
