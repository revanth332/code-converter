import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileExplorer } from "./FileExplorer"
import { ChatInterface } from "./ChatInterface"
import { parseFileStructure } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowLeft, DownloadCloud } from "lucide-react"
import { TabbedEditor } from "./TabbedEditor"
import UpdateLoader from "./UpdateLoader"
import axios from "axios"
import { useState } from "react";
import { toast } from "sonner"
// import { ThemeToggle } from "@/components/theme-toggle"

// interface CodeExplorerProps {
//   files: FileData[]
//   setFiles: (files: FileData[]) => void
//   onBack?: () => void
// }

export default function CodeExplorer({ files, setFiles, onBack,openFiles,setOpenFiles, messages,handleModificationRequest,activeFileId,setActiveFileId,modificationLoading }) {
  const fileStructure = parseFileStructure(files)
  const [hasChanges,setHasChanges] = useState(false);

  const handleFileSelect = (file) => {
    // Add to open files if not already open
    if(hasChanges){
      toast.warning("You have unsaved changes in the current file.")
    }
    else{
      if (!openFiles.find((f) => f.filePath === file.filePath)) {
        setOpenFiles((prev) => [...prev, file])
      }
      setActiveFileId(file.filePath)
    }

  }

  const handleFileClose = (fileId) => {
    setOpenFiles((prev) => prev.filter((f) => f.filePath !== fileId))
    if (activeFileId === fileId) {
      const remainingFiles = openFiles.filter((f) => f.filePath !== fileId)
      setActiveFileId(remainingFiles.length > 0 ? remainingFiles[remainingFiles.length - 1].filePath : null)
    }
  }

  const handleTabSelect = (fileId) => {
    setActiveFileId(fileId)
  }

  const handleFileSave = (updatedFile) => {
    // Update the files state
    setFiles(files.map((file) => (file.filePath === updatedFile.filePath ? updatedFile : file)))

    // Update the open files
    setOpenFiles((prev) => prev.map((file) => (file.filePath === updatedFile.filePath ? updatedFile : file)))
  }

    const handleDownloadCode = async () => {
    try{
      const response = await axios.post('http://localhost:8001/v1/api/convert/download', {files},{
        responseType: 'blob', // Important: Set the response type to 'blob'
      });
      console.log(response);
      const blob = await response.data;
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "flask_app.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }
    catch(err){
      console.log("Error downloading code:", err)
    }
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 w-full">
      {/* Header */}
      <div className="px-2 py-3 flex items-center justify-between w-full h-[6%]">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button variant="ghost" onClick={onBack} size={"sm"} className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {/* Back to Converter */}
            </Button>
          )}
          <h1 className="text-lg font-semibold">Code Explorer & Editor</h1>
        </div>
        <Button size={"sm"} variant={"ghost"} onClick={handleDownloadCode}><DownloadCloud className="h-4 w-4 mr-2" />Download</Button>
        {/* <ThemeToggle /> */}
      </div>

      <div className="flex px-2 pb-2 gap-2 h-[94%] w-full">
        {/* Section 1: Chat Interface */}
        <div className="w-96 flex-shrink-0 bg-white dark:bg-gray-800 border rounded-lg">
          <Card className="h-full border-0">
            {/* <CardHeader className="pb-2">
              <CardTitle className="text-lg">AI Assistant</CardTitle>
            </CardHeader> */}
            <CardContent className="p-0 h-full">
              <ChatInterface activeFileId={activeFileId} openFiles={openFiles} onModificationRequest={handleModificationRequest} messages={messages} />
            </CardContent>
          </Card>
        </div>
          <div className="flex-1 flex min-w-0 relative border rounded-lg">
                {modificationLoading && <div className="rounded-lg absolute top-0 left-0 z-10 bg-white h-full w-full">
                  <UpdateLoader />
                  <div className="absolute top-[60%] w-full flex justify-center text-gray-900 font-semibold">
                    Generating {openFiles.find((f) => f.filePath === activeFileId)?.filePath}
                  </div>
                </div>}
                <div className="w-80 flex-shrink-0 bg-white border-r dark:bg-gray-800 rounded-lg">
                  <Card className="h-full rounded-r-none border-0 bg-gray-50">
                    {/* <CardHeader className="pb-2">
                      <CardTitle className="text-lg">File Explorer</CardTitle>
                    </CardHeader> */}
                    <CardContent className="p-0 h-[calc(100%-80px)] overflow-auto">
                      <FileExplorer
                        fileStructure={fileStructure}
                        files={files}
                        openFiles={openFiles}
                        onFileSelect={handleFileSelect}
                      />
                    </CardContent>
                  </Card>
                </div>

                <div className="flex-1 min-w-0 ">
                  <Card className="h-full rounded-none border-0">
                    <CardContent className="p-0 h-full w-full">
                      <TabbedEditor
                        hasChanges={hasChanges}
                        setHasChanges={setHasChanges}
                        openFiles={openFiles}
                        activeFileId={activeFileId}
                        onFileSelect={handleTabSelect}
                        onFileClose={handleFileClose}
                        onFileSave={handleFileSave}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
      </div>
    </div>
  )
}
