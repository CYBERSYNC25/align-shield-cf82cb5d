/**
 * CSS Security Utilities
 * 
 * Validates CSS values to prevent CSS injection attacks
 * when using dangerouslySetInnerHTML or dynamic styles.
 */

/**
 * Validates if a string is a safe CSS color value.
 * Prevents CSS injection by only allowing known safe patterns.
 * 
 * @param color - The color value to validate
 * @returns true if the color is safe to use in CSS
 */
export function isValidCSSColor(color: string): boolean {
  if (!color || typeof color !== 'string') return false;
  
  const trimmed = color.trim();
  
  // Reject if empty or too long (potential injection)
  if (trimmed.length === 0 || trimmed.length > 100) return false;
  
  // Reject if contains dangerous characters
  if (/[<>{}()[\];\\]/.test(trimmed)) return false;
  
  const patterns = [
    // Hex colors: #rgb, #rrggbb, #rrggbbaa
    /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i,
    
    // RGB/RGBA: rgb(r, g, b) or rgba(r, g, b, a)
    /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+))?\s*\)$/i,
    
    // HSL/HSLA: hsl(h, s%, l%) or hsla(h, s%, l%, a)
    /^hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*(,\s*(0|1|0?\.\d+))?\s*\)$/i,
    
    // Modern CSS color functions with space syntax
    /^(rgb|hsl)a?\(\s*[\d.]+(\s+[\d.]+%?){2,3}\s*(\/\s*[\d.]+%?)?\s*\)$/i,
    
    // CSS keywords
    /^(transparent|currentColor|inherit|initial|unset)$/i,
    
    // Named colors (common ones)
    /^(aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen)$/i,
  ];
  
  return patterns.some(p => p.test(trimmed));
}

/**
 * Sanitizes a CSS color value.
 * Returns the original if valid, or a fallback if invalid.
 * 
 * @param color - The color value to sanitize
 * @param fallback - Fallback color if validation fails (default: 'currentColor')
 * @returns A safe CSS color value
 */
export function sanitizeCSSColor(color: string, fallback = 'currentColor'): string {
  return isValidCSSColor(color) ? color : fallback;
}

/**
 * Validates if a string is a safe CSS variable reference.
 * 
 * @param value - The value to check
 * @returns true if it's a safe CSS variable reference
 */
export function isValidCSSVariable(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  
  // CSS variable pattern: var(--name) or var(--name, fallback)
  // Only allow alphanumeric, hyphens in the name
  return /^var\(--[a-zA-Z0-9-]+(\s*,\s*[^)]+)?\)$/.test(value.trim());
}
