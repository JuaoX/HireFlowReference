import React from 'react';

const Sidebar = () => {
  return (
    <aside className="min-h-[984px] w-full overflow-hidden bg-card mx-auto px-4 py-[30px] rounded-xl max-md:mt-10">
      <div className="flex min-h-[39px] w-full flex-col text-2xl text-foreground font-[590] whitespace-nowrap leading-[1.3]">
        <div className="flex items-center gap-[13px] overflow-hidden">
          <div className="bg-[#14181B] self-stretch flex w-6 shrink-0 h-6 fill-[#14181B] my-auto rounded-[50%]" />
          <div className="text-foreground self-stretch my-auto">
            HiringPlatform
          </div>
        </div>
      </div>
      
      <nav className="w-full overflow-hidden text-sm text-foreground font-[510] whitespace-nowrap flex-1 mt-2.5 py-2.5">
        <div className="bg-[rgba(240,242,247,1)] flex min-h-11 w-full items-center gap-2 font-[590] leading-[1.3] px-3.5 py-2.5 rounded-md">
          <img
            src="https://api.builder.io/api/v1/image/assets/160bd503595d4b3e818fa7f42e1b117f/ba6c0a647ad941622b6ace8b542b255e5a81718c?placeholderIfAbsent=true"
            className="aspect-[1] object-contain w-5 self-stretch shrink-0 my-auto"
            alt="Dashboard icon"
          />
          <div className="self-stretch flex min-h-6 items-center flex-1 shrink basis-[0%] my-auto">
            <div className="text-foreground self-stretch my-auto">
              Dashboard
            </div>
          </div>
        </div>
        
        <div className="flex w-full items-center gap-2 mt-3 px-3.5 py-2.5 rounded-lg hover:bg-[rgba(240,242,247,1)] cursor-pointer transition-colors">
          <img
            src="https://api.builder.io/api/v1/image/assets/160bd503595d4b3e818fa7f42e1b117f/5522fbd60c6a5d5434f1cd788b2001268f61d1a6?placeholderIfAbsent=true"
            className="aspect-[1] object-contain w-5 self-stretch shrink-0 my-auto"
            alt="Jobs icon"
          />
          <div className="self-stretch flex min-h-6 items-center flex-1 shrink basis-[0%] my-auto">
            <div className="text-foreground self-stretch my-auto">
              Jobs
            </div>
          </div>
        </div>
        
        <div className="flex w-full items-center gap-2 mt-3 px-3.5 py-2.5 rounded-lg hover:bg-[rgba(240,242,247,1)] cursor-pointer transition-colors">
          <img
            src="https://api.builder.io/api/v1/image/assets/160bd503595d4b3e818fa7f42e1b117f/739e9e45ab93083620f8d6be3e9dfd483808218d?placeholderIfAbsent=true"
            className="aspect-[1] object-contain w-5 self-stretch shrink-0 my-auto"
            alt="Candidates icon"
          />
          <div className="self-stretch flex min-h-6 items-center flex-1 shrink basis-[0%] my-auto">
            <div className="text-foreground self-stretch my-auto">
              Candidates
            </div>
          </div>
        </div>
        
        <div className="flex w-full items-center gap-2 mt-3 px-3.5 py-2.5 rounded-lg hover:bg-[rgba(240,242,247,1)] cursor-pointer transition-colors">
          <img
            src="https://api.builder.io/api/v1/image/assets/160bd503595d4b3e818fa7f42e1b117f/c5db23af8b32be7492c41b51dd7de017889a4120?placeholderIfAbsent=true"
            className="aspect-[1] object-contain w-5 self-stretch shrink-0 my-auto"
            alt="Settings icon"
          />
          <div className="self-stretch flex min-h-6 items-center flex-1 shrink basis-[0%] my-auto">
            <div className="text-foreground self-stretch my-auto">
              Settings
            </div>
          </div>
        </div>
      </nav>
      
      <div className="items-center flex w-full gap-3 overflow-hidden mt-2.5 p-0">
        <div className="self-stretch flex min-w-60 w-full items-center gap-2.5 overflow-hidden justify-center flex-1 shrink basis-[0%] my-auto p-0.5 rounded-[999px]">
          <div className="border self-stretch flex items-stretch gap-2.5 overflow-hidden justify-center w-[31px] my-auto rounded-[999px] border-[rgba(69,206,153,1)] border-solid">
            <img
              src="https://api.builder.io/api/v1/image/assets/160bd503595d4b3e818fa7f42e1b117f/dcec37f4925d88e8acef0d71d78e91ab99101f27?placeholderIfAbsent=true"
              className="aspect-[1] object-contain w-[31px] flex-1 shrink basis-[0%] rounded-[999px]"
              alt="User avatar"
            />
          </div>
          <div className="self-stretch flex min-w-60 flex-col overflow-hidden items-stretch justify-center flex-1 shrink basis-[0%] my-auto">
            <div className="aspect-[247.00/22.23] text-foreground text-sm font-[590] leading-[1.3]">
              Anthony Reneé
            </div>
            <div className="aspect-[247.00/22.23] text-muted-foreground text-xs font-[510]">
              anthony.reneé@yahoo.com
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
