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

function hasExportModifier(node: ts.Node): boolean {
  return Boolean(ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export);
}

function getExportedNames(file: ts.SourceFile): string[] {
  const names: string[] = [];
  for (const statement of file.statements) {
    if (!hasExportModifier(statement)) continue;
    if (
      (ts.isFunctionDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement) ||
        ts.isClassDeclaration(statement) ||
        ts.isEnumDeclaration(statement)) &&
      statement.name
    ) {
      names.push(statement.name.text);
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) names.push(declaration.name.text);
      }
    } else if (ts.isExportDeclaration(statement) || ts.isExportAssignment(statement)) {
      names.push('<export-statement>');
    }
  }
  return names;
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

function collectDispatcherCases(functionNode: ts.FunctionDeclaration): string[] {
  const cases: string[] = [];
  function visit(node: ts.Node): void {
    if (ts.isCaseClause(node) && ts.isStringLiteral(node.expression)) cases.push(node.expression.text);
    ts.forEachChild(node, visit);
  }
  visit(functionNode);
  return cases;
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
  const effectNames = new Set([
    'refreshCalendarManagedWorldbookRuntimeDiagnostics',
    'refreshCalendarManagedWorldbookSourceDiagnostics',
    'listCalendarWorldbookMoveCandidates',
    'installCalendarManagedEntriesToExternalWorldbook',
    'installCalendarManagedWorldbookEntries',
    'uninstallCalendarManagedWorldbookEntries',
  ]);
  const violations: string[] = [];

  function visit(node: ts.Node, owner: string | null): void {
    const nextOwner = ts.isFunctionDeclaration(node) && node.name ? node.name.text : owner;
    if (ts.isIdentifier(node) && effectNames.has(node.text) && !ts.isImportSpecifier(node.parent)) {
      if (nextOwner !== 'createProductionManagedWorldbookFlow') violations.push(`${node.text}@${nextOwner ?? '<top>'}`);
    }
    ts.forEachChild(node, child => visit(child, nextOwner));
  }
  visit(file, null);
  assert(violations.length === 0, `manager effects 只能出现在 production flow adapter：${violations.join(', ')}`);
}

function main(): void {
  const host = readSource('../../../src/calendar-float/widget/index.ts');
  const actions = readSource('../../../src/calendar-float/widget/actions.ts');
  const events = readSource('../../../src/calendar-float/widget/events.ts');

  const exportedNames = getExportedNames(host.file);
  assert(
    JSON.stringify(exportedNames) === JSON.stringify(['bootstrapCalendarWidget']),
    `widget host 唯一 export 必须是 bootstrapCalendarWidget，实际为：${exportedNames.join(', ')}`,
  );

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
  const dispatcherCases = collectDispatcherCases(findFunction(host.file, 'dispatchWidgetAction'));
  assert(actionTypes.length === 60 && new Set(actionTypes).size === 60, `WidgetAction 必须保持 60 个唯一 action，实际 ${actionTypes.length}`);
  const missing = actionTypes.filter(type => !dispatcherCases.includes(type));
  const duplicate = dispatcherCases.filter((type, index) => dispatcherCases.indexOf(type) !== index);
  const extra = dispatcherCases.filter(type => !actionTypes.includes(type));
  assert(
    missing.length === 0 && duplicate.length === 0 && extra.length === 0 && dispatcherCases.length === actionTypes.length,
    `action dispatcher 必须完整且唯一：missing=${missing.join(',')} duplicate=${duplicate.join(',')} extra=${extra.join(',')}`,
  );

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
