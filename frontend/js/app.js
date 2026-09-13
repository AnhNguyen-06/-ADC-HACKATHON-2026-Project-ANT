/**
 * Project ANT - Frontend Controller
 * Manages WebSocket telemetry, Web Speech API, Web Audio Earcons, and Cockpit Visualization.
 */

class AntApp {
  constructor() {
    this.ws = null;
    this.mode = 'DEMO'; // 'DEMO' or 'REAL'
    this.audioContext = null;
    this.synth = window.speechSynthesis || null;
    this.recognition = null;
    this.isRecording = false;
    this.lastInstruction = '';
    this.mapData = null;
    this.currentLocation = null;
    this.activeRoute = null;

    this.initAudioContext();
    this.initSpeechRecognition();
    this.initElements();
    this.initEventListeners();
    this.connectWebSocket();
    this.loadMapTopology();
  }

  initAudioContext() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  // Auditory Earcons (Non-speech acoustic markers)
  playEarcon(type) {
    if (!this.audioContext) return;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    if (type === 'checkpoint') {
      // Rising two-tone chime (523Hz -> 784Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);

    } else if (type === 'hazard') {
      // Sawtooth alert buzz (220Hz -> 180Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.25);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);

    } else if (type === 'arrival') {
      // Success arpeggio: C5 -> E5 -> G5 -> C6
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + idx * 0.08;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
      });
    }
  }

  speak(text) {
    if (!text) return;
    this.lastInstruction = text;
    
    // Update visual text & ARIA region
    const el = document.getElementById('primary-instruction');
    if (el) el.textContent = text;
    const aria = document.getElementById('aria-live-polite');
    if (aria) aria.textContent = text;

    // Use native Web Speech Synthesis if available
    if (this.synth) {
      this.synth.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05; // Slightly brisk for efficient navigation
      utterance.pitch = 1.0;
      this.synth.speak(utterance);
    }
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isRecording = true;
        this.updateMicUI(true);
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.sendWebSocketMessage({
          type: 'voice_command',
          transcript: transcript
        });
      };

      this.recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        this.updateMicUI(false);
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        this.updateMicUI(false);
      };
    }
  }

  toggleMicrophone() {
    if (!this.recognition) {
      const manual = prompt("Enter your destination (e.g. 'Take me to Meeting Room B'):");
      if (manual) {
        this.sendWebSocketMessage({
          type: 'voice_command',
          transcript: manual
        });
      }
      return;
    }

    if (this.isRecording) {
      this.recognition.stop();
    } else {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      try {
        this.recognition.start();
      } catch (e) {
        console.warn("Microphone already started or busy", e);
      }
    }
  }

  updateMicUI(recording) {
    const btn = document.getElementById('btn-mic-talk');
    const text = document.getElementById('mic-status-text');
    if (recording) {
      btn?.classList.add('recording');
      if (text) text.textContent = 'Listening...';
    } else {
      btn?.classList.remove('recording');
      if (text) text.textContent = 'Tap to Speak';
    }
  }

  initElements() {
    this.canvas = document.getElementById('vision-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.svgMap = document.getElementById('office-map-svg');
  }

  initEventListeners() {
    // Mode toggle
    document.getElementById('btn-mode-toggle')?.addEventListener('click', () => this.toggleMode());

    // High Contrast toggle
    document.getElementById('btn-high-contrast')?.addEventListener('click', () => {
      document.body.classList.toggle('high-contrast');
    });

    // Talk button
    document.getElementById('btn-mic-talk')?.addEventListener('click', () => this.toggleMicrophone());

    // Repeat button
    document.getElementById('btn-repeat-speech')?.addEventListener('click', () => {
      if (this.lastInstruction) this.speak(this.lastInstruction);
    });

    // Destination Select
    document.getElementById('btn-start-nav')?.addEventListener('click', () => {
      const select = document.getElementById('destination-select');
      const destId = select?.value;
      if (destId) {
        this.sendWebSocketMessage({
          type: 'set_destination',
          destination_id: destId
        });
      }
    });

    // Reset button
    document.getElementById('btn-reset-nav')?.addEventListener('click', () => {
      this.sendWebSocketMessage({ type: 'reset' });
    });

    // Global Keybindings (Rule 7 Screen-Agnostic Interaction)
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        this.toggleMicrophone();
      } else if (e.code === 'Enter') {
        e.preventDefault();
        if (this.lastInstruction) this.speak(this.lastInstruction);
      } else if (e.code === 'Escape') {
        e.preventDefault();
        this.sendWebSocketMessage({ type: 'reset' });
      } else if (e.key === 'h' || e.key === 'H') {
        document.body.classList.toggle('high-contrast');
      }
    });
  }

  toggleMode() {
    this.mode = this.mode === 'DEMO' ? 'REAL' : 'DEMO';
    const indicator = document.querySelector('.mode-indicator');
    const text = document.getElementById('mode-text');
    if (this.mode === 'REAL') {
      indicator?.classList.remove('demo');
      indicator?.classList.add('real');
      if (text) text.textContent = 'REAL WEBCAM';
      this.startRealWebcam();
    } else {
      indicator?.classList.remove('real');
      indicator?.classList.add('demo');
      if (text) text.textContent = 'DEMO MODE';
      this.stopRealWebcam();
    }
  }

  startRealWebcam() {
    const video = document.getElementById('webcam-video');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
        .then((stream) => {
          this.webcamStream = stream;
          if (video) {
            video.srcObject = stream;
            video.play();
            this.startFrameCaptureLoop();
          }
        })
        .catch((err) => {
          console.warn("Webcam access denied or unavailable", err);
          this.speak("Camera unavailable. Switching to demo mode.");
          this.toggleMode();
        });
    }
  }

  stopRealWebcam() {
    if (this.webcamStream) {
      this.webcamStream.getTracks().forEach(t => t.stop());
      this.webcamStream = null;
    }
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
  }

  startFrameCaptureLoop() {
    const video = document.getElementById('webcam-video');
    if (!this.canvas) return;
    const offscreen = document.createElement('canvas');
    offscreen.width = 320;
    offscreen.height = 240;
    const offCtx = offscreen.getContext('2d');

    this.captureInterval = setInterval(() => {
      if (this.mode !== 'REAL' || !video || video.readyState < 2) return;
      offCtx.drawImage(video, 0, 0, 320, 240);
      const b64 = offscreen.toDataURL('image/jpeg', 0.6);
      this.sendWebSocketMessage({
        type: 'video_frame',
        image: b64
      });
    }, 200); // 5 fps is optimal for indoor walking
  }

  connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/navigation`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.updateConnectionStatus(true);
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'telemetry') {
          this.handleTelemetry(msg);
        }
      } catch (e) {
        console.error("Failed to parse incoming WebSocket message", e);
      }
    };

    this.ws.onclose = () => {
      this.updateConnectionStatus(false);
      setTimeout(() => this.connectWebSocket(), 2000); // Auto-reconnect
    };

    this.ws.onerror = () => {
      this.updateConnectionStatus(false);
    };
  }

  updateConnectionStatus(connected) {
    const dot = document.querySelector('.status-dot');
    const text = document.querySelector('.connection-status .status-text');
    if (connected) {
      dot?.classList.add('connected');
      if (text) text.textContent = 'Connected';
    } else {
      dot?.classList.remove('connected');
      if (text) text.textContent = 'Disconnected';
    }
  }

  sendWebSocketMessage(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  handleTelemetry(data) {
    // 1. Update State Badge
    const stateBadge = document.getElementById('nav-state-badge');
    if (stateBadge) {
      stateBadge.textContent = data.state;
      stateBadge.className = 'badge state-badge ' + data.state.toLowerCase().replace(/_/g, '-');
    }

    // 2. Audio Earcons & Speech trigger
    if (data.spoken_cue) {
      if (data.state === 'AT_CHECKPOINT') {
        this.playEarcon('checkpoint');
      } else if (data.state === 'OBSTACLE_WARNING') {
        this.playEarcon('hazard');
      } else if (data.state === 'DESTINATION_REACHED') {
        this.playEarcon('arrival');
      }
      this.speak(data.spoken_cue);
    } else if (data.instruction && data.instruction !== this.lastInstruction) {
      this.speak(data.instruction);
    }

    // 3. Metadata updates
    const locMeta = document.getElementById('location-meta');
    if (locMeta) {
      const name = data.current_location ? data.current_location.name : 'Unlocalized';
      locMeta.innerHTML = `Current: <strong>${name}</strong>`;
    }

    const destMeta = document.getElementById('destination-meta');
    if (destMeta) {
      const name = data.destination ? data.destination.name : 'None';
      destMeta.innerHTML = `Destination: <strong>${name}</strong>`;
    }

    // 4. Obstacle HUD
    const obsHud = document.getElementById('obstacle-hud');
    if (data.active_obstacle) {
      obsHud?.classList.remove('hidden');
      const details = document.getElementById('hazard-details');
      if (details) {
        const cls = data.active_obstacle.class || 'Obstacle';
        const pos = data.active_obstacle.position || 'center';
        details.textContent = `${cls.toUpperCase()} • ${pos.toUpperCase()}`;
      }
    } else {
      obsHud?.classList.add('hidden');
    }

    // 5. Visual Tag Readout
    const tagReadout = document.getElementById('tag-readout');
    if (data.detected_tags && data.detected_tags.length > 0) {
      const tagIds = data.detected_tags.map(t => `#${t.tag_id}`).join(', ');
      if (tagReadout) tagReadout.textContent = `Tag ${tagIds} Sighted`;
    } else {
      if (tagReadout) tagReadout.textContent = 'No tags detected';
    }

    // 6. Update Route and Map
    this.currentLocation = data.current_location;
    this.activeRoute = data.route;
    this.renderMap();
    this.renderVisionCanvas(data.detected_tags, data.active_obstacle);
  }

  async loadMapTopology() {
    try {
      const res = await fetch('/api/map');
      if (res.ok) {
        this.mapData = await res.json();
        this.renderMap();
      }
    } catch (e) {
      console.warn("Could not fetch map topology", e);
    }
  }

  renderMap() {
    if (!this.svgMap || !this.mapData) return;

    let svgHtml = '';

    // Edges
    this.mapData.edges.forEach(edge => {
      const u = this.mapData.nodes.find(n => n.id === edge.from_node);
      const v = this.mapData.nodes.find(n => n.id === edge.to_node);
      if (u && v) {
        // Check if edge is in active route
        let isRouteEdge = false;
        if (this.activeRoute && this.activeRoute.steps) {
          isRouteEdge = this.activeRoute.steps.some(
            s => s.from_node.id === u.id && s.to_node.id === v.id
          );
        }

        const color = isRouteEdge ? '#38bdf8' : '#334155';
        const strokeWidth = isRouteEdge ? '1.8' : '0.8';
        const dash = isRouteEdge ? 'stroke-dasharray="2,1"' : '';

        svgHtml += `<line x1="${u.coordinates[0]}" y1="${u.coordinates[1]}" 
                          x2="${v.coordinates[0]}" y2="${v.coordinates[1]}" 
                          stroke="${color}" stroke-width="${strokeWidth}" ${dash} />`;
      }
    });

    // Nodes
    this.mapData.nodes.forEach(node => {
      const [x, y] = node.coordinates;
      const isCurrent = this.currentLocation && this.currentLocation.id === node.id;
      const isDestination = this.activeRoute && this.activeRoute.destination.id === node.id;

      let fillColor = '#1e293b';
      let strokeColor = '#64748b';
      let r = 2.0;

      if (isCurrent) {
        fillColor = '#10b981';
        strokeColor = '#34d399';
        r = 3.0;
      } else if (isDestination) {
        fillColor = '#38bdf8';
        strokeColor = '#0284c7';
        r = 2.8;
      }

      svgHtml += `<circle cx="${x}" cy="${y}" r="${r}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="0.8" />`;
      if (isCurrent) {
        svgHtml += `<circle cx="${x}" cy="${y}" r="${r + 2}" fill="none" stroke="#10b981" stroke-width="0.5" opacity="0.6">
                      <animate attributeName="r" values="${r};${r + 4};${r}" dur="2s" repeatCount="indefinite"/>
                    </circle>`;
      }

      // Label
      svgHtml += `<text x="${x}" y="${y - 3.2}" font-size="2" fill="#94a3b8" text-anchor="middle" font-family="sans-serif">${node.name}</text>`;
    });

    this.svgMap.innerHTML = svgHtml;

    // Distance badge
    const distBadge = document.getElementById('route-length-badge');
    if (distBadge) {
      const dist = this.activeRoute ? `${this.activeRoute.total_distance.toFixed(1)}m` : '0m';
      distBadge.textContent = `Route: ${dist}`;
    }
  }

  renderVisionCanvas(detectedTags, activeObstacle) {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // In demo mode or when no real camera feed, render synthesized indoor perspective
    if (this.mode === 'DEMO') {
      ctx.fillStyle = '#0a0f1d';
      ctx.fillRect(0, 0, w, h);

      // Floor grid perspective
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, h);
        ctx.lineTo(w / 2 + (x - w / 2) * 0.2, h * 0.4);
        ctx.stroke();
      }

      // Horizon line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.4);
      ctx.lineTo(w, h * 0.4);
      ctx.stroke();

      // If active tag detected, render simulated AprilTag graphic
      if (this.currentLocation && this.currentLocation.tag_id) {
        const tagId = this.currentLocation.tag_id;
        const tagX = w * 0.5 - 60;
        const tagY = h * 0.35;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(tagX, tagY, 120, 120);
        ctx.fillStyle = '#000000';
        ctx.fillRect(tagX + 15, tagY + 15, 90, 90);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(tagX + 35, tagY + 35, 50, 50);

        // Bounding box overlay
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.strokeRect(tagX - 5, tagY - 5, 130, 130);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(`AprilTag #${tagId} (${this.currentLocation.name})`, tagX - 10, tagY - 12);
      }

      // If obstacle present, render obstacle marker
      if (activeObstacle) {
        const obsX = activeObstacle.position === 'left' ? w * 0.25 : (activeObstacle.position === 'right' ? w * 0.75 : w * 0.5);
        const obsY = h * 0.65;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.strokeRect(obsX - 50, obsY - 50, 100, 100);

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`OBSTACLE: ${activeObstacle.class.toUpperCase()}`, obsX - 50, obsY - 60);
      }
    }
  }
}

// Instantiate on load
window.addEventListener('DOMContentLoaded', () => {
  window.antApp = new AntApp();
});
