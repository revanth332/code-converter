
import { useEffect, useState } from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/esm/styles/prism"
// import { useTheme } from "next-themes"


export function CodeViewer({ file }) {
  const [language, setLanguage] = useState("python")
//   const { theme } = useTheme()
  const isDarkTheme = true;

  useEffect(() => {
    // Determine language based on file extension
    const extension = file.fileName.split(".").pop()?.toLowerCase()
    switch (extension) {
      case "py":
        setLanguage("python")
        break
      case "js":
        setLanguage("javascript")
        break
      case "ts":
        setLanguage("typescript")
        break
      case "tsx":
        setLanguage("tsx")
        break
      case "jsx":
        setLanguage("jsx")
        break
      case "html":
        setLanguage("html")
        break
      case "css":
        setLanguage("css")
        break
      case "json":
        setLanguage("json")
        break
      case "java":
        setLanguage("java")
        break
      default:
        setLanguage("text")
    }
  }, [file])

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 dark:border-gray-800 flex items-center">
        <h2 className="text-lg font-semibold">{file.fileName}</h2>
        <span className="ml-2 text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">{file.filePath}</span>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <SyntaxHighlighter
          language={language}
          style={isDarkTheme ? vscDarkPlus : vs}
          showLineNumbers
          customStyle={{
            margin: 0,
            borderRadius: "4px",
            fontSize: "16px",
            backgroundColor: isDarkTheme ? "#1e1e1e" : "#ffffff",
            height: "100%",
          }}
        >
          {file.content}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}
