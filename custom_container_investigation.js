// Investigasi Detail Custom Container "Issue"
// Membuktikan bahwa ini bukan bug, tetapi optimasi algoritma

const STANDARD_CONTAINERS = {
  '20ft': { name: '20ft Standard', length: 5.898, width: 2.352, height: 2.393 },
  '40ft': { name: '40ft Standard', length: 12.032, width: 2.352, height: 2.393 },
  '40ft-hc': { name: '40ft High Cube', length: 12.032, width: 2.352, height: 2.698 },
  '45ft-hc': { name: '45ft High Cube', length: 13.556, width: 2.352, height: 2.698 }
};

const convertToMeters = (value, unit) => {
  switch (unit) {
    case 'cm': return value / 100;
    case 'mm': return value / 1000;
    case 'inches': return value * 0.0254;
    default: return value;
  }
};

const calculateArrangements = (boxDimensions, containerType, customContainer = null) => {
  const boxL = convertToMeters(boxDimensions.length, boxDimensions.unit);
  const boxW = convertToMeters(boxDimensions.width, boxDimensions.unit);
  const boxH = convertToMeters(boxDimensions.height, boxDimensions.unit);
  
  if (boxL <= 0 || boxW <= 0 || boxH <= 0) return [];
  
  const container = containerType === 'custom' && customContainer
    ? customContainer
    : STANDARD_CONTAINERS[containerType];
  
  if (!container || container.length <= 0 || container.width <= 0 || container.height <= 0) {
    return [];
  }
  
  const boxOrientations = [
    [boxL, boxW, boxH], [boxL, boxH, boxW], [boxW, boxL, boxH],
    [boxW, boxH, boxL], [boxH, boxL, boxW], [boxH, boxW, boxL]
  ];
  
  const arrangements = [];
  
  boxOrientations.forEach(([l, w, h], index) => {
    const lengthCount = Math.floor(container.length / l);
    const widthCount = Math.floor(container.width / w);
    const heightCount = Math.floor(container.height / h);
    
    if (lengthCount > 0 && widthCount > 0 && heightCount > 0) {
      const totalBoxes = lengthCount * widthCount * heightCount;
      const usedVolume = totalBoxes * (l * w * h);
      const containerVolume = container.length * container.width * container.height;
      const efficiency = (usedVolume / containerVolume) * 100;
      
      arrangements.push({
        orientationIndex: index,
        orientation: `${l.toFixed(3)}×${w.toFixed(3)}×${h.toFixed(3)}`,
        lengthCount, widthCount, heightCount, totalBoxes, efficiency,
        boxVolume: l * w * h,
        usedVolume,
        remainingSpace: {
          length: container.length - (lengthCount * l),
          width: container.width - (widthCount * w),
          height: container.height - (heightCount * h)
        }
      });
    }
  });
  
  return arrangements.sort((a, b) => {
    if (b.totalBoxes !== a.totalBoxes) {
      return b.totalBoxes - a.totalBoxes;
    }
    return b.efficiency - a.efficiency;
  });
};

console.log("=== INVESTIGASI CUSTOM CONTAINER TEST ===\n");

// Test case yang "gagal"
const customContainer = {
  name: 'Custom Test Container',
  length: 8.5,
  width: 2.8,
  height: 3.2
};

const testBox = { length: 40, width: 30, height: 25, unit: 'cm' };
console.log("Container dimensions:", `${customContainer.length}×${customContainer.width}×${customContainer.height}m`);
console.log("Box dimensions:", `${testBox.length}×${testBox.width}×${testBox.height} ${testBox.unit}`);
console.log("Box in meters:", `${convertToMeters(testBox.length, testBox.unit)}×${convertToMeters(testBox.width, testBox.unit)}×${convertToMeters(testBox.height, testBox.unit)}m`);

const results = calculateArrangements(testBox, 'custom', customContainer);

console.log(`\nFound ${results.length} possible arrangements:\n`);

// Show all arrangements with details
results.forEach((result, index) => {
  const orientationNames = ['LWH', 'LHW', 'WLH', 'WHL', 'HLW', 'HWL'];
  console.log(`${index + 1}. Orientation ${orientationNames[result.orientationIndex]} (${result.orientation}m):`);
  console.log(`   Arrangement: ${result.lengthCount}L × ${result.widthCount}W × ${result.heightCount}H`);
  console.log(`   Total boxes: ${result.totalBoxes}`);
  console.log(`   Efficiency: ${result.efficiency.toFixed(2)}%`);
  console.log(`   Box volume: ${result.boxVolume.toFixed(6)} m³`);
  console.log(`   Total used: ${result.usedVolume.toFixed(3)} m³`);
  console.log(`   Remaining space: ${result.remainingSpace.length.toFixed(3)}×${result.remainingSpace.width.toFixed(3)}×${result.remainingSpace.height.toFixed(3)}m`);
  console.log();
});

// Manual verification of the best result
const bestResult = results[0];
console.log("=== MANUAL VERIFICATION ===");

// Reconstruct the best orientation manually
const orientations = [
  [0.4, 0.3, 0.25], [0.4, 0.25, 0.3], [0.3, 0.4, 0.25],
  [0.3, 0.25, 0.4], [0.25, 0.4, 0.3], [0.25, 0.3, 0.4]
];

const bestOrientation = orientations[bestResult.orientationIndex];
console.log(`Best orientation: ${bestOrientation.join('×')}m`);

// Manual calculation
const manualLengthCount = Math.floor(customContainer.length / bestOrientation[0]);
const manualWidthCount = Math.floor(customContainer.width / bestOrientation[1]);  
const manualHeightCount = Math.floor(customContainer.height / bestOrientation[2]);
const manualTotal = manualLengthCount * manualWidthCount * manualHeightCount;

console.log(`Manual calculation:`);
console.log(`  Length: floor(${customContainer.length} / ${bestOrientation[0]}) = ${manualLengthCount}`);
console.log(`  Width: floor(${customContainer.width} / ${bestOrientation[1]}) = ${manualWidthCount}`);  
console.log(`  Height: floor(${customContainer.height} / ${bestOrientation[2]}) = ${manualHeightCount}`);
console.log(`  Total: ${manualLengthCount} × ${manualWidthCount} × ${manualHeightCount} = ${manualTotal}`);

// Compare with algorithm result
console.log(`\nAlgorithm result: ${bestResult.lengthCount} × ${bestResult.widthCount} × ${bestResult.heightCount} = ${bestResult.totalBoxes}`);
console.log(`Match: ${manualTotal === bestResult.totalBoxes ? 'YES' : 'NO'}`);

// Why the original test failed
console.log("\n=== WHY ORIGINAL TEST FAILED ===");
console.log("Original test assumed box orientation: 0.4×0.3×0.25m (LWH)");
console.log(`Expected: floor(${customContainer.length}/0.4) × floor(${customContainer.width}/0.3) × floor(${customContainer.height}/0.25)`);
console.log(`Expected: ${Math.floor(customContainer.length/0.4)} × ${Math.floor(customContainer.width/0.3)} × ${Math.floor(customContainer.height/0.25)} = ${Math.floor(customContainer.length/0.4) * Math.floor(customContainer.width/0.3) * Math.floor(customContainer.height/0.25)}`);
console.log(`\nBut algorithm found better orientation and achieved: ${bestResult.totalBoxes} boxes`);
console.log(`Improvement: ${bestResult.totalBoxes - (Math.floor(customContainer.length/0.4) * Math.floor(customContainer.width/0.3) * Math.floor(customContainer.height/0.25))} more boxes`);

console.log("\n=== CONCLUSION ===");
console.log("❌ This is NOT a bug!");
console.log("✅ The algorithm is working BETTER than expected!");
console.log("✅ It correctly found the optimal box orientation!");
console.log("✅ The test assumption was wrong - it didn't account for all orientations!");
