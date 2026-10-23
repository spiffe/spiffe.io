import raw from './ecosystem.yaml?raw';
import commercial from './commercial-offerings.json';
import YAML from 'yaml';

export const categories = [...YAML.parse(raw).categories, {
  name: 'Commercial products and services', weight: 150,
  description: 'Identity issuers, SPIRE integrations, and services that accept workload identities.',
  projects: commercial.map(project => ({ ...project, type: 'commercial', weight: 100 })),
}].map(category => ({ ...category, projects: category.projects.map((project: any) => ({
  ...project, identityRoles: project.identityRoles || ['Integration'],
})).sort((a: any, b: any) => a.weight - b.weight || a.name.localeCompare(b.name)) }))
  .sort((a, b) => a.weight - b.weight);
export const projects = categories.flatMap(category => category.projects);
