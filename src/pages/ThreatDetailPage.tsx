import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/Button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ThreatDetail } from "@/components/ThreatDetail";
import { getThreatDetail } from "@/services/threatService";
import type { ThreatDetailResponse } from "@/services/threatService";

export function ThreatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<ThreatDetailResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setStatus("loading");
    try {
      setDetail(await getThreatDetail(id));
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl animate-fade-up">
        <Link to="/threat-intelligence" className="inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Threat Intelligence
        </Link>

        <div className="mt-6">
          {status === "loading" && <LoadingSpinner label="Loading threat details..." className="py-16" />}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-accent-danger/25 bg-accent-danger/10 p-8 text-center">
              <p className="text-sm text-ink">This threat couldn't be loaded.</p>
              <Button variant="outline" size="sm" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={fetchDetail}>
                Try again
              </Button>
            </div>
          )}

          {status === "done" && detail && <ThreatDetail detail={detail} />}
        </div>
      </div>
    </DashboardLayout>
  );
}
