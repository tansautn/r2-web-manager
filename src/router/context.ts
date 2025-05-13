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

//import { TelegramUpdate } from '../types/telegram';
import {parseString} from "../utils/paramStrParser";
import logger from "../utils/logger";

export interface Context {
    request: Request;
    env: Record<string, any>;
    parse(): Promise<void>;
}
export abstract class Context implements Context {
    request: Request;
    env: Record<string, any>;
    body?: any;
    update?: any;
    parse(): Promise<void> {
        return Promise.resolve();
    }
    constructor(request: Request, env: Record<string, any>) {
        this.request = request;
        this.env = env;
    }
}
// export class TelegramContext extends Context {
//     request!: Request;
//     env!: Record<string, any>;
//     body?: any;
//     update: TelegramUpdate;

//     constructor(request: Request, env: Record<string, any>) {
//         super(request, env);
//         this.update = {} as TelegramUpdate;
//         this.parse();
//     }

//     async parse(): Promise<void> {
//         if (this.request.method === 'POST') {
//             this.body = await this.request.json();
//             this.update = this.body;
//         }
//     }
//     getParamsFromUpdate(): any {
//         if (this.isCallbackQuery()){
//             return this.getCallbackParams();
//         }
//         return this.getMessageParams();
//     }
//     getMessageParams(): any {
//         const text = this.getText();
//         logger.debug('Received text', {text});
//         const params = parseString(text || '');
//         logger.debug('Parsed params', {params});
//         return params;
//     }
//     getCallbackAction(): string | null {
//         if (this.isCallbackQuery()){
//             const [command] = this.getCallbackData() || [null];
//             return command;
//         }
//         return null;
//     }
//     getCallbackParams(): any[] | null {
//         if (this.isCallbackQuery()){
//             const [, ...params] = this.getCallbackData() || [null];
//             return params;
//         }
//         return null;
//     }
//     getCommand(): string | null {
//         if (this.isCallbackQuery()){
//             const [command] = this.getCallbackData() || [null];
//             return command;
//         }
//         const text = this.getText();
//         if (!text?.startsWith('/')) return null;
//         const [command] = text.split(' ');
//         return command.substring(1);
//     }

//     getMessage(): any {
//         return this.update?.message;
//     }

//     getCallbackQuery(): any {
//         return this.update?.callback_query;
//     }

//     getChatId(): number {
//         if (this.update?.chat?.id) {
//             return this.update?.chat?.id;
//         }
//         if (this.isCallbackQuery()) {
//             return this.getCallbackQuery()?.message?.chat?.id;
//         }
//         return this.getMessage()?.chat?.id;
//     }

//     getMessageId(): number {
//         if (this.isCallbackQuery()) {
//             return this.getCallbackQuery()?.message?.message_id;
//         }
//         return this.getMessage()?.message_id;
//     }

//     getText(): string | null {
//         if(this.isCallbackQuery()){
//             return this.getCallbackQuery()?.message?.text || null;
//         }
//         return this.getMessage()?.text || null;
//     }

//     getCaption(): string | null {
//         return this.getMessage()?.caption || null;
//     }

//     getUserId(): number | null {
//         // Try to get user ID from different possible sources
//         return this.update?.from?.id ||
//                this.getMessage()?.from?.id ||
//                this.getCallbackQuery()?.from?.id ||
//                null;
//     }

//     getUpdateType(): string {
//         if (this.update.message) return 'message';
//         if (this.update.edited_message) return 'edited_message';
//         if (this.update.channel_post) return 'channel_post';
//         if (this.update.edited_channel_post) return 'edited_channel_post';
//         if (this.update.callback_query) return 'callback_query';
//         return 'unknown';
//     }

//     isCallbackQuery(): boolean {
//         return this.getUpdateType() === 'callback_query';
//     }

//     getCallbackData(): any[] | null {
//         const data = this.getCallbackQuery()?.data
//         if (data) {
//             return data.split(':');
//         }
//         return null;
//     }
// }

interface FormDataFile {
    arrayBuffer(): Promise<ArrayBuffer>;
    name: string;
    size: number;
    type: string;
}

export class APIContext extends Context {
    request: Request;
    env: Record<string, any>;
    query: URLSearchParams;
    body?: any;
    files: Map<string, FormDataFile>;
    formData: Map<string, string>;

    constructor(request: Request, env: Record<string, any>) {
        super(request, env);
        this.request = request;
        this.env = env;
        this.query = new URL(request.url).searchParams;
        this.files = new Map();
        this.formData = new Map();
    }

    async parse(): Promise<void> {
        const contentType = this.request.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            this.body = await this.request.json();
        } 
        else if (contentType.includes('multipart/form-data')) {
            const formData = await this.request.formData();
            for (const [key, value] of formData.entries()) {
                const fileValue = value as unknown;
                if (fileValue instanceof File || fileValue instanceof Blob) {
                    this.files.set(key, {
                        arrayBuffer: () => fileValue.arrayBuffer(),
                        name: 'name' in fileValue ? (fileValue as File).name : key,
                        size: fileValue.size,
                        type: fileValue.type
                    });
                } else {
                    this.formData.set(key, value.toString());
                }
            }
        }
    }

    // Query params helpers
    getQueryParam(key: string): string | null {
        return this.query.get(key);
    }

    getRequiredQueryParam(key: string): string {
        const value = this.query.get(key);
        if (!value) {
            throw new Error(`Required query parameter '${key}' is missing`);
        }
        return value;
    }

    // Form data helpers
    getFormData(key: string): string | null {
        return this.formData.get(key) || null;
    }

    getFile(key: string): FormDataFile | null {
        return this.files.get(key) || null;
    }

    getRequiredFile(key: string): FormDataFile {
        const file = this.files.get(key);
        if (!file) {
            throw new Error(`Required file '${key}' is missing`);
        }
        return file;
    }
}
