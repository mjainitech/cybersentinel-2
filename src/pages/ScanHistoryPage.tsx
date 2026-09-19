import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, History, ArrowUpDown, Calendar, Gauge, Star, GitCompareArrows } from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ScanHistoryItem } from "@/components/ScanHistoryItem";
import { ScanHistoryStatsBar } from "@/components/ScanHistoryStatsBar";
import { CompareScansModal } from "@/components/CompareScansModal";
import { SecurityReportSummary } from "@/components/SecurityReportSummary";
import { AiExplanationCard } from "@/components/AiExplanationCard";
import { RecommendationsList } from "@/components/RecommendationsList";
import { ScanResultCard } from "@/components/ScanResultCard";
import { useAuth } from "@/hooks/useAuth";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useToast } from "@/hooks/useToast";
import {
  listScanHistory,
  getScanHistoryRecord,
  deleteScanHistoryRecord,
  getScanHistoryStats,
  toggleScanFavorite,
} from "@/services/scanHistoryService";
import type { ScanHistorySummary, ScanHistoryStats } from "@/services/scanHistoryService";
import { toScanReport, groupChecksByCategory, CATEGORY_LABELS } from "@/services/scanService";
import type { ScanReport } from "@/services/scanService";

type SortBy = "date" | "score";
type SortDir = "asc" | "desc";
type BandFilter = "all" | "safe" | "warning" | "danger";

export function ScanHistoryPage() {
  const { user, isLoading: isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <DashboardLayout>
        <LoadingSpinner label="Loading..." className="py-24" />
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <EmptyState
          icon={History}
          title="Sign in to view your scan history"
          description="Every scan you run while signed in is saved here, so you can search, sort, and revisit past reports."
          action={
            <Link to="/login">
              <Button>Log in</Button>
            </Link>
          }
        />
      </DashboardLayout>
    );
  }

  return <ScanHistoryContent />;
}

function ScanHistoryContent() {
  const [scans, setScans] = useState<ScanHistorySummary[]>([]);
  const [stats, setStats] = useState<ScanHistoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [bandFilter, setBandFilter] = useState<BandFilter>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [openReport, setOpenReport] = useState<ScanReport | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const reportModal = useDisclosure();

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const deleteModal = useDisclosure();

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareReports, setCompareReports] = useState<[ScanReport, ScanReport] | null>(null);
  const [isCompareLoading, setIsCompareLoading] = useState(false);
  const compareModal = useDisclosure();

  const { showToast } = useToast();

  const fetchScans = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const [scanResults, statsResult] = await Promise.all([
        listScanHistory({
          search: search || undefined,
          sortBy,
          sortDir,
          band: bandFilter === "all" ? undefined : bandFilter,
          favoriteOnly: favoritesOnly || undefined,
        }),
        getScanHistoryStats(),
      ]);
      setScans(scanResults);
      setStats(statsResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Couldn't load your scan history.";
      setLoadError(message);
      showToast(message, "error");
    } finally {
      setIsLoading(false);
      setHasLoadedOnce(true);
    }
  }, [search, sortBy, sortDir, bandFilter, favoritesOnly, showToast]);

  // Debounce search so we're not firing a request on every keystroke.
  useEffect(() => {
    const timeout = setTimeout(fetchScans, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sortBy, sortDir, bandFilter, favoritesOnly]);

  const handleOpen = async (id: string) => {
    setIsReportLoading(true);
    reportModal.open();
    try {
      const record = await getScanHistoryRecord(id);
      setOpenReport(toScanReport(record.report));
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't load that report.", "error");
      reportModal.close();
    } finally {
      setIsReportLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteScanHistoryRecord(pendingDeleteId);
      setScans((prev) => prev.filter((scan) => scan.id !== pendingDeleteId));
      setCompareIds((prev) => prev.filter((id) => id !== pendingDeleteId));
      showToast("Scan deleted.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't delete that scan.", "error");
    } finally {
      setPendingDeleteId(null);
      deleteModal.close();
    }
  };

  const handleToggleFavorite = async (id: string) => {
    // Optimistic update — flip it immediately, revert if the request fails.
    setScans((prev) => prev.map((scan) => (scan.id === id ? { ...scan, favorite: !scan.favorite } : scan)));
    try {
      await toggleScanFavorite(id);
    } catch (error) {
      setScans((prev) => prev.map((scan) => (scan.id === id ? { ...scan, favorite: !scan.favorite } : scan)));
      showToast(error instanceof Error ? error.message : "Couldn't update that scan.", "error");
    }
  };

  const handleToggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((existing) => existing !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  const handleCompare = async () => {
    if (compareIds.length !== 2) return;
    setIsCompareLoading(true);
    compareModal.open();
    try {
      const [recordA, recordB] = await Promise.all([
        getScanHistoryRecord(compareIds[0]),
        getScanHistoryRecord(compareIds[1]),
      ]);
      setCompareReports([toScanReport(recordA.report), toScanReport(recordB.report)]);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't load those scans to compare.", "error");
      compareModal.close();
    } finally {
      setIsCompareLoading(false);
    }
  };

  const toggleSortDir = () => setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cta-gradient/10 ring-1 ring-inset ring-accent-primary/20">
            <History className="h-5 w-5 text-accent-secondary" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Scan History</h1>
            <p className="text-sm text-ink-muted">Every scan you've run while signed in, all in one place.</p>
          </div>
        </div>

        {stats && stats.total > 0 && (
          <div className="mt-6">
            <ScanHistoryStatsBar stats={stats} />
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <Input
                placeholder="Search by URL..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={sortBy === "date" ? "secondary" : "outline"}
                size="md"
                onClick={() => setSortBy("date")}
                leftIcon={<Calendar className="h-4 w-4" />}
              >
                Date
              </Button>
              <Button
                variant={sortBy === "score" ? "secondary" : "outline"}
                size="md"
                onClick={() => setSortBy("score")}
                leftIcon={<Gauge className="h-4 w-4" />}
              >
                Score
              </Button>
              <Button variant="outline" size="md" onClick={toggleSortDir} aria-label="Toggle sort direction">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-ink-faint">Filter:</span>
            {(["all", "safe", "warning", "danger"] as const).map((band) => (
              <button
                key={band}
                onClick={() => setBandFilter(band)}
                className={
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors " +
                  (bandFilter === band
                    ? "bg-accent-primary/15 text-accent-primary ring-1 ring-inset ring-accent-primary/30"
                    : "text-ink-muted hover:bg-base-elevated")
                }
              >
                {band === "all" ? "All" : band === "safe" ? "Safe" : band === "warning" ? "Use Caution" : "Dangerous"}
              </button>
            ))}

            <button
              onClick={() => setFavoritesOnly((prev) => !prev)}
              aria-pressed={favoritesOnly}
              className={
                "ml-1 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors " +
                (favoritesOnly
                  ? "bg-accent-warning/15 text-accent-warning ring-1 ring-inset ring-accent-warning/30"
                  : "text-ink-muted hover:bg-base-elevated")
              }
            >
              <Star className="h-3 w-3" fill={favoritesOnly ? "currentColor" : "none"} />
              Favorites
            </button>

            {compareIds.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                disabled={compareIds.length !== 2}
                onClick={handleCompare}
                leftIcon={<GitCompareArrows className="h-3.5 w-3.5" />}
              >
                Compare {compareIds.length}/2 selected
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6">
          {isLoading && !hasLoadedOnce ? (
            <LoadingSpinner label="Loading your scan history..." className="py-16" />
          ) : loadError && scans.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-accent-danger/25 bg-accent-danger/10 p-8 text-center">
              <p className="text-sm text-ink">{loadError}</p>
              <Button variant="outline" size="sm" onClick={fetchScans}>
                Try again
              </Button>
            </div>
          ) : scans.length === 0 ? (
            search || bandFilter !== "all" || favoritesOnly ? (
              <EmptyState
                icon={Search}
                title="No scans match your filters"
                description="Try a different search term, or clear the filters above."
              />
            ) : (
              <EmptyState
                icon={History}
                title="No scans yet"
                description="Run your first scan and it'll show up here automatically."
                action={
                  <Link to="/dashboard/url-scanner">
                    <Button>Go to Website Scanner</Button>
                  </Link>
                }
              />
            )
          ) : (
            <div className="flex flex-col gap-3">
              {scans.map((scan) => (
                <ScanHistoryItem
                  key={scan.id}
                  scan={scan}
                  onOpen={() => handleOpen(scan.id)}
                  onDelete={() => {
                    setPendingDeleteId(scan.id);
                    deleteModal.open();
                  }}
                  onToggleFavorite={() => handleToggleFavorite(scan.id)}
                  isCompareSelected={compareIds.includes(scan.id)}
                  onToggleCompare={() => handleToggleCompare(scan.id)}
                  compareDisabled={compareIds.length >= 2 && !compareIds.includes(scan.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full report viewer — reuses the same components as the live scan flow */}
      <Modal
        isOpen={reportModal.isOpen}
        onClose={() => {
          reportModal.close();
          setOpenReport(null);
        }}
        title="Security Report"
        size="xl"
      >
        {isReportLoading || !openReport ? (
          <LoadingSpinner label="Loading report..." className="py-16" />
        ) : (
          <div className="flex flex-col gap-6">
            <SecurityReportSummary report={openReport} />
            <AiExplanationCard explanation={openReport.aiExplanation} />
            <RecommendationsList recommendations={openReport.recommendations} />
            {groupChecksByCategory(openReport.checks).map(({ category, checks }) => (
              <div key={category}>
                <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  {CATEGORY_LABELS[category]}
                </h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {checks.map((check) => (
                    <ScanResultCard
                      key={check.id}
                      icon={check.icon}
                      title={check.title}
                      value={check.value}
                      summary={check.summary}
                      learnMore={check.learnMore}
                      glossary={check.glossary}
                      status={check.status}
                      meta={check.meta}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Compare two scans side by side */}
      <Modal
        isOpen={compareModal.isOpen}
        onClose={() => {
          compareModal.close();
          setCompareReports(null);
        }}
        title="Compare Scans"
        size="xl"
      >
        {isCompareLoading || !compareReports ? (
          <LoadingSpinner label="Loading scans..." className="py-16" />
        ) : (
          <CompareScansModal reportA={compareReports[0]} reportB={compareReports[1]} />
        )}
      </Modal>

      {/* Delete confirmation */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          deleteModal.close();
          setPendingDeleteId(null);
        }}
        title="Delete this scan?"
      >
        <p className="text-sm text-ink-muted">
          This will permanently remove this scan from your history. This can't be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              deleteModal.close();
              setPendingDeleteId(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="bg-accent-danger bg-none hover:bg-accent-danger/90"
            onClick={handleConfirmDelete}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
