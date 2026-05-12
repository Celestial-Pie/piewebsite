const root = document.documentElement;
const themeToggle = document.querySelector("#themeToggle");
const menuToggle = document.querySelector("#menuToggle");
const navLinks = document.querySelector(".nav-links");
const searchInput = document.querySelector("#searchInput");
const tagButtons = Array.from(document.querySelectorAll("[data-filter]"));
const posts = Array.from(document.querySelectorAll(".post-card"));
const emptyState = document.querySelector("#emptyState");
const backTop = document.querySelector("#backTop");
const tocPercent = document.querySelector("#tocPercent");

const initClickFireworks = () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.className = "fireworks";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);

  const context = canvas.getContext("2d");
  const particles = [];
  const rings = [];
  const colors = ["#1f7ae0", "#1db7c8", "#f1b458", "#f58aaa", "#61d59a", "#ffffff"];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let animationFrame = 0;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const random = (min, max) => min + Math.random() * (max - min);

  const burst = (x, y) => {
    rings.push({ x, y, radius: 6, life: 1 });

    for (let index = 0; index < 30; index += 1) {
      const angle = (Math.PI * 2 * index) / 30 + random(-0.12, 0.12);
      const speed = random(2.2, 6.2);

      particles.push({
        x,
        y,
        previousX: x,
        previousY: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: random(1.5, 3.4),
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        decay: random(0.018, 0.032),
        gravity: random(0.025, 0.08),
      });
    }

    if (!animationFrame) {
      animationFrame = requestAnimationFrame(draw);
    }
  };

  const draw = () => {
    context.clearRect(0, 0, width, height);

    for (let index = rings.length - 1; index >= 0; index -= 1) {
      const ring = rings[index];
      ring.radius += 1.8;
      ring.life -= 0.045;

      context.save();
      context.globalAlpha = Math.max(ring.life, 0);
      context.strokeStyle = "#8fc3ff";
      context.lineWidth = 2;
      context.beginPath();
      context.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      context.stroke();
      context.restore();

      if (ring.life <= 0) {
        rings.splice(index, 1);
      }
    }

    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.previousX = particle.x;
      particle.previousY = particle.y;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.96;
      particle.vy = particle.vy * 0.96 + particle.gravity;
      particle.life -= particle.decay;

      context.save();
      context.globalAlpha = Math.max(particle.life, 0);
      context.strokeStyle = particle.color;
      context.lineWidth = particle.size;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(particle.previousX, particle.previousY);
      context.lineTo(particle.x, particle.y);
      context.stroke();
      context.restore();

      if (particle.life <= 0) {
        particles.splice(index, 1);
      }
    }

    if (particles.length || rings.length) {
      animationFrame = requestAnimationFrame(draw);
      return;
    }

    animationFrame = 0;
  };

  window.addEventListener("resize", resize);
  window.addEventListener("pointerdown", (event) => {
    if (event.button && event.button !== 0) {
      return;
    }

    burst(event.clientX, event.clientY);
  });

  resize();
};

const savedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

root.dataset.theme = savedTheme || (prefersDark ? "dark" : "light");

const setThemeIconLabel = () => {
  const dark = root.dataset.theme === "dark";
  themeToggle.setAttribute("aria-label", dark ? "切换到浅色主题" : "切换到深色主题");
  themeToggle.dataset.tooltip = dark ? "浅色主题" : "深色主题";
  themeToggle.title = themeToggle.dataset.tooltip;
};

setThemeIconLabel();

themeToggle.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", root.dataset.theme);
  setThemeIconLabel();
});

menuToggle?.addEventListener("click", () => {
  const open = navLinks?.classList.toggle("is-open");
  menuToggle.setAttribute("aria-label", open ? "关闭导航" : "打开导航");
});

navLinks?.addEventListener("click", (event) => {
  const link = event.target.closest("a");

  if (!link) {
    return;
  }

  document.querySelector(".nav-links .is-active")?.classList.remove("is-active");
  link.classList.add("is-active");
  navLinks.classList.remove("is-open");
  menuToggle?.setAttribute("aria-label", "打开导航");
});

let activeFilter = "all";

const normalize = (value) => value.trim().toLowerCase();

const renderPosts = () => {
  if (!searchInput || posts.length === 0) {
    return;
  }

  const query = normalize(searchInput.value);
  let visibleCount = 0;

  posts.forEach((post) => {
    const title = normalize(post.dataset.title || "");
    const tags = normalize(post.dataset.tags || "");
    const text = normalize(post.textContent || "");
    const matchTag = activeFilter === "all" || tags.includes(activeFilter);
    const matchQuery = !query || title.includes(query) || tags.includes(query) || text.includes(query);
    const visible = matchTag && matchQuery;

    post.hidden = !visible;
    visibleCount += visible ? 1 : 0;
  });

  emptyState?.classList.toggle("is-visible", visibleCount === 0);
};

tagButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    tagButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderPosts();
  });
});

searchInput?.addEventListener("input", renderPosts);

window.addEventListener("scroll", () => {
  backTop?.classList.toggle("is-visible", window.scrollY > 420);

  if (tocPercent) {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.round((window.scrollY / scrollable) * 100) : 0;
    tocPercent.textContent = `${Math.min(100, Math.max(0, progress))}%`;
  }
});

backTop?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

initClickFireworks();
