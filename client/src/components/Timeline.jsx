import { CheckCircle, Circle, Loader, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

export function Timeline({ currentStage, currentSubStage = 0, stages }) {
  const [expandedStage, setExpandedStage] = useState(null);

  // Auto-expand the current stage if it has sub-stages
  if (currentStage === 2 && expandedStage !== 2) {
    setExpandedStage(2)
  }

  return (
    <div className="space-y-4 py-2">
      {stages.map((stage, index) => {
        const isCompleted = index < currentStage
        const isActive = index === currentStage
        const isPending = index > currentStage
        const hasSubStages = stage.subStages && stage.subStages.length > 0
        const isExpanded = expandedStage === index

        return (
          <div key={index} className="space-y-2">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3">
                {isCompleted ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : isActive ? (
                  <Loader className="h-6 w-6 text-blue-500 animate-spin" />
                ) : (
                  <Circle className="h-6 w-6 text-gray-300" />
                )}
              </div>

              <div className="flex flex-col flex-grow">
                <div className="flex items-center">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isCompleted && "text-green-600",
                      isActive && "text-blue-600",
                      isPending && "text-gray-500",
                    )}
                  >
                    {stage.name}
                  </span>

                  {hasSubStages && (
                    <button
                      onClick={() => setExpandedStage(isExpanded ? null : index)}
                      className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      <ChevronRight
                        className={cn("h-4 w-4 transition-transform", isExpanded && "transform rotate-90")}
                      />
                    </button>
                  )}
                </div>

                <span className="text-xs text-gray-500">{stage.description}</span>

                {index < stages.length - 1 && !isExpanded && (
                  <div className={cn("ml-3 mt-1 mb-1 w-0.5 h-6", isCompleted ? "bg-green-500" : "bg-gray-200")} />
                )}
              </div>
            </div>

            {isExpanded && hasSubStages && (
              <div className="ml-9 pl-6 border-l border-gray-200">
                {stage.subStages.map((subStage, subIndex) => {
                  const isSubCompleted = isCompleted || (isActive && subIndex < currentSubStage)
                  const isSubActive = isActive && subIndex === currentSubStage
                  const isSubPending = isPending || (isActive && subIndex > currentSubStage)

                  return (
                    <div key={subIndex} className="flex items-start mt-2">
                      <div className="flex-shrink-0 mr-3">
                        {isSubCompleted ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : isSubActive ? (
                          <Loader className="h-4 w-4 text-blue-500 animate-spin" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-300" />
                        )}
                      </div>

                      <div className="flex flex-col flex-grow">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            isSubCompleted && "text-green-600",
                            isSubActive && "text-blue-600",
                            isSubPending && "text-gray-500",
                          )}
                        >
                          {subStage.name}
                        </span>
                        <span className="text-xs text-gray-500">{subStage.description}</span>

                        {subIndex < stage.subStages.length - 1 && (
                          <div
                            className={cn("ml-2 mt-1 mb-1 w-0.5 h-4", isSubCompleted ? "bg-green-500" : "bg-gray-200")}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {index < stages.length - 1 && isExpanded && (
              <div className={cn("w-0.5 h-6 ml-12", isCompleted ? "bg-green-500" : "bg-gray-200")} />
            )}
          </div>
        )
      })}
    </div>
  )
}


// export function Timeline({ currentStage, stages }) {
//   return (
//     <div className="space-y-4 py-2">
//       {stages.map((stage, index) => {
//         const isCompleted = index < currentStage
//         const isActive = index === currentStage
//         const isPending = index > currentStage

//         return (
//           <div key={index} className="flex items-start">
//             <div className="flex-shrink-0 mr-3">
//               {isCompleted ? (
//                 <CheckCircle className="h-6 w-6 text-green-500" />
//               ) : isActive ? (
//                 <Loader className="h-6 w-6 text-blue-500 animate-spin" />
//               ) : (
//                 <Circle className="h-6 w-6 text-gray-300" />
//               )}
//             </div>

//             <div className="flex flex-col flex-grow">
//               <div className="flex items-center">
//                 <span
//                   className={cn(
//                     "text-sm font-medium",
//                     isCompleted && "text-green-600",
//                     isActive && "text-blue-600",
//                     isPending && "text-gray-500",
//                   )}
//                 >
//                   {stage.name}
//                 </span>
//               </div>

//               <span className="text-xs text-gray-500">{stage.description}</span>

//               {index < stages.length - 1 && (
//                 <div className={cn("ml-3 mt-1 mb-1 w-0.5 h-6", isCompleted ? "bg-green-500" : "bg-gray-200")} />
//               )}
//             </div>
//           </div>
//         )
//       })}
//     </div>
//   )
// }
