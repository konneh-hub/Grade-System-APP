import RoleModuleWorkspace from '@/components/shared/RoleModuleWorkspace';

export default function Page() {
  return (
    <RoleModuleWorkspace
      title="Generate Transcripts"
      description="Initiate transcript generation jobs and track generation outcomes."
      actionLabel="Queue Transcript Job"
      summaryLabel="Generation Job"
    />
  );
}
