
import { useState } from "react"
import { ChevronRight, ChevronDown, FileIcon, FolderIcon } from "lucide-react"


export function FileExplorer({ fileStructure, onFileSelect, files }) {
  return (
    <div className="p-2 flex-1 border overflow-auto">
      {Object.entries(fileStructure).map(([folderName, content]) => (
        <FolderItem
          key={folderName}
          name={folderName}
          content={content}
          onFileSelect={onFileSelect}
          files={files}
          level={0}
        />
      ))}
    </div>
  )
}

function FolderItem({ name, content, onFileSelect, files, level }) {
  const [isOpen, setIsOpen] = useState(level < 2)

  const toggleOpen = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className="select-none">
      <div
        className="flex items-center py-1 px-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded cursor-pointer"
        onClick={toggleOpen}
        style={{ paddingLeft: `${level * 8 + 8}px` }}
      >
        <span className="mr-1">{isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
        <FolderIcon size={16} className="mr-2 text-blue-600" />
        <span className="text-sm">{name}</span>
      </div>

      {isOpen && (
        <div>
          {Object.entries(content).map(([itemName, itemContent]) => {
            if (typeof itemContent === "string") {
              // This is a file
              const file = files.find((f) => f.filePath === itemContent)
              if (!file) return null

              return <FileItem key={itemContent} file={file} onFileSelect={onFileSelect} level={level + 1} />
            } else {
              // This is a folder
              return (
                <FolderItem
                  key={itemName}
                  name={itemName}
                  content={itemContent}
                  onFileSelect={onFileSelect}
                  files={files}
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


function FileItem({ file, onFileSelect, level }) {
  return (
    <div
      className="flex items-center py-1 px-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded cursor-pointer"
      onClick={() => onFileSelect(file)}
      style={{ paddingLeft: `${level * 8 + 8 + 16}px` }}
    >
      <span><FileIcon size={16} className="mr-2 text-green-600" /></span>
      <span className="text-sm">{file.fileName}</span>
    </div>
  )
}
