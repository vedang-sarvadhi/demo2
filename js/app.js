// Quiz questions
const questions = [
  {
    question: 'What does HTML stand for?',
    answers: [
      'Hyper Text Markup Language',
      'Home Tool Management Language',
      'Hyperlinks and Text Markup Language',
      'High Tech Modern Language'
    ],
    correct: 0
  },
  {
    question: 'Which CSS property changes text color?',
    answers: ['color', 'text-color', 'font-color', 'foreground-color'],
    correct: 0
  },
  {
    question: 'What is JavaScript used for?',
    answers: [
      'To style web pages',
      'To add interactivity and dynamic behavior',
      'To structure web content',
      'To manage server databases'
    ],
    correct: 1
  },
  {
    question: 'Which HTML tag is used for internal CSS?',
    answers: ['<style>', '<script>', '<css>', '<link>'],
    correct: 0
  },
  {
    question: 'Which keyword declares a constant variable?',
    answers: ['var', 'let', 'const', 'static'],
    correct: 2
  }
];

// Variables
let currentQuestion = 0;
let score = 0;
let skipped = 0;
let timer;
let timeLeft = 10;
let selectedAnswer = null;
let faceMesh;
let camera;
let faceDetectionActive = false;

const loginPage = document.getElementById('loginDashboard');
const quizPage = document.getElementById('quizPage');
const resultsPage = document.getElementById('resultsPage');
const cameraModal = document.getElementById('cameraModal');
const loginForm = document.getElementById('loginForm');
const questionText = document.getElementById('question');
const answersDiv = document.getElementById('answers');
const timerDisplay = document.getElementById('timer');
const questionNumber = document.getElementById('questionNumber');
const nextButton = document.getElementById('nextBtn');
const skipButton = document.getElementById('skipBtn');
const video = document.getElementById('video');
const faceCanvas = document.getElementById('faceCanvas');

document.addEventListener('DOMContentLoaded', function () {
  setupEventListeners();
  setupFaceDetection();
});

function setupEventListeners() {
  // Login form
  loginForm.addEventListener('submit', handleLogin);

  // Camera button
  document.getElementById('allowCamera').addEventListener('click', startCamera);

  // Quiz buttons
  nextButton.addEventListener('click', nextQuestion);
  skipButton.addEventListener('click', skipQuestion);

  // Results buttons
  document.getElementById('downloadBtn').addEventListener('click', downloadResults);
  document.getElementById('retakeBtn').addEventListener('click', retakeQuiz);
}

// user login
function handleLogin(e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();

  if (!name || !email) {
    alert('Please fill in all fields!');
    return;
  }

  if (!isValidEmail(email)) {
    alert('Please enter a valid email!');
    return;
  }

  // Save user data and show camera modal
  window.userData = { name: name, email: email };
  loginPage.classList.add('hidden');
  cameraModal.classList.remove('hidden');
}

// Check if email is valid
function isValidEmail(email) {
  return email.includes('@') && email.includes('.');
}

// Start camera access
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
      audio: false
    });

    video.srcObject = stream;
    console.log('Camera started successfully');

    video.addEventListener('loadeddata', function () {
      cameraModal.classList.add('hidden');
      quizPage.classList.remove('hidden');
      loadQuestion();
      startTimer();
      startFaceDetectionLoop();
    });
  } catch (error) {
    console.error('Camera error:', error);
    alert('Camera access failed. Quiz will continue without face monitoring.');
    cameraModal.classList.add('hidden');
    quizPage.classList.remove('hidden');
    loadQuestion();
    startTimer();
  }
}

// Load current question
function loadQuestion() {
  if (currentQuestion >= questions.length) {
    showResults();
    return;
  }

  const question = questions[currentQuestion];
  selectedAnswer = null;

  questionText.textContent = question.question;
  questionNumber.textContent = currentQuestion + 1;

  // Create answer buttons
  answersDiv.innerHTML = '';
  question.answers.forEach((answer, index) => {
    const button = document.createElement('button');
    button.textContent = answer;
    button.className =
      'answer-btn w-full p-4 text-left border border-gray-300 rounded-md hover:bg-gray-50 transition-colors';
    button.onclick = () => selectAnswer(index, button);
    answersDiv.appendChild(button);
  });

  // Reset timer
  timeLeft = 10;
  timerDisplay.textContent = timeLeft;
  timerDisplay.classList.remove('timer-warning');

  // Disable next button
  nextButton.disabled = true;
  nextButton.classList.add('opacity-50', 'cursor-not-allowed');
}

// Handle answer selection
function selectAnswer(index, button) {
  // Remove selection from all buttons
  document.querySelectorAll('.answer-btn').forEach((btn) => {
    btn.classList.remove('selected-answer');
  });

  // Select clicked button
  button.classList.add('selected-answer');
  selectedAnswer = index;

  // Enable next button
  nextButton.disabled = false;
  nextButton.classList.remove('opacity-50', 'cursor-not-allowed');
}

// Start timer for current question
function startTimer() {
  clearInterval(timer);
  timeLeft = 10;
  timerDisplay.textContent = timeLeft;

  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;

    // Show warning when time is low
    if (timeLeft <= 3) {
      timerDisplay.classList.add('timer-warning');
    }

    // Auto-submit when time runs out
    if (timeLeft <= 0) {
      clearInterval(timer);
      if (selectedAnswer === null) {
        skipQuestion();
      } else {
        nextQuestion();
      }
    }
  }, 1000);
}

// Skip current question
function skipQuestion() {
  clearInterval(timer);
  skipped++;
  currentQuestion++;
  loadQuestion();

  if (currentQuestion < questions.length) {
    startTimer();
  }
}

// Go to next question
function nextQuestion() {
  clearInterval(timer);

  if (selectedAnswer !== null) {
    if (selectedAnswer === questions[currentQuestion].correct) {
      score++;
    }
  } else {
    skipped++;
  }

  currentQuestion++;
  loadQuestion();

  if (currentQuestion < questions.length) {
    startTimer();
  }
}

// Show results page
function showResults() {
  if (camera) {
    camera.stop();
  }
  if (video.srcObject) {
    video.srcObject.getTracks().forEach((track) => track.stop());
  }

  quizPage.classList.add('hidden');
  resultsPage.classList.remove('hidden');

  displayResults();
}

// Display quiz results
function displayResults() {
  const total = questions.length;
  const incorrect = total - score - skipped;
  const percentage = Math.round((score / total) * 100);

  document.getElementById('scoreDisplay').textContent = score;
  document.getElementById('incorrectDisplay').textContent = incorrect;
  document.getElementById('skippedDisplay').textContent = skipped;
  document.getElementById('percentageScore').textContent = percentage + '%';

  let gradeText = 'Keep practicing!';
  if (percentage >= 90) gradeText = 'Excellent work!';
  else if (percentage >= 80) gradeText = 'Great job!';
  else if (percentage >= 70) gradeText = 'Good performance!';
  else if (percentage >= 60) gradeText = 'Room for improvement!';

  document.getElementById('gradeText').textContent = gradeText;
}

// Download result card
async function downloadResults() {
  const resultCard = document.getElementById('resultCard');

  document.getElementById('cardName').textContent = window.userData.name;
  document.getElementById('cardEmail').textContent = window.userData.email;
  document.getElementById('cardDate').textContent = new Date().toLocaleDateString();

  const total = questions.length;
  const incorrect = total - score - skipped;
  const percentage = Math.round((score / total) * 100);

  let grade = 'F';
  if (percentage >= 90) grade = 'A+';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B';
  else if (percentage >= 60) grade = 'C';

  document.getElementById('cardScore').textContent = score + '/' + total;
  document.getElementById('cardPercentage').textContent = percentage + '%';
  document.getElementById('cardGrade').textContent = grade;
  document.getElementById('cardCorrect').textContent = score;
  document.getElementById('cardIncorrect').textContent = incorrect;
  document.getElementById('cardSkipped').textContent = skipped;

  // Generate image
  resultCard.classList.remove('hidden');

  try {
    // First try with default settings
    const canvas = await html2canvas(resultCard, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      logging: false
    });

    const link = document.createElement('a');
    link.download = window.userData.name + '_quiz_result.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('Download error:', error);

    if (error.message.includes('oklch')) {
      try {
        console.log('Retrying with legacy color settings...');
        const canvas = await html2canvas(resultCard, {
          scale: 1,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: true,
          logging: false,
          ignoreElements: (element) => {
            // Ignore elements with problematic styles
            const style = window.getComputedStyle(element);
            return (
              style.color.includes('oklch') ||
              style.backgroundColor.includes('oklch') ||
              style.borderColor.includes('oklch')
            );
          }
        });
        const link = document.createElement('a');
        link.download = window.userData.name + '_quiz_result.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        alert(
          'Failed to generate result card due to unsupported color format. Please try again later.'
        );
      }
    } else {
      alert('Failed to generate result card. Please try again.');
    }
  } finally {
    resultCard.classList.add('hidden');
  }
}

function retakeQuiz() {
  currentQuestion = 0;
  score = 0;
  skipped = 0;
  selectedAnswer = null;

  clearInterval(timer);

  if (camera) {
    camera.stop();
  }
  if (video.srcObject) {
    video.srcObject.getTracks().forEach((track) => track.stop());
  }

  resultsPage.classList.add('hidden');
  loginPage.classList.remove('hidden');
  loginForm.reset();
}

// Basic face detection setup
function setupFaceDetection() {
  try {
    faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMesh.onResults(onFaceResults);
  } catch (error) {
    console.log('Face detection not available');
  }
}

function startFaceDetectionLoop() {
  if (!faceDetectionActive) {
    faceDetectionActive = true;
    requestAnimationFrame(processFaceFrame);
  }
}

async function processFaceFrame() {
  if (video.readyState >= 2 && faceMesh) {
    await faceMesh.send({ image: video });
  }
  if (faceDetectionActive) {
    requestAnimationFrame(processFaceFrame);
  }
}

// Handle face detection results
function onFaceResults(results) {
  console.log("onFaceResults called", results);
  const ctx = faceCanvas.getContext('2d');

  ctx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);

  if (results.image) {
    ctx.drawImage(results.image, 0, 0, faceCanvas.width, faceCanvas.height);
  }

  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    const landmarks = results.multiFaceLandmarks[0];

    const nose = landmarks[1];
    const leftEye = landmarks[133];
    const rightEye = landmarks[362];
    const leftMouth = landmarks[61];
    const rightMouth = landmarks[291];

    const faceCenter = (leftEye.x + rightEye.x) / 2;
    const mouthCenter = (leftMouth.x + rightMouth.x) / 2;

    const horizontalDeviation = Math.abs(nose.x - faceCenter);

    const verticalDeviation = Math.abs(nose.y - mouthCenter);

    const eyeLevelDiff = Math.abs(leftEye.y - rightEye.y);

    const isLookingAway =
      horizontalDeviation > 0.04 || verticalDeviation > 0.08 || eyeLevelDiff > 0.03;

    console.log('Face detection:', {
      horizontalDeviation: horizontalDeviation.toFixed(3),
      verticalDeviation: verticalDeviation.toFixed(3),
      eyeLevelDiff: eyeLevelDiff.toFixed(3),
      isLookingAway: isLookingAway
    });

    if (isLookingAway) {
      const warning = document.getElementById('faceNotDetected');
      if (warning) {
        warning.classList.remove('hidden');
        warning.innerHTML =
          '⚠️ <strong>WARNING:</strong> You are not looking at the screen! Please look directly at the camera.';
        warning.style.display = 'block';
      }
    } else {
      const warning = document.getElementById('faceNotDetected');
      if (warning) {
        warning.classList.add('hidden');
        warning.style.display = 'none';
      }
    }
  } else {
    const warning = document.getElementById('faceNotDetected');
    if (warning) {
      warning.classList.remove('hidden');
      warning.innerHTML =
        '⚠️ <strong>WARNING:</strong> No face detected! Please look at the camera.';
      warning.style.display = 'block';
    }
  }
}
