import RoleModuleWorkspace from '@/components/shared/RoleModuleWorkspace';

export default function Page() {
  return (
    <RoleModuleWorkspace
      title="Lecturer Notifications"
      description="Create and monitor class notices and learning updates for students."
      actionLabel="Save Notification"
      summaryLabel="Notification Item"
    />
  );
}
