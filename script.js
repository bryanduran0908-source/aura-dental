// Número de WhatsApp de la clínica: código de país + número, solo dígitos
const CLINIC_WHATSAPP = "56971389276";

const WEEKDAY_TIMES = ["9:00", "10:00", "11:00", "12:00", "15:00", "16:00", "17:00", "18:00"];
const SATURDAY_TIMES = ["9:00", "10:00", "11:00", "12:00", "13:00"];
const DAYS_SHOWN = 12;

const daysEl = document.getElementById("days");
const timesEl = document.getElementById("times");
const nameEl = document.getElementById("name");
const reasonEl = document.getElementById("reason");
const summaryEl = document.getElementById("summary");
const errorEl = document.getElementById("error");
const noteEl = document.getElementById("note");
const cta = document.getElementById("cta");

const state = { day: null, time: null };

const fmt = (d, opts) => d.toLocaleDateString("es-CL", opts);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

document.getElementById("year").textContent = new Date().getFullYear();

// Horas de un día; si es hoy, solo las que quedan con al menos una hora de margen
function timesFor(date) {
  const list = date.getDay() === 6 ? SATURDAY_TIMES : WEEKDAY_TIMES;
  const now = new Date();
  if (date.toDateString() !== now.toDateString()) return list;
  return list.filter((t) => Number(t.split(":")[0]) > now.getHours() + 1);
}

// Próximos días hábiles (sin domingos ni días sin horas libres)
function upcomingDays() {
  const days = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (days.length < DAYS_SHOWN) {
    if (d.getDay() !== 0 && timesFor(d).length) days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function pressOnly(container, btn) {
  container.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
}

function renderDays() {
  upcomingDays().forEach((date) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "day";
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", fmt(date, { weekday: "long", day: "numeric", month: "long" }));
    btn.innerHTML =
      `<span class="day__wd">${cap(fmt(date, { weekday: "short" }).replace(".", ""))}</span>` +
      `<span class="day__n">${date.getDate()}</span>` +
      `<span class="day__m">${fmt(date, { month: "short" }).replace(".", "")}</span>`;
    btn.addEventListener("click", () => {
      pressOnly(daysEl, btn);
      state.day = date;
      state.time = null;
      renderTimes();
      update();
    });
    daysEl.appendChild(btn);
  });
}

function renderTimes() {
  timesEl.innerHTML = "";
  if (!state.day) {
    timesEl.innerHTML = '<p class="times__hint">Primero elige un día.</p>';
    return;
  }
  timesFor(state.day).forEach((time) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "time";
    btn.textContent = time;
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", () => {
      pressOnly(timesEl, btn);
      state.time = time;
      update();
    });
    timesEl.appendChild(btn);
  });
}

function dayText() {
  return fmt(state.day, { weekday: "long", day: "numeric", month: "long" });
}

// Mantiene el resumen de la tarjeta y el enlace de WhatsApp al día con lo elegido
function update() {
  errorEl.textContent = "";
  noteEl.classList.remove("is-sent");
  noteEl.textContent = "Se abre WhatsApp con tu solicitud escrita. Solo tienes que enviarla.";

  if (!state.day) {
    summaryEl.textContent = "Elige un día";
  } else if (!state.time) {
    summaryEl.textContent = `${cap(dayText())}, elige una hora`;
  } else {
    summaryEl.textContent = `${cap(dayText())}, ${state.time} h`;
  }
  summaryEl.classList.toggle("is-set", Boolean(state.day && state.time));

  const lines = ["Hola, Aura Dental. Quiero pedir una hora:", ""];
  if (nameEl.value.trim()) lines.push(`Nombre: ${nameEl.value.trim()}`);
  if (reasonEl.value) lines.push(`Motivo: ${reasonEl.value}`);
  if (state.day) lines.push(`Día: ${dayText()}`);
  if (state.time) lines.push(`Hora: ${state.time}`);
  cta.href = `https://wa.me/${CLINIC_WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function missing() {
  if (!state.day) return "Elige el día de tu hora.";
  if (!state.time) return "Elige la hora que te acomoda.";
  if (!nameEl.value.trim()) return "Escribe tu nombre para que sepamos a quién confirmar.";
  if (!reasonEl.value) return "Elige el motivo de tu visita.";
  return "";
}

[nameEl, reasonEl].forEach((el) =>
  el.addEventListener("input", () => {
    el.classList.remove("is-invalid");
    update();
  })
);

cta.addEventListener("click", (e) => {
  const problem = missing();
  if (problem) {
    e.preventDefault();
    errorEl.textContent = problem;
    nameEl.classList.toggle("is-invalid", !nameEl.value.trim() && Boolean(state.time));
    reasonEl.classList.toggle("is-invalid", !reasonEl.value && Boolean(nameEl.value.trim()));
    return;
  }
  noteEl.classList.add("is-sent");
  noteEl.textContent = "Listo. Envía el mensaje en WhatsApp y te confirmamos tu hora.";
});

document.getElementById("booking").addEventListener("submit", (e) => e.preventDefault());

renderDays();
renderTimes();
update();
