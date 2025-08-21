import { useState } from "react";
import { cn, createDependencyTree, getDependenciesForFile } from "@/lib/utils";
import CodeExplorer from "./components/CodeExplorer";
import axios from "axios";
import { toast } from "sonner";

export default function CodeConverter() {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState([]);
  //   const [files, setFiles] = useState([
  //     {
  //         "fileName": "package.json",
  //         "filePath": "shadcn-todo-app/package.json",
  //         "content": "{\n  \"name\": \"shadcn-todo-app\",\n  \"private\": true,\n  \"version\": \"0.0.0\",\n  \"type\": \"module\",\n  \"scripts\": {\n    \"dev\": \"vite\",\n    \"build\": \"vite build\",\n    \"lint\": \"eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0\",\n    \"preview\": \"vite preview\"\n  },\n  \"dependencies\": {\n    \"@radix-ui/react-checkbox\": \"^1.0.4\",\n    \"@radix-ui/react-icons\": \"^1.3.0\",\n    \"@radix-ui/react-label\": \"^2.0.2\",\n    \"@radix-ui/react-slot\": \"^1.0.2\",\n    \"class-variance-authority\": \"^0.7.0\",\n    \"clsx\": \"^2.1.0\",\n    \"lucide-react\": \"^0.363.0\",\n    \"react\": \"^18.2.0\",\n    \"react-dom\": \"^18.2.0\",\n    \"tailwind-merge\": \"^2.2.2\",\n    \"tailwindcss-animate\": \"^1.0.7\"\n  },\n  \"devDependencies\": {\n    \"@types/react\": \"^18.2.66\",\n    \"@types/react-dom\": \"^18.2.22\",\n    \"@vitejs/plugin-react\": \"^4.2.1\",\n    \"autoprefixer\": \"^10.4.19\",\n    \"eslint\": \"^8.57.0\",\n    \"eslint-plugin-react\": \"^7.34.1\",\n    \"eslint-plugin-react-hooks\": \"^4.6.0\",\n    \"eslint-plugin-react-refresh\": \"^0.4.6\",\n    \"postcss\": \"^8.4.38\",\n    \"tailwindcss\": \"^3.4.1\",\n    \"vite\": \"^5.2.0\"\n  }\n}\n",
  //         "linesChanged": 41,
  //         "changeType": "Generated"
  //     },
  //     {
  //         "fileName": "index.html",
  //         "filePath": "shadcn-todo-app/index.html",
  //         "content": "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <link rel=\"icon\" type=\"image/svg+xml\" href=\"/vite.svg\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Shadcn Todo App</title>\n  </head>\n  <body class=\"bg-background text-foreground\">\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.jsx\"></script>\n  </body>\n</html>\n",
  //         "linesChanged": 13,
  //         "changeType": "Generated"
  //     },
  //     {
  //         "fileName": "vite.config.js",
  //         "filePath": "shadcn-todo-app/vite.config.js",
  //         "content": "import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nimport path from \"path\"\n\n// https://vitejs.dev/config/\nexport default defineConfig({\n  plugins: [react()],\n  resolve: {\n    alias: {\n      \"@\": path.resolve(__dirname, \"./src\"),\n    },\n  },\n})\n",
  //         "linesChanged": 13,
  //         "changeType": "Generated"
  //     },
  //     {
  //         "fileName": "tailwind.config.js",
  //         "filePath": "shadcn-todo-app/tailwind.config.js",
  //         "content": "/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  darkMode: [\"class\"],\n  content: [\n    './pages/**/*.{js,jsx}',\n    './components/**/*.{js,jsx}',\n    './app/**/*.{js,jsx}',\n    './src/**/*.{js,jsx}',\n  ],\n  prefix: \"\",\n  theme: {\n    container: {\n      center: true,\n      padding: \"2rem\",\n      screens: {\n        \"2xl\": \"1400px\",\n      },\n    },\n    extend: {\n      colors: {\n        border: \"hsl(var(--border))\",\n        input: \"hsl(var(--input))\",\n        ring: \"hsl(var(--ring))\",\n        background: \"hsl(var(--background))\",\n        foreground: \"hsl(var(--foreground))\",\n        primary: {\n          DEFAULT: \"hsl(var(--primary))\",\n          foreground: \"hsl(var(--primary-foreground))\",\n        },\n        secondary: {\n          DEFAULT: \"hsl(var(--secondary))\",\n          foreground: \"hsl(var(--secondary-foreground))\",\n        },\n        destructive: {\n          DEFAULT: \"hsl(var(--destructive))\",\n          foreground: \"hsl(var(--destructive-foreground))\",\n        },\n        muted: {\n          DEFAULT: \"hsl(var(--muted))\",\n          foreground: \"hsl(var(--muted-foreground))\",\n        },\n        accent: {\n          DEFAULT: \"hsl(var(--accent))\",\n          foreground: \"hsl(var(--accent-foreground))\",\n        },\n        popover: {\n          DEFAULT: \"hsl(var(--popover))\",\n          foreground: \"hsl(var(--popover-foreground))\",\n        },\n        card: {\n          DEFAULT: \"hsl(var(--card))\",\n          foreground: \"hsl(var(--card-foreground))\",\n        },\n      },\n      borderRadius: {\n        lg: \"var(--radius)\",\n        md: \"calc(var(--radius) - 2px)\",\n        sm: \"calc(var(--radius) - 4px)\",\n      },\n      keyframes: {\n        \"accordion-down\": {\n          from: { height: \"0\" },\n          to: { height: \"var(--radix-accordion-content-height)\" },\n        },\n        \"accordion-up\": {\n          from: { height: \"var(--radix-accordion-content-height)\" },\n          to: { height: \"0\" },\n        },\n      },\n      animation: {\n        \"accordion-down\": \"accordion-down 0.2s ease-out\",\n        \"accordion-up\": \"accordion-up 0.2s ease-out\",\n      },\n    },\n  },\n  plugins: [require(\"tailwindcss-animate\")],\n}\n",
  //         "linesChanged": 87,
  //         "changeType": "Generated"
  //     },
  //     {
  //         "fileName": "postcss.config.js",
  //         "filePath": "shadcn-todo-app/postcss.config.js",
  //         "content": "module.exports = {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}\n",
  //         "linesChanged": 6,
  //         "changeType": "Generated"
  //     },
  //     {
  //         "fileName": "main.jsx",
  //         "filePath": "shadcn-todo-app/src/main.jsx",
  //         "content": "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App.jsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n)\n",
  //         "linesChanged": 10,
  //         "changeType": "Generated"
  //     },
  //     {
  //         "fileName": "index.css",
  //         "filePath": "shadcn-todo-app/src/index.css",
  //         "content": "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n \n@layer base {\n  :root {\n    --background: 0 0% 100%;\n    --foreground: 222.2 84% 4.9%;\n \n    --card: 0 0% 100%;\n    --card-foreground: 222.2 84% 4.9%;\n \n    --popover: 0 0% 100%;\n    --popover-foreground: 222.2 84% 4.9%;\n \n    --primary: 222.2 47.4% 11.2%;\n    --primary-foreground: 210 40% 98%;\n \n    --secondary: 210 40% 96.1%;\n    --secondary-foreground: 222.2 47.4% 11.2%;\n \n    --muted: 210 40% 96.1%;\n    --muted-foreground: 215.4 16.3% 46.9%;\n \n    --accent: 210 40% 96.1%;\n    --accent-foreground: 222.2 47.4% 11.2%;\n \n    --destructive: 0 84.2% 60.2%;\n    --destructive-foreground: 210 40% 98%;\n\n    --border: 214.3 31.8% 91.4%;\n    --input: 214.3 31.8% 91.4%;\n    --ring: 222.2 84% 4.9%;\n \n    --radius: 0.5rem;\n  }\n \n  .dark {\n    --background: 222.2 84% 4.9%;\n    --foreground: 210 40% 98%;\n \n    --card: 222.2 84% 4.9%;\n    --card-foreground: 210 40% 98%;\n \n    --popover: 222.2 84% 4.9%;\n    --popover-foreground: 210 40% 98%;\n \n    --primary: 210 40% 98%;\n    --primary-foreground: 222.2 47.4% 11.2%;\n \n    --secondary: 217.2 32.6% 17.5%;\n    --secondary-foreground: 210 40% 98%;\n \n    --muted: 217.2 32.6% 17.5%;\n    --muted-foreground: 215 20.2% 65.1%;\n \n    --accent: 217.2 32.6% 17.5%;\n    --accent-foreground: 210 40% 98%;\n \n    --destructive: 0 62.8% 30.6%;\n    --destructive-foreground: 210 40% 98%;\n \n    --border: 217.2 32.6% 17.5%;\n    --input: 217.2 32.6% 17.5%;\n    --ring: 212.7 26.8% 83.9%;\n  }\n}\n \n@layer base {\n  * {\n    @apply border-border;\n  }\n  body {\n    @apply bg-background text-foreground;\n  }\n}\n",
  //         "linesChanged": 84,
  //         "changeType": "Generated"
  //     },
  //     {
  //         "fileName": "App.jsx",
  //         "filePath": "shadcn-todo-app/src/App.jsx",
  //         "content": "import { useState } from 'react';\nimport { Button } from \"@/components/ui/button\";\nimport { Input } from \"@/components/ui/input\";\nimport { Checkbox } from \"@/components/ui/checkbox\";\nimport { Card, CardContent, CardHeader, CardTitle } from \"@/components/ui/card\";\nimport { Trash2 } from 'lucide-react';\n\nfunction App() {\n  const [todos, setTodos] = useState([]);\n  const [newTodo, setNewTodo] = useState('');\n\n  const handleAddTodo = (e) => {\n    e.preventDefault();\n    if (newTodo.trim() === '') return;\n    setTodos([...todos, { id: Date.now(), text: newTodo, completed: false }]);\n    setNewTodo('');\n  };\n\n  const handleToggleTodo = (id) => {\n    setTodos(\n      todos.map(todo =>\n        todo.id === id ? { ...todo, completed: !todo.completed } : todo\n      )\n    );\n  };\n\n  const handleDeleteTodo = (id) => {\n    setTodos(todos.filter(todo => todo.id !== id));\n  };\n\n  return (\n    <div className=\"min-h-screen w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4\">\n      <Card className=\"w-full max-w-md\">\n        <CardHeader>\n          <CardTitle className=\"text-2xl font-bold text-center\">Todo List</CardTitle>\n        </CardHeader>\n        <CardContent>\n          <form onSubmit={handleAddTodo} className=\"flex gap-2 mb-4\">\n            <Input\n              type=\"text\"\n              placeholder=\"Add a new todo...\"\n              value={newTodo}\n              onChange={(e) => setNewTodo(e.target.value)}\n              className=\"flex-grow\"\n            />\n            <Button type=\"submit\">Add</Button>\n          </form>\n          <div className=\"space-y-2\">\n            {todos.map(todo => (\n              <div key={todo.id} className=\"flex items-center gap-3 p-2 border rounded-md\">\n                <Checkbox\n                  id={`todo-${todo.id}`}\n                  checked={todo.completed}\n                  onCheckedChange={() => handleToggleTodo(todo.id)}\n                />\n                <label \n                  htmlFor={`todo-${todo.id}`} \n                  className={`flex-grow cursor-pointer ${todo.completed ? 'line-through text-gray-500' : ''}`}>\n                  {todo.text}\n                </label>\n                <Button variant=\"ghost\" size=\"icon\" onClick={() => handleDeleteTodo(todo.id)}>\n                  <Trash2 className=\"h-4 w-4 text-red-500\" />\n                </Button>\n              </div>\n            ))}\n          </div>\n        </CardContent>\n      </Card>\n    </div>\n  );\n}\n\nexport default App;\n",
  //         "linesChanged": 76,
  //         "changeType": "Generated"
  //     },
  //     {
  //         "fileName": "utils.js",
  //         "filePath": "shadcn-todo-app/src/lib/utils.js",
  //         "content": "import { clsx } from \"clsx\"\nimport { twMerge } from \"tailwind-merge\"\n \nexport function cn(...inputs) {\n  return twMerge(clsx(inputs))\n}\n",
  //         "linesChanged": 6,
  //         "changeType": "Generated"
  //     },
  //     {
  //         "fileName": "button.jsx",
  //         "filePath": "shadcn-todo-app/src/components/ui/button.jsx",
  //         "content": "import * as React from \"react\"\nimport { Slot } from \"@radix-ui/react-slot\"\nimport { cva } from \"class-variance-authority\";\n\nimport { cn } from \"@/lib/utils\"\n\nconst buttonVariants = cva(\n  \"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50\",\n  {\n    variants: {\n      variant: {\n        default: \"bg-primary text-primary-foreground hover:bg-primary/90\",\n        destructive:\n          \"bg-destructive text-destructive-foreground hover:bg-destructive/90\",\n        outline:\n          \"border border-input bg-background hover:bg-accent hover:text-accent-foreground\",\n        secondary:\n          \"bg-secondary text-secondary-foreground hover:bg-secondary/80\",\n        ghost: \"hover:bg-accent hover:text-accent-foreground\",\n        link: \"text-primary underline-offset-4 hover:underline\",\n      },\n      size: {\n        default: \"h-10 px-4 py-2\",\n        sm: \"h-9 rounded-md px-3\",\n        lg: \"h-11 rounded-md px-8\",\n        icon: \"h-10 w-10\",\n      },\n    },\n    defaultVariants: {\n      variant: \"default\",\n      size: \"default\",\n    },\n  }\n)\n\nconst Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {\n  const Comp = asChild ? Slot : \"button\"\n  return (\n    <Comp\n      className={cn(buttonVariants({ variant, size, className }))}\n      ref={ref}\n      {...props} />\n  )\n})\nButton.displayName = \"Button\"\n\nexport { Button, buttonVariants }",
  //         "linesChanged": 49,
  //         "changeType": "Generated"
  //     },
  //     {
  //         "fileName": "input.jsx",
  //         "filePath": "shadcn-todo-app/src/components/ui/input.jsx",
  //         "content": "import * as React from \"react\"\n\nimport { cn } from \"@/lib/utils\"\n\nconst Input = React.forwardRef(({ className, type, ...props }, ref) => {\n  return (\n    <input\n      type={type}\n      className={cn(\n        \"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50\",\n        className\n      )}\n      ref={ref}\n      {...props} />\n  )\n})\nInput.displayName = \"Input\"\n\nexport { Input }",
  //         "linesChanged": 20,
  //         "changeType": "Generated"
  //     },
  //     {
  //         "fileName": "checkbox.jsx",
  //         "filePath": "shadcn-todo-app/src/components/ui/checkbox.jsx",
  //         "content": "import * as React from \"react\"\nimport * as CheckboxPrimitive from \"@radix-ui/react-checkbox\"\nimport { Check } from \"lucide-react\"\n\nimport { cn } from \"@/lib/utils\"\n\nconst Checkbox = React.forwardRef(({ className, ...props }, ref) => (\n  <CheckboxPrimitive.Root\n    ref={ref}\n    className={cn(\n      \"peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground\",\n      className\n    )}\n    {...props}>\n    <CheckboxPrimitive.Indicator className={cn(\"flex items-center justify-center text-current\")}>\n      <Check className=\"h-4 w-4\" />\n    </CheckboxPrimitive.Indicator>\n  </CheckboxPrimitive.Root>\n))\nCheckbox.displayName = CheckboxPrimitive.Root.displayName\n\nexport { Checkbox }",
  //         "linesChanged": 24,
  //         "changeType": "Generated"
  //     },
  //     {
  //         "fileName": "card.jsx",
  //         "filePath": "shadcn-todo-app/src/components/ui/card.jsx",
  //         "content": "import * as React from \"react\"\n\nimport { cn } from \"@/lib/utils\"\n\nconst Card = React.forwardRef(({ className, ...props }, ref) => (\n  <div\n    ref={ref}\n    className={cn(\"rounded-lg border bg-card text-card-foreground shadow-sm\", className)}\n    {...props} />\n))\nCard.displayName = \"Card\"\n\nconst CardHeader = React.forwardRef(({ className, ...props }, ref) => (\n  <div\n    ref={ref}\n    className={cn(\"flex flex-col space-y-1.5 p-6\", className)}\n    {...props} />\n))\nCardHeader.displayName = \"CardHeader\"\n\nconst CardTitle = React.forwardRef(({ className, ...props }, ref) => (\n  <h3\n    ref={ref}\n    className={cn(\"text-2xl font-semibold leading-none tracking-tight\", className)}\n    {...props} />\n))\nCardTitle.displayName = \"CardTitle\"\n\nconst CardDescription = React.forwardRef(({ className, ...props }, ref) => (\n  <p\n    ref={ref}\n    className={cn(\"text-sm text-muted-foreground\", className)}\n    {...props} />\n))\nCardDescription.displayName = \"CardDescription\"\n\nconst CardContent = React.forwardRef(({ className, ...props }, ref) => (\n  <div ref={ref} className={cn(\"p-6 pt-0\", className)} {...props} />\n))\nCardContent.displayName = \"CardContent\"\n\nconst CardFooter = React.forwardRef(({ className, ...props }, ref) => (\n  <div\n    ref={ref}\n    className={cn(\"flex items-center p-6 pt-0\", className)}\n    {...props} />\n))\nCardFooter.displayName = \"CardFooter\"\n\nexport { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }",
  //         "linesChanged": 58,
  //         "changeType": "Generated"
  //     },
  //     {
  //         "fileName": "label.jsx",
  //         "filePath": "shadcn-todo-app/src/components/ui/label.jsx",
  //         "content": "import * as React from \"react\"\nimport * as LabelPrimitive from \"@radix-ui/react-label\"\nimport { cva } from \"class-variance-authority\";\n\nimport { cn } from \"@/lib/utils\"\n\nconst labelVariants = cva(\n  \"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70\"\n)\n\nconst Label = React.forwardRef(({ className, ...props }, ref) => (\n  <LabelPrimitive.Root\n    ref={ref}\n    className={cn(labelVariants(), className)}\n    {...props} />\n))\nLabel.displayName = LabelPrimitive.Root.displayName\n\nexport { Label }",
  //         "linesChanged": 19,
  //         "changeType": "Generated"
  //     }
  // ]);
  const [showCodeExplorer, setShowCodeExplorer] = useState(false);
  const [activeFileId, setActiveFileId] = useState(null);
  const [modificationLoading, setModificationLoading] = useState(false);
  const [openFiles, setOpenFiles] = useState([]);
  const [versions, setVersions] = useState({});
  const [currentVersion, setCurrentVersion] = useState(0);
  const [globalChatEnabled, setGlobalChatEnabled] = useState(false);
  const [aiModel, setAiModel] = useState({
    name: "Gemini 2.5 Pro",
    version: "models/gemini-2.5-flash",
  });

  const handleUpload = async (uploadedFile) => {
    if (uploadedFile && uploadedFile.name.endsWith(".zip")) {
      setFile(uploadedFile);
      setIsLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", uploadedFile);
        const extractResponse = await axios.post(
          "http://localhost:8001/v1/api/extract",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        const modifiedFiles = extractResponse.data.files
        console.log(modifiedFiles);
        setFiles(modifiedFiles);
        const newVerionId = `v${Object.keys(versions).length + 1}`;
        // console.log(newVerionId,Object.keys(versions).length + 1);
        const newVersion = {
          id: newVerionId,
          timestamp: new Date(),
          filesChanged: extractResponse.data.files,
        };
        setMessages([
          {
            id: "1",
            content: extractResponse.data.summary,
            sender: "assistant",
            timestamp: new Date(),
            version: newVersion,
          },
        ]);
        setCurrentVersion(newVerionId);
        setVersions((prev) => ({
          ...prev,
          [newVerionId]: modifiedFiles,
        }));
        setShowCodeExplorer(true);
      } catch (err) {
        if (err.status === 409) {
          setError(err?.response?.data?.message);
        } else {
          console.log(err);
          setError("Conversion failed. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setError("Only .zip files are allowed.");
    }
  };

  // const handleModificationRequest = async (inputValue) => {
  //   console.log("change requested");
  //   try{
  //     setModificationLoading(true);
  //     const userMessage = {
  //         id: Date.now().toString(),
  //         content: inputValue,
  //         sender: "user",
  //         timestamp: new Date(),
  //       }
  //       setMessages((prev) => [...prev, userMessage]);

  //       let requiredFiles = [];
  //       if(globalChatEnabled){
  //         requiredFiles = files
  //       }
  //       else{
  //         const tree = createDependencyTree(files);
  //         const activeFile = files.find((file) => file.filePath === activeFileId);
  //         const dependencyFiles = getDependenciesForFile(tree,activeFile.filePath).filter(file => file.type === "local");
  //         console.log(dependencyFiles);
  //         requiredFiles.push(activeFile);
  //         for (const file of dependencyFiles) {
  //           const existingFile = files.find(f => f.filePath === file.path);
  //           if (existingFile) {
  //             requiredFiles.push(existingFile);
  //           }
  //         }
  //       }

  //       console.log(messages);
  //       // const updationResponse = await axios.post("http://localhost:8001/v1/api/update",{files : requiredFiles,modelVerion:aiModel.version,messages : [...messages.map(message => ({role : message.sender,content : message.content})), {role : "user",content : inputValue}]})
  //       // const newVerionId = `v${Object.keys(versions).length + 1}`;
  //       // // console.log(newVerionId,Object.keys(versions).length + 1);
  //       // const newVersion = {
  //       //       id: newVerionId,
  //       //       timestamp: new Date(),
  //       //       description: inputValue,
  //       //       filesChanged: updationResponse.data.files,
  //       // }

  //       // const assistantMessage = {
  //       //     id: (Date.now() + 1).toString(),
  //       //     content: updationResponse.data.summary,
  //       //     sender: "assistant",
  //       //     timestamp: new Date(),
  //       //     version: updationResponse.data.files.length > 0 ? newVersion : null
  //       // }

  //       // console.log(updationResponse.data.files);

  //       // if(updationResponse.data.files.length > 0){
  //       //     setFiles((prevFiles) => {
  //       //     const updatedFiles = [...prevFiles];
  //       //     for (const updatedFile of updationResponse.data.files) {
  //       //       const index = updatedFiles.findIndex(f => f.filePath === updatedFile.filePath);
  //       //       console.log("Updating file:", updatedFile.filePath, "at index:", index);
  //       //       if (index !== -1) {
  //       //         updatedFiles[index] = {...updatedFiles[index], content: updatedFile.content };
  //       //       }
  //       //     }
  //       //     setVersions((prev) => ({...prev,[newVerionId] : updatedFiles}));
  //       //     setCurrentVersion(newVerionId);
  //       //     return updatedFiles;
  //       //   });
  //       //   setOpenFiles([]);
  //       // }

  //       // setMessages((prev) => [...prev, assistantMessage])

  //       //      const assistantMessage = {
  //       //     id: (Date.now() + 1).toString(),
  //       //     content: inputValue,
  //       //     sender: "assistant",
  //       //     timestamp: new Date(),
  //       // }
  //       // setMessages((prev) => [...prev, assistantMessage])
  //   }
  //   catch(err){
  //     console.log(err);
  //     const assistantMessage = {
  //           id: (Date.now() + 1).toString(),
  //           content: err.response?.data?.message || "An error occurred",
  //           sender: "assistant",
  //           timestamp: new Date(),
  //       }
  //     // toast.error(err.message);
  //     setMessages((prev) => [...prev, assistantMessage])
  //   }
  //   finally{
  //     setModificationLoading(false);
  //   }
  // }
  const handleModificationRequest = async (inputValue, file) => {
    console.log("change requested");
    try {
      setModificationLoading(true);
      const userMessage = {
        id: Date.now().toString(),
        content: inputValue,
        sender: "user",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      let requiredFiles = [];
      if (globalChatEnabled) {
        requiredFiles = files;
      } else if (files.length != 0) {
        const tree = createDependencyTree(files);
        const activeFile = files.find((file) => file.filePath === activeFileId);
        const dependencyFiles = getDependenciesForFile(
          tree,
          activeFile.filePath
        ).filter((file) => file.type === "local");
        console.log(dependencyFiles);
        requiredFiles.push(activeFile);
        for (const file of dependencyFiles) {
          const existingFile = files.find((f) => f.filePath === file.path);
          if (existingFile) {
            requiredFiles.push(existingFile);
          }
        }
      }
      console.log(messages);

      const formData = new FormData();
      formData.append("files",JSON.stringify(files));
      formData.append("modelVerion",aiModel.version);
      if(file) formData.append("file",file);
      formData.append("messages",JSON.stringify(messages.map((message) => ({
              role: message.sender,
              content: [{ type: "text", text: message.content }],
            }))));
      formData.append("inputQuery",inputValue);

      const updationResponse = await axios.post(
        "http://localhost:8001/v1/api/update",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
        // {
        //   files: requiredFiles,
        //   modelVerion: aiModel.version,
        //   file,
        //   messages: 
        //     messages.map((message) => ({
        //       role: message.sender,
        //       content: [{ type: "text", text: message.content }],
        //     })),
        //   inputQuery: inputValue,
        // }
      );
      const newVerionId = `v${Object.keys(versions).length + 1}`;
      // console.log(newVerionId,Object.keys(versions).length + 1);
      const newVersion = {
        id: newVerionId,
        timestamp: new Date(),
        description: inputValue,
        filesChanged: updationResponse.data.files,
      };

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        content: updationResponse.data.summary,
        sender: "assistant",
        timestamp: new Date(),
        version: updationResponse.data.files.length > 0 ? newVersion : null,
      };

      console.log(updationResponse.data.files);

      if (updationResponse.data.files.length > 0) {
        setFiles((prevFiles) => {
          const updatedFiles = [...prevFiles];
          for (const updatedFile of updationResponse.data.files) {
            const index = updatedFiles.findIndex(
              (f) => f.filePath === updatedFile.filePath
            );
            console.log(
              "Updating file:",
              updatedFile.filePath,
              "at index:",
              index
            );
            if (index !== -1) {
              updatedFiles[index] = {
                ...updatedFiles[index],
                content: updatedFile.content,
              };
            } else {
              updatedFiles.push(updatedFile);
            }
          }
          setVersions((prev) => ({ ...prev, [newVerionId]: updatedFiles }));
          setCurrentVersion(newVerionId);
          return updatedFiles;
        });
        setOpenFiles([]);
      }
      if(!showCodeExplorer){
        setShowCodeExplorer(true);
      }
      setMessages((prev) => [...prev, assistantMessage]);

      //      const assistantMessage = {
      //     id: (Date.now() + 1).toString(),
      //     content: inputValue,
      //     sender: "assistant",
      //     timestamp: new Date(),
      // }
      // setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      console.log(err);
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        content: err.response?.data?.message || "An error occurred",
        sender: "assistant",
        timestamp: new Date(),
      };
      // toast.error(err.message);
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setModificationLoading(false);
    }
  };

  const enhanceQuery = async (query) => {
    if (query.length < 10) {
      toast.warning("Prompt is too short to enhance");
      return;
    }
    try {
      const response = await axios.post(
        "http://localhost:8001/v1/api/enhance",
        { query, modelVerion: aiModel.version }
      );
      console.log(response.data.enhancedQuery);
      return response.data.enhancedQuery;
    } catch (err) {
      console.log(err);
      toast.error("Failed to enhance the prompt");
      return query;
    }
  };

  const handleAiModel = (model) => {
    setAiModel(model);
  };

  const handleCurrentVersion = (verionId) => {
    setCurrentVersion(verionId);
    setFiles(versions[verionId]);
    setOpenFiles([]);
  };

  // const handleFileChange = (e) => {
  //   if (e.target.files && e.target.files[0]) {
  //     handleUpload(e.target.files[0]);
  //   }
  // };

  return (
    <CodeExplorer
      showCodeExplorer={showCodeExplorer}
      enhanceQuery={enhanceQuery}
      handleAiModel={handleAiModel}
      globalChatEnabled={globalChatEnabled}
      setGlobalChatEnabled={setGlobalChatEnabled}
      handleCurrentVersion={handleCurrentVersion}
      currentVersion={currentVersion}
      versions={versions}
      setVersions={setVersions}
      openFiles={openFiles}
      setOpenFiles={setOpenFiles}
      modificationLoading={modificationLoading}
      activeFileId={activeFileId}
      setActiveFileId={setActiveFileId}
      messages={messages}
      handleModificationRequest={handleModificationRequest}
      files={files}
      setFiles={setFiles}
      onBack={() => setShowCodeExplorer(false)}
      handleUpload={handleUpload}
    />
  );

  // return (
  //   <div className="bg-gray-100 h-screen w-screen">
  //     <div className="px-2 py-3 flex items-center justify-between w-full h-[6%]">
  //       <div className="flex items-center space-x-4">

  //         <h1 className="text-lg font-semibold">Vibe Code</h1>
  //         {/* <p>/</p>
  //         <p>Untitled Project</p> */}
  //       </div>
  //       {/* <div>
  //         <Button className="text-purple-600 hover:text-purple-500" size={"sm"} variant={"ghost"} onClick={applyCodeLocal}><FolderSync className="h-4 w-4 mr-2 " />Apply</Button>
  //         <Button size={"sm"} variant={"ghost"} onClick={handleDownloadCode}><DownloadCloud className="h-4 w-4 mr-2" />Download</Button>
  //       </div> */}

  //     </div>

  //     <div className="flex px-2 pb-2 gap-2 h-[94%] w-full">
  //       <div className="bg-white w-full border rounded-lg">
  //         <div className="bg-white w-full rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
  //           {/* Text Area on Top */}
  //           <div className="p-4 pb-2">
  //             <textarea
  //               ref={textAreaRef}
  //               value={inputValue}
  //               onChange={(e) => {
  //                 setInputValue(e.target.value);
  //                 // Auto-resize textarea
  //                 e.target.style.height = "auto";
  //                 e.target.style.height = e.target.scrollHeight + "px";
  //               }}
  //               onKeyDown={(e) => {
  //                 if (e.key === "Enter" && !e.shiftKey) {
  //                   e.preventDefault();
  //                   handleSendMessage(inputValue);
  //                 }
  //               }}
  //               placeholder="Ask a follow up..."
  //               className="w-full text-sm resize-none border-0 bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 leading-6 min-h-[24px] max-h-[200px]"
  //               rows={1}
  //               disabled={isEnhancingQuery}
  //             />
  //           </div>

  //           {/* Controls Below */}
  //           <div className="flex items-center justify-between p-2">
  //             {/* Right side controls */}
  //             <div className="flex">
  //               <Select onValueChange={handleAiModel}>
  //                     <SelectTrigger className="w-fit h-5 border-none hover:bg-gray-100 px-0 pl-2 mr-2">
  //                       <Brain className="h-5 w-5" />
  //                       {/* <SelectValue placeholder="V1" /> */}
  //                     </SelectTrigger>
  //                     <SelectContent>
  //                       {
  //                       aiModels.map((model,index) => <SelectItem key={index} value={model}>{model.name}</SelectItem>)
  //                       }
  //                     </SelectContent>
  //               </Select>
  //               { (activeFile && !globalChatEnabled) && <Badge variant="secondary">{activeFile.fileName}</Badge>}
  //             </div>
  //             <div className="flex items-center gap-2">
  //               <Button
  //                 disabled={(!inputValue.trim()) || isLoading || isEnhancingQuery}
  //                 size="sm"
  //                 variant={"ghost"}
  //                 onClick={() => handleEnhanceQuery()}
  //               >
  //                 <Sparkles className="h-4 w-4" />
  //               </Button>
  //               <Button
  //                 onClick={() => handleSendMessage(inputValue)}
  //                 disabled={(!inputValue.trim()) || isLoading || isEnhancingQuery}
  //                 size="sm"
  //                 className="h-8 w-8 p-0 rounded-full bg-miracle-darkBlue hover:bg-miracle-darkBlue/80 disabled:opacity-50 disabled:cursor-not-allowed border-0"
  //               >
  //                 {isLoading ? (
  //                   <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
  //                 ) : (
  //                   <ArrowUp className="h-4 w-4 text-white" />
  //                 )}
  //               </Button>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // )
}
