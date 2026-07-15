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
  if (textA.length > 5000 || textB.length > 5000) {
    return {
      leftSpans: [{ text: textA, type: 'diff' }],
      rightSpans: [{ text: textB, type: 'diff' }],
    };
  }

  let start = 0;
  while (start < textA.length && start < textB.length && textA[start] === textB[start]) {
    start++;
  }

  let endA = textA.length - 1;
  let endB = textB.length - 1;
  while (endA >= start && endB >= start && textA[endA] === textB[endB]) {
    endA--;
    endB--;
  }

  const midA = textA.slice(start, endA + 1);
  const midB = textB.slice(start, endB + 1);

  const M = midA.length;
  const N = midB.length;
  const dp: number[][] = Array.from({ length: M + 1 }, () => new Array(N + 1).fill(0));

  for (let i = 1; i <= M; i++) {
    for (let j = 1; j <= N; j++) {
      if (midA[i - 1] === midB[j - 1]) {
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

  // Add suffix
  for (let k = textA.length - 1; k > endA; k--) {
    ops.push({ type: 'match', char: textA[k] });
  }

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && midA[i - 1] === midB[j - 1]) {
      ops.push({ type: 'match', char: midA[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: 'insert', char: midB[j - 1] });
      j--;
    } else {
      ops.push({ type: 'delete', char: midA[i - 1] });
      i--;
    }
  }

  // Add prefix
  for (let k = start - 1; k >= 0; k--) {
    ops.push({ type: 'match', char: textA[k] });
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
      if (cleanA === cleanB && cleanA !== "") {
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
    if (i > 0 && j > 0 && cleanLine(oldLines[i - 1], options) === cleanLine(newLines[j - 1], options) && cleanLine(oldLines[i - 1], options) !== "") {
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
        // Monotonic sequence alignment based on similarity score to prevent crossovers
        const D = consecutiveDeletes.length;
        const S = consecutiveInserts.length;
        const simMatrix: number[][] = Array.from({ length: D }, () => new Array(S).fill(0));
        
        for (let d = 0; d < D; d++) {
          const leftTextLine = oldLines[consecutiveDeletes[d].oldIdx];
          for (let s = 0; s < S; s++) {
            const rightTextLine = newLines[consecutiveInserts[s].newIdx];
            simMatrix[d][s] = getLineSimilarity(leftTextLine, rightTextLine);
          }
        }

        const dpMatch: number[][] = Array.from({ length: D + 1 }, () => new Array(S + 1).fill(0));
        for (let i = 1; i <= D; i++) {
          for (let j = 1; j <= S; j++) {
            const sim = simMatrix[i - 1][j - 1];
            let best = Math.max(dpMatch[i - 1][j], dpMatch[i][j - 1]);
            if (sim >= 0.25) {
              best = Math.max(best, dpMatch[i - 1][j - 1] + sim);
            }
            dpMatch[i][j] = best;
          }
        }

        // Backtrack to find optimal monotonic pairs
        let i = D;
        let j = S;
        const pairs: { d: number, s: number }[] = [];
        
        while (i > 0 && j > 0) {
          const sim = simMatrix[i - 1][j - 1];
          // Check if this cell was part of a match
          if (sim >= 0.25 && Math.abs(dpMatch[i][j] - (dpMatch[i - 1][j - 1] + sim)) < 1e-9) {
            pairs.push({ d: i - 1, s: j - 1 });
            i--;
            j--;
          } else if (dpMatch[i - 1][j] >= dpMatch[i][j - 1]) {
            i--;
          } else {
            j--;
          }
        }
        pairs.reverse();

        // Construct rows with preserved vertical sequence
        let d = 0;
        let s = 0;
        let pairIndex = 0;

        while (d < D || s < S) {
          if (pairIndex < pairs.length && pairs[pairIndex].d === d) {
            const pairedInsIdx = pairs[pairIndex].s;
            
            // Catch up insert pointer to keep order
            while (s < pairedInsIdx) {
              const insOp = consecutiveInserts[s];
              rows.push({
                left: { lineNum: null, text: '', type: 'empty' },
                right: { lineNum: insOp.newIdx + 1, text: newLines[insOp.newIdx], type: 'added' },
              });
              additions++;
              s++;
            }

            // Emit paired lines as modified
            const delOp = consecutiveDeletes[d];
            const insOp = consecutiveInserts[s]; // s is now pairedInsIdx
            const textL = oldLines[delOp.oldIdx];
            const textR = newLines[insOp.newIdx];
            const { leftSpans, rightSpans } = getCharDiff(textL, textR);

            const isMatch = cleanLine(textL, options) === cleanLine(textR, options);
            rows.push({
              left: { lineNum: delOp.oldIdx + 1, text: textL, type: isMatch ? 'unchanged' : 'modified', charSpans: isMatch ? undefined : leftSpans },
              right: { lineNum: insOp.newIdx + 1, text: textR, type: isMatch ? 'unchanged' : 'modified', charSpans: isMatch ? undefined : rightSpans },
            });
            if (!isMatch) {
              modifications++;
            }
            
            d++;
            s++;
            pairIndex++;
          } else if (d < D && (pairIndex >= pairs.length || d < pairs[pairIndex].d)) {
            // Unpaired delete
            const delOp = consecutiveDeletes[d];
            rows.push({
              left: { lineNum: delOp.oldIdx + 1, text: oldLines[delOp.oldIdx], type: 'removed' },
              right: { lineNum: null, text: '', type: 'empty' },
            });
            deletions++;
            d++;
          } else {
            // Unpaired insert (or leftover inserts)
            const insOp = consecutiveInserts[s];
            rows.push({
              left: { lineNum: null, text: '', type: 'empty' },
              right: { lineNum: insOp.newIdx + 1, text: newLines[insOp.newIdx], type: 'added' },
            });
            additions++;
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
