"use client";

import { AppSidebar } from "@/components/app-sidebar";
import React, { useState, useEffect, useRef } from "react";
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

// --- MQTT Configuration ---
// These should be in an .env file
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


  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const mqttClient = mqtt.connect(MQTT_BROKER_URL, {
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,
      reconnectPeriod: 5000, // Try to reconnect every 5 seconds
    });

    mqttClient.on("connect", () => {
      console.log("Connected to MQTT broker for logs.");
      setIsConnected(true);
      mqttClient.subscribe(MQTT_TOPIC_LOGS, (err) => {
        if (err) {
          console.error("Log subscription error:", err);
        } else {
          console.log(`Subscribed to ${MQTT_TOPIC_LOGS}`);
        }
      });
    });

    mqttClient.on("message", (topic, message) => {
      if (topic === MQTT_TOPIC_LOGS) {
        const newLog: LogEntry = {
          timestamp: new Date().toISOString(),
          message: message.toString(),
        };
        setLogs((prevLogs) => [...prevLogs, newLog]);
      }
    });

    mqttClient.on("offline", () => {
        console.log("MQTT client for logs offline");
        setIsConnected(false);
    });

    mqttClient.on("error", (err) => {
        console.error("MQTT client error:", err);
        setIsConnected(false);
    });

    return () => {
      if (mqttClient) {
        mqttClient.end();
      }
    };
  }, []);

  // Auto-scroll to the bottom of the log container when new logs arrive
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Logs</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold md:text-2xl">Device Logs</h1>
            <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-sm text-muted-foreground">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
          <Card className="flex flex-col flex-1">
            <CardHeader>
              <CardTitle>Real-time Log Stream</CardTitle>
              <CardDescription>
                Live output from the ESP32 device serial monitor.
              </CardDescription>
            </CardHeader>
            <CardContent
              ref={logContainerRef}
              className="flex-1 overflow-y-auto bg-muted/20 p-4 font-mono text-sm space-y-2"
            >
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div key={index} className="flex items-start">
                    <span className="text-muted-foreground mr-4">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    <span className="flex-1 whitespace-pre-wrap">{log.message}</span>
                  </div>
                ))
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  { isConnected ? "Waiting for logs..." : "Connecting to MQTT broker..." }
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}