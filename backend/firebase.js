import admin from "firebase-admin";
import serviceAccount from "./gioco-spotify-firebase-adminsdk-fbsvc-75ef64ab90.json" with { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

export { db, admin };