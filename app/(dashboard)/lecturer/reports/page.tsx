import RoleModuleWorkspace from '@/components/shared/RoleModuleWorkspace';

export default function Page() {
  return (
    <RoleModuleWorkspace
      title="Lecturer Reports"
      description="Generate teaching reports and monitor completion for department submission."
      actionLabel="Save Report Task"
      summaryLabel="Report Task"
    />
  );
}
