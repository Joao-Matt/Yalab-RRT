let trainingTrials = 2;
let rounds = 2;  // Set how many rounds you want for the test phase
let stroopResults = [];
let currentRound = 1;
let currentWord = '';
let currentColor = '';
let startTime;

// Retrieve participant number from the hidden input field
let participantNumber = document.getElementById('participantNumber').value;

// Start training phase
function startTraining() {
    document.getElementById('instructionsScreen').style.display = 'none';
    document.getElementById('trainingScreen').style.display = 'block';
    nextTrainingWord();
}

// Generate a random word and color (congruent or incongruent)
function getRandomWordAndColor() {
    const words = ['אדום', 'ירוק', 'כחול', 'צהוב', 'שחור'];
    const colors = ['אדום', 'ירוק', 'כחול', 'צהוב', 'שחור'];
    const word = words[Math.floor(Math.random() * words.length)];
    const isCongruent = Math.random() < 0.5;  // Randomly decide congruency
    const color = isCongruent ? word : colors[Math.floor(Math.random() * colors.length)];
    return { word, color };
}

// Training Phase: Show the next word
function nextTrainingWord() {
    if (trainingTrials > 0) {
        const { word, color } = getRandomWordAndColor();
        currentWord = word;
        currentColor = color;
        document.getElementById('wordDisplay').textContent = word;
        document.getElementById('wordDisplay').style.color = color;
        document.getElementById('trainingMessage').textContent = `The color is ${color}. Press ${color} button.`;
        trainingTrials--;
    } else {
        startTest();
    }
}

// Test Phase: Start the Stroop test
function startTest() {
    document.getElementById('trainingScreen').style.display = 'none';
    document.getElementById('testScreen').style.display = 'block';
    nextTestWord();
}

// Show the next test word
function nextTestWord() {
    if (currentRound <= rounds) {
        const { word, color } = getRandomWordAndColor();
        currentWord = word;
        currentColor = color;
        document.getElementById('wordDisplayTest').textContent = word;
        document.getElementById('wordDisplayTest').style.color = color;
        startTime = performance.now();  // Start timer
        currentRound++;
    } else {
        saveResults();
    }
}

// Capture key press and calculate response time
document.addEventListener('keydown', function(event) {
    const pressedKey = event.key.toLowerCase();
    const validKeys = ['א', 'י', 'כ', 'צ', 'ש'];  // Corresponding to red, green, blue, yellow, black

    if (validKeys.includes(pressedKey)) {
        const endTime = performance.now();
        const reactionTime = endTime - startTime;
        const correct = (pressedKey === currentColor[0]);

        stroopResults.push({
            participantNumber: participantNumber,  // Use dynamic participant number
            round: currentRound,
            wordWritten: currentWord,
            wordColor: currentColor,
            keyPressed: pressedKey,
            correct: correct ? 'yes' : 'no'
        });

        nextTestWord();  // Move to the next word
    }
});

// Save results
function saveResults() {
    fetch('/stroop-save-results', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            participantNumber: participantNumber,  // Use dynamic participant number
            stroopResults: stroopResults
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Results saved successfully!');
        } else {
            alert('Error saving results.');
        }
    });
}
