"use strict;";

 const anime = window.anime;
 const animeAnimate = (params) => {
   if (!anime || typeof anime.animate !== "function") {
     throw new Error("AnimeJS is not available or does not support anime.animate");
   }
   if (!params || !params.targets) {
     throw new Error("animeAnimate(params) requires params.targets");
   }
   const { targets, ...props } = params;
   return anime.animate(targets, props);
 };
 const animeTimeline = (opts = {}) => {
   if (!anime || typeof anime.createTimeline !== "function") {
     throw new Error("AnimeJS is not available or does not support anime.createTimeline");
   }
   const { complete, ...rest } = opts;
   if (complete && !rest.onComplete) {
     rest.onComplete = complete;
   }
   const tl = anime.createTimeline(rest);
   const addV4 = tl.add.bind(tl);
   tl.add = function (params, offset) {
     if (params && typeof params === "object" && params.targets) {
       const { targets, ...props } = params;
       return addV4(targets, props, offset);
     }
     return addV4(params, offset);
   };
   return tl;
 };

let DateTime = luxon.DateTime;
let timezoneOffset = new Date().getTimezoneOffset() / 60;

let globalSettings = null;

let localSettings = {
  clockTime: null,
  clockDate_01: null,
  clockDate_02: null,
  nowPlayingData: null,
  nowPlayingData_WatHoordeIk: null,
  omniData: null,
  // carousel: ["news"],
  // carousel: ["nowplaying", "news"],
  // carousel: ["news", "news", "news", "nowplaying"],
  // carousel: ["promo app", "nowplaying", "news"],
  // carousel: ["epg now", "epg later", "nowplaying", "weather"],
  // carousel: [ "epg now", "epg later","nowplaying"],

  carousel: ["news", "weather", "promo app", "news", "epg now", "epg later", "news", "nowplaying"],
  
  carousel_items_time: {
    news: 25000,
    // news: 2000,
    "promo app": 15000,
    // "promo app": 5000,
    "epg now": 6000,
    "epg next": 6000,
    "epg later": 6000,
    nowplaying: 6000,
    weather: 20000,
  },
  carousel_current: null,
  carousel_count: 0,
  carousel_news_count: 0,
  newsItemsFull: [],
  EPG: {
    OnAir: null,
    Upcoming: null,
    Today: null,
    Tomorrow: null,
  },
  ticker: {
    array: [],
    id: 0,
    count: undefined,
    started: false,
    speed: 150
  },
  weatherData: null,
  sportsData: {
    soccer: null
  },
  connectedToServer: undefined
};

init();
const pageURL = window.location.search;
const urlParams = new URLSearchParams(pageURL);
if (urlParams.get("dev") != undefined) {
  $(".canvas").css("background-color", "rgba(0, 0, 0, 0.2)");
}


function init() {
  // INIT SOCKETIO CONNECTION
  socketIOConnector();
  animation_news_reset();
  animation_nowplaying_reset();
  animation_epg_now_reset();
  animation_epg_next_reset();
  animation_epg_later_reset()
  animation_weather_reset();
  animation_promo_reset("app");

  setTimeout(() => {  
    // animation_carousel("first");

    news_fill_content(
      localSettings.newsItemsFull[localSettings.carousel_news_count]
    );
    carousel_item();
  }, 1000);

}

function carousel_item() {
  
  if (localSettings.carousel[localSettings.carousel_count] === "news") {
    animation_news_in((res) => {
      setTimeout(() => {
        animation_news_out((res) => {
          news_fill_content(
            localSettings.newsItemsFull[localSettings.carousel_news_count]
          );
          localSettings.carousel_count++;
          if (localSettings.carousel_count >= localSettings.carousel.length) {
            localSettings.carousel_count = 0;
          }
          carousel_item();
        });
      }, localSettings.carousel_items_time[localSettings.carousel[localSettings.carousel_count]]);
    });
  } else if (
    localSettings.carousel[localSettings.carousel_count] === "nowplaying"
  ) {
    animation_nowplaying_in((res) => {
      setTimeout(() => {
        animation_nowplaying_out((res) => {
          localSettings.carousel_count++;
          if (localSettings.carousel_count >= localSettings.carousel.length) {
            localSettings.carousel_count = 0;
          }
          carousel_item();
        });
      }, localSettings.carousel_items_time[localSettings.carousel[localSettings.carousel_count]]);
    });
  } else if (
    localSettings.carousel[localSettings.carousel_count] === "epg now"
  ) {
    animation_epg_now_in((res) => {
      setTimeout(() => {
        animation_epg_now_out((res) => {
          localSettings.carousel_count++;
          if (localSettings.carousel_count >= localSettings.carousel.length) {
            localSettings.carousel_count = 0;
          }
          carousel_item();
        });
      }, localSettings.carousel_items_time[localSettings.carousel[localSettings.carousel_count]]);
    });
  } else if (
    localSettings.carousel[localSettings.carousel_count] === "epg next"
  ) {
    animation_epg_next_in((res) => {
      setTimeout(() => {
        animation_epg_next_out((res) => {
          localSettings.carousel_count++;
          if (localSettings.carousel_count >= localSettings.carousel.length) {
            localSettings.carousel_count = 0;
          }
          carousel_item();
        });
      }, localSettings.carousel_items_time[localSettings.carousel[localSettings.carousel_count]]);
    });
   } else if (
    localSettings.carousel[localSettings.carousel_count] === "epg later"
  ) {
    animation_epg_later_in((res) => {
      setTimeout(() => {
        animation_epg_later_out((res) => {
          localSettings.carousel_count++;
          if (localSettings.carousel_count >= localSettings.carousel.length) {
            localSettings.carousel_count = 0;
          }
          carousel_item();
        });
      }, localSettings.carousel_items_time[localSettings.carousel[localSettings.carousel_count]]);
    });
  } else if (
    localSettings.carousel[localSettings.carousel_count] === "promo app"
  ) {
    animation_promo_in('app', (res) => {
      setTimeout(() => {
        animation_promo_out('app', (res) => {
          localSettings.carousel_count++;
          if (localSettings.carousel_count >= localSettings.carousel.length) {
            localSettings.carousel_count = 0;
          }
          carousel_item();
        });
      }, localSettings.carousel_items_time[localSettings.carousel[localSettings.carousel_count]]);
    });
  }
  else if (
    localSettings.carousel[localSettings.carousel_count] === "weather"
  ) {
    animation_weather_in_current((res) => {
      setTimeout(() => {
        animation_weather_switch((res) => {
          localSettings.carousel_count++;
          if (localSettings.carousel_count >= localSettings.carousel.length) {
            localSettings.carousel_count = 0;
          }
          carousel_item();
        });
      }, (localSettings.carousel_items_time[localSettings.carousel[localSettings.carousel_count]] / 2));
    });
  }
}

// ANIMATION /////////////////////////////////////////////////////////////
function animation_news_reset() {
  let animation_tl = animeTimeline({
    ease: "linear",
    duration: 0,
    autoplay: true,
  });

  animation_tl.add({
    targets: ".news .pill",
    translateX: 700,
    opacity: 1,
    duration: 0,
    ease: "linear",
  });

  animation_tl.add({
    targets: ".news .items",
    translateY: 1080,
    duration: 0,
    ease: "linear",
  });

  animation_tl.add({
    targets: ".news",
    opacity: 0,
    duration: 0,
    ease: "linear",
  });

  animation_tl.add({
    targets: ".bg .bg-news",
    translateX: -561,
    duration: 0,
    ease: "linear",
  });

  
}

function animation_news_in(callback) {
  animation_news_reset();

  let animation_tl = animeTimeline({
    ease: "linear",
    autoplay: true,
    complete: function (anim) {
      callback(anim.completed);
    },
  });

  animation_tl.add({
    targets: ".news",
    opacity: 1,
    duration: 0,
    ease: "linear",
  });

  animation_tl.add({
    targets: ".news .pill",
    translateX: [700, 0],
    ease: 'outExpo',
    duration: 1500,
  });

  animation_tl.add(
    {
      targets: ".news .items",
      translateY: [500, 0],
      opacity: [0, 1],
      ease: 'outExpo',
      duration: 1500,
    },
    "-=1500"
  );

  animation_tl.add({
    targets: ".bg .bg-news",
    translateX: [-561, 0],
    duration: 1500,
    ease: 'outExpo',
  }, "-=1500");
}

function animation_news_out(callback) {
  let animation_tl = animeTimeline({
    ease: "linear",
    autoplay: true,
    complete: function (anim) {
      callback(anim.completed);
    },
  });

  animation_tl.add({
    targets: ".news .pill",
    translateX: [0, 700],
    ease: "inExpo",
    duration: 1000,
  });

  animation_tl.add(
    {
      targets: ".news .items",
      translateY: [0, 500],
      opacity: [1, 0],
      ease: "inExpo",
      duration: 1000,
    },
    "-=1000"
  );

  animation_tl.add({
    targets: ".bg .bg-news",
    translateX: [0, 1920],
    duration: 1000,
    ease: "inExpo",
  }, "-=1000");
}

function news_fill_content(newsData) {
  $(".canvas .news .items").html(tekstTV_NewsItem(newsData));
  localSettings.carousel_news_count++;
  if (localSettings.carousel_news_count >= localSettings.newsItemsFull.length) {
    localSettings.carousel_news_count = 0;
  }
}

// NOWPLAYING
function animation_nowplaying_reset() {
  animeAnimate({
    targets: ".nowplaying .pill",
    translateX: 400,
    duration: 0,
    ease: "linear",
  });

  animeAnimate({
    targets: ".nowplaying .current, .nowplaying .previous",
    translateY: 1080,
    duration: 0,
    ease: "linear",
  });
}

function animation_nowplaying_in(callback) {
  animation_nowplaying_reset();

  let animation_tl = animeTimeline({
    ease: "linear",
    autoplay: true,
    complete: function (anim) {
      callback(anim.completed);
    },
  });

  animation_tl.add({
      targets: ".nowplaying",
      opacity: [0, 1],
      duration: 0,
    }
  );

  animation_tl.add({
    targets: ".nowplaying .pill",
    translateX: [400, 0],
    ease: "outExpo",
    duration: 1500,
  });

  animation_tl.add(
    {
      targets: ".nowplaying .current",
      translateY: [1080, 0],
      opacity: [0, 1],
      ease: "outExpo",
      duration: 1500,
    },
    "-=1500"
  );

  animation_tl.add(
    {
      targets: ".nowplaying .previous",
      translateY: [1080, 0],
      opacity: [0, 1],
      ease: "outExpo",
      duration: 1500,
    },
    "-=1000"
  );
}

function animation_nowplaying_out(callback) {
  let animation_tl = animeTimeline({
    ease: "linear",
    autoplay: true,
    complete: function (anim) {
      callback(anim.completed);
    },
  });

  animation_tl.add({
    targets: ".nowplaying .pill",
    translateX: [0, 400],
    ease: "inExpo",
    duration: 1000,
  });

  animation_tl.add(
    {
      targets: ".nowplaying .current",
      translateY: [0, -100],
      opacity: [1, 0],
      ease: "inExpo",
      duration: 600,
    },
    "-=1000"
  );

  animation_tl.add(
    {
      targets: ".nowplaying .previous",
      translateY: [0, -100],
      opacity: [1, 0],
      ease: "inExpo",
      duration: 600,
    },
    "-=750"
  );
}

// EPG NOW
function animation_epg_now_reset() {
  animeAnimate({
    targets: ".epg.now .pill",
    translateX: 400,
    duration: 0,
    ease: "linear",
  });

  animeAnimate({
    targets: ".epg.now .details",
    translateX: -1920,
    duration: 0,
    ease: "linear",
  });

  animeAnimate({
    targets: ".epg.now .bg_presenter",
    "clip-path": "polygon(13% 0%, 13% 0%, 0% 100%, 0% 100%)",
    duration: 0,
    ease: "linear",
  });
}

function animation_epg_now_in(callback) {
  animation_epg_now_reset();
  let animation_tl = animeTimeline({
    ease: "linear",
    autoplay: true,
    complete: function (anim) {
      callback(anim.completed);
    },
  });

  animation_tl.add({
      targets: ".epg.now",
      opacity: [0, 1],
      duration: 0,
    }
  );

  animation_tl.add({
    targets: ".epg.now .pill",
    translateX: [400, 0],
    ease: "outExpo",
    duration: 1500,
  });

  animation_tl.add(
    {
      targets: ".epg.now .details",
      translateX: [-1920, 0],
      ease: "outExpo",
      duration: 1500,
    },
    "-=1500"
  );

  animation_tl.add(
    {
      targets: ".epg.now .bg_presenter",
      "clip-path": [
        "polygon(13% 0%, 13% 0%, 0% 100%, 0% 100%)",
        "polygon(13% 0%, 100% 0%, 87% 100%, 0% 100%)",
      ],
      ease: "outExpo",
      duration: 1500,
    },
    "-=1500"
  );

  animeAnimate({
    targets: ".epg.now .bg_presenter .image",
    scale: [1, 1.1],
    ease: "linear",
    duration: 12000,
  });
}

function animation_epg_now_out(callback) {
  let animation_tl = animeTimeline({
    ease: "linear",
    autoplay: true,
    complete: function (anim) {
      callback(anim.completed);
    },
  });

  animation_tl.add({
    targets: ".epg.now .pill",
    translateX: [0, 400],
    ease: "inExpo",
    duration: 1000,
  });

  animation_tl.add(
    {
      targets: ".epg.now .details",
      translateX: [0, -1920],
      ease: "inExpo",
      duration: 1000,
    },
    "-=1000"
  );

  animation_tl.add(
    {
      targets: ".epg.now .bg_presenter",
      "clip-path": [
        "polygon(13% 0%, 100% 0%, 87% 100%, 0% 100%)",
        "polygon(100% 0%, 100% 0%, 87% 100%, 87% 100%)",
      ],
      ease: "inExpo",
      duration: 1000,
    },
    "-=1000"
  );
}

// EPG NEXT
function animation_epg_next_reset() {
  animeAnimate({
    targets: ".epg.next .pill",
    translateX: 400,
    duration: 0,
    ease: "linear",
  });

  animeAnimate({
    targets: ".epg.next .details",
    translateX: -1920,
    duration: 0,
    ease: "linear",
  });

  animeAnimate({
    targets: ".epg.next .bg_presenter",
    "clip-path": "polygon(13% 0%, 13% 0%, 0% 100%, 0% 100%)",
    duration: 0,
    ease: "linear",
  });
}

function animation_epg_next_in(callback) {
  animation_epg_next_reset();
  let animation_tl = animeTimeline({
    ease: "linear",
    autoplay: true,
    complete: function (anim) {
      callback(anim.completed);
    },
  });

  animation_tl.add({
    targets: ".epg.next",
    opacity: [0, 1],
    duration: 0,
  });

  animation_tl.add({
    targets: ".epg.next .pill",
    translateX: [400, 0],
    ease: "outExpo",
    duration: 1500,
  });

  animation_tl.add(
    {
      targets: ".epg.next .details",
      translateX: [-1920, 0],
      ease: "outExpo",
      duration: 1500,
    },
    "-=1500"
  );

  animation_tl.add(
    {
      targets: ".epg.next .bg_presenter",
      "clip-path": [
        "polygon(13% 0%, 13% 0%, 0% 100%, 0% 100%)",
        "polygon(13% 0%, 100% 0%, 87% 100%, 0% 100%)",
      ],
      ease: "outExpo",
      duration: 1500,
    },
    "-=1500"
  );

  animeAnimate({
    targets: ".epg.next .bg_presenter .image",
    scale: [1, 1.1],
    ease: "linear",
    duration: 12000,
  });
}

function animation_epg_next_out(callback) {
  let animation_tl = animeTimeline({
    ease: "linear",
    autoplay: true,
    complete: function (anim) {
      callback(anim.completed);
    },
  });

  animation_tl.add({
    targets: ".epg.next .pill",
    translateX: [0, 400],
    ease: "inExpo",
    duration: 1000,
  });

  animation_tl.add(
    {
      targets: ".epg.next .details",
      translateX: [0, -1920],
      ease: "inExpo",
      duration: 1000,
    },
    "-=1000"
  );

  animation_tl.add(
    {
      targets: ".epg.next .bg_presenter",
      "clip-path": [
        "polygon(13% 0%, 100% 0%, 87% 100%, 0% 100%)",
        "polygon(100% 0%, 100% 0%, 87% 100%, 87% 100%)",
      ],
      ease: "inExpo",
      duration: 1000,
    },
    "-=1000"
  );
}


// EPG LATER
function animation_epg_later_reset() {
  animeAnimate({
    targets: ".epg.later .pill",
    translateX: 400,
    duration: 0,
    ease: "linear",
  });

  animeAnimate({
    targets: ".epg.later .time",
    translateX: -1920,
    duration: 0,
    ease: "linear",
  });

  animeAnimate({
    targets: ".epg.later .programs",
    translateX: 1920,
    duration: 0,
    ease: "linear",
  });
}

function animation_epg_later_in(callback) {
  animation_epg_later_reset();
  let animation_tl = animeTimeline({
    ease: "linear",
    autoplay: true,
    complete: function (anim) {
      callback(anim.completed);
    },
  });

  animation_tl.add({
      targets: ".epg.later",
      opacity: [0, 1],
      duration: 0,
    }
  );

  animation_tl.add({
    targets: ".epg.later .pill",
    translateX: [400, 0],
    ease: "outExpo",
    duration: 1500,
  });

  animation_tl.add(
    {
      targets: ".epg.later .time",
      translateX: [-1920, 0],
      ease: "outExpo",
      duration: 1500,
    },
    "-=1500"
  );

  animation_tl.add(
    {
      targets: ".epg.later .programs",
      translateX: [1920, 0],
      ease: "outExpo",
      duration: 1500,
    },
    "-=1100"
  );
}

function animation_epg_later_out(callback) {
  let animation_tl = animeTimeline({
    ease: "linear",
    autoplay: true,
    complete: function (anim) {
      callback(anim.completed);
    },
  });

  animation_tl.add({
    targets: ".epg.later .pill",
    translateX: [0, 400],
    ease: "inExpo",
    duration: 1000,
  });

  animation_tl.add(
    {
      targets: ".epg.later .time",
      translateX: [0, -1920],
      ease: "inExpo",
      duration: 1000,
    },
    "-=900"
  );

  animation_tl.add(
    {
      targets: ".epg.later .programs",
      translateX: [0, 1920],
      ease: "inExpo",
      duration: 1000,
    },
    "-=900"
  );
}


// NOWPLAYING
function animation_promo_reset(type) {
  if (type === "app") {
    const promoVideo = document.querySelector(".promo[data-type='app'] .phoneanimation video");
    promoVideo.currentTime = 0;
    promoVideo.pause();

    animeAnimate({
      targets: ".promo[data-type='app'] .phoneanimation",
      translateY: 0,
      duration: 0,
      ease: "linear",
    });
  
    animeAnimate({
      targets: ".promo[data-type='app'] .details",
      translateY: 1080,
      duration: 0,
      ease: "linear",
    });
  }
}

function animation_promo_in(type, callback) {
  animation_promo_reset(type);
  if (type === "app") {
    const promoVideo = document.querySelector(".promo[data-type='app'] .phoneanimation video");
    promoVideo.play();

    let animation_tl = animeTimeline({
      ease: "linear",
      autoplay: true,
      complete: function (anim) {
        callback(anim.completed);
      },
    });

    animation_tl.add({
        targets: ".promo[data-type='app']",
        opacity: [0, 1],
        duration: 0,
      }
    );

    animation_tl.add(
      {
        targets: ".promo[data-type='app'] .phoneanimation",
        opacity: [0, 1],
        ease: "linear",
        duration: 0,
      }
    );
  
    animation_tl.add(
      {
        targets: ".promo[data-type='app'] .details",
        translateY: [1080, 0],
        opacity: [0, 1],
        ease: "outExpo",
        duration: 1500,
      },
      "+=600"
    );
  }
}

function animation_promo_out(type, callback) {
  if (type === "app") {
    let animation_tl = animeTimeline({
      ease: "linear",
      autoplay: true,
      complete: () => {
        animation_promo_reset(type);
        callback("animation_promo_out completed");
        
      }
    })
  
    .add(
      {
        targets: ".promo[data-type='app'] .details",
        translateY: [0, 1080],
        ease: "inExpo",
        duration: 600,
      }
    )
  
    .add(
      {
        targets: ".promo[data-type='app'] .phoneanimation",
        translateY: [0, 1080],
        ease: "inExpo",
        duration: 600,
      }, "-=300"
    )
  }
}

// WEATHER
function animation_weather_reset(){  
  let animation_tl = animeTimeline({
    ease: "linear",
    duration: 0,
    autoplay: true,
  });

  animation_tl.add({
    targets: ".weather .pill",
    translateX: 700,
    opacity: 1,
    duration: 0,
    ease: "linear",
  });

  animation_tl.add({
    targets: ".bg .bg-weather",
    "clip-path": "polygon(-100% 0%, 0% 0%, -13% 100%, -113% 100%)",
    duration: 0,
    ease: "linear",
  });

  animation_tl.add({
    targets: ".weather.current .locations .item .hero",
    translateX: -500,
    duration: 0,
    opacity: 0,
    ease: "linear",
  });

  animation_tl.add({
    targets: ".weather.current .locations .item .details",
    translateX: 500,
    duration: 0,
    opacity: 0,
    ease: "linear",
  });

  animation_tl.add({
    targets: ".weather.current .bg-box, .weather.forecast .bg-box",
    translateX: -1080,
    duration: 0,
    ease: "linear",
  });

  animation_tl.add({
    targets: ".weather.forecast .overview",
    translateX: 500,
    opacity: 0,
    duration: 0,
    ease: "linear",
  });

  animation_tl.add({
    targets: ".weather.forecast .overview .week .day",
    translateX: 300,
    opacity: 0,
    duration: 0,
    ease: "linear",
  });

  
}

function animation_weather_in_current(callback){
  animation_weather_reset();
   let animation_tl = animeTimeline({
    ease: "linear",
    autoplay: true,
    complete: function (anim) {
      callback(anim.completed);
    },
  });

  animation_tl.add({
      targets: ".weather.current",
      opacity: [0, 1],
      duration: 0,
    }
  );

  animation_tl.add(
    {
      targets: ".bg .bg-weather",
      "clip-path": [
        "polygon(0% 0%, 113% 0%, 100% 100%, -13% 100%)"
      ],
      ease: "outExpo",
      duration: 1500,
    }
  );

  animation_tl.add({
    targets: ".weather.current .pill",
    translateX: [700, 0],
    ease: "outExpo",
    duration: 1500,
  }, "-=1500"
  );


  animation_tl.add(
    {
      targets: ".weather.current .bg-box",
      translateX: [-500, 0],
      ease: "outExpo",
      duration: 1500,
    },
    "-=1000"
  );

  animation_tl.add(
    {
      targets: ".weather.current .locations .item .hero",
      translateX: [-1080, 0],
      opacity: [0, 1],
      ease: "outExpo",
      duration: 1500,
    },
    "-=1200"
  );

  animation_tl.add(
    {
      targets: ".weather.current .locations .item .details",
      translateX: [500, 0],
      opacity: [0, 1],
      ease: "outExpo",
      duration: 1500,
    },
    "-=1500"
  );
}

function animation_weather_out_current(callback){
   let animation_tl = animeTimeline({
    ease: "linear",
    autoplay: true,
    complete: function (anim) {
      callback(anim.completed);
    },
  });

  animation_tl.add({
    targets: ".weather.current .pill",
    translateX: [0, 700],
    ease: "inExpo",
    duration: 1500,
  }
  );

  animation_tl.add(
    {
      targets: ".weather.current .locations .item .hero",
      translateX: [0, -1080],
      opacity: [1, 0],
      ease: "inExpo",
      duration: 1500,
    },
    "-=1200"
  );
  animation_tl.add(
    {
      targets: ".weather.current .bg-box",
      translateX: [0, -500],
      ease: "inExpo",
      duration: 1000,
    },
    "-=800"
  );

  animation_tl.add(
    {
      targets: ".weather.current .locations .item .details",
      translateX: [0, 500],
      opacity: [1, 0],
      ease: "inExpo",
      duration: 1500,
    },
    "-=1500"
  );
}

function animation_weather_in_forecast(callback){
  let dayOffset_delay = "-=600";
   let animation_tl = animeTimeline({
    ease: "linear",
    autoplay: true,
    complete: function (anim) {
      callback(anim.completed);
    },
  });
  animation_tl.add({
      targets: ".weather.forecast",
      opacity: [0, 1],
      duration: 0,
    }
  );

  animation_tl.add({
    targets: ".weather.forecast .pill",
    translateX: [700, 0],
    ease: "outExpo",
    duration: 1500,
  }
  );

  animation_tl.add(
    {
      targets: ".weather.forecast .bg-box",
      translateX: [-500, 0],
      ease: "outExpo",
      duration: 1500,
    },
    "-=1250"
  );

  animation_tl.add(
    {
      targets: ".weather.forecast .overview",
      translateX: [500, 0],
      opacity: [0, 1],
      ease: "outExpo",
      duration: 1500,
    },
    "-=1300"
  );

  animation_tl.add(
    {
      targets: ".weather.forecast .overview .week .day:nth-child(1)",
      translateX: [300, 0],
      opacity: [0, 1],
      ease: "outExpo",
      duration: 700,
    },
    dayOffset_delay
  );

  animation_tl.add(
    {
      targets: ".weather.forecast .overview .week .day:nth-child(2)",
      translateX: [300, 0],
      opacity: [0, 1],
      ease: "outExpo",
      duration: 700,
    },
    dayOffset_delay
  );
  animation_tl.add(
    {
      targets: ".weather.forecast .overview .week .day:nth-child(3)",
      translateX: [300, 0],
      opacity: [0, 1],
      ease: "outExpo",
      duration: 700,
    },
    dayOffset_delay
  );

  animation_tl.add(
    {
      targets: ".weather.forecast .overview .week .day:nth-child(4)",
      translateX: [300, 0],
      opacity: [0, 1],
      ease: "outExpo",
      duration: 700,
    },
    dayOffset_delay
  );

  animation_tl.add(
    {
      targets: ".weather.forecast .overview .week .day:nth-child(5)",
      translateX: [300, 0],
      opacity: [0, 1],
      ease: "outExpo",
      duration: 700,
    },
    dayOffset_delay
  );

  animation_tl.add(
    {
      targets: ".weather.forecast .overview .week .day:nth-child(6)",
      translateX: [300, 0],
      opacity: [0, 1],
      ease: "outExpo",
      duration: 700,
    },
    dayOffset_delay
  );

  animation_tl.add(
    {
      targets: ".weather.forecast .overview .week .day:nth-child(7)",
      translateX: [300, 0],
      opacity: [0, 1],
      ease: "outExpo",
      duration: 700,
    },
    dayOffset_delay
  );
}

function animation_weather_out_forecast(callback){
   let animation_tl = animeTimeline({
    ease: "linear",
    autoplay: true,
    complete: function (anim) {
      callback(anim.completed);
    },
  });

  animation_tl.add({
    targets: ".weather.forecast .pill",
    translateX: [0, 700],
    ease: "inExpo",
    duration: 1000,
  }
  );

  animation_tl.add(
    {
      targets: ".weather.forecast .bg-box",
      translateX: [0, -500],
      ease: "inExpo",
      duration: 1000,
    },
    "-=800"
  );

  animation_tl.add(
    {
      targets: ".weather.forecast .overview",
      translateX: [0, 500],
      opacity: [1, 0],
      ease: "inExpo",
      duration: 1000,
    },
    "-=800"
  );
  animation_tl.add(
    {
      targets: ".bg .bg-weather",
      "clip-path": [
        "polygon(100% 0%, 213% 0%, 200% 100%, 100% 100%)"
      ],
      ease: "inExpo",
      duration: 1000,
    }, "-=800"
  );
}

function animation_weather_switch(callback){
  animation_weather_out_current(res1 =>{
    animation_weather_in_forecast(res2 => {
      if (res2) {
        setTimeout(() => {

          animation_weather_out_forecast(res3 => {
            if (res3) {
              callback("animation_weather_switch completed");
            }
          })

          // callback("animation_weather_switch completed");
        }, (localSettings.carousel_items_time[localSettings.carousel[localSettings.carousel_count]] / 2));
      }
    })
  })
}

/////////////////////////////////////////////////////////////
// UPADTE DATA | NOWPLAYING
function updateNowPlaying() {
  let previous = [];

  if (localSettings.nowPlayingData) {
    localSettings.nowPlayingData.forEach((singleNowPlaying, index) => {
      if (index === 0) {
        $(`.nowplaying .current`).html(
          tekstTV_NowPlayingCurrent(
            singleNowPlaying,
            localSettings.nowPlayingData_WatHoordeIk,
            index
          )
        );
      } else if (index < 6) {
        previous.push(
          tekstTV_NowPlayingPrevious(
            singleNowPlaying,
            localSettings.nowPlayingData_WatHoordeIk,
            index
          )
        );
      }
    });
  }

  $(".nowplaying .previous .songs").html(previous.join(""));
}

// UPDATE DATA | EPG
function updateEPG(edition) {
  updateEPG_NOW(edition);
  // updateEPG_NEXT(edition);
  updateEPG_LATER(edition);
}

// UPDATE DATA | EPG | NOW
function updateEPG_NOW(edition) {
  if (localSettings.EPG[edition].OnAir) {
    $(".epg.now .details h1").html(localSettings.EPG[edition].OnAir.title);
    $(".epg.now .details h3").html(
      `tot ${DateTime.fromISO(localSettings.EPG[edition].OnAir.endsAt).plus({ hours: timezoneOffset }).toFormat("HH:mm")}`
    );

    if (localSettings.EPG[edition].OnAir.programLink != null) {
      let presenters = [];
      localSettings.EPG[edition].OnAir.programLink.presenters.forEach(
        (presenter) => {
          presenters.push(presenter.fullName);
        }
      );
      $(".epg.now .details h2").html(presenters.join(" & "));
      if (
        localSettings.EPG[edition].OnAir.programLink.presenters[0]
          .pictureBigFill
      ) {
        $(".epg.now .bg_presenter .image").attr(
          "style",
          `background-image: url(${localSettings.EPG[edition].OnAir.programLink.presenters[0].pictureBigFill})`
        );
      } else {
        $(".epg.now .bg_presenter .image").attr(
          "style",
          `background-image: url(${localSettings.EPG[edition].OnAir.programLink.avatar.thumbnail})`
        );
      }
    } else {
      $(".epg.now .details h2").html("");
      $(".epg.now .bg_presenter .image").attr(
        "style",
        "background-image: url(img/1T.Studio.Placeholder.png)"
      );
    }
  }
}

// UPDATE DATA | EPG | NEXT
function updateEPG_NEXT(edition) {
  
  $(".epg.next .details h1").html(localSettings.EPG[edition].Upcoming.title);
  $(".epg.next .details h3").html(
    `${DateTime.fromISO(localSettings.EPG[edition].Upcoming.startsAt).plus({ hours: timezoneOffset }).toFormat("HH:mm")} - ${DateTime.fromISO(localSettings.EPG[edition].Upcoming.endsAt).plus({ hours: timezoneOffset }).toFormat("HH:mm")}`
  );

  if (localSettings.EPG[edition].Upcoming.programLink != null) {
    let presenters = [];
    localSettings.EPG[edition].Upcoming.programLink.presenters.forEach(
      (presenter) => {
        presenters.push(presenter.fullName);
      }
    );

    $(".epg.next .details h2").html(presenters.join(" & "));
    if (
      localSettings.EPG[edition].Upcoming.programLink.presenters[0]
        .pictureBigFill
    ) {
      $(".epg.next .bg_presenter .image").attr(
        "style",
        `background-image: url(${localSettings.EPG[edition].Upcoming.programLink.presenters[0].pictureBigFill})`
      );
    } else {
      $(".epg.next .bg_presenter .image").attr(
        "style",
        `background-image: url(${localSettings.EPG[edition].Upcoming.programLink.avatar.thumbnail})`
      );
    }
  } else {
    $(".epg.next .details h2").html("");
    $(".epg.next .bg_presenter .image").attr(
      "style",
      "background-image: url(img/1T.DJ.02.png)"
    );
  }
}

// UPDATE DATA | EPG | LATER
function updateEPG_LATER(edition) {
  if(localSettings.EPG[edition].Today && localSettings.EPG[edition].Today.length > 0 && localSettings.EPG[edition].Tomorrow && localSettings.EPG[edition].Tomorrow.length > 0){
    let programs = localSettings.EPG[edition].Today.concat(localSettings.EPG[edition].Tomorrow);

    let programsFiltered = programs.filter((program) => {
      const now = DateTime.now();
      return DateTime.fromISO(program.startsAt) > now && DateTime.fromISO(program.endsAt) > now;
    });

    // Combine adjacent programs with same title and presenter
    let programsCombined = [];
    programsFiltered.forEach((program, index) => {
      if (programsCombined.length === 0) {
        programsCombined.push({...program});
      } else {
        const lastProgram = programsCombined[programsCombined.length - 1];
        const sameTitle = lastProgram.title === program.title;
        const samePresenter = JSON.stringify(lastProgram.programLink?.presenters) === JSON.stringify(program.programLink?.presenters);
        
        if (sameTitle && samePresenter) {
          // Extend the end time of the last program
          lastProgram.endsAt = program.endsAt;
        } else {
          programsCombined.push({...program});
        }
      }
    });

    let programsHTML = '';   

    programsCombined.forEach((program) => {
      let backgroundImage = '';
      if(program.programLink?.presenters && program.programLink.presenters.length > 0 && program.programLink.presenters[0].pictureBigFill){
        backgroundImage = program.programLink.presenters[0].pictureBigFill;
      }
      else if(program.programLink?.avatar && program.programLink.avatar.thumbnail){
        backgroundImage = program.programLink.avatar.thumbnail;
      }
      else{
        backgroundImage = 'img/1T.Studio.Placeholder.png';
      }


      programsHTML += `<div class="program" style="background-image: url(${backgroundImage})">`;
      programsHTML += `<div class="startEndTime">`;
      programsHTML += `<h3>${DateTime.fromISO(program.startsAt).plus({ hours: timezoneOffset }).toFormat("HH:mm")}</h3>`;
      programsHTML += `<h3>${DateTime.fromISO(program.endsAt).plus({ hours: timezoneOffset }).toFormat("HH:mm")}</h3>`;
      programsHTML += `</div>`;
      programsHTML += `<div class="info">`;
      programsHTML += `<h1>${program.title}</h1>`;
      programsHTML += `<h2>${program.programLink?.presenters?.map(p => p.fullName).join(' & ')}</h2>`;
      programsHTML += `</div>`;
      programsHTML += `</div>`;
    })

    $('.epg.later .details .programs').html(programsHTML);
  }
}

// UPDATE DATA | WEATHER
function updateWeather() {

  let forecastDays = '';
  let forecastWeek = '';

  if (localSettings.weatherData != null && localSettings.weatherData.locations != null && localSettings.weatherData.locations.length > 0) {
    localSettings.weatherData.locations.forEach((location) => {     
      
      forecastDays += tekstTV_WeatherItemCurrent(location.name, location.forecast_hours, location.forecast_days[0]);
      forecastWeek += tekstTV_WeatherItemForecast(location.forecast_days);
    });
  }
  
  $('.bg .bg-weather img').attr('src', `./img/weather/${localSettings.weatherData.locations[0].forecast_hours[0].attributes.weatherSymbolCode}.jpg`);

  $('.weather.current .locations').html(forecastDays);
  $('.weather.forecast .overview').html(forecastWeek);
}

// UPDATE DATA | SPORTS
function updateSports(sport) {
  if (sport == 'soccer') {
    let statsView = {
      visible: ['gamesplayed', 'wins', 'ties', 'losses', 'pointsfor', 'pointsagainst', 'pointdifferential', 'points'],
      order: [0, 7, 6, 1, 5, 4, 2, 3]
    }
    updateSport_SoccerGenerateRows('Eredivisie', (clubs, statsColumns, leagueId) => {      
      let columns = [];

      columns[0] = [];
      columns[0].push(`<div class="header">${localSettings.sportsData.soccer.standings[leagueId].groups[0].abbreviation}</div>`);      
      clubs.forEach((club, i) => {
        columns[0].push(`<div class="team"><span class="team-position">${i +1}</span><span class="team-logo"><img src="${club.team.logo}" height="32"/></span><span class="team-name">${club.team.displayName}</span></div>`);
      });

      statsView.order.forEach((index, i) => {
        columns[i +1] = [];
        columns[i +1].push(`<div class="header">${statsColumns[index].details.a}</div>`);
        statsColumns[index].rows.forEach((stat) => {
          columns[i +1].push(`<div class="stat">${stat}</div>`);
        });
      });

      let columnsData = '';

      columns.splice(9, 4);
      columns.forEach((column) => {
        columnsData += `<div class="column">${column.join('')}</div>`;
      });


      let matchesData = '';

      localSettings.sportsData.soccer.scoreboards[leagueId].evts.forEach((match) => {
        let homeTeam = match.teams[0];
        let awayTeam = match.teams[1];
        
        if (match.teams[0].isHome === false) {
          homeTeam = match.teams[1];
          awayTeam = match.teams[0];
        }

        let score = homeTeam.score + ' - ' + awayTeam.score;
        if(homeTeam.score === undefined || homeTeam.score === null || awayTeam.score === undefined || awayTeam.score === null) {
          score = DateTime.fromISO(match.date).setLocale('nl').toFormat('HH:mm');
        }
        matchesData += `<div class="match">
          <div class="team" data-team="home">
            <h1>${homeTeam.displayName}</h1>
            <span class="team-logo"><img src="${homeTeam.logo || '/img/Sports.NoLogo.svg'}" /></span>
          </div>
          <div class="status">
            <h3>${DateTime.fromISO(match.date).setLocale('nl').toFormat('ccc dd MMM')}</h3>
            <h2>${score}</h2>
          </div>
          <div class="team" data-team="away">
            <span class="team-logo"><img src="${awayTeam.logo || '/img/Sports.NoLogo.svg'}" /></span>
            <h1>${awayTeam.displayName}</h1>            
          </div>
        </div>`;
      });

      $('.sports .soccer .league[data-league="Eredivisie"] .table[data-type="standings"]').html(columnsData);
      $('.sports .soccer .league[data-league="Eredivisie"] .scoreboard .matches').html(matchesData);
    });

    // KEUKEN KAMPIOEN DIVISIE
    updateSport_SoccerGenerateRows('KKD', (clubs, statsColumns, leagueId) => {      
      let columns = [];

      columns[0] = [];
      columns[0].push(`<div class="header">${localSettings.sportsData.soccer.standings[leagueId].groups[0].abbreviation}</div>`);      
      clubs.forEach((club, i) => {
        columns[0].push(`<div class="team"><span class="team-position">${i +1}</span><span class="team-logo"><img src="${club.team.logo}"/></span><span class="team-name">${club.team.displayName}</span></div>`);
      });      

      statsView.order.forEach((index, i) => {
        columns[i +1] = [];
        columns[i +1].push(`<div class="header">${statsColumns[index].details.a}</div>`);
        statsColumns[index].rows.forEach((stat) => {
          columns[i +1].push(`<div class="stat">${stat}</div>`);
        });
      });
      let columnsData = '';

      columns.splice(9, 4);
      columns.forEach((column) => {
        columnsData += `<div class="column">${column.join('')}</div>`;
      });

      let matchesData = '';

      localSettings.sportsData.soccer.scoreboards[leagueId].evts.forEach((match) => {
        let homeTeam = match.teams[0];
        let awayTeam = match.teams[1];
        
        if (match.teams[0].isHome === false) {
          homeTeam = match.teams[1];
          awayTeam = match.teams[0];
        }

        let score = homeTeam.score + ' - ' + awayTeam.score;
        if(homeTeam.score === undefined || homeTeam.score === null || awayTeam.score === undefined || awayTeam.score === null) {
          score = DateTime.fromISO(match.date).setLocale('nl').toFormat('HH:mm');
        }
        matchesData += `<div class="match">
          <div class="team" data-team="home">
            <h1>${homeTeam.displayName}</h1>
            <span class="team-logo"><img src="${homeTeam.logo || '/img/Sports.NoLogo.svg'}" /></span>
          </div>
          <div class="status">
            <h3>${DateTime.fromISO(match.date).setLocale('nl').toFormat('ccc dd MMM')}</h3>
            <h2>${score}</h2>
          </div>
          <div class="team" data-team="away">
            <span class="team-logo"><img src="${awayTeam.logo || '/img/Sports.NoLogo.svg'}" /></span>
            <h1>${awayTeam.displayName}</h1>            
          </div>
        </div>`;
      });
      
      $('.sports .soccer .league[data-league="KKD"] .table[data-type="standings"]').html(columnsData);
      $('.sports .soccer .league[data-league="KKD"] .scoreboard .matches').html(matchesData);
    });

    // VROUWEN EREDIVISIE
    updateSport_SoccerGenerateRows('VrouwenEredivisie', (clubs, statsColumns, leagueId) => {      
      let columns = [];

      columns[0] = [];
      columns[0].push(`<div class="header">${localSettings.sportsData.soccer.standings[leagueId].groups[0].abbreviation}</div>`);      
      clubs.forEach((club, i) => {
        columns[0].push(`<div class="team"><span class="team-position">${i +1}</span><span class="team-logo"><img src="${club.team.logo}"/></span><span class="team-name">${club.team.displayName}</span></div>`);
      });      

      statsView.order.forEach((index, i) => {
        columns[i +1] = [];
        columns[i +1].push(`<div class="header">${statsColumns[index].details.a}</div>`);
        statsColumns[index].rows.forEach((stat) => {
          columns[i +1].push(`<div class="stat">${stat}</div>`);
        });
      });
      let columnsData = '';

      columns.splice(9, 4);
      columns.forEach((column) => {
        columnsData += `<div class="column">${column.join('')}</div>`;
      });

      let matchesData = '';

      localSettings.sportsData.soccer.scoreboards[leagueId].evts.forEach((match) => {
        let homeTeam = match.teams[0];
        let awayTeam = match.teams[1];
        
        if (match.teams[0].isHome === false) {
          homeTeam = match.teams[1];
          awayTeam = match.teams[0];
        }

        let score = homeTeam.score + ' - ' + awayTeam.score;
        if(homeTeam.score === undefined || homeTeam.score === null || awayTeam.score === undefined || awayTeam.score === null) {
          score = DateTime.fromISO(match.date).setLocale('nl').toFormat('HH:mm');
        }
        matchesData += `<div class="match">
          <div class="team" data-team="home">
            <h1>${homeTeam.displayName}</h1>
            <span class="team-logo"><img src="${homeTeam.logo || '/img/Sports.NoLogo.svg'}" /></span>
          </div>
          <div class="status">
            <h3>${DateTime.fromISO(match.date).setLocale('nl').toFormat('ccc dd MMM')}</h3>
            <h2>${score}</h2>
          </div>
          <div class="team" data-team="away">
            <span class="team-logo"><img src="${awayTeam.logo || '/img/Sports.NoLogo.svg'}" /></span>
            <h1>${awayTeam.displayName}</h1>            
          </div>
        </div>`;
      });

      $('.sports .soccer .league[data-league="VrouwenEredivisie"] .table[data-type="standings"]').html(columnsData);
      $('.sports .soccer .league[data-league="VrouwenEredivisie"] .scoreboard .matches').html(matchesData);
    });

    // TWEEDE DIVISIE
    updateSport_SoccerGenerateRows('TweedeDivisie', (clubs, statsColumns, leagueId) => {      
      let columns = [];

      columns[0] = [];
      columns[0].push(`<div class="header">${localSettings.sportsData.soccer.standings[leagueId].groups[0].abbreviation}</div>`);      
      clubs.forEach((club, i) => {
        columns[0].push(`<div class="team"><span class="team-position">${i +1}</span><span class="team-logo"><img src="${club.team.logo}"/></span><span class="team-name">${club.team.displayName}</span></div>`);
      });      

      statsView.order.forEach((index, i) => {
        columns[i +1] = [];
        columns[i +1].push(`<div class="header">${statsColumns[index].details.a}</div>`);
        statsColumns[index].rows.forEach((stat) => {
          columns[i +1].push(`<div class="stat">${stat}</div>`);
        });
      });

      let columnsData = '';

      columns.splice(9, 4);
      columns.forEach((column) => {
        columnsData += `<div class="column">${column.join('')}</div>`;
      });

      let matchesData = '';

      localSettings.sportsData.soccer.scoreboards[leagueId].evts.forEach((match) => {
        let homeTeam = match.teams[0];
        let awayTeam = match.teams[1];
        
        if (match.teams[0].isHome === false) {
          homeTeam = match.teams[1];
          awayTeam = match.teams[0];
        }

        let score = homeTeam.score + ' - ' + awayTeam.score;        
        if(homeTeam.score === undefined || homeTeam.score === null || awayTeam.score === undefined || awayTeam.score === null) {
          score = DateTime.fromISO(match.date).setLocale('nl').toFormat('HH:mm');
        }
        matchesData += `<div class="match">
          <div class="team" data-team="home">
            <h1>${homeTeam.displayName}</h1>
            <span class="team-logo"><img src="${homeTeam.logo || '/img/Sports.NoLogo.svg'}" /></span>
          </div>
          <div class="status">
            <h3>${DateTime.fromISO(match.date).setLocale('nl').toFormat('ccc dd MMM')}</h3>
            <h2>${score}</h2>
          </div>
          <div class="team" data-team="away">
            <span class="team-logo"><img src="${awayTeam.logo || '/img/Sports.NoLogo.svg'}" /></span>
            <h1>${awayTeam.displayName}</h1>            
          </div>
        </div>`;
      });
      $('.sports .soccer .league[data-league="TweedeDivisie"] .table[data-type="standings"]').html(columnsData);
      $('.sports .soccer .league[data-league="TweedeDivisie"] .scoreboard .matches').html(matchesData);
    });
  }  
}

// UPDATE DATA | SPORTS | GENERATE ROWS
function updateSport_SoccerGenerateRows(league, callback) {
  let leagueId = localSettings.sportsData.soccer.competitions.indexOf(league);

  let statsColumns = [];
  let clubs = [];
  for (var key in localSettings.sportsData.soccer.standings[leagueId].headers) {
    var obj = localSettings.sportsData.soccer.standings[leagueId].headers[key];
    statsColumns[obj.i] = {
      details: obj,
      rows: []
    }      
  }  

  localSettings.sportsData.soccer.standings[leagueId].groups[0].standings.forEach((singleClub) => {      
    let club = {
      team: singleClub.team
    }
    if(singleClub.note){
      club.note = singleClub.note;
    }

    singleClub.stats.forEach((stat, index) => {
      statsColumns[index].rows.push(stat);
    });
    clubs.push(club);      
  })
  
  callback(clubs, statsColumns, leagueId);
}

// TICKER /////////////////////////////////////////////////////////////
function ticker_newTick(){
  if (localSettings.ticker.array[localSettings.ticker.count] == undefined){
      localSettings.ticker.count = 0;
  }

  $('.ticker .content .tickTemplate').clone().appendTo('.ticker .content').removeClass('tickTemplate').addClass('tick').attr('id', 'tick_'+localSettings.ticker.id);
  $('.ticker .content .tick#tick_' + localSettings.ticker.id + ' p').html(localSettings.ticker.array[localSettings.ticker.count]);
  ticker_animation(localSettings.ticker.id);
  if (localSettings.ticker.count == 999) {
      localSettings.ticker.count = 0;
  }
  else {
      localSettings.ticker.count++;
  }
  localSettings.ticker.id++;
}

function ticker_deleteTick(tickID){
  $('.ticker .content .tick#tick_'+tickID).remove();
}

function ticker_animation(tickID){
  let tickID_Saved = tickID;    
  let selector = '.ticker .content .tick#tick_' + tickID;
  requestAnimationFrame(() => {
    let tickWidth = $(selector).width();
    let duration_1 = ticker_getDuration_1(tickWidth, localSettings.ticker.speed) * 1000;
    let duration_2 = ticker_getDuration_2((0 - tickWidth), (0 - (1920 + tickWidth)), localSettings.ticker.speed) * 1000;

    animeAnimate({
      targets: selector,
      translateX: 0,
      duration: 0,
      ease: "linear",
    });

    let tickerTL = animeTimeline({
      ease: "linear",
      autoplay: true,
    });

    tickerTL
      .add({
        targets: selector,
        translateX: [0, (0 - tickWidth)],
        ease: "linear",
        duration: duration_1,
      })
      .call(() => {
        ticker_newTick();
      })
      .add({
        targets: selector,
        translateX: [(0 - tickWidth), (0 - (1920 + tickWidth))],
        ease: "linear",
        duration: duration_2,
      })
      .call(() => {
        ticker_deleteTick(tickID_Saved);
      });
  });
}

function ticker_getDuration_1(distance, pixelsPerSecond){
  let duration = distance / pixelsPerSecond;
  return duration;
}  

function ticker_getDuration_2(start, end, pixelsPerSecond){
  let duration = Math.abs((start - end) / pixelsPerSecond);
  return duration;
}



setInterval(function(){
  let now = DateTime.now().setLocale('nl');
  $('.ticker-container .clock').html(now.toFormat('HH:mm'));
  $('.weather .pill h2').html(now.toFormat('ccc dd MMMM'));
}, 200);




// SOCKETIO CONNECTOR ########################################
function socketIOConnector() {
  // // SOCKETIO | INIT
  let socketIO = io.connect(window.location.origin, {
    reconnection: true,
    reconnectionDelay: 10000,
    query: {
      room: "templates",
    },
  });
  
  // SOCKETIO | MESSAGE | CONNECT
  socketIO.on("connect", function (data) {
    console.log(
      `${DateTime.now().toFormat(
        "yyyy-MM-dd, HH:mm:ss.SSS"
      )}\tSocketIO\tConnected To UI Server`
    );
    if(localSettings.connectedToServer === undefined) {
      localSettings.connectedToServer = true;
    }
    else if(localSettings.connectedToServer === false) {
      location.reload(true);
    }
  });

  socketIO.on("disconnect", function (data) {
    console.log(
      `${DateTime.now().toFormat(
        "yyyy-MM-dd, HH:mm:ss.SSS"
      )}\tSocketIO\tDisconnected From UI Server`
    );
    localSettings.connectedToServer = false;
  });

  // SOCKETIO | MESSAGE | HISTORY
  socketIO.on(`data|epg`, (epgDataReceived) => { 
    if(JSON.stringify(localSettings.EPG) !== JSON.stringify(epgDataReceived)) {
      localSettings.EPG = epgDataReceived;
      updateEPG(globalSettings.API.edition);
    }   
  });

  // SOCKETIO | MESSAGE | HISTORY
  socketIO.on(`data|news`, (newsDataReceived) => {
    
    if (localSettings.newsItemsFull.length === 0) {
      localSettings.newsItemsFull = newsDataReceived;
      localSettings.newsItemsFull.sort(dynamicSortMultiple("-postedAt"));
    } else {
      localSettings.newsItemsFull = newsDataReceived;
      localSettings.newsItemsFull.sort(dynamicSortMultiple("-postedAt"));
    }

    localSettings.newsItemsFull.forEach(newsItem => {
      localSettings.ticker.array.push(newsItem.title);
    });
    if (localSettings.ticker.started == false) {
      ticker_newTick();
      localSettings.ticker.started = true;
  }
  });

  socketIO.on(`data|weather`, (weatherDataReceived) => {
    if(JSON.stringify(localSettings.weatherData) != JSON.stringify(weatherDataReceived)) {
      localSettings.weatherData = weatherDataReceived;
      updateWeather();
    }
  });

  socketIO.on(`data|sports|soccer`, (soccerDataReceived) => {

    if(JSON.stringify(localSettings.sportsData.soccer) != JSON.stringify(soccerDataReceived)) {      
      localSettings.sportsData.soccer = soccerDataReceived;
      updateSports('soccer');
    }
    
  });

  // SOCKETIO | MESSAGE | HISTORY
  // socketIO.on(`nowplaying`, (nowPlayingDataReceived) => {
  //   localSettings.omniData = nowPlayingDataReceived;
  //   updateNowPlaying();
  // });

  socketIO.on(`nowplaying`, (nowPlayingDataReceived) => {
    if(JSON.stringify(localSettings.nowPlayingData) != JSON.stringify(nowPlayingDataReceived)) {
      localSettings.nowPlayingData = nowPlayingDataReceived;
      updateNowPlaying();
    }
  });

  socketIO.on(`globalsettings`, (globalsettingsReceived) => {
    globalSettings = globalsettingsReceived;
  });

  socketIO.on(`reload|teksttv`, () => {
    location.reload(true);
  });
}

function dynamicSort(property) {
  var sortOrder = 1;
  if (property[0] === "-") {
    sortOrder = -1;
    property = property.substr(1);
  }
  return function (a, b) {
    var result =
      a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;
    return result * sortOrder;
  };
}

function dynamicSortMultiple() {
  var props = arguments;
  return function (obj1, obj2) {
    var i = 0,
      result = 0,
      numberOfProperties = props.length;
    while (result === 0 && i < numberOfProperties) {
      result = dynamicSort(props[i])(obj1, obj2);
      i++;
    }
    return result;
  };
}

