import { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";

function RegistrationModal({ show, setShowRegisterModal, setUserId , setIsLoggedIn }) {

  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const node_url = import.meta.env.VITE_NODE_URL;

  const sendVerificationCode = async () => {

    console.log("Sending verification request for:", email); // ✅ Debugging log

    try {
        const response = await fetch(`${node_url}/auth/send-verification-code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",  // ✅ Ensures cookies/session are included
            body: JSON.stringify({ email }),
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
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await response.json();
      if (data.success) {
        setUserId(data.userId); // Update userId in Home.jsx
        setIsLoggedIn(true); // Update isLoggedIn in Home.jsx
        setShowRegisterModal(false);
      } else {
        alert("Invalid verification code.");
      }
    } catch (error) {
      console.error("Error verifying code:", error);
    }
  };

  return (
    <Modal show={show} onHide={() => setShowRegisterModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>{isLoginMode ? "Login" : "Register"} with Email</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!isVerifying ? (
          <>
            <Form.Group>
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>
            <Button onClick={sendVerificationCode} className="mt-2">
              {isLoginMode ? "Send Login Code" : "Send Registration Code"}
            </Button>
            <Button onClick={sendVerificationCode} className="mt-2 padding-10">
              Google Login
            </Button>
          </>
        ) : (
          <>
            <Form.Group>
              <Form.Label>Enter Verification Code</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
            </Form.Group>
            <Button onClick={verifyCode} className="mt-2">
              Verify
            </Button>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
}

export default RegistrationModal;
