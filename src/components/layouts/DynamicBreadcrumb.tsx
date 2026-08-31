import { useLocation, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const routeNames: Record<string, string> = {
  dashboard: 'Dashboard',
  jobs: 'Jobs',
  candidates: 'Candidates',
  applications: 'Applications',
  interviews: 'Interviews',
  offers: 'Offers',
  settings: 'Settings',
  templates: 'Templates',
  new: 'New',
  edit: 'Edit',
};

const isUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export const DynamicBreadcrumb = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const [entityNames, setEntityNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchEntityNames = async () => {
      const names: Record<string, string> = {};
      
      for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        
        if (isUUID(segment)) {
          const prevSegment = i > 0 ? pathSegments[i - 1] : '';
          
          try {
            if (prevSegment === 'jobs') {
              const { data } = await supabase
                .from('jobs')
                .select('title')
                .eq('id', segment)
                .single();
              if (data) names[segment] = data.title;
            } else if (prevSegment === 'candidates') {
              const { data } = await supabase
                .from('candidates')
                .select('full_name')
                .eq('id', segment)
                .single();
              if (data) names[segment] = data.full_name;
            } else if (prevSegment === 'applications') {
              const { data } = await supabase
                .from('applications')
                .select('candidate_id, candidates(full_name)')
                .eq('id', segment)
                .single();
              if (data && data.candidates) names[segment] = (data.candidates as any).full_name;
            } else if (prevSegment === 'interviews') {
              const { data } = await supabase
                .from('interviews')
                .select('title')
                .eq('id', segment)
                .single();
              if (data) names[segment] = data.title;
            } else if (prevSegment === 'offers') {
              const { data } = await supabase
                .from('offers')
                .select('application_id, applications(candidate_id, candidates(full_name))')
                .eq('id', segment)
                .single();
              if (data && data.applications) {
                const app = data.applications as any;
                if (app.candidates) names[segment] = `Offer - ${app.candidates.full_name}`;
              }
            }
          } catch (error) {
            console.error('Error fetching entity name:', error);
          }
        }
      }
      
      setEntityNames(names);
    };
    
    fetchEntityNames();
  }, [location.pathname]);

  if (pathSegments.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard">
              <Home className="h-4 w-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {pathSegments.map((segment, index) => {
          const isLast = index === pathSegments.length - 1;
          const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
          const name = entityNames[segment] || routeNames[segment] || segment;

          return (
            <div key={path} className="flex items-center gap-1.5">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={path}>{name}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
