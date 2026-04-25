import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "OrgNest API",
      version: "1.0.0",
      description:
        "Multi-tenant SaaS task management platform. Authenticate via POST /api/auth/login to receive an `access_token` HttpOnly cookie, then use Try it Out on any endpoint.",
      contact: {
        name: "OrgNest",
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        description: "Application server",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "access_token",
          description: "HttpOnly JWT cookie set by POST /api/auth/login",
        },
      },
      schemas: {
        PaginationMeta: {
          type: "object",
          properties: {
            page: { type: "integer" },
            limit: { type: "integer" },
            total: { type: "integer" },
            totalPages: { type: "integer" },
            hasNext: { type: "boolean" },
            hasPrev: { type: "boolean" },
          },
        },
        ApiError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string" },
            code: { type: "string" },
          },
        },
        Task: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            description: { type: "string", nullable: true },
            status: {
              type: "string",
              enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"],
            },
            priority: { type: "integer", minimum: 1, maximum: 3 },
            tenantId: { type: "string" },
            assignedToId: { type: "string", nullable: true },
            assignedTo: {
              type: "object",
              nullable: true,
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                email: { type: "string" },
              },
            },
            dueDate: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateTask: {
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string", maxLength: 255 },
            description: { type: "string", maxLength: 2000 },
            status: {
              type: "string",
              enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"],
              default: "TODO",
            },
            priority: { type: "integer", minimum: 1, maximum: 3, default: 2 },
            assignedToId: { type: "string" },
            dueDate: { type: "string", format: "date-time" },
          },
        },
        PatchTask: {
          type: "object",
          properties: {
            title: { type: "string", maxLength: 255 },
            description: { type: "string", maxLength: 2000 },
            status: {
              type: "string",
              enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"],
            },
            priority: { type: "integer", minimum: 1, maximum: 3 },
            assignedToId: { type: "string", nullable: true },
            dueDate: { type: "string", format: "date-time", nullable: true },
          },
        },
        PaginatedTasks: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "array", items: { $ref: "#/components/schemas/Task" } },
            meta: { $ref: "#/components/schemas/PaginationMeta" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["ADMIN", "MANAGER", "EMPLOYEE"] },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        CreateUser: {
          type: "object",
          required: ["name", "email", "password", "role"],
          properties: {
            name: { type: "string", minLength: 2, maxLength: 100 },
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8, format: "password" },
            role: { type: "string", enum: ["MANAGER", "EMPLOYEE"] },
          },
        },
        PatchUser: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 2, maxLength: 100 },
            role: { type: "string", enum: ["ADMIN", "MANAGER", "EMPLOYEE"] },
          },
        },
        AuditLog: {
          type: "object",
          properties: {
            id: { type: "string" },
            action: { type: "string" },
            entity: { type: "string" },
            entityId: { type: "string", nullable: true },
            userId: { type: "string" },
            tenantId: { type: "string" },
            metadata: { type: "object", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            user: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
              },
            },
          },
        },
        UserPermissionOverride: {
          type: "object",
          required: ["module", "action", "granted"],
          properties: {
            module: {
              type: "string",
              enum: ["TASKS", "USERS", "AUDIT", "ANALYTICS", "SETTINGS"],
            },
            action: { type: "string", enum: ["READ", "WRITE", "DELETE", "MANAGE"] },
            granted: { type: "boolean" },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: "Authentication required",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ApiError" } },
          },
        },
        Forbidden: {
          description: "Insufficient permissions",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ApiError" } },
          },
        },
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ApiError" } },
          },
        },
        BadRequest: {
          description: "Validation error",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ApiError" } },
          },
        },
        Conflict: {
          description: "Resource already exists",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ApiError" } },
          },
        },
      },
    },
    security: [{ cookieAuth: [] }],
  },
  // Source files containing @swagger JSDoc annotations
  apis: ["./src/app/api/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
