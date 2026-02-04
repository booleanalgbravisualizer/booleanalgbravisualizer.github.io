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
      const delta = e.deltaY > 0 ? 0.95 : 1.05;
      scale *= delta;
      scale = Math.min(Math.max(scale, 0.5), 3);
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
   * Render CMOS implementation diagram
   */
  renderCMOSDiagram(svgElement) {
    svgElement.innerHTML = '';

    const ns = 'http://www.w3.org/2000/svg';
    const numVars = this.variables.length;
    const transistorSpacing = 70;
    const transistorWidth = 24;
    const transistorHeight = 48;
    const minHeight = 300;
    const contentHeight = Math.max(minHeight - 100, 180);
    const totalHeight = contentHeight + 100;
    const contentWidth = 150 + numVars * transistorSpacing + 80;

    svgElement.setAttribute('viewBox', `0 0 ${contentWidth} ${totalHeight}`);

    // Background
    const bg = document.createElementNS(ns, 'rect');
    bg.setAttribute('width', contentWidth);
    bg.setAttribute('height', totalHeight);
    bg.setAttribute('fill', 'white');
    svgElement.appendChild(bg);

    // Create group for zoom/pan
    const g = document.createElementNS(ns, 'g');

    const vddY = 40;
    const gndY = totalHeight - 40;
    const midY = totalHeight / 2;
    const pmosCenterY = vddY + 60;
    const nmosCenterY = gndY - 60;

    // VDD line (black)
    const vddLine = document.createElementNS(ns, 'line');
    vddLine.setAttribute('x1', '40');
    vddLine.setAttribute('y1', vddY);
    vddLine.setAttribute('x2', contentWidth - 40);
    vddLine.setAttribute('y2', vddY);
    vddLine.setAttribute('stroke', '#000');
    vddLine.setAttribute('stroke-width', '3.5');
    g.appendChild(vddLine);

    const vddLabel = document.createElementNS(ns, 'text');
    vddLabel.setAttribute('x', '10');
    vddLabel.setAttribute('y', vddY + 5);
    vddLabel.setAttribute('font-size', '12');
    vddLabel.setAttribute('font-weight', 'bold');
    vddLabel.textContent = 'VDD';
    g.appendChild(vddLabel);

    // GND line (black)
    const gndLine = document.createElementNS(ns, 'line');
    gndLine.setAttribute('x1', '40');
    gndLine.setAttribute('y1', gndY);
    gndLine.setAttribute('x2', contentWidth - 40);
    gndLine.setAttribute('y2', gndY);
    gndLine.setAttribute('stroke', '#000');
    gndLine.setAttribute('stroke-width', '3.5');
    g.appendChild(gndLine);

    const gndLabel = document.createElementNS(ns, 'text');
    gndLabel.setAttribute('x', '5');
    gndLabel.setAttribute('y', gndY + 5);
    gndLabel.setAttribute('font-size', '12');
    gndLabel.setAttribute('font-weight', 'bold');
    gndLabel.textContent = 'GND';
    g.appendChild(gndLabel);

    const startX = 100;
    const varInputX = 50;

    // Draw variable inputs on left side
    this.variables.forEach((v, i) => {
      const varY = pmosCenterY - (numVars - 1) * 25 + i * 50;
      
      // Variable input box
      const box = document.createElementNS(ns, 'rect');
      box.setAttribute('x', varInputX);
      box.setAttribute('y', varY - 15);
      box.setAttribute('width', '30');
      box.setAttribute('height', '30');
      box.setAttribute('fill', 'white');
      box.setAttribute('stroke', '#aaa');
      box.setAttribute('stroke-width', '1.5');
      g.appendChild(box);

      const varLabel = document.createElementNS(ns, 'text');
      varLabel.setAttribute('x', varInputX + 15);
      varLabel.setAttribute('y', varY + 7);
      varLabel.setAttribute('text-anchor', 'middle');
      varLabel.setAttribute('font-size', '12');
      varLabel.setAttribute('font-weight', 'bold');
      varLabel.textContent = v.toUpperCase();
      g.appendChild(varLabel);
    });

    // Draw PMOS transistors with gates
    this.variables.forEach((v, i) => {
      const transistorX = startX + i * transistorSpacing;
      const varY = pmosCenterY - (numVars - 1) * 25 + i * 50;
      
      // Connect VDD to first PMOS drain
      if (i === 0) {
        const vddConnectLine = document.createElementNS(ns, 'line');
        vddConnectLine.setAttribute('x1', transistorX);
        vddConnectLine.setAttribute('y1', vddY);
        vddConnectLine.setAttribute('x2', transistorX);
        vddConnectLine.setAttribute('y2', pmosCenterY - transistorHeight / 2);
        vddConnectLine.setAttribute('stroke', '#333');
        vddConnectLine.setAttribute('stroke-width', '3.5');
        g.appendChild(vddConnectLine);
      }
      
      // Draw PMOS transistor
      this.drawCMOSTransistor(g, transistorX, pmosCenterY, 'PMOS');
      
      // Draw gate input line from variable to transistor gate
      const gateInputLine = document.createElementNS(ns, 'line');
      gateInputLine.setAttribute('x1', varInputX + 30);
      gateInputLine.setAttribute('y1', varY);
      gateInputLine.setAttribute('x2', transistorX - transistorWidth / 2 - 5);
      gateInputLine.setAttribute('y2', pmosCenterY);
      gateInputLine.setAttribute('stroke', '#333');
      gateInputLine.setAttribute('stroke-width', '2');
      g.appendChild(gateInputLine);
    });

    // Draw NMOS transistors with gates
    this.variables.forEach((v, i) => {
      const transistorX = startX + i * transistorSpacing;
      const varY = pmosCenterY - (numVars - 1) * 25 + i * 50;
      
      // Connect GND to first NMOS source
      if (i === 0) {
        const gndConnectLine = document.createElementNS(ns, 'line');
        gndConnectLine.setAttribute('x1', transistorX);
        gndConnectLine.setAttribute('y1', gndY);
        gndConnectLine.setAttribute('x2', transistorX);
        gndConnectLine.setAttribute('y2', nmosCenterY + transistorHeight / 2);
        gndConnectLine.setAttribute('stroke', '#333');
        gndConnectLine.setAttribute('stroke-width', '3.5');
        g.appendChild(gndConnectLine);
      }
      
      // Draw NMOS transistor
      this.drawCMOSTransistor(g, transistorX, nmosCenterY, 'NMOS');
      
      // Draw gate input line from variable to transistor gate
      const gateInputLine = document.createElementNS(ns, 'line');
      gateInputLine.setAttribute('x1', varInputX + 30);
      gateInputLine.setAttribute('y1', varY);
      gateInputLine.setAttribute('x2', transistorX - transistorWidth / 2 - 5);
      gateInputLine.setAttribute('y2', nmosCenterY);
      gateInputLine.setAttribute('stroke', '#333');
      gateInputLine.setAttribute('stroke-width', '2');
      g.appendChild(gateInputLine);
    });

    // Connect transistors in series (drain-to-gate connections)
    for (let i = 0; i < numVars - 1; i++) {
      const currentX = startX + i * transistorSpacing;
      const nextX = startX + (i + 1) * transistorSpacing;

      // PMOS source to next PMOS gate connection through middle
      const pConnectLine = document.createElementNS(ns, 'line');
      pConnectLine.setAttribute('x1', currentX);
      pConnectLine.setAttribute('y1', pmosCenterY + transistorHeight / 2);
      pConnectLine.setAttribute('x2', currentX);
      pConnectLine.setAttribute('y2', midY);
      pConnectLine.setAttribute('stroke', '#333');
      pConnectLine.setAttribute('stroke-width', '3.5');
      g.appendChild(pConnectLine);

      const pHorizontalLine = document.createElementNS(ns, 'line');
      pHorizontalLine.setAttribute('x1', currentX);
      pHorizontalLine.setAttribute('y1', midY);
      pHorizontalLine.setAttribute('x2', nextX);
      pHorizontalLine.setAttribute('y2', midY);
      pHorizontalLine.setAttribute('stroke', '#333');
      pHorizontalLine.setAttribute('stroke-width', '3.5');
      g.appendChild(pHorizontalLine);

      // NMOS drain to next NMOS source connection through middle
      const nConnectLine = document.createElementNS(ns, 'line');
      nConnectLine.setAttribute('x1', currentX);
      nConnectLine.setAttribute('y1', nmosCenterY - transistorHeight / 2);
      nConnectLine.setAttribute('x2', currentX);
      nConnectLine.setAttribute('y2', midY);
      nConnectLine.setAttribute('stroke', '#333');
      nConnectLine.setAttribute('stroke-width', '3.5');
      g.appendChild(nConnectLine);

      const nHorizontalLine = document.createElementNS(ns, 'line');
      nHorizontalLine.setAttribute('x1', currentX);
      nHorizontalLine.setAttribute('y1', midY);
      nHorizontalLine.setAttribute('x2', nextX);
      nHorizontalLine.setAttribute('y2', midY);
      nHorizontalLine.setAttribute('stroke', '#333');
      nHorizontalLine.setAttribute('stroke-width', '3.5');
      g.appendChild(nHorizontalLine);
    }

    // Last PMOS output
    const lastPmosX = startX + (numVars - 1) * transistorSpacing;
    const lastPmosOutput = document.createElementNS(ns, 'line');
    lastPmosOutput.setAttribute('x1', lastPmosX);
    lastPmosOutput.setAttribute('y1', pmosCenterY + transistorHeight / 2);
    lastPmosOutput.setAttribute('x2', lastPmosX);
    lastPmosOutput.setAttribute('y2', midY);
    lastPmosOutput.setAttribute('stroke', '#333');
    lastPmosOutput.setAttribute('stroke-width', '3.5');
    g.appendChild(lastPmosOutput);

    // Last NMOS output
    const lastNmosX = startX + (numVars - 1) * transistorSpacing;
    const lastNmosOutput = document.createElementNS(ns, 'line');
    lastNmosOutput.setAttribute('x1', lastNmosX);
    lastNmosOutput.setAttribute('y1', nmosCenterY - transistorHeight / 2);
    lastNmosOutput.setAttribute('x2', lastNmosX);
    lastNmosOutput.setAttribute('y2', midY);
    lastNmosOutput.setAttribute('stroke', '#333');
    lastNmosOutput.setAttribute('stroke-width', '3.5');
    g.appendChild(lastNmosOutput);

    // Output line extending right
    const outX = startX + (numVars - 1) * transistorSpacing;
    const outputLine = document.createElementNS(ns, 'line');
    outputLine.setAttribute('x1', outX);
    outputLine.setAttribute('y1', midY);
    outputLine.setAttribute('x2', contentWidth - 80);
    outputLine.setAttribute('y2', midY);
    outputLine.setAttribute('stroke', '#333');
    outputLine.setAttribute('stroke-width', '3.5');
    g.appendChild(outputLine);

    const outLabel = document.createElementNS(ns, 'text');
    outLabel.setAttribute('x', contentWidth - 60);
    outLabel.setAttribute('y', midY + 5);
    outLabel.setAttribute('font-size', '12');
    outLabel.setAttribute('font-weight', 'bold');
    outLabel.textContent = 'Out';
    g.appendChild(outLabel);

    svgElement.appendChild(g);
    this.setupZoomPan(svgElement, g);
  }

  /**
   * Draw CMOS transistor using PNG images
   */
  drawCMOSTransistor(group, x, y, type) {
    const ns = 'http://www.w3.org/2000/svg';
    const imageName = type === 'PMOS' ? 'pmos.png' : 'nmos.png';
    
    const image = document.createElementNS(ns, 'image');
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `/assets/${imageName}`);
    image.setAttribute('x', x - 12);  // 24px wide, centered at x
    image.setAttribute('y', y - 24);  // 48px tall, centered at y
    image.setAttribute('width', '24');
    image.setAttribute('height', '48');
    group.appendChild(image);
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
