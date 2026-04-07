import { Link } from "react-router";

import { Card, CardContent, CardHeader, CardTitle } from "@skygems/ui";

import type { FlowStepItem } from "../../contracts/types";
import { StageStatusPill } from "./StageStatusPill";

export function FlowStepRail({ steps }: { steps: FlowStepItem[] }) {
  return (
    <Card className="border-white/6 bg-[var(--bg-secondary)]">
      <CardHeader className="pb-3">
        <p className="eyebrow">Flow Progression</p>
        <CardTitle className="text-lg text-[var(--text-primary)]">
          Locked project path
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step) => {
          const content = (
            <div className="flex items-start justify-between gap-3 rounded-2xl border border-white/6 bg-[rgba(255,255,255,0.02)] px-4 py-3 transition-colors hover:bg-[rgba(255,255,255,0.04)]">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {step.label}
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                  {step.description}
                </p>
              </div>
              <StageStatusPill status={step.status} />
            </div>
          );

          if (!step.href) {
            return <div key={step.id}>{content}</div>;
          }

          return (
            <Link key={step.id} to={step.href}>
              {content}
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
