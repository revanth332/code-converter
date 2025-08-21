import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {  Bot, User, ArrowUp, Sparkles, Brain, Paperclip, Image, FolderArchive, PanelsTopLeft, ClipboardPen } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import Markdown from "react-markdown";
import { toast } from "sonner"
import { VersionDisplay } from "./VersionDisplay"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";


const aiModels = [
  {
    name : "Gemini 2.5 Pro",
    version : "gemini-2.5-pro"
  },
  {
    name : "Gemini 2.5 Flash",
    version : "gemini-2.5-flash"
  },
  {
    name : "Gemini 2.5 Flash-Lite Preview 06-17",
    version : "gemini-2.5-flash-lite-preview-06-17"
  },
]

const SCREENSHOT_PROMPT=`Objective: Build a functional clone of the application UI in the provided screenshot.
Stack: [ React, Javascript, tailwind, shadcn]
Requirements:
Replicate the layout, components, and styling.
Ensure components are reusable.`

const LANDING_PROMPT=`Generate a complete, single-file React component for a modern landing page using shadcn/ui and Tailwind CSS.
Requirements:
Hero Section: A large, centered headline, a descriptive paragraph, and two call-to-action Button components (e.g., "Get Started" and "Learn More").
Features Section: A 3-column grid displaying features, each within a Card component containing an icon, a title, and a short description.
Footer: A simple footer with social media links.
Assume shadcn/ui is installed`;

const SIGNIN_PROMPT=`Generate a complete, single-file React component for a modern, minimalist sign-in page using shadcn/ui and Tailwind CSS.
Requirements:
A centered Card on a clean background.
Inside the card: "Sign In" title, Label and Input fields for Email and Password, and a primary Button to submit.
Below the primary button, include a separator with "OR" text.
Add two secondary/outline Button components for social logins (e.g., "Sign in with Google," "Sign in with GitHub"), each with an appropriate icon.
Assume shadcn/ui is installed.`

const PORTFOLIO_PROMPT=`Generate a complete, single-file React component for a clean, modern personal portfolio website using shadcn/ui and Tailwind CSS.
Requirements:
Hero/Intro Section: Use an Avatar for a profile picture, a main heading for your name, a subheading for your title (e.g., "Software Engineer"), and social link buttons.
Projects Section: A grid of Card components. Each project Card must include an image, a title, a brief description, and tech stack Badge components (e.g., "React", "Node.js").
Skills Section: A simple section listing key skills using Badge components.
Assume shadcn/ui is installed`

export function ChatInterface({handleUpload,showCodeExplorer,enhanceQuery,handleAiModel,globalChatEnabled,setGlobalChatEnabled, onModificationRequest,messages,openFiles, activeFileId,handleFileSelect,handleCurrentVersion }) {

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef(null);
  const textAreaRef = useRef(null);
  const [isEnhancingQuery,setIsEnhancingQuery] = useState(false);
  const imageFileInputRef = useRef(null);
  const screenshotFileInputRef = useRef(null);
  const [selectedImageFile,setSelectedImageFile] = useState(null);
  const [selectedScreenshotFile,setSelectedScreenshotFile] = useState(null);
  const zipFileInputRef = useRef(null);

  useEffect(() => {
    if(selectedScreenshotFile && selectedScreenshotFile.file){
      const buildFromScreenshot = async ()  => {
        setIsLoading(true)
        try{
          console.log(selectedScreenshotFile.file);
          await onModificationRequest(SCREENSHOT_PROMPT,selectedScreenshotFile?.file);
      }
      catch(err){
        console.log(err);
        setSelectedScreenshotFile(null)
      }
      finally{
        setIsLoading(false);
      }
    }
    buildFromScreenshot()
  }
  },[selectedScreenshotFile])

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleImageUploadButton = () => {
    if(imageFileInputRef.current){
      imageFileInputRef.current.click();
    }
  }

  const handleImageFileChange = (e,type) => {
    const file = e.target.files[0]
    console.log(file);
    if(type === "image"){
        setSelectedImageFile({
        name : file.name,
        url : URL.createObjectURL(file),
        type :file.type,
        file : file
      })
    }
    else if(type === "screenshot"){
      setSelectedScreenshotFile({
        name : file.name,
        url : URL.createObjectURL(file),
        type :file.type,
        file : file
      })
    }
  }

  const handleZipUploadButton = () => {
    if(zipFileInputRef.current){
      zipFileInputRef.current.click();
    }
  }
  const handleZipFileChange = async (e) => {
    const file = e.target.files[0]
    console.log(file);
    await handleUpload(file);
  }

  // const handleDeleteFile

  const handleSendMessage = async (inputValue) => {
    if (!inputValue.trim() || isLoading) return;
    // if(!activeFileId){
    //   toast.warning("Please select a file to modify.");
    //   return;
    // }
    setInputValue("")
    setIsLoading(true);
    if(textAreaRef.current) {
        textAreaRef.current.style.height = "auto"; // Reset height
    }
    try{
      await onModificationRequest(inputValue,selectedImageFile?.file);
    }
    catch(err){
      console.log(err);
    }
    finally{
      setIsLoading(false);
    }
  }

  // const handleKeyPress = (e) => {
  //   if (e.key === "Enter" && !e.shiftKey) {
  //     e.preventDefault()
  //     handleSendMessage()
  //   }
  // }

  const handleEnhanceQuery = async () => {
    setIsEnhancingQuery(true);
    const query = await enhanceQuery(inputValue);
    setInputValue(query);
    setIsEnhancingQuery(false);
  }

  const handleBuildingScreenshot = async () => {
    if(screenshotFileInputRef.current){
      screenshotFileInputRef.current.click();
    }
  }

  const activeFile = openFiles.find((file) => file.filePath === activeFileId);

  if(!showCodeExplorer) {
   return (
      <div className="p-4 w-full h-full flex flex-col gap-4 justify-center items-center">
        <h2 className="text-4xl font-semibold">
          Lets build something new today!
        </h2>
        <div className="bg-white max-w-3xl w-full bb rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
          {/* Text Area on Top */}
          {
          (selectedImageFile && selectedImageFile.type.includes("image")) && <div className="px-4 pt-2">
            <img src={selectedImageFile.url} className="h-10 w-10 border-2 rounded-md border-gray-500" alt="uploaded image" />
          </div>
          }
          <div className="p-4 pb-2">
            <textarea
              ref={textAreaRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                // Auto-resize textarea
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }
              }}
              placeholder="Ask a follow up..."
              className="w-full text-sm resize-none border-0 bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 leading-6 min-h-[24px] max-h-[200px]"
              rows={1}
              disabled={isEnhancingQuery}
            />
          </div>

          {/* Controls Below */}
          <div className="flex items-center justify-between p-2">
            {/* Right side controls */}
            <div className="flex">
              <Select onValueChange={handleAiModel}>
                    <SelectTrigger className="w-fit h-5 border-none hover:bg-gray-100 px-0 pl-2 mr-2">
                      <Brain className="h-5 w-5" />
                      {/* <SelectValue placeholder="V1" /> */}
                    </SelectTrigger>
                    <SelectContent>
                      {
                       aiModels.map((model,index) => <SelectItem key={index} value={model}>{model.name}</SelectItem>)
                      }
                    </SelectContent>
              </Select>
              { (activeFile && !globalChatEnabled) && <Badge variant="secondary">{activeFile.fileName}</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <Button
                disabled={isLoading || isEnhancingQuery}
                size="sm"
                variant={"ghost"}
                onClick={() => handleImageUploadButton()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <input onChange={(e) => handleImageFileChange(e,"image")} ref={imageFileInputRef} className="hidden" type="file" />
              <Button
                disabled={(!inputValue.trim()) || isLoading || isEnhancingQuery}
                size="sm"
                variant={"ghost"}
                onClick={() => handleEnhanceQuery()}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => handleSendMessage(inputValue)}
                disabled={(!inputValue.trim()) || isLoading || isEnhancingQuery}
                size="sm"
                className="h-8 w-8 p-0 rounded-full bg-miracle-darkBlue hover:bg-miracle-darkBlue/80 disabled:opacity-50 disabled:cursor-not-allowed border-0"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4 text-white" />
                )}
              </Button>
            </div>
            
          </div>
          
        </div>

        <div className="max-w-3xl w-full flex justify-between">
          <button onClick={handleBuildingScreenshot} className="border shadow-md rounded-xl p-2 text-sm text-gray-600 flex items-center gap-2"><Image className="h-4 w-4" /> Build from Screenshot</button>
          <input onChange={(e) => handleImageFileChange(e,"screenshot")} ref={screenshotFileInputRef} className="hidden" type="file" />
          <button onClick={() => handleZipUploadButton()} className="border shadow-md rounded-xl p-2 text-sm text-gray-600 flex items-center gap-2"><FolderArchive className="h-4 w-4" /> Upload a Project</button>
          <input onChange={handleZipFileChange} type="file" className="hidden" ref={zipFileInputRef} />
          <button onClick={() => handleSendMessage(LANDING_PROMPT)} className="border shadow-md rounded-xl p-2 text-sm text-gray-600 flex items-center gap-2"><PanelsTopLeft className="h-4 w-4" /> Landing Page</button>
          <button onClick={() => handleSendMessage(SIGNIN_PROMPT)} className="border shadow-md rounded-xl p-2 text-sm text-gray-600 flex items-center gap-2"><ClipboardPen className="h-4 w-4" /> Sign In Page</button>
          <button onClick={() => handleSendMessage(PORTFOLIO_PROMPT)} className="border shadow-md rounded-xl p-2 text-sm text-gray-600 flex items-center gap-2"><ClipboardPen className="h-4 w-4" /> Portfolio Page</button>
        </div>
      </div>
   )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <h3 className="font-semibold text-sm">Code Assistant</h3>
        {/* <p className="text-xs text-gray-500">Ask me to modify your converted code</p> */}
      </div>
 
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex items-start space-x-2")}
            >
              {message.sender === "assistant" && (
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Bot className="w-3 h-3 text-white" />
                </div>
              )}
              {message.sender === "user" && (
                <div className="flex-shrink-0 w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[100%] rounded-lg text-sm leading-6",
                  message.sender === "user"
                    ? "ml-auto"
                    : "dark:text-gray-100",
                )}
              >
                <Markdown>{message.content}</Markdown>
                {message.version && <VersionDisplay handleCurrentVersion={handleCurrentVersion} handleFileSelect={handleFileSelect} version={message.version} />}
              </div>

            </div>
          ))}
          {isLoading && (
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to modify the code..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div> */}
      <div className="p-4">
        <div className="flex justify-end py-2 pr-1">
          <span className="text-gray-500 font-semibold text-sm mr-2">Global</span> <Switch onCheckedChange={setGlobalChatEnabled} checked={globalChatEnabled} className="h-5 w-10" /> 
        </div>
        <div className="bg-white w-full rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
          {/* Text Area on Top */}
          <div className="p-4 pb-2">
            <textarea
              ref={textAreaRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                // Auto-resize textarea
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }
              }}
              placeholder="Ask a follow up..."
              className="w-full text-sm resize-none border-0 bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 leading-6 min-h-[24px] max-h-[200px]"
              rows={1}
              disabled={isEnhancingQuery}
            />
          </div>

          {/* Controls Below */}
          <div className="flex items-center justify-between p-2">
            {/* Right side controls */}
            <div className="flex">
              <Select onValueChange={handleAiModel}>
                    <SelectTrigger className="w-fit h-5 border-none hover:bg-gray-100 px-0 pl-2 mr-2">
                      <Brain className="h-5 w-5" />
                      {/* <SelectValue placeholder="V1" /> */}
                    </SelectTrigger>
                    <SelectContent>
                      {
                       aiModels.map((model,index) => <SelectItem key={index} value={model}>{model.name}</SelectItem>)
                      }
                    </SelectContent>
              </Select>
              { (activeFile && !globalChatEnabled) && <Badge variant="secondary">{activeFile.fileName}</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <Button
                disabled={(!inputValue.trim()) || isLoading || isEnhancingQuery}
                size="sm"
                variant={"ghost"}
                onClick={() => handleEnhanceQuery()}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => handleSendMessage(inputValue)}
                disabled={(!inputValue.trim()) || isLoading || isEnhancingQuery}
                size="sm"
                className="h-8 w-8 p-0 rounded-full bg-miracle-darkBlue hover:bg-miracle-darkBlue/80 disabled:opacity-50 disabled:cursor-not-allowed border-0"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4 text-white" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
