import RoleModuleWorkspace from '@/components/shared/RoleModuleWorkspace';

export default function Page() {
  return (
    <RoleModuleWorkspace
      title="Graduation Review"
      description="Validate graduation applications and document final faculty decisions."
      actionLabel="Save Graduation Decision"
      summaryLabel="Graduation Application"
    />
  );
}
