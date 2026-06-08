import { useState } from "react";

const JsonInspector = ({ data, label }) => {
  const [expanded, setExpanded] = useState(false);

  if (data === null) return <span style={{ color: "#808080" }}>null</span>;
  if (data === undefined) return <span style={{ color: "#808080" }}>undefined</span>;

  const type = typeof data;
  if (type === "string") {
    return <span style={{ color: "var(--neon-green)" }}>"{data}"</span>;
  }
  if (type === "number") {
    return <span style={{ color: "#eab308" }}>{data}</span>;
  }
  if (type === "boolean") {
    return <span style={{ color: "#3b82f6" }}>{data ? "true" : "false"}</span>;
  }

  const isArray = Array.isArray(data);
  const keys = Object.keys(data);

  return (
    <div style={{ paddingLeft: "8px", display: "inline-block", fontFamily: "var(--code-font)" }}>
      <span 
        onClick={() => setExpanded(!expanded)} 
        style={{ cursor: "pointer", userSelect: "none", color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: "4px" }}
      >
        <span style={{ fontSize: "0.6rem", width: "8px" }}>{expanded ? "▼" : "▶"}</span>
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {label ? `${label}: ` : ""}{isArray ? `Array(${data.length})` : "Object"}
        </span>
        <span style={{ color: "var(--text-secondary)", opacity: 0.5 }}>
          {isArray ? "[" : "{"} {!expanded && `... ${isArray ? "]" : "}"}`}
        </span>
      </span>

      {expanded && (
        <div style={{ borderLeft: "1px dashed var(--border-color)", marginLeft: "4px", paddingLeft: "8px" }}>
          {keys.map(key => (
            <div key={key} style={{ margin: "2px 0", display: "flex", gap: "4px" }}>
              <span style={{ color: "var(--accent-color)", flexShrink: 0 }}>{key}:</span>
              <JsonInspector data={data[key]} />
            </div>
          ))}
          <span style={{ color: "var(--text-secondary)", opacity: 0.5, display: "block" }}>
            {isArray ? "]" : "}"}
          </span>
        </div>
      )}
    </div>
  );
};

export default JsonInspector;
