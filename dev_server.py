import http.server
import socketserver
import os

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def translate_path(self, path):
        normalized = path.rstrip('/')
        if normalized == '/react-web' or path == '/react-web/index.html':
            return os.path.join(os.getcwd(), 'react-web', 'dist', 'index.html')
        if path.startswith('/react-web/assets/'):
            asset_sub = path.replace('/react-web/', '').replace('/', os.sep)
            return os.path.join(os.getcwd(), 'react-web', 'dist', asset_sub)
        return super().translate_path(path)

PORT = 8000
with socketserver.TCPServer(("", PORT), NoCacheHandler) as httpd:
    print(f"Serving at port {PORT} with NO CACHING...")
    print(f"Original Site: http://localhost:{PORT}/")
    print(f"React Web App: http://localhost:{PORT}/react-web/")
    httpd.serve_forever()