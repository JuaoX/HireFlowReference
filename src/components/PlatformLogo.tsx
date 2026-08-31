const PlatformLogo = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <div className="w-6 h-6 rounded-full bg-foreground flex-shrink-0" />
    <span className="text-2xl text-foreground" style={{ fontWeight: 590 }}>
      HiringPlatform
    </span>
  </div>
);

export default PlatformLogo;
