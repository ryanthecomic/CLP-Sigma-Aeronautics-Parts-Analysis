import { Outlet } from "react-router";
import { Sidebar } from "../../components/layout/Sidebar";
import { TopBar } from "../../components/layout/TopBar";
import { ToastViewport } from "../../components/ui/Toast";

export function DevLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-navy-900 text-slate-200">
      <TopBar modo="dev" />
      <div className="flex flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
      <ToastViewport />
    </div>
  );
}

