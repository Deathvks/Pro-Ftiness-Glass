import { Redirect, useLocalSearchParams } from 'expo-router';
import { ADMIN_SECTIONS, type AdminSectionId } from '@/config/adminSections';
import { AdminScreen } from '@/components/admin/AdminUI';
import AdminUsers from '@/components/admin/AdminUsers';
import { AdminRatings, AdminReports, AdminRetention, AdminServer, AdminUploads } from '@/components/admin/AdminRecordsSections';
import { AdminEmails, AdminNotifications, AdminNotificationTests } from '@/components/admin/AdminDelivery';
import AdminExercises from '@/components/admin/AdminExercises';
import AdminNews from '@/components/admin/AdminNews';
import AdminSecurity from '@/components/admin/AdminSecurity';

const screens = {
  users: AdminUsers,
  server: AdminServer,
  retention: AdminRetention,
  reports: AdminReports,
  exercises: AdminExercises,
  ratings: AdminRatings,
  notifications: AdminNotifications,
  emails: AdminEmails,
  notificationTests: AdminNotificationTests,
  uploads: AdminUploads,
  news: AdminNews,
  security: AdminSecurity,
} satisfies Record<AdminSectionId, React.ComponentType>;

export default function AdminSection() {
  const { section } = useLocalSearchParams<{ section: string }>();
  const config = ADMIN_SECTIONS.find(item => item.id === section);
  if (!config) return <Redirect href="/admin" />;

  const Screen = screens[config.id];
  return <AdminScreen key={config.id} title={config.label}><Screen /></AdminScreen>;
}
