const fetch = require("node-fetch");

async function getDrinks() {
	const searchParams = new URLSearchParams({
		attribute: "weight_lifting",
		limit: 10
	});

	const response = await fetch("https://exist.io/api/2/attributes/values/?" + searchParams, {
		method: "GET",
		headers: {
			Authorization: "Token 3e917968331b2a09c0e8f3e808af2aa7500414a2"
		}
	});

	return response;
}

async function main() {
	const response = await getDrinks();
	const data = await response.json();
	console.log(data);
}

main();
//c35065403154acda81255180e1e97b2b1600a09c
//6c60601c5bd24e0930297dd8b38756a7cfb06264
//7560a0ea41543f24b940b31df472351ea48adae4
