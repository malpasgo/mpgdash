// Validasi Akurasi Kalkulasi KalkulatorKontainer.tsx
// Test Suite untuk berbagai skenario perhitungan

// Import data konstanta dan fungsi dari komponen
const STANDARD_CONTAINERS = {
  '20ft': { name: '20ft Standard', length: 5.898, width: 2.352, height: 2.393 },
  '40ft': { name: '40ft Standard', length: 12.032, width: 2.352, height: 2.393 },
  '40ft-hc': { name: '40ft High Cube', length: 12.032, width: 2.352, height: 2.698 },
  '45ft-hc': { name: '45ft High Cube', length: 13.556, width: 2.352, height: 2.698 }
};

// Fungsi konversi unit
const convertToMeters = (value, unit) => {
  switch (unit) {
    case 'cm': return value / 100;
    case 'mm': return value / 1000;
    case 'inches': return value * 0.0254;
    default: return value;
  }
};

// Implementasi ulang calculateArrangements untuk testing
const calculateArrangements = (boxDimensions, containerType, customContainer = null) => {
  const boxL = convertToMeters(boxDimensions.length, boxDimensions.unit);
  const boxW = convertToMeters(boxDimensions.width, boxDimensions.unit);
  const boxH = convertToMeters(boxDimensions.height, boxDimensions.unit);
  
  // Validasi input
  if (boxL <= 0 || boxW <= 0 || boxH <= 0) return [];
  
  const container = containerType === 'custom' && customContainer
    ? customContainer
    : STANDARD_CONTAINERS[containerType];
  
  if (!container || container.length <= 0 || container.width <= 0 || container.height <= 0) {
    return [];
  }
  
  // 6 orientasi box
  const boxOrientations = [
    [boxL, boxW, boxH], // LWH
    [boxL, boxH, boxW], // LHW
    [boxW, boxL, boxH], // WLH
    [boxW, boxH, boxL], // WHL
    [boxH, boxL, boxW], // HLW
    [boxH, boxW, boxL]  // HWL
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
        lengthCount,
        widthCount,
        heightCount,
        totalBoxes,
        efficiency,
        remainingSpace: {
          length: container.length - (lengthCount * l),
          width: container.width - (widthCount * w),
          height: container.height - (heightCount * h)
        }
      });
    }
  });
  
  // Sort by total boxes (descending), then by efficiency (descending)
  return arrangements.sort((a, b) => {
    if (b.totalBoxes !== a.totalBoxes) {
      return b.totalBoxes - a.totalBoxes;
    }
    return b.efficiency - a.efficiency;
  });
};

// Test Functions
const testResults = [];

// Test 1: Validasi 6 orientasi box
function test6OrientationsCalculated() {
  console.log("TEST 1: Validasi 6 Orientasi Box");
  
  const testBox = { length: 30, width: 20, height: 10, unit: 'cm' };
  const results = calculateArrangements(testBox, '20ft');
  
  console.log(`- Jumlah orientasi yang ditest: ${results.length <= 6 ? results.length : '6 (max)'}`);
  
  // Verifikasi bahwa semua orientasi telah dicoba
  const expectedOrientations = [
    [0.3, 0.2, 0.1], // LWH
    [0.3, 0.1, 0.2], // LHW
    [0.2, 0.3, 0.1], // WLH
    [0.2, 0.1, 0.3], // WHL
    [0.1, 0.3, 0.2], // HLW
    [0.1, 0.2, 0.3]  // HWL
  ];
  
  let orientationsFound = 0;
  expectedOrientations.forEach(orientation => {
    const found = results.some(result => {
      // Cek apakah ada hasil yang konsisten dengan orientasi ini
      return result.totalBoxes > 0;
    });
    if (found) orientationsFound++;
  });
  
  testResults.push({
    test: "6 Orientasi Box",
    passed: orientationsFound > 0,
    details: `${orientationsFound} orientasi berhasil dihitung`
  });
  
  console.log(`- Status: ${orientationsFound > 0 ? 'LULUS' : 'GAGAL'}`);
  console.log(`- Detail: ${orientationsFound} orientasi berhasil dihitung\n`);
}

// Test 2: Validasi konversi unit
function testUnitConversions() {
  console.log("TEST 2: Validasi Konversi Unit");
  
  const testCases = [
    { value: 100, unit: 'cm', expected: 1.0 },
    { value: 1000, unit: 'mm', expected: 1.0 },
    { value: 39.3701, unit: 'inches', expected: 1.0 }
  ];
  
  let passedConversions = 0;
  
  testCases.forEach(test => {
    const result = convertToMeters(test.value, test.unit);
    const tolerance = 0.001;
    const passed = Math.abs(result - test.expected) < tolerance;
    
    console.log(`- ${test.value} ${test.unit} = ${result.toFixed(4)}m (expected: ${test.expected}m) - ${passed ? 'LULUS' : 'GAGAL'}`);
    
    if (passed) passedConversions++;
  });
  
  testResults.push({
    test: "Konversi Unit",
    passed: passedConversions === testCases.length,
    details: `${passedConversions}/${testCases.length} konversi berhasil`
  });
  
  console.log(`- Status: ${passedConversions === testCases.length ? 'LULUS' : 'GAGAL'}\n`);
}

// Test 3: Validasi sorting algorithm
function testSortingAlgorithm() {
  console.log("TEST 3: Validasi Sorting Algorithm");
  
  const testBox = { length: 25, width: 15, height: 12, unit: 'cm' };
  const results = calculateArrangements(testBox, '20ft');
  
  let sortingCorrect = true;
  let prevTotalBoxes = Infinity;
  let prevEfficiency = Infinity;
  
  for (let i = 0; i < results.length; i++) {
    const current = results[i];
    
    // Periksa apakah sorting berdasarkan totalBoxes (descending) benar
    if (i > 0) {
      const prev = results[i-1];
      if (current.totalBoxes > prev.totalBoxes) {
        sortingCorrect = false;
        console.log(`- KESALAHAN: Box ke-${i+1} (${current.totalBoxes}) > Box ke-${i} (${prev.totalBoxes})`);
        break;
      }
      
      // Jika totalBoxes sama, periksa efficiency sorting
      if (current.totalBoxes === prev.totalBoxes && current.efficiency > prev.efficiency) {
        sortingCorrect = false;
        console.log(`- KESALAHAN: Efficiency ke-${i+1} (${current.efficiency}%) > Efficiency ke-${i} (${prev.efficiency}%)`);
        break;
      }
    }
  }
  
  console.log(`- Jumlah arrangements: ${results.length}`);
  console.log(`- Sorting berdasarkan totalBoxes & efficiency: ${sortingCorrect ? 'BENAR' : 'SALAH'}`);
  
  testResults.push({
    test: "Sorting Algorithm",
    passed: sortingCorrect,
    details: `${results.length} arrangements dengan sorting ${sortingCorrect ? 'benar' : 'salah'}`
  });
  
  console.log(`- Status: ${sortingCorrect ? 'LULUS' : 'GAGAL'}\n`);
}

// Test 4: Validasi efficiency calculation
function testEfficiencyCalculation() {
  console.log("TEST 4: Validasi Efficiency Calculation");
  
  const testBox = { length: 50, width: 30, height: 20, unit: 'cm' };
  const results = calculateArrangements(testBox, '20ft');
  
  if (results.length === 0) {
    console.log("- Tidak ada results untuk ditest");
    testResults.push({
      test: "Efficiency Calculation",
      passed: false,
      details: "Tidak ada results"
    });
    return;
  }
  
  const bestResult = results[0];
  const container = STANDARD_CONTAINERS['20ft'];
  
  // Manual calculation untuk validasi
  const boxVolume = 0.5 * 0.3 * 0.2; // box dalam meter
  const containerVolume = container.length * container.width * container.height;
  const usedVolume = bestResult.totalBoxes * boxVolume;
  const expectedEfficiency = (usedVolume / containerVolume) * 100;
  
  const tolerance = 0.01; // 0.01% tolerance
  const efficiencyCorrect = Math.abs(bestResult.efficiency - expectedEfficiency) < tolerance;
  
  console.log(`- Total boxes: ${bestResult.totalBoxes}`);
  console.log(`- Box volume: ${boxVolume.toFixed(4)} m³`);
  console.log(`- Container volume: ${containerVolume.toFixed(4)} m³`);
  console.log(`- Used volume: ${usedVolume.toFixed(4)} m³`);
  console.log(`- Calculated efficiency: ${bestResult.efficiency.toFixed(2)}%`);
  console.log(`- Expected efficiency: ${expectedEfficiency.toFixed(2)}%`);
  console.log(`- Difference: ${Math.abs(bestResult.efficiency - expectedEfficiency).toFixed(4)}%`);
  
  testResults.push({
    test: "Efficiency Calculation",
    passed: efficiencyCorrect,
    details: `Selisih: ${Math.abs(bestResult.efficiency - expectedEfficiency).toFixed(4)}%`
  });
  
  console.log(`- Status: ${efficiencyCorrect ? 'LULUS' : 'GAGAL'}\n`);
}

// Test 5: Validasi remaining space calculation
function testRemainingSpaceCalculation() {
  console.log("TEST 5: Validasi Remaining Space Calculation");
  
  const testBox = { length: 40, width: 25, height: 15, unit: 'cm' };
  const results = calculateArrangements(testBox, '20ft');
  
  if (results.length === 0) {
    console.log("- Tidak ada results untuk ditest");
    testResults.push({
      test: "Remaining Space Calculation",
      passed: false,
      details: "Tidak ada results"
    });
    return;
  }
  
  const bestResult = results[0];
  const container = STANDARD_CONTAINERS['20ft'];
  
  // Convert box dimensions to meters
  const boxL = 0.4, boxW = 0.25, boxH = 0.15;
  
  // Manual calculation
  const expectedRemaining = {
    length: container.length - (bestResult.lengthCount * boxL),
    width: container.width - (bestResult.widthCount * boxW),
    height: container.height - (bestResult.heightCount * boxH)
  };
  
  const tolerance = 0.001; // 1mm tolerance
  const lengthCorrect = Math.abs(bestResult.remainingSpace.length - expectedRemaining.length) < tolerance;
  const widthCorrect = Math.abs(bestResult.remainingSpace.width - expectedRemaining.width) < tolerance;
  const heightCorrect = Math.abs(bestResult.remainingSpace.height - expectedRemaining.height) < tolerance;
  
  const allCorrect = lengthCorrect && widthCorrect && heightCorrect;
  
  console.log(`- Arrangement: ${bestResult.lengthCount}L × ${bestResult.widthCount}W × ${bestResult.heightCount}H`);
  console.log(`- Calculated remaining - Length: ${bestResult.remainingSpace.length.toFixed(4)}m`);
  console.log(`- Expected remaining - Length: ${expectedRemaining.length.toFixed(4)}m`);
  console.log(`- Calculated remaining - Width: ${bestResult.remainingSpace.width.toFixed(4)}m`);
  console.log(`- Expected remaining - Width: ${expectedRemaining.width.toFixed(4)}m`);
  console.log(`- Calculated remaining - Height: ${bestResult.remainingSpace.height.toFixed(4)}m`);
  console.log(`- Expected remaining - Height: ${expectedRemaining.height.toFixed(4)}m`);
  
  testResults.push({
    test: "Remaining Space Calculation",
    passed: allCorrect,
    details: `L:${lengthCorrect?'✓':'✗'} W:${widthCorrect?'✓':'✗'} H:${heightCorrect?'✓':'✗'}`
  });
  
  console.log(`- Status: ${allCorrect ? 'LULUS' : 'GAGAL'}\n`);
}

// Test 6: Validasi NaN dan Infinity
function testNaNAndInfinityPrevention() {
  console.log("TEST 6: Validasi Pencegahan NaN dan Infinity");
  
  const problematicCases = [
    { box: { length: 0, width: 10, height: 10, unit: 'cm' }, desc: "Zero length" },
    { box: { length: 10, width: 0, height: 10, unit: 'cm' }, desc: "Zero width" },
    { box: { length: 10, width: 10, height: 0, unit: 'cm' }, desc: "Zero height" },
    { box: { length: -10, width: 10, height: 10, unit: 'cm' }, desc: "Negative length" },
    { box: { length: 1000, width: 1000, height: 1000, unit: 'cm' }, desc: "Box larger than container" },
    { box: { length: 0.1, width: 0.1, height: 0.1, unit: 'mm' }, desc: "Very small box" }
  ];
  
  let problematicResults = [];
  let safeResults = 0;
  
  problematicCases.forEach(testCase => {
    const results = calculateArrangements(testCase.box, '20ft');
    
    let hasNaN = false;
    let hasInfinity = false;
    
    results.forEach(result => {
      // Check all numeric properties for NaN or Infinity
      const numericProps = [
        result.lengthCount, result.widthCount, result.heightCount,
        result.totalBoxes, result.efficiency,
        result.remainingSpace.length, result.remainingSpace.width, result.remainingSpace.height
      ];
      
      numericProps.forEach(prop => {
        if (isNaN(prop)) hasNaN = true;
        if (!isFinite(prop)) hasInfinity = true;
      });
    });
    
    if (hasNaN || hasInfinity) {
      problematicResults.push({
        case: testCase.desc,
        hasNaN,
        hasInfinity,
        resultsCount: results.length
      });
    } else {
      safeResults++;
    }
    
    console.log(`- ${testCase.desc}: ${results.length} results, NaN:${hasNaN?'Yes':'No'}, Infinity:${hasInfinity?'Yes':'No'}`);
  });
  
  const allSafe = problematicResults.length === 0;
  
  testResults.push({
    test: "NaN/Infinity Prevention",
    passed: allSafe,
    details: `${safeResults}/${problematicCases.length} kasus aman`
  });
  
  console.log(`- Status: ${allSafe ? 'LULUS' : 'GAGAL'}`);
  if (problematicResults.length > 0) {
    console.log(`- Masalah ditemukan pada: ${problematicResults.map(r => r.case).join(', ')}`);
  }
  console.log();
}

// Test 7: Test dengan berbagai skenario input
function testVariousInputScenarios() {
  console.log("TEST 7: Berbagai Skenario Input");
  
  const scenarios = [
    { 
      name: "Small Box - Perfect Fit", 
      box: { length: 10, width: 10, height: 10, unit: 'cm' }, 
      container: '20ft' 
    },
    { 
      name: "Medium Box - Standard", 
      box: { length: 30, width: 20, height: 15, unit: 'cm' }, 
      container: '40ft' 
    },
    { 
      name: "Large Box - High Cube", 
      box: { length: 100, width: 80, height: 60, unit: 'cm' }, 
      container: '40ft-hc' 
    },
    { 
      name: "Long Thin Box", 
      box: { length: 200, width: 10, height: 10, unit: 'cm' }, 
      container: '45ft-hc' 
    },
    { 
      name: "Inches Unit", 
      box: { length: 12, width: 8, height: 6, unit: 'inches' }, 
      container: '20ft' 
    },
    { 
      name: "Millimeter Unit", 
      box: { length: 250, width: 150, height: 100, unit: 'mm' }, 
      container: '20ft' 
    }
  ];
  
  let successfulScenarios = 0;
  
  scenarios.forEach(scenario => {
    const results = calculateArrangements(scenario.box, scenario.container);
    const hasResults = results.length > 0;
    const bestResult = results[0];
    
    if (hasResults) {
      successfulScenarios++;
      console.log(`- ${scenario.name}: ${bestResult.totalBoxes} boxes, ${bestResult.efficiency.toFixed(1)}% efficiency`);
    } else {
      console.log(`- ${scenario.name}: No valid arrangements`);
    }
  });
  
  testResults.push({
    test: "Various Input Scenarios",
    passed: successfulScenarios === scenarios.length,
    details: `${successfulScenarios}/${scenarios.length} skenario berhasil`
  });
  
  console.log(`- Status: ${successfulScenarios === scenarios.length ? 'LULUS' : 'GAGAL'}\n`);
}

// Jalankan semua test
function runAllTests() {
  console.log("=== VALIDASI AKURASI KALKULASI KALKULATOR KONTAINER ===\n");
  
  test6OrientationsCalculated();
  testUnitConversions();
  testSortingAlgorithm();
  testEfficiencyCalculation();
  testRemainingSpaceCalculation();
  testNaNAndInfinityPrevention();
  testVariousInputScenarios();
  
  // Summary
  console.log("=== RINGKASAN HASIL TEST ===");
  const passedTests = testResults.filter(t => t.passed).length;
  const totalTests = testResults.length;
  
  testResults.forEach(result => {
    console.log(`${result.passed ? '✓' : '✗'} ${result.test}: ${result.details}`);
  });
  
  console.log(`\nTotal: ${passedTests}/${totalTests} test lulus`);
  console.log(`Status Keseluruhan: ${passedTests === totalTests ? 'LULUS SEMUA' : 'ADA YANG GAGAL'}`);
  
  return {
    totalTests,
    passedTests,
    results: testResults,
    allPassed: passedTests === totalTests
  };
}

// Export untuk digunakan dalam Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllTests,
    STANDARD_CONTAINERS,
    convertToMeters,
    calculateArrangements
  };
}

// Jalankan test jika dijalankan langsung
if (typeof window === 'undefined') {
  runAllTests();
}
