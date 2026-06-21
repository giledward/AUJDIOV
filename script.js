const canvas = document.querySelector('#visualizer');
const ctx = canvas.getContext('2d');

const player = document.querySelector('#player');
const audioFile = document.querySelector('#audioFile');
const micButton = document.querySelector('#micButton');
const captureButton = document.querySelector('#captureButton');
const playButton = document.querySelector('#playButton');
const modeSelect = document.querySelector('#modeSelect');
const paletteSelect = document.querySelector('#paletteSelect');
const intensitySlider = document.querySelector('#intensitySlider');
const smoothingSlider = document.querySelector('#smoothingSlider');
const statusDot = document.querySelector('#statusDot');
const statusText = document.querySelector('#statusText');

let audioContext;
let analyser;
let source;
let dataArray;
let timeArray;
let animationFrame;
let particles = [];
let phase = 0;

const palettes = {
  solana: ['#9945ff', '#14f195', '#00c2ff', '#f7f7ff'],
  fire: ['#ff3d00', '#ffb703', '#ff006e', '#fff3b0'],
  ocean: ['#00d4ff', '#0077ff', '#00ffaa', '#e6fbff'],
  mono: ['#ffffff', '#d8d8d8', '#a8a8a8', '#f7f7ff']
};

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function setStatus(message, live = false) {
  statusText.textContent = message;
  statusDot.classList.toggle('live', live);
}

function createAudioGraph() {
  audioContext ||= new AudioContext();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = Number(smoothingSlider.value);
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  timeArray = new Uint8Array(analyser.frequencyBinCount);
  return analyser;
}

function connectSource(newSource) {
  if (source) {
    try {
      source.disconnect();
    } catch {
      // Some browser sources throw if already disconnected.
    }
  }

  source = newSource;
  const graph = createAudioGraph();
  source.connect(graph);

  // MediaElement sources also need to connect to speakers.
  if (source.mediaElement) {
    graph.connect(audioContext.destination);
  }

  playButton.disabled = false;
  setStatus('Visualizer is live.', true);
  startLoop();
}

async function loadAudioFile(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  player.src = url;
  player.hidden = false;
  await player.play().catch(() => undefined);

  const graph = createAudioGraph();
  const mediaSource = audioContext.createMediaElementSource(player);
  mediaSource.mediaElement = player;
  source = mediaSource;
  source.connect(graph);
  graph.connect(audioContext.destination);

  playButton.disabled = false;
  setStatus(`Playing ${file.name}`, true);
  startLoop();
}

async function useMicrophone() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  const graph = createAudioGraph();
  connectSource(audioContext.createMediaStreamSource(stream));
  setStatus('Microphone input is driving the wallpaper.', true);
}

async function captureTabAudio() {
  const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
  const audioTracks = stream.getAudioTracks();

  if (!audioTracks.length) {
    stream.getTracks().forEach((track) => track.stop());
    setStatus('No audio was shared. Try again and enable tab audio.', false);
    return;
  }

  connectSource(audioContext.createMediaStreamSource(stream));
  setStatus('Captured tab/system audio is driving the wallpaper.', true);
}

function getAudioStats() {
  analyser.smoothingTimeConstant = Number(smoothingSlider.value);
  analyser.getByteFrequencyData(dataArray);
  analyser.getByteTimeDomainData(timeArray);

  const bassBins = dataArray.slice(0, 18);
  const midBins = dataArray.slice(18, 96);
  const highBins = dataArray.slice(96, 220);

  const avg = (arr) => arr.reduce((sum, value) => sum + value, 0) / Math.max(arr.length, 1) / 255;

  return {
    bass: avg([...bassBins]),
    mids: avg([...midBins]),
    highs: avg([...highBins]),
    all: avg([...dataArray])
  };
}

function fadeBackground(stats) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const palette = palettes[paletteSelect.value];
  const glow = Math.min(0.26, stats.bass * 0.35);

  ctx.fillStyle = `rgba(5, 5, 9, ${0.18 - glow * 0.25})`;
  ctx.fillRect(0, 0, width, height);

  const gradient = ctx.createRadialGradient(width * 0.5, height * 0.52, 0, width * 0.5, height * 0.52, Math.max(width, height));
  gradient.addColorStop(0, `${palette[0]}33`);
  gradient.addColorStop(0.45, `${palette[1]}1f`);
  gradient.addColorStop(1, '#05050900');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawNebula(stats, intensity) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const palette = palettes[paletteSelect.value];
  const centerY = height * 0.52;
  const bars = 128;

  ctx.lineWidth = 2 + stats.bass * 8;

  for (let layer = 0; layer < 4; layer++) {
    ctx.beginPath();
    ctx.strokeStyle = palette[layer % palette.length];
    ctx.globalAlpha = 0.2 + layer * 0.12;

    for (let i = 0; i <= bars; i++) {
      const x = (i / bars) * width;
      const audioIndex = Math.floor((i / bars) * dataArray.length);
      const audio = dataArray[audioIndex] / 255;
      const wave = Math.sin(i * 0.18 + phase * (1 + layer * 0.15));
      const y = centerY + wave * 70 * intensity + (audio - 0.4) * height * 0.34 * intensity - layer * 28;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

function drawBars(stats, intensity) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const palette = palettes[paletteSelect.value];
  const count = 96;
  const gap = 4;
  const barWidth = width / count - gap;

  for (let i = 0; i < count; i++) {
    const audioIndex = Math.floor((i / count) * dataArray.length);
    const value = dataArray[audioIndex] / 255;
    const barHeight = Math.max(8, value * height * 0.7 * intensity);
    const x = i * (barWidth + gap);
    const y = height - barHeight;

    const gradient = ctx.createLinearGradient(0, y, 0, height);
    gradient.addColorStop(0, palette[i % palette.length]);
    gradient.addColorStop(1, '#ffffff11');

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth, barHeight);
  }
}

function drawRing(stats, intensity) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const palette = palettes[paletteSelect.value];
  const cx = width / 2;
  const cy = height / 2;
  const baseRadius = Math.min(width, height) * (0.16 + stats.bass * 0.16);
  const points = 180;

  ctx.beginPath();
  for (let i = 0; i <= points; i++) {
    const angle = (Math.PI * 2 * i) / points;
    const audioIndex = Math.floor((i / points) * dataArray.length);
    const audio = dataArray[audioIndex] / 255;
    const radius = baseRadius + audio * 180 * intensity + Math.sin(phase + i * 0.12) * 18;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.strokeStyle = palette[0];
  ctx.lineWidth = 2 + stats.bass * 10;
  ctx.shadowColor = palette[1];
  ctx.shadowBlur = 30 + stats.bass * 60;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function seedParticles() {
  particles = Array.from({ length: 180 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.8,
    vy: (Math.random() - 0.5) * 0.8,
    size: 1 + Math.random() * 2
  }));
}

function drawParticles(stats, intensity) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const palette = palettes[paletteSelect.value];

  if (!particles.length) seedParticles();

  particles.forEach((particle, index) => {
    const audio = dataArray[index % dataArray.length] / 255;
    particle.x += particle.vx * (1 + stats.highs * 8);
    particle.y += particle.vy * (1 + stats.mids * 8);

    if (particle.x < 0) particle.x = width;
    if (particle.x > width) particle.x = 0;
    if (particle.y < 0) particle.y = height;
    if (particle.y > height) particle.y = 0;

    ctx.beginPath();
    ctx.fillStyle = palette[index % palette.length];
    ctx.globalAlpha = 0.28 + audio * 0.72;
    ctx.arc(particle.x, particle.y, particle.size + audio * 8 * intensity, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
}

function drawIdle() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const palette = palettes[paletteSelect.value];
  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, Math.max(width, height));
  gradient.addColorStop(0, `${palette[0]}44`);
  gradient.addColorStop(0.42, `${palette[1]}22`);
  gradient.addColorStop(1, '#050509');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  phase += 0.01;
  requestAnimationFrame(drawIdle);
}

function startLoop() {
  cancelAnimationFrame(animationFrame);

  const loop = () => {
    const stats = getAudioStats();
    const intensity = Number(intensitySlider.value);
    const mode = modeSelect.value;

    fadeBackground(stats);

    if (mode === 'nebula') drawNebula(stats, intensity);
    if (mode === 'bars') drawBars(stats, intensity);
    if (mode === 'particles') drawParticles(stats, intensity);
    if (mode === 'ring') drawRing(stats, intensity);

    phase += 0.025 + stats.bass * 0.08;
    animationFrame = requestAnimationFrame(loop);
  };

  loop();
}

audioFile.addEventListener('change', async (event) => {
  try {
    await loadAudioFile(event.target.files[0]);
  } catch (error) {
    setStatus(`Could not load audio: ${error.message}`, false);
  }
});

micButton.addEventListener('click', async () => {
  try {
    audioContext ||= new AudioContext();
    await audioContext.resume();
    await useMicrophone();
  } catch (error) {
    setStatus(`Microphone failed: ${error.message}`, false);
  }
});

captureButton.addEventListener('click', async () => {
  try {
    audioContext ||= new AudioContext();
    await audioContext.resume();
    await captureTabAudio();
  } catch (error) {
    setStatus(`Capture failed: ${error.message}`, false);
  }
});

playButton.addEventListener('click', async () => {
  if (!player.src) return;
  if (player.paused) await player.play();
  else player.pause();
});

window.addEventListener('resize', () => {
  resizeCanvas();
  seedParticles();
});

resizeCanvas();
seedParticles();
drawIdle();
