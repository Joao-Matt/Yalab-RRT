from flask import Flask, request, jsonify, render_template, send_from_directory
import pandas as pd
from flask_cors import CORS
import os
import json
import base64
from googleapiclient.discovery import build
from google.oauth2 import service_account

# Create Flask app with custom static and template folders
app = Flask(
    __name__,
    static_folder='static',  # Path to static files
    template_folder='templates')  # Path to templates
CORS(app)

# Get the base64 encoded credentials from the environment variable
credentials_base64 = os.getenv('GOOGLE_CREDENTIALS_BASE64')
if not credentials_base64:
    raise ValueError("No GOOGLE_CREDENTIALS_BASE64 environment variable set")
# Decode the base64 string
credentials_json = base64.b64decode(credentials_base64).decode('utf-8')
# Load the JSON data
credentials_info = json.loads(credentials_json)
# Create credentials object
credentials = service_account.Credentials.from_service_account_info(
    credentials_info)
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
credentials = credentials.with_scopes(SCOPES)
# The ID and range of a sample spreadsheet.
YalabSheet = "1D1QtUybvMkhjZtjznKycikO9d4qZxg-GqspQ0EQ2y9E"
service = build("sheets", "v4", credentials=credentials)
# Build the service
service = build('sheets', 'v4', credentials=credentials)
# Call the Sheets API
sheet = service.spreadsheets()


# Load participants data from Google Sheets
def load_participants_from_sheet():
    result = sheet.values().get(spreadsheetId=YalabSheet,
                                range='participants!A:D').execute()
    values = result.get('values', [])
    participants_df = pd.DataFrame(values[1:], columns=values[0])
    participants_df['Number'] = participants_df['Number'].astype(str)
    participants_df['Singular RTT Used'] = participants_df[
        'Singular RTT Used'].astype(int)
    participants_df['Multiple RTT Used'] = participants_df[
        'Multiple RTT Used'].astype(int)
    return participants_df


participants_df = load_participants_from_sheet()
print("Loaded participants data from Google Sheets:")
print(participants_df)


def append_to_singular_rtt(data):
    body = {'values': data}
    result = sheet.values().append(spreadsheetId=YalabSheet,
                                   range='Singular_RTT!A1',
                                   valueInputOption='RAW',
                                   insertDataOption='INSERT_ROWS',
                                   body=body).execute()
    return result


def append_to_multiple_rtt(data):
    body = {'values': data}
    result = sheet.values().append(spreadsheetId=YalabSheet,
                                   range='Multiple_RTT!A1',
                                   valueInputOption='RAW',
                                   insertDataOption='INSERT_ROWS',
                                   body=body).execute()
    return result


@app.route('/')
def index():
    return render_template('RTT_index.html')  # Serve the main HTML file


@app.route('/RTT_instructions_1')
def instructions():
    return render_template('RTT_instructions_1.html')


@app.route('/RTT_instructions_2')
def instructions2():
    return render_template('RTT_instructions_2.html')


@app.route('/RTT_phase_1')
def phase1():
    return render_template('RTT_phase_1.html')


@app.route('/RTT_practice_1')
def practice1():
    return render_template('RTT_practice_1.html')


@app.route('/RTT_practice_2')
def practice2():
    return render_template('RTT_practice_2.html')


@app.route('/RTT_phase_2')
def phase2():
    return render_template('RTT_phase_2.html')


# Route to serve static files explicitly
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)


@app.route('/RTT-check-participant', methods=['POST'])
def RTT_check_participant():
    data = request.json
    participant_number = data.get('participantNumber')
    print(f"Received participant number: {participant_number}")

    if participant_number in participants_df['Number'].values:
        print("Participant number found in the dataset.")
        participant = participants_df[participants_df['Number'] ==
                                      participant_number].iloc[0]
        if participant['Singular RTT Used'] == 0 and participant[
                'Multiple RTT Used'] == 0:
            print("Participant number is valid and not used.")
            return jsonify({"status": "success"})
        else:
            print("Participant number has already been used.")
            return jsonify({
                "status": "error",
                "message": "מספר כבר שומש או לא נכון, נא לנסות שנית"
            })
    else:
        print("Participant number not found.")
        return jsonify({
            "status": "error",
            "message": "מספר כבר שומש או לא נכון, נא לנסות שנית"
        })


@app.route('/RTT-save-results', methods=['POST'])
def RTT_save_results():
    data = request.json
    participant_number = str(data.get('participantNumber')).strip()
    phase1_results = data.get('phase1Results') or []
    phase2_results = data.get('phase2Results') or []

    # Prepare data for appending
    singular_data = [[
        participant_number, r['round'], r['reactionTime'], r['GreenOnScreen']
    ] for r in phase1_results]
    multiple_data = [[
        participant_number, r['round'], r['squareIndex'], r['pressedSquare'],
        r['reactionTime'], r['GreenOnScreen'], r['correct']
    ] for r in phase2_results]

    # Append results to the respective sheets
    if singular_data:
        append_to_singular_rtt(singular_data)
    if multiple_data:
        append_to_multiple_rtt(multiple_data)

    # Mark the participant number as used in the Google Sheet
    update_participant_usage(participant_number)

    print(
        f"Participant number {participant_number} marked as used and results saved."
    )
    return jsonify({"status": "success"})


def update_participant_usage(participant_number):
    global participants_df
    participant_index = participants_df[participants_df['Number'] ==
                                        participant_number].index
    if len(participant_index) > 0:
        new_index = int(
            participant_index[0]
        ) + 2  # Google Sheets index starts at 1 and there's a header row
    else:
        print("no new index")
        new_index = 2
    sheet.values().update(spreadsheetId=YalabSheet,
                          range=f'participants!C{new_index}',
                          valueInputOption='RAW',
                          body={
                              'values': [['1']]
                          }).execute()
    sheet.values().update(spreadsheetId=YalabSheet,
                          range=f'participants!D{new_index}',
                          valueInputOption='RAW',
                          body={
                              'values': [['1']]
                          }).execute()
    participants_df.loc[participants_df['Number'] == participant_number,
                        'Singular RTT Used'] = 1
    participants_df.loc[participants_df['Number'] == participant_number,
                        'Multiple RTT Used'] = 1


if __name__ == '__main__':
    app.run(debug=True)
