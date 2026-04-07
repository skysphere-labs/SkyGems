import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

import { Button, Card, CardContent } from "@skygems/ui";

import { appRoutes } from "../lib/routes";

export function WorkspaceScreen() {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-16">
      <Card className="w-full border-white/6 bg-[var(--bg-secondary)] shadow-[0_36px_100px_rgba(0,0,0,0.28)]">
        <CardContent className="space-y-5 py-10 text-center">
          <p className="eyebrow">Legacy Workspace</p>
          <h1 className="text-3xl font-semibold text-[var(--text-primary)]">
            The canonical project shell lives under Projects
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
            This compatibility screen is kept only to protect the older WIP lane.
            Use the project-scoped routes for create, generation, selection, and
            downstream production work.
          </p>
          <div className="flex justify-center">
            <Button
              asChild
              className="min-w-[220px]"
              style={{
                background: "var(--sg-gradient)",
                color: "var(--text-inverse)",
              }}
            >
              <Link to={appRoutes.projects}>
                Open Projects
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
