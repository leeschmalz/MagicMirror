const NodeHelper = require("node_helper");
const fs = require("fs").promises; // Use promise-based fs
const moment = require("moment");
const fetch = require("node-fetch");

const CONFIG = {
	API_TOKEN: "3e917968331b2a09c0e8f3e808af2aa7500414a2",
	BASE_URL: "https://exist.io/api/2/attributes/values/",
	DATA_PATH: "/home/lee/Documents/MagicMirror/extdata",
	TIMEZONE_OFFSET: "T00:00:00.000-06:00" // CST timezone
};

module.exports = NodeHelper.create({
	start: function () {
		console.log(`${this.name} helper started ...`);
	},

	async socketNotificationReceived(notification, payload) {
		if (notification === "GOALS_UPDATE") {
			try {
				const data = await this.refreshData();
				this.sendSocketNotification("GOALS_UPDATE", data);
			} catch (error) {
				console.error("Error in socketNotificationReceived:", error);
			}
		}
	},

	// Helper function to fetch data from Exist API
	async fetchExistData(attribute, limit = 100) {
		console.log(`Refreshing ${attribute}`);

		const params = new URLSearchParams({ attribute, limit });
		const response = await fetch(`${CONFIG.BASE_URL}?${params}`, {
			method: "GET",
			headers: { Authorization: `Token ${CONFIG.API_TOKEN}` }
		});

		if (!response.ok) {
			throw new Error(`API request failed for ${attribute}: ${response.statusText}`);
		}

		const data = await response.json();
		return data.results;
	},

	// Helper function to read and parse JSON file
	async readJSONFile(filename) {
		try {
			const data = await fs.readFile(`${CONFIG.DATA_PATH}/${filename}`);
			return JSON.parse(data);
		} catch (error) {
			if (error.code === "ENOENT") {
				// Return default structure if file doesn't exist
				return { lastRefreshed: -1, value: 0 };
			}
			throw error;
		}
	},

	// Helper function to write JSON file
	async writeJSONFile(filename, data) {
		try {
			await fs.writeFile(`${CONFIG.DATA_PATH}/${filename}`, JSON.stringify(data, null, 2));
		} catch (error) {
			console.error(`Error writing to ${filename}:`, error);
			throw error;
		}
	},

	// Helper function to filter results by current month
	filterByCurrentMonth(results) {
		const currentMonth = new Date().getMonth();
		return results.filter((result) => {
			const resultDate = new Date(`${result.date}${CONFIG.TIMEZONE_OFFSET}`);
			return resultDate.getMonth() === currentMonth;
		});
	},

	// Helper function to sum values from results
	sumValues(results) {
		return results.reduce((acc, cur) => acc + cur.value, 0);
	},

	// Main data refresh function
	async refreshData() {
		const currentMinute = new Date().getMinutes();
		const results = {};

		try {
			// Handle Drinks
			const drinksFile = await this.readJSONFile("current_drinks.json");
			if (drinksFile.lastRefreshed !== currentMinute) {
				const drinkData = await this.fetchExistData("alcoholic_drinks");
				const monthlyDrinks = this.sumValues(this.filterByCurrentMonth(drinkData));
				await this.writeJSONFile("current_drinks.json", {
					lastRefreshed: currentMinute,
					value: monthlyDrinks
				});
				results.drinks = monthlyDrinks;
			} else {
				results.drinks = drinksFile.value;
			}

			// Handle Pages
			const pagesFile = await this.readJSONFile("current_pages.json");
			if (pagesFile.lastRefreshed !== currentMinute) {
				const pagesData = await this.fetchExistData("pages_read");
				const monthlyPages = this.sumValues(this.filterByCurrentMonth(pagesData));
				await this.writeJSONFile("current_pages.json", {
					lastRefreshed: currentMinute,
					value: monthlyPages
				});
				results.pages = monthlyPages;
			} else {
				results.pages = pagesFile.value;
			}

			// Handle Miles
			const milesFile = await this.readJSONFile("current_miles.json");
			if (milesFile.lastRefreshed !== currentMinute) {
				const [milesData, cyclingData] = await Promise.all([this.fetchExistData("workouts_distance"), this.fetchExistData("cycle_distance")]);

				const filteredRunning = this.filterByCurrentMonth(milesData);
				const filteredCycling = this.filterByCurrentMonth(cyclingData);

				const runningMiles = this.sumValues(filteredRunning);
				const cyclingMiles = this.sumValues(filteredCycling);

				// Convert to miles and apply cycling ratio
				const totalMiles = (runningMiles - cyclingMiles) * 0.62 + (cyclingMiles * 0.62) / 4;

				await this.writeJSONFile("current_miles.json", {
					lastRefreshed: currentMinute,
					value: totalMiles
				});
				results.miles = totalMiles.toFixed(2);
			} else {
				results.miles = milesFile.value.toFixed(2);
			}

			// Handle Weight Lifting
			const wlFile = await this.readJSONFile("current_wl.json");
			if (wlFile.lastRefreshed !== currentMinute) {
				const wlData = await this.fetchExistData("weight_lifting");
				const monthlyWL = this.sumValues(this.filterByCurrentMonth(wlData));
				await this.writeJSONFile("current_wl.json", {
					lastRefreshed: currentMinute,
					value: monthlyWL
				});
				results.wl = monthlyWL;
			} else {
				results.wl = wlFile.value;
			}

			// Add deprecated cc value
			results.cc = 0;

			return results;
		} catch (error) {
			console.error("Error in refreshData:", error);
			throw error;
		}
	}
});
