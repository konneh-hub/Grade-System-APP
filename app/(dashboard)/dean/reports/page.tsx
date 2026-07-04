import RoleModuleWorkspace from '@/components/shared/RoleModuleWorkspace';

export default function Page() {
  return (
    <RoleModuleWorkspace
      title="Dean Reports"
      description="Generate faculty reports and keep a structured decision trail for review meetings."
      actionLabel="Save Report Request"
      summaryLabel="Report Request"
    />
  );
}
