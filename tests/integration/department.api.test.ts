import request from 'supertest';
import { App } from '../../src/app';
import { initializeDatabase, closeDatabase } from '../../src/database/connection';
import { AppDataSource } from '../../src/database/connection';
import { User } from '../../src/entities/User.entity';
import { Department } from '../../src/entities/Department.entity';
import bcrypt from 'bcrypt';
import { JwtUtil } from '../../src/utils/jwt.util';
import { UserRole } from '../../src/types/common.types';

describe('Department API Integration Tests', () => {
  let app: Express.Application;
  let authToken: string;
  let testUser: User;

  beforeAll(async () => {
    // Initialize AppDataSource with test configuration
    await initializeDatabase();

    // Create App instance after DB is initialized
    const appInstance = new App();
    app = appInstance.getExpressApp();

    // Create test user and get auth token
    const userRepository = AppDataSource.getRepository(User);
    const hashedPassword = await bcrypt.hash('testpassword', 10);

    testUser = userRepository.create({
      email: 'test@test.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
    });
    await userRepository.save(testUser);

    const jwtUtil = new JwtUtil();
    authToken = jwtUtil.generateToken({
      userId: testUser.id,
      email: testUser.email,
      role: testUser.role,
    });
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clear departments before each test (CASCADE to handle FK constraints)
    const queryRunner = AppDataSource.createQueryRunner();
    try {
      await queryRunner.query('TRUNCATE TABLE "departments" CASCADE;');
    } catch (error) {
      console.log('Warning: Could not clear departments table', error);
    } finally {
      await queryRunner.release();
    }
  });

  describe('POST /api/v1/departments', () => {
    it('should create a new department', async () => {
      const departmentData = {
        name: 'Engineering',
        description: 'Software development team',
      };

      const response = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(departmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: departmentData.name,
        description: departmentData.description,
      });
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('createdAt');
    });

    it('should return 409 when department name already exists', async () => {
      const departmentData = {
        name: 'Engineering',
        description: 'Software development team',
      };

      // Create first department
      await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(departmentData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(departmentData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
    });

    it('should return 400 when validation fails', async () => {
      const response = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 when no auth token provided', async () => {
      const departmentData = {
        name: 'Engineering',
        description: 'Software development team',
      };

      await request(app).post('/api/v1/departments').send(departmentData).expect(401);
    });
  });

  describe('GET /api/v1/departments', () => {
    it('should return all departments', async () => {
      // Create test departments
      const departmentRepository = AppDataSource.getRepository(Department);
      await departmentRepository.save([
        { name: 'Engineering', description: 'Dev team' },
        { name: 'Sales', description: 'Sales team' },
      ]);

      const response = await request(app)
        .get('/api/v1/departments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('id');
    });

    it('should return empty array when no departments exist', async () => {
      const response = await request(app)
        .get('/api/v1/departments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/v1/departments/:id', () => {
    it('should return department by id', async () => {
      const departmentRepository = AppDataSource.getRepository(Department);
      const department = await departmentRepository.save({
        name: 'Engineering',
        description: 'Dev team',
      });

      const response = await request(app)
        .get(`/api/v1/departments/${department.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(department.id);
      expect(response.body.data.name).toBe(department.name);
    });

    it('should return 404 when department not found', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174999';

      const response = await request(app)
        .get(`/api/v1/departments/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/v1/departments/:id', () => {
    it('should update department', async () => {
      const departmentRepository = AppDataSource.getRepository(Department);
      const department = await departmentRepository.save({
        name: 'Engineering',
        description: 'Dev team',
      });

      const updateData = {
        name: 'Software Engineering',
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/v1/departments/${department.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
    });

    it('should return 404 when department not found', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174999';

      const response = await request(app)
        .put(`/api/v1/departments/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/departments/:id', () => {
    it('should delete department (soft delete)', async () => {
      const departmentRepository = AppDataSource.getRepository(Department);
      const department = await departmentRepository.save({
        name: 'Engineering',
        description: 'Dev team',
      });

      await request(app)
        .delete(`/api/v1/departments/${department.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify soft delete
      const deletedDept = await departmentRepository.findOne({
        where: { id: department.id },
        withDeleted: true,
      });

      expect(deletedDept).toBeTruthy();
      expect(deletedDept?.deletedAt).toBeTruthy();
    });

    it('should return 404 when department not found', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174999';

      const response = await request(app)
        .delete(`/api/v1/departments/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
