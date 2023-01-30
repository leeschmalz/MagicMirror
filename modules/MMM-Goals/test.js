const fetch = require("node-fetch");

async function getDrinks() {
	const searchParams = new URLSearchParams({
		attribute: "weight_lifting",
		limit: 10
	});

	const response = await fetch("https://exist.io/api/2/attributes/values/?" + searchParams, {
		method: "GET",
		headers: {
			Authorization: "Token [token]"
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

