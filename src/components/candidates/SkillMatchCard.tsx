import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SkillMatchCardProps {
  candidateSkills: string[];
  requiredSkills?: string[];
}

export const SkillMatchCard = ({ candidateSkills, requiredSkills = [] }: SkillMatchCardProps) => {
  // Match skills (case-insensitive, partial matches)
  const matchedSkills = candidateSkills.filter(skill => 
    requiredSkills.some(req => 
      req.toLowerCase() === skill.toLowerCase() || 
      req.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(req.toLowerCase())
    )
  );
  
  const unmatchedSkills = requiredSkills.filter(skill => 
    !candidateSkills.some(cs => 
      cs.toLowerCase() === skill.toLowerCase() ||
      cs.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(cs.toLowerCase())
    )
  );
  
  const matchPercentage = requiredSkills.length > 0 
    ? Math.round((matchedSkills.length / requiredSkills.length) * 100) 
    : 0;

  // Circle SVG properties
  const circumference = 2 * Math.PI * 40.0572;
  const offset = circumference - (matchPercentage / 100) * circumference;

  return (
    <div className="flex h-44 py-3 px-3 pl-[30px] items-center gap-5 rounded-lg bg-muted">
      {/* Circular Progress Chart */}
      <div className="relative w-[108px] h-[108px] flex-shrink-0">
        {/* Background circle */}
        <svg 
          className="absolute left-0 top-0 w-[108px] h-[108px]" 
          width="108" 
          height="108" 
          viewBox="0 0 108 108" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M108 54C108 83.8234 83.8234 108 54 108C24.1766 108 0 83.8234 0 54C0 24.1766 24.1766 0 54 0C83.8234 0 108 24.1766 108 54ZM13.9428 54C13.9428 76.123 31.877 94.0572 54 94.0572C76.123 94.0572 94.0572 76.123 94.0572 54C94.0572 31.877 76.123 13.9428 54 13.9428C31.877 13.9428 13.9428 31.877 13.9428 54Z" 
            fill="#D5DAE7"
          />
        </svg>
        {/* Progress circle */}
        <svg 
          className="absolute left-0 top-0 w-[108px] h-[108px] -rotate-90" 
          width="108" 
          height="108" 
          viewBox="0 0 108 108" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="54"
            cy="54"
            r="40.0572"
            stroke="#45CE99"
            strokeWidth="13.9428"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        {/* Percentage text */}
        <div className="absolute left-[30px] top-[38px] flex flex-col justify-center w-12 h-5 text-center text-foreground font-bold text-base leading-normal tracking-[-0.8px]">
          {matchPercentage}%
        </div>
        {/* "match" label */}
        <div className="absolute left-[34px] top-[58px] flex flex-col justify-center w-10 h-[11px] text-center text-muted-foreground font-medium text-xs leading-normal">
          match
        </div>
      </div>

      {/* Skills section */}
      <div className="flex flex-col justify-center items-start gap-3 flex-1">
        <div className="text-black text-center font-semibold text-base leading-normal tracking-[-0.8px]">
          {matchedSkills.length} out of {requiredSkills.length} required skills met
        </div>

        <div className="flex items-start content-start gap-3 self-stretch flex-wrap">
          {/* Matched skills - green border */}
          {matchedSkills.map((skill, index) => (
            <div 
              key={`matched-${index}`}
              className="flex py-2 px-2 justify-center items-center gap-2.5 rounded-lg border border-[#45CE99] bg-card"
            >
              <div className="text-black text-center font-medium text-xs leading-normal tracking-[-0.6px]">
                {skill}
              </div>
            </div>
          ))}
          
          {/* Unmatched skills - gray background */}
          {unmatchedSkills.map((skill, index) => (
            <div 
              key={`unmatched-${index}`}
              className="flex py-2 px-2 justify-center items-center gap-2.5 rounded-lg bg-[#D5DAE7]"
            >
              <div className="text-muted-foreground text-center font-medium text-xs leading-normal tracking-[-0.6px]">
                {skill}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
