export type BioLink = {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  imageUrl: string; // optional
  enabled: boolean;
  tags: string[];
  publishDate: string; // ISO date, e.g. "2025-06-01" — not visible before this date
  expirationDate: string; // ISO date — not visible after this date
};

export type SocialLink = {
  id: string;
  icon: string;
  label: string;
  url: string;
  enabled: boolean;
};

export type BioProfile = {
  displayName: string;
  tagline: string;
  faviconUrl: string;
  ogImageUrl: string;
};

export type EducationEntry = {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
};

export type EmploymentEntry = {
  id: string;
  company: string;
  role: string;
  description: string;
  startYear: string;
  endYear: string;
};

export type AchievementEntry = {
  id: string;
  title: string;
  issuer: string;
  year: string;
  description: string;
};

export type ResumeData = {
  bio: string;
  education: EducationEntry[];
  employment: EmploymentEntry[];
  skills: string[];
  achievements: AchievementEntry[];
};

/** @deprecated Use ResumeData instead — enabled flag now lives on ContentCollection */
export type BioResume = ResumeData & { enabled?: boolean };

export type GalleryItemType = "image" | "video";

export type GalleryItem = {
  id: string;
  type: GalleryItemType;
  /** Upload path for images/mp4s, or a YouTube/Vimeo URL */
  src: string;
  /** Optional cover/thumbnail image (used for video poster) */
  coverUrl: string;
  title: string;
  description: string;
  tags: string[];
  enabled: boolean;
  publishDate: string;
  expirationDate: string;
};

/** @deprecated Gallery is now a ContentCollection — use model.collections.gallery */
export type BioGallery = {
  enabled: boolean;
  items: GalleryItem[];
};

export type ThemePreset = string;

export type BioTheme = {
  layout: string;
  preset: ThemePreset;
  colorBrand: string;
  colorBrandStrong: string;
  colorAccent: string;
  colorInk: string;
  colorInkSoft: string;
  bg: string;
  glass: string;
  glass2: string;
  glassStrong: string;
  colorBorder: string;
  colorBorder2: string;
  cardBg: string;
  cardBorder: string;
  cardText: string;
  radiusXl: string;
  radiusLg: string;
  layoutVars: Record<string, string>;
  layoutData: Record<string, unknown>;
};

/** @deprecated Blog is now a ContentCollection — use model.collections.blog */
export type BioBlog = {
  enabled: boolean;
};

export type EmbedItem = {
  id: string;
  label: string;
  html: string;
  icon: string;
  enabled: boolean;
  publishDate: string;
  expirationDate: string;
};

export type WidgetType = "animated-text";

export type WidgetItem = {
  id: string;
  type: WidgetType;
  text: string;
  textVariant: string;
  backgroundVariant: string;
  textColor: string;
  fontSize: number;
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

export type BioScripts = {
  headScript: string;
  bodyEndScript: string;
};

export type ContentCollection = {
  enabled: boolean;
  label: string;
  icon: string;
  searchEnabled: boolean;
  items: Record<string, unknown>[];
};

export type BioModel = {
  schemaVersion: number;
  profile: BioProfile;
  collections: Record<string, ContentCollection>;
  theme: BioTheme;
  layoutThemes: Record<string, BioTheme>;
  scripts: BioScripts;
};

export const newId = () =>
  (globalThis.crypto?.randomUUID?.() ?? `id_${Math.random().toString(16).slice(2)}`)
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 40);

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

export const newSocial = (): SocialLink => ({
  id: newId(),
  icon: "Globe",
  label: "",
  url: "",
  enabled: false,
});

export const newEducation = (): EducationEntry => ({
  id: newId(),
  institution: "",
  degree: "",
  field: "",
  startYear: "",
  endYear: "",
});

export const newEmployment = (): EmploymentEntry => ({
  id: newId(),
  company: "",
  role: "",
  description: "",
  startYear: "",
  endYear: "",
});

export const newAchievement = (): AchievementEntry => ({
  id: newId(),
  title: "",
  issuer: "",
  year: "",
  description: "",
});

export const defaultResumeData = (): ResumeData => ({
  bio: "",
  education: [],
  employment: [],
  skills: [],
  achievements: [],
});

/** @deprecated Use defaultResumeData() instead */
export const defaultResume = (): ResumeData & { enabled: boolean } => ({
  enabled: false,
  ...defaultResumeData(),
});

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

/** @deprecated Gallery is now a ContentCollection */
export const defaultGallery = (): BioGallery => ({
  enabled: false,
  items: [],
});

/** @deprecated Blog is now a ContentCollection */
export const defaultBlog = (): BioBlog => ({
  enabled: false,
});

export const defaultCollection = (enabled = false): ContentCollection => ({
  enabled,
  label: "",
  icon: "",
  searchEnabled: false,
  items: [],
});

export const defaultTheme = (): BioTheme => ({
  layout: "default",
  preset: "light",
  colorBrand: "#3b82f6",
  colorBrandStrong: "#2563eb",
  colorAccent: "#ff5a7a",
  colorInk: "#0b1220",
  colorInkSoft: "rgba(11, 18, 32, 0.62)",
  bg: "#f5f7fb",
  glass: "rgba(255, 255, 255, 0.66)",
  glass2: "rgba(255, 255, 255, 0.52)",
  glassStrong: "rgba(255, 255, 255, 0.82)",
  colorBorder: "rgba(255, 255, 255, 0.62)",
  colorBorder2: "rgba(11, 18, 32, 0.10)",
  cardBg: "rgba(255, 255, 255, 0.66)",
  cardBorder: "rgba(255, 255, 255, 0.62)",
  cardText: "#0b1220",
  radiusXl: "1.6rem",
  radiusLg: "1.2rem",
  layoutVars: {},
  layoutData: {},
});

export const darkTheme = (): BioTheme => ({
  layout: "default",
  preset: "dark",
  colorBrand: "#60a5fa",
  colorBrandStrong: "#3b82f6",
  colorAccent: "#f472b6",
  colorInk: "#f1f5f9",
  colorInkSoft: "rgba(241, 245, 249, 0.55)",
  bg: "#000000",
  glass: "rgba(40, 52, 72, 0.78)",
  glass2: "rgba(40, 52, 72, 0.60)",
  glassStrong: "rgba(50, 62, 82, 0.92)",
  colorBorder: "rgba(148, 163, 184, 0.24)",
  colorBorder2: "rgba(148, 163, 184, 0.12)",
  cardBg: "rgba(40, 52, 72, 0.78)",
  cardBorder: "rgba(148, 163, 184, 0.24)",
  cardText: "#f1f5f9",
  radiusXl: "1.6rem",
  radiusLg: "1.2rem",
  layoutVars: {},
  layoutData: {},
});

export const THEME_PRESETS: Record<string, () => BioTheme> = {
  light: defaultTheme,
  dark: darkTheme,
};

export const newEmbed = (): EmbedItem => ({
  id: newId(),
  label: "New Embed",
  html: "",
  icon: "Code",
  enabled: true,
  publishDate: "",
  expirationDate: "",
});

export const newWidget = (): WidgetItem => ({
  id: newId(),
  type: "animated-text",
  text: "Build something memorable",
  textVariant: "shiny-text",
  backgroundVariant: "aurora",
  textColor: "#ffffff",
  fontSize: 20,
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

export const defaultScripts = (): BioScripts => ({
  headScript: "",
  bodyEndScript: "",
});

export const defaultModel = (): BioModel => ({
  schemaVersion: 1,
  profile: {
    displayName: "Linkable",
    tagline: "Design-forward links. Clean, fast, yours.",
    faviconUrl: "",
    ogImageUrl: "",
  },
  collections: {
    socials: {
      ...defaultCollection(true),
      items: [
        { id: newId(), icon: "Instagram", label: "Instagram", url: "https://instagram.com", enabled: true },
        { id: newId(), icon: "Github", label: "Github", url: "https://github.com", enabled: false },
      ],
    },
    links: {
      ...defaultCollection(true),
      items: [
        {
          id: newId(),
          title: "My portfolio",
          subtitle: "Selected work & case studies",
          url: "https://example.com",
          imageUrl: "",
          enabled: true,
          tags: [],
          publishDate: "",
          expirationDate: "",
        },
        {
          id: newId(),
          title: "Book a call",
          subtitle: "15 minutes to see if we fit",
          url: "https://example.com",
          imageUrl: "",
          enabled: true,
          tags: [],
          publishDate: "",
          expirationDate: "",
        },
        {
          id: newId(),
          title: "Shop presets",
          subtitle: "UI kits, templates, packs",
          url: "https://example.com",
          imageUrl: "",
          enabled: true,
          tags: [],
          publishDate: "",
          expirationDate: "",
        },
      ],
    },
    gallery: { ...defaultCollection(), label: "Gallery", icon: "Image" },
    resume: {
      ...defaultCollection(),
      label: "About Me",
      icon: "FileText",
      items: [defaultResumeData()],
    },
    blog: { ...defaultCollection(), label: "Blog", icon: "BookOpen" },
    embeds: { ...defaultCollection(true), label: "Embeds", icon: "Code" },
    widgets: defaultCollection(),
    newsletter: { ...defaultCollection(), label: "Newsletter", icon: "Mail" },
  },
  theme: defaultTheme(),
  layoutThemes: {
    default: defaultTheme(),
  },
  scripts: defaultScripts(),
});

const asString = (v: unknown) => (typeof v === "string" ? v : "");
const asBool = (v: unknown) => (typeof v === "boolean" ? v : false);

const sanitizeLayoutVars = (v: unknown): Record<string, string> => {
  if (!v || typeof v !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof key === "string" && key.startsWith("--") && typeof val === "string") {
      out[key.slice(0, 80)] = (val as string).slice(0, 200);
    }
  }
  return out;
};

const sanitizeUrl = (v: unknown) => {
  const raw = asString(v).trim();
  if (!raw) return "";

  // Allow fragment-only links like #gallery, #blog, etc.
  if (raw.startsWith("#")) {
    return raw;
  }

  if (raw.startsWith("/")) {
    try {
      const normalized = new URL(raw, "http://localhost");
      const output = normalized.pathname + normalized.search + normalized.hash;
      if (output.includes("..")) return "";
      return output;
    } catch {
      return "";
    }
  }

  try {
    const u = new URL(raw);
    if (u.protocol === "http:" || u.protocol === "https:" || u.protocol === "mailto:") return u.toString();
    return "";
  } catch {
    return "";  
  }
};

import { migrateToLatest, CURRENT_SCHEMA_VERSION } from "./migrations";

const sanitizeTheme = (raw: unknown, fallback: BioTheme): BioTheme => {
  const t = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const presetVal = asString(t.preset);
  const preset: ThemePreset = presetVal || fallback.preset;
  const layout = asString(t.layout).slice(0, 40) || fallback.layout;
  return {
    layout,
    preset,
    colorBrand: asString(t.colorBrand).slice(0, 40) || fallback.colorBrand,
    colorBrandStrong: asString(t.colorBrandStrong).slice(0, 40) || fallback.colorBrandStrong,
    colorAccent: asString(t.colorAccent).slice(0, 40) || fallback.colorAccent,
    colorInk: asString(t.colorInk).slice(0, 40) || fallback.colorInk,
    colorInkSoft: asString(t.colorInkSoft).slice(0, 60) || fallback.colorInkSoft,
    bg: asString(t.bg).slice(0, 40) || fallback.bg,
    glass: asString(t.glass).slice(0, 60) || fallback.glass,
    glass2: asString(t.glass2).slice(0, 60) || fallback.glass2,
    glassStrong: asString(t.glassStrong).slice(0, 60) || fallback.glassStrong,
    colorBorder: asString(t.colorBorder).slice(0, 60) || fallback.colorBorder,
    colorBorder2: asString(t.colorBorder2).slice(0, 60) || fallback.colorBorder2,
    cardBg: asString(t.cardBg).slice(0, 60) || fallback.cardBg,
    cardBorder: asString(t.cardBorder).slice(0, 60) || fallback.cardBorder,
    cardText: asString(t.cardText).slice(0, 40) || fallback.cardText,
    radiusXl: asString(t.radiusXl).slice(0, 20) || fallback.radiusXl,
    radiusLg: asString(t.radiusLg).slice(0, 20) || fallback.radiusLg,
    layoutVars: sanitizeLayoutVars(t.layoutVars),
    layoutData: (() => {
      const ld = (t.layoutData && typeof t.layoutData === "object" && !Array.isArray(t.layoutData)) ? { ...(t.layoutData as Record<string, unknown>) } : {} as Record<string, unknown>;
      if (ld.avatarUrl !== undefined) ld.avatarUrl = sanitizeUrl(ld.avatarUrl);
      if (ld.bannerUrl !== undefined) ld.bannerUrl = sanitizeUrl(ld.bannerUrl);
      return ld;
    })(),
  };
};

export const sanitizeModel = (input: unknown): BioModel => {
  const obj = migrateToLatest(input);

  const profile: BioProfile = {
    displayName: asString(obj.profile?.displayName).slice(0, 80),
    tagline: asString(obj.profile?.tagline).slice(0, 140),
    faviconUrl: sanitizeUrl(obj.profile?.faviconUrl),
    ogImageUrl: sanitizeUrl(obj.profile?.ogImageUrl),
  };

  // ── Collections ─────────────────────────────────────────────────
  const rawCollections = obj.collections && typeof obj.collections === "object" ? obj.collections : {};

  const sanitizeCollectionMeta = (raw: unknown, defaults: ContentCollection): ContentCollection => {
    const c = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    return {
      enabled: typeof c.enabled === "boolean" ? c.enabled : defaults.enabled,
      label: asString(c.label).slice(0, 30),
      icon: asString(c.icon).slice(0, 60),
      searchEnabled: typeof c.searchEnabled === "boolean" ? c.searchEnabled : defaults.searchEnabled,
      items: Array.isArray(c.items) ? c.items : [],
    };
  };

  // Links
  const linksCol = sanitizeCollectionMeta(rawCollections.links, defaultCollection(true));
  const links: BioLink[] = linksCol.items
    .map((l: any) => ({
      id: asString(l?.id) || newId(),
      title: asString(l?.title).slice(0, 60),
      subtitle: asString(l?.subtitle).slice(0, 90),
      url: sanitizeUrl(l?.url),
      imageUrl: sanitizeUrl(l?.imageUrl),
      enabled: typeof l?.enabled === "boolean" ? l.enabled : true,
      tags: Array.isArray(l?.tags) ? l.tags.filter((t: any) => typeof t === 'string').slice(0, 20) : [],
      publishDate: asString(l?.publishDate).slice(0, 10),
      expirationDate: asString(l?.expirationDate).slice(0, 10),
    }))
    .filter((l: BioLink) => !!l.id)
    .slice(0, 60);
  linksCol.items = links;

  // Gallery
  const galleryItemTypes: GalleryItemType[] = ["image", "video"];
  const asGalleryItemType = (v: unknown): GalleryItemType =>
    galleryItemTypes.includes(v as GalleryItemType) ? (v as GalleryItemType) : "image";

  const galleryCol = sanitizeCollectionMeta(rawCollections.gallery, defaultCollection());
  const galleryItems: GalleryItem[] = galleryCol.items
    .map((g: any) => ({
      id: asString(g?.id) || newId(),
      type: asGalleryItemType(g?.type),
      src: asString(g?.src).slice(0, 500),
      coverUrl: sanitizeUrl(g?.coverUrl),
      title: asString(g?.title).slice(0, 120),
      description: asString(g?.description).slice(0, 500),
      tags: (Array.isArray(g?.tags) ? g.tags : [])
        .map((t: unknown) => asString(t).slice(0, 40))
        .filter(Boolean)
        .slice(0, 20),
      enabled: typeof g?.enabled === "boolean" ? g.enabled : true,
      publishDate: asString(g?.publishDate).slice(0, 10),
      expirationDate: asString(g?.expirationDate).slice(0, 10),
    }))
    .filter((g: GalleryItem) => !!g.id)
    .slice(0, 100);
  galleryCol.items = galleryItems;

  // Resume (singleton — items[0] is a ResumeData)
  const resumeCol = sanitizeCollectionMeta(rawCollections.resume, defaultCollection());
  const resumeRaw = resumeCol.items[0] && typeof resumeCol.items[0] === "object" ? resumeCol.items[0] as Record<string, any> : {};
  const resumeData: ResumeData = {
    bio: asString(resumeRaw.bio).slice(0, 2000),
    education: (Array.isArray(resumeRaw.education) ? resumeRaw.education : [])
      .map((e: any) => ({
        id: asString(e?.id) || newId(),
        institution: asString(e?.institution).slice(0, 120),
        degree: asString(e?.degree).slice(0, 120),
        field: asString(e?.field).slice(0, 120),
        startYear: asString(e?.startYear).slice(0, 10),
        endYear: asString(e?.endYear).slice(0, 10),
      }))
      .filter((e: EducationEntry) => !!e.id)
      .slice(0, 30),
    employment: (Array.isArray(resumeRaw.employment) ? resumeRaw.employment : [])
      .map((e: any) => ({
        id: asString(e?.id) || newId(),
        company: asString(e?.company).slice(0, 120),
        role: asString(e?.role).slice(0, 120),
        description: asString(e?.description).slice(0, 500),
        startYear: asString(e?.startYear).slice(0, 10),
        endYear: asString(e?.endYear).slice(0, 10),
      }))
      .filter((e: EmploymentEntry) => !!e.id)
      .slice(0, 30),
    skills: (Array.isArray(resumeRaw.skills) ? resumeRaw.skills : [])
      .map((s: unknown) => asString(s).slice(0, 60))
      .filter(Boolean)
      .slice(0, 50),
    achievements: (Array.isArray(resumeRaw.achievements) ? resumeRaw.achievements : [])
      .map((a: any) => ({
        id: asString(a?.id) || newId(),
        title: asString(a?.title).slice(0, 120),
        issuer: asString(a?.issuer).slice(0, 120),
        year: asString(a?.year).slice(0, 10),
        description: asString(a?.description).slice(0, 500),
      }))
      .filter((a: AchievementEntry) => !!a.id)
      .slice(0, 30),
  };
  resumeCol.items = [resumeData];

  // Blog (external storage — items stay empty)
  const blogCol = sanitizeCollectionMeta(rawCollections.blog, defaultCollection());
  blogCol.items = [];

  // Embeds
  const embedsCol = sanitizeCollectionMeta(rawCollections.embeds, defaultCollection(true));
  const embeds: EmbedItem[] = embedsCol.items
    .map((e: any) => ({
      id: asString(e?.id) || newId(),
      label: asString(e?.label).slice(0, 60) || "Embed",
      html: asString(e?.html).slice(0, 50000),
      icon: asString(e?.icon).slice(0, 60) || "Code",
      enabled: typeof e?.enabled === "boolean" ? e.enabled : true,
      publishDate: asString(e?.publishDate).slice(0, 10),
      expirationDate: asString(e?.expirationDate).slice(0, 10),
    }))
    .filter((e: EmbedItem) => !!e.id)
    .slice(0, 20);
  embedsCol.items = embeds;

  // Newsletter (external storage — Supabase-backed)
  const newsletterCol = sanitizeCollectionMeta(rawCollections.newsletter, defaultCollection());
  newsletterCol.items = [];

  // Widgets
  const widgetTypes: WidgetType[] = ["animated-text"];
  const asWidgetType = (v: unknown): WidgetType =>
    widgetTypes.includes(v as WidgetType) ? (v as WidgetType) : "animated-text";
  const widgetsCol = sanitizeCollectionMeta(rawCollections.widgets, defaultCollection());
  const widgets: WidgetItem[] = widgetsCol.items
    .map((w: any) => ({
      id: asString(w?.id) || newId(),
      type: asWidgetType(w?.type),
      text: asString(w?.text).slice(0, 280),
      textVariant: asString(w?.textVariant).slice(0, 60) || "shiny-text",
      backgroundVariant: asString(w?.backgroundVariant).slice(0, 60) || "aurora",
      textColor: asString(w?.textColor).slice(0, 20) || "#ffffff",
      fontSize: Math.max(10, Math.min(120, Number.isFinite(Number(w?.fontSize)) ? Number(w?.fontSize) : 20)),
      backgroundColor: asString(w?.backgroundColor).slice(0, 20),
      buttonColor: asString(w?.buttonColor).slice(0, 20) || "#ffffff",
      buttonTextColor: asString(w?.buttonTextColor).slice(0, 20) || "#0f172a",
      textPresetSpeed: Math.max(0.1, Math.min(4, Number.isFinite(Number(w?.textPresetSpeed)) ? Number(w?.textPresetSpeed) : 1)),
      textPresetIntensity: Math.max(0.1, Math.min(3, Number.isFinite(Number(w?.textPresetIntensity)) ? Number(w?.textPresetIntensity) : 1)),
      backgroundPresetSpeed: Math.max(0.1, Math.min(4, Number.isFinite(Number(w?.backgroundPresetSpeed)) ? Number(w?.backgroundPresetSpeed) : 1)),
      backgroundPresetIntensity: Math.max(0.1, Math.min(3, Number.isFinite(Number(w?.backgroundPresetIntensity)) ? Number(w?.backgroundPresetIntensity) : 1)),
      backgroundPresetScale: Math.max(0.5, Math.min(2, Number.isFinite(Number(w?.backgroundPresetScale)) ? Number(w?.backgroundPresetScale) : 1)),
      pauseOnHover: typeof w?.pauseOnHover === "boolean" ? w.pauseOnHover : false,
      buttonLabel: asString(w?.buttonLabel).slice(0, 40),
      buttonUrl: sanitizeUrl(w?.buttonUrl),
      enabled: typeof w?.enabled === "boolean" ? w.enabled : true,
      publishDate: asString(w?.publishDate).slice(0, 10),
      expirationDate: asString(w?.expirationDate).slice(0, 10),

      shinyDisabled: typeof w?.shinyDisabled === "boolean" ? w.shinyDisabled : false,
      shinySpeed: Math.max(0.1, Math.min(20, Number.isFinite(Number(w?.shinySpeed)) ? Number(w?.shinySpeed) : 2)),
      shinyDelay: Math.max(0, Math.min(10, Number.isFinite(Number(w?.shinyDelay)) ? Number(w?.shinyDelay) : 0)),
      shinySpread: Math.max(0, Math.min(180, Number.isFinite(Number(w?.shinySpread)) ? Number(w?.shinySpread) : 120)),
      shinyDirection: asString(w?.shinyDirection).slice(0, 10) || "left",
      shinyYoyo: typeof w?.shinyYoyo === "boolean" ? w.shinyYoyo : false,
      shinyPauseOnHover: typeof w?.shinyPauseOnHover === "boolean" ? w.shinyPauseOnHover : false,
      shinyClassName: asString(w?.shinyClassName).slice(0, 200),
      shinyColor: asString(w?.shinyColor).slice(0, 20) || "#b5b5b5",
      shinyShineColor: asString(w?.shinyShineColor).slice(0, 20) || "#ffffff",

      gradientClassName: asString(w?.gradientClassName).slice(0, 200),
      gradientColor1: asString(w?.gradientColor1).slice(0, 20) || "#27FF64",
      gradientColor2: asString(w?.gradientColor2).slice(0, 20) || "#27FF64",
      gradientColor3: asString(w?.gradientColor3).slice(0, 20) || "#A0FFBC",
      gradientColors: asString(w?.gradientColors).slice(0, 500) || "#27FF64,#27FF64,#A0FFBC",
      gradientAnimationSpeed: Math.max(0.1, Math.min(30, Number.isFinite(Number(w?.gradientAnimationSpeed)) ? Number(w?.gradientAnimationSpeed) : 8)),
      gradientShowBorder: typeof w?.gradientShowBorder === "boolean" ? w.gradientShowBorder : false,
      gradientDirection: asString(w?.gradientDirection).slice(0, 20) || "horizontal",
      gradientPauseOnHover: typeof w?.gradientPauseOnHover === "boolean" ? w.gradientPauseOnHover : false,
      gradientYoyo: typeof w?.gradientYoyo === "boolean" ? w.gradientYoyo : true,

      glitchClassName: asString(w?.glitchClassName).slice(0, 200),
      glitchSpeed: Math.max(0.1, Math.min(10, Number.isFinite(Number(w?.glitchSpeed)) ? Number(w?.glitchSpeed) : 0.5)),
      glitchEnableShadows: typeof w?.glitchEnableShadows === "boolean" ? w.glitchEnableShadows : true,
      glitchEnableOnHover: typeof w?.glitchEnableOnHover === "boolean" ? w.glitchEnableOnHover : false,

      blurClassName: asString(w?.blurClassName).slice(0, 200),
      blurDelay: Math.max(0, Math.min(2000, Number.isFinite(Number(w?.blurDelay)) ? Number(w?.blurDelay) : 200)),
      blurAnimateBy: asString(w?.blurAnimateBy).slice(0, 20) || "words",
      blurDirection: asString(w?.blurDirection).slice(0, 20) || "top",
      blurThreshold: Math.max(0, Math.min(1, Number.isFinite(Number(w?.blurThreshold)) ? Number(w?.blurThreshold) : 0.1)),
      blurRootMargin: asString(w?.blurRootMargin).slice(0, 40) || "0px",
      blurStepDuration: Math.max(0.05, Math.min(5, Number.isFinite(Number(w?.blurStepDuration)) ? Number(w?.blurStepDuration) : 0.35)),
      blurAnimationFromJson: asString(w?.blurAnimationFromJson).slice(0, 4000) || '{"filter":"blur(10px)","opacity":0,"y":-50}',
      blurAnimationToJson: asString(w?.blurAnimationToJson).slice(0, 8000) || '[{"filter":"blur(5px)","opacity":0.5,"y":5},{"filter":"blur(0px)","opacity":1,"y":0}]',

      splitClassName: asString(w?.splitClassName).slice(0, 200),
      splitDelay: Math.max(0, Math.min(1000, Number.isFinite(Number(w?.splitDelay)) ? Number(w?.splitDelay) : 50)),
      splitDuration: Math.max(0.05, Math.min(10, Number.isFinite(Number(w?.splitDuration)) ? Number(w?.splitDuration) : 1.25)),
      splitEase: asString(w?.splitEase).slice(0, 40) || "power3.out",
      splitType: asString(w?.splitType).slice(0, 40) || "chars",
      splitThreshold: Math.max(0, Math.min(1, Number.isFinite(Number(w?.splitThreshold)) ? Number(w?.splitThreshold) : 0.1)),
      splitRootMargin: asString(w?.splitRootMargin).slice(0, 40) || "-100px",
      splitTag: asString(w?.splitTag).slice(0, 10) || "p",
      splitTextAlign: asString(w?.splitTextAlign).slice(0, 20) || "center",
      splitFromJson: asString(w?.splitFromJson).slice(0, 2000) || '{"opacity":0,"y":40}',
      splitToJson: asString(w?.splitToJson).slice(0, 2000) || '{"opacity":1,"y":0}',

      textTypeClassName: asString(w?.textTypeClassName).slice(0, 200),
      textTypeShowCursor: typeof w?.textTypeShowCursor === "boolean" ? w.textTypeShowCursor : true,
      textTypeHideCursorWhileTyping: typeof w?.textTypeHideCursorWhileTyping === "boolean" ? w.textTypeHideCursorWhileTyping : false,
      textTypeCursorCharacter: asString(w?.textTypeCursorCharacter).slice(0, 4) || "_",
      textTypeCursorBlinkDuration: Math.max(0.1, Math.min(5, Number.isFinite(Number(w?.textTypeCursorBlinkDuration)) ? Number(w?.textTypeCursorBlinkDuration) : 0.5)),
      textTypeCursorClassName: asString(w?.textTypeCursorClassName).slice(0, 200),
      textTypeAs: asString(w?.textTypeAs).slice(0, 20) || "div",
      textTypeTypingSpeed: Math.max(1, Math.min(500, Number.isFinite(Number(w?.textTypeTypingSpeed)) ? Number(w?.textTypeTypingSpeed) : 75)),
      textTypeInitialDelay: Math.max(0, Math.min(10000, Number.isFinite(Number(w?.textTypeInitialDelay)) ? Number(w?.textTypeInitialDelay) : 0)),
      textTypePauseDuration: Math.max(0, Math.min(10000, Number.isFinite(Number(w?.textTypePauseDuration)) ? Number(w?.textTypePauseDuration) : 1500)),
      textTypeDeletingSpeed: Math.max(1, Math.min(500, Number.isFinite(Number(w?.textTypeDeletingSpeed)) ? Number(w?.textTypeDeletingSpeed) : 50)),
      textTypeLoop: typeof w?.textTypeLoop === "boolean" ? w.textTypeLoop : true,
      textTypeTextList: asString(w?.textTypeTextList).slice(0, 5000),
      textTypeColor1: asString(w?.textTypeColor1).slice(0, 20),
      textTypeColor2: asString(w?.textTypeColor2).slice(0, 20),
      textTypeColor3: asString(w?.textTypeColor3).slice(0, 20),
      textTypeTextColors: asString(w?.textTypeTextColors).slice(0, 1000),
      textTypeVariableSpeedEnabled: typeof w?.textTypeVariableSpeedEnabled === "boolean" ? w.textTypeVariableSpeedEnabled : false,
      textTypeVariableSpeedMin: Math.max(1, Math.min(500, Number.isFinite(Number(w?.textTypeVariableSpeedMin)) ? Number(w?.textTypeVariableSpeedMin) : 60)),
      textTypeVariableSpeedMax: Math.max(1, Math.min(500, Number.isFinite(Number(w?.textTypeVariableSpeedMax)) ? Number(w?.textTypeVariableSpeedMax) : 120)),
      textTypeStartOnVisible: typeof w?.textTypeStartOnVisible === "boolean" ? w.textTypeStartOnVisible : false,
      textTypeReverseMode: typeof w?.textTypeReverseMode === "boolean" ? w.textTypeReverseMode : false,

      rotatingTexts: asString(w?.rotatingTexts).slice(0, 5000) || "Build\nSomething\nMemorable",
      rotatingTransitionJson: asString(w?.rotatingTransitionJson).slice(0, 2000) || '{"type":"spring","damping":25,"stiffness":300}',
      rotatingInitialJson: asString(w?.rotatingInitialJson).slice(0, 2000) || '{"y":"100%","opacity":0}',
      rotatingAnimateJson: asString(w?.rotatingAnimateJson).slice(0, 2000) || '{"y":0,"opacity":1}',
      rotatingExitJson: asString(w?.rotatingExitJson).slice(0, 2000) || '{"y":"-120%","opacity":0}',
      rotatingAnimatePresenceMode: asString(w?.rotatingAnimatePresenceMode).slice(0, 10) || "wait",
      rotatingAnimatePresenceInitial: typeof w?.rotatingAnimatePresenceInitial === "boolean" ? w.rotatingAnimatePresenceInitial : false,
      rotatingRotationInterval: Math.max(100, Math.min(20000, Number.isFinite(Number(w?.rotatingRotationInterval)) ? Number(w?.rotatingRotationInterval) : 2000)),
      rotatingStaggerDuration: Math.max(0, Math.min(2, Number.isFinite(Number(w?.rotatingStaggerDuration)) ? Number(w?.rotatingStaggerDuration) : 0)),
      rotatingStaggerFrom: asString(w?.rotatingStaggerFrom).slice(0, 20) || "first",
      rotatingLoop: typeof w?.rotatingLoop === "boolean" ? w.rotatingLoop : true,
      rotatingAuto: typeof w?.rotatingAuto === "boolean" ? w.rotatingAuto : true,
      rotatingSplitBy: asString(w?.rotatingSplitBy).slice(0, 20) || "characters",
      rotatingMainClassName: asString(w?.rotatingMainClassName).slice(0, 200),
      rotatingSplitLevelClassName: asString(w?.rotatingSplitLevelClassName).slice(0, 200),
      rotatingElementLevelClassName: asString(w?.rotatingElementLevelClassName).slice(0, 200),

      variableLabel: asString(w?.variableLabel).slice(0, 500) || "Hover me!",
      variableFromFontVariationSettings: asString(w?.variableFromFontVariationSettings).slice(0, 200) || "'wght' 400, 'opsz' 9",
      variableToFontVariationSettings: asString(w?.variableToFontVariationSettings).slice(0, 200) || "'wght' 1000, 'opsz' 40",
      variableRadius: Math.max(1, Math.min(1000, Number.isFinite(Number(w?.variableRadius)) ? Number(w?.variableRadius) : 100)),
      variableFalloff: asString(w?.variableFalloff).slice(0, 20) || "linear",
      variableClassName: asString(w?.variableClassName).slice(0, 200),
      variableStyleJson: asString(w?.variableStyleJson).slice(0, 2000) || "{}",

      auroraColorStops: asString(w?.auroraColorStops).slice(0, 500) || "#7cff67,#171D22,#7cff67",
      auroraColorStop1: asString(w?.auroraColorStop1).slice(0, 20) || "#7cff67",
      auroraColorStop2: asString(w?.auroraColorStop2).slice(0, 20) || "#171D22",
      auroraColorStop3: asString(w?.auroraColorStop3).slice(0, 20) || "#7cff67",
      auroraAmplitude: Math.max(0, Math.min(5, Number.isFinite(Number(w?.auroraAmplitude)) ? Number(w?.auroraAmplitude) : 1)),
      auroraBlend: Math.max(0, Math.min(2, Number.isFinite(Number(w?.auroraBlend)) ? Number(w?.auroraBlend) : 0.5)),
      auroraTime: Number.isFinite(Number(w?.auroraTime)) ? Number(w?.auroraTime) : 0,
      auroraSpeed: Math.max(0, Math.min(10, Number.isFinite(Number(w?.auroraSpeed)) ? Number(w?.auroraSpeed) : 1)),
      auroraIntensity: Math.max(0, Math.min(5, Number.isFinite(Number(w?.auroraIntensity)) ? Number(w?.auroraIntensity) : 1)),
      auroraClassName: asString(w?.auroraClassName).slice(0, 200),
      auroraStyleJson: asString(w?.auroraStyleJson).slice(0, 2000) || "{}",

      colorBendsRotation: Number.isFinite(Number(w?.colorBendsRotation)) ? Number(w?.colorBendsRotation) : 45,
      colorBendsSpeed: Math.max(0, Math.min(10, Number.isFinite(Number(w?.colorBendsSpeed)) ? Number(w?.colorBendsSpeed) : 0.2)),
      colorBendsColor1: asString(w?.colorBendsColor1).slice(0, 20),
      colorBendsColor2: asString(w?.colorBendsColor2).slice(0, 20),
      colorBendsColor3: asString(w?.colorBendsColor3).slice(0, 20),
      colorBendsColors: asString(w?.colorBendsColors).slice(0, 1000),
      colorBendsTransparent: typeof w?.colorBendsTransparent === "boolean" ? w.colorBendsTransparent : true,
      colorBendsAutoRotate: Number.isFinite(Number(w?.colorBendsAutoRotate)) ? Number(w?.colorBendsAutoRotate) : 0,
      colorBendsScale: Math.max(0.01, Math.min(10, Number.isFinite(Number(w?.colorBendsScale)) ? Number(w?.colorBendsScale) : 1)),
      colorBendsFrequency: Math.max(0, Math.min(10, Number.isFinite(Number(w?.colorBendsFrequency)) ? Number(w?.colorBendsFrequency) : 1)),
      colorBendsWarpStrength: Math.max(0, Math.min(10, Number.isFinite(Number(w?.colorBendsWarpStrength)) ? Number(w?.colorBendsWarpStrength) : 1)),
      colorBendsMouseInfluence: Math.max(0, Math.min(10, Number.isFinite(Number(w?.colorBendsMouseInfluence)) ? Number(w?.colorBendsMouseInfluence) : 1)),
      colorBendsParallax: Math.max(0, Math.min(2, Number.isFinite(Number(w?.colorBendsParallax)) ? Number(w?.colorBendsParallax) : 0.5)),
      colorBendsNoise: Math.max(0, Math.min(1, Number.isFinite(Number(w?.colorBendsNoise)) ? Number(w?.colorBendsNoise) : 0.1)),
      colorBendsClassName: asString(w?.colorBendsClassName).slice(0, 200),
      colorBendsStyleJson: asString(w?.colorBendsStyleJson).slice(0, 2000) || "{}",

      darkVeilHueShift: Number.isFinite(Number(w?.darkVeilHueShift)) ? Number(w?.darkVeilHueShift) : 0,
      darkVeilNoiseIntensity: Math.max(0, Math.min(2, Number.isFinite(Number(w?.darkVeilNoiseIntensity)) ? Number(w?.darkVeilNoiseIntensity) : 0)),
      darkVeilScanlineIntensity: Math.max(0, Math.min(2, Number.isFinite(Number(w?.darkVeilScanlineIntensity)) ? Number(w?.darkVeilScanlineIntensity) : 0)),
      darkVeilSpeed: Math.max(0, Math.min(10, Number.isFinite(Number(w?.darkVeilSpeed)) ? Number(w?.darkVeilSpeed) : 0.5)),
      darkVeilScanlineFrequency: Math.max(0, Math.min(20, Number.isFinite(Number(w?.darkVeilScanlineFrequency)) ? Number(w?.darkVeilScanlineFrequency) : 0)),
      darkVeilWarpAmount: Math.max(0, Math.min(5, Number.isFinite(Number(w?.darkVeilWarpAmount)) ? Number(w?.darkVeilWarpAmount) : 0)),
      darkVeilResolutionScale: Math.max(0.1, Math.min(2, Number.isFinite(Number(w?.darkVeilResolutionScale)) ? Number(w?.darkVeilResolutionScale) : 1)),

      dotGridDotSize: Math.max(1, Math.min(64, Number.isFinite(Number(w?.dotGridDotSize)) ? Number(w?.dotGridDotSize) : 16)),
      dotGridGap: Math.max(1, Math.min(128, Number.isFinite(Number(w?.dotGridGap)) ? Number(w?.dotGridGap) : 32)),
      dotGridBaseColor: asString(w?.dotGridBaseColor).slice(0, 20) || "#27FF64",
      dotGridActiveColor: asString(w?.dotGridActiveColor).slice(0, 20) || "#27FF64",
      dotGridProximity: Math.max(1, Math.min(600, Number.isFinite(Number(w?.dotGridProximity)) ? Number(w?.dotGridProximity) : 150)),
      dotGridSpeedTrigger: Math.max(1, Math.min(10000, Number.isFinite(Number(w?.dotGridSpeedTrigger)) ? Number(w?.dotGridSpeedTrigger) : 100)),
      dotGridShockRadius: Math.max(1, Math.min(1000, Number.isFinite(Number(w?.dotGridShockRadius)) ? Number(w?.dotGridShockRadius) : 250)),
      dotGridShockStrength: Math.max(0, Math.min(20, Number.isFinite(Number(w?.dotGridShockStrength)) ? Number(w?.dotGridShockStrength) : 5)),
      dotGridMaxSpeed: Math.max(1, Math.min(20000, Number.isFinite(Number(w?.dotGridMaxSpeed)) ? Number(w?.dotGridMaxSpeed) : 5000)),
      dotGridResistance: Math.max(1, Math.min(5000, Number.isFinite(Number(w?.dotGridResistance)) ? Number(w?.dotGridResistance) : 750)),
      dotGridReturnDuration: Math.max(0, Math.min(10, Number.isFinite(Number(w?.dotGridReturnDuration)) ? Number(w?.dotGridReturnDuration) : 1.5)),
      dotGridClassName: asString(w?.dotGridClassName).slice(0, 200),
      dotGridStyleJson: asString(w?.dotGridStyleJson).slice(0, 2000) || "{}",

      grainientTimeSpeed: Math.max(0, Math.min(10, Number.isFinite(Number(w?.grainientTimeSpeed)) ? Number(w?.grainientTimeSpeed) : 0.5)),
      grainientColorBalance: Math.max(0, Math.min(1, Number.isFinite(Number(w?.grainientColorBalance)) ? Number(w?.grainientColorBalance) : 0.6)),
      grainientWarpStrength: Math.max(0, Math.min(2, Number.isFinite(Number(w?.grainientWarpStrength)) ? Number(w?.grainientWarpStrength) : 0.25)),
      grainientWarpFrequency: Math.max(0, Math.min(5, Number.isFinite(Number(w?.grainientWarpFrequency)) ? Number(w?.grainientWarpFrequency) : 0.5)),
      grainientWarpSpeed: Math.max(0, Math.min(5, Number.isFinite(Number(w?.grainientWarpSpeed)) ? Number(w?.grainientWarpSpeed) : 0.25)),
      grainientWarpAmplitude: Math.max(0, Math.min(2, Number.isFinite(Number(w?.grainientWarpAmplitude)) ? Number(w?.grainientWarpAmplitude) : 0.2)),
      grainientBlendAngle: Number.isFinite(Number(w?.grainientBlendAngle)) ? Number(w?.grainientBlendAngle) : 45,
      grainientBlendSoftness: Math.max(0, Math.min(1, Number.isFinite(Number(w?.grainientBlendSoftness)) ? Number(w?.grainientBlendSoftness) : 0.5)),
      grainientRotationAmount: Math.max(-2, Math.min(2, Number.isFinite(Number(w?.grainientRotationAmount)) ? Number(w?.grainientRotationAmount) : 0)),
      grainientNoiseScale: Math.max(0, Math.min(10, Number.isFinite(Number(w?.grainientNoiseScale)) ? Number(w?.grainientNoiseScale) : 1)),
      grainientGrainAmount: Math.max(0, Math.min(1, Number.isFinite(Number(w?.grainientGrainAmount)) ? Number(w?.grainientGrainAmount) : 0.2)),
      grainientGrainScale: Math.max(0.01, Math.min(5, Number.isFinite(Number(w?.grainientGrainScale)) ? Number(w?.grainientGrainScale) : 1.5)),
      grainientGrainAnimated: typeof w?.grainientGrainAnimated === "boolean" ? w.grainientGrainAnimated : true,
      grainientContrast: Math.max(0, Math.min(4, Number.isFinite(Number(w?.grainientContrast)) ? Number(w?.grainientContrast) : 1)),
      grainientGamma: Math.max(0.1, Math.min(4, Number.isFinite(Number(w?.grainientGamma)) ? Number(w?.grainientGamma) : 1)),
      grainientSaturation: Math.max(0, Math.min(4, Number.isFinite(Number(w?.grainientSaturation)) ? Number(w?.grainientSaturation) : 1)),
      grainientCenterX: Math.max(0, Math.min(1, Number.isFinite(Number(w?.grainientCenterX)) ? Number(w?.grainientCenterX) : 0.5)),
      grainientCenterY: Math.max(0, Math.min(1, Number.isFinite(Number(w?.grainientCenterY)) ? Number(w?.grainientCenterY) : 0.5)),
      grainientZoom: Math.max(0.1, Math.min(4, Number.isFinite(Number(w?.grainientZoom)) ? Number(w?.grainientZoom) : 1)),
      grainientColor1: asString(w?.grainientColor1).slice(0, 20) || "#ff7b7b",
      grainientColor2: asString(w?.grainientColor2).slice(0, 20) || "#7bb8ff",
      grainientColor3: asString(w?.grainientColor3).slice(0, 20) || "#7bffb0",
      grainientClassName: asString(w?.grainientClassName).slice(0, 200),

      iridescenceBaseColor: asString(w?.iridescenceBaseColor).slice(0, 20) || "#ffffff",
      iridescenceColor: asString(w?.iridescenceColor).slice(0, 100) || "1,1,1",
      iridescenceSpeed: Math.max(0, Math.min(10, Number.isFinite(Number(w?.iridescenceSpeed)) ? Number(w?.iridescenceSpeed) : 1)),
      iridescenceAmplitude: Math.max(0, Math.min(2, Number.isFinite(Number(w?.iridescenceAmplitude)) ? Number(w?.iridescenceAmplitude) : 0.1)),
      iridescenceMouseReact: typeof w?.iridescenceMouseReact === "boolean" ? w.iridescenceMouseReact : true,

      lightningHue: Math.max(0, Math.min(360, Number.isFinite(Number(w?.lightningHue)) ? Number(w?.lightningHue) : 220)),
      lightningXOffset: Math.max(-2, Math.min(2, Number.isFinite(Number(w?.lightningXOffset)) ? Number(w?.lightningXOffset) : 0)),
      lightningSpeed: Math.max(0, Math.min(2, Number.isFinite(Number(w?.lightningSpeed)) ? Number(w?.lightningSpeed) : 1)),
      lightningIntensity: Math.max(0, Math.min(5, Number.isFinite(Number(w?.lightningIntensity)) ? Number(w?.lightningIntensity) : 1)),
      lightningSize: Math.max(0, Math.min(5, Number.isFinite(Number(w?.lightningSize)) ? Number(w?.lightningSize) : 1)),

      liquidEtherMouseForce: Math.max(0, Math.min(100, Number.isFinite(Number(w?.liquidEtherMouseForce)) ? Number(w?.liquidEtherMouseForce) : 20)),
      liquidEtherCursorSize: Math.max(1, Math.min(200, Number.isFinite(Number(w?.liquidEtherCursorSize)) ? Number(w?.liquidEtherCursorSize) : 100)),
      liquidEtherIsViscous: typeof w?.liquidEtherIsViscous === "boolean" ? w.liquidEtherIsViscous : true,
      liquidEtherViscous: Math.max(0, Math.min(200, Number.isFinite(Number(w?.liquidEtherViscous)) ? Number(w?.liquidEtherViscous) : 30)),
      liquidEtherIterationsViscous: Math.max(1, Math.min(128, Number.isFinite(Number(w?.liquidEtherIterationsViscous)) ? Number(w?.liquidEtherIterationsViscous) : 32)),
      liquidEtherIterationsPoisson: Math.max(1, Math.min(128, Number.isFinite(Number(w?.liquidEtherIterationsPoisson)) ? Number(w?.liquidEtherIterationsPoisson) : 32)),
      liquidEtherDt: Math.max(0.001, Math.min(2, Number.isFinite(Number(w?.liquidEtherDt)) ? Number(w?.liquidEtherDt) : 0.016)),
      liquidEtherBFECC: typeof w?.liquidEtherBFECC === "boolean" ? w.liquidEtherBFECC : true,
      liquidEtherResolution: Math.max(0.1, Math.min(3, Number.isFinite(Number(w?.liquidEtherResolution)) ? Number(w?.liquidEtherResolution) : 1)),
      liquidEtherIsBounce: asBool(w?.liquidEtherIsBounce),
      liquidEtherColor1: asString(w?.liquidEtherColor1).slice(0, 20) || "#5227ff",
      liquidEtherColor2: asString(w?.liquidEtherColor2).slice(0, 20) || "#27c1ff",
      liquidEtherColor3: asString(w?.liquidEtherColor3).slice(0, 20) || "#7cff67",
      liquidEtherColors: asString(w?.liquidEtherColors).slice(0, 1000) || "#5227ff,#27c1ff,#7cff67",
      liquidEtherStyleJson: asString(w?.liquidEtherStyleJson).slice(0, 2000) || "{}",
      liquidEtherClassName: asString(w?.liquidEtherClassName).slice(0, 200),
      liquidEtherAutoDemo: typeof w?.liquidEtherAutoDemo === "boolean" ? w.liquidEtherAutoDemo : true,
      liquidEtherAutoSpeed: Math.max(0, Math.min(5, Number.isFinite(Number(w?.liquidEtherAutoSpeed)) ? Number(w?.liquidEtherAutoSpeed) : 1)),
      liquidEtherAutoIntensity: Math.max(0, Math.min(5, Number.isFinite(Number(w?.liquidEtherAutoIntensity)) ? Number(w?.liquidEtherAutoIntensity) : 1)),
      liquidEtherTakeoverDuration: Math.max(0, Math.min(10, Number.isFinite(Number(w?.liquidEtherTakeoverDuration)) ? Number(w?.liquidEtherTakeoverDuration) : 0.4)),
      liquidEtherAutoResumeDelay: Math.max(0, Math.min(30, Number.isFinite(Number(w?.liquidEtherAutoResumeDelay)) ? Number(w?.liquidEtherAutoResumeDelay) : 1.5)),
      liquidEtherAutoRampDuration: Math.max(0, Math.min(10, Number.isFinite(Number(w?.liquidEtherAutoRampDuration)) ? Number(w?.liquidEtherAutoRampDuration) : 0.6)),

      orbHue: Math.max(0, Math.min(360, Number.isFinite(Number(w?.orbHue)) ? Number(w?.orbHue) : 0)),
      orbHoverIntensity: Math.max(0, Math.min(1, Number.isFinite(Number(w?.orbHoverIntensity)) ? Number(w?.orbHoverIntensity) : 0.2)),
      orbRotateOnHover: typeof w?.orbRotateOnHover === "boolean" ? w.orbRotateOnHover : true,
      orbForceHoverState: asBool(w?.orbForceHoverState),

      particlesParticleCount: Math.max(1, Math.min(2000, Number.isFinite(Number(w?.particlesParticleCount)) ? Number(w?.particlesParticleCount) : 200)),
      particlesParticleSpread: Math.max(1, Math.min(30, Number.isFinite(Number(w?.particlesParticleSpread)) ? Number(w?.particlesParticleSpread) : 8)),
      particlesSpeed: Math.max(0, Math.min(5, Number.isFinite(Number(w?.particlesSpeed)) ? Number(w?.particlesSpeed) : 0.1)),
      particlesColor1: asString(w?.particlesColor1).slice(0, 20) || "#ffffff",
      particlesColor2: asString(w?.particlesColor2).slice(0, 20) || "#cfe8ff",
      particlesColor3: asString(w?.particlesColor3).slice(0, 20) || "#9dd1ff",
      particlesParticleColors: asString(w?.particlesParticleColors).slice(0, 1000) || "#ffffff,#cfe8ff,#9dd1ff",
      particlesMoveParticlesOnHover: typeof w?.particlesMoveParticlesOnHover === "boolean" ? w.particlesMoveParticlesOnHover : true,
      particlesParticleHoverFactor: Math.max(0, Math.min(10, Number.isFinite(Number(w?.particlesParticleHoverFactor)) ? Number(w?.particlesParticleHoverFactor) : 1)),
      particlesAlphaParticles: typeof w?.particlesAlphaParticles === "boolean" ? w.particlesAlphaParticles : true,
      particlesParticleBaseSize: Math.max(1, Math.min(500, Number.isFinite(Number(w?.particlesParticleBaseSize)) ? Number(w?.particlesParticleBaseSize) : 100)),
      particlesSizeRandomness: Math.max(0, Math.min(5, Number.isFinite(Number(w?.particlesSizeRandomness)) ? Number(w?.particlesSizeRandomness) : 1)),
      particlesCameraDistance: Math.max(1, Math.min(50, Number.isFinite(Number(w?.particlesCameraDistance)) ? Number(w?.particlesCameraDistance) : 20)),
      particlesDisableRotation: asBool(w?.particlesDisableRotation),
      particlesClassName: asString(w?.particlesClassName).slice(0, 200),

      prismaticBurstIntensity: Math.max(0, Math.min(10, Number.isFinite(Number(w?.prismaticBurstIntensity)) ? Number(w?.prismaticBurstIntensity) : 2)),
      prismaticBurstSpeed: Math.max(0, Math.min(10, Number.isFinite(Number(w?.prismaticBurstSpeed)) ? Number(w?.prismaticBurstSpeed) : 0.5)),
      prismaticBurstAnimationType: asString(w?.prismaticBurstAnimationType).slice(0, 20) || "rotate3d",
      prismaticBurstColor1: asString(w?.prismaticBurstColor1).slice(0, 20),
      prismaticBurstColor2: asString(w?.prismaticBurstColor2).slice(0, 20),
      prismaticBurstColor3: asString(w?.prismaticBurstColor3).slice(0, 20),
      prismaticBurstColors: asString(w?.prismaticBurstColors).slice(0, 1000),
      prismaticBurstDistort: Math.max(0, Math.min(50, Number.isFinite(Number(w?.prismaticBurstDistort)) ? Number(w?.prismaticBurstDistort) : 0)),
      prismaticBurstPaused: asBool(w?.prismaticBurstPaused),
      prismaticBurstOffsetX: asString(w?.prismaticBurstOffsetX).slice(0, 40) || "0",
      prismaticBurstOffsetY: asString(w?.prismaticBurstOffsetY).slice(0, 40) || "0",
      prismaticBurstHoverDampness: Math.max(0, Math.min(1, Number.isFinite(Number(w?.prismaticBurstHoverDampness)) ? Number(w?.prismaticBurstHoverDampness) : 0)),
      prismaticBurstRayCount: Math.max(0, Math.min(256, Number.isFinite(Number(w?.prismaticBurstRayCount)) ? Number(w?.prismaticBurstRayCount) : 0)),
      prismaticBurstMixBlendMode: asString(w?.prismaticBurstMixBlendMode).slice(0, 40) || "lighten",

      silkSpeed: Math.max(0, Math.min(20, Number.isFinite(Number(w?.silkSpeed)) ? Number(w?.silkSpeed) : 5)),
      silkScale: Math.max(0.1, Math.min(10, Number.isFinite(Number(w?.silkScale)) ? Number(w?.silkScale) : 1)),
      silkColor: asString(w?.silkColor).slice(0, 20) || "#ffffff",
      silkNoiseIntensity: Math.max(0, Math.min(5, Number.isFinite(Number(w?.silkNoiseIntensity)) ? Number(w?.silkNoiseIntensity) : 1)),
      silkRotation: Number.isFinite(Number(w?.silkRotation)) ? Number(w?.silkRotation) : 0,
      silkClassName: asString(w?.silkClassName).slice(0, 200),
      silkStyleJson: asString(w?.silkStyleJson).slice(0, 2000) || "{}",
    }))
    .filter((w: WidgetItem) => !!w.id)
    .slice(0, 40);
  widgetsCol.items = widgets;

  // Socials (layout-provided collection)
  const socialsCol = sanitizeCollectionMeta(rawCollections.socials, defaultCollection(true));

  const collections: Record<string, ContentCollection> = {
    socials: socialsCol,
    links: linksCol,
    gallery: galleryCol,
    resume: resumeCol,
    blog: blogCol,
    embeds: embedsCol,
    widgets: widgetsCol,
    newsletter: newsletterCol,
  };

  // Also preserve any extra collections from other layouts
  for (const [key, val] of Object.entries(rawCollections as Record<string, unknown>)) {
    if (!collections[key]) {
      collections[key] = sanitizeCollectionMeta(val, defaultCollection());
    }
  }

  const theme = sanitizeTheme(obj.theme, defaultTheme());

  // Sanitize per-layout theme storage
  const layoutThemesRaw = obj.layoutThemes && typeof obj.layoutThemes === "object" ? obj.layoutThemes : {};
  const layoutDefaults: Record<string, () => BioTheme> = { default: defaultTheme };
  const layoutThemes: Record<string, BioTheme> = {};
  for (const [key, factory] of Object.entries(layoutDefaults)) {
    layoutThemes[key] = sanitizeTheme((layoutThemesRaw as any)[key], factory());
  }
  for (const [key, val] of Object.entries(layoutThemesRaw as Record<string, unknown>)) {
    if (!layoutThemes[key]) layoutThemes[key] = sanitizeTheme(val, defaultTheme());
  }
  // Keep layoutThemes in sync with active theme
  layoutThemes[theme.layout] = { ...theme };

  const scriptsRaw = obj.scripts && typeof obj.scripts === "object" ? obj.scripts : {};
  const scripts: BioScripts = {
    headScript: asString(scriptsRaw.headScript).slice(0, 10000),
    bodyEndScript: asString(scriptsRaw.bodyEndScript).slice(0, 10000),
  };

  return { schemaVersion: CURRENT_SCHEMA_VERSION, profile, collections, theme, layoutThemes, scripts };
};

export const stableStringify = (model: BioModel) => JSON.stringify(model, null, 2);