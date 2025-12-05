
import { GoogleGenAI, Content, FunctionDeclaration, Type } from "@google/genai";
import { Message, Goal, MoodEntry, UserProfile, Sender, MoodType } from '../types';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const CHAT_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-2.5-flash-image";

/**
 * Constructs a system instruction based on the user's current context.
 */
const buildSystemInstruction = (
  profile: UserProfile,
  goals: Goal[],
  recentMoods: MoodEntry[],
  globalMemory: string,
  language: string // New parameter
): string => {
  const activeGoals = goals.filter(g => !g.completed).map(g => `- ${g.text}`).join('\n');
  const recentMood = recentMoods.length > 0 ? recentMoods[0].mood : 'unknown';
  
  // --- INTELLIGENT ANALYSIS START ---
  // "Shows intelligence WITHOUT much extra code"
  let insights = "";

  // 1. Mood Pattern Analysis
  // Check if last 2 entries exist and are negative
  const negativeMoods = [MoodType.BAD, MoodType.TERRIBLE];
  if (recentMoods.length >= 2) {
    const lastTwoBad = recentMoods.slice(0, 2).every(m => negativeMoods.includes(m.mood));
    if (lastTwoBad) {
      insights += "- OBSERVATION: The user has recorded low/bad moods for the last couple of entries. \n  -> ACTION: Gently acknowledge this pattern. Say something like 'Your mood has been low lately.' and offer a specific relaxation tip or a breathing exercise.\n";
    }
  }

  // 2. Goal Streak Analysis
  const completedCount = goals.filter(g => g.completed).length;
  if (completedCount >= 3) {
    insights += `- OBSERVATION: The user has completed ${completedCount} goals recently. \n  -> ACTION: Celebrate this consistency! You can say 'You've been crushing your goals lately!' or mention a streak.\n`;
  } else if (goals.length > 0 && completedCount === goals.length) {
    insights += "- OBSERVATION: The user has completed ALL their daily goals. \n  -> ACTION: Congratulate them enthusiastically on finishing everything.\n";
  }
  // --- INTELLIGENT ANALYSIS END ---
  
  const userDetails = `
    Age: ${profile.age || 'Not specified'}
    Occupation: ${profile.occupation || 'Not specified'}
    Life Goal/Bio: ${profile.bio || 'Not specified'}
  `;

  // Map language codes to readable names for the AI prompt
  const langMap: Record<string, string> = {
    'en-US': 'English',
    'hi-IN': 'Hindi',
    'kn-IN': 'Kannada'
  };
  const targetLang = langMap[language] || 'English';

  return `
    You are Lumi, a warm, supportive, and empathetic AI companion.
    
    USER PROFILE:
    Name: ${profile.name}
    ${userDetails}
    
    CURRENT CONTEXT:
    - Active Goals: 
    ${activeGoals || "No active goals right now."}
    - Last Recorded Mood: ${recentMood}

    INTELLIGENT INSIGHTS (Proactive things you noticed):
    ${insights}

    GLOBAL MEMORY (Snippets from previous conversations):
    ${globalMemory || "No previous chat history."}
    
    INSTRUCTIONS:
    - Act as an Emotional Analyst. Analyze the user's input text (which is often spoken voice) for tone, sentiment, and intensity.
    - Classify their current state into one of these labels: [Sad, Happy, Confused, Stressed, Calm, Angry, Excited, Neutral].
    - START your response with a tag: [MOOD: <Label>]. For example: "[MOOD: Stressed] I hear that you are overwhelmed..."
    
    - **PROACTIVE BEHAVIOR**: Check the 'INTELLIGENT INSIGHTS' section above. If there is an observation, naturally weave it into your response. For example, if they have a streak of goals, mention it. If they have been sad for days, check on them.
    
    - **LANGUAGE REQUIREMENT**: The user has selected **${targetLang}**. You MUST reply in **${targetLang}**.
      - **English**: maintain a warm, conversational tone.
      - **Hindi**: Use Devanagari script. You may use English words (Hinglish) if it feels natural for a friendly chat.
      - **Kannada**: Use Kannada script. Keep the tone respectful yet friendly.
    
    CONVERSATION RULES:
    - Be conversational, brief, and warm. Like a caring friend.
    - Tailor your advice based on their occupation and age.
    - Keep text responses short (under 3 sentences) unless asked for deep advice.

    TOOL USAGE (IMAGES & GOALS):
    1. **Images**: If the user asks to generate an image, draw something, or create an avatar, use the 'generate_image' tool.
    2. **Goals**: If the user asks to set a daily goal or task:
       - **CRITICAL**: If they did NOT specify a duration or time (e.g., "for 30 mins", "at 5pm"), you MUST ASK them: "How long would you like to spend on that?" or "When would you like to do that?".
       - **ONLY** when you have the task AND the timing/duration, use the 'add_goal' tool.
       - Example: User: "Add reading." -> You: "How long?" -> User: "20 mins" -> You: Call add_goal("Reading (20 mins)").
  `;
};

// Define the tool for image generation
const generateImageTool: FunctionDeclaration = {
  name: 'generate_image',
  description: 'Generate an image, drawing, or avatar based on a text description.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: {
        type: Type.STRING,
        description: 'The detailed visual description of the image or avatar to generate.',
      },
    },
    required: ['prompt'],
  },
};

// Define the tool for adding goals
const addGoalTool: FunctionDeclaration = {
  name: 'add_goal',
  description: 'Add a new item to the user\'s daily goal list.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      goal_text: {
        type: Type.STRING,
        description: 'The description of the goal, including duration if specified (e.g. "Read for 30 mins").',
      },
    },
    required: ['goal_text'],
  },
};

export const generateResponse = async (
  history: Message[],
  newMessage: string,
  profile: UserProfile,
  goals: Goal[],
  recentMoods: MoodEntry[],
  globalMemory: string,
  language: string = 'en-US'
): Promise<{ text: string, image?: string, detectedMood?: string, goalToAdd?: string }> => {
  
  try {
    const systemInstruction = buildSystemInstruction(profile, goals, recentMoods, globalMemory, language);

    // Convert internal message format to Gemini Content format
    const contents: Content[] = history.map(msg => ({
      role: msg.sender === Sender.USER ? 'user' : 'model',
      parts: [{ text: msg.text + (msg.image ? ' [Image Generated]' : '') }]
    }));

    // Add the new message
    contents.push({
      role: 'user',
      parts: [{ text: newMessage }]
    });

    // 1. Call Chat Model with Tools
    const result = await ai.models.generateContent({
      model: CHAT_MODEL,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        tools: [{ functionDeclarations: [generateImageTool, addGoalTool] }],
      }
    });

    // 2. Check for Function Calls
    const functionCalls = result.functionCalls;
    
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      
      // Handle Image Generation
      if (call.name === 'generate_image') {
        const imagePrompt = call.args['prompt'] as string;
        try {
          const imageResponse = await ai.models.generateContent({
            model: IMAGE_MODEL,
            contents: { parts: [{ text: imagePrompt }] },
            config: { imageConfig: { aspectRatio: "1:1" } }
          });

          for (const part of imageResponse.candidates![0].content.parts) {
            if (part.inlineData) {
              const base64Data = part.inlineData.data;
              const mimeType = part.inlineData.mimeType || 'image/png';
              const imageUrl = `data:${mimeType};base64,${base64Data}`;
              return {
                text: `Here is the image I created for you based on: "${imagePrompt}"`,
                image: imageUrl,
                detectedMood: 'Creative'
              };
            }
          }
        } catch (imgError) {
          console.error("Image generation failed:", imgError);
          return { text: "I tried to generate that image, but something went wrong with my creative tools." };
        }
      } 
      
      // Handle Goal Addition
      else if (call.name === 'add_goal') {
        const goalText = call.args['goal_text'] as string;
        return {
          text: `I've added "${goalText}" to your daily goals. You can do this!`,
          goalToAdd: goalText,
          detectedMood: 'Productive'
        };
      }
    }

    // Default Text Response Processing
    let rawText = result.text || "I'm here for you.";
    let detectedMood = undefined;

    // Parse [MOOD: Label] tag
    const moodMatch = rawText.match(/^\[MOOD:\s*([a-zA-Z\s]+)\]\s*/);
    if (moodMatch) {
      detectedMood = moodMatch[1].trim();
      rawText = rawText.replace(moodMatch[0], '');
    }

    return { 
      text: rawText,
      detectedMood: detectedMood
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "I'm having a little trouble connecting to my thoughts. Let's try again in a moment." };
  }
};
