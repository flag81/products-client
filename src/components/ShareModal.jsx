import { useState } from "react";
import { FiShare2, FiCopy, FiCheck, FiX } from "react-icons/fi";
import { FaWhatsapp, FaFacebookF, FaTwitter, FaTelegramPlane, FaEnvelope } from "react-icons/fa";

const socialTargets = [
  { name: "WhatsApp", url: (u) => `https://wa.me/?text=${encodeURIComponent(u)}`, icon: FaWhatsapp, bg: "#25D366" },
  {
    name: "Facebook",
    url: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
    icon: FaFacebookF,
    bg: "#1877F2",
  },
  {
    name: "X (Twitter)",
    url: (u) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}`,
    icon: FaTwitter,
    bg: "#000000",
  },
  {
    name: "Telegram",
    url: (u) => `https://t.me/share/url?url=${encodeURIComponent(u)}`,
    icon: FaTelegramPlane,
    bg: "#229ED9",
  },
  {
    name: "Email",
    url: (u) => `mailto:?subject=${encodeURIComponent("Fletushka")}&body=${encodeURIComponent(u)}`,
    icon: FaEnvelope,
    bg: "#64748b",
  },
];

export default function ShareModal({ product, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!product) return null;

  const link = `${window.location.origin}/product/${product.productId}`;

  const copyLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const ta = document.createElement("textarea");
        ta.value = link;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: "Fletushka", url: link });
    } catch (err) {
      // user cancelled the native share sheet
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1300,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#ffffff",
          borderRadius: 14,
          padding: "18px 16px 16px",
          boxShadow: "0 18px 50px rgba(0,0,0,0.25)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Mbylle"
          style={{
            position: "absolute",
            top: 10,
            right: 12,
            background: "none",
            border: "none",
            fontSize: 22,
            lineHeight: 1,
            color: "#334155",
            cursor: "pointer",
            padding: 4,
          }}
        >
          <FiX />
        </button>

        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#172033" }}>Ndaj produktin</h3>
        {product.storeName && (
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13,
              color: "#64748b",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {product.storeName}
            {product.product_description ? ` · ${product.product_description}` : ""}
          </p>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <input
            readOnly
            value={link}
            onFocus={(e) => e.target.select()}
            style={{
              flex: 1,
              minWidth: 0,
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 12,
              color: "#334155",
              background: "#f8fafc",
            }}
          />
          <button
            onClick={copyLink}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: "none",
              borderRadius: 8,
              padding: "0 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              background: copied ? "#16a34a" : "#2563eb",
              color: "#fff",
              whiteSpace: "nowrap",
            }}
          >
            {copied ? <FiCheck size={15} /> : <FiCopy size={15} />}
            {copied ? "U kopjua!" : "Kopjo"}
          </button>
        </div>

        {typeof navigator !== "undefined" && navigator.share && (
          <button
            onClick={nativeShare}
            style={{
              width: "100%",
              marginTop: 10,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "9px 0",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              background: "#f8fafc",
              color: "#172033",
            }}
          >
            <FiShare2 size={16} /> Ndaj me aplikacionet e telefonit…
          </button>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginTop: 12 }}>
          {socialTargets.map((target) => {
            const Icon = target.icon;
            return (
              <a
                key={target.name}
                href={target.url(link)}
                target="_blank"
                rel="noopener noreferrer"
                title={target.name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 5,
                  textDecoration: "none",
                  padding: "8px 2px",
                  borderRadius: 8,
                  background: "#f8fafc",
                }}
              >
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: target.bg,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={17} />
                </span>
                <span style={{ fontSize: 10, color: "#334155" }}>{target.name}</span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}