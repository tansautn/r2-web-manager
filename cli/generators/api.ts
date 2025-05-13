/*
 *          M""""""""`M            dP
 *          Mmmmmm   .M            88
 *          MMMMP  .MMM  dP    dP  88  .dP   .d8888b.
 *          MMP  .MMMMM  88    88  88888"    88'  `88
 *          M' .MMMMMMM  88.  .88  88  `8b.  88.  .88
 *          M         M  `88888P'  dP   `YP  `88888P'
 *          MMMMMMMMMMM    -*-  Created by Zuko  -*-
 *
 *          * * * * * * * * * * * * * * * * * * * * *
 *          * -    - -   F.R.E.E.M.I.N.D   - -    - *
 *          * -  Copyright © 2025 (Z) Programing  - *
 *          *    -  -  All Rights Reserved  -  -    *
 *          * * * * * * * * * * * * * * * * * * * * *
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readStubFile, processTemplate, capitalize } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..', '..');

const HANDLERS_DIR = join(PROJECT_ROOT, 'src', 'handlers');
const GENERATED_FILE = join(HANDLERS_DIR, '__generated.ts');
const GENERATED_TYPES = join(HANDLERS_DIR, '__generated.d.ts');

export async function generateApiHandler(name: string, options: any) {
  let handlerName = name.toLowerCase();
  const parts = handlerName.split('/');
  if (parts.length > 1) {
    // Get last 3 parts of the path
    const lastParts = parts.slice(-3);
    // Join with first letter uppercase
    handlerName = lastParts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  }
  const fileName = `${parts[parts.length - 1]}.ts`;
  const fileDir = join(HANDLERS_DIR, ...parts.slice(0,-1));
  const filePath = join(fileDir, fileName);
  const method = (options.method || 'GET').toUpperCase();

  // Read and process template
  const template = await readStubFile('api.stub.ts');
  const handlerContent = processTemplate(template, {
    name:handlerName,
    Name: capitalize(handlerName),
    uri: name.toLowerCase(),
    method
  });
    console.info(template, handlerContent);
  // Create handlers directory if it doesn't exist
  await fs.mkdir(fileDir, { recursive: true });
  const rs = await fs.writeFile(filePath, handlerContent);
  console.info(rs);
  // Create or update generated files
  await createGeneratedFiles();
  await updateGeneratedFiles(handlerName, parts.slice(-3, -1).join('/') + '/' + fileName, method);
  console.info(handlerName, method);
  console.log(`✅ Generated API handler: ${fileName}`);
}

async function createGeneratedFiles() {
  try {
    await fs.access(GENERATED_FILE);
  } catch {
    const template = await readStubFile('api-generated.stub.ts');
    await fs.writeFile(GENERATED_FILE, template);
  }

  try {
    await fs.access(GENERATED_TYPES);
  } catch {
    const template = await readStubFile('api-generated.d.stub.ts');
    await fs.writeFile(GENERATED_TYPES, template);
  }
}

async function updateGeneratedFiles(handlerName: string, path: string, method: string) {
  // Update __generated.ts
    path = path.replace(/\\/g, '/');
    path = path.replace(/\.ts$/g,'');
  const importStatement = `import { handle${capitalize(handlerName)} } from './${path}';\n`;
  const handlerEntry = `  '${path}': {\n    handler: handle${capitalize(handlerName)},\n    method: '${method}'\n  },\n`;

  let content = await fs.readFile(GENERATED_FILE, 'utf-8');
  
  // Add import
  if (!content.includes(importStatement)) {
    const importIndex = content.lastIndexOf('import');
    const nextLineIndex = content.indexOf('\n', importIndex) + 1;
    content = content.slice(0, nextLineIndex) + importStatement + content.slice(nextLineIndex);
  }

  // Add handler
  if (!content.includes(handlerEntry)) {
    const handlerIndex = content.indexOf('export const apiHandlers: ApiHandlers = {') + 'export const apiHandlers: ApiHandlers = {'.length;
    content = content.slice(0, handlerIndex) + '\n' + handlerEntry + content.slice(handlerIndex);
  }

  await fs.writeFile(GENERATED_FILE, content);

  // Update __generated.d.ts
  const typesContent = await fs.readFile(GENERATED_TYPES, 'utf-8');
  if (!typesContent.includes(`handle${capitalize(handlerName)}`)) {
    const newTypesContent = typesContent.replace(
      'export declare const apiHandlers: ApiHandlers;',
      `export declare function handle${capitalize(handlerName)}(context: Context): Promise<Response>;\nexport declare const apiHandlers: ApiHandlers;`
    );
    await fs.writeFile(GENERATED_TYPES, newTypesContent);
  }
}
