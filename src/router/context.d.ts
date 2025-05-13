/**
 * --------------------------------------------------------------------------
 *
 * --------------------------------------------------------------------------
 * @PROJECT    : r2manager
 * @AUTHOR     : Zuko <https://github.com/tansautn>
 * @LINK       : https://www.zuko.pro/
 * @FILE       : context.d.ts
 * @CREATED    : 16:50 , 22/Feb/2025
 */

declare type Context = {
  request: Request;
  env: Record<string, string> | null;
};

declare type APIContext = Context & {
  request: Request;
  env: Record<string, string> | null;
};

export { Context, APIContext };
