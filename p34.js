/**
 * Tetrahedron with Oriented Camellias
 * 
 * This p5.js sketch creates a 3D tetrahedron with camellia flowers at each vertex.
 * The flowers are oriented to point outward from the center of the tetrahedron.
 * The sketch demonstrates 3D transformations, look-at vector orientation,
 * and parametric flower modeling.
 * 
 * Controls:
 * - Mouse drag: Rotate the 3D view
 * - Mouse wheel: Zoom in/out
 */

function setup() {
  createCanvas(800, 800, WEBGL);
  colorMode(HSB);
  angleMode(DEGREES);
  strokeWeight(4);
}

function draw() {
  background(230, 50, 15);
  orbitControl(4, 4); // 3D mouse control

  push();
  rotateX(-30);
  rotateY(45);
  
  // Calculate tetrahedron vertices and center
  const size = 200;
  const vertices = [
    [0, -size, 0],                     // Top vertex
    [size, size/3, 0],                 // Right vertex
    [-size/2, size/3, size*Math.sqrt(3)/2],   // Back left vertex
    [-size/2, size/3, -size*Math.sqrt(3)/2]   // Front left vertex
  ];
  
  // Draw tetrahedron
  tetrahedron(size, vertices);
  
  // Calculate center of tetrahedron
  let center = [0, -size/5, 0]; // Approximate center of tetrahedron
  
  // Draw normal vectors (outward from center to each vertex)
  push();
  stroke(120, 100, 100); // Green for normals
  strokeWeight(2);
  beginShape(LINES);
  for (let v of vertices) {
    vertex(...center);
    vertex(...v);
  }
  endShape();
  pop();
  
  // Draw camellias at each vertex
  // Top vertex
  orientFlower(vertices[0], center);
  
  // Right vertex
  orientFlower(vertices[1], center);
  
  // Back left vertex
  orientFlower(vertices[2], center);
  
  // Front left vertex
  orientFlower(vertices[3], center);
  
  pop();
}

// Helper function to orient flowers along the direction from center to vertex
function orientFlower(vertexPos, centerPos) {
  push();
  translate(...vertexPos);
  
  // Calculate direction vector from center to vertex
  let dirX = vertexPos[0] - centerPos[0];
  let dirY = vertexPos[1] - centerPos[1];
  let dirZ = vertexPos[2] - centerPos[2];
  
  // Normalize the direction vector
  let dirLength = sqrt(dirX*dirX + dirY*dirY + dirZ*dirZ);
  dirX /= dirLength;
  dirY /= dirLength;
  dirZ /= dirLength;
  
  // Choose a better initial up vector to avoid singularities
  // If direction is close to [0,±1,0], use [0,0,1] as up
  // Otherwise use [0,1,0]
  let upX, upY, upZ;
  if (abs(dirY) > 0.9 && abs(dirX) < 0.1 && abs(dirZ) < 0.1) {
    // Direction nearly parallel to Y axis, use Z as up
    upX = 0;
    upY = 0;
    upZ = 1;
  } else {
    // Use Y as up in other cases
    upX = 0;
    upY = 1;
    upZ = 0;
  }
  
  // Create the "right" vector using cross product of up and direction
  let rightX = upY * dirZ - upZ * dirY;
  let rightY = upZ * dirX - upX * dirZ;
  let rightZ = upX * dirY - upY * dirX;
  
  // Normalize the right vector
  let rightLength = sqrt(rightX*rightX + rightY*rightY + rightZ*rightZ);
  rightX /= rightLength;
  rightY /= rightLength;
  rightZ /= rightLength;
  
  // Recompute the "up" vector to ensure orthogonality
  upX = dirY * rightZ - dirZ * rightY;
  upY = dirZ * rightX - dirX * rightZ;
  upZ = dirX * rightY - dirY * rightX;
  
  // Apply the rotation matrix to align with the direction vector
  applyMatrix(
    rightX, upX, -dirX, 0,
    rightY, upY, -dirY, 0,
    rightZ, upZ, -dirZ, 0,
    0, 0, 0, 1
  );
  
  // Additional rotation to align the flower properly
  rotateX(90);
  
  camellia(0, 0, 0, 80, 0.2);
  pop();
}

function tetrahedron(size, vertices) {
  push();
  stroke(0, 0, 100);
  strokeWeight(4);
  
  // Draw edges
  beginShape(LINES);
  // Connect top vertex to all others
  for(let i = 1; i < 4; i++) {
    vertex(...vertices[0]);
    vertex(...vertices[i]);
  }
  // Connect base vertices
  vertex(...vertices[1]); vertex(...vertices[2]);
  vertex(...vertices[2]); vertex(...vertices[3]);
  vertex(...vertices[3]); vertex(...vertices[1]);
  endShape();
  
  pop();
}

function camellia(x, y, z, size, density = 1.0) {
  push();
  translate(x, y, z);
  // Adjust step sizes based on density parameter (0.0 to 1.0)
  let rStep = 0.02 * density;
  let thetaStep = 1.5 * density;
  
  for(let r = 0; r <= 1; r += rStep) {
    beginShape(POINTS);
    stroke(335, -r*5+10, r*50+50);
    for(let theta = 0; theta <= 180*20; theta += thetaStep) {
      let phi = (180/2.5)*Math.exp(-theta/(16*180));
      let petalCut = 0.75+abs(asin(sin(2.75*theta))+80*sin(2.75*theta))/480;
      let hangDown = 1.4*pow(r, 2)*pow(1.0*r-1, 2)*sin(phi);

      if(0 < petalCut * (r * sin(phi)+hangDown*cos(phi))) {
        let pX = size * (1-theta/6000) * petalCut * (r * sin(phi)+hangDown*cos(phi)) * sin(theta);
        let pY = -size * (1-theta/6000) * petalCut * (r * cos(phi)-hangDown*sin(phi));
        let pZ = size * (1-theta/6000) * petalCut * (r * sin(phi)+hangDown*cos(phi)) * cos(theta);
        vertex(pX, pY, pZ);
      }
    }
    endShape();
  }
  pop();
}