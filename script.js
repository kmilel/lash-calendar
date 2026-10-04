// ================== ДАННЫЕ ==================

// Загружаем записи из localStorage или создаём пустые
let bookings = JSON.parse(localStorage.getItem('bookings')) || {
    left: {},
    right: {}
};

// Недоступные даты (затемнённые)
let disabledDates = JSON.parse(localStorage.getItem('disabledDates')) || {
    left: [],
    right: []
};

// Текущий отображаемый месяц для каждого календаря
let currentDate = {
    left: { year: new Date().getFullYear(), month: new Date().getMonth() },
    right: { year: new Date().getFullYear(), month: new Date().getMonth() }
};

const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

// ================== СОХРАНЕНИЕ ==================

function saveData() {
    localStorage.setItem('bookings', JSON.stringify(bookings));
    localStorage.setItem('disabledDates', JSON.stringify(disabledDates));
}

// ================== КАЛЕНДАРЬ ==================

function renderCalendar(side) {
    const container = document.getElementById(`calendar-${side}`);
    const { year, month } = currentDate[side];

    container.innerHTML = "";

    // Заголовок с месяцем
    document.getElementById(`month-${side}`).textContent = `${monthNames[month]} ${year}`;

    // Дни недели
    const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    weekdays.forEach(day => {
        const el = document.createElement("div");
        el.classList.add("weekday");
        el.textContent = day;
        container.appendChild(el);
    });

    const firstDay = new Date(year, month, 1);
    let startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    // Пустые ячейки до первого дня
    for (let i = 0; i < startOffset; i++) {
        container.appendChild(document.createElement("div"));
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Сегодняшняя дата (для подсветки)
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const cell = document.createElement("div");
        cell.classList.add("day");
        cell.dataset.date = dateStr;
        cell.dataset.side = side;

        // Подсвечиваем сегодняшний день
        if (dateStr === todayStr) {
            cell.classList.add("today");
        }

        if (disabledDates[side].includes(dateStr)) {
            cell.classList.add("disabled");
        } else {
            const dayBookings = bookings[side][dateStr] || [];

            if (dayBookings.length > 0) {
                cell.classList.add("booked");

                // Группируем записи по времени
                const grouped = {};
                dayBookings.forEach(b => {
                    if (!grouped[b.time]) grouped[b.time] = 0;
                    grouped[b.time]++;
                });

                // Формируем список строк «18:00 ×2»
                const timesHtml = Object.entries(grouped)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([time, count]) => {
                        return `<div class="cell-time">${time}${count > 1 ? ` ×${count}` : ""}</div>`;
                    })
                    .join("");

                cell.innerHTML = `
                    <div class="cell-day">${day}</div>
                    <div class="cell-times">${timesHtml}</div>
                `;
            } else {
                cell.innerHTML = `<div class="cell-day">${day}</div>`;
            }

            cell.addEventListener("click", () => openModal(dateStr, side));
        }

        container.appendChild(cell);
    }
}

// ================== МОДАЛЬНОЕ ОКНО ==================

let selectedDate = null;
let selectedSide = null;

function openModal(dateStr, side) {
    selectedDate = dateStr;
    selectedSide = side;
    document.getElementById("modal-date").textContent = dateStr;

    renderBookingsList();

    document.getElementById("client-form").classList.add("hidden");
    document.getElementById("add-booking-btn").classList.remove("hidden");

    document.getElementById("modal").classList.add("active");
}

function renderBookingsList() {
    const list = document.getElementById("booking-list");
    list.innerHTML = "";

    const dayBookings = bookings[selectedSide][selectedDate] || [];

    if (dayBookings.length === 0) {
        list.innerHTML = '<div class="no-bookings">Пока никого нет</div>';
        return;
    }

    // Сортируем по времени
    dayBookings.sort((a, b) => a.time.localeCompare(b.time));

    dayBookings.forEach((b, index) => {
        const item = document.createElement("div");
        item.classList.add("booking-item");
        item.innerHTML = `
            <button class="delete-btn" data-index="${index}">✕</button>
            <div><span class="time">${b.time}</span> — <span class="name">${b.name}</span></div>
            ${b.phone ? `<div class="phone">${b.phone}</div>` : ""}
            ${b.note ? `<div class="note">${b.note}</div>` : ""}
        `;
        list.appendChild(item);
    });

    // Обработчики удаления
    list.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            deleteBooking(index);
        });
    });
}

function deleteBooking(index) {
    if (!confirm("Удалить эту запись?")) return;

    bookings[selectedSide][selectedDate].splice(index, 1);

    // Если записей не осталось — удаляем ключ
    if (bookings[selectedSide][selectedDate].length === 0) {
        delete bookings[selectedSide][selectedDate];
    }

    saveData();
    renderBookingsList();
    renderCalendar("left");
    renderCalendar("right");
}

// Закрытие модалки
document.getElementById("close-modal").addEventListener("click", () => {
    document.getElementById("modal").classList.remove("active");
});

document.getElementById("modal").addEventListener("click", (e) => {
    if (e.target.id === "modal") {
        document.getElementById("modal").classList.remove("active");
    }
});

// ================== ФОРМА ==================

document.getElementById("add-booking-btn").addEventListener("click", () => {
    document.getElementById("client-form").classList.remove("hidden");
    document.getElementById("add-booking-btn").classList.add("hidden");
    document.getElementById("client-form").reset();
});

document.getElementById("cancel-form").addEventListener("click", () => {
    document.getElementById("client-form").classList.add("hidden");
    document.getElementById("add-booking-btn").classList.remove("hidden");
});

document.getElementById("client-form").addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("client-name").value;
    const phone = document.getElementById("client-phone").value;
    const time = document.getElementById("client-time").value;
    const note = document.getElementById("client-note").value;

    if (!bookings[selectedSide][selectedDate]) {
        bookings[selectedSide][selectedDate] = [];
    }

    bookings[selectedSide][selectedDate].push({ name, phone, time, note });
    
    fetch('https://lash-bot.rizhukrr.workers.dev/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: name,
        phone: phone,
        time: time,
        date: selectedDate
        })
    })
    .then(r => r.json())
    .then(d => console.log('Уведомление отправлено:', d))
    .catch(e => console.error('Ошибка отправки:', e));

    saveData();
    renderBookingsList();
    renderCalendar("left");
    renderCalendar("right");

    document.getElementById("client-form").classList.add("hidden");
    document.getElementById("add-booking-btn").classList.remove("hidden");
    document.getElementById("client-form").reset();
});

// ================== НАВИГАЦИЯ ПО МЕСЯЦАМ ==================

function changeMonth(side, delta) {
    currentDate[side].month += delta;
    if (currentDate[side].month > 11) {
        currentDate[side].month = 0;
        currentDate[side].year++;
    } else if (currentDate[side].month < 0) {
        currentDate[side].month = 11;
        currentDate[side].year--;
    }
    renderCalendar(side);
}

document.getElementById("prev-left").addEventListener("click", () => changeMonth("left", -1));
document.getElementById("next-left").addEventListener("click", () => changeMonth("left", 1));
document.getElementById("prev-right").addEventListener("click", () => changeMonth("right", -1));
document.getElementById("next-right").addEventListener("click", () => changeMonth("right", 1));

// ================== ЗАПУСК ==================

renderCalendar("left");
renderCalendar("right");
