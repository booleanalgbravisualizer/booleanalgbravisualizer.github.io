/**
 * Main Application Logic
 * Handles user interaction and coordinates parsing, visualization, and table generation
 */

document.addEventListener('DOMContentLoaded', () => {
  const expressionInput = document.getElementById('expressionInput');
  const visualizeBtn = document.getElementById('visualizeBtn');
  const errorMessage = document.getElementById('errorMessage');
  const latexDisplay = document.getElementById('latexDisplay');
  const resultsDiv = document.getElementById('results');
  const truthTableContainer = document.getElementById('truthTableContainer');
  const copyTableBtn = document.getElementById('copyTableBtn');
  const copyHTMLBtn = document.getElementById('copyHTMLBtn');
  const gatesSvg = document.getElementById('gatesSvg');
  const cmosSvg = document.getElementById('cmosSvg');

  let currentBooleanExpression = null;
  let currentVisualizer = null;

  // Event listeners
  visualizeBtn.addEventListener('click', handleVisualize);
  expressionInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleVisualize();
    }
  });
  copyTableBtn.addEventListener('click', copyTableAsText);
  copyHTMLBtn.addEventListener('click', copyTableAsHTML);

  function handleVisualize() {
    const expression = expressionInput.value.trim();
    
    if (!expression) {
      showError('Please enter a boolean expression');
      return;
    }

    try {
      clearError();
      
      // Parse the expression - BooleanExpression class handles all parsing
      currentBooleanExpression = new BooleanExpression(expression);
      
      // Create visualizer from the boolean expression
      currentVisualizer = new Visualizer(currentBooleanExpression);
      
      // Display LaTeX representation
      const latex = currentBooleanExpression.toLatex();
      latexDisplay.textContent = `LaTeX: ${latex}`;
      latexDisplay.style.display = 'block';
      
      // Render all three visualization types
      currentVisualizer.renderGateDiagram(gatesSvg);
      currentVisualizer.renderCMOSDiagram(cmosSvg);
      currentVisualizer.renderTruthTable(truthTableContainer);
      
      // Show results
      resultsDiv.style.display = 'block';
      
      // Scroll to results
      setTimeout(() => {
        resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
    } catch (error) {
      showError(`Error: ${error.message}`);
      resultsDiv.style.display = 'none';
      latexDisplay.style.display = 'none';
    }
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  }

  function clearError() {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
  }

  function copyTableAsText() {
    if (!currentVisualizer) {
      showError('Please visualize an expression first');
      return;
    }

    const variables = currentVisualizer.variables;
    const truthTable = currentVisualizer.truthTable;
    
    // Create header
    let text = variables.map(v => v.toUpperCase()).join('\t') + '\tOutput\n';
    
    // Add rows
    truthTable.forEach(row => {
      const values = variables.map(v => row[v]).join('\t');
      text += values + '\t' + row.output + '\n';
    });
    
    copyToClipboard(text);
  }

  function copyTableAsHTML() {
    if (!currentVisualizer) {
      showError('Please visualize an expression first');
      return;
    }

    const table = truthTableContainer.querySelector('table');
    if (table) {
      const html = table.outerHTML;
      copyToClipboard(html);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(err => {
      showError('Failed to copy to clipboard');
      console.error('Clipboard error:', err);
    });
  }

  // Log startup info
  console.log('Boolean Algebra Visualizer loaded!');
  console.log('Example expressions:');
  console.log('  - A·B + C');
  console.log('  - (A+B)·(C+D)');
  console.log('  - A\'·B + A·B\'');
  console.log('  - !(A·B) + C');
});
