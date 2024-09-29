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

const handleOnSelect = (info) => {
  console.log("selected " + info.startStr + " to " + info.endStr);
  selectedInfo = info;
  eventModal.open();
};

const handleOnClickEvent = (data) => {
  form.querySelector('[name="area"]').value = data.event.extendedProps.area;
  form.querySelector('[name="title"]').value = data.event.title;
  form.querySelector('[name="description"]').value =
    data.event.extendedProps.description;
  form.querySelector('[name="vinculo"]').value =
    data.event.extendedProps.vinculo;
  // form.querySelector('[name="img"]').value = data.event.extendedProps.img;
  selectedEvent = data.event;
  eventModal.querySelector(".delete-event-btn").classList.remove("d-none");
  eventModal.querySelector("button[type='submit']").innerHTML = "Editar";
  eventModal.open();
};

const handleOnSubmitForm = (e) => {
  e.preventDefault();
  const area = e.target.querySelector('[name="area"]').value;
  const title = e.target.querySelector('[name="title"]').value;
  const description = e.target.querySelector('[name="description"]').value;
  const vinculo = e.target.querySelector('[name="vinculo"]').value;
  // const img = e.target.querySelector('[name="img"]').value;
  if (!area.trim() || !title.trim() || !description.trim() || !vinculo.trim()) {
    return;
  }
  if (selectedEvent) {
    selectedEvent.setExtendedProp("area", area);
    selectedEvent.setProp("title", title);
    selectedEvent.setExtendedProp("description", description);
    selectedEvent.setExtendedProp("vinculo", vinculo);
    // selectedEvent.setExtendedProp("img", img);
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
  form.querySelector('[name="area"]').value = "";
  form.querySelector('[name="title"]').value = "";
  form.querySelector('[name="description"]').value = "";
  form.querySelector('[name="vinculo"]').value = "";
  eventModal.querySelector(".delete-event-btn").classList.add("d-none");
  eventModal.querySelector("button[type='submit']").innerHTML = "Guardar";
  selectedInfo = null;
  selectedEvent = null;
});

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
  events: eventManager.getEvents(),
  eventClick: handleOnClickEvent,
  select: handleOnSelect,
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
          })
        : "";
      const endTime = arg.event.end
        ? arg.event.end.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
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
