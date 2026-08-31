import React from 'react';

interface JobListingProps {
  title: string;
  location: string;
  dateOpened: string;
  candidates: string;
  isLast?: boolean;
}

const JobListingRow: React.FC<JobListingProps> = ({ 
  title, 
  location, 
  dateOpened, 
  candidates, 
  isLast = false 
}) => {
  return (
    <div className={`items-center ${isLast ? 'flex' : 'relative flex'} w-full gap-8 bg-muted mt-2 ${isLast ? 'pl-4 pr-[11px]' : 'p-4'} py-4 rounded-lg max-md:max-w-full`}>
      <div className={`text-foreground font-[590] self-stretch ${isLast ? '' : 'z-0'} w-[243px] my-auto`}>
        {title}
      </div>
      <div className={`text-muted-foreground self-stretch ${isLast ? '' : 'z-0'} flex-1 shrink basis-[0%] my-auto`}>
        {location}
      </div>
      <div className={`text-muted-foreground self-stretch ${isLast ? '' : 'z-0'} flex-1 shrink basis-[0%] my-auto`}>
        {dateOpened}
      </div>
      {isLast ? (
        <img
          src="https://api.builder.io/api/v1/image/assets/160bd503595d4b3e818fa7f42e1b117f/f8ed310dc841874058ec63100f1df340fef40ea0?placeholderIfAbsent=true"
          className="aspect-[25.64] object-contain w-[103px] text-primary font-bold self-stretch shrink flex-1 basis-[0%] my-auto"
          alt="Pagination"
        />
      ) : (
        <>
          <div className="text-primary font-bold self-stretch z-0 flex-1 shrink basis-[0%] my-auto">
            {candidates}
          </div>
          <img
            src="https://api.builder.io/api/v1/image/assets/160bd503595d4b3e818fa7f42e1b117f/e6eb34be971f13c6ffa94328c5e566f7cee4dd59?placeholderIfAbsent=true"
            className="aspect-[1/1] object-contain w-4 absolute z-0 shrink-0 translate-x-[0%] -translate-y-2/4 h-4 right-[11px] top-2/4"
            alt="More options"
          />
        </>
      )}
    </div>
  );
};

const JobListingsTable = () => {
  const jobListings = [
    { title: "Front-End Developer", location: "Remote", dateOpened: "10/01/2025", candidates: "13" },
    { title: "Front-End Developer", location: "Remote", dateOpened: "10/01/2025", candidates: "13" },
    { title: "Front-End Developer", location: "Remote", dateOpened: "10/01/2025", candidates: "13" },
    { title: "Front-End Developer", location: "Remote", dateOpened: "10/01/2025", candidates: "13" },
    { title: "Front-End Developer", location: "Remote", dateOpened: "10/01/2025", candidates: "13" },
    { title: "Front-End Developer", location: "Remote", dateOpened: "10/01/2025", candidates: "13" },
    { title: "Front-End Developer", location: "Remote", dateOpened: "10/01/2025", candidates: "13" },
    { title: "Front-End Developer", location: "Remote", dateOpened: "10/01/2025", candidates: "13" }
  ];

  return (
    <section className="min-w-60 overflow-hidden text-sm flex-1 shrink basis-[0%] bg-card pb-[17px] rounded-xl max-md:max-w-full">
      <div className="flex min-h-[50px] items-center gap-2.5 text-foreground font-[590] px-4 py-[17px]">
        <h2 className="text-foreground self-stretch my-auto">
          Job Listings
        </h2>
      </div>
      <div className="h-[481px] text-muted-foreground font-normal mx-4 rounded-lg max-md:max-w-full max-md:mr-2.5">
        <div className="flex w-full items-center gap-8 text-xs flex-wrap px-4 max-md:max-w-full">
          <div className="text-muted-foreground self-stretch w-[243px] my-auto">
            Title
          </div>
          <div className="text-muted-foreground self-stretch flex-1 shrink basis-[0%] my-auto">
            Location
          </div>
          <div className="text-muted-foreground self-stretch flex-1 shrink basis-[0%] my-auto">
            Date Opened
          </div>
          <div className="text-muted-foreground self-stretch flex-1 shrink basis-[0%] my-auto">
            # of Candidates
          </div>
        </div>
        
        {jobListings.map((job, index) => (
          <JobListingRow
            key={index}
            title={job.title}
            location={job.location}
            dateOpened={job.dateOpened}
            candidates={job.candidates}
          />
        ))}
        
        <JobListingRow
          title="Front-End Developer"
          location="Remote"
          dateOpened="10/01/2025"
          candidates=""
          isLast={true}
        />
      </div>
    </section>
  );
};

export default JobListingsTable;
