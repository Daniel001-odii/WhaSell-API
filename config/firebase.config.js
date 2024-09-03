// SETUP FIREBASE FILE STORAGE CREDENTIALS AND CONNECTION
const admin = require("firebase-admin");
const serviceAccount = require("../utils/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://test-for-mongo.appspot.com"
});

const bucket = admin.storage().bucket();


module.exports = { bucket };
