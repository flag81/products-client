/**
 * Cleans raw Gemini output and extracts valid JSON
 * @param rawOutput - The raw output from Gemini API containing JSON wrapped in markdown
 * @returns Parsed JSON object or null if parsing fails
 */
export function cleanGeminiJsonOutput(rawOutput: string): any | null {
  try {
    // Remove markdown code block markers
    let cleanedOutput = rawOutput
      .replace(/^```json\s*/i, '') // Remove opening ```json
      .replace(/\s*```\s*$/, '')   // Remove closing ```
      .trim();

    // Parse the JSON
    return JSON.parse(cleanedOutput);
  } catch (error) {
    console.error('Failed to parse Gemini JSON output:', error);
    console.error('Raw output:', rawOutput);
    return null;
  }
}

/**
 * Type-safe version that validates the expected structure
 * @param rawOutput - The raw output from Gemini API
 * @param validator - Optional validation function
 * @returns Parsed and validated JSON object
 */
export function cleanAndValidateGeminiJson<T>(
  rawOutput: string,
  validator?: (data: any) => data is T
): T | null {
  const parsed = cleanGeminiJsonOutput(rawOutput);
  
  if (parsed === null) {
    return null;
  }

  if (validator && !validator(parsed)) {
    console.error('JSON validation failed:', parsed);
    return null;
  }

  return parsed as T;
}
