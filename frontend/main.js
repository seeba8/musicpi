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
    },
    filters: {
      pretty: function(value) {
        console.dir(value);
        return JSON.stringify(value, null, 2);
      }
    },
    async mounted () {
      this.loadfolder(this.currentPath);
      this.progressTicker = window.setInterval(this.updateProgressBar,100);
      this.heartbeat = window.setInterval(this.sendHeartbeat,3000);
      this.sendHeartbeat();
    },
    methods: {
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
        console.log(event);
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
        console.log(targetProgress);
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
      }  ,   
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
    },

  });
