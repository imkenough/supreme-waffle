"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { useState, useEffect, useRef } from "react";
import mqtt from "mqtt";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

// --- MQTT Configuration ---
const MQTT_BROKER_URL = import.meta.env.VITE_MQTT_BROKER_URL;
const MQTT_USERNAME = import.meta.env.VITE_MQTT_USERNAME;
const MQTT_PASSWORD = import.meta.env.VITE_MQTT_PASSWORD;
const MQTT_TOPIC_LOGS = "vfd/logs";

interface LogEntry {
  timestamp: string;
  message: string;
}

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-red-500">Configuration Error</CardTitle>
          <CardDescription>
            The dashboard cannot start due to missing environment variables.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{message}</p>
          <p className="mt-4 text-xs text-muted-foreground">
            Please ensure all required `VITE_MQTT_*` environment variables are
            set in your `.env` file.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!MQTT_BROKER_URL) return;

    const mqttClient = mqtt.connect(MQTT_BROKER_URL, {
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,
      reconnectPeriod: 5000,
    });

    mqttClient.on("connect", () => {
      console.log("Connected to MQTT broker for logs.");
      setIsConnected(true);
      mqttClient.subscribe(MQTT_TOPIC_LOGS, (err) => {
        if (err) {
          console.error("Log subscription error:", err);
        }
      });
    });

    mqttClient.on("message", (topic, message) => {
      if (topic === MQTT_TOPIC_LOGS) {
        const newLog: LogEntry = {
          timestamp: new Date().toISOString(),
          message: message.toString(),
        };
        setLogs((prevLogs) => {
          const updatedLogs = [...prevLogs, newLog];
          // Limit logs to last 500 entries to prevent memory issues
          return updatedLogs.slice(-500);
        });
      }
    });

    mqttClient.on("offline", () => {
      setIsConnected(false);
    });

    mqttClient.on("error", (err) => {
      console.error("MQTT client error:", err);
      setIsConnected(false);
    });

    return () => {
      mqttClient.end();
    };
  }, []);

  // Auto-scroll to the bottom of the log container when new logs arrive
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-svh overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Device Logs</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex-1 flex flex-col min-h-0 p-4 lg:p-6 bg-muted/5 gap-4">
          <div className="flex items-center justify-between shrink-0">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">System Logs</h1>
              <p className="text-muted-foreground">
                Real-time output from the ESP32 VFD Controller.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Status variant={isConnected ? "success" : "destructive"}>
                <StatusIndicator />
                <StatusLabel>{isConnected ? "Connected" : "Disconnected"}</StatusLabel>
              </Status>
              <Button
                variant="outline"
                size="sm"
                onClick={clearLogs}
                disabled={logs.length === 0}
                className="gap-2"
              >
                <Trash2 className="size-4" />
                Clear
              </Button>
            </div>
          </div>

          <Card className="flex-1 flex flex-col min-h-0 shadow-sm border-muted-foreground/10 overflow-hidden">
            <CardHeader className="py-3 px-4 border-b bg-muted/10 shrink-0">
              <CardTitle className="text-sm font-medium">Log Stream</CardTitle>
            </CardHeader>
            <CardContent
              ref={logContainerRef}
              className="flex-1 overflow-y-auto p-0 font-mono text-[13px] bg-black/5 dark:bg-black/20"
            >
              {logs.length > 0 ? (
                <div className="divide-y divide-border/40">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className="px-4 py-1.5 hover:bg-muted/30 transition-colors flex items-start group"
                    >
                      <span className="text-muted-foreground/60 select-none mr-3 shrink-0 tabular-nums">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour12: false,
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                      <span className="flex-1 break-all whitespace-pre-wrap leading-relaxed text-foreground/90">
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                  {isConnected ? (
                    <>
                      <div className="size-2 bg-primary rounded-full animate-pulse" />
                      <p className="text-sm">Waiting for incoming logs...</p>
                    </>
                  ) : (
                    <p className="text-sm">Establishing connection to broker...</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function Page() {
  // Validate environment variables first
  if (!import.meta.env.VITE_MQTT_BROKER_URL) {
    return (
      <ErrorDisplay message="Missing VITE_MQTT_BROKER_URL environment variable." />
    );
  }
  if (!import.meta.env.VITE_MQTT_USERNAME) {
    return (
      <ErrorDisplay message="Missing VITE_MQTT_USERNAME environment variable." />
    );
  }
  if (!import.meta.env.VITE_MQTT_PASSWORD) {
    return (
      <ErrorDisplay message="Missing VITE_MQTT_PASSWORD environment variable." />
    );
  }

  return <LogsPage />;
}
