/**
 * Best-effort Partial JSON Parser and Escape Resolver
 */

export interface ParserResult {
  value: any;
  errorPos: number;
  errorLine: number;
  errorCol: number;
  errorMessage: string;
  fullyParsed: boolean;
  successLength: number;
  successPercentage: number;
}

export class PartialJsonParser {
  private str: string;
  private pos: number = 0;
  private errorPos: number = -1;
  private errorMessage: string = "";
  private fullyParsed: boolean = true;

  constructor(str: string) {
    this.str = str;
  }

  // Get line and column from character index
  public getLineCol(index: number): { line: number; col: number } {
    let line = 1;
    let col = 1;
    for (let i = 0; i < Math.min(index, this.str.length); i++) {
      if (this.str[i] === '\n') {
        line++;
        col = 1;
      } else {
        col++;
      }
    }
    return { line, col };
  }

  // Skip whitespaces
  private skipWhitespace() {
    while (this.pos < this.str.length) {
      const ch = this.str[this.pos];
      if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
        this.pos++;
      } else {
        break;
      }
    }
  }

  public parse(): ParserResult {
    this.skipWhitespace();
    if (this.pos >= this.str.length) {
      return {
        value: undefined,
        errorPos: 0,
        errorLine: 1,
        errorCol: 1,
        errorMessage: "Empty input",
        fullyParsed: false,
        successLength: 0,
        successPercentage: 0
      };
    }

    const val = this.parseValue();
    this.skipWhitespace();

    if (this.pos < this.str.length && this.fullyParsed) {
      // Trailing characters after a complete JSON value
      this.fullyParsed = false;
      this.errorPos = this.pos;
      this.errorMessage = "Unexpected extra characters at the end of JSON";
    }

    const finalErrorPos = this.errorPos >= 0 ? this.errorPos : this.str.length;
    const { line: errorLine, col: errorCol } = this.getLineCol(finalErrorPos);
    const successLen = Math.min(finalErrorPos, this.str.length);
    const totalLen = Math.max(this.str.length, 1);
    const successPercentage = Math.round((successLen / totalLen) * 100);

    return {
      value: val,
      errorPos: this.errorPos,
      errorLine,
      errorCol,
      errorMessage: this.errorMessage,
      fullyParsed: this.fullyParsed,
      successLength: successLen,
      successPercentage
    };
  }

  private parseValue(): any {
    this.skipWhitespace();
    if (this.pos >= this.str.length) {
      this.markError("Unexpected end of input");
      return undefined;
    }

    const ch = this.str[this.pos];
    if (ch === '{') {
      return this.parseObject();
    } else if (ch === '[') {
      return this.parseArray();
    } else if (ch === '"') {
      return this.parseString();
    } else if (ch === 't' || ch === 'f') {
      return this.parseLiteralBoolean();
    } else if (ch === 'n') {
      return this.parseLiteralNull();
    } else if (ch === '-' || (ch >= '0' && ch <= '9')) {
      return this.parseNumber();
    } else {
      this.markError(`Unexpected token '${ch}'`);
      // Advance to avoid infinite loops in caller
      this.pos++;
      return undefined;
    }
  }

  private markError(msg: string) {
    if (this.fullyParsed) {
      this.fullyParsed = false;
      this.errorPos = this.pos;
      this.errorMessage = msg;
    }
  }

  private parseObject(): Record<string, any> {
    const obj: Record<string, any> = {};
    this.pos++; // skip '{'

    let first = true;
    while (this.pos < this.str.length) {
      this.skipWhitespace();
      if (this.pos >= this.str.length) {
        this.markError("Unclosed object: expected '}'");
        return obj;
      }

      if (this.str[this.pos] === '}') {
        this.pos++;
        return obj;
      }

      if (!first) {
        if (this.str[this.pos] === ',') {
          this.pos++;
          this.skipWhitespace();
          // Check for trailing comma followed by closing brace
          if (this.pos < this.str.length && this.str[this.pos] === '}') {
            this.markError("Trailing comma is not allowed in JSON");
            this.pos++;
            return obj;
          }
        } else {
          this.markError("Expected ',' or '}' between object properties");
          return obj;
        }
      }
      first = false;

      this.skipWhitespace();
      if (this.pos >= this.str.length) {
        this.markError("Expected object property key");
        return obj;
      }

      // Expect a double-quoted string key
      if (this.str[this.pos] !== '"') {
        this.markError("Expected double-quoted property name key");
        return obj;
      }

      const key = this.parseString();
      if (key === undefined) {
        return obj; // Parse failed inside string
      }

      this.skipWhitespace();
      if (this.pos >= this.str.length || this.str[this.pos] !== ':') {
        this.markError(`Expected ':' after property name "${key}"`);
        return obj;
      }
      this.pos++; // skip ':'

      const val = this.parseValue();
      obj[key] = val;

      this.skipWhitespace();
    }

    this.markError("Unclosed object");
    return obj;
  }

  private parseArray(): any[] {
    const arr: any[] = [];
    this.pos++; // skip '['

    let first = true;
    while (this.pos < this.str.length) {
      this.skipWhitespace();
      if (this.pos >= this.str.length) {
        this.markError("Unclosed array: expected ']'");
        return arr;
      }

      if (this.str[this.pos] === ']') {
        this.pos++;
        return arr;
      }

      if (!first) {
        if (this.str[this.pos] === ',') {
          this.pos++;
          this.skipWhitespace();
          if (this.pos < this.str.length && this.str[this.pos] === ']') {
            this.markError("Trailing comma is not allowed in JSON array");
            this.pos++;
            return arr;
          }
        } else {
          this.markError("Expected ',' or ']' between array elements");
          return arr;
        }
      }
      first = false;

      const val = this.parseValue();
      arr.push(val);

      this.skipWhitespace();
    }

    this.markError("Unclosed array");
    return arr;
  }

  private parseString(): string | undefined {
    this.pos++; // skip leading '"'
    let res = "";

    while (this.pos < this.str.length) {
      const ch = this.str[this.pos];
      if (ch === '"') {
        this.pos++; // skip trailing '"'
        return res;
      } else if (ch === '\\') {
        this.pos++; // skip '\'
        if (this.pos >= this.str.length) {
          this.markError("Unterminated escape sequence in string");
          return res;
        }
        const esc = this.str[this.pos];
        if (esc === '"') res += '"';
        else if (esc === '\\') res += '\\';
        else if (esc === '/') res += '/';
        else if (esc === 'b') res += '\b';
        else if (esc === 'f') res += '\f';
        else if (esc === 'n') res += '\n';
        else if (esc === 'r') res += '\r';
        else if (esc === 't') res += '\t';
        else if (esc === 'u') {
          if (this.pos + 4 >= this.str.length) {
            this.markError("Invalid Unicode escape sequence in string");
            return res;
          }
          const hex = this.str.substring(this.pos + 1, this.pos + 5);
          if (/^[0-9a-fA-F]{4}$/.test(hex)) {
            res += String.fromCharCode(parseInt(hex, 16));
            this.pos += 4;
          } else {
            this.markError("Invalid Unicode escape sequence in string");
            return res;
          }
        } else {
          // Keep literal character
          res += esc;
        }
        this.pos++;
      } else {
        res += ch;
        this.pos++;
      }
    }

    this.markError("Unterminated double-quoted string");
    return res;
  }

  private parseLiteralBoolean(): boolean | undefined {
    const start = this.pos;
    if (this.str.substring(this.pos, this.pos + 4) === "true") {
      this.pos += 4;
      return true;
    } else if (this.str.substring(this.pos, this.pos + 5) === "false") {
      this.pos += 5;
      return false;
    } else {
      this.markError("Invalid boolean literal");
      this.pos++;
      return undefined;
    }
  }

  private parseLiteralNull(): null {
    if (this.str.substring(this.pos, this.pos + 4) === "null") {
      this.pos += 4;
      return null;
    } else {
      this.markError("Invalid null literal");
      this.pos++;
      return null;
    }
  }

  private parseNumber(): number {
    const start = this.pos;
    if (this.str[this.pos] === '-') {
      this.pos++;
    }
    while (this.pos < this.str.length) {
      const ch = this.str[this.pos];
      if ((ch >= '0' && ch <= '9') || ch === '.' || ch === 'e' || ch === 'E' || ch === '+' || ch === '-') {
        this.pos++;
      } else {
        break;
      }
    }
    const numStr = this.str.substring(start, this.pos);
    const val = Number(numStr);
    if (isNaN(val)) {
      this.markError(`Invalid numeric format: ${numStr}`);
    }
    return val;
  }
}

/**
 * Escapes a JSON string with backslashes
 */
export function escapeSlashes(input: string): string {
  try {
    // If it's already an object, stringify it
    let working = input;
    try {
      const obj = JSON.parse(input);
      working = JSON.stringify(obj);
    } catch {
      // Just escape standard input
    }
    return JSON.stringify(working);
  } catch {
    return input.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }
}

/**
 * Robust unescaping of backslashes in JSON (Strip Slashes)
 * Properly resolves multiple slashes (e.g. \\\" -> \" or \\ -> \)
 */
export function unescapeSlashes(input: string): string {
  let trimmed = input.trim();
  
  // If it's a full JSON-string representation (starts and ends with double quotes)
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'string') {
        return parsed;
      }
    } catch {
      // Fallback to manual decoding
    }
  }

  let result = "";
  let i = 0;
  while (i < input.length) {
    if (input[i] === '\\') {
      if (i + 1 < input.length) {
        const next = input[i + 1];
        if (next === '\\') {
          // Double backslash turns into a single backslash
          result += '\\';
          i += 2;
        } else if (next === '"') {
          // Escaped quote becomes literal quote
          result += '"';
          i += 2;
        } else if (next === 'n') {
          result += '\n';
          i += 2;
        } else if (next === 't') {
          result += '\t';
          i += 2;
        } else if (next === 'r') {
          result += '\r';
          i += 2;
        } else if (next === '/') {
          result += '/';
          i += 2;
        } else if (next === 'b') {
          result += '\b';
          i += 2;
        } else if (next === 'f') {
          result += '\f';
          i += 2;
        } else {
          // Keep character literal but strip backslash
          result += next;
          i += 2;
        }
      } else {
        result += '\\';
        i++;
      }
    } else {
      result += input[i];
      i++;
    }
  }
  return result;
}

/**
 * Detects whether the input string has escaped quotes or slashes that can be stripped
 */
export function detectEscapedJson(input: string): boolean {
  if (input.includes('\\"') || input.includes('\\\\')) {
    // Check if it is NOT a valid standard JSON but parses or becomes cleaner after unescaping
    try {
      JSON.parse(input);
      return false; // Already valid standard JSON, no need to strip
    } catch {
      return true; // Malformed but has escapes - prime candidate for stripping slashes
    }
  }
  return false;
}
