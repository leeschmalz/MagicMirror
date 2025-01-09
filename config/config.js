/* MagicMirror² Config Sample
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 *
 * For more information on how you can configure this file
 * see https://docs.magicmirror.builders/configuration/introduction.html
 * and https://docs.magicmirror.builders/modules/configuration.html
 */
let config = {
	address: "localhost", 	// Address to listen on, can be:
							// - "localhost", "127.0.0.1", "::1" to listen on loopback interface
							// - another specific IPv4/6 to listen on a specific interface
							// - "0.0.0.0", "::" to listen on any interface
							// Default, when address config is left out or empty, is "localhost"
	port: 8080,
	basePath: "/", 	// The URL path where MagicMirror² is hosted. If you are using a Reverse proxy
					// you must set the sub path here. basePath must end with a /
	ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"], 	// Set [] to allow all IP addresses
															// or add a specific IPv4 of 192.168.1.5 :
															// ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.1.5"],
															// or IPv4 range of 192.168.3.0 --> 192.168.3.15 use CIDR format :
															// ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.3.0/28"],

	useHttps: false, 		// Support HTTPS or not, default "false" will use HTTP
	httpsPrivateKey: "", 	// HTTPS private key path, only require when useHttps is true
	httpsCertificate: "", 	// HTTPS Certificate path, only require when useHttps is true

	language: "en",
	locale: "en-US",
	logLevel: ["INFO", "LOG", "WARN", "ERROR"], // Add "DEBUG" for even more logging
	timeFormat: 12,
	units: "imperial",
	// serverOnly:  true/false/"local" ,
	// local for armv6l processors, default
	//   starts serveronly and then starts chrome browser
	// false, default for all NON-armv6l devices
	// true, force serveronly mode, because you want to.. no UI on this device

	modules: [
		{
			module: "alert",
		},
		{
			module: "clock",
			position: "top_right",
			config: {
				timezone: "America/Chicago",
				showPeriodUpper: true,
				displaySeconds: false,
				clockBold: false
			}
		},
		//{
			//module: "weather",
			//position: "top_left",
			//config: {
				//weatherProvider: "openweathermap",
				//type: "current",
				//location: "Chicago",
				//locationID: "4887398", //ID from http://bulk.openweathermap.org/sample/city.list.json.gz; unzip the gz file and find your city
				//apiKey: "0f0847c995bbb11d2e6064e82fdd272f",
				//onlyTemp: false,
				//roundTemp: true,
				//degreeLabel: true,
				//showWindDirection: false
			//}
		//},
		//{
			//module: "weather",
			//position: "top_left",
			//header: "Weather Forecast",
			//config: {
				//weatherProvider: "openweathermap",
				//type: "forecast",
				//location: "Chicago",
				//locationID: "4887398", //ID from http://bulk.openweathermap.org/sample/city.list.json.gz; unzip the gz file and find your city
				//apiKey: "0f0847c995bbb11d2e6064e82fdd272f",
				//colored: true,
				//fadePoint:0.5
			//}
		//},
		{
		  module: "MMM-OpenWeatherMapForecast",
		  header: "Weather",
		  position: "top_left",
		  classes: "default everyone",
		  disabled: false,
		  config: {
			apikey: "1f2b7a974c2266cd26ee0d8579ff87ff",
			latitude: "45.088200",
			longitude: "-93.738457",     
			iconset: "6oa",
			concise: false,
			forecastLayout: "tiled",
			maxHourliesToShow: 7,
			maxDailiesToShow: 5,
			showWind: false,
			showSummary: false,
			hourlyForecastInterval:1,
			units:"imperial",
			showPrecipitation:false,
			showCurrentConditions:false,
			includeTodayInDailyForecast:false
		  }
		},
		{
			module: "calendar",
			//position: "left", // This can be any of the regions. Best results in left or right regions.
			header: "Calendar",
			config: {
			maximumEntries: 15,
			calendars: [
					{
						symbol: 'calendar-check-o ',
						url: "webcal://p59-caldav.icloud.com/published/2/MTQ4MDIxMTg1NTE0ODAyMcTdYM8lHl_S6Rdx8DDI9_LsjgD4uOOrTVRyeDTT1Rpg"
					}
				]
			},
		},
		{
			module: "MMM-Goals",
			position: "middle_center",
			config: {
			  gaugeType: 'minimal',
			  interval: 5
			}
		 },
		{
			module: "MMM-CalendarExt3",
			position: "middle_center",
			config:{
				mode: "month",
				calendarSet:'us_holiday',
				fontsize:"18px",
				eventHeight:"22px",
				firstDayOfWeek:0
			}
		},
		//{
			//module: 'MMM-CTA',
			//position: 'bottom_right',
			//config: {
				//updateTime: 60000, // 1 minute, the API does not update much more often so going below this is unnecessary
				//ctaApiKey: 'VgjpTiGv2Gid4q2iQDh9qxgzr',
				//busStopName: '',  // String value, Name your bus stop
				////stopId: 561, // Bus station ID: Chicago and Milwaukee example; go to http://www.transitchicago.com/riding_cta/systemguide/default.aspx to find your stop ID
				////maxResult: 1,  // The maximum number of incoming bussesy you want to display for bus stops
				//ctaApiKeyTrain: '392d9cb864b147d8a982712456dd5ba6',
				//trainStopName: 'Argyle',  //String value, name your train stop
				//trainStationID: 41200, //Train station ID:  Chicago Blue line example; http://www.transitchicago.com/developers/ttdocs/default.aspx#_Toc296199909
				//maxResultTrain: 5, // Max number of incoming trains to disply
				//moduleInstance: 1, // To run multiple instances of this module
			//},
		 //},
		{
			module: 'MMM-Todoist',
			position: 'right',	// This can be any of the regions. Best results in left or right regions.
			header: 'To Do', // This is optional
			config: { // See 'Configuration options' for more information.
				hideWhenEmpty: false,
				accessToken: 'ade8153afa85634ef5f4e858e03b864fa9528410',
				maximumEntries: 10,
				updateInterval: 10*60*1000, // Update every 10 minutes
				fade: false,      
				// projects and/or labels is mandatory:
				projects: [ 2306461384 ], 
				labels: ["Task"], // Tasks for any projects with these labels will be shown.
				displayTasksWithinDays: 1
		  }
		},
		{
			module: "MMM-cryptocurrency",
			position: "bottom_left",
			config: {
				apikey: 'ca8e85bb-b517-46b1-867e-d87c14765b49',
				apiDelay: 1,
				currency: ['bitcoin', 'ethereum', 'xrp'],
				conversion: 'USD',
				headers: ['change24h', 'change7d'],
				displayType: 'logo',
				showGraphs: true,
				maximumFractionDigits: [0,2,0] // these are out of order for whatever reason: btc, xrp, eth
			}
		},
		{
			module: "MMM-AVStock",
			position: "bottom_left", //"bottom_bar" is better for `mode:ticker`
			config: {
			timeFormat: "DD-MM HH:mm",
			width: 60,
			symbols : ["MSTR","COIN","NVDA","GC=F","^GSPC"],
			alias : ["MSTR","COIN","NVDA","GOLD","S&P500"],
			tickerDuration: 20,
			chartDays: 90,
			maxTableRows: null,
			mode : "table",                  // "table" or "ticker"
			chartInterval: "daily",          // choose from ["intraday", "daily", "weekly", "monthly"]
			decimals : 2,
			showPurchasePrices: false,
			showPerformance2Purchase: false,
			showChart: false,
			debug: false
		}
		},
		{
			module:'MMM-TiHimawari8Earth',
			position:'bottom_right',
			config:{}
		}
	]
};
// command to get mint data
// mintapi --headless --config-file mint_config.cfg leeschmalz@gmail.com 

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {module.exports = config;}
