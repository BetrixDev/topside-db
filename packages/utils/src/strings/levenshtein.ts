/**
 * Calculates the Levenshtein distance between two strings.
 * The Levenshtein distance is the minimum number of single-character edits
 * (insertions, deletions, or substitutions) required to change one string into the other.
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!;
      } else {
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j - 1]! + 1, // substitution
          matrix[i]![j - 1]! + 1, // insertion
          matrix[i - 1]![j]! + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length]![a.length]!;
}

const ROMAN_TO_NUMBER: Record<string, string> = {
  " I": " 1",
  " II": " 2",
  " III": " 3",
  " IV": " 4",
  " V": " 5",
  " VI": " 6",
  " VII": " 7",
  " VIII": " 8",
  " IX": " 9",
  " X": " 10",
};

/**
 * Normalizes Roman numerals (I-X) to numbers (1-10) for better string comparison.
 */
export function normalizeRomanNumerals(text: string): string {
  let normalized = text;

  for (const [roman, number] of Object.entries(ROMAN_TO_NUMBER)) {
    normalized = normalized.replace(new RegExp(roman + "\\b", "gi"), number);
  }

  return normalized;
}

export type FuzzyMatch<T> = {
  item: T;
  name: string;
  distance: number;
};

export type FuzzyMatchOptions = {
  /** Maximum allowed Levenshtein distance for a match. Defaults to Infinity. */
  maxDistance?: number;
};

/**
 * Finds the closest match to a target name from a list of items using Levenshtein distance.
 * Returns the match with the smallest distance, or null if no match is found within maxDistance.
 *
 * @param targetName - The name to search for
 * @param items - Array of items to search through
 * @param getName - Function to extract the name from an item
 * @param options - Optional configuration
 */
export function findClosestMatch<T>(
  targetName: string,
  items: T[],
  getName: (item: T) => string | null | undefined,
  options?: FuzzyMatchOptions
): FuzzyMatch<T> | null {
  const maxDistance = options?.maxDistance ?? Infinity;
  const normalizedTarget = normalizeRomanNumerals(
    targetName.toLowerCase().trim()
  );

  let closestMatch: FuzzyMatch<T> | null = null;

  for (const item of items) {
    const name = getName(item);
    if (!name) continue;

    const normalizedItemName = normalizeRomanNumerals(
      name.toLowerCase().trim()
    );

    // Exact match - return immediately
    if (normalizedItemName === normalizedTarget) {
      return { item, name, distance: 0 };
    }

    const distance = levenshteinDistance(normalizedTarget, normalizedItemName);

    if (distance <= maxDistance) {
      if (closestMatch === null || distance < closestMatch.distance) {
        closestMatch = { item, name, distance };
      }
    }
  }

  return closestMatch;
}

/**
 * Finds all matches within the specified max distance, sorted by distance (closest first).
 *
 * @param targetName - The name to search for
 * @param items - Array of items to search through
 * @param getName - Function to extract the name from an item
 * @param options - Optional configuration
 */
export function findAllMatches<T>(
  targetName: string,
  items: T[],
  getName: (item: T) => string | null | undefined,
  options?: FuzzyMatchOptions
): FuzzyMatch<T>[] {
  const maxDistance = options?.maxDistance ?? Infinity;
  const normalizedTarget = normalizeRomanNumerals(
    targetName.toLowerCase().trim()
  );

  const matches: FuzzyMatch<T>[] = [];

  for (const item of items) {
    const name = getName(item);
    if (!name) continue;

    const normalizedItemName = normalizeRomanNumerals(
      name.toLowerCase().trim()
    );

    const distance =
      normalizedItemName === normalizedTarget
        ? 0
        : levenshteinDistance(normalizedTarget, normalizedItemName);

    if (distance <= maxDistance) {
      matches.push({ item, name, distance });
    }
  }

  return matches.sort((a, b) => a.distance - b.distance);
}

