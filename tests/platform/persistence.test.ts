import { describe, it, expect } from 'vitest';
import { PrismaClient } from '@prisma/client';

describe('TEST-SR02-05: Persistent Storage Durability', () => {
  it('should persist committed records across database client disconnect and reconnect', async () => {
    const client1 = new PrismaClient();
    const testEmail = `durability-test-${Date.now()}@example.test`;

    const createdUser = await client1.user.create({
      data: {
        email: testEmail,
        passwordHash: '$2a$12$e8Yh9Y6Yk8o1w2e3r4t5y6u7i8o9p0a1s2d3f4g5h6j7k8l9z0x1c',
        displayName: 'Durability User',
        role: 'USER',
        isActive: true
      }
    });

    expect(createdUser.id).toBeDefined();
    await client1.$disconnect();

    // Reconnect with a fresh client instance simulating app restart
    const client2 = new PrismaClient();
    const retrievedUser = await client2.user.findUnique({
      where: { id: createdUser.id }
    });

    expect(retrievedUser).not.toBeNull();
    expect(retrievedUser?.email).toBe(testEmail);
    expect(retrievedUser?.displayName).toBe('Durability User');

    // Clean up
    await client2.user.delete({
      where: { id: createdUser.id }
    });
    await client2.$disconnect();
  });
});
