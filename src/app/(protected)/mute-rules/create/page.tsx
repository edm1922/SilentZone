import { Metadata } from 'next';
import CreateMuteRuleForm from '@/components/mute-rules/create-mute-rule-form';

export const metadata: Metadata = {
  title: 'Create Mute Rule | SilentZone',
  description: 'Create a new content muting rule',
};

export default function CreateMuteRulePage() {
  return <CreateMuteRuleForm />;
}
