/**
 * Apple "Sign in with Apple JS" SDK, loaded on demand.
 *
 * The SDK used to be a blocking <script> in index.html, so every visitor paid a
 * third-party DNS lookup plus its download on the critical path even though
 * most of them never tap it. It is now fetched the first time a login button is
 * actually pressed (Home.jsx, RegistrationModal.jsx); the promise is memoised so
 * a second tap reuses the same load.
 *
 * The Content-Security-Policy already allows https://appleid.cdn-apple.com in
 * script-src (zbritje-server/server.js), so a dynamically created script needs
 * no header change.
 */
const APPLE_SDK_URL =
  "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";

/** @type {Promise<object>|null} */
let pending = null;

export function loadAppleSdk() {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.AppleID) return Promise.resolve(window.AppleID);
  if (pending) return pending;

  pending = new Promise((resolve, reject) => {
    const deadline = Date.now() + 15000;

    const fail = () => {
      pending = null; // a later tap may retry
      reject(new Error("Apple SDK unavailable"));
    };
    // Polling as well as listening: a script that already fired load/error
    // before the listener was attached never fires again, and a hung request
    // must not leave the caller waiting forever.
    const poll = () => {
      if (window.AppleID) resolve(window.AppleID);
      else if (Date.now() > deadline) fail();
      else setTimeout(poll, 150);
    };

    let script = document.querySelector("script[data-apple-sdk]");
    if (!script) {
      script = document.createElement("script");
      script.src = APPLE_SDK_URL;
      script.async = true;
      script.dataset.appleSdk = "1";
      document.head.appendChild(script);
    }
    script.addEventListener("load", poll, { once: true });
    script.addEventListener("error", fail, { once: true });
    poll();
  });

  return pending;
}
