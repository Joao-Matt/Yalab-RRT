let trials = 0;
let maxTrials = 0;
let participantNumber = 0;
let resultsSingular = [];
let resultsMultiple = [];
let startTime;
let trialActive = false;
let isPractice = false;

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
    let trialActive = false;

    function startNextTrial() {
        if (trials < maxTrials) {
            console.log(`Starting ${phase} trial ${trials + 1}`);
            setTimeout(changeColor, getRandomInt(3000, 5000));
        } else {
            localStorage.setItem(`${phase}Results`, JSON.stringify(results));
            const proceedButton = document.getElementById('proceedButton');
            const finishButton = document.getElementById('finishButton');
            if (isPractice && phase === 'phase1' && proceedButton) {
                proceedButton.style.display = 'block';
                document.getElementById('message').innerText = `Practice 1 completed. Press "Proceed to Phase 1" when you are ready.`;
            } else if (phase === 'phase1' && proceedButton) {
                proceedButton.style.display = 'block';
                document.getElementById('message').innerText = `Phase 1 completed. Press "Proceed to Instructions 2" when you are ready.`;
            } else if (isPractice && phase === 'phase2' && proceedButton) {
                proceedButton.style.display = 'block';
                document.getElementById('message').innerText = `Practice 2 completed. Press "Proceed to Phase 2" when you are ready.`;
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
            squareId = 'square';
        } else {
            const squareIndex = getRandomInt(1, 4);
            squareId = `square${squareIndex}`;
        }

        resetAllSquares();

        const square = document.getElementById(squareId);
        if (!square) {
            console.error(`Element with id "${squareId}" not found`);
            return;
        }

        square.classList.remove('red-square');
        square.classList.add('green-square');
        startTime = new Date().getTime();
        trialActive = true;

        document.addEventListener('keydown', detectKeyPress);
    }

    function detectKeyPress(event) {
        if (window.location.pathname.includes('RTT_phase_1') || window.location.pathname.includes('RTT_practice_1')) {
            if (event.code === 'Space') {
                trialActive ? handleReaction() : handleInactiveTrial();
            }
        } else {
            const validKeys = { 'square1': 'a', 'square2': 's', 'square3': 'k', 'square4': 'l' };
            if (Object.values(validKeys).includes(event.key.toLowerCase())) {
                const squareId = Object.keys(validKeys).find(key => validKeys[key] === event.key.toLowerCase());
                trialActive ? handleReaction(squareId, event.key.toLowerCase()) : handleInactiveTrial(squareId, event.key.toLowerCase());
            }
        }

    function handleReaction(squareId = 'square', pressedKey = 'space') {
        const reactionTime = new Date().getTime() - startTime;
        const correct = checkCorrectKey(squareId, pressedKey);

        if (!isPractice) {
            if (window.location.pathname.includes('RTT_phase_1')) {
                resultsSingular.push({ participantNumber, round: trials + 1, reactionTime });
            } else {
                resultsMultiple.push({ participantNumber, round: trials + 1, squareId, pressedKey, reactionTime, correct });
            }
        }

        document.getElementById('message').innerText = `Reaction time: ${reactionTime} ms, ${correct ? 'Correct' : 'Wrong'}`;
        trials++;
        resetSquare(squareId);
        trialActive = false;
        document.removeEventListener('keydown', detectKeyPress);

        setTimeout(() => {
            if (trials < maxTrials) {
                startNextTrial();
            }
        }, 2000);
    }
    
    function handleInactiveTrial(squareId = 'square', pressedKey = 'space') {
        const reactionTime = 0;
        const correct = false;

        if (!isPractice) {
            if (window.location.pathname.includes('RTT_phase_1')) {
                resultsSingular.push({ participantNumber, round: trials + 1, reactionTime });
            } else {
                resultsMultiple.push({ participantNumber, round: trials + 1, squareId, pressedKey, reactionTime, correct });
            }
        }

        document.getElementById('message').innerText = `Reaction time: ${reactionTime} ms, Wrong`;
        trials++;
        resetSquare(squareId);

        setTimeout(() => {
            if (trials < maxTrials) {
                startNextTrial();
            }
        }, 2000);
    }

    function handleTrialCompletion() {
        localStorage.setItem('phase1Results', JSON.stringify(resultsSingular));
        localStorage.setItem('phase2Results', JSON.stringify(resultsMultiple));
        const proceedButton = document.getElementById('proceedButton');
        const finishButton = document.getElementById('finishButton');

        if (isPractice) {
            if (window.location.pathname.includes('RTT_phase_1')) {
                proceedButton.style.display = 'block';
                document.getElementById('message').innerText = `Practice 1 completed. Press "Proceed to Phase 1" when you are ready.`;
            } else {
                proceedButton.style.display = 'block';
                document.getElementById('message').innerText = `Practice 2 completed. Press "Proceed to Phase 2" when you are ready.`;
            }
        } else {
            if (window.location.pathname.includes('RTT_phase_1')) {
                proceedButton.style.display = 'block';
                document.getElementById('message').innerText = `Phase 1 completed. Press "Proceed to Instructions 2" when you are ready.`;
            } else {
                finishButton.style.display = 'block';
                document.getElementById('message').innerText = `Phase 2 completed. Press "Finish Experiment" to save your results.`;
            }
        }
    }

    function resetAllSquares() {
        for (let i = 1; i <= 4; i++) {
            const square = document.getElementById(`square${i}`);
            if (square) {
                square.classList.remove('green-square');
                square.classList.add('red-square');
            }
        }
        const square = document.getElementById('square');
        if (square) {
            square.classList.remove('green-square');
            square.classList.add('red-square');
        }
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

    function checkCorrectKey(squareId, pressedKey) {
        const validKeys = { 'square1': 'a', 'square2': 's', 'square3': 'k', 'square4': 'l' };
        return validKeys[squareId] === pressedKey;
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
