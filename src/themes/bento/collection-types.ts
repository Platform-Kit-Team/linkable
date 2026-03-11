/**
 * Bento theme collection types & factories.
 *
 * These type definitions are specific to the bento layout:
 * BioLink, SocialLink, GalleryItem, EmbedItem, WidgetItem.
 * Other themes may define their own collection shapes.
 */

import { newId } from "../../lib/model";

// ── Link ──────────────────────────────────────────────────────────

export type BioLink = {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  imageUrl: string;
  enabled: boolean;
  tags: string[];
  publishDate: string;
  expirationDate: string;
};

export const newLink = (): BioLink => ({
  id: newId(),
  title: "New link",
  subtitle: "",
  url: "https://",
  imageUrl: "",
  enabled: true,
  tags: [],
  publishDate: "",
  expirationDate: "",
});

// ── Social ────────────────────────────────────────────────────────

export type SocialLink = {
  id: string;
  icon: string;
  label: string;
  url: string;
  enabled: boolean;
};

export const newSocial = (): SocialLink => ({
  id: newId(),
  icon: "Globe",
  label: "",
  url: "",
  enabled: false,
});

// ── Gallery ───────────────────────────────────────────────────────

export type GalleryItemType = "image" | "video";

export type GalleryItem = {
  id: string;
  type: GalleryItemType;
  src: string;
  coverUrl: string;
  title: string;
  description: string;
  tags: string[];
  enabled: boolean;
  publishDate: string;
  expirationDate: string;
};

export const newGalleryItem = (): GalleryItem => ({
  id: newId(),
  type: "image",
  src: "",
  coverUrl: "",
  title: "",
  description: "",
  tags: [],
  enabled: true,
  publishDate: "",
  expirationDate: "",
});

/** @deprecated Gallery is now a ContentCollection — use model.collections.gallery */
export type BioGallery = {
  enabled: boolean;
  items: GalleryItem[];
};

/** @deprecated Gallery is now a ContentCollection */
export const defaultGallery = (): BioGallery => ({
  enabled: false,
  items: [],
});

// ── Embed ─────────────────────────────────────────────────────────

export type EmbedItem = {
  id: string;
  label: string;
  html: string;
  icon: string;
  enabled: boolean;
  publishDate: string;
  expirationDate: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  letterSpacing: string; // kerning
  lineHeight: string;
  kerning: string;
};

export const newEmbed = (): EmbedItem => ({
  id: newId(),
  label: "New Embed",
  html: "",
  icon: "Code",
  enabled: true,
  publishDate: "",
  expirationDate: "",
  fontSize: 14,
  fontFamily: "",
  fontWeight: "",
  letterSpacing: "",
  lineHeight: "1.2",
  kerning: "0",
});

// ── Widget ────────────────────────────────────────────────────────

export type WidgetType = "animated-text";

export type WidgetItem = {
  id: string;
  type: WidgetType;
  text: string;
  textVariant: string;
  backgroundVariant: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  letterSpacing: string; // kerning
  lineHeight: string;
  kerning: string;
  backgroundColor: string;
  buttonColor: string;
  buttonTextColor: string;
  textPresetSpeed: number;
  textPresetIntensity: number;
  backgroundPresetSpeed: number;
  backgroundPresetIntensity: number;
  backgroundPresetScale: number;
  pauseOnHover: boolean;
  buttonLabel: string;
  buttonUrl: string;
  enabled: boolean;
  publishDate: string;
  expirationDate: string;

  // ShinyText
  shinyDisabled: boolean;
  shinySpeed: number;
  shinyDelay: number;
  shinySpread: number;
  shinyDirection: string;
  shinyYoyo: boolean;
  shinyPauseOnHover: boolean;
  shinyClassName: string;
  shinyColor: string;
  shinyShineColor: string;

  // GradientText
  gradientClassName: string;
  gradientColor1: string;
  gradientColor2: string;
  gradientColor3: string;
  gradientColors: string;
  gradientAnimationSpeed: number;
  gradientShowBorder: boolean;
  gradientDirection: string;
  gradientPauseOnHover: boolean;
  gradientYoyo: boolean;

  // GlitchText
  glitchClassName: string;
  glitchSpeed: number;
  glitchEnableShadows: boolean;
  glitchEnableOnHover: boolean;

  // BlurText
  blurClassName: string;
  blurDelay: number;
  blurAnimateBy: string;
  blurDirection: string;
  blurThreshold: number;
  blurRootMargin: string;
  blurStepDuration: number;
  blurAnimationFromJson: string;
  blurAnimationToJson: string;

  // SplitText
  splitClassName: string;
  splitDelay: number;
  splitDuration: number;
  splitEase: string;
  splitType: string;
  splitThreshold: number;
  splitRootMargin: string;
  splitTag: string;
  splitTextAlign: string;
  splitFromJson: string;
  splitToJson: string;

  // TextType
  textTypeClassName: string;
  textTypeShowCursor: boolean;
  textTypeHideCursorWhileTyping: boolean;
  textTypeCursorCharacter: string;
  textTypeCursorBlinkDuration: number;
  textTypeCursorClassName: string;
  textTypeAs: string;
  textTypeTypingSpeed: number;
  textTypeInitialDelay: number;
  textTypePauseDuration: number;
  textTypeDeletingSpeed: number;
  textTypeLoop: boolean;
  textTypeTextList: string;
  textTypeColor1: string;
  textTypeColor2: string;
  textTypeColor3: string;
  textTypeTextColors: string;
  textTypeVariableSpeedEnabled: boolean;
  textTypeVariableSpeedMin: number;
  textTypeVariableSpeedMax: number;
  textTypeStartOnVisible: boolean;
  textTypeReverseMode: boolean;

  // RotatingText
  rotatingTexts: string;
  rotatingTransitionJson: string;
  rotatingInitialJson: string;
  rotatingAnimateJson: string;
  rotatingExitJson: string;
  rotatingAnimatePresenceMode: string;
  rotatingAnimatePresenceInitial: boolean;
  rotatingRotationInterval: number;
  rotatingStaggerDuration: number;
  rotatingStaggerFrom: string;
  rotatingLoop: boolean;
  rotatingAuto: boolean;
  rotatingSplitBy: string;
  rotatingMainClassName: string;
  rotatingSplitLevelClassName: string;
  rotatingElementLevelClassName: string;

  // VariableProximity
  variableLabel: string;
  variableFromFontVariationSettings: string;
  variableToFontVariationSettings: string;
  variableRadius: number;
  variableFalloff: string;
  variableClassName: string;
  variableStyleJson: string;

  // Background variants
  auroraColorStops: string;
  auroraColorStop1: string;
  auroraColorStop2: string;
  auroraColorStop3: string;
  auroraAmplitude: number;
  auroraBlend: number;
  auroraTime: number;
  auroraSpeed: number;
  auroraIntensity: number;
  auroraClassName: string;
  auroraStyleJson: string;

  colorBendsRotation: number;
  colorBendsSpeed: number;
  colorBendsColor1: string;
  colorBendsColor2: string;
  colorBendsColor3: string;
  colorBendsColors: string;
  colorBendsTransparent: boolean;
  colorBendsAutoRotate: number;
  colorBendsScale: number;
  colorBendsFrequency: number;
  colorBendsWarpStrength: number;
  colorBendsMouseInfluence: number;
  colorBendsParallax: number;
  colorBendsNoise: number;
  colorBendsClassName: string;
  colorBendsStyleJson: string;

  darkVeilHueShift: number;
  darkVeilNoiseIntensity: number;
  darkVeilScanlineIntensity: number;
  darkVeilSpeed: number;
  darkVeilScanlineFrequency: number;
  darkVeilWarpAmount: number;
  darkVeilResolutionScale: number;

  dotGridDotSize: number;
  dotGridGap: number;
  dotGridBaseColor: string;
  dotGridActiveColor: string;
  dotGridProximity: number;
  dotGridSpeedTrigger: number;
  dotGridShockRadius: number;
  dotGridShockStrength: number;
  dotGridMaxSpeed: number;
  dotGridResistance: number;
  dotGridReturnDuration: number;
  dotGridClassName: string;
  dotGridStyleJson: string;

  grainientTimeSpeed: number;
  grainientColorBalance: number;
  grainientWarpStrength: number;
  grainientWarpFrequency: number;
  grainientWarpSpeed: number;
  grainientWarpAmplitude: number;
  grainientBlendAngle: number;
  grainientBlendSoftness: number;
  grainientRotationAmount: number;
  grainientNoiseScale: number;
  grainientGrainAmount: number;
  grainientGrainScale: number;
  grainientGrainAnimated: boolean;
  grainientContrast: number;
  grainientGamma: number;
  grainientSaturation: number;
  grainientCenterX: number;
  grainientCenterY: number;
  grainientZoom: number;
  grainientColor1: string;
  grainientColor2: string;
  grainientColor3: string;
  grainientClassName: string;

  iridescenceBaseColor: string;
  iridescenceColor: string;
  iridescenceSpeed: number;
  iridescenceAmplitude: number;
  iridescenceMouseReact: boolean;

  lightningHue: number;
  lightningXOffset: number;
  lightningSpeed: number;
  lightningIntensity: number;
  lightningSize: number;

  liquidEtherMouseForce: number;
  liquidEtherCursorSize: number;
  liquidEtherIsViscous: boolean;
  liquidEtherViscous: number;
  liquidEtherIterationsViscous: number;
  liquidEtherIterationsPoisson: number;
  liquidEtherDt: number;
  liquidEtherBFECC: boolean;
  liquidEtherResolution: number;
  liquidEtherIsBounce: boolean;
  liquidEtherColor1: string;
  liquidEtherColor2: string;
  liquidEtherColor3: string;
  liquidEtherColors: string;
  liquidEtherStyleJson: string;
  liquidEtherClassName: string;
  liquidEtherAutoDemo: boolean;
  liquidEtherAutoSpeed: number;
  liquidEtherAutoIntensity: number;
  liquidEtherTakeoverDuration: number;
  liquidEtherAutoResumeDelay: number;
  liquidEtherAutoRampDuration: number;

  orbHue: number;
  orbHoverIntensity: number;
  orbRotateOnHover: boolean;
  orbForceHoverState: boolean;

  particlesParticleCount: number;
  particlesParticleSpread: number;
  particlesSpeed: number;
  particlesColor1: string;
  particlesColor2: string;
  particlesColor3: string;
  particlesParticleColors: string;
  particlesMoveParticlesOnHover: boolean;
  particlesParticleHoverFactor: number;
  particlesAlphaParticles: boolean;
  particlesParticleBaseSize: number;
  particlesSizeRandomness: number;
  particlesCameraDistance: number;
  particlesDisableRotation: boolean;
  particlesClassName: string;

  prismaticBurstIntensity: number;
  prismaticBurstSpeed: number;
  prismaticBurstAnimationType: string;
  prismaticBurstColor1: string;
  prismaticBurstColor2: string;
  prismaticBurstColor3: string;
  prismaticBurstColors: string;
  prismaticBurstDistort: number;
  prismaticBurstPaused: boolean;
  prismaticBurstOffsetX: string;
  prismaticBurstOffsetY: string;
  prismaticBurstHoverDampness: number;
  prismaticBurstRayCount: number;
  prismaticBurstMixBlendMode: string;

  silkSpeed: number;
  silkScale: number;
  silkColor: string;
  silkNoiseIntensity: number;
  silkRotation: number;
  silkClassName: string;
  silkStyleJson: string;
};

export const newWidget = (): WidgetItem => ({
  id: newId(),
  type: "animated-text",
  text: "Build something memorable",
  textVariant: "shiny-text",
  backgroundVariant: "aurora",
  textColor: "#ffffff",
  fontSize: 20,
  fontFamily: "",
  fontWeight: "",
  letterSpacing: "",
  lineHeight: "1.2",
  kerning: "0",
  backgroundColor: "",
  buttonColor: "#ffffff",
  buttonTextColor: "#0f172a",
  textPresetSpeed: 1,
  textPresetIntensity: 1,
  backgroundPresetSpeed: 1,
  backgroundPresetIntensity: 1,
  backgroundPresetScale: 1,
  pauseOnHover: false,
  buttonLabel: "Learn more",
  buttonUrl: "",
  enabled: true,
  publishDate: "",
  expirationDate: "",

  shinyDisabled: false,
  shinySpeed: 2,
  shinyDelay: 0,
  shinySpread: 120,
  shinyDirection: "left",
  shinyYoyo: false,
  shinyPauseOnHover: false,
  shinyClassName: "",
  shinyColor: "#b5b5b5",
  shinyShineColor: "#ffffff",

  gradientClassName: "",
  gradientColor1: "#27FF64",
  gradientColor2: "#27FF64",
  gradientColor3: "#A0FFBC",
  gradientColors: "#27FF64,#27FF64,#A0FFBC",
  gradientAnimationSpeed: 8,
  gradientShowBorder: false,
  gradientDirection: "horizontal",
  gradientPauseOnHover: false,
  gradientYoyo: true,

  glitchClassName: "",
  glitchSpeed: 0.5,
  glitchEnableShadows: true,
  glitchEnableOnHover: false,

  blurClassName: "",
  blurDelay: 200,
  blurAnimateBy: "words",
  blurDirection: "top",
  blurThreshold: 0.1,
  blurRootMargin: "0px",
  blurStepDuration: 0.35,
  blurAnimationFromJson: '{"filter":"blur(10px)","opacity":0,"y":-50}',
  blurAnimationToJson: '[{"filter":"blur(5px)","opacity":0.5,"y":5},{"filter":"blur(0px)","opacity":1,"y":0}]',

  splitClassName: "",
  splitDelay: 50,
  splitDuration: 1.25,
  splitEase: "power3.out",
  splitType: "chars",
  splitThreshold: 0.1,
  splitRootMargin: "-100px",
  splitTag: "p",
  splitTextAlign: "center",
  splitFromJson: '{"opacity":0,"y":40}',
  splitToJson: '{"opacity":1,"y":0}',

  textTypeClassName: "",
  textTypeShowCursor: true,
  textTypeHideCursorWhileTyping: false,
  textTypeCursorCharacter: "_",
  textTypeCursorBlinkDuration: 0.5,
  textTypeCursorClassName: "",
  textTypeAs: "div",
  textTypeTypingSpeed: 75,
  textTypeInitialDelay: 0,
  textTypePauseDuration: 1500,
  textTypeDeletingSpeed: 50,
  textTypeLoop: true,
  textTypeTextList: "",
  textTypeColor1: "",
  textTypeColor2: "",
  textTypeColor3: "",
  textTypeTextColors: "",
  textTypeVariableSpeedEnabled: false,
  textTypeVariableSpeedMin: 60,
  textTypeVariableSpeedMax: 120,
  textTypeStartOnVisible: false,
  textTypeReverseMode: false,

  rotatingTexts: "Build\nSomething\nMemorable",
  rotatingTransitionJson: '{"type":"spring","damping":25,"stiffness":300}',
  rotatingInitialJson: '{"y":"100%","opacity":0}',
  rotatingAnimateJson: '{"y":0,"opacity":1}',
  rotatingExitJson: '{"y":"-120%","opacity":0}',
  rotatingAnimatePresenceMode: "wait",
  rotatingAnimatePresenceInitial: false,
  rotatingRotationInterval: 2000,
  rotatingStaggerDuration: 0,
  rotatingStaggerFrom: "first",
  rotatingLoop: true,
  rotatingAuto: true,
  rotatingSplitBy: "characters",
  rotatingMainClassName: "",
  rotatingSplitLevelClassName: "",
  rotatingElementLevelClassName: "",

  variableLabel: "Hover me!",
  variableFromFontVariationSettings: "'wght' 400, 'opsz' 9",
  variableToFontVariationSettings: "'wght' 1000, 'opsz' 40",
  variableRadius: 100,
  variableFalloff: "linear",
  variableClassName: "",
  variableStyleJson: "{}",

  auroraColorStops: "#7cff67,#171D22,#7cff67",
  auroraColorStop1: "#7cff67",
  auroraColorStop2: "#171D22",
  auroraColorStop3: "#7cff67",
  auroraAmplitude: 1,
  auroraBlend: 0.5,
  auroraTime: 0,
  auroraSpeed: 1,
  auroraIntensity: 1,
  auroraClassName: "",
  auroraStyleJson: "{}",

  colorBendsRotation: 45,
  colorBendsSpeed: 0.2,
  colorBendsColor1: "",
  colorBendsColor2: "",
  colorBendsColor3: "",
  colorBendsColors: "",
  colorBendsTransparent: true,
  colorBendsAutoRotate: 0,
  colorBendsScale: 1,
  colorBendsFrequency: 1,
  colorBendsWarpStrength: 1,
  colorBendsMouseInfluence: 1,
  colorBendsParallax: 0.5,
  colorBendsNoise: 0.1,
  colorBendsClassName: "",
  colorBendsStyleJson: "{}",

  darkVeilHueShift: 0,
  darkVeilNoiseIntensity: 0,
  darkVeilScanlineIntensity: 0,
  darkVeilSpeed: 0.5,
  darkVeilScanlineFrequency: 0,
  darkVeilWarpAmount: 0,
  darkVeilResolutionScale: 1,

  dotGridDotSize: 16,
  dotGridGap: 32,
  dotGridBaseColor: "#27FF64",
  dotGridActiveColor: "#27FF64",
  dotGridProximity: 150,
  dotGridSpeedTrigger: 100,
  dotGridShockRadius: 250,
  dotGridShockStrength: 5,
  dotGridMaxSpeed: 5000,
  dotGridResistance: 750,
  dotGridReturnDuration: 1.5,
  dotGridClassName: "",
  dotGridStyleJson: "{}",

  grainientTimeSpeed: 0.5,
  grainientColorBalance: 0.6,
  grainientWarpStrength: 0.25,
  grainientWarpFrequency: 0.5,
  grainientWarpSpeed: 0.25,
  grainientWarpAmplitude: 0.2,
  grainientBlendAngle: 45,
  grainientBlendSoftness: 0.5,
  grainientRotationAmount: 0,
  grainientNoiseScale: 1,
  grainientGrainAmount: 0.2,
  grainientGrainScale: 1.5,
  grainientGrainAnimated: true,
  grainientContrast: 1,
  grainientGamma: 1,
  grainientSaturation: 1,
  grainientCenterX: 0.5,
  grainientCenterY: 0.5,
  grainientZoom: 1,
  grainientColor1: "#ff7b7b",
  grainientColor2: "#7bb8ff",
  grainientColor3: "#7bffb0",
  grainientClassName: "",

  iridescenceBaseColor: "#ffffff",
  iridescenceColor: "1,1,1",
  iridescenceSpeed: 1,
  iridescenceAmplitude: 0.1,
  iridescenceMouseReact: true,

  lightningHue: 220,
  lightningXOffset: 0,
  lightningSpeed: 1,
  lightningIntensity: 1,
  lightningSize: 1,

  liquidEtherMouseForce: 20,
  liquidEtherCursorSize: 100,
  liquidEtherIsViscous: true,
  liquidEtherViscous: 30,
  liquidEtherIterationsViscous: 32,
  liquidEtherIterationsPoisson: 32,
  liquidEtherDt: 0.016,
  liquidEtherBFECC: true,
  liquidEtherResolution: 1,
  liquidEtherIsBounce: false,
  liquidEtherColor1: "#5227ff",
  liquidEtherColor2: "#27c1ff",
  liquidEtherColor3: "#7cff67",
  liquidEtherColors: "#5227ff,#27c1ff,#7cff67",
  liquidEtherStyleJson: "{}",
  liquidEtherClassName: "",
  liquidEtherAutoDemo: true,
  liquidEtherAutoSpeed: 1,
  liquidEtherAutoIntensity: 1,
  liquidEtherTakeoverDuration: 0.4,
  liquidEtherAutoResumeDelay: 1.5,
  liquidEtherAutoRampDuration: 0.6,

  orbHue: 0,
  orbHoverIntensity: 0.2,
  orbRotateOnHover: true,
  orbForceHoverState: false,

  particlesParticleCount: 200,
  particlesParticleSpread: 8,
  particlesSpeed: 0.1,
  particlesColor1: "#ffffff",
  particlesColor2: "#cfe8ff",
  particlesColor3: "#9dd1ff",
  particlesParticleColors: "#ffffff,#cfe8ff,#9dd1ff",
  particlesMoveParticlesOnHover: true,
  particlesParticleHoverFactor: 1,
  particlesAlphaParticles: true,
  particlesParticleBaseSize: 100,
  particlesSizeRandomness: 1,
  particlesCameraDistance: 20,
  particlesDisableRotation: false,
  particlesClassName: "",

  prismaticBurstIntensity: 2,
  prismaticBurstSpeed: 0.5,
  prismaticBurstAnimationType: "rotate3d",
  prismaticBurstColor1: "",
  prismaticBurstColor2: "",
  prismaticBurstColor3: "",
  prismaticBurstColors: "",
  prismaticBurstDistort: 0,
  prismaticBurstPaused: false,
  prismaticBurstOffsetX: "0",
  prismaticBurstOffsetY: "0",
  prismaticBurstHoverDampness: 0,
  prismaticBurstRayCount: 0,
  prismaticBurstMixBlendMode: "lighten",

  silkSpeed: 5,
  silkScale: 1,
  silkColor: "#ffffff",
  silkNoiseIntensity: 1,
  silkRotation: 0,
  silkClassName: "",
  silkStyleJson: "{}",
});
