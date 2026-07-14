// eslint-disable-next-line import-x/no-nodejs-modules -- focused architecture check runs under Node/ts-node.
import { readFileSync } from 'node:fs';
// eslint-disable-next-line import-x/no-nodejs-modules -- focused architecture check runs under Node/ts-node.
import { resolve } from 'node:path';
import * as ts from 'typescript';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readSource(relativePath: string): { source: string; file: ts.SourceFile } {
  const path = resolve(__dirname, relativePath);
  const source = readFileSync(path, 'utf8');
  return {
    source,
    file: ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS),
  };
}

function parseFixture(source: string): ts.SourceFile {
  return ts.createSourceFile('fixture.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

function expectContractFailure(name: string, check: () => void): void {
  let failed = false;
  try {
    check();
  } catch {
    failed = true;
  }
  assert(failed, `${name} mutation 必须被 boundary contract 拒绝`);
}

function hasExportModifier(node: ts.Node): boolean {
  return Boolean(ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export);
}

function assertOnlyBootstrapExport(file: ts.SourceFile): void {
  const exportedNames: string[] = [];
  const invalidExports: string[] = [];
  for (const statement of file.statements) {
    if (ts.isExportDeclaration(statement) || ts.isExportAssignment(statement)) {
      invalidExports.push(ts.SyntaxKind[statement.kind]);
      continue;
    }
    if (!hasExportModifier(statement)) continue;
    const isDefault = statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword) ?? false;
    if (ts.isFunctionDeclaration(statement) && statement.name?.text === 'bootstrapCalendarWidget' && !isDefault) {
      exportedNames.push(statement.name.text);
    } else {
      const name = (statement as ts.NamedDeclaration).name;
      invalidExports.push(name && ts.isIdentifier(name) ? name.text : ts.SyntaxKind[statement.kind]);
    }
  }
  assert(
    invalidExports.length === 0 &&
      exportedNames.length === 1 &&
      exportedNames[0] === 'bootstrapCalendarWidget',
    `widget host 唯一 export 必须是 bootstrapCalendarWidget，额外为：${invalidExports.join(', ')}`,
  );
}

function findFunction(file: ts.SourceFile, name: string): ts.FunctionDeclaration {
  const declaration = file.statements.find(
    (statement): statement is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(statement) && statement.name?.text === name,
  );
  assert(declaration, `找不到函数 ${name}`);
  return declaration;
}

function collectActionTypes(actionsFile: ts.SourceFile): string[] {
  const alias = actionsFile.statements.find(
    (statement): statement is ts.TypeAliasDeclaration =>
      ts.isTypeAliasDeclaration(statement) && statement.name.text === 'WidgetAction',
  );
  assert(alias, 'actions.ts 必须声明 WidgetAction');
  const members = ts.isUnionTypeNode(alias.type) ? alias.type.types : [alias.type];
  return members.map(member => {
    assert(ts.isTypeLiteralNode(member), 'WidgetAction 每项必须是 type literal');
    const property = member.members.find(
      (item): item is ts.PropertySignature =>
        ts.isPropertySignature(item) && ts.isIdentifier(item.name) && item.name.text === 'type',
    );
    assert(property?.type && ts.isLiteralTypeNode(property.type), 'WidgetAction 每项必须有 literal type');
    assert(ts.isStringLiteral(property.type.literal), 'WidgetAction type 必须是 string literal');
    return property.type.literal.text;
  });
}

function assertActionDispatcherContract(actionTypes: string[], functionNode: ts.FunctionDeclaration): string[] {
  assert(functionNode.body, 'dispatchWidgetAction 必须有 function body');
  const actionSwitches = functionNode.body.statements.filter(
    (statement): statement is ts.SwitchStatement =>
      ts.isSwitchStatement(statement) &&
      ts.isPropertyAccessExpression(statement.expression) &&
      ts.isIdentifier(statement.expression.expression) &&
      statement.expression.expression.text === 'action' &&
      statement.expression.name.text === 'type',
  );
  assert(actionSwitches.length === 1, `dispatchWidgetAction 必须且只能有一个直接 switch (action.type)，实际 ${actionSwitches.length}`);
  const clauses = actionSwitches[0].caseBlock.clauses;
  const defaults = clauses.filter(ts.isDefaultClause);
  assert(defaults.length === 1, `dispatchWidgetAction 必须有一个 exhaustive default，实际 ${defaults.length}`);
  let exhaustiveNeverCount = 0;
  function isNestedFunctionLike(node: ts.Node): boolean {
    return (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isConstructorDeclaration(node) ||
      ts.isGetAccessorDeclaration(node) ||
      ts.isSetAccessorDeclaration(node)
    );
  }
  function visitDefault(node: ts.Node): void {
    if (node !== defaults[0] && isNestedFunctionLike(node)) {
      return;
    }
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'exhaustiveCheck' &&
      node.type?.kind === ts.SyntaxKind.NeverKeyword &&
      node.initializer &&
      ts.isIdentifier(node.initializer) &&
      node.initializer.text === 'action' &&
      ts.isVariableDeclarationList(node.parent) &&
      Boolean(node.parent.flags & ts.NodeFlags.Const)
    ) {
      exhaustiveNeverCount += 1;
    }
    ts.forEachChild(node, visitDefault);
  }
  visitDefault(defaults[0]);
  assert(exhaustiveNeverCount === 1, `dispatcher default 必须含唯一 const exhaustiveCheck: never = action，实际 ${exhaustiveNeverCount}`);

  const caseClauses = clauses.filter(ts.isCaseClause);
  assert(caseClauses.every(clause => ts.isStringLiteral(clause.expression)), 'dispatcher direct case 必须全部使用 string literal');
  const dispatcherCases = caseClauses.map(clause => (clause.expression as ts.StringLiteral).text);
  const missing = actionTypes.filter(type => !dispatcherCases.includes(type));
  const duplicate = dispatcherCases.filter((type, index) => dispatcherCases.indexOf(type) !== index);
  const extra = dispatcherCases.filter(type => !actionTypes.includes(type));
  assert(
    missing.length === 0 && duplicate.length === 0 && extra.length === 0 && dispatcherCases.length === actionTypes.length,
    `action dispatcher 必须完整且唯一：missing=${missing.join(',')} duplicate=${duplicate.join(',')} extra=${extra.join(',')}`,
  );
  return dispatcherCases;
}

function getTopLevelSymbolCount(file: ts.SourceFile): number {
  let count = 0;
  for (const statement of file.statements) {
    if (
      ts.isFunctionDeclaration(statement) ||
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement) ||
      ts.isClassDeclaration(statement) ||
      ts.isEnumDeclaration(statement)
    ) {
      if (statement.name) count += 1;
    } else if (ts.isVariableStatement(statement)) {
      count += statement.declarationList.declarations.filter(declaration => ts.isIdentifier(declaration.name)).length;
    }
  }
  return count;
}

function countIdentifierCalls(file: ts.SourceFile, name: string): number {
  let count = 0;
  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) count += 1;
    ts.forEachChild(node, visit);
  }
  visit(file);
  return count;
}

function assertManagerEffectsStayInProductionAdapter(file: ts.SourceFile): void {
  const importedEffectNames = new Set([
    'refreshCalendarManagedWorldbookRuntimeDiagnostics',
    'refreshCalendarManagedWorldbookSourceDiagnostics',
    'listCalendarWorldbookMoveCandidates',
    'installCalendarManagedEntriesToExternalWorldbook',
    'installCalendarManagedWorldbookEntries',
    'uninstallCalendarManagedWorldbookEntries',
  ]);
  const localBindings = new Map<string, string>();
  const namespaceBindings = new Set<string>();
  for (const statement of file.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !statement.moduleSpecifier.text.endsWith('/worldbook-manager') ||
      !statement.importClause?.namedBindings
    ) {
      continue;
    }
    const bindings = statement.importClause.namedBindings;
    if (ts.isNamespaceImport(bindings)) {
      namespaceBindings.add(bindings.name.text);
      continue;
    }
    for (const specifier of bindings.elements) {
      const importedName = specifier.propertyName?.text ?? specifier.name.text;
      if (importedEffectNames.has(importedName)) {
        localBindings.set(specifier.name.text, importedName);
      }
    }
  }
  const violations: string[] = [];

  function visit(node: ts.Node, owner: string | null): void {
    const nextOwner = ts.isFunctionDeclaration(node) && node.name ? node.name.text : owner;
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      namespaceBindings.has(node.expression.text) &&
      ts.isIdentifier(node.name) &&
      importedEffectNames.has(node.name.text) &&
      nextOwner !== 'createProductionManagedWorldbookFlow'
    ) {
      violations.push(`${node.name.text} as ${node.expression.text}.${node.name.text}@${nextOwner ?? '<top>'}`);
    }
    if (ts.isIdentifier(node) && localBindings.has(node.text) && !ts.isImportSpecifier(node.parent)) {
      const isPropertyName =
        (ts.isPropertyAccessExpression(node.parent) && node.parent.name === node) ||
        (ts.isPropertyAssignment(node.parent) && node.parent.name === node && node.parent.initializer !== node);
      if (!isPropertyName && nextOwner !== 'createProductionManagedWorldbookFlow') {
        violations.push(`${localBindings.get(node.text)} as ${node.text}@${nextOwner ?? '<top>'}`);
      }
    }
    ts.forEachChild(node, child => visit(child, nextOwner));
  }
  visit(file, null);
  assert(violations.length === 0, `manager effects 只能出现在 production flow adapter：${violations.join(', ')}`);
}

function testExportMutationGuards(): void {
  const bootstrap = 'export async function bootstrapCalendarWidget(): Promise<void> {}\n';
  const mutations = [
    ['named export declaration', 'const extra = 1; export { extra };'],
    ['star export declaration', "export * from './extra';"],
    ['export assignment', 'export default 1;'],
    ['anonymous default function', 'export default function () {}'],
    ['export destructuring', 'const value = { extra: 1 }; export const { extra } = value;'],
  ] as const;
  for (const [name, mutation] of mutations) {
    expectContractFailure(name, () => assertOnlyBootstrapExport(parseFixture(`${bootstrap}${mutation}\n`)));
  }
}

function testDispatcherMutationGuards(): void {
  const mutations = [
    [
      'unrelated switch',
      "async function dispatchWidgetAction(action: WidgetAction) { switch (other.type) { case 'real': return; default: { const exhaustiveCheck: never = action; throw exhaustiveCheck; } } }",
    ],
    [
      'nested case',
      "async function dispatchWidgetAction(action: WidgetAction) { switch (action.type) { default: { switch (other.type) { case 'real': return; } const exhaustiveCheck: never = action; } } }",
    ],
    [
      'missing exhaustive default',
      "async function dispatchWidgetAction(action: WidgetAction) { switch (action.type) { case 'real': return; } }",
    ],
    [
      'nested exhaustive declaration',
      "async function dispatchWidgetAction(action: WidgetAction) { switch (action.type) { case 'real': return; default: { function fake() { const exhaustiveCheck: never = action; } } } }",
    ],
    [
      'constructor exhaustive declaration',
      "async function dispatchWidgetAction(action: WidgetAction) { switch (action.type) { case 'real': return; default: { class Fake { constructor() { const exhaustiveCheck: never = action; } } } } }",
    ],
    [
      'getter exhaustive declaration',
      "async function dispatchWidgetAction(action: WidgetAction) { switch (action.type) { case 'real': return; default: { class Fake { get value() { const exhaustiveCheck: never = action; return exhaustiveCheck; } } } } }",
    ],
    [
      'setter exhaustive declaration',
      "async function dispatchWidgetAction(action: WidgetAction) { switch (action.type) { case 'real': return; default: { class Fake { set value(next: unknown) { const exhaustiveCheck: never = action; void next; void exhaustiveCheck; } } } } }",
    ],
  ] as const;
  for (const [name, source] of mutations) {
    const fixture = parseFixture(source);
    expectContractFailure(name, () => assertActionDispatcherContract(['real'], findFunction(fixture, 'dispatchWidgetAction')));
  }
}

function testManagerEffectAliasMutationGuard(): void {
  const importLine =
    "import { refreshCalendarManagedWorldbookRuntimeDiagnostics as refreshRuntime } from '../worldbook-manager';\n";
  const adapter = 'function createProductionManagedWorldbookFlow() { return { refreshRuntime }; }\n';
  assertManagerEffectsStayInProductionAdapter(parseFixture(`${importLine}${adapter}`));
  expectContractFailure('aliased manager effect outside adapter', () =>
    assertManagerEffectsStayInProductionAdapter(
      parseFixture(`${importLine}${adapter}function refreshOutsideAdapter() { return refreshRuntime(); }\n`),
    ),
  );
}

function testManagerEffectNamespaceMutationGuard(): void {
  const importLine = "import * as manager from '../worldbook-manager';\n";
  const adapter = 'function createProductionManagedWorldbookFlow() { return { refreshRuntime: manager.refreshCalendarManagedWorldbookRuntimeDiagnostics }; }\n';
  assertManagerEffectsStayInProductionAdapter(parseFixture(`${importLine}${adapter}`));
  expectContractFailure('namespace manager effect outside adapter', () =>
    assertManagerEffectsStayInProductionAdapter(
      parseFixture(
        `${importLine}${adapter}function refreshOutsideAdapter() { return manager.refreshCalendarManagedWorldbookRuntimeDiagnostics(); }\n`,
      ),
    ),
  );
}

function main(): void {
  testExportMutationGuards();
  testDispatcherMutationGuards();
  testManagerEffectAliasMutationGuard();
  testManagerEffectNamespaceMutationGuard();
  const host = readSource('../../../src/calendar-float/widget/index.ts');
  const actions = readSource('../../../src/calendar-float/widget/actions.ts');
  const events = readSource('../../../src/calendar-float/widget/events.ts');

  assertOnlyBootstrapExport(host.file);

  const options = events.file.statements.find(
    (statement): statement is ts.InterfaceDeclaration =>
      ts.isInterfaceDeclaration(statement) && statement.name.text === 'BindCalendarWidgetEventsOptions',
  );
  assert(options, 'events.ts 必须声明 BindCalendarWidgetEventsOptions');
  const optionNames = options.members.map(member => (member.name && ts.isIdentifier(member.name) ? member.name.text : '<unknown>'));
  assert(
    JSON.stringify(optionNames) === JSON.stringify(['refs', 'hostWindow', 'dispatch']),
    `event binding 只能接收 refs/hostWindow/dispatch，实际为：${optionNames.join(', ')}`,
  );

  const actionTypes = collectActionTypes(actions.file);
  const dispatcherCases = assertActionDispatcherContract(actionTypes, findFunction(host.file, 'dispatchWidgetAction'));

  const forbiddenMirrorFields = [
    'fixedEventIndexEditorOpen',
    'fixedEventIndexEditorModel',
    'fixedEventIndexEditorSelection',
    'fixedEventIndexEditorDirty',
    'managedWorldbookBusy',
    'managedWorldbookDialogOpen',
    'managedWorldbookDialogMode',
    'managedWorldbookDialogDiagnostics',
    'managedWorldbookMoveCandidates',
    'managedWorldbookMoveWarnings',
  ];
  const mirrorHits = forbiddenMirrorFields.filter(token => host.source.includes(token));
  assert(mirrorHits.length === 0, `host 不得镜像 editor/managed state：${mirrorHits.join(', ')}`);

  const forbiddenYamlTransforms = [
    'applyFixedEventIndexRowOperationsToYaml',
    'applyFixedEventIndexStructuredEditsToYaml',
    'collectMonthAliasStructuredEdits',
    'getDefaultFixedEventIndexEditorSelection',
    'parseFixedEventIndexDraft',
    'renameFixedEventIndexRowIdInYaml',
    'serializeFixedEventIndexDraft',
    'validateFixedEventIndexDraft',
  ];
  const yamlHits = forbiddenYamlTransforms.filter(token => host.source.includes(token));
  assert(yamlHits.length === 0, `host 不得直接执行 YAML transform：${yamlHits.join(', ')}`);

  const obsoleteFunctions = [
    'hydrateFixedEventIndexMonthAliasesFromRuntime',
    'closeFixedEventIndexEditorDialogAfterConfirm',
    'loadFixedEventIndexEditorDialog',
    'readCurrentFixedEventIndexYamlWithStructuredEdits',
    'syncFixedEventIndexStructuredEditorToYamlPreview',
    'applyFixedEventIndexYamlToEditorModel',
    'applyFixedEventIndexStructuredEditor',
    'applyFixedEventIndexRowOperation',
    'renameFixedEventIndexRowIdAfterInput',
    'openFixedEventIndexEditorDialog',
    'saveFixedEventIndexEditorDialog',
    'createEmptyFixedEventIndexTemplateDialog',
    'renameFixedEventIndexRowId',
    'openManagedWorldbookDialog',
    'handleManagedWorldbookClick',
    'openExternalWorldbookMoveDialog',
    'confirmManagedWorldbookUninstall',
    'confirmManagedWorldbookReinstall',
  ];
  const topLevelFunctions = new Set(
    host.file.statements
      .filter((statement): statement is ts.FunctionDeclaration => ts.isFunctionDeclaration(statement) && Boolean(statement.name))
      .map(statement => statement.name?.text),
  );
  const obsoleteHits = obsoleteFunctions.filter(name => topLevelFunctions.has(name));
  assert(obsoleteHits.length === 0, `host 仍声明已迁移 orchestration：${obsoleteHits.join(', ')}`);
  assert(!topLevelFunctions.has('buildFormEditingNotice'), 'host 不得保留恒为空的 buildFormEditingNotice stub');

  const forbiddenDecisionCopy = ['卸载基础规则失败', '重装基础规则失败', '保存固定事件索引失败'];
  const decisionCopyHits = forbiddenDecisionCopy.filter(text => host.source.includes(text));
  assert(decisionCopyHits.length === 0, `business decision copy 必须留在 session/flow policy：${decisionCopyHits.join(', ')}`);
  assertManagerEffectsStayInProductionAdapter(host.file);

  const lineCount = host.source.trimEnd().split(/\r?\n/u).length;
  const topLevelSymbols = getTopLevelSymbolCount(host.file);
  const renderShellCalls = countIdentifierCalls(host.file, 'renderShell');
  console.log(
    `widget/host-boundary.check.ts OK lines=${lineCount} topLevelSymbols=${topLevelSymbols} renderShellCalls=${renderShellCalls} actionCoverage=${dispatcherCases.length}/${actionTypes.length}`,
  );
}

main();
