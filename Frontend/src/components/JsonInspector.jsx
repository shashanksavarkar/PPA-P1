import { useState } from "react";

const JsonInspector = ({ data, label }) => {
  const [expanded, setExpanded] = useState(false);

  if (data === null) return <span className="text-gray-500">null</span>;
  if (data === undefined) return <span className="text-gray-500">undefined</span>;

  const type = typeof data;
  if (type === "string") {
    return <span className="text-neon-green">"{data}"</span>;
  }
  if (type === "number") {
    return <span className="text-yellow-500">{data}</span>;
  }
  if (type === "boolean") {
    return <span className="text-blue-500">{data ? "true" : "false"}</span>;
  }

  const isArray = Array.isArray(data);
  const keys = Object.keys(data);

  return (
    <div className="pl-2 inline-block font-[family-name:var(--font-family-code)]">
      <span
        onClick={() => setExpanded(!expanded)}
        className="cursor-pointer select-none text-text-secondary inline-flex items-center gap-1"
      >
        <span className="text-[0.6rem] w-2">{expanded ? "▼" : "▶"}</span>
        <span className="font-semibold text-text-primary">
          {label ? `${label}: ` : ""}{isArray ? `Array(${data.length})` : "Object"}
        </span>
        <span className="text-text-secondary opacity-50">
          {isArray ? "[" : "{"} {!expanded && `... ${isArray ? "]" : "}"}`}
        </span>
      </span>

      {expanded && (
        <div className="border-l border-dashed border-border ml-1 pl-2">
          {keys.map(key => (
            <div key={key} className="my-0.5 flex gap-1">
              <span className="text-accent shrink-0">{key}:</span>
              <JsonInspector data={data[key]} />
            </div>
          ))}
          <span className="text-text-secondary opacity-50 block">
            {isArray ? "]" : "}"}
          </span>
        </div>
      )}
    </div>
  );
};

export default JsonInspector;
