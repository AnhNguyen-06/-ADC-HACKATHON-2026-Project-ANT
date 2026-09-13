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
        title: "Initial Localization",
        cue: "Camera sights passive AprilTag #1 at Office Entrance.",
        action: (app) => {
          app.sendWebSocketMessage({ type: 'reset' });
          setTimeout(() => {
            app.sendWebSocketMessage({ type: 'simulate_tag', tag_id: 1 });
          }, 400);
        }
      },
      {
        time: 8,
        title: "Voice Destination Request",
        cue: "User speaks: 'Take me to Meeting Room B'. Dijkstra computes shortest accessible path.",
        action: (app) => {
          app.sendWebSocketMessage({
            type: 'voice_command',
            transcript: "Take me to Meeting Room B"
          });
        }
      },
      {
        time: 18,
        title: "Hazard Perception",
        cue: "Computer Vision perceives unexpected obstacle (chair) in central corridor.",
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
        title: "Hazard Cleared",
        cue: "User navigates around chair. Corridor path is confirmed clear.",
        action: (app) => {
          app.sendWebSocketMessage({ type: 'clear_obstacle' });
        }
      },
      {
        time: 36,
        title: "Elevator Landmark Checkpoint",
        cue: "Camera passively identifies AprilTag #3 at Main Elevators checkpoint.",
        action: (app) => {
          app.sendWebSocketMessage({ type: 'simulate_tag', tag_id: 3 });
        }
      },
      {
        time: 46,
        title: "Corridor Checkpoint",
        cue: "Camera sights AprilTag #4 in East Wing Corridor.",
        action: (app) => {
          app.sendWebSocketMessage({ type: 'simulate_tag', tag_id: 4 });
        }
      },
      {
        time: 55,
        title: "Destination Arrival",
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
    if (this.btnPlay) this.btnPlay.textContent = "⏸ Pause Demo";
    
    // Switch app to Demo Mode
    if (window.antApp && window.antApp.mode !== 'DEMO') {
      window.antApp.toggleMode();
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
    if (this.btnPlay) this.btnPlay.textContent = "▶ Resume Demo";
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  finishDemo() {
    this.pauseDemo();
    if (this.btnPlay) this.btnPlay.textContent = "▶ Replay Scenario";
    if (this.cueBox) {
      this.cueBox.innerHTML = `<strong>Demonstration Complete:</strong> Successfully arrived at Meeting Room B without visual reliance.`;
    }
  }

  resetDemo() {
    this.pauseDemo();
    this.currentStep = 0;
    this.elapsedSeconds = 0;
    this.updateTimerDisplay();
    if (this.progressBar) this.progressBar.style.width = '0%';
    if (this.btnPlay) this.btnPlay.textContent = "▶ Play Full Scenario";
    if (this.cueBox) this.cueBox.textContent = 'Ready. Click "Play Full Scenario" for deterministic hackathon demonstration.';
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
