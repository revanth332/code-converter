import { useState,useEffect} from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { UploadCloud, FileCode, AlertCircle, ArrowRight ,CheckCircle} from "lucide-react"
import { cn, createDependencyTree, getDependenciesForFile } from "@/lib/utils"
import CodeExplorer from "./components/CodeExplorer"
import axios from "axios"
import { Timeline } from "@/components/Timeline"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "./components/ui/button"
import { toast } from "sonner"
import { experimental_useObject as useObject } from '@ai-sdk/react';
import * as z from 'zod';

// Define available programming languages
const programmingLanguages = [
  { value: "node.js", label: "Node JS" },
  { value: "fastapi", label: "Fast Api" },
  { value: "django", label: "Django" },
  { value: "flask", label: "Flask" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
]

export default function CodeConverter() {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [messages, setMessages] = useState([])
  const [files, setFiles] = useState([]);
  // const [files, setFiles] = useState([
  //       {
  //           "fileName": "users.py",
  //           "filePath": "flask-test/routes/users.py",
  //           "content": "from flask import jsonify, request, Blueprint, abort\r\n\r\nusers_bp = Blueprint('users', __name__)\r\n\r\nusers = [\r\n    { \"id\": 1, \"name\": \"Alice\" },\r\n    { \"id\": 2, \"name\": \"Bob\" }\r\n]\r\n\r\n# GET all users\r\n@users_bp.route(\"/\", methods=[\"GET\"])\r\ndef get_all_users():\r\n    return jsonify(users)\r\n\r\n# GET user by ID\r\n@users_bp.route(\"/<int:id>\", methods=[\"GET\"])\r\ndef get_user_by_id(id):\r\n    user = next((u for u in users if u[\"id\"] == id), None)\r\n    if user:\r\n        return jsonify(user)\r\n    else:\r\n        abort(404, description=\"User not found\")\r\n\r\n# POST create new user\r\n@users_bp.route(\"/\", methods=[\"POST\"])\r\ndef create_user():\r\n    if not request.json or 'name' not in request.json:\r\n        abort(400, description=\"Missing 'name' in request body\")\r\n    \r\n    new_user = {\r\n        \"id\": len(users) + 1,\r\n        \"name\": request.json[\"name\"]\r\n    }\r\n    users.append(new_user)\r\n    return jsonify(new_user), 201\r\n"
  //       },
  //       {
  //           "fileName": "app.py",
  //           "filePath": "flask-test/app.py",
  //           "content": "from flask import Flask\r\nfrom routes.users import users_bp\r\n\r\napp = Flask(__name__)\r\n\r\n# Register blueprints\r\napp.register_blueprint(users_bp, url_prefix='/users')\r\n\r\n@app.route(\"/\", methods=[\"GET\"])\r\ndef home():\r\n    return \"Welcome to the Flask Test App\"\r\n\r\nif __name__ == \"__main__\":\r\n    app.run(debug=True, port=3000)\r\n"
  //       },
  //       {
  //           "fileName": "requirements.txt",
  //           "filePath": "flask-test/requirements.txt",
  //           "content": "Flask\r\n"
  //       },
  //       {
  //           "fileName": "__init__.py",
  //           "filePath": "flask-test/routes/__init__.py",
  //           "content": ""
  //       }
  //   ]);
  const [currentStage, setCurrentStage] = useState(0);
  const [currentSubStage,setCurrentSubStage] = useState(0);
  const [sourceLanguage, setSourceLanguage] = useState("node.js");
  const [targetLanguage, setTargetLanguage] = useState("flask");
  const [stages,setStages] = useState([
      { name: "Upload", description: `Uploading your code...` },
      { name: "Extracting", description: `Extracting files from the uploaded zip...` },
      { name: "Converting", description: `Converting from ${sourceLanguage} to ${targetLanguage}...` },
      { name: "Complete", description: `Your ${targetLanguage} code is ready!` },
    ])
  const [conversionComplete,setConversionComplete] = useState(false);
  const [showCodeExplorer,setShowCodeExplorer] = useState(false);
  const [activeFileId, setActiveFileId] = useState(null);
  const [modificationLoading,setModificationLoading] = useState(false);
  const [openFiles, setOpenFiles] = useState([]);
  const [versions, setVersions] = useState({});
  const [currentVersion,setCurrentVersion] = useState(0);
  const [globalChatEnabled,setGlobalChatEnabled] = useState(false);
  const [aiModel,setAiModel] = useState({
    name : "Gemini 2.5 Pro",
    version : "models/gemini-2.5-flash-preview-05-20",
  })
  // const { object : conversionResponse, submit : handleConversion } = useObject({
  //   api: 'http://localhost:8001/v1/api/convert',
  //   schema: z.object({
  //           success : z.boolean(),
  //           files : z.array(z.object({
  //               fileName: z.string(),
  //               filePath: z.string(),
  //               content: z.string(),
  //           })),
  //           summary : z.string(),
  //           message : z.string(),
  //           stages : z.array(z.object({
  //             name : z.string(),
  //             description : z.string()
  //           }))
  //   }),
  //   onFinish : async (result) => {
  //     console.log(result)
  //     setCurrentStage(3);

  //       await new Promise((resolve) => setTimeout(resolve, 1000));
  //       setCurrentStage(4);

  //       await new Promise((resolve) => setTimeout(resolve, 1000));
  //       setIsLoading(false);
  //     setFiles(result.object.files);
  //       const newVerionId = `v${Object.keys(versions).length + 1}`;
  //       // console.log(newVerionId,Object.keys(versions).length + 1);
  //       const newVersion = {
  //             id: newVerionId,
  //             timestamp: new Date(),
  //             description: result.object.summary,
  //             filesChanged: result.object.files,
  //       }
  //       setMessages([{
  //         id: "1",
  //         content: result.object.summary,
  //         sender: "assistant",
  //         timestamp: new Date(),
  //         version : newVersion
  //       },]);
  //       setCurrentVersion(newVerionId)
  //       setVersions((prev) => ({...prev,[newVerionId] : result.object.files}));
  //       setConversionComplete(true);
  //   }
  // });


  // const { object : updationResponse, submit : handleUpdation } = useObject({
  //   api: 'http://localhost:8001/v1/api/convert',
  //   schema: z.object({
  //           success : z.boolean(),
  //           files : z.array(z.object({
  //               fileName: z.string(),
  //               filePath: z.string(),
  //               content: z.string(),
  //           })),
  //           summary : z.string(),
  //           message : z.string(),
  //           stages : z.array(z.object({
  //             name : z.string(),
  //             description : z.string()
  //           }))
  //   }),
  //   onFinish : async (result) => {
  //             const newVerionId = `v${Object.keys(versions).length + 1}`;
  //       // console.log(newVerionId,Object.keys(versions).length + 1);
  //       const newVersion = {
  //             id: newVerionId,
  //             timestamp: new Date(),
  //             filesChanged: result.object.files,
  //       }

  //       const assistantMessage = {
  //           id: (Date.now() + 1).toString(),
  //           content: result.object.summary,
  //           sender: "assistant",
  //           timestamp: new Date(),
  //           version: result.object.files.length > 0 ? newVersion : null
  //       }
        
  //       console.log(result.object.files);

  //       if(result.object.files.length > 0){
  //           setFiles((prevFiles) => {
  //           const updatedFiles = [...prevFiles];
  //           for (const updatedFile of result.object.files) {
  //             const index = updatedFiles.findIndex(f => f.filePath === updatedFile.filePath);
  //             console.log("Updating file:", updatedFile.filePath, "at index:", index);
  //             if (index !== -1) {
  //               updatedFiles[index] = {...updatedFiles[index], content: updatedFile.content };
  //             }
  //           }
  //           setVersions((prev) => ({...prev,[newVerionId] : updatedFiles}));
  //           setCurrentVersion(newVerionId);
  //           return updatedFiles;
  //         });
  //         setOpenFiles([]);
  //       }
        
  //       setMessages((prev) => [...prev, assistantMessage])
  //   }
  // });

  useEffect(() => {
    setStages([
      { name: "Upload", description: `Uploading your code...` },
      { name: "Extracting", description: `Extracting files from the uploaded zip...` },
      { name: "Converting", description: `Converting from ${sourceLanguage} to ${targetLanguage}...` },
      { name: "Complete", description: `Your ${targetLanguage} code is ready!` },
    ])
  },[sourceLanguage,targetLanguage,conversionComplete])

  const handleUpload = async (uploadedFile) => {
    if(sourceLanguage === targetLanguage){
      setError("Source and target language should not be same.");
    }
    else if (uploadedFile && uploadedFile.name.endsWith(".zip")) {
      setFile(uploadedFile);
      setIsLoading(true);
      setError(null);

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setCurrentStage(1);

        const formData = new FormData();
        formData.append("file", uploadedFile);
        const extractResponse = await axios.post("http://localhost:8001/v1/api/extract", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        setCurrentStage(2);

        // handleConversion({filesContent : extractResponse.data.filesContent,sourceLanguage,targetLanguage,modelVerion:aiModel.version})
        const conversionResponse = await axios.post("http://localhost:8001/v1/api/convert",{filesContent : extractResponse.data.filesContent,sourceLanguage,targetLanguage,modelVerion:aiModel.version});

        setStages(prev => prev.map((stage,index) => index === 2 ? ({...stage,subStages:conversionResponse.data.stages}) : stage))
        let currestSubstageIndex = 0;
        while(currestSubstageIndex < conversionResponse.data.stages.length){
          await new Promise((resolve) => setTimeout(resolve, 1000));
          setCurrentSubStage(currestSubstageIndex);
          currestSubstageIndex++;
        }
        setCurrentStage(3);

        await new Promise((resolve) => setTimeout(resolve, 1000));
        setCurrentStage(4);

        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsLoading(false);

        setFiles(conversionResponse.data.files);
        const newVerionId = `v${Object.keys(versions).length + 1}`;
        // console.log(newVerionId,Object.keys(versions).length + 1);
        const newVersion = {
              id: newVerionId,
              timestamp: new Date(),
              description: conversionResponse.data.summary,
              filesChanged: conversionResponse.data.files,
        }
        setMessages([{
          id: "1",
          content: conversionResponse.data.summary,
          sender: "assistant",
          timestamp: new Date(),
          version : newVersion
        },]);
        setCurrentVersion(newVerionId)
        setVersions((prev) => ({...prev,[newVerionId] : conversionResponse.data.files}));
        setConversionComplete(true);
      } catch (err) {
        setIsLoading(false);
        if(err.status === 409){
          setError(err?.response?.data?.message)
        }
        else{
          console.log(err)
          setError("Conversion failed. Please try again.");
        }
      }
      finally{
        setStages([
          { name: "Upload", description: `Uploading your code...` },
          { name: "Extracting", description: `Extracting files from the uploaded zip...` },
          { name: "Converting", description: `Converting from ${sourceLanguage} to ${targetLanguage}...` },
          { name: "Complete", description: `Your ${targetLanguage} code is ready!` },
        ])
      }
    } else {
      setError("Only .zip files are allowed.")
    }
  }

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
  const handleModificationRequest = async (inputValue) => {
    console.log("change requested");
    try{
      setModificationLoading(true);
      const userMessage = {
          id: Date.now().toString(),
          content: inputValue,
          sender: "user",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, userMessage]);

        let requiredFiles = [];
        if(globalChatEnabled){
          requiredFiles = files
        }
        else{
          const tree = createDependencyTree(files);
          const activeFile = files.find((file) => file.filePath === activeFileId);
          const dependencyFiles = getDependenciesForFile(tree,activeFile.filePath).filter(file => file.type === "local");
          console.log(dependencyFiles);
          requiredFiles.push(activeFile);
          for (const file of dependencyFiles) {
            const existingFile = files.find(f => f.filePath === file.path);
            if (existingFile) {
              requiredFiles.push(existingFile);
            }
          }
        }
       
        console.log(messages);
        const updationResponse = await axios.post("http://localhost:8001/v1/api/update",{files : requiredFiles,modelVerion:aiModel.version,messages : [...messages.map(message => ({role : message.sender,content : message.content})), {role : "user",content : inputValue}]})
        const newVerionId = `v${Object.keys(versions).length + 1}`;
        // console.log(newVerionId,Object.keys(versions).length + 1);
        const newVersion = {
              id: newVerionId,
              timestamp: new Date(),
              description: inputValue,
              filesChanged: updationResponse.data.files,
        }

        const assistantMessage = {
            id: (Date.now() + 1).toString(),
            content: updationResponse.data.summary,
            sender: "assistant",
            timestamp: new Date(),
            version: updationResponse.data.files.length > 0 ? newVersion : null
        }
        
        console.log(updationResponse.data.files);

        if(updationResponse.data.files.length > 0){
            setFiles((prevFiles) => {
            const updatedFiles = [...prevFiles];
            for (const updatedFile of updationResponse.data.files) {
              const index = updatedFiles.findIndex(f => f.filePath === updatedFile.filePath);
              console.log("Updating file:", updatedFile.filePath, "at index:", index);
              if (index !== -1) {
                updatedFiles[index] = {...updatedFiles[index], content: updatedFile.content };
              }
            }
            setVersions((prev) => ({...prev,[newVerionId] : updatedFiles}));
            setCurrentVersion(newVerionId);
            return updatedFiles;
          });
          setOpenFiles([]);
        }
        
        setMessages((prev) => [...prev, assistantMessage])

        //      const assistantMessage = {
        //     id: (Date.now() + 1).toString(),
        //     content: inputValue,
        //     sender: "assistant",
        //     timestamp: new Date(),
        // }
        // setMessages((prev) => [...prev, assistantMessage])
    }
    catch(err){
      console.log(err);
      const assistantMessage = {
            id: (Date.now() + 1).toString(),
            content: err.response?.data?.message || "An error occurred",
            sender: "assistant",
            timestamp: new Date(),
        }
      // toast.error(err.message);
      setMessages((prev) => [...prev, assistantMessage])
    }
    finally{
      setModificationLoading(false);
    }
  }

  const enhanceQuery = async (query) => {
    if(query.length < 10){
      toast.warning("Prompt is too short to enhance");
      return;
    }
    try{
      const response = await axios.post("http://localhost:8001/v1/api/enhance",{query,modelVerion:aiModel.version});
      console.log(response.data.enhancedQuery);
      return response.data.enhancedQuery;
    }
    catch(err){
      console.log(err);
      toast.error("Failed to enhance the prompt");
      return query;
    }
  }

  const handleAiModel = (model) => {
    setAiModel(model);
  }

  const handleCurrentVersion = (verionId) => {
    setCurrentVersion(verionId);
    setFiles(versions[verionId]);
    setOpenFiles([]);
  }


  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0])
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0])
    }
  }

  const resetUploader = () => {
    setFile(null);
    setCurrentStage(0);
    setCurrentSubStage(0);
    setConversionComplete(false);
  }

  const handleViewCode = () => {
    resetUploader();
    setShowCodeExplorer(true);
  }

  // const getConversionStages = () => {
  //   const sourceLang = programmingLanguages.find((lang) => lang.value === sourceLanguage)?.label || sourceLanguage
  //   const targetLang = programmingLanguages.find((lang) => lang.value === targetLanguage)?.label || targetLanguage

  //   return [
  //     { name: "Upload", description: `Uploading your ${sourceLang} code...` },
  //     { name: "Extracting", description: `Analyzing ${sourceLang} structure and dependencies...` },
  //     { name: "Converting", description: `Converting from ${sourceLang} to ${targetLang}...` },
  //     { name: "Complete", description: `Your ${targetLang} code is ready!` },
  //   ]
  // }
  if(showCodeExplorer){
    return <CodeExplorer enhanceQuery={enhanceQuery} handleAiModel={handleAiModel} globalChatEnabled ={globalChatEnabled} setGlobalChatEnabled={setGlobalChatEnabled} handleCurrentVersion={handleCurrentVersion} currentVersion={currentVersion} versions={versions} setVersions={setVersions} openFiles={openFiles} setOpenFiles={setOpenFiles} modificationLoading={modificationLoading} activeFileId={activeFileId} setActiveFileId={setActiveFileId} messages={messages} handleModificationRequest={handleModificationRequest} files={files} setFiles={setFiles} onBack={() => setShowCodeExplorer(false)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col justify-center">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Universal Code Converter</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your code between programming languages with our AI-powered conversion tool
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle>Convert Your Code</CardTitle>
              <CardDescription>Select languages and upload your project as a .zip file</CardDescription>
            </CardHeader>
            <CardContent>
              {!conversionComplete ? (
                <>
                  <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    <div className="md:col-span-2">
                      <div className="space-y-2">
                        <Label htmlFor="source-language">Source</Label>
                        <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                          <SelectTrigger id="source-language">
                            <SelectValue placeholder="Select source language" />
                          </SelectTrigger>
                          <SelectContent>
                            {programmingLanguages.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <ArrowRight className="h-6 w-6 text-gray-400" />
                    </div>

                    <div className="md:col-span-2">
                      <div className="space-y-2">
                        <Label htmlFor="target-language">Target</Label>
                        <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                          <SelectTrigger id="target-language">
                            <SelectValue placeholder="Select target language" />
                          </SelectTrigger>
                          <SelectContent>
                            {programmingLanguages.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {!isLoading && <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mt-6",
                      dragActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-blue-400 hover:bg-blue-50",
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    <input id="file-upload" type="file" accept=".zip" onChange={handleFileChange} className="hidden" />
                    <UploadCloud className="h-12 w-12 mx-auto text-blue-500 mb-4" />
                    <p className="text-gray-700 mb-2">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">Only .zip files are supported</p>
                  </div>}

                  {file && !error && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-md flex items-center">
                      <FileCode className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm text-gray-700">
                        {file.name} ({(file.size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                  )}

                  {isLoading && (
                    <div className="mt-6">
                      <Timeline
                        currentSubStage={currentSubStage}
                        currentStage={currentStage}
                        stages={stages}
                      />
                      {/* {
                        object?.stages?.map((stage,index) => <p key={index}>{stage?.name}</p>)
                      } */}
                    </div>
                  )}

                  {error && (
                    <div className="mt-4 p-3 bg-red-50 rounded-md flex items-center text-red-600">
                      <span><AlertCircle className="h-5 w-5 mr-2" /></span>
                      <span>{error}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 text-center">
                  <div className="flex justify-center mb-4">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Conversion Complete!</h3>
                  <p className="text-gray-600 mb-6">
                    Your {programmingLanguages.find((lang) => lang.value === sourceLanguage)?.label} code has been
                    successfully converted to{" "}
                    {programmingLanguages.find((lang) => lang.value === targetLanguage)?.label}.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button onClick={handleViewCode} className="px-6">
                      View Code
                    </Button>
                    <Button variant="outline" onClick={resetUploader}>
                      Convert Another Project
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
    </div>
  )
}
