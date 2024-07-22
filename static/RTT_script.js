async function checkParticipant() {
    const participantNumber = document.getElementById('participantNumber').value;
    const response = await fetch('/check-participant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantNumber: participantNumber })
    });

    const data = await response.json();
    if (data.status === 'success') {
        localStorage.setItem('participantNumber', participantNumber);
        window.location.href = '/RTT_instructions_1';
    } else {
        document.getElementById('message').innerText = data.message;
    }
}

function proceedToPractice1() {
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

function proceedToInstructions2() {
    window.location.href = '/RTT_instructions_2';
}

function finishExperiment() {
    saveResults();
}

document.addEventListener('DOMContentLoaded', (event) => {
    const currentPath = window.location.pathname;
    if (currentPath.includes('RTT_practice_1') || currentPath.includes('RTT_phase_1')) {
        startTrials('phase1');
    } else if (currentPath.includes('RTT_practice_2') || currentPath.includes('RTT_phase_2')) {
        startTrials('phase2');
    }
});

function startTrials(phase) {
    let trials = 0;
    const maxTrials = phase === 'phase2' ? 16 : 4;
    const isPractice = window.location.pathname.includes('practice');
    let results = [];

    function startNextTrial() {
        if (trials < maxTrials) {
            console.log(`Starting ${phase} trial ${trials + 1}`);
            setTimeout(changeColor, getRandomInt(3000, 5000));
        } else {
            localStorage.setItem(`${phase}Results`, JSON.stringify(results));
            const proceedButton = document.getElementById('proceedButton');
            const finishButton = document.getElementById('finishButton');
            if (isPractice && proceedButton) {
                proceedButton.style.display = 'block';
                document.getElementById('message').innerText = `Practice ${phase === 'phase2' ? 2 : 1} completed. Press "Proceed to ${phase === 'phase2' ? 'Phase 2' : 'Instructions 2'}" when you are ready.`;
            } else if (phase === 'phase1' && proceedButton) {
                proceedButton.style.display = 'block';
                document.getElementById('message').innerText = `Phase 1 completed. Press "Proceed to Instructions 2" when you are ready.`;
            } else if (phase === 'phase2' && finishButton) {
                finishButton.style.display = 'block';
                document.getElementById('message').innerText = `Phase 2 completed. Press "Finish Experiment" to save your results.`;
            } else {
                console.error('Proceed or Finish button not found');
            }
        }
    }

    function changeColor() {
        let squareId;

        if (window.location.pathname.includes('RTT_phase_1') || window.location.pathname.includes('RTT_practice_1')) {
            squareId = 'square';  // For Phase 1 and Practice 1, use a single square
        } else if (window.location.pathname.includes('RTT_phase_2') || window.location.pathname.includes('RTT_practice_2')) {
            const squareIndex = getRandomInt(1, 4);  // For Phase 2 and Practice 2, use a random square index
            squareId = `square${squareIndex}`;
        }

        const square = document.getElementById(squareId);
        if (!square) {
            console.error(`Element with id "${squareId}" not found`);
            return;
        }

        // Change the color of the square from red to green
        square.classList.remove('red-square');
        square.classList.add('green-square');
        startTime = new Date().getTime();  // Record the start time

        // Add the appropriate key detection function
        const detectKeyFunction = window.location.pathname.includes('phase_2') || window.location.pathname.includes('practice_2') ? detectKey.bind(null, squareId) : detectSpacebar;
        document.addEventListener('keydown', detectKeyFunction);
    }

    function detectSpacebar(event) {
        if (event.code === 'Space') {
            handleReaction();
        }
    }

    function detectKey(squareId, event) {
        const validKeys = { 'square1': 'a', 'square2': 's', 'square3': 'k', 'square4': 'l' };
        if (!Object.values(validKeys).includes(event.key.toLowerCase())) {
            console.log(`Ignored key: ${event.key}`);
            return;
        }
        handleReaction(squareId, event.key.toLowerCase());
    }

    function handleReaction(squareId = 'square', pressedKey = 'space') {
        const reactionTime = new Date().getTime() - startTime;
        const isPractice = window.location.pathname.includes('practice');

        if (!isPractice) {
            results.push({ round: trials + 1, squareId, pressedKey, reactionTime, correct: true });
        }
        document.getElementById('message').innerText = `Reaction time: ${reactionTime} ms`;
        trials++;
        resetSquare(squareId);
        document.removeEventListener('keydown', window.location.pathname.includes('phase_2') || window.location.pathname.includes('practice_2') ? detectKey.bind(null, squareId) : detectSpacebar);
        setTimeout(startNextTrial, 2000);
    }

    function resetSquare(squareId = 'square') {
        const square = document.getElementById(squareId);
        if (!square) {
            console.error(`Element with id "${squareId}" not found`);
            return;
        }
        square.classList.remove('green-square');
        square.classList.add('red-square');
    }

    startNextTrial();
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function saveResults() {
    const participantNumber = localStorage.getItem('participantNumber');
    const phase1Results = JSON.parse(localStorage.getItem('phase1Results')) || [];
    const phase2Results = JSON.parse(localStorage.getItem('phase2Results')) || [];

    fetch('/save-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            participantNumber: participantNumber,
            phase1Results: phase1Results,
            phase2Results: phase2Results
        })
    }).then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
            window.location.href = '/success';
        } else {
            console.error('Failed to save results');
        }
    });
}
