from flask import Flask, request, jsonify, render_template, send_from_directory
import pandas as pd
from flask_cors import CORS
import os
import gspread
from oauth2client.service_account import ServiceAccountCredentials

# Create Flask app with custom static and template folders
app = Flask(
    __name__,
    static_folder='static',  # Path to static files
    template_folder='templates')  # Path to templates
CORS(app)

# Load participants data
excel_path = 'static/participants.xlsx'
participants_df = pd.read_excel(excel_path)
participants_df['Number'] = participants_df['Number'].astype(str)
print("Loaded participants data:")
print(participants_df)


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


@app.route('/check-participant', methods=['POST'])
def check_participant():
    data = request.json
    participant_number = data.get('participantNumber')
    print(f"Received participant number: {participant_number}")

    if participant_number in participants_df['Number'].values:
        print("Participant number found in the dataset.")
        if participants_df[participants_df['Number'] == participant_number][
                'Singular RTT Used'].values[0] == 0:
            if participants_df[
                    participants_df['Number'] ==
                    participant_number]['Multiple RTT Used'].values[0] == 0:
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


scopes = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
]
credentials = ServiceAccountCredentials.from_json_keyfile_name(
    'static/yalab-rrt-key.json', scopes)
client = gspread.authorize(credentials)
workbookSingular = client.open('Singular RTT')
workbookMultiple = client.open('Multiple RTT')
sheetSingular = workbookSingular.worksheet('Sheet1')
sheetMultiple = workbookMultiple.worksheet('Sheet1')


@app.route('/save-results', methods=['POST'])
def save_results():

    data = request.json
    participant_number = str(data.get('participantNumber')).strip()
    phase1_results = data.get('phase1Results')
    phase2_results = data.get('phase2Results')

    sheetSingular.update()

    # Function to append Phase 1 results to "Singular RTT"
    def append_phase1_results_to_sheet(phase1_results, participant_number):
        for result in phase1_results:
            row = [participant_number, result['round'], result['reactionTime']]
            sheetSingular.append_row(row)

    # Function to append Phase 2 results to "Multiple RTT"
    def append_phase2_results_to_sheet(phase2_results, participant_number):
        for result in phase2_results:
            row = [
                participant_number, result['round'], result['squareId'],
                result['pressedKey'], result['reactionTime'], result['correct']
            ]
            sheetMultiple.append_row(row)

    # Append results to the respective sheets
    append_phase1_results_to_sheet(phase1_results, participant_number)
    append_phase2_results_to_sheet(phase2_results, participant_number)

    # Mark the participant number as used
    participants_df.loc[participants_df['Number'] == participant_number,
                        'Singular RTT Used'] = 1
    participants_df.loc[participants_df['Number'] == participant_number,
                        'Multiple RTT Used'] = 1
    participants_df.to_excel(excel_path, index=False)
    print(
        f"Participant number {participant_number} marked as used and results saved."
    )

    return jsonify({"status": "success"})


if __name__ == '__main__':
    app.run(debug=True)
