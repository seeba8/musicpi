#!/usr/bin/env python3
# To run: 
# PS> $env:FLASK_APP = "api.py"
# flask run

from flask import Flask, Response, send_file
# from flask_cors import cross_origin
# from flask_sockets import Sockets
import os
import json
import subprocess
import urllib.parse
from omxd import OMXD

app = Flask(__name__, static_folder="../frontend", static_url_path="")
# sockets = Sockets(app)
# player: mplayer.Player = None
root = "/media"
ALLOWED_EXTENSIONS = ["mp3", "aac", "ogg", "wav", "opus", "3gp", "flac", "m4a", "webm", "wma"]
SEARCH_LIMIT = 50

@app.route('/list/<path:subpath>')
def show_subpath(subpath):
    if os.sep == "/" and not str(subpath).startswith("/"):
        subpath =  "/" + subpath
    if not str(subpath).startswith(root) or ".." in str(subpath):
        subpath = root
    directory = {"directories": [], "files": [], "path": subpath}
    labels = get_mount_labels()
    print(labels)
    for (dirpath, dirnames, filenames) in os.walk(subpath):
        directory["directories"] = []
        for d in sorted(dirnames):
            if len(os.listdir(dirpath + os.sep + d)) > 0 and d != "System Volume Information":
                directory["directories"].append((d, labels[str(dirpath + os.sep + d)] if str(dirpath + os.sep + d) in labels else d))
        directory["files"] = [file for file in sorted(filenames) if file[file.rfind(".")+1:] in ALLOWED_EXTENSIONS] # file.endswith(".mp3")
        break
    return Response(json.dumps(directory,separators=None),mimetype="text/json")

def get_mount_labels():
    labels = json.loads(subprocess.run(["lsblk", "-o", "LABEL,MOUNTPOINT", "-J"], capture_output=True).stdout.decode("utf-8"))["blockdevices"]
    res = dict()
    for obj in labels:
        res[obj["mountpoint"]] = obj["label"]
    return res

@app.route('/playsong/<path:subpath>')
def playsong(subpath, append=0):
    if os.sep == "/" and not str(subpath).startswith("/"):
        subpath =  "/" + subpath
    subpath = os.path.normpath(urllib.parse.unquote(subpath))
    print(str(subpath))
    if os.path.isfile(subpath) and subpath[subpath.rfind(".")+1:] in ALLOWED_EXTENSIONS:
        if append > 0:
            OMXD.append_to_playlist(subpath)
        else:
            OMXD.interrupt_with_song(subpath)

    return getHeartbeat()

@app.route('/playfolder/<path:subpath>')
def playfolder(subpath, append=0):
    if os.sep == "/" and not str(subpath).startswith("/"):
        subpath =  "/" + subpath
    subpath = os.path.normpath(urllib.parse.unquote(subpath))
    print(str(subpath))
    if os.path.isdir(subpath):
        create_playlist(subpath)
    return getHeartbeat()

@app.route('/appendfolder/<path:subpath>')
def appendfolder(subpath):
    return playfolder(subpath, 1)

@app.route('/appendsong/<path:subpath>')
def appendsong(subpath):
    return playsong(subpath, 1)


def create_playlist(folder):
    for (dirpath, _, filenames) in os.walk(folder):
        for f in filenames:
            if f[f.rfind(".")+1:] in ALLOWED_EXTENSIONS:
                OMXD.append_to_playlist(dirpath + os.sep + f)
            #playlist.writelines([dirpath + os.sep + f + "\n" for f in filenames if f[f.rfind(".")+1:] in allowed_extensions])


def getHeartbeat():
    return json.dumps(OMXD.get_status())

@app.route('/pause')
def pause():
    OMXD.toggle_pause()
    return getHeartbeat()

@app.route('/next')
def next():
    OMXD.next()
    return getHeartbeat()


@app.route('/prev')
def prev():
    OMXD.previous()
    return getHeartbeat()

@app.route('/plus30')
def plus30():
    OMXD.plus30()
    return getHeartbeat()

@app.route('/minus30')
def minus30():
    OMXD.minus30()
    return getHeartbeat()

@app.route("/stop")
def stop():
    OMXD.stop()
    return getHeartbeat()

@app.route("/searchindex")
def refresh_searchindex():
    subprocess.Popen(["sudo updatedb"], shell=True)
    return getHeartbeat()

@app.route("/playlist")
def get_playlist():
    return Response(json.dumps(OMXD.get_playlist(),separators=None),mimetype="text/json")

@app.route("/currentsong")
def currentsong():
    return getHeartbeat()

@app.route("/jumptosong/<int:index>")
def jumptosong(index):
    OMXD.jump_to_song(index)
    return getHeartbeat()

@app.route("/deletefromplaylist/<int:index>")
def deletefromplaylist(index):
    OMXD.delete_from_playlist(index)
    return getHeartbeat()

@app.route("/heartbeat")
def heartbeat():
    return getHeartbeat()

@app.route("/seek/<int:percentage>")
def seek(percentage):
    #player.seek(percentage, 1)
    return getHeartbeat()

@app.route("/search/<string:search>")
def search(search):
    extensions = "|".join(ALLOWED_EXTENSIONS)
    results = subprocess.run(["locate", 
                                "-i", "-l", str(SEARCH_LIMIT), 
                                "--regex", search + ".*\\.({})".format(extensions) ], 
                                capture_output=True).stdout.decode("utf-8").strip().split("\n")
    print("search:" + search)
    print(results)
    return Response(json.dumps(results,separators=None), mimetype="text/json")

@app.route("/playtype/<string:playtype>")
def playtype(playtype):
    OMXD.set_playtype(playtype)
    return getHeartbeat()

# @app.route("/shuffle")
# def shuffle():
#     OMXD.toggle_shuffle()
#     return getHeartbeat()

@app.route("/")
def startpage():
    return send_file('../frontend/index.html')


# @sockets.route("/player")
# def echo_status(ws):
#     while not ws.closed:
#         message = ws.receive()
#         print(message)
#         ws.send(getHeartbeat())

if __name__ == "__main__":
    OMXD.set_playtype("once")
    app.run(host="0.0.0.0")#, port=4433)
    # app.run(host="0.0.0.0", ssl_context=("/home/pi/musicpi/backend/.ssl/musicpi.crt", "/home/pi/musicpi/backend/.ssl/musicpi.key"))#, port=4433)
    OMXD.stop()


# insert/append to playlist
# omxd a {folder} adds entire folder... don't need to do it myself

# for audioHAT, change omxd.c code from -olocal to -oalsa