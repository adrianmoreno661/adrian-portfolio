import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCrOZ0XyHP03QuAYT9mf9vPDOYuyTy4eYQ",
    authDomain: "adrian-portfolio-95f29.firebaseapp.com",
    projectId: "adrian-portfolio-95f29",
    storageBucket: "adrian-portfolio-95f29.firebasestorage.app",
    messagingSenderId: "753950857797",
    appId: "1:753950857797:web:16ea32738201775458212c",
    measurementId: "G-85Q9LTKQK5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);