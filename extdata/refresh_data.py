import os
from datetime import datetime
import time
import mintapi
from process_transaction_data import process_transactions

next_minute = datetime.now().minute+1
while True:
	if (datetime.now().second == 1) & (datetime.now().minute == next_minute):
		print('Gathering transaction data from Mint.')
		os.system('mintapi --headless --config-file mint_config.cfg leeschmalz@gmail.com pass') # REDACTION MARKER
		time.sleep(2) # make sure csv is written
		print('Processing transactions.')
		process_transactions()
		print('Transactions data complete.')
		
