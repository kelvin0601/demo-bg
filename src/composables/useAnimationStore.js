import { ref } from "vue";

// Singleton refs — shared across all components
const isAnimating = ref(false);
const activeSection = ref("");
const animationSpeed = ref(1.0);
const scrollProgress = ref(0);
const scrollVelocity = ref(0);
const customStates = ref({});

export function useAnimationStore() {
  const setAnimating = (value) => {
    isAnimating.value = value;
  };

  const setActiveSection = (section) => {
    activeSection.value = section;
  };

  const setSpeed = (speed) => {
    animationSpeed.value = speed;
  };

  const setScrollProgress = (value) => {
    scrollProgress.value = value;
  };

  const setCustomState = (key, value) => {
    customStates.value = {
      ...customStates.value,
      [key]: value,
    };
  };

  const getCustomState = (key, defaultValue) => {
    return customStates.value[key] !== undefined
      ? customStates.value[key]
      : defaultValue;
  };

  const resetStore = () => {
    isAnimating.value = false;
    activeSection.value = "";
    animationSpeed.value = 1.0;
    scrollVelocity.value = 0;
    customStates.value = {};
  };

  return {
    isAnimating,
    activeSection,
    animationSpeed,
    scrollProgress,
    scrollVelocity,
    customStates,
    setAnimating,
    setActiveSection,
    setSpeed,
    setScrollProgress,
    setCustomState,
    getCustomState,
    resetStore,
  };
}
