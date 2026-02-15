import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import {
  User,
  Role,
  Entity,
  Department,
  Category,
  Application,
  Integration,
  AuthState,
  LoginCredentials,
  CreateUserInput,
  UpdateUserInput,
  CreateRoleInput,
  CreateEntityInput,
  CreateDepartmentInput,
  CreateCategoryInput,
  CreateApplicationInput,
  CreateIntegrationInput,
  Permission,
} from "./types";

// Simple hash function for demo (in production, use bcrypt on server)
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
};

// Default system roles
const defaultRoles: Role[] = [
  {
    id: "role-admin",
    name: "Administrator",
    description: "Full system access",
    permissions: JSON.stringify(["admin:all"]),
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "role-manager",
    name: "Project Manager",
    description: "Manage projects and teams",
    permissions: JSON.stringify([
      "projects:read", "projects:write",
      "tasks:read", "tasks:write",
      "users:read",
      "entities:read",
      "departments:read",
      "categories:read",
    ]),
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "role-user",
    name: "User",
    description: "Basic project access",
    permissions: JSON.stringify([
      "projects:read",
      "tasks:read", "tasks:write",
    ]),
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Default admin user
const defaultAdminUser: User = {
  id: "user-admin",
  firstName: "System",
  lastName: "Administrator",
  email: "admin@pms.local",
  passwordHash: simpleHash("admin123"),
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  roles: [{
    userId: "user-admin",
    roleId: "role-admin",
    assignedAt: new Date(),
    role: defaultRoles[0], // Include the actual role object
  }],
};

// Default categories
const defaultCategories: Category[] = [
  { id: uuidv4(), name: "NetSuite", color: "#3B82F6", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: uuidv4(), name: "MRP", color: "#10B981", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: uuidv4(), name: "Reporting", color: "#8B5CF6", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: uuidv4(), name: "Specs", color: "#F59E0B", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: uuidv4(), name: "TMS", color: "#EF4444", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: uuidv4(), name: "Harmonization", color: "#06B6D4", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: uuidv4(), name: "EDI", color: "#84CC16", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: uuidv4(), name: "Cost Reduction", color: "#F97316", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: uuidv4(), name: "Creative", color: "#EC4899", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: uuidv4(), name: "D&A", color: "#6366F1", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: uuidv4(), name: "Ecomm", color: "#14B8A6", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: uuidv4(), name: "3PL", color: "#A855F7", isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

interface AdminStore {
  // Auth State
  currentUser: User | null;
  isAuthenticated: boolean;
  authError: string | null;

  // Data
  users: User[];
  roles: Role[];
  entities: Entity[];
  departments: Department[];
  categories: Category[];
  applications: Application[];
  integrations: Integration[];

  // Auth Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  checkPermission: (permission: Permission) => boolean;

  // User Actions
  addUser: (input: CreateUserInput) => User;
  updateUser: (id: string, input: UpdateUserInput) => void;
  deleteUser: (id: string) => void;
  assignRole: (userId: string, roleId: string) => void;
  removeRole: (userId: string, roleId: string) => void;

  // Role Actions
  addRole: (input: CreateRoleInput) => Role;
  updateRole: (id: string, updates: Partial<Role>) => void;
  deleteRole: (id: string) => void;

  // Entity Actions
  addEntity: (input: CreateEntityInput) => Entity;
  updateEntity: (id: string, updates: Partial<Entity>) => void;
  deleteEntity: (id: string) => void;

  // Department Actions
  addDepartment: (input: CreateDepartmentInput) => Department;
  updateDepartment: (id: string, updates: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;

  // Category Actions
  addCategory: (input: CreateCategoryInput) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Application Actions
  addApplication: (input: CreateApplicationInput) => Application;
  updateApplication: (id: string, updates: Partial<Application>) => void;
  deleteApplication: (id: string) => void;

  // Integration Actions
  addIntegration: (input: CreateIntegrationInput) => Integration;
  updateIntegration: (id: string, updates: Partial<Integration>) => void;
  deleteIntegration: (id: string) => void;

  // Initialization
  initializeDefaults: () => void;
  resetStore: () => void;
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      // Initial State
      currentUser: null,
      isAuthenticated: false,
      authError: null,
      users: [defaultAdminUser],
      roles: defaultRoles,
      entities: [],
      departments: [],
      categories: defaultCategories,
      applications: [],
      integrations: [],

      // Auth Actions
      login: async (credentials: LoginCredentials) => {
        const { users, roles: allRoles } = get();
        const user = users.find(
          u => u.email.toLowerCase() === credentials.email.toLowerCase()
        );

        if (!user) {
          set({ authError: "User not found" });
          return false;
        }

        if (!user.isActive) {
          set({ authError: "Account is inactive" });
          return false;
        }

        const passwordHash = simpleHash(credentials.password);
        if (user.passwordHash !== passwordHash) {
          set({ authError: "Invalid password" });
          return false;
        }

        // Get user with roles including full role objects
        const userWithRoles = {
          ...user,
          lastLoginAt: new Date(),
          roles: user.roles?.map(r => ({
            ...r,
            role: r.role || allRoles.find(role => role.id === r.roleId),
          })),
        };

        set({
          currentUser: userWithRoles,
          isAuthenticated: true,
          authError: null,
        });

        // Update last login
        const updatedUsers = users.map(u =>
          u.id === user.id ? { ...u, lastLoginAt: new Date() } : u
        );
        set({ users: updatedUsers });

        return true;
      },

      logout: () => {
        set({
          currentUser: null,
          isAuthenticated: false,
          authError: null,
        });
      },

      checkPermission: (permission: Permission) => {
        const { currentUser, roles } = get();
        if (!currentUser || !currentUser.roles) return false;

        for (const userRole of currentUser.roles) {
          const role = roles.find(r => r.id === userRole.roleId);
          if (role) {
            const permissions = JSON.parse(role.permissions) as string[];
            if (permissions.includes("admin:all") || permissions.includes(permission)) {
              return true;
            }
          }
        }
        return false;
      },

      // User Actions
      addUser: (input: CreateUserInput) => {
        const { roles: allRoles } = get();
        const newUser: User = {
          id: uuidv4(),
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          passwordHash: simpleHash(input.password),
          isActive: input.isActive ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
          roles: input.roleIds?.map(roleId => ({
            userId: "",
            roleId,
            assignedAt: new Date(),
            role: allRoles.find(r => r.id === roleId),
          })) || [],
        };
        newUser.roles = newUser.roles?.map(r => ({ ...r, userId: newUser.id }));

        set(state => ({ users: [...state.users, newUser] }));
        return newUser;
      },

      updateUser: (id: string, input: UpdateUserInput) => {
        const { roles: allRoles } = get();
        set(state => ({
          users: state.users.map(user =>
            user.id === id
              ? {
                  ...user,
                  ...input,
                  passwordHash: input.password ? simpleHash(input.password) : user.passwordHash,
                  updatedAt: new Date(),
                  roles: input.roleIds
                    ? input.roleIds.map(roleId => ({
                        userId: id,
                        roleId,
                        assignedAt: new Date(),
                        role: allRoles.find(r => r.id === roleId),
                      }))
                    : user.roles,
                }
              : user
          ),
        }));
      },

      deleteUser: (id: string) => {
        if (id === "user-admin") return; // Prevent deleting system admin
        set(state => ({
          users: state.users.filter(user => user.id !== id),
        }));
      },

      assignRole: (userId: string, roleId: string) => {
        set(state => ({
          users: state.users.map(user =>
            user.id === userId
              ? {
                  ...user,
                  roles: [
                    ...(user.roles || []),
                    { userId, roleId, assignedAt: new Date() },
                  ],
                  updatedAt: new Date(),
                }
              : user
          ),
        }));
      },

      removeRole: (userId: string, roleId: string) => {
        set(state => ({
          users: state.users.map(user =>
            user.id === userId
              ? {
                  ...user,
                  roles: user.roles?.filter(r => r.roleId !== roleId) || [],
                  updatedAt: new Date(),
                }
              : user
          ),
        }));
      },

      // Role Actions
      addRole: (input: CreateRoleInput) => {
        const newRole: Role = {
          id: uuidv4(),
          name: input.name,
          description: input.description || null,
          permissions: JSON.stringify(input.permissions),
          isSystem: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set(state => ({ roles: [...state.roles, newRole] }));
        return newRole;
      },

      updateRole: (id: string, updates: Partial<Role>) => {
        set(state => ({
          roles: state.roles.map(role =>
            role.id === id && !role.isSystem
              ? { ...role, ...updates, updatedAt: new Date() }
              : role
          ),
        }));
      },

      deleteRole: (id: string) => {
        const role = get().roles.find(r => r.id === id);
        if (role?.isSystem) return; // Prevent deleting system roles
        set(state => ({
          roles: state.roles.filter(role => role.id !== id),
        }));
      },

      // Entity Actions
      addEntity: (input: CreateEntityInput) => {
        const newEntity: Entity = {
          id: uuidv4(),
          name: input.name,
          code: input.code || null,
          description: input.description || null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set(state => ({ entities: [...state.entities, newEntity] }));
        return newEntity;
      },

      updateEntity: (id: string, updates: Partial<Entity>) => {
        set(state => ({
          entities: state.entities.map(entity =>
            entity.id === id ? { ...entity, ...updates, updatedAt: new Date() } : entity
          ),
        }));
      },

      deleteEntity: (id: string) => {
        set(state => ({
          entities: state.entities.filter(entity => entity.id !== id),
        }));
      },

      // Department Actions
      addDepartment: (input: CreateDepartmentInput) => {
        const newDepartment: Department = {
          id: uuidv4(),
          name: input.name,
          code: input.code || null,
          description: input.description || null,
          entityId: input.entityId || null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set(state => ({ departments: [...state.departments, newDepartment] }));
        return newDepartment;
      },

      updateDepartment: (id: string, updates: Partial<Department>) => {
        set(state => ({
          departments: state.departments.map(dept =>
            dept.id === id ? { ...dept, ...updates, updatedAt: new Date() } : dept
          ),
        }));
      },

      deleteDepartment: (id: string) => {
        set(state => ({
          departments: state.departments.filter(dept => dept.id !== id),
        }));
      },

      // Category Actions
      addCategory: (input: CreateCategoryInput) => {
        const newCategory: Category = {
          id: uuidv4(),
          name: input.name,
          code: input.code || null,
          description: input.description || null,
          color: input.color || "#6B7280",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set(state => ({ categories: [...state.categories, newCategory] }));
        return newCategory;
      },

      updateCategory: (id: string, updates: Partial<Category>) => {
        set(state => ({
          categories: state.categories.map(cat =>
            cat.id === id ? { ...cat, ...updates, updatedAt: new Date() } : cat
          ),
        }));
      },

      deleteCategory: (id: string) => {
        set(state => ({
          categories: state.categories.filter(cat => cat.id !== id),
        }));
      },

      // Application Actions
      addApplication: (input: CreateApplicationInput) => {
        const newApp: Application = {
          id: uuidv4(),
          name: input.name,
          description: input.description || null,
          vendor: input.vendor || null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set(state => ({ applications: [...state.applications, newApp] }));
        return newApp;
      },

      updateApplication: (id: string, updates: Partial<Application>) => {
        set(state => ({
          applications: state.applications.map(app =>
            app.id === id ? { ...app, ...updates, updatedAt: new Date() } : app
          ),
        }));
      },

      deleteApplication: (id: string) => {
        set(state => ({
          applications: state.applications.filter(app => app.id !== id),
        }));
      },

      // Integration Actions
      addIntegration: (input: CreateIntegrationInput) => {
        const newIntegration: Integration = {
          id: uuidv4(),
          name: input.name,
          type: input.type || null,
          description: input.description || null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set(state => ({ integrations: [...state.integrations, newIntegration] }));
        return newIntegration;
      },

      updateIntegration: (id: string, updates: Partial<Integration>) => {
        set(state => ({
          integrations: state.integrations.map(int =>
            int.id === id ? { ...int, ...updates, updatedAt: new Date() } : int
          ),
        }));
      },

      deleteIntegration: (id: string) => {
        set(state => ({
          integrations: state.integrations.filter(int => int.id !== id),
        }));
      },

      // Initialize defaults
      initializeDefaults: () => {
        const state = get();
        
        // Initialize roles if empty
        if (state.roles.length === 0) {
          set({ roles: defaultRoles });
        }
        
        // Initialize users if empty
        if (state.users.length === 0) {
          set({ users: [defaultAdminUser] });
        } else {
          // Fix existing users to have role objects attached
          const currentRoles = state.roles.length > 0 ? state.roles : defaultRoles;
          const fixedUsers = state.users.map(user => ({
            ...user,
            roles: user.roles?.map(r => ({
              ...r,
              role: r.role || currentRoles.find(role => role.id === r.roleId),
            })),
          }));
          set({ users: fixedUsers });
        }
        
        // Initialize categories if empty
        if (state.categories.length === 0) {
          set({ categories: defaultCategories });
        }
        
        // Fix currentUser if authenticated but missing role objects
        if (state.isAuthenticated && state.currentUser) {
          const currentRoles = state.roles.length > 0 ? state.roles : defaultRoles;
          const fixedUser = {
            ...state.currentUser,
            roles: state.currentUser.roles?.map(r => ({
              ...r,
              role: r.role || currentRoles.find(role => role.id === r.roleId),
            })),
          };
          set({ currentUser: fixedUser });
        }
      },
      
      // Reset store to defaults (for development/testing)
      resetStore: () => {
        set({
          users: [defaultAdminUser],
          roles: defaultRoles,
          entities: [],
          departments: [],
          categories: defaultCategories,
          applications: [],
          integrations: [],
          currentUser: null,
          isAuthenticated: false,
          authError: null,
        });
      },
    }),
    {
      name: "pms-admin-store",
      partialize: (state) => ({
        users: state.users,
        roles: state.roles,
        entities: state.entities,
        departments: state.departments,
        categories: state.categories,
        applications: state.applications,
        integrations: state.integrations,
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
