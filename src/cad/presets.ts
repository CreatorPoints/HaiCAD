export interface CADPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  code: string;
}

export const PRESETS: CADPreset[] = [
  {
    id: 'mounting-bracket',
    name: 'L-Mounting Bracket',
    category: 'Mechanical',
    description: 'Precision L-shaped mounting bracket with filleted corners and 4 screw holes',
    code: `// Precision L-Mounting Bracket with Countersunk Holes
function main({ draw, drawRoundedRectangle, makeCylinder }) {
  // 1. Create the base L-profile sketch and extrude
  const baseProfile = draw()
    .hLine(50)
    .vLine(10)
    .hLine(-40)
    .vLine(40)
    .hLine(-10)
    .close()
    .sketchOnPlane("XZ")
    .extrude(35);

  // 2. Add structural fillet to the internal corner
  const bracketWithFillet = baseProfile.fillet(4, (e) => e.inDirection("Y").atDistance(10, "Z"));

  // 3. Drill 2 mounting holes in the bottom flange
  const hole1 = makeCylinder(2.5, 20).translate([15, 10, -5]);
  const hole2 = makeCylinder(2.5, 20).translate([35, 10, -5]);

  // 4. Drill 2 mounting holes in the vertical flange
  const hole3 = makeCylinder(2.5, 20).rotate(90, [0, 0, 0], [1, 0, 0]).translate([5, 10, 25]);
  const hole4 = makeCylinder(2.5, 20).rotate(90, [0, 0, 0], [1, 0, 0]).translate([5, 25, 25]);

  // 5. Subtract all holes from the bracket
  const finalModel = bracketWithFillet
    .cut(hole1)
    .cut(hole2)
    .cut(hole3)
    .cut(hole4);

  return finalModel;
}
`,
  },
  {
    id: 'flanged-pipe',
    name: 'Flanged Industrial Pipe',
    category: 'Piping',
    description: 'Flanged pipe coupling with 6 bolt pattern and chamfered flow bore',
    code: `// Flanged Pipe Coupling with 6-Bolt Circular Pattern
function main({ makeCylinder, drawCircle }) {
  const outerRadius = 15;
  const innerRadius = 11;
  const pipeHeight = 45;
  const flangeRadius = 26;
  const flangeThickness = 6;

  // 1. Main outer pipe body
  const pipeOuter = makeCylinder(outerRadius, pipeHeight);

  // 2. Bottom mounting flange
  const flange = makeCylinder(flangeRadius, flangeThickness);

  // 3. Merge pipe and flange
  let body = pipeOuter.fuse(flange);

  // 4. Cut internal fluid flow conduit through the center
  const internalBore = makeCylinder(innerRadius, pipeHeight + 10).translate([0, 0, -5]);
  body = body.cut(internalBore);

  // 5. Add 6 circular bolt holes on the flange perimeter
  for (let i = 0; i < 6; i++) {
    const angle = (i * 2 * Math.PI) / 6;
    const x = Math.cos(angle) * 20.5;
    const y = Math.sin(angle) * 20.5;
    const boltHole = makeCylinder(2.2, flangeThickness + 4).translate([x, y, -2]);
    body = body.cut(boltHole);
  }

  return body;
}
`,
  },
  {
    id: 'heatsink-cooler',
    name: 'Finned Heatsink',
    category: 'Electronics',
    description: 'High-surface-area electronics cooling heatsink with cooling fins',
    code: `// Electronics Cooling Heatsink with Arrayed Fins
function main({ makeBox }) {
  const baseWidth = 40;
  const baseLength = 40;
  const baseHeight = 4;
  const finThickness = 1.2;
  const finHeight = 16;
  const numFins = 8;
  const finSpacing = (baseWidth - finThickness) / (numFins - 1);

  // 1. Base plate
  let heatsink = makeBox(baseWidth, baseLength, baseHeight).translate([
    -baseWidth / 2,
    -baseLength / 2,
    0,
  ]);

  // 2. Add extruded cooling fins array
  for (let i = 0; i < numFins; i++) {
    const posX = -baseWidth / 2 + i * finSpacing;
    const fin = makeBox(finThickness, baseLength, finHeight).translate([
      posX,
      -baseLength / 2,
      baseHeight,
    ]);
    heatsink = heatsink.fuse(fin);
  }

  return heatsink;
}
`,
  },
  {
    id: 'parametric-gear',
    name: 'Precision Spur Gear',
    category: 'Mechanisms',
    description: 'Parametric 16-tooth spur gear with center keyed axle shaft',
    code: `// Parametric Spur Gear with Center Axle Bore
function main({ draw, makeCylinder, makeBox }) {
  const numTeeth = 14;
  const pitchRadius = 24;
  const rootRadius = 20;
  const tipRadius = 27;
  const gearThickness = 8;

  // 1. Draw gear profile
  let gearSketch = draw();
  for (let i = 0; i < numTeeth; i++) {
    const angle1 = (i * 2 * Math.PI) / numTeeth;
    const angle2 = angle1 + Math.PI / (numTeeth * 2);
    const angle3 = angle1 + Math.PI / numTeeth;
    const angle4 = angle1 + (3 * Math.PI) / (numTeeth * 2);

    const p1 = [Math.cos(angle1) * rootRadius, Math.sin(angle1) * rootRadius];
    const p2 = [Math.cos(angle2) * tipRadius, Math.sin(angle2) * tipRadius];
    const p3 = [Math.cos(angle3) * tipRadius, Math.sin(angle3) * tipRadius];
    const p4 = [Math.cos(angle4) * rootRadius, Math.sin(angle4) * rootRadius];

    if (i === 0) {
      gearSketch = gearSketch.movePointerTo(p1);
    } else {
      gearSketch = gearSketch.lineTo(p1);
    }
    gearSketch = gearSketch.lineTo(p2).lineTo(p3).lineTo(p4);
  }
  gearSketch = gearSketch.close();

  // 2. Extrude the gear body
  let gear = gearSketch.sketchOnPlane("XY").extrude(gearThickness);

  // 3. Cut center axle hole with keyway slot
  const axleHole = makeCylinder(6, gearThickness + 4).translate([0, 0, -2]);
  const keySlot = makeBox(2.5, 14, gearThickness + 4).translate([-1.25, -7, -2]);

  gear = gear.cut(axleHole).cut(keySlot);

  return gear;
}
`,
  },
];
