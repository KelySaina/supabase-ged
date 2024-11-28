# Supabase Storage Manager

A simple utility for managing user-specific files and directories using the Supabase Storage API. This module allows you to create, rename, delete, move directories and upload, list, and delete files for each user.

## Installation

To install the package via npm:

npm install supabase-ged

## Usage

### Importing the Module

Import the necessary functions from the `supabase-storage-manager` package.

```javascript
import {
  initializeSupabase,
  createDirectory,
  uploadFile,
  listUserFiles,
  renameDirectory,
  deleteDirectory,
  deleteFile,
  moveFile,
} from "supabase-storage-manager";
```

### Initializing Supabase Client

Before using any of the functions, initialize the Supabase client with your project URL and API key.

```javascript
const supabaseUrl = "https://your-project.supabase.co";
const supabaseKey = "your-supabase-key";
initializeSupabase(supabaseUrl, supabaseKey);
```

### Functionality

#### `createDirectory(userId, directory)`

Creates a directory for a user. The directory is created with a dummy `.keep` file to ensure that it exists in Supabase Storage.

```javascript
createDirectory("user-id-123", "documents")
  .then(() => console.log("Directory created"))
  .catch((error) => console.error("Error:", error));
```

#### `uploadFile(userId, directory, file)`

Uploads a file to a specific user's directory.

```javascript
const file = document.getElementById("file-input").files[0];
uploadFile("user-id-123", "documents", file)
  .then((filePath) => console.log("File uploaded to:", filePath))
  .catch((error) => console.error("Error uploading file:", error));
```

#### `listUserFiles(userId, directory)`

Lists all the files in a specified user's directory.

```javascript
listUserFiles("user-id-123", "documents")
  .then((files) => console.log("Files in directory:", files))
  .catch((error) => console.error("Error listing files:", error));
```

#### `renameDirectory(userId, oldDirectory, newDirectory)`

Renames a directory for a user.

```javascript
renameDirectory("user-id-123", "old-directory", "new-directory")
  .then(() => console.log("Directory renamed"))
  .catch((error) => console.error("Error renaming directory:", error));
```

#### `deleteDirectory(userId, directory)`

Deletes a directory and all its contents for a user.

```javascript
deleteDirectory("user-id-123", "documents")
  .then(() => console.log("Directory deleted"))
  .catch((error) => console.error("Error deleting directory:", error));
```

#### `deleteFile(userId, directory, fileName)`

Deletes a specific file within a user's directory.

```javascript
deleteFile("user-id-123", "documents", "file.txt")
  .then(() => console.log("File deleted"))
  .catch((error) => console.error("Error deleting file:", error));
```

#### `moveFile(userId, sourceDirectory, targetDirectory, fileName)`

Moves a file from one directory to another within a user's storage.

```javascript
moveFile("user-id-123", "old-directory", "new-directory", "file.txt")
  .then(() => console.log("File moved"))
  .catch((error) => console.error("Error moving file:", error));
```

## Error Handling

All functions return promises. If any operation fails, they will throw an error with an appropriate message. You can catch these errors using `.catch()` or `try-catch` blocks when working with async functions.

Example:

```javascript
try {
  await createDirectory("user-id-123", "documents");
} catch (error) {
  console.error("Error creating directory:", error);
}
```

## Notes

- This module relies on Supabase Storage, so you need a Supabase project with a storage bucket (e.g., `user-files`).
- All directories and files are user-specific. Make sure to use a unique identifier (like `user-id`) to isolate users' files.
- File paths and directory names are sanitized with the `escapePath` function to ensure they are compatible with Supabase.

## License

MIT License. See [LICENSE](./LICENSE) for more details.

```

```
