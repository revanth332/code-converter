"use client"

import { useState } from "react"
import { FileExplorer } from "./FileExplorer"
import { CodeViewer } from "./CodeViewer"
import { parseFileStructure } from "@/lib/utils"
import { DownloadCloud, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import axios from "axios"
// import { ThemeToggle } from "@/components/theme-toggle"

// Sample data - in a real app, this would come from an API or props


export default function CodeExplorer({files,onBack}) {
  const [selectedFile, setSelectedFile] = useState(null)
  const fileStructure = parseFileStructure(files)

  const handleFileSelect = (file) => {
    setSelectedFile(file)
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
    <main className="flex h-screen bg-gray-50 dark:bg-gray-900 border">
      <div className="w-1/5 min-w-[250px] border-r border-gray-200 dark:border-gray-800 overflow-auto flex flex-col bg-slate-100">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-semibold">File Explorer</h2>
          {/* <ThemeToggle /> */} 
            <span title="Upload Zip"><Upload className="h-5 w-5 text-slate-600 cursor-pointer" onClick={onBack} /></span>
        </div>
        <FileExplorer fileStructure={fileStructure} onFileSelect={handleFileSelect} files={files} />
        <div className="p-3 flex">
          <Button onClick={handleDownloadCode}  className="w-full"><DownloadCloud className="h-5 w-5 mr-2" />  Download Code</Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto ">
        {selectedFile ? (
          <CodeViewer file={selectedFile} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>Select a file to view its content</p>
          </div>
        )}
      </div>
    </main>
  )
}
