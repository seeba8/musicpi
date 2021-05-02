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
    playlist: [],
    ws: null
  },
  filters: {
    pretty: function(value) {
      return JSON.stringify(value, null, 2);
    }
  },
  mounted () {
    this.ws = new WebSocket("ws://" + window.location.host + "/test");
    this.ws.addEventListener("open", this.onWSOpen);
    this.ws.addEventListener("message", this.onMessage);
    this.loadfolder(this.currentPath);
    this.progressTicker = window.setInterval(this.updateProgressBar,100);
    //this.heartbeat = window.setInterval(this.sendHeartbeat,3000);
    this.sendHeartbeat();
    this.getPlaylist();
    //window.setInterval(this.getPlaylist, 10000);
  },
  methods: {
    onWSOpen: function() {
      this.ws.send(JSON.stringify({list: this.currentPath, status}));
    },
    loadfolder: async function (path) {
      if(path.startsWith("#")) path = path.substring(1);
      if(this.currentPath === undefined) this.currentPath = "";
      this.currentPath=path;
      let resp = await fetch("/list" + (this.currentPath.startsWith("/") ? "" : "/") + this.currentPath);
      const respObj = await resp.json();
      this.directories = respObj["directories"];
      this.files = respObj["files"];
      this.currentPath = respObj["path"];
    },
    onFolderClick: function(event) {
      this.loadfolder(this.currentPath + '/' + event.target.textContent);
    },
    onPlaySongClick: async function(event) {
      let resp = await fetch("/playsong" + (this.currentPath.startsWith("/") ? "" : "/") 
              + encodeURIComponent(this.currentPath + "/" 
              + event.target.textContent.trim()));
      app.state = await resp.json();
    },
    onPlayFolderClick: async function(event) {
      const resp = await fetch("/playfolder" + (this.currentPath.startsWith("/") ? "" : "/") 
              + encodeURIComponent(this.currentPath + "/" 
              + event.target.nextElementSibling.nextElementSibling.textContent.trim()));
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
              + event.target.nextElementSibling.textContent.trim()));
      app.state = await resp.json();
    } ,  
    onAddSongClick: async function(event) {
      const resp = await fetch("/appendsong" + (this.currentPath.startsWith("/") ? "" : "/") 
               + encodeURIComponent(this.currentPath + "/" 
               + event.target.nextElementSibling.textContent.trim()));
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
      app.tabPlaylist = false;
    },
    showFiles: function(event) {
      app.tabDir = false;
      app.tabFiles = true;
      app.tabPlaylist = false;
    },
    showPlaylist: function(event) {
      app.tabDir = false;
      app.tabFiles = false;
      app.tabPlaylist = true;
    },
    breadcrumbClick: function(event) {
      console.log(event.target.dataset.pathindex);
      const finalIndex = String(app.currentPath).split("/",parseInt(event.target.dataset.pathindex)+2).join("/").length;
      console.log(String(this.currentPath).slice(0,finalIndex));
      this.loadfolder(String(this.currentPath).slice(0,finalIndex));
    }
  },

});
