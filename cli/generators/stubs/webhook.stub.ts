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

import { TelegramContext } from '@/router/context/TelegramContext';
import { Bot } from '@/bot/Bot';
import { createLogger, LogScope } from '@/utils/logger';

const logger = createLogger('{{name}}Command', LogScope.WEBHOOK);

export async function handle{{Name}}(context: TelegramContext, bot: Bot): Promise<Response> {
  const chatId = context.getChatId();
  const userId = context.update.from.id;

  logger.info('Processing /{{name}} command', { chatId, userId });

  try {
    await bot.reply(chatId, 'Hello from /{{name}} command!');
    
    logger.info('{{name}} command processed successfully');
    return Promise.resolve(new Response('OK', { status: 200 }));
  } catch (error) {
    logger.error('Failed to process {{name}} command', error);
    throw error;
  }
}
