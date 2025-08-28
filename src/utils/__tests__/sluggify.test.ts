import { describe, it, expect } from 'vitest';
import { slugify } from '../sluggify';

describe('slugify', () => {
  it('should convert basic text to lowercase slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('should handle single words', () => {
    expect(slugify('Hello')).toBe('hello');
  });

  it('should replace spaces with hyphens', () => {
    expect(slugify('This is a test')).toBe('this-is-a-test');
  });

  it('should handle multiple consecutive spaces', () => {
    expect(slugify('Multiple   spaces    here')).toBe('multiple-spaces-here');
  });

  it('should remove special characters', () => {
    expect(slugify('Hello @#$% World!')).toBe('hello-world');
  });

  it('should handle mixed alphanumeric and special characters', () => {
    expect(slugify('Test123 & More!')).toBe('test123-more');
  });

  it('should trim leading and trailing whitespace', () => {
    expect(slugify('  Hello World  ')).toBe('hello-world');
  });

  it('should remove leading hyphens', () => {
    expect(slugify('---hello world')).toBe('hello-world');
  });

  it('should remove trailing hyphens', () => {
    expect(slugify('hello world---')).toBe('hello-world');
  });

  it('should collapse multiple consecutive hyphens', () => {
    expect(slugify('hello---world')).toBe('hello-world');
  });

  it('should handle empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('should handle string with only spaces', () => {
    expect(slugify('   ')).toBe('');
  });

  it('should handle string with only special characters', () => {
    expect(slugify('@#$%^&*()')).toBe('');
  });

  it('should preserve numbers', () => {
    expect(slugify('Test 123 456')).toBe('test-123-456');
  });

  it('should handle underscores correctly', () => {
    expect(slugify('hello_world_test')).toBe('hello_world_test');
  });

  it('should handle accented characters', () => {
    expect(slugify('Café & Restaurant')).toBe('caf-restaurant');
  });

  it('should handle complex real-world examples', () => {
    expect(slugify('Real Madrid C.F.')).toBe('real-madrid-cf');
    expect(slugify('FC Barcelona 2024/25')).toBe('fc-barcelona-202425');
    expect(slugify('Atlético de Madrid')).toBe('atltico-de-madrid');
  });

  it('should handle very long strings', () => {
    const longString = 'This is a very long string that should be converted to a slug properly without any issues';
    expect(slugify(longString)).toBe('this-is-a-very-long-string-that-should-be-converted-to-a-slug-properly-without-any-issues');
  });

  it('should handle strings with tabs and newlines', () => {
    expect(slugify('Hello\tWorld\nTest')).toBe('hello-world-test');
  });

  it('should handle mixed case with numbers and symbols', () => {
    expect(slugify('iPhone 15 Pro Max (2023)')).toBe('iphone-15-pro-max-2023');
  });
});
