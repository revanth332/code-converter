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
  return structure
}

// --- Dependency Parsers for Each Language ---

/**
 * Parses Python dependencies from code content.
 * Handles `from .module import symbol` and `import library`.
 */
function parsePythonDependencies(content, allFilePaths) {
    const dependencies = [];
    const fromImportRegex = /^from\s+([\w.]+)\s+import/gm;
    const directImportRegex = /^import\s+([\w.,\s]+)/gm;
    
    let match;
    while ((match = fromImportRegex.exec(content)) !== null) {
        console.log(match);

        const modulePath = match[1].substring(match[1].lastIndexOf(".")+1)+ '.py';
        // const modulePath = match[1].replace(/\./g, '/')+ '.py';
        // const symbols = match[2].replace(/[()\s]/g, '').split(',');
        // Basic resolution: assumes relative paths resolve within the project
        const isLocal = allFilePaths.some(f => f.endsWith(modulePath));
        console.log(allFilePaths,modulePath,isLocal);
        const dependencyType = isLocal ? 'local' : 'external';
        const dependencyPath = isLocal 
            ? allFilePaths.find(p => p.endsWith(modulePath)) 
            : modulePath;
        //  symbols.forEach(symbol => {
        //     if (symbol) {
        //         dependencies.push({
        //             symbol: symbol,
        //             path: dependencyPath,
        //             type: dependencyType
        //         });
        //     }
        // });
        dependencies.push({
                    path: dependencyPath,
                    type: dependencyType
                });
        // dependencies.push({ path: match[1], type: isLocal ? 'local' : 'external' });
    }
    while ((match = directImportRegex.exec(content)) !== null) {
        const libs = match[1].split(',').map(s => s.trim());
        libs.forEach(lib => dependencies.push({ path: lib, type: 'external' }));
    }
    return dependencies;
}

/**
 * Parses JavaScript dependencies from code content.
 * Handles `require('...')` and `import ... from '...'`.
 */
function parseJsDependencies(content) {
    const dependencies = [];
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    const importRegex = /import(?:.+from)?\s+['"]([^'"]+)['"]/g;

    let match;
    const processMatch = (match) => {
        const path = match[1];
        // In Node.js, local modules typically start with './' or '../'.
        const type = path.startsWith('.') ? 'local' : 'external';
        dependencies.push({ path, type });
    };
    
    while ((match = requireRegex.exec(content)) !== null) processMatch(match);
    while ((match = importRegex.exec(content)) !== null) processMatch(match);
    
    return dependencies;
}

/**
 * Parses Java dependencies from code content.
 * Uses a root package name to distinguish local vs. external.
 */
function parseJavaDependencies(content, options = {}) {
    const dependencies = [];
    const importRegex = /^import\s+([\w.]+);/gm;
    const { javaRootPackage = 'com.mycompany.app' } = options; // Default or user-provided root

    let match;
    while ((match = importRegex.exec(content)) !== null) {
        const path = match[1];
        // If the import starts with the project's root package, it's local.
        const type = path.startsWith(javaRootPackage) ? 'local' : 'external';
        dependencies.push({ path, type });
    }
    return dependencies;
}


// --- Core Tree Building Logic ---

/**
 * Creates a dependency tree from a flat list of file objects for multiple languages.
 * @param {Array<Object>} files - The input array of file objects.
 * @param {Object} [options] - Configuration for parsers (e.g., { javaRootPackage: '...' }).
 * @returns {Object} The root node of the dependency tree.
 */
export function createDependencyTree(files, options = {}) {
    if (!files || files.length === 0) return null;

    const root = { name: 'flask-test', type: 'directory', children: [] };
    const allFilePaths = files.map(f => f.filePath);

    files.forEach(file => {
        const pathParts = file.filePath.split('/');
        let currentNode = root;

        // Ensure directory structure exists
        pathParts.slice(0, -1).forEach(part => {
            let childNode = currentNode.children.find(c => c.name === part && c.type === 'directory');
            if (!childNode) {
                childNode = { name: part, type: 'directory', children: [] };
                currentNode.children.push(childNode);
            }
            currentNode = childNode;
        });

        // Create the file node
        const fileNode = {
            name: file.fileName,
            path: file.filePath,
            type: 'file',
            dependencies: []
        };
        
        // --- Language Dispatcher ---
        // Call the correct parser based on file extension
        if (file.fileName.endsWith('.py')) {
            fileNode.dependencies = parsePythonDependencies(file.content, allFilePaths);
        } else if (file.fileName.endsWith('.js')) {
            fileNode.dependencies = parseJsDependencies(file.content);
        } else if (file.fileName.endsWith('.java')) {
            fileNode.dependencies = parseJavaDependencies(file.content, options);
        }
        
        currentNode.children.push(fileNode);
    });
    console.log(root);
    return root;
}


// --- Filtering Functionality ---

// Helper function to find a node in the tree recursively
function findNodeByPath(node, path) {
    // console.log("Searching for:", path,node);
    if (node.path === path) {
        return node;
    }
    if (node.children) {
        for (const child of node.children) {
            const found = findNodeByPath(child, path);
            if (found) return found;
        }
    }
    return null;
}

/**
 * Finds a file in the dependency tree and returns its dependencies.
 * @param {Object} tree - The dependency tree generated by createDependencyTree.
 * @param {string} filePath - The full path of the file to filter by.
 * @returns {Array<Object>|null} An array of dependencies, or null if the file is not found.
 */
export function getDependenciesForFile(tree, filePath) {
    const fileNode = findNodeByPath(tree, filePath);
    return fileNode ? fileNode.dependencies : null;
}


// --- Example Usage ---

// 1. Generate the complete dependency tree for the multi-language project
// const fullTree = createDependencyTree(multiLanguageProjectFiles, {
//     javaRootPackage: 'com.mycompany.app' // Provide Java-specific option
// });

// For demonstration, let's log the full tree (can be very large)
// console.log("--- Full Dependency Tree ---");
// console.log(JSON.stringify(fullTree, null, 2));


// 2. Use the filter function to get dependencies for a specific file
// console.log("\n--- Filtered Dependencies for my-project/api/nodejs/server.js ---");
// const nodeServerDeps = getDependenciesForFile(fullTree, 'my-project/api/nodejs/server.js');
// console.log(nodeServerDeps);

// console.log("\n--- Filtered Dependencies for my-project/worker/java/com/mycompany/app/MainApplication.java ---");
// const javaAppDeps = getDependenciesForFile(fullTree, 'my-project/worker/java/com/mycompany/app/MainApplication.java');
// console.log(javaAppDeps);

// console.log("\n--- Filtered Dependencies for a file that doesn't exist ---");
// const nonExistentDeps = getDependenciesForFile(fullTree, 'my-project/nonexistent.txt');
// console.log(nonExistentDeps);