import fs from 'fs';
import path from 'path';

function generateIconNameType(directory) {
  const svgFiles = fs
    .readdirSync(directory)
    .filter(file => file.endsWith('.svg'));
  const iconNames = svgFiles.map(file => path.parse(file).name);
  return `export type IconName = '${iconNames.join("' | '")}';\n`;
}

function updateOrCheckFile(fileToUpdate, content, mode) {
  if (mode === 'check') {
    const currentContent = fs.readFileSync(fileToUpdate, {encoding: 'utf8'});
    if (currentContent.trim() === content.trim()) {
      console.log('File is up-to-date.');
    } else {
      console.error('File contents differ from expected.');
      process.exit(1);
    }
  } else {
    fs.writeFileSync(fileToUpdate, content);
    console.log('File updated successfully.');
  }
}

function main() {
  const args = process.argv.slice(2);
  const directory = args[0];
  const fileToUpdate = args[1];
  const mode = args[2] || 'generate';

  if (!directory || !fileToUpdate) {
    console.error('Directory and file to update must be provided.');
    process.exit(1);
  }

  const content = generateIconNameType(directory);
  updateOrCheckFile(fileToUpdate, content, mode);
}

main();
