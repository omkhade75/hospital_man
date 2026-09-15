import { useState, useEffect, useRef, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity, ShieldCheck, Database, Server, Code, Bot,
  RefreshCw, CheckCircle2, AlertTriangle, XCircle, Zap,
  TerminalSquare, Table2, Wifi, Clock, TrendingUp, Heart,
  Shield, Eye, AlertOctagon, Loader2
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────

type HealthState = "healthy" | "checking" | "warning" | "error";

interface TableCheck {
  name: string;
  status: HealthState;
  rowCount: number | null;
  latencyMs: number | null;
  error: string | null;
}

interface EdgeFunctionCheck {
  name: string;
  status: HealthState;
  latencyMs: number | null;
  error: string | null;
}

interface AuthCheck {
  sessionValid: boolean;
  provider: string | null;
  latencyMs: number | null;
}

interface RealtimeCheck {
  status: HealthState;
  latencyMs: number | null;
  error: string | null;
}

interface LogEntry {
  timestamp: string;
  message: string;
  level: "info" | "success" | "warning" | "error";
}

interface FullDiagnostics {
  overallHealth: HealthState;
  database: HealthState;
  api: HealthState;
  auth: HealthState;
  realtime: HealthState;
  frontend: HealthState;
  tables: TableCheck[];
  edgeFunctions: EdgeFunctionCheck[];
  authCheck: AuthCheck | null;
  realtimeCheck: RealtimeCheck | null;
  lastChecked: Date | null;
  totalLatencyMs: number;
  logs: LogEntry[];
  scanProgress: number;
  errorCount: number;
  warningCount: number;
  passedCount: number;
  runNumber: number;
}

// ─── All tables in the system ───────────────────────────────────────

const ALL_TABLES = [
  "profiles",
  "user_roles",
  "appointments",
  "patient_appointments",
  "patients",
  "doctors",
  "departments",
  "beds",
  "callback_requests",
  "chat_messages",
  "notifications",
  "patient_accounts",
  "transactions",
  "insurance_claims",
  "medical_reports",
  "staff_approval_requests",
  "emergency_doctors",
  "emergency_calls",
  "ambulances",
  "ambulance_requests",
  "ambulance_tracking",
  "first_aid_guides",
  "call_transcripts",
];

const EDGE_FUNCTIONS = [
  "vapi-appointment-call",
  "vapi-callback-request",
  "vapi-webhook",
  "emergency-handler",
  "maya-chat",
];

// ─── Component ──────────────────────────────────────────────────────

const AdminSystemHealth = () => {
  const [diag, setDiag] = useState<FullDiagnostics>({
    overallHealth: "checking",
    database: "checking",
    api: "checking",
    auth: "checking",
    realtime: "checking",
    frontend: "healthy",
    tables: [],
    edgeFunctions: [],
    authCheck: null,
    realtimeCheck: null,
    lastChecked: null,
    totalLatencyMs: 0,
    logs: [],
    scanProgress: 0,
    errorCount: 0,
    warningCount: 0,
    passedCount: 0,
    runNumber: 0,
  });

  const [isRunning, setIsRunning] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [diag.logs]);

  // ─── Log helper ────────────────────────────────────────────────

  const addLog = useCallback(
    (message: string, level: LogEntry["level"] = "info") => {
      setDiag((prev) => ({
        ...prev,
        logs: [
          ...prev.logs,
          {
            timestamp: new Date().toLocaleTimeString("en-IN", { hour12: false }),
            message,
            level,
          },
        ],
      }));
    },
    []
  );

  // ─── Deep Table Check ─────────────────────────────────────────

  const checkTable = async (tableName: string): Promise<TableCheck> => {
    try {
      const start = performance.now();
      // Use head:true count for efficiency
      const { count, error } = await supabase
        .from(tableName)
        .select("*", { count: "exact", head: true });
      const latency = performance.now() - start;

      if (error) {
        return {
          name: tableName,
          status: "error",
          rowCount: null,
          latencyMs: latency,
          error: error.message,
        };
      }

      return {
        name: tableName,
        status: latency > 2000 ? "warning" : "healthy",
        rowCount: count ?? 0,
        latencyMs: latency,
        error: null,
      };
    } catch (err: any) {
      return {
        name: tableName,
        status: "error",
        rowCount: null,
        latencyMs: null,
        error: err.message || "Unknown error",
      };
    }
  };

  // ─── Edge Function Check ──────────────────────────────────────

  const checkEdgeFunction = async (
    fnName: string
  ): Promise<EdgeFunctionCheck> => {
    try {
      const start = performance.now();
      // Send OPTIONS/empty body to just see if the function endpoint responds
      const { error } = await supabase.functions.invoke(fnName, {
        method: "POST",
        body: { healthCheck: true },
      });
      const latency = performance.now() - start;

      // Edge functions may return errors for health-check payloads,
      // but as long as they RESPOND, the function is deployed & reachable
      if (error) {
        const errMsg =
          typeof error === "object" && "message" in error
            ? (error as any).message
            : String(error);

        // A 4xx means the function IS running, just rejecting our test payload
        if (
          errMsg.includes("400") ||
          errMsg.includes("401") ||
          errMsg.includes("403") ||
          errMsg.includes("Invalid") ||
          errMsg.includes("Missing")
        ) {
          return {
            name: fnName,
            status: "healthy",
            latencyMs: latency,
            error: null,
          };
        }

        // 404 or boot failure means real problem
        return {
          name: fnName,
          status: "error",
          latencyMs: latency,
          error: errMsg,
        };
      }

      return {
        name: fnName,
        status: latency > 3000 ? "warning" : "healthy",
        latencyMs: latency,
        error: null,
      };
    } catch (err: any) {
      return {
        name: fnName,
        status: "error",
        latencyMs: null,
        error: err.message || "Unreachable",
      };
    }
  };

  // ─── Auth Check ───────────────────────────────────────────────

  const checkAuth = async (): Promise<AuthCheck> => {
    const start = performance.now();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    const latency = performance.now() - start;

    return {
      sessionValid: !!session && !error,
      provider: session?.user?.app_metadata?.provider || null,
      latencyMs: latency,
    };
  };

  // ─── Realtime Check ───────────────────────────────────────────

  const checkRealtime = (): Promise<RealtimeCheck> => {
    return new Promise((resolve) => {
      const start = performance.now();
      const timeout = setTimeout(() => {
        channel.unsubscribe();
        resolve({
          status: "error",
          latencyMs: null,
          error: "Realtime connection timed out (5s)",
        });
      }, 5000);

      const channel = supabase
        .channel("health-check-" + Date.now())
        .subscribe((status) => {
          clearTimeout(timeout);
          const latency = performance.now() - start;
          channel.unsubscribe();

          if (status === "SUBSCRIBED") {
            resolve({
              status: latency > 2000 ? "warning" : "healthy",
              latencyMs: latency,
              error: null,
            });
          } else {
            resolve({
              status: "warning",
              latencyMs: latency,
              error: `Subscription status: ${status}`,
            });
          }
        });
    });
  };

  // ─── Full Diagnostics Run ─────────────────────────────────────

  const runFullDiagnostics = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);

    const totalSteps = ALL_TABLES.length + EDGE_FUNCTIONS.length + 3; // +auth +realtime +summary
    let completedSteps = 0;
    let errors = 0;
    let warnings = 0;
    let passed = 0;
    const diagStart = performance.now();

    setDiag((prev) => ({
      ...prev,
      overallHealth: "checking",
      database: "checking",
      api: "checking",
      auth: "checking",
      realtime: "checking",
      tables: [],
      edgeFunctions: [],
      authCheck: null,
      realtimeCheck: null,
      logs: [],
      scanProgress: 0,
      errorCount: 0,
      warningCount: 0,
      passedCount: 0,
      runNumber: prev.runNumber + 1,
    }));

    addLog("═══════════════════════════════════════════════════════", "info");
    addLog("   FULL SYSTEM DIAGNOSTICS STARTED", "info");
    addLog("═══════════════════════════════════════════════════════", "info");

    // ─── Phase 1: Database Tables ──────────────────────────────

    addLog("", "info");
    addLog("▶ PHASE 1: DATABASE DEEP SCAN", "info");
    addLog(`  Scanning ${ALL_TABLES.length} tables...`, "info");

    const tableResults: TableCheck[] = [];
    let dbHasError = false;
    let dbHasWarning = false;

    for (const table of ALL_TABLES) {
      const result = await checkTable(table);
      tableResults.push(result);
      completedSteps++;

      setDiag((prev) => ({
        ...prev,
        scanProgress: Math.round((completedSteps / totalSteps) * 100),
        tables: [...prev.tables, result],
      }));

      if (result.status === "error") {
        addLog(
          `  ✗ ${table}: FAILED — ${result.error}`,
          "error"
        );
        errors++;
        dbHasError = true;
      } else if (result.status === "warning") {
        addLog(
          `  ⚠ ${table}: SLOW (${result.latencyMs?.toFixed(0)}ms) — ${result.rowCount} rows`,
          "warning"
        );
        warnings++;
        dbHasWarning = true;
      } else {
        addLog(
          `  ✓ ${table}: OK (${result.latencyMs?.toFixed(0)}ms) — ${result.rowCount} rows`,
          "success"
        );
        passed++;
      }
    }

    const dbStatus: HealthState = dbHasError
      ? "error"
      : dbHasWarning
      ? "warning"
      : "healthy";
    setDiag((prev) => ({ ...prev, database: dbStatus }));

    addLog(`  Database scan complete: ${dbStatus.toUpperCase()}`, dbStatus === "healthy" ? "success" : dbStatus === "warning" ? "warning" : "error");

    // ─── Phase 2: Edge Functions ───────────────────────────────

    addLog("", "info");
    addLog("▶ PHASE 2: EDGE FUNCTIONS REACHABILITY", "info");
    addLog(`  Testing ${EDGE_FUNCTIONS.length} functions...`, "info");

    const fnResults: EdgeFunctionCheck[] = [];
    let apiHasError = false;
    let apiHasWarning = false;

    for (const fn of EDGE_FUNCTIONS) {
      const result = await checkEdgeFunction(fn);
      fnResults.push(result);
      completedSteps++;

      setDiag((prev) => ({
        ...prev,
        scanProgress: Math.round((completedSteps / totalSteps) * 100),
        edgeFunctions: [...prev.edgeFunctions, result],
      }));

      if (result.status === "error") {
        addLog(`  ✗ ${fn}: UNREACHABLE — ${result.error}`, "error");
        errors++;
        apiHasError = true;
      } else if (result.status === "warning") {
        addLog(
          `  ⚠ ${fn}: SLOW (${result.latencyMs?.toFixed(0)}ms)`,
          "warning"
        );
        warnings++;
        apiHasWarning = true;
      } else {
        addLog(
          `  ✓ ${fn}: REACHABLE (${result.latencyMs?.toFixed(0)}ms)`,
          "success"
        );
        passed++;
      }
    }

    const apiStatus: HealthState = apiHasError
      ? "error"
      : apiHasWarning
      ? "warning"
      : "healthy";
    setDiag((prev) => ({ ...prev, api: apiStatus }));

    addLog(`  Edge Functions check: ${apiStatus.toUpperCase()}`, apiStatus === "healthy" ? "success" : apiStatus === "warning" ? "warning" : "error");

    // ─── Phase 3: Auth ─────────────────────────────────────────

    addLog("", "info");
    addLog("▶ PHASE 3: AUTHENTICATION & SESSION", "info");

    const authResult = await checkAuth();
    completedSteps++;

    setDiag((prev) => ({
      ...prev,
      scanProgress: Math.round((completedSteps / totalSteps) * 100),
      authCheck: authResult,
      auth: authResult.sessionValid ? "healthy" : "warning",
    }));

    if (authResult.sessionValid) {
      addLog(
        `  ✓ Session VALID (${authResult.latencyMs?.toFixed(0)}ms) — provider: ${authResult.provider || "email"}`,
        "success"
      );
      passed++;
    } else {
      addLog(
        `  ⚠ Session expired or missing (${authResult.latencyMs?.toFixed(0)}ms)`,
        "warning"
      );
      warnings++;
    }

    // ─── Phase 4: Realtime ─────────────────────────────────────

    addLog("", "info");
    addLog("▶ PHASE 4: REALTIME WEBSOCKET", "info");

    const realtimeResult = await checkRealtime();
    completedSteps++;

    setDiag((prev) => ({
      ...prev,
      scanProgress: Math.round((completedSteps / totalSteps) * 100),
      realtimeCheck: realtimeResult,
      realtime: realtimeResult.status,
    }));

    if (realtimeResult.status === "healthy") {
      addLog(
        `  ✓ Realtime connected (${realtimeResult.latencyMs?.toFixed(0)}ms)`,
        "success"
      );
      passed++;
    } else if (realtimeResult.status === "warning") {
      addLog(
        `  ⚠ Realtime: ${realtimeResult.error} (${realtimeResult.latencyMs?.toFixed(0)}ms)`,
        "warning"
      );
      warnings++;
    } else {
      addLog(`  ✗ Realtime: ${realtimeResult.error}`, "error");
      errors++;
    }

    // ─── Summary ───────────────────────────────────────────────

    completedSteps++;
    const totalLatency = performance.now() - diagStart;

    const overall: HealthState =
      errors > 0 ? "error" : warnings > 0 ? "warning" : "healthy";

    setDiag((prev) => ({
      ...prev,
      overallHealth: overall,
      scanProgress: 100,
      lastChecked: new Date(),
      totalLatencyMs: totalLatency,
      errorCount: errors,
      warningCount: warnings,
      passedCount: passed,
    }));

    addLog("", "info");
    addLog("═══════════════════════════════════════════════════════", "info");
    addLog("   DIAGNOSTICS COMPLETE", "info");
    addLog(`   Total time: ${(totalLatency / 1000).toFixed(2)}s`, "info");
    addLog(
      `   Results: ${passed} passed, ${warnings} warnings, ${errors} errors`,
      errors > 0 ? "error" : warnings > 0 ? "warning" : "success"
    );
    addLog("═══════════════════════════════════════════════════════", "info");

    setIsRunning(false);
    toast[overall === "healthy" ? "success" : overall === "warning" ? "warning" : "error"](
      `System Health: ${overall.toUpperCase()}`
    );
  }, [isRunning, addLog]);

  // ─── Auto-refresh every 60s ───────────────────────────────────

  useEffect(() => {
    // Run on mount
    runFullDiagnostics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (autoRefreshEnabled) {
      autoRefreshRef.current = setInterval(() => {
        runFullDiagnostics();
      }, 60_000);
    }
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, [autoRefreshEnabled, runFullDiagnostics]);

  // ─── Render helpers ───────────────────────────────────────────

  const stateColor = (s: HealthState) => {
    switch (s) {
      case "healthy":
        return "text-green-500";
      case "warning":
        return "text-yellow-500";
      case "error":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  const stateBg = (s: HealthState) => {
    switch (s) {
      case "healthy":
        return "bg-green-500/10 border-green-500/30";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/30";
      case "error":
        return "bg-red-500/10 border-red-500/30";
      default:
        return "bg-muted/10 border-border";
    }
  };

  const StateIcon = ({ state, className = "w-5 h-5" }: { state: HealthState; className?: string }) => {
    switch (state) {
      case "healthy":
        return <CheckCircle2 className={`${className} text-green-500`} />;
      case "warning":
        return <AlertTriangle className={`${className} text-yellow-500`} />;
      case "error":
        return <XCircle className={`${className} text-red-500`} />;
      default:
        return <Loader2 className={`${className} text-muted-foreground animate-spin`} />;
    }
  };

  const logColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "success":
        return "text-green-400";
      case "warning":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
      default:
        return "text-slate-400";
    }
  };

  // ─── JSX ──────────────────────────────────────────────────────

  return (
    <DashboardLayout
      title="AI System Health Monitor"
      subtitle="Real-time deep diagnostics across database, APIs, auth, and realtime systems."
    >
      {/* ─── Progress Bar ─────────────────────────────────────── */}
      {isRunning && (
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Running diagnostics...
            </span>
            <span className="font-mono font-bold">{diag.scanProgress}%</span>
          </div>
          <Progress value={diag.scanProgress} className="h-2" />
        </div>
      )}

      {/* ─── Top Status Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Database", icon: Database, state: diag.database, sub: `${diag.tables.length} tables` },
          { label: "Edge Functions", icon: Server, state: diag.api, sub: `${diag.edgeFunctions.length} functions` },
          { label: "Auth", icon: Shield, state: diag.auth, sub: diag.authCheck?.sessionValid ? "Session valid" : "Check needed" },
          { label: "Realtime", icon: Wifi, state: diag.realtime, sub: diag.realtimeCheck?.latencyMs ? `${diag.realtimeCheck.latencyMs.toFixed(0)}ms` : "—" },
          { label: "Frontend", icon: Code, state: diag.frontend, sub: "React app" },
        ].map((item) => (
          <Card key={item.label} className={`border ${stateBg(item.state)} shadow-sm transition-all duration-500`}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between mb-2">
                <item.icon className={`w-4 h-4 ${stateColor(item.state)}`} />
                <StateIcon state={item.state} className="w-4 h-4" />
              </div>
              <p className={`text-lg font-bold uppercase tracking-wide ${stateColor(item.state)}`}>
                {item.state}
              </p>
              <p className="text-xs text-muted-foreground">{item.label} · {item.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Summary Bar ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-xl border bg-card">
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 gap-1">
          <CheckCircle2 className="w-3 h-3" /> {diag.passedCount} Passed
        </Badge>
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30 gap-1">
          <AlertTriangle className="w-3 h-3" /> {diag.warningCount} Warnings
        </Badge>
        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30 gap-1">
          <XCircle className="w-3 h-3" /> {diag.errorCount} Errors
        </Badge>
        <div className="ml-auto flex items-center gap-3 flex-wrap">
          <span className="text-xs text-muted-foreground">
            {diag.lastChecked
              ? `Last scan: ${diag.lastChecked.toLocaleTimeString()} (${(diag.totalLatencyMs / 1000).toFixed(1)}s)`
              : "Not scanned yet"}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={autoRefreshEnabled ? "default" : "outline"}
              className="text-xs h-7"
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${autoRefreshEnabled ? "animate-spin" : ""}`} />
              Auto (60s) {autoRefreshEnabled ? "ON" : "OFF"}
            </Button>
            <Button
              size="sm"
              onClick={() => runFullDiagnostics()}
              disabled={isRunning}
              className="text-xs h-7"
            >
              {isRunning ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Activity className="w-3 h-3 mr-1" />}
              Run Now
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Tabs: Console / Tables / Functions ───────────────── */}
      <Tabs defaultValue="console" className="space-y-4">
        <TabsList>
          <TabsTrigger value="console" className="gap-1.5">
            <TerminalSquare className="w-4 h-4" />
            Live Console
          </TabsTrigger>
          <TabsTrigger value="tables" className="gap-1.5">
            <Table2 className="w-4 h-4" />
            Tables ({diag.tables.length})
          </TabsTrigger>
          <TabsTrigger value="functions" className="gap-1.5">
            <Server className="w-4 h-4" />
            Functions ({diag.edgeFunctions.length})
          </TabsTrigger>
        </TabsList>

        {/* ─── Console ──────────────────────────────────────── */}
        <TabsContent value="console">
          <Card className="bg-slate-950 border-slate-800 text-slate-50 font-mono">
            <CardHeader className="border-b border-slate-800 py-3">
              <CardTitle className="text-sm flex items-center gap-2 text-slate-300">
                <TerminalSquare className="w-4 h-4" />
                AI Agent Output — Run #{diag.runNumber}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[450px] overflow-y-auto p-4 space-y-1 text-xs md:text-sm leading-relaxed">
                {diag.logs.map((log, i) => (
                  <div key={i} className={logColor(log.level)}>
                    {log.message ? (
                      <>
                        {log.timestamp && (
                          <span className="text-slate-600 mr-2">[{log.timestamp}]</span>
                        )}
                        {log.message}
                      </>
                    ) : (
                      <br />
                    )}
                  </div>
                ))}
                {isRunning && (
                  <div className="text-slate-500 animate-pulse mt-2">
                    <span className="mr-2">▋</span>
                    Processing...
                  </div>
                )}
                <div ref={logsEndRef} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tables Detail ────────────────────────────────── */}
        <TabsContent value="tables">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database Tables Health
              </CardTitle>
              <CardDescription>
                Row counts and response latencies for each table.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {diag.tables.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Run diagnostics to see table status.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 px-3 font-medium">Status</th>
                        <th className="py-2 px-3 font-medium">Table</th>
                        <th className="py-2 px-3 font-medium text-right">Rows</th>
                        <th className="py-2 px-3 font-medium text-right">Latency</th>
                        <th className="py-2 px-3 font-medium">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diag.tables.map((t) => (
                        <tr key={t.name} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-2 px-3">
                            <StateIcon state={t.status} className="w-4 h-4" />
                          </td>
                          <td className="py-2 px-3 font-mono font-medium">{t.name}</td>
                          <td className="py-2 px-3 text-right font-mono">
                            {t.rowCount !== null ? t.rowCount.toLocaleString() : "—"}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            {t.latencyMs !== null ? `${t.latencyMs.toFixed(0)}ms` : "—"}
                          </td>
                          <td className="py-2 px-3 text-xs text-red-500 max-w-[200px] truncate">
                            {t.error || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Functions Detail ──────────────────────────────── */}
        <TabsContent value="functions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="w-5 h-5" />
                Supabase Edge Functions
              </CardTitle>
              <CardDescription>
                Reachability and response time for each deployed function.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {diag.edgeFunctions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Run diagnostics to see function status.
                </p>
              ) : (
                <div className="space-y-3">
                  {diag.edgeFunctions.map((fn) => (
                    <div
                      key={fn.name}
                      className={`flex items-center justify-between p-4 rounded-lg border ${stateBg(fn.status)} transition-all`}
                    >
                      <div className="flex items-center gap-3">
                        <StateIcon state={fn.status} className="w-5 h-5" />
                        <div>
                          <p className="font-mono font-medium text-sm">{fn.name}</p>
                          {fn.error && (
                            <p className="text-xs text-red-500 mt-0.5">{fn.error}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-mono text-sm font-bold ${stateColor(fn.status)}`}>
                          {fn.status.toUpperCase()}
                        </p>
                        {fn.latencyMs !== null && (
                          <p className="text-xs text-muted-foreground">
                            {fn.latencyMs.toFixed(0)}ms
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Supabase Protection Info ─────────────────────────── */}
      <Card className="mt-6 border-primary/20">
        <CardContent className="flex items-start gap-4 pt-6">
          <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Supabase Keep-Alive Protection</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              A GitHub Actions workflow runs daily at 12:00 PM UTC, pinging your Supabase REST API to prevent the free-tier project from pausing due to 7 days of inactivity. Make sure your repository secrets{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> are configured.
            </p>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminSystemHealth;
