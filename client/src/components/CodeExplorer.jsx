import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileExplorer } from "./FileExplorer"
import { ChatInterface } from "./ChatInterface"
import { cn, parseFileStructure } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Check, Copy, DownloadCloud, FolderSync, Loader, Loader2, Play, Save, TerminalSquare } from "lucide-react"
import { TabbedEditor } from "./TabbedEditor"
import UpdateLoader from "./UpdateLoader"
import axios from "axios"
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
// import { ThemeToggle } from "@/components/theme-toggle"

// interface CodeExplorerProps {
//   files: FileData[]
//   setFiles: (files: FileData[]) => void
//   onBack?: () => void
// }

function findLastPortInUse(logString) {
  const pattern = /Port \d+ is in use/g;
  const matches = logString.match(pattern);

  if (matches && matches.length > 0) {
    // Get the last match from the array
    const lastMatch = matches[matches.length - 1];
    // Extract the number from the last match string
    const portNumberMatch = lastMatch.match(/\d+/);
    if (portNumberMatch) {
      return parseInt(portNumberMatch[0], 10);
    }
  }

  return null;
}

export default function CodeExplorer({handleUpload,showCodeExplorer,enhanceQuery,handleAiModel,currentVersion,versions,handleCurrentVersion,globalChatEnabled,setGlobalChatEnabled, files, setFiles, onBack,openFiles,setOpenFiles, messages,handleModificationRequest,activeFileId,setActiveFileId,modificationLoading }) {
  const fileStructure = parseFileStructure(files)
  const [hasChanges,setHasChanges] = useState(false);
  const [copied,setCopied] = useState(false);
  const [code,setCode] = useState("");
  const [displayType,setDisplayType] = useState("code");
  const [codeRunning,setCodeRunning] = useState(false);
  const [codeRunLoading,setCodeRunLoading] = useState(false);
  const [isTerminalOpen,setIsTerminalOpen] = useState(false);
  const [terminalMessages,setTerminalMessages] = useState([]);
  // const eventSourceRef = useRef(null);
  // const terminalRef = useRef(null)
  const wsRef = useRef(null);
  const [runningPort,setRunningPort] = useState(null);

  // useEffect(() => {
  //   // This is the cleanup function.
  //   return () => {
  //     if (eventSourceRef.current) {
  //       console.log('Closing EventSource connection.');
  //       eventSourceRef.current.close();
  //     }
  //   };
  // }, []);

  useEffect(() => {
  // Setup WebSocket connection
  wsRef.current = new WebSocket('ws://localhost:8081'); // Use your WS server port

  wsRef.current.onopen = () => {
    console.log('WebSocket connection established');
  };

  wsRef.current.onmessage = (event) => {
    try {
      console.log(event.data);
      const msg = JSON.parse(event.data);
      if (msg.type === 'stdout' || msg.type === 'stderr') {
        console.log(msg)
        if(msg.data.trim() !== "") setTerminalMessages(prev => [...prev,{type:msg.type,content : "\n"+msg.data}]);
        if(msg.type === "stdout" && msg.data.includes("Port")){
          const port = findLastPortInUse(msg.data)
          setRunningPort(port+1);
        }
        setIsTerminalOpen(true);
        setCodeRunning(true);
        setCodeRunLoading(false);
      }
      if (msg.type === 'close') {
        setTerminalMessages(prev => [...prev,{type : "stdout",content : `\n--- Process exited with code ${msg.code} ---`}]);
        setCodeRunning(false);
      }
    } catch (err) {
      console.error('WebSocket message parse error:', err);
    }
  };

  wsRef.current.onerror = (err) => {
    console.log(err,"error");
    // setTerminalMessages(prev => prev + '\n--- WebSocket error ---');
    // setCodeRunLoading(false);
  };

  wsRef.current.onclose = () => {
    console.log('WebSocket connection closed');
  };

  return () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
  };
}, []);


  const handleFileSelect = (file,source,versionId) => {
    // Add to open files if not already open
    if(hasChanges){
      toast.warning("You have unsaved changes in the current file.")
    }
    else{
      // console.log(source,versionId,currentVersion);
      if(source === "version" && versionId !== currentVersion){
        handleCurrentVersion(versionId);
        setOpenFiles([file]);
      }
      else{
        if (!openFiles.find((f) => f.filePath === file.filePath)) {
          setOpenFiles((prev) => [...prev, file])
        }
      }
      setActiveFileId(file.filePath)
    }

  }

  const handleFileClose = (fileId) => {
    if(hasChanges){
      toast.warning("You have unsaved changes in the current file.");
      return;
    }
    setOpenFiles((prev) => prev.filter((f) => f.filePath !== fileId))
    if (activeFileId === fileId) {
      const remainingFiles = openFiles.filter((f) => f.filePath !== fileId)
      setActiveFileId(remainingFiles.length > 0 ? remainingFiles[remainingFiles.length - 1].filePath : null)
    }
  }

  const handleTabSelect = (fileId) => {
    if(hasChanges){
      toast.warning("You have unsaved changes in the current file.");
      return;
    }
    setActiveFileId(fileId)
  }

  const handleFileSave = () => {
    // Update the files state
    setFiles(files.map((file) => (file.filePath === activeFileId ? {...file,content:code} : file)))

    // Update the open files
    setOpenFiles((prev) => prev.map((file) => (file.filePath === activeFileId ? {...file,content:code} : file)));
    setHasChanges(false);
  }

  const handleDownloadCode = async () => {
    try{
      const response = await axios.post('http://localhost:8001/v1/api/convert/download', {files},{
        responseType: 'blob', // Important: Set the response type to 'blob'
      });
      console.log(response);
      const blob = await response.data;
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "code_converter.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }
    catch(err){
      console.log("Error downloading code:", err)
    }
  }

  const applyCodeLocal = async () => {
    try{
      await axios.post('http://localhost:8001/v1/api/apply/local', {files});
    }
    catch(err){
      console.log(err)
    }
  }

  const handleCopyCode = () => {
      const activeFile = openFiles.find((file) => file.filePath === activeFileId);
      navigator.clipboard.writeText(activeFile.content)
        .then(() => {
          toast.success("Code copied to clipboard");
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
          console.error("Failed to copy code: ", err)
          toast.error("Failed to copy code")
        })
  
    }
  
  const handleSave = () => {
    const activeFile = openFiles.find((file) => file.filePath === activeFileId);
    handleFileSave({...activeFile,content:code});
    setHasChanges(false);
  }

  const handleDisplayType = (type) => {
    setDisplayType(type);
    // setCodeRunning(false);
  }

  // const handleRunCode = async () => {
  //   try{
  //     // console.log(files[0].filePath.split("/")[0]);
  //     setIsTerminalOpen(true);
  //     setCodeRunLoading(true);
  //     // const response = await axios.post('http://localhost:8001/v1/api/code/run',{folder:files[0].filePath.split("/")[0]});
  //     const es = new EventSource('http://localhost:8001/v1/api/code/run?folder='+files[0].filePath.split("/")[0]);
  //     eventSourceRef.current = es;
  //     setTerminalMessages(prev => prev);
  //     es.onmessage = (event) => {
  //       const message = event.data;
  //       if (message === '[DONE]') {
  //         setTerminalMessages((prev) => prev + '\n--- Process finished or stopped. ---');
  //         es.close();
  //       } else {
  //         if(codeRunLoading) setCodeRunLoading(false);
  //         if(!codeRunning) setCodeRunning(true);
  //         console.log(message);
  //         setTerminalMessages((prev) => prev +"\n"+message);
  //       }
  //     };
  //      es.onerror = (err) => {
  //         console.error('EventSource failed:', err);
  //         setTerminalMessages((prev) => prev + '\n--- Error connecting to the server. ---');
  //         es.close();
  //         setCodeRunLoading(false);
  //       };
  //   }
  //   catch(err){
  //     console.log(err)
  //   }
  //   finally{
  //     setCodeRunLoading(false);
  //   }
  // }

  const handleRunCode = async () => {
  try {
    setIsTerminalOpen(true);
    setCodeRunLoading(true);
    await axios.post('http://localhost:8001/v1/api/code/run', { folder: files[0].filePath.split("/")[0] });
    // Output will come via WebSocket
  } catch (err) {
    console.log(err);
  } finally {
    setCodeRunLoading(false);
  }
};

   const handleStopCode = async () => {
    try{
     await axios.get("http://localhost:8001/v1/api/code/stop?port="+runningPort+"&folder="+files[0].filePath.split("/")[0]);
     setCodeRunning(false);
     setDisplayType("code")
    }
    catch(err){
      console.log(err)
    }
   }
  
  // const handleRunCode = async () => {
  //   try{
  //     // console.log(files[0].filePath.split("/")[0]);
  //     setCodeRunLoading(true);
  //     const response = await axios.post('http://localhost:8001/v1/api/code/run',{folder:files[0].filePath.split("/")[0]});
  //     setTerminalMessages(prev => [...prev,response.data.runInfo]);
  //     if(response.data.runInfo.type === "error"){
  //       setIsTerminalOpen(true);
  //       setCodeRunning(false);
  //     }
  //     setCodeRunning(true);
  //   }
  //   catch(err){
  //     console.log(err)
  //   }
  //   finally{
  //     setCodeRunLoading(false);
  //   }
  // }

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900 w-full">
      {/* Header */}
      <div className="px-2 py-3 flex items-center justify-between w-full h-[6%]">
        <div className="flex items-center space-x-4">

          <h1 className="text-lg font-semibold">Vibe Code</h1>
          <p>/</p>
          <p>Untitled Project</p>
        </div>
        <div>
          <Button className="text-purple-600 hover:text-purple-500" size={"sm"} variant={"ghost"} onClick={applyCodeLocal}><FolderSync className="h-4 w-4 mr-2 " />Apply</Button>
          <Button size={"sm"} variant={"ghost"} onClick={handleDownloadCode}><DownloadCloud className="h-4 w-4 mr-2" />Download</Button>
        </div>

        {/* <ThemeToggle /> */}
      </div>

      <div className="flex px-2 pb-2 gap-2 h-[94%] w-full">
        {/* Section 1: Chat Interface */}
        <div className={("flex-shrink-0 bg-white dark:bg-gray-800 border rounded-lg",showCodeExplorer ? "w-96" : "w-full")}>
              <Card className="h-full border-0">
                {/* <CardHeader className="pb-2">
                  <CardTitle className="text-lg">AI Assistant</CardTitle>
                </CardHeader> */}
                <CardContent className="p-0 h-full">
                  <ChatInterface handleUpload={handleUpload} showCodeExplorer={showCodeExplorer} enhanceQuery={enhanceQuery} handleAiModel={handleAiModel} globalChatEnabled ={globalChatEnabled} setGlobalChatEnabled={setGlobalChatEnabled} handleCurrentVersion={handleCurrentVersion} handleFileSelect={handleFileSelect} activeFileId={activeFileId} openFiles={openFiles} onModificationRequest={handleModificationRequest} messages={messages} />
                </CardContent>
              </Card>
            </div>
        
        <div className={cn("relative border rounded-lg overflow-hidden",showCodeExplorer ? "flex-1 flex flex-col" : "hidden" )}>
            <div className="bg-white p-2 rounded-lg border-b rounded-e-none rounded-b-none flex justify-between border items-center">
              <div>
                  <button onClick={() => handleDisplayType("code")} className={cn("font-semibold text-sm mr-5 p-1 px-2 rounded-md", displayType === "code" && "bg-gray-100")}>Code</button>
                  {codeRunning
                  ? <button onClick={() => handleDisplayType("preview")} className={cn("font-semibold text-sm p-1 px-2 rounded-md",displayType === "preview" && "bg-gray-100")}>Preview</button>
                  : <button disabled={codeRunLoading} onClick={() => handleRunCode()} className={cn("font-semibold text-sm p-1 px-2 rounded-md bg-green-100 text-green-600")}>
                    {codeRunLoading ? <Loader2 className="h-3 w-3 inline animate-spin mr-1" /> : <Play className="h-3 w-3 inline mr-1" /> }
                    Run</button>}
                  {
                    codeRunning && <button onClick={() => handleStopCode()} className={cn("font-semibold text-sm p-1 px-2 rounded-md bg-red-100 text-red-600 ml-5")}> <Play className="h-3 w-3 inline mr-1" /> Stop</button>
                  }
              </div>

                <div className="flex gap-3">
                  {!copied
                  ? <button className="p-0" onClick={() => handleCopyCode()}>
                      <Copy className="w-4 h-4" />
                    </button>
                  : <button>
                      <Check className="w-4 h-4" />
                    </button>}
                  <button onClick={() => handleSave()} className="disabled:text-gray-400" disabled={!hasChanges}>
                    <Save className="w-4 h-4" />
                  </button>
                  <Select value={currentVersion} onValueChange={handleCurrentVersion}>
                    <SelectTrigger className="w-fit h-5">
                      <SelectValue placeholder="V1" />
                    </SelectTrigger>
                    <SelectContent>
                      {
                        Object.keys(versions).map((version,index) => <SelectItem key={index} value={version}>{version}</SelectItem>)
                      }
                      
                    </SelectContent>
                  </Select>
                </div>
            </div>
            {
            modificationLoading ? <div className="h-full relative bg-white w-full">
                  <div className="rounded-lg absolute top-0 left-0 z-10 bg-white h-full w-full">
                    <div className="flex items-center justify-center h-full flex-col">
                      <div className="h-60 w-60 relative">
                        <UpdateLoader />
                      </div>
                      <div className="w-full flex justify-center text-gray-900 font-semibold">
                        Generating {openFiles.find((f) => f.filePath === activeFileId)?.filePath}
                      </div>
                    </div>
                </div>
                </div>
             : displayType === "code"
              ? <div className="flex flex-1 h-[80%]">
                {modificationLoading && <div className="h-full relative bg-white bb w-full">
                  <div className="rounded-lg absolute top-0 left-0 z-10 bg-white h-full w-full">
                    <div className="flex items-center justify-center h-full flex-col">
                      <div className="h-60 w-60 relative">
                        <UpdateLoader />
                      </div>
                      <div className="w-full flex justify-center text-gray-900 font-semibold">
                        Generating {openFiles.find((f) => f.filePath === activeFileId)?.filePath}
                      </div>
                    </div>
                </div>
                </div>
                }
                <div className="w-80  flex-shrink-0 bg-white border-r dark:bg-gray-800 rounded-lg">
                  <Card className="h-full rounded-r-none border-0 bg-gray-50">
         
                    <CardContent className="p-0 h-[calc(100%-80px)] overflow-auto">
                      <FileExplorer
                        fileStructure={fileStructure}
                        files={files}
                        openFiles={openFiles}
                        onFileSelect={handleFileSelect}
                      />
                    </CardContent>
                  </Card>
                </div>

                <div className="flex-1 min-w-0 ">
                  <Card className="h-full rounded-s-none border-0">
                    <CardContent className="p-0 h-full w-full ">
                      <TabbedEditor
                        hasChanges={hasChanges}
                        setHasChanges={setHasChanges}
                        openFiles={openFiles}
                        activeFileId={activeFileId}
                        onFileSelect={handleTabSelect}
                        onFileClose={handleFileClose}
                        onFileSave={handleFileSave}
                        setCode={setCode}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            :  <div className="flex flex-1 h-[80%] relative">
                {/* <div className="h-full w-full flex justify-center items-center bg-white"><Loader2 className="animate-spin h-10 w-10 text-gray-500 " /></div> */}
                <iframe className="border" height={"100%"} width={"100%"} src={"http://localhost:"+runningPort} />
              </div>
            }
            {!isTerminalOpen
            ? <div className="bg-white">
              {/* <p className="p-2 text-sm border"> */}
                <button onClick={() => setIsTerminalOpen(true)} className="flex items-center gap-2 p-2 text-sm border w-full"><TerminalSquare className="h-4 w-4" /> Terminal</button>
              {/* </p> */}
              </div>
            : <div className="bg-white h-[250px] absolute bottom-0 flex flex-col w-full z-50">
              {/* <p className="p-2 text-sm border"> */}
                <button onClick={() => setIsTerminalOpen(false)} className="flex items-center gap-2 p-2 text-sm border w-full"><TerminalSquare className="h-4 w-4" /> Terminal</button>
              {/* </p> */}
              <div className="overflow-auto h-full w-full">
                {
                  terminalMessages.map((msg,index) => {
                    return <span key={index} className={cn("text-sm p-2",msg.type === "stderr" ? "text-red-500" : "text-green-500 ")}>
                            {msg.content}<br></br>
                          </span>
                  })
                }
                {/* <p className="text-sm text-red-500 p-2 whitespace-pre">{terminalMessages}</p> */}
              </div>
              </div>}
        </div>
      </div>
    </div>
  )
}
