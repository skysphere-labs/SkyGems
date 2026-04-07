export const appRoutes = {
  landing: "/",
  appRoot: "/app",
  createRedirect: "/app/create",
  projects: "/app/projects",
  project: (projectId: string) => `/app/projects/${projectId}`,
  create: (projectId: string) => `/app/projects/${projectId}/create`,
  generation: (projectId: string, generationId: string) =>
    `/app/projects/${projectId}/generations/${generationId}`,
  design: (projectId: string, designId: string) =>
    `/app/projects/${projectId}/designs/${designId}`,
  spec: (projectId: string, designId: string) =>
    `/app/projects/${projectId}/designs/${designId}/spec`,
  technicalSheet: (projectId: string, designId: string) =>
    `/app/projects/${projectId}/designs/${designId}/technical-sheet`,
  svg: (projectId: string, designId: string) =>
    `/app/projects/${projectId}/designs/${designId}/svg`,
  cad: (projectId: string, designId: string) =>
    `/app/projects/${projectId}/designs/${designId}/cad`,
  gallery: "/app/gallery",
};
