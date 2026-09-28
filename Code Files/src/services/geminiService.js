const { GoogleGenAI } = require('@google/genai');

console.log(
  "Gemini API key loaded:",
  !!process.env.GEMINI_API_KEY
);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Use one model for both functions.
// You can change this in .env.
const MODEL =
  process.env.GEMINI_MODEL || 'gemini-3.8-flash';

/**
 * Generate Gemini response with retry handling.
 * Retries temporary 503/429 errors.
 */
const generateWithRetry = async (prompt, maxRetries = 3) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Calling Gemini (${MODEL}) - attempt ${attempt + 1}`
      );

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
      });

      return response;
    } catch (error) {
      const status =
        error?.status ||
        error?.code ||
        error?.response?.status;

      console.error(
        `Gemini error on attempt ${attempt + 1}:`,
        error.message
      );

      // Retry temporary errors
      if (
        (status === 503 || status === 429) &&
        attempt < maxRetries
      ) {
        // 2s, 4s, 8s + small random delay
        const delay =
          2000 * Math.pow(2, attempt) +
          Math.floor(Math.random() * 1000);

        console.log(
          `Gemini temporarily unavailable. Retrying in ${
            delay / 1000
          } seconds...`
        );

        await new Promise(resolve =>
          setTimeout(resolve, delay)
        );

        continue;
      }

      throw error;
    }
  }
};


/**
 * Generates a personalized workout recommendation.
 */
const generateWorkoutRecommendation = async (
  age,
  fitnessGoal,
  experience
) => {
  try {
    const prompt = `
Generate a personalized workout recommendation for a person with:

Age: ${age}
Fitness Goal: ${fitnessGoal}
Experience Level: ${experience}

Keep the recommendation extremely direct, practical, and concise.
Use 2-3 short paragraphs.
Do not include greetings.
Do not use markdown bold stars.
Do not use bullet points.
Do not include introductory phrases.
Speak directly to the user.
Provide a clear step-by-step execution plan.
`;

    const response = await generateWithRetry(prompt);

    return response.text
      ? response.text.trim()
      : 'No recommendation could be generated.';

  } catch (error) {
    console.error(
      'Gemini Recommendation Error:',
      error.message
    );

    throw new Error(
      'Failed to generate workout recommendation from Gemini AI'
    );
  }
};


/**
 * Generates personalized fitness insights.
 */
const generateFitnessInsights = async (
  totalWorkouts,
  averageDuration,
  totalCaloriesBurned
) => {
  try {
    const prompt = `
Analyze this user's fitness progress and generate a highly personalized,
encouraging fitness insight:

Total Workouts Logged: ${totalWorkouts}
Average Workout Duration: ${averageDuration} minutes
Total Calories Burned: ${totalCaloriesBurned} kcal

Keep the insight extremely direct, actionable, and concise.
Use 2-3 sentences.
Do not include greetings.
Do not use markdown bold stars.
Do not use bullet points.
Do not include introductory phrases.
Provide guidance on what to adjust or continue.
`;

    const response = await generateWithRetry(prompt);

    return response.text
      ? response.text.trim()
      : 'No insight could be generated.';

  } catch (error) {
    console.error(
      'Gemini Insights Error:',
      error.message
    );

    throw new Error(
      'Failed to generate fitness insights from Gemini AI'
    );
  }
};


module.exports = {
  generateWorkoutRecommendation,
  generateFitnessInsights,
};
