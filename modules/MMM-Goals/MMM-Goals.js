var ccspend, drinksconsumed;
Module.register("MMM-Goals", {
  // Default module config.
  defaults: {
    gaugeType: "minimal",
    text: "",
    interval: 60
  },

  payload: [],

  /**
   * Main entry point from MagicMirror
   *
   * @return {void}
   */
  start() {
    Log.info("Starting module: " + this.name);

    let speed = this.config.hasOwnProperty("speed")
      ? !/^(auto|0)$/i.test(this.config.speed)
        ? this.config.speed
        : false
      : false;

    this.nodeHelperConfig = {
      gaugeType: this.config.gaugeType,
      interval: this.config.interval
    };

    this.initializeUpdate();
    this.setUpdateInterval();
  },

  /**
   * Creates a "timer" to update the page on a interval
   *
   * @return {void}
   */
  setUpdateInterval() {
    this.updater = setInterval(() => {
      this.initializeUpdate();
    }, this.config.interval * 1000);
  },

  /**
   * Send config to node helper to wait on the retrieval of new posts
   *
   * @return {void}
   */
  initializeUpdate() {
    this.sendSocketNotification("GOALS_UPDATE", {
      config: this.nodeHelperConfig
    });
  },

  /**
   * Load javascripts
   *
   * @return {void}
   */
  getScripts() {
    return [
      this.file("js/justgage-1.2.2/justgage.js"),
      this.file("js/justgage-1.2.2/raphael-2.1.4.min.js"),
      this.file("js/jquery.js")
    ];
  },

  /**
   * Load CSS styles
   *
   * @return {void}
   */
  getStyles() {
    var styles = [this.file("css/style.css")];

    return styles;
  },

  /**
   * Returns an HTML DOM object with the elements to be added to the page
   *
   * @return {object} wrapper an HTML DOM object with the elements to be added to the page
   */
  getDom() {
    var wrapper = document.createElement("div");

    var creditCardSpendingGauge = document.createElement("div");
    creditCardSpendingGauge.id = "creditCardSpendingGauge";

    var drinksConsumedGauge = document.createElement("div");
    drinksConsumedGauge.id = "drinksConsumedGauge";

    wrapper.appendChild(creditCardSpendingGauge);
    wrapper.appendChild(drinksConsumedGauge);

    return wrapper;
  },

  /**
   * Process notifications from the application or other modules
   *
   * @return {void}
   */
  notificationReceived(notification, payload, sender) {
    if (notification == "DOM_OBJECTS_CREATED") {
      this.addScript();
    }
  },

  /**
   * Process socket notification from node_helper
   *
   * @return {void}
   */
  socketNotificationReceived(notification, payload) {
    Log.log(this.name + " socketNotificationReceived:" + notification);

    if (notification == "GOALS_UPDATE") {
      // payload: {cc: x,drinks: y}

      var cc = payload.cc;
      var drinks = payload.drinks;

      ccspend.refresh(cc, 2000);
      drinksconsumed.refresh(drinks, 6);
    }
  },

  /**
   * Adds javascript to the page. This needs to be called after the
   * cc and drinks DIVs have been added to the page
   *
   * @return {void}
   */
  addScript() {
    var script = document.createElement("script");

    if (this.config.gaugeType == "minimal") {
      script.innerHTML =
        "" + //'var ccspend, drinksconsumed;' +
        "ccspend = new JustGage({" +
        'id: "creditCardSpendingGauge",' +
        "value: 0," +
        "min: 0," +
        "max: 1000," +
        'title: "Credit Card Spending",' +
        'refreshAnimationType:"linear",' +
        'gaugeWidthScale: "0.8",' +
        'valueFontColor: "#fff",' +
        'valueFontFamily: "Roboto Condensed",' +
        'titleFontFamily: "Roboto Condensed",' +
        'titleFontColor: "#aaa",' +
        'gaugeColor: "#000",' +
        'levelColors: ["#fff"],' +
        "hideInnerShadow: true," +
        "hideMinMax: false," +
        "decimals: 2," +
        'label: "$",' +
        "humanFriendly: true," +
        'symbol: " "});' +
        "drinksconsumed = new JustGage({" +
        'id: "drinksConsumedGauge",' +
        "value: 0," +
        "min: 0," +
        "max: 100," +
        'title: "Alcoholic Drinks",' +
        'refreshAnimationType:"linear",' +
        'gaugeWidthScale: "0.8",' +
        'valueFontColor: "#fff",' +
        'valueFontFamily: "Roboto Condensed",' +
        'titleFontFamily: "Roboto Condensed",' +
        'titleFontColor: "#aaa",' +
        'gaugeColor: "#000",' +
        'levelColors: ["#fff"],' +
        "hideInnerShadow: true," +
        "hideMinMax: false," +
        "decimals: 2," +
        'label: "drinks",' +
        "humanFriendly: true," +
        'symbol: " "});';
    } else {
      script.innerHTML =
        "var ccspend, drinksconsumed;" +
        "ccspend = new JustGage({" +
        'id: "creditCardSpendingGauge",' +
        "value: 0," +
        "min: 0," +
        "max: 1000," +
        'title: "Credit Card Spending",' +
        'refreshAnimationType:"linear",' +
        'gaugeWidthScale: "0.8",' +
        'valueFontColor: "#fff",' +
        'valueFontFamily: "Roboto Condensed",' +
        'titleFontFamily: "Roboto Condensed",' +
        'titleFontColor: "#aaa",' +
        "formatNumber: true," +
        "hideMinMax: false," +
        "decimals: 2," +
        'label: "$",' +
        "humanFriendly: true," +
        'symbol: " "});' +
        "drinksconsumed = new JustGage({" +
        'id: "drinksConsumedGauge",' +
        "value: 0," +
        "min: 0," +
        "max: 100," +
        'title: "Alcoholic Drinks",' +
        'refreshAnimationType:"linear",' +
        'gaugeWidthScale: "0.8",' +
        'valueFontColor: "#fff",' +
        'valueFontFamily: "Roboto Condensed",' +
        'titleFontFamily: "Roboto Condensed",' +
        'titleFontColor: "#aaa",' +
        "formatNumber: true," +
        "hideMinMax: false," +
        "decimals: 2," +
        'label: "drinks",' +
        "humanFriendly: true," +
        'symbol: "  "});';
    }
    $(script).appendTo("body");
  }
});
