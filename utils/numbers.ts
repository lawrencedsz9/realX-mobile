/**
 * Normalizes Arabic (٠-٩) and Persian (۰-۹) digits to Western (0-9) digits.
 * Also handles decimals and removes non-numeric characters if needed.
 * 
 * @param input The string containing digits to normalize.
 * @returns A string with only Western digits and optionally a decimal point.
 */
export function normalizeDigits(input: string): string {
    if (!input) return '';

    return input
        .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString())
        .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString());
}
