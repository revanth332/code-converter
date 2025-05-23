import { useState,useEffect} from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { UploadCloud, FileCode, AlertCircle, ArrowRight ,CheckCircle} from "lucide-react"
import { cn } from "@/lib/utils"
import CodeExplorer from "./components/CodeExplorer"
import axios from "axios"
import { Timeline } from "@/components/Timeline"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "./components/ui/button"

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
  const [files, setFiles] = useState([]);
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

        const conversionResponse = await axios.post("http://localhost:8001/v1/api/convert",{filesContent : extractResponse.data.filesContent,sourceLanguage,targetLanguage})
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
        setConversionComplete(true);
      } catch (err) {
        setIsLoading(false);
        if(err.status === 409){
          setError(err?.response?.data?.message)
        }
        else setError("Conversion failed. Please try again.")
      }
    } else {
      setError("Only .zip files are allowed.")
    }
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
    return <CodeExplorer files={files} setFiles={setFiles} onBack={() => setShowCodeExplorer(false)} />
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
                        currentStage={currentStage}
                        currentSubStage={currentSubStage}
                        stages={stages}
                      />
                    </div>
                  )}

                  {error && (
                    <div className="mt-4 p-3 bg-red-50 rounded-md flex items-center text-red-600">
                      <AlertCircle className="h-5 w-5 mr-2" />
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
