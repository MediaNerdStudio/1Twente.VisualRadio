// GLOBAL SETTINGS
let globalSettings = require("./1T.VisualRadio.Config");
let userSettings;

const path = require('node:path')

// Terminal Colors
let term = require("terminal-kit").terminal;

// Node File System
let fs = require("fs");

// MOMENT
let moment = require("moment");
moment.locale("nl");

// TimerThingy
let timexe = require("timexe");

const axios = require("axios");

// ELECTRON
const { app, BrowserWindow } = require('electron/main');
let appWindow;

// Appserver / Init
let webExpress = require("express");
let webApp = webExpress();

// Appserver / Body Parser
var webBodyParser = require("body-parser");
webApp.use(
  webBodyParser.urlencoded({
    extended: false,
  })
);
webApp.use(webBodyParser.json());

webApp.use("/", webExpress.static(`${__dirname}/assets/`));
webApp.use("/node_modules", webExpress.static(`${__dirname}/node_modules/`));

//STATIC | TEMPLATES
webApp.get("/1T.VisualRadio.Config.json", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", 0);
  res.json(globalSettings);
});

webApp.get("/TekstTV", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", 0);
  res.sendFile(`${__dirname}/assets/1T.VisualRadio.TekstTV.html`);
});

webApp.get("/api/reload/teksttv", (req, res) => {
  socketIO_Connector.to("templates").emit("reload|teksttv");
  res.json({ success: true, message: "TekstTV reload triggered" });
});

webApp.get("/Overlay", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", 0);
  res.sendFile(`${__dirname}/assets/1T.VisualRadio.Overlay.html`);
});

webApp.get("/Background", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", 0);
  res.sendFile(`${__dirname}/assets/1T.VisualRadio.Background.html`);
});

// STATIC | UI | PLUGINS
webApp.use(
  "/plugins/jquery/",
  webExpress.static(`${__dirname}/node_modules/jquery/dist/`)
);

webApp.use(
  "/plugins/gsap/",
  webExpress.static(`${__dirname}/node_modules/gsap/dist/`)
);

webApp.use(
  "/plugins/timexe/",
  webExpress.static(`${__dirname}/node_modules/timexe/`)
);

webApp.use(
  "/plugins/jquery-ui/",
  webExpress.static(`${__dirname}/node_modules/jquery-ui/dist/`)
);
webApp.use(
  "/plugins/bootstrap/",
  webExpress.static(`${__dirname}/node_modules/bootstrap/dist/`)
);
webApp.use(
  "/plugins/socket.io-client/",
  webExpress.static(`${__dirname}/node_modules/socket.io-client/dist/`)
);

webApp.use(
  "/plugins/luxon/",
  webExpress.static(`${__dirname}/node_modules/luxon/build/global/`)
);

webApp.use(
  "/plugins/animejs/",
  webExpress.static(`${__dirname}/node_modules/animejs/lib/`)
);

webApp.use(
  "/plugins/gsap/",
  webExpress.static(`${__dirname}/node_modules/gsap/dist/`)
);

// Appserver / Attach / Attach Socketio
let socketio = require("socket.io");
let httpServer = require("http").createServer(webApp);

// SOCKET.IO
const socketIO_Connector = socketio(httpServer, {
  cors: {
    origin: "*",
  },
});

let savedData = {
  newsItems: [],
  newsItemsFull: [],
  EPG: {
    enschede: {
      OnAir: null,
      Upcoming: null,
      Today: null,
      Tomorrow: null,
    },
    hengelo: {
      OnAir: null,
      Upcoming: null,
      Today: null,
      Tomorrow: null,
    },
    twentefm: {
      OnAir: null,
      Upcoming: null,
      Today: null,
      Tomorrow: null,
    },
  },
  nowPlaying: undefined,
  sports: {
    soccer: {
      competitions: ['Eredivisie', 'KKD', 'TweedeDivisie', 'VrouwenEredivisie', 'KNVBBeker', 'HV_Landelijk', 'HV_Oost'],
      standings: [],
      scoreboards: []
    }
  }
};

init();

// SOCKETIO CONNECTOR ########################################
function socketIOConnector() {
  // SOCKET IO OPEN
  socketIO_Connector.on("connection", (socket) => {
    if(appWindow.webContents){
      appWindow.webContents.send('log-data', {
        message: `${moment().format(
        "YYYY-MM-DD HH:mm:ss.SSS"
      )}\t\tSOCKET.IO\t| Client Connected:\t[${socket.handshake.query.room}]\t\t| ID: ${socket.id}`,
        type: 'socketio'
      });
    }
    
    let roomName = socket.handshake.query.room;
    socket.join(roomName);

    if (roomName === "templates") {
      socket.emit("globalsettings", globalSettings);
      socket.emit("data|news", savedData.newsItemsFull);
      socket.emit("data|epg", savedData.EPG);
      
      socket.emit("nowplaying", savedData.nowPlaying);
      
      socket.emit("socialMessages", savedData.socialMessages);

      socket.emit("data|weather", globalSettings.API.weather);
      
      socket.emit("data|sports|soccer", savedData.sports.soccer);
    }

    if (roomName === "CasparCG") {
      socket.emit("usersettings", userSettings);
    }

    // Disconnect
    socket.on("disconnect", () => {
      if (roomName == "web") {
        if(appWindow.webContents){
          appWindow.webContents.send('log-data', {
            message: `${moment().format(
            "YYYY-MM-DD HH:mm:ss.SSS"
          )}\t\tSOCKET.IO\t| Client Disconnected:\t[${socket.handshake.query.room}]\t\t| ID: ${socket.id}`,
            type: 'socketio'
          });
        }
        term(
          `${moment().format(
            "YYYY-MM-DD HH:mm:ss.SSS"
          )}\t^#^r^W SOCKET.IO ^ \tClient Disconnected:\t[${socket.handshake.query.room}]\t\tID: ${socket.id}\n`
        );
      }

      if (roomName == "templates") {
        if(appWindow.webContents){
          appWindow.webContents.send('log-data', {
            message: `${moment().format(
            "YYYY-MM-DD HH:mm:ss.SSS"
          )}\t\tSOCKET.IO\t|\tClient Disconnected:\t[${socket.handshake.query.room}]\t\t|\tID: ${socket.id}`,
            type: 'socketio'
          });
        }
        term(
          `${moment().format(
            "YYYY-MM-DD HH:mm:ss.SSS"
          )}\t^#^r^W SOCKET.IO ^ \tClient Disconnected:\t[${socket.handshake.query.room}]\t\tID: ${socket.id}\n`
        );
      }
    });

    // DATA | NEWS
    socket.on("data|news", (dataNews_Received) => {
      savedData.newsItemsFull = dataNews_Received;
      socketIO_Connector
        .to("templates")
        .emit("data|news", savedData.newsItemsFull);
    });

    // DATA | NEWS
    socket.on("nowplaying", (nowplaying_Received) => {
      savedData.nowPlaying = nowplaying_Received;
      socketIO_Connector
        .to("templates")
        .emit("nowplaying", savedData.nowPlaying);
        socketIO_Connector
        .to("CasparCG")
        .emit("nowplaying", savedData.nowPlaying);
    });

    socket.on("socialMessages", (socialMessages) => {
      savedData.socialMessages = socialMessages;
      socketIO_Connector
        .to("templates")
        .emit("socialMessages", savedData.socialMessages);
    });

    // DATA | EPG
    socket.on("data|epg", (dataEPG_Received) => {
      savedData.EPG = dataEPG_Received;
      socketIO_Connector.to("templates").emit("data|epg", savedData.EPG);
    });
    
    // DATA | WEATHER
    socket.on("data|weather", (dataWeather_Received) => {
      savedData.weather = dataWeather_Received;
      socketIO_Connector.to("templates").emit("data|weather", globalSettings.API.weather);
    });
  });
}

function init() {
  startServer();
  desktopCreate();
  socketIOConnector();
  cron_getWeather();
  cron_getAllNews();
  cron_getAllEPG(globalSettings.API.edition);
  cron_getSports();

  // TIMER || 1Minute
  timexe(`* * * * *`, () => {
    cron_getAllEPG(globalSettings.API.edition);
    cron_getSports();
  });

  // TIMER || 5minutes
  timexe(`* * * * /5`, () => {
    cron_getAllNews();
  });

  // TIMER || 15minutes
  timexe(`* * * * /15`, () => {
    cron_getWeather();
  });

  // TIMER || 1 second
  timexe(`* * * * * *`, () => {
    cron_getNowplaying();
  });
}

function startServer() {
  httpServer.listen(globalSettings.appserver.ui, () => {
    if(appWindow &&appWindow.webContents){
      appWindow.webContents.send('log-data', {
        message: `${moment().format(
        "YYYY-MM-DD HH:mm:ss.SSS"
      )}\tAPPSERVER\t| 1Twente API\t\t| UI Appserver running on port: ${
        globalSettings.appserver.ui
      }`,
        type: 'appserver'
      });
    }
    term(
      `${moment().format(
        "YYYY-MM-DD HH:mm:ss.SSS"
      )}	^#^c^W APPSERVER ^\t\t| Appserver\t\t| UI running on port: ${
        globalSettings.appserver.ui
      }\n`
    );
  });
} 

// CRONS ########################################
function cron_getNowplaying() {
  getNowPlaying((err, nowplaying) => {
    if (
      !savedData.nowPlaying ||
      (savedData.nowPlaying &&
        nowplaying[0] &&
        nowplaying[0].createdAt != savedData.nowPlaying[0].createdAt)
    ) {
      savedData.nowPlaying = nowplaying;
      if (socketIO_Connector) {
        socketIO_Connector.emit("nowplaying", nowplaying);
      }
    }
  });
}

function cron_getAllEPG(edition) {
  let count = 0;
  let total = 4;

  getEPGNow(edition, (err, epgOnAir) => {
    if (!err) {
      savedData.EPG[edition].OnAir = epgOnAir;
      count++;
      check(count, total);
    }
  });

  getEPGUpcoming(edition, (err, epgUpcoming) => {
    if (!err) {
      savedData.EPG[edition].Upcoming = epgUpcoming;
      count++;
      check(count, total);
    }
  });

  getEPGToday(edition, (err, epgToday) => {    
    if (!err) {
      savedData.EPG[edition].Today = epgToday;
      count++;
      check(count, total);
    }
  });

  getEPGTomorrow(edition, (err, EPGTomorrow) => {
    if (!err) {
      savedData.EPG[edition].Tomorrow = EPGTomorrow;
      count++;
      check(count, total);
    }
  });

  function check(count, total) {
    if (count === total) {
      socketIO_Connector.emit("data|epg", savedData.EPG);
      term(
        `${moment().format(
          "YYYY-MM-DD HH:mm:ss.SSS"
        )}\t^#^c^W EPG ^ \t\t| 1Twente API\t\t| Grabbed all EPG Data for: ${edition}\n`
      );
    }
  }
}

// CRON JOB GET ALL NEWS
function cron_getAllNews() {
  getNewsOverview((err, newsMessages) => {    
    if (!err && newsMessages) {
      savedData.newsItems = newsMessages;
      let count = 0;

      let newsItemsFull = [];
      savedData.newsItems.forEach((singleItem) => {
        getNewsItem(singleItem.id, (err, newsItem) => {

          if(newsItem){
            newsItemsFull.push(newsItem);
          }
          else{
            console.log(singleItem.id);            
          }          
          
          count++;
          if (count === savedData.newsItems.length) {
            savedData.newsItemsFull = newsItemsFull;
            socketIO_Connector.emit("data|news", savedData.newsItemsFull);
            term(
              `${moment().format(
                "YYYY-MM-DD HH:mm:ss.SSS"
              )}\t^#^c^W NEWS ^ \t\t| 1Twente API\t\t| Grabbed all full news items\n`
            );
          }
        });
      });
    } else if (!newsMessages) {
      term(
        `${moment().format(
          "YYYY-MM-DD HH:mm:ss.SSS"
        )}\t^#^r^W NEWS ^ \t\t| 1Twente API\t\t| There was a problem with the full news items\n`
      );
    }
  });
}

function cron_getWeather() {
  let dateTime = moment().startOf('minute').subtract(moment().minute() % 15, 'minutes').format("YYYY-MM-DDTHH:mm:ss[Z]");
  let checkCount = {
    count: 0,
    total: (globalSettings.API.weather.locations.length * 2) + 1
  }
  
  getWeatherWarnings(globalSettings.API.weather.locations[0].location, (err, weatherWarnings) => {
    if (!err) {
      globalSettings.API.weather.warnings = weatherWarnings.data;  
      checkCount.count++;      
      if(checkCount.count === checkCount.total){
        sendWeatherData()
      }
    }
  });

  globalSettings.API.weather.locations.forEach((location ,index) => {
    getWeatherForecastHours(location.location, dateTime, (err, weatherData) => {
      if (!err) {
        globalSettings.API.weather.locations[index].forecast_hours = weatherData.data;      
        checkCount.count++;
        if(checkCount.count === checkCount.total){      
          sendWeatherData()
        }
      }
    })
    getWeatherForecastDays(location.location, dateTime, (err, weatherData) => {
      if (!err) {
        globalSettings.API.weather.locations[index].forecast_days = weatherData.data;      
        checkCount.count++;
        if(checkCount.count === checkCount.total){
          sendWeatherData()
        }
      }
    })
  })
}

function cron_getSports(){
  getSports((err, sportsData) => {
    if (!err) {
      socketIO_Connector.emit("data|sports|soccer", savedData.sports.soccer);
    }
  });
}

function sendWeatherData(){
   if(appWindow.webContents){
      appWindow.webContents.send('log-data', {
        message: `${moment().format(
        "YYYY-MM-DD HH:mm:ss.SSS"
      )}\tWEATHER\t| Weer.nl\t\t| Grabbed all weather Data\n`,
        type: 'weather'
      });
    }

  term(
    `${moment().format(
      "YYYY-MM-DD HH:mm:ss.SSS"
    )}\t^#^c^W WEATHER ^ \t| Weer.nl\t\t| Grabbed all weather Data\n`
  );
  socketIO_Connector.emit("data|weather", globalSettings.API.weather);
}

// API CALLS ########################################
// GET NOWPLAYING
function getNowPlaying(callback) {  
  eenTwenteApi_GET(
    [
      globalSettings.API.EenTwente.baseURL,
      globalSettings.API.EenTwente.nowplaying[globalSettings.API.edition_nowplaying].last_10,
    ],
    (err, nowplaying) => {
      callback(undefined, nowplaying);
    }
  );
}

// GET ALL NEWS MESSAGES
function getNewsOverview(callback) {
  eenTwenteApi_GET(
    [
      globalSettings.API.EenTwente.baseURL,
      globalSettings.API.EenTwente.newsOverview,
    ],
    (err, newsMessages) => {      
      if(newsMessages && newsMessages.length > 0){
        if(appWindow.webContents){
          appWindow.webContents.send('log-data', {
            message: `${moment().format(
              "YYYY-MM-DD HH:mm:ss.SSS"
            )}\tNEWS\t\t| 1Twente API\t\t| Grabbed all news items\n`,
            type: 'news'
          });
        }
        
        term(
          `${moment().format(
            "YYYY-MM-DD HH:mm:ss.SSS"
          )}\t^#^c^W NEWS ^ \t\t| 1Twente API\t\t| Grabbed all news items\n`
        );

        let filteredMessages = [];

        if (newsMessages && newsMessages.length > 0) {
          newsMessages.forEach((message) => {
            if (message.enabledTextTv === true) {
              filteredMessages.push(message);
            }
          });
        }
        callback(undefined, filteredMessages);
      }
      else{
        callback(err, null);
      }
    }
  );
}

// GET SINGLE NEWS MESSAGE
function getNewsItem(newsId, callback) {
  eenTwenteApi_GET(
    [
      globalSettings.API.EenTwente.baseURL,
      globalSettings.API.EenTwente.newsItem,
      newsId,
    ],
    (err, newsItem) => {
      if(newsItem && newsItem.id){
        if(appWindow.webContents){
          appWindow.webContents.send('log-data', {
            message: `${moment().format(
            "YYYY-MM-DD HH:mm:ss.SSS"
          )}\tNEWS\t\t\t| 1Twente API\t\t| Grabbed single news item: ${newsId}`,
            type: 'news'
          });
        }
        term(
          `${moment().format(
            "YYYY-MM-DD HH:mm:ss.SSS"
          )}\t^#^c^W NEWS ^\t\t\t| 1Twente API\t\t| Grabbed single news item: ${newsId}\n`
        );
        callback(undefined, newsItem);

      }
      else{
        callback(err, null);
      }
    }
  );
}

// GET EPG NOW
function getEPGNow(edition, callback) {
  eenTwenteApi_GET(
    [
      globalSettings.API.EenTwente.baseURL,
      globalSettings.API.EenTwente.EPG[edition].OnAir,
    ],
    (err, epgData) => {
      if(epgData && epgData.title){
        if(appWindow.webContents){
          appWindow.webContents.send('log-data', {
            message: `${moment().format(
            "YYYY-MM-DD HH:mm:ss.SSS"
          )}\tEPG\t| 1Twente API\t\t| Grabbed EPG Now: ${edition}`,
            type: 'epg'
          });
        }
        
        term(
          `${moment().format(
            "YYYY-MM-DD HH:mm:ss.SSS"
          )}\t^#^c^W EPG ^ \t\t| 1Twente API\t\t| Grabbed EPG Now: ${edition}\n`
        );
        callback(undefined, epgData);
      } else {
        callback(err, undefined);
      }
      
    }
  );
}

// GET EPG UPCOMING
function getEPGUpcoming(edition, callback) {
  eenTwenteApi_GET(
    [
      globalSettings.API.EenTwente.baseURL,
      globalSettings.API.EenTwente.EPG[edition].Upcoming,
    ],
    (err, epgData) => {      
      if(epgData && epgData.title){
        if(appWindow.webContents){
          appWindow.webContents.send('log-data', {
            message: `${moment().format(
            "YYYY-MM-DD HH:mm:ss.SSS"
          )}\tEPG\t| 1Twente API\t\t| Grabbed EPG Upcoming: ${edition}`,
            type: 'epg'
          });
        }
        term(
          `${moment().format(
            "YYYY-MM-DD HH:mm:ss.SSS"
          )}\t^#^c^W EPG ^ \t\t| 1Twente API\t\t| Grabbed EPG Upcoming: ${edition}\n`
        );
        callback(undefined, epgData);
      } else {
        callback(err, undefined);
      }
    }
  );
}

// GET EPG TODAY
function getEPGToday(edition, callback) {
  eenTwenteApi_GET(
    [
      globalSettings.API.EenTwente.baseURL,
      globalSettings.API.EenTwente.EPG[edition].Today,
    ],
    (err, epgData) => {
      
     if(epgData && epgData.length > 0){
       if(appWindow.webContents){
          appWindow.webContents.send('log-data', {
            message: `${moment().format(
            "YYYY-MM-DD HH:mm:ss.SSS"
          )}\tEPG\t\t| 1Twente API\t\t| Grabbed EPG Today: ${edition}`,
          type: 'epg'
          });
        }
        
        term(
          `${moment().format(
            "YYYY-MM-DD HH:mm:ss.SSS"
          )}\t^#^c^W EPG ^ \t\t| 1Twente API\t\t| Grabbed EPG Today: ${edition}\n`
        );
        callback(undefined, epgData);
      }
      else{
        callback(err, undefined);
      }
    }
  );
}

// GET EPG TOMORROW
function getEPGTomorrow(edition, callback) {
  eenTwenteApi_GET(
    [
      globalSettings.API.EenTwente.baseURL,
      globalSettings.API.EenTwente.EPG[edition].Tomorrow,
      moment().add(1, "d").format("DD-MM-YYYY"),
    ],
    (err, epgData) => {
      if(epgData && epgData.length > 0){
        if(appWindow.webContents){
          appWindow.webContents.send('log-data', {
            message: `${moment().format(
            "YYYY-MM-DD HH:mm:ss.SSS"
          )}\t\tEPG\t| 1Twente API\t\t| Grabbed EPG Tomorrow: ${edition}`,
            type: 'epg'
          });
        }
          term(
            `${moment().format(
              "YYYY-MM-DD HH:mm:ss.SSS"
            )}\t^#^c^W EPG ^ \t\t| 1Twente API\t\t| Grabbed EPG Tomorrow: ${edition}\n`
          );
          callback(undefined, epgData);
      }
      else{
        callback(err, undefined);
      }
    }
  );
}

function eenTwenteApi_GET(url, callback) {
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: url.join(""),
    headers: {},
  };
  axios
    .request(config)
    .then((response) => {
      callback(undefined, response.data);
    })
    .catch((error) => {
      callback(error, undefined);
    });
}

// WEATHER /////////////////////////////////////////

function getWeatherWarnings(location, callback) {
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: globalSettings.API.weather.api.warnings.replace("<LONG>", Math.round(location[0], 1)).replace("<LAT>", Math.round(location[1], 1)),
    headers: {},
  };
  axios
    .request(config)
    .then((response) => { 
      callback(undefined, response.data);
    })
    .catch((error) => {
      callback(error, undefined);
    });
}

function getWeatherForecastHours(location, dateTime, callback) {
  // https://api.weer.nl/v1/weather/forecast/hours?location=6.9,52.2&time=2026-01-11T17:00:00.000Z&hours=25&timestamp=2026-01-11T17:00:00.000Z
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: globalSettings.API.weather.api.forecast_hours.replace("<LONG>", Math.round(location[0], 1)).replace("<LAT>", Math.round(location[1], 1)).replace("<DATETIME>", dateTime),
    headers: {},
  };
  axios
    .request(config)
    .then((response) => {      
      callback(undefined, response.data);
    })
    .catch((error) => {
      callback(error, undefined);
    });
}

function getWeatherForecastDays(location, dateTime, callback) {
  // https://api.weer.nl/v1/weather/forecast/days?location=6.7,52.4&date=2026-01-10T13:00:00.000Z&days=14
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: globalSettings.API.weather.api.forecast_days.replace("<LONG>", Math.round(location[0], 1)).replace("<LAT>", Math.round(location[1], 1)).replace("<DATETIME>", dateTime),
    headers: {},
  };
  axios
    .request(config)
    .then((response) => {      
      callback(undefined, response.data);
    })
    .catch((error) => {
      callback(error, undefined);
    });
}

// SPORTS /////////////////////////////////////////

function getSports(callback){
  let sportsCount = {
    standings: 0,
    scoreboards: 0
  }

  savedData.sports.soccer.competitions.forEach((league, index) => {
    if(league == 'Eredivisie' || league == 'KKD' || league == 'TweedeDivisie' || league == 'VrouwenEredivisie' || league == 'KNVBBeker'){
      getSportsESPN(league, 'stand', (err, standings) =>{
        savedData.sports.soccer.standings[index] = standings.groups;
        sportsCount.standings++;
        checkCount()
      })
      getSportsESPN(league, 'scorebord', (err, scoreboards) =>{
        savedData.sports.soccer.scoreboards[index] = scoreboards.gmsByLeague[0];
        sportsCount.scoreboards++;
        checkCount()
      })
    }
    else if(league == 'HV_Landelijk' || league == 'HV_Oost'){
      getSportsHollandseVelden(league, (err, leagueData) =>{
        savedData.sports.soccer.standings[index] = leagueData;
        sportsCount.standings++;
        sportsCount.scoreboards++;
        checkCount()
      })
    }    
  })

  function checkCount(){
    if(sportsCount.standings == savedData.sports.soccer.competitions.length && sportsCount.scoreboards == savedData.sports.soccer.competitions.length){
      if(appWindow.webContents){
        appWindow.webContents.send('log-data', {
          message: `${moment().format(
          "YYYY-MM-DD HH:mm:ss.SSS"
        )}\tSPORTS\t\t| ESPN\t\t| Grabbed Standings and Scoreboards`,
          type: 'epg'
        });
      }
      
      term(
        `${moment().format(
          "YYYY-MM-DD HH:mm:ss.SSS"
        )}\t^#^c^W SPORTS ^\t\t| ESPN\t\t\t| Grabbed Standings and Scoreboards\n`
      );
      callback(undefined, savedData.sports.soccer);
    }
  }
}

function getSportsESPN(league, type, callback){  
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: `https://medianerdstudio.com/api/espn.php?f=json&league=${league}&type=${type}`,
    headers: {},
  };
  axios
    .request(config)
    .then((response) => {
      callback(undefined, response.data);
    })
    .catch((error) => {
      callback(error, undefined);
    });
}

function getSportsHollandseVelden(league, callback){  
  let url;
  if(league == "HV_Landelijk"){
    url = `https://medianerdstudio.com/api/hollandsevelden.php?f=json&c=2025-2026/landelijk`;
  }
  else if(league == "HV_Oost"){
    url = `https://medianerdstudio.com/api/hollandsevelden.php?f=json&c=2025-2026/oost`;
  }
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: url,
    headers: {},
  };
  axios
    .request(config)
    .then((response) => {
      callback(undefined, response.data);
    })
    .catch((error) => {
      callback(error, undefined);
    });
}


function desktopCreate(){
  app.whenReady().then(() => {
    desktopCreate_Window()
  
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        desktopCreate_Window()
      }
    })
  })
  
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}

function desktopCreate_Window () {
  appWindow = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, './assets/js/1T.VisualRadio.App.Preload.js')
    },
    backgroundColor: "#000",
    autoHideMenuBar: true,
    icon: __dirname + "/icons/win/1T.VisualRadio.ico",
  })

  appWindow.loadFile('./assets/index.html');
}

////////////////////////////////////////////////////////////////////////////////////
// OTHER FUNCTIONS /////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

// Get Time Function
let getTime = {
  // DATE TIME NOW - TIMECODE
  currentTimecode: () => {
    let MyDate = new Date();
    let MyDateString;
    MyDate.setDate(MyDate.getDate());
    let frames = Math.floor(MyDate.getMilliseconds() / 40);
    MyDateString =
      (" 0" + MyDate.getHours()).slice(-2) +
      ":" +
      (" 0" + MyDate.getMinutes()).slice(-2) +
      ":" +
      (" 0" + MyDate.getSeconds()).slice(-2) +
      "." +
      (" 0" + frames).slice(-2);
    return MyDateString;
  },

  // DATE TIME NOW
  nowDateTime: () => {
    let MyDate = new Date();
    let MyDateString;
    MyDate.setDate(MyDate.getDate());
    MyDateString =
      MyDate.getFullYear() +
      "-" +
      ("0" + (MyDate.getMonth() + 1)).slice(-2) +
      "-" +
      (" 0" + MyDate.getDate()).slice(-2) +
      " " +
      (" 0" + MyDate.getHours()).slice(-2) +
      ":" +
      (" 0" + MyDate.getMinutes()).slice(-2) +
      ":" +
      (" 0" + MyDate.getSeconds()).slice(-2);
    return MyDateString;
  },

  nowDate: () => {
    let MyDate = new Date();
    let MyDateString;
    MyDate.setDate(MyDate.getDate());
    MyDateString =
      MyDate.getFullYear() +
      "-" +
      ("0" + (MyDate.getMonth() + 1)).slice(-2) +
      "-" +
      (" 0" + MyDate.getDate()).slice(-2);
    return MyDateString;
  },

  // FIX TIMEZONE ISSUE
  fixTimezone: (date) => {
    let offsetDate = new Date();
    let tzDifference = offsetDate.getTimezoneOffset() * 60 * 1000;

    let fixedTime = new Date(date.getTime() + tzDifference);

    return fixedTime;
  },
};

// Last in Array
if (!Array.prototype.lastElementInArray) {
  Array.prototype.lastElementInArray = () => {
    return this[this.length - 1];
  };
}

function getFileStats(path) {
  const stats = fs.statSync(path);
  return stats;
}



