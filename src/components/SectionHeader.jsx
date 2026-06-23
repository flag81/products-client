import React from "react";

export default function SectionHeader({ title, style }) {
  return (
    <div
      className="select-description"
      style={{
        marginLeft: 5,
        marginRight: 5,
        border: "1px solid #ccc",
        padding: 3,
        borderRadius: 5,
        marginBottom: 20,
        marginTop: 20,
        ...(style || {}),
      }}
    >
      <span style={{ fontWeight: "bold", fontSize: 18 }}>{title}</span>
    </div>
  );
}
