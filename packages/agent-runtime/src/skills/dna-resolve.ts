import {
  buildDesignDna,
  normalizeCreateDesignInput,
  type CreateDesignInput,
  type DesignDna,
} from "@skygems/shared";

export async function resolveDesignDna(input: CreateDesignInput): Promise<{
  normalizedInput: CreateDesignInput;
  designDna: DesignDna;
}> {
  const normalizedInput = normalizeCreateDesignInput(input);
  const designDna = await buildDesignDna(normalizedInput);

  return {
    normalizedInput,
    designDna,
  };
}
