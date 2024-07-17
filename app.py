from flask import Flask, request, jsonify, render_template, send_from_directory
import pandas as pd
from flask_cors import CORS
import os

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


@app.route('/save-results', methods=['POST'])
def save_results():
    data = request.json
    participant_number = str(data.get('participantNumber')).strip()
    phase1_results = data.get('phase1Results')
    phase2_results = data.get('phase2Results')

    # Save Phase 1 results to CSV
    filename = f'{participant_number}_phase1.csv'
    phase1_df = pd.DataFrame(phase1_results)
    phase1_df.to_csv(filename, index=False)

    # Save Phase 2 results to CSV if they exist
    if phase2_results:
        filename = f'{participant_number}_phase2.csv'
        phase2_df = pd.DataFrame(phase2_results)
        phase2_df.to_csv(filename, index=False)

    # Mark the participant number as used
    participants_df.loc[participants_df['Number'] == participant_number,
                        'Used'] = 1
    participants_df.to_excel(excel_path, index=False)
    print(
        f"Participant number {participant_number} marked as used and results saved."
    )

    return jsonify({"status": "success"})


if __name__ == '__main__':
    app.run(debug=True)
