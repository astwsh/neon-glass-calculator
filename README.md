# Neon Glass Scientific Calculator

> 🚀 **Live Web App**: [https://astwsh.github.io/neon-glass-calculator/](https://astwsh.github.io/neon-glass-calculator/)

A futuristic, high-precision Scientific Calculator crafted with cyber neon glassmorphism aesthetics, responsive touch controls, tactile Web Audio feedback, interactive calculation history, and complete trigonometric & algebraic functions.


![Neon Glass Scientific Calculator](favicon.svg)

---

## Features

### 1. Scientific & Advanced Mathematics
- **Trigonometry**: `sin`, `cos`, `tan` with `Deg` / `Rad` angle mode toggle.
- **Inverse Functions (`Inv`)**: Inverts functions into `sin⁻¹` (`asin`), `cos⁻¹` (`acos`), `tan⁻¹` (`atan`), `eˣ` (`exp`), `10ˣ`, and `x²`.
- **Logarithms & Powers**: Natural logarithm (`ln`), base-10 logarithm (`log`), power/exponent (`^`), and square root (`√`).
- **Constants**: Pi (`π` ≈ 3.14159...) and Euler's Number (`e` ≈ 2.71828...).
- **Algebraic Utilities**: Factorial (`!`), percentage (`%`), and smart parentheses `( )`.
- **Implicit Multiplication**: Supports expressions like `2π`, `5(3+4)`, and `3sin(90)`.

### 2. Bulletproof Error Handling & Usability
- **Zero-Crash Math Parser**: Trailing operators (`5 + =`) evaluate gracefully instead of throwing errors.
- **Auto-Closing Parentheses**: Missing closing brackets are closed automatically before calculating.
- **Leading Zero Protection**: Prevents multi-zero bugs (`000` -> `0`) and auto-replaces lone zeros (`0` + `5` -> `5`).
- **Precision Floating Point Guard**: Fixes JavaScript float rounding drift (`0.1 + 0.2 = 0.3`).
- **Division-by-Zero Safety**: Explicit, clear error messages (`Cannot divide by zero`).

### 3. Cyber Neon Glassmorphism UX
- **Collapsible Scientific Tray**: Switch between Basic Mode and Full Scientific Mode with the smooth neon chevron drawer `⌄` / `^`.
- **Interactive History**: View recent calculations. Click any past calculation to instantly recall its result back into the calculator.
- **History Persistence**: Automatically saved to `localStorage` across browser visits.
- **Click-to-Copy Result**: Tap the display screen to copy the calculation result to clipboard with an animated "Copied!" notification.
- **Tactile Sound Effects**: Synthesized audio clicks generated via the Web Audio API with a one-click Mute/Unmute toggle.
- **Full Keyboard Support**: Seamlessly type numbers, operators, Enter/Equal, Backspace/DEL, and AC with visual neon button glow feedback.

---

## Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `0` - `9`, `.` | Enter numbers and decimals |
| `+`, `-`, `*`, `/`, `^` | Arithmetic & exponent operators |
| `x` or `X` | Multiply (`×`) |
| `%` | Percentage |
| `!` | Factorial |
| `(` and `)` | Parentheses |
| `Enter` or `=` | Calculate result |
| `Backspace` | Delete last character |
| `Delete`, `Escape`, `c`, `C` | All Clear (`AC`) |

---

## 1-Click Free Deployment Options

Anyone in the world can access your calculator using any of these free static hosting options:

### Option 1: GitHub Pages (Permanent & Free)
1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Neon Glass Scientific Calculator"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. In your GitHub repository:
   - Navigate to **Settings** > **Pages**.
   - Under **Build and deployment**, select **GitHub Actions** (the included `.github/workflows/deploy.yml` will deploy automatically) OR select **Deploy from a branch** > `main` > `/ (root)`.
   - Your calculator will be live at `https://<your-username>.github.io/<repo-name>/`.

### Option 2: Vercel (Instant 1-Click)
1. Install Vercel CLI (or go to [vercel.com](https://vercel.com)):
   ```bash
   npx vercel
   ```
2. Press Enter to accept defaults. Vercel will immediately output a live production URL!

### Option 3: Netlify (Drag & Drop or CLI)
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop) and drag-and-drop the project folder.
2. Or deploy via Netlify CLI:
   ```bash
   npx netlify deploy --prod
   ```

### Option 4: Surge.sh (Single Terminal Command)
Deploy to a public URL in seconds:
```bash
npx surge . --domain neon-glass-calc.surge.sh
```

---

## Local Development

To run the calculator locally:
```bash
npm start
```
Then open `http://localhost:3000` in your web browser.

To run automated tests:
```bash
npm test
```
