import { useEffect } from "react";
import { useNavigate } from "react-router";

import { Card, CardContent } from "@skygems/ui";

import { bootstrapProject, fetchLastActiveProjectId } from "../contracts/api";
import { appRoutes } from "../lib/routes";

export function CreateRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function resolveRoute() {
      const lastActiveProjectId = await fetchLastActiveProjectId();
      if (!mounted) {
        return;
      }

      if (lastActiveProjectId) {
        navigate(appRoutes.create(lastActiveProjectId), { replace: true });
        return;
      }

      const project = await bootstrapProject();
      if (mounted) {
        navigate(appRoutes.create(project.projectId), { replace: true });
      }
    }

    resolveRoute().catch(() => {
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
          Preparing create flow
        </p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Resolving or bootstrapping a project workspace before entering Create.
        </p>
      </CardContent>
    </Card>
  );
}
