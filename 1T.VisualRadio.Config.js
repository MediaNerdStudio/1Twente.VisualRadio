require("dotenv").config();

// Main Settings
module.exports = {
  appserver: {
    ui: process.env.PORT_UI,
  },
  API: {
    nowplaying: process.env.API_WATHOORDEIK_HOST,
    edition: process.env.EDITION,
    edition_nowplaying: process.env.EDITION_NOWPLAYING,
    EenTwente: {
      baseURL: process.env.API_1TWENTE_HOST,
      newsOverview: "/news/overview",
      newsItem: "/news/",
      nowplaying: {
        enschede: {
          last: "/radio/enschede/nowplaying/latest-1",
          last_5: "/radio/enschede/nowplaying/latest-5",
          last_10: "/radio/enschede/nowplaying/latest-10",
        },
        hengelo: {
          last: "/radio/hengelo/nowplaying/latest-1",
          last_5: "/radio/hengelo/nowplaying/latest-5",
          last_10: "/radio/hengelo/nowplaying/latest-10",
        },
        twentefm: {
          last: "/radio/twentefm/nowplaying/latest-1",
          last_5: "/radio/twentefm/nowplaying/latest-5",
          last_10: "/radio/twentefm/nowplaying/latest-10",
        },
      },
      EPG: {
        enschede: {
          OnAir: "/radio/enschede/epg/onair", 
          Upcoming: "/radio/enschede/epg/upcoming",
          Today: "/radio/enschede/epg/today",
          Tomorrow: "/radio/enschede/epg/",
        },
        hengelo: {
          OnAir: "/radio/hengelo/epg/onair",
          Upcoming: "/radio/hengelo/epg/upcoming",
          Today: "/radio/hengelo/epg/today",
          Tomorrow: "/radio/hengelo/epg/",
        },
        twentefm: {
          OnAir: "/radio/twentefm/epg/onair",
          Upcoming: "/radio/twentefm/epg/upcoming",
          Today: "/radio/twentefm/epg/today",
          Tomorrow: "/radio/twentefm/epg/",
        },
      },   
    },
    weather: {
        api: {
          forecast_hours: 'https://api.weer.nl/v1/weather/forecast/hours?location=<LONG>,<LAT>&time=<DATETIME>&hours=25&timestamp=<DATETIME>',
          // https://api.weer.nl/v1/weather/forecast/hours?location=6.9,52.2&time=2026-01-11T17:00:00.000Z&hours=25&timestamp=2026-01-11T17:00:00.000Z
          forecast_days: 'https://api.weer.nl/v1/weather/forecast/days?location=<LONG>,<LAT>&date=<DATETIME>&days=14',
          // https://api.weer.nl/v1/weather/forecast/days?location=6.7,52.4&date=2026-01-10T13:00:00.000Z&days=14
          warnings: 'https://api.weer.nl/v1/weather/current/warnings?location=<LONG>,<LAT>',
          // https://api.weer.nl/v1/weather/current/warnings?location=6.9,52.2
        },
        warnings: [],
        locations: [
          {
            // ENSCHEDE
            name: "Weerstation Twente",
            location: [6.890952, 52.220847],            
            forecast_hours: [],
            forecast_days: []
          },
        ],
      },
  },
};




