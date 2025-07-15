
import { useEffect, useState,useRef } from "react"
// import { useTheme } from "next-themes"


export function CodeViewer({ file,setFiles,currentOpenedFiles,setCurrentOpenedFiles }) {
  // const [language, setLanguage] = useState("python")
//   const { theme } = useTheme()
  // const isDarkTheme = true;
  const iframeRef = useRef(null);

  // useEffect(() => {
  //   // Determine language based on file extension
  //   const extension = file.fileName.split(".").pop()?.toLowerCase()
  //   switch (extension) {
  //     case "py":
  //       setLanguage("python")
  //       break
  //     case "js":
  //       setLanguage("javascript")
  //       break
  //     case "ts":
  //       setLanguage("typescript")
  //       break
  //     case "tsx":
  //       setLanguage("tsx")
  //       break
  //     case "jsx":
  //       setLanguage("jsx")
  //       break
  //     case "html":
  //       setLanguage("html")
  //       break
  //     case "css":
  //       setLanguage("css")
  //       break
  //     case "json":
  //       setLanguage("json")
  //       break
  //     case "java":
  //       setLanguage("java")
  //       break
  //     default:
  //       setLanguage("text")
  //   }
  // }, [file])
  useEffect(() => {
    // var iFrame = document.getElementById('oc-editor'); // add an ID for the <iframe tag
    // console.log(file.fileName,iframeRef.current)
    // const files2 = files.map(file => ({name:file.fileName,content:file.content}))
    // console.log(files2)
    let timeoutId;
    window.onmessage = function (e) {
        console.log(e)
        if(timeoutId) clearTimeout(timeoutId);
        if (e.data && e.data.language) {
            setCurrentOpenedFiles(e.data.files)
            timeoutId = setTimeout(() => {
              setFiles(prev => {
                let newFiles = prev;
                let changedFiles = e.data.files;
                for(let i=0;i<newFiles.length;i++){
                  for(let j=0;j<changedFiles.length;j++){
                    if(newFiles[i].filePath === changedFiles[j].filePath){
                      newFiles[i] = {...newFiles[i],content:changedFiles[j].content}
                    }
                  }
                }
                console.log(newFiles);
                return newFiles;
              });
              // console.log("called");
            },700)
            console.log(e.data)
            // handle the e.data which contains the code object
        }
    };

    if(iframeRef.current){
      iframeRef.current.contentWindow.postMessage({
          eventType: 'populateCode',
          language: 'python',
          files: currentOpenedFiles.map(file => ({name:file.fileName,content:file.content,filePath:file.filePath}))
      }, "*");
    }
    
  },[currentOpenedFiles])


  return (
    <div className="h-full flex flex-col">
      <div className="p-4 dark:border-gray-800 flex items-center">
        <h2 className="text-lg font-semibold">{file.fileName}</h2>
        <span className="ml-2 text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">{file.filePath}</span>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {/* <SyntaxHighlighter
          language={language}
          style={isDarkTheme ? vscDarkPlus : vs}
          showLineNumbers
          customStyle={{
            margin: 0,
            borderRadius: "4px",
            fontSize: "16px",
            backgroundColor: isDarkTheme ? "#1e1e1e" : "#ffffff",
            height: "100%",
          }}
        >
          {file.content}
        </SyntaxHighlighter> */}
          <iframe 
            ref={iframeRef}
            frameBorder="0"
            height="100%"  
            src="https://onecompiler.com/embed/python?codeChangeEvent=true&listenToEvents=true&hideLanguageSelection=true&hideNew=true&hideRun=true&hideStdin=true&hideResult=true&hideTitle=true" 
            width="100%"
          ></iframe>
      </div>
    </div>
  )
}
// &hideLanguageSelection=true&hideNew=true&hideRun=true&hideNewFileOption=true&hideStdin=true&hideResult=true&hideTitle=true