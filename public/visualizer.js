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
    svgElement.setAttribute('viewBox', '0 0 900 400');

    const ns = 'http://www.w3.org/2000/svg';

    // Background
    const bg = document.createElementNS(ns, 'rect');
    bg.setAttribute('width', '900');
    bg.setAttribute('height', '400');
    bg.setAttribute('fill', '#f9f9f9');
    bg.setAttribute('stroke', '#ddd');
    bg.setAttribute('stroke-width', '1');
    svgElement.appendChild(bg);

    // Title
    const title = document.createElementNS(ns, 'text');
    title.setAttribute('x', '450');
    title.setAttribute('y', '25');
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('font-size', '18');
    title.setAttribute('font-weight', 'bold');
    title.textContent = 'Logic Gate Block Diagram';
    svgElement.appendChild(title);

    // Draw variable inputs on left
    const startY = 80;
    const gateSpacing = 50;

    this.variables.forEach((v, i) => {
      const y = startY + i * gateSpacing;

      // Input circle
      const circle = document.createElementNS(ns, 'circle');
      circle.setAttribute('cx', '40');
      circle.setAttribute('cy', y);
      circle.setAttribute('r', '8');
      circle.setAttribute('fill', '#667eea');
      svgElement.appendChild(circle);

      // Input label
      const label = document.createElementNS(ns, 'text');
      label.setAttribute('x', '65');
      label.setAttribute('y', y + 5);
      label.setAttribute('font-size', '14');
      label.setAttribute('font-weight', 'bold');
      label.textContent = v.toUpperCase();
      svgElement.appendChild(label);
    });

    // Render gate tree from AST
    this.renderGateTree(svgElement, this.ast, 150, 150);

    // Draw output circle
    const outputCircle = document.createElementNS(ns, 'circle');
    outputCircle.setAttribute('cx', '850');
    outputCircle.setAttribute('cy', '150');
    outputCircle.setAttribute('r', '8');
    outputCircle.setAttribute('fill', '#28a745');
    svgElement.appendChild(outputCircle);

    const outputLabel = document.createElementNS(ns, 'text');
    outputLabel.setAttribute('x', '810');
    outputLabel.setAttribute('y', '155');
    outputLabel.setAttribute('font-size', '14');
    outputLabel.setAttribute('font-weight', 'bold');
    outputLabel.textContent = 'Output';
    svgElement.appendChild(outputLabel);
  }

  /**
   * Recursively render gate tree
   */
  renderGateTree(svg, ast, x, y, depth = 0) {
    const ns = 'http://www.w3.org/2000/svg';
    const spacing = 80;

    if (ast.type === 'VAR') {
      // Draw variable node
      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', x - 20);
      rect.setAttribute('y', y - 15);
      rect.setAttribute('width', '40');
      rect.setAttribute('height', '30');
      rect.setAttribute('fill', '#e3f2fd');
      rect.setAttribute('stroke', '#1976d2');
      rect.setAttribute('stroke-width', '2');
      rect.setAttribute('rx', '3');
      svg.appendChild(rect);

      const text = document.createElementNS(ns, 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', y + 5);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('font-weight', 'bold');
      text.textContent = ast.value.toUpperCase();
      svg.appendChild(text);

      return x + 40;
    }

    if (ast.type === 'NOT') {
      const inputX = this.renderGateTree(svg, ast.operand, x, y, depth + 1);
      this.drawNotGate(svg, inputX + 30, y);
      return inputX + 80;
    }

    if (ast.type === 'AND') {
      const leftY = y - 40;
      const rightY = y + 40;
      const leftX = this.renderGateTree(svg, ast.left, x, leftY, depth + 1);
      const rightX = this.renderGateTree(svg, ast.right, x, rightY, depth + 1);
      
      const gateX = Math.max(leftX, rightX) + 30;
      this.drawAndGate(svg, gateX, y);
      
      // Connect inputs to gate
      this.connectLine(svg, leftX, leftY, gateX - 35, y - 12);
      this.connectLine(svg, rightX, rightY, gateX - 35, y + 12);
      
      return gateX + 80;
    }

    if (ast.type === 'OR') {
      const leftY = y - 40;
      const rightY = y + 40;
      const leftX = this.renderGateTree(svg, ast.left, x, leftY, depth + 1);
      const rightX = this.renderGateTree(svg, ast.right, x, rightY, depth + 1);
      
      const gateX = Math.max(leftX, rightX) + 30;
      this.drawOrGate(svg, gateX, y);
      
      // Connect inputs to gate
      this.connectLine(svg, leftX, leftY, gateX - 35, y - 12);
      this.connectLine(svg, rightX, rightY, gateX - 35, y + 12);
      
      return gateX + 80;
    }

    return x;
  }

  /**
   * Draw AND gate
   */
  drawAndGate(svg, x, y) {
    const ns = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(ns, 'g');

    // Flat left, curved right
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', `M ${x - 30} ${y - 25} L ${x - 30} ${y + 25} Q ${x + 5} ${y + 25} ${x + 5} ${y} Q ${x + 5} ${y - 25} ${x - 30} ${y - 25}`);
    path.setAttribute('stroke', '#333');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'white');
    g.appendChild(path);

    // Label
    const text = document.createElementNS(ns, 'text');
    text.setAttribute('x', x - 10);
    text.setAttribute('y', y + 6);
    text.setAttribute('font-size', '12');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('text-anchor', 'middle');
    text.textContent = '&';
    g.appendChild(text);

    svg.appendChild(g);
  }

  /**
   * Draw OR gate
   */
  drawOrGate(svg, x, y) {
    const ns = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(ns, 'g');

    // Curved on both sides
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', `M ${x - 30} ${y - 25} Q ${x - 20} ${y - 25} ${x - 10} ${y - 18} L ${x + 15} ${y} L ${x - 10} ${y + 18} Q ${x - 20} ${y + 25} ${x - 30} ${y + 25} Q ${x - 40} ${y + 18} ${x - 40} ${y} Q ${x - 40} ${y - 18} ${x - 30} ${y - 25}`);
    path.setAttribute('stroke', '#333');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'white');
    g.appendChild(path);

    // Label
    const text = document.createElementNS(ns, 'text');
    text.setAttribute('x', x - 15);
    text.setAttribute('y', y + 6);
    text.setAttribute('font-size', '12');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('text-anchor', 'middle');
    text.textContent = '≥1';
    g.appendChild(text);

    svg.appendChild(g);
  }

  /**
   * Draw NOT gate
   */
  drawNotGate(svg, x, y) {
    const ns = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(ns, 'g');

    // Triangle
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', `M ${x - 15} ${y - 18} L ${x + 15} ${y} L ${x - 15} ${y + 18} Z`);
    path.setAttribute('stroke', '#333');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'white');
    g.appendChild(path);

    // Negation circle
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', x + 22);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', '6');
    circle.setAttribute('stroke', '#333');
    circle.setAttribute('stroke-width', '2');
    circle.setAttribute('fill', 'white');
    g.appendChild(circle);

    svg.appendChild(g);
  }

  /**
   * Helper: draw connecting line
   */
  connectLine(svg, x1, y1, x2, y2) {
    const ns = 'http://www.w3.org/2000/svg';
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', '#333');
    line.setAttribute('stroke-width', '1.5');
    svg.appendChild(line);
  }

  /**
   * Render CMOS implementation diagram
   */
  renderCMOSDiagram(svgElement) {
    svgElement.innerHTML = '';
    svgElement.setAttribute('viewBox', '0 0 900 450');

    const ns = 'http://www.w3.org/2000/svg';

    // Background
    const bg = document.createElementNS(ns, 'rect');
    bg.setAttribute('width', '900');
    bg.setAttribute('height', '450');
    bg.setAttribute('fill', '#fafafa');
    bg.setAttribute('stroke', '#ddd');
    bg.setAttribute('stroke-width', '1');
    svgElement.appendChild(bg);

    // Title
    const title = document.createElementNS(ns, 'text');
    title.setAttribute('x', '450');
    title.setAttribute('y', '25');
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('font-size', '18');
    title.setAttribute('font-weight', 'bold');
    title.textContent = 'CMOS Implementation';
    svgElement.appendChild(title);

    // VDD line
    const vddLine = document.createElementNS(ns, 'line');
    vddLine.setAttribute('x1', '100');
    vddLine.setAttribute('y1', '80');
    vddLine.setAttribute('x2', '800');
    vddLine.setAttribute('y2', '80');
    vddLine.setAttribute('stroke', '#d32f2f');
    vddLine.setAttribute('stroke-width', '3');
    svgElement.appendChild(vddLine);

    const vddLabel = document.createElementNS(ns, 'text');
    vddLabel.setAttribute('x', '50');
    vddLabel.setAttribute('y', '85');
    vddLabel.setAttribute('font-size', '12');
    vddLabel.setAttribute('font-weight', 'bold');
    vddLabel.textContent = 'VDD';
    svgElement.appendChild(vddLabel);

    // GND line
    const gndLine = document.createElementNS(ns, 'line');
    gndLine.setAttribute('x1', '100');
    gndLine.setAttribute('y1', '420');
    gndLine.setAttribute('x2', '800');
    gndLine.setAttribute('y2', '420');
    gndLine.setAttribute('stroke', '#1976d2');
    gndLine.setAttribute('stroke-width', '3');
    svgElement.appendChild(gndLine);

    const gndLabel = document.createElementNS(ns, 'text');
    gndLabel.setAttribute('x', '40');
    gndLabel.setAttribute('y', '425');
    gndLabel.setAttribute('font-size', '12');
    gndLabel.setAttribute('font-weight', 'bold');
    gndLabel.textContent = 'GND';
    svgElement.appendChild(gndLabel);

    // Draw pull-up network (PMOS)
    this.variables.forEach((v, i) => {
      this.drawCMOSTransistor(svgElement, 200 + i * 100, 120, 'PMOS', '#2196f3');
    });

    // Draw pull-down network (NMOS)
    this.variables.forEach((v, i) => {
      this.drawCMOSTransistor(svgElement, 200 + i * 100, 360, 'NMOS', '#f44336');
    });

    // Output node
    const output = document.createElementNS(ns, 'circle');
    output.setAttribute('cx', '100');
    output.setAttribute('cy', '250');
    output.setAttribute('r', '8');
    output.setAttribute('fill', '#ff9800');
    output.setAttribute('stroke', '#333');
    output.setAttribute('stroke-width', '2');
    svgElement.appendChild(output);

    const outLabel = document.createElementNS(ns, 'text');
    outLabel.setAttribute('x', '30');
    outLabel.setAttribute('y', '255');
    outLabel.setAttribute('font-size', '12');
    outLabel.setAttribute('font-weight', 'bold');
    outLabel.textContent = 'Out';
    svgElement.appendChild(outLabel);

    // Info box
    const infoBox = document.createElementNS(ns, 'rect');
    infoBox.setAttribute('x', '550');
    infoBox.setAttribute('y', '120');
    infoBox.setAttribute('width', '300');
    infoBox.setAttribute('height', '280');
    infoBox.setAttribute('fill', '#e8f5e9');
    infoBox.setAttribute('stroke', '#4caf50');
    infoBox.setAttribute('stroke-width', '2');
    infoBox.setAttribute('rx', '5');
    svgElement.appendChild(infoBox);

    const infoTitle = document.createElementNS(ns, 'text');
    infoTitle.setAttribute('x', '700');
    infoTitle.setAttribute('y', '145');
    infoTitle.setAttribute('font-size', '14');
    infoTitle.setAttribute('font-weight', 'bold');
    infoTitle.setAttribute('text-anchor', 'middle');
    infoTitle.textContent = 'CMOS Characteristics';
    svgElement.appendChild(infoTitle);

    const infos = [
      '• PMOS transistors in pull-up network',
      '• NMOS transistors in pull-down network',
      '• Complementary logic design',
      '• Low static power consumption',
      '• High noise immunity',
      '• Logic levels: 0 or 1 (rail-to-rail)',
      '• Push-pull output stage'
    ];

    infos.forEach((info, i) => {
      const text = document.createElementNS(ns, 'text');
      text.setAttribute('x', '570');
      text.setAttribute('y', 175 + i * 28);
      text.setAttribute('font-size', '11');
      text.textContent = info;
      svgElement.appendChild(text);
    });
  }

  /**
   * Draw CMOS transistor
   */
  drawCMOSTransistor(svg, x, y, type, color) {
    const ns = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(ns, 'g');

    // Gate line (vertical)
    const gateLine = document.createElementNS(ns, 'line');
    gateLine.setAttribute('x1', x - 12);
    gateLine.setAttribute('y1', y - 30);
    gateLine.setAttribute('x2', x - 12);
    gateLine.setAttribute('y2', y + 30);
    gateLine.setAttribute('stroke', '#333');
    gateLine.setAttribute('stroke-width', '2');
    g.appendChild(gateLine);

    // Channel (rectangle)
    const channel = document.createElementNS(ns, 'rect');
    channel.setAttribute('x', x - 8);
    channel.setAttribute('y', y - 10);
    channel.setAttribute('width', '20');
    channel.setAttribute('height', '20');
    channel.setAttribute('fill', color);
    channel.setAttribute('stroke', '#333');
    channel.setAttribute('stroke-width', '2');
    channel.setAttribute('rx', '2');
    g.appendChild(channel);

    // Drain connection
    const drain = document.createElementNS(ns, 'line');
    drain.setAttribute('x1', x + 12);
    drain.setAttribute('y1', y - 10);
    drain.setAttribute('x2', x + 12);
    drain.setAttribute('y2', y - 30);
    drain.setAttribute('stroke', '#333');
    drain.setAttribute('stroke-width', '2');
    g.appendChild(drain);

    // Source connection
    const source = document.createElementNS(ns, 'line');
    source.setAttribute('x1', x + 12);
    source.setAttribute('y1', y + 10);
    source.setAttribute('x2', x + 12);
    source.setAttribute('y2', y + 30);
    source.setAttribute('stroke', '#333');
    source.setAttribute('stroke-width', '2');
    g.appendChild(source);

    // Type label
    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', x + 35);
    label.setAttribute('y', y + 5);
    label.setAttribute('font-size', '10');
    label.setAttribute('font-weight', 'bold');
    label.textContent = type === 'PMOS' ? 'P' : 'N';
    g.appendChild(label);

    svg.appendChild(g);
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
