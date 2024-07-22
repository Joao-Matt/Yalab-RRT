async function checkParticipant() {
    const participantNumber = document.getElementById('participantNumber').value;
    const response = await fetch('/check-participant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantNumber: participantNumber })
    });

    const data = await response.json();
    if (data.status === 'success') {
        // Store participant number in local storage for later use
        localStorage.setItem('participantNumber', participantNumber);
        window.location.href = '/RTT_instructions_1';
    } else {
        document.getElementById('message').innerText = data.message;
    }
}

function proceedToPractice() {
    window.location.href = '/RTT_practice_1';
}

function proceedToPractice2() {
    window.location.href = '/RTT_practice_2';
}

function proceedToPhase1() {
    window.location.href = '/RTT_phase_1';
}

function proceedToPhase2() {
    window.location.href = '/RTT_phase_2';
}

function finishExperiment() {
    saveResults();
}

let practiceTrials = 0;
const maxPracticeTrials = 4;
let startTime;

document.addEventListener('DOMContentLoaded', (event) => {
    if (window.location.pathname.includes('RTT_practice_1')) {
        console.log("Starting RTT Practice Phase 1");
        startPractice();
    } else if (window.location.pathname.includes('RTT_phase_1')) {
        console.log("Starting RTT Phase 1");
        startPhase1Trials();
    } else if (window.location.pathname.includes('RTT_practice_2')) {
        console.log("Starting RTT Practice Phase 2");
        startPractice2();
    } else if (window.location.pathname.includes('RTT_phase_2')) {
        console.log("Starting RTT Phase 2");
        startPhase2Trials();
    }
});

function startPractice() {
    if (practiceTrials < maxPracticeTrials) {
        console.log(`Starting practice trial ${practiceTrials + 1}`);
        setTimeout(changeColor, getRandomInt(3000, 5000));
    }
}

function changeColor() {
    const square = document.getElementById('square');
    console.log("Changing color to green");
    square.classList.remove('red-square');
    square.classList.add('green-square');
    startTime = new Date().getTime();
    document.addEventListener('keydown', detectSpacebar);
}

function detectSpacebar(event) {
    const currentPath = window.location.pathname;
    if (currentPath.includes('RTT_practice_2') || currentPath.includes('RTT_phase_2')) {
        console.log('Space bar press ignored in practice 2 or phase 2');
        return; // Ignore space bar presses in practice 2 or phase 2
    }

    if (event.code === 'Space') {
        const reactionTime = new Date().getTime() - startTime;
        document.getElementById('message').innerText = `Reaction time: ${reactionTime} ms`;
        practiceTrials++;
        resetSquare();
        document.removeEventListener('keydown', detectSpacebar);
        if (practiceTrials < maxPracticeTrials) {
            setTimeout(startPractice, 2000); // Wait 2 seconds before starting the next trial
        } else {
            document.getElementById('proceedButton').style.display = 'block';
            document.getElementById('message').innerText = 'Practice completed. Press "Proceed to Phase 1" when you are ready.';
        }
    }
}

function resetSquare() {
    const square = document.getElementById('square');
    console.log("Resetting color to red");
    square.classList.remove('green-square');
    square.classList.add('red-square');
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Phase 1 logic
let phase1Trials = 0;
const maxPhase1Trials = 4;
let phase1StartTime;
let phase1Results = [];

function startPhase1Trials() {
    if (phase1Trials < maxPhase1Trials) {
        console.log(`Starting phase 1 trial ${phase1Trials + 1}`);
        setTimeout(changePhase1Color, getRandomInt(3000, 5000));
    } else {
        localStorage.setItem('phase1Results', JSON.stringify(phase1Results));
        document.getElementById('proceedButton').style.display = 'block';
        document.getElementById('message').innerText = 'Phase 1 completed. Press "Proceed to Practice 2" when you are ready.';
    }
}

function changePhase1Color() {
    const square = document.getElementById('square');
    console.log("Changing color to green for phase 1");
    square.classList.remove('red-square');
    square.classList.add('green-square');
    phase1StartTime = new Date().getTime();
    document.addEventListener('keydown', detectPhase1Spacebar);
}

function detectPhase1Spacebar(event) {
    if (event.code === 'Space') {
        const reactionTime = new Date().getTime() - phase1StartTime;
        // if (reactionTime < 150) {
        //     document.getElementById('message').innerText = `Reaction time too fast: ${reactionTime} ms. Press the retry button to try again.`;
        //     document.getElementById('retryButton').style.display = 'block';
        //     return;
        // }
        phase1Results.push({ round: phase1Trials + 1, reactionTime: reactionTime });
        document.getElementById('message').innerText = `Reaction time: ${reactionTime} ms`;
        phase1Trials++;
        resetPhase1Square();
        document.removeEventListener('keydown', detectPhase1Spacebar);
        if (phase1Trials < maxPhase1Trials) {
            setTimeout(() => {
                startPhase1Trials();
            }, 2000); // Wait 2 seconds before starting the next trial
        } else {
            document.getElementById('proceedButton').style.display = 'block';
            document.getElementById('message').innerText = 'Phase 1 completed. Press "Proceed to Practice 2" when you are ready.';
        }
    }
}

function resetPhase1Square() {
    const square = document.getElementById('square');
    console.log("Resetting color to red for phase 1");
    square.classList.remove('green-square');
    square.classList.add('red-square');
}

// Practice 2 logic
let practice2Trials = 0;
const maxPractice2Trials = 4;
let practice2StartTime;
let practice2Results = [];

function startPractice2() {
    if (practice2Trials < maxPractice2Trials) {
        console.log(`Starting practice 2 trial ${practice2Trials + 1}`);
        setTimeout(changePractice2Color, getRandomInt(3000, 5000));
    } else {
        localStorage.setItem('practice2Results', JSON.stringify(practice2Results));
        document.getElementById('proceedButton').style.display = 'block';
        document.getElementById('message').innerText = 'Practice 2 completed. Press "Proceed to Phase 2" when you are ready.';
    }
}

function changePractice2Color() {
    const squareIndex = getRandomInt(1, 4);
    const square = document.getElementById(`square${squareIndex}`);
    square.classList.remove('red-square');
    square.classList.add('green-square');
    practice2StartTime = new Date().getTime();
    document.addEventListener('keydown', detectPractice2Key.bind(null, squareIndex));
}

function detectPractice2Key(squareIndex, event) {
    const validKeys = { 1: 'a', 2: 's', 3: 'k', 4: 'l' };
    const pressedKey = event.key.toLowerCase(); // Ensure the pressed key is lowercase

    // Check if the pressed key is in validKeys
    if (!Object.values(validKeys).includes(pressedKey)) {
        console.log(`Ignored key: ${pressedKey}`);
        return; // Ignore invalid key presses
    }

    const reactionTime = new Date().getTime() - practice2StartTime;
    const isCorrect = validKeys[squareIndex] === pressedKey;

    practice2Results.push({
        round: practice2Trials + 1,
        squareIndex: squareIndex,
        pressedSquare: Object.keys(validKeys).find(key => validKeys[key] === pressedKey),
        reactionTime: reactionTime,
        correct: isCorrect
    });

    document.getElementById('message').innerText = `Reaction time: ${reactionTime} ms, ${isCorrect ? 'Correct' : 'Wrong'}`;

    resetPractice2Square(squareIndex);
    document.removeEventListener('keydown', detectPractice2Key.bind(null, squareIndex));
    practice2Trials++;
    if (practice2Trials < maxPractice2Trials) {
        setTimeout(startPractice2, 2000); // Wait 2 seconds before starting the next trial
    }
}

function resetPractice2Square(squareIndex) {
    const square = document.getElementById(`square${squareIndex}`);
    square.classList.remove('green-square');
    square.classList.add('red-square');
}

// Phase 2 logic
let phase2Trials = 0;
const maxPhase2Trials = 16;
let phase2StartTime;
let phase2Results = [];

function changePhase2Color() {
    resetPhase2Square(); // Ensure all squares are reset before changing color
    const squareIndex = getRandomInt(1, 4);
    const square = document.getElementById(`square${squareIndex}`);
    square.classList.remove('red-square');
    square.classList.add('green-square');
    phase2StartTime = new Date().getTime();
    document.addEventListener('keydown', detectPhase2Key.bind(null, squareIndex));
}

function startPhase2Trials() {
    document.addEventListener('keydown', detectPhase2KeyPress);
    if (phase2Trials < maxPhase2Trials) {
        console.log(`Starting phase 2 trial ${phase2Trials + 1}`);
        setTimeout(changePhase2Color, getRandomInt(3000, 5000));
    } else {
        localStorage.setItem('phase2Results', JSON.stringify(phase2Results));
        document.removeEventListener('keydown', detectPhase2KeyPress);
        document.getElementById('finishButton').style.display = 'block';
        document.getElementById('message').innerText = 'Phase 2 completed. Press "Finish Experiment" to save your results.';
    }
}

// Detecting what key you pressed in case it's a wrong answer
function detectPhase2KeyPress(event) {
    const validKeys = { 1: 'a', 2: 's', 3: 'k', 4: 'l' };
    const pressedKey = event.key.toLowerCase(); // Ensure the pressed key is lowercase

    let isGreenSquareVisible = false;
    let squareIndex = null;

    for (let i = 1; i <= 4; i++) {
        if (document.getElementById(`square${i}`).classList.contains('green-square')) {
            isGreenSquareVisible = true;
            squareIndex = i;
            break;
        }
    }

    if (!isGreenSquareVisible) {
        // No green square is visible, record as a wrong answer
        phase2Results.push({
            round: phase2Trials + 1,
            squareIndex: null,
            pressedSquare: Object.keys(validKeys).find(key => validKeys[key] === pressedKey),
            reactionTime: null,
            correct: false
        });
        document.getElementById('message').innerText = 'No green square visible. Wrong answer.';
        phase2Trials++;
        if (phase2Trials < maxPhase2Trials) {
            setTimeout(startPhase2Trials, 2000); // Wait 2 seconds before starting the next trial
        }
    } else {
        // Normal detection logic when green square is visible
        detectPhase2Key(squareIndex, event);
    }
}

function detectPhase2Key(squareIndex, event) {
    const validKeys = { 1: 'a', 2: 's', 3: 'k', 4: 'l' };
    const pressedKey = event.key.toLowerCase(); // Ensure the pressed key is lowercase

    // Check if the pressed key is in validKeys
    if (!Object.values(validKeys).includes(pressedKey)) {
        console.log(`Ignored key: ${pressedKey}`);
        return; // Ignore invalid key presses
    }

    const reactionTime = new Date().getTime() - phase2StartTime;
    const isCorrect = validKeys[squareIndex] === pressedKey;

    phase2Results.push({
        round: phase2Trials + 1,
        squareIndex: squareIndex,
        pressedSquare: Object.keys(validKeys).find(key => validKeys[key] === pressedKey),
        reactionTime: reactionTime,
        correct: isCorrect
    });

    document.getElementById('message').innerText = `Reaction time: ${reactionTime} ms, ${isCorrect ? 'Correct' : 'Wrong'}`;

    resetPhase2Square(squareIndex);
    document.removeEventListener('keydown', detectPhase2KeyPress);
    phase2Trials++;
    if (phase2Trials < maxPhase2Trials) {
        setTimeout(startPhase2Trials, 2000); // Wait 2 seconds before starting the next trial
    }
}

function resetPhase2Square(squareIndex) {
    for (let i = 1; i <= 4; i++) {
        const square = document.getElementById(`square${i}`);
        square.classList.remove('green-square');
        square.classList.add('red-square');
    }
}

function saveResults() {
    const participantNumber = localStorage.getItem('participantNumber');
    const phase1Results = JSON.parse(localStorage.getItem('phase1Results')) || [];
    const practice2Results = JSON.parse(localStorage.getItem('practice2Results')) || [];
    const phase2Results = JSON.parse(localStorage.getItem('phase2Results')) || [];

    fetch('http://127.0.0.1:5000/save-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            participantNumber: participantNumber,
            phase1Results: phase1Results,
            practice2Results: practice2Results,
            phase2Results: phase2Results
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                window.location.href = '/success';
            } else {
                console.error('Failed to save results');
            }
        });
}
