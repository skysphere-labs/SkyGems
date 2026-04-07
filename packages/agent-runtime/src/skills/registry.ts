import type { ViewPlan } from "../packs/types.ts";

export interface SkillDefinition<TInput = unknown, TOutput = unknown> {
  skillId: string;
  description: string;
  execute: (input: TInput) => Promise<TOutput> | TOutput;
}

export class SkillRegistry {
  private readonly skills = new Map<string, SkillDefinition<unknown, unknown>>();

  register<TInput, TOutput>(definition: SkillDefinition<TInput, TOutput>) {
    this.skills.set(definition.skillId, definition as SkillDefinition<unknown, unknown>);
  }

  resolve(skillId: string): SkillDefinition<unknown, unknown> | undefined {
    return this.skills.get(skillId);
  }

  async run<TOutput>(skillId: string, input: unknown): Promise<TOutput> {
    const skill = this.resolve(skillId);
    if (!skill) {
      throw new Error(`Unknown skill: ${skillId}`);
    }

    return (await skill.execute(input)) as TOutput;
  }

  list(): SkillDefinition<unknown, unknown>[] {
    return [...this.skills.values()];
  }
}

export type ViewPlanSkillOutput = ViewPlan;
