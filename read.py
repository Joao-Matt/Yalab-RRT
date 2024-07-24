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
sheet = service.spreadsheets()


def append_to_singular_rtt(data):
  body = {'values': data}
  result = sheet.values().append(spreadsheetId=SAMPLE_SPREADSHEET_ID,
                                 range='Singular_RTT!A1',
                                 valueInputOption='RAW',
                                 insertDataOption='INSERT_ROWS',
                                 body=body).execute()
  return result


def append_to_multiple_rtt(data):
  body = {'values': data}
  result = sheet.values().append(spreadsheetId=SAMPLE_SPREADSHEET_ID,
                                 range='Multiple_RTT!A1',
                                 valueInputOption='RAW',
                                 insertDataOption='INSERT_ROWS',
                                 body=body).execute()
  return result


if __name__ == "__main__":
  if len(sys.argv) > 1:
    singular_data = ast.literal_eval(sys.argv[1])
    multiple_data = ast.literal_eval(sys.argv[2])
    if singular_data:
      append_to_singular_rtt(singular_data)
    if multiple_data:
      append_to_multiple_rtt(multiple_data)
