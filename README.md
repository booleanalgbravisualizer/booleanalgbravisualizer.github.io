# Boolean Algebra Visualizer

[![Live Demo](https://img.shields.io/badge/demo-online-green.svg)](https://DeanKuruzovich.github.io/BooleanAlgebraVisualizer/)

A powerful tool to visualize, analyze, and simplify boolean expressions. This visualizer provides real-time generation of logic circuits, CMOS layouts, truth tables, and Karnaugh maps.

## Features

### 🧠 Advanced Parsing
The visualizer uses a robust recursive descent parser that supports a wide variety of input formats:
- **Operators**: `+` (OR), `*` (AND), `!` (NOT), `^` (XOR).
- **Universal Gates**: NAND, NOR, XNOR.
- **Keywords**: Supports text-based operators like `AND`, `OR`, `NOT`, `NAND`, etc.
- **Symbols**: Familiar programming symbols like `&`, `|`, and `~`.
- **Shorthand**: Supports implicit AND (e.g., `AB`) and postfix NOT (e.g., `A'`).

### 📊 Visualizations
- **Logic Gate Diagrams**: Dynamic SVG generation with proportional spacing for clear, readable schematics.
- **CMOS Circuits**: Visualizes Complementary Metal-Oxide-Semiconductor layouts, detailing:
  - **Pull-Up Network (PUN)**: PMOS transistor arrangement.
  - **Pull-Down Network (PDN)**: NMOS transistor arrangement.
- **Truth Tables**: Precise evaluation of all variable combinations.
- **Karnaugh Maps (K-Maps)**: Interactive maps supporting 2 to 8+ variables using standard Gray code ordering and nested grid layouts for higher dimensions.

### 📋 Clipboard & Export Tools
- **Rich Text Copy**: Format tables directly for pasting into Google Docs or Microsoft Word with styles preserved.
- **CSV Export**: Download truth tables and K-maps for spreadsheet analysis.
- **LaTeX Export**: Generate LaTeX code for inclusion in academic papers or reports.

## Usage

Enter a boolean expression into the input field. The parser is flexible and accepts multiple formats.

### Examples
| Logic | Input Example | Alternative |
|-------|--------------:|-------------|
| **AND** | `A * B` | `AB`, `A and B`, `A & B` |
| **OR** | `A + B` | `A or B`, `A | B` |
| **NOT** | `!A` | `A'`, `~A`, `not A` |
| **NAND** | `A nand B` | `A ↑ B` |
| **NOR** | `A nor B` | `A ↓ B` |
| **XOR** | `A ^ B` | `A xor B` |
| **Complex** | `(A+B)*C` | `(!A B) + (C ^ D)` |

## Development

To set up the project locally for development:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Locally**
   Start the local server (available at `http://localhost:3000` by default):
   ```bash
   npm start
   ```

3. **Deploy**
   Build and deploy to GitHub Pages:
   ```bash
   npm run deploy
   ```

## Tech Stack

- **Core**: Vanilla JavaScript (ES6+)
- **Graphics**: SVG (Scalable Vector Graphics)
- **Styling**: CSS3, CSS Grid/Flexbox
- **Server**: Node.js (Express) for local serving
