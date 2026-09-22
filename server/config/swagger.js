import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MindBot Chat API",
      version: "2.0.0",
      description: "Full-stack AI chatbot API powered by Google Gemini",
      license: { name: "MIT" },
    },
    servers: [
      { url: "http://localhost:5000", description: "Development" },
      { url: "https://your-api.railway.app", description: "Production" },
    ],
    components: {
      securitySchemes: {
        cookieAuth: { type: "apiKey", in: "cookie", name: "token" },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: {
              type: "object",
              properties: {
                code: { type: "string", example: "AUTH_INVALID_CREDENTIALS" },
                message: {
                  type: "string",
                  example: "Invalid email or password.",
                },
                requestId: {
                  type: "string",
                  example: "550e8400-e29b-41d4-a716-446655440000",
                },
              },
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            theme: {
              type: "string",
              enum: ["dark", "darker", "light", "teal", "rose", "green"],
            },
            accentColor: { type: "string", example: "#4f8ef7" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Session: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            messageCount: { type: "integer" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Message: {
          type: "object",
          properties: {
            id: { type: "string" },
            role: { type: "string", enum: ["user", "assistant"] },
            content: { type: "string" },
            edited: { type: "boolean" },
            timestamp: { type: "string", format: "date-time" },
          },
        },
      },
    },
    paths: {
      "/api/health": {
        get: {
          tags: ["System"],
          summary: "Health check",
          responses: {
            200: { description: "Server healthy" },
            503: { description: "Degraded" },
          },
        },
      },
      "/api/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "password"],
                  properties: {
                    name: { type: "string" },
                    email: { type: "string" },
                    password: { type: "string", minLength: 6 },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "User created" },
            400: { description: "Validation error" },
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string" },
                    password: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Login successful" },
            401: { description: "Invalid credentials" },
          },
        },
      },
      "/api/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Logout",
          responses: { 200: { description: "Logged out" } },
        },
      },
      "/api/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Get current user",
          security: [{ cookieAuth: [] }],
          responses: { 200: { description: "Current user" } },
        },
      },
      "/api/auth/profile": {
        put: {
          tags: ["Auth"],
          summary: "Update profile",
          security: [{ cookieAuth: [] }],
          responses: { 200: { description: "Profile updated" } },
        },
      },
      "/api/auth/password": {
        put: {
          tags: ["Auth"],
          summary: "Change password",
          security: [{ cookieAuth: [] }],
          responses: { 200: { description: "Password changed" } },
        },
      },
      "/api/sessions": {
        get: {
          tags: ["Sessions"],
          summary: "List sessions",
          security: [{ cookieAuth: [] }],
          responses: { 200: { description: "Session list" } },
        },
        post: {
          tags: ["Sessions"],
          summary: "Create session",
          security: [{ cookieAuth: [] }],
          responses: { 201: { description: "Session created" } },
        },
      },
      "/api/sessions/{id}": {
        get: {
          tags: ["Sessions"],
          summary: "Get session with messages",
          security: [{ cookieAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "Session data" } },
        },
        delete: {
          tags: ["Sessions"],
          summary: "Delete session",
          security: [{ cookieAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "Deleted" } },
        },
      },
      "/api/chat": {
        post: {
          tags: ["Chat"],
          summary: "Send a message — returns SSE stream",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["message"],
                  properties: {
                    message: { type: "string", maxLength: 10000 },
                    sessionId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "SSE stream: start → chunk(s) → done",
              content: { "text/event-stream": {} },
            },
            400: { description: "Validation error" },
            429: { description: "Rate limited" },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
