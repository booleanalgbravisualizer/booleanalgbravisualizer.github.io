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
   * Measure gate tree to determine leaf count and depth for spacing.
   */
  measureGateTree(ast) {
    if (!ast) return { leaves: 1, depth: 0 };
    if (ast.type === 'VAR') return { leaves: 1, depth: 0 };
    if (ast.type === 'NOT') {
      const child = this.measureGateTree(ast.operand);
      return { leaves: child.leaves, depth: child.depth + 1 };
    }
    const left = this.measureGateTree(ast.left);
    const right = this.measureGateTree(ast.right);
    return {
      leaves: left.leaves + right.leaves,
      depth: Math.max(left.depth, right.depth) + 1
    };
  }

  /**
   * Render logic gate block diagram from AST — dynamic sizing
   */
  renderGateDiagram(svgElement) {
    svgElement.innerHTML = '';
    const ns = 'http://www.w3.org/2000/svg';

    const treeMeasure = this.measureGateTree(this.ast);
    const leafCount = Math.max(treeMeasure.leaves, 1);
    const treeDepth = Math.max(treeMeasure.depth, 1);

    const leafSlotH = 110;
    const totalHeight = leafCount * leafSlotH;
    const totalWidth = treeDepth * 280 + 400;

    const canvasW = Math.max(1200, totalWidth + 200);
    const canvasH = Math.max(600, totalHeight + 200);

    svgElement.setAttribute('viewBox', `0 0 ${canvasW} ${canvasH}`);

    const bg = document.createElementNS(ns, 'rect');
    bg.setAttribute('width', String(canvasW));
    bg.setAttribute('height', String(canvasH));
    bg.setAttribute('fill', 'white');
    bg.setAttribute('stroke', '#ddd');
    bg.setAttribute('stroke-width', '1');
    svgElement.appendChild(bg);

    const g = document.createElementNS(ns, 'g');
    g.setAttribute('id', 'zoomGroup');

    const startX = 100;
    const centerY = canvasH / 2;
    const halfSpan = (leafCount * leafSlotH) / 2;

    const finalX = this.renderGateTree(g, this.ast, startX, centerY, 0, centerY - halfSpan, centerY + halfSpan);

    const outputX = finalX + 60;
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', finalX);
    line.setAttribute('y1', String(centerY));
    line.setAttribute('x2', outputX);
    line.setAttribute('y2', String(centerY));
    line.setAttribute('stroke', '#000000');
    line.setAttribute('stroke-width', '3.5');
    g.appendChild(line);

    const outputLabel = document.createElementNS(ns, 'text');
    outputLabel.setAttribute('x', outputX + 10);
    outputLabel.setAttribute('y', String(centerY + 5));
    outputLabel.setAttribute('font-size', '12');
    outputLabel.textContent = 'Output';
    g.appendChild(outputLabel);

    svgElement.appendChild(g);
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
   * Recursively render gate tree with subtree-aware vertical spacing.
   * Each subtree gets vertical band [yMin, yMax] proportional to its leaf count.
   */
  renderGateTree(svg, ast, x, y, depth, yMin, yMax) {
    const ns = 'http://www.w3.org/2000/svg';
    const hSpacing = 200;

    if (ast.type === 'VAR') {
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
      const inputX = this.renderGateTree(svg, ast.operand, x, y, depth + 1, yMin, yMax);
      const gateX = inputX + hSpacing;
      this.drawNotGate(svg, gateX, y);
      this.connectLineOrthogonal(svg, inputX, y, gateX - 60, y);
      return gateX + 60;
    }

    // Binary gates: split vertical band proportionally by leaf count
    const drawBinaryGate = (drawFn, topPinOff, bottomPinOff) => {
      const leftMeasure = this.measureGateTree(ast.left);
      const rightMeasure = this.measureGateTree(ast.right);
      const totalLeaves = leftMeasure.leaves + rightMeasure.leaves;
      const leftFraction = leftMeasure.leaves / totalLeaves;

      const splitY = yMin + leftFraction * (yMax - yMin);
      const leftCenterY = (yMin + splitY) / 2;
      const rightCenterY = (splitY + yMax) / 2;

      const leftX = this.renderGateTree(svg, ast.left, x, leftCenterY, depth + 1, yMin, splitY);
      const rightX = this.renderGateTree(svg, ast.right, x, rightCenterY, depth + 1, splitY, yMax);

      const gateX = Math.max(leftX, rightX) + hSpacing;
      drawFn.call(this, svg, gateX, y);

      this.connectLineOrthogonal(svg, leftX, leftCenterY, gateX - 50, y + topPinOff);
      this.connectLineOrthogonal(svg, rightX, rightCenterY, gateX - 50, y + bottomPinOff);

      return gateX + 60;
    };

    if (ast.type === 'AND')  return drawBinaryGate(this.drawAndGate,  -23, 23);
    if (ast.type === 'OR')   return drawBinaryGate(this.drawOrGate,   -21, 21);
    if (ast.type === 'NAND') return drawBinaryGate(this.drawNandGate, -21.5, 21.5);
    if (ast.type === 'NOR')  return drawBinaryGate(this.drawNorGate,  -19, 19);
    if (ast.type === 'XOR')  return drawBinaryGate(this.drawXorGate,  -18.5, 18.5);
    if (ast.type === 'XNOR') return drawBinaryGate(this.drawXnorGate, -17, 17);

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
    // Place vertical segment 75% toward destination to keep wires close to their gate
    const midX = x1 + (x2 - x1) * 0.75;

    if (Math.abs(y1 - y2) < 1) {
      // Straight horizontal — no bend needed
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('stroke', '#000000');
      line.setAttribute('stroke-width', '3.5');
      svg.appendChild(line);
      return;
    }

    // Horizontal line to turn point
    const line1 = document.createElementNS(ns, 'line');
    line1.setAttribute('x1', x1);
    line1.setAttribute('y1', y1);
    line1.setAttribute('x2', midX);
    line1.setAttribute('y2', y1);
    line1.setAttribute('stroke', '#000000');
    line1.setAttribute('stroke-width', '3.5');
    svg.appendChild(line1);
    
    // Vertical line to destination row
    const line2 = document.createElementNS(ns, 'line');
    line2.setAttribute('x1', midX);
    line2.setAttribute('y1', y1);
    line2.setAttribute('x2', midX);
    line2.setAttribute('y2', y2);
    line2.setAttribute('stroke', '#000000');
    line2.setAttribute('stroke-width', '3.5');
    svg.appendChild(line2);
    
    // Horizontal line to gate input
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
   * Prepare AST for CMOS rendering.
   * The CMOS network naturally inverts (PDN pulls low, PUN pulls high),
   * so the raw network output is always the complement of the core function.
   *
   * Strategy:
   * - For AND, OR, XOR, VAR at top level: core = that function, output inverter NEEDED
   *   (network produces complement, inverter restores it)
   * - For NOT, NAND, NOR, XNOR at top level: strip the outer complement,
   *   core = the inner non-inverted function, output inverter NOT needed
   *   (network complement IS the desired result)
   *
   * Any NOT(VAR) leaves that remain after expansion are handled by
   * drawing small input inverter sub-circuits that generate the
   * complemented signal from VDD/GND — transistor gates NEVER
   * see an inverted signal directly.
   */
  prepareForCMOS(ast) {
    let coreFn = ast;
    let needsOutputInverter = true;

    if (ast.type === 'NOT') {
      coreFn = ast.operand;
      needsOutputInverter = false;
    } else if (ast.type === 'NAND') {
      coreFn = { type: 'AND', left: ast.left, right: ast.right };
      needsOutputInverter = false;
    } else if (ast.type === 'NOR') {
      coreFn = { type: 'OR', left: ast.left, right: ast.right };
      needsOutputInverter = false;
    } else if (ast.type === 'XNOR') {
      coreFn = { type: 'XOR', left: ast.left, right: ast.right };
      needsOutputInverter = false;
    }

    const invertedInputs = new Set();
    const cleanFn = this.expandClean(coreFn, invertedInputs);

    return { coreFn: cleanFn, needsOutputInverter, invertedInputs };
  }

  /**
   * Recursively expand an AST to use only AND, OR, and VAR nodes.
   * NOT(VAR) at leaves is recorded in invertedInputs and the VAR
   * node is tagged with isInverted so buildPDNTree can label the
   * transistor gate with the overline character (e.g. A̅).
   */
  expandClean(node, invertedInputs) {
    if (!node) return node;
    if (node.type === 'VAR') return node;

    if (node.type === 'AND' || node.type === 'OR') {
      return {
        type: node.type,
        left: this.expandClean(node.left, invertedInputs),
        right: this.expandClean(node.right, invertedInputs)
      };
    }

    if (node.type === 'NOT') {
      const inner = node.operand;
      if (inner.type === 'NOT') return this.expandClean(inner.operand, invertedInputs);
      if (inner.type === 'VAR') {
        invertedInputs.add(inner.value.toUpperCase());
        return { type: 'VAR', value: inner.value, isInverted: true };
      }
      if (inner.type === 'AND') {
        return this.expandClean({
          type: 'OR',
          left: { type: 'NOT', operand: inner.left },
          right: { type: 'NOT', operand: inner.right }
        }, invertedInputs);
      }
      if (inner.type === 'OR') {
        return this.expandClean({
          type: 'AND',
          left: { type: 'NOT', operand: inner.left },
          right: { type: 'NOT', operand: inner.right }
        }, invertedInputs);
      }
      if (inner.type === 'NAND') return this.expandClean({ type: 'AND', left: inner.left, right: inner.right }, invertedInputs);
      if (inner.type === 'NOR') return this.expandClean({ type: 'OR', left: inner.left, right: inner.right }, invertedInputs);
      if (inner.type === 'XOR') {
        return this.expandClean({
          type: 'OR',
          left: { type: 'AND', left: inner.left, right: inner.right },
          right: { type: 'AND', left: { type: 'NOT', operand: inner.left }, right: { type: 'NOT', operand: inner.right } }
        }, invertedInputs);
      }
      if (inner.type === 'XNOR') {
        return this.expandClean({
          type: 'OR',
          left: { type: 'AND', left: inner.left, right: { type: 'NOT', operand: inner.right } },
          right: { type: 'AND', left: { type: 'NOT', operand: inner.left }, right: inner.right }
        }, invertedInputs);
      }
      const expandedInner = this.expandClean(inner, invertedInputs);
      return this.expandClean({ type: 'NOT', operand: expandedInner }, invertedInputs);
    }

    if (node.type === 'NAND') {
      return this.expandClean({
        type: 'OR',
        left: { type: 'NOT', operand: node.left },
        right: { type: 'NOT', operand: node.right }
      }, invertedInputs);
    }
    if (node.type === 'NOR') {
      return this.expandClean({
        type: 'AND',
        left: { type: 'NOT', operand: node.left },
        right: { type: 'NOT', operand: node.right }
      }, invertedInputs);
    }
    if (node.type === 'XOR') {
      return this.expandClean({
        type: 'OR',
        left: { type: 'AND', left: node.left, right: { type: 'NOT', operand: node.right } },
        right: { type: 'AND', left: { type: 'NOT', operand: node.left }, right: node.right }
      }, invertedInputs);
    }
    if (node.type === 'XNOR') {
      return this.expandClean({
        type: 'OR',
        left: { type: 'AND', left: node.left, right: node.right },
        right: { type: 'AND', left: { type: 'NOT', operand: node.left }, right: { type: 'NOT', operand: node.right } }
      }, invertedInputs);
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

    // Variable: single NMOS transistor.
    // If isInverted, the gate is driven by an input inverter sub-circuit
    // so we label with overline (e.g. A̅) — NOT a red bubble.
    if (node.type === 'VAR') {
      const gate = node.isInverted
        ? node.value.toUpperCase() + '\u0305'
        : node.value.toUpperCase();
      return { type: 'device', deviceType: 'nmos', gate };
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
        gate: pdnNode.gate
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
   * 1. prepareForCMOS strips outer complement and expands to AND/OR/VAR
   * 2. Build PDN from core function: OR→parallel, AND→series (NMOS)
   * 3. Dualize PDN to get PUN: swap series↔parallel, NMOS→PMOS
   * 4. Network output is complement of core function
   * 5. If original expression was non-inverted (AND/OR/XOR/VAR):
   *    add output inverter to restore F
   * 6. If original expression was inverted (NOT/NAND/NOR/XNOR):
   *    network complement IS the desired output, no inverter needed
   * 7. Any NOT(VAR) leaves get dedicated input inverter sub-circuits
   */

  /**
   * Measure a PDN/PUN tree to determine how much space it needs.
   *   width  = total parallel leaf devices (horizontal extent)
   *   depth  = longest series chain (vertical extent)
   */
  measureTree(node) {
    if (!node) return { width: 1, depth: 1 };
    if (node.type === 'device') return { width: 1, depth: 1 };
    if (node.type === 'series') {
      let totalDepth = 0;
      let maxWidth = 0;
      for (const child of node.children) {
        const m = this.measureTree(child);
        totalDepth += m.depth;
        maxWidth = Math.max(maxWidth, m.width);
      }
      return { width: maxWidth, depth: totalDepth };
    }
    if (node.type === 'parallel') {
      let totalWidth = 0;
      let maxDepth = 0;
      for (const child of node.children) {
        const m = this.measureTree(child);
        totalWidth += m.width;
        maxDepth = Math.max(maxDepth, m.depth);
      }
      return { width: totalWidth, depth: maxDepth };
    }
    return { width: 1, depth: 1 };
  }

  renderCMOSDiagram(svgElement) {
    svgElement.innerHTML = '';
    const ns = 'http://www.w3.org/2000/svg';
    // Prepare: strip outer complement, expand, track inverted inputs
    const { coreFn, needsOutputInverter, invertedInputs } = this.prepareForCMOS(this.ast);
    const pdnTree = this.buildPDNTree(coreFn);
    const punTree = this.dualizePDNtoPUN(pdnTree);

    // Measure trees to compute dynamic layout
    const pdnSize = this.measureTree(pdnTree);
    const punSize = this.measureTree(punTree);
    const maxWidth = Math.max(pdnSize.width, punSize.width, 1);
    const totalDepth = pdnSize.depth + punSize.depth;

    // Dynamic spacing — scales with complexity
    const transistorSpacingH = Math.max(200, 160 + maxWidth * 20);
    const transistorSpacingV = Math.max(140, 120 + totalDepth * 15);

    // Dynamic canvas — grows with circuit, infinite room
    const numInverters = invertedInputs.size;
    const leftMargin = numInverters > 0 ? 400 : 100;
    const neededWidth = leftMargin + maxWidth * transistorSpacingH + (needsOutputInverter ? 900 : 500);
    const neededHeight = 300 + totalDepth * transistorSpacingV + 500;
    const canvasW = Math.max(1800, neededWidth);
    const canvasH = Math.max(1200, neededHeight);

    svgElement.setAttribute('viewBox', `0 0 ${canvasW} ${canvasH}`);

    const bg = document.createElementNS(ns, 'rect');
    bg.setAttribute('width', String(canvasW));
    bg.setAttribute('height', String(canvasH));
    bg.setAttribute('fill', 'white');
    svgElement.appendChild(bg);

    const g = document.createElementNS(ns, 'g');
    g.setAttribute('id', 'cmosGroup');

    // Dynamic positions based on circuit size
    const mainCenterX = leftMargin + (maxWidth * transistorSpacingH) / 2 + 100;
    const vddY = 80;
    const gndY = canvasH - 80;
    const outputY = (vddY + gndY) / 2;

    // ============================================
    // MAIN NETWORK
    // ============================================
    this.drawVDDSymbol(g, mainCenterX, vddY);
    this.drawGNDSymbol(g, mainCenterX, gndY);

    // PUN (PMOS pull-up) - between VDD and output
    const punStartY = vddY + 100;
    const punResult = this.renderCMOSTree(g, punTree, mainCenterX, punStartY, transistorSpacingH, transistorSpacingV);

    const vddToPun = document.createElementNS(ns, 'line');
    vddToPun.setAttribute('x1', mainCenterX);
    vddToPun.setAttribute('y1', vddY);
    vddToPun.setAttribute('x2', punResult.topX);
    vddToPun.setAttribute('y2', punResult.topY);
    vddToPun.setAttribute('stroke', '#000');
    vddToPun.setAttribute('stroke-width', '3');
    g.appendChild(vddToPun);

    const punToOut = document.createElementNS(ns, 'line');
    punToOut.setAttribute('x1', punResult.bottomX);
    punToOut.setAttribute('y1', punResult.bottomY);
    punToOut.setAttribute('x2', mainCenterX);
    punToOut.setAttribute('y2', outputY);
    punToOut.setAttribute('stroke', '#000');
    punToOut.setAttribute('stroke-width', '3');
    g.appendChild(punToOut);

    // PDN (NMOS pull-down) - between output and GND
    const pdnStartY = outputY + 120;
    const pdnResult = this.renderCMOSTree(g, pdnTree, mainCenterX, pdnStartY, transistorSpacingH, transistorSpacingV);

    const outToPdn = document.createElementNS(ns, 'line');
    outToPdn.setAttribute('x1', mainCenterX);
    outToPdn.setAttribute('y1', outputY);
    outToPdn.setAttribute('x2', pdnResult.topX);
    outToPdn.setAttribute('y2', pdnResult.topY);
    outToPdn.setAttribute('stroke', '#000');
    outToPdn.setAttribute('stroke-width', '3');
    g.appendChild(outToPdn);

    const pdnToGnd = document.createElementNS(ns, 'line');
    pdnToGnd.setAttribute('x1', pdnResult.bottomX);
    pdnToGnd.setAttribute('y1', pdnResult.bottomY);
    pdnToGnd.setAttribute('x2', mainCenterX);
    pdnToGnd.setAttribute('y2', gndY - 30);
    pdnToGnd.setAttribute('stroke', '#000');
    pdnToGnd.setAttribute('stroke-width', '3');
    g.appendChild(pdnToGnd);

    // ============================================
    // INPUT INVERTER SUB-CIRCUITS
    // ============================================
    if (invertedInputs.size > 0) {
      const invVars = Array.from(invertedInputs);
      const invSpacing = Math.max(300, Math.min(400, (gndY - vddY - 200) / Math.max(invVars.length, 1)));
      const invX = Math.max(200, mainCenterX - maxWidth * transistorSpacingH / 2 - 200);
      invVars.forEach((varName, i) => {
        const invCenterY = vddY + 180 + i * invSpacing;
        this.drawInputInverterCircuit(g, invX, invCenterY, varName);
      });
    }

    // ============================================
    // OUTPUT SECTION (conditional inverter)
    // ============================================
    if (needsOutputInverter) {
      const inverterX = mainCenterX + Math.max(500, maxWidth * transistorSpacingH / 2 + 300);
      const gateConnectionX = inverterX - 70;

      // Horizontal connection to inverter gate
      const connLine = document.createElementNS(ns, 'line');
      connLine.setAttribute('x1', mainCenterX);
      connLine.setAttribute('y1', outputY);
      connLine.setAttribute('x2', gateConnectionX);
      connLine.setAttribute('y2', outputY);
      connLine.setAttribute('stroke', '#000');
      connLine.setAttribute('stroke-width', '3');
      g.appendChild(connLine);

      const invVddY = outputY - 200;
      const invGndY = outputY + 200;

      this.drawVDDSymbol(g, inverterX, invVddY);
      this.drawGNDSymbol(g, inverterX, invGndY);

      const pmosY = outputY - 90;
      this.drawCMOSTransistor(g, inverterX, pmosY, 'PMOS', '');

      const invVddToPmos = document.createElementNS(ns, 'line');
      invVddToPmos.setAttribute('x1', inverterX);
      invVddToPmos.setAttribute('y1', invVddY);
      invVddToPmos.setAttribute('x2', inverterX);
      invVddToPmos.setAttribute('y2', pmosY - 50);
      invVddToPmos.setAttribute('stroke', '#000');
      invVddToPmos.setAttribute('stroke-width', '3');
      g.appendChild(invVddToPmos);

      const nmosY = outputY + 90;
      this.drawCMOSTransistor(g, inverterX, nmosY, 'NMOS', '');

      const invNmosToGnd = document.createElementNS(ns, 'line');
      invNmosToGnd.setAttribute('x1', inverterX);
      invNmosToGnd.setAttribute('y1', nmosY + 50);
      invNmosToGnd.setAttribute('x2', inverterX);
      invNmosToGnd.setAttribute('y2', invGndY - 30);
      invNmosToGnd.setAttribute('stroke', '#000');
      invNmosToGnd.setAttribute('stroke-width', '3');
      g.appendChild(invNmosToGnd);

      const pmosToMid = document.createElementNS(ns, 'line');
      pmosToMid.setAttribute('x1', inverterX);
      pmosToMid.setAttribute('y1', pmosY + 50);
      pmosToMid.setAttribute('x2', inverterX);
      pmosToMid.setAttribute('y2', outputY);
      pmosToMid.setAttribute('stroke', '#000');
      pmosToMid.setAttribute('stroke-width', '3');
      g.appendChild(pmosToMid);

      const midToNmos = document.createElementNS(ns, 'line');
      midToNmos.setAttribute('x1', inverterX);
      midToNmos.setAttribute('y1', outputY);
      midToNmos.setAttribute('x2', inverterX);
      midToNmos.setAttribute('y2', nmosY - 50);
      midToNmos.setAttribute('stroke', '#000');
      midToNmos.setAttribute('stroke-width', '3');
      g.appendChild(midToNmos);

      const gateVert = document.createElementNS(ns, 'line');
      gateVert.setAttribute('x1', gateConnectionX);
      gateVert.setAttribute('y1', pmosY);
      gateVert.setAttribute('x2', gateConnectionX);
      gateVert.setAttribute('y2', nmosY);
      gateVert.setAttribute('stroke', '#000');
      gateVert.setAttribute('stroke-width', '3');
      g.appendChild(gateVert);

      const pmosGate = document.createElementNS(ns, 'line');
      pmosGate.setAttribute('x1', gateConnectionX);
      pmosGate.setAttribute('y1', pmosY);
      pmosGate.setAttribute('x2', inverterX - 60);
      pmosGate.setAttribute('y2', pmosY);
      pmosGate.setAttribute('stroke', '#000');
      pmosGate.setAttribute('stroke-width', '3');
      g.appendChild(pmosGate);

      const nmosGate = document.createElementNS(ns, 'line');
      nmosGate.setAttribute('x1', gateConnectionX);
      nmosGate.setAttribute('y1', nmosY);
      nmosGate.setAttribute('x2', inverterX - 60);
      nmosGate.setAttribute('y2', nmosY);
      nmosGate.setAttribute('stroke', '#000');
      nmosGate.setAttribute('stroke-width', '3');
      g.appendChild(nmosGate);

      const finalX = inverterX + 150;
      const finalLine = document.createElementNS(ns, 'line');
      finalLine.setAttribute('x1', inverterX);
      finalLine.setAttribute('y1', outputY);
      finalLine.setAttribute('x2', finalX);
      finalLine.setAttribute('y2', outputY);
      finalLine.setAttribute('stroke', '#000');
      finalLine.setAttribute('stroke-width', '3');
      g.appendChild(finalLine);

      const finalCircle = document.createElementNS(ns, 'circle');
      finalCircle.setAttribute('cx', finalX);
      finalCircle.setAttribute('cy', outputY);
      finalCircle.setAttribute('r', '8');
      finalCircle.setAttribute('fill', '#000');
      g.appendChild(finalCircle);

      const finalLabel = document.createElementNS(ns, 'text');
      finalLabel.setAttribute('x', finalX + 20);
      finalLabel.setAttribute('y', outputY + 6);
      finalLabel.setAttribute('font-size', '18');
      finalLabel.setAttribute('font-weight', 'bold');
      finalLabel.textContent = 'Output';
      g.appendChild(finalLabel);
    } else {
      // No output inverter — direct output from main network
      const finalX = mainCenterX + Math.max(300, maxWidth * transistorSpacingH / 2 + 200);

      const outLine = document.createElementNS(ns, 'line');
      outLine.setAttribute('x1', mainCenterX);
      outLine.setAttribute('y1', outputY);
      outLine.setAttribute('x2', finalX);
      outLine.setAttribute('y2', outputY);
      outLine.setAttribute('stroke', '#000');
      outLine.setAttribute('stroke-width', '3');
      g.appendChild(outLine);

      const finalCircle = document.createElementNS(ns, 'circle');
      finalCircle.setAttribute('cx', finalX);
      finalCircle.setAttribute('cy', outputY);
      finalCircle.setAttribute('r', '8');
      finalCircle.setAttribute('fill', '#000');
      g.appendChild(finalCircle);

      const finalLabel = document.createElementNS(ns, 'text');
      finalLabel.setAttribute('x', finalX + 20);
      finalLabel.setAttribute('y', outputY + 6);
      finalLabel.setAttribute('font-size', '18');
      finalLabel.setAttribute('font-weight', 'bold');
      finalLabel.textContent = 'Output';
      g.appendChild(finalLabel);
    }

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
      this.drawCMOSTransistor(group, x, y, node.deviceType.toUpperCase(), node.gate);
      return { topX: x, topY: y - 50, bottomX: x, bottomY: y + 50 };
    }

    // Series: stack children vertically, connect in chain
    if (node.type === 'series') {
      let currentY = y;
      let firstResult = null;
      let lastResult = null;
      
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const result = this.renderCMOSTree(group, child, x, currentY, hSpacing, vSpacing);
        
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

    // Parallel: place children side by side — allocate width proportional to each child's needs
    if (node.type === 'parallel') {
      const childMeasures = node.children.map(c => this.measureTree(c));
      const totalLeaves = childMeasures.reduce((s, m) => s + m.width, 0);
      const totalWidth = Math.max(totalLeaves, node.children.length) * hSpacing;
      
      const results = [];
      let currentX = x - totalWidth / 2;
      for (let i = 0; i < node.children.length; i++) {
        const childW = childMeasures[i].width;
        const slotWidth = (childW / totalLeaves) * totalWidth;
        const childX = currentX + slotWidth / 2;
        const result = this.renderCMOSTree(group, node.children[i], childX, y, hSpacing, vSpacing);
        results.push(result);
        currentX += slotWidth;
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
   * Draw CMOS transistor using PNG images.
   * Gate labels are always direct signals (A, B, C) or overlined (A̅)
   * if driven by an input inverter sub-circuit. No red bubbles.
   */
  drawCMOSTransistor(group, x, y, type, label = '') {
    const ns = 'http://www.w3.org/2000/svg';
    const imageName = type === 'PMOS' ? 'pmos.png' : 'nmos.png';

    const imgWidth = 120;
    const imgHeight = 100;

    const image = document.createElementNS(ns, 'image');
    const imageHref = new URL(`assets/${imageName}`, document.baseURI).toString();
    image.setAttribute('href', imageHref);
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imageHref);
    image.setAttribute('x', x - imgWidth / 2 - 29);
    image.setAttribute('y', y - imgHeight / 2);
    image.setAttribute('width', imgWidth);
    image.setAttribute('height', imgHeight);
    group.appendChild(image);

    if (label) {
      const labelBg = document.createElementNS(ns, 'rect');
      labelBg.setAttribute('x', x - imgWidth / 2 - 55);
      labelBg.setAttribute('y', y - 12);
      labelBg.setAttribute('width', '50');
      labelBg.setAttribute('height', '24');
      labelBg.setAttribute('fill', 'white');
      labelBg.setAttribute('stroke', '#999');
      labelBg.setAttribute('stroke-width', '1');
      labelBg.setAttribute('rx', '4');
      group.appendChild(labelBg);

      const labelText = document.createElementNS(ns, 'text');
      labelText.setAttribute('x', x - imgWidth / 2 - 30);
      labelText.setAttribute('y', y + 5);
      labelText.setAttribute('font-size', '14');
      labelText.setAttribute('font-weight', 'bold');
      labelText.setAttribute('text-anchor', 'middle');
      labelText.setAttribute('fill', '#000');
      labelText.textContent = label;
      group.appendChild(labelText);
    }
  }

  /**
   * Draw a small CMOS inverter sub-circuit that generates a
   * complemented input signal (e.g. A → A̅) from VDD/GND.
   * Shown to the left of the main network so it's clear where
   * the inverted signal comes from.
   */
  drawInputInverterCircuit(group, x, y, varName) {
    const ns = 'http://www.w3.org/2000/svg';
    const localVddY = y - 130;
    const pmosY = y - 50;
    const nmosY = y + 50;
    const localGndY = y + 130;

    this.drawVDDSymbol(group, x, localVddY);
    this.drawGNDSymbol(group, x, localGndY);

    // VDD → PMOS
    const l1 = document.createElementNS(ns, 'line');
    l1.setAttribute('x1', x); l1.setAttribute('y1', localVddY);
    l1.setAttribute('x2', x); l1.setAttribute('y2', pmosY - 50);
    l1.setAttribute('stroke', '#000'); l1.setAttribute('stroke-width', '3');
    group.appendChild(l1);

    this.drawCMOSTransistor(group, x, pmosY, 'PMOS', varName);

    // PMOS → mid-point
    const l2 = document.createElementNS(ns, 'line');
    l2.setAttribute('x1', x); l2.setAttribute('y1', pmosY + 50);
    l2.setAttribute('x2', x); l2.setAttribute('y2', y);
    l2.setAttribute('stroke', '#000'); l2.setAttribute('stroke-width', '3');
    group.appendChild(l2);

    // Mid-point → NMOS
    const l3 = document.createElementNS(ns, 'line');
    l3.setAttribute('x1', x); l3.setAttribute('y1', y);
    l3.setAttribute('x2', x); l3.setAttribute('y2', nmosY - 50);
    l3.setAttribute('stroke', '#000'); l3.setAttribute('stroke-width', '3');
    group.appendChild(l3);

    this.drawCMOSTransistor(group, x, nmosY, 'NMOS', varName);

    // NMOS → GND
    const l4 = document.createElementNS(ns, 'line');
    l4.setAttribute('x1', x); l4.setAttribute('y1', nmosY + 50);
    l4.setAttribute('x2', x); l4.setAttribute('y2', localGndY - 30);
    l4.setAttribute('stroke', '#000'); l4.setAttribute('stroke-width', '3');
    group.appendChild(l4);

    // Output line + dot + label  (A̅)
    const outLine = document.createElementNS(ns, 'line');
    outLine.setAttribute('x1', x); outLine.setAttribute('y1', y);
    outLine.setAttribute('x2', x + 70); outLine.setAttribute('y2', y);
    outLine.setAttribute('stroke', '#000'); outLine.setAttribute('stroke-width', '3');
    group.appendChild(outLine);

    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('cx', x + 70); dot.setAttribute('cy', y);
    dot.setAttribute('r', '5'); dot.setAttribute('fill', '#000');
    group.appendChild(dot);

    const lbl = document.createElementNS(ns, 'text');
    lbl.setAttribute('x', x + 82); lbl.setAttribute('y', y + 5);
    lbl.setAttribute('font-size', '14'); lbl.setAttribute('font-weight', 'bold');
    lbl.textContent = varName + '\u0305';
    group.appendChild(lbl);
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

  /**
   * Generate n-bit Gray code sequence
   * e.g. grayCode(2) → ['00','01','11','10']
   */
  grayCode(n) {
    if (n === 0) return [''];
    if (n === 1) return ['0', '1'];
    const prev = this.grayCode(n - 1);
    return [
      ...prev.map(code => '0' + code),
      ...[...prev].reverse().map(code => '1' + code)
    ];
  }

  /**
   * Build a single K-map table for given row/col variables and a prefix key
   * rowVars: array of variable names for the row axis
   * colVars: array of variable names for the column axis
   * prefix: fixed bit string prepended to each lookup key
   * valueMap: full truth table lookup { binaryKey → 0|1 }
   */
  buildKMapTable(rowVars, colVars, prefix, valueMap) {
    const rowGray = this.grayCode(rowVars.length);
    const colGray = this.grayCode(colVars.length);

    const rowLabel = rowVars.map(v => v.toUpperCase()).join('');
    const colLabel = colVars.map(v => v.toUpperCase()).join('');

    const table = document.createElement('table');
    table.className = 'kmap-table';

    // Header row
    const headerRow = document.createElement('tr');
    const corner = document.createElement('th');
    corner.className = 'kmap-corner';
    corner.textContent = rowLabel + ' \\ ' + colLabel;
    headerRow.appendChild(corner);
    colGray.forEach(c => {
      const th = document.createElement('th');
      th.textContent = c;
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // Data rows
    rowGray.forEach(r => {
      const row = document.createElement('tr');
      const rowTh = document.createElement('th');
      rowTh.textContent = r;
      row.appendChild(rowTh);
      colGray.forEach(c => {
        const td = document.createElement('td');
        const key = prefix + r + c;
        td.textContent = valueMap[key];
        td.className = valueMap[key] === 1 ? 'high' : 'low';
        row.appendChild(td);
      });
      table.appendChild(row);
    });

    return table;
  }

  /**
   * Render Karnaugh Map (K-map)
   * 2-4 vars: single table
   * 5+ vars: grid of labeled 4×4 sub-maps (standard textbook layout)
   */
  renderKMap(containerElement) {
    containerElement.innerHTML = '';

    const numVars = this.variables.length;
    const vars = this.variables;  // already sorted

    if (numVars < 2) {
      containerElement.innerHTML = '<p>K-maps require at least 2 variables.</p>';
      return;
    }

    // Create a lookup: binary-key → output value
    const valueMap = {};
    this.truthTable.forEach(row => {
      const key = vars.map(v => row[v]).join('');
      valueMap[key] = row.output;
    });

    // Decide variable split:
    // Row vars: first floor(innerVars/2) bits  (max 2 for ≤4 total inner)
    // Col vars: remaining inner bits            (max 2 for ≤4 total inner)
    // Outer vars (5+): extra variables that select which sub-map
    //
    // Standard textbook: inner map is always 4 vars (2 row + 2 col)
    // except for 2 vars (1+1) and 3 vars (1+2)
    let rowVars, colVars, outerVars;

    if (numVars <= 4) {
      // Single table, no outer vars
      outerVars = [];
      const innerCount = numVars;
      const rowCount = Math.floor(innerCount / 2);
      const colCount = innerCount - rowCount;
      rowVars = vars.slice(0, rowCount);
      colVars = vars.slice(rowCount, rowCount + colCount);
    } else {
      // 5+ vars: first 2 → rows, next 2 → cols, rest → outer (sub-map selectors)
      rowVars = vars.slice(0, 2);
      colVars = vars.slice(2, 4);
      outerVars = vars.slice(4);
    }

    if (outerVars.length === 0) {
      // Simple single table (2-4 vars)
      const table = this.buildKMapTable(rowVars, colVars, '', valueMap);
      containerElement.appendChild(table);
    } else {
      // Multiple sub-maps in a grid
      const outerGray = this.grayCode(outerVars.length);
      const outerLabel = outerVars.map(v => v.toUpperCase()).join('');

      // Determine grid layout (standard textbook):
      // outerVars=1 → 1 row × 2 cols
      // outerVars=2 → 2 rows × 2 cols  (Gray-coded)
      // outerVars=3 → 2 rows × 4 cols
      // outerVars=4 → 4 rows × 4 cols
      // General: gridRows = 2^floor(outerVars/2), gridCols = 2^ceil(outerVars/2)
      const gridRowBits = Math.floor(outerVars.length / 2);
      const gridColBits = outerVars.length - gridRowBits;
      const gridRowGray = this.grayCode(gridRowBits);
      const gridColGray = this.grayCode(gridColBits);

      const gridRowVars = outerVars.slice(0, gridRowBits);
      const gridColVars = outerVars.slice(gridRowBits);

      const wrapper = document.createElement('div');
      wrapper.className = 'kmap-grid';
      // CSS grid dimensions
      wrapper.style.gridTemplateColumns = `repeat(${gridColGray.length}, auto)`;

      gridRowGray.forEach(gr => {
        gridColGray.forEach(gc => {
          const prefix = gr + gc;
          const subDiv = document.createElement('div');
          subDiv.className = 'kmap-submap';

          // Build label for this sub-map
          const label = document.createElement('div');
          label.className = 'kmap-submap-label';
          const parts = [];
          for (let i = 0; i < outerVars.length; i++) {
            parts.push(outerVars[i].toUpperCase() + '=' + prefix[i]);
          }
          label.textContent = parts.join(', ');
          subDiv.appendChild(label);

          const table = this.buildKMapTable(rowVars, colVars, prefix, valueMap);
          subDiv.appendChild(table);
          wrapper.appendChild(subDiv);
        });
      });

      containerElement.appendChild(wrapper);
    }
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Visualizer;
}
