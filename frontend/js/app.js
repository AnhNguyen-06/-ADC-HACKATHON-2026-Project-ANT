/**
 * Project ANT - Frontend Controller
 * Manages WebSocket telemetry, Web Speech API, Web Audio Earcons, Waveform Visualizer,
 * Landmark Chips, and Spatial Navigation Cockpit Visualization.
 */

class AntApp {
  constructor() {
    this.ws = null;
    this.mode = 'DEMO'; // 'DEMO' or 'REAL'
    this.audioContext = null;
    this.synth = window.speechSynthesis || null;
    this.recognition = null;
    this.isRecording = false;
    this.isSpeaking = false;
    this.audioState = 'ready'; // 'ready', 'speaking', 'listening'
    this.waveTick = 0;
    this.lastInstruction = '';
    this.mapData = null;
    this.currentLocation = null;
    this.activeRoute = null;

    this.initAudioContext();
    this.initSpeechRecognition();
    this.initElements();
    this.initWaveform();
    this.initLandmarkChips();
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

  setAudioState(state, label) {
    this.audioState = state;
    const pill = document.getElementById('audio-state-pill');
    if (pill) {
      pill.textContent = label;
      pill.className = `audio-state-pill ${state}`;
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

    this.isSpeaking = true;
    this.setAudioState('speaking', 'SPEAKING CUE');

    // Use native Web Speech Synthesis if available
    if (this.synth) {
      this.synth.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05; // Slightly brisk for efficient navigation
      utterance.pitch = 1.0;
      utterance.onend = () => {
        this.isSpeaking = false;
        if (!this.isRecording) {
          this.setAudioState('ready', 'AUDIO READY');
        }
      };
      utterance.onerror = () => {
        this.isSpeaking = false;
        if (!this.isRecording) {
          this.setAudioState('ready', 'AUDIO READY');
        }
      };
      this.synth.speak(utterance);
    } else {
      setTimeout(() => {
        this.isSpeaking = false;
        if (!this.isRecording) {
          this.setAudioState('ready', 'AUDIO READY');
        }
      }, 3000);
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
        this.isRecording = false;
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
      this.setAudioState('listening', 'LISTENING...');
    } else {
      btn?.classList.remove('recording');
      if (text) text.textContent = 'Voice Command';
      this.setAudioState('ready', 'AUDIO READY');
    }
  }

  initElements() {
    this.canvas = document.getElementById('vision-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.svgMap = document.getElementById('office-map-svg');
  }

  initWaveform() {
    this.waveformCanvas = document.getElementById('waveform-canvas');
    if (!this.waveformCanvas) return;
    this.waveCtx = this.waveformCanvas.getContext('2d');
    this.audioState = 'ready';
    this.waveTick = 0;

    const render = () => {
      this.drawWaveform();
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }

  drawWaveform() {
    if (!this.waveCtx || !this.waveformCanvas) return;
    const ctx = this.waveCtx;
    const w = this.waveformCanvas.width;
    const h = this.waveformCanvas.height;
    this.waveTick += 0.08;

    ctx.clearRect(0, 0, w, h);

    const numBars = 16;
    const barWidth = 4;
    const gap = (w - numBars * barWidth) / (numBars - 1);

    for (let i = 0; i < numBars; i++) {
      let barHeight = 4;
      let color = '#334155';

      if (this.audioState === 'speaking') {
        // Dynamic dancing voice bars
        const offset = i * 0.45;
        const norm = Math.sin(this.waveTick * 3 + offset) * 0.5 + 0.5;
        const norm2 = Math.cos(this.waveTick * 1.8 + offset * 0.7) * 0.5 + 0.5;
        barHeight = 4 + (norm * 0.6 + norm2 * 0.4) * (h - 8);
        color = '#38bdf8'; // Sky cyan
      } else if (this.audioState === 'listening') {
        // Active listening amber bars
        const offset = i * 0.65;
        const norm = Math.sin(this.waveTick * 4 + offset) * 0.5 + 0.5;
        barHeight = 4 + norm * (h - 6);
        color = '#fbbf24'; // Amber
      } else {
        // Resting ambient subtle pulse
        const pulse = Math.sin(this.waveTick * 0.8 + i * 0.25) * 0.5 + 0.5;
        barHeight = 3 + pulse * 3.5;
        color = '#10b981'; // Emerald ready
      }

      const x = i * (barWidth + gap);
      const y = (h - barHeight) / 2;

      ctx.fillStyle = color;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, barWidth, barHeight, 2);
      } else {
        ctx.rect(x, y, barWidth, barHeight);
      }
      ctx.fill();
    }
  }

  initLandmarkChips() {
    const chips = document.querySelectorAll('.landmark-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const destId = chip.dataset.dest;
        if (destId) {
          chips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');

          const select = document.getElementById('destination-select');
          if (select) select.value = destId;

          this.sendWebSocketMessage({
            type: 'set_destination',
            destination_id: destId
          });
        }
      });
    });
  }

  updateActiveLandmarkChip(destId) {
    const chips = document.querySelectorAll('.landmark-chip');
    chips.forEach(chip => {
      if (destId && chip.dataset.dest === destId) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  resetUI() {
    this.updateActiveLandmarkChip(null);
    const select = document.getElementById('destination-select');
    if (select) select.value = '';
    const destMeta = document.getElementById('destination-meta');
    if (destMeta) destMeta.textContent = 'None Selected';
    const locMeta = document.getElementById('location-meta');
    if (locMeta) locMeta.textContent = 'Unlocalized';
    const stateBadge = document.getElementById('nav-state-badge');
    if (stateBadge) {
      stateBadge.textContent = 'STANDBY';
      stateBadge.className = 'badge state-badge standby';
    }
    const obsHud = document.getElementById('obstacle-hud');
    if (obsHud) obsHud.classList.add('hidden');
    const tagReadout = document.getElementById('tag-readout');
    if (tagReadout) tagReadout.textContent = 'Passive optical ready';
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

    // Destination Select button
    document.getElementById('btn-start-nav')?.addEventListener('click', () => {
      const select = document.getElementById('destination-select');
      const destId = select?.value;
      if (destId) {
        this.updateActiveLandmarkChip(destId);
        this.sendWebSocketMessage({
          type: 'set_destination',
          destination_id: destId
        });
      }
    });

    // Reset button
    document.getElementById('btn-reset-nav')?.addEventListener('click', () => {
      this.resetUI();
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
        this.resetUI();
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
      locMeta.textContent = data.current_location ? data.current_location.name : 'Unlocalized';
    }

    const destMeta = document.getElementById('destination-meta');
    if (destMeta) {
      destMeta.textContent = data.destination ? data.destination.name : 'None Selected';
    }

    // Sync landmark chip highlighting and select menu
    if (data.destination && data.destination.id) {
      this.updateActiveLandmarkChip(data.destination.id);
      const select = document.getElementById('destination-select');
      if (select && select.value !== data.destination.id) {
        select.value = data.destination.id;
      }
    } else if (!data.destination) {
      this.updateActiveLandmarkChip(null);
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
      if (tagReadout) tagReadout.textContent = 'Passive optical ready';
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

    const labelOffsets = {
      entrance: { dx: 0, dy: -3.2, anchor: 'middle' },
      hallway_junction: { dx: 0, dy: -3.2, anchor: 'middle' },
      elevator: { dx: 3.8, dy: -0.8, anchor: 'start' },
      restroom: { dx: -3.8, dy: -0.8, anchor: 'end' },
      pantry: { dx: 0, dy: -3.2, anchor: 'middle' },
      stairs_east: { dx: 3.8, dy: 3.2, anchor: 'start' },
      corridor_b: { dx: -3.8, dy: 1.0, anchor: 'end' },
      meeting_b: { dx: 0, dy: 4.2, anchor: 'middle' }
    };

    const shortNames = {
      entrance: 'Entrance',
      hallway_junction: 'Lobby',
      elevator: 'Elevators',
      restroom: 'Restroom',
      pantry: 'Cafeteria',
      stairs_east: 'Stairs',
      corridor_b: 'Corridor B',
      meeting_b: 'Meeting Room B'
    };

    // Nodes
    this.mapData.nodes.forEach(node => {
      const [x, y] = node.coordinates;
      const isCurrent = this.currentLocation && this.currentLocation.id === node.id;
      const isDestination = this.activeRoute && this.activeRoute.destination.id === node.id;

      let fillColor = '#1e293b';
      let strokeColor = '#64748b';
      let textColor = '#94a3b8';
      let r = 2.0;

      if (isCurrent) {
        fillColor = '#10b981';
        strokeColor = '#34d399';
        textColor = '#34d399';
        r = 3.0;
      } else if (isDestination) {
        fillColor = '#38bdf8';
        strokeColor = '#0284c7';
        textColor = '#38bdf8';
        r = 2.8;
      }

      svgHtml += `<circle cx="${x}" cy="${y}" r="${r}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="0.8" />`;
      if (isCurrent) {
        svgHtml += `<circle cx="${x}" cy="${y}" r="${r + 2}" fill="none" stroke="#10b981" stroke-width="0.5" opacity="0.6">
                      <animate attributeName="r" values="${r};${r + 4};${r}" dur="2s" repeatCount="indefinite"/>
                    </circle>`;
      }

      // Offset position and collision-free label
      const offset = labelOffsets[node.id] || { dx: 0, dy: -3.2, anchor: 'middle' };
      const labelText = shortNames[node.id] || node.name;
      const tx = x + offset.dx;
      const ty = y + offset.dy;

      svgHtml += `<text x="${tx}" y="${ty}" font-size="1.5" fill="${textColor}" text-anchor="${offset.anchor}" font-family="'JetBrains Mono', monospace" font-weight="600">${labelText}</text>`;
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
      // Dark optical viewfinder surface
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, w, h);

      // Floor perspective grid lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, h);
        ctx.lineTo(w / 2 + (x - w / 2) * 0.22, h * 0.42);
        ctx.stroke();
      }

      // Ceiling perspective lines
      for (let x = 0; x <= w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(w / 2 + (x - w / 2) * 0.22, h * 0.42);
        ctx.stroke();
      }

      // Horizon line
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.42);
      ctx.lineTo(w, h * 0.42);
      ctx.stroke();

      // Optical focal center mark
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 12, h * 0.42);
      ctx.lineTo(w / 2 + 12, h * 0.42);
      ctx.moveTo(w / 2, h * 0.42 - 12);
      ctx.lineTo(w / 2, h * 0.42 + 12);
      ctx.stroke();

      // If active tag detected, render simulated AprilTag graphic with precision reticle
      if (this.currentLocation && this.currentLocation.tag_id) {
        const tagId = this.currentLocation.tag_id;
        const tagX = w * 0.5 - 55;
        const tagY = h * 0.36;
        const tagSize = 110;

        // Tag matrix background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(tagX, tagY, tagSize, tagSize);
        ctx.fillStyle = '#0a0f1d';
        ctx.fillRect(tagX + 12, tagY + 12, tagSize - 24, tagSize - 24);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(tagX + 30, tagY + 30, tagSize - 60, tagSize - 60);

        // Technical Corner Brackets
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        const bLen = 14;
        const pad = 8;
        const bx1 = tagX - pad;
        const by1 = tagY - pad;
        const bx2 = tagX + tagSize + pad;
        const by2 = tagY + tagSize + pad;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(bx1, by1 + bLen); ctx.lineTo(bx1, by1); ctx.lineTo(bx1 + bLen, by1);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(bx2 - bLen, by1); ctx.lineTo(bx2, by1); ctx.lineTo(bx2, by1 + bLen);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(bx1, by2 - bLen); ctx.lineTo(bx1, by2); ctx.lineTo(bx1 + bLen, by2);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(bx2 - bLen, by2); ctx.lineTo(bx2, by2); ctx.lineTo(bx2, by2 - bLen);
        ctx.stroke();

        // High-contrast HUD tag banner
        ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
        ctx.fillRect(bx1, by1 - 24, 180, 20);
        ctx.fillStyle = '#040711';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillText(`APRILTAG #${tagId} LOCK`, bx1 + 6, by1 - 10);

        // Location label
        ctx.fillStyle = '#34d399';
        ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(`${this.currentLocation.name}`, bx1, by2 + 18);
      }

      // If obstacle present, render tactical hazard marker
      if (activeObstacle) {
        const obsX = activeObstacle.position === 'left' ? w * 0.28 : (activeObstacle.position === 'right' ? w * 0.72 : w * 0.5);
        const obsY = h * 0.68;
        const ow = 90;
        const oh = 90;

        // Semi-transparent alert fill
        ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
        ctx.fillRect(obsX - ow / 2, obsY - oh / 2, ow, oh);

        // Hazard reticle border
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(obsX - ow / 2, obsY - oh / 2, ow, oh);

        // Hazard Label Banner
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(obsX - ow / 2, obsY - oh / 2 - 22, ow, 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${activeObstacle.class.toUpperCase()}`, obsX, obsY - oh / 2 - 8);
        ctx.textAlign = 'start';
      }
    }
  }
}

// Instantiate on load
window.addEventListener('DOMContentLoaded', () => {
  window.antApp = new AntApp();
});
