(() => {
  const root = document.documentElement;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const heading = document.querySelector("h1");
  if (heading) {
    heading.innerHTML = heading.innerHTML
      .split(/<br\s*\/?\s*>/i)
      .map((line) => `<span class="hero-line"><span>${line}</span></span>`)
      .join("");
  }
  const reveal = [
    ...document.querySelectorAll(
      ".section-head, .quotes blockquote, .gallery-grid figure, .step, .faq-list article, .service, .service-featured, .garden-strip .photo, .comparison-cover figure, .studio-photo",
    ),
  ];
  reveal.forEach((el, i) => {
    el.dataset.reveal = el.matches("figure, .photo") ? "image" : "text";
    el.style.setProperty("--reveal-delay", `${el.matches(".step") ? (i % 3) * 90 : 0}ms`);
  });
  let observer;
  const gallery = document.querySelector("body.mge #galeria");
  const track = gallery?.querySelector(".gallery-grid");
  let scheduled = false;
  function updateScroll() {
    scheduled = false;
    if (root.dataset.motion !== "enabled") return;
    if (track) {
      const wide = innerWidth > 760;
      const rect = gallery.getBoundingClientRect();
      const distance = Math.max(1, gallery.offsetHeight - innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / distance));
      const travel = Math.max(0, track.scrollWidth - track.parentElement.clientWidth);
      track.style.transform = wide ? `translate3d(${-progress * travel}px,0,0)` : "";
    }
    document.querySelectorAll(".steps-grid").forEach((grid) => {
      const rect = grid.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (innerHeight * 0.7 - rect.top) / rect.height));
      grid.style.setProperty("--step-progress", progress);
    });
  }
  function requestUpdate() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updateScroll);
    }
  }
  function initialize() {
    observer?.disconnect();
    if (preference.matches || !("IntersectionObserver" in window)) {
      root.dataset.motion = "reduced";
      reveal.forEach((el) => el.classList.add("is-visible"));
      if (track) track.style.transform = "";
      return;
    }
    root.dataset.motion = "enabled";
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -35px 0px" },
    );
    reveal.forEach((el) => observer.observe(el));
    updateScroll();
  }
  initialize();
  preference.addEventListener("change", initialize);
  addEventListener("scroll", requestUpdate, { passive: true });
  addEventListener("resize", requestUpdate);
  // Anchor navigation and keyboard focus must never land on hidden content.
  addEventListener("focusin", (event) =>
    event.target.closest("[data-reveal]")?.classList.add("is-visible"),
  );
})();

// Efeitos de luz: cursor, avaliações acendendo e botões magnéticos.
(() => {
  if (document.documentElement.dataset.motion !== "enabled") return;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Avaliações: cada palavra acende conforme o trecho sobe na tela.
  const quotes = [...document.querySelectorAll(".quotes blockquote p")].map((p) => {
    p.innerHTML = p.textContent
      .trim()
      .split(/\s+/)
      .map((word) => `<span class="w">${word}</span>`)
      .join(" ");
    return { p, words: [...p.querySelectorAll(".w")] };
  });
  let pending = false;
  function light() {
    pending = false;
    for (const { p, words } of quotes) {
      const rect = p.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (innerHeight * 0.9 - rect.top) / (innerHeight * 0.45)));
      const lit = Math.round(progress * words.length);
      words.forEach((w, i) => w.classList.toggle("lit", i < lit));
    }
  }
  addEventListener("scroll", () => {
    if (!pending) {
      pending = true;
      requestAnimationFrame(light);
    }
  }, { passive: true });
  light();

  if (!fine) return;

  // Luz no cursor, com atraso suave.
  const lamp = document.createElement("div");
  lamp.className = "cursor-light";
  lamp.setAttribute("aria-hidden", "true");
  document.body.append(lamp);
  const target = { x: innerWidth / 2, y: innerHeight / 3 };
  const pos = { ...target };
  let moving = false;
  function follow() {
    pos.x += (target.x - pos.x) * 0.12;
    pos.y += (target.y - pos.y) * 0.12;
    lamp.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    moving = Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > 0.5;
    if (moving) requestAnimationFrame(follow);
  }
  addEventListener("pointermove", (event) => {
    target.x = event.clientX;
    target.y = event.clientY;
    lamp.classList.add("on");
    if (!moving) {
      moving = true;
      requestAnimationFrame(follow);
    }
  }, { passive: true });
  document.addEventListener("pointerleave", () => lamp.classList.remove("on"));

  // Botões magnéticos: puxam até 10px na direção do mouse.
  document.querySelectorAll(".button, .top-cta").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const box = button.getBoundingClientRect();
      const dx = (event.clientX - (box.left + box.width / 2)) / (box.width / 2);
      const dy = (event.clientY - (box.top + box.height / 2)) / (box.height / 2);
      button.style.transform = `translate(${dx * 10}px, ${dy * 6}px)`;
    });
    button.addEventListener("pointerleave", () => {
      button.style.transform = "";
    });
  });
})();
