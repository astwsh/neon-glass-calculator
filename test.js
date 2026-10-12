const assert = require("assert");

// Copy of math engine from script.js for verification
function factorial(n) {
  if (n < 0 || !Number.isInteger(n)) throw new Error("Factorial requires non-negative integer");
  if (n > 170) throw new Error("Calculation overflow");
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function fromRad(rad) {
  return (rad * 180) / Math.PI;
}

function cleanExpressionForEval(expr) {
  let clean = expr.trim();
  while (/[+\-*/.^]$/.test(clean)) {
    clean = clean.slice(0, -1).trim();
  }
  const openCount = (clean.match(/\(/g) || []).length;
  const closeCount = (clean.match(/\)/g) || []).length;
  if (openCount > closeCount) {
    clean += ")".repeat(openCount - closeCount);
  }
  return clean;
}

function evaluateExpression(input, angleMode = "deg") {
  let s = cleanExpressionForEval(input);
  if (!s) return 0;

  s = s
    .replace(/(\d|\)|%|!)(π|e(?![a-z0-9])|sin|cos|tan|asin|acos|atan|ln|log|sqrt|\()/g, (m, p1, p2) => p1 + "*" + p2)
    .replace(/(π|e(?![a-z0-9]))(\d|\()/g, (m, p1, p2) => p1 + "*" + p2);

  s = s.replace(/π/g, `(${Math.PI})`);
  s = s.replace(/e(?![a-z0-9])/gi, `(${Math.E})`);

  const tokenRegex = /(\d+(?:\.\d*)?|\.\d+)|(asin|acos|atan|sin|cos|tan|ln|log|sqrt)|([+\-*/^()])|(%|!)/g;
  const tokens = [];
  let match;
  let lastIndex = 0;

  while ((match = tokenRegex.exec(s)) !== null) {
    const gap = s.slice(lastIndex, match.index).trim();
    if (gap) throw new Error("Invalid format");
    if (match[1] !== undefined) tokens.push({ type: "num", value: parseFloat(match[1]) });
    else if (match[2] !== undefined) tokens.push({ type: "fn", value: match[2] });
    else if (match[3] !== undefined) tokens.push({ type: "op", value: match[3] });
    else if (match[4] !== undefined) tokens.push({ type: "postfix", value: match[4] });
    lastIndex = tokenRegex.lastIndex;
  }
  const remaining = s.slice(lastIndex).trim();
  if (remaining) throw new Error("Invalid format");

  let pos = 0;
  const isDeg = angleMode === "deg";

  function parseFactor() {
    const t = tokens[pos];
    if (!t) throw new Error("Invalid format");

    let val;
    if (t.type === "fn") {
      const fnName = t.value;
      pos++;
      let arg;
      if (tokens[pos] && tokens[pos].type === "op" && tokens[pos].value === "(") {
        pos++;
        arg = parseAddSub();
        if (!tokens[pos] || tokens[pos].value !== ")") throw new Error("Missing closing parenthesis");
        pos++;
      } else {
        arg = parseFactor();
      }

      switch (fnName) {
        case "sin": {
          val = Math.sin(isDeg ? toRad(arg) : arg);
          if (isDeg && Math.abs(arg % 180) === 0) val = 0;
          break;
        }
        case "cos": {
          val = Math.cos(isDeg ? toRad(arg) : arg);
          if (isDeg && Math.abs(arg % 180) === 90) val = 0;
          break;
        }
        case "tan": {
          if (isDeg && Math.abs(arg % 180) === 90) throw new Error("Undefined (tan 90°)");
          val = Math.tan(isDeg ? toRad(arg) : arg);
          if (isDeg && Math.abs(arg % 180) === 0) val = 0;
          break;
        }
        case "asin": {
          if (arg < -1 || arg > 1) throw new Error("Domain error: asin [-1, 1]");
          val = Math.asin(arg);
          if (isDeg) val = fromRad(val);
          break;
        }
        case "acos": {
          if (arg < -1 || arg > 1) throw new Error("Domain error: acos [-1, 1]");
          val = Math.acos(arg);
          if (isDeg) val = fromRad(val);
          break;
        }
        case "atan": {
          val = Math.atan(arg);
          if (isDeg) val = fromRad(val);
          break;
        }
        case "ln": {
          if (arg <= 0) throw new Error("Domain error: ln(x <= 0)");
          val = Math.log(arg);
          break;
        }
        case "log": {
          if (arg <= 0) throw new Error("Domain error: log(x <= 0)");
          val = Math.log10(arg);
          break;
        }
        case "sqrt": {
          if (arg < 0) throw new Error("Domain error: √(negative)");
          val = Math.sqrt(arg);
          break;
        }
        default:
          throw new Error("Unknown function: " + fnName);
      }
    } else if (t.type === "op" && t.value === "-") {
      pos++;
      val = -parseFactor();
    } else if (t.type === "op" && t.value === "+") {
      pos++;
      val = parseFactor();
    } else if (t.type === "op" && t.value === "(") {
      pos++;
      val = parseAddSub();
      if (!tokens[pos] || tokens[pos].value !== ")") throw new Error("Missing closing parenthesis");
      pos++;
    } else if (t.type === "num") {
      pos++;
      val = t.value;
    } else {
      throw new Error("Unexpected symbol");
    }

    while (tokens[pos] && tokens[pos].type === "postfix") {
      const post = tokens[pos++].value;
      if (post === "%") {
        val = val / 100;
      } else if (post === "!") {
        val = factorial(val);
      }
    }

    return val;
  }

  function parseExponent() {
    let val = parseFactor();
    if (tokens[pos] && tokens[pos].type === "op" && tokens[pos].value === "^") {
      pos++;
      const exp = parseExponent();
      val = Math.pow(val, exp);
    }
    return val;
  }

  function parseMulDiv() {
    let val = parseExponent();
    while (tokens[pos] && tokens[pos].type === "op" && (tokens[pos].value === "*" || tokens[pos].value === "/")) {
      const op = tokens[pos++].value;
      const right = parseExponent();
      if (op === "*") {
        val *= right;
      } else {
        if (right === 0) throw new Error("Cannot divide by zero");
        val /= right;
      }
    }
    return val;
  }

  function parseAddSub() {
    let val = parseMulDiv();
    while (tokens[pos] && tokens[pos].type === "op" && (tokens[pos].value === "+" || tokens[pos].value === "-")) {
      const op = tokens[pos++].value;
      const right = parseMulDiv();
      if (op === "+") {
        val += right;
      } else {
        val -= right;
      }
    }
    return val;
  }

  const result = parseAddSub();
  if (pos !== tokens.length) throw new Error("Invalid format");
  if (!Number.isFinite(result)) throw new Error("Calculation overflow");

  return Number(result.toPrecision(12));
}

// Test Suite
console.log("Starting Neon Glass Scientific Calculator Test Suite...\n");

const tests = [
  // 1. Basic Arithmetic & PEMDAS
  { expr: "5 + 3", expected: 8 },
  { expr: "10 - 4", expected: 6 },
  { expr: "6 * 7", expected: 42 },
  { expr: "20 / 4", expected: 5 },
  { expr: "2 + 3 * 4", expected: 14 },
  { expr: "(2 + 3) * 4", expected: 20 },
  
  // 2. Precision & Decimals
  { expr: "0.1 + 0.2", expected: 0.3 },
  { expr: "5.", expected: 5 },
  { expr: "5. + 2", expected: 7 },
  { expr: ".5 * 4", expected: 2 },
  
  // 3. Forgiveness: Trailing operators & Unclosed Parens
  { expr: "5 +", expected: 5 },
  { expr: "12 *", expected: 12 },
  { expr: "(5 + 3", expected: 8 },
  { expr: "2 * (3 + 4", expected: 14 },
  
  // 4. Unary minus & Negatives
  { expr: "-5 + 2", expected: -3 },
  { expr: "5 * -3", expected: -15 },
  { expr: "10 / -2", expected: -5 },
  { expr: "-4 * -4", expected: 16 },
  
  // 5. Percentages & Factorials
  { expr: "50%", expected: 0.5 },
  { expr: "100 * 20%", expected: 20 },
  { expr: "5!", expected: 120 },
  { expr: "0!", expected: 1 },
  
  // 6. Exponentiation
  { expr: "2 ^ 3", expected: 8 },
  { expr: "3 ^ 2", expected: 9 },
  { expr: "2 ^ 3 ^ 2", expected: 512 }, // 2^(3^2) = 2^9 = 512
  
  // 7. Scientific Constants & Implicit Multiplication
  { expr: "2π", expected: Number((2 * Math.PI).toPrecision(12)) },
  { expr: "ln(e)", expected: 1 },
  { expr: "sqrt(16)", expected: 4 },
  { expr: "log(100)", expected: 2 },
  { expr: "log(1000)", expected: 3 },
  
  // 8. Trigonometry (Deg vs Rad)
  { expr: "sin(90)", mode: "deg", expected: 1 },
  { expr: "cos(0)", mode: "deg", expected: 1 },
  { expr: "tan(45)", mode: "deg", expected: 1 },
  { expr: "asin(1)", mode: "deg", expected: 90 },
  { expr: "sin(0)", mode: "deg", expected: 0 },
  { expr: "cos(90)", mode: "deg", expected: 0 },
  { expr: "sin(π / 2)", mode: "rad", expected: 1 }
];

let passed = 0;
let failed = 0;

tests.forEach(({ expr, mode = "deg", expected }) => {
  try {
    const actual = evaluateExpression(expr, mode);
    assert.strictEqual(actual, expected);
    console.log(`✓ PASS: ${expr} [${mode}] = ${actual}`);
    passed++;
  } catch (err) {
    console.error(`✗ FAIL: ${expr} [${mode}] -> Expected ${expected}, got error: ${err.message}`);
    failed++;
  }
});

// Test Expected Errors
const errorTests = [
  { expr: "5 / 0", errorSubstring: "Cannot divide by zero" },
  { expr: "sqrt(-4)", errorSubstring: "Domain error" },
  { expr: "asin(2)", errorSubstring: "Domain error" },
  { expr: "tan(90)", mode: "deg", errorSubstring: "Undefined" }
];

errorTests.forEach(({ expr, mode = "deg", errorSubstring }) => {
  try {
    evaluateExpression(expr, mode);
    console.error(`✗ FAIL: ${expr} should have thrown an error but didn't.`);
    failed++;
  } catch (err) {
    if (err.message.includes(errorSubstring)) {
      console.log(`✓ PASS (Error caught correctly): ${expr} -> "${err.message}"`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${expr} -> Wrong error: "${err.message}" (expected "${errorSubstring}")`);
      failed++;
    }
  }
});

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
