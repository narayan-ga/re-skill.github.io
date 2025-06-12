// netlify/functions/submit-feedback.js

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK only once
// We use a global variable to store the initialized app
// This avoids re-initializing on every function invocation (improves performance)
if (!admin.apps.length) {
    // Decode the base64 encoded service account key from environment variable
    // This is how you securely provide credentials to your Netlify Function
    const serviceAccountJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(serviceAccountJson);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

exports.handler = async (event, context) => {
    // Set CORS headers for preflight requests (OPTIONS) and actual requests
    // Netlify often handles this automatically, but explicit headers are good.
    const headers = {
        'Access-Control-Allow-Origin': '*', // IMPORTANT: Replace with your specific GitHub Pages/Netlify domain for production
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: headers,
            body: '',
        };
    }

    // Only allow POST requests for actual submission
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: headers,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    let roleSuggestion;
    try {
        // Parse the request body (it will be JSON from your frontend)
        const body = JSON.parse(event.body);
        roleSuggestion = body.roleSuggestion;
    } catch (parseError) {
        console.error('Error parsing request body:', parseError);
        return {
            statusCode: 400,
            headers: headers,
            body: JSON.stringify({ message: 'Invalid JSON in request body.' }),
        };
    }

    // Basic validation
    if (!roleSuggestion || typeof roleSuggestion !== 'string' || roleSuggestion.trim() === '') {
        return {
            statusCode: 400,
            headers: headers,
            body: JSON.stringify({ message: 'Invalid input: roleSuggestion is required and must be a non-empty string.' }),
        };
    }

    try {
        // Add the document to the 'role_suggestions' collection in Firestore
        await db.collection('role_suggestions').add({
            suggestion: roleSuggestion.trim(),
            timestamp: admin.firestore.FieldValue.serverTimestamp(), // Use server timestamp for accuracy
        });

        // Send a success response
        return {
            statusCode: 200,
            headers: headers,
            body: JSON.stringify({ message: 'Role suggestion stored successfully!' }),
        };
    } catch (error) {
        console.error('Error storing role suggestion:', error);
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({ message: 'Internal Server Error: Could not store suggestion.' }),
        };
    }
};
