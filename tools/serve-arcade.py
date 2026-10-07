from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass
ThreadingHTTPServer(("127.0.0.1", 8767), Quiet).serve_forever()
