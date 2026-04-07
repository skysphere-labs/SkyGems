import { useEffect } from "react";
import { useNavigate } from "react-router";

import { Card, CardContent } from "@skygems/ui";

import { fetchLastActiveProjectId } from "../contracts/api";
import { appRoutes } from "../lib/routes";

export function WorkspaceResolver() {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    fetchLastActiveProjectId()
      .then((projectId) => {
        if (!mounted) {
          return;
        }

        navigate(
          projectId ? appRoutes.project(projectId) : appRoutes.projects,
          { replace: true },
        );
      })
      .catch(() => {
        if (mounted) {
          navigate(appRoutes.projects, { replace: true });
        }
      });

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <Card className="border-white/6 bg-[var(--bg-secondary)]">
      <CardContent className="py-12 text-center">
        <p className="text-lg font-semibold text-[var(--text-primary)]">
          Resolving workspace
        </p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Redirecting into the last active project context.
        </p>
      </CardContent>
    </Card>
  );
}
