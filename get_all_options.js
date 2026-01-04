// Script to get all options from select element
const selectElement = document.querySelector('select');
if (selectElement) {
    const options = Array.from(selectElement.options).map(option => ({
        value: option.value,
        text: option.textContent.trim()
    }));
    console.log('Total options:', options.length);
    console.log('All options:', JSON.stringify(options, null, 2));
} else {
    console.log('Select element not found');
}
