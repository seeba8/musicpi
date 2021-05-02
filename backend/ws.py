#!/usr/bin/env python3
import time
from geventwebsocket import WebSocketServer, WebSocketApplication, Resource
from collections import OrderedDict
from flask import Flask, send_file
from werkzeug.debug import DebuggedApplication
app = Flask(__name__, static_folder="../frontend", static_url_path="")
app.debug = True
class EchoApplication(WebSocketApplication):       

    def on_open(self):
        print("Connection opened")

    def on_message(self, message):
        print(message)
        self.ws.send(message)

    def on_close(self, reason):
        print(reason)

@app.route("/")
def startpage():
    return send_file('../frontend/index.html')


WebSocketServer(
    ('0.0.0.0', 5000),
    Resource(OrderedDict([('^/test', EchoApplication), 
                    ("^/.*", DebuggedApplication(app))]))
    , debug=True
).serve_forever()
