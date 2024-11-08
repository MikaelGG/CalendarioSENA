import { Calendar } from "@fullcalendar/core";
import LocaleEs from "@fullcalendar/core/locales/es";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import EventManager from "./scripts/EventManager";
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
  console.log(selectedEvent);
  if (isEditMode && selectedEvent) {
    // Modo edición
    form.querySelector('[name="area"]').value =
      selectedEvent.extendedProps.area;
    form.querySelector('[name="title"]').value =
      selectedEvent.extendedProps.title;
    form.querySelector('[name="description"]').value =
      selectedEvent.extendedProps.description;
    form.querySelector('[name="vinculo"]').value =
      selectedEvent.extendedProps.vinculo;

    // Extraer solo el nombre del archivo de la ruta de imagen
    const fullPath = selectedEvent.extendedProps.imagen;
    const imageName = fullPath
      ? fullPath.split("\\").pop().split("/").pop()
      : "Ningún archivo seleccionado";

    // Mostrar el nombre del archivo en el span del formulario
    document.getElementById("fileName").textContent = imageName;

    const tev = document.getElementById("tev");

    const btnsContainer = eventModal.querySelector(
      ".btns-container, .btns-container2"
    );
    if (btnsContainer) {
      btnsContainer.classList.remove("btns-container2");
      btnsContainer.classList.add("btns-container");
      tev.innerHTML = "Editar evento";
    }
    eventModal.querySelector(".delete-event-btn").classList.remove("d-none");
    eventModal.querySelector("button[type='submit']").innerHTML = "Editar";
  } else {
    // Modo registro
    form.reset();
    document.getElementById("fileName").textContent =
      "Ningún archivo seleccionado";
    const btnsContainer = eventModal.querySelector(
      ".btns-container, .btns-container2"
    );
    if (btnsContainer) {
      btnsContainer.classList.remove("btns-container");
      btnsContainer.classList.add("btns-container2");
      tev.innerHTML = "Gestionar evento";
    }
    eventModal.querySelector(".delete-event-btn").classList.add("d-none");
    eventModal.querySelector("button[type='submit']").innerHTML = "Registrar";
  }

  eventModal.open();
};

const handleOnSubmitForm = async (e) => {
  e.preventDefault();
  const area = e.target.querySelector('[name="area"]').value;
  const title = e.target.querySelector('[name="title"]').value;
  const description = e.target.querySelector('[name="description"]').value;
  const vinculo = e.target.querySelector('[name="vinculo"]').value;
  const imagen = e.target.querySelector('[name="img"]').files[0];

  const formData = new FormData();
  formData.append("id", selectedEvent ? selectedEvent.id : Date.now());
  formData.append(
    "extendedProps",
    JSON.stringify({
      area,
      title,
      description,
      vinculo,
    })
  );

  if (imagen) {
    formData.append("img", imagen);
  }

  if (isEditMode && selectedEvent) {
    formData.append("currentImage", selectedEvent.extendedProps.imagen || null);
  }

  if (!isEditMode) {
    formData.append("start", selectedInfo.startStr);
    formData.append("end", selectedInfo.endStr);
  } else {
    formData.append("start", selectedEvent.start.toISOString());
    formData.append("end", selectedEvent.end.toISOString());
  }

  if (isEditMode && selectedEvent) {
    await eventManager.updateEvent(formData, selectedEvent.id);
    await loadEvents();
  } else {
    const response = await eventManager.saveEvent(formData);
    const savedEvent = response.event;
    console.log("Respuesta del servidor:", savedEvent);

    // Agregar el evento al calendario
    calendar.addEvent({
      id: savedEvent.id, // Asegúrate de que el id se devuelva correctamente desde el backend
      start: savedEvent.fechainicio,
      end: savedEvent.fechafinal,
      extendedProps: {
        title: savedEvent.titulo,
        area: savedEvent.area,
        description: savedEvent.descripcion,
        vinculo: savedEvent.url,
        imagen: savedEvent.imagen,
      },
    });
  }
  calendar.refetchEvents();
  eventModal.close();
};

eventModal
  .querySelector(".delete-event-btn")
  .addEventListener("click", async () => {
    try {
      await eventManager.deleteEvent(selectedEvent.id);
      selectedEvent.remove();
      eventModal.close();
    } catch (error) {
      console.error("Error al eliminar el evento y la imagen:", error);
    }
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
    },
  },
  eventDurationEditable: true, // Asegura que se pueda ajustar la duración de los eventos
  snapDuration: "00:30:00",
  events: eventManager.getEvents(),
  eventDidMount: function (info) {
    // Solo para la vista de lista (listWeek)
    if (info.view.type === "listWeek") {
      const eventElement = info.el;
      const startDate = info.event.start;
      const endDate = info.event.end || info.event.start;
      endDate.setMinutes(endDate.getMinutes() - 30);

      // Comprobamos si las fechas de inicio y fin son diferentes
      if (startDate.toDateString() !== endDate.toDateString()) {
        // Modificar el texto del encabezado del evento para reflejar el rango de fechas
        const dayRangeText = `${startDate.toLocaleDateString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          meridiem: "short",
        })} - ${endDate.toLocaleDateString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          meridiem: "short",
        })}`;

        // Busca el elemento que contiene la fecha en la lista y modifícalo
        const dateHeader = eventElement.querySelector(".fc-list-event-time");
        if (dateHeader) {
          dateHeader.innerHTML = dayRangeText; // Asigna el nuevo texto
        }
      }
    }
  },

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
    title.textContent = arg.event.extendedProps.title;
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

// Cargar eventos desde el backend al inicializar el calendario
async function loadEvents() {
  try {
    const events = await eventManager.getEvents(); // Espera a que la promesa se resuelva
    console.log("Eventos actuales:", events); // Muestra los eventos obtenidos

    // Mapea los eventos al formato que FullCalendar espera
    const mappedEvents = events.map((event) => ({
      id: event.id,
      start: event.fechainicio, // Mapea la fecha de inicio
      end: event.fechafinal, // Mapea la fecha final
      extendedProps: {
        title: event.titulo, // Mapea el título
        area: event.area,
        description: event.descripcion,
        vinculo: event.url,
        imagen: event.imagen,
      },
    }));

    calendar.removeAllEvents();
    calendar.addEventSource(mappedEvents); // Agrega los eventos al calendario
    calendar.render(); // Renderiza el calendario
  } catch (error) {
    console.error("Error obteniendo eventos:", error); // Muestra cualquier error en la consola
  }
}
loadEvents();
calendar.render();

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

//Abrir modal de eventos
const event = document.getElementById("eventmodal");
const buttoneve = document.getElementById("myBtn");
const closeEven = document.getElementsByClassName("x")[0];

buttoneve.onclick = function () {
  event.open();
};

closeEven.onclick = function () {
  event.style.display = "none";
};
window.onclick = function (e) {
  if (e.target == event) {
    modal.style.display = "none";
  }
};
