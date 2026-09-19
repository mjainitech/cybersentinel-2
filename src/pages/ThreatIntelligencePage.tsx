import { useCallback, useEffect, useState } from "react";
import { Radar, RotateCcw, ShieldAlert, Bug, History, Bookmark, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { ExpandableSection } from "@/components/ExpandableSection";
import { ThreatCard } from "@/components/ThreatCard";
import { CVECard } from "@/components/CVECard";
import { ThreatFilter } from "@/components/ThreatFilter";
import { ThreatSearch } from "@/components/ThreatSearch";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  getOverview,
  listThreats,
  listRecentCves,
  searchCves,
  listBookmarks,
  listHistory,
  clearHistory,
} from "@/services/threatService";
import type {
  ThreatOverviewMetrics,
  ThreatEntry,
  CveRecord,
  ThreatCategory,
  ThreatSeverity,
  ThreatSortBy,
  ThreatBookmarkRecord,
  ThreatHistoryRecord,
} from "@/services/threatService";

type Status = "loading" | "done" | "error";

export function ThreatIntelligencePage() {
  const [status, setStatus] = useState<Status>("loading");
  const [overview, setOverview] = useState<ThreatOverviewMetrics | null>(null);
  const [threats, setThreats] = useState<ThreatEntry[]>([]);
  const [recentCves, setRecentCves] = useState<CveRecord[]>([]);
  const [cveError, setCveError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ThreatCategory | null>(null);
  const [severity, setSeverity] = useState<ThreatSeverity | null>(null);
  const [sortBy, setSortBy] = useState<ThreatSortBy>("newest");

  const [cveSearchQuery, setCveSearchQuery] = useState("");
  const [cveSearchResults, setCveSearchResults] = useState<CveRecord[] | null>(null);
  const [isCveSearching, setIsCveSearching] = useState(false);

  const { user } = useAuth();
  const { showToast } = useToast();

  const fetchAll = useCallback(async () => {
    setStatus("loading");
    try {
      const [overviewResult, threatsResult] = await Promise.all([getOverview(), listThreats()]);
      setOverview(overviewResult);
      setThreats(threatsResult);
      setStatus("done");
    } catch {
      setStatus("error");
    }

    try {
      setRecentCves(await listRecentCves());
      setCveError(null);
    } catch (error) {
      setCveError(error instanceof Error ? error.message : "Data temporarily unavailable.");
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (status === "loading") return;
    const timeout = setTimeout(() => {
      listThreats({
        search: search || undefined,
        category: category ?? undefined,
        severity: severity ?? undefined,
        sortBy,
      }).then(setThreats);
    }, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, severity, sortBy]);

  const handleCveSearch = async () => {
    if (!cveSearchQuery.trim()) return;
    setIsCveSearching(true);
    try {
      setCveSearchResults(await searchCves(cveSearchQuery.trim()));
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Search failed. Please try again.", "error");
    } finally {
      setIsCveSearching(false);
    }
  };

  if (status === "loading") {
    return (
      <DashboardLayout>
        <LoadingSpinner label="Loading threat intelligence..." className="mt-16 py-16" />
      </DashboardLayout>
    );
  }

  if (status === "error") {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-2xl py-10 text-center">
          <p className="text-sm text-ink">Threat intelligence data is temporarily unavailable.</p>
          <Button variant="outline" size="sm" className="mt-4" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={fetchAll}>
            Try again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cta-gradient/10 ring-1 ring-inset ring-accent-primary/20">
            <Radar className="h-5 w-5 text-accent-secondary" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Threat Intelligence</h1>
            <p className="text-sm text-ink-muted">Understand today's cybersecurity threats and learn how to protect yourself.</p>
          </div>
        </div>

        {overview && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <OverviewMetric label="Threats Tracked" value={overview.threatsTracked} />
            <OverviewMetric label="Recent Advisories" value={overview.recentAdvisories} />
            <OverviewMetric
              label="Critical Vulnerabilities"
              value={overview.vulnerabilityDataUnavailable ? null : overview.criticalVulnerabilities}
            />
            <OverviewMetric label="Recent Phishing Trends" value={overview.recentPhishingTrends} />
          </div>
        )}
        {overview?.lastUpdated && (
          <p className="mt-2 text-right text-[11px] text-ink-faint">Updated: {new Date(overview.lastUpdated).toLocaleString()}</p>
        )}

        <div className="mt-8">
          <ThreatSearch value={search} onChange={setSearch} />
        </div>
        <div className="mt-4">
          <ThreatFilter
            category={category}
            onCategoryChange={setCategory}
            severity={severity}
            onSeverityChange={setSeverity}
            sortBy={sortBy}
            onSortByChange={setSortBy}
          />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {threats.length === 0 ? (
            <EmptyState icon={ShieldAlert} title="No threats found" description="Try a different search term or filter." />
          ) : (
            threats.map((threat) => <ThreatCard key={threat.id} threat={threat} />)
          )}
        </div>

        <div className="mt-10">
          <ExpandableSection title="Recent Vulnerabilities" icon={Bug}>
            {cveError ? (
              <p className="text-sm text-ink-faint">Data temporarily unavailable.</p>
            ) : recentCves.length === 0 ? (
              <p className="text-sm text-ink-muted">No recent vulnerabilities to show right now.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {recentCves.map((cve) => (
                  <CVECard key={cve.id} cve={cve} />
                ))}
              </div>
            )}
          </ExpandableSection>
        </div>

        <div className="mt-6">
          <ExpandableSection title="CVE Search" icon={Bug} defaultOpen={false}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <ThreatSearch value={cveSearchQuery} onChange={setCveSearchQuery} placeholder="e.g. CVE-2026-12345, Apache, log4j..." />
              </div>
              <Button onClick={handleCveSearch} isLoading={isCveSearching}>
                Search
              </Button>
            </div>
            {cveSearchResults && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {cveSearchResults.length === 0 ? (
                  <p className="text-sm text-ink-muted">No matching vulnerabilities found.</p>
                ) : (
                  cveSearchResults.map((cve) => <CVECard key={cve.id} cve={cve} />)
                )}
              </div>
            )}
          </ExpandableSection>
        </div>

        {user && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <BookmarksPanel />
            <HistoryPanel />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function OverviewMetric({ label, value }: { label: string; value: number | null }) {
  return (
    <Card className="p-4 text-center">
      <p className="font-display text-2xl font-semibold text-ink">{value ?? "—"}</p>
      <p className="mt-1 text-xs text-ink-faint">{value === null ? "Data temporarily unavailable" : label}</p>
    </Card>
  );
}

function BookmarksPanel() {
  const [bookmarks, setBookmarks] = useState<ThreatBookmarkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listBookmarks()
      .then(setBookmarks)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <ExpandableSection title="Bookmarked Threats" icon={Bookmark} defaultOpen={false}>
      {isLoading ? (
        <LoadingSpinner label="Loading bookmarks..." className="py-8" />
      ) : bookmarks.length === 0 ? (
        <EmptyState icon={Bookmark} title="No bookmarks yet" description="Bookmark a threat or CVE to save it here." />
      ) : (
        <ul className="flex flex-col gap-2">
          {bookmarks.map((b) => (
            <li key={b.id}>
              <Link to={`/threat-intelligence/${b.threatId}`} className="text-sm text-ink-muted hover:text-accent-primary">
                {b.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ExpandableSection>
  );
}

function HistoryPanel() {
  const [history, setHistory] = useState<ThreatHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    listHistory()
      .then(setHistory)
      .finally(() => setIsLoading(false));
  }, []);

  const handleClear = async () => {
    try {
      await clearHistory();
      setHistory([]);
      showToast("History cleared.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Something went wrong.", "error");
    }
  };

  return (
    <ExpandableSection
      title="Recently Viewed"
      icon={History}
      defaultOpen={false}
      badge={
        history.length > 0 ? (
          <button onClick={handleClear} className="ml-2 flex items-center gap-1 text-[11px] text-ink-faint hover:text-accent-danger">
            <Trash2 className="h-3 w-3" />
            Clear
          </button>
        ) : undefined
      }
    >
      {isLoading ? (
        <LoadingSpinner label="Loading history..." className="py-8" />
      ) : history.length === 0 ? (
        <EmptyState icon={History} title="No history yet" description="Threats you view will show up here." />
      ) : (
        <ul className="flex flex-col gap-2">
          {history.map((h) => (
            <li key={h.id}>
              <Link to={`/threat-intelligence/${h.threatId}`} className="text-sm text-ink-muted hover:text-accent-primary">
                {h.title}
              </Link>
              <span className="ml-2 text-[11px] text-ink-faint">{new Date(h.viewedAt).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      )}
    </ExpandableSection>
  );
}
