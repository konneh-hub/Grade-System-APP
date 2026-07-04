import RoleModuleWorkspace from '@/components/shared/RoleModuleWorkspace';

export default function Page() {
  return (
    <RoleModuleWorkspace
      title="Course Management"
      description="Track assigned courses, class delivery updates, and follow-up actions."
      actionLabel="Save Course Update"
      summaryLabel="Course Item"
    />
  );
}
