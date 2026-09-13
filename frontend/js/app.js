/**
 * Project ANT - Frontend Controller
 * Manages WebSocket telemetry, Web Speech API, Web Audio Earcons, Waveform Visualizer,
 * Landmark Chips, Theme Switching (Modern White & Blue vs Obsidian Dark),
 * and Spatial Navigation Cockpit Visualization.
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
    this.detectedTags = [];
    this.activeObstacle = null;
    this.corridorImg = null;

    this.initTheme();
    this.initAudioContext();
    this.initSpeechRecognition();
    this.initElements();
    this.initWaveform();
    this.initLandmarkChips();
    this.initEventListeners();
    this.connectWebSocket();
    this.loadMapTopology();
  }

  formatSentenceCase(str) {
    if (!str) return '';
    const clean = String(str).replace(/_/g, ' ').trim().toLowerCase();
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  initTheme() {
    const saved = localStorage.getItem('ant-theme') || 'light';
    this.setTheme(saved);

    const toggleBtn = document.getElementById('btn-theme-toggle') || document.getElementById('btn-high-contrast');
    toggleBtn?.addEventListener('click', () => {
      const isDark = document.body.classList.contains('theme-dark');
      this.setTheme(isDark ? 'light' : 'dark');
    });
  }

  setTheme(theme) {
    const text = document.getElementById('theme-text');
    if (theme === 'dark') {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
      localStorage.setItem('ant-theme', 'dark');
      if (text) text.textContent = 'Light mode';
    } else {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
      localStorage.setItem('ant-theme', 'light');
      if (text) text.textContent = 'Dark mode';
    }
    this.renderMap();
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
    this.setAudioState('speaking', 'Speaking cue');

    // Use native Web Speech Synthesis if available
    if (this.synth) {
      this.synth.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05; // Slightly brisk for efficient navigation
      utterance.pitch = 1.0;
      utterance.onend = () => {
        this.isSpeaking = false;
        if (!this.isRecording) {
          this.setAudioState('ready', 'Audio ready');
        }
      };
      utterance.onerror = () => {
        this.isSpeaking = false;
        if (!this.isRecording) {
          this.setAudioState('ready', 'Audio ready');
        }
      };
      this.synth.speak(utterance);
    } else {
      setTimeout(() => {
        this.isSpeaking = false;
        if (!this.isRecording) {
          this.setAudioState('ready', 'Audio ready');
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
      this.setAudioState('listening', 'Listening...');
    } else {
      btn?.classList.remove('recording');
      if (text) text.textContent = 'Voice command';
      this.setAudioState('ready', 'Audio ready');
    }
  }

  initElements() {
    this.canvas = document.getElementById('vision-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.svgMap = document.getElementById('office-map-svg');

    // Preload photorealistic real optical sensor corridor imagery
    this.corridorImg = new Image();
    this.corridorImg.src = '/assets/corridor.jpg';
    this.corridorImg.onload = () => {
      if (this.mode === 'DEMO') {
        this.renderVisionCanvas(this.detectedTags, this.activeObstacle);
      }
    };
    // Initial draw
    this.renderVisionCanvas([], null);
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

    const isDark = document.body.classList.contains('theme-dark');
    const numBars = 16;
    const barWidth = 4;
    const gap = (w - numBars * barWidth) / (numBars - 1);

    for (let i = 0; i < numBars; i++) {
      let barHeight = 4;
      let color = isDark ? '#334155' : '#cbd5e1';

      if (this.audioState === 'speaking') {
        // Dynamic dancing voice bars
        const offset = i * 0.45;
        const norm = Math.sin(this.waveTick * 3 + offset) * 0.5 + 0.5;
        const norm2 = Math.cos(this.waveTick * 1.8 + offset * 0.7) * 0.5 + 0.5;
        barHeight = 4 + (norm * 0.6 + norm2 * 0.4) * (h - 8);
        color = isDark ? '#38bdf8' : '#2563eb'; // Cyan in dark, Royal Blue in light
      } else if (this.audioState === 'listening') {
        // Active listening amber bars
        const offset = i * 0.65;
        const norm = Math.sin(this.waveTick * 4 + offset) * 0.5 + 0.5;
        barHeight = 4 + norm * (h - 6);
        color = isDark ? '#fbbf24' : '#d97706'; // Amber
      } else {
        // Resting ambient subtle pulse
        const pulse = Math.sin(this.waveTick * 0.8 + i * 0.25) * 0.5 + 0.5;
        barHeight = 3 + pulse * 3.5;
        color = isDark ? '#10b981' : '#059669'; // Emerald ready
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
    if (destMeta) destMeta.textContent = 'None selected';
    const locMeta = document.getElementById('location-meta');
    if (locMeta) locMeta.textContent = 'Unlocalized';
    const stateBadge = document.getElementById('nav-state-badge');
    if (stateBadge) {
      stateBadge.textContent = 'Standby';
      stateBadge.className = 'state-badge-clean standby';
    }
    const obsHud = document.getElementById('obstacle-hud');
    if (obsHud) obsHud.classList.add('hidden');
    const tagReadout = document.getElementById('tag-readout');
    if (tagReadout) tagReadout.textContent = 'Passive optical ready';
    this.detectedTags = [];
    this.activeObstacle = null;
    this.renderVisionCanvas([], null);
  }

  initEventListeners() {
    // Mode toggle
    document.getElementById('btn-mode-toggle')?.addEventListener('click', () => this.toggleMode());

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
      } else if (e.key === 't' || e.key === 'T' || e.key === 'h' || e.key === 'H') {
        // Toggle theme between Light and Dark
        const isDark = document.body.classList.contains('theme-dark');
        this.setTheme(isDark ? 'light' : 'dark');
      }
    });
  }

  toggleMode() {
    this.mode = this.mode === 'DEMO' ? 'REAL' : 'DEMO';
    const indicator = document.querySelector('.mode-indicator') || document.querySelector('.mode-pill');
    const text = document.getElementById('mode-text');
    if (this.mode === 'REAL') {
      indicator?.classList.remove('demo');
      indicator?.classList.add('real');
      if (text) text.textContent = 'Live camera';
      this.startRealWebcam();
    } else {
      indicator?.classList.remove('real');
      indicator?.classList.add('demo');
      if (text) text.textContent = 'Demo mode';
      this.stopRealWebcam();
      this.renderVisionCanvas(this.detectedTags, this.activeObstacle);
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
    const beacon = document.querySelector('.status-beacon') || document.querySelector('.status-dot');
    const label = document.querySelector('.connection-status .status-label') || document.querySelector('.connection-status .status-text');
    if (connected) {
      beacon?.classList.add('connected');
      if (label) label.textContent = 'Online';
    } else {
      beacon?.classList.remove('connected');
      if (label) label.textContent = 'Offline';
    }
  }

  sendWebSocketMessage(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  handleTelemetry(data) {
    this.detectedTags = data.detected_tags || [];
    this.activeObstacle = data.active_obstacle || null;

    // 1. Update State Badge in Sentence case
    const stateBadge = document.getElementById('nav-state-badge');
    if (stateBadge) {
      stateBadge.textContent = this.formatSentenceCase(data.state);
      stateBadge.className = 'state-badge-clean ' + (data.state || '').toLowerCase().replace(/_/g, '-');
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

    // 3. Metadata updates in Sentence case
    const locMeta = document.getElementById('location-meta');
    if (locMeta) {
      locMeta.textContent = data.current_location ? data.current_location.name : 'Unlocalized';
    }

    const destMeta = document.getElementById('destination-meta');
    if (destMeta) {
      destMeta.textContent = data.destination ? data.destination.name : 'None selected';
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

    // 4. Obstacle HUD in Sentence case
    const obsHud = document.getElementById('obstacle-hud');
    if (data.active_obstacle) {
      obsHud?.classList.remove('hidden');
      const details = document.getElementById('hazard-details');
      if (details) {
        const cls = data.active_obstacle.class || 'Obstacle';
        const pos = data.active_obstacle.position || 'center';
        details.textContent = `${this.formatSentenceCase(cls)} detected · ${this.formatSentenceCase(pos)} corridor`;
      }
    } else {
      obsHud?.classList.add('hidden');
    }

    // 5. Visual Tag Readout in Sentence case
    const tagReadout = document.getElementById('tag-readout');
    if (data.detected_tags && data.detected_tags.length > 0) {
      const tagIds = data.detected_tags.map(t => `#${t.tag_id}`).join(', ');
      if (tagReadout) tagReadout.textContent = `Tag ${tagIds} sighted`;
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

    const isDark = document.body.classList.contains('theme-dark');
    let svgHtml = '';

    // Edges
    this.mapData.edges.forEach(edge => {
      const u = this.mapData.nodes.find(n => n.id === edge.from_node);
      const v = this.mapData.nodes.find(n => n.id === edge.to_node);
      if (u && v) {
        let isRouteEdge = false;
        if (this.activeRoute && this.activeRoute.steps) {
          isRouteEdge = this.activeRoute.steps.some(
            s => s.from_node.id === u.id && s.to_node.id === v.id
          );
        }

        let color = isDark ? '#334155' : '#cbd5e1';
        if (isRouteEdge) {
          color = isDark ? '#38bdf8' : '#2563eb';
        }
        const strokeWidth = isRouteEdge ? '2.0' : '0.9';
        const dash = isRouteEdge ? 'stroke-dasharray="3,1.5"' : '';

        svgHtml += `<line x1="${u.coordinates[0]}" y1="${u.coordinates[1]}" 
                          x2="${v.coordinates[0]}" y2="${v.coordinates[1]}" 
                          stroke="${color}" stroke-width="${strokeWidth}" ${dash} />`;
      }
    });

    const labelOffsets = {
      entrance: { dx: 0, dy: -3.4, anchor: 'middle' },
      hallway_junction: { dx: 0, dy: -3.4, anchor: 'middle' },
      elevator: { dx: 4.0, dy: 3.4, anchor: 'start' },
      restroom: { dx: 0, dy: 4.2, anchor: 'middle' },
      pantry: { dx: 0, dy: -3.4, anchor: 'middle' },
      stairs_east: { dx: 4.0, dy: -2.2, anchor: 'start' },
      corridor_b: { dx: -4.0, dy: 1.0, anchor: 'end' },
      meeting_b: { dx: 0, dy: 4.4, anchor: 'middle' }
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

      let fillColor = isDark ? '#1e293b' : '#ffffff';
      let strokeColor = isDark ? '#64748b' : '#94a3b8';
      let textColor = isDark ? '#94a3b8' : '#475569';
      let r = 2.0;

      if (isCurrent) {
        fillColor = isDark ? '#10b981' : '#059669';
        strokeColor = isDark ? '#34d399' : '#10b981';
        textColor = isDark ? '#34d399' : '#059669';
        r = 3.0;
      } else if (isDestination) {
        fillColor = isDark ? '#38bdf8' : '#2563eb';
        strokeColor = isDark ? '#0284c7' : '#1d4ed8';
        textColor = isDark ? '#38bdf8' : '#2563eb';
        r = 2.8;
      }

      svgHtml += `<circle cx="${x}" cy="${y}" r="${r}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1" />`;
      if (isCurrent) {
        const pulseColor = isDark ? '#10b981' : '#059669';
        svgHtml += `<circle cx="${x}" cy="${y}" r="${r + 2}" fill="none" stroke="${pulseColor}" stroke-width="0.6" opacity="0.6">
                      <animate attributeName="r" values="${r};${r + 4};${r}" dur="2s" repeatCount="indefinite"/>
                    </circle>`;
      }

      // Offset position and collision-free label
      const offset = labelOffsets[node.id] || { dx: 0, dy: -3.4, anchor: 'middle' };
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

    if (this.mode === 'DEMO') {
      // 1. Draw Real Technology Corridor Camera Feed
      if (this.corridorImg && this.corridorImg.complete && this.corridorImg.naturalWidth > 0) {
        ctx.drawImage(this.corridorImg, 0, 0, w, h);
        
        // Subtle optical sensor exposure grade
        const vignette = ctx.createLinearGradient(0, 0, 0, h);
        vignette.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
        vignette.addColorStop(0.18, 'rgba(15, 23, 42, 0.05)');
        vignette.addColorStop(0.82, 'rgba(15, 23, 42, 0.1)');
        vignette.addColorStop(1, 'rgba(15, 23, 42, 0.55)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, w, h);
      } else {
        // High-end neutral slate fallback
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);
      }

      // 2. Sensor Telemetry Header & Footer (Industrial Optical HUD in Sentence case)
      ctx.font = '500 12px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText('Optical stream · 1080p 30 fps · ISO 200 · f/1.8', 24, 30);

      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText('Sensor: Wide 84° fov · Homography locked', w - 24, 30);
      ctx.textAlign = 'start';

      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fillText('Tracking algorithm: AprilTag 36h11 fiducial pose estimation', 24, h - 22);

      ctx.textAlign = 'right';
      ctx.fillText('Depth perception: Active range 0.8m – 6.5m', w - 24, h - 22);
      ctx.textAlign = 'start';

      // 3. Central Lens Framing & Crosshair Reticle (Fine 1px line)
      const cx = w / 2;
      const cy = h * 0.48;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 18, cy); ctx.lineTo(cx - 5, cy);
      ctx.moveTo(cx + 5, cy); ctx.lineTo(cx + 18, cy);
      ctx.moveTo(cx, cy - 18); ctx.lineTo(cx, cy - 5);
      ctx.moveTo(cx, cy + 5); ctx.lineTo(cx, cy + 18);
      ctx.stroke();

      // 4. Large Optical QR / AprilTag Scanner
      if (this.currentLocation && this.currentLocation.tag_id) {
        const tagId = this.currentLocation.tag_id;
        const tagSize = 160; // Extra large high-res marker
        const tagX = w * 0.5 - tagSize / 2;
        const tagY = h * 0.34 - 15;

        // Drop shadow for real physical plaque depth
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(tagX, tagY, tagSize, tagSize);
        ctx.restore();

        // Matte black exterior frame
        const borderPad = 14;
        ctx.fillStyle = '#0a0f1d';
        ctx.fillRect(tagX + borderPad, tagY + borderPad, tagSize - borderPad * 2, tagSize - borderPad * 2);

        // Quiet white boundary
        const qz = borderPad + 9;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(tagX + qz, tagY + qz, tagSize - qz * 2, tagSize - qz * 2);

        // Deterministic AprilTag 36h11 bit cells
        const innerX = tagX + qz + 4;
        const innerY = tagY + qz + 4;
        const innerSize = tagSize - (qz + 4) * 2;
        const cellSize = innerSize / 6;
        ctx.fillStyle = '#0a0f1d';
        for (let r = 0; r < 6; r++) {
          for (let c = 0; c < 6; c++) {
            const isBlack = ((tagId * 19 + r * 7 + c * 13) % 2 === 0);
            if (isBlack) {
              ctx.fillRect(innerX + c * cellSize, innerY + r * cellSize, cellSize + 0.5, cellSize + 0.5);
            }
          }
        }

        // Precision corner tracking brackets [ ]
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        const bLen = 22;
        const pad = 12;
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

        // Clean unboxed metadata badges in Sentence case
        // Top lock badge
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        if (typeof ctx.roundRect === 'function') {
          ctx.beginPath();
          ctx.roundRect(tagX - 10, tagY - 34, tagSize + 20, 24, 4);
          ctx.fill();
        } else {
          ctx.fillRect(tagX - 10, tagY - 34, tagSize + 20, 24);
        }
        ctx.fillStyle = '#34d399';
        ctx.font = '600 12px "JetBrains Mono", monospace';
        ctx.fillText(`AprilTag #${tagId} · Locked`, tagX - 2, tagY - 18);

        // Bottom landmark identification
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        if (typeof ctx.roundRect === 'function') {
          ctx.beginPath();
          ctx.roundRect(tagX - 24, tagY + tagSize + 10, tagSize + 48, 26, 4);
          ctx.fill();
        } else {
          ctx.fillRect(tagX - 24, tagY + tagSize + 10, tagSize + 48, 26);
        }
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.currentLocation.name, tagX + tagSize / 2, tagY + tagSize + 28);
        ctx.textAlign = 'start';
      } else {
        // Passive scanning zone ROI
        const scanW = 200;
        const scanH = 200;
        const sx = cx - scanW / 2;
        const sy = cy - scanH / 2;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(sx, sy, scanW, scanH);
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '500 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Passive landmark scan active', cx, sy + scanH + 24);
        ctx.textAlign = 'start';
      }

      // 5. Authentic Computer Vision Obstacle Detection Box
      if (activeObstacle) {
        const obsX = activeObstacle.position === 'left' ? w * 0.28 : (activeObstacle.position === 'right' ? w * 0.72 : w * 0.5);
        const obsY = h * 0.64;
        const ow = 130;
        const oh = 130;
        const ox = obsX - ow / 2;
        const oy = obsY - oh / 2;

        // Translucent hazard fill
        ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
        ctx.fillRect(ox, oy, ow, oh);

        // Bounding box
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(ox, oy, ow, oh);

        // Clean label in Sentence case
        const obsTitle = `Hazard: ${this.formatSentenceCase(activeObstacle.class || 'obstacle')} (94%)`;
        ctx.fillStyle = '#ef4444';
        if (typeof ctx.roundRect === 'function') {
          ctx.beginPath();
          ctx.roundRect(ox, oy - 24, ow, 22, 3);
          ctx.fill();
        } else {
          ctx.fillRect(ox, oy - 24, ow, 22);
        }
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(obsTitle, obsX, oy - 9);

        // Distance below box
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        if (typeof ctx.roundRect === 'function') {
          ctx.beginPath();
          ctx.roundRect(ox, oy + oh + 6, ow, 20, 3);
          ctx.fill();
        } else {
          ctx.fillRect(ox, oy + oh + 6, ow, 20);
        }
        ctx.fillStyle = '#fca5a5';
        ctx.font = '500 11px "JetBrains Mono", monospace';
        ctx.fillText('Distance: 1.4m', obsX, oy + oh + 20);
        ctx.textAlign = 'start';
      }
    }
  }
}

// Instantiate on load
window.addEventListener('DOMContentLoaded', () => {
  window.antApp = new AntApp();
});
