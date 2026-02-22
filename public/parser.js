/**
 * Boolean Algebra Parser
 * Converts boolean expressions to AST and evaluates them safely
 */

class BooleanExpression {
  constructor(expression) {
    this.originalExpression = expression;
    this.normalizedExpression = this.normalize(expression);
    this.variables = this.extractVariables();
    this.ast = this.parse();
    this.truthTable = this.generateTruthTable();
  }

  /**
   * Normalize expression: convert various formats to canonical form
   * Supports all symbol variants for each operator
   */
  normalize(expr) {
    return expr
      // NOT variants
      .replace(/'/g, '!')           // ' to !
      .replace(/\u2018/g, '!')      // ' to ! (left single quote)
      .replace(/\u2019/g, '!')      // ' to ! (right single quote/apostrophe)
      .replace(/`/g, '!')           // ` to ! (backtick)
      .replace(/¯/g, '!')           // Overline to !
      .replace(/~/g, '!')           // ~ to !
      // NOR variants
      .replace(/⊽/g, ' nor ')       // NOR symbol
      .replace(/↓/g, ' nor ')       // NOR arrow symbol
      // NAND variants
      .replace(/⊼/g, ' nand ')      // NAND symbol
      .replace(/↑/g, ' nand ')      // NAND arrow symbol
      // XOR variants
      .replace(/⊕/g, ' xor ')       // XOR symbol
      .replace(/\^/g, ' xor ')      // ^ to xor
      // XNOR variants
      .replace(/⊙/g, ' xnor ')      // XNOR symbol
      .replace(/≡/g, ' xnor ')      // Equivalence symbol
      // OR variants
      .replace(/\|/g, ' or ')       // | to or
      .replace(/\+/g, ' or ')       // + to or
      // AND variants
      .replace(/&/g, ' and ')       // & to and
      .replace(/\*/g, ' and ')      // * to and
      .replace(/·/g, ' and ')       // · to and
      .toLowerCase()
      .trim();
  }

  /**
   * Extract all unique variables from expression.
   * Strips keyword operators before matching single-letter variables
   * so "a nor b" yields ['a','b'] not ['a','b','n','o','r'].
   */
  extractVariables() {
    const stripped = this.normalizedExpression
      .replace(/\b(xnor|nand|xor|nor|not|and|or)\b/g, ' ');
    const matches = stripped.match(/[a-z]/g) || [];
    return [...new Set(matches)].sort();
  }

  /**
   * Tokenize expression into meaningful units
   * Supports: keywords (and, or, not, nand, nor, xor, xnor) and ! for NOT
   */
  tokenize(expr) {
    const tokens = [];
    let i = 0;
    while (i < expr.length) {
      const char = expr[i];

      if (/\s/.test(char)) {
        // Skip whitespace
        i++;
      } else if (char === '(') {
        tokens.push({ type: 'LPAREN', value: '(' });
        i++;
      } else if (char === ')') {
        tokens.push({ type: 'RPAREN', value: ')' });
        i++;
      } else if (char === '!') {
        tokens.push({ type: 'NOT', value: '!' });
        i++;
      } else if (/[a-z]/.test(char)) {
        // Check for keyword operators or variables
        const remaining = expr.substring(i);
        if (remaining.startsWith('nand')) {
          tokens.push({ type: 'NAND', value: 'nand' });
          i += 4;
        } else if (remaining.startsWith('nor')) {
          tokens.push({ type: 'NOR', value: 'nor' });
          i += 3;
        } else if (remaining.startsWith('not')) {
          tokens.push({ type: 'NOT', value: 'not' });
          i += 3;
        } else if (remaining.startsWith('xnor')) {
          tokens.push({ type: 'XNOR', value: 'xnor' });
          i += 4;
        } else if (remaining.startsWith('xor')) {
          tokens.push({ type: 'XOR', value: 'xor' });
          i += 3;
        } else if (remaining.startsWith('and')) {
          tokens.push({ type: 'AND', value: 'and' });
          i += 3;
        } else if (remaining.startsWith('or')) {
          tokens.push({ type: 'OR', value: 'or' });
          i += 2;
        } else {
          // Single character variable
          tokens.push({ type: 'VAR', value: char });
          i++;
        }
      } else if (/[0-9]/.test(char)) {
        // Numeric constant
        tokens.push({ type: 'VAR', value: char });
        i++;
      } else {
        throw new Error(`Unknown character: '${char}' at position ${i}`);
      }
    }
    return tokens;
  }

  /**
   * Recursive descent parser with operator precedence:
   * 1. NOT (highest)
   * 2. AND, NAND (medium)
   * 3. XOR, XNOR (medium-low)
   * 4. OR, NOR (lowest)
   */
  parse() {
    const tokens = this.tokenize(this.normalizedExpression);
    let position = 0;

    const peek = () => tokens[position];
    const consume = () => tokens[position++];

    const parseOr = () => {
      let left = parseXor();
      while (peek() && (peek().type === 'OR' || peek().type === 'NOR')) {
        const op = consume();
        const right = parseXor();
        left = {
          type: op.type,
          left: left,
          right: right,
          operator: op.value
        };
      }
      return left;
    };

    const parseXor = () => {
      let left = parseAnd();
      while (peek() && (peek().type === 'XOR' || peek().type === 'XNOR')) {
        const op = consume();
        const right = parseAnd();
        left = {
          type: op.type,
          left: left,
          right: right,
          operator: op.value
        };
      }
      return left;
    };

    const parseAnd = () => {
      let left = parseNot();
      while (peek()) {
        if (peek().type === 'AND' || peek().type === 'NAND') {
          // Explicit AND / NAND operator
          const op = consume();
          const right = parseNot();
          left = {
            type: op.type,
            left: left,
            right: right,
            operator: op.value
          };
        } else if (peek().type === 'VAR' || peek().type === 'NOT' || peek().type === 'LPAREN') {
          // Implicit AND: adjacent terms like XYZ, X'Y, (A+B)C
          const right = parseNot();
          left = {
            type: 'AND',
            left: left,
            right: right,
            operator: 'and'
          };
        } else {
          break;
        }
      }
      return left;
    };

    const parseNot = () => {
      if (peek() && peek().type === 'NOT') {
        consume(); // consume NOT
        const operand = parseNot(); // NOT is right-associative
        return {
          type: 'NOT',
          operand: operand,
          operator: "'"
        };
      }
      return parsePostfix();
    };

    // Postfix NOT: X' becomes NOT(X), (A+B)' becomes NOT(A OR B)
    const parsePostfix = () => {
      let node = parsePrimary();
      while (peek() && peek().type === 'NOT') {
        consume();
        node = {
          type: 'NOT',
          operand: node,
          operator: "'"
        };
      }
      return node;
    };

    const parsePrimary = () => {
      const token = peek();

      if (!token) {
        throw new Error('Unexpected end of expression');
      }

      if (token.type === 'LPAREN') {
        consume(); // consume (
        const expr = parseOr();
        if (!peek() || peek().type !== 'RPAREN') {
          throw new Error('Expected closing parenthesis');
        }
        consume(); // consume )
        return expr;
      } else if (token.type === 'VAR') {
        consume();
        return {
          type: 'VAR',
          value: token.value
        };
      } else {
        throw new Error(`Unexpected token: ${token.value}`);
      }
    };

    const ast = parseOr();

    if (position < tokens.length) {
      throw new Error('Unexpected tokens at end of expression');
    }

    return ast;
  }

  /**
   * Evaluate AST safely using symbol table (no eval())
   * Supports: AND, OR, NOT, NAND, NOR, XOR, XNOR
   */
  evaluateAst(ast, symbolTable) {
    if (ast.type === 'VAR') {
      return symbolTable[ast.value];
    } else if (ast.type === 'NOT') {
      return !this.evaluateAst(ast.operand, symbolTable);
    } else if (ast.type === 'AND') {
      return this.evaluateAst(ast.left, symbolTable) && this.evaluateAst(ast.right, symbolTable);
    } else if (ast.type === 'OR') {
      return this.evaluateAst(ast.left, symbolTable) || this.evaluateAst(ast.right, symbolTable);
    } else if (ast.type === 'NAND') {
      return !(this.evaluateAst(ast.left, symbolTable) && this.evaluateAst(ast.right, symbolTable));
    } else if (ast.type === 'NOR') {
      return !(this.evaluateAst(ast.left, symbolTable) || this.evaluateAst(ast.right, symbolTable));
    } else if (ast.type === 'XOR') {
      return this.evaluateAst(ast.left, symbolTable) !== this.evaluateAst(ast.right, symbolTable);
    } else if (ast.type === 'XNOR') {
      return this.evaluateAst(ast.left, symbolTable) === this.evaluateAst(ast.right, symbolTable);
    }
    throw new Error(`Unknown AST node type: ${ast.type}`);
  }

  /**
   * Generate truth table for all variable combinations
   */
  generateTruthTable() {
    const numVars = this.variables.length;
    const numRows = Math.pow(2, numVars);
    const table = [];

    for (let i = 0; i < numRows; i++) {
      const row = {};
      const symbolTable = {};

      // Set variable values based on binary representation of i
      for (let j = 0; j < numVars; j++) {
        const bit = (i >> (numVars - 1 - j)) & 1;
        symbolTable[this.variables[j]] = bit === 1;
        row[this.variables[j]] = bit;
      }

      // Evaluate expression for this row
      row.output = this.evaluateAst(this.ast, symbolTable) ? 1 : 0;
      table.push(row);
    }

    return table;
  }

  /**
   * Convert AST to LaTeX format
   */
  toLatex(ast = this.ast) {
    if (ast.type === 'VAR') {
      return ast.value;
    } else if (ast.type === 'NOT') {
      return `\\overline{${this.toLatex(ast.operand)}}`;
    } else if (ast.type === 'AND') {
      return `${this.toLatex(ast.left)} \\cdot ${this.toLatex(ast.right)}`;
    } else if (ast.type === 'OR') {
      return `${this.toLatex(ast.left)} + ${this.toLatex(ast.right)}`;
    } else if (ast.type === 'NAND') {
      return `\\overline{${this.toLatex(ast.left)} \\cdot ${this.toLatex(ast.right)}}`;
    } else if (ast.type === 'NOR') {
      return `\\overline{${this.toLatex(ast.left)} + ${this.toLatex(ast.right)}}`;
    } else if (ast.type === 'XOR') {
      return `${this.toLatex(ast.left)} \\oplus ${this.toLatex(ast.right)}`;
    } else if (ast.type === 'XNOR') {
      return `\\overline{${this.toLatex(ast.left)} \\oplus ${this.toLatex(ast.right)}}`;
    } else {
      return '';
    }
  }

  /**
   * Get expression in standard notation
   */
  toString() {
    return this.normalizedExpression;
  }

  /**
   * Check if expression is valid
   */
  isValid() {
    return this.ast !== null;
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BooleanExpression;
}
