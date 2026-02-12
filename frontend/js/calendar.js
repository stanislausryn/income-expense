function generateCalendar(year, month, onSelectDate, containerId = "calendar") {
  const calendarEl = document.getElementById(containerId);
  if (!calendarEl) return;
  calendarEl.innerHTML = "";

  const daysHeader = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  daysHeader.forEach((d) => {
    const head = document.createElement("div");
    head.classList.add("day-header");
    head.textContent = d;
    calendarEl.appendChild(head);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.classList.add("day-empty");
    calendarEl.appendChild(empty);
  }

  for (let day = 1; day <= totalDays; day++) {
    const div = document.createElement("div");
    div.classList.add("day");
    div.textContent = day;

    div.addEventListener("click", () => {
      document.querySelectorAll(`#${containerId} .day`).forEach((d) => d.classList.remove("active"));
      div.classList.add("active");

      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      onSelectDate(dateStr);
    });

    calendarEl.appendChild(div);
  }
}

function setupCalendarPicker(triggerId, hiddenInputId) {
  const trigger = document.getElementById(triggerId);
  if (!trigger) return;

  let modal = document.getElementById("calendarModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "calendarModal";
    modal.style.cssText = `
            position: fixed; inset: 0; background: rgba(0,0,0,0.5); 
            display: none; align-items: center; justify-content: center; z-index: 100;
        `;
    modal.innerHTML = `
            <div class="card" style="width: 320px; padding: 20px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <select id="pickerMonth" style="width:120px;"></select>
                    <select id="pickerYear" style="width:80px;"></select>
                </div>
                <div id="pickerCalendar" class="calendar"></div>
                <button id="closePicker" class="btn-small" style="margin-top:10px; width:100%;">Close</button>
            </div>
        `;
    document.body.appendChild(modal);

    const ms = document.getElementById("pickerMonth");
    const ys = document.getElementById("pickerYear");
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    months.forEach((m, i) => {
      const opt = document.createElement("option");
      opt.value = i; opt.textContent = m; ms.appendChild(opt);
    });

    const cy = new Date().getFullYear();
    for (let y = cy - 5; y <= cy + 5; y++) {
      const opt = document.createElement("option");
      opt.value = y; opt.textContent = y; ys.appendChild(opt);
    }

    const refresh = (cb) => {
      generateCalendar(parseInt(ys.value), parseInt(ms.value), (date) => {
        cb(date);
      }, "pickerCalendar");
    };

    modal.refreshFn = refresh;

    document.getElementById("closePicker").addEventListener("click", () => {
      modal.style.display = "none";
    });

    ms.addEventListener("change", () => modal.refreshFn(modal.onSelect));
    ys.addEventListener("change", () => modal.refreshFn(modal.onSelect));
  }

  trigger.addEventListener("click", () => {
    modal.style.display = "flex";

    modal.onSelect = (dateStr) => {
      document.getElementById(hiddenInputId).value = dateStr;
      trigger.textContent = formatDate(dateStr);
    };

    const now = new Date();
    document.getElementById("pickerMonth").value = now.getMonth();
    document.getElementById("pickerYear").value = now.getFullYear();

    modal.refreshFn(modal.onSelect);
  });
}
