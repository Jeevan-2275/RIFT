import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate content using Gemini model.
 * @param {string} prompt - Prompt to send to Gemini.
 * @param {object} [options] - Optional generation options.
 * @returns {Promise<string>} Generated text.
 */
export const generateContent = async (prompt, options = {}) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro', ...options });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.error('Gemini generation error:', err);
    throw err;
  }
};
