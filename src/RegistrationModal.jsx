import { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import { getApiBaseUrl } from "./api/apiFetch";

function RegistrationModal({ show, setShowRegisterModal, setUserId , setIsLoggedIn ,setEmail }) {

  const [userEmail, setUserEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const node_url = getApiBaseUrl();

  const startGoogleLogin = () => {
    window.location.assign(`${node_url}/auth/google`);
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
