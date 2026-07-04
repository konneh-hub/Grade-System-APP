import RoleModuleWorkspace from '@/components/shared/RoleModuleWorkspace';

export default function Page() {
  return (
    <RoleModuleWorkspace
      title="Result Processing Pipeline"
      description="Execute staged result processing tasks and log progress safely."
      actionLabel="Save Pipeline Step"
      summaryLabel="Pipeline Step"
    />
  );
}
