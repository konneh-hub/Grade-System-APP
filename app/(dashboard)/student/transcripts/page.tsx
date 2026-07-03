import RoleModuleWorkspace from '@/components/shared/RoleModuleWorkspace';

export default function Page() {
  return (
    <RoleModuleWorkspace
      title="Transcript Tracking"
      description="Track transcript requests and monitor issuance status updates."
      actionLabel="Save Transcript Request"
      summaryLabel="Transcript Item"
    />
  );
}
