import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as twilio from 'twilio';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Twilio configuration
const accountSid = functions.config().twilio.account_sid;
const authToken = functions.config().twilio.auth_token;
const twilioClient = twilio(accountSid, authToken);

// Voice application configuration
const voiceApplicationSid = functions.config().twilio.voice_application_sid;
const apiKeySid = functions.config().twilio.api_key_sid;
const apiKeySecret = functions.config().twilio.api_key_secret;

interface TokenRequest {
  userId: string;
  agentId: string;
  callType?: string;
}

interface TokenResponse {
  token: string;
  callSid?: string;
  expiresAt: number;
}

export const generateVoiceToken = functions.https.onCall(async (data: TokenRequest, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { userId, agentId, callType = 'parent_assistant' } = data;
    const callerUid = context.auth.uid;

    // Verify user permissions
    if (callerUid !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'User can only generate tokens for themselves');
    }

    // Verify user exists and has voice permissions
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userSnap.data();
    const voiceSettings = userData?.voiceSettings || {};

    if (!voiceSettings.voiceEnabled) {
      throw new functions.https.HttpsError('permission-denied', 'Voice calls are disabled for this user');
    }

    // Generate Twilio access token
    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    const token = new AccessToken(
      accountSid,
      apiKeySid,
      apiKeySecret,
      { identity: userId }
    );

    // Add voice grant
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: voiceApplicationSid,
      incomingAllow: true,
    });
    token.addGrant(voiceGrant);

    // Set token expiration (1 hour)
    token.ttl = 3600;

    // Add custom claims
    token.identity = userId;
    token.addClaim('agentId', agentId);
    token.addClaim('callType', callType);
    token.addClaim('userRole', 'parent');

    // Log token generation
    await db.collection('voice_tokens').add({
      userId,
      agentId,
      callType,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 3600 * 1000),
      ipAddress: context.rawRequest.ip,
      userAgent: context.rawRequest.headers['user-agent']
    });

    // Track analytics
    await db.collection('analytics').add({
      event: 'voice_token_generated',
      userId,
      agentId,
      callType,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        voiceEnabled: voiceSettings.voiceEnabled,
        avatarType: voiceSettings.avatarType,
        voiceQuality: voiceSettings.voiceQuality
      }
    });

    const response: TokenResponse = {
      token: token.toJwt(),
      expiresAt: Date.now() + 3600 * 1000
    };

    return response;

  } catch (error) {
    console.error('Error generating voice token:', error);
    
    // Log error
    await db.collection('errors').add({
      function: 'generateVoiceToken',
      error: error.message,
      userId: context.auth?.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      stack: error.stack
    });

    throw new functions.https.HttpsError('internal', 'Failed to generate voice token');
  }
});

// Webhook for Twilio voice events
export const voiceWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const { CallSid, CallStatus, CallDuration, RecordingUrl, RecordingSid } = req.body;

    // Verify the request is from Twilio
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

    // Log call event
    await db.collection('voice_calls').add({
      callSid: CallSid,
      status: CallStatus,
      duration: CallDuration || 0,
      recordingUrl: RecordingUrl || null,
      recordingSid: RecordingSid || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      eventData: req.body
    });

    // Update call status if call ended
    if (CallStatus === 'completed' || CallStatus === 'failed' || CallStatus === 'busy' || CallStatus === 'no-answer') {
      const callsRef = db.collection('voice_calls');
      const callQuery = await callsRef.where('callSid', '==', CallSid).limit(1).get();
      
      if (!callQuery.empty) {
        const callDoc = callQuery.docs[0];
        await callDoc.ref.update({
          endTime: admin.firestore.FieldValue.serverTimestamp(),
          finalStatus: CallStatus,
          duration: CallDuration || 0
        });
      }
    }

    // Track analytics
    await db.collection('analytics').add({
      event: 'voice_call_event',
      callSid: CallSid,
      status: CallStatus,
      duration: CallDuration || 0,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      eventData: req.body
    });

    res.status(200).send('OK');

  } catch (error) {
    console.error('Error processing voice webhook:', error);
    
    // Log error
    await db.collection('errors').add({
      function: 'voiceWebhook',
      error: error.message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      requestBody: req.body
    });

    res.status(500).send('Internal Server Error');
  }
});

// Function to revoke voice tokens
export const revokeVoiceToken = functions.https.onCall(async (data: { tokenId: string }, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { tokenId } = data;
    const userId = context.auth.uid;

    // Find and mark token as revoked
    const tokenRef = db.collection('voice_tokens').doc(tokenId);
    const tokenSnap = await tokenRef.get();

    if (!tokenSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Token not found');
    }

    const tokenData = tokenSnap.data();
    if (tokenData.userId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'Cannot revoke another user\'s token');
    }

    await tokenRef.update({
      revoked: true,
      revokedAt: admin.firestore.FieldValue.serverTimestamp(),
      revokedBy: userId
    });

    return { success: true };

  } catch (error) {
    console.error('Error revoking voice token:', error);
    throw new functions.https.HttpsError('internal', 'Failed to revoke token');
  }
});

// Cleanup expired tokens (scheduled function)
export const cleanupExpiredTokens = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  try {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    const tokensRef = db.collection('voice_tokens');
    const expiredTokens = await tokensRef
      .where('expiresAt', '<', cutoffTime)
      .where('revoked', '==', false)
      .get();

    const batch = db.batch();
    expiredTokens.docs.forEach(doc => {
      batch.update(doc.ref, {
        expired: true,
        expiredAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();

    console.log(`Cleaned up ${expiredTokens.size} expired tokens`);

  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
  }
}); 