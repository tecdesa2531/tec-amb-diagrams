import argparse
import pathlib
import sys
import threading
import time
import unittest
import urllib.error
import urllib.request

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent.parent))
import ambito

PUERTO_TEST = 9877


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


if __name__ == "__main__":
    unittest.main()
