/**
 * Base agent interface - all agents must implement this contract
 */

export interface IAgent<TInput, TOutput> {
  /**
   * Execute the agent with given input
   */
  run(input: TInput): Promise<TOutput>;

  /**
   * Get agent name for logging and UI
   */
  getName(): string;

  /**
   * Get agent description
   */
  getDescription(): string;
}

/**
 * Abstract base class for all agents
 */
export abstract class Agent<TInput, TOutput> implements IAgent<TInput, TOutput> {
  protected logger = {
    log: (message: string) => console.log(`[${this.getName()}] ${message}`),
    error: (message: string, error?: unknown) =>
      console.error(`[${this.getName()}] ${message}`, error),
  };

  abstract getName(): string;
  abstract getDescription(): string;
  abstract run(input: TInput): Promise<TOutput>;

  protected simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
