# for some reason my javascript implementation of this does not work

import requests

response = requests.get("https://exist.io/api/2/attributes/values/",
				params={"attribute":"alcoholic_drinks",
						"limit":100},
				headers={'Authorization':'Token token'})
				
print(response.json())
