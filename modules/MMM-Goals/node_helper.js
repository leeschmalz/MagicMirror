var NodeHelper = require("node_helper");
var exec = require("child_process").exec;
var fs = require("fs");
var moment = require("moment");
const fetch = require("node-fetch");

module.exports = NodeHelper.create({
  start: function () {
    console.log(this.name + " helper started ...");
  },
  socketNotificationReceived: function (notification, payload) {
    if (notification == "GOALS_UPDATE") {
      this.sendSocketNotification("GOALS_UPDATE", refreshData());
    }
  }
});

// TO DO: for some reason this returns 400 error. see get_attribute_history.py for working python version of it
async function getDrinks() {
  const response = await fetch("https://exist.io/api/2/attributes/values/", {
    method: "GET",
    params: {
      attribute: "alcoholic_drinks",
      limit: 100
    },
    headers: {
      Authorization: "Token 3e917968331b2a09c0e8f3e808af2aa7500414a2"
    }
  });

  return response;
}

async function refreshData() {
  // GET SPENDING FROM PRE-PROCESSING MINT API FILE
  var data = fs.readFileSync(
    "/home/pi/Documents/MagicMirror/extdata/current_transaction_processed.csv"
  );

  // Convert the data to a string and split it into rows
  var rows = data.toString().split("\n");

  // Get the current date and the start and end of the week
  var now = moment();
  var startOfMonth = moment().startOf("month");
  var endOfMonth = moment().endOf("month");

  // Filter the rows to keep only those with a "date" within this week
  var filteredRows = rows.filter((row) => {
    var date = row.split(",")[0]; // Assumes the "date" column is the first column
    return moment(date, "YYYY-MM-DD").isBetween(startOfMonth, endOfMonth);
  });

  // Calculate the sum of the "amount" column
  var sum_spending = filteredRows.reduce((total, row) => {
    var amount = row.split(",")[2]; // Assumes the "amount" column is the second column
    return total + parseFloat(amount) * -1;
  }, 0);

  // GET ALCOHOLIC DRINKS FROM EXIST
  const response = await getDrinks();

  console.log(response);

  // Return the sums
  return { cc: sum_spending, drinks: 0 };
}
