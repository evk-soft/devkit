/**
 * Handwritten version-1 pack content types.
 *
 * These are written by hand rather than generated, so a schema change and a type change are two
 * deliberate edits: a document can never gain a field in the type without the schema admitting it.
 */

export type ResourceId = string;
export type RelativePath = string;
export type PackageName = string;
export type SemanticVersion = string;

/** Stage 1 packs are instruction-only; the union is reserved for later capability work. */
export type PackCapability = 'instructions.markdown';

export interface PackDeclarationV1 {
  readonly id: ResourceId;
  readonly path: RelativePath;
}

export interface PackV1 {
  readonly version: 1;
  readonly name: PackageName;
  readonly packVersion: SemanticVersion;
  readonly description?: string;
  readonly rules: readonly PackDeclarationV1[];
  readonly skills: readonly PackDeclarationV1[];
}

export interface RuleV1 {
  readonly version: 1;
  readonly id: ResourceId;
  readonly title: string;
  readonly description?: string;
  readonly instructions: RelativePath;
  readonly requiredCapabilities?: readonly PackCapability[];
  readonly assets?: readonly RelativePath[];
}

export interface SkillV1 {
  readonly version: 1;
  readonly id: ResourceId;
  readonly title: string;
  readonly description: string;
  readonly instructions: RelativePath;
  readonly requiredCapabilities?: readonly PackCapability[];
  readonly assets?: readonly RelativePath[];
}
