import ecosystemYaml from "../data/ecosystem.yaml?raw";
import { parseYaml } from "./content";

export type Provenance = "spiffe" | "open-source" | "commercial";

export type Entry = {
  name: string;
  "short-name"?: string;
  kind: string;
  provenance: Provenance;
  link: string;
  description: string;
  docs?: string;
  guides?: { title: string; link: string }[];
  issues?: string[];
  "issues-notes"?: Record<string, string>;
  accepts?: { formats?: string[]; support?: "native" | "compatible" };
};

export const provenanceLabels: Record<Provenance, string> = {
  spiffe: "SPIFFE project",
  "open-source": "Open source",
  commercial: "Commercial",
};

// Shown in the issuer comparison for issuers listed under another kind.
export const kindLabels: Record<string, string> = {
  "secrets-managers": "Secrets manager",
  meshes: "Mesh or runtime",
  pki: "PKI",
};

export const formatLabels: Record<string, string> = {
  x509: "X.509-SVID",
  jwt: "JWT-SVID",
};

const issuerCapabilities = [
  {
    group: "Formats",
    columns: [
      { id: "x509", label: "X.509-SVID" },
      { id: "jwt", label: "JWT-SVID" },
      { id: "wit", label: "WIT-SVID" },
    ],
  },
  {
    group: "Delivery",
    columns: [
      { id: "workload-api", label: "Workload API" },
      { id: "sds", label: "Envoy SDS" },
    ],
  },
  {
    group: "Trust distribution",
    columns: [
      { id: "bundle-endpoint", label: "Serves bundle endpoint" },
      { id: "federation", label: "Consumes federated bundles" },
      { id: "oidc-discovery", label: "OIDC discovery" },
    ],
  },
  {
    group: "Issuance",
    columns: [
      { id: "attestation", label: "Attestation" },
      { id: "upstream-ca", label: "Upstream CA" },
    ],
  },
  {
    group: "Environments",
    columns: [
      { id: "kubernetes", label: "Kubernetes" },
      { id: "vm", label: "VMs and bare metal" },
      { id: "serverless", label: "Serverless" },
    ],
  },
];

// Two tables, so that each fits the docs column without scrolling.
export const issuerTables = [
  issuerCapabilities.slice(0, 3),
  issuerCapabilities.slice(3),
];

const provenanceRank: Record<Provenance, number> = {
  spiffe: 0,
  "open-source": 1,
  commercial: 2,
};

export const entries: Entry[] = parseYaml(ecosystemYaml).entries.map(
  (e: Entry, i: number) => ({ ...e, index: i }),
);

const compare = (
  a: Entry & { index?: number },
  b: Entry & { index?: number },
) =>
  provenanceRank[a.provenance] - provenanceRank[b.provenance] ||
  (a.provenance === "commercial"
    ? a.name.localeCompare(b.name)
    : (a.index ?? 0) - (b.index ?? 0));

export const sorted = (list: Entry[]) => [...list].sort(compare);

export const entryId = (e: Entry) =>
  "entry-" + e.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "");
