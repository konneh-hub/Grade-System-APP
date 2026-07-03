import RoleModuleWorkspace from '@/components/shared/RoleModuleWorkspace';

export default function Page() {
  return (
    <RoleModuleWorkspace
      title="Transcript Operations"
      description="Manage transcript lifecycle from request verification to issuance."
      actionLabel="Save Transcript Update"
      summaryLabel="Transcript Request"
    />
  );
}
