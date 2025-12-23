
export type UserRole = 'sistem yöneticisi' | 'veri girici' | 'saha sorumlusu' | 'şoför';

export const ROLES = {
    ADMIN: 'sistem yöneticisi' as UserRole,
    DATA_ENTRY: 'veri girici' as UserRole,
    FIELD_SUPERVISOR: 'saha sorumlusu' as UserRole,
    DRIVER: 'şoför' as UserRole,
};

// Route Access Rules (Allowed Routes)
export const ROLE_ACCESS_RULES: Record<string, string[]> = {
    [ROLES.ADMIN]: ['*'], // All access
    [ROLES.DATA_ENTRY]: ['*', '!/kullanicilar'], // All except Users
    [ROLES.FIELD_SUPERVISOR]: ['*', '!/raporlama', '!/gelir-gider', '!/kullanicilar'], // Exclusions
    [ROLES.DRIVER]: ['/gunluk-program', '/login'], // Whitelist approach for restricted roles
};

// Feature Permissions
export const PERMISSIONS = {
    CAN_DELETE: [ROLES.ADMIN],
    CAN_APPROVE_WORK_ORDER: [ROLES.ADMIN, ROLES.DATA_ENTRY],
    CAN_MANAGE_ACCRUALS: [ROLES.ADMIN, ROLES.DATA_ENTRY], // Hakediş
};

export function canAccessRoute(role: UserRole | undefined, path: string): boolean {
    if (!role) return false;
    if (path === '/' || path === '/login') return true; // Everyone can access home/login (middleware handles home redirection if needed)

    // Normalize path to remove query params
    const cleanPath = path.split('?')[0];

    const rules = ROLE_ACCESS_RULES[role];
    if (!rules) return false;

    // Admin check
    if (rules.includes('*')) {
        // Check exclusions (starting with !)
        const exclusions = rules.filter(r => r.startsWith('!')).map(r => r.substring(1));
        if (exclusions.some(exc => cleanPath.startsWith(exc))) {
            return false;
        }
        return true;
    }

    // specific allow list
    return rules.some(rule => cleanPath.startsWith(rule));
}

export function hasPermission(role: UserRole | undefined, permission: UserRole[]): boolean {
    if (!role) return false;
    return permission.includes(role);
}
