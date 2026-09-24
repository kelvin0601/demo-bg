<template>
  <div>
    <div
      class="tres-canvas-container transition-opacity duration-[1500ms] ease-out"
      :class="isVisible ? 'opacity-100' : 'opacity-0'"
    >
      <TresCanvas
        v-if="isReady"
        clear-color="#050505"
        :window-size="true"
        :dpr="dprValue"
        alpha
      >
        <TresOrthographicCamera
          :args="[-1, 1, 1, -1, 0.1, 10]"
          :position="[0, 0, 1]"
        />
        <TresMesh>
          <TresPlaneGeometry :args="[2, 2]" />
          <TresShaderMaterial
            ref="shaderMaterialRef"
            :vertex-shader="vertexShader"
            :fragment-shader="fragmentShader"
            :uniforms="uniforms"
            :depth-write="false"
            :depth-test="false"
          />
        </TresMesh>
      </TresCanvas>
    </div>

    <!-- Debug Controller Panel -->
    <div class="debug-panel" :class="{ collapsed: !panelOpen }">
      <button class="debug-toggle" @click="panelOpen = !panelOpen">
        {{ panelOpen ? "✕" : "🎛" }}
      </button>
      <div v-show="panelOpen" class="debug-content">
        <h3>Background Gradient</h3>
        <fieldset>
          <legend>Scroll State</legend>
          <div
            style="
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            "
          >
            <span style="color: #aaa; font-size: 11px">Velocity</span>
            <span
              style="font-family: monospace; color: #fff; font-size: 11px"
              >{{ scrollVelocity.toFixed(4) }}</span
            >
          </div>
        </fieldset>
        <fieldset>
          <legend>Settings</legend>
          <label
            >Blend Amount <span>{{ ctrl.blendAmount.toFixed(2) }}</span>
            <input
              type="range"
              v-model.number="ctrl.blendAmount"
              min="0"
              max="1"
              step="0.01"
            />
          </label>
          <label
            >Mask Softness (Fluid)
            <span>{{ ctrl.maskSoftness.toFixed(2) }}</span>
            <input
              type="range"
              v-model.number="ctrl.maskSoftness"
              min="0"
              max="2"
              step="0.01"
            />
          </label>
          <label
            >Cold Edge Bleed (Teal)
            <span>{{ ctrl.coldEdgeBleed.toFixed(2) }}</span>
            <input
              type="range"
              v-model.number="ctrl.coldEdgeBleed"
              min="0"
              max="3"
              step="0.01"
            />
          </label>
          <label
            >Warm Edge Bleed (Red)
            <span>{{ ctrl.warmEdgeBleed.toFixed(2) }}</span>
            <input
              type="range"
              v-model.number="ctrl.warmEdgeBleed"
              min="0"
              max="3"
              step="0.01"
            />
          </label>
          <label
            >Internal Blend (Mid/Core)
            <span>{{ ctrl.internalBlend.toFixed(2) }}</span>
            <input
              type="range"
              v-model.number="ctrl.internalBlend"
              min="0.01"
              max="3"
              step="0.01"
            />
          </label>
          <label
            >Hotspot Blend (Center)
            <span>{{ ctrl.hotspotBlend.toFixed(2) }}</span>
            <input
              type="range"
              v-model.number="ctrl.hotspotBlend"
              min="0.01"
              max="3"
              step="0.01"
            />
          </label>
          <label
            >Blend Curve (Easing) <span>{{ ctrl.colorCurve.toFixed(2) }}</span>
            <input
              type="range"
              v-model.number="ctrl.colorCurve"
              min="0.1"
              max="5"
              step="0.01"
            />
          </label>
          <label
            >Seed <span>{{ ctrl.seed }}</span>
            <input
              type="range"
              v-model.number="ctrl.seed"
              min="0"
              max="100"
              step="1"
            />
          </label>
          <label
            >Wave Amplitude <span>{{ ctrl.waveAmplitude.toFixed(2) }}</span>
            <input
              type="range"
              v-model.number="ctrl.waveAmplitude"
              min="0"
              max="20"
              step="0.01"
            />
          </label>
          <label
            >Wave Angle <span>{{ ctrl.waveAngle.toFixed(0) }}</span>
            <input
              type="range"
              v-model.number="ctrl.waveAngle"
              min="-180"
              max="180"
              step="1"
            />
          </label>
          <label
            >Wave Freq X <span>{{ ctrl.waveFreqX.toFixed(2) }}</span>
            <input
              type="range"
              v-model.number="ctrl.waveFreqX"
              min="0.1"
              max="20"
              step="0.1"
            />
          </label>
          <label
            >Wave Freq Y <span>{{ ctrl.waveFreqY.toFixed(2) }}</span>
            <input
              type="range"
              v-model.number="ctrl.waveFreqY"
              min="0.1"
              max="20"
              step="0.1"
            />
          </label>
          <label
            >Wave Speed <span>{{ ctrl.waveSpeed.toFixed(2) }}</span>
            <input
              type="range"
              v-model.number="ctrl.waveSpeed"
              min="0"
              max="20"
              step="0.01"
            />
          </label>

          <label
            >Scenario
            <select v-model="ctrl.scenario">
              <option value="default">Default (70% Black)</option>
              <option value="dark">Dark</option>
              <option value="warm">Warm (60% Orange)</option>
              <option value="split">Split (20/40/40)</option>
            </select>
          </label>

          <fieldset class="group-fieldset">
            <legend>Cold Group</legend>
            <div class="color-row">
              <span class="color-label"
                >Teal <span>{{ ctrl.colorWeights[0].toFixed(2) }}</span></span
              >
              <input type="color" v-model="ctrl.colors[0]" />
              <input
                type="range"
                v-model.number="ctrl.colorWeights[0]"
                min="0"
                max="2"
                step="0.01"
                title="Weight"
              />
            </div>
          </fieldset>

          <fieldset class="group-fieldset">
            <legend>Warm Group</legend>
            <label
              >Heaviness <span>{{ ctrl.colorWeights[1].toFixed(2) }}</span>
              <input
                type="range"
                v-model.number="ctrl.colorWeights[1]"
                min="0"
                max="2"
                step="0.01"
              />
            </label>
            <div class="color-row">
              <span class="color-label">Outer (Red)</span>
              <input type="color" v-model="ctrl.colors[1]" />
            </div>
            <div class="color-row">
              <span class="color-label">Middle (Ylw)</span>
              <input type="color" v-model="ctrl.colors[2]" />
            </div>
            <div class="color-row">
              <span class="color-label">Core (Org)</span>
              <input type="color" v-model="ctrl.colors[3]" />
            </div>
          </fieldset>
        </fieldset>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * WebGLBackground
 *
 * A responsive, full-screen WebGL shader background implemented with TresJS.
 * Features an anamorphic film light-leak effect with asymmetric edges, complex
 * wave warping driven by 2D noise, and multi-color blending (Teal vs Warm tones).
 * Includes an interactive debug panel for real-time uniform tuning.
 */
import {
  shallowRef,
  ref,
  reactive,
  watch,
  computed,
  onMounted,
  onUnmounted,
} from "vue";
import { TresCanvas } from "@tresjs/core";
import { gsap } from "gsap";
import { useAnimationStore } from "../composables/useAnimationStore.js";
import { Vector3 } from "three";

const { scrollVelocity, customStates } = useAnimationStore();

const isReady = ref(false);
const isVisible = ref(false);

const dprValue = computed(() => {
  if (typeof window === "undefined") return 1;
  if (window.innerWidth < 768) return 0.15;
  return window.innerWidth < 1024 ? 0.25 : 1;
});

const shaderMaterialRef = shallowRef(null);
// Standalone playground: expose the complete controller immediately.
const panelOpen = ref(true);

const scenarios = {
  default: {
    colors: ["#3bffbd", "#8a0000", "#ffd400", "#ff3300"], // Matched from screenshot swatches
    colorWeights: [0.2, 0.34], // Teal Weight, Warm Weight
  },
  dark: {
    colors: ["#37ffbc", "#940a03", "#dfa006", "#ff3d00"],
    colorWeights: [0.2, 0.2],
  },
  warm: {
    colors: ["#37ffbc", "#940a03", "#dfa006", "#ff3d00"],
    colorWeights: [0.1, 1.2],
  },
  split: {
    colors: ["#37ffbc", "#940a03", "#dfa006", "#ff3d00"],
    colorWeights: [0.8, 0.8],
  },
};

/**
 * Reactive control state. These values map directly to shader uniforms
 * and are heavily manipulated by the debug panel GUI.
 */
const ctrl = reactive({
  blendAmount: 0.34,
  colors: [...scenarios.default.colors],
  colorWeights: [...scenarios.default.colorWeights],
  maskSoftness: 0.74,
  coldEdgeBleed: 0.38,
  warmEdgeBleed: 0.45,
  internalBlend: 0.23,
  hotspotBlend: 0.33,
  colorCurve: 1.28,
  seed: 42,
  waveAmplitude: 3.34,
  waveAngle: -98,
  waveFreqX: 0.2,
  waveFreqY: 4.3,
  waveSpeed: 4.57, //1.57
  scenario: "default",
});
// coldEdgeBleed: 0.38,
// warmEdgeBleed: 0.45,
// internalBlend: 0.23,
// hotspotBlend: 0.33,

// coldEdgeBleed: 0.45,
// warmEdgeBleed: 0.51,
// internalBlend: 0.56,
// hotspotBlend: 0.56,

watch(
  () => ctrl.scenario,
  (newScenario) => {
    const target = scenarios[newScenario];
    if (target) {
      ctrl.colors = [...target.colors];
      ctrl.colorWeights = [...target.colorWeights];
    }
  }
);

watch(
  ctrl,
  (newVal) => {
    if (shaderMaterialRef.value) {
      const u = shaderMaterialRef.value.uniforms;
      u.u_blendAmount.value = newVal.blendAmount;
      u.u_maskSoftness.value = newVal.maskSoftness;
      u.u_coldEdgeBleed.value = newVal.coldEdgeBleed;
      u.u_warmEdgeBleed.value = newVal.warmEdgeBleed;
      u.u_internalBlend.value = newVal.internalBlend;
      u.u_hotspotBlend.value = newVal.hotspotBlend;
      u.u_colorCurve.value = newVal.colorCurve;
      u.u_seed.value = newVal.seed;
      u.u_waveAmplitude.value = newVal.waveAmplitude;
      u.u_waveAngle.value = newVal.waveAngle;
      u.u_waveFreqX.value = newVal.waveFreqX;
      u.u_waveFreqY.value = newVal.waveFreqY;
      u.u_waveSpeed.value = newVal.waveSpeed;
      u.u_colorWeights.value = newVal.colorWeights;

      const c = newVal.colors.map((hex) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return new Vector3(r, g, b);
      });
      u.u_colors.value = c;
    }
  },
  { deep: true }
);

/**
 * Shader uniforms object passed to TresShaderMaterial.
 * Keeps track of time, resolution, and the interactive control values.
 */
const uniforms = {
  u_time: { value: 0.0 },
  u_resolution: { value: [1, 1] },
  u_pulse: { value: 0.0 },
  u_activeProgress: { value: 0.0 },
  u_blendAmount: { value: ctrl.blendAmount },
  u_colors: {
    value: ctrl.colors.map((hex) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      return new Vector3(r, g, b);
    }),
  },
  u_colorWeights: { value: [...ctrl.colorWeights] },
  u_colors_length: { value: 4 },
  u_maskSoftness: { value: ctrl.maskSoftness },
  u_coldEdgeBleed: { value: ctrl.coldEdgeBleed },
  u_warmEdgeBleed: { value: ctrl.warmEdgeBleed },
  u_internalBlend: { value: ctrl.internalBlend },
  u_hotspotBlend: { value: ctrl.hotspotBlend },
  u_colorCurve: { value: ctrl.colorCurve },
  u_seed: { value: ctrl.seed },
  u_waveAmplitude: { value: ctrl.waveAmplitude },
  u_waveAngle: { value: ctrl.waveAngle },
  u_waveFreqX: { value: ctrl.waveFreqX },
  u_waveFreqY: { value: ctrl.waveFreqY },
  u_waveSpeed: { value: ctrl.waveSpeed },
};

const handleResize = () => {
  if (typeof window !== "undefined") {
    uniforms.u_resolution.value = [window.innerWidth, window.innerHeight];
  }
};

const activeProgress = ref(0);

const handleShow = () => {
  gsap.to(activeProgress, {
    value: 1,
    duration: 1.2,
    ease: "power2.out",
  });
};

const handleHide = () => {
  gsap.to(activeProgress, {
    value: 0,
    duration: 1.2,
    ease: "power2.out",
  });
};

let elapsed = 0;
const tick = (time, deltaTime) => {
  // Add directional scroll velocity to push time forward or backward
  elapsed += deltaTime / 1000 + scrollVelocity.value * 0.0015;

  if (shaderMaterialRef.value) {
    shaderMaterialRef.value.uniforms.u_time.value = elapsed * 0.4;
    shaderMaterialRef.value.uniforms.u_pulse.value =
      customStates.value.pulse || 0.0;

    // Apply dynamic color weights from scroll triggers with smooth lerp
    if (customStates.value.colorWeights) {
      const cw = customStates.value.colorWeights;
      const tFactor = 1 - Math.exp(-deltaTime * 0.005); // Smooth caught up factor
      ctrl.colorWeights[0] += (cw[0] - ctrl.colorWeights[0]) * tFactor;
      ctrl.colorWeights[1] += (cw[1] - ctrl.colorWeights[1]) * tFactor;
    }
    // Always sync the shader uniform with the current ctrl state
    // We create a new array or pass the values to ensure the shader updates
    shaderMaterialRef.value.uniforms.u_colorWeights.value = [
      ctrl.colorWeights[0],
      ctrl.colorWeights[1],
    ];

    // Add velocity boost to mask softness (up to +0.3)
    const velocityMagnitude = Math.abs(scrollVelocity.value);
    const addedSoftness = Math.min(velocityMagnitude * 0.05, 0.3);
    shaderMaterialRef.value.uniforms.u_maskSoftness.value =
      ctrl.maskSoftness + addedSoftness;

    shaderMaterialRef.value.uniforms.u_activeProgress.value =
      activeProgress.value;
  }
};

const handleSpeedShift = (e) => {
  const targetSpeed = e.detail?.speed ?? 8.0;
  const duration = e.detail?.duration ?? 1.5;
  gsap.to(ctrl, {
    waveSpeed: targetSpeed,
    duration: duration,
    ease: "power1.out",
    overwrite: "auto",
  });
};

const handleSpeedReset = (e) => {
  const duration = e.detail?.duration ?? 2.0;
  gsap.to(ctrl, {
    waveSpeed: 4.57, // Default speed
    duration: duration,
    ease: "power1.inOut",
    overwrite: "auto",
  });
};

onMounted(() => {
  if (typeof window !== "undefined") {
    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("glowing-edge-show", handleShow);
    window.addEventListener("glowing-edge-hide", handleHide);
    window.addEventListener("bg-speed-shift", handleSpeedShift);
    window.addEventListener("bg-speed-reset", handleSpeedReset);
    gsap.ticker.add(tick);

    // Initialize WebGL slightly delayed to ensure DOM is ready
    const initFn = () => {
      isReady.value = true;
      // Slightly delay the fade-in so the canvas has time to render its first frame
      setTimeout(() => {
        isVisible.value = true;
      }, 50);
    };

    setTimeout(initFn, 100);
  }
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("glowing-edge-show", handleShow);
    window.removeEventListener("glowing-edge-hide", handleHide);
    window.removeEventListener("bg-speed-shift", handleSpeedShift);
    window.removeEventListener("bg-speed-reset", handleSpeedReset);
    gsap.ticker.remove(tick);
  }
});

// ---------------------------------------------------------------------------
// Vertex Shader — pass UVs through, standard fullscreen plane projection
// ---------------------------------------------------------------------------
const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// ---------------------------------------------------------------------------
// Fragment Shader — anamorphic film light-leak with asymmetric edges
// ---------------------------------------------------------------------------
const fragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform float u_pulse;
  uniform float u_activeProgress;

  uniform float u_blendAmount;
  uniform vec3 u_colors[4];
  uniform vec2 u_colorWeights;
  uniform int u_colors_length;
  uniform float u_maskSoftness;
  uniform float u_coldEdgeBleed;
  uniform float u_warmEdgeBleed;
  uniform float u_internalBlend;
  uniform float u_hotspotBlend;
  uniform float u_colorCurve;
  uniform float u_seed;
  uniform float u_waveAmplitude;
  uniform float u_waveAngle;
  uniform float u_waveFreqX;
  uniform float u_waveFreqY;
  uniform float u_waveSpeed;

  #define S(a,b,t) smoothstep(a,b,t)

  mat2 Rot(float a) {
      float s = sin(a), c = cos(a);
      return mat2(c, -s, s, c);
  }

  vec2 hash(vec2 p) {
      float s = u_seed;
      vec2 k1 = vec2(2127.1 + s * 13.37, 81.17 + s * 7.31);
      vec2 k2 = vec2(1269.5 + s * 11.13, 283.37 + s * 5.79);
      p = vec2(dot(p, k1), dot(p, k2));
      return fract(sin(p) * (43758.5453 + s * 1.618));
  }

  float noise(in vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      float n = mix(
          mix(dot(-1.0 + 2.0 * hash(i), f),
              dot(-1.0 + 2.0 * hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
          mix(dot(-1.0 + 2.0 * hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
              dot(-1.0 + 2.0 * hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
          u.y
      );
      return 0.5 + 0.5 * n;
  }

  vec3 getColor(int idx) {
      if (idx == 0) return u_colors[0]; // Teal
      if (idx == 1) return u_colors[1]; // Red
      if (idx == 2) return u_colors[2]; // Yellow
      if (idx == 3) return u_colors[3]; // Orange
      return vec3(0.0);
  }

  float seedF(float base) {
      return base * (1.0 + 0.5 * sin(u_seed * 3.17 + base));
  }

  vec2 warpUV(vec2 uv) {
      // Multiply time offset by frequency to maintain constant physical sliding velocity (v = w / k)
      float tx = u_time * u_waveSpeed * u_waveFreqX;
      float ty = u_time * u_waveSpeed * u_waveFreqY;

      float angleOffset = sin(u_seed * 2.73) * 30.0;
      mat2 dirRot = Rot(radians(u_waveAngle + angleOffset));
      vec2 ruv = dirRot * uv;

      float fxMod = seedF(u_waveFreqX);
      float fyMod = seedF(u_waveFreqY);

      float phaseX = fract(sin(u_seed * 7.19) * 437.58) * 6.2832;
      float phaseY = fract(cos(u_seed * 3.41) * 291.37) * 6.2832;

      // Core wave with seed-dependent harmonics, using scaled time!
      float harmonic = sin(u_seed * 1.23) * 0.5;
      float a = fyMod * ruv.y - sin(ruv.x * fxMod + ruv.y - tx + phaseX);
      a += harmonic * sin(ruv.x * fxMod * 2.0 + ruv.y * 0.5 + tx * 0.7 + phaseY);

      // Smoothstep mask (unchanged)
      a = smoothstep(
          cos(a) * u_maskSoftness,
          sin(a) * u_maskSoftness + 3.0,
          cos(a - fyMod * ruv.y) - sin(a - fxMod * ruv.x)
      );

      // Dynamic wave amplitude scale when active progress is on
      float amp = u_waveAmplitude * (1.0 + u_activeProgress * 0.35);
      a *= amp;

      uv = cos(a) * uv + sin(a) * vec2(-uv.y, uv.x);
      return uv;
  }

  void main() {
      // Magnify effect synced with pulse (zoom in then out)
      float magnify = 1.0 - sin(u_pulse * 3.14159) * 0.15;
      vec2 zoomedUv = (vUv - 0.5) * magnify + 0.5;

      // Apply 3D lens curvature based on u_activeProgress
      if (u_activeProgress > 0.0) {
          vec2 d = zoomedUv - 0.5;
          float r2 = dot(d, d);
          // 3D barrel distortion (creates a spherical 3D lens bulge)
          zoomedUv = 0.5 + d * (1.0 - u_activeProgress * 0.35 * r2);
      }

      vec2 fragCoord = zoomedUv * u_resolution;
      vec2 uv = fragCoord / u_resolution.xy;
      float ratio = u_resolution.x / u_resolution.y;
      float t = u_time * u_waveSpeed;

      vec2 tuv = uv - 0.5;

      vec2 seedShift = vec2(sin(u_seed * 4.37), cos(u_seed * 5.91)) * 100.0;
      float degree = noise(vec2(t * 0.1, tuv.x * tuv.y) + seedShift);
      tuv.y *= 1.0 / ratio;
      tuv *= Rot(radians((degree - 0.5) * 720.0 + 180.0));
      tuv.y *= ratio;

      // Seed-rotate uv2 before warping
      vec2 uv2 = (fragCoord * 2.0 - u_resolution.xy) / (u_resolution.x + u_resolution.y) * 2.0;
      float preRotAngle = fract(sin(u_seed * 5.63) * 173.29) * 6.2832;
      uv2 *= Rot(preRotAngle);
      vec2 warped = warpUV(uv2) * 0.5 + 0.5;

      vec2 blendUV = mix(tuv, warped - 0.5, u_blendAmount);

      vec3 cTeal = getColor(0);
      vec3 cRed = getColor(1);
      vec3 cYellow = getColor(2);
      vec3 cOrange = getColor(3);

      // Define spatial anchor centers in the warped UV space
      float timeAnim = u_time * 0.2;
      vec2 p1 = vec2(-0.4, 0.4) * Rot(sin(u_seed * 1.83) + timeAnim);
      vec2 p2 = vec2(0.4, -0.4) * Rot(cos(u_seed * 2.47) + timeAnim * 0.8);

      // Warm Group Masks (Scaled proportionally off a single heaviness weight)
      float warmWeight = u_colorWeights.y;
      float radiusOuter = warmWeight;        // Red (100% of weight)
      float radiusMid   = warmWeight * 0.75; // Yellow (Top 25% is Red, so Yellow stops at 75%)
      float radiusCore  = warmWeight * 0.55; // Orange (Core is 55%, leaving a 20% Yellow band)
      float radiusHot   = warmWeight * 0.30; // Hotspot (Inner 30% of the warm group)

      vec3 hotColor = vec3(1.0, 0.85, 0.1); // Intense radiant golden-yellow

      float shift = u_activeProgress * 0.018;

      // --- RED CHANNEL ---
      vec2 uvR = blendUV - vec2(shift, 0.0);
      float d1_R = length(uvR - p1);
      float d2_R = length(uvR - p2);
      float wTeal_R = S(u_colorWeights.x + u_coldEdgeBleed, u_colorWeights.x - u_coldEdgeBleed, d1_R);
      float wOuter_R = S(radiusOuter + u_warmEdgeBleed, radiusOuter - u_warmEdgeBleed, d2_R);
      float wMid_R   = S(radiusMid + u_internalBlend, radiusMid - u_internalBlend, d2_R);
      float wCore_R  = S(radiusCore + u_internalBlend, radiusCore - u_internalBlend, d2_R);
      float wHot_R   = S(radiusHot + u_hotspotBlend, 0.0, d2_R);
      wTeal_R  = pow(wTeal_R, u_colorCurve);
      wOuter_R = pow(wOuter_R, u_colorCurve);
      wMid_R   = pow(wMid_R, u_colorCurve);
      wCore_R  = pow(wCore_R, u_colorCurve);
      wHot_R   = pow(wHot_R, u_colorCurve);

      float rVal = 0.0;
      rVal = mix(rVal, cRed.r, wOuter_R);
      rVal = mix(rVal, cYellow.r, wMid_R);
      rVal = mix(rVal, cOrange.r, wCore_R);
      rVal = mix(rVal, hotColor.r, wHot_R * 0.85);
      rVal = mix(rVal, cTeal.r, wTeal_R);

      // --- GREEN CHANNEL ---
      vec2 uvG = blendUV;
      float d1_G = length(uvG - p1);
      float d2_G = length(uvG - p2);
      float wTeal_G = S(u_colorWeights.x + u_coldEdgeBleed, u_colorWeights.x - u_coldEdgeBleed, d1_G);
      float wOuter_G = S(radiusOuter + u_warmEdgeBleed, radiusOuter - u_warmEdgeBleed, d2_G);
      float wMid_G   = S(radiusMid + u_internalBlend, radiusMid - u_internalBlend, d2_G);
      float wCore_G  = S(radiusCore + u_internalBlend, radiusCore - u_internalBlend, d2_G);
      float wHot_G   = S(radiusHot + u_hotspotBlend, 0.0, d2_G);
      wTeal_G  = pow(wTeal_G, u_colorCurve);
      wOuter_G = pow(wOuter_G, u_colorCurve);
      wMid_G   = pow(wMid_G, u_colorCurve);
      wCore_G  = pow(wCore_G, u_colorCurve);
      wHot_G   = pow(wHot_G, u_colorCurve);

      float gVal = 0.0;
      gVal = mix(gVal, cRed.g, wOuter_G);
      gVal = mix(gVal, cYellow.g, wMid_G);
      gVal = mix(gVal, cOrange.g, wCore_G);
      gVal = mix(gVal, hotColor.g, wHot_G * 0.85);
      gVal = mix(gVal, cTeal.g, wTeal_G);

      // --- BLUE CHANNEL ---
      vec2 uvB = blendUV + vec2(shift, 0.0);
      float d1_B = length(uvB - p1);
      float d2_B = length(uvB - p2);
      float wTeal_B = S(u_colorWeights.x + u_coldEdgeBleed, u_colorWeights.x - u_coldEdgeBleed, d1_B);
      float wOuter_B = S(radiusOuter + u_warmEdgeBleed, radiusOuter - u_warmEdgeBleed, d2_B);
      float wMid_B   = S(radiusMid + u_internalBlend, radiusMid - u_internalBlend, d2_B);
      float wCore_B  = S(radiusCore + u_internalBlend, radiusCore - u_internalBlend, d2_B);
      float wHot_B   = S(radiusHot + u_hotspotBlend, 0.0, d2_B);
      wTeal_B  = pow(wTeal_B, u_colorCurve);
      wOuter_B = pow(wOuter_B, u_colorCurve);
      wMid_B   = pow(wMid_B, u_colorCurve);
      wCore_B  = pow(wCore_B, u_colorCurve);
      wHot_B   = pow(wHot_B, u_colorCurve);

      float bVal = 0.0;
      bVal = mix(bVal, cRed.b, wOuter_B);
      bVal = mix(bVal, cYellow.b, wMid_B);
      bVal = mix(bVal, cOrange.b, wCore_B);
      bVal = mix(bVal, hotColor.b, wHot_B * 0.85);
      bVal = mix(bVal, cTeal.b, wTeal_B);

      vec3 col = vec3(rVal, gVal, bVal);

      // Soft tone curve with active contrast boost
      col = mix(col, col * col + 0.5 * sqrt(col), 0.3 + u_activeProgress * 0.15);

      gl_FragColor = vec4(col, 1.0);
  }
`;
</script>

<style scoped>
.tres-canvas-container {
  display: block;
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1;
  background-color: #050505;
  pointer-events: none;
}

/* ── Debug Controller Panel ── */
.debug-panel {
  position: fixed;
  bottom: 16px;
  left: 16px;
  z-index: 9999;
  pointer-events: auto;
}
.debug-panel.collapsed {
  bottom: 16px;
  left: 16px;
}
.debug-toggle {
  position: absolute;
  top: -8px;
  left: 0;
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
  width: min(340px, calc(100vw - 32px));
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
.group-fieldset {
  margin-top: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.5rem;
  border-radius: 6px;
}
.group-fieldset legend {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.6);
  padding: 0 0.5rem;
}

.mobile-bg-fallback {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background-color: #050505;
  background-image: radial-gradient(
      circle at 10% 20%,
      rgba(9, 227, 227, 0.12) 0%,
      transparent 60%
    ),
    radial-gradient(
      circle at 90% 80%,
      rgba(255, 42, 95, 0.12) 0%,
      transparent 60%
    );
  pointer-events: none;
}
</style>
