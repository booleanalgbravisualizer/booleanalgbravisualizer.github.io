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
   * Converts: · to *, ' to !, + to |
   */
  normalize(expr) {
    return expr
      .replace(/·/g, '*')        // AND symbol to *
      .replace(/¯/g, "'")        // Overline to apostrophe (if used)
      .replace(/!/g, "'")        // ! to '
      .replace(/\+/g, '|')       // OR symbol to |
      .toLowerCase()             // Normalize case
      .trim();
  }

  /**
   * Extract all unique variables from expression
   */
  extractVariables() {
    const matches = this.normalizedExpression.match(/[a-z]/g) || [];
    return [...new Set(matches)].sort();
  }

  /**
   * Tokenize expression into meaningful units
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
      } else if (char === "'") {
        tokens.push({ type: 'NOT', value: "'" });
        i++;
      } else if (char === '*') {
        tokens.push({ type: 'AND', value: '*' });
        i++;
      } else if (char === '|') {
        tokens.push({ type: 'OR', value: '|' });
        i++;
      } else if (/[a-z0-9]/.test(char)) {
        // Variable or constant
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
   * 2. AND
   * 3. OR (lowest)
   */
  parse() {
    const tokens = this.tokenize(this.normalizedExpression);
    let position = 0;

    const peek = () => tokens[position];
    const consume = () => tokens[position++];

    const parseOr = () => {
      let left = parseAnd();
      while (peek() && peek().type === 'OR') {
        consume(); // consume OR
        const right = parseAnd();
        left = {
          type: 'OR',
          left: left,
          right: right,
          operator: '|'
        };
      }
      return left;
    };

    const parseAnd = () => {
      let left = parseNot();
      while (peek() && peek().type === 'AND') {
        consume(); // consume AND
        const right = parseNot();
        left = {
          type: 'AND',
          left: left,
          right: right,
          operator: '*'
        };
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
      return parsePrimary();
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
