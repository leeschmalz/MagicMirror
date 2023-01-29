const NodeHelper = require("node_helper");
const Log = require("logger");
const fs = require("fs");

module.exports = NodeHelper.create({
	start() {
		Log.log("MMM-JsonTable helper started...");
	},

	getJson(filepath) {
		const self = this;

		fs.readFile(filepath, "utf8", (err, data) => {
			if (err) {
				Log.log(`Error reading file: ${err}`);
				return;
			}

			const json = JSON.parse(data);

			// Send the json data back with the filepath to distinguish it on the receiving part
			self.sendSocketNotification("MMM-JsonTable_JSON_RESULT", {
				filepath,
				data: json
			});
		});
	},

	// Subclass socketNotificationReceived received.
	socketNotificationReceived(notification, filepath) {
		if (notification === "MMM-JsonTable_GET_JSON") {
			this.getJson(filepath);
		}
	}
});
