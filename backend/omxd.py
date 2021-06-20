#!/usr/bin/env python3
import eyed3
import subprocess
OMXCTL = "/var/run/omxctl"
import re
class OMXD: 
    playlist_cache = dict()

    def get_playtype():
        p1 = subprocess.Popen(["grep", "m_list", "/var/log/omxlog"], stdout=subprocess.PIPE)
        p2 = subprocess.Popen(["tail", "-1"], stdin=p1.stdout, stdout=subprocess.PIPE)
        p1.stdout.close()  # Allow p1 to receive a SIGPIPE if p2 exits.
        res = p2.communicate()[0].decode("utf-8")
        if "unsorted" in res:
            return "shuffle"
        elif "end" in res:
            return "once"
        return "loop"

    def toggle_shuffle():
        if OMXD.is_shuffle():
            OMXD._send_command("l")
        else:
            OMXD._send_command("u")

    def interrupt_with_song(file):
        OMXD._send_command("I", file)

    def jump_to_song(index):
        OMXD._send_command("g", index)

    def append_to_playlist(file):
        OMXD._send_command("A", file)

    def delete_from_playlist(index):
        OMXD._send_command("x", index)
    
    def toggle_pause():
        OMXD._send_command("p")

    def stop():
        OMXD._send_command("X")
        OMXD.playlist_cache = dict()
    
    def previous():
        OMXD._send_command("N")

    def next():
        OMXD._send_command("n")

    def plus30():
        OMXD._send_command("f")

    def minus30():
        OMXD._send_command("r")

    def get_song_info(filename):
        # print("|" + filename + "|")
        try:
            song = eyed3.load(filename)
            if song is None: 
                raise Exception("song is None (no mp3 tags for example)")
            return {
                "title": song.tag.title,
                "artist": song.tag.artist,
                "album": song.tag.album,
                "length": int(song.info.time_secs),
            }
        except Exception as error:
            return {
                "title": filename,
                "artist": 'Unknown artist',
                "album": 'Unknown album',
                "length": 0,
            }

    def get_status():
        raw = OMXD.get_status_raw()
        pat = re.compile("(Playing|Paused) (\d+)\/(\d+) (.*)")
        match = pat.match(raw)
        if match is not None:
            info = OMXD.get_song_info(match.group(4))
            info["current"] = int(match.group(2))
            info["paused"] = match.group(1) == "Paused"
            info["length"] = 60 if int(match.group(3)) == 0 else int(match.group(3))
            info["playtype"] = OMXD.get_playtype()
            return info
        return raw
    
    def get_status_raw():
        process = subprocess.Popen(["omxd", "S"], stdout=subprocess.PIPE)
        output, _ = process.communicate()
        return output.decode("utf-8")
    
    def get_playlist():
        process = subprocess.Popen(["omxd", "S", "all"], stdout=subprocess.PIPE)
        output, _ = process.communicate()
        output = output.decode("utf-8")
        # print(output.splitlines()[1:])
        playlist = []
        for file in output.splitlines()[1:]:
            file_strip = file.strip("> ")
            if file_strip not in OMXD.playlist_cache:
                OMXD.playlist_cache[file_strip] = OMXD.get_song_info(file_strip)
            playlist.append(OMXD.playlist_cache[file_strip])
            playlist[-1]["current"] = file.startswith(">")
                
        return playlist

    def set_playtype(type):
        if type == "shuffle":
            OMXD._send_command("u")
        elif type == "once":
            OMXD._send_command("e")
        else:
            OMXD._send_command("l")


    def _send_command(prefix, param=""):
        with open(OMXCTL, "w") as f:
            f.write(prefix + " " + str(param) + "\n")
            # f.flush()
