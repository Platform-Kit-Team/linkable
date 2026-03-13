import type { PlatformKitConfig } from "../../lib/config";
import { createTtsHook } from "./build-hooks/tts-hook";
import { createImageOptimizeHook } from "./build-hooks/image-optimize-hook";
import routes from "./routes-manifest";
import type { FormKitSchemaNode } from "@formkit/core";
import type { ThemeConfig } from "../../lib/model";
import { newLink, newGalleryItem, newEmbed, newSocial, newWidget } from "./collection-types";

/* ── Theme presets ──────────────────────────────────────────────── */

const bentoLightTheme = (): ThemeConfig => ({
  layout: "bento",
  preset: "light",
  colorBrand: "#6366f1",
  colorBrandStrong: "#4f46e5",
  colorAccent: "#f59e0b",
  colorInk: "#1a1a2e",
  colorInkSoft: "rgba(26, 26, 46, 0.5)",
  bg: "#f5f5f7",
  glass: "rgba(255, 255, 255, 0.95)",
  glass2: "rgba(255, 255, 255, 0.7)",
  glassStrong: "#ffffff",
  colorBorder: "rgba(0, 0, 0, 0.04)",
  colorBorder2: "rgba(0, 0, 0, 0.04)",
  cardBg: "#ffffff",
  cardBorder: "transparent",
  cardText: "#1a1a2e",
  radiusXl: "1.5rem",
  radiusLg: "1.25rem",
  layoutVars: {},
  layoutData: {},
});



/* ── FormKit schemas for item editing ───────────────────────────── */

const linkItemSchema: FormKitSchemaNode[] = [
  { $formkit: "text", name: "title", label: "Title", placeholder: "Link title" },
  { $formkit: "text", name: "subtitle", label: "Description", placeholder: "Short helper text…" },
  { $formkit: "url", name: "url", label: "URL", placeholder: "https://…" },
  { $formkit: "imageUpload", name: "imageUrl", label: "Image" },
  { $formkit: "tagList", name: "tags", label: "Tags" },
  { $formkit: "date", name: "publishDate", label: "Publish date" },
  { $formkit: "date", name: "expirationDate", label: "Expiration date" },
];

function galleryItemSchema(item: Record<string, unknown>): FormKitSchemaNode[] {
  const isVideo = item.type === "video";
  return [
    { $formkit: "select", name: "type", label: "Type", options: [
      { label: "Image", value: "image" },
      { label: "Video", value: "video" },
    ]},
    { $formkit: "text", name: "title", label: "Title", placeholder: "Give it a name…" },
    { $formkit: "textarea", name: "description", label: "Description", placeholder: "Optional caption…" },
    ...(isVideo
      ? [{ $formkit: "url", name: "src", label: "Source URL", placeholder: "https://youtube.com/…" }]
      : [{ $formkit: "imageUpload", name: "src", label: "Source" }]
    ),
    { $formkit: "imageUpload", name: "coverUrl", label: "Cover image" },
    { $formkit: "tagList", name: "tags", label: "Tags" },
    { $formkit: "date", name: "publishDate", label: "Publish date" },
    { $formkit: "date", name: "expirationDate", label: "Expiration date" },
  ] as FormKitSchemaNode[];
}

const socialItemSchema: FormKitSchemaNode[] = [
  { $formkit: "iconSelect", name: "icon", label: "Icon" },
  { $formkit: "text", name: "label", label: "Label", placeholder: "e.g. @yourname" },
  { $formkit: "url", name: "url", label: "URL", placeholder: "https://…" },
];

const embedItemSchema: FormKitSchemaNode[] = [
  { $formkit: "text", name: "label", label: "Tab label", placeholder: "e.g. Book a Call" },
  { $formkit: "iconSelect", name: "icon", label: "Icon" },
  { $formkit: "textarea", name: "html", label: "Embed HTML or URL", placeholder: "Paste embed code or a URL…" },
  { $formkit: "number", name: "fontSize", label: "Font size (px)", min: 10, max: 120, step: 1 },
  { $formkit: "number", name: "lineHeight", label: "Line height", min: 0.8, max: 3, step: 0.01 },
  { $formkit: "number", name: "kerning", label: "Kerning (letter spacing, px)", min: -5, max: 20, step: 0.1 },
  { $formkit: "date", name: "publishDate", label: "Publish date" },
  { $formkit: "date", name: "expirationDate", label: "Expiration date" },
];

const makeAccordion = (title: string, fields: FormKitSchemaNode[], open = false): FormKitSchemaNode => ({
  $el: "details",
  attrs: {
    class: "mb-3 rounded-xl border border-black/10 bg-white/70 p-3",
    ...(open ? { open: true } : {}),
  },
  children: [
    {
      $el: "summary",
      attrs: {
        class: "cursor-pointer select-none text-xs font-extrabold uppercase tracking-wide text-[color:var(--color-ink)]",
      },
      children: title,
    },
    {
      $el: "div",
      attrs: { class: "mt-3" },
      children: fields,
    },
  ],
}) as unknown as FormKitSchemaNode;

const widgetCoreSchema: FormKitSchemaNode[] = [
  {
    $formkit: "select",
    name: "type",
    label: "Widget type",
    options: [{ label: "Animated Text", value: "animated-text" }],
  },
  { $formkit: "textarea", name: "text", label: "Text", placeholder: "Your headline text..." },
  {
    $formkit: "select",
    name: "textVariant",
    label: "Text animation variant",
    options: [
      { label: "Shiny Text", value: "shiny-text" },
      { label: "Gradient Text", value: "gradient-text" },
      { label: "Glitch Text", value: "glitch-text" },
      { label: "Blur Text", value: "blur-text" },
      { label: "Split Text", value: "split-text" },
      { label: "Text Type", value: "text-type" },
      { label: "Rotating Text", value: "rotating-text" },
      { label: "Variable Proximity", value: "variable-proximity" },
    ],
  },
  { $formkit: "color", name: "buttonColor", label: "Button color" },
  { $formkit: "color", name: "buttonTextColor", label: "Button text color" },
  { $formkit: "text", name: "buttonLabel", label: "Button label", placeholder: "Optional" },
  { $formkit: "url", name: "buttonUrl", label: "Button URL", placeholder: "https://... (optional)" },
];

const widgetTextBaseSchema: FormKitSchemaNode[] = [
  { $formkit: "color", name: "textColor", label: "Text color" },
  { $formkit: "number", name: "fontSize", label: "Font size (px)", min: 10, max: 120, step: 1 },
  { $formkit: "number", name: "lineHeight", label: "Line height", min: 0.8, max: 3, step: 0.01 },
  { $formkit: "number", name: "kerning", label: "Kerning (letter spacing, px)", min: -5, max: 20, step: 0.1 },
  { $formkit: "number", name: "textPresetSpeed", label: "Text preset speed", min: 0.1, max: 4, step: 0.1 },
  { $formkit: "number", name: "textPresetIntensity", label: "Text preset intensity", min: 0.1, max: 3, step: 0.1 },
  { $formkit: "checkbox", name: "pauseOnHover", label: "Pause CSS-driven variants on hover" },
];

const widgetBackgroundBaseSchema: FormKitSchemaNode[] = [
  {
    $formkit: "select",
    name: "backgroundVariant",
    label: "Background",
    options: [
      { label: "Aurora", value: "aurora" },
      { label: "Color Bends", value: "color-bends" },
      { label: "Dark Veil", value: "dark-veil" },
      { label: "Dot Grid", value: "dot-grid" },
      { label: "Grainient", value: "grainient" },
      { label: "Iridescence", value: "iridescence" },
      { label: "Lightning", value: "lightning" },
      { label: "Liquid Ether", value: "liquid-ether" },
      { label: "Orb", value: "orb" },
      { label: "Particles", value: "particles" },
      { label: "Prismatic Burst", value: "prismatic-burst" },
      { label: "Silk", value: "silk" },
    ],
  },
  { $formkit: "color", name: "backgroundColor", label: "Background color override" },
  { $formkit: "number", name: "backgroundPresetSpeed", label: "Background preset speed", min: 0.1, max: 4, step: 0.1 },
  { $formkit: "number", name: "backgroundPresetIntensity", label: "Background preset intensity", min: 0.1, max: 3, step: 0.1 },
  { $formkit: "number", name: "backgroundPresetScale", label: "Background preset scale", min: 0.5, max: 2, step: 0.1 },
];

const widgetVariantSchemas: Record<string, FormKitSchemaNode[]> = {
  "shiny-text": [
    { $formkit: "checkbox", name: "shinyDisabled", label: "Disabled" },
    { $formkit: "number", name: "shinySpeed", label: "Speed (seconds)", min: 0.1, max: 20, step: 0.1 },
    { $formkit: "number", name: "shinyDelay", label: "Delay (seconds)", min: 0, max: 10, step: 0.1 },
    { $formkit: "number", name: "shinySpread", label: "Spread (degrees)", min: 0, max: 180, step: 1 },
    { $formkit: "select", name: "shinyDirection", label: "Direction", options: [{ label: "Left", value: "left" }, { label: "Right", value: "right" }] },
    { $formkit: "checkbox", name: "shinyYoyo", label: "Yoyo" },
    { $formkit: "checkbox", name: "shinyPauseOnHover", label: "Pause on hover" },
    { $formkit: "color", name: "shinyColor", label: "Base color" },
    { $formkit: "color", name: "shinyShineColor", label: "Shine color" },
    { $formkit: "text", name: "shinyClassName", label: "Class name" },
  ],
  "gradient-text": [
    { $formkit: "color", name: "gradientColor1", label: "Color 1" },
    { $formkit: "color", name: "gradientColor2", label: "Color 2" },
    { $formkit: "color", name: "gradientColor3", label: "Color 3" },
    { $formkit: "text", name: "gradientColors", label: "Advanced colors CSV (optional override)", placeholder: "#27FF64,#27FF64,#A0FFBC" },
    { $formkit: "number", name: "gradientAnimationSpeed", label: "Animation speed", min: 0.1, max: 30, step: 0.1 },
    { $formkit: "select", name: "gradientDirection", label: "Direction", options: [{ label: "Horizontal", value: "horizontal" }, { label: "Vertical", value: "vertical" }, { label: "Diagonal", value: "diagonal" }] },
    { $formkit: "checkbox", name: "gradientPauseOnHover", label: "Pause on hover" },
    { $formkit: "checkbox", name: "gradientYoyo", label: "Yoyo" },
    { $formkit: "checkbox", name: "gradientShowBorder", label: "Show border" },
    { $formkit: "text", name: "gradientClassName", label: "Class name" },
  ],
  "glitch-text": [
    { $formkit: "number", name: "glitchSpeed", label: "Refresh delay", min: 0.1, max: 10, step: 0.1 },
    { $formkit: "checkbox", name: "glitchEnableShadows", label: "Glitch colors (shadows)" },
    { $formkit: "checkbox", name: "glitchEnableOnHover", label: "Glitch on hover" },
    { $formkit: "text", name: "glitchClassName", label: "Class name" },
  ],
  "blur-text": [
    { $formkit: "number", name: "blurDelay", label: "Delay (ms)", min: 0, max: 2000, step: 10 },
    { $formkit: "select", name: "blurAnimateBy", label: "Animate by", options: [{ label: "Words", value: "words" }, { label: "Letters", value: "letters" }] },
    { $formkit: "select", name: "blurDirection", label: "Direction", options: [{ label: "Top", value: "top" }, { label: "Bottom", value: "bottom" }] },
    { $formkit: "number", name: "blurThreshold", label: "Threshold", min: 0, max: 1, step: 0.01 },
    { $formkit: "text", name: "blurRootMargin", label: "Root margin" },
    { $formkit: "number", name: "blurStepDuration", label: "Step duration", min: 0.05, max: 5, step: 0.01 },
    { $formkit: "textarea", name: "blurAnimationFromJson", label: "Animation from JSON" },
    { $formkit: "textarea", name: "blurAnimationToJson", label: "Animation to JSON" },
    { $formkit: "text", name: "blurClassName", label: "Class name" },
  ],
  "split-text": [
    { $formkit: "number", name: "splitDelay", label: "Stagger delay (ms)", min: 0, max: 1000, step: 1 },
    { $formkit: "number", name: "splitDuration", label: "Duration", min: 0.05, max: 10, step: 0.05 },
    { $formkit: "text", name: "splitEase", label: "Ease" },
    { $formkit: "select", name: "splitType", label: "Split type", options: [{ label: "Chars", value: "chars" }, { label: "Words", value: "words" }, { label: "Lines", value: "lines" }] },
    { $formkit: "number", name: "splitThreshold", label: "Threshold", min: 0, max: 1, step: 0.01 },
    { $formkit: "text", name: "splitRootMargin", label: "Root margin" },
    { $formkit: "select", name: "splitTag", label: "Tag", options: [{ label: "p", value: "p" }, { label: "span", value: "span" }, { label: "h1", value: "h1" }, { label: "h2", value: "h2" }, { label: "h3", value: "h3" }] },
    { $formkit: "select", name: "splitTextAlign", label: "Text align", options: [{ label: "Left", value: "left" }, { label: "Center", value: "center" }, { label: "Right", value: "right" }] },
    { $formkit: "textarea", name: "splitFromJson", label: "From JSON" },
    { $formkit: "textarea", name: "splitToJson", label: "To JSON" },
    { $formkit: "text", name: "splitClassName", label: "Class name" },
  ],
  "text-type": [
    { $formkit: "text", name: "textTypeTextList", label: "Text lines (one per line)" },
    { $formkit: "color", name: "textTypeColor1", label: "Text color 1" },
    { $formkit: "color", name: "textTypeColor2", label: "Text color 2" },
    { $formkit: "color", name: "textTypeColor3", label: "Text color 3" },
    { $formkit: "text", name: "textTypeTextColors", label: "Advanced text colors CSV (optional override)" },
    { $formkit: "checkbox", name: "textTypeShowCursor", label: "Show cursor" },
    { $formkit: "checkbox", name: "textTypeHideCursorWhileTyping", label: "Hide cursor while typing" },
    { $formkit: "text", name: "textTypeCursorCharacter", label: "Cursor character" },
    { $formkit: "number", name: "textTypeCursorBlinkDuration", label: "Cursor blink duration", min: 0.1, max: 5, step: 0.1 },
    { $formkit: "text", name: "textTypeCursorClassName", label: "Cursor class name" },
    { $formkit: "select", name: "textTypeAs", label: "Tag", options: [{ label: "div", value: "div" }, { label: "p", value: "p" }, { label: "span", value: "span" }] },
    { $formkit: "number", name: "textTypeTypingSpeed", label: "Typing speed", min: 1, max: 500, step: 1 },
    { $formkit: "number", name: "textTypeInitialDelay", label: "Initial delay", min: 0, max: 10000, step: 10 },
    { $formkit: "number", name: "textTypePauseDuration", label: "Pause duration", min: 0, max: 10000, step: 10 },
    { $formkit: "number", name: "textTypeDeletingSpeed", label: "Deleting speed", min: 1, max: 500, step: 1 },
    { $formkit: "checkbox", name: "textTypeLoop", label: "Loop" },
    { $formkit: "checkbox", name: "textTypeVariableSpeedEnabled", label: "Variable speed" },
    { $formkit: "number", name: "textTypeVariableSpeedMin", label: "Variable speed min", min: 1, max: 500, step: 1 },
    { $formkit: "number", name: "textTypeVariableSpeedMax", label: "Variable speed max", min: 1, max: 500, step: 1 },
    { $formkit: "checkbox", name: "textTypeStartOnVisible", label: "Start on visible" },
    { $formkit: "checkbox", name: "textTypeReverseMode", label: "Reverse mode" },
    { $formkit: "text", name: "textTypeClassName", label: "Class name" },
  ],
  "rotating-text": [
    { $formkit: "textarea", name: "rotatingTexts", label: "Texts (one per line)" },
    { $formkit: "textarea", name: "rotatingTransitionJson", label: "Transition JSON" },
    { $formkit: "textarea", name: "rotatingInitialJson", label: "Initial JSON" },
    { $formkit: "textarea", name: "rotatingAnimateJson", label: "Animate JSON" },
    { $formkit: "textarea", name: "rotatingExitJson", label: "Exit JSON" },
    { $formkit: "select", name: "rotatingAnimatePresenceMode", label: "Animate presence mode", options: [{ label: "wait", value: "wait" }, { label: "sync", value: "sync" }] },
    { $formkit: "checkbox", name: "rotatingAnimatePresenceInitial", label: "Animate presence initial" },
    { $formkit: "number", name: "rotatingRotationInterval", label: "Rotation interval (ms)", min: 100, max: 20000, step: 50 },
    { $formkit: "number", name: "rotatingStaggerDuration", label: "Stagger duration", min: 0, max: 2, step: 0.005 },
    { $formkit: "text", name: "rotatingStaggerFrom", label: "Stagger from" },
    { $formkit: "checkbox", name: "rotatingLoop", label: "Loop" },
    { $formkit: "checkbox", name: "rotatingAuto", label: "Auto" },
    { $formkit: "select", name: "rotatingSplitBy", label: "Split by", options: [{ label: "characters", value: "characters" }, { label: "words", value: "words" }, { label: "lines", value: "lines" }] },
    { $formkit: "text", name: "rotatingMainClassName", label: "Main class name" },
    { $formkit: "text", name: "rotatingSplitLevelClassName", label: "Split level class name" },
    { $formkit: "text", name: "rotatingElementLevelClassName", label: "Element level class name" },
  ],
  "variable-proximity": [
    { $formkit: "text", name: "variableLabel", label: "Label" },
    { $formkit: "text", name: "variableFromFontVariationSettings", label: "From font variation settings" },
    { $formkit: "text", name: "variableToFontVariationSettings", label: "To font variation settings" },
    { $formkit: "number", name: "variableRadius", label: "Radius", min: 1, max: 1000, step: 1 },
    { $formkit: "select", name: "variableFalloff", label: "Falloff", options: [{ label: "linear", value: "linear" }, { label: "exponential", value: "exponential" }, { label: "gaussian", value: "gaussian" }] },
    { $formkit: "text", name: "variableClassName", label: "Class name" },
    { $formkit: "textarea", name: "variableStyleJson", label: "Style JSON" },
  ],
};

const widgetBackgroundVariantSchemas: Record<string, FormKitSchemaNode[]> = {
  aurora: [
    { $formkit: "color", name: "auroraColorStop1", label: "Color stop 1" },
    { $formkit: "color", name: "auroraColorStop2", label: "Color stop 2" },
    { $formkit: "color", name: "auroraColorStop3", label: "Color stop 3" },
    { $formkit: "text", name: "auroraColorStops", label: "Advanced color stops CSV (optional override)" },
    { $formkit: "number", name: "auroraAmplitude", label: "Amplitude", min: 0, max: 5, step: 0.01 },
    { $formkit: "number", name: "auroraBlend", label: "Blend", min: 0, max: 2, step: 0.01 },
    { $formkit: "number", name: "auroraTime", label: "Time offset", min: 0, max: 999999, step: 0.01 },
    { $formkit: "number", name: "auroraSpeed", label: "Speed", min: 0, max: 10, step: 0.01 },
    { $formkit: "number", name: "auroraIntensity", label: "Intensity", min: 0, max: 5, step: 0.01 },
    { $formkit: "text", name: "auroraClassName", label: "Class name" },
    { $formkit: "textarea", name: "auroraStyleJson", label: "Style JSON" },
  ],
  "color-bends": [
    { $formkit: "number", name: "colorBendsRotation", label: "Rotation", min: -360, max: 360, step: 1 },
    { $formkit: "number", name: "colorBendsSpeed", label: "Speed", min: 0, max: 10, step: 0.01 },
    { $formkit: "color", name: "colorBendsColor1", label: "Color 1" },
    { $formkit: "color", name: "colorBendsColor2", label: "Color 2" },
    { $formkit: "color", name: "colorBendsColor3", label: "Color 3" },
    { $formkit: "text", name: "colorBendsColors", label: "Advanced colors CSV (optional override)" },
    { $formkit: "checkbox", name: "colorBendsTransparent", label: "Transparent" },
    { $formkit: "number", name: "colorBendsAutoRotate", label: "Auto rotate", min: -360, max: 360, step: 0.1 },
    { $formkit: "number", name: "colorBendsScale", label: "Scale", min: 0.01, max: 10, step: 0.01 },
    { $formkit: "number", name: "colorBendsFrequency", label: "Frequency", min: 0, max: 10, step: 0.01 },
    { $formkit: "number", name: "colorBendsWarpStrength", label: "Warp strength", min: 0, max: 10, step: 0.01 },
    { $formkit: "number", name: "colorBendsMouseInfluence", label: "Mouse influence", min: 0, max: 10, step: 0.01 },
    { $formkit: "number", name: "colorBendsParallax", label: "Parallax", min: 0, max: 2, step: 0.01 },
    { $formkit: "number", name: "colorBendsNoise", label: "Noise", min: 0, max: 1, step: 0.01 },
    { $formkit: "text", name: "colorBendsClassName", label: "Class name" },
    { $formkit: "textarea", name: "colorBendsStyleJson", label: "Style JSON" },
  ],
  "dark-veil": [
    { $formkit: "number", name: "darkVeilHueShift", label: "Hue shift", min: -360, max: 360, step: 1 },
    { $formkit: "number", name: "darkVeilNoiseIntensity", label: "Noise intensity", min: 0, max: 2, step: 0.01 },
    { $formkit: "number", name: "darkVeilScanlineIntensity", label: "Scanline intensity", min: 0, max: 2, step: 0.01 },
    { $formkit: "number", name: "darkVeilSpeed", label: "Speed", min: 0, max: 10, step: 0.01 },
    { $formkit: "number", name: "darkVeilScanlineFrequency", label: "Scanline frequency", min: 0, max: 20, step: 0.01 },
    { $formkit: "number", name: "darkVeilWarpAmount", label: "Warp amount", min: 0, max: 5, step: 0.01 },
    { $formkit: "number", name: "darkVeilResolutionScale", label: "Resolution scale", min: 0.1, max: 2, step: 0.01 },
  ],
  "dot-grid": [
    { $formkit: "number", name: "dotGridDotSize", label: "Dot size", min: 1, max: 64, step: 1 },
    { $formkit: "number", name: "dotGridGap", label: "Gap", min: 1, max: 128, step: 1 },
    { $formkit: "color", name: "dotGridBaseColor", label: "Base color" },
    { $formkit: "color", name: "dotGridActiveColor", label: "Active color" },
    { $formkit: "number", name: "dotGridProximity", label: "Proximity", min: 1, max: 600, step: 1 },
    { $formkit: "number", name: "dotGridSpeedTrigger", label: "Speed trigger", min: 1, max: 10000, step: 1 },
    { $formkit: "number", name: "dotGridShockRadius", label: "Shock radius", min: 1, max: 1000, step: 1 },
    { $formkit: "number", name: "dotGridShockStrength", label: "Shock strength", min: 0, max: 20, step: 0.1 },
    { $formkit: "number", name: "dotGridMaxSpeed", label: "Max speed", min: 1, max: 20000, step: 1 },
    { $formkit: "number", name: "dotGridResistance", label: "Resistance", min: 1, max: 5000, step: 1 },
    { $formkit: "number", name: "dotGridReturnDuration", label: "Return duration", min: 0, max: 10, step: 0.01 },
    { $formkit: "text", name: "dotGridClassName", label: "Class name" },
    { $formkit: "textarea", name: "dotGridStyleJson", label: "Style JSON" },
  ],
  grainient: [
    { $formkit: "number", name: "grainientTimeSpeed", label: "Time speed", min: 0, max: 10, step: 0.01 },
    { $formkit: "number", name: "grainientColorBalance", label: "Color balance", min: 0, max: 1, step: 0.01 },
    { $formkit: "number", name: "grainientWarpStrength", label: "Warp strength", min: 0, max: 2, step: 0.01 },
    { $formkit: "number", name: "grainientWarpFrequency", label: "Warp frequency", min: 0, max: 5, step: 0.01 },
    { $formkit: "number", name: "grainientWarpSpeed", label: "Warp speed", min: 0, max: 5, step: 0.01 },
    { $formkit: "number", name: "grainientWarpAmplitude", label: "Warp amplitude", min: 0, max: 2, step: 0.01 },
    { $formkit: "number", name: "grainientBlendAngle", label: "Blend angle", min: -180, max: 180, step: 1 },
    { $formkit: "number", name: "grainientBlendSoftness", label: "Blend softness", min: 0, max: 1, step: 0.01 },
    { $formkit: "number", name: "grainientRotationAmount", label: "Rotation amount", min: -2, max: 2, step: 0.01 },
    { $formkit: "number", name: "grainientNoiseScale", label: "Noise scale", min: 0, max: 10, step: 0.01 },
    { $formkit: "number", name: "grainientGrainAmount", label: "Grain amount", min: 0, max: 1, step: 0.01 },
    { $formkit: "number", name: "grainientGrainScale", label: "Grain scale", min: 0.01, max: 5, step: 0.01 },
    { $formkit: "checkbox", name: "grainientGrainAnimated", label: "Grain animated" },
    { $formkit: "number", name: "grainientContrast", label: "Contrast", min: 0, max: 4, step: 0.01 },
    { $formkit: "number", name: "grainientGamma", label: "Gamma", min: 0.1, max: 4, step: 0.01 },
    { $formkit: "number", name: "grainientSaturation", label: "Saturation", min: 0, max: 4, step: 0.01 },
    { $formkit: "number", name: "grainientCenterX", label: "Center X", min: 0, max: 1, step: 0.01 },
    { $formkit: "number", name: "grainientCenterY", label: "Center Y", min: 0, max: 1, step: 0.01 },
    { $formkit: "number", name: "grainientZoom", label: "Zoom", min: 0.1, max: 4, step: 0.01 },
    { $formkit: "color", name: "grainientColor1", label: "Color 1" },
    { $formkit: "color", name: "grainientColor2", label: "Color 2" },
    { $formkit: "color", name: "grainientColor3", label: "Color 3" },
    { $formkit: "text", name: "grainientClassName", label: "Class name" },
  ],
  iridescence: [
    { $formkit: "color", name: "iridescenceBaseColor", label: "Color" },
    { $formkit: "number", name: "iridescenceSpeed", label: "Speed", min: 0, max: 10, step: 0.01 },
    { $formkit: "number", name: "iridescenceAmplitude", label: "Amplitude", min: 0, max: 2, step: 0.01 },
    { $formkit: "checkbox", name: "iridescenceMouseReact", label: "Mouse react" },
  ],
  lightning: [
    { $formkit: "number", name: "lightningHue", label: "Hue", min: 0, max: 360, step: 1 },
    { $formkit: "number", name: "lightningXOffset", label: "X offset", min: -2, max: 2, step: 0.01 },
    { $formkit: "number", name: "lightningSpeed", label: "Speed", min: 0, max: 2, step: 0.01 },
    { $formkit: "number", name: "lightningIntensity", label: "Intensity", min: 0, max: 5, step: 0.01 },
    { $formkit: "number", name: "lightningSize", label: "Size", min: 0, max: 5, step: 0.01 },
  ],
  "liquid-ether": [
    { $formkit: "number", name: "liquidEtherMouseForce", label: "Mouse force", min: 0, max: 100, step: 0.1 },
    { $formkit: "number", name: "liquidEtherCursorSize", label: "Cursor size", min: 1, max: 200, step: 1 },
    { $formkit: "checkbox", name: "liquidEtherIsViscous", label: "Is viscous" },
    { $formkit: "number", name: "liquidEtherViscous", label: "Viscous", min: 0, max: 200, step: 0.1 },
    { $formkit: "number", name: "liquidEtherIterationsViscous", label: "Iterations viscous", min: 1, max: 128, step: 1 },
    { $formkit: "number", name: "liquidEtherIterationsPoisson", label: "Iterations poisson", min: 1, max: 128, step: 1 },
    { $formkit: "number", name: "liquidEtherDt", label: "dt", min: 0.001, max: 2, step: 0.001 },
    { $formkit: "checkbox", name: "liquidEtherBFECC", label: "BFECC" },
    { $formkit: "number", name: "liquidEtherResolution", label: "Resolution", min: 0.1, max: 3, step: 0.01 },
    { $formkit: "checkbox", name: "liquidEtherIsBounce", label: "Bounce" },
    { $formkit: "color", name: "liquidEtherColor1", label: "Color 1" },
    { $formkit: "color", name: "liquidEtherColor2", label: "Color 2" },
    { $formkit: "color", name: "liquidEtherColor3", label: "Color 3" },
    { $formkit: "text", name: "liquidEtherColors", label: "Advanced colors CSV (optional override)" },
    { $formkit: "textarea", name: "liquidEtherStyleJson", label: "Style JSON" },
    { $formkit: "text", name: "liquidEtherClassName", label: "Class name" },
    { $formkit: "checkbox", name: "liquidEtherAutoDemo", label: "Auto demo" },
    { $formkit: "number", name: "liquidEtherAutoSpeed", label: "Auto speed", min: 0, max: 5, step: 0.01 },
    { $formkit: "number", name: "liquidEtherAutoIntensity", label: "Auto intensity", min: 0, max: 5, step: 0.01 },
    { $formkit: "number", name: "liquidEtherTakeoverDuration", label: "Takeover duration", min: 0, max: 10, step: 0.01 },
    { $formkit: "number", name: "liquidEtherAutoResumeDelay", label: "Auto resume delay", min: 0, max: 30, step: 0.01 },
    { $formkit: "number", name: "liquidEtherAutoRampDuration", label: "Auto ramp duration", min: 0, max: 10, step: 0.01 },
  ],
  orb: [
    { $formkit: "number", name: "orbHue", label: "Hue", min: 0, max: 360, step: 1 },
    { $formkit: "number", name: "orbHoverIntensity", label: "Hover intensity", min: 0, max: 1, step: 0.01 },
    { $formkit: "checkbox", name: "orbRotateOnHover", label: "Rotate on hover" },
    { $formkit: "checkbox", name: "orbForceHoverState", label: "Force hover state" },
  ],
  particles: [
    { $formkit: "number", name: "particlesParticleCount", label: "Particle count", min: 1, max: 2000, step: 1 },
    { $formkit: "number", name: "particlesParticleSpread", label: "Particle spread", min: 1, max: 30, step: 0.1 },
    { $formkit: "number", name: "particlesSpeed", label: "Speed", min: 0, max: 5, step: 0.01 },
    { $formkit: "color", name: "particlesColor1", label: "Color 1" },
    { $formkit: "color", name: "particlesColor2", label: "Color 2" },
    { $formkit: "color", name: "particlesColor3", label: "Color 3" },
    { $formkit: "text", name: "particlesParticleColors", label: "Advanced colors CSV (optional override)" },
    { $formkit: "checkbox", name: "particlesMoveParticlesOnHover", label: "Move particles on hover" },
    { $formkit: "number", name: "particlesParticleHoverFactor", label: "Hover factor", min: 0, max: 10, step: 0.01 },
    { $formkit: "checkbox", name: "particlesAlphaParticles", label: "Alpha particles" },
    { $formkit: "number", name: "particlesParticleBaseSize", label: "Base size", min: 1, max: 500, step: 1 },
    { $formkit: "number", name: "particlesSizeRandomness", label: "Size randomness", min: 0, max: 5, step: 0.01 },
    { $formkit: "number", name: "particlesCameraDistance", label: "Camera distance", min: 1, max: 50, step: 0.1 },
    { $formkit: "checkbox", name: "particlesDisableRotation", label: "Disable rotation" },
    { $formkit: "text", name: "particlesClassName", label: "Class name" },
  ],
  "prismatic-burst": [
    { $formkit: "number", name: "prismaticBurstIntensity", label: "Intensity", min: 0, max: 10, step: 0.01 },
    { $formkit: "number", name: "prismaticBurstSpeed", label: "Speed", min: 0, max: 10, step: 0.01 },
    { $formkit: "select", name: "prismaticBurstAnimationType", label: "Animation type", options: [{ label: "Rotate", value: "rotate" }, { label: "Rotate 3D", value: "rotate3d" }, { label: "Hover", value: "hover" }] },
    { $formkit: "color", name: "prismaticBurstColor1", label: "Color 1" },
    { $formkit: "color", name: "prismaticBurstColor2", label: "Color 2" },
    { $formkit: "color", name: "prismaticBurstColor3", label: "Color 3" },
    { $formkit: "text", name: "prismaticBurstColors", label: "Advanced colors CSV (optional override)" },
    { $formkit: "number", name: "prismaticBurstDistort", label: "Distort", min: 0, max: 50, step: 0.01 },
    { $formkit: "checkbox", name: "prismaticBurstPaused", label: "Paused" },
    { $formkit: "text", name: "prismaticBurstOffsetX", label: "Offset X (px or %)", placeholder: "0" },
    { $formkit: "text", name: "prismaticBurstOffsetY", label: "Offset Y (px or %)", placeholder: "0" },
    { $formkit: "number", name: "prismaticBurstHoverDampness", label: "Hover dampness", min: 0, max: 1, step: 0.01 },
    { $formkit: "number", name: "prismaticBurstRayCount", label: "Ray count", min: 0, max: 256, step: 1 },
    { $formkit: "select", name: "prismaticBurstMixBlendMode", label: "Mix blend mode", options: [
      { label: "None", value: "none" },
      { label: "Normal", value: "normal" },
      { label: "Lighten", value: "lighten" },
      { label: "Screen", value: "screen" },
      { label: "Overlay", value: "overlay" },
      { label: "Soft Light", value: "soft-light" },
      { label: "Hard Light", value: "hard-light" },
      { label: "Color Dodge", value: "color-dodge" },
      { label: "Plus Lighter", value: "plus-lighter" },
    ] },
  ],
  silk: [
    { $formkit: "number", name: "silkSpeed", label: "Speed", min: 0, max: 20, step: 0.01 },
    { $formkit: "number", name: "silkScale", label: "Scale", min: 0.1, max: 10, step: 0.01 },
    { $formkit: "color", name: "silkColor", label: "Color" },
    { $formkit: "number", name: "silkNoiseIntensity", label: "Noise intensity", min: 0, max: 5, step: 0.01 },
    { $formkit: "number", name: "silkRotation", label: "Rotation", min: -360, max: 360, step: 1 },
    { $formkit: "text", name: "silkClassName", label: "Class name" },
    { $formkit: "textarea", name: "silkStyleJson", label: "Style JSON" },
  ],
};

const widgetItemSchema = (item: Record<string, unknown>): FormKitSchemaNode[] => {
  const textVariant = String(item?.textVariant || "shiny-text");
  const backgroundVariant = String(item?.backgroundVariant || "aurora");
  const textVariantSchema = widgetVariantSchemas[textVariant] ?? [];
  const backgroundVariantSchema = widgetBackgroundVariantSchemas[backgroundVariant] ?? [];
  return [
    ...widgetCoreSchema,
    makeAccordion("Text Controls", [...widgetTextBaseSchema, ...textVariantSchema], true),
    makeAccordion("Background Controls", [...widgetBackgroundBaseSchema, ...backgroundVariantSchema], true),
    { $formkit: "date", name: "publishDate", label: "Publish date" },
    { $formkit: "date", name: "expirationDate", label: "Expiration date" },
  ];
};

/**
 * A single cell on the bento grid.
 *
 * `type` declares what content the cell renders.
 * `refId` points to an existing item in the model (link, gallery item, blog post, or embed).
 * Grid position is given as 1-based col/row with span counts.
 */
export interface BentoGridItem {
  id: string;
  type: "link" | "gallery" | "blog" | "embed" | "widget" | "profile";
  /** ID of the referenced content item (link.id, galleryItem.id, embed.id, or blog slug) */
  refId: string;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  /** For embeds: optional thumbnail image URL */
  thumbnailUrl?: string;
  /** For embeds: optional heading displayed on the card */
  headerText?: string;
  /** For embeds: optional CTA button label */
  buttonText?: string;
}

export interface BentoGridData {
  /** The total number of columns in the grid (default 4) */
  columns: number;
  /** Items placed on the grid */
  items: BentoGridItem[];
}

const manifest: PlatformKitConfig = {
  name: "Bento",
  presets: {
    light: bentoLightTheme,
  },
  vars: [
    {
      cssVar: "--bento-grid-width",
      label: "Grid width",
      type: "text",
      defaultLight: "960px",
      defaultDark: "960px",
    },
    {
      cssVar: "--bento-gap",
      label: "Grid gap",
      type: "text",
      defaultLight: "1rem",
      defaultDark: "1rem",
    },
    {
      cssVar: "--bento-card-radius",
      label: "Card radius",
      type: "text",
      defaultLight: "1.5rem",
      defaultDark: "1.5rem",
    },
    {
      cssVar: "--bento-card-bg",
      label: "Card background",
      type: "color",
      defaultLight: "#ffffff",
      defaultDark: "rgba(255, 255, 255, 0.06)",
    },
    {
      cssVar: "--bento-card-border",
      label: "Card border",
      type: "color",
      defaultLight: "transparent",
      defaultDark: "rgba(255, 255, 255, 0.08)",
    },
    {
      cssVar: "--bento-card-shadow",
      label: "Card shadow",
      type: "text",
      defaultLight: "0 1px 2px rgba(0,0,0,0.04), 0 2px 12px rgba(0,0,0,0.03)",
      defaultDark: "0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2)",
    },
    {
      cssVar: "--bento-hover-scale",
      label: "Hover scale",
      type: "text",
      defaultLight: "1.02",
      defaultDark: "1.02",
    },
  ],
  contentSchemas: [
    {
      key: "socials", label: "Socials", icon: "Share2",
      defaultEnabled: true, searchable: false,
      itemSchema: socialItemSchema,
      newItem: () => ({ ...newSocial(), enabled: true }) as unknown as Record<string, unknown>,
      itemLabel: (i: any) => i.label || i.icon || "Social",
      itemSublabel: (i: any) => i.url || "(no url)",
    },
    {
      key: "links", label: "Links", icon: "Link",
      defaultEnabled: true, searchable: true,
      itemSchema: linkItemSchema,
      newItem: () => newLink() as unknown as Record<string, unknown>,
      itemLabel: (i: any) => i.title || i.url || "Untitled",
      itemSublabel: (i: any) => i.url || "(no url)",
      itemThumbnail: (i: any) => i.imageUrl || undefined,
    },
    {
      key: "gallery", label: "Gallery", icon: "Image",
      defaultEnabled: false, searchable: true,
      itemSchema: galleryItemSchema,
      newItem: () => newGalleryItem() as unknown as Record<string, unknown>,
      itemLabel: (i: any) => i.title || "Untitled",
      itemSublabel: (i: any) => i.type === "video" ? (i.src || "(no source)") : (i.src ? "Image" : "(no image)"),
      itemThumbnail: (i: any) => i.type === "image" ? i.src : i.coverUrl,
    },
    {
      key: "resume", label: "Resume", icon: "FileText",
      defaultEnabled: false, searchable: false, singleton: true,
      editorComponent: () => import("../../admin/editors/ResumeCollectionEditor.vue"),
    },
    {
      key: "blog", label: "Blog", icon: "BookOpen",
      defaultEnabled: false, searchable: true, external: true,
      editorComponent: () => import("../../admin/editors/BlogCollectionEditor.vue"),
    },
    {
      key: "embeds", label: "Embeds", icon: "Code",
      defaultEnabled: true, searchable: false,
      itemSchema: embedItemSchema,
      newItem: () => newEmbed() as unknown as Record<string, unknown>,
      itemLabel: (i: any) => i.label || "Untitled",
      itemSublabel: (i: any) => i.html ? "Has embed code" : "(no embed code)",
    },
    {
      key: "widgets", label: "Widgets", icon: "Sparkles",
      defaultEnabled: false, searchable: false,
      itemSchema: widgetItemSchema,
      newItem: () => newWidget() as unknown as Record<string, unknown>,
      itemLabel: (i: any) => i.text || "Animated text",
      itemSublabel: (i: any) => `${i.textVariant || "shiny-text"} · ${i.backgroundVariant || "aurora"}`,
    },
    {
      key: "newsletter", label: "Newsletter", icon: "Newspaper",
      defaultEnabled: false, searchable: true, external: true,
      editorComponent: () => import("../../admin/editors/NewsletterCollectionEditor.vue"),
    },
    // Move products schema to the last position
    {
      key: "products", label: "Products", icon: "ShoppingCart",
      defaultEnabled: false, searchable: true,
      editorComponent: () => import("./ecommerce/components/ProductCollectionEditor.vue"),
      itemSchema: [
        {
          $formkit: "select",
          name: "product_type",
          label: "Product Type",
          validation: "required",
          options: [
            { label: "Physical", value: "physical" },
            { label: "Digital", value: "digital" },
            { label: "Subscription", value: "subscription" },
          ],
        },
        {
          $formkit: "text",
          name: "name",
          label: "Product Name",
          validation: "required",
        },
        {
          $formkit: "text",
          name: "title",
          label: "Title",
        },
        {
          $formkit: "textarea",
          name: "description",
          label: "Description",
        },
        {
          $formkit: "listPanel",
          name: "images",
          label: "Images",
          children: [{ $formkit: "image-upload", name: "image", label: "Image" }],
        },
        {
          $formkit: "checkbox",
          name: "shippable",
          label: "Shippable",
          if: "$product_type == 'physical'",
        },
        {
          $formkit: "listPanel",
          name: "attributes",
          label: "Attributes (Options)",
          if: "$product_type == 'physical'",
          help: "Define product options (e.g. Size, Color). Each attribute can have multiple values.",
          ui: { collapsible: true, collapsed: true, summaryField: "name" },
          children: [
            {
              $formkit: "group",
              name: "attribute",
              label: "Attribute",
              children: [
                {
                  $formkit: "text",
                  name: "name",
                  label: "Attribute Name",
                },
                {
                  $formkit: "listPanel",
                  name: "values",
                  label: "Values",
                  children: [{ $formkit: "text", name: "value", label: "Value" }],
                },
              ],
            },
          ],
        },
        {
          $formkit: "listPanel",
          name: "variants",
          label: "Variants (SKUs)",
          if: "$product_type == 'physical'",
          help: "Each variant is a unique combination of attributes (e.g. Size: M, Color: Blue) with its own SKU and inventory.",
          ui: { collapsible: true, collapsed: true, summaryField: "sku" },
          children: [
            {
              $formkit: "group",
              name: "variant",
              label: "Variant",
              children: [
                {
                  $formkit: "text",
                  name: "sku",
                  label: "SKU",
                },
                {
                  $formkit: "listPanel",
                  name: "attributes",
                  label: "Attributes",
                  children: [
                    {
                      $formkit: "group",
                      name: "attribute",
                      label: "Attribute",
                      children: [
                        {
                          $formkit: "text",
                          name: "name",
                          label: "Attribute Name",
                        },
                        {
                          $formkit: "text",
                          name: "value",
                          label: "Value",
                        },
                      ],
                    },
                  ],
                },
                {
                  $formkit: "number",
                  name: "inventory",
                  label: "Inventory",
                },
              ],
            },
          ],
        },
        {
          $formkit: "listPanel",
          name: "metadata",
          label: "Product Metadata",
          help: "Custom key-value pairs for this product.",
          ui: { collapsible: true, collapsed: true, summaryField: "key" },
          children: [
            {
              $formkit: "group",
              name: "meta",
              label: "Meta",
              children: [
                {
                  $formkit: "text",
                  name: "key",
                  label: "Key",
                },
                {
                  $formkit: "text",
                  name: "value",
                  label: "Value",
                },
              ],
            },
          ],
        },
        { $formkit: "text", name: "stripe_product_id", label: "Stripe Product ID" },
        {
          $formkit: "listPanel",
          name: "extra",
          label: "Extra Stripe Fields",
          help: "Advanced: Add any extra fields for Stripe sync.",
          ui: { collapsible: true, collapsed: true, summaryField: "key" },
          children: [
            {
              $formkit: "group",
              name: "extraField",
              label: "Extra Field",
              children: [
                {
                  $formkit: "text",
                  name: "key",
                  label: "Key",
                },
                {
                  $formkit: "text",
                  name: "value",
                  label: "Value",
                },
              ],
            },
          ],
        },
      ],
      newItem: () => ({
        name: "",
        description: "",
        images: [],
        shippable: false,
        attributes: [],
        variants: [],
        metadata: {},
        prices: [],
        stripe_product_id: "",
        extra: {},
        product_type: "digital",
        slug: "",
      }),
      slugField: "name",
      itemLabel: (item: any) => item.name || item.title || item.slug || "Untitled",
      itemThumbnail: (item: any) => Array.isArray(item.images) && item.images.length > 0 && item.images[0]?.image ? item.images[0].image : undefined,
    },
  ],
  schema: [
    {
      $formkit: "select",
      name: "defaultTab",
      label: "Default tab",
      help: "The tab visitors see first when they land on your page.",
      options: [
        { label: "All", value: "links" },
        { label: "Resume", value: "resume" },
        { label: "Gallery", value: "gallery" },
      ],
    },
  ],
  cmsTabs: [],
  routes,
  contentCollections: {
    docs: {
      directory: "content/docs",
      format: "markdown",
      label: "Docs",
      icon: "BookMarked",
      recursive: true,
      defaultEnabled: false,
      searchable: true,
      fieldDefaults: {
        published: true,
        title: "",
      },
      indexFilter: (item: Record<string, unknown>) => item.published !== false,
    },
    blog: {
      directory: "content/blog",
      format: "markdown",
      label: "Blog",
      icon: "BookOpen",
      sortField: "date",
      sortOrder: "desc",
      defaultEnabled: false,
      searchable: true,
      fieldDefaults: {
        published: true,
        tags: [],
        excerpt: "",
        coverImage: "",
        audio: "",
        publishDate: "",
        expirationDate: "",
        rss: true,
      },
      indexFilter: (item: Record<string, unknown>) => {
        if (item.published === false) return false;
        const today = new Date().toISOString().slice(0, 10);
        if (
          item.publishDate &&
          typeof item.publishDate === "string" &&
          today < item.publishDate
        )
          return false;
        if (
          item.expirationDate &&
          typeof item.expirationDate === "string" &&
          today > item.expirationDate
        )
          return false;
        return true;
      },
      generateRss: true,
      generateOgPages: { routePrefix: "content" },
    },
  }, 
  buildHooks: [
    createTtsHook({
      collection: "blog",
      voice: "af_heart",
      filter: (item) => item.published !== false,
    }),
    createImageOptimizeHook({
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 80,
    }),
  ],
};

export default manifest;
