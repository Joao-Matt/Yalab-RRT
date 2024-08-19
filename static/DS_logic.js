let playerInputDigits = ''; // Variable to store the player's entered digits
const maxRounds = 3; // Define the maximum number of rounds, in the future will be 20
let currentDigitLength = 2;  // Start with 2 digits
let generatedSequence = ''; // Global variable to store the generated sequence
let startTime; // Timer start time for responses
let currentRound = 0; // Initialize the current round counter
let gameData = []; // Array to hold each round's data
let generatedNumbers = []; // Array to hold the random info from the game
let timeData = []; // Array to hold timing 
let stringLength = []; // Length of strings
let correctCount = 0;        // Counter for consecutive correct answers
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
        playerInputDigits = participantNumber
        console.log('1st Participant Number:', playerInputDigits);
        showInstructions();  // Show the instructions screen
    } else {
        document.getElementById('message').innerText = data.message;
    }
}

function showInstructions() {
    document.getElementById('inputScreen').style.display = 'none';
    document.getElementById('instructionsScreen').style.display = 'block';
}

function startGame() {
    if (isGameEnded) return; // Prevent starting a new game if the game has ended

    // Hide the instructions screen
    const instructionsScreen = document.getElementById('instructionsScreen');
    if (instructionsScreen) {
        instructionsScreen.style.display = 'none';
    }

    // Show the game area and start the first round
    document.getElementById('gameArea').style.display = 'block';
    nextRound();  // Start the first round
}

function generateNumber() {
    let maxNumber = Math.pow(10, currentDigitLength) - 1;  // Max number for current digit length
    let minNumber = Math.pow(10, currentDigitLength - 1);  // Min number for current digit length
    return Math.floor(Math.random() * (maxNumber - minNumber + 1) + minNumber).toString();
}

function nextRound() {
    if (isGameEnded) return;

    if (currentRound < maxRounds) {
        generatedSequence = generateNumber();
        document.getElementById('digitDisplay').textContent = generatedSequence;
        document.getElementById('gameArea').style.display = 'none';
        document.getElementById('messageArea').textContent = '';
        document.getElementById('randomDigits').style.display = 'block';

        // Store generated sequence and current string length
        generatedNumbers.push(generatedSequence);
        stringLength.push(currentDigitLength);

        setTimeout(function () {
            document.getElementById('randomDigits').style.display = 'none';
            document.getElementById('gameArea').style.display = 'flex';
            startTime = performance.now();
        }, 2000);
    } else {
        endGame();
    }
}

function enterPressed() {
    const endTime = performance.now();
    const elapsedTime = endTime - startTime;
    const displayArea = document.getElementById('displayArea');
    const enteredSequence = displayArea.textContent;
    const messageArea = document.getElementById('messageArea');
    const result = enteredSequence === generatedSequence ? 'Correct' : 'Incorrect';

    // Store the entered sequence and elapsed time
    gameData.push(enteredSequence);
    timeData.push(elapsedTime);

    // Ensure no duplicate entries
    results.push({ 
        playerInputDigits, 
        round: currentRound + 1, 
        generatedSequence, 
        sequenceLength: currentDigitLength, 
        enteredSequence, 
        elapsedTime, 
        result 
    });

    // Logic to handle correct and incorrect answers
    if (result === 'Correct') {
        correctCount++;
        messageArea.textContent = '!נכון'
        if (correctCount % 2 === 0) {
            currentDigitLength++;  // Increase the digit length after every 2 consecutive correct answers
        }
    } else {
        messageArea.textContent = '!טעות'
        correctCount = 0;  // Reset the correct count on incorrect answer
    }

    // Update the UI
    displayArea.textContent = '';
    currentRound++;

    if (currentRound < maxRounds) {
        setTimeout(function () {
            messageArea.textContent = '';
            nextRound();
        }, 1000);
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

function endGame() {
    isGameEnded = true; 
    document.getElementById('messageArea').textContent = 'המשחק הושלם';
    console.log('המשחק הושלם');

    // Log the results for verification & Actions for ending the game
    console.log('Storing results:', results);
    localStorage.setItem('results', JSON.stringify(results));

    finishDSExperiment();
}

function finishDSExperiment() {
    saveDSResults().then(() => {
        markDSExperimentAsFinished()
        window.location.href = '/RTT_success';});
}

async function markDSExperimentAsFinished() {
    const participantNumber = localStorage.getItem('participantNumber');
    try {
        const response = await fetch('/DS_finish_experiment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participantNumber: participantNumber })
        });

        const data = await response.json();
        if (data.status !== 'success') {
            console.error('Failed to finish experiment');
            throw new Error('Failed to finish experiment');
        }
    } catch (error) {
        console.error('Error finishing experiment:', error);
        throw error;  // Ensure the error is caught in the finishDSExperiment function
    }
}

async function saveDSResults() {
    const participantNumber = localStorage.getItem('participantNumber');
    const dsResults = JSON.parse(localStorage.getItem('results')) || [];
    console.log('dsResults:', dsResults);
    
    const payload = {
        participantNumber: participantNumber,
        dsResults: dsResults
    };
    console.log('Request payload:', payload);

    try {
        const response = await fetch('/DS_save_results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

    console.log('Fetch response:', response);

    const data = await response.json();
    console.log('Response data:', data);

        if (data.status !== 'success') {
            console.error('Failed to save results');
            throw new Error('Failed to save results');
        }
    } catch (error) {
        console.error('Error saving results:', error);  // Added for error handling
        alert('Failed to save results. Please try again.');  // Added for error handling
        throw error;  // Re-throw the error to be caught in the finishDSExperiment function
    }
}
