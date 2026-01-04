// Advanced Validation Test untuk Edge Cases dan Corner Cases
// Test tambahan untuk validasi yang lebih mendetail

// Copy constants and functions from main test file
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
  
  boxOrientations.forEach(([l, w, h]) => {
    const lengthCount = Math.floor(container.length / l);
    const widthCount = Math.floor(container.width / w);
    const heightCount = Math.floor(container.height / h);
    
    if (lengthCount > 0 && widthCount > 0 && heightCount > 0) {
      const totalBoxes = lengthCount * widthCount * heightCount;
      const usedVolume = totalBoxes * (l * w * h);
      const containerVolume = container.length * container.width * container.height;
      const efficiency = (usedVolume / containerVolume) * 100;
      
      arrangements.push({
        lengthCount, widthCount, heightCount, totalBoxes, efficiency,
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

console.log("=== TEST LANJUTAN: EDGE CASES DAN CORNER CASES ===\n");

// Test 1: Presisi konversi unit dengan angka desimal
function testPrecisionUnitConversion() {
    console.log("TEST A: Presisi Konversi Unit dengan Desimal");
    
    const precisionTests = [
        { value: 12.5, unit: 'cm', expected: 0.125 },
        { value: 1234.567, unit: 'mm', expected: 1.234567 },
        { value: 3.14159, unit: 'inches', expected: 3.14159 * 0.0254 },
        { value: 0.1, unit: 'cm', expected: 0.001 },
        { value: 999.999, unit: 'mm', expected: 0.999999 }
    ];
    
    let passedTests = 0;
    const tolerance = 0.000001; // 1 mikrometer toleransi
    
    precisionTests.forEach(test => {
        const result = convertToMeters(test.value, test.unit);
        const passed = Math.abs(result - test.expected) < tolerance;
        
        console.log(`  ${test.value} ${test.unit} = ${result.toFixed(6)}m (expected: ${test.expected.toFixed(6)}m) - ${passed ? 'LULUS' : 'GAGAL'}`);
        
        if (passed) passedTests++;
    });
    
    console.log(`  Status: ${passedTests}/${precisionTests.length} test lulus\n`);
    return passedTests === precisionTests.length;
}

// Test 2: Validasi matematika perhitungan volume
function testVolumeCalculationAccuracy() {
    console.log("TEST B: Akurasi Perhitungan Volume");
    
    const testBox = { length: 33.33, width: 25.77, height: 12.88, unit: 'cm' };
    const results = calculateArrangements(testBox, '20ft');
    
    if (results.length === 0) {
        console.log("  Tidak ada hasil untuk divalidasi");
        return false;
    }
    
    const bestResult = results[0];
    const container = STANDARD_CONTAINERS['20ft'];
    
    // Konversi manual untuk validasi
    const boxL = convertToMeters(testBox.length, testBox.unit);
    const boxW = convertToMeters(testBox.width, testBox.unit);
    const boxH = convertToMeters(testBox.height, testBox.unit);
    
    // Validasi volume perhitungan
    const singleBoxVolume = boxL * boxW * boxH;
    const totalUsedVolume = bestResult.totalBoxes * singleBoxVolume;
    const containerVolume = container.length * container.width * container.height;
    const calculatedEfficiency = (totalUsedVolume / containerVolume) * 100;
    
    const efficiencyDiff = Math.abs(bestResult.efficiency - calculatedEfficiency);
    const volumeAccurate = efficiencyDiff < 0.01; // 0.01% toleransi
    
    console.log(`  Single box volume: ${singleBoxVolume.toFixed(6)} m³`);
    console.log(`  Total boxes: ${bestResult.totalBoxes}`);
    console.log(`  Total used volume: ${totalUsedVolume.toFixed(6)} m³`);
    console.log(`  Container volume: ${containerVolume.toFixed(6)} m³`);
    console.log(`  Reported efficiency: ${bestResult.efficiency.toFixed(4)}%`);
    console.log(`  Calculated efficiency: ${calculatedEfficiency.toFixed(4)}%`);
    console.log(`  Difference: ${efficiencyDiff.toFixed(6)}%`);
    console.log(`  Status: ${volumeAccurate ? 'LULUS' : 'GAGAL'}\n`);
    
    return volumeAccurate;
}

// Test 3: Custom container validation
function testCustomContainerHandling() {
    console.log("TEST C: Validasi Custom Container");
    
    const customContainer = {
        name: 'Custom Test Container',
        length: 8.5,
        width: 2.8,
        height: 3.2
    };
    
    const testBox = { length: 40, width: 30, height: 25, unit: 'cm' };
    const results = calculateArrangements(testBox, 'custom', customContainer);
    
    if (results.length === 0) {
        console.log("  Tidak ada hasil untuk custom container");
        return false;
    }
    
    const bestResult = results[0];
    
    // Manual calculation untuk validasi
    const boxL = 0.4, boxW = 0.3, boxH = 0.25;
    
    const expectedLengthCount = Math.floor(customContainer.length / boxL);
    const expectedWidthCount = Math.floor(customContainer.width / boxW);
    const expectedHeightCount = Math.floor(customContainer.height / boxH);
    const expectedTotal = expectedLengthCount * expectedWidthCount * expectedHeightCount;
    
    const countsCorrect = (
        bestResult.lengthCount <= expectedLengthCount &&
        bestResult.widthCount <= expectedWidthCount &&
        bestResult.heightCount <= expectedHeightCount
    );
    
    console.log(`  Custom container: ${customContainer.length}×${customContainer.width}×${customContainer.height}m`);
    console.log(`  Box dimensions: ${boxL}×${boxW}×${boxH}m`);
    console.log(`  Expected max per dimension: ${expectedLengthCount}L × ${expectedWidthCount}W × ${expectedHeightCount}H`);
    console.log(`  Best arrangement: ${bestResult.lengthCount}L × ${bestResult.widthCount}W × ${bestResult.heightCount}H`);
    console.log(`  Total boxes: ${bestResult.totalBoxes}`);
    console.log(`  Efficiency: ${bestResult.efficiency.toFixed(2)}%`);
    console.log(`  Status: ${countsCorrect ? 'LULUS' : 'GAGAL'}\n`);
    
    return countsCorrect;
}

// Test 4: Extreme values handling
function testExtremeValues() {
    console.log("TEST D: Handling Nilai Ekstrem");
    
    const extremeCases = [
        {
            name: "Box sangat kecil",
            box: { length: 0.01, width: 0.01, height: 0.01, unit: 'mm' },
            container: '20ft'
        },
        {
            name: "Box hampir sebesar container",
            box: { length: 589, width: 235, height: 239, unit: 'cm' },
            container: '20ft'
        },
        {
            name: "Box persegi panjang sangat tipis",
            box: { length: 500, width: 0.1, height: 0.1, unit: 'cm' },
            container: '20ft'
        },
        {
            name: "Box sangat tinggi",
            box: { length: 10, width: 10, height: 250, unit: 'cm' },
            container: '40ft-hc'
        }
    ];
    
    let handledCorrectly = 0;
    
    extremeCases.forEach(testCase => {
        const results = calculateArrangements(testCase.box, testCase.container);
        const hasValidResults = results.length > 0;
        const noNaNOrInfinity = results.every(result => {
            const values = [
                result.lengthCount, result.widthCount, result.heightCount,
                result.totalBoxes, result.efficiency,
                result.remainingSpace.length, result.remainingSpace.width, result.remainingSpace.height
            ];
            return values.every(val => isFinite(val) && !isNaN(val));
        });
        
        const handledCorrect = noNaNOrInfinity; // Either has valid results or empty (both acceptable)
        
        console.log(`  ${testCase.name}: ${results.length} arrangements, Valid: ${handledCorrect ? 'Yes' : 'No'}`);
        
        if (hasValidResults) {
            const best = results[0];
            console.log(`    Best: ${best.totalBoxes} boxes, ${best.efficiency.toFixed(2)}% efficiency`);
        }
        
        if (handledCorrect) handledCorrectly++;
    });
    
    console.log(`  Status: ${handledCorrectly}/${extremeCases.length} kasus handled correctly\n`);
    return handledCorrectly === extremeCases.length;
}

// Test 5: Stress test dengan multiple containers
function testMultipleContainerTypes() {
    console.log("TEST E: Multiple Container Types");
    
    const testBox = { length: 35, width: 28, height: 22, unit: 'cm' };
    const containerResults = {};
    
    Object.keys(STANDARD_CONTAINERS).forEach(containerType => {
        if (containerType === 'custom') return;
        
        const results = calculateArrangements(testBox, containerType);
        containerResults[containerType] = {
            arrangements: results.length,
            maxBoxes: results.length > 0 ? results[0].totalBoxes : 0,
            maxEfficiency: results.length > 0 ? results[0].efficiency : 0
        };
        
        console.log(`  ${STANDARD_CONTAINERS[containerType].name}:`);
        console.log(`    Arrangements: ${containerResults[containerType].arrangements}`);
        console.log(`    Max boxes: ${containerResults[containerType].maxBoxes}`);
        console.log(`    Max efficiency: ${containerResults[containerType].maxEfficiency.toFixed(2)}%`);
    });
    
    // Validasi bahwa container yang lebih besar menghasilkan lebih banyak box
    const containers20ft = containerResults['20ft']?.maxBoxes || 0;
    const containers40ft = containerResults['40ft']?.maxBoxes || 0;
    const containers40ftHC = containerResults['40ft-hc']?.maxBoxes || 0;
    const containers45ftHC = containerResults['45ft-hc']?.maxBoxes || 0;
    
    const logicalProgression = (
        containers20ft <= containers40ft &&
        containers40ft <= containers40ftHC &&
        containers40ftHC <= containers45ftHC
    );
    
    console.log(`  Logical size progression: ${logicalProgression ? 'LULUS' : 'GAGAL'}\n`);
    return logicalProgression;
}

// Test 6: Floating point precision
function testFloatingPointPrecision() {
    console.log("TEST F: Floating Point Precision");
    
    // Test dengan angka yang bisa menyebabkan floating point errors
    const precisionCases = [
        { length: 33.333333, width: 25.666666, height: 15.111111, unit: 'cm' },
        { length: 123.456789, width: 987.654321, height: 555.777888, unit: 'mm' },
        { length: 12.34567, width: 9.87654, height: 6.54321, unit: 'inches' }
    ];
    
    let allPrecisionTestsPassed = true;
    
    precisionCases.forEach((testCase, index) => {
        const results = calculateArrangements(testCase, '20ft');
        
        if (results.length > 0) {
            const bestResult = results[0];
            
            // Validate that all calculations produce reasonable results
            const hasReasonableValues = (
                bestResult.totalBoxes > 0 &&
                bestResult.efficiency >= 0 && bestResult.efficiency <= 100 &&
                bestResult.remainingSpace.length >= 0 &&
                bestResult.remainingSpace.width >= 0 &&
                bestResult.remainingSpace.height >= 0 &&
                isFinite(bestResult.totalBoxes) &&
                isFinite(bestResult.efficiency)
            );
            
            console.log(`  Case ${index + 1}: Boxes: ${bestResult.totalBoxes}, Efficiency: ${bestResult.efficiency.toFixed(4)}%, Valid: ${hasReasonableValues ? 'Yes' : 'No'}`);
            
            if (!hasReasonableValues) allPrecisionTestsPassed = false;
        } else {
            console.log(`  Case ${index + 1}: No valid arrangements`);
        }
    });
    
    console.log(`  Status: ${allPrecisionTestsPassed ? 'LULUS' : 'GAGAL'}\n`);
    return allPrecisionTestsPassed;
}

// Run all advanced tests
function runAdvancedTests() {
    const testResults = [];
    
    testResults.push({ name: "Presisi Konversi Unit", passed: testPrecisionUnitConversion() });
    testResults.push({ name: "Akurasi Perhitungan Volume", passed: testVolumeCalculationAccuracy() });
    testResults.push({ name: "Custom Container Handling", passed: testCustomContainerHandling() });
    testResults.push({ name: "Extreme Values Handling", passed: testExtremeValues() });
    testResults.push({ name: "Multiple Container Types", passed: testMultipleContainerTypes() });
    testResults.push({ name: "Floating Point Precision", passed: testFloatingPointPrecision() });
    
    console.log("=== RINGKASAN TEST LANJUTAN ===");
    const passedTests = testResults.filter(t => t.passed).length;
    const totalTests = testResults.length;
    
    testResults.forEach(result => {
        console.log(`${result.passed ? '✓' : '✗'} ${result.name}`);
    });
    
    console.log(`\nTotal Advanced Tests: ${passedTests}/${totalTests} lulus`);
    console.log(`Status: ${passedTests === totalTests ? 'LULUS SEMUA' : 'ADA YANG GAGAL'}`);
    
    return {
        totalTests,
        passedTests,
        results: testResults,
        allPassed: passedTests === totalTests
    };
}

// Jalankan advanced tests
runAdvancedTests();
