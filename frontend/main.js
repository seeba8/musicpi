let app = new Vue({
    el: '#app',
    data: {
      rootfolder: "/media",
      directories: [],
      files: [],
      currentPath: "/media",
      state: {},
      heartbeat: null,
      progressTicker: null,
      tabDir: true,
      tabFiles: false,
      tabPlaylist: false,
      tabSearch: false,
      tabRadio: false,
      playlist: [],
      searchTerm: "",
      searchResults: [],
      urlAdded: "",
      radioAdded: "",
      radioList: [],
    },
    filters: {
      pretty: function(value) {
        return JSON.stringify(value, null, 2);
      }
    },
    async mounted () {
      this.loadfolder(this.currentPath);
      this.progressTicker = window.setInterval(this.updateProgressBar,100);
      this.heartbeat = window.setInterval(this.sendHeartbeat,3000);
      this.sendHeartbeat();
      this.getPlaylist();
      window.setInterval(this.getPlaylist, 10000);
    },
    methods: {
      loadfolder: async function (path) {
        if(path.startsWith("#")) path = path.substring(1);
        if(this.currentPath === undefined) this.currentPath = "";
        this.currentPath=path;
        let resp = await fetch("/list" + encodeURIComponent((this.currentPath.startsWith("/") ? "" : "/") + this.currentPath));
        const respObj = await resp.json();
        this.directories = respObj["directories"];
        this.files = respObj["files"];
        this.currentPath = respObj["path"];
        if(this.directories.length === 0) {
          this.showFiles();
        }
        if(this.files.length === 0) {
          this.showDirectories();
        }
      },
      onFolderClick: function(event) {
        this.loadfolder(this.currentPath + '/' + event.target.dataset.dirname);
      },
      onPlaySongClick: async function(event) {
        let resp = await fetch("/playsong" + (this.currentPath.startsWith("/") ? "" : "/") 
                + encodeURIComponent(this.currentPath + "/" 
                + event.target.textContent.trim()));
        app.state = await resp.json();
      },
      onPlaySongFromSearch: async function(event) {
        console.log(event.target.textContent.trim());
        const url = "/playsong" + encodeURIComponent(event.target.textContent.trim());
        let resp = await fetch(url);
        app.state = await resp.json();
      },
      onPlayFolderClick: async function(event) {
        const resp = await fetch("/playfolder" + (this.currentPath.startsWith("/") ? "" : "/") 
                + encodeURIComponent(this.currentPath + "/" 
                + event.target.dataset.dirname));
        app.state = await resp.json();
      },
      onCurrentFolderPlay: async function(event) {
        const resp = await fetch("/playfolder" + (this.currentPath.startsWith("/") ? "" : "/") 
                + encodeURIComponent(this.currentPath));
        app.state = await resp.json();
      },
      pause: async function(event) {
        const resp = await fetch("/pause");
        app.state = await resp.json();
      },
      sendHeartbeat: async function() {
        if(document.hidden) return;
        const resp = await fetch("/heartbeat");
        const respObj = await resp.json();
        app.state = respObj;

      },
      getPlaylist: async function() {
        if(document.hidden) return;
        const resp = await fetch("/playlist");
        const respObj = await resp.json();
        app.playlist = respObj;
      },

      next: async function(event) {
        const resp = await fetch("/next");
        app.state = await resp.json();
      },
      prev: async function(event) {
        const resp = await fetch("/prev");
        app.state = await resp.json();
      },
      stop: async function(event) {
        const resp = await fetch("/stop");
        app.state = await resp.json();
      },
      onProgressClick: async function(event) {
        const targetProgress = Math.round(((event.pageX - event.target.offsetLeft) / event.target.offsetWidth)*100);
        const resp = await fetch("/seek/" + targetProgress);
        app.state = await resp.json();
      },
      onGoUpClick: async function(event) {
        this.loadfolder(String(app.currentPath).slice(0,app.currentPath.lastIndexOf("/")));
      },   
      onAddFolderClick: async function(event) {
        const resp = await fetch("/appendfolder" + (this.currentPath.startsWith("/") ? "" : "/") 
                + encodeURIComponent(this.currentPath + "/" 
                + event.target.dataset.dirname));
        app.state = await resp.json();
      } ,  
      onAddSongClick: async function(event) {
        const resp = await fetch("/appendsong" + (this.currentPath.startsWith("/") ? "" : "/") 
                 + encodeURIComponent(this.currentPath + "/" 
                 + event.target.nextElementSibling.textContent.trim()));
        app.state = await resp.json();
      },
      onAddSongFromSearch: async function(event) {
        const resp = await fetch("/appendsong" + encodeURIComponent(event.target.nextElementSibling.textContent.trim()));
        app.state = await resp.json();
      },
      onAddCurrentFolderClick: async function(event) {
        const resp = await fetch("/appendfolder" + (this.currentPath.startsWith("/") ? "" : "/") 
        + encodeURIComponent(this.currentPath));
        app.state = await resp.json();
      },
      updateProgressBar: function() {
        if(!app.state.paused) {
          app.state.current += .100;
        }
      }, 
      showDirectories: function(event) {
        app.tabDir = true;
        app.tabFiles = false;
        app.tabSearch = false;
        app.tabPlaylist = false;
        app.tabRadio = false;
      },
      showFiles: function(event) {
        app.tabDir = false;
        app.tabFiles = true;
        app.tabSearch = false;
        app.tabPlaylist = false;
        app.tabRadio = false;
      },
      showPlaylist: function(event) {
        app.tabDir = false;
        app.tabFiles = false;
        app.tabSearch = false;
        app.tabPlaylist = true;
        app.tabRadio = false;
      },
      showSearch: function(event) {
        app.tabDir = false;
        app.tabFiles = false;
        app.tabPlaylist = false;
        app.tabSearch = true;
        app.tabRadio = false;
      },
      showRadio: function(event) {
        app.tabDir = false;
        app.tabFiles = false;
        app.tabPlaylist = false;
        app.tabSearch = false;
        app.tabRadio = true;
        this.loadRadios();
      },
      breadcrumbClick: function(event) {
        console.log(event.target.dataset.pathindex);
        const finalIndex = String(app.currentPath).split("/",parseInt(event.target.dataset.pathindex)+2).join("/").length;
        console.log(String(this.currentPath).slice(0,finalIndex));
        this.loadfolder(String(this.currentPath).slice(0,finalIndex));
      },
      onPlaylistEntryClick: async function(event) {
        const resp = await fetch("/jumptosong/" + encodeURIComponent(event.target.dataset.index));
        app.state = await resp.json();
        this.getPlaylist();
      },
      onPlaylistEntryDelete: async function(event) {
        const resp = await fetch("/deletefromplaylist/" + encodeURIComponent(event.target.dataset.index));
        app.state = await resp.json();
        this.getPlaylist();
      },
      onChangePlayType: async function(event) {
        const resp = await fetch("/playtype/" + encodeURI(event.target.value));
        app.state = await resp.json();
      },
      onChangeDisplayOrder: async function(event) {
        const resp = await fetch("/displayorder/" + encodeURI(event.target.value));
        app.state = await resp.json();
        this.loadfolder(String(app.currentPath));
      },
      onReverseSort: async function(event) {
        const resp = await fetch("/reverseorder/" + app.state.reverseSort);
        app.state = await resp.json();
        this.loadfolder(String(app.currentPath));
      },
      onSearchSubmit: async function(event) {
        const resp = await fetch("/search/" + encodeURIComponent(app.searchTerm));
        const respObj = await resp.json();
        app.searchResults = respObj;
      },
      plus30: async function() {
        const resp = await fetch("/plus30");
        app.state = await resp.json();
      },
      minus30: async function() {
        const resp = await fetch("/minus30");
        app.state = await resp.json();
      },
      onRefreshSearchIndex: async function() {
        const resp = await fetch("/searchindex");
        app.state = await resp.json();
      },

      onRadioSubmit: async function() {
        console.log(app.urlAdded);
        const resp = await fetch("/addradio/" + encodeURIComponent(app.radioAdded) + "/" + btoa(app.urlAdded));
        app.radioList = await resp.json();
      },

      loadRadios: async function() {
        const resp = await fetch("/listradios");
        app.radioList = await resp.json();
      },

      onPlayRadio: async function(event) {
        const url = "/playradio/" + encodeURIComponent(event.target.textContent.trim());
        let resp = await fetch(url);
        app.state = await resp.json();
      },
      onRadioDelete: async function(e) {
        console.log(e);
        const resp = await fetch("/deleteradio/" + encodeURIComponent(e.target.previousElementSibling.textContent.trim()));
        app.radioList = await resp.json();
      }
    },


  });
if("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}
