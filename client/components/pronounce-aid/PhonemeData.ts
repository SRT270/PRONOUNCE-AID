export type PhonemeTip = {
  symbol: string;
  name: string;
  tip: string;
  example: string;
};

export const PHONEME_TIPS: Record<string, PhonemeTip> = {
  TH: {
    symbol: "θ",
    name: "Unvoiced TH",
    tip: "Place your tongue gently between your teeth and blow air: thhh.",
    example: "think, math",
  },
  DH: {
    symbol: "ð",
    name: "Voiced TH",
    tip: "Tongue between teeth, but buzz your voice: thhhh (like 'this').",
    example: "this, mother",
  },
  SH: {
    symbol: "ʃ",
    name: "SH",
    tip: "Lips rounded, tongue near the roof, blow air: shhh.",
    example: "ship, wish",
  },
  CH: {
    symbol: "tʃ",
    name: "CH",
    tip: "Start with a quick 't' then 'sh' together: ch.",
    example: "chair, lunch",
  },
  ZH: {
    symbol: "ʒ",
    name: "ZH",
    tip: "Like 'measure' middle sound. Lips relaxed, voice buzzing.",
    example: "measure, vision",
  },
  NG: {
    symbol: "ŋ",
    name: "NG",
    tip: "Back of tongue touches soft palate: ng. No extra 'g' after.",
    example: "sing, ring",
  },
  KW: {
    symbol: "kw",
    name: "QU/KW",
    tip: "Say 'k' + quick 'w' together: kw.",
    example: "queen, quick",
  },
  F: {
    symbol: "f",
    name: "F",
    tip: "Top teeth touch bottom lip, blow air: fff.",
    example: "fish, phone",
  },
  R: {
    symbol: "ɹ",
    name: "R",
    tip: "Curl the tongue slightly back without touching the roof.",
    example: "red, car",
  },
  L: {
    symbol: "l",
    name: "L",
    tip: "Tip of tongue touches ridge behind upper teeth.",
    example: "like, ball",
  },
  S: {
    symbol: "s",
    name: "S",
    tip: "Teeth almost closed, tongue behind them. Blow air: sss.",
    example: "sun, kiss",
  },
  Z: {
    symbol: "z",
    name: "Z",
    tip: "Like 's' but with buzzing voice: zzz.",
    example: "zoo, nose",
  },
  CHI: {
    symbol: "tʃ",
    name: "CH",
    tip: "Quick stop then 'sh': ch.",
    example: "chop, lunch",
  },
};

export const KID_WORDS: string[] = [
  "cat", "dog", "fish", "ship", "chair", "this", "that", "ring", "book", "math", "queen", "zoo", "pizza", "yellow", "water", "happy", "mother", "brother"
];
