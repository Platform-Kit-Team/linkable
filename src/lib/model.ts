// Injected at build time by Vite `define` — see vite.config.ts
declare const __PK_EXTERNAL_COLLECTIONS__: string[] | undefined;

/** @deprecated Import from src/themes/bento/collection-types instead — link is theme-level data */
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

/** @deprecated Import from src/themes/bento/collection-types instead — social is theme-level data */
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

/** @deprecated Import from src/themes/bento/resume-types instead — resume is theme-level data */
export type EducationEntry = {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
};

/** @deprecated Import from src/themes/bento/resume-types instead — resume is theme-level data */
export type EmploymentEntry = {
  id: string;
  company: string;
  role: string;
  description: string;
  startYear: string;
  endYear: string;
};

/** @deprecated Import from src/themes/bento/resume-types instead — resume is theme-level data */
export type AchievementEntry = {
  id: string;
  title: string;
  issuer: string;
  year: string;
  description: string;
};

/** @deprecated Import from src/themes/bento/resume-types instead — resume is theme-level data */
export type ResumeData = {
  bio: string;
  education: EducationEntry[];
  employment: EmploymentEntry[];
  skills: string[];
  achievements: AchievementEntry[];
};

/** @deprecated Use ResumeData instead — enabled flag now lives on ContentCollection */
export type BioResume = ResumeData & { enabled?: boolean };

/** @deprecated Import from src/themes/bento/collection-types instead */
export type GalleryItemType = "image" | "video";

/** @deprecated Import from src/themes/bento/collection-types instead */
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
  fontFamily: string;
  fontWeight: string;
  letterSpacing: string;
  layoutVars: Record<string, string>;
  layoutData: Record<string, unknown>;
};

/** @deprecated Blog is now a ContentCollection — use model.collections.blog */
export type BioBlog = {
  enabled: boolean;
};

/** @deprecated Import from src/themes/bento/collection-types instead */
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
  letterSpacing: string;
};

/** @deprecated Import from src/themes/bento/collection-types instead */
export type WidgetType = "animated-text";

/** @deprecated Import from src/themes/bento/collection-types instead */
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
  letterSpacing: string;
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

/** @deprecated Import from src/themes/bento/collection-types instead */
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

/** @deprecated Import from src/themes/bento/collection-types instead */
export const newSocial = (): SocialLink => ({
  id: newId(),
  icon: "Globe",
  label: "",
  url: "",
  enabled: false,
});

/** @deprecated Import from src/themes/bento/resume-types instead */
export const newEducation = (): EducationEntry => ({
  id: newId(),
  institution: "",
  degree: "",
  field: "",
  startYear: "",
  endYear: "",
});

/** @deprecated Import from src/themes/bento/resume-types instead */
export const newEmployment = (): EmploymentEntry => ({
  id: newId(),
  company: "",
  role: "",
  description: "",
  startYear: "",
  endYear: "",
});

/** @deprecated Import from src/themes/bento/resume-types instead */
export const newAchievement = (): AchievementEntry => ({
  id: newId(),
  title: "",
  issuer: "",
  year: "",
  description: "",
});

/** @deprecated Import from src/themes/bento/resume-types instead */
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

/** @deprecated Import from src/themes/bento/collection-types instead */
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
  fontFamily: "",
  fontWeight: "",
  letterSpacing: "",
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
  fontFamily: "",
  fontWeight: "",
  letterSpacing: "",
  layoutVars: {},
  layoutData: {},
});

export const THEME_PRESETS: Record<string, () => BioTheme> = {
  light: defaultTheme,
  dark: darkTheme,
};

/** @deprecated Import from src/themes/bento/collection-types instead */
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
});

/** @deprecated Import from src/themes/bento/collection-types instead */
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
    displayName: "PlatformKit",
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
    },
    blog: { ...defaultCollection(), label: "Blog", icon: "BookOpen" },
    embeds: { ...defaultCollection(true), label: "Embeds", icon: "Code" },
    widgets: defaultCollection(),
    newsletter: { ...defaultCollection(), label: "Newsletter", icon: "Mail" },
    voice: { ...defaultCollection(), label: "Voice", icon: "Microphone" },
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
    const allowed = ["http:", "https:", "mailto:", "tel:", "sms:", "ftp:", "ftps:", "webcal:", "geo:"];
    if (allowed.includes(u.protocol)) return u.toString();
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
    fontFamily: asString(t.fontFamily).slice(0, 120),
    fontWeight: asString(t.fontWeight).slice(0, 10),
    letterSpacing: asString(t.letterSpacing).slice(0, 20),
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

  // Links — generic passthrough (schema owned by theme)
  // All collections are sanitized via a data-driven loop. The only
  // per-key variance is the default `enabled` value and whether the
  // collection is externally managed (items emptied).
  const enabledByDefault: Record<string, boolean> = {
    socials: true,
    links: true,
    embeds: true,
  };

  // External collections have their items[] emptied — the real data
  // lives in markdown files / Supabase / etc.
  // At build time, Vite injects this list via `define`; at runtime we
  // fall back to the hard default.
  const externalKeys: ReadonlySet<string> =
    typeof __PK_EXTERNAL_COLLECTIONS__ !== "undefined"
      ? new Set(__PK_EXTERNAL_COLLECTIONS__)
      : new Set(["blog", "newsletter"]);

  const allKeys = new Set([
    ...Object.keys(enabledByDefault),
    ...Object.keys(rawCollections as Record<string, unknown>),
    // Ensure well-known keys always exist even when absent from raw data
    "gallery", "resume", "blog", "widgets", "newsletter",
  ]);

  const collections: Record<string, ContentCollection> = {};
  for (const key of allKeys) {
    const enabled = enabledByDefault[key] ?? false;
    collections[key] = sanitizeCollectionMeta(
      (rawCollections as Record<string, unknown>)[key],
      defaultCollection(enabled),
    );
    if (externalKeys.has(key)) {
      collections[key].items = [];
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