from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import json
import sqlite3
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
DB = ROOT / 'zisha_designs.sqlite3'
db = sqlite3.connect(DB)
db.execute('CREATE TABLE IF NOT EXISTS designs (id INTEGER PRIMARY KEY, model TEXT, color TEXT, capacity INTEGER DEFAULT 300, has_image INTEGER, image_data TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)')
columns = {row[1] for row in db.execute('PRAGMA table_info(designs)')}
if 'capacity' not in columns: db.execute('ALTER TABLE designs ADD COLUMN capacity INTEGER DEFAULT 300')
if 'image_data' not in columns: db.execute('ALTER TABLE designs ADD COLUMN image_data TEXT')
db.commit(); db.close()

class Handler(SimpleHTTPRequestHandler):
    """Static file server plus a tiny JSON API for saved custom designs."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def _json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if urlparse(self.path).path == '/api/designs':
            connection = sqlite3.connect(DB)
            connection.row_factory = sqlite3.Row
            rows = connection.execute(
                'SELECT id, model, color, capacity, has_image, created_at '
                'FROM designs ORDER BY id DESC LIMIT 20'
            ).fetchall()
            connection.close()
            self._json({'designs': [dict(row) for row in rows]})
            return
        super().do_GET()

    def do_POST(self):
        if urlparse(self.path).path != '/api/designs':
            self.send_error(404)
            return
        try:
            length = int(self.headers.get('Content-Length', 0))
            if length <= 0 or length > 4_000_000:
                raise ValueError('invalid payload size')
            data = json.loads(self.rfile.read(length) or '{}')
            model = str(data.get('model') or '').strip()
            color = str(data.get('color') or '').strip()
            capacity = int(data.get('capacity', 300))
            if not model or not color.startswith('#') or not 100 <= capacity <= 500:
                raise ValueError('invalid design fields')
            image_data = str(data.get('imageData') or '')
            if len(image_data) > 3_000_000:
                raise ValueError('image too large')
            connection = sqlite3.connect(DB)
            cursor = connection.execute(
                'INSERT INTO designs(model,color,capacity,has_image,image_data) VALUES(?,?,?,?,?)',
                (model, color, capacity, int(bool(data.get('hasImage'))), image_data),
            )
            connection.commit(); connection.close()
            self._json({'saved': True, 'id': cursor.lastrowid}, 201)
        except (ValueError, TypeError, json.JSONDecodeError, sqlite3.Error) as error:
            self._json({'saved': False, 'error': str(error)}, 400)
    def log_message(self, *_): pass

ThreadingHTTPServer(('0.0.0.0', 8000), Handler).serve_forever()
