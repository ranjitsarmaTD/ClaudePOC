import { JwtUtil } from '../../../src/utils/jwt.util';

describe('JwtUtil', () => {
  let jwtUtil: JwtUtil;

  beforeEach(() => {
    jwtUtil = new JwtUtil();
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
        role: 'ADMIN',
      };

      const token = jwtUtil.generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
        role: 'ADMIN',
      };

      const token = jwtUtil.generateToken(payload);
      const decoded = jwtUtil.verifyToken(token);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.string';

      expect(() => jwtUtil.verifyToken(invalidToken)).toThrow('Invalid or expired token');
    });
  });
});
