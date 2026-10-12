import { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import { getApiBaseUrl } from "./api/apiFetch";
import { loadAppleSdk } from "./utils/appleSdk";

function RegistrationModal({ show, setShowRegisterModal, setUserId , setIsLoggedIn ,setEmail }) {

  const [userEmail, setUserEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const node_url = getApiBaseUrl();

  const startGoogleLogin = () => {
    window.location.assign(`${node_url}/auth/google`);
  };

  const startAppleLogin = async () => {
    try {
      // Loaded on demand (src/utils/appleSdk.js); the SDK is no longer a
      // blocking <script> in index.html.
      try {
        await loadAppleSdk();
      } catch {
        alert("Apple login nuk u ngarkua. Kontrollo lidhjen dhe provo përsëri.");
        return;
      }

      window.AppleID.auth.init({
        clientId: import.meta.env.VITE_APPLE_CLIENT_ID || "com.meniven.web",
        scope: "email",
        usePopup: true,
      });

      const response = await window.AppleID.auth.signIn();
      const idToken = response?.authorization?.id_token;
      if (!idToken) throw new Error("Missing Apple id_token");

      const res = await fetch(`${node_url}/auth/apple/callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id_token: idToken }),
      });
      if (!res.ok) throw new Error(`Apple callback failed (${res.status})`);

      // Clear stale anonymous header token so the fresh Apple cookie session wins.
      localStorage.removeItem("token");
      localStorage.removeItem("jwtToken");

      const sessionResponse = await fetch(`${node_url}/check-session`, {
        method: "GET",
        credentials: "include",
      });
      const session = await sessionResponse.json();

      setUserId(session?.userId ?? null);
      setIsLoggedIn(Boolean(session?.isLoggedIn));
      setEmail(session?.email || "");
      setShowRegisterModal(false);
    } catch (error) {
      console.error("[AppleLogin] error", error);
      if (error?.error !== "popup_closed_by_user") {
        alert("Hyrja me Apple dështoi. Provo përsëri.");
      }
    }
  };

  const sendVerificationCode = async () => {

    console.log("Sending verification request for:", userEmail); // ✅ Debugging log

    //check if email is valid
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(userEmail)) {
        alert("Ju lutem shkruani nje email te sakte.");
        return;
    }



    try {
        const response = await fetch(`${node_url}/auth/send-verification-code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",  // ✅ Ensures cookies/session are included
            body: JSON.stringify({ email: userEmail }),
        });

        const data = await response.json();
        if (data.success) {
            setIsVerifying(true);
        } else {
            alert("Failed to send verification code.");
        }
    } catch (error) {
        console.error("Error sending verification code:", error);
    }
};



  const verifyCode = async () => {
    try {
      const response = await fetch(`${node_url}/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: userEmail, code: verificationCode }),
      });

      const data = await response.json();
      if (data.success) {
        // The app may still have a stale anonymous token in localStorage.
        // Clear it so cookie-based authenticated session is used immediately.
        localStorage.removeItem("token");
        localStorage.removeItem("jwtToken");

        // Hydrate UI from canonical cookie session response.
        const sessionResponse = await fetch(`${node_url}/check-session`, {
          method: "GET",
          credentials: "include",
        });
        const session = await sessionResponse.json();

        setUserId(session?.userId ?? data.userId ?? null);
        setIsLoggedIn(Boolean(session?.isLoggedIn || data?.success));
        setEmail(session?.email || userEmail);
        setShowRegisterModal(false);
      } else {
        alert("Kodi i verifikimit i pasakt.");
      }
    } catch (error) {
      console.error("Error verifying code:", error);
    }
  };

  return (
    <Modal show={show} onHide={() => setShowRegisterModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>{isLoginMode ? "Hyrja" : "Hyrja"} me Email</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!isVerifying ? (
          <>
            <Form.Group>
              <Form.Label>Email Adresa juaj</Form.Label>
              <Form.Control
                type="email"
                placeholder="Sheno email-in tend"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            </Form.Group>
            <Button onClick={sendVerificationCode} className="mt-2" style={{ marginRight: "10px" }}>
              {isLoginMode ? "Dergo kod-in per Hyrje " : "Dergo Kod-in  per Hyrje"}
            </Button>

            <Button variant="outline-dark" onClick={startGoogleLogin} className="mt-2">
              Hyr me Google
            </Button>

            <Button
              onClick={startAppleLogin}
              className="mt-2"
              style={{ background: "#000000", borderColor: "#000000", marginLeft: "10px" }}
            >
               Hyr me Apple
            </Button>

          </>
        ) : (
          <>
            <Form.Group>
              <Form.Label>Sheno kodin e verifikimit</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
            </Form.Group>
            <Button onClick={verifyCode} className="mt-2">
              Verifiko
            </Button>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
}

export default RegistrationModal;
