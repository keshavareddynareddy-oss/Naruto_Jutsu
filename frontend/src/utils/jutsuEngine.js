import { JUTSU_CATALOG } from "../data/jutsuData";

const MAX_ERRORS = 1;
const MAX_SEQUENCE_LENGTH = 6;

function fuzzyMatch(sequence, pattern) {
  const tail = sequence.slice(-pattern.length);
  if (tail.length !== pattern.length) return false;
  const errors = tail.filter((seal, index) => seal !== pattern[index]).length;
  return errors <= MAX_ERRORS;
}

export function detectJutsu(sequence) {
  if (!sequence.length) return { jutsu: null, pattern: null };

  for (const jutsu of JUTSU_CATALOG) {
    if (sequence.length < jutsu.seals.length) continue;
    if (fuzzyMatch(sequence, jutsu.seals)) {
      return { jutsu, pattern: jutsu.seals };
    }
  }

  return { jutsu: null, pattern: null };
}

export function getBestJutsuProgress(sequence) {
  if (!sequence.length) return null;

  let bestMatch = null;

  for (const jutsu of JUTSU_CATALOG) {
    const pattern = jutsu.seals;
    const maxOverlap = Math.min(sequence.length, pattern.length);

    for (let overlap = maxOverlap; overlap > 0; overlap -= 1) {
      const tailSlice = sequence.slice(-overlap);
      const patternSlice = pattern.slice(0, overlap);
      const correct = tailSlice.filter((seal, index) => seal === patternSlice[index]).length;
      const errors = overlap - correct;
      if (errors > MAX_ERRORS) continue;

      if (!bestMatch || overlap > bestMatch.matched_count) {
        bestMatch = {
          target_jutsu: jutsu.name,
          target_type: jutsu.type,
          matched_count: overlap,
          total_required: pattern.length,
          next_required_seal: overlap < pattern.length ? pattern[overlap] : null,
          required_sequence: pattern,
          errors,
        };
      }
      break;
    }
  }

  return bestMatch;
}

export function applyPracticeSeal(sequence, seal) {
  const next = [...sequence, seal].slice(-MAX_SEQUENCE_LENGTH);
  const { jutsu } = detectJutsu(next);
  if (jutsu) {
    return {
      sequence: [],
      jutsu,
      progress: null,
    };
  }

  return {
    sequence: next,
    jutsu: null,
    progress: getBestJutsuProgress(next),
  };
}
