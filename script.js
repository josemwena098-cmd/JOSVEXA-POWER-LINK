import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  set,
  push,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";

/*
  JOSVEXA POWER LINK
  Firebase configuration is kept in this file for the starter build.
*/

const firebaseConfig = {
  apiKey: "AIzaSyBBxoWODxEVasA8fZmPECXW9nYNzWb1rsk",
  authDomain: "josvexa.firebaseapp.com",
  databaseURL: "https://josvexa-default-rtdb.firebaseio.com",
  projectId: "josvexa",
  storageBucket: "josvexa.firebasestorage.app",
  messagingSenderId: "39054488898",
  appId: "1:39054488898:web:7f2b596d285661fcfb04db",
  measurementId: "G-XJZB5V5T0L"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const $ = (id) => document.getElementById(id);

const statusEl = $("status");
const authMessage = $("authMessage");
const loginBtn = $("loginBtn");
const logoutBtn = $("logoutBtn");

function status(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#ff7b91" : "#00eaff";
}

function clean(value) {
  return String(value || "").trim();
}

function makeLinkId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now();
}

/* ---------------- AUTH ---------------- */

$("registerBtn").addEventListener("click", async () => {
  const email = clean($("email").value);
  const password = $("password").value;
  const fullName = clean($("fullName").value);
  const phone = clean($("phone").value);

  if (!email || !password || !fullName || !phone) {
    status("Jaza email, password, jina na namba ya simu.", true);
    return;
  }

  if (password.length < 6) {
    status("Password lazima iwe na angalau characters 6.", true);
    return;
  }

  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(result.user, {
      displayName: fullName
    });

    await set(ref(db, `users/${result.user.uid}`), {
      uid: result.user.uid,
      name: fullName,
      email: result.user.email,
      phone: phone,
      provider: "email",
      createdAt: serverTimestamp()
    });

    status("Account imetengenezwa. Karibu JOSVEXA Power Link!");
  } catch (error) {
    status(error.message, true);
  }
});

$("emailLoginBtn").addEventListener("click", async () => {
  const email = clean($("email").value);
  const password = $("password").value;

  if (!email || !password) {
    status("Weka email na password.", true);
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    status("Umeingia kwenye account.");
  } catch (error) {
    status(error.message, true);
  }
});

$("googleBtn").addEventListener("click", async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    const user = result.user;

    await set(ref(db, `users/${user.uid}`), {
      uid: user.uid,
      name: user.displayName || "",
      email: user.email || "",
      phone: user.phoneNumber || "",
      provider: "google",
      updatedAt: serverTimestamp()
    });

    status("Google login imefanikiwa.");
  } catch (error) {
    status(error.message, true);
  }
});

loginBtn.addEventListener("click", () => {
  $("authSection").scrollIntoView({ behavior: "smooth" });
});

$("getStartedBtn").addEventListener("click", () => {
  $("authSection").scrollIntoView({ behavior: "smooth" });
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  status("Umetoka kwenye account.");
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    authMessage.textContent =
      `Umeingia kama ${user.displayName || user.email}.`;
  } else {
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    authMessage.textContent = "Login with email/password or Google.";
  }
});

/* ---------------- POWER LINK GENERATOR ---------------- */

$("powerLinkForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const user = auth.currentUser;

  if (!user) {
    status("Kwanza login au register ili utengeneze Power Link.", true);
    $("authSection").scrollIntoView({ behavior: "smooth" });
    return;
  }

  const title = clean($("linkTitle").value);
  const description = clean($("description").value);
  const redirectUrl = clean($("redirectUrl").value);
  const theme = $("theme").value;

  const features = [...document.querySelectorAll('input[name="feature"]:checked')]
    .map((input) => input.value);

  if (!features.length) {
    status("Chagua angalau feature moja: Camera, Voice, Video au Location.", true);
    return;
  }

  try {
    const linkId = makeLinkId();

    const linkData = {
      id: linkId,
      ownerUid: user.uid,
      title,
      description,
      features,
      redirectUrl,
      theme,
      createdAt: serverTimestamp(),
      active: true
    };

    await set(ref(db, `powerLinks/${linkId}`), linkData);

    /*
      This starter uses the current page as the destination.
      Later we will create a dedicated /power-link.html?id=... page.
    */
    const url = `${window.location.origin}${window.location.pathname}?powerLink=${encodeURIComponent(linkId)}`;

    $("generatedLink").value = url;
    $("generatedLinkBox").classList.remove("hidden");

    status("Power Link imetengenezwa na kuhifadhiwa Firebase.");
  } catch (error) {
    status(error.message, true);
  }
});

$("copyLinkBtn").addEventListener("click", async () => {
  const link = $("generatedLink").value;

  try {
    await navigator.clipboard.writeText(link);
    status("Power Link imenakiliwa.");
  } catch {
    $("generatedLink").select();
    document.execCommand("copy");
    status("Power Link imenakiliwa.");
  }
});

/* ---------------- CAMERA PERMISSION TEST ---------------- */

$("demoBtn").addEventListener("click", async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    status("Browser hii haitumii camera API au page haiko kwenye HTTPS/localhost.", true);
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    status("Camera permission imeruhusiwa. Tutaunganisha capture kwenye Power Link hatua inayofuata.");
  } catch (error) {
    status("Camera haikuruhusiwa: " + error.message, true);
  }
});
