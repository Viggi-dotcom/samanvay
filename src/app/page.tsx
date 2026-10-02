"use client";

import { useApp } from "@/lib/store";
import { LoginScreen } from "@/components/login-screen";
import { AppShell } from "@/components/app-shell";
import { OverviewView } from "@/components/views/overview";
import { ConvergenceMatrixView } from "@/components/views/convergence-matrix";
import { ConvergenceCompareView } from "@/components/views/convergence-compare";
import {
  GeoNationalView,
  GeoStateView,
  GeoDistrictView,
} from "@/components/views/geo";
import { SchemesDirectoryView } from "@/components/views/schemes-directory";
import { SchemeDetailView } from "@/components/views/scheme-detail";
import { IntelligenceQueryView } from "@/components/views/intelligence-query";
import { IntelligenceAlertsView } from "@/components/views/intelligence-alerts";
import {
  AdminPipelinesView,
  AdminUsersView,
} from "@/components/views/admin";

export default function Page() {
  const isAuthenticated = useApp((s) => s.isAuthenticated);
  const view = useApp((s) => s.view);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <AppShell>
      {view === "overview" && <OverviewView />}
      {view === "convergence-matrix" && <ConvergenceMatrixView />}
      {view === "convergence-compare" && <ConvergenceCompareView />}
      {view === "geo-national" && <GeoNationalView />}
      {view === "geo-state" && <GeoStateView />}
      {view === "geo-district" && <GeoDistrictView />}
      {view === "schemes-directory" && <SchemesDirectoryView />}
      {view === "scheme-detail" && <SchemeDetailView />}
      {view === "intelligence-query" && <IntelligenceQueryView />}
      {view === "intelligence-alerts" && <IntelligenceAlertsView />}
      {view === "admin-pipelines" && <AdminPipelinesView />}
      {view === "admin-users" && <AdminUsersView />}
    </AppShell>
  );
}
