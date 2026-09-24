<template>
  <div
    class="glow-wrapper transition-opacity duration-[1500ms] ease-out"
    :class="[
      isVisible ? 'opacity-100' : 'opacity-0',
      absolute ? 'is-absolute' : '',
    ]"
  >
    <canvas ref="canvasRef" class="glow-overlay"></canvas>

    <!-- Debug Controller Panel -->
    <div class="debug-panel" :class="{ collapsed: !panelOpen }">
      <button class="debug-toggle" @click="panelOpen = !panelOpen">
        {{ panelOpen ? "✕" : "🎛" }}
      </button>
      <div v-show="panelOpen" class="debug-content">
        <h3>Glow Controller</h3>

        <fieldset>
          <legend>
            <label
              ><input v-model="ctrl.mainShow" type="checkbox" /> Main
              Glow</label
            >
          </legend>
          <label title="Color field rotation speed. -5=fast CCW, 0=frozen"
            >Rotation <span>{{ ctrl.mainRotSpeed.toFixed(1) }}</span>
            <input
              v-model.number="ctrl.mainRotSpeed"
              type="range"
              min="-5"
              max="0"
              step="0.1"
            />
          </label>
          <label
            title="Number of Gaussian blur iterations. More=softer/wider bloom"
            >Blur Passes <span>{{ ctrl.mainBlurPasses }}</span>
            <input
              v-model.number="ctrl.mainBlurPasses"
              type="range"
              min="0"
              max="8"
              step="1"
            />
          </label>
          <label
            title="Pixel radius per blur tap. Higher=wider glow spread per pass"
            >Blur Spread <span>{{ ctrl.mainBlurSpread.toFixed(1) }}</span>
            <input
              v-model.number="ctrl.mainBlurSpread"
              type="range"
              min="0"
              max="10"
              step="0.5"
            />
          </label>
          <label title="How much the blurred bloom adds to the sharp glow"
            >Bloom Mix <span>{{ ctrl.mainBloomStrength.toFixed(2) }}</span>
            <input
              v-model.number="ctrl.mainBloomStrength"
              type="range"
              min="0"
              max="20"
              step="0.05"
            />
          </label>
          <label
            title="Edge alpha sharpness. Low=thin border, High=thick visible edge"
            >Edge Thick <span>{{ ctrl.mainAlpha.toFixed(1) }}</span>
            <input
              v-model.number="ctrl.mainAlpha"
              type="range"
              min="0"
              max="5"
              step="0.1"
            />
          </label>
          <label title="Corner radius of the glowing border">
            Edge Radius <span>{{ ctrl.mainRadius }}</span>
            <input
              v-model.number="ctrl.mainRadius"
              type="range"
              min="0"
              max="250"
              step="1"
            />
          </label>
          <label
            title="Squircle curvature. 2=Circle, 3=Apple Squircle, 4=Square"
          >
            Corner Curve <span>{{ ctrl.mainSquircle.toFixed(1) }}</span>
            <input
              v-model.number="ctrl.mainSquircle"
              type="range"
              min="2.0"
              max="5.0"
              step="0.1"
            />
          </label>
          <label title="How fast the intro pulse wave sweeps across. 0=no pulse"
            >Pulse Spd <span>{{ ctrl.mainPulseSpeed.toFixed(2) }}</span>
            <input
              v-model.number="ctrl.mainPulseSpeed"
              type="range"
              min="0"
              max="2"
              step="0.05"
            />
          </label>
          <div style="flex: 1">
            <label title="Visualize Color Blobs">
              <input v-model="ctrl.mainDebugBlob" type="checkbox" />
              Debug Blobs
            </label>
            <label title="Visualize Mask SDF">
              <input v-model="ctrl.mainDebugMask" type="checkbox" />
              Debug Mask
            </label>
            <label title="Visualize Blur Post-Process">
              <input v-model="ctrl.mainDebugBloom" type="checkbox" />
              Debug Bloom
            </label>
          </div>
          <div class="gradient-section">
            <label title="Choose the gradient calculation method">
              Gradient Mode
              <select v-model="ctrl.gradientMode">
                <option value="bilinear">Bilinear (4 Corners)</option>
                <option value="conic">Conic Sweep</option>
                <option value="mesh">Mesh Blobs</option>
              </select>
            </label>

            <div v-if="ctrl.gradientMode === 'bilinear'" class="color-row">
              <span class="color-label">Colors</span>
              <input v-model="ctrl.bilinearColors[0]" type="color" />
              <input v-model="ctrl.bilinearColors[1]" type="color" />
              <input v-model="ctrl.bilinearColors[2]" type="color" />
              <input v-model="ctrl.bilinearColors[3]" type="color" />
            </div>

            <div v-else class="color-list">
              <div
                v-for="(item, index) in ctrl.gradientMode === 'conic'
                  ? ctrl.conicColors
                  : ctrl.meshBlobs"
                :key="index"
                class="color-item"
              >
                <input v-model="item.hex" type="color" />
                <div
                  v-if="ctrl.gradientMode === 'conic'"
                  class="color-controls"
                >
                  <input
                    v-model.number="item.stop"
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    title="Stop %"
                  />
                  <span>{{ item.stop }}%</span>
                </div>
                <div
                  v-if="ctrl.gradientMode === 'mesh'"
                  class="color-controls mesh-controls"
                >
                  <label
                    >X:
                    <input
                      v-model.number="item.x"
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                  /></label>
                  <label
                    >Y:
                    <input
                      v-model.number="item.y"
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                  /></label>
                  <label
                    >W:
                    <input
                      v-model.number="item.influence"
                      type="range"
                      min="0.1"
                      max="5"
                      step="0.1"
                      title="Influence"
                  /></label>
                </div>
                <button title="Remove Color" @click="removeColor(index)">
                  ×
                </button>
              </div>
              <button class="add-color-btn" @click="addColorStop">
                + Add Color
              </button>
            </div>
          </div>
        </fieldset>
      </div>
    </div>
  </div>
</template>

<script setup>
import { shallowRef, reactive, ref, watch, onMounted, onUnmounted } from "vue";

const props = defineProps({
  absolute: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: false,
  },
});

import { useAnimationStore } from "../composables/useAnimationStore.js";
import { gsap } from "gsap";

const { setCustomState, scrollVelocity } = useAnimationStore();

const canvasRef = shallowRef(null);
const iconRef = shallowRef(null);
// Standalone playground: expose the complete controller immediately.
const panelOpen = ref(true);

const activeProgress = ref(0);

const handleShowEvent = () => {
  gsap.to(activeProgress, {
    value: 1,
    duration: 1.0,
    ease: "power2.out",
  });
  triggerPulse(1.0, 0.5);
};
const handleHideEvent = () => {
  gsap.to(activeProgress, {
    value: 0,
    duration: 1.5,
    ease: "power2.out",
  });
};

const handleProgressEvent = (e) => {
  gsap.killTweensOf(activeProgress);
  activeProgress.value = e.detail.progress;
};

watch(
  () => props.active,
  (newVal) => {
    if (newVal) {
      handleShowEvent();
    } else {
      handleHideEvent();
    }
  },
  { immediate: true }
);

// ── Reactive debug controls ──
const ctrl = reactive({
  mainShow: true,
  mainRotSpeed: -5.0,
  mainBlurPasses: 5,
  mainBlurSpread: 2.0,
  mainBloomStrength: 2.0,
  mainAlpha: 0.7,
  mainRadius: 50,
  mainSquircle: 3.8,
  mainPulseSpeed: 0.65,
  gradientMode: "bilinear",
  bilinearColors: ["#ff9cff", "#ff9638", "#ffff22", "#54ffff"],
  conicColors: [
    { hex: "#ff9cff", stop: 0 },
    { hex: "#ff9638", stop: 25 },
    { hex: "#ffff22", stop: 50 },
    { hex: "#54ffff", stop: 75 },
  ],
  meshBlobs: [
    { hex: "#ff9cff", x: 0.2, y: 0.2, influence: 1.5 },
    { hex: "#ff9638", x: 0.8, y: 0.2, influence: 1.5 },
    { hex: "#ffff22", x: 0.8, y: 0.8, influence: 1.5 },
    { hex: "#54ffff", x: 0.2, y: 0.8, influence: 1.5 },
  ],
  mainDebugBlob: false,
  mainDebugMask: false,
  mainDebugBloom: false,
});

watch(
  () => ctrl.mainPulseSpeed,
  () => {
    pulse = 0;
  }
);
let gl = null;
let glowProgram = null;
let blurProgram = null;
let compositeProgram = null;
let animId = null;
let startTime = 0;
let customElapsed = 0;

const isVisible = ref(false);

let blueNoiseTexture = null;
let fboDataType = null;

// Bloom FBOs
let glowFBO = null; // glow render target
const bloomFBOs = [null, null]; // ping-pong blur targets (half-res)
let quadBuf = null;

// Uniform location caches
const glowLocs = {};
const blurLocs = {};
const compositeLocs = {};

// ── AppleEfx colors (sRGB → linear) ──
function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function hexToLinear(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
}

const colors = [
  hexToLinear("#ff9cff"),
  hexToLinear("#ff9638"),
  hexToLinear("#ffff22"),
  hexToLinear("#54ffff"),
];

function removeColor(idx) {
  if (ctrl.gradientMode === "conic") ctrl.conicColors.splice(idx, 1);
  else ctrl.meshBlobs.splice(idx, 1);
}

function addColorStop() {
  const modeList =
    ctrl.gradientMode === "conic" ? ctrl.conicColors : ctrl.meshBlobs;
  if (modeList.length >= 8) return;
  if (ctrl.gradientMode === "conic") {
    modeList.push({ hex: "#ffffff", stop: 100 });
  } else {
    modeList.push({ hex: "#ffffff", x: 0.5, y: 0.5, influence: 1.5 });
  }
}

const MAX_COLORS = 8;
const flatColors = new Float32Array(MAX_COLORS * 3);
const flatStops = new Float32Array(MAX_COLORS);
const flatPositions = new Float32Array(MAX_COLORS * 2);
const flatInfluences = new Float32Array(MAX_COLORS);

// Live-update linear colors from ctrl hex values
function syncColors() {
  for (let i = 0; i < 4; i++) {
    colors[i] = hexToLinear(ctrl.bilinearColors[i]);
  }
  if (!gl || !glowProgram) return;

  gl.useProgram(glowProgram);
  if (glowLocs.u_c0) gl.uniform3fv(glowLocs.u_c0, colors[0]);
  if (glowLocs.u_c1) gl.uniform3fv(glowLocs.u_c1, colors[1]);
  if (glowLocs.u_c2) gl.uniform3fv(glowLocs.u_c2, colors[2]);
  if (glowLocs.u_c3) gl.uniform3fv(glowLocs.u_c3, colors[3]);

  const activeList =
    ctrl.gradientMode === "conic" ? ctrl.conicColors : ctrl.meshBlobs;
  const count = activeList.length;

  const sortedList = [...activeList];
  if (ctrl.gradientMode === "conic") {
    sortedList.sort((a, b) => a.stop - b.stop);
  }

  for (let i = 0; i < MAX_COLORS; i++) {
    if (i < count) {
      const item = sortedList[i];
      const lin = hexToLinear(item.hex);
      flatColors[i * 3 + 0] = lin[0];
      flatColors[i * 3 + 1] = lin[1];
      flatColors[i * 3 + 2] = lin[2];

      if (ctrl.gradientMode === "conic") {
        flatStops[i] = item.stop / 100.0;
      } else {
        flatPositions[i * 2 + 0] = item.x;
        flatPositions[i * 2 + 1] = item.y;
        flatInfluences[i] = item.influence;
      }
    }
  }

  let modeInt = 0;
  if (ctrl.gradientMode === "conic") modeInt = 1;
  else if (ctrl.gradientMode === "mesh") modeInt = 2;

  let lastColor = [0, 0, 0];
  let lastStop = 0;
  if (count > 0) {
    const lastItem = sortedList[count - 1];
    lastColor = hexToLinear(lastItem.hex);
    if (ctrl.gradientMode === "conic") lastStop = lastItem.stop / 100.0;
  }

  if (glowLocs.u_gradientMode) gl.uniform1i(glowLocs.u_gradientMode, modeInt);
  if (glowLocs.u_colorCount) gl.uniform1i(glowLocs.u_colorCount, count);
  if (glowLocs.u_colors) gl.uniform3fv(glowLocs.u_colors, flatColors);
  if (glowLocs.u_stops) gl.uniform1fv(glowLocs.u_stops, flatStops);
  if (glowLocs.u_positions) gl.uniform2fv(glowLocs.u_positions, flatPositions);
  if (glowLocs.u_influences)
    gl.uniform1fv(glowLocs.u_influences, flatInfluences);
  if (glowLocs.u_lastColor) gl.uniform3fv(glowLocs.u_lastColor, lastColor);
  if (glowLocs.u_lastStop) gl.uniform1f(glowLocs.u_lastStop, lastStop);
}

// ── Shared vertex shader ──
const vertSrc = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// ── Pass 1: AppleEfx glow (renders to FBO) ──
const glowFragSrc = `
  precision highp float;
  uniform float u_padding;
  uniform vec2 u_resolution;
  uniform vec2 u_coverAspect;
  uniform float u_time;
  uniform float u_amount;
  uniform float u_pulse;
  uniform vec2 u_pulseCenter;
  uniform vec3 u_c0;
  uniform vec3 u_c1;
  uniform vec3 u_c2;
  uniform vec3 u_c3;
  uniform sampler2D u_blueNoiseTexture;
  uniform vec2 u_blueNoiseCoordOffset;
  uniform float u_rotSpeed;
  uniform float u_alphaMul;
  uniform float u_squircle;
  uniform float u_debugBlob;
  uniform float u_debugMask;
  varying vec2 v_uv;

  #define MAX_COLORS 8
  #define MAX_COLORS_MINUS_ONE 7
  uniform int u_gradientMode;
  uniform int u_colorCount;
  uniform vec3 u_colors[MAX_COLORS];
  uniform float u_stops[MAX_COLORS];
  uniform vec2 u_positions[MAX_COLORS];
  uniform float u_influences[MAX_COLORS];

  // Specific uniforms to avoid dynamic array indexing in WebGL 1.0
  uniform vec3 u_lastColor;
  uniform float u_lastStop;

  float linearstep(float edge0, float edge1, float x) {
    return clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  }
  float sdSquircle(in vec2 p, in vec2 b) {
    vec2 d = abs(p) - b;
    vec2 m = max(d, 0.0);
    float l = pow(pow(m.x, u_squircle) + pow(m.y, u_squircle), 1.0 / u_squircle);
    return l + min(max(d.x, d.y), 0.0);
  }
  vec3 getBlueNoise(vec2 coord) {
    return texture2D(u_blueNoiseTexture, coord * (1.0 / 128.0) + u_blueNoiseCoordOffset).rgb;
  }

  vec3 getConicColor(vec2 uv) {
    float angle = atan(uv.y - 0.5, uv.x - 0.5);
    float t = fract(angle / 6.283185307 + 0.5);
    
    vec3 color = u_colors[0];
    for (int i = 0; i < MAX_COLORS_MINUS_ONE; i++) {
      if (i >= u_colorCount - 1) break;
      float s1 = u_stops[i];
      float s2 = u_stops[i+1];
      if (t >= s1 && t <= s2) {
        float f = (t - s1) / (s2 - s1 + 0.0001);
        color = mix(u_colors[i], u_colors[i+1], f);
      }
    }
    // Handle wrap around from last color to first color
    if (u_colorCount > 1) {
      if (t > u_lastStop) {
        float f = (t - u_lastStop) / (1.0 - u_lastStop + u_stops[0] + 0.0001);
        color = mix(u_lastColor, u_colors[0], f);
      }
      if (t < u_stops[0]) {
        float f = (t + 1.0 - u_lastStop) / (1.0 - u_lastStop + u_stops[0] + 0.0001);
        color = mix(u_lastColor, u_colors[0], f);
      }
    }
    return color;
  }

  vec3 getMeshColor(vec2 uv) {
    vec3 colorSum = vec3(0.0);
    float weightSum = 0.0;
    for (int i = 0; i < MAX_COLORS; i++) {
      if (i >= u_colorCount) break;
      float d = length(uv - u_positions[i]);
      float w = 1.0 / pow(d + 0.001, u_influences[i]);
      colorSum += u_colors[i] * w;
      weightSum += w;
    }
    return colorSum / weightSum;
  }

  void main() {
    vec3 bnoise = getBlueNoise(gl_FragCoord.xy);
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);

    // Rotating color field (note.js LMS approach)
    vec2 glowUv = (v_uv - 0.5) * u_coverAspect * 2.0;
    float angle = u_time * u_rotSpeed;
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    glowUv = rot * glowUv;
    glowUv = glowUv * 0.5 + 0.5;
    glowUv = clamp(glowUv, vec2(0.0), vec2(1.0));

    vec3 glowColor = vec3(0.0);
    if (u_gradientMode == 0) {
      vec3 colorT = mix(u_c0, u_c1, glowUv.x);
      vec3 colorB = mix(u_c3, u_c2, glowUv.x);
      glowColor = mix(colorB, colorT, glowUv.y);
    } else if (u_gradientMode == 1) {
      glowColor = getConicColor(glowUv);
    } else {
      glowColor = getMeshColor(glowUv);
    }
    glowColor *= glowColor * glowColor * 2.0;

    if (u_debugBlob > 0.5) {
      gl_FragColor = vec4(pow(min(glowColor, 1.0), vec3(1.0 / 2.2)), 1.0);
      return;
    }

    vec2 wp = (v_uv - u_pulseCenter) * aspect;
    float wl = length(aspect);
    float wpl = wl - length(wp);
    float wsl = 0.5 * wl;
    float wel = 0.5 * wl;
    float wtl = wl + wsl + wel;
    float wt = u_pulse * wtl - wl + wpl;
    float w0 = smoothstep(0.0, wsl, wt);
    float w1 = smoothstep(wsl + wel, wsl, wt);
    float wave = w0 * w1 * u_amount;
    vec2 waveDir = length(wp) > 0.001 ? normalize(wp) : vec2(1.0, 0.0);

    vec2 borderUv = (v_uv - 0.5) * u_resolution + waveDir * wave * 0.01 * u_resolution.x;
    float d = sdSquircle(borderUv, u_resolution * 0.5 - u_padding * 2.0) - u_padding;
    d = linearstep(0.0, u_padding * 2.5, d);
    float test = d;
    d = pow(d, 3.0);

    float d2 = sdSquircle(borderUv, u_resolution * 0.5 - u_padding * 3.0) - u_padding * 1.5;
    d2 = linearstep(0.0, u_padding * 5.5, d2);
    test += d2;
    d2 = pow(d2, 5.0);

    float glow = (0.001 + d + d2 * 0.5) * 5.0;
    vec3 color = u_amount * glowColor * glow;
    
    // Boost wave visibility (moderated)
    color += wave * (d * 0.35 + d2 * 0.35 + glowColor * 0.15);

    // For our transparent overlay, using raw glow gives the correct thickness.
    float alpha = min(1.0, glow + wave * (d * 0.35 + d2 * 0.35 + 0.15));

    if (u_debugMask > 0.5) {
      gl_FragColor = vec4(vec3(alpha * u_alphaMul), 1.0);
      return;
    }

    color = color + bnoise * 0.004;
    gl_FragColor = vec4(color, alpha * u_alphaMul);
  }
`;

// ── Pass 2: Gaussian blur (horizontal or vertical) ──
const blurFragSrc = `
  precision highp float;
  uniform sampler2D u_texture;
  uniform vec2 u_direction; // (1/w, 0) or (0, 1/h)
  varying vec2 v_uv;

  void main() {
    // 9-tap Gaussian blur (preserves alpha)
    vec4 color = vec4(0.0);
    color += texture2D(u_texture, v_uv - 4.0 * u_direction) * 0.0162;
    color += texture2D(u_texture, v_uv - 3.0 * u_direction) * 0.0540;
    color += texture2D(u_texture, v_uv - 2.0 * u_direction) * 0.1218;
    color += texture2D(u_texture, v_uv - 1.0 * u_direction) * 0.1950;
    color += texture2D(u_texture, v_uv) * 0.2260;
    color += texture2D(u_texture, v_uv + 1.0 * u_direction) * 0.1950;
    color += texture2D(u_texture, v_uv + 2.0 * u_direction) * 0.1218;
    color += texture2D(u_texture, v_uv + 3.0 * u_direction) * 0.0540;
    color += texture2D(u_texture, v_uv + 4.0 * u_direction) * 0.0162;
    gl_FragColor = color;
  }
`;

// ── Pass 3: Composite (glow + bloom) ──
const compositeFragSrc = `
  precision highp float;
  uniform sampler2D u_glowTexture;
  uniform sampler2D u_bloomTexture;
  uniform float u_bloomStrength;
  uniform float u_debugBloom;
  uniform float u_debugBlob;
  uniform float u_debugMask;
  varying vec2 v_uv;

  void main() {
    vec4 glow = texture2D(u_glowTexture, v_uv);

    // Bypass completely for base debug views so they don't get double-gamma'd
    if (u_debugBlob > 0.5 || u_debugMask > 0.5) {
      gl_FragColor = glow;
      return;
    }

    vec4 bloom = texture2D(u_bloomTexture, v_uv);
    
    vec3 color;
    float alpha;
    if (u_debugBloom > 0.5) {
      color = bloom.rgb * u_bloomStrength;
      alpha = bloom.a * u_bloomStrength;
    } else {
      color = glow.rgb + bloom.rgb * u_bloomStrength;
      alpha = min(1.0, glow.a + bloom.a * u_bloomStrength);
    }
    
    // Pure digital ceiling to preserve raw, highly-saturated neon punch
    color = min(color, 1.0);
    
    // Apply sRGB curve after all additive blending to preserve deep, vibrant colors
    color = pow(color, vec3(1.0 / 2.2));
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// ── Helper: create FBO with texture ──
function createFBO(w, h) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, fboDataType, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    tex,
    0
  );
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return { fb, tex, w, h };
}

function destroyFBO(fbo) {
  if (!fbo) return;
  gl.deleteTexture(fbo.tex);
  gl.deleteFramebuffer(fbo.fb);
}

// ── Build shader program ──
function buildProgram(vertSrc, fragSrc) {
  const vs = compileShader(gl.VERTEX_SHADER, vertSrc);
  const fs = compileShader(gl.FRAGMENT_SHADER, fragSrc);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error("Link error:", gl.getProgramInfoLog(prog));
  }
  return prog;
}

function compileShader(type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader error:", gl.getShaderInfoLog(shader));
  }
  return shader;
}

function drawQuad() {
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  const aPos = 0; // attribute location 0
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// ── Canvas dimensions ──
let canvasW = 1,
  canvasH = 1;
let elementW = 1,
  elementH = 1;
let bloomW = 1,
  bloomH = 1;

function initGL(canvas) {
  gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: false,
    antialias: false,
  });
  if (!gl) return false;

  blueNoiseTexture = gl.createTexture();

  // Check for HDR FBO support
  const extHalfFloat = gl.getExtension("OES_texture_half_float");
  const extHalfFloatLinear = gl.getExtension("OES_texture_half_float_linear");
  const extColorBuffer = gl.getExtension("EXT_color_buffer_half_float");

  // Use the component's original compatible fallback in the standalone build.
  // It is visually equivalent after the final digital ceiling and avoids
  // driver-specific half-float FBO failures outside Nuxt's WebGL setup.
  fboDataType = gl.UNSIGNED_BYTE;

  gl.bindTexture(gl.TEXTURE_2D, blueNoiseTexture);
  // Placeholder 1x1 black pixel until image loads
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 255])
  );

  const img = new Image();
  // The original repository does not contain the referenced blue-noise asset,
  // so preserve its existing black fallback without producing a network 404.
  img.src =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLJiQAAAABJRU5ErkJggg==";
  img.onload = () => {
    if (!gl) return;
    gl.bindTexture(gl.TEXTURE_2D, blueNoiseTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  };

  // Shared quad buffer
  quadBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  );

  glowProgram = buildProgram(vertSrc, glowFragSrc);
  blurProgram = buildProgram(vertSrc, blurFragSrc);
  compositeProgram = buildProgram(vertSrc, compositeFragSrc);

  gl.bindAttribLocation(glowProgram, 0, "a_position");
  gl.bindAttribLocation(blurProgram, 0, "a_position");
  gl.bindAttribLocation(compositeProgram, 0, "a_position");

  // Cache glow uniforms
  gl.useProgram(glowProgram);
  const glowNames = [
    "u_resolution",
    "u_time",
    "u_amount",
    "u_padding",
    "u_pulse",
    "u_pulseCenter",
    "u_coverAspect",
    "u_c0",
    "u_c1",
    "u_c2",
    "u_c3",
    "u_blueNoiseTexture",
    "u_blueNoiseCoordOffset",
    "u_rotSpeed",
    "u_alphaMul",
    "u_squircle",
    "u_debugBlob",
    "u_debugMask",
    "u_gradientMode",
    "u_colorCount",
    "u_colors",
    "u_stops",
    "u_positions",
    "u_influences",
    "u_lastColor",
    "u_lastStop",
  ];
  for (const n of glowNames)
    glowLocs[n] = gl.getUniformLocation(glowProgram, n);

  // Cache blur uniforms
  gl.useProgram(blurProgram);
  blurLocs.u_texture = gl.getUniformLocation(blurProgram, "u_texture");
  blurLocs.u_direction = gl.getUniformLocation(blurProgram, "u_direction");

  // Cache composite uniforms
  gl.useProgram(compositeProgram);
  compositeLocs.u_glowTexture = gl.getUniformLocation(
    compositeProgram,
    "u_glowTexture"
  );
  compositeLocs.u_bloomTexture = gl.getUniformLocation(
    compositeProgram,
    "u_bloomTexture"
  );
  compositeLocs.u_bloomStrength = gl.getUniformLocation(
    compositeProgram,
    "u_bloomStrength"
  );
  compositeLocs.u_debugBloom = gl.getUniformLocation(
    compositeProgram,
    "u_debugBloom"
  );
  compositeLocs.u_debugBlob = gl.getUniformLocation(
    compositeProgram,
    "u_debugBlob"
  );
  compositeLocs.u_debugMask = gl.getUniformLocation(
    compositeProgram,
    "u_debugMask"
  );

  gl.disable(gl.BLEND);

  return true;
}

function getDPR() {
  return 1;
}

function rebuildFBOs() {
  const dpr = getDPR();
  canvasW = Math.floor(elementW * dpr);
  canvasH = Math.floor(elementH * dpr);

  // Bloom at quarter resolution for massive performance and buttery smooth blending
  bloomW = Math.max(1, Math.floor(canvasW / 4));
  bloomH = Math.max(1, Math.floor(canvasH / 4));

  destroyFBO(glowFBO);
  destroyFBO(bloomFBOs[0]);
  destroyFBO(bloomFBOs[1]);

  glowFBO = createFBO(canvasW, canvasH);
  bloomFBOs[0] = createFBO(bloomW, bloomH);
  bloomFBOs[1] = createFBO(bloomW, bloomH);
}

function resize() {
  if (!canvasRef.value) return;
  const dpr = getDPR();
  const el = canvasRef.value;
  elementW = el.clientWidth;
  elementH = el.clientHeight;
  el.width = elementW * dpr;
  el.height = elementH * dpr;
  if (gl) rebuildFBOs();
}

// Pulse state
let pulse = 1.0;
let pulseCenter = [1.001, 0.5];
let lastFrameTime = 0;

function triggerPulse(x = 1.001, y = 0.5) {
  pulse = 0;
  pulseCenter = [x, y];
}

function handlePulseEvent(e) {
  const detail = e.detail || {};
  triggerPulse(detail.x ?? 1.001, detail.y ?? 0.5);
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

let hasCleared = false;

function frame(now) {
  animId = requestAnimationFrame(frame);
  if (!gl || !glowProgram) return;

  const easedAmount = activeProgress.value;

  // Early return: if the glow overlay is completely hidden and there is no active pulse,
  // we do not need to execute any WebGL draw/blur passes.
  if (easedAmount === 0 && pulse >= 1.0) {
    if (!hasCleared) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvasW, canvasH);
      gl.clearColor(0, 0, 0, 0); // Transparent clear
      gl.clear(gl.COLOR_BUFFER_BIT);
      hasCleared = true;
    }
    lastFrameTime = now;
    return;
  }
  hasCleared = false;

  const elapsed = (now - startTime) / 1000;
  const deltaTime = lastFrameTime ? (now - lastFrameTime) / 1000 : 0.016;
  lastFrameTime = now;

  // Calculate speed multiplier based on scroll velocity (Lenis values)
  // Let's cap the boost to keep it looking smooth and natural (e.g. max 4x speed)
  const scrollBoost = Math.min(scrollVelocity.value * 0.004, 3.0);
  const speedMultiplier = 1.0 + scrollBoost;

  customElapsed += deltaTime * speedMultiplier;

  // Use cached dimensions to prevent forced layout reflows!
  const w = elementW;
  const h = elementH;

  // Live-sync colors from debug panel
  syncColors();

  // Map padding (edge thickness) directly to scroll progress.
  // On mobile/tablet, cap the radius so the glow rim doesn't bite too far
  // into the narrow viewport — at most 4% of the shorter screen dimension.
  const isMobile = window.innerWidth < 1024;
  const effectiveRadius = isMobile
    ? Math.min(ctrl.mainRadius, Math.min(w, h) * 0.04)
    : ctrl.mainRadius;
  const padding = effectiveRadius * easedAmount;

  // Pulse: advances over time, resets on activation (see above)
  pulse += deltaTime * ctrl.mainPulseSpeed;
  if (pulse > 1.0) pulse = 1.0;

  setCustomState("pulse", pulse);

  const aspect =
    (Math.min(h / w, 1) / Math.sqrt(w * w + h * h)) * Math.max(w, h);

  // ════════════════════════════════════════════════
  // PASS 1-3: Main glow (toggle via ctrl.mainShow)
  // ════════════════════════════════════════════════
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvasW, canvasH);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  if (ctrl.mainShow) {
    // Pass 1: Glow → FBO
    gl.bindFramebuffer(gl.FRAMEBUFFER, glowFBO.fb);
    gl.viewport(0, 0, canvasW, canvasH);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(glowProgram);

    gl.uniform2f(glowLocs.u_resolution, w, h);
    gl.uniform1f(glowLocs.u_time, customElapsed);
    gl.uniform1f(glowLocs.u_amount, easedAmount);
    gl.uniform1f(glowLocs.u_padding, padding);
    gl.uniform1f(glowLocs.u_pulse, pulse);
    gl.uniform1f(glowLocs.u_rotSpeed, ctrl.mainRotSpeed);
    gl.uniform1f(glowLocs.u_alphaMul, ctrl.mainAlpha);
    gl.uniform1f(glowLocs.u_squircle, ctrl.mainSquircle);
    gl.uniform1f(glowLocs.u_debugBlob, ctrl.mainDebugBlob ? 1.0 : 0.0);
    gl.uniform1f(glowLocs.u_debugMask, ctrl.mainDebugMask ? 1.0 : 0.0);

    gl.uniform2f(glowLocs.u_pulseCenter, pulseCenter[0], pulseCenter[1]);
    gl.uniform2f(glowLocs.u_coverAspect, (w / h) * aspect, aspect);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, blueNoiseTexture);
    gl.uniform1i(glowLocs.u_blueNoiseTexture, 0);
    gl.uniform2f(glowLocs.u_blueNoiseCoordOffset, Math.random(), Math.random());

    drawQuad();

    // Pass 2: Blur
    gl.useProgram(blurProgram);
    gl.viewport(0, 0, bloomW, bloomH);

    const blurPasses = isMobile ? 2 : ctrl.mainBlurPasses;

    for (let pass = 0; pass < blurPasses; pass++) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, bloomFBOs[0].fb);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(
        gl.TEXTURE_2D,
        pass === 0 ? glowFBO.tex : bloomFBOs[1].tex
      );
      gl.uniform1i(blurLocs.u_texture, 0);
      gl.uniform2f(blurLocs.u_direction, ctrl.mainBlurSpread / bloomW, 0);
      drawQuad();

      gl.bindFramebuffer(gl.FRAMEBUFFER, bloomFBOs[1].fb);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, bloomFBOs[0].tex);
      gl.uniform1i(blurLocs.u_texture, 0);
      gl.uniform2f(blurLocs.u_direction, 0, ctrl.mainBlurSpread / bloomH);
      drawQuad();
    }

    // Pass 3: Composite → screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvasW, canvasH);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(compositeProgram);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, glowFBO.tex);
    gl.uniform1i(compositeLocs.u_glowTexture, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, bloomFBOs[1].tex);
    gl.uniform1i(compositeLocs.u_bloomTexture, 1);
    const velocityBloomBoost = Math.min(scrollVelocity.value * 0.02, 3.0);
    gl.uniform1f(
      compositeLocs.u_bloomStrength,
      ctrl.mainBloomStrength + velocityBloomBoost
    );
    gl.uniform1f(compositeLocs.u_debugBloom, ctrl.mainDebugBloom ? 1.0 : 0.0);
    gl.uniform1f(compositeLocs.u_debugBlob, ctrl.mainDebugBlob ? 1.0 : 0.0);
    gl.uniform1f(compositeLocs.u_debugMask, ctrl.mainDebugMask ? 1.0 : 0.0);

    drawQuad();
  }

  // ════════════════════════════════════════════════
  // DOM: Instruction icon bobbing (figure-eight + rotation)
  // ════════════════════════════════════════════════
  if (iconRef.value) {
    const N = elapsed * 3;
    const tx = Math.sin(N) * 50;
    const ty = Math.cos(N * 2 + Math.PI * 0.5) * 5;
    const rot = Math.cos(N) * -6;
    iconRef.value.style.transform = `translate3d(${tx}%, ${ty}%, 0) rotate(${rot}deg)`;
  }
}

onMounted(() => {
  if (typeof window !== "undefined") {
    if (!canvasRef.value) return;
    resize();

    const initFn = () => {
      if (initGL(canvasRef.value)) {
        rebuildFBOs();
        startTime = performance.now();
        lastFrameTime = 0;
        pulse = 1.0;
        animId = requestAnimationFrame(frame);

        // Delay fade-in slightly
        setTimeout(() => {
          isVisible.value = true;
        }, 50);
      }
    };

    if (window.requestIdleCallback) {
      setTimeout(initFn, 100);
    } else {
      setTimeout(initFn, 500);
    }

    window.addEventListener("resize", resize);
    window.addEventListener("glowing-edge-trigger-pulse", handlePulseEvent);
    window.addEventListener("glowing-edge-show", handleShowEvent);
    window.addEventListener("glowing-edge-hide", handleHideEvent);
    window.addEventListener("glowing-edge-progress", handleProgressEvent);
  }
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    if (animId) cancelAnimationFrame(animId);
    window.removeEventListener("resize", resize);
    window.removeEventListener("glowing-edge-trigger-pulse", handlePulseEvent);
    window.removeEventListener("glowing-edge-show", handleShowEvent);
    window.removeEventListener("glowing-edge-hide", handleHideEvent);
    window.removeEventListener("glowing-edge-progress", handleProgressEvent);
    if (gl) {
      destroyFBO(glowFBO);
      destroyFBO(bloomFBOs[0]);
      destroyFBO(bloomFBOs[1]);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      gl = null;
    }
  }
});
</script>

<style scoped>
.glow-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  pointer-events: none;
  opacity: 0.55;
  mix-blend-mode: screen;
}

.glow-wrapper.is-absolute {
  position: absolute;
  z-index: 1;
}

.glow-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* ── Debug Controller Panel ── */
.debug-panel {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 9999;
  pointer-events: auto;
}
.debug-panel.collapsed {
  bottom: 16px;
  right: 16px;
}
.debug-toggle {
  position: absolute;
  top: -8px;
  right: 0;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  z-index: 1;
  backdrop-filter: blur(8px);
}
.debug-content {
  background: rgba(10, 10, 14, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px 14px;
  width: min(360px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  color: #ccc;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 11px;
}
.debug-content h3 {
  margin: 0 0 8px;
  font-size: 13px;
  color: #fff;
  letter-spacing: 0.5px;
}
.debug-content fieldset {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 8px;
  margin: 0 0 8px;
}
.debug-content legend {
  font-size: 11px;
  color: #aaa;
  padding: 0 4px;
}
.debug-content legend label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
.debug-content > fieldset > label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0;
  font-size: 10px;
  color: #999;
  flex-wrap: wrap;
}
.debug-content label span {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
  color: #6ef;
  min-width: 36px;
  text-align: right;
}
.debug-content input[type="range"] {
  flex: 1;
  min-width: 90px;
  height: 3px;
  accent-color: #6ef;
  cursor: pointer;
}
.debug-content input[type="checkbox"] {
  accent-color: #6ef;
  cursor: pointer;
}
.color-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 6px 0 2px;
}
.color-label {
  font-size: 10px;
  color: #999;
  min-width: 36px;
}
.color-row input[type="color"] {
  width: 28px;
  height: 22px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  padding: 0;
  cursor: pointer;
  background: none;
}
.gradient-section {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.gradient-section select {
  width: 100%;
  margin-top: 5px;
  padding: 6px;
  color: #fff;
  background: #17171d;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 5px;
}
.color-item {
  display: grid;
  grid-template-columns: 32px 1fr 24px;
  gap: 6px;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.color-item > input[type="color"] {
  width: 30px;
  height: 25px;
  padding: 0;
  border: 0;
  background: transparent;
}
.color-controls input[type="range"] {
  width: 100%;
}
.mesh-controls label {
  display: grid;
  grid-template-columns: 18px 1fr;
  align-items: center;
  margin: 2px 0;
}
.color-item > button,
.add-color-btn {
  color: #ddd;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 5px;
  cursor: pointer;
}
.color-item > button {
  width: 24px;
  height: 24px;
}
.add-color-btn {
  width: 100%;
  margin-top: 8px;
  padding: 6px;
}
</style>
