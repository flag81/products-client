/**
 * Extracts and parses a JSON object from a string that may contain markdown code fences.
 *
 * @param rawOutput The raw string output from a service like Gemini,
 * which may wrap JSON in ```json ... ```.
 * @returns A parsed JavaScript object, or null if no valid JSON is found or parsing fails.
 */
export function extractAndParseJson(rawOutput: string): any | null {
  try {
    // Regex to find a JSON block wrapped in ```json ... ```
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = rawOutput.match(jsonRegex);

    let jsonString: string | null = null;

    if (match && match[1]) {
      // Found a markdown-fenced JSON block
      jsonString = match[1];
    } else {
      // Fallback: If no fences are found, try to find the first '{' and last '}'
      const startIndex = rawOutput.indexOf('{');
      const endIndex = rawOutput.lastIndexOf('}');
      if (startIndex !== -1 && endIndex > startIndex) {
        jsonString = rawOutput.substring(startIndex, endIndex + 1);
      }
    }

    if (jsonString) {
      // Trim whitespace and parse the JSON string
      return JSON.parse(jsonString.trim());
    }

    console.warn('No JSON object found in the provided string.');
    return null;
  } catch (error) {
    console.error('Failed to parse JSON from string:', error);
    console.error('Raw string:', rawOutput);
    return null;
  }
}
