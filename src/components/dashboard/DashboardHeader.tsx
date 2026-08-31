import React from 'react';

const DashboardHeader = () => {
  const handleNewJobListing = () => {
    // Handle new job listing creation
    console.log('Creating new job listing...');
  };

  return (
    <header className="flex w-full items-stretch gap-5 flex-wrap justify-between max-md:max-w-full">
      <h1 className="text-foreground text-2xl font-[590] my-auto">
        Dashboard
      </h1>
      <button
        onClick={handleNewJobListing}
        className="justify-center items-center flex min-h-[42px] gap-3 text-base text-white font-bold text-center bg-[#14181B] pl-2.5 pr-4 py-0 rounded-lg hover:bg-[#1a1f23] transition-colors"
      >
        <img
          src="https://api.builder.io/api/v1/image/assets/160bd503595d4b3e818fa7f42e1b117f/b7a98075220a9d99b6e39d82323509e45668de4a?placeholderIfAbsent=true"
          className="aspect-[1] object-contain w-6 self-stretch shrink-0 my-auto"
          alt="Add icon"
        />
        <span className="text-white self-stretch my-auto">
          New Job Listing
        </span>
      </button>
    </header>
  );
};

export default DashboardHeader;
