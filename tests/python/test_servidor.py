import argparse
import json
import pathlib
import sys
import tempfile
import threading
import time
import unittest
import urllib.error
import urllib.request

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent.parent))
import ambito

PUERTO_TEST = 9877
PUERTO_API  = 9878


class TestServidor(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        opciones = argparse.Namespace(
            puerto=PUERTO_TEST,
            carpeta=pathlib.Path("./diagramas"),
            iconos=pathlib.Path("./iconos"),
            sin_navegador=True,
        )
        cls.servidor = ambito.crear_servidor(opciones)
        hilo = threading.Thread(target=cls.servidor.serve_forever, daemon=True)
        hilo.start()
        time.sleep(0.15)

    @classmethod
    def tearDownClass(cls):
        cls.servidor.shutdown()
        cls.servidor.server_close()

    def test_raiz_responde_200(self):
        resp = urllib.request.urlopen(f"http://127.0.0.1:{PUERTO_TEST}/")
        self.assertEqual(resp.status, 200)

    def test_css_responde_200(self):
        resp = urllib.request.urlopen(f"http://127.0.0.1:{PUERTO_TEST}/web/css/estilos.css")
        self.assertEqual(resp.status, 200)

    def test_js_responde_200(self):
        resp = urllib.request.urlopen(f"http://127.0.0.1:{PUERTO_TEST}/web/js/app.js")
        self.assertEqual(resp.status, 200)

    def test_ruta_inexistente_devuelve_404(self):
        with self.assertRaises(urllib.error.HTTPError) as ctx:
            urllib.request.urlopen(f"http://127.0.0.1:{PUERTO_TEST}/no-existe")
        self.assertEqual(ctx.exception.code, 404)

    def test_path_traversal_rechazado(self):
        with self.assertRaises(urllib.error.HTTPError) as ctx:
            urllib.request.urlopen(f"http://127.0.0.1:{PUERTO_TEST}/web/../../ambito.py")
        self.assertEqual(ctx.exception.code, 404)


class TestAPI(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.carpeta_tmp = tempfile.TemporaryDirectory()
        opciones = argparse.Namespace(
            puerto=PUERTO_API,
            carpeta=pathlib.Path(cls.carpeta_tmp.name),
            iconos=pathlib.Path("./iconos"),
            sin_navegador=True,
        )
        cls.servidor = ambito.crear_servidor(opciones)
        hilo = threading.Thread(target=cls.servidor.serve_forever, daemon=True)
        hilo.start()
        time.sleep(0.15)

    @classmethod
    def tearDownClass(cls):
        cls.servidor.shutdown()
        cls.servidor.server_close()
        cls.carpeta_tmp.cleanup()

    def url(self, path):
        return f"http://127.0.0.1:{PUERTO_API}{path}"

    def put_json(self, path, datos):
        cuerpo = json.dumps(datos).encode("utf-8")
        req = urllib.request.Request(
            self.url(path), data=cuerpo, method="PUT",
            headers={"Content-Type": "application/json"},
        )
        return urllib.request.urlopen(req)

    def test_lista_devuelve_arreglo_json(self):
        resp = urllib.request.urlopen(self.url("/api/diagramas"))
        datos = json.loads(resp.read())
        self.assertIsInstance(datos, list)

    def test_guardar_y_leer_diagrama(self):
        doc = {
            "formato": "ambito", "version": 1,
            "documento": {"titulo": "Test", "creado": "2026-01-01T00:00:00Z", "modificado": "2026-01-01T00:00:00Z"},
            "lienzo": {"cuadricula": 10},
            "elementos": [], "conectores": [],
        }
        resp = self.put_json("/api/diagramas/test-doc", doc)
        self.assertEqual(resp.status, 200)
        resp2 = urllib.request.urlopen(self.url("/api/diagramas/test-doc"))
        leido = json.loads(resp2.read())
        self.assertEqual(leido["documento"]["titulo"], "Test")

    def test_guardar_lista_muestra_nuevo(self):
        doc = {
            "formato": "ambito", "version": 1,
            "documento": {"titulo": "Lista", "creado": "2026-01-01T00:00:00Z", "modificado": "2026-01-01T00:00:00Z"},
            "lienzo": {"cuadricula": 10},
            "elementos": [], "conectores": [],
        }
        self.put_json("/api/diagramas/mi-lista", doc)
        resp = urllib.request.urlopen(self.url("/api/diagramas"))
        datos = json.loads(resp.read())
        self.assertIn("mi-lista", datos)

    def test_formato_incorrecto_devuelve_400(self):
        doc = {"formato": "otro", "version": 1, "elementos": [], "conectores": []}
        with self.assertRaises(urllib.error.HTTPError) as ctx:
            self.put_json("/api/diagramas/mal-formato", doc)
        self.assertEqual(ctx.exception.code, 400)

    def test_nombre_invalido_devuelve_400(self):
        with self.assertRaises(urllib.error.HTTPError) as ctx:
            urllib.request.urlopen(self.url("/api/diagramas/../secreto"))
        self.assertEqual(ctx.exception.code, 400)


if __name__ == "__main__":
    unittest.main()
