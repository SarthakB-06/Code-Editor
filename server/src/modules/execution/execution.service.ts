import { getOrCreateRoomFs } from "../room/roomFs.service.js";
import { getFileContent } from "../../sockets/state.js";

// Hardcoded common language IDs for Judge0
const getLanguageId = (ext: string) => {
  switch (ext) {
    case "js":
    case "javascript":
      return 93; // Node.js
    case "ts":
    case "typescript":
      return 94; // TypeScript
    case "py":
    case "python":
      return 71; // Python
    case "java":
      return 62; // Java
    case "c":
      return 50; // C
    case "cpp":
      return 54; // C++
    case "go":
      return 60; // Go
    case "rs":
    case "rust":
      return 73; // Rust
    default:
      return null;
  }
};

export const executeRoomCode = async (roomId: string, entryPath: string) => {
  const roomFs = await getOrCreateRoomFs(roomId);

  // Find the exact file to execute, prioritizing the in-memory state which has live unsaved changes
  const liveContent = getFileContent(roomId, entryPath);
  const dbFile = roomFs?.files.find((f) => f.path === entryPath);

  const finalContent = liveContent || dbFile?.content;

  if (typeof finalContent !== "string") {
    throw new Error(`Entry file not found: ${entryPath}`);
  }

  const ext = entryPath.split(".").pop()?.toLowerCase() || "";
  const languageId = getLanguageId(ext);

  if (!languageId) {
    return {
      language: ext,
      version: "unknown",
      run: {
        stdout: "",
        stderr: `Execution not supported for file extension: .${ext}`,
        code: 1,
      },
    };
  }

  // Use Judge0 via RapidAPI
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) {
    return {
      language: ext,
      version: "judge0",
      run: {
        stdout: "",
        stderr: "Server Configuration Error: Missing RAPIDAPI_KEY in .env.",
        code: 1,
      },
    };
  }

  try {
    const encodedSource = Buffer.from(finalContent).toString("base64");

    const response = await fetch(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true",
      {
        method: "POST",
        headers: {
          "x-rapidapi-key": rapidApiKey,
          "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_code: encodedSource,
          language_id: languageId,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Judge0 API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Decode base64 outputs back to strings
    const stdout = data.stdout ? Buffer.from(data.stdout, "base64").toString("utf-8") : "";
    const stderr = data.stderr ? Buffer.from(data.stderr, "base64").toString("utf-8") : "";
    const compileOutput = data.compile_output ? Buffer.from(data.compile_output, "base64").toString("utf-8") : "";

    return {
      language: ext,
      version: "rapidapi.judge0",
      run: {
        stdout: stdout,
        stderr: stderr || compileOutput || (data.status?.id !== 3 ? data.status?.description : ""),
        code: data.status?.id === 3 ? 0 : 1, // Status 3 = Accepted
      },
    };
  } catch (error: any) {
    console.error("[Execution Service] RapidAPI Error:", error);
    return {
      language: ext,
      version: "rapidapi.judge0",
      run: {
        stdout: "",
        stderr: error.message || "An unknown error occurred during execution.",
        code: 1,
      },
    };
  }
};
