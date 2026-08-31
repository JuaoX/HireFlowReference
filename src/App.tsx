import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import CareersHome from "./pages/careers/CareersHome";
import CareersJobDetail from "./pages/careers/CareersJobDetail";
import CareersApplicationForm from "./pages/careers/CareersApplicationForm";
import TemplatesList from "./pages/templates/TemplatesList";
import TemplateForm from "./pages/templates/TemplateForm";
import AppLayout from "./components/layouts/AppLayout";
import { ProtectedRoute } from "./components/layouts/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import JobsList from "./pages/jobs/JobsList";
import JobForm from "./pages/jobs/JobForm";
import JobDetail from "./pages/jobs/JobDetail";
import CandidatesList from "./pages/candidates/CandidatesList";
import CandidateForm from "./pages/candidates/CandidateForm";
import CandidateDetail from "./pages/candidates/CandidateDetail";
import ApplicationsList from "./pages/applications/ApplicationsList";
import ApplicationForm from "./pages/applications/ApplicationForm";
import ApplicationDetail from "./pages/applications/ApplicationDetail";
import InterviewsList from "./pages/interviews/InterviewsList";
import InterviewForm from "./pages/interviews/InterviewForm";
import InterviewDetail from "./pages/interviews/InterviewDetail";
import ScorecardForm from "./pages/interviews/ScorecardForm";
import OffersList from "./pages/offers/OffersList";
import OfferForm from "./pages/offers/OfferForm";
import OfferDetail from "./pages/offers/OfferDetail";
import Settings from "./pages/Settings";
import TeamMembers from "./pages/TeamMembers";
import TasksPage from "./pages/tasks/TasksPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Public Careers Site Routes */}
          <Route path="/careers" element={<CareersHome />} />
          <Route path="/careers/jobs/:id" element={<CareersJobDetail />} />
          <Route path="/careers/jobs/:id/apply" element={<CareersApplicationForm />} />
          
          {/* Auth Routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          
          {/* Protected App Routes */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/team-members" element={<TeamMembers />} />
            <Route path="/jobs" element={<JobsList />} />
            <Route path="/jobs/new" element={<JobForm />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/jobs/:id/edit" element={<JobForm />} />
            <Route path="/candidates" element={<CandidatesList />} />
            <Route path="/candidates/new" element={<CandidateForm />} />
            <Route path="/candidates/:id" element={<CandidateDetail />} />
            <Route path="/candidates/:id/edit" element={<CandidateForm />} />
            <Route path="/applications" element={<ApplicationsList />} />
            <Route path="/applications/new" element={<ApplicationForm />} />
            <Route path="/applications/:id" element={<ApplicationDetail />} />
            <Route path="/interviews" element={<InterviewsList />} />
            <Route path="/interviews/new" element={<InterviewForm />} />
            <Route path="/interviews/:id" element={<InterviewDetail />} />
            <Route path="/interviews/:id/scorecard" element={<ScorecardForm />} />
            <Route path="/offers" element={<ProtectedRoute requireOfferAccess><OffersList /></ProtectedRoute>} />
            <Route path="/offers/new" element={<ProtectedRoute requireOfferAccess><OfferForm /></ProtectedRoute>} />
            <Route path="/offers/:id" element={<ProtectedRoute requireOfferAccess><OfferDetail /></ProtectedRoute>} />
            <Route path="/templates" element={<TemplatesList />} />
            <Route path="/templates/new" element={<TemplateForm />} />
            <Route path="/templates/:id/edit" element={<TemplateForm />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
