import { Calendar } from "@fullcalendar/core";
import LocaleEs from "@fullcalendar/core/locales/es";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import EventManager from "../../controller/scripts/EventManager";
import listPlugin from "@fullcalendar/list";
import "@dile/dile-modal/dile-modal";
import "./style.css";

const container = document.querySelector(".calendar-container");
const eventModal = document.querySelector("#event-modal");
const form = eventModal.querySelector("form");
let selectedInfo = null;
let selectedEvent = null;

const eventManager = new EventManager();

console.log("Eventos actuales:", eventManager.getEvents());

let isEditMode = false;

const handleOnSelect = (info) => {
  console.log("selected " + info.startStr + " to " + info.endStr);
  selectedInfo = info;
  isEditMode = false;
  openModal();
};

const handleOnClickEvent = (data) => {
  selectedEvent = data.event;
  isEditMode = true;
  openModal();
};

const openModal = () => {
  if (isEditMode && selectedEvent) {
    // Modo edición
    form.querySelector('[name="area"]').value =
      selectedEvent.extendedProps.area;
    form.querySelector('[name="title"]').value = selectedEvent.title;
    form.querySelector('[name="description"]').value =
      selectedEvent.extendedProps.description;
    form.querySelector('[name="vinculo"]').value =
      selectedEvent.extendedProps.vinculo;

    const btnsContainer = eventModal.querySelector(
      ".btns-container, .btns-container2"
    );
    if (btnsContainer) {
      btnsContainer.classList.remove("btns-container2");
      btnsContainer.classList.add("btns-container");
    }
    eventModal.querySelector(".delete-event-btn").classList.remove("d-none");
    eventModal.querySelector("button[type='submit']").innerHTML = "Editar";
  } else {
    // Modo registro
    form.reset();
    const btnsContainer = eventModal.querySelector(
      ".btns-container, .btns-container2"
    );
    if (btnsContainer) {
      btnsContainer.classList.remove("btns-container");
      btnsContainer.classList.add("btns-container2");
    }
    eventModal.querySelector(".delete-event-btn").classList.add("d-none");
    eventModal.querySelector("button[type='submit']").innerHTML = "Registrar";
  }

  eventModal.open();
};

const handleOnSubmitForm = (e) => {
  e.preventDefault();
  const area = e.target.querySelector('[name="area"]').value;
  const title = e.target.querySelector('[name="title"]').value;
  const description = e.target.querySelector('[name="description"]').value;
  const vinculo = e.target.querySelector('[name="vinculo"]').value;

  if (!area.trim() || !title.trim() || !description.trim() || !vinculo.trim()) {
    return;
  }

  if (isEditMode && selectedEvent) {
    selectedEvent.setExtendedProp("area", area);
    selectedEvent.setProp("title", title);
    selectedEvent.setExtendedProp("description", description);
    selectedEvent.setExtendedProp("vinculo", vinculo);
    eventManager.updateEvent(
      { area, title, description, vinculo },
      selectedEvent.id
    );
  } else {
    const event = {
      id: `${Date.now()}`,
      title,
      extendedProps: {
        area,
        description,
        vinculo,
      },
      start: selectedInfo.startStr,
      end: selectedInfo.endStr,
    };
    eventManager.saveEvent(event);
    calendar.addEvent(event);
  }
  eventModal.close();
};

eventModal.querySelector(".delete-event-btn").addEventListener("click", () => {
  eventManager.deleteEvent(selectedEvent.id);
  selectedEvent.remove();
  eventModal.close();
});

form.addEventListener("submit", handleOnSubmitForm);
eventModal.addEventListener("dile-modal-closed", () => {
  form.reset();
  selectedInfo = null;
  selectedEvent = null;
  isEditMode = false;
});

// Función para actualizar el resaltado de las celdas
function updateTimeSlotHighlight(start, end) {
  const timeLabels = document.querySelectorAll(".fc-timegrid-slot-label");
  timeLabels.forEach((label) => {
    const labelTime = label.dataset.time;
    if (labelTime) {
      const [hour, minute] = labelTime.split(":").map(Number);
      const labelMinutes = hour * 60 + minute;
      const startMinutes = start.getHours() * 60 + start.getMinutes();
      const endMinutes = end.getHours() * 60 + end.getMinutes();
      // Incluye el final en el resaltado
      if (labelMinutes >= startMinutes && labelMinutes <= endMinutes) {
        label.style.backgroundColor = "rgba(0, 123, 255, 0.2)"; // Color de resaltado
      } else {
        label.style.backgroundColor = ""; // Restaurar color original
      }
    }
  });
}
function clearTimeSlotHighlight() {
  const timeLabels = document.querySelectorAll(".fc-timegrid-slot-label");
  timeLabels.forEach((label) => {
    label.style.backgroundColor = ""; // Restaura el color original
  });
}

const calendar = new Calendar(container, {
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
  initialView: "dayGridMonth",
  locale: LocaleEs,
  headerToolbar: {
    left: "prev,next today",
    center: "title",
    right: "dayGridMonth,timeGridWeek,listWeek",
  },
  selectable: true,
  slotLabelFormat: {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    meridiem: "short",
  },
  // Define how many hours to display
  views: {
    timeGridWeek: {
      slotDuration: "00:30:00", // Duration of each slot
      slotLabelInterval: { minutes: 30 }, // Show every hour
      allDaySlot: false,
      nextDayThreshold: "00:00:00", // Don't show all-day slots
    },
  },
  eventDurationEditable: true, // Asegura que se pueda ajustar la duración de los eventos
  snapDuration: "00:30:00",
  events: eventManager.getEvents(),
  eventClick: handleOnClickEvent,
  select: function (info) {
    // Guardar la selección
    selectedInfo = info;

    // Forzar la deselección visual inmediatamente
    setTimeout(() => {
      calendar.unselect(); // Quitar la selección visual
      clearTimeSlotHighlight(); // Limpiar cualquier resaltado

      // Abre el modal justo después de quitar la selección visual
      openModal();
    }, 0);
  },
  unselect: function () {
    clearTimeSlotHighlight(); // Limpia el resaltado al deseleccionar
  },

  eventContent: function (arg) {
    const eventEl = document.createElement("div");
    eventEl.className = "custom-event-content";

    if (!arg.event.allDay && arg.view.type === "dayGridMonth") {
      const timeInfo = document.createElement("div");
      timeInfo.className = "event-time";
      const startTime = arg.event.start
        ? arg.event.start.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            meridiem: "short",
          })
        : "";
      let endTime = "";
      if (arg.event.end) {
        const endDate = new Date(arg.event.end); // Creamos una copia de la fecha de fin
        endDate.setMinutes(endDate.getMinutes() - 30);
        endTime = endDate.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          meridiem: "short",
        });
      }

      timeInfo.textContent = `${startTime} - ${endTime}`;
      eventEl.appendChild(timeInfo);
    }

    const area = document.createElement("div");
    area.className = "event-area";
    area.textContent = arg.event.extendedProps.area;
    eventEl.appendChild(area);

    const title = document.createElement("div");
    title.className = "event-title";
    title.textContent = arg.event.title;
    eventEl.appendChild(title);

    const description = document.createElement("div");
    description.className = "event-description";
    let descText = arg.event.extendedProps.description || "";
    if (descText.length > 50) {
      descText = descText.substring(0, 50) + "...";
    }
    description.textContent = descText;
    eventEl.appendChild(description);

    return { domNodes: [eventEl] };
  },
});
let isSelecting = false;
let selectionStart = null;
let selectionEnd = null;

container.addEventListener("mousedown", (event) => {
  const timeSlot = event.target.closest(".fc-timegrid-slot");
  if (timeSlot) {
    isSelecting = true;
    const timeData = timeSlot.dataset.time.split(":");
    selectionStart = new Date();
    selectionStart.setHours(parseInt(timeData[0]), parseInt(timeData[1]), 0);

    // Ajustamos la selección final para incluir la primera celda
    selectionEnd = new Date(selectionStart); // Inicializa selección de arrastre
    updateTimeSlotHighlight(selectionStart, selectionEnd); // Actualiza de inmediato
  }
});

// Listener para arrastrar y actualizar en vivo
container.addEventListener("mousemove", (event) => {
  if (isSelecting) {
    const timeSlot = event.target.closest(".fc-timegrid-slot");
    if (timeSlot) {
      const timeData = timeSlot.dataset.time.split(":");
      selectionEnd = new Date();
      selectionEnd.setHours(parseInt(timeData[0]), parseInt(timeData[1]), 0);
      updateTimeSlotHighlight(selectionStart, selectionEnd);
    }
  }
});

// Listener para finalizar la selección
function isExactHour(date) {
  return date.getMinutes() === 0 && date.getSeconds() === 0;
}

// Modificar el listener de mouseup
container.addEventListener("mouseup", (event) => {
  if (isSelecting) {
    isSelecting = false;
    clearTimeSlotHighlight(); // Limpia el resaltado manual de las celdas

    const timeSlot = event.target.closest(".fc-timegrid-slot");
    if (timeSlot) {
      const timeData = timeSlot.dataset.time.split(":");
      const endTime = new Date();
      endTime.setHours(parseInt(timeData[0]), parseInt(timeData[1]), 0);

      // Asignar los valores seleccionados
      selectedInfo = {
        start: selectionStart,
        end: endTime,
        allDay: false,
      };

      // Quitar la selección visual del calendario y deshacer cualquier selección activa
      calendar.unselect(); // Limpia la selección de FullCalendar
      clearTimeSlotHighlight(); // Limpia cualquier resaltado en los slots

      openModal(); // Abre el modal después de soltar
    }
  }
});

calendar.render();

//seleccionador de archivos

const fileInput = document.getElementById("filein");
const fileName = document.getElementById("fileName");

fileInput.addEventListener("change", function () {
  if (fileInput.files.length > 0) {
    fileName.textContent = fileInput.files[0].name;
  } else {
    fileName.textContent = "Ningún archivo seleccionado";
  }
});
