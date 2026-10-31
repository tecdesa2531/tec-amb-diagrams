import argparse
import json
import pathlib
import re
import shutil
import socket
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

RAIZ = pathlib.Path(__file__).parent

MIMES = {
    ".html": "text/html; charset=utf-8",
    ".css":  "text/css; charset=utf-8",
    ".js":   "application/javascript; charset=utf-8",
    ".mjs":  "application/javascript; charset=utf-8",
    ".svg":  "image/svg+xml",
    ".png":  "image/png",
    ".ico":  "image/x-icon",
    ".json": "application/json; charset=utf-8",
}


def parsear_opciones():
    p = argparse.ArgumentParser(description="Ambito - editor de diagramas AWS")
    p.add_argument("--puerto",        type=int,          default=8765)
    p.add_argument("--carpeta",       type=pathlib.Path, default=pathlib.Path("./diagramas"))
    p.add_argument("--iconos",        type=pathlib.Path, default=pathlib.Path("./iconos"))
    p.add_argument("--sin-navegador", action="store_true")
    return p.parse_args()


def puerto_libre(puerto):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.bind(("127.0.0.1", puerto))
        return True
    except OSError:
        return False
    finally:
        s.close()


def mime_de(ruta):
    return MIMES.get(ruta.suffix.lower(), "application/octet-stream")


def ruta_segura(base, relativa):
    # Resuelve la ruta y verifica que quede dentro de base para evitar path traversal
    try:
        resuelta = (base / relativa).resolve()
        resuelta.relative_to(base.resolve())
        return resuelta
    except (ValueError, OSError):
        return None


def nombre_valido(nombre):
    return bool(nombre) and all(c.isalnum() or c in "-_" for c in nombre)


def _slug(texto):
    return re.sub(r'[^a-z0-9]+', '-', texto.lower()).strip('-')


def _nombre_legible(stem):
    s = re.sub(r'_\d+(_(Light|Dark))?$', '', stem)
    s = re.sub(r'^(Arch|Res|Category)_', '', s)
    s = re.sub(r'^Arch-Category-', '', s)
    return s.replace('-', ' ').replace('_', ' ').strip()


def _categoria_legible(nombre_carpeta):
    c = re.sub(r'^(Arch|Res)_', '', nombre_carpeta)
    return re.sub(r'([a-z])([A-Z])', r'\1 \2', c).strip()


def _parsear_icono(carpeta_raiz, ruta):
    nombre = ruta.name
    if nombre.startswith('Arch_'):
        tipo = 'servicio'
    elif nombre.startswith('Res_'):
        tipo = 'recurso'
    elif nombre.startswith('Category') or nombre.startswith('Arch-Category'):
        tipo = 'categoria'
    else:
        return None
    try:
        partes = ruta.parent.relative_to(carpeta_raiz).parts
    except ValueError:
        return None
    categoria = _categoria_legible(partes[0]) if partes else "General"
    nombre_l = _nombre_legible(ruta.stem)
    id_icono = tipo[0] + '-' + _slug(nombre_l)
    ruta_api = '/iconos/' + '/'.join(ruta.relative_to(carpeta_raiz).parts)
    return {"id": id_icono, "nombre": nombre_l, "categoria": categoria, "tipo": tipo, "ruta": ruta_api}


def _es_mejor_variante(nombre_nuevo, nombre_viejo):
    def puntuacion(n):
        if '_64' in n: return 3
        if '_48' in n and 'Light' not in n and 'Dark' not in n: return 2
        if '_48' in n: return 1
        return 0
    return puntuacion(nombre_nuevo) > puntuacion(nombre_viejo)


class ManejadorHTTP(BaseHTTPRequestHandler):
    carpeta_diagramas = None
    carpeta_iconos    = None

    def log_message(self, formato, *args):
        pass  # Los errores del servidor siguen visibles; el log de acceso no

    def do_GET(self):
        ruta = self.path.split("?")[0]
        if ruta == "/":
            self._servir_archivo(RAIZ / "web" / "index.html")
        elif ruta == "/api/diagramas":
            self._listar_diagramas()
        elif ruta.startswith("/api/diagramas/"):
            self._leer_diagrama(ruta[len("/api/diagramas/"):])
        elif ruta == "/api/iconos":
            self._listar_iconos()
        elif ruta.startswith("/iconos/"):
            self._servir_icono(ruta[len("/iconos/"):])
        elif ruta.startswith("/web/"):
            self._servir_estatico(ruta[len("/web/"):])
        else:
            self._responder(404, b'{"error": "no encontrado"}', "application/json")

    def do_PUT(self):
        ruta = self.path.split("?")[0]
        if ruta.startswith("/api/diagramas/"):
            self._guardar_diagrama(ruta[len("/api/diagramas/"):])
        else:
            self._responder(404, b'{"error": "no encontrado"}', "application/json")

    def _listar_diagramas(self):
        carpeta = self.carpeta_diagramas
        archivos = [p.stem for p in sorted(carpeta.glob("*.ambito")) if p.is_file()]
        cuerpo = json.dumps(archivos).encode("utf-8")
        self._responder(200, cuerpo, "application/json; charset=utf-8")

    def _leer_diagrama(self, nombre):
        if not nombre_valido(nombre):
            self._responder(400, b'{"error": "nombre invalido"}', "application/json")
            return
        ruta = ruta_segura(self.carpeta_diagramas, nombre + ".ambito")
        if ruta is None or not ruta.is_file():
            self._responder(404, b'{"error": "no encontrado"}', "application/json")
            return
        self._servir_archivo(ruta)

    def _guardar_diagrama(self, nombre):
        if not nombre_valido(nombre):
            self._responder(400, b'{"error": "nombre invalido"}', "application/json")
            return
        ruta = ruta_segura(self.carpeta_diagramas, nombre + ".ambito")
        if ruta is None:
            self._responder(400, b'{"error": "ruta invalida"}', "application/json")
            return
        longitud = int(self.headers.get("Content-Length", 0))
        cuerpo = self.rfile.read(longitud)
        try:
            obj = json.loads(cuerpo.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            msg = json.dumps({"error": f"JSON invalido: {e}"}).encode("utf-8")
            self._responder(400, msg, "application/json; charset=utf-8")
            return
        if obj.get("formato") != "ambito":
            self._responder(400, b'{"error": "formato incorrecto"}', "application/json")
            return
        if ruta.exists():
            shutil.copy2(ruta, ruta.with_suffix(".ambito.bak"))
        ruta.write_text(json.dumps(obj, indent=2, ensure_ascii=False), encoding="utf-8")
        self._responder(200, b'{"ok": true}', "application/json")

    def _listar_iconos(self):
        carpeta = self.carpeta_iconos
        if not carpeta.is_dir():
            self._responder(200, b"[]", "application/json; charset=utf-8")
            return
        vistos = {}
        for ruta in sorted(carpeta.rglob("*.svg")):
            entrada = _parsear_icono(carpeta, ruta)
            if entrada is None:
                continue
            clave = entrada["id"]
            if clave not in vistos or _es_mejor_variante(ruta.name, vistos[clave]["_nombre"]):
                vistos[clave] = {**entrada, "_nombre": ruta.name}
        iconos = [{k: v for k, v in e.items() if k != "_nombre"} for e in vistos.values()]
        cuerpo = json.dumps(iconos, ensure_ascii=False).encode("utf-8")
        self._responder(200, cuerpo, "application/json; charset=utf-8")

    def _servir_icono(self, relativa):
        ruta = ruta_segura(self.carpeta_iconos, relativa)
        if ruta is None or not ruta.is_file():
            self._responder(404, b'{"error": "no encontrado"}', "application/json")
            return
        self._servir_archivo(ruta)

    def _servir_estatico(self, relativa):
        ruta = ruta_segura(RAIZ / "web", relativa)
        if ruta is None or not ruta.is_file():
            self._responder(404, b'{"error": "no encontrado"}', "application/json")
            return
        self._servir_archivo(ruta)

    def _servir_archivo(self, ruta):
        try:
            datos = ruta.read_bytes()
            self._responder(200, datos, mime_de(ruta))
        except OSError:
            self._responder(500, b'{"error": "error interno"}', "application/json")

    def _responder(self, codigo, cuerpo, tipo):
        self.send_response(codigo)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)


def crear_servidor(opciones):
    ManejadorHTTP.carpeta_diagramas = opciones.carpeta
    ManejadorHTTP.carpeta_iconos    = opciones.iconos
    opciones.carpeta.mkdir(parents=True, exist_ok=True)
    return ThreadingHTTPServer(("127.0.0.1", opciones.puerto), ManejadorHTTP)


def iniciar():
    opciones = parsear_opciones()

    if not puerto_libre(opciones.puerto):
        sugerido = opciones.puerto + 1
        print(f"Error: el puerto {opciones.puerto} esta ocupado. Prueba con --puerto {sugerido}")
        raise SystemExit(1)

    servidor = crear_servidor(opciones)
    url = f"http://127.0.0.1:{opciones.puerto}"

    print(f"Ambito corriendo en {url}")
    print(f"Carpeta de diagramas: {opciones.carpeta.resolve()}")

    if not opciones.sin_navegador:
        # Abre el navegador en un hilo separado para no bloquear el servidor
        threading.Timer(0.3, webbrowser.open, args=[url]).start()

    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
    finally:
        servidor.server_close()


if __name__ == "__main__":
    iniciar()
