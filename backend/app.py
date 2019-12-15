#!/usr/bin/env python3
# To run: 
# PS> $env:FLASK_APP = "api.py"
# flask run

from flask import Flask, Response, send_file
from flask_cors import cross_origin
import os
import json
import subprocess
import urllib.parse
import hashlib
import mplayer

app = Flask(__name__, static_folder="../frontend", static_url_path="")
player: mplayer.Player = None
root = "/media"
allowed_extensions = ["mp3", "aac", "ogg", "wav", "opus", "3gp", "flac", "m4a", "webm", "wma"]

@app.route('/list/<path:subpath>')
@cross_origin()
def show_subpath(subpath):
    if not str(subpath).startswith("/"):
        subpath =  "/" + subpath
    if not str(subpath).startswith(root) or ".." in str(subpath):
        subpath = root
    directory = {"directories": [], "files": [], "path": subpath}
    for (_, dirnames, filenames) in os.walk(subpath):
        directory["directories"] = dirnames
        directory["files"] = [file for file in filenames if file[file.rfind(".")+1:] in allowed_extensions] # file.endswith(".mp3")
        break
    return Response(json.dumps(directory,separators=None),mimetype="text/json")

@app.route('/playsong/<path:subpath>')
@cross_origin()
def playsong(subpath):
    if not str(subpath).startswith("/"):
        subpath =  "/" + subpath
    subpath = os.path.normpath(urllib.parse.unquote(subpath))
    print(str(subpath))
    if os.path.isfile(subpath) and subpath.endswith(".mp3"):
        global player 
        if player is None:
            player = mplayer.Player()
        player.loadfile(subpath)
        # if player.paused:
            # player.pause()
    return getHeartbeat()

@app.route('/playfolder/<path:subpath>')
@cross_origin()
def playfolder(subpath):
    if not str(subpath).startswith("/"):
        subpath =  "/" + subpath
    subpath = os.path.normpath(urllib.parse.unquote(subpath))
    print(str(subpath))
    if os.path.isdir(subpath):
        playlist_path = create_playlist(subpath)
        global player 
        if player is None:
            player = mplayer.Player()
        player.loadlist(playlist_path)
        if player.paused:
            player.pause()
    return getHeartbeat()

def create_playlist(folder):
    dirname = os.path.dirname(__file__)
    filename = os.path.join(dirname, "../playlists/" + hashlib.sha256(folder.encode("utf-8")).hexdigest() + ".m3u")
    with open(filename, "w") as playlist:
        for (dirpath, _, filenames) in os.walk(folder):
            print(dirpath)
            print(filenames)
            playlist.writelines([dirpath + os.sep + f + "\n" for f in filenames if f[f.rfind(".")+1:] in allowed_extensions])
    return filename

def getHeartbeat():
    global player
    if player is None: 
        return json.dumps({
        })
    metadata = {}
    if player.metadata is not None:
        metadata = player.metadata
    return json.dumps({
        "title": metadata.get('Title', player.filename),
        "artist": metadata.get('Artist', 'Unknown artist'),
        "album": metadata.get('Album', 'Unknown album'),
        "length": player.length,
        "current": player.time_pos,
        "paused": player.paused,
    })

@app.route('/pause')
@cross_origin()
def pause():
    global player 
    player.pause()
    return getHeartbeat()

@app.route('/next')
@cross_origin()
def next():
    global player 
    player.pt_step(1)
    return getHeartbeat()


@app.route('/prev')
@cross_origin()
def prev():
    global player 
    player.pt_step(-1)
    return getHeartbeat()


@app.route("/stop")
@cross_origin()
def stop():
    global player
    player.stop()
    return getHeartbeat()


@app.route("/currentsong")
@cross_origin()
def currentsong():
    global player
    return getHeartbeat()


@app.route("/heartbeat")
@cross_origin()
def heartbeat():
    return getHeartbeat()

@app.route("/seek/<int:percentage>")
@cross_origin()
def seek(percentage):
    player.seek(percentage, 1)
    return getHeartbeat()

@app.route("/")
@cross_origin()
def startpage():
    return send_file('../frontend/index.html')

if __name__ == "__main__":
    app.run(host="0.0.0.0")
