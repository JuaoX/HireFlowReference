import { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layouts/AppSidebar';
import { User } from '@supabase/supabase-js';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { DynamicBreadcrumb } from '@/components/layouts/DynamicBreadcrumb';

const AppLayout = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate('/auth/login');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) {
        navigate('/auth/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-x-hidden">
          <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="flex h-14 items-center justify-between px-6">
              <SidebarTrigger />
              <NotificationCenter />
            </div>
          </header>
          <main className="flex-1">
            <div className="p-6 max-w-[1600px] mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
