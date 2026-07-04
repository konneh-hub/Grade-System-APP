import RoleModuleWorkspace from '@/components/shared/RoleModuleWorkspace';

export default function Page() {
  return (
    <RoleModuleWorkspace
      title="Graduation Compliance"
      description="Validate graduation readiness checks and keep examination records synchronized."
      actionLabel="Save Compliance Review"
      summaryLabel="Compliance Record"
    />
  );
}
