/**
 * Highly Optimized Line-by-Line Alignment-Preserving Diff Algorithm
 * with greedy similarity pairing for modified lines.
 */

export interface DiffOptions {
  ignoreCase: boolean;
  ignoreWhitespace: boolean;
}

export interface DiffLine {
  lineNum: number | null;
  text: string;
  type: 'unchanged' | 'added' | 'removed' | 'modified' | 'empty';
  charSpans?: { text: string; type: 'normal' | 'diff' }[];
}

export interface DiffRow {
  left: DiffLine;
  right: DiffLine;
}

export interface DiffStats {
  additions: number;
  deletions: number;
  modifications: number;
  totalLinesLeft: number;
  totalLinesRight: number;
}

/**
 * Clean a line according to comparison options
 */
function cleanLine(line: string, options: DiffOptions): string {
  let cleaned = line;
  if (options.ignoreCase) {
    cleaned = cleaned.toLowerCase();
  }
  if (options.ignoreWhitespace) {
    cleaned = cleaned.trim().replace(/\s+/g, ' ');
  }
  return cleaned;
}

/**
 * Fast LCS-based line similarity score between 0.0 and 1.0
 */
export function getLineSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  const lenA = a.length;
  const lenB = b.length;
  if (lenA === 0 || lenB === 0) return 0.0;

  // If length difference is massive, they are likely not similar
  if (Math.abs(lenA - lenB) / Math.max(lenA, lenB) > 0.7) return 0.0;

  // Run a quick LCS on the first 120 chars for performance
  const sA = a.slice(0, 120);
  const sB = b.slice(0, 120);
  const m = sA.length;
  const n = sB.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (sA[i - 1] === sB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n] / Math.max(m, n);
}

/**
 * Character-level diff using LCS for inline highlight spans
 */
export function getCharDiff(
  textA: string,
  textB: string
): {
  leftSpans: { text: string; type: 'normal' | 'diff' }[];
  rightSpans: { text: string; type: 'normal' | 'diff' }[];
} {
  if (!textA) {
    return { leftSpans: [], rightSpans: [{ text: textB, type: 'diff' }] };
  }
  if (!textB) {
    return { leftSpans: [{ text: textA, type: 'diff' }], rightSpans: [] };
  }

  // Prevent browser freeze on giant lines
  if (textA.length > 800 || textB.length > 800) {
    return {
      leftSpans: [{ text: textA, type: 'diff' }],
      rightSpans: [{ text: textB, type: 'diff' }],
    };
  }

  const M = textA.length;
  const N = textB.length;
  const dp: number[][] = Array.from({ length: M + 1 }, () => new Array(N + 1).fill(0));

  for (let i = 1; i <= M; i++) {
    for (let j = 1; j <= N; j++) {
      if (textA[i - 1] === textB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = M;
  let j = N;
  interface CharOp {
    type: 'match' | 'delete' | 'insert';
    char: string;
  }
  const ops: CharOp[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && textA[i - 1] === textB[j - 1]) {
      ops.push({ type: 'match', char: textA[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: 'insert', char: textB[j - 1] });
      j--;
    } else {
      ops.push({ type: 'delete', char: textA[i - 1] });
      i--;
    }
  }
  ops.reverse();

  const leftSpans: { text: string; type: 'normal' | 'diff' }[] = [];
  const rightSpans: { text: string; type: 'normal' | 'diff' }[] = [];

  let currentLeft = "";
  let currentLeftType: 'normal' | 'diff' = 'normal';
  let currentRight = "";
  let currentRightType: 'normal' | 'diff' = 'normal';

  for (const op of ops) {
    if (op.type === 'match') {
      if (currentLeft) {
        leftSpans.push({ text: currentLeft, type: currentLeftType });
        currentLeft = "";
      }
      leftSpans.push({ text: op.char, type: 'normal' });

      if (currentRight) {
        rightSpans.push({ text: currentRight, type: currentRightType });
        currentRight = "";
      }
      rightSpans.push({ text: op.char, type: 'normal' });
    } else if (op.type === 'delete') {
      if (currentLeft && currentLeftType !== 'diff') {
        leftSpans.push({ text: currentLeft, type: 'normal' });
        currentLeft = "";
      }
      currentLeftType = 'diff';
      currentLeft += op.char;
    } else if (op.type === 'insert') {
      if (currentRight && currentRightType !== 'diff') {
        rightSpans.push({ text: currentRight, type: 'normal' });
        currentRight = "";
      }
      currentRightType = 'diff';
      currentRight += op.char;
    }
  }

  if (currentLeft) {
    leftSpans.push({ text: currentLeft, type: currentLeftType });
  }
  if (currentRight) {
    rightSpans.push({ text: currentRight, type: currentRightType });
  }

  const mergeSpans = (spans: { text: string; type: 'normal' | 'diff' }[]) => {
    const merged: { text: string; type: 'normal' | 'diff' }[] = [];
    for (const span of spans) {
      if (merged.length > 0 && merged[merged.length - 1].type === span.type) {
        merged[merged.length - 1].text += span.text;
      } else {
        merged.push({ ...span });
      }
    }
    return merged;
  };

  return {
    leftSpans: mergeSpans(leftSpans),
    rightSpans: mergeSpans(rightSpans),
  };
}

/**
 * Computes the line diff and pairs them into fully aligned rows.
 * Implements highly accurate fuzzy pairing to match edited lines
 * instead of breaking alignments when minor modifications occur.
 */
export function computeTextDiff(
  oldText: string,
  newText: string,
  options: DiffOptions
): { rows: DiffRow[]; stats: DiffStats } {
  const oldLines = oldText.split(/\r?\n/);
  const newLines = newText.split(/\r?\n/);

  const M = oldLines.length;
  const N = newLines.length;

  // Step 1: Standard LCS on exact/cleaned line match
  const dp: number[][] = Array.from({ length: M + 1 }, () => new Array(N + 1).fill(0));

  for (let i = 1; i <= M; i++) {
    for (let j = 1; j <= N; j++) {
      const cleanA = cleanLine(oldLines[i - 1], options);
      const cleanB = cleanLine(newLines[j - 1], options);
      if (cleanA === cleanB) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Step 2: Backtrack to extract matches vs edited regions
  let i = M;
  let j = N;
  interface LineOp {
    type: 'match' | 'delete' | 'insert';
    oldIdx: number;
    newIdx: number;
  }
  const rawOps: LineOp[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && cleanLine(oldLines[i - 1], options) === cleanLine(newLines[j - 1], options)) {
      rawOps.push({ type: 'match', oldIdx: i - 1, newIdx: j - 1 });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawOps.push({ type: 'insert', oldIdx: -1, newIdx: j - 1 });
      j--;
    } else {
      rawOps.push({ type: 'delete', oldIdx: i - 1, newIdx: -1 });
      i--;
    }
  }
  rawOps.reverse();

  // Step 3: Construct Aligned Rows & Perform Fuzzy Pairing for edited segments
  const rows: DiffRow[] = [];
  let additions = 0;
  let deletions = 0;
  let modifications = 0;

  let index = 0;
  while (index < rawOps.length) {
    const op = rawOps[index];

    if (op.type === 'match') {
      rows.push({
        left: { lineNum: op.oldIdx + 1, text: oldLines[op.oldIdx], type: 'unchanged' },
        right: { lineNum: op.newIdx + 1, text: newLines[op.newIdx], type: 'unchanged' },
      });
      index++;
    } else {
      // Collect consecutive deletes and inserts in this mismatch region
      const consecutiveDeletes: LineOp[] = [];
      const consecutiveInserts: LineOp[] = [];

      let searchIndex = index;
      while (searchIndex < rawOps.length && rawOps[searchIndex].type !== 'match') {
        const nextOp = rawOps[searchIndex];
        if (nextOp.type === 'delete') {
          consecutiveDeletes.push(nextOp);
        } else if (nextOp.type === 'insert') {
          consecutiveInserts.push(nextOp);
        }
        searchIndex++;
      }

      if (consecutiveDeletes.length > 0 && consecutiveInserts.length > 0) {
        // Find best pairing candidates based on line similarity
        interface SimilarityCandidate {
          delIdx: number; // Index in consecutiveDeletes
          insIdx: number; // Index in consecutiveInserts
          similarity: number;
        }
        const candidates: SimilarityCandidate[] = [];

        for (let d = 0; d < consecutiveDeletes.length; d++) {
          const dOp = consecutiveDeletes[d];
          const leftTextLine = oldLines[dOp.oldIdx];
          for (let s = 0; s < consecutiveInserts.length; s++) {
            const iOp = consecutiveInserts[s];
            const rightTextLine = newLines[iOp.newIdx];
            const sim = getLineSimilarity(leftTextLine, rightTextLine);
            // Threshold for considering lines "similar"
            if (sim >= 0.25) {
              candidates.push({ delIdx: d, insIdx: s, similarity: sim });
            }
          }
        }

        // Greedy matching
        candidates.sort((a, b) => b.similarity - a.similarity);
        const pairedDeletes = new Set<number>();
        const pairedInserts = new Set<number>();
        const bestPairs = new Map<number, number>(); // delIdx -> insIdx

        for (const cand of candidates) {
          if (!pairedDeletes.has(cand.delIdx) && !pairedInserts.has(cand.insIdx)) {
            pairedDeletes.add(cand.delIdx);
            pairedInserts.add(cand.insIdx);
            bestPairs.set(cand.delIdx, cand.insIdx);
          }
        }

        // Align them preserving relative vertical sequence
        let d = 0;
        let s = 0;
        while (d < consecutiveDeletes.length || s < consecutiveInserts.length) {
          if (d < consecutiveDeletes.length && bestPairs.has(d)) {
            const pairedInsIdx = bestPairs.get(d)!;
            // Catch up insert pointer up to pairedInsIdx to keep order
            while (s < pairedInsIdx) {
              if (!pairedInserts.has(s)) {
                const insOp = consecutiveInserts[s];
                rows.push({
                  left: { lineNum: null, text: '', type: 'empty' },
                  right: { lineNum: insOp.newIdx + 1, text: newLines[insOp.newIdx], type: 'added' },
                });
                additions++;
              }
              s++;
            }

            // Pair current delete and insert as a modified line
            const delOp = consecutiveDeletes[d];
            const insOp = consecutiveInserts[pairedInsIdx];
            const textL = oldLines[delOp.oldIdx];
            const textR = newLines[insOp.newIdx];
            const { leftSpans, rightSpans } = getCharDiff(textL, textR);

            rows.push({
              left: { lineNum: delOp.oldIdx + 1, text: textL, type: 'modified', charSpans: leftSpans },
              right: { lineNum: insOp.newIdx + 1, text: textR, type: 'modified', charSpans: rightSpans },
            });
            modifications++;
            
            d++;
            s = pairedInsIdx + 1; // Move past the paired insert
          } else if (d < consecutiveDeletes.length) {
            // Unpaired delete
            if (!pairedDeletes.has(d)) {
              const delOp = consecutiveDeletes[d];
              rows.push({
                left: { lineNum: delOp.oldIdx + 1, text: oldLines[delOp.oldIdx], type: 'removed' },
                right: { lineNum: null, text: '', type: 'empty' },
              });
              deletions++;
            }
            d++;
          } else {
            // Leftover unpaired inserts
            if (s < consecutiveInserts.length && !pairedInserts.has(s)) {
              const insOp = consecutiveInserts[s];
              rows.push({
                left: { lineNum: null, text: '', type: 'empty' },
                right: { lineNum: insOp.newIdx + 1, text: newLines[insOp.newIdx], type: 'added' },
              });
              additions++;
            }
            s++;
          }
        }

        index = searchIndex;
      } else {
        // Pure additions or pure deletions
        if (op.type === 'delete') {
          rows.push({
            left: { lineNum: op.oldIdx + 1, text: oldLines[op.oldIdx], type: 'removed' },
            right: { lineNum: null, text: '', type: 'empty' },
          });
          deletions++;
        } else if (op.type === 'insert') {
          rows.push({
            left: { lineNum: null, text: '', type: 'empty' },
            right: { lineNum: op.newIdx + 1, text: newLines[op.newIdx], type: 'added' },
          });
          additions++;
        }
        index++;
      }
    }
  }

  return {
    rows,
    stats: {
      additions,
      deletions,
      modifications,
      totalLinesLeft: oldLines.length,
      totalLinesRight: newLines.length,
    },
  };
}
