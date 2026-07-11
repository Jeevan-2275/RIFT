import { generateContent } from '../config/gemini.js';

/**
 * Analyze an activity request using Gemini AI.
 * @param {Object} payload - Details of the activity request.
 * @returns {Promise<Object>} { riskScore, riskLevel, verdict, reasoning }
 */
export const analyzeActivity = async (payload) => {
  const prompt = `You are an AI Guardian for a digital passport system. Evaluate the following request:

${JSON.stringify(payload, null, 2)}

Return a JSON object with the keys:
- riskScore (0-1000)
- riskLevel (LOW, MEDIUM, HIGH, CRITICAL)
- verdict (approved, rejected)
- reasoning (short explanation)`;

  const responseText = await generateContent(prompt);
  try {
    const result = JSON.parse(responseText);
    return result;
  } catch (err) {
    // If Gemini didn't return JSON, fallback to safe defaults
    console.error('Gemini response parsing error:', err);
    return {
      riskScore: 500,
      riskLevel: 'MEDIUM',
      verdict: 'rejected',
      reasoning: 'Unable to parse AI response, defaulting to reject.',
    };
  }
};
