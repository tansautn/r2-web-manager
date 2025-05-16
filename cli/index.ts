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



import { Command } from 'commander';
import { generateWebhookHandler } from './generators/webhook';
import { generateApiHandler } from './generators/api';

const program = new Command();

program
  .name('ttpt-cli')
  .description('CLI tools for managing TTPT bot handlers')
  .version('1.0.0');

program
  .command('add:webhook')
  .description('Add a new webhook handler')
  .argument('<name>', 'Name of the webhook handler (without slash)')
  .option('-d, --description <description>', 'Handler description')
  .action(async (name, options) => {
    await generateWebhookHandler(name, options);
  });

program
  .command('add:api')
  .description('Add a new API handler')
  .argument('<name>', 'Name of the API handler')
  .option('-m, --method <method>', 'HTTP method', 'GET')
  .option('-d, --description <description>', 'Handler description')
  .action(async (name, options) => {
    await generateApiHandler(name, options);
  });

program.parse(); 