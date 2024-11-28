import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
let supabase;
function initializeSupabase(url, key) {
  supabase = createClient(url, key);
}

// Helper function to escape paths that Supabase does not like
function escapePath(path) {
  // Replaces characters not allowed by Supabase with a safe dash '-'
  return path.replace(/[^a-zA-Z0-9\-_\/]/g, "-");
}

// Create a directory for a user (using a dummy .keep file)
async function createDirectory(userId, directory) {
  try {
    const path = `${escapePath(userId)}/${escapePath(directory)}/.keep`;
    const { error } = await supabase.storage
      .from("user-files")
      .upload(path, "", { contentType: "application/x-empty" });

    if (error) {
      throw new Error(`Failed to create directory: ${error.message}`);
    }
    console.log(`Directory created for user ${userId} at ${directory}`);
  } catch (error) {
    console.error(`Error creating directory: ${error.message}`);
    throw new Error(`Error creating directory: ${error.message}`);
  }
}

// Upload a file to a user's directory
async function uploadFile(userId, directory, file) {
  try {
    const path = `${escapePath(userId)}/${escapePath(directory)}/${escapePath(
      file.name
    )}`;
    const { data, error } = await supabase.storage
      .from("user-files")
      .upload(path, file);

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    console.log(`File uploaded to ${path}`);
    return data.path;
  } catch (error) {
    console.error(`Error uploading file: ${error.message}`);
    throw new Error(`Error uploading file: ${error.message}`);
  }
}

// List files in a user's directory
async function listUserFiles(userId, directory) {
  try {
    const path = `${escapePath(userId)}/${escapePath(directory)}`;
    const { data, error } = await supabase.storage
      .from("user-files")
      .list(path, { limit: 100 });

    if (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }

    return data; // Returns an array of files and folders
  } catch (error) {
    console.error(`Error listing files: ${error.message}`);
    throw new Error(`Error listing files: ${error.message}`);
  }
}

// Rename a directory for a user
async function renameDirectory(userId, oldDirectory, newDirectory) {
  try {
    const oldPath = `${escapePath(userId)}/${escapePath(oldDirectory)}`;
    const newPath = `${escapePath(userId)}/${escapePath(newDirectory)}`;

    const { data: files, error } = await supabase.storage
      .from("user-files")
      .list(oldPath);
    if (error) {
      throw new Error(
        `Failed to retrieve files for renaming: ${error.message}`
      );
    }

    for (const file of files) {
      const oldFilePath = `${oldPath}/${file.name}`;
      const newFilePath = `${newPath}/${file.name}`;

      const { error: moveError } = await supabase.storage
        .from("user-files")
        .move(oldFilePath, newFilePath);
      if (moveError) {
        throw new Error(
          `Failed to move file ${file.name}: ${moveError.message}`
        );
      }
    }

    console.log(`Renamed directory ${oldDirectory} to ${newDirectory}`);
  } catch (error) {
    console.error(`Error renaming directory: ${error.message}`);
    throw new Error(`Error renaming directory: ${error.message}`);
  }
}

// Delete a directory and all its files for a user
async function deleteDirectory(userId, directory) {
  try {
    const path = `${escapePath(userId)}/${escapePath(directory)}`;
    const { data: files, error } = await supabase.storage
      .from("user-files")
      .list(path);
    if (error) {
      throw new Error(
        `Failed to retrieve files for deletion: ${error.message}`
      );
    }

    for (const file of files) {
      const filePath = `${path}/${file.name}`;
      const { error: deleteError } = await supabase.storage
        .from("user-files")
        .remove([filePath]);
      if (deleteError) {
        throw new Error(
          `Failed to delete file ${file.name}: ${deleteError.message}`
        );
      }
    }

    console.log(`Deleted directory ${directory} for user ${userId}`);
  } catch (error) {
    console.error(`Error deleting directory: ${error.message}`);
    throw new Error(`Error deleting directory: ${error.message}`);
  }
}

// Delete a specific file for a user
async function deleteFile(userId, directory, fileName) {
  try {
    const path = `${escapePath(userId)}/${escapePath(directory)}/${escapePath(
      fileName
    )}`;
    const { error } = await supabase.storage.from("user-files").remove([path]);
    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }

    console.log(`File ${fileName} deleted from ${path}`);
  } catch (error) {
    console.error(`Error deleting file: ${error.message}`);
    throw new Error(`Error deleting file: ${error.message}`);
  }
}

// Move a file within a user's directories
async function moveFile(userId, sourceDirectory, targetDirectory, fileName) {
  try {
    const sourcePath = `${escapePath(userId)}/${escapePath(
      sourceDirectory
    )}/${escapePath(fileName)}`;
    const targetPath = `${escapePath(userId)}/${escapePath(
      targetDirectory
    )}/${escapePath(fileName)}`;

    const { error: moveError } = await supabase.storage
      .from("user-files")
      .move(sourcePath, targetPath);
    if (moveError) {
      throw new Error(`Failed to move file: ${moveError.message}`);
    }

    console.log(
      `Moved file ${fileName} from ${sourceDirectory} to ${targetDirectory}`
    );
  } catch (error) {
    console.error(`Error moving file: ${error.message}`);
    throw new Error(`Error moving file: ${error.message}`);
  }
}

export {
  initializeSupabase,
  createDirectory,
  uploadFile,
  listUserFiles,
  renameDirectory,
  deleteDirectory,
  deleteFile,
  moveFile,
};
