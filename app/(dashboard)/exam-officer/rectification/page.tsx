import RoleModuleWorkspace from '@/components/shared/RoleModuleWorkspace';

export default function Page() {
  return (
    <RoleModuleWorkspace
      title="Rectification Queue"
      description="Track submitted rectifications and document correction approvals end-to-end."
      actionLabel="Save Rectification Update"
      summaryLabel="Rectification Case"
    />
  );
}
