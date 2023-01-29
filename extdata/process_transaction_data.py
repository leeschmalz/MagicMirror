import pandas as pd
import numpy as np

def process_transactions():
	transactions = pd.read_csv("/home/pi/Documents/MagicMirror/extdata/current_transaction.csv")
	transactions["accountRef.id"] = transactions["accountRef.id"].astype(str)
	cols = ["id", "date", "description", "amount", "accountRef.id", "accountRef.name", "accountRef.type", "category.name","category.parentName"]
	transactions = transactions[cols]

	account_id_map = {"5879268": "Lee Apple Card",
					  "5890586": "Nat Capital One",
					  "4806917": "Lee Checking",
					  "5890571": "Nat Checking",
					  "5890570": "Nat Savings",
					  "5890572": "Nat Wells Fargo Credit",
					  "5593652": "Lee Capital One",
					  "5890563": "Nat Apple Card",
					  "5890591": "Nat Venmo",
					  "4905677": "Lee Venmo",
					  "4806935": "Lee Visa",
					  "5879269": "Lee Chase",
					  "5915178": "Nat Chase",
					  "4806916": "Lee Savings",
					  "4806984": "Lee Venmo",
					  "4806915": "Business Acct"}

	transactions["accountRef.name"] = transactions["accountRef.id"].map(account_id_map)
	transactions = transactions[(transactions["accountRef.type"] == "CreditAccount") | 
								(transactions["accountRef.name"].str.contains("Venmo")) | 
								((transactions["accountRef.name"] == "Nat Checking") & 
								 ( transactions["category.name"] != "Transfer" )  & # | (transactions["description"].str.contains("PAYMENT"))
								 (transactions["category.name"] != "Paycheck"))]

	transactions["person"] = np.where(transactions["accountRef.name"].str.contains("Lee"), "Lee", "Nat")
    
    # remove monthly bills
	transactions = transactions[~(transactions["description"].str.contains("PROGRESSIVE"))]
	transactions = transactions[~(transactions["description"].str.contains("COMED"))]
	transactions = transactions[~(transactions["description"].str.contains("1PASSWORD"))]
	transactions = transactions[~(transactions["description"].str.contains("Spotify"))]
	transactions = transactions[~(transactions["description"].str.contains("SPOTIFY"))]
	transactions = transactions[~(transactions["description"].str.contains("EXIST.IO"))]
	
	transactions = transactions[~((transactions["description"].str.contains("ACH Deposit Internet transfer")) & 
								  (transactions["accountRef.name"].str.contains("Apple Card")))]
	transactions = transactions[transactions["category.name"] != "Credit Card Payment"]
	transactions = transactions[~(transactions["description"].str.contains("Transfer To") & transactions["accountRef.name"].str.contains("Venmo"))]
	
	# remove exempt transactions 
	transactions = transactions[transactions["id"] != "68537869_1402764492_0"] # lee venmo to nat
	
	transactions = transactions[["date","description","amount","id","category.name","category.parentName"]]
	transactions.to_csv("/home/pi/Documents/MagicMirror/extdata/current_transaction_processed.csv", index=False)
	
	transactions['amount'] = transactions['amount']*-1
	transactions['amount'] = '$' + transactions['amount'].astype(str)
	
	transactions['description'] = transactions['description'].str.replace('\s+',' ')
	transactions['description'] = transactions['description'].replace(to_replace=r'\d{4,}|\*{4,}',value='', regex=True)
	transactions['description'] = transactions['description'].str.strip()
	transactions['description'] = transactions['description'].str[:20]

	transactions[['date','description','amount']].head(5).to_json('/home/pi/Documents/MagicMirror/extdata/latest_transactions.json',orient='records')
