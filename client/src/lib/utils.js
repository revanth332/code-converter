import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function parseFileStructure(files) {
  const structure = {}

  files.forEach((file) => {
    const pathParts = file.filePath.split("/")
    let currentLevel = structure

    // Build the folder structure
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i]
      if (!currentLevel[part]) {
        currentLevel[part] = {}
      }
      currentLevel = currentLevel[part]
    }

    // Add the file at the last level
    currentLevel[pathParts[pathParts.length - 1]] = file.filePath
  })
  console.log("Parsed file structure:", structure);
  return structure
}

