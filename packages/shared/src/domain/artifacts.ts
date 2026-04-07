import type { ArtifactKind } from "../contracts/enums.ts";
import type {
  ArtifactId,
  CadJobId,
  DesignId,
  PairId,
  ProjectId,
  SvgAssetId,
  TechSheetId,
  TenantId,
} from "../contracts/ids.ts";

type ArtifactKeyParams = {
  tenantId: TenantId;
  projectId: ProjectId;
  designId: DesignId;
  pairId?: PairId;
  techSheetId?: TechSheetId;
  svgAssetId?: SvgAssetId;
  cadJobId?: CadJobId;
};

function requireValue<T>(value: T | undefined, message: string): T {
  if (value === undefined) {
    throw new Error(message);
  }

  return value;
}

export function buildArtifactR2Key(kind: ArtifactKind, params: ArtifactKeyParams): string {
  const { tenantId, projectId, designId } = params;

  switch (kind) {
    case "pair_sketch_png":
      return `tenants/${tenantId}/projects/${projectId}/designs/${designId}/pairs/${requireValue(
        params.pairId,
        "pairId is required for pair artifacts.",
      )}/sketch.png`;
    case "pair_render_png":
      return `tenants/${tenantId}/projects/${projectId}/designs/${designId}/pairs/${requireValue(
        params.pairId,
        "pairId is required for pair artifacts.",
      )}/render.png`;
    case "tech_sheet_json":
      return `tenants/${tenantId}/projects/${projectId}/designs/${designId}/technical-sheets/${requireValue(
        params.techSheetId,
        "techSheetId is required for technical sheet artifacts.",
      )}/sheet.json`;
    case "tech_sheet_pdf":
      return `tenants/${tenantId}/projects/${projectId}/designs/${designId}/technical-sheets/${requireValue(
        params.techSheetId,
        "techSheetId is required for technical sheet artifacts.",
      )}/sheet.pdf`;
    case "svg_front":
      return `tenants/${tenantId}/projects/${projectId}/designs/${designId}/svg/${requireValue(
        params.svgAssetId,
        "svgAssetId is required for svg artifacts.",
      )}/front.svg`;
    case "svg_side":
      return `tenants/${tenantId}/projects/${projectId}/designs/${designId}/svg/${requireValue(
        params.svgAssetId,
        "svgAssetId is required for svg artifacts.",
      )}/side.svg`;
    case "svg_top":
      return `tenants/${tenantId}/projects/${projectId}/designs/${designId}/svg/${requireValue(
        params.svgAssetId,
        "svgAssetId is required for svg artifacts.",
      )}/top.svg`;
    case "svg_annotations_json":
      return `tenants/${tenantId}/projects/${projectId}/designs/${designId}/svg/${requireValue(
        params.svgAssetId,
        "svgAssetId is required for svg artifacts.",
      )}/annotations.json`;
    case "cad_step":
      return `tenants/${tenantId}/projects/${projectId}/designs/${designId}/cad/${requireValue(
        params.cadJobId,
        "cadJobId is required for cad artifacts.",
      )}/model.step`;
    case "cad_dxf":
      return `tenants/${tenantId}/projects/${projectId}/designs/${designId}/cad/${requireValue(
        params.cadJobId,
        "cadJobId is required for cad artifacts.",
      )}/model.dxf`;
    case "cad_stl":
      return `tenants/${tenantId}/projects/${projectId}/designs/${designId}/cad/${requireValue(
        params.cadJobId,
        "cadJobId is required for cad artifacts.",
      )}/model.stl`;
    case "cad_package_zip":
      return `tenants/${tenantId}/projects/${projectId}/designs/${designId}/cad/${requireValue(
        params.cadJobId,
        "cadJobId is required for cad artifacts.",
      )}/package.zip`;
    case "cad_qa_report_json":
      return `tenants/${tenantId}/projects/${projectId}/designs/${designId}/cad/${requireValue(
        params.cadJobId,
        "cadJobId is required for cad artifacts.",
      )}/qa-report.json`;
  }
}

export function buildArtifactStubUrl(artifactId: ArtifactId, r2Key: string): string {
  return `https://signed.skbg.invalid/${artifactId}?key=${encodeURIComponent(r2Key)}`;
}
