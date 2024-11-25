async function cargarOpciones() {
  try {
    const respuesta = await fetch("http://localhost:5173/api/area");
    const datos = await respuesta.json();

    console.log("Areas obtenidas", datos);

    const select = document.getElementById("select");

    datos.forEach((elemento) => {
      const opcion = document.createElement("option");
      opcion.value = elemento.areas;
      opcion.textContent = elemento.areas;
      select.appendChild(opcion);
    });
  } catch (error) {
    console.log("Error cargando opciones", error);
  }
}

document.addEventListener("DOMContentLoaded", cargarOpciones);
