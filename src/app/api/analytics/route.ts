import { NextRequest, NextResponse } from "next/server";
import {
  getAnalyticsSummary,
  getAnalyticsSales,
  getAnalyticsSalesTeam,
  getAnalyticsClients,
  getAnalyticsProjects,
  getAnalyticsTeam,
  getAnalyticsFinance,
  getAnalyticsTimeSeries,
  getAnalyticsFunnel,
  getAnalyticsTopSalespeople,
} from "@/services/analytics";
import type { DateRangePreset, AnalyticsQuery } from "@/types/analytics";

function parseDateRange(searchParams: URLSearchParams): AnalyticsQuery {
  const preset = (searchParams.get("preset") || "month") as DateRangePreset;
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;

  return {
    dateRange: {
      preset,
      from: from || null,
      to: to || null,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "summary";
    const query = parseDateRange(searchParams);

    switch (type) {
      case "summary": {
        const data = await getAnalyticsSummary(query);
        return NextResponse.json(data);
      }
      case "sales": {
        const data = await getAnalyticsSales(query);
        return NextResponse.json(data);
      }
      case "sales-team": {
        const data = await getAnalyticsSalesTeam(query);
        return NextResponse.json(data);
      }
      case "clients": {
        const data = await getAnalyticsClients(query);
        return NextResponse.json(data);
      }
      case "projects": {
        const data = await getAnalyticsProjects(query);
        return NextResponse.json(data);
      }
      case "team": {
        const data = await getAnalyticsTeam(query);
        return NextResponse.json(data);
      }
      case "finance": {
        const data = await getAnalyticsFinance(query);
        return NextResponse.json(data);
      }
      case "time-series": {
        const data = await getAnalyticsTimeSeries(query);
        return NextResponse.json(data);
      }
      case "funnel": {
        const data = await getAnalyticsFunnel(query);
        return NextResponse.json(data);
      }
      case "top-salespeople": {
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 10;
        const data = await getAnalyticsTopSalespeople(query, limit);
        return NextResponse.json(data);
      }
      default:
        return NextResponse.json({ error: "Invalid analytics type" }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";

    if (message.includes("Unauthorized") || message.includes("Not authenticated")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    console.error("Analytics API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
