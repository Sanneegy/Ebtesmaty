/** Both password and presentation authentication use persisted grants. */
export function loginDestination(grants: {role:string}[]): string | null {
 const destinations: Record<string,string>={OWNER_ADMIN:'/management',SYSTEM_ADMIN:'/admin',FINANCE:'/billing',INVENTORY:'/inventory',CRM:'/crm',RECEPTIONIST:'/reception',DENTIST:'/dentist',PATIENT:'/portal'};
 for(const role of Object.keys(destinations)) if(grants.some(g=>g.role===role))return destinations[role];
 return null;
}
