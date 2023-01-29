var StravaApiV3 = require("strava_api_v3");
var defaultClient = StravaApiV3.ApiClient.instance;

// Configure OAuth2 access token for authorization: strava_oauth
var strava_oauth = defaultClient.authentications["strava_oauth"];
strava_oauth.accessToken = "6c60601c5bd24e0930297dd8b38756a7cfb06264";

var api = new StravaApiV3.ActivitiesApi();

var id = 789; // {Long} The identifier of the activity.

var opts = {
	includeAllEfforts: true // {Boolean} To include all segments efforts.
};

var callback = function (error, data, response) {
	if (error) {
		console.error(error);
	} else {
		console.log("API called successfully. Returned data: " + data);
	}
};
api.getActivityById(id, opts, callback);
