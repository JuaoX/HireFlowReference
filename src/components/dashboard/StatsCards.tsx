import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import listIcon from '@/assets/icons/list-icon.svg';
import usersIcon from '@/assets/icons/users-icon.svg';
import messageIcon from '@/assets/icons/message-icon.svg';
import checkVerifiedIcon from '@/assets/icons/check-verified-icon.svg';

interface StatCardProps {
  icon: string;
  title: string;
  value: string | number;
  gradient: string;
  iconColor: string;
  hoverBorder: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, gradient, iconColor, hoverBorder, onClick }) => {
  return (
    <div 
      className={`flex-1 min-w-[240px] h-[108px] px-4 py-[13px] rounded-xl cursor-pointer transition-all border-2 border-transparent hover:scale-[1.02] ${hoverBorder} ${gradient}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-3">
        <img src={icon} alt="" className="w-4 h-4 flex-shrink-0" />
        <div className="flex-1 text-foreground text-sm font-[590] leading-normal">
          {title}
        </div>
        <div className="flex items-center justify-center w-[26px] h-[26px] rounded-full border border-white/40 bg-card/30">
          <ChevronRight className="w-3.5 h-3.5" style={{ color: iconColor }} />
        </div>
      </div>
      <div className="text-black text-4xl font-bold leading-normal">
        {value}
      </div>
    </div>
  );
};

const StatsCards = () => {
  const navigate = useNavigate();

  const stats = [
    {
      icon: listIcon,
      title: "Current Listings",
      value: "12",
      gradient: "bg-gradient-to-r from-[#F0F9D6] to-[#A2F1D3]",
      iconColor: "#5D6174",
      hoverBorder: "hover:border-[#2E7D32]",
      onClick: () => navigate('/jobs')
    },
    {
      icon: usersIcon,
      title: "Total Applicants",
      value: "43",
      gradient: "bg-gradient-to-r from-[#FFE4CC] to-[#FFDB99]",
      iconColor: "#6B7280",
      hoverBorder: "hover:border-[#F57C00]",
      onClick: () => navigate('/candidates')
    },
    {
      icon: messageIcon,
      title: "Interviewing",
      value: "32",
      gradient: "bg-gradient-to-r from-[#D4F1F4] via-[#B8E3F5] to-[#A5C9FF]",
      iconColor: "#5D6174",
      hoverBorder: "hover:border-[#1976D2]",
      onClick: () => navigate('/interviews')
    },
    {
      icon: checkVerifiedIcon,
      title: "Shortlisted",
      value: "8",
      gradient: "bg-gradient-to-r from-[#F3D4F5] to-[#FFB8C8]",
      iconColor: "#7C5D82",
      hoverBorder: "hover:border-[#C2185B]",
      onClick: () => navigate('/candidates')
    }
  ];

  return (
    <section className="flex w-full items-stretch gap-5 flex-wrap">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          icon={stat.icon}
          title={stat.title}
          value={stat.value}
          gradient={stat.gradient}
          iconColor={stat.iconColor}
          hoverBorder={stat.hoverBorder}
          onClick={stat.onClick}
        />
      ))}
    </section>
  );
};

export default StatsCards;
