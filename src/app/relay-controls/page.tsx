import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function RelayControlsPage() {
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
                  <BreadcrumbPage>Relay Controls</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex-1 p-4 lg:p-6">
          <h1 className="text-2xl font-semibold">Relay Controls</h1>
          <p className="text-muted-foreground">
            This is the Relay Controls page.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center space-x-2">
              <Switch id="relay-1" />
              <Label htmlFor="relay-1">Relay 1</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="relay-2" />
              <Label htmlFor="relay-2">Relay 2</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="relay-3" />
              <Label htmlFor="relay-3">Relay 3</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="relay-4" />
              <Label htmlFor="relay-4">Relay 4</Label>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}