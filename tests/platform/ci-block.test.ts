import { describe, it, expect } from 'vitest';
describe('C-02 CI Block Check', () => {
  it('deliberately fails to demonstrate CI merge gate', () => {
    expect(1).toBe(2);
  });
});
