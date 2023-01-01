# for some reason my javascript implementation of this does not work

import requests

response = requests.get("https://exist.io/api/2/attributes/values/",
				params={"attribute":"alcoholic_drinks",
						"limit":100},
				headers={'Authorization':'Token 3e917968331b2a09c0e8f3e808af2aa7500414a2'})
				
print(response.json())
