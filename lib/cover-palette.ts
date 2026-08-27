// sRGB values for the Tailwind tokens used by `coverColor` gradients, so the cover
// shader can paint the exact same gradient the CSS fallback shows.
// Converted from the oklch definitions in tailwindcss/theme.css.
const palette: Record<string, [number, number, number]> = {
  'blue-300': [0.5566, 0.7732, 1.0], // #8ec5ff
  'blue-400': [0.3158, 0.6356, 1.0], // #51a2ff
  'blue-500': [0.1693, 0.498, 1.0], // #2b7fff
  'blue-600': [0.0836, 0.3644, 0.9863], // #155dfc
  'blue-700': [0.0779, 0.2791, 0.9018], // #1447e6
  'blue-800': [0.0998, 0.2338, 0.7229], // #193cb8
  'cyan-400': [0.0, 0.8274, 0.951], // #00d3f2
  'cyan-500': [0.0, 0.7219, 0.8573], // #00b8db
  'cyan-600': [0.0, 0.5742, 0.7226], // #0092b8
  'fuchsia-400': [0.9299, 0.4176, 1.0], // #ed6aff
  'fuchsia-500': [0.8837, 0.1657, 0.9845], // #e12afb
  'indigo-300': [0.6391, 0.7021, 1.0], // #a3b3ff
  'indigo-400': [0.4878, 0.5265, 1.0], // #7c86ff
  'indigo-500': [0.3822, 0.3719, 1.0], // #615fff
  'indigo-600': [0.3109, 0.2244, 0.9663], // #4f39f6
  'indigo-700': [0.2644, 0.1766, 0.8448], // #432dd7
  'indigo-800': [0.2154, 0.1632, 0.6737], // #372aac
  'purple-400': [0.7596, 0.4798, 1.0], // #c27aff
  'purple-500': [0.6779, 0.2759, 1.0], // #ad46ff
  'purple-600': [0.5968, 0.0617, 0.9814], // #9810fa
  'sky-300': [0.4532, 0.8317, 1.0], // #74d4ff
  'sky-400': [0.0, 0.7364, 1.0], // #00bcff
  'sky-500': [0.0, 0.6498, 0.9571], // #00a6f4
  'sky-600': [0.0, 0.5182, 0.8198], // #0084d1
  'slate-500': [0.3839, 0.4548, 0.5567], // #62748e
  'slate-600': [0.271, 0.3341, 0.4242], // #45556c
  'violet-400': [0.6526, 0.5169, 1.0], // #a684ff
  'violet-500': [0.5559, 0.3182, 1.0], // #8e51ff
  'violet-700': [0.4397, 0.0314, 0.9064], // #7008e7
};

const fallbackFrom: [number, number, number] = palette['blue-500'];
const fallbackTo: [number, number, number] = palette['indigo-600'];

/** Turns `"from-blue-500 to-indigo-600"` into the two sRGB stops of that gradient. */
export function resolveCoverGradient(coverColor: string): {
  from: [number, number, number];
  to: [number, number, number];
} {
  let from = fallbackFrom;
  let to = fallbackTo;

  for (const token of coverColor.split(/\s+/)) {
    if (token.startsWith('from-')) from = palette[token.slice(5)] ?? from;
    else if (token.startsWith('to-')) to = palette[token.slice(3)] ?? to;
  }

  return { from, to };
}
