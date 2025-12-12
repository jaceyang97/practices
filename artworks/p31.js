function setup() {
    // Create regular canvas
    createCanvas(450, 450);
    background(255);
    
    // Common settings
    noFill();
    stroke(0);
    strokeWeight(25);
    
    // Configuration
    let gap = 50;             // Distance between circle layers
    let gapSize = 30;         // Size of the gap in pixels
    
    // Position everything from center
    translate(width / 2, height / 2);
    
    // Draw three concentric circles with gaps at different positions
    drawCircleWithGap(0, 0, gap, PI/4 - PI/16, gapSize);
    drawCircleWithGap(0, 0, gap * 2, 3*PI/4 + PI/16, gapSize);
    drawCircleWithGap(0, 0, gap * 3, 3*PI/2, gapSize);
    
    // Draw the escape path
    drawEscapePath(gap, PI/4 - PI/16, 3*PI/4 + PI/16, 3*PI/2);
}

function drawCircleWithGap(x, y, radius, gapPosition, gapSizePixels) {
    push();
    translate(x, y);
    
    // Calculate gap angle using inverse sine to maintain constant physical gap size
    let gapAngle = 2 * Math.asin(gapSizePixels / (2 * radius));
    
    // Set line cap to square for flat ends at the gap
    strokeCap(SQUARE);
    
    // Draw almost complete circle with a constant-sized gap
    arc(0, 0, radius * 2, radius * 2, gapPosition + gapAngle/2, gapPosition - gapAngle/2 + TWO_PI);
    
    pop();
}

function drawEscapePath(gap, gap1Pos, gap2Pos, gap3Pos) {
    // Define the radii
    const innerRadius = gap;
    const middleRadius = gap * 2;
    const outerRadius = gap * 3;
    
    // Calculate intersection points at the gaps
    const gapPoints = [
      createVector(innerRadius * cos(gap1Pos), innerRadius * sin(gap1Pos)),
      createVector(middleRadius * cos(gap2Pos), middleRadius * sin(gap2Pos)),
      createVector(outerRadius * cos(gap3Pos), outerRadius * sin(gap3Pos))
    ];
    
    // Define the path color and style
    const pathColor = color(154, 20, 33); // #9A1421
    
    push();
    // Path styling
    stroke(pathColor);
    strokeWeight(10);
    strokeCap(ROUND);
    strokeJoin(ROUND);
    noFill();
    
    // Draw center dot
    push();
    noStroke();
    fill(pathColor);
    ellipse(0, 0, 40, 40);
    pop();
    
    // Draw line from center to first gap
    line(0, 0, gapPoints[0].x, gapPoints[0].y);
    
    // Draw path between first and second gaps
    const arc1Radius = innerRadius + (middleRadius - innerRadius) / 2;
    drawArcBetween(gapPoints[0], gapPoints[1], arc1Radius, gap1Pos, gap2Pos, true);
    
    // Draw path between second and third gaps
    const arc2Radius = middleRadius + (outerRadius - middleRadius) / 2;
    drawArcBetween(gapPoints[1], gapPoints[2], arc2Radius, gap2Pos, gap3Pos, false);
    
    // Draw the final line and arrowhead
    const arrowPos = createVector(
      outerRadius * 1.3 * cos(gap3Pos),
      outerRadius * 1.3 * sin(gap3Pos)
    );
    
    line(gapPoints[2].x, gapPoints[2].y, arrowPos.x, arrowPos.y);
    drawArrowhead(arrowPos.x, arrowPos.y, gap3Pos, 30, pathColor);
    
    pop();
}

// Draw an arc between two points with connecting lines
function drawArcBetween(startPoint, endPoint, radius, startAngle, endAngle, shortPath) {
    // Adjust angles to take either shorter or longer path around the circle
    if (shortPath && abs(endAngle - startAngle) > PI) {
      if (startAngle < endAngle) startAngle += TWO_PI;
      else endAngle += TWO_PI;
    } else if (!shortPath && abs(endAngle - startAngle) < PI) {
      if (startAngle < endAngle) endAngle -= TWO_PI;
      else startAngle -= TWO_PI;
    }
    
    // Calculate arc endpoints
    const arcStart = createVector(radius * cos(startAngle), radius * sin(startAngle));
    const arcEnd = createVector(radius * cos(endAngle), radius * sin(endAngle));
    
    // Connect start point to arc
    line(startPoint.x, startPoint.y, arcStart.x, arcStart.y);
    
    // Draw the arc
    arc(0, 0, radius * 2, radius * 2, startAngle, endAngle);
    
    // Connect arc to end point
    line(arcEnd.x, arcEnd.y, endPoint.x, endPoint.y);
}

// Draw an arrowhead at the specified position and angle
function drawArrowhead(x, y, angle, size, color) {
    push();
    translate(x, y);
    rotate(angle + PI/2);
    
    fill(color);
    noStroke();
    
    beginShape();
    vertex(0, -size*0.8);       // Tip
    vertex(-size*0.7, size/2);  // Left corner
    vertex(size*0.7, size/2);   // Right corner
    endShape(CLOSE);
    
    pop();
}