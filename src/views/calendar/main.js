import { Calendar } from "@fullcalendar/core";
import LocaleEs from "@fullcalendar/core/locales/es";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import EventManager from "./scripts/EventManager";
import listPlugin from "@fullcalendar/list";
import { format, parseISO, subMinutes } from "date-fns";
import Swal from "sweetalert2";
import "@dile/dile-modal/dile-modal";
import "./style.css";

const container = document.querySelector(".calendar-container");
const eventModal = document.querySelector("#event-modal");
const form = eventModal.querySelector("form");
let selectedInfo = null;
let selectedEvent = null;

const eventManager = new EventManager();

console.log("Eventos actuales:", eventManager.getEvents());

function getUserRole() {
  const user = JSON.parse(localStorage.getItem("user"));
  return user ? parseInt(user.rol) : null;
}

function isAdmin() {
  const role = getUserRole();
  console.log("Current role:", role); // Para debugging
  return role === 1;
}
console.log("User:", localStorage.getItem("user"));
console.log("Token:", localStorage.getItem("token"));

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
    form.querySelector('[name="place"]').value =
      selectedEvent.extendedProps.place;
    form.querySelector('[name="vinculo"]').value =
      selectedEvent.extendedProps.vinculo;

    // Extraer solo el nombre del archivo de la ruta de imagen
    const fullPath = selectedEvent.extendedProps.imagen;
    const imageName = fullPath
      ? fullPath.split("\\").pop().split("/").pop()
      : "Ningún archivo seleccionado (No obligatorio)";

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
    eventModal.querySelector("button[type='submit']").innerHTML = "Confirmar";
  } else {
    // Modo registro
    form.reset();
    document.getElementById("fileName").textContent =
      "Ningún archivo seleccionado (No obligatorio)";
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
  const areaError = document.getElementById("areaError");
  if (!area) {
    areaError.textContent = "¡Selecciona un Área!"; // Muestra el mensaje
    areaError.style.display = "block"; // Asegúrate de que sea visible
    return; // Detiene la ejecución si no es válido
  } else {
    areaError.textContent = ""; // Limpia el mensaje
    areaError.style.display = "none"; // Oculta el mensaje si es válido
  }

  const title = e.target.querySelector('[name="title"]').value;
  const titleError = document.getElementById("titleError");
  if (title.length <= 5 || title.length >= 65) {
    titleError.textContent =
      "¡El titulo debe ser mayor de 5 y menor de 65 carácteres!"; // Muestra el mensaje
    titleError.style.display = "block"; // Asegúrate de que sea visible
    return; // Detiene la ejecución si no es válido
  } else {
    titleError.textContent = ""; // Limpia el mensaje
    titleError.style.display = "none"; // Oculta el mensaje si es válido
  }

  const description = e.target.querySelector('[name="description"]').value;
  const descriptionError = document.getElementById("descriptionError");
  if (description.length <= 15 || description.length >= 315) {
    descriptionError.textContent =
      "¡La descripción debe ser mayor de 15 y menor de 315 carácteres!"; // Muestra el mensaje
    descriptionError.style.display = "block"; // Asegúrate de que sea visible
    return; // Detiene la ejecución si no es válido
  } else {
    descriptionError.textContent = ""; // Limpia el mensaje
    descriptionError.style.display = "none"; // Oculta el mensaje si es válido
  }

  const place = e.target.querySelector('[name="place"]').value;
  const placeError = document.getElementById("placeError");
  if (place.length <= 5 || place.length >= 45) {
    placeError.textContent =
      "¡El lugar del evento debe ser mayor de 15 y menor de 45 carácteres!"; // Muestra el mensaje
    placeError.style.display = "block"; // Asegúrate de que sea visible
    return; // Detiene la ejecución si no es válido
  } else {
    placeError.textContent = ""; // Limpia el mensaje
    placeError.style.display = "none"; // Oculta el mensaje si es válido
  }

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
      place,
      vinculo,
    })
  );

  if (imagen) {
    formData.append("img", imagen);
  }

  if (isEditMode && selectedEvent) {
    formData.append("currentImage", selectedEvent.extendedProps.imagen || null);
  }

  if (!isEditMode && !selectedEvent && selectedInfo) {
    // Formatear fechas en formato MySQL (YYYY-MM-DD HH:mm:ss)
    const formattedStart = format(
      parseISO(selectedInfo.startStr),
      "yyyy-MM-dd HH:mm:ss"
    );

    const endDate = parseISO(selectedInfo.endStr);
    const adjustedEndDate = subMinutes(endDate, 30);
    const formattedEnd = format(adjustedEndDate, "yyyy-MM-dd HH:mm:ss");

    formData.append("start", formattedStart);
    formData.append("end", formattedEnd);

    console.log("Fechas formateadas enviadas:", {
      start: formattedStart,
      end: formattedEnd,
    });
  }

  if (isEditMode && selectedEvent) {
    await eventManager.updateEvent(formData, selectedEvent.id);
    Swal.fire({
      position: "center",
      icon: "success",
      title: "Evento editado",
      showConfirmButton: false,
      timer: 3000,
      customClass: {
        title: "sweetAlert",
      },
    });
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
        place: savedEvent.lugar,
        vinculo: savedEvent.url,
        imagen: savedEvent.imagen,
      },
    });

    Swal.fire({
      position: "center",
      icon: "success",
      title: "Evento registrado",
      showConfirmButton: false,
      timer: 3000,
      customClass: {
        title: "sweetAlert",
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
      Swal.fire({
        position: "center",
        icon: "success",
        title: "Evento eliminado",
        showConfirmButton: false,
        timer: 3000,
        customClass: {
          title: "sweetAlert",
        },
      });
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
    right: isAdmin()
      ? "dayGridMonth,timeGridWeek,listWeek"
      : "dayGridMonth,listWeek",
  },
  selectable: isAdmin(),
  slotLabelFormat: {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    meridiem: "short",
  },
  // Define how many hours to display
  views: {
    timeGridWeek: {
      display: isAdmin() ? "auto" : "none",
      slotDuration: "00:30:00", // Duration of each slot
      slotLabelInterval: { minutes: 30 }, // Show every hour
      allDaySlot: false,
      titleFormat: { day: "numeric", month: "long", year: "numeric" },
    },
    list: {
      titleFormat: { day: "numeric", month: "long", year: "numeric" },
    },
  },
  eventDurationEditable: isAdmin(), // Asegura que se pueda ajustar la duración de los eventos
  snapDuration: "00:30:00",
  events: eventManager.getEvents(),
  eventDidMount: function (info) {
    // Solo para la vista de lista (listWeek)
    if (info.view.type === "listWeek") {
      const eventElement = info.el;
      const startDate = info.event.start;
      const endDate = info.event.end || info.event.start;

      const timeFormatter = new Intl.DateTimeFormat("es-ES", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      const dateFormatter = new Intl.DateTimeFormat("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });

      const dateHeader = eventElement.querySelector(".fc-list-event-time");
      if (!dateHeader) return;

      // Función auxiliar para capitalizar primera letra
      const capitalizeFirst = (str) =>
        str.charAt(0).toUpperCase() + str.slice(1);

      // Función para formatear la hora
      const formatTime = (date) => {
        let timeStr = timeFormatter.format(date).toLowerCase();
        // Reemplazar 'a. m.' y 'p. m.' por 'am' y 'pm'
        timeStr = timeStr.replace("a. m.", "am").replace("p. m.", "pm");
        return timeStr;
      };

      let formattedDateTime;

      // Verificar si el evento es en el mismo día
      if (startDate.toDateString() === endDate.toDateString()) {
        // Formato para eventos del mismo día: "1:00 pm - 5:00 pm"
        formattedDateTime = `${formatTime(startDate)} - ${formatTime(endDate)}`;
      } else {
        // Formato para eventos de varios días
        const startDateStr = dateFormatter.format(startDate).toLowerCase();
        const endDateStr = dateFormatter.format(endDate).toLowerCase();

        // Extraer y formatear las partes de la fecha
        const [startWeekday, startRest] = startDateStr.split(",");
        const [endWeekday, endRest] = endDateStr.split(",");

        // Formatear fechas y horas
        formattedDateTime =
          `${capitalizeFirst(startWeekday)} ${startRest.trim()}, ` +
          `${capitalizeFirst(endWeekday)} ${endRest.trim()}, ` +
          `${formatTime(startDate)} - ${formatTime(endDate)}`;
      }

      dateHeader.innerHTML = formattedDateTime;
    }
  },

  eventClick: function (info) {
    if (isAdmin()) {
      Swal.fire({
        title: "Seleccione una acción",
        showCancelButton: true,
        confirmButtonText: "Editar Evento",
        cancelButtonText: "Ver Evento",
        reverseButtons: true,
        customClass: {
          title: "sweetAlert",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          handleOnClickEvent(info);
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          // Si el usuario hace clic en "Ver Evento"
          showViewOnlyModal(info.event);
        }
      });
    } else {
      showViewOnlyModal(info.event);
    }
  },
  select: function (info) {
    if (!isAdmin()) {
      Swal.fire({
        position: "center",
        icon: "error",
        title: "No tiene permisos para crear eventos",
        showConfirmButton: false,
        timer: 3000,
        customClass: {
          title: "sweetAlert",
        },
      });
      calendar.unselect();
      return;
    }

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
  buttonText: {
    dayGridMonth: "Vista del Mes",
    timeGridWeek: "Registro de Eventos",
    list: "Agenda de Eventos",
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
      const endTime = arg.event.end
        ? arg.event.end.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            meridiem: "short",
          })
        : "";

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
        place: event.lugar,
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
  if (!isAdmin()) return;
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
  if (!isAdmin() || !isSelecting) return;
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
  if (!isAdmin() || !isSelecting) return;
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

// Función para mostrar el modal de solo lectura usando el modal existente
function showViewOnlyModal(event) {
  console.log("Eventos para ver:", event);
  const eventModal = document.getElementById("eventmodal");

  eventModal.close();

  // Actualizar el contenido del modal con los datos del evento
  eventModal.querySelector(".vistatitulo").textContent =
    event.extendedProps.title;
  eventModal.querySelector(".vistaarea").textContent = event.extendedProps.area;
  eventModal.querySelector(".vistadescripcion").textContent =
    event.extendedProps.description;
  eventModal.querySelector(".hora").textContent = format(
    event.startStr,
    "HH:mm a"
  );
  eventModal.querySelector(".lugar").textContent = event.extendedProps.place;

  // Actualizar el enlace si existe
  const linkElement = eventModal.querySelector(".vistavinculo");
  if (event.extendedProps.vinculo) {
    linkElement.textContent = "Enlace de inscripción";
    linkElement.href = event.extendedProps.vinculo;
    console.log(event.extendedProps.vinculo);
    linkElement.style.display = "block";
  } else {
    linkElement.style.display = "none";
  }

  // Assuming eventModal is a reference to the DOM element containing the "vistaimagen" class
  const rectangleDiv = eventModal.querySelector(".vistaimagen");

  rectangleDiv.onclick = null;

  if (event.extendedProps.imagen) {
    const imagePath = `/public/${event.extendedProps.imagen}`;
    rectangleDiv.style.display = "block";

    rectangleDiv.addEventListener("click", () => {
      const existingContainer = document.querySelector(
        ".large-image-container"
      );
      if (existingContainer) {
        existingContainer.remove();
      }

      const imageContainer = document.createElement("div");
      imageContainer.classList.add("large-image-container");

      const largeImage = new Image();
      largeImage.src = imagePath;
      largeImage.classList.add("large-image");

      imageContainer.appendChild(largeImage);
      document.body.appendChild(imageContainer);

      imageContainer.addEventListener("click", (event) => {
        if (event.target === imageContainer) {
          document.body.removeChild(imageContainer);
        }
      });
    });
  } else {
    rectangleDiv.style.backgroundImage = "none"; // Reset background image if no image available
    rectangleDiv.style.display = "none";
  }

  // Configurar el botón de cerrar
  const closeButton = eventModal.querySelector(".x");
  closeButton.onclick = () => {
    eventModal.close();
  };

  // Abrir el modal
  eventModal.open();
}

// Función para cerrar sesión
async function logout() {
  console.log("Cerrando sesión...");
  // Obtén el token y los datos del usuario
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  if (user && token) {
    // Elimina el token y los datos del usuario del almacenamiento local
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    await Swal.fire({
      position: "center",
      icon: "success",
      title: "Sesión cerrada",
      showConfirmButton: false,
      timer: 3000,
      customClass: {
        title: "sweetAlert",
      },
    });

    // Redirige a la página de inicio de sesión o a una página de bienvenida
    window.location.href = "/index.html";
  } else {
    console.log(
      "No se encontró el usuario o token en el almacenamiento local."
    );
  }
}

// Escuchar el clic en el botón de cerrar sesión

if (getUserRole() === null) {
  document.getElementById("cerrarsesion").classList.add("d-none");
}

document.getElementById("cerrarsesion").addEventListener("click", logout);
