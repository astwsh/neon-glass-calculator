// DOM Elements
const screen = document.querySelector("#screen");
const expressionLine = document.querySelector("#expression");
const screenContainer = document.querySelector("#screen-container");
const copyToast = document.querySelector("#copy-toast");

const calculatorCard = document.querySelector(".calculator");
const calculatorView = document.querySelector("#calculator-view");
const historyView = document.querySelector("#history-view");

const modeToggle = document.querySelector("#mode-toggle");
const chevronDrawerBtn = document.querySelector("#chevron-drawer-btn");
const angleToggle = document.querySelector("#angle-toggle");
const angleBadge = document.querySelector("#angle-badge");
const invToggle = document.querySelector("#inv-toggle");
const soundToggle = document.querySelector("#sound-toggle");
const iconSoundOn = document.querySelector("#icon-sound-on");
const iconSoundOff = document.querySelector("#icon-sound-off");

const historyToggle = document.querySelector("#history-toggle");
const historyBack = document.querySelector("#history-back");
const clearHistoryButton = document.querySelector("#clear-history");
const historyList = document.querySelector("#history-list");
const historyEmpty = document.querySelector("#history-empty");
const keysContainer = document.querySelector(".keys-container");

// State
let expression = "";
let justEvaluated = false;
let angleMode = localStorage.getItem("neon_calc_angle") || "deg"; // "deg" or "rad"
let isInverse = false;
let isScientificOpen = true;
let isSoundEnabled = localStorage.getItem("neon_calc_sound") !== "false";
let calculationHistory = [];
let audioContext = null;

// Initialize saved calculation history
try {
  const savedHistory = localStorage.getItem("neon_calc_history");
  if (savedHistory) {
    calculationHistory = JSON.parse(savedHistory);
  }
} catch {
  calculationHistory = [];
}

/* -------------------------------
   SOUND EFFECTS (Web Audio API)
-------------------------------- */

function playClickSound(freq = 520) {
  if (!isSoundEnabled) return;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioContext) {
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = freq;

    const now = audioContext.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.04, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.07);
  } catch {
    // Audio is optional enhancement
  }
}

function updateSoundUI() {
  if (isSoundEnabled) {
    iconSoundOn.hidden = false;
    iconSoundOff.hidden = true;
    soundToggle.classList.remove("active-muted");
    soundToggle.title = "Mute Sound";
  } else {
    iconSoundOn.hidden = true;
    iconSoundOff.hidden = false;
    soundToggle.classList.add("active-muted");
    soundToggle.title = "Unmute Sound";
  }
}

soundToggle.addEventListener("click", () => {
  isSoundEnabled = !isSoundEnabled;
  localStorage.setItem("neon_calc_sound", String(isSoundEnabled));
  updateSoundUI();
  if (isSoundEnabled) playClickSound(640);
});

/* -------------------------------
   DISPLAY & FORMATTING
-------------------------------- */

function render(value = expression || "0") {
  screen.textContent = value;
  screen.classList.remove("error-state");
}

function formatDisplay(expr) {
  return expr
    .replace(/\*/g, "×")
    .replace(/\//g, "÷")
    .replace(/sqrt\(/g, "√(")
    .replace(/asin\(/g, "sin⁻¹(")
    .replace(/acos\(/g, "cos⁻¹(")
    .replace(/atan\(/g, "tan⁻¹(")
    .replace(/10\^\(/g, "10^(")
    .replace(/e\^\(/g, "e^(");
}

// Copy to clipboard on display click
screenContainer.addEventListener("click", async () => {
  const textToCopy = screen.textContent;
  if (!textToCopy || textToCopy === "Error" || textToCopy.includes("Cannot")) return;

  try {
    await navigator.clipboard.writeText(textToCopy);
    playClickSound(750);
    copyToast.classList.add("visible");
    setTimeout(() => {
      copyToast.classList.remove("visible");
    }, 1400);
  } catch {
    // Clipboard permission not granted
  }
});

/* -------------------------------
   SCIENTIFIC TOGGLES (Mode, Deg/Rad, Inv)
-------------------------------- */

function setScientificDrawer(open) {
  isScientificOpen = open;
  if (open) {
    calculatorCard.classList.remove("scientific-collapsed");
    calculatorCard.classList.add("scientific-open");
  } else {
    calculatorCard.classList.add("scientific-collapsed");
    calculatorCard.classList.remove("scientific-open");
  }
}

modeToggle.addEventListener("click", () => {
  playClickSound();
  setScientificDrawer(!isScientificOpen);
});

chevronDrawerBtn.addEventListener("click", () => {
  playClickSound();
  setScientificDrawer(!isScientificOpen);
});

function updateAngleUI() {
  angleBadge.textContent = angleMode.toUpperCase();
  angleToggle.textContent = angleMode === "deg" ? "Deg" : "Rad";
}

angleToggle.addEventListener("click", () => {
  playClickSound();
  angleMode = angleMode === "deg" ? "rad" : "deg";
  localStorage.setItem("neon_calc_angle", angleMode);
  updateAngleUI();
});

function updateInverseUI() {
  const sinBtn = document.querySelector('[data-fn="sin"], [data-fn="asin"]');
  const cosBtn = document.querySelector('[data-fn="cos"], [data-fn="acos"]');
  const tanBtn = document.querySelector('[data-fn="tan"], [data-fn="atan"]');
  const lnBtn = document.querySelector('[data-fn="ln"], [data-fn="exp"]');
  const logBtn = document.querySelector('[data-fn="log"], [data-fn="tenpow"]');
  const sqrtBtn = document.querySelector('[data-fn="sqrt"], [data-fn="sqr"]');

  if (isInverse) {
    invToggle.classList.add("active-state");
    if (sinBtn) { sinBtn.textContent = "sin⁻¹"; sinBtn.dataset.fn = "asin"; }
    if (cosBtn) { cosBtn.textContent = "cos⁻¹"; cosBtn.dataset.fn = "acos"; }
    if (tanBtn) { tanBtn.textContent = "tan⁻¹"; tanBtn.dataset.fn = "atan"; }
    if (lnBtn) { lnBtn.textContent = "eˣ"; lnBtn.dataset.fn = "exp"; }
    if (logBtn) { logBtn.textContent = "10ˣ"; logBtn.dataset.fn = "tenpow"; }
    if (sqrtBtn) { sqrtBtn.textContent = "x²"; sqrtBtn.dataset.fn = "sqr"; }
  } else {
    invToggle.classList.remove("active-state");
    if (sinBtn) { sinBtn.textContent = "sin"; sinBtn.dataset.fn = "sin"; }
    if (cosBtn) { cosBtn.textContent = "cos"; cosBtn.dataset.fn = "cos"; }
    if (tanBtn) { tanBtn.textContent = "tan"; tanBtn.dataset.fn = "tan"; }
    if (lnBtn) { lnBtn.textContent = "ln"; lnBtn.dataset.fn = "ln"; }
    if (logBtn) { logBtn.textContent = "log"; logBtn.dataset.fn = "log"; }
    if (sqrtBtn) { sqrtBtn.textContent = "√"; sqrtBtn.dataset.fn = "sqrt"; }
  }
}

invToggle.addEventListener("click", () => {
  playClickSound();
  isInverse = !isInverse;
  updateInverseUI();
});

/* -------------------------------
   MATHEMATICAL PARSER & ENGINE
-------------------------------- */

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
  // Strip trailing operators and dangling decimal points
  while (/[+\-*/.^]$/.test(clean)) {
    clean = clean.slice(0, -1).trim();
  }

  // Auto-close missing parentheses
  const openCount = (clean.match(/\(/g) || []).length;
  const closeCount = (clean.match(/\)/g) || []).length;
  if (openCount > closeCount) {
    clean += ")".repeat(openCount - closeCount);
  }

  return clean;
}

function evaluateExpression(input) {
  let s = cleanExpressionForEval(input);
  if (!s) return 0;

  // Insert implicit multiplication: e.g. 2π -> 2*π, 5( -> 5*(, )( -> )*(, 5sin -> 5*sin
  s = s
    .replace(/(\d|\)|%|!)(π|e(?![a-z0-9])|sin|cos|tan|asin|acos|atan|ln|log|sqrt|\()/g, (m, p1, p2) => p1 + "*" + p2)
    .replace(/(π|e(?![a-z0-9]))(\d|\()/g, (m, p1, p2) => p1 + "*" + p2);

  // Substitute constants
  s = s.replace(/π/g, `(${Math.PI})`);
  s = s.replace(/e(?![a-z0-9])/gi, `(${Math.E})`);

  // Tokenize
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
          // Round near-zero results for angles like 180 deg
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

    // Postfix operations: % and !
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

  // Exponentiation ^ (right-associative)
  function parseExponent() {
    let val = parseFactor();
    if (tokens[pos] && tokens[pos].type === "op" && tokens[pos].value === "^") {
      pos++;
      const exp = parseExponent();
      val = Math.pow(val, exp);
    }
    return val;
  }

  // Multiplication & Division
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

  // Addition & Subtraction
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

  // Clean precision formatting (resolves 0.1 + 0.2 floating point drift)
  return Number(result.toPrecision(12));
}

/* -------------------------------
   INPUT CONTROLLER
-------------------------------- */

function getCurrentNumberSegment() {
  const parts = expression.split(/[+\-*/^()]/);
  return parts[parts.length - 1] || "";
}

function append(value) {
  if (justEvaluated) {
    if (/[0-9.πe]/.test(value)) {
      expression = "";
    }
    justEvaluated = false;
  }

  // Decimal Point handling
  if (value === ".") {
    const cur = getCurrentNumberSegment();
    if (cur.includes(".")) return;
    if (!cur) {
      expression += "0";
    }
  }

  // Multiple leading zeros handling
  if (value === "0") {
    const cur = getCurrentNumberSegment();
    if (cur === "0") return; // Prevent 000
  } else if (/^[1-9]$/.test(value)) {
    const cur = getCurrentNumberSegment();
    if (cur === "0") {
      // Replace lone zero: e.g. "0" + "5" -> "5"
      expression = expression.slice(0, -1);
    }
  }

  const lastChar = expression.slice(-1);

  // Binary Operators (+, -, *, /, ^)
  if (/[+\-*/^]/.test(value)) {
    // If expression is empty, only unary minus is allowed
    if (!expression) {
      if (value === "-") expression = "-";
      render(formatDisplay(expression));
      expressionLine.textContent = "";
      return;
    }

    // Allow unary minus after *, /, ^, or (
    if (value === "-" && /[*/^(]/.test(lastChar)) {
      expression += "-";
      render(formatDisplay(expression));
      expressionLine.textContent = "";
      return;
    }

    // If last char is an operator, replace it
    if (/[+\-*/^]/.test(lastChar)) {
      // Check if preceded by another operator (e.g. "*-")
      const secondLast = expression.slice(-2, -1);
      if (/[+\-*/^]/.test(secondLast)) {
        expression = expression.slice(0, -2);
      } else {
        expression = expression.slice(0, -1);
      }
    }
  }

  // Postfix operators (% and !)
  if (value === "%" || value === "!") {
    if (!expression || /[+\-*/^(.]/.test(lastChar)) return;
  }

  expression += value;
  render(formatDisplay(expression));
  expressionLine.textContent = "";
}

function appendFunction(fnName) {
  if (justEvaluated) {
    expression = "";
    justEvaluated = false;
  }

  if (fnName === "sqr") {
    // x²
    append("^2");
    return;
  }
  if (fnName === "exp") {
    // e^x
    expression += "e^(";
    render(formatDisplay(expression));
    return;
  }
  if (fnName === "tenpow") {
    // 10^x
    expression += "10^(";
    render(formatDisplay(expression));
    return;
  }

  // Standard functions: sin, cos, tan, asin, acos, atan, ln, log, sqrt
  const lastChar = expression.slice(-1);
  if (/\d|\)|π|e/i.test(lastChar)) {
    expression += "*";
  }

  expression += fnName + "(";
  render(formatDisplay(expression));
  expressionLine.textContent = "";
}

function appendParens() {
  if (justEvaluated) {
    expression = "";
    justEvaluated = false;
  }

  const openCount = (expression.match(/\(/g) || []).length;
  const closeCount = (expression.match(/\)/g) || []).length;
  const lastChar = expression.slice(-1);

  if (openCount > closeCount && (/[\d)πe%!]/i.test(lastChar))) {
    expression += ")";
  } else {
    if (/[\d)πe%!]/i.test(lastChar)) {
      expression += "*(";
    } else {
      expression += "(";
    }
  }

  render(formatDisplay(expression));
  expressionLine.textContent = "";
}

function clearAll() {
  expression = "";
  justEvaluated = false;
  render("0");
  expressionLine.textContent = "";
}

function deleteLast() {
  if (justEvaluated) {
    expression = "";
    justEvaluated = false;
    render("0");
    expressionLine.textContent = "";
    return;
  }

  // Check if ending with a function like "sin(", "asin(", "sqrt(", "log(", "ln("
  const fnMatch = expression.match(/(asin|acos|atan|sin|cos|tan|ln|log|sqrt|10\^|e\^)\($/);
  if (fnMatch) {
    expression = expression.slice(0, -fnMatch[0].length);
  } else {
    expression = expression.slice(0, -1);
  }

  render(formatDisplay(expression) || "0");
  expressionLine.textContent = "";
}

/* -------------------------------
   CALCULATE
-------------------------------- */

function calculate() {
  if (!expression) return;

  const originalExpression = expression;

  try {
    const result = evaluateExpression(expression);

    const formattedResult = String(result);
    const formattedOriginal = formatDisplay(cleanExpressionForEval(originalExpression));

    expressionLine.textContent = formattedOriginal + " =";
    expression = formattedResult;
    justEvaluated = true;

    render(formattedResult);
    addToHistory(formattedOriginal, formattedResult);
  } catch (err) {
    screen.textContent = err.message || "Error";
    screen.classList.add("error-state");
    expressionLine.textContent = "Check expression";
    expression = "";
    justEvaluated = false;
  }
}

/* -------------------------------
   CALCULATION HISTORY
-------------------------------- */

function saveHistory() {
  try {
    localStorage.setItem("neon_calc_history", JSON.stringify(calculationHistory));
  } catch {
    // localStorage full or disabled
  }
}

function addToHistory(expr, result) {
  calculationHistory.unshift({ expr, result });
  calculationHistory = calculationHistory.slice(0, 25);
  saveHistory();
  renderHistory();
}

function renderHistory() {
  historyList.replaceChildren();
  const hasHistory = calculationHistory.length > 0;
  historyEmpty.hidden = hasHistory;

  calculationHistory.forEach(item => {
    const listItem = document.createElement("li");
    listItem.setAttribute("role", "button");
    listItem.setAttribute("tabindex", "0");
    listItem.title = "Click to load this result into calculator";

    const expressionEl = document.createElement("div");
    expressionEl.className = "history-expression";
    expressionEl.textContent = item.expr;

    const resultEl = document.createElement("div");
    resultEl.className = "history-result";
    resultEl.textContent = "= " + item.result;

    listItem.append(expressionEl, resultEl);

    // Clicking history item recalls the result back to calculator
    listItem.addEventListener("click", () => {
      playClickSound(600);
      expression = item.result;
      justEvaluated = true;
      render(item.result);
      expressionLine.textContent = item.expr + " =";
      closeHistory();
    });

    historyList.appendChild(listItem);
  });
}

function openHistory() {
  renderHistory();
  calculatorView.hidden = true;
  historyView.hidden = false;
}

function closeHistory() {
  historyView.hidden = true;
  calculatorView.hidden = false;
}

historyToggle.addEventListener("click", () => {
  playClickSound();
  openHistory();
});

historyBack.addEventListener("click", () => {
  playClickSound();
  closeHistory();
});

clearHistoryButton.addEventListener("click", () => {
  playClickSound();
  calculationHistory = [];
  saveHistory();
  renderHistory();
});

/* -------------------------------
   KEYPAD CLICK HANDLERS
-------------------------------- */

keysContainer.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;

  playClickSound();

  // Button press glow effect
  button.classList.add("pressed");
  setTimeout(() => {
    button.classList.remove("pressed");
  }, 120);

  const action = button.dataset.action;
  const fn = button.dataset.fn;
  const value = button.dataset.value;

  if (action === "clear") {
    clearAll();
  } else if (action === "delete") {
    deleteLast();
  } else if (action === "equals") {
    calculate();
  } else if (action === "parens") {
    appendParens();
  } else if (fn) {
    appendFunction(fn);
  } else if (value !== undefined) {
    append(value);
  }
});

/* -------------------------------
   KEYBOARD SUPPORT
-------------------------------- */

function highlightButton(selector) {
  const btn = document.querySelector(selector);
  if (btn) {
    btn.classList.add("pressed");
    setTimeout(() => btn.classList.remove("pressed"), 120);
  }
}

document.addEventListener("keydown", event => {
  if (!historyView.hidden) {
    if (event.key === "Escape") {
      closeHistory();
    }
    return;
  }

  const key = event.key;

  if (/^[0-9.]$/.test(key)) {
    playClickSound();
    highlightButton(`[data-value="${key}"]`);
    append(key);
  } else if (/^[+\-*/^%!]$/.test(key)) {
    playClickSound();
    highlightButton(`[data-value="${key}"]`);
    append(key);
  } else if (key === "x" || key === "X") {
    playClickSound();
    highlightButton('[data-value="*"]');
    append("*");
  } else if (key === "(" || key === ")") {
    playClickSound();
    highlightButton('[data-action="parens"]');
    if (key === "(") {
      const last = expression.slice(-1);
      if (/[\d)πe%!]/i.test(last)) expression += "*(";
      else expression += "(";
    } else {
      expression += ")";
    }
    render(formatDisplay(expression));
  } else if (key === "Enter" || key === "=") {
    event.preventDefault();
    playClickSound(650);
    highlightButton('[data-action="equals"]');
    calculate();
  } else if (key === "Backspace") {
    playClickSound(480);
    highlightButton('[data-action="delete"]');
    deleteLast();
  } else if (key === "Delete" || key === "c" || key === "C" || key === "Escape") {
    playClickSound(450);
    highlightButton('[data-action="clear"]');
    clearAll();
  }
});

/* -------------------------------
   INITIAL SETUP
-------------------------------- */

updateSoundUI();
updateAngleUI();
updateInverseUI();
setScientificDrawer(true);
render("0");
renderHistory();
