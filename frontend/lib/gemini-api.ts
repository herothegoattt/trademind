const GEMINI_API_KEY = 'AIzaSyBYw8yF1EcJvYUpDhAZncaijDpeMSKISfY';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export async function sendMessageToGemini(message: string, conversationHistory: Message[] = []): Promise<string> {
  try {
    // Prepare conversation context
    const contents = [
      ...conversationHistory.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [
            {
              text: 'Ты AI Trading Coach от TradeMind - профессиональный советник по торговле. Помогай пользователям принимать умные торговые решения, анализировать эмоции в торговле, управлять рисками и избегать психологических ошибок. Отвечай по-русски кратко и конкретно, с практическими советами. Будь позитивным и поддерживающим.',
            },
          ],
        },
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    }

    throw new Error('No response from Gemini API');
  } catch (error) {
    console.error('Error communicating with Gemini API:', error);
    throw error;
  }
}
