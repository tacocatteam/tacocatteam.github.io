const detectiveQuestions = [
  {
    q: "A stream becomes cloudy just after heavy rain. What is the strongest clue?",
    a: [
      "The moon changed",
      "Sediment washed in",
      "Fish are hiding",
      "The stream got deeper",
    ],
    correct: 1,
    e: "Rainwater can carry soil and sediment from roads, lawns, construction areas, and stream banks into waterways.",
  },
  {
    q: "A dissolved oxygen reading drops sharply. What should a water detective do next?",
    a: ["Ignore it", "Paint the sensor", "Check it again", "Add salt"],
    correct: 2,
    e: "A surprising reading should be checked again and compared with temperature, water movement, and recent weather.",
  },
  {
    q: "Conductivity rises after runoff enters a stream. What may have changed?",
    a: ["Dissolved ions", "Cloud shapes", "Daylight hours", "Fish colors"],
    correct: 0,
    e: "Conductivity responds to dissolved ions, so a change can be a clue that different dissolved materials entered the stream.",
  },
  {
    q: "Why can unusually warm stream water concern scientists?",
    a: [
      "It stops clouds",
      "It makes rocks float",
      "It removes all minerals",
      "It can affect oxygen and aquatic life",
    ],
    correct: 3,
    e: "Temperature affects aquatic organisms and influences how much dissolved oxygen water can hold.",
  },
  {
    q: "A pH result is very different from yesterday. What is the best first step?",
    a: [
      "Announce a conclusion",
      "Retest the water",
      "Delete yesterday’s result",
      "Move the stream",
    ],
    correct: 1,
    e: "Retesting helps determine whether the change is repeatable before anyone explains its cause.",
  },
  {
    q: "Why collect measurements over many days?",
    a: [
      "To make longer charts",
      "Because one day tells everything",
      "To notice patterns and changes",
      "So the sensor gets exercise",
    ],
    correct: 2,
    e: "Repeated measurements can reveal changes connected with rain, seasons, runoff, or other environmental conditions.",
  },
];

const knowledgeQuestions = [
  {
    q: "Which is an important job of a wetland?",
    a: [
      "Building roads",
      "Filtering water",
      "Making plastic",
      "Blocking rainfall",
    ],
    correct: 1,
    e: "Wetland plants and soils can help filter water and capture sediment.",
  },
  {
    q: "What does dissolved oxygen describe?",
    a: [
      "Salt on the shore",
      "Clouds above water",
      "Oxygen available in water",
      "The depth of a pond",
    ],
    correct: 2,
    e: "Dissolved oxygen is oxygen in the water that fish, insects, and other aquatic organisms can use.",
  },
  {
    q: "What does pH help us understand?",
    a: [
      "Water color",
      "Water speed",
      "Water depth",
      "How acidic or basic water is",
    ],
    correct: 3,
    e: "pH indicates whether water is more acidic, neutral, or basic.",
  },
  {
    q: "Conductivity is influenced by what in the water?",
    a: ["Dissolved ions", "Bird calls", "Sunset colors", "Leaf shapes"],
    correct: 0,
    e: "Dissolved ions help water carry an electrical current, which is what a conductivity sensor measures.",
  },
  {
    q: "Why does biodiversity matter?",
    a: [
      "It makes every species identical",
      "Food webs depend on many species",
      "Only one species is needed",
      "It prevents all change",
    ],
    correct: 1,
    e: "Biodiversity connects many species through food webs and helps ecosystems function.",
  },
  {
    q: "Which action helps nearby waterways?",
    a: [
      "Pouring chemicals outside",
      "Damaging stream banks",
      "Reducing litter and runoff",
      "Feeding wild animals",
    ],
    correct: 2,
    e: "Reducing litter, fertilizers, and other runoff helps keep unwanted materials away from waterways.",
  },
];

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}
function prepareQuestions(items) {
  return shuffle(items).map((item) => {
    const choices = shuffle(
      item.a.map((text, index) => ({
        text,
        isCorrect: index === item.correct,
      })),
    );
    return {
      ...item,
      a: choices.map((choice) => choice.text),
      correct: choices.findIndex((choice) => choice.isCorrect),
    };
  });
}

const achievementKey = "tacocat-achievements-v1";
function loadAchievements() {
  try {
    return JSON.parse(localStorage.getItem(achievementKey)) || {};
  } catch {
    return {};
  }
}
const achievements = loadAchievements();
function saveAchievement(type, score, total) {
  achievements[type] = {
    completed: true,
    perfect: score === total,
    score,
    total,
    date: new Date().toISOString(),
  };
  try {
    localStorage.setItem(achievementKey, JSON.stringify(achievements));
  } catch {}
  updateAchievements();
}
function updateAchievements() {
  document.querySelectorAll("[data-class-achievement]").forEach((card) => {
    const item = achievements[card.dataset.classAchievement],
      status = card.querySelector(".badge-status");
    card.classList.toggle("unlocked", Boolean(item?.completed));
    if (status)
      status.textContent = item?.completed
        ? `Unlocked · Score ${item.score}/${item.total}`
        : card.dataset.classAchievement === "knowledge"
          ? "Locked · Finish the quiz"
          : "Locked · Finish every case";
  });
  const ready = Boolean(achievements.detective?.perfect),
    button = document.getElementById("class-open-certificate"),
    status = document.getElementById("class-certificate-status");
  if (button) {
    button.disabled = !ready;
    button.textContent = ready ? "Create certificate" : "Locked";
  }
  if (status)
    status.textContent = ready
      ? "Your Water Detective certificate is unlocked."
      : achievements.detective?.completed
        ? "Try the cases again and earn 6/6 to unlock the certificate."
        : "Earn a 6/6 Water Detective score to unlock your certificate.";
  document
    .querySelector(".certificate-card")
    ?.classList.toggle("unlocked", ready);
}

function createChallenge(rootId, source, type) {
  const root = document.getElementById(rootId);
  let questions = prepareQuestions(source),
    index = 0,
    score = 0,
    answered = false,
    recorded = false;
  function updateProgress() {
    if (type === "detective") {
      document.getElementById("class-detective-number").textContent = Math.min(
        index + 1,
        questions.length,
      );
      document.getElementById("class-detective-total").textContent =
        `of ${questions.length}`;
    } else {
      document.getElementById("class-quiz-label").textContent =
        index >= questions.length
          ? "Quiz complete"
          : `Question ${index + 1} of ${questions.length}`;
      document.getElementById("class-quiz-score").textContent =
        `Score ${score}`;
      document.getElementById("class-quiz-bar").style.width =
        `${Math.min(((index + 1) / questions.length) * 100, 100)}%`;
    }
  }
  function render() {
    if (index >= questions.length) {
      if (!recorded) {
        saveAchievement(type, score, questions.length);
        recorded = true;
      }
      root.innerHTML = `<div class="result"><div class="result-score">${score}/${questions.length}</div><h3>${type === "detective" ? "Case files complete!" : "Quiz complete!"}</h3><p>${score === questions.length ? "Excellent work—you followed every clue." : "Good investigation. Review the clues and try again to improve your score."}</p><a class="game-button show" href="#mission-badges">View my badges ↓</a><button class="game-button restart" type="button">Try again ↻</button></div>`;
      root.querySelector(".restart").addEventListener("click", () => {
        questions = prepareQuestions(source);
        index = 0;
        score = 0;
        answered = false;
        recorded = false;
        updateProgress();
        render();
      });
      updateProgress();
      return;
    }
    const item = questions[index];
    root.innerHTML = `<span class="question-tag">${type === "detective" ? "CASE FILE" : "WETLAND QUIZ"} · ${String(index + 1).padStart(2, "0")}</span><div class="question">${item.q}</div><div class="answers">${item.a.map((answer, choice) => `<button class="answer" type="button" data-choice="${choice}"><b>${String.fromCharCode(65 + choice)}.</b> ${answer}</button>`).join("")}</div><div class="feedback" role="status"></div><button class="game-button next" type="button">${index === questions.length - 1 ? "See my score" : "Next question"} →</button>`;
    root
      .querySelectorAll(".answer")
      .forEach((button) =>
        button.addEventListener("click", () => choose(button, item)),
      );
    root.querySelector(".next").addEventListener("click", () => {
      index++;
      answered = false;
      updateProgress();
      render();
    });
    updateProgress();
  }
  function choose(button, item) {
    if (answered) return;
    answered = true;
    const choice = Number(button.dataset.choice);
    if (choice === item.correct) {
      score++;
      button.classList.add("correct");
    } else {
      button.classList.add("wrong");
      root
        .querySelector(`[data-choice="${item.correct}"]`)
        .classList.add("correct");
    }
    root
      .querySelectorAll(".answer")
      .forEach((answer) => (answer.disabled = true));
    const feedback = root.querySelector(".feedback");
    feedback.innerHTML = `<strong>${choice === item.correct ? "Correct!" : "Good try."}</strong> ${item.e}`;
    feedback.classList.add("show");
    root.querySelector(".next").classList.add("show");
    updateProgress();
  }
  render();
}

createChallenge("class-detective-game", detectiveQuestions, "detective");
createChallenge("class-knowledge-game", knowledgeQuestions, "knowledge");
updateAchievements();

const certificate = document.getElementById("class-certificate"),
  certificateOpen = document.getElementById("class-open-certificate"),
  certificateName = document.getElementById("class-certificate-name"),
  certificateRecipient = document.getElementById("class-certificate-recipient"),
  certificatePrint = document.getElementById("class-print-certificate");
document.getElementById("class-certificate-date").textContent =
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
function updateCertificateName() {
  const name = certificateName.value.trim();
  certificateRecipient.textContent = name || "Your Name";
  certificatePrint.disabled = !name;
}
certificateOpen.addEventListener("click", () => {
  if (!certificateOpen.disabled) {
    updateCertificateName();
    certificate.showModal();
    document.body.classList.add("modal-open");
  }
});
certificate
  .querySelector(".class-certificate-close")
  .addEventListener("click", () => certificate.close());
certificate.addEventListener("click", (event) => {
  if (event.target === certificate) certificate.close();
});
certificate.addEventListener("close", () =>
  document.body.classList.remove("modal-open"),
);
certificateName.addEventListener("input", updateCertificateName);
certificatePrint.addEventListener("click", () => window.print());
