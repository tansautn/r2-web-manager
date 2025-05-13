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

// Define data structure types for the parser
type ParsedValue = string | number | URL;
type ParsedArray = (ParsedNamedParams|ParsedValue|ParsedValue[])[];
type ParsedNamedParams = Record<string, ParsedValue>;

/**
 * Parses a string input into either an array of values or an array of objects with named parameters
 * The input string can contain multiple lines, with each line containing parameters separated by '|'
 * If the first parameter starts with '/', the command part will be removed from the output
 *
 * Features:
 * - Removes command prefix (word starting with '/') from first parameter
 * - Supports quoted strings (preserves spaces within quotes)
 * - Automatically converts URLs to URL objects
 * - Automatically converts numeric strings to numbers
 * - Supports named parameters in "name: value" format
 * - Can map unnamed values to parameter names when provided
 *
 * @param input The input string to parse
 * @param paramNames Optional array of parameter names for named parameter mapping
 * @returns Either an array of parsed values or an array of objects with named parameters
 */
export function parseString(input: string, paramNames?: string[]): (ParsedNamedParams | (string | number | URL)[])[] {
    // Split input into lines, removing empty lines
    const lines = input.trim().split('\n');

    // Process each line
    const result = lines.map(line => {
        // Split line by pipe character and trim whitespace
        const parts = line.split('|').map(part => part.trim());

        // Handle command in the first parameter
        if (parts[0].startsWith('/')) {
            // Remove the command part (everything up to the first space after /)
            const withoutCommand = parts[0].replace(/^\/\w+\s*/, '');
            parts[0] = withoutCommand.trim();

            // Remove the first element if it's empty after command removal
            if (!parts[0]) {
                parts.shift();
            }
        }

        if (paramNames) {
            // Handle named parameter mode
            const namedParams: ParsedNamedParams = {};

            parts.forEach(part => {
                // Check if the part follows "name: value" format
                const namedMatch = part.match(/^([^:]+)\s*:\s*(.+)$/);

                if (namedMatch) {
                    // If it's in "name: value" format, use the specified name
                    const [, name, value] = namedMatch;
                    namedParams[name.trim()] = parseSingleValue(value);
                } else {
                    // If it's not in "name: value" format, use names from paramNames array
                    const index = Object.keys(namedParams).length;
                    if (index < paramNames.length) {
                        namedParams[paramNames[index]] = parseSingleValue(part);
                    }
                }
            });

            return namedParams;
        } else {
            // Handle array mode - parse each part into appropriate type
            return parts.map(parseSingleValue);
        }
    });

    return result;
}

/**
 * Parses a single value into its appropriate type
 * Handles the following formats:
 * - Quoted strings (removes quotes and preserves internal spaces)
 * - URLs (converts to URL objects)
 * - Numbers (converts numeric strings to numbers)
 * - Plain strings (as fallback)
 *
 * @param value The string value to parse
 * @returns The parsed value in its appropriate type
 */
export function parseSingleValue(value: string): ParsedValue {
    // Remove leading/trailing whitespace
    value = value.trim();

    // Handle quoted strings - remove quotes and preserve internal content
    if (value.startsWith('"') && value.endsWith('"')) {
        return value.slice(1, -1);
    }

    // Handle URLs - convert to URL object if valid
    try {
        if (value.includes('://')) {
            return new URL(value);
        }
    } catch (error) {
        // If URL parsing fails, fall through to other type checks
    }

    // Handle numbers - convert to number if possible
    const number = Number(value);
    if (!isNaN(number)) {
        return number;
    }

    // Default case - return as string
    return value;
}

// Example usage showing command handling:
const input1 = `/look hello|https://google.com
/command param1|param2|https://example.com`;

console.log(parseString(input1));
// Expected output:
// [
//   ["hello", URL{...}],
//   ["param1", "param2", URL{...}]
// ]
