// ---------------------------------------------------------
// CONFIGURACIÓN DE ENVÍO CIFRADO
// Mismo Worker y misma llave pública que el pre-registro (VIA)
// ---------------------------------------------------------
const WORKER_URL = "https://long-heart-1ec8.via-paratodxs.workers.dev";

const LLAVE_PUBLICA = `-----BEGIN PGP PUBLIC KEY BLOCK-----

xjMEalgOVBYJKwYBBAHaRw8BAQdAg0xGNOzedu+d5RXHwbDk9IeVI+1Iji+X
REu+Dh8qKE3NKlZJQSBDb29yZGluYWNpb24gPHZpYS5wYXJhdG9keHNAcHJv
dG9uLm1lPsLAEwQTFgoAhQWCalgOVAMLCQcJEG2xzJchG0MoRRQAAAAAABwA
IHNhbHRAbm90YXRpb25zLm9wZW5wZ3Bqcy5vcmdENss10Bxj6kJKqkn0578R
4LpmlKXVHn1aTnq88j8dTgUVCggODAQWAAIBAhkBApsDAh4BFiEE3Mz98ulk
nU7lbO18bbHMlyEbQygAAJRZAP9zlqwts8dQQ/VB3C0noAmqbmm/KPBpLAlm
i09TBbzHqgD/ciGuUf82RuBkBPFomA1VrrilJTDZJxZh0tpuafzSywXOOARq
WA5UEgorBgEEAZdVAQUBAQdAvEHHWqbp0EnN6FXHm3ZD4epedlg+0h7pDTVC
qgUCbkQDAQgHwr4EGBYKAHAFgmpYDlQJEG2xzJchG0MoRRQAAAAAABwAIHNh
bHRAbm90YXRpb25zLm9wZW5wZ3Bqcy5vcmcSHY+DeF5SKNnv4v78sZj1M9kl
NcQmflcZrCx87xsqfAKbDBYhBNzM/fLpZJ1O5WztfG2xzJchG0MoAAAHyAEA
0uVQMpKL1S2nlOiw3hKyUzvxUeYiOdlE7sC/QpMeAVMBAKc0sUIbxwo8bs/I
SlJsvizzy2jjJ7epTODtqDg9GXEF
=Aajs
-----END PGP PUBLIC KEY BLOCK-----`;

// ---------------------------------------------------------
// ESTADO
// ---------------------------------------------------------
const estado = {
  hojaActual: 1
};

// ---------------------------------------------------------
// NAVEGACIÓN ENTRE HOJAS
// ---------------------------------------------------------
function irAHoja(numero) {
  document.querySelectorAll(".hoja").forEach(h => h.classList.remove("activa"));

  const idHoja = numero === 4 ? "hoja-final" : `hoja-${numero}`;
  document.getElementById(idHoja).classList.add("activa");

  document.querySelectorAll(".punto").forEach(p => {
    const n = Number(p.dataset.punto);
    p.classList.toggle("activo", n === numero);
    p.classList.toggle("completo", n < numero);
  });

  estado.hojaActual = numero;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------------------------------------------------------
// RECOLECCIÓN DE DATOS
// ---------------------------------------------------------
function recolectarDatos() {
  const modulosElegidos = Array.from(
    document.querySelectorAll('input[name="modulo"]:checked')
  ).map(c => c.value);

  return {
    nombre: document.getElementById("nombre").value,
    edad: document.getElementById("edad").value,
    correo: document.getElementById("correo").value,
    pais: document.getElementById("pais").value,
    departamento: document.getElementById("departamento").value,
    indigenaAfro: document.querySelector('input[name="indigenaAfro"]:checked')?.value || "—",
    cualPueblo: document.getElementById("cualPueblo").value || "—",
    perteneceOrg: document.querySelector('input[name="perteneceOrg"]:checked')?.value || "—",
    cualOrg: document.getElementById("cualOrg").value || "—",
    modulos: modulosElegidos,
    compromiso: document.getElementById("compromiso").checked
  };
}

// ---------------------------------------------------------
// GENERAR RESUMEN EN TEXTO PLANO (esto es lo que se cifra)
// ---------------------------------------------------------
function generarResumenTexto(datos) {
  const fecha = new Date().toLocaleString("es-AR");

  let texto = `INSCRIPCIÓN A MÓDULOS FORMATIVOS — VIA\n`;
  texto += `Completado el: ${fecha}\n`;
  texto += `${"=".repeat(50)}\n\n`;

  texto += `-- DATOS PERSONALES --\n`;
  texto += `Nombre: ${datos.nombre}\n`;
  texto += `Edad: ${datos.edad}\n`;
  texto += `Correo: ${datos.correo}\n`;
  texto += `País: ${datos.pais}\n`;
  texto += `Departamento: ${datos.departamento}\n\n`;

  texto += `-- IDENTIDAD Y ORGANIZACIÓN --\n`;
  texto += `¿Se autopercibe indígena o afrodescendiente?: ${datos.indigenaAfro}\n`;
  texto += `Pueblo o comunidad: ${datos.cualPueblo}\n`;
  texto += `¿Pertenece a una organización?: ${datos.perteneceOrg}\n`;
  texto += `Organización: ${datos.cualOrg}\n\n`;

  texto += `-- MÓDULOS Y COMPROMISO --\n`;
  texto += `Módulos elegidos: ${datos.modulos.length ? datos.modulos.join(" | ") : "ninguno"}\n`;
  texto += `Se compromete a finalizarlos: ${datos.compromiso ? "Sí" : "No"}\n`;

  return texto;
}

// ---------------------------------------------------------
// CIFRADO Y ENVÍO
// ---------------------------------------------------------
async function cifrarTexto(textoPlano) {
  const publicKey = await openpgp.readKey({ armoredKey: LLAVE_PUBLICA });
  const mensaje = await openpgp.createMessage({ text: textoPlano });

  const cifrado = await openpgp.encrypt({
    message: mensaje,
    encryptionKeys: publicKey,
  });

  return cifrado;
}

async function enviarCifrado(textoPlano) {
  try {
    const cifrado = await cifrarTexto(textoPlano);

    const respuesta = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensajeCifrado: cifrado }),
    });

    return respuesta.ok;
  } catch (error) {
    console.error("Error al enviar la inscripción cifrada:", error);
    return false;
  }
}

// ---------------------------------------------------------
// EVENTOS
// ---------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {

  // --- Hoja 1: datos personales ---
  const camposHoja1 = ["nombre", "edad", "correo", "pais", "departamento"].map(id => document.getElementById(id));
  const btnAHoja2 = document.getElementById("btn-a-hoja-2");
  const notaHoja1 = document.getElementById("nota-hoja-1");

  function validarHoja1() {
    const completos = camposHoja1.every(c => c.value.trim() !== "");
    btnAHoja2.disabled = !completos;
    notaHoja1.style.display = completos ? "none" : "inline";
  }
  camposHoja1.forEach(c => c.addEventListener("input", validarHoja1));

  btnAHoja2.addEventListener("click", () => irAHoja(2));
  document.getElementById("btn-a-hoja-1-desde-2").addEventListener("click", () => irAHoja(1));

  // --- Hoja 2: identidad y organización ---
  const campoCualPueblo = document.getElementById("campo-cualPueblo");
  document.querySelectorAll('input[name="indigenaAfro"]').forEach(radio => {
    radio.addEventListener("change", () => {
      campoCualPueblo.style.display = radio.checked && radio.value === "si" ? "block" : "none";
      validarHoja2();
    });
  });

  const campoCualOrg = document.getElementById("campo-cualOrg");
  document.querySelectorAll('input[name="perteneceOrg"]').forEach(radio => {
    radio.addEventListener("change", () => {
      campoCualOrg.style.display = radio.checked && radio.value === "si" ? "block" : "none";
      validarHoja2();
    });
  });

  const btnAHoja3 = document.getElementById("btn-a-hoja-3");
  function validarHoja2() {
    const indigenaAfroElegido = document.querySelector('input[name="indigenaAfro"]:checked');
    const perteneceOrgElegido = document.querySelector('input[name="perteneceOrg"]:checked');
    btnAHoja3.disabled = !(indigenaAfroElegido && perteneceOrgElegido);
  }

  btnAHoja3.addEventListener("click", () => irAHoja(3));
  document.getElementById("btn-a-hoja-2-desde-3").addEventListener("click", () => irAHoja(2));

  // --- Hoja 3: módulos + envío ---
  const formulario = document.getElementById("formularioInscripcion");
  const btnFinalizar = document.getElementById("btn-finalizar");

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    btnFinalizar.disabled = true;
    btnFinalizar.textContent = "Enviando de forma cifrada...";

    const datos = recolectarDatos();
    const textoPlano = generarResumenTexto(datos);
    const enviado = await enviarCifrado(textoPlano);

    if (enviado) {
      irAHoja(4);
    } else {
      btnFinalizar.disabled = false;
      btnFinalizar.textContent = "Confirmar inscripción";
      alert("Hubo un problema al enviar tu inscripción de forma cifrada. Por favor, intentá de nuevo.");
    }
  });

});
