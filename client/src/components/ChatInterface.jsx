import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {  Bot, User, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import Markdown from "react-markdown";
import { toast } from "sonner"
import { VersionDisplay } from "./VersionDisplay"
import { Switch } from "@/components/ui/switch"

export function ChatInterface({globalChatEnabled,setGlobalChatEnabled, onModificationRequest,messages,openFiles, activeFileId,handleFileSelect,handleCurrentVersion }) {

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef(null);
  const textAreaRef = useRef(null);
  

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

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    if(!activeFileId){
      toast.warning("Please select a file to modify.");
      return;
    }
    setInputValue("")
    setIsLoading(true);
    if(textAreaRef.current) {
        textAreaRef.current.style.height = "auto"; // Reset height
    }
    try{
      await onModificationRequest(inputValue);
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

  const activeFile = openFiles.find((file) => file.filePath === activeFileId);

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
            />
          </div>

          {/* Controls Below */}
          <div className="flex items-center justify-between p-2">
            {/* Right side controls */}
            <div>
              { (activeFile && !globalChatEnabled) && <Badge variant="default">{activeFile.fileName}</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleSendMessage(inputValue)}
                disabled={(!inputValue.trim()) || isLoading}
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
