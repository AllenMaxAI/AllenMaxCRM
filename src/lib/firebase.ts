import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  projectId: "crm-allenmax",
  appId: "1:67886134392:web:09d90492a1353d4edf298d",
  storageBucket: "crm-allenmax.firebasestorage.app",
  apiKey: "AIzaSyAkdIjqfWcqaA7o54FTYR0tYEaZb6gJntE",
  authDomain: "crm-allenmax.firebaseapp.com",
  messagingSenderId: "67886134392"
};

const app = initializeApp(firebaseConfig);

// Initialize App Check only on client side
if (typeof window !== "undefined") {
  // Allow debugging in localhost/ngrok during testing phase
  if (window.location.hostname === "localhost" || window.location.hostname.includes("ngrok")) {
    (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LfivtQsAAAAAMte4ClGoZiXMMY3uByA9Wp4_4cp"),
    isTokenAutoRefreshEnabled: true
  });
}

export const db = getFirestore(app);
export const auth = getAuth(app);
