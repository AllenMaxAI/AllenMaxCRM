import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || 'crm-allenmax';
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    // Si tenemos credenciales completas, las usamos (Ideal para producción)
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    console.log('--- Firebase Admin initialized with Service Account ---');
  } else {
    // Si no tenemos llaves (tu caso), inicializamos solo con el Project ID.
    // Esto es suficiente para verificar ID Tokens del frontend de forma segura.
    admin.initializeApp({
      projectId,
    });
    console.log('--- Firebase Admin initialized with Project ID only (Public Key Verification) ---');
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
