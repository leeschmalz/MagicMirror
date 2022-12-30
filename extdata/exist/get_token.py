import requests
from getpass import getpass

username = input("Username: ")
password = getpass("Password: ")

url = 'https://exist.io/api/1/auth/simple-token/'

response = requests.post(url, data={'username':username, 'password':password})

# make sure the response was 200 OK, meaning no errors
if response.status_code == 200: 
    # parse the json object from the response body so we can print the token
    data = response.json()
    print("Token:", data['token'])
else: 
    print("Error!", response.content)

