/**
 * Project ANT - Deterministic Stage Demo Scenario Runner
 * Executes the 60-second hackathon presentation script with 100% offline reliability.
 */

class DemoRunner {
  constructor() {
    this.currentStep = 0;
    this.isPlaying = false;
    this.timerInterval = null;
    this.elapsedSeconds = 0;

    this.steps = [
      {
        time: 0,
        stage: "Initial Localization",
        title: "Initial localization",
        cue: "Camera sights passive AprilTag #1 at office entrance.",
        action: (app) => {
          app.sendWebSocketMessage({ type: 'reset' });
          setTimeout(() => {
            app.sendWebSocketMessage({ type: 'simulate_tag', tag_id: 1 });
          }, 400);
        }
      },
      {
        time: 8,
        stage: "Voice Destination Request",
        title: "Voice destination request",
        cue: "User speaks: 'Take me to Meeting Room B'. Shortest accessible path computed.",
        action: (app) => {
          app.sendWebSocketMessage({
            type: 'voice_command',
            transcript: "Take me to Meeting Room B"
          });
        }
      },
      {
        time: 18,
        stage: "Hazard Perception",
        title: "Hazard perception",
        cue: "Computer vision perceives unexpected obstacle (chair) in central corridor.",
        action: (app) => {
          app.sendWebSocketMessage({
            type: 'simulate_obstacle',
            class: 'chair',
            position: 'center'
          });
        }
      },
      {
        time: 27,
        stage: "Hazard Cleared",
        title: "Hazard cleared",
        cue: "User navigates around chair. Corridor path is confirmed clear.",
        action: (app) => {
          app.sendWebSocketMessage({ type: 'clear_obstacle' });
        }
      },
      {
        time: 36,
        stage: "Elevator Landmark Checkpoint",
        title: "Elevator landmark checkpoint",
        cue: "Camera passively identifies AprilTag #3 at main elevators checkpoint.",
        action: (app) => {
          app.sendWebSocketMessage({ type: 'simulate_tag', tag_id: 3 });
        }
      },
      {
        time: 46,
        stage: "Corridor Checkpoint",
        title: "Corridor checkpoint",
        cue: "Camera sights AprilTag #4 in east wing corridor.",
        action: (app) => {
          app.sendWebSocketMessage({ type: 'simulate_tag', tag_id: 4 });
        }
      },
      {
        time: 55,
        stage: "Destination Arrival",
        title: "Destination arrival",
        cue: "Camera identifies AprilTag #12. Goal reached: Meeting Room B.",
        action: (app) => {
          app.sendWebSocketMessage({ type: 'simulate_tag', tag_id: 12 });
        }
      }
    ];

    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    this.btnPlay = document.getElementById('btn-run-full-demo');
    this.btnStep = document.getElementById('btn-step-demo');
    this.btnStop = document.getElementById('btn-stop-demo');
    this.cueBox = document.getElementById('stage-cue-box');
    this.timerDisplay = document.getElementById('demo-timer');
    this.progressBar = document.getElementById('timeline-bar');
  }

  initEventListeners() {
    this.btnPlay?.addEventListener('click', () => this.togglePlay());
    this.btnStep?.addEventListener('click', () => this.nextStep());
    this.btnStop?.addEventListener('click', () => this.resetDemo());
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pauseDemo();
    } else {
      this.startDemo();
    }
  }

  startDemo() {
    this.isPlaying = true;
    if (this.btnPlay) {
      this.btnPlay.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> Pause`;
    }
    
    // Switch app to Demo Mode
    if (window.antApp && window.antApp.mode !== 'DEMO') {
      window.antApp.toggleMode();
    }

    if (this.currentStep === 0) {
      this.executeStep(0);
      this.currentStep = 1;
    }

    this.timerInterval = setInterval(() => {
      this.elapsedSeconds++;
      this.updateTimerDisplay();

      // Check if current elapsed seconds triggers a step
      const nextStepObj = this.steps[this.currentStep];
      if (nextStepObj && this.elapsedSeconds >= nextStepObj.time) {
        this.executeStep(this.currentStep);
        this.currentStep++;
      }

      if (this.currentStep >= this.steps.length) {
        this.finishDemo();
      }
    }, 1000);
  }

  pauseDemo() {
    this.isPlaying = false;
    if (this.btnPlay) {
      this.btnPlay.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Resume`;
    }
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  finishDemo() {
    this.pauseDemo();
    if (this.btnPlay) {
      this.btnPlay.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Replay`;
    }
    if (this.cueBox) {
      this.cueBox.innerHTML = `<strong>Demonstration complete:</strong> Successfully arrived at Meeting Room B without visual reliance.`;
    }
  }

  resetDemo() {
    this.pauseDemo();
    this.currentStep = 0;
    this.elapsedSeconds = 0;
    this.updateTimerDisplay();
    if (this.progressBar) this.progressBar.style.width = '0%';
    if (this.btnPlay) {
      this.btnPlay.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Play scenario`;
    }
    if (this.cueBox) this.cueBox.textContent = 'Ready for evaluation. Click "Play scenario" for automated 60-second accessible navigation journey.';
    if (window.antApp) {
      window.antApp.sendWebSocketMessage({ type: 'reset' });
    }
  }

  nextStep() {
    if (this.currentStep >= this.steps.length) {
      this.resetDemo();
      return;
    }
    const stepObj = this.steps[this.currentStep];
    this.elapsedSeconds = stepObj.time;
    this.updateTimerDisplay();
    this.executeStep(this.currentStep);
    this.currentStep++;
  }

  executeStep(stepIdx) {
    const stepObj = this.steps[stepIdx];
    if (!stepObj) return;

    if (this.cueBox) {
      this.cueBox.innerHTML = `<strong>Step ${stepIdx + 1}/${this.steps.length} — ${stepObj.title}:</strong> ${stepObj.cue}`;
    }

    const pct = ((stepIdx + 1) / this.steps.length) * 100;
    if (this.progressBar) this.progressBar.style.width = `${pct}%`;

    if (window.antApp) {
      stepObj.action(window.antApp);
    }
  }

  updateTimerDisplay() {
    const mins = Math.floor(this.elapsedSeconds / 60).toString().padStart(2, '0');
    const secs = (this.elapsedSeconds % 60).toString().padStart(2, '0');
    if (this.timerDisplay) this.timerDisplay.textContent = `${mins}:${secs}`;
  }
}

// Instantiate on load
window.addEventListener('DOMContentLoaded', () => {
  window.demoRunner = new DemoRunner();
});
