import sys
import ast
from googleapiclient.discovery import build
from google.oauth2 import service_account

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
SERVICE_ACCOUNT_FILE = "static/yalab-rrt-key.json"

creds = None
creds = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES)

# The ID and range of a sample spreadsheet.
SAMPLE_SPREADSHEET_ID = "1D1QtUybvMkhjZtjznKycikO9d4qZxg-GqspQ0EQ2y9E"
service = build("sheets", "v4", credentials=creds)

# Call the Sheets API
sheet = service.spreadsheets()
resultSingular = (sheet.values().get(spreadsheetId=SAMPLE_SPREADSHEET_ID,
                                     range='participants!A:B').execute())

# values = result.get("values", [])
print(resultSingular)
