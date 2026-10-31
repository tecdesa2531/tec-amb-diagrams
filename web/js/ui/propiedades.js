// Panel derecho: propiedades editables del elemento seleccionado.

let cb = {};
let idActual = null;

function campo(id, etiqueta, tipo, valor) {
    const grupo = document.createElement("div");
    grupo.className = "props-grupo";
    const lbl = document.createElement("label");
    lbl.className = "props-etiqueta";
    lbl.htmlFor = id;
    lbl.textContent = etiqueta;
    const input = document.createElement("input");
    input.id = id; input.type = tipo; input.className = "props-input";
    if (tipo === "number") { input.min = "1"; input.step = "1"; }
    input.value = valor;
    grupo.appendChild(lbl);
    grupo.appendChild(input);
    return grupo;
}

function mostrarVacio(panel) {
    panel.innerHTML = "";
    idActual = null;
    const msg = document.createElement("p");
    msg.className = "props-vacio";
    msg.textContent = "Sin seleccion";
    panel.appendChild(msg);
}

function mostrarElemento(panel, el) {
    panel.innerHTML = "";
    idActual = el.id;

    panel.appendChild(campo("prop-etiqueta", "Etiqueta", "text", el.etiqueta ?? ""));
    panel.appendChild(campo("prop-x",     "X",     "number", el.x));
    panel.appendChild(campo("prop-y",     "Y",     "number", el.y));
    panel.appendChild(campo("prop-ancho", "Ancho", "number", el.ancho));
    panel.appendChild(campo("prop-alto",  "Alto",  "number", el.alto));

    const leerCambios = () => ({
        etiqueta: document.getElementById("prop-etiqueta")?.value ?? el.etiqueta,
        x:     parseInt(document.getElementById("prop-x")?.value)     || el.x,
        y:     parseInt(document.getElementById("prop-y")?.value)     || el.y,
        ancho: parseInt(document.getElementById("prop-ancho")?.value) || el.ancho,
        alto:  parseInt(document.getElementById("prop-alto")?.value)  || el.alto,
    });

    for (const id of ["prop-etiqueta", "prop-x", "prop-y", "prop-ancho", "prop-alto"]) {
        document.getElementById(id)?.addEventListener("change", () => cb.onChange?.(el.id, leerCambios()));
    }
}

function seccion(texto) {
    const p = document.createElement("p");
    p.className = "props-seccion";
    p.textContent = texto;
    return p;
}

function boton(etiqueta, onClick) {
    const btn = document.createElement("button");
    btn.className = "props-btn";
    btn.textContent = etiqueta;
    btn.addEventListener("click", onClick);
    return btn;
}

function grupoBotones(botones) {
    const div = document.createElement("div");
    div.className = "props-botones";
    for (const btn of botones) div.appendChild(btn);
    return div;
}

function mostrarMultiple(panel, ids) {
    panel.innerHTML = "";
    idActual = null;

    const msg = document.createElement("p");
    msg.className = "props-vacio";
    msg.textContent = ids.length + " elementos";
    panel.appendChild(msg);

    panel.appendChild(seccion("Alinear"));
    panel.appendChild(grupoBotones([
        boton("Izq",    () => cb.onAlinear?.(ids, "left")),
        boton("Der",    () => cb.onAlinear?.(ids, "right")),
        boton("Top",    () => cb.onAlinear?.(ids, "top")),
        boton("Bot",    () => cb.onAlinear?.(ids, "bottom")),
        boton("Cent H", () => cb.onAlinear?.(ids, "centerH")),
        boton("Cent V", () => cb.onAlinear?.(ids, "centerV")),
    ]));

    if (ids.length >= 3) {
        panel.appendChild(seccion("Distribuir"));
        panel.appendChild(grupoBotones([
            boton("Horizontal", () => cb.onDistribuir?.(ids, "x")),
            boton("Vertical",   () => cb.onDistribuir?.(ids, "y")),
        ]));
    }

    panel.appendChild(seccion("Igualar tamano"));
    panel.appendChild(grupoBotones([
        boton("Ancho", () => cb.onIgualarTamano?.(ids, "ancho")),
        boton("Alto",  () => cb.onIgualarTamano?.(ids, "alto")),
        boton("Ambos", () => cb.onIgualarTamano?.(ids, "ambos")),
    ]));
}

export function iniciar(panel, callbacks) {
    cb = callbacks ?? {};
    mostrarVacio(panel);
}

export function actualizar(panel, elementos, seleccionIds) {
    const ids = [...seleccionIds];
    if (ids.length === 1) {
        const el = elementos.find(e => e.id === ids[0]);
        if (el) { mostrarElemento(panel, el); return; }
    }
    if (ids.length >= 2) { mostrarMultiple(panel, ids); return; }
    mostrarVacio(panel);
}
