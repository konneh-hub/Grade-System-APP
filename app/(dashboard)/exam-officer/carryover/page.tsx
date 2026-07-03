import RoleModuleWorkspace from '@/components/shared/RoleModuleWorkspace';

export default function Page() {
  return (
    <RoleModuleWorkspace
      title="Carryover Processing"
      description="Manage carryover requests, outcomes, and follow-up timelines for affected students."
      actionLabel="Save Carryover Action"
      summaryLabel="Carryover Request"
    />
  );
}
