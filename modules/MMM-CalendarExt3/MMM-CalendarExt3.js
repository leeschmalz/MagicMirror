Module.register("MMM-CalendarExt3", {
	defaults: {
		mode: "week", // or 'month'
		weekIndex: -1, // Which week from this week starts in a view. Ignored on mode 'month'
		weeksInView: 3, //  How many weeks will be displayed. Ignored on mode 'month'
		instanceId: null,
		firstDayOfWeek: 1, // 0: Sunday, 1: Monday
		minimalDaysOfNewYear: 4, // When the first week of new year starts in your country.
		locale: null, // 'de' or 'en-US' or prefer array like ['en-CA', 'en-US', 'en']
		cellDateOptions: {
			month: "short",
			day: "numeric"
		},
		eventTimeOptions: {
			timeStyle: "short"
		},
		headerWeekDayOptions: {
			weekday: "long"
		},
		headerTitleOptions: {
			month: "long"
		},
		calendarSet: [],
		maxEventLines: 5, // How many events will be shown in a day cell.
		fontSize: "18px",
		eventHeight: "22px",
		eventFilter: (ev) => {
			return true;
		},
		eventSorter: null,
		eventTransformer: (ev) => {
			return ev;
		},
		refreshInterval: 1000 * 60 * 30,
		waitFetch: 1000 * 5,
		glanceTime: 1000 * 60,
		animationSpeed: 1000,
		useSymbol: true,
		displayLegend: false,
		useWeather: true,
		weatherLocationName: null
	},

	getStyles: function () {
		return ["MMM-CalendarExt3.css"];
	},

	getMoment: function () {
		let moment = this.tempMoment ? new Date(this.tempMoment.valueOf()) : new Date();
		moment = this.mode === "month" ? new Date(moment.getFullYear(), moment.getMonth() + this.stepIndex, 1) : new Date(moment.getFullYear(), moment.getMonth(), moment.getDate() + 7 * this.stepIndex);
		return moment;
	},

	start: function () {
		this.mode = this.config.mode === "month" ? "month" : "week";
		this.locale = Intl.getCanonicalLocales(this.config.locale ?? config.language)?.[0] ?? "";
		this.instanceId = this.config.instanceId ?? this.identifier;
		this.weekIndex = this.mode === "month" ? 0 : this.config.weekIndex;
		this.weeksInView = this.mode === "month" ? 6 : this.config.weeksInView;
		this.stepIndex = 0;
		this.viewMoment = new Date();
		this.fetchTimer = null;
		this.viewTimer = null;
		this.refreshTimer = null;
		this.tempMoment = null;
		this.forecast = [];
		this.eventPool = new Map();
	},

	notificationReceived: function (notification, payload, sender) {
		const resetCalendar = () => {
			clearTimeout(this.viewTimer);
			this.viewTimer = null;
			this.stepIndex = 0;
			this.tempMoment = null;
			this.updateDom(this.config.animationSpeed);
		};

		if (notification === "CALENDAR_EVENTS") {
			this.eventPool.set(sender.identifier, JSON.parse(JSON.stringify(payload)));
			let calendarSet = Array.isArray(this.config.calendarSet) ? [...this.config.calendarSet] : [];
			if (calendarSet.length > 0) {
				this.eventPool.set(
					sender.identifier,
					this.eventPool
						.get(sender.identifier)
						.filter((ev) => {
							return calendarSet.includes(ev.calendarName);
						})
						.map((ev) => {
							let i =
								calendarSet.findIndex((name) => {
									return name === ev.calendarName;
								}) + 1;
							ev.calendarSeq = i;
							return ev;
						})
				);
			}
			this.storedEvents = [...this.eventPool.values()].reduce((result, cur) => {
				return [...result, ...cur];
			}, []);

			if (this.fetchTimer) {
				clearTimeout(this.fetchTimer);
				this.fetchTimer = null;
			}
			this.fetchTimer = setTimeout(() => {
				clearTimeout(this.fetchTimer);
				this.fetchTimer = null;
				this.updateDom(this.config.animationSpeed);
			}, this.config.waitFetch);
		}

		if (notification === "CX3_MOVE_CALENDAR" || notification === "CX3_GLANCE_CALENDAR") {
			if (notification === "CX3_MOVE_CALENDAR") {
				Log.warn(`[DEPRECATED]'CX3_MOVE_CALENDAR' notification will be deprecated. Use 'CX3_GLANCE_CALENDAR' instead.`);
			}
			if (payload?.instanceId === this.config.instanceId || !payload?.instanceId) {
				this.stepIndex += payload?.step ?? 0;
				this.updateDom(this.config.animationSpeed);
				this.viewTimer = setTimeout(resetCalendar, this.config.glanceTime);
			}
		}

		if (notification === "CX3_SET_DATE") {
			if (payload?.instanceId === this.config.instanceId || !payload?.instanceId) {
				this.tempMoment = new Date(payload?.date ?? null);
				this.stepIndex = 0;
				this.updateDom(this.config.animationSpeed);
				this.viewTimer = setTimeout(resetCalendar, this.config.glanceTime);
			}
		}

		if (notification === "WEATHER_UPDATED") {
			if (
				this.config.useWeather &&
				((this.config.weatherLocationName && payload.locationName.includes(this.config.weatherLocationName)) || !this.config.weatherLocationName) &&
				Array.isArray(payload?.forecastArray) &&
				payload?.forecastArray.length
			) {
				this.forecast = [...payload.forecastArray].map((o) => {
					let d = new Date(o.date);
					o.dateId = d.toLocaleDateString("en-CA");
					return o;
				});
			} else {
				if (this.config.weatherLocationName && !payload.locationName.includes(this.config.weatherLocationName)) {
					Log.warn(`"weatherLocationName: '${this.config.weatherLocationName}'" doesn't match with location of weather module ('${payload.locationName}')`);
				}
			}
		}
	},

	getDom: function () {
		let dom = document.createElement("div");
		dom.innerHTML = "";
		dom.classList.add("bodice", "CX3_" + this.instanceId, "CX3", "mode_" + this.mode);
		if (this.config.fontSize) dom.style.setProperty("--fontsize", this.config.fontSize);
		dom.style.setProperty("--maxeventlines", this.config.maxEventLines);
		dom.style.setProperty("--eventheight", this.config.eventHeight);
		dom = this.draw(dom);
		this.refreshTimer = setTimeout(() => {
			clearTimeout(this.refreshTimer);
			this.refreshTimer = null;
			this.updateDom(this.config.animationSpeed);
		}, this.config.refreshInterval);
		return dom;
	},

	draw: function (dom) {
		dom.innerHTML = "";

		const getL = (rgba) => {
			let [r, g, b, a] = rgba.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+\.{0,1}\d*))?\)$/).slice(1);
			r /= 255;
			g /= 255;
			b /= 255;
			const l = Math.max(r, g, b);
			const s = l - Math.min(r, g, b);
			const h = s ? (l === r ? (g - b) / s : l === g ? 2 + (b - r) / s : 4 + (r - g) / s) : 0;
			let rh = 60 * h < 0 ? 60 * h + 360 : 60 * h;
			let rs = 100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0);
			let rl = (100 * (2 * l - s)) / 2;
			return rl;
		};

		let magic = document.createElement("div");
		magic.classList.add("CX3_MAGIC");
		magic.id = "CX3_MAGIC_" + this.instanceId;
		dom.appendChild(magic);

		const isToday = (d) => {
			let tm = new Date();
			let start = new Date(tm.valueOf()).setHours(0, 0, 0, 0);
			let end = new Date(tm.valueOf()).setHours(23, 59, 59, 999);
			return d.getTime() >= start && d.getTime() <= end;
		};

		const isThisMonth = (d) => {
			let tm = new Date();
			let start = new Date(tm.getFullYear(), tm.getMonth(), 1);
			let end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
			return d.getTime() >= start && d.getTime() <= end;
		};

		const isThisYear = (d) => {
			let tm = new Date();
			let start = new Date(tm.getFullYear(), 1, 1);
			let end = new Date(tm.getFullYear(), 11, 31, 23, 59, 59, 999);
			return d.getTime() >= start && d.getTime() <= end;
		};

		const getBeginOfWeek = (d) => {
			return new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() - this.config.firstDayOfWeek + 7) % 7));
		};

		const getEndOfWeek = (d) => {
			let b = getBeginOfWeek(d);
			return new Date(b.getFullYear(), b.getMonth(), b.getDate() + 6, 23, 59, 59, 999);
		};

		const getWeekNo = (d) => {
			let bow = getBeginOfWeek(d);
			let fw = getBeginOfWeek(new Date(d.getFullYear(), 0, this.config.minimalDaysOfNewYear));
			if (bow.getTime() < fw.getTime()) fw = getBeginOfWeek(new Date(d.getFullYear() - 1), 0, this.config.minimalDayosOfNewYear);
			let count = 1;
			let t = new Date(fw.valueOf());
			while (bow.getTime() > t.getTime()) {
				t.setDate(t.getDate() + 7);
				count++;
			}
			return count;
		};

		const makeCellDom = (d, seq) => {
			let tm = new Date(d.valueOf());
			let cell = document.createElement("div");
			cell.classList.add("cell");
			if (isToday(tm)) cell.classList.add("today");
			if (isThisMonth(tm)) cell.classList.add("thisMonth");
			if (isThisYear(tm)) cell.classList.add("thisYear");
			cell.classList.add("year_" + tm.getFullYear(), "month_" + (tm.getMonth() + 1), "date_" + tm.getDate(), "weekday_" + tm.getDay());

			let h = document.createElement("div");
			h.classList.add("cellHeader");

			let cwDom = document.createElement("div");
			if (seq === 0) {
				cwDom.innerHTML = getWeekNo(tm);
				cwDom.classList.add("cw");
			}

			//h.appendChild(cwDom)

			let forecasted = this.forecast.find((e) => {
				return tm.toLocaleDateString("en-CA") === e.dateId;
			});

			if (forecasted && forecasted?.weatherType) {
				let weatherDom = document.createElement("div");
				weatherDom.classList.add("cellWeather");
				let icon = document.createElement("span");
				icon.classList.add("wi", "wi-" + forecasted.weatherType);
				weatherDom.appendChild(icon);
				let maxTemp = document.createElement("span");
				maxTemp.classList.add("maxTemp", "temperature");
				maxTemp.innerHTML = Math.round(forecasted.maxTemperature);
				weatherDom.appendChild(maxTemp);
				let minTemp = document.createElement("span");
				minTemp.classList.add("minTemp", "temperature");
				minTemp.innerHTML = Math.round(forecasted.minTemperature);
				weatherDom.appendChild(minTemp);
				h.appendChild(weatherDom);
			}

			let dateDom = document.createElement("div");
			dateDom.classList.add("cellDate");
			let dParts = new Intl.DateTimeFormat(this.locale, this.config.cellDateOptions).formatToParts(tm);
			let dateHTML = dParts.reduce((prev, cur, curIndex) => {
				prev = prev + `<span class="dateParts ${cur.type} seq_${curIndex}">${cur.value}</span>`;
				return prev;
			}, "");
			dateDom.innerHTML = dateHTML;

			h.appendChild(dateDom);

			let b = document.createElement("div");
			b.classList.add("cellBody");

			let f = document.createElement("div");
			f.classList.add("cellFooter");

			cell.appendChild(h);
			cell.appendChild(b);
			cell.appendChild(f);
			return cell;
		};

		const isPassed = (ev) => {
			return ev.endDate < Date.now();
		};

		const isFuture = (ev) => {
			return ev.startDate > Date.now();
		};

		const isCurrent = (ev) => {
			let tm = Date.now();
			return ev.endDate >= tm && ev.startDate <= tm;
		};

		const isMultiday = (ev) => {
			let s = new Date(+ev.startDate);
			let e = new Date(+ev.endDate);
			return s.getDate() !== e.getDate() || s.getMonth() !== e.getMonth() || s.getFullYear() !== e.getFullYear();
		};

		let moment = this.getMoment();

		let boc = this.mode === "month" ? getBeginOfWeek(new Date(moment.getFullYear(), moment.getMonth(), 1)) : getBeginOfWeek(new Date(moment.getFullYear(), moment.getMonth(), moment.getDate() + 7 * this.weekIndex));

		let eoc = this.mode === "month" ? getEndOfWeek(new Date(moment.getFullYear(), moment.getMonth() + 1, 0)) : getEndOfWeek(new Date(boc.getFullYear(), boc.getMonth(), boc.getDate() + 7 * (this.weeksInView - 1)));

		let boeoc = getBeginOfWeek(eoc);

		let tboc = boc.getTime();
		let teoc = eoc.getTime();

		let events = [...(this.storedEvents ?? [])];

		if (typeof this.config.eventTransformer === "function") {
			events = events.map((ev) => {
				return this.config.eventTransformer(ev);
			});
		}

		events = events
			.filter((ev) => {
				return !(+ev.endDate <= tboc || +ev.startDate >= teoc);
			})
			.map((ev) => {
				ev.startDate = +ev.startDate;
				ev.endDate = +ev.endDate;
				let et = new Date(+ev.endDate);
				if (et.getHours() === 0 && et.getMinutes() === 0 && et.getSeconds() === 0 && et.getMilliseconds() === 0) ev.endDate = ev.endDate - 1;
				ev.isPassed = isPassed(ev);
				ev.isCurrent = isCurrent(ev);
				ev.isFuture = isFuture(ev);
				ev.isFullday = ev.fullDayEvent;
				ev.isMultiday = isMultiday(ev);
				return ev;
			})
			.sort((a, b) => {
				let aDur = a.endDate - a.startDate;
				let bDur = b.endDate - b.startDate;

				return (a.isFullday || a.isMultiday) && (b.isFullday || b.isMultiday) ? bDur - aDur : a.startDate === b.startDate ? a.endDate - b.endDate : a.startDate - b.startDate;
			});

		if (typeof this.config.eventFilter === "function") {
			events = events.filter((ev) => {
				return this.config.eventFilter(ev);
			});
		}

		if (typeof this.config.eventSorter === "function") {
			events = events.sort((a, b) => {
				return this.config.eventSorter(a, b);
			});
		}

		let wm = new Date(boc.valueOf());

		let dayDom = document.createElement("div");
		dayDom.classList.add("headerContainer", "weekGrid");
		for (i = 0; i < 7; i++) {
			let dm = new Date(wm.getFullYear(), wm.getMonth(), wm.getDate() + i);
			let day = (dm.getDay() + 7) % 7;
			let dDom = document.createElement("div");
			dDom.classList.add("weekday", "weekday_" + day);
			dDom.innerHTML = new Intl.DateTimeFormat(this.locale, this.config.headerWeekDayOptions).format(dm);
			dayDom.appendChild(dDom);
		}

		dom.appendChild(dayDom);

		do {
			let wDom = document.createElement("div");
			wDom.classList.add("week");
			wDom.dataset.weekNo = getWeekNo(wm);

			let ccDom = document.createElement("div");
			ccDom.classList.add("cellContainer", "weekGrid");

			let ecDom = document.createElement("div");
			ecDom.classList.add("eventContainer", "weekGrid", "weekGridRow");

			let boundary = [];

			let cm = new Date(wm.valueOf());
			for (i = 0; i < 7; i++) {
				if (i) cm = new Date(cm.getFullYear(), cm.getMonth(), cm.getDate() + 1);
				ccDom.appendChild(makeCellDom(cm, i));
				boundary.push(cm.getTime());
			}
			boundary.push(cm.setHours(23, 59, 59, 999));

			let sw = new Date(wm.valueOf());
			let ew = new Date(sw.getFullYear(), sw.getMonth(), sw.getDate() + 6, 23, 59, 59, 999);
			let eventsOfWeek = events.filter((ev) => {
				return !(ev.endDate <= sw.getTime() || ev.startDate >= ew.getTime());
			});

			for (let event of eventsOfWeek) {
				let eDom = document.createElement("div");
				eDom.classList.add("event");

				let startLine = 0;
				if (event.startDate >= boundary.at(0)) {
					startLine = boundary.findIndex((b, idx, bounds) => {
						return event.startDate >= b && event.startDate < bounds[idx + 1];
					});
				} else {
					eDom.classList.add("continueFromPreviousWeek");
				}

				let endLine = boundary.length - 1;
				if (event.endDate <= boundary.at(-1)) {
					endLine = boundary.findIndex((b, idx, bounds) => {
						return event.endDate <= b && event.endDate > bounds[idx - 1];
					});
				} else {
					eDom.classList.add("continueToNextWeek");
				}

				eDom.style.gridColumnStart = startLine + 1;
				eDom.style.gridColumnEnd = endLine + 1;
				eDom.dataset.calendarSeq = event?.calendarSeq ?? 0;
				eDom.dataset.calendarName = event.calendarName;
				eDom.dataset.color = event.color;
				eDom.dataset.description = event.description;
				eDom.dataset.title = event.title;
				eDom.dataset.fullDayEvent = event.fullDayEvent;
				eDom.dataset.geo = event.geo;
				eDom.dataset.location = event.location;
				eDom.dataset.startDate = event.startDate;
				eDom.dataset.endDate = event.endDate;
				eDom.dataset.symbol = event.symbol.join(" ");
				eDom.dataset.today = event.today;
				eDom.classList.add("calendar_" + encodeURI(event.calendarName));
				eDom.classList.add(event.class);

				eDom.style.setProperty("--calendarColor", event.color);
				let magic = document.getElementById("CX3_MAGIC_" + this.instanceId);
				magic.style.color = event.color;
				let l = getL(window.getComputedStyle(magic).getPropertyValue("color"));
				event.oppositeColor = l > 50 ? "black" : "white";
				eDom.style.setProperty("--oppositeColor", event.oppositeColor);

				if (event.fullDayEvent) eDom.classList.add("fullday");
				if (event.isPassed) eDom.classList.add("passed");
				if (event.isCurrent) eDom.classList.add("current");
				if (event.isFuture) eDom.classList.add("future");
				if (event.isMultiday) eDom.classList.add("multiday");
				if (!(event.isMultiday || event.fullDayEvent)) eDom.classList.add("singleday");
				if (this.config.useSymbol) {
					eDom.classList.add("useSymbol");
				}

				event.symbol.forEach((symbol) => {
					let exDom = document.createElement("span");
					exDom.classList.add("symbol");
					if (symbol) {
						exDom.classList.add(
							"fa",
							...symbol.split(" ").map((s) => {
								return "fa-" + s.replace(/^fa\-/i, "");
							})
						);
					} else {
						exDom.classList.add("noSymbol");
					}
					eDom.appendChild(exDom);
				});
				let etDom = document.createElement("div");
				etDom.classList.add("title");
				etDom.innerHTML = event.title;
				let esDom = document.createElement("div");
				esDom.classList.add("eventTime");
				let dParts = new Intl.DateTimeFormat(this.locale, this.config.eventTimeOptions).formatToParts(new Date(event.startDate));
				let dateHTML = dParts.reduce((prev, cur, curIndex, arr) => {
					prev = prev + `<span class="eventTimeParts ${cur.type} seq_${curIndex}">${cur.value}</span>`;
					return prev;
				}, "");
				esDom.innerHTML = dateHTML;
				eDom.appendChild(esDom);
				eDom.appendChild(etDom);
				ecDom.appendChild(eDom);
			}

			wDom.appendChild(ccDom);
			wDom.appendChild(ecDom);

			dom.appendChild(wDom);
			wm = new Date(wm.getFullYear(), wm.getMonth(), wm.getDate() + 7);
		} while (wm.valueOf() <= eoc.valueOf());

		if (this.config.displayLegend) {
			let lDom = document.createElement("div");
			lDom.classList.add("legends");
			let legendData = new Map();
			for (let ev of events) {
				if (!legendData.has(ev.calendarName))
					legendData.set(ev.calendarName, {
						name: ev.calendarName,
						color: ev.color ?? null,
						oppositeColor: ev.oppositeColor,
						symbol: ev.symbol ?? []
					});
			}
			for (let l of legendData.values()) {
				let ld = document.createElement("div");
				ld.classList.add("legend");
				if (this.config.useSymbol) {
					ld.classList.add("useSymbol");
				}
				l.symbol.forEach((symbol) => {
					let exDom = document.createElement("span");
					exDom.classList.add("symbol");
					if (symbol) {
						exDom.classList.add(
							"fa",
							...symbol.split(" ").map((s) => {
								return "fa-" + s.replace(/^fa\-/i, "");
							})
						);
					} else {
						exDom.classList.add("noSymbol");
					}
					ld.appendChild(exDom);
				});
				let t = document.createElement("span");
				t.classList.add("title");
				t.innerHTML = l.name;
				ld.appendChild(t);
				ld.style.setProperty("--calendarColor", l.color);
				ld.style.setProperty("--oppositeColor", l.oppositeColor);
				lDom.appendChild(ld);
			}
			dom.appendChild(lDom);
		}

		this.viewMoment = moment;

		return dom;
	},

	getHeader: function () {
		if (this.mode === "month") {
			let moment = this.getMoment();
			return new Intl.DateTimeFormat(this.locale, this.config.headerTitleOptions).format(new Date(moment.valueOf()));
		}
		return this.data.header;
	}
});
