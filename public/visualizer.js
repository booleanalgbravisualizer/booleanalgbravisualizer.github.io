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
    bg.setAttribute('fill', '#f9f9f9');
    bg.setAttribute('stroke', '#ddd');
    bg.setAttribute('stroke-width', '1');
    svgElement.appendChild(bg);

    // Title
    const title = document.createElementNS(ns, 'text');
    title.setAttribute('x', '600');
    title.setAttribute('y', '25');
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('font-size', '18');
    title.setAttribute('font-weight', 'bold');
    title.textContent = 'Logic Gate Block Diagram';
    svgElement.appendChild(title);

    // Draw variable inputs on left
    const startY = 120;
    const gateSpacing = 80;

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
    this.renderGateTree(svgElement, this.ast, 200, 250);

    // Draw output circle
    const outputCircle = document.createElementNS(ns, 'circle');
    outputCircle.setAttribute('cx', '1100');
    outputCircle.setAttribute('cy', '250');
    outputCircle.setAttribute('r', '8');
    outputCircle.setAttribute('fill', '#28a745');
    svgElement.appendChild(outputCircle);

    const outputLabel = document.createElementNS(ns, 'text');
    outputLabel.setAttribute('x', '1050');
    outputLabel.setAttribute('y', '255');
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
    const spacing = 200;
    const verticalSpacing = 120;

    if (ast.type === 'VAR') {
      // Draw variable node
      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', x - 25);
      rect.setAttribute('y', y - 15);
      rect.setAttribute('width', '50');
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
      text.setAttribute('font-size', '13');
      text.setAttribute('font-weight', 'bold');
      text.textContent = ast.value.toUpperCase();
      svg.appendChild(text);

      return x + 50;
    }

    if (ast.type === 'NOT') {
      const inputX = this.renderGateTree(svg, ast.operand, x, y, depth + 1);
      const gateX = inputX + spacing;
      this.drawNotGate(svg, gateX, y);
      
      // Connect from input to gate
      this.connectLineOrthogonal(svg, inputX, y, gateX - 83, y);
      
      return gateX + 83;
    }

    if (ast.type === 'AND') {
      const leftY = y - verticalSpacing;
      const rightY = y + verticalSpacing;
      const leftX = this.renderGateTree(svg, ast.left, x, leftY, depth + 1);
      const rightX = this.renderGateTree(svg, ast.right, x, rightY, depth + 1);
      
      const gateX = Math.max(leftX, rightX) + spacing;
      this.drawAndGate(svg, gateX, y);
      
      // Connect inputs to gate using orthogonal paths
      // Gate image is 165 wide, so input ports are approximately at ±50 from center
      this.connectLineOrthogonal(svg, leftX, leftY, gateX - 50, y - 35);
      this.connectLineOrthogonal(svg, rightX, rightY, gateX - 50, y + 35);
      
      return gateX + 83;
    }

    if (ast.type === 'OR') {
      const leftY = y - verticalSpacing;
      const rightY = y + verticalSpacing;
      const leftX = this.renderGateTree(svg, ast.left, x, leftY, depth + 1);
      const rightX = this.renderGateTree(svg, ast.right, x, rightY, depth + 1);
      
      const gateX = Math.max(leftX, rightX) + spacing;
      this.drawOrGate(svg, gateX, y);
      
      // Connect inputs to gate using orthogonal paths
      this.connectLineOrthogonal(svg, leftX, leftY, gateX - 50, y - 35);
      this.connectLineOrthogonal(svg, rightX, rightY, gateX - 50, y + 35);
      
      return gateX + 83;
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

    // Gate image dimensions: 165x135
    const imgWidth = 165;
    const imgHeight = 135;

    // Embed the image centered at position (x, y)
    const image = document.createElementNS(ns, 'image');
    image.setAttribute('href', `/assets/${imageName}`);
    image.setAttribute('x', x - imgWidth / 2);
    image.setAttribute('y', y - imgHeight / 2);
    image.setAttribute('width', imgWidth);
    image.setAttribute('height', imgHeight);
    image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    g.appendChild(image);

    // Draw a transparent border for debugging
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', x - imgWidth / 2);
    rect.setAttribute('y', y - imgHeight / 2);
    rect.setAttribute('width', imgWidth);
    rect.setAttribute('height', imgHeight);
    rect.setAttribute('fill', 'none');
    rect.setAttribute('stroke', '#999');
    rect.setAttribute('stroke-width', '1');
    rect.setAttribute('opacity', '0.3');
    g.appendChild(rect);

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
    line1.setAttribute('stroke-width', '1.5');
    svg.appendChild(line1);
    
    // Vertical line to destination
    const line2 = document.createElementNS(ns, 'line');
    line2.setAttribute('x1', midX);
    line2.setAttribute('y1', y1);
    line2.setAttribute('x2', midX);
    line2.setAttribute('y2', y2);
    line2.setAttribute('stroke', '#333');
    line2.setAttribute('stroke-width', '1.5');
    svg.appendChild(line2);
    
    // Horizontal line to destination
    const line3 = document.createElementNS(ns, 'line');
    line3.setAttribute('x1', midX);
    line3.setAttribute('y1', y2);
    line3.setAttribute('x2', x2);
    line3.setAttribute('y2', y2);
    line3.setAttribute('stroke', '#333');
    line3.setAttribute('stroke-width', '1.5');
    svg.appendChild(line3);
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
