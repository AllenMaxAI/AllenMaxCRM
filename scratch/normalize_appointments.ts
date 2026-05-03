import { db } from './src/lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const CLINIC_ID = "OkfqLr3tVyRgAEBGAqlgBbatOGU2";

async function normalizeData() {
  console.log("Starting normalization...");
  const appointmentsRef = collection(db, "users", CLINIC_ID, "appointments");
  const snapshot = await getDocs(appointmentsRef);
  
  console.log(`Found ${snapshot.size} appointments to check.`);
  
  for (const d of snapshot.docs) {
    const data = d.data();
    let updates: any = {};
    
    // 1. Fix clinic_id
    if (data.clinic_id !== CLINIC_ID) {
      updates.clinic_id = CLINIC_ID;
    }
    
    // 2. Fix start_time if it's just "HH:mm"
    if (data.start_time && data.start_time.length === 5 && data.start_time.includes(':')) {
      // It's a short time format. We don't know the date, so we'll assume it's a test or old data.
      // For now, let's just log it. In a real scenario, we might want to attach it to a default date.
      console.log(`Warning: Appointment ${d.id} has no date: ${data.start_time}`);
    }
    
    if (Object.keys(updates).length > 0) {
      console.log(`Updating appointment ${d.id}:`, updates);
      await updateDoc(d.ref, updates);
    }
  }
  console.log("Normalization complete.");
}

normalizeData().catch(console.error);
