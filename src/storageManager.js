import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
let supabase;
function initializeSupabase(url, key) {
  supabase = createClient(url, key);
}

// Helper function to escape paths that Supabase does not like
function escapePath(path) {
  // Normalize Unicode to remove diacritics, then replace disallowed characters
  return path
    .normalize("NFD") // Decomposes accents into base characters + diacritical marks
    .replace(/[\u0300-\u036f]/g, "") // Removes diacritical marks
    .replace(/[^a-zA-Z0-9\-_.\/]/g, "-"); // Replace invalid characters with "-"
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

async function getArborescence(userId) {
  try {
    const rootPath = escapePath(userId);

    // Recursive function to traverse directories
    async function traverse(path) {
      const { data, error } = await supabase.storage
        .from("user-files")
        .list(path);

      if (error) {
        throw new Error(`Failed to list directory: ${error.message}`);
      }

      const result = [];
      for (const item of data) {
        if (!item.id) {
          // Recursively get contents of the folder
          result.push({
            name: item.name,
            type: "folder",
            urlPath: `${path}/${item.name}/`, // Folder path
            children: await traverse(`${path}/${item.name}`),
          });
        } else {
          // Add file to the result with public URL
          const { data: publicURL, error: urlError } = supabase.storage
            .from("user-files")
            .getPublicUrl(`${path}/${item.name}`);
          if (urlError) {
            throw new Error(`Failed to get URL for file: ${urlError.message}`);
          }

          result.push({
            name: item.name,
            type: "file",
            size: item.metadata?.size || 0,
            created_at: item.created_at,
            urlPath: publicURL.publicUrl, // Add the public URL
          });
        }
      }

      return result;
    }

    // Start traversal from the root directory
    const tree = await traverse(rootPath);
    return tree;
  } catch (error) {
    console.error(`Error fetching arborescence: ${error.message}`);
    throw new Error(`Error fetching arborescence: ${error.message}`);
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

// Rename a file for a user
async function renameFile(userId, directory, oldFileName, newFileName) {
  try {
    const directoryPath = `${escapePath(userId)}/${escapePath(directory)}`;
    const oldFilePath = `${directoryPath}/${escapePath(oldFileName)}`;
    const newFilePath = `${directoryPath}/${escapePath(newFileName)}`;
    console.log(oldFilePath);
    const { error } = await supabase.storage
      .from("user-files")
      .move(oldFilePath, newFilePath);

    if (error) {
      throw new Error(`Failed to rename file: ${error.message}`);
    }

    console.log(
      `Renamed file from ${oldFileName} to ${newFileName} in directory ${directory}`
    );
  } catch (error) {
    console.error(`Error renaming file: ${error.message}`);
    throw new Error(`Error renaming file: ${error.message}`);
  }
}

// Delete a directory and all its files for a user, recursively
async function deleteDirectory(userId, directory) {
  try {
    const path = `${escapePath(userId)}/${escapePath(directory)}`;

    // Recursive function to delete files in subdirectories
    async function deleteFilesRecursively(path) {
      const { data: files, error } = await supabase.storage
        .from("user-files")
        .list(path);

      if (error) {
        throw new Error(
          `Failed to retrieve files for deletion: ${error.message}`
        );
      }

      // Delete all files in the current directory
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

      // Now, check for any subdirectories and call the function recursively
      for (const file of files) {
        const subDirPath = `${path}/${file.name}`;
        // Check if it's a folder by checking if there's no `id` (Supabase will treat directories like files but without IDs)
        if (!file.id) {
          await deleteFilesRecursively(subDirPath);
        }
      }
    }

    // Start deleting files recursively
    await deleteFilesRecursively(path);

    // Finally, check if the directory is empty
    const { data: checkFiles, error: checkError } = await supabase.storage
      .from("user-files")
      .list(path);
    if (checkError) {
      throw new Error(
        `Failed to check directory after deletion: ${checkError.message}`
      );
    }

    if (checkFiles.length === 0) {
      console.log(
        `Directory ${directory} is effectively deleted for user ${userId}`
      );
    } else {
      console.log(
        `Directory ${directory} still contains files for user ${userId}`
      );
    }
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

// Copy a file within a user's directories
async function copyFile(userId, sourceDirectory, targetDirectory, fileName) {
  try {
    // Sanitize paths
    const sourcePath = `${escapePath(userId)}/${escapePath(
      sourceDirectory
    )}/${escapePath(fileName)}`;
    const targetPath = `${escapePath(userId)}/${escapePath(
      targetDirectory
    )}/${escapePath(fileName)}`;

    // Download the file from the source path
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("user-files")
      .download(sourcePath);
    if (downloadError) {
      throw new Error(
        `Failed to download file from source: ${downloadError.message}`
      );
    }

    // Upload the file to the target path
    const { error: uploadError } = await supabase.storage
      .from("user-files")
      .upload(targetPath, fileData, {
        upsert: true, // Optional: This will overwrite any existing file with the same name in the target directory
      });
    if (uploadError) {
      throw new Error(
        `Failed to upload file to target: ${uploadError.message}`
      );
    }

    console.log(
      `File ${fileName} copied from ${sourceDirectory} to ${targetDirectory}`
    );
  } catch (error) {
    console.error(`Error copying file: ${error.message}`);
    throw new Error(`Error copying file: ${error.message}`);
  }
}

export default {
  initializeSupabase,
  createDirectory,
  uploadFile,
  getArborescence,
  listUserFiles,
  renameDirectory,
  renameFile,
  copyFile,
  deleteDirectory,
  deleteFile,
  moveFile,
};
