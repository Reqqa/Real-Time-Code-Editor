import MonacoEditor from "@monaco-editor/react";

interface Props {
  value: string;
  onChange: (val: string) => void;
  language?: string;
}

export default function Editor({ value, onChange, language = "rust" }: Props) {
  return (
    <MonacoEditor
      height="80vh"
      language={language}
      value={value}
      theme="vs-dark"
      onChange={(v) => onChange(v ?? "")}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        wordWrap: "on",
      }}
    />
  );
}