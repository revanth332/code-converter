import { createAzure } from "@ai-sdk/azure";
import { generateObject,generateText } from "ai";
import config from "../../../../../config.js";
import multer from "multer";
import AdmZip from "adm-zip";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { z } from 'zod';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamObject } from 'ai';
import { exec } from "child_process";
import { spawn } from "child_process";
import readline from 'readline';
const __dirname = dirname(fileURLToPath(import.meta.url));
import { wss } from "../utils/webSocketManager.js";

let devProcess = null;

const ansiRegex = /[\u001b\u009b][[()#;?]*.{0,2}(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

const azure = createAzure({
  resourceName: config.AZURE_OPENAI_RESOURCE,
  apiKey: config.AZURE_OPENAI_KEY,
});

const ignorableFiles = ["node_modules","__pycache__","vendor","venv",".exe",".pdf","pyvenv.cfg","env",".venv","site-packages","dist","build","target","bin","obj","pkg",".m2",".gradle",".idea",".vscode",".next",".angular",".svelte-kit",".nuxt",".cache",".pytest_cache",".mypy_cache","coverage",".coverage",".git",".svn",".hg",".DS_Store","Thumbs.db","package-lock.json"
]

// const prompt = `you are a professional developer proficient in both node js and python. Your job is to convert node js applications into flask applications by mantaining the exact working of the application. You will be provided with the content containing file names and their content.Analyse the file content, understand its role in the application. Reconstruct the same behaviour using python code. Strictly avoid creating placeholder functions. The generated code should be at least production level. Remember that you are replicating the behaviour of node js application into flask application. So handling every function logic is very important. You need to generate a JSON object that contains file names along with their paths prefixed with '<suitble application name that resembles the behaviour of the code>/' as keys and their content which is python equivalant code as values. Don't put any explanations or instructions inside the code and just provide the JSON object. Package.json file shuold beconverted to requirements.txt file that is used in the flask application you converted. Dont blindly write every module in package.json into requirements.text. Some modules may not be found in python and some may have equivalant packages in python. If you dont find any equivalant module, dont mention it in requirements file and handle related logic in code with other modules.`

// const prompt = `You are a specialized AI model designed for converting source code from one programming language or framework to another. 'Your Task': Convert the provided code files from a specified source language/framework ('[SOURCE_LANGUAGE/FRAMEWORK]') to a specified target language/framework ('[TARGET_LANGUAGE/FRAMEWORK]'). 'Input': You will receive input representing one or more code files. Each input will consist of a 'filename' and its 'content'. The overall input structure will represent a collection of these files. 'Required Parameters': You **must** know the original source language/framework and the desired target language/framework. These will be provided explicitly as: *   'SOURCE_LANG': '[SOURCE_LANGUAGE/FRAMEWORK]' *   'TARGET_LANG': '[TARGET_LANGUAGE/FRAMEWORK]' 'Conversion Logic': 1.  Analyze the provided code content for each file. 2.  Understand the code's logic, structure, and functionality in the 'SOURCE_LANG'. 3.  Re-implement the equivalent logic, structure, and functionality in the 'TARGET_LANG'. 4.  Translate syntax, keywords, standard library calls, and common patterns appropriately for the 'TARGET_LANG'. 5.  Maintain the original intent and behavior of the code as closely as possible. 6.  Preserve comments where relevant and translate them if necessary/possible. 7.  Handle common language features and standard libraries. If specific, complex libraries or frameworks are used, attempt to find equivalents or provide comments indicating where manual adaptation might be needed. 'Output Format': Your output **must** be a single JSON object. *   The keys of the JSON object must be the original 'filename's from the input. *   The value associated with each 'filename' key must be a string containing the *converted code content* for that file in the 'TARGET_LANG'. *   **IMPORTANT:** JSON requires keys and string values to be enclosed in **double quotes (")**. Adhere strictly to standard JSON formatting for the output. 'Strict Instructions': *   Generate **only** the JSON object. Do not include any introductory text, explanations, conversational remarks, or markdown formatting (like triple backticks json ) outside the JSON object itself. *   Ensure the JSON is valid and correctly formatted using **double quotes (")** for keys and string values. *   If a file cannot be converted (e.g., due to extreme complexity, ambiguity, or unsupported features), include the filename in the JSON but provide an informative error message or placeholder content as the value for that file (e.g., '"filename": "// Error: Conversion failed due to [reason]"') rather than attempting a partial or incorrect conversion. You need to generate a JSON object that contains file names along with their paths prefixed with '<suitble application name that resembles the behaviour of the code>/' as keys and their content which is [TARGET_LANGUAGE/FRAMEWORK] equivalant code as values. Every framework has its own dependency file like package.json for node.js and requirements.txt for python related frameworks etc., So strictly add dependency file for every conversion.`


// const CONVERSION_PROMPT = `You are a specialized AI model designed for converting source code from one programming language or framework to another. 'Your Task': Convert the provided code files from a specified source language/framework ('[SOURCE_LANGUAGE/FRAMEWORK]') to a specified target language/framework ('[TARGET_LANGUAGE/FRAMEWORK]'). 'Input': You will receive input representing one or more code files. Each input will consist of a 'filename' and its 'content'. The overall input structure will represent a collection of these files. 'Required Parameters': You **must** know the original source language/framework and the desired target language/framework. These will be provided explicitly as: *   'SOURCE_LANG': '[SOURCE_LANGUAGE/FRAMEWORK]' *   'TARGET_LANG': '[TARGET_LANGUAGE/FRAMEWORK]' 'Conversion Logic': 1.  Before attempting conversion, filter the input files. **Exclude files residing within directories commonly used for dependency installation, build outputs, or runtime caches** (e.g., 'node_modules', '__pycache__', 'vendor', 'bin', 'obj', '.m2', 'dist', 'build'). Focus conversion only on the remaining source code files that represent the project's core logic. 2.  Analyze the code content for each *filtered* source file. 3.  Understand the code's logic, structure, and functionality in the 'SOURCE_LANG'. 4.  Re-implement the equivalent logic, structure, and functionality in the 'TARGET_LANG'. 5.  Translate syntax, keywords, standard library calls, and common patterns appropriately for the 'TARGET_LANG'. 6.  Maintain the original intent and behavior of the code as closely as possible. 7.  Preserve comments where relevant and translate them if necessary/possible. 8.  Handle common language features and standard libraries. If specific, complex libraries or frameworks are used, attempt to find equivalents or provide comments indicating where manual adaptation might be needed. 9.  **Identify necessary external dependencies** required by the converted 'TARGET_LANG' code and the '[TARGET_LANGUAGE/FRAMEWORK]'. 10. **Determine the standard dependency management file name** for the '[TARGET_LANGUAGE/FRAMEWORK]' (e.g., 'package.json' for Node.js, 'requirements.txt' for Python, 'Gemfile' for Ruby, 'pom.xml' or 'build.gradle' for Java, 'composer.json' for PHP, '.csproj' for .NET, 'go.mod' for Go). Also make sure to not write comments in this dependency management file. 11. **Generate the content for this dependency management file** based on the identified dependencies. 12. If the user input code is not in [SOURCE_LANGUAGE/FRAMEWORK] framework, then don't convert the code and generate an output in this format : {success : false, message : 'Source language mismatch : The provided code is in <framework used in code> and input framework is [SOURCE_LANGUAGE/FRAMEWORK].'} 13. Also the generate the stages of code conversion explaining how you are converting containing 4-5 stages. 14. While generating functions in javascript, don't wrap multiline strings with single or double quotes. Instead use single backticks. Otherwise it leads to errors. 15. Provide the complete and exact file and directory structure of the generated application. Include all necessary empty placeholder files (e.g., __init__.py for Python packages, index.js for some Node.js modules) to ensure correct package recognition. 16. Above all, the generated code must be directly runnable and free of common startup errors. 'Output Format': Your output **must** be a single JSON object. *   The keys of the JSON object must be the original 'filename's from the input. *   The value associated with each 'filename' key must be a string containing the *converted code content* for that file in the 'TARGET_LANG'. *   Prefix the key for *every* file in the output JSON (both converted code files and the dependency file) with the chosen application name followed by a forward slash '/'. * 17.Use relative import whenever possible and avoid absolute paths.   **IMPORTANT:** JSON requires keys and string values to be enclosed in **double quotes (")**. Adhere strictly to standard JSON formatting for the output. 'Strict Instructions': *   Generate **only** the JSON object. Do not include any introductory text, explanations, conversational remarks, or markdown formatting (like triple backticks) outside the JSON object itself. *   Ensure the JSON is valid and correctly formatted using **double quotes (")** for keys and string values. *   If a file cannot be converted (e.g., due to extreme complexity, ambiguity, or unsupported features), include the filename in the JSON but provide an informative error message or placeholder content as the value for that file (e.g., '"filename": "// Error: Conversion failed due to [reason]"') rather than attempting a partial or incorrect conversion. `

const VALIDATION_PROMPT = `You are an application validator assistant that carefully analyse the application code for potential bugs like dependency mismatches, import issues like using absolute import instead of relative imports wherever necessary etc., You will be given a converted [TARGET_LANGUAGE/FRAMEWORK] applicaion code that is originally in [SOURCE_LANGUAGE/FRAMEWORK]. Gather all the possible fixes and carefully refactor the code where it needs refactoring maintaing overall module structure. Return the same format as the user input format. `

const UPDATION_PROMPT = `you are an application debugger/modifier whose sole purpose is to analyse the given error or changes in file contents where the error occurs or changes needed. After analysing the file code generate the issue parts of the code and return the modified files in the same json format without changing the file names and paths. Only return the files that are modified. Also generate the summary of the changes done, number lines effected ans also change Type like "modified/added/deleted". If user message contains any greeting like 'Hello', 'How are you ?' just wish them back in the summary field. Here are the files details you have: [FILES].`

const ENHANCEMENT_PROMPT = "you are a professional propt enhancer who understand the user query and convert into a more concised version of the user query which can be feed into the LLM model for better understanding of the users requirement. Do not add any prefixes like 'Of course' or something. Your goal is to just enhance the query and providing the user with enhanced query. Generate only plain text format. No Markdown format."

const REACT_PROMPT = `You are a senior professional React developer who has vast knowledge on best react development practices,debugging. patterns and also optimization techniques. You can build a robust yet modern, good looking web applications based on the user prompt leveraging modern Ui libraries. Dont forget to add index.html in the root folder which is main for a react application. Also for shadcn add all the necessary UI components required by the application. Strictly use only ES module exports and imports in all files including the config files. When the user asks a query carefully understand the user needs and cross check the requirements ask questions which library they prefer to use like shadcn, antd, chakra UI etc. Strictly use Vite, tailwind, And then start building the application. After completion, return the user with the json object containing keys as filename, filepath and content. Also if the user asks a question related to a specific feature are need modification by sending you the required files, please go through the files, undertand which files need modification and modify them and return them. When the appplication is created first time wrap the entire application in a folder with the name 'frontend' strictly. If the query related to debugging use these files as context : `

const PROCESSING_PROMPT = `You are a profesional code files processing tool that structures the files given to you. You have mainly 2 tasks after carefully Observe the given files: 1)rename existing root folder name as 'frontend'. 2) Check whether the files are related to front end or backend. Only proceed if the files are related to frontend. Otherwise give message like not related to backend.3)filePath should include '/' instead of '\\'. Example : folder/folder2/file1.`

// const model = azure(config.AZURE_OPENAI_DEPLOYMENT);
const model = createGoogleGenerativeAI({
  apiKey : config.GEMINI_API_KEY
});

// const model_version = "models/gemini-2.5-pro";
const model_version = "models/gemini-2.5-flash-preview-05-20";
// const model_version = "models/gemini-2.0-flash"

// Set up multer for handling file uploads
const storage = multer.memoryStorage();
export const upload = multer({ storage });


export async function extractZip(req,res) {
  try{
    const zipBuffer = req.file.buffer;
    const folderName = req.file.originalname
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "node-to-flask"));

    const zip = new AdmZip(zipBuffer);
    zip.extractAllTo(tempDir, true);

    const outputDir = path.join(__dirname+"/../../../../../../", "flask-converted");
    await fs.ensureDir(outputDir);

    const filesToConvert = [];

    function findJsFiles(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        let ignorableFilesFound = new Set();
        for(const ignorableFile of ignorableFiles){
          if(fullPath.includes(ignorableFile)){
            ignorableFilesFound.add(ignorableFile);
          }
        }
        if(ignorableFilesFound.size > 0){
          throw {msg : "Please ensure to remove Dependency Installation Directories, Build Artifacts, Runtime Caches or Generated Files for successful coversion.\r\nFound : " + Array.from(ignorableFilesFound).join(", ")}
        }
        if (entry.isDirectory()) {
          findJsFiles(fullPath);
        }
        // else if (entry.name.endsWith(".js") || entry.name.endsWith(".json") || entry.name.endsWith(".html") || entry.name.endsWith(".jsx") || entry.name.endsWith(".css")) {
        //   filesToConvert.push(fullPath);
        // }
        else{
          filesToConvert.push(fullPath);
        }
      }
    }

    findJsFiles(tempDir);

    let filesContent = [];
    for (const filePath of filesToConvert) {
      const jsCode = fs.readFileSync(filePath, "utf-8");
      filesContent = [...filesContent, {filePath : path.relative(tempDir, filePath),code : jsCode}];
    }

    // const outputPath = path.join(outputDir, "file-content.json");
    // await fs.ensureDir(path.dirname(outputPath));
    // fs.writeFileSync(outputPath, JSON.stringify(filesContent));
    const processedFiles = await processFiles(filesContent,folderName);
    processedFiles.files = processedFiles.files.map((file,index) => ({...file,content : filesContent[index].code}));
    return res.status(200).send({...processedFiles});
    // return res.status(200).send("hello");
  }
  catch(err){
    console.log(err);
    if(err.msg){
      res.status(409).json({message : err.msg})
    }
    else res.status(500).json({ error: "Failed to Extract the Zip." });
  }
}

async function processFiles(files,folderName) {
  try {
    const result = await generateObject({
        model : model("gemini-2.0-flash",{structuredOutputs: true}),
        // model,
        messages : [
          {
            role : "system",
            content : PROCESSING_PROMPT.replace("[ORIGINAL_NAME]",folderName)
          },
          {
            role : "user",
            content : JSON.stringify(files.map(file => ({fileName : file.fileName,filePath : file.filePath})))
          }
        ],
        schema : z.object({
            success : z.boolean().describe("Contains true or false confirming whether process is success or failure."),
            files : z.array(z.object({
                fileName: z.string().describe("Name of the file without any path. Just the file name"),
                filePath: z.string().describe("entire path including the application name. No need to put absolute path"),
                content: z.string(),
            })),
            summary : z.string("A short summary about the processed applicaion."),
            message : z.string().describe("Error message if process is not successful"),
        })
    })
    if(!result.object.success){
      throw {msg : result.object.message}
    }
    return result.object;

  } catch (err) {
    throw err;
  }
}

export async function convertCode(req, res) {
  try {
    const {sourceLanguage,targetLanguage,filesContent,modelVerion} = req.body;
    console.log(targetLanguage,"kl",modelVerion)

    const result = await streamObject({
        model : model(modelVerion,{structuredOutputs: true}),
        // model,
        messages : [
          {
            role : "system",
            content : CONVERSION_PROMPT.replace("[TARGET_LANGUAGE/FRAMEWORK]",targetLanguage).replace("[SOURCE_LANGUAGE/FRAMEWORK]",sourceLanguage)
          },
          {
            role : "user",
            content : JSON.stringify(filesContent)
          }
        ],
        schema : z.object({
            success : z.boolean().describe("Contains true or false confirming whether conversion is success or failure."),
            files : z.array(z.object({
                fileName: z.string().describe("Name of the file without any path. Just the file name"),
                filePath: z.string().describe("entire path including the application name. No need to put absolute path"),
                content: z.string(),
            })),
            summary : z.string("A short summary about the converted applicaion."),
            message : z.string().describe("Error message if concersion is not successful"),
            stages : z.array(z.object({
              name : z.string(),
              description : z.string()
            })).describe("Titles describing each major stage in code conversion. Maximum length is 4 to 5.")
        })
    })

    // res.writeHead(200, {
    //   'Content-Type': 'text/plain; charset=utf-8',
    //   'Transfer-Encoding': 'chunked',
    // });
    return result.pipeTextStreamToResponse(res);

  } catch (err) {
    console.error("Conversion failed:", err);
    if(err.msg){
      res.status(409).json({message : err.msg})
    }
    else res.status(500).json({ error: "Failed to convert code" });
  }
}

export async function updateCode(req,res) {
  try{
    const {files,messages,modelVerion,inputQuery} = req.body;
    // console.log(req.file.path);
    let imageAnalysisResult = "";
    if(req.file){
      imageAnalysisResult = await generateText({
        model : model("models/gemini-1.5-flash"),
        messages : [
          {
            role : "system",
            content : "You are a Image analyzer profficient in extracting the information about a UI page and creating a well structured plan for generating the same exact UI present in the image."
          },
          {
            role : "user",
            content : [
              // {type : "text",text : inputQuery},
              {type : "image",image : req.file.buffer}
            ]
          }
        ]
      })
    }
    // console.log(imageAnalysisResult.text);
    const parsedFiles = JSON.parse(files);
    const parsedMessages = [...JSON.parse(messages),{
            role : "user",
            content: (req.file && `I am giving you the analysis of an image : ${imageAnalysisResult.text} and here is my requirement : `) + inputQuery
          }]

        const result = await generateObject({
        model : model(modelVerion,{structuredOutputs: true}),
        // model,
        messages : [
          {
            role : "system",
            content : REACT_PROMPT + " " + JSON.stringify(parsedFiles)
          },
          ...parsedMessages,
        ],
        schema : z.object({
            success : z.boolean().describe("Contains true or false confirming whether changes/creation is success or failure."),
            files : z.array(z.object({
                fileName: z.string().describe("Name of the file without any path. Just the file name"),
                filePath: z.string().describe("entire path including the application name. No need to put absolute path"),
                content: z.string(),
                linesChanged: z.number().describe("Number of lines changed in the file."),
                changeType: z.enum(["modified", "Generated"]).describe("Type of change made to the file (e.g., modified, generated).")
            })),
            summary : z.string().describe("Summary of the changes in markdown format or general responses like wishing etc., Make sure the summary does not contain code-markdown like backticks."),
            message : z.string().describe("Error message if channges/creation is not successful"),
        })
    })

    if(!result.object.success){
      throw {msg : result.object.message};
    }

    res.status(200).json({message: "Modification/Generation successful",files : result.object.files,summary : result.object.summary});

  }
  catch(err){
    console.error("Conversion failed:", err);
    if(err.msg){
      res.status(409).json({message : err.msg})
    }
    else res.status(500).json({ error: "Failed to convert code" });
  }
}

async function cleanDirectory() {
  const targetPath = "C:\\Users\\rlanka1\\Desktop\\frontend";
  const exceptionFolder = "node_modules"
  console.log(`Starting cleanup of: ${targetPath}`);

  try {
    // 1. Read all items (files and folders) in the target directory
    const items = await fs.readdir(targetPath);

    // 2. Create a list of promises for all deletion operations
    const deletionPromises = items.map(async (item) => {
      // 3. Skip the exception folder
      console.log(item,exceptionFolder);
      if (item === exceptionFolder) {
        console.log(`-> Skipping: ${item}`);
        return; // Do nothing for this item
      }

      const itemPath = path.join(targetPath, item);
      console.log(`-> Removing: ${itemPath}`);

      // 4. Use fs.rm to remove both files and directories recursively
      // { recursive: true } handles folders with content
      // { force: true } suppresses errors if the path doesn't exist
      await fs.rm(itemPath, { recursive: true, force: true });
    });

    // 5. Wait for all the deletion operations to complete
    await Promise.all(deletionPromises);

    console.log('\n✅ Cleanup complete. All items except "node_modules" have been removed.');

  } catch (error) {
    // Handle errors, e.g., if the 'frontend' directory doesn't exist
    if (error.code === 'ENOENT') {
      console.error(`Error: Directory not found at '${targetPath}'`);
    } else {
      console.error('An unexpected error occurred:', error);
    }
  }
}

export async function applyCode(req,res){
  try {
    const { files } = req.body;
    cleanDirectory();
    for(const file of files){
      const filePath = "C:\\Users\\rlanka1\\Desktop\\" + file.filePath.replaceAll("/","\\");
      // Ensure the file exists before writing; if not, create it
      if (!await fs.pathExists(filePath)) {
        await fs.ensureFile(filePath);
      }
      await fs.writeFile(filePath, file.content, "utf-8");
    }
    // const { filePath, newContent } = req.body;
    // let filePath = "C:\\Users\\rlanka1\\Desktop\\flask-test\\app.py"
    // if (!filePath || typeof newContent !== "string") {
    //   return res.status(400).json({ error: "filePath and newContent are required." });
    // }
    
    res.status(200).json({ success: true, message: `Files updated successfully.` });
  } catch (err) {
    console.error("File update failed:", err);
    res.status(500).json({ error: "Failed to update file." });
  }
}

export async function runCode(req, res) {
  try {
    if (devProcess) {
      devProcess.kill();
    }

    const { folder } = req.body;
    const folderPath = "C:\\Users\\rlanka1\\Desktop\\" + folder;
    devProcess = spawn('npm', ['run', 'dev'], {
      cwd: folderPath,
      shell: true
    });

    // Find a connected WebSocket client (you may want to identify by user/session)
    let wsClient = null;
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        wsClient = client;
      }
    });

    devProcess.stdout.on('data', (data) => {
      if (wsClient) wsClient.send(JSON.stringify({ type: 'stdout', data: data.toString().replace(ansiRegex, ' ') }));
    });

    devProcess.stderr.on('data', (data) => {
      if (wsClient) wsClient.send(JSON.stringify({ type: 'stderr', data: data.toString().replace(ansiRegex, ' ') }));
    });

    devProcess.on('close', (code) => {
      if (wsClient) wsClient.send(JSON.stringify({ type: 'close', code }));
      devProcess = null;
    });

    // Respond to HTTP request that process started
    res.status(200).json({ success: true, message: 'Process started. Output will be sent via WebSocket.' });
  } catch (err) {
    res.status(500).json({ error: "Failed to run code." });
  }
}

export async function stopCode(req,res){
  try {
    const {port,folder} = req.query;
    const command = "netstat -ano | findstr :"+port;
    const folderPath = "C:\\Users\\rlanka1\\Desktop\\" + folder;
    const options = {
      cwd: folderPath
    };

    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        // If there was an error executing the command
        console.error(`Error executing command: ${error.message}`);
        return res.status(500).json({ success: true });
      }

      if (stderr) {
        // If the command wrote to standard error (e.g., warnings)
        console.error(`Stderr: ${stderr}`);
        return res.status(200).json({ success: true});
      }
      const lines = stdout.split('\n').filter(line => line.trim() !== '');
      let killed = false;
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (/^\d+$/.test(pid)) {
          exec(`taskkill /PID ${pid} /F`, options, (killErr, killStdout, killStderr) => {
            if (killErr) {
              console.error(`Failed to kill process ${pid}: ${killErr.message}`);
            } else {
              console.log(`Killed process ${pid}: ${killStdout}`);
            }
          });
          killed = true;
        }
        console.log(pid);
      }
      return res.status(200).json({ success: true, killed });
      // If the command executed successfully, stdout contains the output
      // console.log(`Command output:\n${stdout}`);
    })
  } catch (err) {
    console.error("Code run failed:", err);
    res.status(500).json({ error: "Failed to run code." });
  }
}


export async function enhanceQuery(req,res){
  const {query,modelVerion} = req.body;
  console.log(modelVerion)
  try{
    const result = await generateText({
       model : model(modelVerion,{structuredOutputs: true}),
        // model,
        messages : [
          {
            role : "system",
            content : ENHANCEMENT_PROMPT
          },
          {
            role:"user",
            content:query
          }
        ]
    })
    console.log(result.text);
    res.status(200).json({success:true,enhancedQuery:result.text})
  }
  catch(err){
    console.log(err);
    res.status(500).json({success:false,message:"Failed to enhance the query"})
  }
}

export async function downloadCode(req,res){
  try{
    const {files} = req.body;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "node-to-flask"));
    console.log(tempDir);

    for(const file of files){
      const code = file.content;
      const outputPath = path.join(tempDir,file.filePath);
      console.log("Output path:", outputPath);
      await fs.ensureDir(path.dirname(outputPath));
      fs.writeFileSync(outputPath,code);
    }

    const outputZip = new AdmZip();
    const outputZipPath = path.join(tempDir, "code_converter.zip");
    outputZip.addLocalFolder(tempDir);
    outputZip.writeZip(outputZipPath);

    res.download(outputZipPath, "code_converter.zip", () => {
      fs.emptyDir(tempDir, err => {
        if (err) return console.error(err)
        console.log('success!')
      })
    });
  }catch(err){
    console.error("Download failed:", err);
    res.status(500).json({ error: "Failed to download code" });
  }
}

// export async function convertCode(req, res) {
//   try {
//     const {sourceLanguage,targetLanguage,filesContent,modelVerion} = req.body;
//     console.log(targetLanguage,"kl",modelVerion)

//     const result = await generateObject({
//         model : model(modelVerion,{structuredOutputs: true}),
//         // model,
//         messages : [
//           {
//             role : "system",
//             content : CONVERSION_PROMPT.replace("[TARGET_LANGUAGE/FRAMEWORK]",targetLanguage).replace("[SOURCE_LANGUAGE/FRAMEWORK]",sourceLanguage)
//           },
//           {
//             role : "user",
//             content : JSON.stringify(filesContent)
//           }
//         ],
//         schema : z.object({
//             success : z.boolean().describe("Contains true or false confirming whether conversion is success or failure."),
//             files : z.array(z.object({
//                 fileName: z.string().describe("Name of the file without any path. Just the file name"),
//                 filePath: z.string().describe("entire path including the application name. No need to put absolute path"),
//                 content: z.string(),
//             })),
//             summary : z.string("A short summary about the converted applicaion."),
//             message : z.string().describe("Error message if concersion is not successful"),
//             stages : z.array(z.object({
//               name : z.string(),
//               description : z.string()
//             })).describe("Titles describing each major stage in code conversion. Maximum length is 4 to 5.")
//         })
//     })

//     if(!result.object.success){
//       throw {msg : result.object.message};
//     }

//     const validatedFiles = await getValidatedCode(sourceLanguage,targetLanguage,result.object.files)

//     res.status(200).json({message: "Conversion successful",files : result.object.files,stages:result.object.stages,summary :result.object.summary });
//   } catch (err) {
//     console.error("Conversion failed:", err);
//     if(err.msg){
//       res.status(409).json({message : err.msg})
//     }
//     else res.status(500).json({ error: "Failed to convert code" });
//   }
// }

// export async function runCode(req,res){
//   try {
//     const {folder} = req.body;
//     const command = "npm run dev";
//     const folderPath = "C:\\Users\\rlanka1\\Desktop\\" + folder;
//     const options = {
//       cwd: folderPath
//     };

//     exec(command, options, (error, stdout, stderr) => {
//       if (error) {
//         // If there was an error executing the command
//         console.error(`Error executing command: ${error.message}`);
//         return res.status(200).json({ success: true, runInfo: {type:"error",time : new Date().toISOString(),description:error.message} });
//       }

//       if (stderr) {
//         // If the command wrote to standard error (e.g., warnings)
//         console.error(`Stderr: ${stderr}`);
//         return res.status(200).json({ success: true, runInfo : {type:"error",time : new Date().toISOString(),description:stderr}});
//       }

//       // If the command executed successfully, stdout contains the output
//       console.log(`Command output:\n${stdout}`);
//       return res.status(200).json({ success: true, runInfo: {type:"output",time : new Date().toISOString(),description:stdout} });
//     });

//     // res.status(200).json({ success: true, message: `Code run successfully.` });
//   } catch (err) {
//     console.error("Code run failed:", err);
//     res.status(500).json({ error: "Failed to run code." });
//   }
// }

// async function getValidatedCode(sourceLanguage,targetLanguage,filesContent){
//   try{
//         const result = await generateObject({
//         model : model(model_version,{structuredOutputs: true}),
//         // model,
//         messages : [
//           {
//             role : "system",
//             content : VALIDATION_PROMPT.replace("[TARGET_LANGUAGE/FRAMEWORK]",targetLanguage).replace("[SOURCE_LANGUAGE/FRAMEWORK]",sourceLanguage)
//           },
//           {
//             role : "user",
//             content : JSON.stringify(filesContent)
//           }
//         ],
//         schema : z.object({
//             success : z.boolean().describe("Contains true or false confirming whether conversion is success or failure."),
//             files : z.array(z.object({
//                 fileName: z.string().describe("Name of the file without any path. Just the file name"),
//                 filePath: z.string().describe("entire path including the application name. No need to put absolute path"),
//                 content: z.string(),
//             })),
//             message : z.string().describe("Error message if concersion is not successful"),
//         })
//     })
//     return result.object.files
//   }
//   catch(err){
//     throw err;
//   }
// }

// export async function runCode(req,res){
//   try {
//     if(devProcess){
//       console.log(devProcess);
//       devProcess.kill();
//     }

//     res.setHeader('Content-Type', 'text/event-stream');
//     res.setHeader('Cache-Control', 'no-cache');
//     res.setHeader('Connection', 'keep-alive');
//     res.flushHeaders();

//     const {folder} = req.query;
//     const folderPath = "C:\\Users\\rlanka1\\Desktop\\" + folder;
//     console.log(folderPath)
//     devProcess = spawn('npm', ['run', 'dev'], {
//         cwd: folderPath,
//         shell: true
//     });

//     console.log(`Started dev process with PID: ${devProcess.pid}`);
//     // const sendEvent = (data) => {
//     //   const cleanData = data.replace(ansiRegex, '\n\nt');
//     //   // console.log(cleanData);
//     //   res.write(`data: ${cleanData}\n\n`);
//     // }

//      devProcess.stdout.on('data', (data) => {
//         // sendEvent(data.toString());
//         const cleanData = data.toString().replace(ansiRegex, '\n\n');
//         res.write(`data: ${cleanData}\n\n`);
//         console.log(data.toString(),"data78")
//     });

//     devProcess.stderr.on('data', (data) => {
//         sendEvent(`ERROR: ${data.toString()}`);
//     });

 

//     devProcess.on('close', (code) => {
//         console.log(`Dev process exited with code ${code}`);
//         sendEvent(`\nProcess exited with code ${code}.`);
//         sendEvent('[DONE]');
//         devProcess = null; // Clear the process variable
//         res.end();
//     });

//     req.on('close', () => {
//         console.log('Client disconnected, but the dev server will keep running.');
//         // You might choose to kill the process here if that's the desired behavior.
//         // if (devProcess) {
//         //     devProcess.kill();
//         //     console.log('Killed dev process because client disconnected.');
//         // }
//         res.end();
//     });

//     // res.status(200).json({ success: true, message: `Code run successfully.` });
//   } catch (err) {
//     console.error("Code run failed:", err);
//     res.status(500).json({ error: "Failed to run code." });
//   }
// }