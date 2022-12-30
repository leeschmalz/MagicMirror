import requests
from pprint import pprint

TOKEN = "3e917968331b2a09c0e8f3e808af2aa7500414a2" # REDACTION MARKER

url = 'https://exist.io/api/2/attributes/with-values/'

# make sure to authenticate ourselves with our token
response = requests.get(url, headers={'Authorization': f'Token {TOKEN}'})

if response.status_code == 200:
    data = response.json()
    for attribute in data['results']:
        print(attribute['name'])
        # pretty print the json
        if attribute['name'] == 'alcoholic_drinks':
            pprint(attribute)
else:
    print("Error!", response.content)
