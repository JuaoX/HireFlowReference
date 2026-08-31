import React from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsCards from '@/components/dashboard/StatsCards';
import TasksPanel from '@/components/dashboard/TasksPanel';
import JobListingsTable from '@/components/dashboard/JobListingsTable';
import NextMeetingCard from '@/components/dashboard/NextMeetingCard';
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed';

const Index = () => {
  return (
    <div className="bg-[rgba(240,242,247,1)] overflow-x-hidden p-5 min-h-screen">
      <div className="gap-5 flex max-md:flex-col max-md:items-stretch max-w-full">
        <div className="w-[23%] max-md:w-full max-md:ml-0">
          <Sidebar />
        </div>
        
        <main className="w-[77%] ml-5 max-md:w-full max-md:ml-0">
          <div className="w-full mt-[18px] max-md:max-w-full max-md:mt-10">
            <DashboardHeader />
            
            <div className="min-h-[898px] w-full mt-[26px] max-md:max-w-full">
              <StatsCards />
              
              <div className="flex w-full items-stretch gap-5 flex-1 flex-wrap h-full mt-5 max-md:max-w-full">
                <TasksPanel />
                <JobListingsTable />
              </div>
              
              <div className="flex min-h-[202px] w-full items-stretch gap-5 flex-wrap mt-5 max-md:max-w-full">
                <NextMeetingCard />
                <RecentActivityFeed />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
