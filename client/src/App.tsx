import { Switch, Route, Router } from "wouter";
import { VerseFooter } from "@/components/verse-footer";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/lib/theme";
import { PatientProvider } from "@/lib/patient-context";
import { useIsMobile } from "@/hooks/use-mobile";
import DemoBanner from "@/components/demo-banner";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Appointments from "@/pages/appointments";
import Medications from "@/pages/medications";
import Physicians from "@/pages/physicians";
import MedicalRecords from "@/pages/medical-records";
import Vitals from "@/pages/vitals";
import EmergencyContacts from "@/pages/emergency-contacts";
import Pharmacies from "@/pages/pharmacies";
import Notes from "@/pages/notes";
import Timeline from "@/pages/timeline";
import CareLog from "@/pages/care-log";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/appointments/:aptId" component={Appointments} />
      <Route path="/appointments" component={Appointments} />
      <Route path="/medications" component={Medications} />
      <Route path="/physicians" component={Physicians} />
      <Route path="/records/:recordId" component={MedicalRecords} />
      <Route path="/records" component={MedicalRecords} />
      <Route path="/vitals" component={Vitals} />
      <Route path="/emergency" component={EmergencyContacts} />
      <Route path="/pharmacies" component={Pharmacies} />
      <Route path="/notes" component={Notes} />
      <Route path="/timeline" component={Timeline} />
      <Route path="/care" component={CareLog} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar />
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <DemoBanner />
        {isMobile && (
          // Mirrors the app's mobile top band: 56px, 22px bold title, app icon.
          // Only <main> scrolls here, so the band stays put without position: fixed
          // (which would cover the demo banner above it).
          <header className="h-[56px] flex items-center gap-[12px] px-[16px] gradient-primary text-white border-b border-white/15 shrink-0 z-40">
            <SidebarTrigger
              data-testid="button-sidebar-toggle"
              className="h-[40px] w-[40px] text-white hover:bg-white/15 hover:text-white [&_svg]:!h-[26px] [&_svg]:!w-[26px] [&_svg]:stroke-[3]"
            />
            <span className="flex-1 pl-[4px] font-heading text-[22px] leading-none font-bold text-white">
              MedRecords
            </span>
            <img
              src={`${import.meta.env.BASE_URL}icon-192.png`}
              alt=""
              className="h-[40px] w-[40px] shrink-0 rounded-[8px] bg-white p-[1px] shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
            />
          </header>
        )}
        <main className="flex-1 overflow-auto flex flex-col">
          <div className="flex-1">
            <AppRouter />
          </div>
          <VerseFooter />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <PatientProvider>
          <TooltipProvider>
            <Router hook={useHashLocation}>
              <SidebarProvider style={style as React.CSSProperties}>
                <AppLayout />
              </SidebarProvider>
            </Router>
            <Toaster />
          </TooltipProvider>
        </PatientProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
