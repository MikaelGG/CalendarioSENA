import Swal from "sweetalert2";

document.getElementById("formis").addEventListener("submit", async (e) => {
  e.preventDefault();

  const documento = e.target.children.documentoidentidad.value;
  const contra = e.target.children.contraseña.value;

  console.log("Datos a enviar:", { documento, contra });

  try {
    const res = await fetch("http://localhost:4000/api/loguin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documento,
        contra,
      }),
    });

    const data = await res.json();
    console.log("Respuesta del servidor:", data);

    if (!res.ok) {
      return Swal.fire({
        position: "center",
        icon: "error",
        title: "Documento de identidad o contraseña incorrectos",
        showConfirmButton: false,
        timer: 3000,
        customClass: {
          title: "sweetAlert",
        },
      });
    }

    // Si tenemos token y datos de usuario, los guardamos
    if (data.token && data.user) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Mostrar alerta de éxito
      await Swal.fire({
        position: "center",
        icon: "success",
        title: "¡Inicio de sesión exitoso!",
        showConfirmButton: false,
        timer: 2500,
        customClass: {
          title: "sweetAlert",
        },
      });

      // Después de mostrar la alerta, manejamos la redirección
      if (data.redirect) {
        // Construimos la URL base desde la ubicación actual
        const baseUrl = window.location.origin;
        const redirectUrl = new URL(data.redirect, baseUrl).href;
        console.log("Redirigiendo a:", redirectUrl);
        window.location.replace(redirectUrl);
      }
    } else {
      // Si no hay token o usuario, mostramos error
      Swal.fire({
        position: "center",
        icon: "error",
        title: "Error en la respuesta del servidor",
        text: "No se recibieron los datos necesarios",
        showConfirmButton: false,
        timer: 3000,
        customClass: {
          title: "sweetAlert",
        },
      });
    }
  } catch (error) {
    console.error("Error durante el login:", error);
    Swal.fire({
      position: "center",
      icon: "error",
      title: "Error durante el proceso de inicio de sesión",
      text: "Por favor, intente nuevamente",
      showConfirmButton: false,
      timer: 3000,
      customClass: {
        title: "sweetAlert",
      },
    });
  }
});
