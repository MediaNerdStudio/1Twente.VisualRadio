// http://192.168.88.7:8080/templates/1Twente.O999.BG.html
// http://192.168.88.7:8080/templates/1Twente.O999.BG.html?clean
// http://192.168.88.7:8080/templates/1Twente.O999.BG.html?vertical
// http://192.168.88.7:8080/templates/1Twente.O999.BG.html?vertical&video-1     1x VIDEO MIDDLE
// http://192.168.88.7:8080/templates/1Twente.O999.BG.html?vertical&video-2     2x VIDEO / SPLIT / NP > MIDDLE
// http://192.168.88.7:8080/templates/1Twente.O999.BG.html?vertical&video-3     1x VIDEO BIG TOP / NP BOTTOM

// http://192.168.88.7:8080/templates/1Twente.O999.BG.html?vertical&cw
// http://192.168.88.7:8080/templates/1Twente.O999.BG.html?vertical&ccw

"use strict;";

moment.locale("nl");
moment.updateLocale("nl", {
  weekdaysShort: "Zon_Maa_Din_Woe_Don_Vrij_Zat".split("_"),
  weekdays: [
    "Zondag",
    "Maandag",
    "Dinsdag",
    "Woensdag",
    "Donderdag",
    "Vrijdag",
    "Zaterdag",
  ],
});
moment.tz.setDefault("Europe/Amsterdam");

const pageURL = window.location.search;
const urlParams = new URLSearchParams(pageURL);

if (urlParams.get("dev") != undefined) {
  $(".canvas").css("background-color", "rgba(0, 0, 0, 0.2)");
  play();
}

if (urlParams.get("vertical") != undefined) {
  $(".canvas").addClass("vertical");

  if (urlParams.get("video-1") != undefined) {
    $(".canvas").addClass("video-1");
  }
  if (urlParams.get("video-2") != undefined) {
    $(".canvas").addClass("video-2");
  }
  if (urlParams.get("video-3") != undefined) {
    $(".canvas").addClass("video-3");
  }
}

if (urlParams.get("clean") != undefined) {
  $(".metadata").addClass("clean");
}

if (urlParams.get("cw") != undefined) {
  gsap.to(".canvas", {
    x: 1920,
    rotation: 90,
    duration: 0,
    transformOrigin: "0 0",
  });
}

if (urlParams.get("ccw") != undefined) {
  gsap.to(".canvas", {
    y: 1080,
    rotation: -90,
    duration: 0,
    transformOrigin: "0 0",
  });
}

let globalSettings = null;

let localSettings = {
  nowPlayingData: null,
  nowPlayingData_WatHoordeIk: null,
  omniData: null,
  EPG: null,
  edition: false,
};


if (urlParams.get("edition") != undefined) {
  if (urlParams.get("edition") === "ALL") {
    localSettings.edition = false;
  } else if (urlParams.get("edition") === "ENS") {
    localSettings.edition = "ENS";
  } else if (urlParams.get("edition") === "HEN") {
    localSettings.edition = "HEN";
  } else if (urlParams.get("edition") === "TFM") {
    localSettings.edition = "TFM";
  }
}


init();

function play() {}

function stop() {}

function update(updateData) {
  let incomingData = JSON.parse(updateData);
}

function init() {
  // INIT SOCKETIO CONNECTION
  socketIOConnector();
}

// HANDLE EPG DATA
function handleEPGData() {
  let edition;
  if (localSettings.edition === false) {
    edition = "enschede";
  } else if (localSettings.edition === "ENS") {
    edition = "enschede";
  } else if (localSettings.edition === "HEN") {
    edition = "hengelo";
  } else if (localSettings.edition === "TFM") {
    edition = "twentefm";
  }
  let programData = localSettings.EPG[edition].OnAir;
  if (programData != null) {
    if (programData.programLink != null) {
      if (programData.programLink.presenters != null) {
        let presenters = [];

        programData.programLink.presenters.forEach((presenter) => {
          presenters.push(presenter.fullName);
        });

        $(".ticker .content .item").html(presenters.join(" & "));
        $(".metadata .EPG h1").html(presenters.join(" & "));
      } else {
        $(".ticker .content .item").html(programData.programLink.presenter);
        $(".metadata .EPG h1").html(programData.programLink.presenter);
      }
    } else {
      $(".ticker .content .item").html(programData.title);
      $(".metadata .EPG h1").html(programData.title);
    }
  }
}

function updateNowPlaying() {
  if (localSettings.nowPlayingData != null) {
    $(`.metadata .nowPlaying .info h1`).html(
      localSettings.nowPlayingData[0].artist
    );
    $(`.metadata .nowPlaying .info h2`).html(
      localSettings.nowPlayingData[0].title
    );

    if (
      localSettings.nowPlayingData[0].previewImage &&
      localSettings.nowPlayingData[0].previewImage != null
    ) {
      $(`.metadata .nowPlaying .albumart img`).attr(
        "src",
        localSettings.nowPlayingData[0].previewImage
      );
    } else {
      if(localSettings.nowPlayingData_WatHoordeIk && localSettings.nowPlayingData_WatHoordeIk[0] && localSettings.nowPlayingData_WatHoordeIk[0].enrichment && localSettings.nowPlayingData_WatHoordeIk[0].enrichment.spotify){
        $(`.metadata .nowPlaying .albumart img`).attr(
          "src",
          localSettings.nowPlayingData_WatHoordeIk[0].enrichment.spotify.image_l
        );
      }
      else{
        $(`.metadata .nowPlaying .albumart img`).attr(
          "src",
          "./img/1Twente.NoAlbumArt.png"
        );
      }
    }

    if (
      localSettings.omniData &&
      localSettings.omniData.enrichment &&
      localSettings.omniData.enrichment.metadata &&
      localSettings.omniData.enrichment.metadata.positie &&
      localSettings.omniData.enrichment.metadata.positie != 0 &&
      localSettings.omniData.enrichment.metadata.positie != null
    ) {
      let positie = localSettings.omniData.enrichment.metadata.positie
        .toString()
        .padStart(3, "0");

      $(`.metadata .nowPlaying .position h1:nth-child(1)`).html(positie[0]);
      $(`.metadata .nowPlaying .position h1:nth-child(2)`).html(positie[1]);
      $(`.metadata .nowPlaying .position h1:nth-child(3)`).html(positie[2]);
      gsap.to(".nowPlaying .position", {
        opacity: 1,
        duration: 0,
      });
    } else {
      gsap.to(".nowPlaying .position", {
        opacity: 0,
        duration: 0,
      });
    }
  }
}

// SOCKETIO CONNECTOR ########################################
function socketIOConnector() {
  // // SOCKETIO | INIT
  socketIO = io.connect(window.location.origin, {
    reconnection: true,
    reconnectionDelay: 10000,
    query: {
      room: "templates",
    },
  });
  // SOCKETIO | MESSAGE | CONNECT
  socketIO.on("connect", function (data) {
    console.log(
      `${moment().format(
        "YYYY-MM-DD, HH:mm:ss.SSS"
      )}\tSocketIO\tConnected To UI Server`
    );
  });

  // SOCKETIO | MESSAGE | HISTORY
  socketIO.on(`data|epg`, (epgDataReceived) => {
    localSettings.EPG = epgDataReceived;
    handleEPGData();
  });

  // SOCKETIO | MESSAGE | HISTORY
  socketIO.on(`nowplaying`, (nowPlayingDataReceived) => {
    localSettings.omniData = nowPlayingDataReceived;
    updateNowPlaying();
  });

  socketIO.on(`nowplaying_cleaned`, (nowPlayingDataReceived) => {
    localSettings.nowPlayingData = nowPlayingDataReceived;
    updateNowPlaying();
  });

  socketIO.on(`globalsettings`, (globalsettingsReceived) => {
    globalSettings = globalsettingsReceived;
    socketIOConnector_WatHoordeIk();
  });
}

function socketIOConnector_WatHoordeIk() {
  // SOCKETIO | INIT
  let socketIO_WatHoordeIk = io.connect(globalSettings.API.nowplaying, {
    reconnection: true,
    reconnectionDelay: 10000,
    query: {
      component: "NowPlaying",
      module: "Overview",
      station: "All",
      target: undefined,
      songLimit: 10,
    },
  });

  // SOCKETIO | MESSAGE | CONNECT
  socketIO_WatHoordeIk.on("connect", function (data) {
    console.log(
      `${moment().format(
        "YYYY-MM-DD, HH:mm:ss.SSS"
      )}\tSocketIO\tConnected To NowPlaying Server`
    );
  });

  // SOCKETIO | MESSAGE | HISTORY
  socketIO_WatHoordeIk.on(
    `NowPlaying.1Twente ENS.History`,
    (nowPlayingDataReceived) => {
      if (
        !localSettings.nowPlayingData_WatHoordeIk ||
        (nowPlayingDataReceived &&
          nowPlayingDataReceived != null &&
          localSettings.nowPlayingData_WatHoordeIk[0].startTime)
      ) {
        localSettings.nowPlayingData_WatHoordeIk = nowPlayingDataReceived;
        updateNowPlaying();
      }
    }
  );
}
