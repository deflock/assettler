import {
    trimChars,
    trimCharsLeft,
    trimCharsRight,
    trimString,
    trimStringLeft,
    trimStringRight,
} from '../../src/string/trim';

it('trims string', () => {
    expect(trimStringLeft('//str', '/')).toBe('str');
    expect(trimStringRight('str*****', '**')).toBe('str*');
    expect(trimString('***str***', '**')).toBe('*str*');
    expect(trimString('***', '*')).toBe('');
});

it('trims chars', () => {
    expect(trimChars('/\\/str\\/\\', '/\\')).toBe('str');
    expect(trimCharsLeft('/\\//\\\\//\\', ['\\', '/'])).toBe('');
    expect(trimCharsRight('/\\//\\\\//\\', ['\\', '/'])).toBe('');
});
