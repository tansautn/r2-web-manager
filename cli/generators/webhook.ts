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

const HANDLERS_DIR = join(PROJECT_ROOT, 'src', 'webhook_handlers');
const GENERATED_FILE = join(HANDLERS_DIR, '__generated.ts');
const GENERATED_TYPES = join(HANDLERS_DIR, '__generated.d.ts');

async function initGeneratedFiles() {
  // Initialize __generated.ts if not exists
  const generatedContent = `# WARNING: This file is auto-generated. Do not modify it manually.
  import { CommandHandlers } from '../types/telegram-bot';

export const commandHandlers: CommandHandlers = {
};
`;
  
  // Initialize __generated.d.ts if not exists
  const generatedTypesContent = `import { CommandHandler, CommandHandlers } from '../types/telegram-bot';
import { TelegramContext } from '../router/context/TelegramContext';
import { Bot } from '../bot/Bot';

export declare const commandHandlers: CommandHandlers;
`;

  try {
    await fs.access(GENERATED_FILE);
  } catch {
    await fs.writeFile(GENERATED_FILE, generatedContent);
  }

  try {
    await fs.access(GENERATED_TYPES);
  } catch {
    await fs.writeFile(GENERATED_TYPES, generatedTypesContent);
  }
}

export async function generateWebhookHandler(name: string, options: any) {
  const handlerName = name.toLowerCase();
  const fileName = `${handlerName}.ts`;
  const filePath = join(HANDLERS_DIR, fileName);

  // Read and process template
  const template = await readStubFile('webhook.stub.ts');
  const handlerContent = processTemplate(template, {
    name: handlerName,
    Name: capitalize(handlerName)
  });

  await fs.writeFile(filePath, handlerContent);

  // Initialize or update generated files
  await initGeneratedFiles();
  await updateGeneratedFiles(handlerName);

  console.log(`✅ Generated webhook handler: ${fileName}`);
}

async function updateGeneratedFiles(handlerName: string) {
  // Update __generated.ts
  const importStatement = `import { handle${capitalize(handlerName)} } from './${handlerName}';\n`;
  const handlerEntry = `  '${handlerName}': handle${capitalize(handlerName)},\n`;

  let content: string;
  try {
    content = await fs.readFile(GENERATED_FILE, 'utf-8');
  } catch {
    // If file is missing or empty, initialize it
    content = `import { CommandHandlers } from '../types/telegram-bot';

export const commandHandlers: CommandHandlers = {
};
`;
  }

  // Validate content structure
  if (!content.includes('export const commandHandlers')) {
    content = `import { CommandHandlers } from '../types/telegram-bot';

export const commandHandlers: CommandHandlers = {
};
`;
  }
  
  // Add import if not exists
  if (!content.includes(importStatement)) {
    const importIndex = content.lastIndexOf('import');
    const nextLineIndex = importIndex >= 0 ? content.indexOf('\n', importIndex) + 1 : 0;
    content = content.slice(0, nextLineIndex) + importStatement + content.slice(nextLineIndex);
  }

  // Add handler if not exists
  if (!content.includes(handlerEntry)) {
    const objectStartIndex = content.indexOf('export const commandHandlers: CommandHandlers =');
     console.info('content', content);
     console.info('objectStartIndex', objectStartIndex);
    if (objectStartIndex > 0) {
      // Find the position after the opening brace
      const openBraceIndex = content.indexOf('{', objectStartIndex);
      // Find the position of the closing brace
      const closeBraceIndex = content.indexOf('};', objectStartIndex);
      
      if (openBraceIndex > 0 && closeBraceIndex > 0) {
        // Insert handler entry after the opening brace
        content = content.slice(0, openBraceIndex + 1) + '\n' + 
                 handlerEntry + 
                 content.slice(openBraceIndex + 1, closeBraceIndex).trimEnd() + 
                 content.slice(closeBraceIndex);
      }
    }
  }

  await fs.writeFile(GENERATED_FILE, content);

  // Update __generated.d.ts
  let typesContent: string;
  try {
    typesContent = await fs.readFile(GENERATED_TYPES, 'utf-8');
  } catch {
    // If file is missing or empty, initialize it
    typesContent = `import { CommandHandler, CommandHandlers } from '../types/telegram-bot';
import { TelegramContext } from '../router/context/TelegramContext';
import { Bot } from '../bot/Bot';

export declare const commandHandlers: CommandHandlers;
`;
  }

  if (!typesContent.includes(`handle${capitalize(handlerName)}`)) {
    const newTypesContent = typesContent.replace(
      'export declare const commandHandlers: CommandHandlers;',
      `export declare function handle${capitalize(handlerName)}(context: TelegramContext, bot: Bot): Promise<Response>;\nexport declare const commandHandlers: CommandHandlers;`
    );
    await fs.writeFile(GENERATED_TYPES, newTypesContent);
  }
} 
