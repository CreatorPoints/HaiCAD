/**
 * HaiCAD Engineering Hardware & Specifications Database
 * Grounded lookup engine to prevent hallucination of standard mechanical dimensions.
 */

export interface HardwareSpec {
  name: string;
  category: 'motor' | 'fastener' | 'bearing' | 'extrusion' | 'electronics' | 'keyboard' | 'general';
  dimensions: Record<string, number | string>;
  description: string;
  recommendedParams: Record<string, number>;
}

export const HARDWARE_SPECS_DATABASE: Record<string, HardwareSpec> = {
  'nema-17': {
    name: 'NEMA 17 Stepper Motor',
    category: 'motor',
    description: 'Standard 42mm hybrid stepper motor faceplate (NEMA 17).',
    dimensions: {
      faceWidth: 42.3,
      faceHeight: 42.3,
      boltPCD: 31.0,
      boltHoleDiameter: 3.4, // M3 clearance
      pilotBossDiameter: 22.0,
      pilotBossDepth: 2.0,
      shaftDiameter: 5.0,
    },
    recommendedParams: {
      width: 42.3,
      pcd: 31.0,
      boltDia: 3.4,
      bossDia: 22.0,
      shaftDia: 5.0,
    },
  },
  'nema-23': {
    name: 'NEMA 23 Stepper Motor',
    category: 'motor',
    description: 'Heavy duty 57mm stepper motor faceplate (NEMA 23).',
    dimensions: {
      faceWidth: 57.0,
      faceHeight: 57.0,
      boltPCD: 47.14,
      boltHoleDiameter: 5.2, // M5 clearance
      pilotBossDiameter: 38.1,
      pilotBossDepth: 2.0,
      shaftDiameter: 6.35,
    },
    recommendedParams: {
      width: 57.0,
      pcd: 47.14,
      boltDia: 5.2,
      bossDia: 38.1,
    },
  },
  '775-dc-motor': {
    name: '775 DC Motor',
    category: 'motor',
    description: 'High-torque 44mm diameter cylindrical DC motor.',
    dimensions: {
      motorDiameter: 44.0,
      boltHoleSpacing: 29.0,
      boltThread: 'M4',
      pilotBossDiameter: 17.5,
      shaftDiameter: 5.0,
    },
    recommendedParams: {
      diameter: 44.0,
      boltSpacing: 29.0,
      bossDia: 17.5,
    },
  },
  'sg90-servo': {
    name: 'SG90 9g Micro Servo',
    category: 'motor',
    description: 'Micro hobby servo mounting envelope.',
    dimensions: {
      length: 22.8,
      width: 12.2,
      height: 28.5,
      mountingFlangeLength: 32.5,
      mountingHoleDistance: 28.0,
      mountingHoleDiameter: 2.2,
    },
    recommendedParams: {
      bodyLength: 22.8,
      bodyWidth: 12.2,
      bodyHeight: 28.5,
      flangeHoleDist: 28.0,
    },
  },
  'iso-4762-m3': {
    name: 'ISO 4762 M3 Socket Head Cap Screw',
    category: 'fastener',
    description: 'M3 metric socket head cap screw clearance and counterbore specs.',
    dimensions: {
      threadMajorDia: 3.0,
      clearanceHoleDia: 3.4,
      counterboreDia: 6.0,
      counterboreDepth: 3.2,
      hexKeySize: 2.5,
    },
    recommendedParams: {
      clearanceDia: 3.4,
      cboreDia: 6.0,
      cboreDepth: 3.2,
    },
  },
  'iso-4762-m4': {
    name: 'ISO 4762 M4 Socket Head Cap Screw',
    category: 'fastener',
    description: 'M4 metric socket head cap screw clearance and counterbore specs.',
    dimensions: {
      threadMajorDia: 4.0,
      clearanceHoleDia: 4.5,
      counterboreDia: 7.5,
      counterboreDepth: 4.2,
    },
    recommendedParams: {
      clearanceDia: 4.5,
      cboreDia: 7.5,
      cboreDepth: 4.2,
    },
  },
  'iso-4762-m5': {
    name: 'ISO 4762 M5 Socket Head Cap Screw',
    category: 'fastener',
    description: 'M5 metric socket head cap screw clearance and counterbore specs.',
    dimensions: {
      threadMajorDia: 5.0,
      clearanceHoleDia: 5.5,
      counterboreDia: 9.0,
      counterboreDepth: 5.2,
    },
    recommendedParams: {
      clearanceDia: 5.5,
      cboreDia: 9.0,
      cboreDepth: 5.2,
    },
  },
  'bearing-608': {
    name: '608 Ball Bearing (Skate / 3D Printer)',
    category: 'bearing',
    description: 'Standard 608 ball bearing (8x22x7mm).',
    dimensions: {
      innerDiameter: 8.0,
      outerDiameter: 22.0,
      width: 7.0,
      pressFitHousingDia: 22.05,
      clearanceShaftDia: 7.95,
    },
    recommendedParams: {
      innerDia: 8.0,
      outerDia: 22.0,
      width: 7.0,
    },
  },
  'bearing-625': {
    name: '625 Ball Bearing (V-Wheel / V-Slot)',
    category: 'bearing',
    description: 'Standard 625 ball bearing (5x16x5mm).',
    dimensions: {
      innerDiameter: 5.0,
      outerDiameter: 16.0,
      width: 5.0,
    },
    recommendedParams: {
      innerDia: 5.0,
      outerDia: 16.0,
      width: 5.0,
    },
  },
  '2020-extrusion': {
    name: '2020 Aluminium Extrusion T-Slot',
    category: 'extrusion',
    description: 'Standard 20x20mm aluminium profile with 6mm T-slot.',
    dimensions: {
      profileWidth: 20.0,
      profileHeight: 20.0,
      slotWidth: 6.0,
      centerBoreDiameter: 4.2, // For M5 tap
      slotDepth: 6.1,
    },
    recommendedParams: {
      width: 20.0,
      height: 20.0,
      slotWidth: 6.0,
      centerBore: 4.2,
    },
  },
  'cherry-mx-switch': {
    name: 'Cherry MX / Mechanical Keyboard Switch',
    category: 'keyboard',
    description: 'Standard mechanical keyboard switch plate cutout & spacing.',
    dimensions: {
      plateCutoutWidth: 14.0,
      plateCutoutHeight: 14.0,
      unitKeycapPitch: 19.05,
      plateThickness: 1.5,
      cornerFillet: 0.5,
    },
    recommendedParams: {
      cutoutSize: 14.0,
      keyPitch: 19.05,
      plateThick: 1.5,
    },
  },
  'raspberry-pi-4-5': {
    name: 'Raspberry Pi 4 / 5 Mount Pattern',
    category: 'electronics',
    description: 'Standard Raspberry Pi mounting hole layout.',
    dimensions: {
      boardWidth: 85.0,
      boardLength: 56.0,
      holeSpacingX: 58.0,
      holeSpacingY: 49.0,
      holeDiameter: 2.75, // For M2.5 standoff
      holeOffsetX: 3.5,
      holeOffsetY: 3.5,
    },
    recommendedParams: {
      spacingX: 58.0,
      spacingY: 49.0,
      holeDia: 2.75,
    },
  },
  'arduino-uno': {
    name: 'Arduino Uno Mounting Pattern',
    category: 'electronics',
    description: 'Standard Arduino Uno R3 / R4 mounting hole layout.',
    dimensions: {
      boardWidth: 68.6,
      boardLength: 53.4,
      holeDiameter: 3.2,
    },
    recommendedParams: {
      boardWidth: 68.6,
      boardLength: 53.4,
      holeDia: 3.2,
    },
  },
};

/**
 * Searches the engineering database for matching hardware specs.
 */
export function lookupHardwareSpec(query: string): HardwareSpec | null {
  const q = query.toLowerCase().trim();

  // 1. Direct match
  if (HARDWARE_SPECS_DATABASE[q]) {
    return HARDWARE_SPECS_DATABASE[q];
  }

  // 2. Keyword scan
  for (const [key, spec] of Object.entries(HARDWARE_SPECS_DATABASE)) {
    if (
      q.includes(key) ||
      q.includes(spec.name.toLowerCase()) ||
      (q.includes('nema 17') && key === 'nema-17') ||
      (q.includes('nema 23') && key === 'nema-23') ||
      (q.includes('775') && key === '775-dc-motor') ||
      (q.includes('sg90') && key === 'sg90-servo') ||
      (q.includes('servo') && key === 'sg90-servo') ||
      (q.includes('608') && key === 'bearing-608') ||
      (q.includes('625') && key === 'bearing-625') ||
      (q.includes('2020') && key === '2020-extrusion') ||
      (q.includes('extrusion') && key === '2020-extrusion') ||
      ((q.includes('cherry') || q.includes('macropad') || q.includes('switch cutout')) && key === 'cherry-mx-switch') ||
      (q.includes('raspberry') && key === 'raspberry-pi-4-5') ||
      (q.includes('arduino') && key === 'arduino-uno') ||
      ((q.includes('m3') || q.includes('m3 screw')) && key === 'iso-4762-m3') ||
      ((q.includes('m4') || q.includes('m4 screw')) && key === 'iso-4762-m4') ||
      ((q.includes('m5') || q.includes('m5 screw')) && key === 'iso-4762-m5')
    ) {
      return spec;
    }
  }

  return null;
}
