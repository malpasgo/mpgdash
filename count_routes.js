// Count all routes and categorize them
const select = document.querySelector('select');
if (select) {
    const allOptions = Array.from(select.options);
    console.log('=== ROUTE ANALYSIS ===');
    console.log('Total routes found:', allOptions.length);
    
    // Categorize routes
    const categories = {
        'Asia Pacific': 0,
        'Middle East': 0, 
        'Europe': 0,
        'Americas': 0,
        'Africa': 0,
        'Other': 0
    };
    
    const asiaPacific = ['Singapore', 'Malaysia', 'Thailand', 'Philippines', 'Vietnam', 'Hong Kong', 'China', 'South Korea', 'Japan', 'Indonesia', 'India', 'Bangladesh'];
    const middleEast = ['UAE', 'Qatar', 'Saudi Arabia', 'Kuwait', 'Oman'];
    const europe = ['Germany', 'Netherlands', 'United Kingdom', 'France', 'Italy', 'Spain', 'Belgium', 'Poland', 'Russia', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Portugal'];
    const americas = ['USA', 'Canada', 'Brazil', 'Argentina', 'Chile', 'Peru', 'Colombia', 'Ecuador', 'Uruguay', 'Mexico', 'Venezuela', 'Panama', 'Costa Rica'];
    const africa = ['South Africa', 'Egypt', 'Morocco', 'Nigeria', 'Kenya'];
    
    allOptions.forEach(option => {
        const text = option.textContent.trim();
        let categorized = false;
        
        for (let country of asiaPacific) {
            if (text.includes(country)) {
                categories['Asia Pacific']++;
                categorized = true;
                break;
            }
        }
        
        if (!categorized) {
            for (let country of middleEast) {
                if (text.includes(country)) {
                    categories['Middle East']++;
                    categorized = true;
                    break;
                }
            }
        }
        
        if (!categorized) {
            for (let country of europe) {
                if (text.includes(country)) {
                    categories['Europe']++;
                    categorized = true;
                    break;
                }
            }
        }
        
        if (!categorized) {
            for (let country of americas) {
                if (text.includes(country)) {
                    categories['Americas']++;
                    categorized = true;
                    break;
                }
            }
        }
        
        if (!categorized) {
            for (let country of africa) {
                if (text.includes(country)) {
                    categories['Africa']++;
                    categorized = true;
                    break;
                }
            }
        }
        
        if (!categorized) {
            categories['Other']++;
        }
    });
    
    console.log('Categories breakdown:');
    Object.entries(categories).forEach(([category, count]) => {
        console.log(`${category}: ${count}`);
    });
    
    console.log('\nAll routes:');
    allOptions.forEach((option, index) => {
        console.log(`${index + 1}. ${option.textContent.trim()}`);
    });
}
