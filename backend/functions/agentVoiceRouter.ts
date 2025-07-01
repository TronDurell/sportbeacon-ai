import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as twilio from 'twilio';
import { Configuration, OpenAIApi } from 'openai';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Twilio configuration
const accountSid = functions.config().twilio.account_sid;
const authToken = functions.config().twilio.auth_token;
const twilioClient = twilio(accountSid, authToken);

// OpenAI configuration
const openaiConfig = new Configuration({
  apiKey: functions.config().openai.api_key,
});
const openai = new OpenAIApi(openaiConfig);

interface VoiceCallRequest {
  CallSid: string;
  From: string;
  To: string;
  CallStatus: string;
  SpeechResult?: string;
  Confidence?: string;
  RecordingUrl?: string;
  userId?: string;
  agentId?: string;
}

interface AIResponse {
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  suggestedActions?: string[];
}

export const handleVoiceCall = functions.https.onRequest(async (req, res) => {
  try {
    const callData: VoiceCallRequest = req.body;
    const { CallSid, From, To, SpeechResult, Confidence, userId, agentId } = callData;

    console.log('Voice call received:', { CallSid, From, SpeechResult });

    // Verify Twilio signature
    const signature = req.headers['x-twilio-signature'];
    const url = `https://${req.headers.host}${req.url}`;
    const params = req.body;

    const isValid = twilio.validateRequest(
      authToken,
      signature as string,
      url,
      params
    );

    if (!isValid) {
      console.error('Invalid Twilio signature');
      res.status(403).send('Forbidden');
      return;
    }

    // Log incoming call
    await logCallEvent('incoming_call', callData);

    // Handle different call events
    if (req.body.DialCallStatus === 'completed' || req.body.DialCallStatus === 'answered') {
      // Call was answered, start conversation
      const twiml = await generateWelcomeResponse();
      res.type('text/xml');
      res.send(twiml.toString());
    } else if (SpeechResult) {
      // Process speech input
      const aiResponse = await processSpeechInput(SpeechResult, userId, agentId);
      const twiml = await generateAIResponse(aiResponse, CallSid);
      res.type('text/xml');
      res.send(twiml.toString());
    } else {
      // Initial call setup
      const twiml = await generateInitialResponse();
      res.type('text/xml');
      res.send(twiml.toString());
    }

  } catch (error) {
    console.error('Error handling voice call:', error);
    
    // Log error
    await logError('handleVoiceCall', error, req.body);
    
    // Send error response
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('I apologize, but I\'m having trouble processing your request. Please try again later.');
    twiml.hangup();
    
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

async function processSpeechInput(speechText: string, userId?: string, agentId?: string): Promise<AIResponse> {
  try {
    // Get user context if available
    let userContext = '';
    if (userId) {
      const userRef = db.collection('users').doc(userId);
      const userSnap = await userRef.get();
      if (userSnap.exists) {
        const userData = userSnap.data();
        userContext = `User: ${userData.name}, Children: ${userData.children?.length || 0}`;
      }
    }

    // Prepare prompt for OpenAI
    const prompt = `
You are a friendly Town Rec AI Assistant helping parents with youth sports questions.

${userContext ? `Context: ${userContext}` : ''}

Parent said: "${speechText}"

Respond in a warm, helpful tone. Keep responses concise (under 30 seconds when spoken).
If relevant, mention their children by name and upcoming events.

Response:`;

    // Get AI response
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful Town Rec AI Assistant for parents. Keep responses warm, concise, and informative.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    });

    const aiText = completion.data.choices[0]?.message?.content || 'I apologize, but I didn\'t understand that. Could you please repeat your question?';

    // Analyze sentiment
    const sentiment = await analyzeSentiment(aiText);

    // Log interaction
    await logVoiceInteraction({
      userId,
      agentId,
      speechText,
      aiResponse: aiText,
      sentiment,
      confidence: parseFloat(Confidence || '0')
    });

    return {
      text: aiText,
      sentiment,
      confidence: parseFloat(Confidence || '0')
    };

  } catch (error) {
    console.error('Error processing speech input:', error);
    return {
      text: 'I apologize, but I\'m having trouble understanding right now. Please try again.',
      sentiment: 'neutral',
      confidence: 0
    };
  }
}

async function analyzeSentiment(text: string): Promise<'positive' | 'negative' | 'neutral'> {
  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Analyze the sentiment of the following text. Respond with only: positive, negative, or neutral.'
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 10,
      temperature: 0.1
    });

    const sentiment = completion.data.choices[0]?.message?.content?.toLowerCase().trim();
    return (sentiment === 'positive' || sentiment === 'negative') ? sentiment : 'neutral';

  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return 'neutral';
  }
}

async function generateWelcomeResponse(): Promise<string> {
  const twiml = new twilio.twiml.VoiceResponse();
  
  twiml.say({
    voice: 'alice',
    language: 'en-US'
  }, 'Hello! I\'m your Town Rec AI Assistant. I\'m here to help you with questions about your child\'s sports activities. What would you like to know?');
  
  twiml.gather({
    input: 'speech',
    timeout: 10,
    speechTimeout: 'auto',
    action: '/voice/process',
    method: 'POST'
  });

  return twiml.toString();
}

async function generateInitialResponse(): Promise<string> {
  const twiml = new twilio.twiml.VoiceResponse();
  
  twiml.say({
    voice: 'alice',
    language: 'en-US'
  }, 'Welcome to Town Rec AI Assistant. I\'m here to help you with your child\'s sports activities.');
  
  twiml.gather({
    input: 'speech',
    timeout: 10,
    speechTimeout: 'auto',
    action: '/voice/process',
    method: 'POST'
  });

  return twiml.toString();
}

async function generateAIResponse(aiResponse: AIResponse, callSid: string): Promise<string> {
  const twiml = new twilio.twiml.VoiceResponse();
  
  // Speak the AI response
  twiml.say({
    voice: 'alice',
    language: 'en-US'
  }, aiResponse.text);

  // Ask if they need anything else
  twiml.say({
    voice: 'alice',
    language: 'en-US'
  }, 'Is there anything else I can help you with?');

  // Gather more input
  const gather = twiml.gather({
    input: 'speech',
    timeout: 8,
    speechTimeout: 'auto',
    action: '/voice/process',
    method: 'POST'
  });

  // If no input, end call gracefully
  gather.say({
    voice: 'alice',
    language: 'en-US'
  }, 'Thank you for calling Town Rec AI Assistant. Have a great day!');

  twiml.hangup();

  return twiml.toString();
}

async function logCallEvent(eventType: string, callData: any) {
  try {
    await db.collection('voice_call_events').add({
      eventType,
      callData,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging call event:', error);
  }
}

async function logVoiceInteraction(interaction: {
  userId?: string;
  agentId?: string;
  speechText: string;
  aiResponse: string;
  sentiment: string;
  confidence: number;
}) {
  try {
    await db.collection('voice_interactions').add({
      ...interaction,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging voice interaction:', error);
  }
}

async function logError(functionName: string, error: any, requestData?: any) {
  try {
    await db.collection('errors').add({
      function: functionName,
      error: error.message,
      stack: error.stack,
      requestData,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (logError) {
    console.error('Error logging error:', logError);
  }
}

// Webhook for call status updates
export const callStatusWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const { CallSid, CallStatus, CallDuration, RecordingUrl } = req.body;

    // Verify Twilio signature
    const signature = req.headers['x-twilio-signature'];
    const url = `https://${req.headers.host}${req.url}`;
    const params = req.body;

    const isValid = twilio.validateRequest(
      authToken,
      signature as string,
      url,
      params
    );

    if (!isValid) {
      console.error('Invalid Twilio signature');
      res.status(403).send('Forbidden');
      return;
    }

    // Update call status
    await db.collection('voice_calls').add({
      callSid: CallSid,
      status: CallStatus,
      duration: CallDuration || 0,
      recordingUrl: RecordingUrl || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      eventData: req.body
    });

    // Track analytics
    await db.collection('analytics').add({
      event: 'call_status_update',
      callSid: CallSid,
      status: CallStatus,
      duration: CallDuration || 0,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).send('OK');

  } catch (error) {
    console.error('Error processing call status webhook:', error);
    res.status(500).send('Internal Server Error');
  }
}); 