import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react";
import { Button } from "./ui/button";

export function VersionDisplay ({ version,handleFileSelect,handleCurrentVersion }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const getChangeIcon = (changeType) => {
      switch (changeType) {
        case "modified":
          return <div className="w-2 h-2 bg-gray-500 rounded-full" />
        case "added":
          return <div className="w-2 h-2 bg-green-500 rounded-full" />
        case "deleted":
          return <div className="w-2 h-2 bg-red-500 rounded-full" />
      }
    }

    const getChangeColor = (changeType) => {
      switch (changeType) {
        case "modified":
          return "text-blue-600 dark:text-blue-400"
        case "added":
          return "text-green-600 dark:text-green-400"
        case "deleted":
          return "text-red-600 dark:text-red-400"
      }
    }

    return (
      <div className="mt-2 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition-colors"
        >
          <div className="flex items-center space-x-2">
            {/* <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
              {version.id.replace("v", "")}
            </div> */}
            <span className="text-sm font-medium">{version.id}</span>
            <span className="text-xs text-gray-500">
              {version.filesChanged.length} file{version.filesChanged.length !== 1 ? "s" : ""} changed
            </span>
          </div>
          <span className="flex items-center space-x-1 text-xs text-black">
            <button onClick={(e) => {e.preventDefault();e.stopPropagation();handleCurrentVersion(version.id)}} className="border px-2 rounded-sm bg-white">View</button>
            <ChevronRight
                className={cn("w-4 h-4 transition-transform text-gray-400", isExpanded && "transform rotate-90")}
            />
          </span>
          
        </button>

        {isExpanded && (
          <div className="px-3 space-y-2 border-t border-gray-200 dark:border-gray-700 ">
            <div className="py-2">
              {/* <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Changes made:</p> */}
              <div className="space-y-1">
                {version.filesChanged.map((change, index) => (
                  <div key={index} className="relative">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center space-x-2">
                        {/* {getChangeIcon(change.changeType)} */}
                        <div className="w-2 h-2 bg-gray-500 rounded-full" />
                        {/* <span className={cn("font-medium", getChangeColor(change.changeType))}>{change.changeType}</span> */}
                        <button onClick={() => handleFileSelect(change,"version",version.id)} className="text-gray-500 dark:text-gray-400 text-xs py-1 font-semibold hover:underline">{change.fileName}</button>
                    </span>
                    <span>
                        {change.linesChanged && <span className="text-gray-500">({change.linesChanged} lines)</span>}
                    </span>
                  </div>
                    {(index !== version.filesChanged.length - 1) && <div className={cn("mt-1 w-0.5 h-3 bg-gray-300 absolute -bottom-2 left-[3px]")} />}
                  </div>
                ))}
              </div>
              
            </div>
            {/* <div className="text-xs text-gray-500">{version.timestamp.toLocaleString()}</div> */}
          </div>
        )}
      </div>
    )
  }