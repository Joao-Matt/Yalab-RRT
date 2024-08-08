let playerInputDigits = ''; // Variable to store the player's entered digits
let generatedSequence = ''; // Global variable to store the generated sequence
let startTime; // Timer start time for responses
let currentRound = 0; // Initialize the current round counter
const maxRounds = 3; // Define the maximum number of rounds, in the future will be 20
let gameData = []; // Array to hold each round's data
let generatedNumbers = []; // Array to hold the random info from the game
let timeData = []; // Array to hold timing 
let stringLength = []; // Length of strings
let currentDigitLength = 2;  // Start with 2 digits
let correctCount = 0;        // Counter for consecutive correct answers
let authInstance;
let isGameEnded = false; // Flag to track if the game has ended
let results = []; // List to store the results


document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('startButton').addEventListener('click', function () {
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('inputScreen').style.display = 'flex';
    });

    document.getElementById('checkButton').addEventListener('click', checkDSParticipant);
});

function showInputScreen() {
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('inputScreen').style.display = 'block';
}

async function checkDSParticipant() {
    const participantNumber = document.getElementById('participantNumber').value;
    const password = document.getElementById('password').value;
    const response = await fetch('/DS-check-participant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantNumber: participantNumber, password: password })
    });

    const data = await response.json();
    if (data.status === 'success') {
        localStorage.setItem('participantNumber', participantNumber);
        startGame();  // Start the game directly after successful validation
    } else {
        document.getElementById('message').innerText = data.message;
    }
}

function generateNumber() {
    let maxNumber = Math.pow(10, currentDigitLength) - 1;  // Max number for current digit length
    let minNumber = Math.pow(10, currentDigitLength - 1);  // Min number for current digit length
    return Math.floor(Math.random() * (maxNumber - minNumber + 1) + minNumber).toString();
}

function startGame() {
    if (isGameEnded) return; // Prevent starting a new game if the game has ended

    document.getElementById('inputScreen').style.display = 'none';
    currentRound = 0;  // Reset current round
    correctCount = 0;  // Reset correct count
    currentDigitLength = 2;  // Reset digit length
    gameData = [];  // Clear game data
    generatedNumbers = [];  // Clear generated numbers
    timeData = [];  // Clear time data
    results = []; // Clear results data for new game

    nextRound();  // Start the first round
}


function nextRound() {
    if (isGameEnded) return; // Prevent starting a new round if the game has ended

    if (currentRound < maxRounds) {
        generatedSequence = generateNumber(); // Ensures a number of the current digit length
        document.getElementById('digitDisplay').textContent = generatedSequence;
        document.getElementById('gameArea').style.display = 'none';
        document.getElementById('messageArea').textContent = '';
        document.getElementById('randomDigits').style.display = 'block';

        setTimeout(function () {
            document.getElementById('randomDigits').style.display = 'none';
            document.getElementById('gameArea').style.display = 'flex';
            startTime = performance.now(); // Start the timer after showing the keypad
        }, 2000);
    } else {
        endGame();
    }
}

function keyPressed(key) {
    const displayArea = document.getElementById('displayArea');
    displayArea.textContent += key;
}

function clearDisplay() {
    document.getElementById('displayArea').textContent = '';
}

function deleteLast() {
    const displayArea = document.getElementById('displayArea');
    displayArea.textContent = displayArea.textContent.slice(0, -1);
}

function enterPressed() {
    const endTime = performance.now();
    const elapsedTime = endTime - startTime;
    const displayArea = document.getElementById('displayArea');
    const enteredSequence = displayArea.textContent;
    const messageArea = document.getElementById('messageArea');
    const sequenceLength = currentDigitLength;
    const result = enteredSequence === generatedSequence ? 'Correct' : 'Incorrect';

    results.push({ playerInputDigits, round: currentRound + 1, generatedSequence, sequenceLength, enteredSequence, elapsedTime, result });
    
    if (result === 'Correct') {
        correctCount++;
        if (correctCount % 2 === 0) {
            currentDigitLength++;  // Increase the digit length after every 2 consecutive correct answers
        }
    } else {
        correctCount = 0;  // Reset the correct count on incorrect answer
    }

    messageArea.textContent = result;
    displayArea.textContent = '';
    currentRound++;

    logRoundData(playerInputDigits, generatedSequence, enteredSequence, elapsedTime);

    if (currentRound < maxRounds) {
        setTimeout(function () {
            messageArea.textContent = '';
            startGame();
        }, 1000);
    } else {
        endGame();
    }
}

function logRoundData(inputDigits, generatedDigits, subjectResponse, responseTime) {
    console.log({
        InputDigits: inputDigits,
        GeneratedDigits: generatedDigits,
        SubjectResponse: subjectResponse,
        ResponseTime: responseTime
    });
}

function endGame() {
    isGameEnded = true; // Set the flag to true to indicate the game has ended
    document.getElementById('messageArea').textContent = 'המשחק הושלם';
    console.log('המשחק הושלם');

    // Process results
    for (let i = 0; i < maxRounds; i++) {
        results.push({
            participantNumber: playerInputDigits,
            round: i + 1,
            generatedSequence: generatedNumbers[i],
            sequenceLength: stringLength[i],
            enteredSequence: gameData[i],
            elapsedTime: timeData[i],
            result: generatedNumbers[i] === gameData[i] ? 'Correct' : 'Incorrect'
        });
    }

    // Log the results for verification
    console.log('Results:', results);

    // Additional actions for ending the game can be added here
}

// function generateCSVFileAndUpload(gameData, generatedNumbers, timeData, filename) {
//     let csvContent = "Subject's Code,Generated Digit,Typed Answer,Response Time (ms)\n";

//     for (let i = 0; i < gameData.length; i++) {
//         csvContent += `${playerInputDigits},${generatedNumbers[i]},${gameData[i]},${timeData[i]}\n`;
//     }

//     // Convert CSV content to Blob
//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

//     // Upload Blob to Google Drive
//     uploadFileToDrive(blob, filename);
// }

// function uploadFileToDrive(blob, filename) {
//     const fileMetadata = {
//         'name': filename,
//         'mimeType': 'text/csv'
//     };
//     const media = {
//         mimeType: 'text/csv',
//         body: blob
//     };

//     gapi.client.drive.files.create({
//         resource: fileMetadata,
//         media: media,
//         fields: 'id'
//     }).then(function (response) {
//         console.log('File ID:', response.result.id);
//     }).catch(function (error) {
//         console.error('Error uploading file:', error);
//     });
// }
