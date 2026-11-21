export const presentationAccounts = [
  { email: 'hassan.patient@ebtesamty.dev', name: 'Passant', role: '1. Patient Dashboard', roleAr: '١. لوحة المريض', path: '/portal' },
  { email: 'mariam.reception@ebtesamty.dev', name: 'Mariam Hanna', role: '2. Receptionist Dashboard', roleAr: '٢. لوحة الاستقبال', path: '/reception' },
  { email: 'dr.sandy@ebtesamty.dev', name: 'Dr. Sandy Saad', role: '3. Dentist Dashboard', roleAr: '٣. لوحة الطبيب', path: '/dentist' },
  { email: 'admin@ebtesamty.dev', name: 'Abram', role: '4. Owner / Executive Dashboard', roleAr: '٤. لوحة المالك والإدارة', path: '/management' },
  { email: 'sandy.reception@ebtesamty.dev', name: 'Sandy Abd (BR-B)', role: 'Reception · Minya – Branch B', roleAr: 'الاستقبال · المنيا فرع ب', path: '/reception' },
  { email: 'salma.reception@ebtesamty.dev', name: 'Salma Adel (BR-C)', role: 'Reception · Minya – Branch C', roleAr: 'الاستقبال · المنيا فرع ج', path: '/reception' },
  { email: 'dr.ahmed@ebtesamty.dev', name: 'Dr. Ahmed Hassan', role: 'Dentist · Implants', roleAr: 'طبيب · زراعة الأسنان', path: '/dentist' },
  { email: 'dr.youssef@ebtesamty.dev', name: 'Dr. Youssef El-Mansy', role: 'Dentist · Orthodontics', roleAr: 'طبيب · تقويم الأسنان', path: '/dentist' },
] as const;

export function presentationEnabled() {
  return process.env.ENABLE_DEMO_LOGIN === 'true';
}
