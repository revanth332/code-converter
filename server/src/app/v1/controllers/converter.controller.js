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


const prompt = `You are a specialized AI model designed for converting source code from one programming language or framework to another. 'Your Task': Convert the provided code files from a specified source language/framework ('[SOURCE_LANGUAGE/FRAMEWORK]') to a specified target language/framework ('[TARGET_LANGUAGE/FRAMEWORK]'). 'Input': You will receive input representing one or more code files. Each input will consist of a 'filename' and its 'content'. The overall input structure will represent a collection of these files. 'Required Parameters': You **must** know the original source language/framework and the desired target language/framework. These will be provided explicitly as: *   'SOURCE_LANG': '[SOURCE_LANGUAGE/FRAMEWORK]' *   'TARGET_LANG': '[TARGET_LANGUAGE/FRAMEWORK]' 'Conversion Logic': 1.  Before attempting conversion, filter the input files. **Exclude files residing within directories commonly used for dependency installation, build outputs, or runtime caches** (e.g., 'node_modules', '__pycache__', 'vendor', 'bin', 'obj', '.m2', 'dist', 'build'). Focus conversion only on the remaining source code files that represent the project's core logic. 2.  Analyze the code content for each *filtered* source file. 3.  Understand the code's logic, structure, and functionality in the 'SOURCE_LANG'. 4.  Re-implement the equivalent logic, structure, and functionality in the 'TARGET_LANG'. 5.  Translate syntax, keywords, standard library calls, and common patterns appropriately for the 'TARGET_LANG'. 6.  Maintain the original intent and behavior of the code as closely as possible. 7.  Preserve comments where relevant and translate them if necessary/possible. 8.  Handle common language features and standard libraries. If specific, complex libraries or frameworks are used, attempt to find equivalents or provide comments indicating where manual adaptation might be needed. 9.  **Identify necessary external dependencies** required by the converted 'TARGET_LANG' code and the '[TARGET_LANGUAGE/FRAMEWORK]'. 10. **Determine the standard dependency management file name** for the '[TARGET_LANGUAGE/FRAMEWORK]' (e.g., 'package.json' for Node.js, 'requirements.txt' for Python, 'Gemfile' for Ruby, 'pom.xml' or 'build.gradle' for Java, 'composer.json' for PHP, '.csproj' for .NET, 'go.mod' for Go). Also make sure to not write comments in this dependency management file. 11. **Generate the content for this dependency management file** based on the identified dependencies. 12. If the user input code is not in [SOURCE_LANGUAGE/FRAMEWORK] framework, then don't convert the code and generate an output in this format : {success : false, message : 'Source language mismatch : The provided code is in <framework used in code> and input framework is [SOURCE_LANGUAGE/FRAMEWORK].'} 13. Also the generate the stages of code conversion explaining how you are converting containing 4-5 stages. 14. While generating functions in javascript, don't wrap multiline strings with single or double quotes. Instead use single backticks. Otherwise it leads to errors. 'Output Format': Your output **must** be a single JSON object. *   The keys of the JSON object must be the original 'filename's from the input. *   The value associated with each 'filename' key must be a string containing the *converted code content* for that file in the 'TARGET_LANG'. *   Prefix the key for *every* file in the output JSON (both converted code files and the dependency file) with the chosen application name followed by a forward slash '/'. *   **IMPORTANT:** JSON requires keys and string values to be enclosed in **double quotes (")**. Adhere strictly to standard JSON formatting for the output. 'Strict Instructions': *   Generate **only** the JSON object. Do not include any introductory text, explanations, conversational remarks, or markdown formatting (like triple backticks) outside the JSON object itself. *   Ensure the JSON is valid and correctly formatted using **double quotes (")** for keys and string values. *   If a file cannot be converted (e.g., due to extreme complexity, ambiguity, or unsupported features), include the filename in the JSON but provide an informative error message or placeholder content as the value for that file (e.g., '"filename": "// Error: Conversion failed due to [reason]"') rather than attempting a partial or incorrect conversion.`

// const model = azure(config.AZURE_OPENAI_DEPLOYMENT);
const model = createGoogleGenerativeAI({
  apiKey : config.GEMINI_API_KEY
});

// const model_version = "models/gemini-1.5-pro";
const model_version = "models/gemini-2.5-flash-preview-04-17";
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
        for(const ignorableFile of ignorableFiles){
          if(fullPath.includes(ignorableFile)){
            throw {msg : "Please ensure to remove Dependency Installation Directories, Build Artifacts, Runtime Caches or Generated Files for successful coversion."}
          }
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
            content : prompt.replace("[TARGET_LANGUAGE/FRAMEWORK]",targetLanguage).replace("[SOURCE_LANGUAGE/FRAMEWORK]",sourceLanguage)
          },
          {
            role : "user",
            content : JSON.stringify(filesContent)
          }
        ],
        schema : z.object({
            success : z.boolean().describe("Contains true or false confirming whether conversion is success or failure."),
            files : z.array(z.object({
                fileName: z.string(),
                filePath: z.string().describe("just relative path. No need to put absolute path"),
                content: z.string(),
            })),
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

    res.status(200).json({message: "Conversion successful",files : result.object.files,stages:result.object.stages});
  } catch (err) {
    console.error("Conversion failed:", err);
    if(err.msg){
      res.status(409).json({message : err.msg})
    }
    else res.status(500).json({ error: "Failed to convert code" });
  }
}

// export async function directConvertCode(req, res) {
//   try {
//     const zipBuffer = req.file.buffer;
//     const {sourceLanguage,targetLanguage} = req.body;
//     console.log(targetLanguage,"kl")
//     const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "node-to-flask"));

//     const zip = new AdmZip(zipBuffer);
//     zip.extractAllTo(tempDir, true);

//     const outputDir = path.join(__dirname+"/../../../../../../", "flask-converted");
//     await fs.ensureDir(outputDir);

//     const filesToConvert = [];

//     function findJsFiles(dir) {
//       const entries = fs.readdirSync(dir, { withFileTypes: true });
//       for (const entry of entries) {
//         const fullPath = path.join(dir, entry.name);
//         for(const ignorableFile of ignorableFiles){
//           if(fullPath.includes(ignorableFile)){
//             throw {msg : "Please ensure to remove Dependency Installation Directories, Build Artifacts, Runtime Caches or Generated Files for successful coversion."}
//           }
//         }
//         if (entry.isDirectory()) {
//           findJsFiles(fullPath);
//         }
//         // else if (entry.name.endsWith(".js") || entry.name.endsWith(".json") || entry.name.endsWith(".html") || entry.name.endsWith(".jsx") || entry.name.endsWith(".css")) {
//         //   filesToConvert.push(fullPath);
//         // }
//         else{
//           filesToConvert.push(fullPath);
//         }
//       }
//     }

//     findJsFiles(tempDir);

//     let filesContent = [];
//     for (const filePath of filesToConvert) {
//       const jsCode = fs.readFileSync(filePath, "utf-8");
//       filesContent = [...filesContent, {filePath : path.relative(tempDir, filePath),code : jsCode}];
//     }

//     const outputPath = path.join(outputDir, "file-content.json");
//     await fs.ensureDir(path.dirname(outputPath));
//     fs.writeFileSync(outputPath, JSON.stringify(filesContent));

//     const result = await generateObject({
//         model : model(model_version,{structuredOutputs: true}),
//         // model,
//         messages : [
//           {
//             role : "system",
//             content : prompt.replace("[TARGET_LANGUAGE/FRAMEWORK]",targetLanguage).replace("[SOURCE_LANGUAGE/FRAMEWORK]",sourceLanguage)
//           },
//           {
//             role : "user",
//             content : JSON.stringify(filesContent)
//           }
//         ],
//         schema : z.object({
//             success : z.boolean().describe("Contains true or false confirming whether conversion is success or failure."),
//             files : z.array(z.object({
//                 fileName: z.string(),
//                 filePath: z.string().describe("just relative path. No need to put absolute path"),
//                 content: z.string(),
//             })),
//             message : z.string().describe("Error message if concersion is not successful"),
//         })
//     })

//     if(!result.object.success){
//       throw {msg : result.object.message};
//     }

//     res.status(200).json({message: "Conversion successful",files : result.object.files});
//   } catch (err) {
//     console.error("Conversion failed:", err);
//     if(err.msg){
//       res.status(409).json({message : err.msg})
//     }
//     else res.status(500).json({ error: "Failed to convert code" });
//   }
// }

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

// export async function convertCode(req, res) {
//   try {
//     // 1. Get the uploaded zip file
//     const zipBuffer = req.file.buffer;
//     const tempDir = path.join(__dirname+"/../../../../../../", "node-to-flask");

//     // 2. Extract zip to temp folder
//     const zip = new AdmZip(zipBuffer);
//     zip.extractAllTo(tempDir, true);

//     // 3. Read and convert .js files to Python Flask
//     const outputDir = path.join(tempDir, "flask-converted");
//     await fs.ensureDir(outputDir);

//     const filesToConvert = [];

//     function findJsFiles(dir) {
//       const entries = fs.readdirSync(dir, { withFileTypes: true });
//       for (const entry of entries) {
//         const fullPath = path.join(dir, entry.name);
//         if (entry.isDirectory()) {
//           findJsFiles(fullPath);
//         } else if (entry.name.endsWith(".js")) {
//           filesToConvert.push(fullPath);
//         }
//       }
//     }

//     findJsFiles(tempDir);

//     for (const filePath of filesToConvert) {
//       const jsCode = fs.readFileSync(filePath, "utf-8");

//       const prompt = `You are senior developer proficient in both node js and Flask(python). Your job is to convert node js applications into Flask applications. You will not receive the entire application at a time. You will receive file by file and need to convert the file just mantling continuity with the other files the application. You may see some imports in a file where you need to assume they are already created so you no need to create again. Just write equivalent flask file for given js file only. No need to write instructions also. Provide just plain code without any explanations. Keep in mind that you only need to write code not paragraphs of instructions. If the file is a package.json then change it to requirements file with relavant equivalant python packages needs to be installed in order to run the flask application. Strictly generate the code in plan text not in code markdown.\n\n JS code : \n\n${jsCode}`;

//       const result = await generateText({
//         model,
//         prompt,
//       });

//       const pythonCode = result.text;
//       const relativePath = path.relative(tempDir, filePath).replace(/\.js$/, ".py");
//       const outputPath = path.join(outputDir, relativePath);
//       await fs.ensureDir(path.dirname(outputPath));
//       fs.writeFileSync(outputPath, pythonCode);
//     }

//     // 4. Zip the converted Flask app
//     const outputZipPath = path.join(tempDir, "flask_app.zip");
//     const outputZip = new AdmZip();
//     outputZip.addLocalFolder(outputDir);
//     outputZip.writeZip(outputZipPath);

//     // 5. Send zip file as response
//     // res.download(outputZipPath, "flask_app.zip", () => {
//     //   fs.emptyDir(tempDir, err => {
//     //     if (err) return console.error(err)
//     //     console.log('success!')
//     //   })
//     // });
//     res.status(200).json({
//       message: "Conversion successful"});
//   } catch (err) {
//     console.error("Conversion failed:", err);
//     res.status(500).json({ error: "Failed to convert code" });
//   }
// }

// export async function convertCode(req, res) {
//   try {
//     // 1. Get the uploaded zip file
//     const zipBuffer = req.file.buffer;
//     const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "node-to-flask-"));

//     // 2. Extract zip to temp folder
//     const zip = new AdmZip(zipBuffer);
//     zip.extractAllTo(tempDir, true);

//     // 3. Read and convert .js files to Python Flask
//     const outputDir = path.join(tempDir, "flask-converted");
//     await fs.ensureDir(outputDir);

//     const filesToConvert = [];

//     function findJsFiles(dir) {
//       const entries = fs.readdirSync(dir, { withFileTypes: true });
//       for (const entry of entries) {
//         const fullPath = path.join(dir, entry.name);
//         if (entry.isDirectory()) {
//           findJsFiles(fullPath);
//         } else if (entry.name.endsWith(".js")) {
//           filesToConvert.push(fullPath);
//         }
//       }
//     }

//     findJsFiles(tempDir);

//     for (const filePath of filesToConvert) {
//       const jsCode = fs.readFileSync(filePath, "utf-8");

//       const prompt = `Convert the following Node.js (Express) file into an equivalent Python Flask file. Preserve route logic, middleware, and clean code.\n\n${jsCode}`;

//       const result = await generateText({
//         model,
//         prompt,
//       });

//       const pythonCode = result.text;
//       const relativePath = path.relative(tempDir, filePath).replace(/\.js$/, ".py");
//       const outputPath = path.join(outputDir, relativePath);
//       await fs.ensureDir(path.dirname(outputPath));
//       fs.writeFileSync(outputPath, pythonCode);
//     }

//     // 4. Zip the converted Flask app
//     const outputZipPath = path.join(tempDir, "flask_app.zip");
//     const outputZip = new AdmZip();
//     outputZip.addLocalFolder(outputDir);
//     outputZip.writeZip(outputZipPath);

//     // 5. Send zip file as response
//     res.download(outputZipPath, "flask_app.zip", () => {
//       fs.emptyDir(tempDir, err => {
//         if (err) return console.error(err)
//         console.log('success!')
//       })
//     });
//   } catch (err) {
//     console.error("Conversion failed:", err);
//     res.status(500).json({ error: "Failed to convert code" });
//   }
// }
