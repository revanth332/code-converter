"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, FileIcon, FolderIcon } from "lucide-react"
import { cn } from "@/lib/utils"


export function FileExplorer({ fileStructure, onFileSelect, files, openFiles }) {
  return (
    <div>
      {/* <div className="bg-white p-3 rounded-lg border-b rounded-e-none rounded-b-none">
        <h3 className="font-semibold text-sm">Code</h3>
        <div className="text-xs text-gray-500 mb-2">
          {files.length} files • {openFiles.length} open
        </div>
      </div> */}

      <div className="p-2">
        {Object.entries(fileStructure).map(([folderName, content]) => (
          <FolderItem
            key={folderName}
            name={folderName}
            content={content}
            onFileSelect={onFileSelect}
            files={files}
            openFiles={openFiles}
            level={0}
          />
        ))}
      </div>
    </div>
  )
}


function FolderItem({ name, content, onFileSelect, files, openFiles, level }) {
  const [isOpen, setIsOpen] = useState(level < 2)

  const toggleOpen = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className="select-none">
      <div
        className="flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer"
        onClick={toggleOpen}
        style={{ paddingLeft: `${level * 8 + 8}px` }}
      >
        <span className="mr-1">{isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
        <FolderIcon size={16} className="mr-2 text-yellow-500" />
        <span className="text-sm">{name}</span>
      </div>

      {isOpen && (
        <div>
          {Object.entries(content).map(([itemName, itemContent]) => {
            if (typeof itemContent === "string") {
              // This is a file
              const file = files.find((f) => f.filePath === itemContent)
              if (!file) return null

              return (
                <FileItem
                  key={itemContent}
                  file={file}
                  onFileSelect={onFileSelect}
                  level={level + 1}
                  isOpen={openFiles.some((f) => f.filePath === file.filePath)}
                />
              )
            } else {
              // This is a folder
              return (
                <FolderItem
                  key={itemName}
                  name={itemName}
                  content={itemContent}
                  onFileSelect={onFileSelect}
                  files={files}
                  openFiles={openFiles}
                  level={level + 1}
                />
              )
            }
          })}
        </div>
      )}
    </div>
  )
}


function FileItem({ file, onFileSelect, level, isOpen }) {
  return (
    <div
      className={cn(
        "flex items-center  hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer my-1",
      )}
      onClick={() => onFileSelect(file,"explorer")}
      style={{ paddingLeft: `${level * 8 + 8 + 16}px` }}
    >
      <p className={cn("w-full flex items-center py-1 px-2 rounded-md",isOpen && "bg-gray-100 dark:bg-blue-900/20")}>
        <FileIcon size={16} className="mr-2 text-gray-500" />
      <span className={cn("text-sm", isOpen && "font-medium text-gray-600 dark:text-blue-400")}>{file.fileName}</span>
      </p>
      
    </div>
  )
}
