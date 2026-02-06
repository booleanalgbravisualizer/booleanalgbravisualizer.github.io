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
    line.setAttribute('stroke', '#000000');
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
   * Setup zoom and pan functionality for SVG - centers zoom on mouse position
   */
  setupZoomPan(svgElement, group) {
    let scale = 1;
    let panning = false;
    let startX = 0;
    let startY = 0;
    let translateX = 0;
    let translateY = 0;

    const updateTransform = () => {
      group.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);
    };

    // Zoom with scroll - centered on mouse position
    svgElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = svgElement.getBoundingClientRect();
      
      // Get mouse position relative to SVG
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calculate zoom
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(Math.max(scale * delta, 0.3), 5);
      
      // Adjust translation to zoom toward mouse position
      const scaleChange = newScale / scale;
      translateX = mouseX - (mouseX - translateX) * scaleChange;
      translateY = mouseY - (mouseY - translateY) * scaleChange;
      
      scale = newScale;
      updateTransform();
    });

    // Pan with mouse drag
    svgElement.addEventListener('mousedown', (e) => {
      panning = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      svgElement.style.cursor = 'grabbing';
    });

    svgElement.addEventListener('mousemove', (e) => {
      if (panning) {
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        updateTransform();
      }
    });

    svgElement.addEventListener('mouseup', () => {
      panning = false;
      svgElement.style.cursor = 'grab';
    });

    svgElement.addEventListener('mouseleave', () => {
      panning = false;
      svgElement.style.cursor = 'grab';
    });
    
    svgElement.style.cursor = 'grab';
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
      line.setAttribute('stroke', '#000000');
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
      
      this.connectLineOrthogonal(svg, leftX, leftY, gateX - 50, y - 23);
      this.connectLineOrthogonal(svg, rightX, rightY, gateX - 50, y + 23);
      
      return gateX + 60;
    }

    if (ast.type === 'OR') {
      const leftY = y - verticalSpacing;
      const rightY = y + verticalSpacing;
      const leftX = this.renderGateTree(svg, ast.left, x, leftY, depth + 1);
      const rightX = this.renderGateTree(svg, ast.right, x, rightY, depth + 1);
      
      const gateX = Math.max(leftX, rightX) + spacing;
      this.drawOrGate(svg, gateX, y);
      
      this.connectLineOrthogonal(svg, leftX, leftY, gateX - 50, y - 21);
      this.connectLineOrthogonal(svg, rightX, rightY, gateX - 50, y + 21);
      
      return gateX + 60;
    }

    if (ast.type === 'NAND') {
      const leftY = y - verticalSpacing;
      const rightY = y + verticalSpacing;
      const leftX = this.renderGateTree(svg, ast.left, x, leftY, depth + 1);
      const rightX = this.renderGateTree(svg, ast.right, x, rightY, depth + 1);
      
      const gateX = Math.max(leftX, rightX) + spacing;
      this.drawNandGate(svg, gateX, y);
      
      this.connectLineOrthogonal(svg, leftX, leftY, gateX - 50, y - 21.5);
      this.connectLineOrthogonal(svg, rightX, rightY, gateX - 50, y + 21.5);
      
      return gateX + 60;
    }

    if (ast.type === 'NOR') {
      const leftY = y - verticalSpacing;
      const rightY = y + verticalSpacing;
      const leftX = this.renderGateTree(svg, ast.left, x, leftY, depth + 1);
      const rightX = this.renderGateTree(svg, ast.right, x, rightY, depth + 1);
      
      const gateX = Math.max(leftX, rightX) + spacing;
      this.drawNorGate(svg, gateX, y);
      
      this.connectLineOrthogonal(svg, leftX, leftY, gateX - 50, y - 19);
      this.connectLineOrthogonal(svg, rightX, rightY, gateX - 50, y + 19);
      
      return gateX + 60;
    }

    if (ast.type === 'XOR') {
      const leftY = y - verticalSpacing;
      const rightY = y + verticalSpacing;
      const leftX = this.renderGateTree(svg, ast.left, x, leftY, depth + 1);
      const rightX = this.renderGateTree(svg, ast.right, x, rightY, depth + 1);
      
      const gateX = Math.max(leftX, rightX) + spacing;
      this.drawXorGate(svg, gateX, y);
      
      this.connectLineOrthogonal(svg, leftX, leftY, gateX - 50, y - 18.5);
      this.connectLineOrthogonal(svg, rightX, rightY, gateX - 50, y + 18.5);
      
      return gateX + 60;
    }

    if (ast.type === 'XNOR') {
      const leftY = y - verticalSpacing;
      const rightY = y + verticalSpacing;
      const leftX = this.renderGateTree(svg, ast.left, x, leftY, depth + 1);
      const rightX = this.renderGateTree(svg, ast.right, x, rightY, depth + 1);
      
      const gateX = Math.max(leftX, rightX) + spacing;
      this.drawXnorGate(svg, gateX, y);
      
      this.connectLineOrthogonal(svg, leftX, leftY, gateX - 50, y - 17);
      this.connectLineOrthogonal(svg, rightX, rightY, gateX - 50, y + 17);
      
      return gateX + 60;
    }

    return x;
  }

  /**
   * Draw AND gate using image
   */
  drawAndGate(svg, x, y) {
    this.drawGateImage(svg, x, y+1.4, 'and.png', 'AND');
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
    this.drawGateImage(svg, x+0.5, y-1, 'not.png', 'NOT');
  }

  /**
   * Draw NAND gate using image
   */
  drawNandGate(svg, x, y) {
    this.drawGateImage(svg, x, y+0.5, 'nand.png', 'NAND');
  }

  /**
   * Draw NOR gate using image
   */
  drawNorGate(svg, x, y) {
    this.drawGateImage(svg, x, y+0.4, 'nor.png', 'NOR');
  }

  /**
   * Draw XOR gate using image
   */
  drawXorGate(svg, x, y) {
    this.drawGateImage(svg, x, y+0.1, 'xor.png', 'XOR');
  }

  /**
   * Draw XNOR gate using image
   */
  drawXnorGate(svg, x, y) {
    this.drawGateImage(svg, x, y+0.1, 'xnor.png', 'XNOR');
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
    const imageHref = new URL(`assets/${imageName}`, document.baseURI).toString();
    image.setAttribute('href', imageHref);
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imageHref);
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
    line1.setAttribute('stroke', '#000000');
    line1.setAttribute('stroke-width', '3.5');
    svg.appendChild(line1);
    
    // Vertical line to destination
    const line2 = document.createElementNS(ns, 'line');
    line2.setAttribute('x1', midX);
    line2.setAttribute('y1', y1);
    line2.setAttribute('x2', midX);
    line2.setAttribute('y2', y2);
    line2.setAttribute('stroke', '#000000');
    line2.setAttribute('stroke-width', '3.5');
    svg.appendChild(line2);
    
    // Horizontal line to destination
    const line3 = document.createElementNS(ns, 'line');
    line3.setAttribute('x1', midX);
    line3.setAttribute('y1', y2);
    line3.setAttribute('x2', x2);
    line3.setAttribute('y2', y2);
    line3.setAttribute('stroke', '#000000');
    line3.setAttribute('stroke-width', '3.5');
    svg.appendChild(line3);
  }

  // ============================================================
  // CMOS LOGIC: Correct PDN/PUN with Duality
  // ============================================================

  /**
   * Push NOTs down to leaves using De Morgan's laws, then REMOVE them
   * This expands NAND/NOR/XOR/XNOR to AND/OR form
   * Returns an AST with only AND, OR, and VAR nodes
   */
  expandToAndOr(node) {
    if (!node) return node;

    if (node.type === 'VAR') {
      return node;
    }

    // NOT - apply De Morgan or double-negation
    if (node.type === 'NOT') {
      const inner = node.operand;
      
      // NOT(NOT(x)) = x
      if (inner.type === 'NOT') {
        return this.expandToAndOr(inner.operand);
      }
      
      // NOT(VAR) - keep as is (will handle in PDN building)
      if (inner.type === 'VAR') {
        return node;
      }
      
      // De Morgan: NOT(AND(a,b)) = OR(NOT(a), NOT(b))
      if (inner.type === 'AND') {
        return this.expandToAndOr({
          type: 'OR',
          left: { type: 'NOT', operand: inner.left },
          right: { type: 'NOT', operand: inner.right }
        });
      }
      
      // De Morgan: NOT(OR(a,b)) = AND(NOT(a), NOT(b))
      if (inner.type === 'OR') {
        return this.expandToAndOr({
          type: 'AND',
          left: { type: 'NOT', operand: inner.left },
          right: { type: 'NOT', operand: inner.right }
        });
      }
      
      // NOT(NAND(a,b)) = AND(a,b)
      if (inner.type === 'NAND') {
        return this.expandToAndOr({
          type: 'AND',
          left: inner.left,
          right: inner.right
        });
      }
      
      // NOT(NOR(a,b)) = OR(a,b)
      if (inner.type === 'NOR') {
        return this.expandToAndOr({
          type: 'OR',
          left: inner.left,
          right: inner.right
        });
      }
      
      // NOT(XOR(a,b)) = XNOR - expand
      if (inner.type === 'XOR') {
        return this.expandToAndOr({
          type: 'OR',
          left: { type: 'AND', left: inner.left, right: inner.right },
          right: { 
            type: 'AND', 
            left: { type: 'NOT', operand: inner.left },
            right: { type: 'NOT', operand: inner.right }
          }
        });
      }
      
      // NOT(XNOR(a,b)) = XOR - expand
      if (inner.type === 'XNOR') {
        return this.expandToAndOr({
          type: 'OR',
          left: { type: 'AND', left: inner.left, right: { type: 'NOT', operand: inner.right } },
          right: { type: 'AND', left: { type: 'NOT', operand: inner.left }, right: inner.right }
        });
      }
    }
    
    // NAND(a,b) = NOT(AND(a,b)) - expand via De Morgan to OR(NOT a, NOT b)
    if (node.type === 'NAND') {
      return this.expandToAndOr({
        type: 'OR',
        left: { type: 'NOT', operand: node.left },
        right: { type: 'NOT', operand: node.right }
      });
    }
    
    // NOR(a,b) = NOT(OR(a,b)) - expand via De Morgan to AND(NOT a, NOT b)
    if (node.type === 'NOR') {
      return this.expandToAndOr({
        type: 'AND',
        left: { type: 'NOT', operand: node.left },
        right: { type: 'NOT', operand: node.right }
      });
    }
    
    // XOR(a,b) = (a AND NOT b) OR (NOT a AND b)
    if (node.type === 'XOR') {
      return this.expandToAndOr({
        type: 'OR',
        left: { type: 'AND', left: node.left, right: { type: 'NOT', operand: node.right } },
        right: { type: 'AND', left: { type: 'NOT', operand: node.left }, right: node.right }
      });
    }
    
    // XNOR(a,b) = (a AND b) OR (NOT a AND NOT b)
    if (node.type === 'XNOR') {
      return this.expandToAndOr({
        type: 'OR',
        left: { type: 'AND', left: node.left, right: node.right },
        right: { 
          type: 'AND', 
          left: { type: 'NOT', operand: node.left },
          right: { type: 'NOT', operand: node.right }
        }
      });
    }
    
    // AND and OR: recurse on children
    if (node.type === 'AND' || node.type === 'OR') {
      return {
        type: node.type,
        left: this.expandToAndOr(node.left),
        right: this.expandToAndOr(node.right)
      };
    }
    
    return node;
  }

  /**
   * Build PDN tree structure from expanded AST
   * PDN conducts when output should be 0 (pulls down to GND)
   * For function F: PDN implements NOT(F)
   *   - OR in F → parallel NMOS in PDN (either path pulls down)
   *   - AND in F → series NMOS in PDN (both needed to pull down)
   * 
   * We use DIRECT variable names (A, B, C) not inverted ones
   * The output of this network is F_bar, so we add an inverter at the end
   */
  buildPDNTree(node) {
    if (!node) return null;

    // Variable: single NMOS with gate = variable (direct, not inverted!)
    if (node.type === 'VAR') {
      return { type: 'device', deviceType: 'nmos', gate: node.value.toUpperCase() };
    }

    // NOT(VAR): For PDN, NOT(x) means we need x' to conduct
    // But we want to use direct signals, so this creates a complementary path
    // In practice, NOT at leaves means the signal is inverted - we'll mark it
    if (node.type === 'NOT' && node.operand.type === 'VAR') {
      return { type: 'device', deviceType: 'nmos', gate: node.operand.value.toUpperCase(), inverted: true };
    }

    // OR → parallel connection in PDN (either path can pull down)
    if (node.type === 'OR') {
      return {
        type: 'parallel',
        children: [this.buildPDNTree(node.left), this.buildPDNTree(node.right)]
      };
    }

    // AND → series connection in PDN (both paths must conduct to pull down)
    if (node.type === 'AND') {
      return {
        type: 'series',
        children: [this.buildPDNTree(node.left), this.buildPDNTree(node.right)]
      };
    }

    return null;
  }

  /**
   * Dualize a network tree: swap series↔parallel, nmos↔pmos
   * Gate signals stay the same!
   */
  dualizePDNtoPUN(pdnNode) {
    if (!pdnNode) return null;

    // Device: swap nmos → pmos, keep same gate signal
    if (pdnNode.type === 'device') {
      return {
        type: 'device',
        deviceType: 'pmos',
        gate: pdnNode.gate,
        inverted: pdnNode.inverted  // Keep inversion flag
      };
    }

    // Series → Parallel
    if (pdnNode.type === 'series') {
      return {
        type: 'parallel',
        children: pdnNode.children.map(c => this.dualizePDNtoPUN(c))
      };
    }

    // Parallel → Series
    if (pdnNode.type === 'parallel') {
      return {
        type: 'series',
        children: pdnNode.children.map(c => this.dualizePDNtoPUN(c))
      };
    }

    return null;
  }

  /**
   * Render CMOS implementation diagram
   * 
   * Algorithm:
   * 1. Expand F to AND/OR/NOT form
   * 2. Build PDN from F: OR→parallel, AND→series (NMOS)
   * 3. Dualize PDN to get PUN: swap series↔parallel, NMOS→PMOS
   * 4. This gives F_bar at output node
   * 5. Add inverter to get final output F
   */
  renderCMOSDiagram(svgElement) {
    svgElement.innerHTML = '';
    const ns = 'http://www.w3.org/2000/svg';
    svgElement.setAttribute('viewBox', '0 0 1800 1200');

    const bg = document.createElementNS(ns, 'rect');
    bg.setAttribute('width', '1800');
    bg.setAttribute('height', '1200');
    bg.setAttribute('fill', 'white');
    svgElement.appendChild(bg);

    const g = document.createElementNS(ns, 'g');
    g.setAttribute('id', 'cmosGroup');

    // Layout parameters
    const mainCenterX = 600;
    const inverterX = 1365;  // Moved left by 35px
    const vddY = 80;
    const gndY = 1120;
    const outputY = 600;
    const transistorSpacingH = 180;
    const transistorSpacingV = 140;

    // Step 1: Expand F to AND/OR form
    const expandedF = this.expandToAndOr(this.ast);
    
    // Step 2: Build PDN from F
    const pdnTree = this.buildPDNTree(expandedF);
    
    // Step 3: Dualize PDN to get PUN
    const punTree = this.dualizePDNtoPUN(pdnTree);

    // ============================================
    // MAIN NETWORK (produces F_bar)
    // ============================================
    
    // Draw VDD symbol for main network
    this.drawVDDSymbol(g, mainCenterX, vddY);

    // Draw GND symbol for main network
    this.drawGNDSymbol(g, mainCenterX, gndY);

    // Render PUN (PMOS pull-up network) - between VDD and output
    const punStartY = vddY + 100;
    const punResult = this.renderCMOSTree(g, punTree, mainCenterX, punStartY, transistorSpacingH, transistorSpacingV);
    
    // Connect VDD to PUN top
    const vddToPun = document.createElementNS(ns, 'line');
    vddToPun.setAttribute('x1', mainCenterX);
    vddToPun.setAttribute('y1', vddY);
    vddToPun.setAttribute('x2', punResult.topX);
    vddToPun.setAttribute('y2', punResult.topY);
    vddToPun.setAttribute('stroke', '#000');
    vddToPun.setAttribute('stroke-width', '3');
    g.appendChild(vddToPun);
    
    // Connect PUN bottom to output node
    const punToOut = document.createElementNS(ns, 'line');
    punToOut.setAttribute('x1', punResult.bottomX);
    punToOut.setAttribute('y1', punResult.bottomY);
    punToOut.setAttribute('x2', mainCenterX);
    punToOut.setAttribute('y2', outputY);
    punToOut.setAttribute('stroke', '#000');
    punToOut.setAttribute('stroke-width', '3');
    g.appendChild(punToOut);

    // Render PDN (NMOS pull-down network) - between output and GND
    const pdnStartY = outputY + 120;
    const pdnResult = this.renderCMOSTree(g, pdnTree, mainCenterX, pdnStartY, transistorSpacingH, transistorSpacingV);
    
    // Connect output to PDN top
    const outToPdn = document.createElementNS(ns, 'line');
    outToPdn.setAttribute('x1', mainCenterX);
    outToPdn.setAttribute('y1', outputY);
    outToPdn.setAttribute('x2', pdnResult.topX);
    outToPdn.setAttribute('y2', pdnResult.topY);
    outToPdn.setAttribute('stroke', '#000');
    outToPdn.setAttribute('stroke-width', '3');
    g.appendChild(outToPdn);

    // Connect PDN bottom to GND
    const pdnToGnd = document.createElementNS(ns, 'line');
    pdnToGnd.setAttribute('x1', pdnResult.bottomX);
    pdnToGnd.setAttribute('y1', pdnResult.bottomY);
    pdnToGnd.setAttribute('x2', mainCenterX);
    pdnToGnd.setAttribute('y2', gndY - 30);
    pdnToGnd.setAttribute('stroke', '#000');
    pdnToGnd.setAttribute('stroke-width', '3');
    g.appendChild(pdnToGnd);

    // ============================================
    // CONNECTION TO INVERTER GATES
    // ============================================
    const connLineY = outputY;
    const gateConnectionX = inverterX - 70;  // Position for vertical gate line
    
    // Horizontal line from main network to inverter gate area
    const connLine = document.createElementNS(ns, 'line');
    connLine.setAttribute('x1', mainCenterX);
    connLine.setAttribute('y1', connLineY);
    connLine.setAttribute('x2', gateConnectionX);
    connLine.setAttribute('y2', connLineY);
    connLine.setAttribute('stroke', '#000');
    connLine.setAttribute('stroke-width', '3');
    g.appendChild(connLine);

    // ============================================
    // OUTPUT INVERTER (converts F_bar to F)
    // ============================================
    const invVddY = outputY - 200;
    const invGndY = outputY + 200;
    const invMidY = outputY;

    // Inverter VDD
    this.drawVDDSymbol(g, inverterX, invVddY);

    // Inverter GND
    this.drawGNDSymbol(g, inverterX, invGndY);

    // PMOS for inverter (between VDD and output)
    const pmosY = outputY - 90;
    this.drawCMOSTransistor(g, inverterX, pmosY, 'PMOS', '');
    
    // Connect inverter VDD to PMOS
    const invVddToPmos = document.createElementNS(ns, 'line');
    invVddToPmos.setAttribute('x1', inverterX);
    invVddToPmos.setAttribute('y1', invVddY);
    invVddToPmos.setAttribute('x2', inverterX);
    invVddToPmos.setAttribute('y2', pmosY - 50);
    invVddToPmos.setAttribute('stroke', '#000');
    invVddToPmos.setAttribute('stroke-width', '3');
    g.appendChild(invVddToPmos);

    // NMOS for inverter (between output and GND)
    const nmosY = outputY + 90;
    this.drawCMOSTransistor(g, inverterX, nmosY, 'NMOS', '');
    
    // Connect NMOS to inverter GND
    const invNmosToGnd = document.createElementNS(ns, 'line');
    invNmosToGnd.setAttribute('x1', inverterX);
    invNmosToGnd.setAttribute('y1', nmosY + 50);
    invNmosToGnd.setAttribute('x2', inverterX);
    invNmosToGnd.setAttribute('y2', invGndY - 30);
    invNmosToGnd.setAttribute('stroke', '#000');
    invNmosToGnd.setAttribute('stroke-width', '3');
    g.appendChild(invNmosToGnd);

    // Connect PMOS to output node
    const pmosToInvOut = document.createElementNS(ns, 'line');
    pmosToInvOut.setAttribute('x1', inverterX);
    pmosToInvOut.setAttribute('y1', pmosY + 50);
    pmosToInvOut.setAttribute('x2', inverterX);
    pmosToInvOut.setAttribute('y2', invMidY);
    pmosToInvOut.setAttribute('stroke', '#000');
    pmosToInvOut.setAttribute('stroke-width', '3');
    g.appendChild(pmosToInvOut);

    // Connect output node to NMOS
    const invOutToNmos = document.createElementNS(ns, 'line');
    invOutToNmos.setAttribute('x1', inverterX);
    invOutToNmos.setAttribute('y1', invMidY);
    invOutToNmos.setAttribute('x2', inverterX);
    invOutToNmos.setAttribute('y2', nmosY - 50);
    invOutToNmos.setAttribute('stroke', '#000');
    invOutToNmos.setAttribute('stroke-width', '3');
    g.appendChild(invOutToNmos);

    // Gate input vertical line connecting to both transistor gates
    const gateVertLine = document.createElementNS(ns, 'line');
    gateVertLine.setAttribute('x1', gateConnectionX);
    gateVertLine.setAttribute('y1', pmosY);
    gateVertLine.setAttribute('x2', gateConnectionX);
    gateVertLine.setAttribute('y2', nmosY);
    gateVertLine.setAttribute('stroke', '#000');
    gateVertLine.setAttribute('stroke-width', '3');
    g.appendChild(gateVertLine);
    
    // Horizontal line to PMOS gate terminal
    const pmosGateLine = document.createElementNS(ns, 'line');
    pmosGateLine.setAttribute('x1', gateConnectionX);
    pmosGateLine.setAttribute('y1', pmosY);
    pmosGateLine.setAttribute('x2', inverterX - 60);
    pmosGateLine.setAttribute('y2', pmosY);
    pmosGateLine.setAttribute('stroke', '#000');
    pmosGateLine.setAttribute('stroke-width', '3');
    g.appendChild(pmosGateLine);
    
    // Horizontal line to NMOS gate terminal
    const nmosGateLine = document.createElementNS(ns, 'line');
    nmosGateLine.setAttribute('x1', gateConnectionX);
    nmosGateLine.setAttribute('y1', nmosY);
    nmosGateLine.setAttribute('x2', inverterX - 60);
    nmosGateLine.setAttribute('y2', nmosY);
    nmosGateLine.setAttribute('stroke', '#000');
    nmosGateLine.setAttribute('stroke-width', '3');
    g.appendChild(nmosGateLine);

    // Final output line and node
    const finalOutputX = inverterX + 150;
    const finalOutLine = document.createElementNS(ns, 'line');
    finalOutLine.setAttribute('x1', inverterX);
    finalOutLine.setAttribute('y1', invMidY);
    finalOutLine.setAttribute('x2', finalOutputX);
    finalOutLine.setAttribute('y2', invMidY);
    finalOutLine.setAttribute('stroke', '#000');
    finalOutLine.setAttribute('stroke-width', '3');
    g.appendChild(finalOutLine);

    // Final output node
    const finalOutCircle = document.createElementNS(ns, 'circle');
    finalOutCircle.setAttribute('cx', finalOutputX);
    finalOutCircle.setAttribute('cy', invMidY);
    finalOutCircle.setAttribute('r', '8');
    finalOutCircle.setAttribute('fill', '#000');
    g.appendChild(finalOutCircle);

    // Final output label
    const finalOutLabel = document.createElementNS(ns, 'text');
    finalOutLabel.setAttribute('x', finalOutputX + 20);
    finalOutLabel.setAttribute('y', invMidY + 6);
    finalOutLabel.setAttribute('font-size', '18');
    finalOutLabel.setAttribute('font-weight', 'bold');
    finalOutLabel.textContent = 'Output';
    g.appendChild(finalOutLabel);

    svgElement.appendChild(g);
    this.setupZoomPan(svgElement, g);
  }

  /**
   * Recursively render a CMOS tree (PDN or PUN structure)
   * Returns { topX, topY, bottomX, bottomY } for connection points
   */
  renderCMOSTree(group, node, x, y, hSpacing, vSpacing) {
    const ns = 'http://www.w3.org/2000/svg';
    
    if (!node) return { topX: x, topY: y, bottomX: x, bottomY: y };

    // Single device (transistor)
    if (node.type === 'device') {
      // Use direct signal name (no prime notation)
      // If inverted flag is set, the signal needs to be inverted - we'll handle with input inverter
      const gateLabel = node.gate;  // Always use direct signal name
      this.drawCMOSTransistor(group, x, y, node.deviceType.toUpperCase(), gateLabel, node.inverted);
      return { topX: x, topY: y - 50, bottomX: x, bottomY: y + 50 };
    }

    // Series: stack children vertically, connect in chain
    if (node.type === 'series') {
      let currentY = y;
      let firstResult = null;
      let lastResult = null;
      
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const result = this.renderCMOSTree(group, child, x, currentY, hSpacing * 0.7, vSpacing);
        
        if (i === 0) {
          firstResult = result;
        }
        
        // Connect to previous child
        if (lastResult) {
          const connLine = document.createElementNS(ns, 'line');
          connLine.setAttribute('x1', lastResult.bottomX);
          connLine.setAttribute('y1', lastResult.bottomY);
          connLine.setAttribute('x2', result.topX);
          connLine.setAttribute('y2', result.topY);
          connLine.setAttribute('stroke', '#000');
          connLine.setAttribute('stroke-width', '3');
          group.appendChild(connLine);
        }
        
        lastResult = result;
        currentY = result.bottomY + vSpacing;
      }
      
      return {
        topX: firstResult ? firstResult.topX : x,
        topY: firstResult ? firstResult.topY : y,
        bottomX: lastResult ? lastResult.bottomX : x,
        bottomY: lastResult ? lastResult.bottomY : y
      };
    }

    // Parallel: place children side by side, connect tops and bottoms
    if (node.type === 'parallel') {
      const numChildren = node.children.length;
      const totalWidth = (numChildren - 1) * hSpacing;
      const startX = x - totalWidth / 2;
      
      const results = [];
      for (let i = 0; i < numChildren; i++) {
        const childX = startX + i * hSpacing;
        const result = this.renderCMOSTree(group, node.children[i], childX, y, hSpacing * 0.6, vSpacing);
        results.push(result);
      }
      
      // Find bounds
      const minTopY = Math.min(...results.map(r => r.topY));
      const maxBottomY = Math.max(...results.map(r => r.bottomY));
      const minX = Math.min(...results.map(r => r.topX));
      const maxX = Math.max(...results.map(r => r.topX));
      
      // Draw top horizontal bar connecting all branches
      const topBar = document.createElementNS(ns, 'line');
      topBar.setAttribute('x1', minX);
      topBar.setAttribute('y1', minTopY - 20);
      topBar.setAttribute('x2', maxX);
      topBar.setAttribute('y2', minTopY - 20);
      topBar.setAttribute('stroke', '#000');
      topBar.setAttribute('stroke-width', '3');
      group.appendChild(topBar);
      
      // Draw bottom horizontal bar connecting all branches
      const bottomBar = document.createElementNS(ns, 'line');
      bottomBar.setAttribute('x1', minX);
      bottomBar.setAttribute('y1', maxBottomY + 20);
      bottomBar.setAttribute('x2', maxX);
      bottomBar.setAttribute('y2', maxBottomY + 20);
      bottomBar.setAttribute('stroke', '#000');
      bottomBar.setAttribute('stroke-width', '3');
      group.appendChild(bottomBar);
      
      // Connect each branch to the bars
      for (const result of results) {
        // Top connection
        const topConn = document.createElementNS(ns, 'line');
        topConn.setAttribute('x1', result.topX);
        topConn.setAttribute('y1', minTopY - 20);
        topConn.setAttribute('x2', result.topX);
        topConn.setAttribute('y2', result.topY);
        topConn.setAttribute('stroke', '#000');
        topConn.setAttribute('stroke-width', '3');
        group.appendChild(topConn);
        
        // Bottom connection
        const bottomConn = document.createElementNS(ns, 'line');
        bottomConn.setAttribute('x1', result.bottomX);
        bottomConn.setAttribute('y1', result.bottomY);
        bottomConn.setAttribute('x2', result.bottomX);
        bottomConn.setAttribute('y2', maxBottomY + 20);
        bottomConn.setAttribute('stroke', '#000');
        bottomConn.setAttribute('stroke-width', '3');
        group.appendChild(bottomConn);
      }
      
      // Center output point
      return {
        topX: x,
        topY: minTopY - 20,
        bottomX: x,
        bottomY: maxBottomY + 20
      };
    }

    return { topX: x, topY: y, bottomX: x, bottomY: y };
  }

  /**
   * Draw VDD power symbol
   */
  drawVDDSymbol(group, x, y) {
    const ns = 'http://www.w3.org/2000/svg';
    
    // Vertical line up
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', x);
    line.setAttribute('y1', y);
    line.setAttribute('x2', x);
    line.setAttribute('y2', y - 40);
    line.setAttribute('stroke', '#000');
    line.setAttribute('stroke-width', '3');
    group.appendChild(line);

    // Horizontal bar at top
    const bar = document.createElementNS(ns, 'line');
    bar.setAttribute('x1', x - 30);
    bar.setAttribute('y1', y - 40);
    bar.setAttribute('x2', x + 30);
    bar.setAttribute('y2', y - 40);
    bar.setAttribute('stroke', '#000');
    bar.setAttribute('stroke-width', '5');
    group.appendChild(bar);

    // VDD label
    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', x - 25);
    label.setAttribute('y', y - 55);
    label.setAttribute('font-size', '16');
    label.setAttribute('font-weight', 'bold');
    label.textContent = 'VDD';
    group.appendChild(label);
  }

  /**
   * Draw GND ground symbol
   */
  drawGNDSymbol(group, x, y) {
    const ns = 'http://www.w3.org/2000/svg';
    
    // Vertical line down
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', x);
    line.setAttribute('y1', y - 40);
    line.setAttribute('x2', x);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', '#000');
    line.setAttribute('stroke-width', '3');
    group.appendChild(line);

    // Ground symbol - three horizontal lines
    for (let i = 0; i < 3; i++) {
      const gndLine = document.createElementNS(ns, 'line');
      const width = 35 - i * 12;
      gndLine.setAttribute('x1', x - width);
      gndLine.setAttribute('y1', y + i * 10);
      gndLine.setAttribute('x2', x + width);
      gndLine.setAttribute('y2', y + i * 10);
      gndLine.setAttribute('stroke', '#000');
      gndLine.setAttribute('stroke-width', '3');
      group.appendChild(gndLine);
    }

    // GND label
    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', x + 50);
    label.setAttribute('y', y + 15);
    label.setAttribute('font-size', '16');
    label.setAttribute('font-weight', 'bold');
    label.textContent = 'GND';
    group.appendChild(label);
  }

  /**
   * Draw CMOS transistor using PNG images
   * @param inverted - if true, draws a small inverter bubble indicating signal needs inversion
   */
  drawCMOSTransistor(group, x, y, type, label = '', inverted = false) {
    const ns = 'http://www.w3.org/2000/svg';
    const imageName = type === 'PMOS' ? 'pmos.png' : 'nmos.png';
    
    // Transistor image - sized appropriately
    const imgWidth = 120;
    const imgHeight = 100;
    
    const image = document.createElementNS(ns, 'image');
    const imageHref = new URL(`assets/${imageName}`, document.baseURI).toString();
    image.setAttribute('href', imageHref);
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imageHref);
    image.setAttribute('x', x - imgWidth/2-29);
    image.setAttribute('y', y - imgHeight/2);
    image.setAttribute('width', imgWidth);
    image.setAttribute('height', imgHeight);
    group.appendChild(image);

    // Draw label to the left with clear background
    if (label) {
      // Background rect for label
      const labelBg = document.createElementNS(ns, 'rect');
      labelBg.setAttribute('x', x - imgWidth/2 - 55);
      labelBg.setAttribute('y', y - 12);
      labelBg.setAttribute('width', '50');
      labelBg.setAttribute('height', '24');
      labelBg.setAttribute('fill', inverted ? '#ffe0e0' : 'white');  // Light red bg for inverted
      labelBg.setAttribute('stroke', inverted ? '#cc0000' : '#999');
      labelBg.setAttribute('stroke-width', inverted ? '2' : '1');
      labelBg.setAttribute('rx', '4');
      group.appendChild(labelBg);
      
      const labelText = document.createElementNS(ns, 'text');
      labelText.setAttribute('x', x - imgWidth/2 - 30);
      labelText.setAttribute('y', y + 5);
      labelText.setAttribute('font-size', '14');
      labelText.setAttribute('font-weight', 'bold');
      labelText.setAttribute('text-anchor', 'middle');
      labelText.setAttribute('fill', inverted ? '#cc0000' : '#000');
      labelText.textContent = label;
      group.appendChild(labelText);

      // If inverted, draw small inversion bubble
      if (inverted) {
        const bubbleX = x - imgWidth/2 - 8;
        const bubble = document.createElementNS(ns, 'circle');
        bubble.setAttribute('cx', bubbleX);
        bubble.setAttribute('cy', y);
        bubble.setAttribute('r', '6');
        bubble.setAttribute('fill', 'white');
        bubble.setAttribute('stroke', '#cc0000');
        bubble.setAttribute('stroke-width', '2');
        group.appendChild(bubble);
      }
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
