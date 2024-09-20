import * as fs from 'fs';
import * as path from 'path';

// Define the folder containing the files
const folderName = 'wallets';

// Read all the filenames in the folder
const files = fs.readdirSync(folderName).filter(file => file.endsWith('.txt'));

// Function to get lines of a file as a set
function getLinesFromFile(filePath: string): Set<string> {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    return new Set(lines); // Convert to a set for easier comparison
}

// Initialize a variable to hold the common lines (either Set<string> or null)
let commonLines: Set<string> | null = null;

// Process each file
files.forEach((file, index) => {
    const filePath = path.join(folderName, file);
    const fileLines = getLinesFromFile(filePath);

    if (index === 0) {
        // Initialize with the lines from the first file
        commonLines = fileLines;
    } else {
        // Keep only the lines that are common between the current set and the new set
        commonLines = new Set([...commonLines!].filter(line => fileLines.has(line)));
    }
});

// Convert the set of common lines back to an array and print the result
if (commonLines) {
    console.log('Common lines found in all files:');
    console.log([...commonLines].join('\n'));
} else {
    console.log('No common lines found across all files.');
}
