import { createAzure } from "@ai-sdk/azure";
import { generateObject } from "ai";
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

const __dirname = dirname(fileURLToPath(import.meta.url));

const azure = createAzure({
  resourceName: config.AZURE_OPENAI_RESOURCE,
  apiKey: config.AZURE_OPENAI_KEY,
});

const ignorableFiles = ["node_modules","__pycache__","vendor","venv",".exe","pyvenv.cfg","env",".venv","site-packages","dist","build","target","bin","obj","pkg",".m2",".gradle",".idea",".vscode",".next",".angular",".svelte-kit",".nuxt",".cache",".pytest_cache",".mypy_cache","coverage",".coverage",".git",".svn",".hg",".DS_Store","Thumbs.db","package-lock.json"
]

// const prompt = `you are a professional developer proficient in both node js and python. Your job is to convert node js applications into flask applications by mantaining the exact working of the application. You will be provided with the content containing file names and their content.Analyse the file content, understand its role in the application. Reconstruct the same behaviour using python code. Strictly avoid creating placeholder functions. The generated code should be at least production level. Remember that you are replicating the behaviour of node js application into flask application. So handling every function logic is very important. You need to generate a JSON object that contains file names along with their paths prefixed with '<suitble application name that resembles the behaviour of the code>/' as keys and their content which is python equivalant code as values. Don't put any explanations or instructions inside the code and just provide the JSON object. Package.json file shuold beconverted to requirements.txt file that is used in the flask application you converted. Dont blindly write every module in package.json into requirements.text. Some modules may not be found in python and some may have equivalant packages in python. If you dont find any equivalant module, dont mention it in requirements file and handle related logic in code with other modules.`

// const prompt = `You are a specialized AI model designed for converting source code from one programming language or framework to another. 'Your Task': Convert the provided code files from a specified source language/framework ('[SOURCE_LANGUAGE/FRAMEWORK]') to a specified target language/framework ('[TARGET_LANGUAGE/FRAMEWORK]'). 'Input': You will receive input representing one or more code files. Each input will consist of a 'filename' and its 'content'. The overall input structure will represent a collection of these files. 'Required Parameters': You **must** know the original source language/framework and the desired target language/framework. These will be provided explicitly as: *   'SOURCE_LANG': '[SOURCE_LANGUAGE/FRAMEWORK]' *   'TARGET_LANG': '[TARGET_LANGUAGE/FRAMEWORK]' 'Conversion Logic': 1.  Analyze the provided code content for each file. 2.  Understand the code's logic, structure, and functionality in the 'SOURCE_LANG'. 3.  Re-implement the equivalent logic, structure, and functionality in the 'TARGET_LANG'. 4.  Translate syntax, keywords, standard library calls, and common patterns appropriately for the 'TARGET_LANG'. 5.  Maintain the original intent and behavior of the code as closely as possible. 6.  Preserve comments where relevant and translate them if necessary/possible. 7.  Handle common language features and standard libraries. If specific, complex libraries or frameworks are used, attempt to find equivalents or provide comments indicating where manual adaptation might be needed. 'Output Format': Your output **must** be a single JSON object. *   The keys of the JSON object must be the original 'filename's from the input. *   The value associated with each 'filename' key must be a string containing the *converted code content* for that file in the 'TARGET_LANG'. *   **IMPORTANT:** JSON requires keys and string values to be enclosed in **double quotes (")**. Adhere strictly to standard JSON formatting for the output. 'Strict Instructions': *   Generate **only** the JSON object. Do not include any introductory text, explanations, conversational remarks, or markdown formatting (like triple backticks json ) outside the JSON object itself. *   Ensure the JSON is valid and correctly formatted using **double quotes (")** for keys and string values. *   If a file cannot be converted (e.g., due to extreme complexity, ambiguity, or unsupported features), include the filename in the JSON but provide an informative error message or placeholder content as the value for that file (e.g., '"filename": "// Error: Conversion failed due to [reason]"') rather than attempting a partial or incorrect conversion. You need to generate a JSON object that contains file names along with their paths prefixed with '<suitble application name that resembles the behaviour of the code>/' as keys and their content which is [TARGET_LANGUAGE/FRAMEWORK] equivalant code as values. Every framework has its own dependency file like package.json for node.js and requirements.txt for python related frameworks etc., So strictly add dependency file for every conversion.`


const CONVERSION_PROMPT = `You are a specialized AI model designed for converting source code from one programming language or framework to another. 'Your Task': Convert the provided code files from a specified source language/framework ('[SOURCE_LANGUAGE/FRAMEWORK]') to a specified target language/framework ('[TARGET_LANGUAGE/FRAMEWORK]'). 'Input': You will receive input representing one or more code files. Each input will consist of a 'filename' and its 'content'. The overall input structure will represent a collection of these files. 'Required Parameters': You **must** know the original source language/framework and the desired target language/framework. These will be provided explicitly as: *   'SOURCE_LANG': '[SOURCE_LANGUAGE/FRAMEWORK]' *   'TARGET_LANG': '[TARGET_LANGUAGE/FRAMEWORK]' 'Conversion Logic': 1.  Before attempting conversion, filter the input files. **Exclude files residing within directories commonly used for dependency installation, build outputs, or runtime caches** (e.g., 'node_modules', '__pycache__', 'vendor', 'bin', 'obj', '.m2', 'dist', 'build'). Focus conversion only on the remaining source code files that represent the project's core logic. 2.  Analyze the code content for each *filtered* source file. 3.  Understand the code's logic, structure, and functionality in the 'SOURCE_LANG'. 4.  Re-implement the equivalent logic, structure, and functionality in the 'TARGET_LANG'. 5.  Translate syntax, keywords, standard library calls, and common patterns appropriately for the 'TARGET_LANG'. 6.  Maintain the original intent and behavior of the code as closely as possible. 7.  Preserve comments where relevant and translate them if necessary/possible. 8.  Handle common language features and standard libraries. If specific, complex libraries or frameworks are used, attempt to find equivalents or provide comments indicating where manual adaptation might be needed. 9.  **Identify necessary external dependencies** required by the converted 'TARGET_LANG' code and the '[TARGET_LANGUAGE/FRAMEWORK]'. 10. **Determine the standard dependency management file name** for the '[TARGET_LANGUAGE/FRAMEWORK]' (e.g., 'package.json' for Node.js, 'requirements.txt' for Python, 'Gemfile' for Ruby, 'pom.xml' or 'build.gradle' for Java, 'composer.json' for PHP, '.csproj' for .NET, 'go.mod' for Go). Also make sure to not write comments in this dependency management file. 11. **Generate the content for this dependency management file** based on the identified dependencies. 12. If the user input code is not in [SOURCE_LANGUAGE/FRAMEWORK] framework, then don't convert the code and generate an output in this format : {success : false, message : 'Source language mismatch : The provided code is in <framework used in code> and input framework is [SOURCE_LANGUAGE/FRAMEWORK].'} 13. Also the generate the stages of code conversion explaining how you are converting containing 4-5 stages. 14. While generating functions in javascript, don't wrap multiline strings with single or double quotes. Instead use single backticks. Otherwise it leads to errors. 15. Provide the complete and exact file and directory structure of the generated application. Include all necessary empty placeholder files (e.g., __init__.py for Python packages, index.js for some Node.js modules) to ensure correct package recognition. 16. Above all, the generated code must be directly runnable and free of common startup errors. 'Output Format': Your output **must** be a single JSON object. *   The keys of the JSON object must be the original 'filename's from the input. *   The value associated with each 'filename' key must be a string containing the *converted code content* for that file in the 'TARGET_LANG'. *   Prefix the key for *every* file in the output JSON (both converted code files and the dependency file) with the chosen application name followed by a forward slash '/'. * 17.Use relative import whenever possible and avoid absolute paths.   **IMPORTANT:** JSON requires keys and string values to be enclosed in **double quotes (")**. Adhere strictly to standard JSON formatting for the output. 'Strict Instructions': *   Generate **only** the JSON object. Do not include any introductory text, explanations, conversational remarks, or markdown formatting (like triple backticks) outside the JSON object itself. *   Ensure the JSON is valid and correctly formatted using **double quotes (")** for keys and string values. *   If a file cannot be converted (e.g., due to extreme complexity, ambiguity, or unsupported features), include the filename in the JSON but provide an informative error message or placeholder content as the value for that file (e.g., '"filename": "// Error: Conversion failed due to [reason]"') rather than attempting a partial or incorrect conversion. `

const VALIDATION_PROMPT = `You are an application validator assistant that carefully analyse the application code for potential bugs like dependency mismatches, import issues like using absolute import instead of relative imports wherever necessary etc., You will be given a converted [TARGET_LANGUAGE/FRAMEWORK] applicaion code that is originally in [SOURCE_LANGUAGE/FRAMEWORK]. Gather all the possible fixes and carefully refactor the code where it needs refactoring maintaing overall module structure. Return the same format as the user input format. `

const UPDATION_PROMPT = `you are an application debugger/modifier whose sole purpose is to analyse the given error or changes in file contents where the error occurs or changes needed. After analysing the file code generate the issue parts of the code and return the modified files in the same json format without changing the file names and paths. Only return the files that are modified. Also generate the summary of the changes done, number lines effected ans also change Type like "modified/added/deleted". If user message contains any greeting like 'Hello', 'How are you ?' just wish them back in the summary field. Here are the files details you have: [FILES].`

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

    const outputPath = path.join(outputDir, "file-content.json");
    await fs.ensureDir(path.dirname(outputPath));
    fs.writeFileSync(outputPath, JSON.stringify(filesContent));
    
    return res.status(200).send({filesContent});
  }
  catch(err){
    if(err.msg){
      res.status(409).json({message : err.msg})
    }
    else res.status(500).json({ error: "Failed to Extract the Zip." });
  }
}

export async function convertCode(req, res) {
  try {
    const {sourceLanguage,targetLanguage,filesContent} = req.body;
    console.log(targetLanguage,"kl")

    const result = await generateObject({
        model : model(model_version,{structuredOutputs: true}),
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

    if(!result.object.success){
      throw {msg : result.object.message};
    }

    // const validatedFiles = await getValidatedCode(sourceLanguage,targetLanguage,result.object.files)

    res.status(200).json({message: "Conversion successful",files : result.object.files,stages:result.object.stages,summary :result.object.summary });
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
    const {files,userPrompt,messages} = req.body;
        const result = await generateObject({
        model : model(model_version,{structuredOutputs: true}),
        // model,
        messages : [
          {
            role : "system",
            content : UPDATION_PROMPT.replace("[FILES]",JSON.stringify(files))
          },
          ...messages
        ],
        schema : z.object({
            success : z.boolean().describe("Contains true or false confirming whether changes are success or failure."),
            files : z.array(z.object({
                fileName: z.string().describe("Name of the file without any path. Just the file name"),
                filePath: z.string().describe("entire path including the application name. No need to put absolute path"),
                content: z.string(),
                linesChanged: z.number().describe("Number of lines changed in the file."),
                changeType: z.enum(["modified", "added", "deleted"]).describe("Type of change made to the file (e.g., modified, added, deleted).")
            })),
            summary : z.string().describe("Summary of the changes in markdown format or general responses like wishing etc.,"),
            message : z.string().describe("Error message if channges is not successful"),
        })
    })

    if(!result.object.success){
      throw {msg : result.object.message};
    }

    res.status(200).json({message: "Modification successful",files : result.object.files,summary : result.object.summary});
  }
  catch(err){
    console.error("Conversion failed:", err);
    if(err.msg){
      res.status(409).json({message : err.msg})
    }
    else res.status(500).json({ error: "Failed to convert code" });
  }
}

async function getValidatedCode(sourceLanguage,targetLanguage,filesContent){
  try{
        const result = await generateObject({
        model : model(model_version,{structuredOutputs: true}),
        // model,
        messages : [
          {
            role : "system",
            content : VALIDATION_PROMPT.replace("[TARGET_LANGUAGE/FRAMEWORK]",targetLanguage).replace("[SOURCE_LANGUAGE/FRAMEWORK]",sourceLanguage)
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
            message : z.string().describe("Error message if concersion is not successful"),
        })
    })
    return result.object.files
  }
  catch(err){
    throw err;
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
    const outputZipPath = path.join(tempDir, "flask_app.zip");
    outputZip.addLocalFolder(tempDir);
    outputZip.writeZip(outputZipPath);

    res.download(outputZipPath, "flask_app.zip", () => {
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
