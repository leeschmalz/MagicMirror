var NodeHelper = require("node_helper");
var exec = require("child_process").exec;
var fs = require("fs");
var moment = require("moment");
const fetch = require("node-fetch");

let firstWrite = false;

module.exports = NodeHelper.create({
	start: function () {
		console.log(this.name + " helper started ...");
	},
	async socketNotificationReceived(notification, payload) {
		if (notification == "GOALS_UPDATE") {
			try {
				const data = await refreshData();
				this.sendSocketNotification("GOALS_UPDATE", data);
			} catch (error) {
				console.error(error);
			}
		}
	}
});

// gets alcoholic_drinks param from exist api
async function getDrinks() {
	console.log("Refreshing Drinks");

	const searchParamsDrinks = new URLSearchParams({
		attribute: "alcoholic_drinks",
		limit: 100
	});

	let drinksResponse = await fetch("https://exist.io/api/2/attributes/values/?" + searchParamsDrinks, {
		method: "GET",
		headers: {
			Authorization: "Token 3e917968331b2a09c0e8f3e808af2aa7500414a2"
		}
	});

	let drinksResponseData = await drinksResponse.json();
	let drinksResponseDataResults = await drinksResponseData.results;

	return drinksResponseDataResults;
}

// gets pages read param from exist api
async function getPages() {
	console.log("Refreshing Pages");

	const searchParamsPages = new URLSearchParams({
		attribute: "pages_read",
		limit: 100
	});

	let pagesResponse = await fetch("https://exist.io/api/2/attributes/values/?" + searchParamsPages, {
		method: "GET",
		headers: {
			Authorization: "Token 3e917968331b2a09c0e8f3e808af2aa7500414a2"
		}
	});

	let pagesResponseData = await pagesResponse.json();
	let pagesResponseDataResults = await pagesResponseData.results;

	return pagesResponseDataResults;
}

// gets workouts_distance attribute from exist api
async function getMiles() {
	console.log("Refreshing Miles");

	const searchParamsMiles = new URLSearchParams({
		attribute: "workouts_distance",
		limit: 100
	});

	let milesResponse = await fetch("https://exist.io/api/2/attributes/values/?" + searchParamsMiles, {
		method: "GET",
		headers: {
			Authorization: "Token 3e917968331b2a09c0e8f3e808af2aa7500414a2"
		}
	});

	let milesResponseData = await milesResponse.json();
	let milesResponseDataResults = await milesResponseData.results;

	return milesResponseDataResults;
}

// gets cycle_distance attribute from exist api
async function getCyclingMiles() {
	console.log("Refreshing Cycle Miles");

	const searchParamsMiles = new URLSearchParams({
		attribute: "cycle_distance",
		limit: 100
	});

	let cyclingMilesResponse = await fetch("https://exist.io/api/2/attributes/values/?" + searchParamsMiles, {
		method: "GET",
		headers: {
			Authorization: "Token 3e917968331b2a09c0e8f3e808af2aa7500414a2"
		}
	});

	let cycleResponseData = await cyclingMilesResponse.json();
	let cycleResponseDataResults = await cycleResponseData.results;

	return cycleResponseDataResults;
}

// gets workouts_distance attribute from exist api
async function getWL() {
	console.log("Refreshing WL");

	const searchParamsWL = new URLSearchParams({
		attribute: "weight_lifting",
		limit: 100
	});

	let wlResponse = await fetch("https://exist.io/api/2/attributes/values/?" + searchParamsWL, {
		method: "GET",
		headers: {
			Authorization: "Token 3e917968331b2a09c0e8f3e808af2aa7500414a2"
		}
	});

	let wlResponseData = await wlResponse.json();
	let wlResponseDataResults = await wlResponseData.results;

	return wlResponseDataResults;
}

async function refreshData() {
	// GET SPENDING FROM PRE-PROCESSING MINT API FILE
	var data = fs.readFileSync("/home/pi/Documents/MagicMirror/extdata/current_transaction_processed.csv");

	// Convert the data to a string and split it into rows
	var rows = data.toString().split("\n");

	// Get the current date and the start and end of the month
	var startOfMonth = moment().startOf("month");
	var endOfMonth = moment().endOf("month");

	// Filter the rows to keep only those with a "date" within this month
	var filteredRows = rows.filter((row) => {
		var date = row.split(",")[0]; // Assumes the "date" column is the first column
		return moment(date, "YYYY-MM-DD").isBetween(startOfMonth, endOfMonth, null, "[]");
	});

	// Calculate the sum of the "amount" column
	var monthlySpending = filteredRows.reduce((total, row) => {
		var amount = row.split(",")[2]; // Assumes the "amount" column is the second (third) column
		return total + parseFloat(amount) * -1;
	}, 0);

	// ALCOHOLIC DRINKS
	const currentDrinksRaw = fs.readFileSync("/home/pi/Documents/MagicMirror/extdata/current_drinks.json");
	const currentDrinks = JSON.parse(currentDrinksRaw);
	const currentPeriodDrinks = new Date().getMinutes();

	// refresh drinks if it hasnt been refreshed in the last period (i.e minute, hour)
	if (currentDrinks.lastRefreshed != currentPeriodDrinks) {
		// GET ALCOHOLIC DRINKS FROM EXIST
		const drinkData = await getDrinks();
		const currentMonth = new Date().getMonth();
		const filteredResults = drinkData.filter((result) => {
			const resultDate = new Date(`${result.date}T00:00:00.000-06:00`); // UTC to CST
			return resultDate.getMonth() === currentMonth;
		});

		const monthlyDrinks = filteredResults.reduce((acc, cur) => acc + cur.value, 0);

		const currentDrinks = {
			lastRefreshed: currentPeriodDrinks,
			drinks: monthlyDrinks
		};

		fs.writeFileSync("/home/pi/Documents/MagicMirror/extdata/current_drinks.json", JSON.stringify(currentDrinks));
	}

	var monthlyDrinks = currentDrinks.drinks;
	// ALCOHOLIC DRINKS

	// PAGES READ
	const currentPagesRaw = fs.readFileSync("/home/pi/Documents/MagicMirror/extdata/current_pages.json");
	const currentPages = JSON.parse(currentPagesRaw);
	const currentPeriodPages = new Date().getMinutes();

	// refresh drinks if it hasnt been refreshed in the last period (i.e minute, hour)
	if (currentPages.lastRefreshed != currentPeriodPages) {
		// GET PAGES FROM EXIST
		const pagesData = await getPages();
		const currentMonth = new Date().getMonth();
		const filteredResults = pagesData.filter((result) => {
			const resultDate = new Date(`${result.date}T00:00:00.000-06:00`); // UTC to CST
			return resultDate.getMonth() === currentMonth;
		});

		const monthlyPages = filteredResults.reduce((acc, cur) => acc + cur.value, 0);

		const currentPages = {
			lastRefreshed: currentPeriodPages,
			pages: monthlyPages
		};

		fs.writeFileSync("/home/pi/Documents/MagicMirror/extdata/current_pages.json", JSON.stringify(currentPages));
	}
	var monthlyPages = currentPages.pages;
	// PAGES READ

	// MILES RUN
	const currentMilesRaw = fs.readFileSync("/home/pi/Documents/MagicMirror/extdata/current_miles.json");
	const currentMiles = JSON.parse(currentMilesRaw);
	const currentPeriodMiles = new Date().getMinutes();

	if (currentMiles.lastRefreshed != currentPeriodMiles) {
		// GET MILES FROM EXIST
		const milesData = await getMiles();
		const cyclingMilesData = await getCyclingMiles();

		const currentMonth = new Date().getMonth();

		const filterResultsByMonth = (data) => {
			return data.filter((result) => {
				const resultDate = new Date(`${result.date}T00:00:00.000-06:00`); // UTC to CST
				return resultDate.getMonth() === currentMonth;
			});
		};

		const filteredRunningResults = filterResultsByMonth(milesData);
		const filteredCyclingResults = filterResultsByMonth(cyclingMilesData);

		const monthlyRunningMilesRaw = filteredRunningResults.reduce((acc, cur) => acc + cur.value, 0);
		const monthlyCyclingMilesRaw = filteredCyclingResults.reduce((acc, cur) => acc + cur.value, 0);

		const monthlyMilesRunRaw = monthlyRunningMilesRaw - monthlyCyclingMilesRaw;
		const monthlyMilesRun = monthlyMilesRunRaw * 0.62; // convert from km
		const monthlyMiles = monthlyMilesRun + (monthlyCyclingMilesRaw * 0.62) / 4; // 4 cycle miles count for 1 running mile

		const currentMiles = {
			lastRefreshed: currentPeriodMiles,
			miles: monthlyMiles
		};

		fs.writeFileSync("/home/pi/Documents/MagicMirror/extdata/current_miles.json", JSON.stringify(currentMiles));
	}
	var monthlyMiles = currentMiles.miles;
	// MILES RUN

	// WEIGHT LIFTING
	const currentWLRaw = fs.readFileSync("/home/pi/Documents/MagicMirror/extdata/current_wl.json");
	const currentWL = JSON.parse(currentWLRaw);
	const currentPeriodWL = new Date().getMinutes();

	if (currentWL.lastRefreshed != currentPeriodWL) {
		// GET WEIGHT LIFTING FROM EXIST
		const wlData = await getWL();

		const currentMonth = new Date().getMonth();
		const filteredResults = wlData.filter((result) => {
			const resultDate = new Date(`${result.date}T00:00:00.000-06:00`); // UTC to CST
			return resultDate.getMonth() === currentMonth;
		});

		const monthlyWL = filteredResults.reduce((acc, cur) => acc + cur.value, 0);

		const currentWL = {
			lastRefreshed: currentPeriodWL,
			wl: monthlyWL
		};

		fs.writeFileSync("/home/pi/Documents/MagicMirror/extdata/current_wl.json", JSON.stringify(currentWL));
	}

	var monthlyWL = currentWL.wl;
	// WEIGHT LIFTING

	// Return the sums
	return {
		cc: monthlySpending,
		drinks: monthlyDrinks,
		pages: monthlyPages,
		miles: monthlyMiles.toFixed(2),
		wl: monthlyWL
	};
}
