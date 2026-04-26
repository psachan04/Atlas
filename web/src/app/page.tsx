import { fetchDashboardData } from "./actions";
import { Header } from "@/components/layout/header";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ReadinessGrid } from "@/components/dashboard/readiness-grid";
import { SparklineChart } from "@/components/dashboard/sparkline-chart";
import { AlertTerminal } from "@/components/dashboard/alert-terminal";
import { StrategistChat } from "@/components/chat/strategist-chat";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Dashboard() {
  const data = await fetchDashboardData();

  // Determine primary KPI variant based on readiness percentage
  const readyVariant: "emerald" | "amber" | "danger" =
    data.stats.ready_pct > 60
      ? "emerald"
      : data.stats.ready_pct > 30
        ? "amber"
        : "danger";

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] relative z-10">
      {/* Header */}
      <Header fetchedAt={data.fetchedAt} />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Dashboard Grid (70%) */}
        <main className="flex-1 overflow-y-auto p-5">
          <div className="max-w-[1200px] mx-auto space-y-4">
            {/* Row 1: KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KPICard
                label="Ready to Hike"
                value={data.stats.ready_pct}
                suffix="%"
                iconName="mountain"
                variant={readyVariant}
                subtitle={`${data.stats.ready_count} of ${data.stats.total_parks} parks clear`}
                delay={0}
              />
              <KPICard
                label="Parks Monitored"
                value={data.stats.total_parks}
                iconName="shield"
                variant="emerald"
                subtitle={`Avg temp: ${data.stats.avg_temperature}°F`}
                delay={100}
              />
              <KPICard
                label="Active Alerts"
                value={data.stats.total_alerts}
                iconName="alert-triangle"
                variant={
                  data.stats.total_alerts > 10
                    ? "danger"
                    : data.stats.total_alerts > 3
                      ? "amber"
                      : "emerald"
                }
                subtitle={`${data.stats.danger_count} parks in danger zone`}
                delay={200}
              />
            </div>

            {/* Row 2: Sparkline + Readiness Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <SparklineChart data={data.weatherTrend} />
              </div>
              <div className="lg:col-span-3">
                <ReadinessGrid data={data.readiness} />
              </div>
            </div>

            {/* Row 3: Alert Terminal */}
            <AlertTerminal alerts={data.alerts} />
          </div>
        </main>

        {/* Right: Strategist AI Chat (30%) */}
        <aside className="w-[380px] border-l border-[rgba(255,255,255,0.06)] flex-shrink-0 hidden lg:flex">
          <div className="w-full">
            <StrategistChat />
          </div>
        </aside>
      </div>
    </div>
  );
}
