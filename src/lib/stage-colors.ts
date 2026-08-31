// Shared stage color utility for consistent styling across the app

export type StageType = 'applied' | 'screen' | 'phone' | 'technical' | 'final' | 'offer' | 'hired' | 'rejected' | 'default';

interface StageColorConfig {
  bg: string;
  text: string;
  border: string;
}

const stageColors: Record<StageType, StageColorConfig> = {
  applied: {
    bg: 'bg-[#E0E0E0]',
    text: 'text-[#424242]',
    border: 'border-[#BDBDBD]',
  },
  phone: {
    bg: 'bg-[#BBDEFB]',
    text: 'text-[#1565C0]',
    border: 'border-[#64B5F6]',
  },
  screen: {
    bg: 'bg-[#C5CAE9]',
    text: 'text-[#303F9F]',
    border: 'border-[#7986CB]',
  },
  technical: {
    bg: 'bg-[#B2DFDB]',
    text: 'text-[#00695C]',
    border: 'border-[#4DB6AC]',
  },
  final: {
    bg: 'bg-[#FFCCBC]',
    text: 'text-[#BF360C]',
    border: 'border-[#FF8A65]',
  },
  offer: {
    bg: 'bg-[#E1BEE7]',
    text: 'text-[#6A1B9A]',
    border: 'border-[#BA68C8]',
  },
  hired: {
    bg: 'bg-[#C8E6C9]',
    text: 'text-[#2E7D32]',
    border: 'border-[#81C784]',
  },
  rejected: {
    bg: 'bg-[#FFCDD2]',
    text: 'text-[#C62828]',
    border: 'border-[#EF9A9A]',
  },
  default: {
    bg: 'bg-[#F5F5F5]',
    text: 'text-[#616161]',
    border: 'border-[#E0E0E0]',
  },
};

export const getStageType = (stageName: string): StageType => {
  const lower = stageName.toLowerCase();
  
  if (lower.includes('applied')) return 'applied';
  if (lower.includes('phone')) return 'phone';
  if (lower.includes('screen')) return 'screen';
  if (lower.includes('technical')) return 'technical';
  if (lower.includes('final')) return 'final';
  if (lower.includes('onsite')) return 'technical';
  if (lower.includes('offer')) return 'offer';
  if (lower.includes('hired')) return 'hired';
  if (lower.includes('reject')) return 'rejected';
  
  return 'default';
};

export const getStageColorClasses = (stageName: string): string => {
  const type = getStageType(stageName);
  const colors = stageColors[type];
  return `${colors.bg} ${colors.text} ${colors.border}`;
};

export const getStageColors = (stageName: string): StageColorConfig => {
  const type = getStageType(stageName);
  return stageColors[type];
};
