/**
 * Boolean Algebra Visualizer
 * Generates SVG diagrams for logic gates, CMOS implementations, and truth tables
 */

class Visualizer {
  constructor(booleanExpression) {
    this.expr = booleanExpression;
    this.ast = booleanExpression.ast;
    this.variables = booleanExpression.variables;
    this.truthTable = booleanExpression.truthTable;
  }

  /**
   * Render logic gate block diagram from AST
   */
  renderGateDiagram(svgElement) {
    svgElement.innerHTML = '';
    svgElement.setAttribute('viewBox', '0 0 1200 600');

    const ns = 'http://www.w3.org/2000/svg';

    // Background
    const bg = document.createElementNS(ns, 'rect');
    bg.setAttribute('width', '1200');
    bg.setAttribute('height', '600');
    bg.setAttribute('fill', 'white');
    bg.setAttribute('stroke', '#ddd');
    bg.setAttribute('stroke-width', '1');
    svgElement.appendChild(bg);

    // Enable zoom and pan
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('id', 'zoomGroup');
    
    // Render gate tree from AST
    const finalX = this.renderGateTree(g, this.ast, 200, 250);

    // Draw output line from final gate
    const outputX = finalX + 60;
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', finalX);
    line.setAttribute('y1', '250');
    line.setAttribute('x2', outputX);
    line.setAttribute('y2', '250');
    line.setAttribute('stroke', '#333');
    line.setAttribute('stroke-width', '3.5');
    g.appendChild(line);

    const outputLabel = document.createElementNS(ns, 'text');
    outputLabel.setAttribute('x', outputX + 10);
    outputLabel.setAttribute('y', '255');
    outputLabel.setAttribute('font-size', '12');
    outputLabel.textContent = 'Output';
    g.appendChild(outputLabel);

    svgElement.appendChild(g);

    // Add zoom and pan functionality
    this.setupZoomPan(svgElement, g);
  }

  /**
   * Setup zoom and pan functionality for SVG
   */
  setupZoomPan(svgElement, group) {
    let scale = 1;
    let panning = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;

    const rect = svgElement.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const updateTransform = () => {
      group.setAttribute('transform', 
        `translate(${centerX}, ${centerY}) scale(${scale}) translate(${-centerX + currentX}, ${-centerY + currentY})`
      );
    };

    // Zoom with scroll
    svgElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = svgElement.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const delta = e.deltaY > 0 ? 0.95 : 1.05;
      scale *= delta;
      scale = Math.min(Math.max(scale, 0.5), 3);
      currentX = centerX - (centerX - currentX) / delta;
      currentY = centerY - (centerY - currentY) / delta;
      updateTransform();
    });

    // Pan with mouse drag
    svgElement.addEventListener('mousedown', (e) => {
      panning = true;
      startX = e.clientX - currentX;
      startY = e.clientY - currentY;
    });

    svgElement.addEventListener('mousemove', (e) => {
      if (panning) {
        currentX = e.clientX - startX;
        currentY = e.clientY - startY;
        updateTransform();
      }
    });

    svgElement.addEventListener('mouseup', () => {
      panning = false;
    });

    svgElement.addEventListener('mouseleave', () => {
      panning = false;
    });
  }

  /**
   * Recursively render gate tree
   */
  renderGateTree(svg, ast, x, y, depth = 0) {
    const ns = 'http://www.w3.org/2000/svg';
    const spacing = 200;
    const verticalSpacing = 120;

    if (ast.type === 'VAR') {
      // Draw variable node box
      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', x - 25);
      rect.setAttribute('y', y - 15);
      rect.setAttribute('width', '50');
      rect.setAttribute('height', '30');
      rect.setAttribute('fill', 'white');
      rect.setAttribute('stroke', '#999');
      rect.setAttribute('stroke-width', '1');
      rect.setAttribute('rx', '3');
      svg.appendChild(rect);

      const text = document.createElementNS(ns, 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', y + 5);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '13');
      text.setAttribute('font-weight', 'bold');
      text.textContent = ast.value.toUpperCase();
      svg.appendChild(text);

      // Draw line from box to the right
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', x + 25);
      line.setAttribute('y1', y);
      line.setAttribute('x2', x + 75);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', '#333');
      line.setAttribute('stroke-width', '3.5');
      svg.appendChild(line);

      return x + 75;
    }

    if (ast.type === 'NOT') {
      const inputX = this.renderGateTree(svg, ast.operand, x, y, depth + 1);
      const gateX = inputX + spacing;
      this.drawNotGate(svg, gateX, y);
      
      this.connectLineOrthogonal(svg, inputX, y, gateX - 60, y);
      
      return gateX + 60;
    }

    if (ast.type === 'AND') {
      const leftY = y - verticalSpacing;
      const rightY = y + verticalSpacing;
      const leftX = this.renderGateTree(svg, ast.left, x, leftY, depth + 1);
      const rightX = this.renderGateTree(svg, ast.right, x, rightY, depth + 1);
      
      const gateX = Math.max(leftX, rightX) + spacing;
      this.drawAndGate(svg, gateX, y);
      
      this.connectLineOrthogonal(svg, leftX, leftY, gateX - 50, y - 35);
      this.connectLineOrthogonal(svg, rightX, rightY, gateX - 50, y + 35);
      
      return gateX + 60;
    }

    if (ast.type === 'OR') {
      const leftY = y - verticalSpacing;
      const rightY = y + verticalSpacing;
      const leftX = this.renderGateTree(svg, ast.left, x, leftY, depth + 1);
      const rightX = this.renderGateTree(svg, ast.right, x, rightY, depth + 1);
      
      const gateX = Math.max(leftX, rightX) + spacing;
      this.drawOrGate(svg, gateX, y);
      
      this.connectLineOrthogonal(svg, leftX, leftY, gateX - 50, y - 35);
      this.connectLineOrthogonal(svg, rightX, rightY, gateX - 50, y + 35);
      
      return gateX + 60;
    }

    return x;
  }

  /**
   * Draw AND gate using image
   */
  drawAndGate(svg, x, y) {
    this.drawGateImage(svg, x, y, 'and.png', 'AND');
  }

  /**
   * Draw OR gate using image
   */
  drawOrGate(svg, x, y) {
    this.drawGateImage(svg, x, y, 'or.png', 'OR');
  }

  /**
   * Draw NOT gate using image
   */
  drawNotGate(svg, x, y) {
    this.drawGateImage(svg, x, y, 'not.png', 'NOT');
  }

  /**
   * Draw gate using image
   */
  drawGateImage(svg, x, y, imageName, gateType) {
    const ns = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(ns, 'g');

    // Gate image dimensions: 165x135 -> scaled down to 120x100
    const imgWidth = 120;
    const imgHeight = 100;

    // Embed the image centered at position (x, y)
    const image = document.createElementNS(ns, 'image');
    image.setAttribute('href', `/assets/${imageName}`);
    image.setAttribute('x', x - imgWidth / 2);
    image.setAttribute('y', y - imgHeight / 2);
    image.setAttribute('width', imgWidth);
    image.setAttribute('height', imgHeight);
    image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    g.appendChild(image);

    svg.appendChild(g);
  }

  /**
   * Helper: draw orthogonal connecting path (horizontal then vertical)
   */
  connectLineOrthogonal(svg, x1, y1, x2, y2) {
    const ns = 'http://www.w3.org/2000/svg';
    const midX = (x1 + x2) / 2;
    
    // Horizontal line to midpoint
    const line1 = document.createElementNS(ns, 'line');
    line1.setAttribute('x1', x1);
    line1.setAttribute('y1', y1);
    line1.setAttribute('x2', midX);
    line1.setAttribute('y2', y1);
    line1.setAttribute('stroke', '#333');
    line1.setAttribute('stroke-width', '3.5');
    svg.appendChild(line1);
    
    // Vertical line to destination
    const line2 = document.createElementNS(ns, 'line');
    line2.setAttribute('x1', midX);
    line2.setAttribute('y1', y1);
    line2.setAttribute('x2', midX);
    line2.setAttribute('y2', y2);
    line2.setAttribute('stroke', '#333');
    line2.setAttribute('stroke-width', '3.5');
    svg.appendChild(line2);
    
    // Horizontal line to destination
    const line3 = document.createElementNS(ns, 'line');
    line3.setAttribute('x1', midX);
    line3.setAttribute('y1', y2);
    line3.setAttribute('x2', x2);
    line3.setAttribute('y2', y2);
    line3.setAttribute('stroke', '#333');
    line3.setAttribute('stroke-width', '3.5');
    svg.appendChild(line3);
  }
  /**
   * Extract SOP (Sum of Products) terms from AST
   * Returns array of AND terms (as array of literals) representing OR-of-ANDs
   * Each literal has: var (variable name), inverted (boolean)
   *   inverted=true means the literal is 'var (complement)
   *   inverted=false means the literal is var (plain signal)
   * 
   * CMOS Gate Signals:
   *   Both NMOS and PMOS receive same gate signal labels from extracted literals
   *   NMOS: conducts (pulls down) when gate = 1
   *   PMOS: conducts (pulls up) when gate = 0
   *   Topology: PMOS in series stages (implements SOP), NMOS in parallel chains (implements dual)
   */
  extractSOP(node) {
    if (!node) return [];
    if (node.type === 'VAR') return [[{ var: node.value, inverted: false }]];
    if (node.type === 'NOT') {
      const inner = this.extractSOP(node.operand);
      return inner.map(term => term.map(lit => ({ ...lit, inverted: !lit.inverted })));
    }
    if (node.type === 'AND') {
      const left = this.extractSOP(node.left);
      const right = this.extractSOP(node.right);
      return left.flatMap(l => right.map(r => [...l, ...r]));
    }
    if (node.type === 'OR') {
      return [...this.extractSOP(node.left), ...this.extractSOP(node.right)];
    }
    return [];
  }

  /**
   * Render CMOS implementation diagram with proper complementary logic
   * 
   * Truth Table Output Match:
   *   The output node is driven by the PMOS/NMOS complementary logic.
   *   PMOS (pull-up) is series of parallel chains: implements OR of ANDs (SOP)
   *   NMOS (pull-down) is parallel of series chains: implements dual topology (AND of ORs)
   *   Output equals direct evaluation of the AST (no inversion)
   * 
   * Gate Signal Derivation:
   *   Extracted SOP literals directly label transistor gates
   *   literal.inverted=true → gate label shows 'var (complement)
   *   literal.inverted=false → gate label shows var (plain signal)
   */
  renderCMOSDiagram(svgElement) {
    svgElement.innerHTML = '';
    const ns = 'http://www.w3.org/2000/svg';
    svgElement.setAttribute('viewBox', '0 0 1200 600');

    const bg = document.createElementNS(ns, 'rect');
    bg.setAttribute('width', '1200');
    bg.setAttribute('height', '600');
    bg.setAttribute('fill', 'white');
    svgElement.appendChild(bg);

    const g = document.createElementNS(ns, 'g');

    // Extract SOP form: each term is AND of literals, SOP is OR of terms
    const sopTerms = this.extractSOP(this.ast);

    const vddY = 40;
    const gndY = 560;
    const outputY = 300;
    const transistorHeight = 50;
    const transistorWidth = 80;
    const stageHeight = 90;
    const parallelSpacing = 100;

    // Draw VDD/GND rails
    const vddLine = document.createElementNS(ns, 'line');
    vddLine.setAttribute('x1', '40');
    vddLine.setAttribute('y1', vddY);
    vddLine.setAttribute('x2', '1160');
    vddLine.setAttribute('y2', vddY);
    vddLine.setAttribute('stroke', '#000');
    vddLine.setAttribute('stroke-width', '4.5');
    g.appendChild(vddLine);

    const vddLabel = document.createElementNS(ns, 'text');
    vddLabel.setAttribute('x', '10');
    vddLabel.setAttribute('y', vddY + 5);
    vddLabel.setAttribute('font-size', '14');
    vddLabel.setAttribute('font-weight', 'bold');
    vddLabel.textContent = 'VDD';
    g.appendChild(vddLabel);

    const gndLine = document.createElementNS(ns, 'line');
    gndLine.setAttribute('x1', '40');
    gndLine.setAttribute('y1', gndY);
    gndLine.setAttribute('x2', '1160');
    gndLine.setAttribute('y2', gndY);
    gndLine.setAttribute('stroke', '#000');
    gndLine.setAttribute('stroke-width', '4.5');
    g.appendChild(gndLine);

    const gndLabel = document.createElementNS(ns, 'text');
    gndLabel.setAttribute('x', '5');
    gndLabel.setAttribute('y', gndY + 5);
    gndLabel.setAttribute('font-size', '14');
    gndLabel.setAttribute('font-weight', 'bold');
    gndLabel.textContent = 'GND';
    g.appendChild(gndLabel);

    // Output node
    const outCircle = document.createElementNS(ns, 'circle');
    outCircle.setAttribute('cx', '1050');
    outCircle.setAttribute('cy', outputY);
    outCircle.setAttribute('r', '5');
    outCircle.setAttribute('fill', '#000');
    g.appendChild(outCircle);

    const outLabel = document.createElementNS(ns, 'text');
    outLabel.setAttribute('x', '1070');
    outLabel.setAttribute('y', outputY + 5);
    outLabel.setAttribute('font-size', '14');
    outLabel.setAttribute('font-weight', 'bold');
    outLabel.textContent = 'Out';
    g.appendChild(outLabel);

    // ===== PMOS: Series stages of parallel transistors =====
    let currentPmosY = vddY + 60;
    let previousStageBottomX = 600; // Center column for series connections

    sopTerms.forEach((term, stageIdx) => {
      const termLength = term.length;
      const stageY = currentPmosY;
      
      // Parallel transistors in this stage
      const startX = 600 - (termLength - 1) * parallelSpacing / 2;

      term.forEach((literal, idx) => {
        const transistorX = startX + idx * parallelSpacing;
        
        // Draw PMOS transistor with correct gate signal
        // Gate signal: if literal is inverted (var'), show var'; otherwise show var
        // PMOS pulls up (conducts) when gate = 0, so labels reflect the signal on gate
        this.drawCMOSTransistor(g, transistorX, stageY, 'PMOS',
          literal.inverted ? `${literal.var}'` : literal.var);

        // Connect to VDD (from above)
        if (stageIdx === 0) {
          const vddConn = document.createElementNS(ns, 'line');
          vddConn.setAttribute('x1', transistorX);
          vddConn.setAttribute('y1', vddY);
          vddConn.setAttribute('x2', transistorX);
          vddConn.setAttribute('y2', stageY - transistorHeight / 2);
          vddConn.setAttribute('stroke', '#000');
          vddConn.setAttribute('stroke-width', '2.5');
          g.appendChild(vddConn);
        } else {
          // Connect from previous stage
          const prevConn = document.createElementNS(ns, 'line');
          prevConn.setAttribute('x1', transistorX);
          prevConn.setAttribute('y1', stageY - stageHeight + transistorHeight / 2);
          prevConn.setAttribute('x2', transistorX);
          prevConn.setAttribute('y2', stageY - transistorHeight / 2);
          prevConn.setAttribute('stroke', '#000');
          prevConn.setAttribute('stroke-width', '2.5');
          g.appendChild(prevConn);
        }

        // Horizontal connection to center node (series connection)
        const horizLine = document.createElementNS(ns, 'line');
        horizLine.setAttribute('x1', transistorX);
        horizLine.setAttribute('y1', stageY + transistorHeight / 2);
        horizLine.setAttribute('x2', 600);
        horizLine.setAttribute('y2', stageY + transistorHeight / 2);
        horizLine.setAttribute('stroke', '#000');
        horizLine.setAttribute('stroke-width', '2.5');
        g.appendChild(horizLine);
      });

      // Vertical series connection to next stage or output
      if (stageIdx < sopTerms.length - 1) {
        const vertLine = document.createElementNS(ns, 'line');
        vertLine.setAttribute('x1', '600');
        vertLine.setAttribute('y1', stageY + transistorHeight / 2);
        vertLine.setAttribute('x2', '600');
        vertLine.setAttribute('y2', stageY + stageHeight - transistorHeight / 2);
        vertLine.setAttribute('stroke', '#000');
        vertLine.setAttribute('stroke-width', '2.5');
        g.appendChild(vertLine);
      } else {
        // Last stage connects to output
        const lastConn = document.createElementNS(ns, 'line');
        lastConn.setAttribute('x1', '600');
        lastConn.setAttribute('y1', stageY + transistorHeight / 2);
        lastConn.setAttribute('x2', '600');
        lastConn.setAttribute('y2', outputY);
        lastConn.setAttribute('stroke', '#000');
        lastConn.setAttribute('stroke-width', '2.5');
        g.appendChild(lastConn);

        const horizToOut = document.createElementNS(ns, 'line');
        horizToOut.setAttribute('x1', '600');
        horizToOut.setAttribute('y1', outputY);
        horizToOut.setAttribute('x2', '1050');
        horizToOut.setAttribute('y2', outputY);
        horizToOut.setAttribute('stroke', '#000');
        horizToOut.setAttribute('stroke-width', '2.5');
        g.appendChild(horizToOut);
      }

      currentPmosY += stageHeight;
    });

    // ===== NMOS: Parallel chains of series transistors =====
    sopTerms.forEach((term, chainIdx) => {
      const chainX = 150 + chainIdx * 180;
      const termLength = term.length;
      const chainStartY = outputY + 50;

      // Series chain for this term
      term.forEach((literal, idx) => {
        const transistorY = chainStartY + idx * transistorHeight;

        // Draw NMOS transistor with correct gate signal
        // Gate signal: if literal is inverted (var'), show var'; otherwise show var
        // NMOS pulls down (conducts) when gate = 1, so labels reflect the signal on gate
        this.drawCMOSTransistor(g, chainX, transistorY, 'NMOS',
          literal.inverted ? `${literal.var}'` : literal.var);

        // Vertical series connections
        if (idx < term.length - 1) {
          const seriesLine = document.createElementNS(ns, 'line');
          seriesLine.setAttribute('x1', chainX);
          seriesLine.setAttribute('y1', transistorY + transistorHeight / 2);
          seriesLine.setAttribute('x2', chainX);
          seriesLine.setAttribute('y2', transistorY + transistorHeight);
          seriesLine.setAttribute('stroke', '#000');
          seriesLine.setAttribute('stroke-width', '2.5');
          g.appendChild(seriesLine);
        }
      });

      // Connect top of chain to output
      const topConn = document.createElementNS(ns, 'line');
      topConn.setAttribute('x1', chainX);
      topConn.setAttribute('y1', chainStartY - transistorHeight / 2);
      topConn.setAttribute('x2', chainX);
      topConn.setAttribute('y2', outputY);
      topConn.setAttribute('stroke', '#000');
      topConn.setAttribute('stroke-width', '2.5');
      g.appendChild(topConn);

      const horizToOut = document.createElementNS(ns, 'line');
      horizToOut.setAttribute('x1', chainX);
      horizToOut.setAttribute('y1', outputY);
      horizToOut.setAttribute('x2', '1050');
      horizToOut.setAttribute('y2', outputY);
      horizToOut.setAttribute('stroke', '#000');
      horizToOut.setAttribute('stroke-width', '2.5');
      g.appendChild(horizToOut);

      // Connect bottom of chain to GND
      const lastChainY = chainStartY + (termLength - 1) * transistorHeight;
      const gndConn = document.createElementNS(ns, 'line');
      gndConn.setAttribute('x1', chainX);
      gndConn.setAttribute('y1', lastChainY + transistorHeight / 2);
      gndConn.setAttribute('x2', chainX);
      gndConn.setAttribute('y2', gndY);
      gndConn.setAttribute('stroke', '#000');
      gndConn.setAttribute('stroke-width', '2.5');
      g.appendChild(gndConn);
    });

    svgElement.appendChild(g);
    this.setupZoomPan(svgElement, g);
  }

  /**
   * Draw CMOS transistor using PNG images
   */
  drawCMOSTransistor(group, x, y, type, label = '') {
    const ns = 'http://www.w3.org/2000/svg';
    const imageName = type === 'PMOS' ? 'pmos.png' : 'nmos.png';
    
    const image = document.createElementNS(ns, 'image');
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `/assets/${imageName}`);
    image.setAttribute('x', x - 87);  // 160px wide, centered at x
    image.setAttribute('y', y - 52.5);  // 105px tall, centered at y
    image.setAttribute('width', '160');
    image.setAttribute('height', '105');
    group.appendChild(image);

    // Draw label if provided
    if (label) {
      const labelText = document.createElementNS(ns, 'text');
      labelText.setAttribute('x', x - 100);
      labelText.setAttribute('y', y + 5);
      labelText.setAttribute('font-size', '12');
      labelText.setAttribute('font-weight', 'bold');
      labelText.setAttribute('fill', '#000');
      labelText.textContent = label;
      group.appendChild(labelText);
    }
  }

  /**
   * Render truth table
   */
  renderTruthTable(containerElement) {
    containerElement.innerHTML = '';

    if (!this.truthTable || this.truthTable.length === 0) {
      containerElement.innerHTML = '<p>No truth table data</p>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'truth-table';

    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    this.variables.forEach(v => {
      const th = document.createElement('th');
      th.textContent = v.toUpperCase();
      headerRow.appendChild(th);
    });

    const outputTh = document.createElement('th');
    outputTh.textContent = 'Output';
    headerRow.appendChild(outputTh);

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body
    const tbody = document.createElement('tbody');
    this.truthTable.forEach((row, idx) => {
      const tr = document.createElement('tr');

      this.variables.forEach(v => {
        const td = document.createElement('td');
        td.textContent = row[v];
        td.className = row[v] === 1 ? 'high' : 'low';
        tr.appendChild(td);
      });

      const outputTd = document.createElement('td');
      outputTd.textContent = row.output;
      outputTd.className = row.output === 1 ? 'high' : 'low';
      outputTd.style.fontWeight = 'bold';
      tr.appendChild(outputTd);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    containerElement.appendChild(table);
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Visualizer;
}
