import {  useRef,useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, Copy, Save, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Editor } from "@monaco-editor/react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { toast } from "sonner"
// interface TabbedMonacoEditorProps {
//   openFiles: FileData[]
//   activeFileId: string | null
//   onFileSelect: (fileId: string) => void
//   onFileClose: (fileId: string) => void
//   onFileSave: (updatedFile: FileData) => void
// }

export function TabbedEditor({
  openFiles,
  activeFileId,
  onFileSelect,
  onFileClose,
  onFileSave,
  hasChanges,
  setHasChanges,
  setCode
}) {
    const editorRef = useRef(null);

    function handleEditorDidMount(editor) {
        editorRef.current = editor;
      }

  if (openFiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2">No files open</p>
          <p className="text-sm">Select a file from the explorer to start editing code</p>
        </div>
      </div>
    )
  }

  const activeFile = openFiles.find((file) => file.filePath === activeFileId);


  const getLanguageFromExtension = (fileName) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    switch (extension) {
      case "py":
        return "python"
      case "js":
        return "javascript"
      case "ts":
        return "typescript"
      case "tsx":
        return "typescript"
      case "jsx":
        return "javascript"
      case "html":
        return "html"
      case "css":
        return "css"
      case "json":
        return "json"
      case "md":
        return "markdown"
      case "xml":
        return "xml"
      case "yaml":
      case "yml":
        return "yaml"
      case "sql":
        return "sql"
      case "php":
        return "php"
      case "java":
        return "java"
      case "cpp":
      case "cc":
      case "cxx":
        return "cpp"
      case "c":
        return "c"
      case "cs":
        return "csharp"
      case "go":
        return "go"
      case "rs":
        return "rust"
      case "rb":
        return "ruby"
      case "swift":
        return "swift"
      case "kt":
        return "kotlin"
      default:
        return "plaintext"
    }
  }

  const handlCodeChange = (value) => {
    if(value !== activeFile.content){
      setHasChanges(true);
      setCode(value);
    }
    else{
      setHasChanges(false);
    }
  }

  return (
    <div className="flex flex-col h-full w-full rounded-e-lg ">
      {/* Tabs */}
      <div className="flex-shrink-0 flex bg-white dark:bg-gray-900 rounded-e-lg ">
        <ScrollArea className="flex-1">
          <div className="flex">
            {openFiles.map((file) => (
              <div
                key={file.filePath}
                className={cn(
                  "flex items-center px-3 py-2 cursor-pointer group min-w-0 max-w-48 flex-shrink-0 relative",
                  activeFileId === file.filePath
                    ? "bg-gray-50 dark:bg-gray-800 border-b-2 border-blue-500"
                    : "hover:bg-gray-100 bg-white dark:hover:bg-gray-800",
                )}
                onClick={() => onFileSelect(file.filePath)}
              >
                <span className="text-sm truncate flex-1 mr-2">{file.fileName}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    onFileClose(file.filePath)
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
                {(hasChanges && file.filePath === activeFileId) && <span className="absolute h-2 w-2 bg-green-400 rounded-full right-6 top-3"></span>}
              </div>
            ))}
            
          </div>
        </ScrollArea>
      </div>

      {/* Monaco Editor Content */}
      <div className="flex-1 min-h-0 w-full overflow-hidden">
        {activeFile ? (
          <div className="h-full w-full flex flex-col">
            <div className="flex justify-between items-center p-2">
                <div className="flex gap-2">
                    <Breadcrumb>
                      <BreadcrumbList>
                      {
                        activeFile.filePath?.split("/").map((part, index) => {
                          if(index != activeFile.filePath.split("/").length - 1) return(
                          <>
                            <BreadcrumbItem key={index}>
                              <BreadcrumbLink
                                onClick={() => {
                                  const newPath = activeFile.filePath
                                    .split("/")
                                    .slice(0, index + 1)
                                    .join("/");
                                  onFileSelect(newPath);
                                }}
                              >
                                {part}
                              </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                          </>)
                          else return (
                            <BreadcrumbPage key={index}>
                              {part}
                            </BreadcrumbPage>
                          )
                        })
                      }
                      </BreadcrumbList>
                    </Breadcrumb>
                    {/* <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">{activeFile.filePath}</span> */}
                </div>
              
            </div>
            <div className="h-full p-2 rounded-lg">
              <Editor onChange={value => handlCodeChange(value)} value={activeFile.content} onMount={handleEditorDidMount}   language={getLanguageFromExtension(activeFile.fileName)} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            Select a tab to view and edit the file content
          </div>
        )}
      </div>
    </div>
  )
}
