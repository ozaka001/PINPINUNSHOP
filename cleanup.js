import { unlink, readdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  // Read all files in the current directory
  const files = await readdir('.');
  
  // Filter for realm files
  const realmFiles = files.filter(file => file.startsWith('shenshopper.realm'));
  
  // Delete each realm file
  for (const file of realmFiles) {
    try {
      await unlink(file);
      console.log(`Deleted ${file}`);
    } catch (err) {
      console.error(`Error deleting ${file}:`, err);
    }
  }
  
  console.log('Cleanup completed');
} catch (err) {
  console.error('Error during cleanup:', err);
}
