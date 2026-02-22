/**
 * Main Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const expressionInput = document.getElementById('expressionInput');
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

  // Build Google-Docs-friendly HTML from a table element.
  // If rawOnly is true, returns just the styled table HTML (no <html> wrapper).
  function buildCopyableHTML(tableEl, rawOnly) {
    const clone = tableEl.cloneNode(true);
    clone.setAttribute('border', '1');
    clone.style.borderCollapse = 'collapse';
    clone.querySelectorAll('th, td').forEach(cell => {
      cell.style.border = '1px solid #000';
      cell.style.padding = '4px 8px';
      cell.style.textAlign = 'center';
    });
    clone.querySelectorAll('th').forEach(th => {
      th.style.backgroundColor = '#f5f5f5';
      th.style.fontWeight = 'bold';
    });
    if (rawOnly) return clone.outerHTML;
    return '<html><body><!--StartFragment-->' + clone.outerHTML + '<!--EndFragment--></body></html>';
  }

  function getPlainText(tableEl) {
    const rows = [];
    tableEl.querySelectorAll('tr').forEach(tr => {
      const cells = [];
      tr.querySelectorAll('th, td').forEach(cell => cells.push(cell.textContent));
      rows.push(cells.join('\t'));
    });
    return rows.join('\n');
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

  // Copy rendered HTML table (preserves formatting in Google Docs, Word, etc.)
  copyHTMLBtn.addEventListener('click', () => {
    const tableEl = truthTableContainer.querySelector('table');
    if (!tableEl) return;
    const htmlStr = buildCopyableHTML(tableEl);
    const plainText = getPlainText(tableEl);
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
    const tables = kmapContainer.querySelectorAll('table');
    if (!tables.length) return;
    const parts = [];
    tables.forEach((tableEl, idx) => {
      // Include sub-map label if present
      const label = tableEl.closest('.kmap-submap');
      if (label) {
        const labelEl = label.querySelector('.kmap-submap-label');
        if (labelEl) parts.push(labelEl.textContent);
      }
      const rows = [];
      tableEl.querySelectorAll('tr').forEach(tr => {
        const cells = [];
        tr.querySelectorAll('th, td').forEach(cell => cells.push(cell.textContent));
        rows.push(cells.join(','));
      });
      parts.push(rows.join('\n'));
    });
    navigator.clipboard.writeText(parts.join('\n\n'));
  });

  // Copy K-map as HTML table
  copyKMapHTMLBtn.addEventListener('click', () => {
    const tables = kmapContainer.querySelectorAll('table');
    if (!tables.length) return;
    const htmlParts = [];
    const textParts = [];
    tables.forEach(tableEl => {
      const label = tableEl.closest('.kmap-submap');
      if (label) {
        const labelEl = label.querySelector('.kmap-submap-label');
        if (labelEl) {
          htmlParts.push('<p><b>' + labelEl.textContent + '</b></p>');
          textParts.push(labelEl.textContent);
        }
      }
      htmlParts.push(buildCopyableHTML(tableEl, true));
      textParts.push(getPlainText(tableEl));
    });
    const fullHtml = '<html><body><!--StartFragment-->' + htmlParts.join('') + '<!--EndFragment--></body></html>';
    const fullText = textParts.join('\n\n');
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const textBlob = new Blob([fullText], { type: 'text/plain' });
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
