import raw from './ecosystem.yaml?raw';
import commercial from './commercial-offerings.json';
import organizationData from './ecosystem-organizations.json';
import YAML from 'yaml';

export type IdentityRole = 'Identity issuer' | 'Integration' | 'Accepts identities';
export type ProjectType = 'official' | 'community' | 'commercial';
export interface SourceLink {
  label: string;
  url: string;
}
export interface EcosystemProject {
  name: string;
  link: string;
  description: string;
  type: ProjectType;
  weight: number;
  identityRoles: IdentityRole[];
  logo?: string;
  organization?: string;
  sources?: SourceLink[];
  checked?: string;
  status?: string;
  notes?: string;
  homepage?: 'project' | 'example';
  logoSource?: string;
  guide?: SourceLink;
}
export interface EcosystemCategory {
  name: string;
  description: string;
  weight: number;
  projects: EcosystemProject[];
}
export interface Organization {
  name: string;
  link: string;
  logo?: string;
  logoSource?: string;
  logoScale?: number;
}

type InputProject = Omit<EcosystemProject, 'type' | 'weight' | 'identityRoles'> &
  Partial<Pick<EcosystemProject, 'type' | 'weight' | 'identityRoles'>>;
type InputCategory = Omit<EcosystemCategory, 'projects'> & { projects: InputProject[] };
const parsed = YAML.parse(raw) as { categories: InputCategory[] };

export const categories: EcosystemCategory[] = [...parsed.categories, {
  name: 'Commercial products and services',
  weight: 150,
  description: 'Identity issuers, SPIRE integrations, and services that accept workload identities.',
  projects: (commercial as InputProject[]).map(project => ({ ...project, type: 'commercial' as const })),
}].map(category => ({
  ...category,
  projects: category.projects.map(project => ({
    ...project,
    type: project.type ?? 'community',
    weight: project.weight ?? 100,
    identityRoles: project.identityRoles ?? ['Integration' as const],
  })).sort((a, b) => a.weight - b.weight || a.name.localeCompare(b.name)),
})).sort((a, b) => a.weight - b.weight);

export const projects = categories.flatMap(category => category.projects);
const organizations: Record<string, Organization> = organizationData;
export const commercialOrganizations = [...new Set(projects
  .filter(project => project.type === 'commercial')
  .map(project => {
    if (!project.organization || !organizations[project.organization]) {
      throw new Error(`Missing organization for ${project.name}`);
    }
    return project.organization;
  }))]
  .map(key => organizations[key])
  .sort((a, b) => a.name.localeCompare(b.name));

export const projectAnchor = (project: EcosystemProject) =>
  `project-${project.name.toLowerCase().replace(/#/g, 'sharp').replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')}`;

// Editorial selections stay with the directory record; commercial offerings have their own strip.
export const homepageProjects = projects
  .filter(project => project.homepage)
  .sort((a, b) => a.name.localeCompare(b.name));
