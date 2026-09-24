const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== tab.dataset.tab;
    });
  });
});

const drawer = document.querySelector(".drawer");
const menuButton = document.querySelector(".menu-button");
function closeDrawer() {
  drawer.hidden = true;
  menuButton.setAttribute("aria-expanded", "false");
}
menuButton.addEventListener("click", () => {
  drawer.hidden = false;
  menuButton.setAttribute("aria-expanded", "true");
});
document.querySelector(".drawer-close").addEventListener("click", closeDrawer);
drawer.addEventListener("click", (event) => {
  if (event.target === drawer) closeDrawer();
});
drawer.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeDrawer));

const form = document.querySelector("#reservation");
const status = document.querySelector("#form-status");
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const payload = {
    name: String(data.get("name") || "").trim(),
    phone: String(data.get("phone") || "").trim(),
    guests: String(data.get("guests") || "").trim(),
    datetime: String(data.get("datetime") || "").trim(),
    notes: String(data.get("notes") || "").trim(),
  };
  if (!payload.name || !payload.phone || !payload.guests || !payload.datetime) {
    status.hidden = false;
    status.className = "error";
    status.textContent = "Uzupełnij imię, telefon, liczbę osób i datę.";
    return;
  }

  const submit = form.querySelector("button[type=submit]");
  submit.disabled = true;
  try {
    const response = await fetch("/rezerwacja", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    status.hidden = false;
    status.className = response.ok ? "ok" : "error";
    status.textContent = result.message || "Nie udało się wysłać prośby. Zadzwoń: 77 419 61 18.";
    if (response.ok && result.mailto) {
      window.location.href = result.mailto;
      form.reset();
    } else if (response.ok && result.sent) {
      form.reset();
    }
  } catch (error) {
    status.hidden = false;
    status.className = "error";
    status.textContent = "Nie udało się wysłać prośby. Zadzwoń: 77 419 61 18.";
  } finally {
    submit.disabled = false;
  }
});
