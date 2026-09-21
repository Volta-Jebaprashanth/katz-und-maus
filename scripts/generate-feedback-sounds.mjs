#!/usr/bin/env node
// Renders the correct/wrong feedback chimes to static WAV files under
// public/audio/, so playback uses plain <audio> elements (like the word
// pronunciation clips) instead of a live Web Audio API AudioContext — which
// browsers (notably Safari/iOS, and backgrounded tabs) auto-suspend after a
// stretch of silence, silently dropping tones scheduled after the first one.
//
// The tone definitions (frequency, timing, envelope, waveform) mirror what
// used to be synthesized at runtime, so the rendered files sound the same.
// To change the chimes, edit CHIMES below and rerun:
//   bun run generate-feedback-sounds

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const AUDIO_DIR = path.join(ROOT, "public", "audio");
const SAMPLE_RATE = 44100;

const CHIMES = {
  "sfx-correct.wav": {
    duration: 0.5,
    tones: [
      { freq: 523.25, start: 0, duration: 0.14, peak: 0.5, type: "sine" }, // C5
      { freq: 659.25, start: 0.09, duration: 0.14, peak: 0.5, type: "sine" }, // E5
      { freq: 783.99, start: 0.18, duration: 0.24, peak: 0.55, type: "sine" }, // G5
    ],
  },
  "sfx-wrong.wav": {
    duration: 0.4,
    tones: [
      { freq: 311.13, start: 0, duration: 0.16, peak: 0.45, type: "triangle" }, // Eb4
      { freq: 233.08, start: 0.12, duration: 0.22, peak: 0.45, type: "triangle" }, // Bb3
    ],
  },
};

// Same shape as the old gain automation: linear attack to `peak` over 20ms,
// then an exponential decay to near-silence by the end of `duration`.
function envelope(t, start, duration, peak) {
  if (t < start || t > start + duration) return 0;
  const rel = t - start;
  const attack = 0.02;
  if (rel < attack) return (peak * rel) / attack;
  const floor = 0.001;
  const rampT = (rel - attack) / (duration - attack);
  return peak * (floor / peak) ** rampT;
}

function sine(freq, t) {
  return Math.sin(2 * Math.PI * freq * t);
}

function triangle(freq, t) {
  return (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * freq * t));
}

function renderChime(tones, duration) {
  const numSamples = Math.ceil(duration * SAMPLE_RATE);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    let value = 0;
    for (const tone of tones) {
      const gain = envelope(t, tone.start, tone.duration, tone.peak);
      if (gain <= 0) continue;
      value += (tone.type === "sine" ? sine(tone.freq, t) : triangle(tone.freq, t)) * gain;
    }
    samples[i] = Math.max(-1, Math.min(1, value));
  }
  return samples;
}

function encodeWav(samples, sampleRate) {
  const dataSize = samples.length * 2; // 16-bit mono
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    buffer.writeInt16LE(Math.round(samples[i] * 32767), 44 + i * 2);
  }
  return buffer;
}

async function main() {
  for (const [filename, chime] of Object.entries(CHIMES)) {
    const samples = renderChime(chime.tones, chime.duration);
    const wav = encodeWav(samples, SAMPLE_RATE);
    await writeFile(path.join(AUDIO_DIR, filename), wav);
    console.log(`wrote public/audio/${filename}`);
  }
}

main();
