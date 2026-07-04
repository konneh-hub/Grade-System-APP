import RoleModuleWorkspace from '@/components/shared/RoleModuleWorkspace';

export default function Page() {
  return (
    <RoleModuleWorkspace
      title="Request Transcript"
      description="Create transcript requests with full submission notes and priorities."
      actionLabel="Save Request"
      summaryLabel="Request Draft"
    />
  );
}
