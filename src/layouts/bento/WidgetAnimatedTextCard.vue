<template>
  <div ref="rootRef" class="relative h-full w-full overflow-hidden" :style="cardStyle">
    <div class="absolute inset-0" :style="backgroundStyle" />
    <div v-if="bgVisible" class="absolute inset-0 overflow-hidden">
      <AuroraBits
        v-if="widget.backgroundVariant === 'aurora'"
        class="h-full w-full"
        v-bind="auroraProps"
      />
      <ColorBendsBits
        v-else-if="widget.backgroundVariant === 'color-bends'"
        class="h-full w-full"
        v-bind="colorBendsProps"
      />
      <DarkVeilBits
        v-else-if="widget.backgroundVariant === 'dark-veil'"
        class="h-full w-full"
        v-bind="darkVeilProps"
      />
      <DotGridBits
        v-else-if="widget.backgroundVariant === 'dot-grid'"
        class="h-full w-full"
        v-bind="dotGridProps"
      />
      <GrainientBits
        v-else-if="widget.backgroundVariant === 'grainient'"
        class="h-full w-full"
        v-bind="grainientProps"
      />
      <IridescenceBits
        v-else-if="widget.backgroundVariant === 'iridescence'"
        class="h-full w-full"
        v-bind="iridescenceProps"
      />
      <LightningBits
        v-else-if="widget.backgroundVariant === 'lightning'"
        class="h-full w-full"
        v-bind="lightningProps"
      />
      <LiquidEtherBits
        v-else-if="widget.backgroundVariant === 'liquid-ether'"
        class="h-full w-full"
        v-bind="liquidEtherProps"
      />
      <OrbBits
        v-else-if="widget.backgroundVariant === 'orb'"
        class="h-full w-full"
        v-bind="orbProps"
      />
      <ParticlesBits
        v-else-if="widget.backgroundVariant === 'particles'"
        class="h-full w-full"
        v-bind="particlesProps"
      />
      <PrismaticBurstBits
        v-else-if="widget.backgroundVariant === 'prismatic-burst'"
        class="h-full w-full"
        v-bind="prismaticBurstProps"
      />
      <SilkBits
        v-else-if="widget.backgroundVariant === 'silk'"
        class="h-full w-full"
        v-bind="silkProps"
      />
    </div>

    <div class="relative z-10 flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center">
      <template v-if="widget.textVariant === 'shiny-text'">
        <ShinyTextBits
          class="widget-text max-w-[24ch] text-balance text-[length:var(--vb-font-size,1.25rem)] font-extrabold leading-tight"
          :text="widget.text || 'Animated text'"
          :disabled="widget.shinyDisabled"
          :speed="widget.shinySpeed"
          :delay="widget.shinyDelay"
          :spread="widget.shinySpread"
          :direction="shinyDirection"
          :yoyo="widget.shinyYoyo"
          :pause-on-hover="widget.shinyPauseOnHover"
          :color="widget.shinyColor"
          :shine-color="widget.shinyShineColor"
          :class-name="widget.shinyClassName"
        />
      </template>

      <template v-else-if="widget.textVariant === 'gradient-text'">
        <GradientTextBits
          class="widget-text max-w-[24ch] text-balance text-[length:var(--vb-font-size,1.25rem)] font-extrabold leading-tight"
          :colors="gradientColors"
          :animation-speed="widget.gradientAnimationSpeed"
          :show-border="widget.gradientShowBorder"
          :direction="gradientDirection"
          :pause-on-hover="widget.gradientPauseOnHover"
          :yoyo="widget.gradientYoyo"
          :class-name="widget.gradientClassName"
        >{{ widget.text || "Animated text" }}</GradientTextBits>
      </template>

      <template v-else-if="widget.textVariant === 'glitch-text'">
        <GlitchTextBits
          class="widget-text max-w-[24ch] text-balance text-[length:var(--vb-font-size,1.25rem)] font-extrabold leading-tight"
          :children="widget.text || 'Animated text'"
          :speed="widget.glitchSpeed"
          :enable-shadows="widget.glitchEnableShadows"
          :enable-on-hover="widget.glitchEnableOnHover"
          :class-name="widget.glitchClassName"
        />
      </template>

      <BlurTextBits
        v-else-if="widget.textVariant === 'blur-text'"
        class="widget-text max-w-[24ch] text-balance text-[length:var(--vb-font-size,1.25rem)] font-extrabold leading-tight"
        :text="widget.text || 'Animated text'"
        :delay="widget.blurDelay"
        :animate-by="blurAnimateBy"
        :direction="blurDirection"
        :threshold="widget.blurThreshold"
        :root-margin="widget.blurRootMargin"
        :step-duration="widget.blurStepDuration"
        :animation-from="blurAnimationFrom"
        :animation-to="blurAnimationTo"
        :class-name="widget.blurClassName"
      />

      <SplitTextBits
        v-else-if="widget.textVariant === 'split-text'"
        class="widget-text max-w-[24ch] text-balance text-[length:var(--vb-font-size,1.25rem)] font-extrabold leading-tight"
        :text="widget.text || 'Animated text'"
        :delay="widget.splitDelay"
        :duration="widget.splitDuration"
        :ease="widget.splitEase"
        :split-type="splitType"
        :from="splitFrom"
        :to="splitTo"
        :threshold="widget.splitThreshold"
        :root-margin="widget.splitRootMargin"
        :tag="splitTag"
        :text-align="splitTextAlign"
        :class-name="widget.splitClassName"
      />

      <TextTypeBits
        v-else-if="widget.textVariant === 'text-type'"
        class="widget-text max-w-[24ch] text-balance text-[length:var(--vb-font-size,1.25rem)] font-extrabold leading-tight"
        :text="textTypeText"
        :as="widget.textTypeAs"
        :show-cursor="widget.textTypeShowCursor"
        :hide-cursor-while-typing="widget.textTypeHideCursorWhileTyping"
        :cursor-character="widget.textTypeCursorCharacter"
        :cursor-blink-duration="widget.textTypeCursorBlinkDuration"
        :cursor-class-name="widget.textTypeCursorClassName"
        :typing-speed="widget.textTypeTypingSpeed"
        :initial-delay="widget.textTypeInitialDelay"
        :pause-duration="widget.textTypePauseDuration"
        :deleting-speed="widget.textTypeDeletingSpeed"
        :loop="widget.textTypeLoop"
        :text-colors="textTypeColors"
        :variable-speed="textTypeVariableSpeed"
        :start-on-visible="widget.textTypeStartOnVisible"
        :reverse-mode="widget.textTypeReverseMode"
        :class-name="widget.textTypeClassName"
      />

      <RotatingTextBits
        v-else-if="widget.textVariant === 'rotating-text'"
        class="widget-text max-w-[24ch] text-balance text-[length:var(--vb-font-size,1.25rem)] font-extrabold leading-tight"
        :texts="rotatingTexts"
        :transition="rotatingTransition"
        :initial="rotatingInitial"
        :animate="rotatingAnimate"
        :exit="rotatingExit"
        :animate-presence-mode="rotatingAnimatePresenceMode"
        :animate-presence-initial="widget.rotatingAnimatePresenceInitial"
        :rotation-interval="widget.rotatingRotationInterval"
        :stagger-duration="widget.rotatingStaggerDuration"
        :stagger-from="rotatingStaggerFrom"
        :loop="widget.rotatingLoop"
        :auto="widget.rotatingAuto"
        :split-by="rotatingSplitBy"
        :main-class-name="widget.rotatingMainClassName"
        :split-level-class-name="widget.rotatingSplitLevelClassName"
        :element-level-class-name="widget.rotatingElementLevelClassName"
      />

      <VariableProximityBits
        v-else-if="widget.textVariant === 'variable-proximity'"
        class="widget-text max-w-[24ch] text-balance text-[length:var(--vb-font-size,1.25rem)] font-extrabold leading-tight"
        :label="widget.variableLabel || widget.text || 'Animated text'"
        :from-font-variation-settings="widget.variableFromFontVariationSettings"
        :to-font-variation-settings="widget.variableToFontVariationSettings"
        :radius="widget.variableRadius"
        :falloff="variableFalloff"
        :class-name="widget.variableClassName"
        :style="variableStyle"
      />

      <p
        v-else
        class="widget-text max-w-[24ch] text-balance text-[length:var(--vb-font-size,1.25rem)] font-extrabold leading-tight"
        :class="textVariantClass"
        :style="textVariantStyle"
      >
        {{ widget.text || "Animated text" }}
      </p>

      <a
        v-if="widget.buttonLabel && widget.buttonUrl"
        :href="widget.buttonUrl"
        target="_blank"
        rel="noreferrer"
        class="rounded-full border px-4 py-1.5 text-xs font-semibold backdrop-blur-sm transition"
        :style="buttonStyle"
      >
        {{ widget.buttonLabel }}
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, defineAsyncComponent, ref, watchEffect, onMounted, onUnmounted, type PropType } from "vue";
import type { WidgetItem } from "../../lib/model";

// Text components — lazy so GSAP/animation libs don't block initial parse
const ShinyTextBits = defineAsyncComponent(() => import("./widgets/vuebits/ShinyTextBits.vue"));
const GradientTextBits = defineAsyncComponent(() => import("./widgets/vuebits/GradientTextBits.vue"));
const GlitchTextBits = defineAsyncComponent(() => import("./widgets/vuebits/GlitchTextBits.vue"));
const BlurTextBits = defineAsyncComponent(() => import("./widgets/vuebits/BlurTextBits.vue"));
const SplitTextBits = defineAsyncComponent(() => import("./widgets/vuebits/SplitTextBits.vue"));
const TextTypeBits = defineAsyncComponent(() => import("./widgets/vuebits/TextTypeBits.vue"));
const RotatingTextBits = defineAsyncComponent(() => import("./widgets/vuebits/RotatingTextBits.vue"));
const VariableProximityBits = defineAsyncComponent(() => import("./widgets/vuebits/VariableProximityBits.vue"));

// Background components — lazy so THREE.js / OGL / WebGL shaders don't block initial parse
const AuroraBits = defineAsyncComponent(() => import("./widgets/vuebits/backgrounds/AuroraBits.vue"));
const ColorBendsBits = defineAsyncComponent(() => import("./widgets/vuebits/backgrounds/ColorBendsBits.vue"));
const DarkVeilBits = defineAsyncComponent(() => import("./widgets/vuebits/backgrounds/DarkVeilBits.vue"));
const DotGridBits = defineAsyncComponent(() => import("./widgets/vuebits/backgrounds/DotGridBits.vue"));
const GrainientBits = defineAsyncComponent(() => import("./widgets/vuebits/backgrounds/GrainientBits.vue"));
const IridescenceBits = defineAsyncComponent(() => import("./widgets/vuebits/backgrounds/IridescenceBits.vue"));
const LightningBits = defineAsyncComponent(() => import("./widgets/vuebits/backgrounds/LightningBits.vue"));
const LiquidEtherBits = defineAsyncComponent(() => import("./widgets/vuebits/backgrounds/LiquidEtherBits.vue"));
const OrbBits = defineAsyncComponent(() => import("./widgets/vuebits/backgrounds/OrbBits.vue"));
const ParticlesBits = defineAsyncComponent(() => import("./widgets/vuebits/backgrounds/ParticlesBits.vue"));
const PrismaticBurstBits = defineAsyncComponent(() => import("./widgets/vuebits/backgrounds/PrismaticBurstBits.vue"));
const SilkBits = defineAsyncComponent(() => import("./widgets/vuebits/backgrounds/SilkBits.vue"));

export default defineComponent({
  name: "WidgetAnimatedTextCard",
  components: {
    ShinyTextBits,
    GradientTextBits,
    GlitchTextBits,
    BlurTextBits,
    SplitTextBits,
    TextTypeBits,
    RotatingTextBits,
    VariableProximityBits,
    AuroraBits,
    ColorBendsBits,
    DarkVeilBits,
    DotGridBits,
    GrainientBits,
    IridescenceBits,
    LightningBits,
    LiquidEtherBits,
    OrbBits,
    ParticlesBits,
    PrismaticBurstBits,
    SilkBits,
  },
  props: {
    widget: { type: Object as PropType<WidgetItem>, required: true },
  },
  setup(props) {
    const rootRef = ref<HTMLElement | null>(null);
    const bgVisible = ref(true);
    let bgUnmountTimer: ReturnType<typeof setTimeout> | null = null;
    let bgObserver: IntersectionObserver | null = null;

    onMounted(() => {
      if (typeof IntersectionObserver === 'undefined') return;
      bgObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            if (bgUnmountTimer) { clearTimeout(bgUnmountTimer); bgUnmountTimer = null; }
            bgVisible.value = true;
          } else {
            bgUnmountTimer = setTimeout(() => { bgVisible.value = false; }, 2000);
          }
        },
        { threshold: 0, rootMargin: '100px' }
      );
      if (rootRef.value) bgObserver.observe(rootRef.value);
    });

    onUnmounted(() => {
      bgObserver?.disconnect();
      if (bgUnmountTimer) clearTimeout(bgUnmountTimer);
    });

    const parseJson = <T extends Record<string, unknown>>(raw: string, fallback: T): T => {
      try {
        const parsed = JSON.parse(raw || "");
        return parsed && typeof parsed === "object" ? parsed as T : fallback;
      } catch {
        return fallback;
      }
    };

    const parseCsv = (raw: string): string[] =>
      (raw || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const parseRgbCsv = (raw: string, fallback: [number, number, number]): [number, number, number] => {
      const vals = (raw || "")
        .split(",")
        .map((s) => Number(s.trim()));
      if (vals.length < 3 || vals.some((v) => !Number.isFinite(v))) return fallback;
      return [vals[0], vals[1], vals[2]];
    };

    const parseHexRgb = (raw: string, fallback: [number, number, number]): [number, number, number] => {
      let hex = (raw || "").trim();
      if (!hex) return fallback;
      if (hex.startsWith("#")) hex = hex.slice(1);
      if (hex.length === 3) {
        hex = `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
      }
      if (!/^[0-9a-fA-F]{6}$/.test(hex)) return fallback;
      const value = parseInt(hex, 16);
      return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
    };

    const buildColorList = (pickerColors: string[], csvRaw: string): string[] => {
      const fromPickers = pickerColors.map((c) => (c || "").trim()).filter(Boolean);
      if (fromPickers.length > 0) return fromPickers;
      return parseCsv(csvRaw);
    };

    const parseStyleJson = (raw: string): Record<string, string | number> => {
      const parsed = parseJson<Record<string, unknown>>(raw, {});
      return Object.fromEntries(
        Object.entries(parsed).filter(([, v]) => typeof v === "string" || typeof v === "number"),
      ) as Record<string, string | number>;
    };

    const asEnum = <T extends string>(value: string, allowed: readonly T[], fallback: T): T =>
      allowed.includes(value as T) ? (value as T) : fallback;

    const shinyDirection = computed(() =>
      asEnum(props.widget.shinyDirection, ["left", "right"] as const, "left"),
    );
    const gradientDirection = computed(() =>
      asEnum(props.widget.gradientDirection, ["horizontal", "vertical", "diagonal"] as const, "horizontal"),
    );
    const blurAnimateBy = computed(() =>
      asEnum(props.widget.blurAnimateBy, ["words", "letters"] as const, "words"),
    );
    const blurDirection = computed(() =>
      asEnum(props.widget.blurDirection, ["top", "bottom"] as const, "top"),
    );
    const splitType = computed(() =>
      asEnum(props.widget.splitType, ["chars", "words", "lines"] as const, "chars"),
    );
    const splitTag = computed(() =>
      asEnum(props.widget.splitTag, ["p", "span", "h1", "h2", "h3", "h4", "h5", "h6"] as const, "p"),
    );
    const splitTextAlign = computed(() =>
      asEnum(props.widget.splitTextAlign, ["left", "center", "right"] as const, "center"),
    );
    const rotatingAnimatePresenceMode = computed(() =>
      asEnum(props.widget.rotatingAnimatePresenceMode, ["wait", "sync"] as const, "wait"),
    );
    const rotatingStaggerFrom = computed(() => {
      const raw = props.widget.rotatingStaggerFrom;
      const fromEnum = asEnum(raw, ["first", "last", "center", "random"] as const, "first");
      const asNumber = Number(raw);
      return Number.isFinite(asNumber) ? asNumber : fromEnum;
    });
    const rotatingSplitBy = computed(() =>
      asEnum(props.widget.rotatingSplitBy, ["characters", "words", "lines"] as const, "characters"),
    );
    const variableFalloff = computed(() =>
      asEnum(props.widget.variableFalloff, ["linear", "exponential", "gaussian"] as const, "linear"),
    );

    const splitFrom = computed(() => parseJson(props.widget.splitFromJson, { opacity: 0, y: 40 }));
    const splitTo = computed(() => parseJson(props.widget.splitToJson, { opacity: 1, y: 0 }));
    const blurAnimationFrom = computed(() => parseJson(props.widget.blurAnimationFromJson, { filter: "blur(10px)", opacity: 0, y: -50 }));
    const blurAnimationTo = computed(() => {
      const fallback = [
        { filter: "blur(5px)", opacity: 0.5, y: 5 },
        { filter: "blur(0px)", opacity: 1, y: 0 },
      ];
      try {
        const parsed = JSON.parse(props.widget.blurAnimationToJson || "");
        return Array.isArray(parsed) ? parsed : fallback;
      } catch {
        return fallback;
      }
    });

    const rotatingTransition = computed<any>(() => parseJson(props.widget.rotatingTransitionJson, { type: "spring", damping: 25, stiffness: 300 }));
    const rotatingInitial = computed(() => parseJson(props.widget.rotatingInitialJson, { y: "100%", opacity: 0 }));
    const rotatingAnimate = computed(() => parseJson(props.widget.rotatingAnimateJson, { y: 0, opacity: 1 }));
    const rotatingExit = computed(() => parseJson(props.widget.rotatingExitJson, { y: "-120%", opacity: 0 }));

    const gradientColors = computed(() =>
      buildColorList(
        [props.widget.gradientColor1, props.widget.gradientColor2, props.widget.gradientColor3],
        props.widget.gradientColors,
      ),
    );

    const textTypeText = computed(() => {
      const lines = (props.widget.textTypeTextList || "").split("\n").map((s) => s.trim()).filter(Boolean);
      if (lines.length > 1) return lines;
      if (lines.length === 1) return lines[0];
      return props.widget.text || "Animated text";
    });

    const textTypeColors = computed(() =>
      buildColorList(
        [props.widget.textTypeColor1, props.widget.textTypeColor2, props.widget.textTypeColor3],
        props.widget.textTypeTextColors,
      ),
    );

    const auroraProps = computed(() => ({
      colorStops: buildColorList(
        [props.widget.auroraColorStop1, props.widget.auroraColorStop2, props.widget.auroraColorStop3],
        props.widget.auroraColorStops,
      ),
      amplitude: props.widget.auroraAmplitude,
      blend: props.widget.auroraBlend,
      time: props.widget.auroraTime || undefined,
      speed: props.widget.auroraSpeed,
      intensity: props.widget.auroraIntensity,
      className: props.widget.auroraClassName,
      style: parseStyleJson(props.widget.auroraStyleJson),
    }));

    const colorBendsProps = computed(() => ({
      rotation: props.widget.colorBendsRotation,
      speed: props.widget.colorBendsSpeed,
      colors: buildColorList(
        [props.widget.colorBendsColor1, props.widget.colorBendsColor2, props.widget.colorBendsColor3],
        props.widget.colorBendsColors,
      ),
      transparent: props.widget.colorBendsTransparent,
      autoRotate: props.widget.colorBendsAutoRotate,
      scale: props.widget.colorBendsScale,
      frequency: props.widget.colorBendsFrequency,
      warpStrength: props.widget.colorBendsWarpStrength,
      mouseInfluence: props.widget.colorBendsMouseInfluence,
      parallax: props.widget.colorBendsParallax,
      noise: props.widget.colorBendsNoise,
      className: props.widget.colorBendsClassName,
      style: parseStyleJson(props.widget.colorBendsStyleJson),
    }));

    const darkVeilProps = computed(() => ({
      hueShift: props.widget.darkVeilHueShift,
      noiseIntensity: props.widget.darkVeilNoiseIntensity,
      scanlineIntensity: props.widget.darkVeilScanlineIntensity,
      speed: props.widget.darkVeilSpeed,
      scanlineFrequency: props.widget.darkVeilScanlineFrequency,
      warpAmount: props.widget.darkVeilWarpAmount,
      resolutionScale: props.widget.darkVeilResolutionScale,
    }));

    const dotGridProps = computed(() => ({
      dotSize: props.widget.dotGridDotSize,
      gap: props.widget.dotGridGap,
      baseColor: props.widget.dotGridBaseColor,
      activeColor: props.widget.dotGridActiveColor,
      proximity: props.widget.dotGridProximity,
      speedTrigger: props.widget.dotGridSpeedTrigger,
      shockRadius: props.widget.dotGridShockRadius,
      shockStrength: props.widget.dotGridShockStrength,
      maxSpeed: props.widget.dotGridMaxSpeed,
      resistance: props.widget.dotGridResistance,
      returnDuration: props.widget.dotGridReturnDuration,
      className: props.widget.dotGridClassName,
      style: parseStyleJson(props.widget.dotGridStyleJson),
    }));

    const grainientProps = computed(() => ({
      timeSpeed: props.widget.grainientTimeSpeed,
      colorBalance: props.widget.grainientColorBalance,
      warpStrength: props.widget.grainientWarpStrength,
      warpFrequency: props.widget.grainientWarpFrequency,
      warpSpeed: props.widget.grainientWarpSpeed,
      warpAmplitude: props.widget.grainientWarpAmplitude,
      blendAngle: props.widget.grainientBlendAngle,
      blendSoftness: props.widget.grainientBlendSoftness,
      rotationAmount: props.widget.grainientRotationAmount,
      noiseScale: props.widget.grainientNoiseScale,
      grainAmount: props.widget.grainientGrainAmount,
      grainScale: props.widget.grainientGrainScale,
      grainAnimated: props.widget.grainientGrainAnimated,
      contrast: props.widget.grainientContrast,
      gamma: props.widget.grainientGamma,
      saturation: props.widget.grainientSaturation,
      centerX: props.widget.grainientCenterX,
      centerY: props.widget.grainientCenterY,
      zoom: props.widget.grainientZoom,
      color1: props.widget.grainientColor1,
      color2: props.widget.grainientColor2,
      color3: props.widget.grainientColor3,
      className: props.widget.grainientClassName,
    }));

    const iridescenceProps = computed(() => ({
      color: parseHexRgb(props.widget.iridescenceBaseColor || '#ffffff', [1, 1, 1]),
      speed: props.widget.iridescenceSpeed,
      amplitude: props.widget.iridescenceAmplitude,
      mouseReact: props.widget.iridescenceMouseReact,
    }));

    const lightningProps = computed(() => ({
      hue: props.widget.lightningHue,
      xOffset: props.widget.lightningXOffset,
      speed: props.widget.lightningSpeed,
      intensity: props.widget.lightningIntensity,
      size: props.widget.lightningSize,
    }));

    const liquidEtherProps = computed(() => ({
      mouseForce: props.widget.liquidEtherMouseForce,
      cursorSize: props.widget.liquidEtherCursorSize,
      isViscous: props.widget.liquidEtherIsViscous,
      viscous: props.widget.liquidEtherViscous,
      iterationsViscous: props.widget.liquidEtherIterationsViscous,
      iterationsPoisson: props.widget.liquidEtherIterationsPoisson,
      dt: props.widget.liquidEtherDt,
      BFECC: props.widget.liquidEtherBFECC,
      resolution: props.widget.liquidEtherResolution,
      isBounce: props.widget.liquidEtherIsBounce,
      colors: buildColorList(
        [props.widget.liquidEtherColor1, props.widget.liquidEtherColor2, props.widget.liquidEtherColor3],
        props.widget.liquidEtherColors,
      ),
      style: parseStyleJson(props.widget.liquidEtherStyleJson),
      className: props.widget.liquidEtherClassName,
      autoDemo: props.widget.liquidEtherAutoDemo,
      autoSpeed: props.widget.liquidEtherAutoSpeed,
      autoIntensity: props.widget.liquidEtherAutoIntensity,
      takeoverDuration: props.widget.liquidEtherTakeoverDuration,
      autoResumeDelay: props.widget.liquidEtherAutoResumeDelay,
      autoRampDuration: props.widget.liquidEtherAutoRampDuration,
    }));

    const orbProps = computed(() => ({
      hue: props.widget.orbHue,
      hoverIntensity: props.widget.orbHoverIntensity,
      rotateOnHover: props.widget.orbRotateOnHover,
      forceHoverState: props.widget.orbForceHoverState,
    }));

    const particlesProps = computed(() => ({
      particleCount: props.widget.particlesParticleCount,
      particleSpread: props.widget.particlesParticleSpread,
      speed: props.widget.particlesSpeed,
      particleColors: buildColorList(
        [props.widget.particlesColor1, props.widget.particlesColor2, props.widget.particlesColor3],
        props.widget.particlesParticleColors,
      ),
      moveParticlesOnHover: props.widget.particlesMoveParticlesOnHover,
      particleHoverFactor: props.widget.particlesParticleHoverFactor,
      alphaParticles: props.widget.particlesAlphaParticles,
      particleBaseSize: props.widget.particlesParticleBaseSize,
      sizeRandomness: props.widget.particlesSizeRandomness,
      cameraDistance: props.widget.particlesCameraDistance,
      disableRotation: props.widget.particlesDisableRotation,
      className: props.widget.particlesClassName,
    }));

    const prismaticBurstProps = computed(() => ({
      intensity: props.widget.prismaticBurstIntensity,
      speed: props.widget.prismaticBurstSpeed,
      animationType: asEnum(props.widget.prismaticBurstAnimationType, ["rotate", "rotate3d", "hover"] as const, "rotate3d"),
      colors: buildColorList(
        [props.widget.prismaticBurstColor1, props.widget.prismaticBurstColor2, props.widget.prismaticBurstColor3],
        props.widget.prismaticBurstColors,
      ),
      distort: props.widget.prismaticBurstDistort,
      paused: props.widget.prismaticBurstPaused,
      offset: { x: props.widget.prismaticBurstOffsetX, y: props.widget.prismaticBurstOffsetY },
      hoverDampness: props.widget.prismaticBurstHoverDampness,
      rayCount: props.widget.prismaticBurstRayCount,
      mixBlendMode: asEnum(
        props.widget.prismaticBurstMixBlendMode,
        ["none", "normal", "lighten", "screen", "overlay", "soft-light", "hard-light", "color-dodge", "plus-lighter"] as const,
        "lighten",
      ),
    }));

    const silkProps = computed(() => ({
      speed: props.widget.silkSpeed,
      scale: props.widget.silkScale,
      color: props.widget.silkColor,
      noiseIntensity: props.widget.silkNoiseIntensity,
      rotation: props.widget.silkRotation,
      className: props.widget.silkClassName,
      style: parseStyleJson(props.widget.silkStyleJson),
    }));

    const textTypeVariableSpeed = computed(() =>
      props.widget.textTypeVariableSpeedEnabled
        ? { min: props.widget.textTypeVariableSpeedMin, max: props.widget.textTypeVariableSpeedMax }
        : undefined,
    );

    const rotatingTexts = computed(() => {
      const lines = (props.widget.rotatingTexts || "").split("\n").map((s) => s.trim()).filter(Boolean);
      if (lines.length > 0) return lines;
      return [props.widget.text || "Animated text"];
    });

    const variableStyle = computed(() => parseJson(props.widget.variableStyleJson, {}));

    const cardStyle = computed<Record<string, string>>(() => ({
      "--vb-font-size": `${Math.max(10, props.widget.fontSize || 20)}px`,
      "--vb-font-family": props.widget.fontFamily ? `'${props.widget.fontFamily}', sans-serif` : "inherit",
      "--vb-font-weight": props.widget.fontWeight || "",
      "--vb-letter-spacing": props.widget.letterSpacing || "",
      "--vb-text-speed": String(props.widget.textPresetSpeed || 1),
      "--vb-text-intensity": String(props.widget.textPresetIntensity || 1),
      "--vb-bg-speed": String(props.widget.backgroundPresetSpeed || 1),
      "--vb-bg-intensity": String(props.widget.backgroundPresetIntensity || 1),
      "--vb-bg-scale": String(props.widget.backgroundPresetScale || 1),
    }));

    const backgroundStyle = computed<Record<string, string>>(() => ({
      backgroundColor: props.widget.backgroundColor || "",
    }));

    const textVariantClass = computed(() => {
      const v = props.widget.textVariant || "shiny-text";
      return `txv-${v}`;
    });

    const textVariantStyle = computed<Record<string, string>>(() => {
      const color = props.widget.textColor || "#ffffff";
      const paused = props.widget.pauseOnHover ? "paused" : "running";
      return {
        "--vb-play-state": paused,
        color,
      };
    });

    const buttonStyle = computed<Record<string, string>>(() => {
      const bg = props.widget.buttonColor || "#ffffff";
      const fg = props.widget.buttonTextColor || "#0f172a";
      return {
        backgroundColor: `${bg}cc`,
        borderColor: `${bg}99`,
        color: fg,
      };
    });

    const loadGoogleFont = (family: string) => {
      if (!family) return;
      const id = `gf-${family.replace(/\s+/g, "-").toLowerCase()}`;
      if (document.getElementById(id)) return;
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@300;400;500;600;700;800;900&display=swap`;
      document.head.appendChild(link);
    };

    watchEffect(() => {
      const family = props.widget.fontFamily;
      if (family) loadGoogleFont(family);
    });

    return {
      splitFrom,
      splitTo,
      shinyDirection,
      gradientDirection,
      blurAnimateBy,
      blurDirection,
      splitType,
      splitTag,
      splitTextAlign,
      rotatingAnimatePresenceMode,
      rotatingStaggerFrom,
      rotatingSplitBy,
      variableFalloff,
      blurAnimationFrom,
      blurAnimationTo,
      rotatingTransition,
      rotatingInitial,
      rotatingAnimate,
      rotatingExit,
      gradientColors,
      textTypeText,
      textTypeColors,
      textTypeVariableSpeed,
      rotatingTexts,
      variableStyle,
      auroraProps,
      colorBendsProps,
      darkVeilProps,
      dotGridProps,
      grainientProps,
      iridescenceProps,
      lightningProps,
      liquidEtherProps,
      orbProps,
      particlesProps,
      prismaticBurstProps,
      silkProps,
      cardStyle,
      backgroundStyle,
      textVariantClass,
      textVariantStyle,
      buttonStyle,
      rootRef,
      bgVisible,
    };
  },
});
</script>

<style scoped>
.widget-text {
  text-shadow: 0 6px 28px rgba(0, 0, 0, 0.35);
  font-family: var(--vb-font-family, inherit);
  font-weight: var(--vb-font-weight, inherit);
  letter-spacing: var(--vb-letter-spacing, inherit);
}

/* Text variants */
.txv-shiny-text {
  background: linear-gradient(120deg, #d1d5db 20%, #ffffff 40%, #d1d5db 60%);
  background-size: 220% auto;
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  animation: tx-shiny calc(2.2s / var(--vb-text-speed, 1)) linear infinite;
  animation-play-state: var(--vb-play-state, running);
}

.txv-gradient-text {
  background: linear-gradient(90deg, #5eead4, #f0abfc, #fef08a, #5eead4);
  background-size: 240% 240%;
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  animation: tx-gradient calc(3.5s / var(--vb-text-speed, 1)) ease infinite;
  animation-play-state: var(--vb-play-state, running);
}

.txv-glitch-text {
  animation: tx-glitch calc(800ms / var(--vb-text-speed, 1)) steps(2, end) infinite;
  animation-play-state: var(--vb-play-state, running);
}

.txv-blur-text {
  animation: tx-blur calc(2.2s / var(--vb-text-speed, 1)) ease-in-out infinite;
  animation-play-state: var(--vb-play-state, running);
}

.txv-text-type {
  white-space: nowrap;
}


@keyframes tx-shiny {
  from { background-position: 0% 50%; }
  to { background-position: 220% 50%; }
}

@keyframes tx-gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes tx-glitch {
  0%, 100% { transform: translate(0, 0); text-shadow: 1px 0 #22d3ee, -1px 0 #f43f5e; }
  25% { transform: translate(1px, -1px); }
  50% { transform: translate(-1px, 1px); text-shadow: -1px 0 #22d3ee, 1px 0 #f43f5e; }
  75% { transform: translate(1px, 1px); }
}

@keyframes tx-blur {
  0%, 100% { filter: blur(0); opacity: 1; }
  50% { filter: blur(1.5px); opacity: 0.88; }
}

</style>
