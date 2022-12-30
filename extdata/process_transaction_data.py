import pandas as pd

def process_transactions():
	account_names = ["CREDIT CARD","CREDITCARD Account","Apple Card","Venmo","XXXX-XXXX-XXXX-1328"]
	df = pd.read_csv('./current_transaction.csv')
	df = df[df['accountRef.name'].isin(account_names)]
	df = df[df['category.name'] != "Credit Card Payment"]
	df = df[['date','description','amount','category.name','category.parentName']]
	df.to_csv('./current_transaction_processed.csv', index=False)
	
