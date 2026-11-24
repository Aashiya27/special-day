// Personalize these details and the question lists for your friend.
const giftSettings = {
    friendName: "Rashid",
    savedContactName: "Dumbo",
    birthdayMessage:
        "I hope this next trip around the sun brings you the kind of joy you find at a mountain summit — big, breathtaking, and absolutely worth the climb. Keep chasing beautiful views, collecting little adventures, and being the wonderful friend you are.\n\nI'm really lucky to have you in my life. Have the happiest birthday ever!",
};

const mountainQuestions = [
    {
        prompt: "Which mountain is the highest point above sea level?",
        answers: ["K2", "Mount Everest", "Kangchenjunga", "Mont Blanc"],
        correct: 1,
    },
    {
        prompt: "Which mountain range is home to Mount Everest?",
        answers: ["The Alps", "The Andes", "The Himalayas", "The Rockies"],
        correct: 2,
    },
    {
        prompt: "Mount Everest sits on the border of Nepal and which other country?",
        answers: ["India", "China", "Bhutan", "Pakistan"],
        correct: 1,
    },
    {
        prompt: "What's the word for someone who loves mountains?",
        answers: ["Orophile", "Aquaphile", "Astraphile", "Dendrophile"],
        correct: 0,
    },
    {
        prompt: "What do hikers call the very top of a mountain?",
        answers: ["The valley", "The ridge", "The summit", "The foothills"],
        correct: 2,
    },
];

const secretQuestions = [
    {
        prompt: "What's a smart thing to pack for a mountain hike?",
        answers: ["A water bottle", "A beach umbrella", "A bowling ball", "A sofa cushion"],
        correct: 0,
    },
    {
        prompt: "Which one sounds like the coziest post-hike treat?",
        answers: ["Hot chocolate", "A bowl of ice cubes", "Plain toast", "A glass of snow"],
        correct: 0,
    },
    {
        prompt: "When you reach a summit, what's the best thing to do?",
        answers: ["Enjoy the view", "Forget your camera", "Turn into a potato", "Keep your eyes closed"],
        correct: 0,
    },
];

const screenElements = Array.from(document.querySelectorAll("[data-screen]"));
const questionContent = document.getElementById("question-content");
const secretQuestionContent = document.getElementById("secret-question-content");
const questionCount = document.getElementById("question-count");
const secretQuestionCount = document.getElementById("secret-question-count");
const progressTrack = document.querySelector(".quiz-screen:not(.secret-quiz-screen) .progress-track");
const secretProgressTrack = document.querySelector(".secret-quiz-screen .progress-track");
let mountainQuestionIndex = 0;
let secretQuestionIndex = 0;
let secretQuestCompleted = false;
let audioContext = null;
let masterGain = null;
let musicPhraseIndex = 0;
let isMusicPlaying = false;

document.querySelectorAll("[data-friend-name]").forEach((element) => {
    element.textContent = giftSettings.friendName;
});
document.getElementById("saved-name").textContent = giftSettings.savedContactName;
document.getElementById("birthday-message").textContent = giftSettings.birthdayMessage;

function showScreen(screenName) {
    screenElements.forEach((screen) => {
        screen.hidden = screen.dataset.screen !== screenName;
    });

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (screenName === "mountain-quiz") {
        renderQuestion("mountain");
    } else if (screenName === "secret-quiz") {
        renderQuestion("secret");
    }
}

function renderQuestion(kind) {
    const isSecret = kind === "secret";
    const questions = isSecret ? secretQuestions : mountainQuestions;
    const questionIndex = isSecret ? secretQuestionIndex : mountainQuestionIndex;
    const content = isSecret ? secretQuestionContent : questionContent;
    const counter = isSecret ? secretQuestionCount : questionCount;
    const progress = isSecret ? secretProgressTrack : progressTrack;
    const question = questions[questionIndex];
    const previousLabel = questionIndex > 0 ? "← Previous" : "← Back";
    const previousDescription = isSecret
        ? questionIndex > 0 ? "Go to the previous secret question" : "Go back to the secret introduction"
        : questionIndex > 0 ? "Go to the previous mountain question" : "Go back to the trail introduction";

    counter.textContent = `Question ${questionIndex + 1} of ${questions.length}`;
    progress.setAttribute("aria-valuemax", String(questions.length));
    progress.setAttribute("aria-valuenow", String(questionIndex + 1));
    progress.querySelector(".progress-fill").style.width =
        `${((questionIndex + 1) / questions.length) * 100}%`;

    const options = question.answers
        .map((answer, index) => {
            const inputId = `${kind}-answer-${index}`;
            return `
                <div class="answer-option">
                    <input id="${inputId}" type="radio" name="${kind}-answer" value="${index}">
                    <label for="${inputId}">${answer}</label>
                </div>
            `;
        })
        .join("");

    content.innerHTML = `
        <form class="question-form">
            <p class="question-number">A little brain-teaser</p>
            <h2 class="question-title" tabindex="-1">${question.prompt}</h2>
            <fieldset class="answer-list" aria-labelledby="${kind}-question-title">
                <legend class="visually-hidden">Choose one answer</legend>
                ${options}
            </fieldset>
            <p class="answer-feedback" aria-live="polite"></p>
            <div class="answer-actions">
                <button class="button button-quiet button-previous" type="button" data-previous aria-label="${previousDescription}">
                    ${previousLabel}
                </button>
                <button class="button button-primary" type="submit" data-mode="check">
                    Check my answer <span aria-hidden="true">→</span>
                </button>
            </div>
        </form>
    `;

    content.querySelector(".question-title").id = `${kind}-question-title`;
    content.querySelector(".question-form").addEventListener("submit", (event) => {
        event.preventDefault();
        handleAnswer(event.currentTarget, kind, question);
    });
    content.querySelector("[data-previous]").addEventListener("click", () => {
        if (isSecret) {
            if (secretQuestionIndex === 0) {
                showScreen("secret-intro");
            } else {
                secretQuestionIndex -= 1;
                renderQuestion("secret");
            }
        } else if (mountainQuestionIndex === 0) {
            showScreen("trailhead");
        } else {
            mountainQuestionIndex -= 1;
            renderQuestion("mountain");
        }
    });
}

function handleAnswer(form, kind, question) {
    const button = form.querySelector("button[type='submit']");
    const feedback = form.querySelector(".answer-feedback");

    if (button.dataset.mode === "retry") {
        form.querySelectorAll("input[type='radio']").forEach((input) => {
            input.checked = false;
        });
        feedback.textContent = "";
        feedback.className = "answer-feedback";
        button.dataset.mode = "check";
        button.innerHTML = 'Check my answer <span aria-hidden="true">→</span>';
        return;
    }

    if (button.dataset.mode === "continue") {
        if (kind === "mountain") {
            mountainQuestionIndex += 1;
            if (mountainQuestionIndex === 2 && !secretQuestCompleted) {
                showScreen("secret-intro");
            } else if (mountainQuestionIndex === mountainQuestions.length) {
                showScreen("summit");
            } else {
                renderQuestion("mountain");
            }
        } else {
            secretQuestionIndex += 1;
            if (secretQuestionIndex === secretQuestions.length) {
                secretQuestCompleted = true;
                showScreen("name-reveal");
            } else {
                renderQuestion("secret");
            }
        }
        return;
    }

    const selected = form.querySelector("input[type='radio']:checked");
    if (!selected) {
        feedback.textContent = "Pick an answer first — even the best explorers need to choose a path.";
        feedback.className = "answer-feedback is-wrong";
        return;
    }

    if (Number(selected.value) !== question.correct) {
        feedback.textContent = "Not quite! No worries — give it another try.";
        feedback.className = "answer-feedback is-wrong";
        button.dataset.mode = "retry";
        button.innerHTML = 'Try again <span aria-hidden="true">↻</span>';
        return;
    }

    feedback.textContent = "That's right! One step closer to the surprise. ✨";
    feedback.className = "answer-feedback is-correct";
    button.dataset.mode = "continue";
    button.innerHTML = 'Continue the trail <span aria-hidden="true">→</span>';
    form.querySelectorAll("input[type='radio']").forEach((input) => {
        input.disabled = true;
    });
}

document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => {
        showScreen(button.dataset.go);
    });
});

document.querySelectorAll("[data-home]").forEach((button) => {
    button.addEventListener("click", (event) => {
        event.preventDefault();
        mountainQuestionIndex = 0;
        secretQuestionIndex = 0;
        secretQuestCompleted = false;
        showScreen("welcome");
    });
});

document.getElementById("open-gift").addEventListener("click", () => {
    showScreen("birthday");
});

const musicPhrases = [
    { bass: [130.81, 164.81, 196, 246.94], melody: [523.25, 392, 329.63, 392] },
    { bass: [110, 130.81, 164.81, 196], melody: [440, 392, 329.63, 392] },
    { bass: [87.31, 130.81, 174.61, 220], melody: [523.25, 440, 392, 349.23] },
    { bass: [98, 130.81, 146.83, 196], melody: [493.88, 392, 349.23, 392] },
];

function playPianoNote(frequency, startTime, duration, volume) {
    const partials = [
        { multiplier: 1, level: 1 },
        { multiplier: 2, level: 0.19 },
        { multiplier: 3, level: 0.06 },
    ];

    partials.forEach(({ multiplier, level }) => {
        const oscillator = audioContext.createOscillator();
        const envelope = audioContext.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency * multiplier;
        envelope.gain.setValueAtTime(0.0001, startTime);
        envelope.gain.linearRampToValueAtTime(volume * level, startTime + 0.025);
        envelope.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        oscillator.connect(envelope);
        envelope.connect(masterGain);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration + 0.05);
    });
}

function playMusicPhrase() {
    const phrase = musicPhrases[musicPhraseIndex];
    const now = audioContext.currentTime;

    phrase.bass.forEach((frequency, index) => {
        playPianoNote(frequency, now + index * 0.17, 3.4, 0.07);
    });
    phrase.melody.forEach((frequency, index) => {
        playPianoNote(frequency, now + 0.9 + index * 0.82, 1.9, 0.1);
    });

    musicPhraseIndex = (musicPhraseIndex + 1) % musicPhrases.length;
}

async function startBackgroundMusic() {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) {
        document.getElementById("music-status").textContent =
            "Background music is unavailable in this browser.";
        return;
    }

    try {
        if (!audioContext) {
            audioContext = new AudioContextConstructor();
            masterGain = audioContext.createGain();
            masterGain.gain.value = 0.0001;
            masterGain.connect(audioContext.destination);
        }

        await audioContext.resume();
        if (isMusicPlaying) {
            return;
        }

        masterGain.gain.setTargetAtTime(0.45, audioContext.currentTime, 0.15);
        isMusicPlaying = true;
        musicPhraseIndex = 0;
        playMusicPhrase();
        window.setInterval(playMusicPhrase, 5200);
        document.getElementById("music-status").textContent =
            "Soft background piano music is playing.";
    } catch (error) {
        if (error.name === "NotAllowedError") {
            document.getElementById("music-status").textContent =
                "Background music will start after your first interaction.";
            return;
        }
        console.error("Could not start background music:", error);
        document.getElementById("music-status").textContent =
            "Background music could not be started.";
    }
}

document.addEventListener("pointerdown", startBackgroundMusic, { once: true, passive: true });
document.addEventListener("keydown", startBackgroundMusic, { once: true });
startBackgroundMusic();
