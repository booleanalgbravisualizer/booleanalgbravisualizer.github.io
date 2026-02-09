/**
 * Main Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const expressionInput = document.getElementById('expressionInput');
  const copyLatexBtn = document.getElementById('copyLatexBtn');
  const copyCSVBtn = document.getElementById('copyCSVBtn');
  const copyHTMLBtn = document.getElementById('copyHTMLBtn');
  const copyKMapCSVBtn = document.getElementById('copyKMapCSVBtn');
  const copyKMapHTMLBtn = document.getElementById('copyKMapHTMLBtn');
  const errorMessage = document.getElementById('errorMessage');
  const truthTableContainer = document.getElementById('truthTableContainer');
  const kmapContainer = document.getElementById('kmapContainer');
  const gatesSvg = document.getElementById('gatesSvg');
  const cmosSvg = document.getElementById('cmosSvg');

  const tabBlockDiagram = document.getElementById('tabBlockDiagram');
  const tabCMOS = document.getElementById('tabCMOS');
  const tabTruthTable = document.getElementById('tabTruthTable');
  const tabKMap = document.getElementById('tabKMap');

  const blockDiagramTab = document.getElementById('blockDiagramTab');
  const cmosTab = document.getElementById('cmosTab');
  const truthTableTab = document.getElementById('truthTableTab');
  const kmapTab = document.getElementById('kmapTab');

  // Format help modal elements
  const formatHelpBtn = document.getElementById('formatHelpBtn');
  const formatHelpModal = document.getElementById('formatHelpModal');
  const modalClose = document.querySelector('.modal-close');

  let currentVisualizer = null;
  let currentLatex = '';

  // Format help modal handlers
  formatHelpBtn.addEventListener('click', () => {
    formatHelpModal.style.display = 'block';
  });

  modalClose.addEventListener('click', () => {
    formatHelpModal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target === formatHelpModal) {
      formatHelpModal.style.display = 'none';
    }
  });

  // Visualize on Enter key
  expressionInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      visualize();
    }
  });

  function visualize() {
    const expression = expressionInput.value.trim();
    if (!expression) {
      showError('Enter expression');
      return;
    }

    try {
      clearError();
      const boolExpr = new BooleanExpression(expression);
      currentVisualizer = new Visualizer(boolExpr);
      currentLatex = boolExpr.toLatex();

      gatesSvg.setAttribute('viewBox', '0 0 1200 600');
      currentVisualizer.renderGateDiagram(gatesSvg);
      
      cmosSvg.setAttribute('viewBox', '0 0 900 450');
      currentVisualizer.renderCMOSDiagram(cmosSvg);
      
      currentVisualizer.renderTruthTable(truthTableContainer);
      currentVisualizer.renderKMap(kmapContainer);
    } catch (error) {
      showError(error.message);
    }
  }

  copyLatexBtn.addEventListener('click', () => {
    if (!currentLatex) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(currentLatex).catch(() => {
        fallbackCopy(currentLatex);
      });
    } else {
      fallbackCopy(currentLatex);
    }
  });

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }

  // Copy as CSV (comma-separated)
  copyCSVBtn.addEventListener('click', () => {
    if (!currentVisualizer) return;
    const vars = currentVisualizer.variables;
    const table = currentVisualizer.truthTable;
    let csv = vars.map(v => v.toUpperCase()).join(',') + ',Output\n';
    table.forEach(row => {
      csv += vars.map(v => row[v]).join(',') + ',' + row.output + '\n';
    });
    navigator.clipboard.writeText(csv);
  });

  // Copy rendered HTML table (preserves formatting when pasting into rich-text editors)
  copyHTMLBtn.addEventListener('click', () => {
    const tableEl = truthTableContainer.querySelector('table');
    if (!tableEl) return;
    const htmlStr = tableEl.outerHTML;
    const plainRows = [];
    tableEl.querySelectorAll('tr').forEach(tr => {
      const cells = [];
      tr.querySelectorAll('th, td').forEach(cell => cells.push(cell.textContent));
      plainRows.push(cells.join('\t'));
    });
    const plainText = plainRows.join('\n');
    const blob = new Blob([htmlStr], { type: 'text/html' });
    const textBlob = new Blob([plainText], { type: 'text/plain' });
    navigator.clipboard.write([
      new ClipboardItem({
        'text/html': blob,
        'text/plain': textBlob
      })
    ]);
  });

  // Copy K-map as CSV
  copyKMapCSVBtn.addEventListener('click', () => {
    const tableEl = kmapContainer.querySelector('table');
    if (!tableEl) return;
    const rows = [];
    tableEl.querySelectorAll('tr').forEach(tr => {
      const cells = [];
      tr.querySelectorAll('th, td').forEach(cell => cells.push(cell.textContent));
      rows.push(cells.join(','));
    });
    const csv = rows.join('\n');
    navigator.clipboard.writeText(csv);
  });

  // Copy K-map as HTML table
  copyKMapHTMLBtn.addEventListener('click', () => {
    const tableEl = kmapContainer.querySelector('table');
    if (!tableEl) return;
    const htmlStr = tableEl.outerHTML;
    const plainRows = [];
    tableEl.querySelectorAll('tr').forEach(tr => {
      const cells = [];
      tr.querySelectorAll('th, td').forEach(cell => cells.push(cell.textContent));
      plainRows.push(cells.join('\t'));
    });
    const plainText = plainRows.join('\n');
    const blob = new Blob([htmlStr], { type: 'text/html' });
    const textBlob = new Blob([plainText], { type: 'text/plain' });
    navigator.clipboard.write([
      new ClipboardItem({
        'text/html': blob,
        'text/plain': textBlob
      })
    ]);
  });

  // Tab switching
  const tabs = { block: tabBlockDiagram, cmos: tabCMOS, truth: tabTruthTable, kmap: tabKMap };
  const contents = { block: blockDiagramTab, cmos: cmosTab, truth: truthTableTab, kmap: kmapTab };

  Object.keys(tabs).forEach(key => {
    tabs[key].addEventListener('click', () => {
      Object.values(tabs).forEach(t => t.classList.remove('active'));
      Object.values(contents).forEach(c => c.style.display = 'none');
      tabs[key].classList.add('active');
      contents[key].style.display = 'block';
    });
  });

  function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.style.display = 'block';
  }

  function clearError() {
    errorMessage.style.display = 'none';
  }

  console.log('Boolean Algebra Visualizer loaded');
});
