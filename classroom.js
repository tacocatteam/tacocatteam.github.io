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

const knowledgeQuestions = window.TacoCatQuestionBank || [];
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

// Reapply deep links after web fonts finish loading so tall missions do not
// shift the requested section away from the sticky chapter navigation.
window.addEventListener("load", async () => {
  await document.fonts?.ready;
  const destination = document.getElementById(location.hash.slice(1));
  if (!destination) return;
  requestAnimationFrame(() =>
    requestAnimationFrame(() =>
      destination.scrollIntoView({ behavior: "auto", block: "start" }),
    ),
  );
});

// Mission controls scroll inside Classroom Mode instead of navigating away.
document.querySelectorAll("[data-mission]").forEach((control) => {
  control.addEventListener("click", () => {
    const destination = document.getElementById(control.dataset.mission);
    if (!destination) return;
    destination.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
    history.replaceState(null, "", `#${destination.id}`);
    destination.querySelector("h2")?.focus({ preventScroll: true });
  });
});

document.querySelectorAll(".lesson h2").forEach((heading) => {
  heading.tabIndex = -1;
});

const presentationLinks = [...document.querySelectorAll(".presentation-nav a")];
const presentationNav = document.querySelector(".presentation-nav");
const presentationSections = presentationLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const presentationObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    let activeLink;
    presentationLinks.forEach((link) => {
      const active = link.getAttribute("href") === `#${visible.target.id}`;
      if (active) {
        link.setAttribute("aria-current", "location");
        activeLink = link;
      }
      else link.removeAttribute("aria-current");
    });
    if (activeLink && presentationNav.scrollWidth > presentationNav.clientWidth) {
      const targetLeft =
        activeLink.offsetLeft -
        (presentationNav.clientWidth - activeLink.offsetWidth) / 2;
      presentationNav.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }
  },
  { threshold: [0.25, 0.5, 0.75] },
);
presentationSections.forEach((section) => presentationObserver.observe(section));

function randomIndex(maxExclusive) {
  if (globalThis.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    const range = 0x100000000;
    const unbiasedLimit = range - (range % maxExclusive);
    do globalThis.crypto.getRandomValues(values);
    while (values[0] >= unbiasedLimit);
    return values[0] % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}
function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = randomIndex(index + 1);
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}
function prepareQuestions(items, limit = items.length) {
  return shuffle(items).slice(0, limit).map((item) => {
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
  const previous = achievements[type];
  const bestScore = Math.max(previous?.score || 0, score);
  achievements[type] = {
    completed: true,
    perfect: Boolean(previous?.perfect || score === total),
    score: bestScore,
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
  if (!root) return;
  if (!Array.isArray(source) || source.length === 0) {
    root.innerHTML = `<div class="result"><h3>Questions could not load.</h3><p>Please refresh the page and try again.</p><button class="game-button restart show" type="button">Refresh questions ↻</button></div>`;
    root.querySelector(".restart").addEventListener("click", () =>
      window.location.reload(),
    );
    return;
  }
  const questionCount = type === "knowledge" ? 10 : source.length;
  let questions = prepareQuestions(source, questionCount),
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
      const progress = document.getElementById("class-quiz-progress");
      if (progress) {
        progress.max = questions.length;
        progress.value = Math.min(index + 1, questions.length);
        progress.textContent = `${progress.value} of ${questions.length}`;
      }
    }
  }
  function render() {
    if (index >= questions.length) {
      if (!recorded) {
        saveAchievement(type, score, questions.length);
        recorded = true;
      }
      root.innerHTML = `<div class="result"><div class="result-score">${score}/${questions.length}</div><h3 tabindex="-1">${type === "detective" ? "Case files complete!" : "Quiz complete!"}</h3><p>${score === questions.length ? "Excellent work—you followed every clue." : "Good investigation. Review the clues and try again to improve your score."}</p><a class="game-button show" href="#mission-badges">View my badges ↓</a><button class="game-button restart" type="button">Try again ↻</button></div>`;
      root.querySelector(".restart").addEventListener("click", () => {
        questions = prepareQuestions(source, questionCount);
        index = 0;
        score = 0;
        answered = false;
        recorded = false;
        updateProgress();
        render();
        root.querySelector(".question")?.focus({ preventScroll: true });
      });
      updateProgress();
      return;
    }
    const item = questions[index];
    root.innerHTML = `<span class="question-tag">${type === "detective" ? "CASE FILE" : "WETLAND QUIZ"} · ${String(index + 1).padStart(2, "0")}</span><div class="question" tabindex="-1">${item.q}</div><div class="answers">${item.a.map((answer, choice) => `<button class="answer" type="button" data-choice="${choice}"><b>${String.fromCharCode(65 + choice)}.</b> ${answer}</button>`).join("")}</div><div class="feedback" role="status"></div><button class="game-button next" type="button">${index === questions.length - 1 ? "See my score" : "Next question"} →</button>`;
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
      root
        .querySelector(index >= questions.length ? ".result h3" : ".question")
        ?.focus({ preventScroll: true });
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
    const nextButton = root.querySelector(".next");
    nextButton.classList.add("show");
    nextButton.focus({ preventScroll: true });
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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () =>
    navigator.serviceWorker
      .register("./sw.js")
      .catch((error) =>
        console.warn("Offline support could not start.", error),
      ),
  );
}
