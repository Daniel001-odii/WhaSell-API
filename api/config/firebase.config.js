// SETUP FIREBASE FILE STORAGE CREDENTIALS AND CONNECTION
const admin = require("firebase-admin");
// const serviceAccount = require("../utils/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
  // storageBucket: "gs://test-for-mongo.appspot.com"
  storageBucket: `gs://${process.env.FIREBASE_PROJECT_ID}.appspot.com`
});


// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   storageBucket: "gs://test-for-mongo.appspot.com" //storage bucket url
// });

const bucket = admin.storage().bucket();

// Add a global variable for platform fees (percentage, e.g., 10 for 10%)
const PLATFORM_FEE_PERCENTAGE = 10; // Change this value as needed

module.exports = {
  bucket,
  PLATFORM_FEE_PERCENTAGE,
};
