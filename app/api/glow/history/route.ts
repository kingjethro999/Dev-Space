import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';

// IMPORTANT: This API route uses Firebase client SDK which respects Firestore security rules.
// Update your Firestore security rules to allow server-side access to glow_chat_history:
//
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /glow_chat_history/{userId} {
//       allow read, write: if request.auth != null && request.auth.uid == userId;
//     }
//   }
// }
//
// OR use Firebase Admin SDK (bypasses rules) for server-side API routes.

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date | Timestamp;
}

/**
 * GET /api/glow/history?userId=xxx
 * Retrieve chat history for a user
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get chat history from Firestore
    // IMPORTANT: The client SDK respects Firestore security rules.
    // Since this is server-side, ensure your Firestore rules allow read access
    // to glow_chat_history collection, OR use Firebase Admin SDK (bypasses rules).
    const historyRef = doc(db, 'glow_chat_history', userId);
    const historySnap = await getDoc(historyRef);

    if (!historySnap.exists()) {
      return NextResponse.json({ history: [] });
    }

    const data = historySnap.data();
    const messages = data.messages || [];
    
    if (!Array.isArray(messages)) {
      console.warn('Messages is not an array:', typeof messages, messages);
      return NextResponse.json({ history: [] });
    }
    
    const history = messages.map((msg: any) => {
      // Handle different timestamp formats
      let timestamp: string;
      
      try {
        if (!msg || typeof msg !== 'object') {
          console.warn('Invalid message format:', msg);
          timestamp = new Date().toISOString();
        } else if (msg.timestamp?.toDate && typeof msg.timestamp.toDate === 'function') {
          // Firestore Timestamp with toDate method
          timestamp = msg.timestamp.toDate().toISOString();
        } else if (msg.timestamp instanceof Timestamp) {
          timestamp = msg.timestamp.toDate().toISOString();
        } else if (msg.timestamp instanceof Date) {
          timestamp = msg.timestamp.toISOString();
        } else if (typeof msg.timestamp === 'string') {
          timestamp = msg.timestamp;
        } else if (msg.timestamp?.seconds) {
          // Firestore Timestamp object with seconds property
          timestamp = new Date(msg.timestamp.seconds * 1000).toISOString();
        } else {
          console.warn('Unknown timestamp format:', msg.timestamp);
          timestamp = new Date().toISOString();
        }
      } catch (e) {
        console.error('Error processing timestamp:', e, msg);
        timestamp = new Date().toISOString();
      }

      return {
        role: msg.role || 'user',
        content: msg.content || '',
        timestamp: timestamp
      };
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log full error for debugging
    console.error('Full error details:', {
      message: errorMessage,
      stack: errorStack,
      error: error
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch chat history',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/glow/history
 * Save chat history for a user
 * Body: { userId: string, messages: ChatMessage[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, messages } = body;

    if (!userId || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'User ID and messages array are required' },
        { status: 400 }
      );
    }

    // Convert Date strings to Timestamps for Firestore
    const firestoreMessages = messages.map((msg: ChatMessage) => {
      let timestamp: Timestamp;
      
      if (msg.timestamp instanceof Timestamp) {
        // Already a Timestamp, use as-is
        timestamp = msg.timestamp;
      } else if (msg.timestamp instanceof Date) {
        // Convert Date to Timestamp
        timestamp = Timestamp.fromDate(msg.timestamp);
      } else if (typeof msg.timestamp === 'string') {
        // Convert ISO string to Timestamp
        timestamp = Timestamp.fromDate(new Date(msg.timestamp));
      } else {
        // Fallback to current time
        timestamp = Timestamp.now();
      }
      
      return {
        role: msg.role,
        content: msg.content,
        timestamp: timestamp
      };
    });

    // Save to Firestore
    const historyRef = doc(db, 'glow_chat_history', userId);
    await setDoc(historyRef, {
      userId,
      messages: firestoreMessages,
      updatedAt: Timestamp.now()
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving chat history:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to save chat history',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/glow/history?userId=xxx
 * Clear chat history for a user
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Delete chat history from Firestore
    const historyRef = doc(db, 'glow_chat_history', userId);
    await deleteDoc(historyRef);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat history:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to delete chat history',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

