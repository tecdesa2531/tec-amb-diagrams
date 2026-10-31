import argparse
import pathlib
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


class ManejadorHTTP(BaseHTTPRequestHandler):
    carpeta_diagramas = None
    carpeta_iconos    = None

    def log_message(self, formato, *args):
        pass  # Los errores del servidor siguen visibles; el log de acceso no

    def do_GET(self):
        ruta = self.path.split("?")[0]
        if ruta == "/":
            self._servir_archivo(RAIZ / "web" / "index.html")
        elif ruta.startswith("/web/"):
            self._servir_estatico(ruta[len("/web/"):])
        else:
            self._responder(404, b'{"error": "no encontrado"}', "application/json")

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
