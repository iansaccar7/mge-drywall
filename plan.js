// Prancheta de forro: arrastar desenha linhas de luz retas na grade de 50 cm e soma os metros.
(() => {
  const plan = document.querySelector("[data-plan]");
  if (!plan) return;
  const NS = "http://www.w3.org/2000/svg";
  const svg = plan.querySelector("svg");
  const group = svg.querySelector(".plan-lines");
  const ghost = svg.querySelector(".plan-ghost");
  const meter = document.querySelector("[data-plan-meter]");
  const send = document.querySelector("[data-plan-send]");
  const sanca = document.querySelector("[data-plan-sanca]");
  const phone = "5511951043341";
  const grid = 50; // 50 cm na escala de 100 unidades por metro
  const lines = [];
  let start = null;

  const snap = (v, max) => Math.min(max - 30, Math.max(30, Math.round(v / grid) * grid));
  function point(event) {
    const p = svg.createSVGPoint();
    p.x = event.clientX;
    p.y = event.clientY;
    const local = p.matrixTransform(svg.getScreenCTM().inverse());
    return { x: snap(local.x, 500), y: snap(local.y, 400) };
  }
  // Perfil de LED é reto: a linha segue o eixo em que o dedo andou mais.
  function straight(a, b) {
    return Math.abs(b.x - a.x) >= Math.abs(b.y - a.y) ? { x: b.x, y: a.y } : { x: a.x, y: b.y };
  }
  function set(line, a, b) {
    line.setAttribute("x1", a.x);
    line.setAttribute("y1", a.y);
    line.setAttribute("x2", b.x);
    line.setAttribute("y2", b.y);
  }
  function update() {
    const metros = lines.reduce((sum, l) => sum + l.length, 0) / 100 + (sanca.checked ? 15.6 : 0);
    const texto = metros.toFixed(1).replace(".", ",");
    meter.textContent = `${texto} m de luz`;
    const partes = [];
    if (lines.length) partes.push(`${lines.length} ${lines.length === 1 ? "linha" : "linhas"} de luz`);
    if (sanca.checked) partes.push("sanca iluminada no contorno");
    const mensagem = partes.length
      ? `Olá! Desenhei no site um forro com ${partes.join(" e ")}, cerca de ${texto} m de LED. Gostaria de um orçamento.`
      : "Olá! Gostaria de um orçamento de forro com LED.";
    send.href = `https://wa.me/${phone}?text=${encodeURIComponent(mensagem)}`;
  }
  function add(a, b) {
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length < grid || lines.length >= 14) return;
    const g = document.createElementNS(NS, "g");
    g.classList.add("fresh");
    for (const cls of ["halo", "core"]) {
      const line = document.createElementNS(NS, "line");
      line.classList.add(cls);
      if (cls === "halo") line.setAttribute("filter", "url(#brilho)");
      set(line, a, b);
      g.append(line);
    }
    group.append(g);
    lines.push({ g, length });
    update();
  }

  plan.addEventListener("pointerdown", (event) => {
    plan.setPointerCapture(event.pointerId);
    start = point(event);
    set(ghost, start, start);
  });
  plan.addEventListener("pointermove", (event) => {
    if (start) set(ghost, start, straight(start, point(event)));
  });
  const finish = (event) => {
    if (!start) return;
    add(start, straight(start, point(event)));
    start = null;
    set(ghost, { x: 0, y: 0 }, { x: 0, y: 0 });
  };
  plan.addEventListener("pointerup", finish);
  plan.addEventListener("pointercancel", () => {
    start = null;
    set(ghost, { x: 0, y: 0 }, { x: 0, y: 0 });
  });
  document.querySelector("[data-plan-clear]").addEventListener("click", () => {
    lines.splice(0).forEach((l) => l.g.remove());
    update();
  });
  sanca.addEventListener("change", () => {
    plan.classList.toggle("has-sanca", sanca.checked);
    update();
  });

  // Ao abrir, a primeira linha aparece sozinha para mostrar como funciona.
  const demo = () => {
    add({ x: 100, y: 150 }, { x: 400, y: 150 });
    setTimeout(() => add({ x: 100, y: 250 }, { x: 400, y: 250 }), 450);
  };
  if (document.documentElement.dataset.motion === "enabled") setTimeout(demo, 900);
  else demo();
  update();
})();
