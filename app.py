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
                                range='participants!A:E').execute()
    values = result.get('values', [])
    participants_df = pd.DataFrame(values[1:], columns=values[0])
    participants_df['Number'] = participants_df['Number'].astype(str)
    participants_df['Singular RTT Used'] = participants_df[
        'Singular RTT Used'].astype(int)
    participants_df['Multiple RTT Used'] = participants_df[
        'Multiple RTT Used'].astype(int)
    participants_df['DS Used'] = participants_df['DS Used'].astype(
        int)  # Ensure DS Used column is loaded
    return participants_df


@app.route('/DS-check-participant', methods=['POST'])
def DS_check_participant():
    data = request.json
    participant_number = data.get('participantNumber')
    password = data.get('password')
    print(
        f"Received participant number: {participant_number} and password for DigitSpan"
    )

    if participant_number in participants_df['Number'].values:
        print("Participant number found in the dataset.")
        participant = participants_df[participants_df['Number'] ==
                                      participant_number].iloc[0]

        if password == participant[
                'PW']:  # Check if the password matches the one in the dataset
            if participant['DS Used'] == 0:
                print("Participant number is valid and not used.")
                return jsonify({"status": "success"})
            else:
                print("Participant number has already been used.")
                return jsonify({
                    "status":
                    "error",
                    "message":
                    "מספר כבר שומש או לא נכון, נא לנסות שנית"
                })
        else:
            return jsonify({"status": "error", "message": "סיסמא שגויה"})
    else:
        print("Participant number not found.")
        return jsonify({
            "status": "error",
            "message": "מספר כבר שומש או לא נכון, נא לנסות שנית"
        })


@app.route('/RTT-check-participant', methods=['POST'])
def RTT_check_participant():
    data = request.json
    participant_number = data.get('participantNumber')
    password = data.get('password')
    print(f"Received participant number: {participant_number}")

    if participant_number in participants_df['Number'].values:
        print("Participant number found in the dataset.")
        participant = participants_df[participants_df['Number'] ==
                                      participant_number].iloc[0]

        if password == participant[
                'PW']:  # Check if the password matches the one in the dataset
            if participant['Singular RTT Used'] == 0 and participant[
                    'Multiple RTT Used'] == 0:
                print("Participant number is valid and not used.")
                return jsonify({"status": "success"})
            else:
                print("Participant number has already been used.")
                return jsonify({
                    "status":
                    "error",
                    "message":
                    "מספר כבר שומש או לא נכון, נא לנסות שנית"
                })
        else:
            print("Incorrect password")
            return jsonify({"status": "error", "message": "סיסמא שגויה"})
    else:
        print("Participant number not found.")
        return jsonify({
            "status": "error",
            "message": "מספר כבר שומש או לא נכון, נא לנסות שנית"
        })


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


def append_to_ds_results(data):
    body = {'values': data}
    result = sheet.values().append(spreadsheetId=YalabSheet,
                                   range='DigitSpan!A1',
                                   valueInputOption='RAW',
                                   insertDataOption='INSERT_ROWS',
                                   body=body).execute()
    print(f"API Response: {result}")
    return result


participants_df = load_participants_from_sheet()
print("Loaded participants data from Google Sheets:")
print(participants_df)


@app.route('/')
def main_index():
    return render_template('index.html')  # Serve the main index HTML file


@app.route('/DS_index')
def ds_index():
    return render_template('DS_index.html')


@app.route('/RTT_index')
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


@app.route('/RTT_success')
def RTT_success():
    return render_template('RTT_success.html')


# Route to serve static files explicitly
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)


@app.route('/RTT_save_results', methods=['POST'])
def RTT_save_results():
    try:
        if not request.is_json:
            raise ValueError("Invalid input: Expected JSON data")
        data = request.json
        if not data:
            raise ValueError("Invalid input: No data provided")
        print(f"Received data: {data}")  # Added for debugging
        participant_number = str(data.get('participantNumber')).strip()
        phase1_results = data.get('phase1Results') or []
        phase2_results = data.get('phase2Results') or []

        # Prepare data for appending
        singular_data = [[
            participant_number, r['round'], r['reactionTime'], r['trialActive']
        ] for r in phase1_results]
        print(f"Singular data: {singular_data}")  # Added for debugging

        multiple_data = [[
            participant_number, r['round'], r['squareId'], r['pressedKey'],
            r['reactionTime'], r['trialActive'], r['correct']
        ] for r in phase2_results]
        print(f"Multiple data: {multiple_data}")  # Added for debugging

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
        return jsonify({"status": "success"}), 200

    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400  # Bad Request

    except KeyError as e:
        return jsonify({
            'status': 'error',
            'message': f"Missing key: {str(e)}"
        }), 422  # Unprocessable Entity

    except TypeError as e:
        return jsonify({
            'status': 'error',
            'message': f"Type error: {str(e)}"
        }), 400  # Bad Request

    except IndexError as e:
        return jsonify({
            'status': 'error',
            'message': f"Index error: {str(e)}"
        }), 400  # Bad Request

    except ZeroDivisionError as e:
        return jsonify({
            'status': 'error',
            'message': f"Math error: {str(e)}"
        }), 400  # Bad Request

    except CustomException as e:
        return jsonify({
            'status': 'error',
            'message': f"Custom error: {str(e)}"
        }), 400  # Custom error example

    except Exception as e:
        # Log the exception for debugging (optional)
        app.logger.error(f"Unexpected error: {str(e)}")

        # Return a generic error message to the client
        return jsonify({
            'status': 'error',
            'message': 'Internal Server Error'
        }), 500  # Internal Server Error


@app.route('/RTT_finish_experiment', methods=['POST'])
def RTT_finish_experiment():
    data = request.json
    participant_number = data.get('participantNumber')

    # Mark the participant number as used in the Google Sheet
    update_participant_usage(participant_number)

    return jsonify({"status": "success"}), 200


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


@app.route('/DS_save_results', methods=['POST'])
def DS_save_results():
    try:
        data = request.json
        if not data:
            raise ValueError("Invalid input: No data provided")
        print(f"Received data: {data}")  # Added for debugging
        participant_number = str(data.get('participantNumber')).strip()
        ds_results = data.get('dsResults') or []

        # Filter out entries that are missing required keys
        valid_ds_results = [
            r for r in ds_results
            if 'generatedSequence' in r and 'sequenceLength' in r
            and 'enteredSequence' in r and 'elapsedTime' in r
        ]

        # Prepare data for appending
        ds_data = [[
            participant_number, r['round'], r['generatedSequence'],
            r['sequenceLength'], r['enteredSequence'], r['elapsedTime'],
            r['result']
        ] for r in valid_ds_results]

        print(f"DS data: {ds_data}")  # Added for debugging

        # Append results to the respective sheets
        print("Before appending to DS results")
        if ds_data:
            append_to_ds_results(ds_data)
            print("After appending to DS results")

        # Mark the participant number as used in the Google Sheet
        update_ds_participant_usage(participant_number)

        print(
            f"Participant number {participant_number} marked as used and results saved."
        )
        return jsonify({"status": "success"}), 200
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400  # Bad Request

    except KeyError as e:
        return jsonify({
            'status': 'error',
            'message': f"Missing key: {str(e)}"
        }), 422  # Unprocessable Entity

    except TypeError as e:
        return jsonify({
            'status': 'error',
            'message': f"Type error: {str(e)}"
        }), 400  # Bad Request

    except IndexError as e:
        return jsonify({
            'status': 'error',
            'message': f"Index error: {str(e)}"
        }), 400  # Bad Request

    except ZeroDivisionError as e:
        return jsonify({
            'status': 'error',
            'message': f"Math error: {str(e)}"
        }), 400  # Bad Request

    except CustomException as e:
        return jsonify({
            'status': 'error',
            'message': f"Custom error: {str(e)}"
        }), 400  # Custom error example

    except Exception as e:
        # Log the exception for debugging (optional)
        app.logger.error(f"Unexpected error: {str(e)}")

        # Return a generic error message to the client
        return jsonify({
            'status': 'error',
            'message': 'Internal Server Error'
        }), 500  # Internal Server Error


@app.route('/DS_finish_experiment', methods=['POST'])
def DS_finish_experiment():
    data = request.json
    participant_number = data.get('participantNumber')

    # Mark the participant number as used in the Google Sheet
    update_ds_participant_usage(participant_number)

    return jsonify({"status": "success"})


def update_ds_participant_usage(participant_number):
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
                          range=f'participants!E{new_index}',
                          valueInputOption='RAW',
                          body={
                              'values': [['1']]
                          }).execute()
    participants_df.loc[participants_df['Number'] == participant_number,
                        'DS Used'] = 1


# Custom exception example
class CustomException(Exception):
    pass


# Example of handling a 404 Not Found error globally
@app.errorhandler(404)
def not_found(error):
    return jsonify({'status': 'error', 'message': 'Resource not found'}), 404


# Example of handling a 500 Internal Server Error globally
@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'status': 'error',
        'message': 'Something went wrong on our end'
    }), 500


# Example of handling a 400 Bad Request error globally
@app.errorhandler(400)
def bad_request(error):
    return jsonify({'status': 'error', 'message': 'Bad request'}), 400


# Example of handling a 403 Forbidden error globally
@app.errorhandler(403)
def forbidden(error):
    return jsonify({'status': 'error', 'message': 'Forbidden'}), 403


# Example of handling a 405 Method Not Allowed error globally
@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({'status': 'error', 'message': 'Method Not Allowed'}), 405


# Example of handling a 422 Unprocessable Entity error globally
@app.errorhandler(422)
def unprocessable_entity(error):
    return jsonify({'status': 'error', 'message': 'Unprocessable Entity'}), 422


if __name__ == '__main__':
    app.run(debug=True)
