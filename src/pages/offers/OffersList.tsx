import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Loader2, DollarSign, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, isPast } from 'date-fns';
import { ExpirationBadge } from '@/components/offers/ExpirationWarning';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface Offer {
  id: string;
  base_amount: number;
  variable_amount?: number;
  currency: string;
  state: string;
  created_at: string;
  expires_at?: string;
  application: {
    id: string;
    candidate: {
      full_name: string;
      email: string;
    };
    job: {
      title: string;
      department: string;
    };
  };
}

const OffersList = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, canViewOffer, loading: permissionsLoading } = useUserPermissions();

  useEffect(() => {
    // Only fetch offers once permissions are loaded
    if (!permissionsLoading) {
      fetchOffers();
      checkExpiredOffers();
    }
  }, [permissionsLoading, role]);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          id,
          base_amount,
          variable_amount,
          currency,
          state,
          created_at,
          expires_at,
          application:applications(
            id,
            job_id,
            candidate:candidates(full_name, email),
            job:jobs(title, department)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter offers based on permissions for non-site-admins
      let filteredOffers = data || [];
      if (role !== 'site_admin') {
        filteredOffers = (data || []).filter((offer: any) => {
          const jobId = offer.application?.job_id;
          return jobId && canViewOffer(jobId);
        });
      }
      
      setOffers(filteredOffers);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkExpiredOffers = async () => {
    try {
      // Find offers that are sent but have expired
      const { data: expiredOffers, error } = await supabase
        .from('offers')
        .select('id, expires_at, state')
        .eq('state', 'sent')
        .not('expires_at', 'is', null);

      if (error) throw error;

      // Update expired offers
      const now = new Date();
      const offersToExpire = expiredOffers?.filter(
        offer => offer.expires_at && isPast(new Date(offer.expires_at))
      ) || [];

      if (offersToExpire.length > 0) {
        const { error: updateError } = await supabase
          .from('offers')
          .update({ state: 'expired' })
          .in('id', offersToExpire.map(o => o.id));

        if (updateError) throw updateError;
        
        // Refresh the list
        fetchOffers();
      }
    } catch (error: any) {
      console.error('Error checking expired offers:', error);
    }
  };

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'pending_approval':
        return <Badge variant="secondary">Pending Approval</Badge>;
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'sent':
        return <Badge>Sent</Badge>;
      case 'accepted':
        return <Badge variant="default">Accepted</Badge>;
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{state}</Badge>;
    }
  };

  const formatCompensation = (offer: Offer) => {
    const total = offer.base_amount + (offer.variable_amount || 0);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: offer.currency,
      minimumFractionDigits: 0,
    }).format(total);
  };

  if (loading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Offers</h1>
        </div>
        <Button onClick={() => navigate('/offers/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Offer
        </Button>
      </div>

      {offers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No offers created yet</p>
            <Button onClick={() => navigate('/offers/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Offer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Table className="border-separate border-spacing-y-2">
          <TableHeader>
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableHead>Candidate</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Total Compensation</TableHead>
              <TableHead>Base Salary</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((offer) => (
              <TableRow
                key={offer.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-b-0"
                style={{ backgroundColor: 'var(--color-card)', borderRadius: '8px' }}
                onClick={() => navigate(`/offers/${offer.id}`)}
              >
                <TableCell className="font-medium rounded-l-lg">
                  {offer.application?.candidate?.full_name || 'N/A'}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{offer.application?.job?.title || 'N/A'}</p>
                    {offer.application?.job?.department && (
                      <p className="text-sm text-muted-foreground">{offer.application.job.department}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-lg">{formatCompensation(offer)}</span>
                </TableCell>
                <TableCell>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: offer.currency,
                    minimumFractionDigits: 0,
                  }).format(offer.base_amount)}
                </TableCell>
                <TableCell>{format(new Date(offer.created_at), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  {offer.expires_at ? format(new Date(offer.expires_at), 'MMM d, yyyy') : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {getStateBadge(offer.state)}
                    <ExpirationBadge expiresAt={offer.expires_at} state={offer.state} />
                  </div>
                </TableCell>
                <TableCell className="rounded-r-lg">
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default OffersList;
