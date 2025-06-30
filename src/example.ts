import { extractAndParseJson } from './utils/jsonUtils';

// The raw output string from Gemini as provided in the prompt
const rawGeminiOutput = `Raw Gemini Output: \`\`\`json
{"endDate": "2025-06-23"}
\`\`\``;

// Use the utility function to clean the raw output and get a valid JSON object
const jsonData = extractAndParseJson(rawGeminiOutput);

if (jsonData) {
  console.log('Successfully parsed JSON:');
  console.log(jsonData); // Expected output: { endDate: '2025-06-23' }

  // You can now safely access properties from the parsed object
  console.log('End Date:', jsonData.endDate); // Expected output: 2025-06-23
} else {
  console.log('Failed to parse JSON from the raw output.');
}
