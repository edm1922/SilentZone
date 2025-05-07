import { Metadata } from 'next';
import MuteRuleList from '@/components/mute-rules/mute-rule-list';

export const metadata: Metadata = {
  title: 'Mute Rules | SilentZone',
  description: 'Manage your content muting rules',
};

export default function MuteRulesPage() {
  return <MuteRuleList />;
}
