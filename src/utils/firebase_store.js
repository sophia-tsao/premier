
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig} from "./f_config";



// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Create Firestore instance
export const db = getFirestore(app);


