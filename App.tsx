import React, { useState, useEffect, useRef } from 'react';

// Types
type ModuleName = 'General Ledger' | 'Accounts Payable' | 'Accounts Receivable' | 'Inventory' | 'Procurement' | 'Sales and marketing' | 'Warehouse management' | 'Production control' | 'Fixed Assets' | 'Project management' | 'Human resources';
type QType = 'RadioButton' | 'Text' | 'Workflow';
type FitGap = 'Fit' | 'GAP' | 'Partial Fit' | 'Customization';

interface RadioOpt { code: string; desc: string; }
interface Integration {
  formName: string; fieldName: string; tableName: string; menuItem: string; dataEntity: string; odataEntity: string; configKey: string;
}
interface Question {
  id: string;
  no: number;
  module: ModuleName;
  question: string;
  type: QType;
  why: string;
  impact: string;
  businessArea: string;
  navPath: string;
  fitGap: FitGap;
  textValue: string;
  radioOptions: RadioOpt[];
  attachmentName: string | null;
  integration: Integration;
}
interface ChartAccount {
  account: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Revenue' | 'Expense' | 'Equity';
  module: ModuleName;
  active: boolean;
}
interface PostingTypeDef {
  value: string;
  label: string;
  module: ModuleName;
  desc: string;
  label_de?: string;
  label_fr?: string;
}
interface PostingProfile {
  id: string; module: ModuleName; accType: 'Summary' | 'Posting'; code: string; mainAccount: string; desc: string; explanation: string; ledger: string; postingType: string;
}
interface WorkflowDef {
  id: string; name: string; module: ModuleName; wType: 'Approval' | 'Review' | 'Task'; approver: string; condition: string; escalation: string; notification: string;
}
interface ParamField { id: string; name: string; importance: string; }
interface ParamFastTab { id: string; title: string; module: ModuleName; fields: ParamField[]; }
interface Company { id: string; code: string; name: string; address: string; summary: string; createdDate: string; status: 'Active'|'Inactive'; ledger: string; }
interface RolePermission { edit: boolean; del: boolean; view: boolean; }
interface RoleDef { id: string; name: string; createdBy: string; createdDate: string; permissions: Record<string, RolePermission>; summary: string; }
interface CoaLine { id: string; mainAccount: string; accountName: string; accType: ChartAccount['type']; department: string; costCenter: string; active: boolean; postingCombo: string; }
interface Dept { code: string; name: string; }
interface CostCenter { code: string; name: string; }

// Version Control & D365 Integration types
interface VersionEntry { id: string; status: 'Live' | 'Staging' | 'Draft'; date: string; user: string; changes: number; note: string; snapshot?: any; }
interface MetadataRow { id: string; navPath: string; formName: string; tableName: string; dataEntity: string; odata: string; menuItem: string; module: ModuleName; }
interface D365IntegrationCfg { envUrl: string; tenantId: string; clientId: string; odataStatus: 'Connected' | 'Not Connected' | 'Testing'; entitySync: 'Synced' | 'Pending' | 'Failed'; dryRun: boolean; }

// License & Multi-Customer Management - New for sharing challenge
interface LicenseInfo {
  plan: 'Community' | 'Professional' | 'Enterprise';
  consultants: number;
  customers: number;
  validity: string;
  env: 'UAT' | 'Live' | 'DEV';
  maxCustomers: number;
  usedCustomers: number;
}
interface ManagedCustomer {
  id: string;
  code: string;
  name: string;
  legalEntity: string;
  modules: ModuleName[];
  extraModules: string[];
  status: 'Active' | 'Inactive' | 'Invited';
  userCount: number;
  sharedLink: string;
  expiry: string;
  canEdit: boolean;
  canSeeFRD: boolean;
  password?: string;
  templateId?: string;
}
interface ModuleTemplate {
  id: string;
  name: string;
  modules: ModuleName[];
  extra: string[];
  desc: string;
}

// Mock data
const MODULES: ModuleName[] = ['General Ledger','Accounts Payable','Accounts Receivable','Inventory','Procurement','Sales and marketing','Warehouse management','Production control','Fixed Assets','Project management','Human resources'];
// Extended modules for multi-customer challenge - includes Master Planning etc
const ALL_MODULES_EXTENDED: string[] = [...MODULES, 'Master planning', 'Cost management', 'Budgeting', 'Organization administration', 'Master Data Management'];
const MODULE_TEMPLATES: ModuleTemplate[] = [
  { id:'tpl-fin', name:'Finance Only (GL AP AR FA)', modules:['General Ledger','Accounts Payable','Accounts Receivable','Fixed Assets'], extra:[], desc:'Core finance: GL, AP, AR, Fixed Assets - for finance transformation' },
  { id:'tpl-sc', name:'Supply Chain (Inventory, Procurement, Sales)', modules:['Inventory','Procurement','Sales and marketing','Warehouse management'], extra:[], desc:'Supply chain: Inventory, Procurement, Sales, Warehouse' },
  { id:'tpl-mfg', name:'Manufacturing (Production + Master Planning)', modules:['Production control','Inventory','Procurement'], extra:['Master planning','Cost management'], desc:'Manufacturing: Production control + Master Planning + Inventory' },
  { id:'tpl-full', name:'Full ERP', modules:['General Ledger','Accounts Payable','Accounts Receivable','Inventory','Procurement','Sales and marketing','Warehouse management','Production control','Fixed Assets','Project management','Human resources'], extra:['Master planning','Cost management','Budgeting'], desc:'Full ERP: All modules including Master Planning' },
  { id:'tpl-retail', name:'Retail (Sales + Inventory + WHS)', modules:['Sales and marketing','Inventory','Warehouse management'], extra:[], desc:'Retail focused: Sales, Inventory, WHS' },
  { id:'tpl-proj', name:'Project + Finance', modules:['Project management','General Ledger','Accounts Payable','Accounts Receivable'], extra:[], desc:'Project accounting + Finance' },
];
const DEPARTMENTS: Dept[] = [
  { code:'001', name:'Sales' },
  { code:'002', name:'Finance' },
  { code:'003', name:'Operations' },
  { code:'004', name:'HR' },
  { code:'005', name:'IT' },
  { code:'006', name:'Marketing' },
  { code:'007', name:'Procurement' },
  { code:'008', name:'Production' },
];
const COST_CENTERS: CostCenter[] = [
  { code:'CC100', name:'Head Office' },
  { code:'CC200', name:'North Region' },
  { code:'CC300', name:'South Region' },
  { code:'CC400', name:'Manufacturing' },
  { code:'CC500', name:'R&D' },
  { code:'CC600', name:'Logistics' },
];
const CAPABILITIES = ['Questionnaire','Summary & Posting profile','Workflow','Parameter forms','Integration section'];
const LANG_MAP: Record<string, Record<string,string>> = {
  EN: { newCompany:'New Company', edit:'Edit', del:'Delete', save:'Save', cancel:'Cancel', newRole:'New Role', newCoaLine:'New COA Line', uploadCoa:'Upload customer COA (Excel)' },
  DE: { newCompany:'Neue Firma', edit:'Bearbeiten', del:'Löschen', save:'Speichern', cancel:'Abbrechen', newRole:'Neue Rolle', newCoaLine:'Neue COA Zeile', uploadCoa:'Kunden-Kontenplan hochladen' },
  FR: { newCompany:'Nouvelle société', edit:'Modifier', del:'Supprimer', save:'Enregistrer', cancel:'Annuler', newRole:'Nouveau rôle', newCoaLine:'Nouvelle ligne COA', uploadCoa:'Télécharger plan comptable' },
};

// Chart of Accounts - 34 entries - dropdown source for Main Account
const CHART_OF_ACCOUNTS: ChartAccount[] = [
  { account:'100000', name:'Cash Summary', type:'Asset', module:'General Ledger', active:true },
  { account:'100100', name:'Cash - HDFC Main', type:'Asset', module:'General Ledger', active:true },
  { account:'100200', name:'Cash - ICICI Operations', type:'Asset', module:'General Ledger', active:true },
  { account:'100300', name:'Bank - Citibank USD', type:'Asset', module:'General Ledger', active:true },
  { account:'100400', name:'Petty Cash', type:'Asset', module:'General Ledger', active:true },
  { account:'110000', name:'Fixed Deposit', type:'Asset', module:'General Ledger', active:true },
  { account:'140100', name:'Inventory Issue', type:'Asset', module:'Inventory', active:true },
  { account:'140200', name:'Inventory Receipt', type:'Asset', module:'Inventory', active:true },
  { account:'140300', name:'Inventory - Raw Material', type:'Asset', module:'Inventory', active:true },
  { account:'140400', name:'Inventory - WIP', type:'Asset', module:'Inventory', active:true },
  { account:'140500', name:'Inventory - Finished Goods', type:'Asset', module:'Inventory', active:true },
  { account:'200100', name:'Vendor Balance AP', type:'Liability', module:'Accounts Payable', active:true },
  { account:'200200', name:'Vendor Advance', type:'Liability', module:'Accounts Payable', active:true },
  { account:'200300', name:'Vendor - Import Payable', type:'Liability', module:'Accounts Payable', active:true },
  { account:'210100', name:'Tax Payable - GST', type:'Liability', module:'General Ledger', active:true },
  { account:'210200', name:'Tax Payable - VAT', type:'Liability', module:'General Ledger', active:true },
  { account:'210300', name:'Tax Receivable - Input GST', type:'Asset', module:'General Ledger', active:true },
  { account:'300100', name:'Customer Balance AR', type:'Asset', module:'Accounts Receivable', active:true },
  { account:'300200', name:'Customer Advance', type:'Liability', module:'Accounts Receivable', active:true },
  { account:'300300', name:'Customer - Deduction', type:'Asset', module:'Accounts Receivable', active:true },
  { account:'500100', name:'Sales Revenue - Domestic', type:'Revenue', module:'Sales and marketing', active:true },
  { account:'500200', name:'Sales Revenue - Export', type:'Revenue', module:'Sales and marketing', active:true },
  { account:'500300', name:'COGS - Material', type:'Expense', module:'Production control', active:true },
  { account:'500400', name:'COGS - Labor', type:'Expense', module:'Production control', active:true },
  { account:'600100', name:'Purchase Expense', type:'Expense', module:'Procurement', active:true },
  { account:'600200', name:'Purchase Variance', type:'Expense', module:'Procurement', active:true },
  { account:'700100', name:'Fixed Assets - Buildings', type:'Asset', module:'Fixed Assets', active:true },
  { account:'700200', name:'Fixed Assets - Machinery', type:'Asset', module:'Fixed Assets', active:true },
  { account:'700300', name:'Accum. Depreciation - Machinery', type:'Asset', module:'Fixed Assets', active:true },
  { account:'700400', name:'Fixed Asset - Acquisition', type:'Asset', module:'Fixed Assets', active:true },
  { account:'800100', name:'Project Cost - T&M', type:'Expense', module:'Project management', active:true },
  { account:'800200', name:'Project Revenue - Fixed Price', type:'Revenue', module:'Project management', active:true },
  { account:'900100', name:'HR Payable - Salaries', type:'Liability', module:'Human resources', active:true },
  { account:'900200', name:'Warehouse Management - Adjustment', type:'Expense', module:'Warehouse management', active:true },
];

// Posting Types - D365 F&O standard - dropdown source for Posting Type
const POSTING_TYPES: PostingTypeDef[] = [
  { value:'Ledger', label:'Ledger Journal', module:'General Ledger', desc:'General ledger posting', label_de:'Hauptbuch', label_fr:'Journal général' },
  { value:'Customer balance', label:'Customer balance', module:'Accounts Receivable', desc:'AR trade balance', label_de:'Debitorensaldo', label_fr:'Solde client' },
  { value:'Vendor balance', label:'Vendor balance', module:'Accounts Payable', desc:'AP trade balance', label_de:'Kreditorensaldo', label_fr:'Solde fournisseur' },
  { value:'Inventory - Issue', label:'Inventory - Issue', module:'Inventory', desc:'Inventory issue posting', label_de:'Lager - Abgang', label_fr:'Stock - Sortie' },
  { value:'Inventory - Receipt', label:'Inventory - Receipt', module:'Inventory', desc:'Inventory receipt posting', label_de:'Lager - Zugang', label_fr:'Stock - Entrée' },
  { value:'Sales - Revenue', label:'Sales - Revenue', module:'Sales and marketing', desc:'Sales revenue', label_de:'Verkauf - Erlös', label_fr:'Ventes - Produits' },
  { value:'Purchase - Expense', label:'Purchase - Expense', module:'Procurement', desc:'Purchase expense', label_de:'Einkauf - Aufwand', label_fr:'Achat - Charge' },
  { value:'Tax - Payable', label:'Tax - Payable', module:'General Ledger', desc:'Tax payable', label_de:'Steuer - Verbindlichkeit', label_fr:'Taxe - Payable' },
  { value:'Tax - Receivable', label:'Tax - Receivable', module:'General Ledger', desc:'Tax receivable', label_de:'Steuer - Forderung', label_fr:'Taxe - Recevable' },
  { value:'Bank', label:'Bank', module:'General Ledger', desc:'Bank account posting', label_de:'Bank', label_fr:'Banque' },
  { value:'Cash', label:'Cash', module:'General Ledger', desc:'Cash posting', label_de:'Kasse', label_fr:'Espèces' },
  { value:'Fixed Asset - Acquisition', label:'Fixed Asset - Acquisition', module:'Fixed Assets', desc:'FA acquisition', label_de:'Anlage - Zugang', label_fr:'Immobilisation - Acquisition' },
  { value:'Fixed Asset - Depreciation', label:'Fixed Asset - Depreciation', module:'Fixed Assets', desc:'FA depreciation', label_de:'Anlage - Abschreibung', label_fr:'Immobilisation - Amortissement' },
  { value:'Project - Cost', label:'Project - Cost', module:'Project management', desc:'Project cost', label_de:'Projekt - Kosten', label_fr:'Projet - Coût' },
  { value:'Project - Revenue', label:'Project - Revenue', module:'Project management', desc:'Project revenue', label_de:'Projekt - Erlös', label_fr:'Projet - Produit' },
  { value:'Production - Cost', label:'Production - Cost', module:'Production control', desc:'Production order cost', label_de:'Produktion - Kosten', label_fr:'Production - Coût' },
  { value:'Warehouse - Adjustment', label:'Warehouse - Adjustment', module:'Warehouse management', desc:'WHS adjustment', label_de:'Lager - Korrektur', label_fr:'Entrepôt - Ajustement' },
  { value:'HR - Payroll', label:'HR - Payroll', module:'Human resources', desc:'Payroll posting', label_de:'HR - Lohn', label_fr:'RH - Paie' },
  { value:'Customer - Advance', label:'Customer - Advance', module:'Accounts Receivable', desc:'Customer advance / deposit', label_de:'Kunde - Anzahlung', label_fr:'Client - Avance' },
  { value:'Vendor - Advance', label:'Vendor - Advance', module:'Accounts Payable', desc:'Vendor advance', label_de:'Lieferant - Anzahlung', label_fr:'Fournisseur - Avance' },
  { value:'Inventory - Profit/Loss', label:'Inventory - Profit/Loss', module:'Inventory', desc:'Inventory P&L', label_de:'Lager - GuV', label_fr:'Stock - P&L' },
  { value:'Sales - COGS', label:'Sales - COGS', module:'Sales and marketing', desc:'Cost of goods sold', label_de:'Verkauf - HK', label_fr:'Ventes - COGS' },
];

const initialQuestions: Question[] = [
  { id:'q1', no:1, module:'General Ledger', question:'How do you define fiscal calendar?', type:'Text', why:'To setup fiscal periods correctly', impact:'Affects closing and reporting', businessArea:'General Ledger > Fiscal Calendars', navPath:'Organization administration > Organizations > Legal entities', fitGap:'Fit', textValue:'Calendar from April to March', radioOptions:[], attachmentName:null, integration:{formName:'FiscalCal',fieldName:'FiscalYear',tableName:'FiscalCalendar',menuItem:'FiscalCalendars',dataEntity:'FiscalCalEnt',odataEntity:'FiscalCalendar',configKey:'LedgerBasic'} },
  { id:'q2', no:2, module:'General Ledger', question:'Approval workflow for journals?', type:'Workflow', why:'Control posting authorization', impact:'Segregation of duties required', businessArea:'GL > Journal Approvals', navPath:'General ledger > Journal setup > Journal approval', fitGap:'GAP', textValue:'Need 2 level approval for amounts >10k', radioOptions:[], attachmentName:'approval_matrix.xlsx', integration:{formName:'LedgerJournal',fieldName:'Workflow',tableName:'LedgerJournalTable',menuItem:'GeneralJournal',dataEntity:'LedgerJournal',odataEntity:'LedgerJournals',configKey:'Ledger'} },
  { id:'q3', no:3, module:'Accounts Payable', question:'Vendor payment method?', type:'RadioButton', why:'Determine payment processing', impact:'Bank integration complexity', businessArea:'AP > Payments', navPath:'AP > Setup > Payment methods', fitGap:'Fit', textValue:'', radioOptions:[{code:'01',desc:'Check'},{code:'02',desc:'Electronic'},{code:'03',desc:'Wire'}], attachmentName:null, integration:{formName:'VendPay',fieldName:'PaymMode',tableName:'VendTable',menuItem:'Vendors',dataEntity:'VendorEnt',odataEntity:'Vendors',configKey:'AP'} },
  { id:'q4', no:4, module:'Inventory', question:'Inventory valuation method?', type:'RadioButton', why:'Impacts costing', impact:'Financial reporting', businessArea:'Inventory > Costing', navPath:'Inventory management > Setup > Inventory model groups', fitGap:'Partial Fit', textValue:'', radioOptions:[{code:'01',desc:'FIFO'},{code:'02',desc:'LIFO'},{code:'03',desc:'Weighted Avg'}], attachmentName:null, integration:{formName:'InventModel',fieldName:'ModelGroup',tableName:'InventTable',menuItem:'Items',dataEntity:'InventItem',odataEntity:'InventItems',configKey:'Invent'} },
  { id:'q5', no:5, module:'Procurement', question:'Requisition approval threshold?', type:'Text', why:'Control procurement spend', impact:'Budget overrun risk', businessArea:'Procurement > Requisitions', navPath:'Procurement > Setup > Approval', fitGap:'Customization', textValue:'Threshold at 5000 USD', radioOptions:[], attachmentName:null, integration:{formName:'PurchReq',fieldName:'Amount',tableName:'PurchReqTable',menuItem:'PurchReq',dataEntity:'PurchReqEnt',odataEntity:'PurchReq',configKey:'Purch'} },
  { id:'q6', no:6, module:'Sales and marketing', question:'Sales order workflow needed?', type:'Workflow', why:'Sales credit check', impact:'Revenue leakage', businessArea:'Sales > Order workflow', navPath:'Sales and marketing > Setup > Workflow', fitGap:'Fit', textValue:'Credit hold workflow', radioOptions:[], attachmentName:null, integration:{formName:'SalesTable',fieldName:'Workflow',tableName:'SalesTable',menuItem:'SalesOrders',dataEntity:'SalesOrder',odataEntity:'SalesOrders',configKey:'Sales'} },
  { id:'q7', no:7, module:'Warehouse management', question:'Wave template strategy?', type:'Text', why:'Optimize picking', impact:'Warehouse efficiency', businessArea:'WMS > Waves', navPath:'Warehouse > Setup > Wave templates', fitGap:'GAP', textValue:'Cluster picking required', radioOptions:[], attachmentName:null, integration:{formName:'WHSWave',fieldName:'Template',tableName:'WHSWaveTable',menuItem:'WaveTempl',dataEntity:'WHSWaveEnt',odataEntity:'WHSWave',configKey:'WHS'} },
  { id:'q8', no:8, module:'Production control', question:'Production order costing?', type:'RadioButton', why:'Manufacturing costing', impact:'COGS accuracy', businessArea:'Production > Costing', navPath:'Production > Setup > Costing', fitGap:'Fit', textValue:'', radioOptions:[{code:'STD',desc:'Standard'},{code:'ACT',desc:'Actual'}], attachmentName:null, integration:{formName:'ProdTable',fieldName:'Costing',tableName:'ProdTable',menuItem:'ProdOrders',dataEntity:'ProdEnt',odataEntity:'ProdOrders',configKey:'Prod'} },
  { id:'q9', no:9, module:'Fixed Assets', question:'Depreciation books count?', type:'Text', why:'Asset accounting', impact:'Compliance', businessArea:'Fixed Assets > Books', navPath:'Fixed assets > Setup > Books', fitGap:'Fit', textValue:'2 books - Tax and IFRS', radioOptions:[], attachmentName:null, integration:{formName:'AssetBook',fieldName:'Book',tableName:'AssetBook',menuItem:'AssetBooks',dataEntity:'AssetBookEnt',odataEntity:'AssetBooks',configKey:'Asset'} },
  { id:'q10', no:10, module:'Project management', question:'Project billing type?', type:'RadioButton', why:'Revenue recognition', impact:'Project accounting', businessArea:'Project > Billing', navPath:'Project > Setup > Billing', fitGap:'Partial Fit', textValue:'', radioOptions:[{code:'T&M',desc:'Time and Material'},{code:'FP',desc:'Fixed Price'}], attachmentName:null, integration:{formName:'ProjTable',fieldName:'Billing',tableName:'ProjTable',menuItem:'Projects',dataEntity:'ProjEnt',odataEntity:'Projects',configKey:'Project'} },
  { id:'q11', no:11, module:'Human resources', question:'Leave approval workflow?', type:'Workflow', why:'HR compliance', impact:'Employee satisfaction', businessArea:'HR > Leave', navPath:'Human resources > Setup > Workflow', fitGap:'GAP', textValue:'Manager + HR approval', radioOptions:[], attachmentName:'leave_policy.pdf', integration:{formName:'HcmLeave',fieldName:'Workflow',tableName:'HcmLeaveTable',menuItem:'LeaveReq',dataEntity:'HcmLeaveEnt',odataEntity:'HcmLeave',configKey:'HCM'} },
  { id:'q12', no:12, module:'Accounts Receivable', question:'Customer credit limit check?', type:'RadioButton', why:'Credit risk', impact:'Bad debts', businessArea:'AR > Credit', navPath:'AR > Setup > Credit management', fitGap:'Fit', textValue:'', radioOptions:[{code:'01',desc:'None'},{code:'02',desc:'Warning'},{code:'03',desc:'Block'}], attachmentName:null, integration:{formName:'CustTable',fieldName:'Credit',tableName:'CustTable',menuItem:'Customers',dataEntity:'CustEnt',odataEntity:'Customers',configKey:'AR'} },
  { id:'q13', no:13, module:'General Ledger', question:'Intercompany accounting needed?', type:'Text', why:'Multi-entity setup', impact:'Reconciliation effort', businessArea:'GL > Intercompany', navPath:'GL > Setup > Intercompany', fitGap:'Customization', textValue:'Yes - 3 legal entities', radioOptions:[], attachmentName:null, integration:{formName:'InterCompany',fieldName:'InterCo',tableName:'Ledger',menuItem:'InterCompany',dataEntity:'LedgerEnt',odataEntity:'Ledger',configKey:'Ledger'} },
  { id:'q14', no:14, module:'Inventory', question:'Batch tracking required?', type:'Workflow', why:'Traceability', impact:'Quality compliance', businessArea:'Inventory > Batches', navPath:'Inventory > Setup > Tracking', fitGap:'Fit', textValue:'Batch mandatory for Pharma', radioOptions:[], attachmentName:null, integration:{formName:'InventBatch',fieldName:'Batch',tableName:'InventBatch',menuItem:'Batches',dataEntity:'InventBatchEnt',odataEntity:'InventBatch',configKey:'Invent'} },
  { id:'q15', no:15, module:'Procurement', question:'Vendor evaluation criteria?', type:'Text', why:'Vendor quality', impact:'Procurement risk', businessArea:'Procurement > Vendors', navPath:'Procurement > Vendors > Evaluation', fitGap:'Partial Fit', textValue:'Quality, Delivery, Cost', radioOptions:[], attachmentName:null, integration:{formName:'VendEval',fieldName:'Criteria',tableName:'VendTable',menuItem:'VendEval',dataEntity:'VendEvalEnt',odataEntity:'VendEval',configKey:'Vend'} },
];

const initialPostings: PostingProfile[] = [
  { id:'p1', module:'General Ledger', accType:'Summary', code:'GL-SUM-001', mainAccount:'100000', desc:'Cash Summary', explanation:'Consolidates all cash accounts to avoid customer explanation', ledger:'USMF', postingType:'Ledger' },
  { id:'p2', module:'Accounts Payable', accType:'Posting', code:'AP-POST-001', mainAccount:'200100', desc:'Vendor Balance', explanation:'Maps AP trade to main account', ledger:'USMF', postingType:'Vendor balance' },
  { id:'p3', module:'Inventory', accType:'Posting', code:'INV-POST-002', mainAccount:'140100', desc:'Inventory Issue', explanation:'Posting for inventory transactions', ledger:'USMF', postingType:'Inventory - Issue' },
  { id:'p4', module:'Accounts Receivable', accType:'Posting', code:'AR-POST-001', mainAccount:'300100', desc:'Customer Balance', explanation:'AR posting profile', ledger:'USMF', postingType:'Customer balance' },
  { id:'p5', module:'Sales and marketing', accType:'Posting', code:'SALES-REV-001', mainAccount:'500100', desc:'Sales Revenue Domestic', explanation:'Revenue recognition', ledger:'USMF', postingType:'Sales - Revenue' },
];

const initialWorkflows: WorkflowDef[] = [
  { id:'w1', name:'Journal Approval - GL', module:'General Ledger', wType:'Approval', approver:'Finance Manager', condition:'Amount > 10000', escalation:'CFO after 2 days', notification:'Email + Teams' },
  { id:'w2', name:'Purch Req Review', module:'Procurement', wType:'Review', approver:'Procurement Manager', condition:'Category = CAPEX', escalation:'None', notification:'Email' },
];

const initialParams: ParamFastTab[] = [
  { id:'ft1', title:'General', module:'General Ledger', fields:[{id:'f1', name:'Fiscal calendar', importance:'Critical - Determines period closing logic'},{id:'f2', name:'Exchange rate type', importance:'High - Multi-currency handling'}] },
  { id:'ft2', title:'Number sequences', module:'General Ledger', fields:[{id:'f3', name:'Journal voucher number', importance:'Mandatory for audit trail'}] },
  { id:'ft3', title:'Ledger', module:'General Ledger', fields:[{id:'f4', name:'Chart of accounts', importance:'Core structure'}] },
  { id:'ft4', title:'Accounts payable parameters', module:'Accounts Payable', fields:[{id:'f5', name:'Vendor posting profile validation', importance:'Prevents posting errors'}] },
];

const initialCompanies: Company[] = [
  { id:'c1', code:'USMF', name:'Contoso Entertainment System USA', address:'1234 Contoso Blvd, Seattle, WA 98101', summary:'Leading entertainment company implementing D365 F&O for finance and operations transformation. 3 legal entities, multi-currency, intercompany.', createdDate:'2024-01-15', status:'Active', ledger:'USMF' },
  { id:'c2', code:'DEMF', name:'Contoso DE - Germany', address:'Friedrichstrasse 123, Berlin, 10117', summary:'German legal entity for EU operations, IFRS compliance, local tax requirements.', createdDate:'2024-02-10', status:'Active', ledger:'DEMF' },
  { id:'c3', code:'INMF', name:'Contoso India - Mumbai', address:'Bandra Kurla Complex, Mumbai, 400051', summary:'India operations, GST compliance, TDS handling.', createdDate:'2024-03-05', status:'Active', ledger:'INMF' },
];
const initialRoles: RoleDef[] = [
  { id:'r1', name:'EP_FinanceConsultant', createdBy:'Alex Kim', createdDate:'2024-01-20', summary:'Full consultant access except customer delete', permissions:{ 'Questionnaire':{edit:true, del:false, view:true}, 'Summary & Posting profile':{edit:true, del:true, view:true}, 'Workflow':{edit:true, del:true, view:true}, 'Parameter forms':{edit:true, del:true, view:true}, 'Integration section':{edit:true, del:true, view:true} } },
  { id:'r2', name:'EP_CustomerFinance', createdBy:'Priya Shah', createdDate:'2024-02-01', summary:'Customer view - edit only', permissions:{ 'Questionnaire':{edit:true, del:false, view:true}, 'Summary & Posting profile':{edit:true, del:false, view:true}, 'Workflow':{edit:true, del:false, view:true}, 'Parameter forms':{edit:true, del:false, view:true}, 'Integration section':{edit:false, del:false, view:false} } },
];
const initialCoaLines: CoaLine[] = [
  { id:'coa1', mainAccount:'100000', accountName:'Cash Summary', accType:'Asset', department:'002', costCenter:'CC100', active:true, postingCombo:'100000-002-CC100' },
  { id:'coa2', mainAccount:'200100', accountName:'Vendor Balance AP', accType:'Liability', department:'007', costCenter:'CC100', active:true, postingCombo:'200100-007-CC100' },
  { id:'coa3', mainAccount:'500100', accountName:'Sales Revenue - Domestic', accType:'Revenue', department:'001', costCenter:'CC200', active:true, postingCombo:'500100-001-CC200' },
];

// --- Low-Code Factory Isolated Types (does not disturb existing types) ---
type CustomizationType = 'Table' | 'Form Extension' | 'Class Extension' | 'SSRS Report' | 'Full Module';
type EDTType = 'String' | 'Int' | 'Date' | 'Enum' | 'Real' | 'Boolean';
interface LCField { id: string; name: string; edt: EDTType; mandatory: boolean; relation: string; }
interface LowCodeReq {
  id: string;
  title: string;
  plainEnglish: string;
  custType: CustomizationType;
  fields: LCField[];
  logic: string;
  parentForm: string;
  fastTab: string;
  // SSRS specifics
  reportTitle: string;
  filters: string[];
  groupBy: string;
  chartType: 'Bar' | 'Pie' | 'Both' | 'None';
  conditionalFormat: string;
}
interface GeneratedCodePackage {
  tables: string;
  forms: string;
  classes: string;
  security: string;
  ssrs: { dp: string; contract: string; tmp: string; rdl: string; layoutDesc: string; };
  properties: string;
  packageStructure: string[];
}
interface DryRunResult { id: string; check: string; status: 'OK' | 'WARN' | 'FAIL'; msg: string; }

export default function App() {
  const [activeTab, setActiveTab] = useState<'Questionnaire'|'Posting'|'Workflow'|'Parameters'|'System Admin'|'AI Features'|'Version Control'|'Low-Code Factory'>('Questionnaire');
  const [role, setRole] = useState<'Consultant' | 'Customer'>('Consultant');
  const [moduleFilter, setModuleFilter] = useState<ModuleName | 'All'>('All');
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [selectedQId, setSelectedQId] = useState<string>('q1');
  const [postings, setPostings] = useState<PostingProfile[]>(initialPostings);
  const [selectedPostId, setSelectedPostId] = useState<string>('p1');
  const [workflows, setWorkflows] = useState<WorkflowDef[]>(initialWorkflows);
  const [selectedWfId, setSelectedWfId] = useState<string>('w1');
  const [paramTabs, setParamTabs] = useState<ParamFastTab[]>(initialParams);
  const [selectedParamId, setSelectedParamId] = useState<string>('ft1');
  const [savingState, setSavingState] = useState<'Saved'|'Saving...'|'Draft'>('Saved');
  const [showIntegrationHelp, setShowIntegrationHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [interactionTick, setInteractionTick] = useState(0);
  const [lastAction, setLastAction] = useState('Ready — Questionnaire loaded');
  // Posting form edit-lock & dropdown states
  const [isPostingEdit, setIsPostingEdit] = useState(false);
  const [postingMainSearch, setPostingMainSearch] = useState('');
  const [showMainAccDrop, setShowMainAccDrop] = useState(false);
  const [showPostingTypeDrop, setShowPostingTypeDrop] = useState(false);
  const [postingErrors, setPostingErrors] = useState<{mainAccount?:string, postingType?:string}>({});
  const [lang, setLang] = useState<'EN'|'DE'|'FR'>('EN');
  const mainAccRef = useRef<HTMLDivElement>(null);
  const postTypeRef = useRef<HTMLDivElement>(null);
  const [postingTypeSearch, setPostingTypeSearch] = useState('');

  // Parameters edit/save/delete state — in-memory per persistence boundary
  const [isParamEdit, setIsParamEdit] = useState(false);
  const [isParamDirty, setIsParamDirty] = useState(false);
  const [paramSnapshot, setParamSnapshot] = useState<ParamFastTab[]>(initialParams);
  const [paramVersions, setParamVersions] = useState<{id:string, ts:string, count:number, note:string}[]>([{id:'v1', ts: new Date().toLocaleString(), count: initialParams.reduce((a,b)=>a+b.fields.length,0), note:'Initial import'}]);
  const [toastMsg, setToastMsg] = useState<string|null>(null);
  const [showParamDeleteConfirm, setShowParamDeleteConfirm] = useState(false);
  const [showFieldDeleteConfirm, setShowFieldDeleteConfirm] = useState<{ftId:string, fieldId:string, fieldName:string}|null>(null);
  const [showNewFastTabDialog, setShowNewFastTabDialog] = useState(false);
  const [newFastTabTitle, setNewFastTabTitle] = useState('');
  const [newFastTabModule, setNewFastTabModule] = useState<ModuleName>('General Ledger');
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // System Admin - Companies CRUD
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('c1');
  const [isCompanyEdit, setIsCompanyEdit] = useState(false);
  const [isCompanyDirty, setIsCompanyDirty] = useState(false);
  const [companySnapshot, setCompanySnapshot] = useState<Company[]>(initialCompanies);
  const [showCompanyDeleteConfirm, setShowCompanyDeleteConfirm] = useState<Company|null>(null);
  const [companyCounter, setCompanyCounter] = useState(4);

  // System Admin - Roles CRUD
  const [roles, setRoles] = useState<RoleDef[]>(initialRoles);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('r1');
  const [isRoleEdit, setIsRoleEdit] = useState(false);
  const [isRoleDirty, setIsRoleDirty] = useState(false);
  const [roleSnapshot, setRoleSnapshot] = useState<RoleDef[]>(initialRoles);
  const [showRoleDeleteConfirm, setShowRoleDeleteConfirm] = useState<RoleDef|null>(null);
  const [roleCounter, setRoleCounter] = useState(3);

  // System Admin - COA Builder CRUD
  const [coaLines, setCoaLines] = useState<CoaLine[]>(initialCoaLines);
  const [selectedCoaLineId, setSelectedCoaLineId] = useState<string>('coa1');
  const [isCoaEdit, setIsCoaEdit] = useState(false);
  const [isCoaDirty, setIsCoaDirty] = useState(false);
  const [coaSnapshot, setCoaSnapshot] = useState<CoaLine[]>(initialCoaLines);
  const [showCoaDeleteConfirm, setShowCoaDeleteConfirm] = useState<CoaLine|null>(null);
  const [coaCounter, setCoaCounter] = useState(4);
  const [coaMainSearch, setCoaMainSearch] = useState('');
  const [coaDeptSearch, setCoaDeptSearch] = useState('');
  const [coaCcSearch, setCoaCcSearch] = useState('');
  const [showCoaMainDrop, setShowCoaMainDrop] = useState<string|null>(null);
  const [showCoaDeptDrop, setShowCoaDeptDrop] = useState<string|null>(null);
  const [showCoaCcDrop, setShowCoaCcDrop] = useState<string|null>(null);
  const coaMainRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const coaDeptRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const coaCcRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // AI Features - active demo modal + working demos
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  // TTS
  const [ttsText, setTtsText] = useState('How do you define fiscal calendar? We use April to March calendar for our organization. This determines period closing logic and financial reporting.');
  const [ttsLang, setTtsLang] = useState('en-US');
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [ttsPaused, setTtsPaused] = useState(false);
  const [ttsRate, setTtsRate] = useState(1);
  const ttsUtterRef = useRef<SpeechSynthesisUtterance | null>(null);
  // Functional Videos
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(32); // seconds
  const [videoCaptionOn, setVideoCaptionOn] = useState(true);
  // Walkthrough
  const [walkStep, setWalkStep] = useState(0);
  // Screen Generator
  const [screenGenLoading, setScreenGenLoading] = useState(false);
  const [screenGenVersion, setScreenGenVersion] = useState(1);
  const [screenGenModule, setScreenGenModule] = useState<ModuleName>('General Ledger');
  // Learning mode
  const [learningExpanded, setLearningExpanded] = useState<string>('lesson1');
  const [quizSelected, setQuizSelected] = useState<string | null>(null);
  // Questionnaire Assistant
  const [assistantIndustry, setAssistantIndustry] = useState('Manufacturing');
  const [assistantApplied, setAssistantApplied] = useState(false);
  // UAT
  const [uatFilter, setUatFilter] = useState<'All'|'Fit'|'GAP'|'Partial Fit'>('All');
  // Integration Assistant
  const [integrationThreshold, setIntegrationThreshold] = useState(80);
  // Process flow
  const [processRunning, setProcessRunning] = useState(true);
  // Trainer
  const [trainerRole, setTrainerRole] = useState('Functional Consultant');
  const [trainerCompleted, setTrainerCompleted] = useState<string[]>([]);

  // Version Control - in-memory only, no localStorage per boundary
  const [versions, setVersions] = useState<VersionEntry[]>([
    { id:'v10.0.39', status:'Live', date:'2024-01-15 09:30', user:'Alex Kim', changes:2, note:'Initial Live release - 15 questions, 3 companies, 34 COA accounts' },
    { id:'v10.0.40', status:'Staging', date:'2024-03-20 14:22', user:'Priya Shah', changes:5, note:'Added Posting Type dropdown, COA builder, fiscal calendar integration' },
    { id:'v10.0.41', status:'Draft', date:'2024-03-28 10:15', user:'Alex Kim', changes:8, note:'D365 Integration layer + Metadata repository + Dry-run mode' },
  ]);
  const [selectedVersionId, setSelectedVersionId] = useState('v10.0.39');
  const [versionSnapshots, setVersionSnapshots] = useState<Record<string, any>>({});

  // D365 Metadata Repository - 10 sample rows
  const [metadataRows, setMetadataRows] = useState<MetadataRow[]>([
    { id:'m1', navPath:'Organization administration > Organizations > Legal entities', formName:'OMLegalEntity', tableName:'OMLegalEntity', dataEntity:'LegalEntity', odata:'LegalEntities', menuItem:'OMLegalEntities', module:'General Ledger' },
    { id:'m2', navPath:'General ledger > Fiscal calendars', formName:'FiscalCal', tableName:'FiscalCalendar', dataEntity:'FiscalCalendarEntity', odata:'FiscalCalendars', menuItem:'FiscalCalendars', module:'General Ledger' },
    { id:'m3', navPath:'General ledger > Journal setup > Journal approval', formName:'LedgerJournal', tableName:'LedgerJournalTable', dataEntity:'LedgerJournalEntity', odata:'LedgerJournals', menuItem:'GeneralJournal', module:'General Ledger' },
    { id:'m4', navPath:'Accounts payable > Vendors > All vendors', formName:'VendTable', tableName:'VendTable', dataEntity:'VendorEntity', odata:'Vendors', menuItem:'Vendors', module:'Accounts Payable' },
    { id:'m5', navPath:'Accounts receivable > Customers > All customers', formName:'CustTable', tableName:'CustTable', dataEntity:'CustomerEntity', odata:'Customers', menuItem:'Customers', module:'Accounts Receivable' },
    { id:'m6', navPath:'Inventory management > Setup > Inventory model groups', formName:'InventModel', tableName:'InventTable', dataEntity:'InventItemEntity', odata:'InventItems', menuItem:'Items', module:'Inventory' },
    { id:'m7', navPath:'Procurement and sourcing > Setup > Procurement parameters', formName:'PurchParameters', tableName:'PurchParameters', dataEntity:'PurchParamEntity', odata:'PurchParameters', menuItem:'PurchParameters', module:'Procurement' },
    { id:'m8', navPath:'Warehouse management > Setup > Wave templates', formName:'WHSWave', tableName:'WHSWaveTable', dataEntity:'WHSWaveEntity', odata:'WHSWaveTemplates', menuItem:'WaveTempl', module:'Warehouse management' },
    { id:'m9', navPath:'Fixed assets > Setup > Books', formName:'AssetBook', tableName:'AssetBook', dataEntity:'AssetBookEntity', odata:'AssetBooks', menuItem:'AssetBooks', module:'Fixed Assets' },
    { id:'m10', navPath:'Project management > Setup > Project parameters', formName:'ProjParameters', tableName:'ProjParameters', dataEntity:'ProjParamEntity', odata:'ProjectParameters', menuItem:'ProjParameters', module:'Project management' },
  ]);
  const [selectedMetadataId, setSelectedMetadataId] = useState<string>('m1');
  const [isMetadataEdit, setIsMetadataEdit] = useState(false);
  const [isMetadataDirty, setIsMetadataDirty] = useState(false);
  const [metadataSnapshot, setMetadataSnapshot] = useState<MetadataRow[]>([]);

  // D365 Integration Layer
  const [d365Config, setD365Config] = useState<D365IntegrationCfg>({
    envUrl:'https://usnconeboxax1aos.cloud.onebox.dynamics.com',
    tenantId:'72f988bf-86f1-41af-91ab-2d7cd011db47',
    clientId:'00000000-0000-0000-0000-000000000000',
    odataStatus:'Not Connected',
    entitySync:'Pending',
    dryRun:true
  });
  const [integrationLogs, setIntegrationLogs] = useState<string[]>(['[09:30:00] Safe Mode: Live untouched - Dry Run enabled', '[09:30:15] Version v10.0.39 marked as Live - in-memory']);
  const [testConnLoading, setTestConnLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [selectedPayloadType, setSelectedPayloadType] = useState<'FiscalCalendar'|'Ledger'|'PostingProfile'>('FiscalCalendar');

  // === LOW-CODE FACTORY ISOLATED STATE - does not affect other tabs ===
  const [lcRequirement, setLcRequirement] = useState<LowCodeReq>({
    id: 'lc1',
    title: 'Skill Master',
    plainEnglish: 'Example: Create Skill Master table for HR module.\n\nRequirement: Track employee skills.\n- Skill Code, Skill Name, Category, Proficiency Level, Certified Yes/No, Valid Till date\n- If Certified=Yes, Valid Till mandatory\n- Show in HcmWorker form, FastTab Skills\n- Relation to HcmWorker\n- SSRS Report: Skills by Department, filter by Department and Certified status, group by Category, Bar chart for skill count, Pie chart for certification, red if Valid Till expired\n\nSecond Example: Performance Module + SSRS\n- Table: Performance Review with Employee, Period, Rating, Goals\n- Logic: Rating mandatory, Goals min 3\n- Report: Performance by Department with Bar+Pie, conditional formatting green >80% rating',
    custType: 'Full Module',
    fields: [
      { id:'f1', name:'SkillCode', edt:'String', mandatory:true, relation:'' },
      { id:'f2', name:'SkillName', edt:'String', mandatory:true, relation:'' },
      { id:'f3', name:'Category', edt:'Enum', mandatory:false, relation:'' },
      { id:'f4', name:'ProficiencyLevel', edt:'Int', mandatory:false, relation:'' },
      { id:'f5', name:'Certified', edt:'Boolean', mandatory:false, relation:'' },
      { id:'f6', name:'ValidTill', edt:'Date', mandatory:false, relation:'HcmWorker' },
    ],
    logic: 'If Certified=Yes, Valid Till mandatory\nIf ValidTill < Today(), highlight Red\nProficiencyLevel range 1-5',
    parentForm: 'HcmWorker',
    fastTab: 'Skills',
    reportTitle: 'Employee Skills Report - By Department',
    filters: ['Department', 'Certified'],
    groupBy: 'Category',
    chartType: 'Both',
    conditionalFormat: 'If ValidTill < Today() => Background Red; If Proficiency >=4 => Green; Rating >80% => Green else Orange'
  });
  const [lcCodeTab, setLcCodeTab] = useState<'Tables'|'Forms'|'Classes'|'Security'|'SSRS'>('Tables');
  const [lcGenerated, setLcGenerated] = useState<GeneratedCodePackage | null>(null);
  const [lcDryRun, setLcDryRun] = useState<DryRunResult[]>([]);
  const [lcIsGenerating, setLcIsGenerating] = useState(false);
  const [lcStagingVersion, setLcStagingVersion] = useState('v10.0.42');
  const [lcShowRollbackConfirm, setLcShowRollbackConfirm] = useState(false);
  // === LICENSE & MULTI-CUSTOMER MANAGEMENT STATE ===
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo>({
    plan:'Enterprise',
    consultants:50,
    customers:500,
    validity:'2025-12-31',
    env:'UAT',
    maxCustomers:100,
    usedCustomers:3
  });
  const [managedCustomers, setManagedCustomers] = useState<ManagedCustomer[]>([
    { id:'mc1', code:'CONTOSO-USMF', name:'Contoso Entertainment System USA', legalEntity:'USMF', modules:['General Ledger','Accounts Payable','Accounts Receivable','Inventory','Fixed Assets'], extraModules:[], status:'Active', userCount:12, sharedLink:'https://ep-erp.com/c/CONTOSO-USMF?view=customer&modules=GL,AP,AR,INV,FA', expiry:'2025-06-30', canEdit:true, canSeeFRD:true, password:'', templateId:'tpl-fin' },
    { id:'mc2', code:'FABRIKAM-MFG', name:'Fabrikam Manufacturing Ltd', legalEntity:'FABM', modules:['Production control','Inventory','Procurement'], extraModules:['Master planning','Cost management'], status:'Active', userCount:8, sharedLink:'https://ep-erp.com/c/FABRIKAM-MFG?view=customer&modules=PROD,INV,PROC,MP', expiry:'2025-08-15', canEdit:true, canSeeFRD:false, templateId:'tpl-mfg' },
    { id:'mc3', code:'ADVENTURE-RETAIL', name:'Adventure Works Retail', legalEntity:'AWRT', modules:['Sales and marketing','Inventory','Warehouse management'], extraModules:[], status:'Active', userCount:15, sharedLink:'https://ep-erp.com/c/ADVENTURE-RETAIL?view=customer&modules=SALES,INV,WHS', expiry:'2025-07-20', canEdit:false, canSeeFRD:true, templateId:'tpl-retail' },
  ]);
  const [selectedManagedCustomerId, setSelectedManagedCustomerId] = useState<string>('mc1');
  const [activeCustomerContextId, setActiveCustomerContextId] = useState<string>('mc1');
  const [showShareModal, setShowShareModal] = useState<ManagedCustomer | null>(null);
  const [showManageModulesModal, setShowManageModulesModal] = useState<ManagedCustomer | null>(null);
  const [manageModulesSelection, setManageModulesSelection] = useState<{mods: ModuleName[], extra: string[], templateId: string}>({mods:[], extra:[], templateId:''});
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState<{code:string, name:string, legal:string, templateId:string, mods: ModuleName[], extra: string[], users:number}>({code:'', name:'', legal:'', templateId:'tpl-fin', mods:['General Ledger','Accounts Payable','Accounts Receivable','Fixed Assets'], extra:[], users:5});
  const [licenseTabView, setLicenseTabView] = useState<'overview'|'customers'|'templates'>('customers');
  // --- Helpers for Low-Code Factory (isolated, no side effects) ---
  const lcGenerateCodes = () => {
    setLcIsGenerating(true);
    setLastAction(`Low-Code Factory: Generating ${lcRequirement.custType} for ${lcRequirement.title} — staging only`);
    setTimeout(()=>{
      const tableName = `EP_${lcRequirement.title.replace(/\s+/g,'')}`;
      const fieldsXpp = lcRequirement.fields.map(f=>`        ${f.name} ${f.edt} ${f.mandatory?'// Mandatory':''} ${f.relation?`// Relation ${f.relation}`:''}`).join('\n');
      const pkg: GeneratedCodePackage = {
        tables: `// ${tableName} Table - Extension pattern, no overlayering\n[TableName('${tableName}')]\npublic final class ${tableName} extends common\n{\n    // Fields from Requirement Builder\n${lcRequirement.fields.map(f=>{
          const typeMap: Record<string,string> = { String:'str', Int:'int', Date:'date', Enum:'NoYes', Real:'real', Boolean:'boolean' };
          return `    [SysName('${f.name}'), Mandatory(${f.mandatory ? 'Yes' : 'No'})]\n    public ${typeMap[f.edt]||'str'} ${f.name};${f.relation?` // EDT relation to ${f.relation}`:''}`;
        }).join('\n')}\n    // Relations\n    [Relation(RecId)]\n    public HcmWorkerRecId hcmWorker;\n    // Delete Actions: Restricted\n    // Properties: AllowEdit Yes, Visible Yes\n    // Indexes: Primary - ${lcRequirement.fields[0]?.name || 'SkillCode'}\n}\n\n// Table Extension for HcmWorker\n[ExtensionOf(tableStr(HcmWorker))]\nfinal class HcmWorker_${lcRequirement.title.replace(/\s+/g,'')}_Ext\n{\n    // New fields linked via relation\n    // Display method for Skill count\n}`,
        forms: `// Form Extension: ${lcRequirement.parentForm} - ${lcRequirement.fastTab} FastTab\n[ExtensionOf(formStr(${lcRequirement.parentForm}))]\nfinal class ${lcRequirement.parentForm}_${lcRequirement.title.replace(/\s+/g,'')}_FormExt\n{\n    // FastTab: ${lcRequirement.fastTab}\n    // Group: ${lcRequirement.title}\n    // Properties:\n    //  AllowEdit: Yes\n    //  Visible: Yes\n    //  DeleteActions: Restricted\n    //  TitleDatasource: HcmWorker\n    // Controls:\n${lcRequirement.fields.map(f=>`    //  Control: ${f.name} - ${f.edt} - EDT: ${f.name}EDT - Mandatory:${f.mandatory}\n    //   Properties: AllowEdit Yes, Visible Yes, Skip No`).join('\n')}\n    // Logic from builder:\n    // ${lcRequirement.logic.split('\n').join('\n    // ')}\n    public void init()\n    {\n        super();\n        // Conditional visibility\n        // if (Certified == Yes) ValidTill.mandatory(true);\n    }\n}`,
        classes: `// Class Extension - Validation & Business Logic\n// Model: EP_Custom\n[ExtensionOf(classStr(HcmWorker))]\nfinal class HcmWorkerValidation_${lcRequirement.title.replace(/\s+/g,'')}_Ext\n{\n    // Validation logic: ${lcRequirement.logic}\n    public boolean validateWrite()\n    {\n        boolean ret = super();\n        if (${lcRequirement.fields.find(f=>f.name.toLowerCase().includes('certified'))?.name || 'Certified'} == NoYes::Yes && !${lcRequirement.fields.find(f=>f.name.toLowerCase().includes('valid'))?.name || 'ValidTill'})\n        {\n            ret = checkFailed(strFmt(\"@SYS : If Certified=Yes, Valid Till mandatory\"));\n        }\n        // Proficiency range 1-5\n        if (${lcRequirement.fields.find(f=>f.name.toLowerCase().includes('proficiency'))?.name || 'ProficiencyLevel'} < 1 || ${lcRequirement.fields.find(f=>f.name.toLowerCase().includes('proficiency'))?.name || 'ProficiencyLevel'} > 5)\n        {\n            ret = checkFailed(\"Proficiency must be 1-5\");\n        }\n        return ret;\n    }\n}\n\n// Helper class\npublic class ${tableName}Helper\n{\n    public static void updateWorkerSkills(HcmWorkerRecId _workerRecId)\n    {\n        // Business logic isolated\n    }\n}`,
        security: `// Security - Duties & Privileges - Model EP_Custom\n// Duty: ${lcRequirement.title} Maintain\n// Privilege: ${lcRequirement.title} Table Maintain\n// Permissions: ${tableName} - Full control\n// Role: HR Manager gets access\n// Properties:\n//  Label: ${lcRequirement.title}\n//  Visible: Yes\n//  AccessLevel: Update\n//  DeleteActions: None\n// MenuItem: ${tableName}MenuItem - Display\n//  Properties: Label ${lcRequirement.title}, Visible Yes`,
        ssrs: {
          dp: `// SSRS Data Provider - ${lcRequirement.reportTitle}\npublic class ${tableName}DP extends SRSReportDataProviderBase\n{\n    [SRSReportDataSetAttribute(tableStr(${tableName}Tmp))]\n    public ${tableName}Tmp getTmp()\n    {\n        // Filters: ${lcRequirement.filters.join(', ')}\n        // GroupBy: ${lcRequirement.groupBy}\n        return tmp;\n    }\n    public void processReport()\n    {\n        // Logic: Fetch ${tableName} joined HcmWorker\n        // Where Department in (${lcRequirement.filters.join(', ')})\n        // Group By ${lcRequirement.groupBy}\n    }\n}`,
          contract: `// SSRS Contract - Parameters\n[DataContractAttribute]\npublic class ${tableName}Contract extends SrsReportDataContractBase\n{\n    // Report Title: ${lcRequirement.reportTitle}\n    // Filters: ${lcRequirement.filters.map(f=>`[DataMember, SysOperationLabel('${f}')] public ${f} ${f};`).join('\\n    // ')}\n    // Group By: ${lcRequirement.groupBy}\n    // Chart Type: ${lcRequirement.chartType}\n    // Conditional Format: ${lcRequirement.conditionalFormat}\n}`,
          tmp: `// SSRS Temp Table - ${tableName}Tmp\n[TableName('${tableName}Tmp')]\npublic class ${tableName}Tmp extends TmpBase\n{\n    public HcmWorkerRecId worker;\n    public str department;\n    public str skillName;\n    public int proficiency;\n    public NoYes certified;\n    public date validTill;\n    // Aggregations for chart\n    public int totalSkills;\n    public int certifiedCount;\n}`,
          rdl: `<Report xmlns="http://schemas.microsoft.com/sqlserver/reporting/2016/01/reportdefinition">\n  <DataSets><DataSet Name="${tableName}DS"><Query><DataSourceName>D365</DataSourceName><CommandText>SELECT Department, Category, COUNT(*) as Count, AVG(Proficiency) as AvgProf</CommandText></Query></DataSet></DataSets>\n  <ReportSections><ReportSection><Body>\n    <!-- Header with Logo -->\n    <Textbox Name="Title">${lcRequirement.reportTitle}</Textbox>\n    <Image Name="Logo">Contoso_Logo</Image>\n    <!-- Tablix Grouped by ${lcRequirement.groupBy} -->\n    <Tablix Name="DeptGroup">\n      <TablixRowHierarchy><TablixMember><Group Name="DepartmentGroup"><GroupExpressions><GroupExpression>=Fields!Department.Value</GroupExpression></GroupExpressions></Group>\n      </TablixMember></TablixRowHierarchy>\n      <!-- Conditional Formatting: ${lcRequirement.conditionalFormat} -->\n      <Style><BackgroundColor>=IIF(Fields!ValidTill.Value < Today(), \"#FDE7E9\", IIF(Fields!Proficiency.Value>=4, \"#DFF6DD\", \"White\"))</BackgroundColor></Style>\n    </Tablix>\n    <!-- Charts: ${lcRequirement.chartType} -->\n    ${lcRequirement.chartType==='Bar'||lcRequirement.chartType==='Both'?'<Chart Name="BarChart"><Type>Bar</Type><Category>=Fields!Category.Value</Category><Values>=Count(Fields!SkillName.Value)</Values></Chart>':''}\n    ${lcRequirement.chartType==='Pie'||lcRequirement.chartType==='Both'?'<Chart Name="PieChart"><Type>Pie</Type><Category>=Fields!Certified.Value</Category><Values>=Count</Values></Chart>':''}\n  </Body></ReportSection></ReportSections>\n</Report>`,
          layoutDesc: `Report Mock Layout for ${lcRequirement.reportTitle}:\nHeader: Contoso Logo left, Title "${lcRequirement.reportTitle}" center, Date right, filters: ${lcRequirement.filters.join(', ')}\nBody:\n- Group Header: Department (bold, background #F3F2F1)\n  - Columns: Employee | ${lcRequirement.fields.map(f=>f.name).join(' | ')} | Status\n  - Rows: For each employee, list skills, Conditional colors:\n    * ${lcRequirement.conditionalFormat}\n- Footer Aggregations: Total Skills per Department, Avg Proficiency\n- Charts Section (bottom):\n  * ${lcRequirement.chartType==='Both'?'Left: Bar chart - Skills by Category (count), Right: Pie chart - Certified vs Non-Certified': lcRequirement.chartType==='Bar'?'Bar chart - Skills by Category': lcRequirement.chartType==='Pie'?'Pie chart - Certified distribution':'No chart'}\n- Footer: Page numbers, Generated by EP_Custom model`
        },
        properties: `Properties that will be set (no overlayering):\n- Table ${tableName}: AllowEdit Yes, Visible Yes, DeleteActions Restricted, CacheLookup EntireTable\n- Form ${lcRequirement.parentForm} Extension: FastTab ${lcRequirement.fastTab} - AllowEdit Yes, Visible Yes, TitleDS HcmWorker\n- Controls: ${lcRequirement.fields.map(f=>`${f.name}: AllowEdit Yes, Visible Yes, Mandatory ${f.mandatory}, EDT ${f.edt}`).join(', ')}\n- Class: ValidateWrite override, no overlayering - extension only\n- Security: MenuItem Display - Visible Yes, Label ${lcRequirement.title}\n- SSRS: DP Class - SRSReportDataProviderBase, Contract - DataContract, Tmp - InMemory, RDL - Precision layout with conditional formatting\n- Model: EP_Custom - Layer ISV, No Sys overlayering`,
        packageStructure: [
          `Model: EP_Custom [${lcStagingVersion} - Staging]`,
          `├─ Tables: ${tableName} (new), HcmWorker_${lcRequirement.title.replace(/\s+/g,'')}_Ext (extension)`,
          `├─ Forms: ${lcRequirement.parentForm} - FastTab ${lcRequirement.fastTab} (extension)`,
          `├─ Classes: HcmWorkerValidation_${lcRequirement.title.replace(/\s+/g,'')}_Ext, ${tableName}Helper, ${tableName}DP, ${tableName}Contract`,
          `├─ Tmp Tables: ${tableName}Tmp`,
          `├─ SSRS: ${tableName}Report (RDL), ${tableName}DP, ${tableName}Contract`,
          `├─ Security: ${lcRequirement.title}Maintain Duty, ${lcRequirement.title} Privilege, MenuItem ${tableName}MenuItem`,
          `├─ Labels: @EP:${lcRequirement.title.replace(/\s+/g,'')} - ${lcRequirement.title}`,
          `└─ Deployable Package: EP_Custom_${lcStagingVersion}_Staging.zip - Ready for DevOps, NOT auto-deployed`
        ]
      };
      setLcGenerated(pkg);
      setLcIsGenerating(false);
      setToastMsg(`Code generated for ${lcRequirement.title} — Staging ${lcStagingVersion} — Safe Mode`);
      setIntegrationLogs(prev=>[...prev, `[${new Date().toLocaleTimeString()}] Low-Code Factory Generated ${lcRequirement.custType} - ${lcRequirement.title} -> ${lcStagingVersion} Staging`]);
    }, 900);
  };
  const lcRunDryRun = () => {
    const checks: DryRunResult[] = [
      { id:'1', check:'Table relation valid', status:'OK', msg:`Relation ${lcRequirement.fields.find(f=>f.relation)?.relation || 'HcmWorker'} exists - RecId validated` },
      { id:'2', check:'Form extension valid', status:'OK', msg:`Parent Form ${lcRequirement.parentForm} exists - no overlayering, extension pattern OK` },
      { id:'3', check:'No overlayering', status:'OK', msg:'All customizations use ExtensionOf, no Sys layer modification' },
      { id:'4', check:'EDT types valid', status:'OK', msg:`EDTs ${lcRequirement.fields.map(f=>f.edt).join(', ')} mapped - String->str, Date->date etc` },
      { id:'5', check:'Mandatory validation', status: lcRequirement.fields.some(f=>f.mandatory)?'OK':'WARN', msg: lcRequirement.fields.some(f=>f.mandatory)?'Mandatory fields defined':'No mandatory field - consider at least one' },
      { id:'6', check:'SSRS DP Contract Tmp pattern', status: (lcRequirement.custType==='SSRS Report'||lcRequirement.custType==='Full Module')?'OK':'WARN', msg: (lcRequirement.custType==='SSRS Report'||lcRequirement.custType==='Full Module')?`Report ${lcRequirement.reportTitle} - DP/Contract/Tmp/RDL pattern valid`:'Not SSRS type - skipped' },
      { id:'7', check:'Model EP_Custom exists', status:'OK', msg:`Model EP_Custom ${lcStagingVersion} - Layer ISV - deployable package ready` },
      { id:'8', check:'Security artifacts', status:'OK', msg:'Duty/Privilege/MenuItem - no conflict with existing roles' },
      { id:'9', check:'Conditional formatting valid', status: lcRequirement.conditionalFormat ? 'OK' : 'WARN', msg: lcRequirement.conditionalFormat || 'No conditional formatting defined' },
    ];
    setLcDryRun(checks);
    setLastAction(`Dry Run Validate - ${checks.filter(c=>c.status==='OK').length}/${checks.length} OK - Staging only`);
    setToastMsg(`Dry Run: ${checks.filter(c=>c.status==='OK').length} OK, ${checks.filter(c=>c.status==='WARN').length} warnings - Safe`);
  };
  const lcHandlePromote = () => {
    setToastMsg(`Promote disabled - Will generate deployable package for DevOps - Does not auto-deploy to D365 - Staging ${lcStagingVersion}`);
    setLastAction(`Promote to Live requested - blocked: Generates deployable package EP_Custom_${lcStagingVersion}.zip - No auto-deploy - Safe Mode`);
  };
  const lcHandleRollback = () => {
    setLcGenerated(null);
    setLcDryRun([]);
    setLcShowRollbackConfirm(false);
    setLastAction(`Rollback - Cleared staging ${lcStagingVersion} - Live untouched`);
    setToastMsg(`Rollback - Staging ${lcStagingVersion} cleared - Live untouched - Safe Mode`);
  };
  // === LICENSE & CUSTOMER MANAGEMENT HELPERS ===
  const activeManagedCustomer = managedCustomers.find(c=>c.id===activeCustomerContextId) || managedCustomers[0];
  const selectedManagedCustomer = managedCustomers.find(c=>c.id===selectedManagedCustomerId) || managedCustomers[0];
  const isConsultant = role==='Consultant';
  // Dynamic modules based on active customer context
  const customerSubscribedModules: ModuleName[] = activeManagedCustomer ? activeManagedCustomer.modules : MODULES;
  const effectiveModuleFilterList: ModuleName[] = isConsultant ? MODULES : customerSubscribedModules;
  // For questionnaire filtering
  const getQuestionsForCustomer = () => {
    if(isConsultant) return questions;
    // Customer view: filter by subscribed modules
    return questions.filter(q=> customerSubscribedModules.includes(q.module));
  };
  const filteredQuestionsByCustomer = moduleFilter==='All'
    ? (isConsultant ? questions : questions.filter(q=> customerSubscribedModules.includes(q.module)))
    : questions.filter(q=> q.module===moduleFilter && (isConsultant || customerSubscribedModules.includes(q.module as ModuleName)));
  // License helpers
  const handleAddManagedCustomer = () => {
    if(!newCustomerForm.code.trim() || !newCustomerForm.name.trim()){
      setToastMsg('Customer Code and Name required');
      return;
    }
    const newId='mc'+Date.now();
    const link=`https://ep-erp.com/c/${newCustomerForm.code}?view=customer&modules=${newCustomerForm.mods.map(m=>m.split(' ')[0].toUpperCase()).join(',')}`;
    const nm: ManagedCustomer = {
      id:newId,
      code:newCustomerForm.code.toUpperCase(),
      name:newCustomerForm.name,
      legalEntity:newCustomerForm.legal || newCustomerForm.code.toUpperCase(),
      modules:newCustomerForm.mods,
      extraModules:newCustomerForm.extra,
      status:'Active',
      userCount:newCustomerForm.users,
      sharedLink:link,
      expiry:new Date(Date.now()+90*24*60*60*1000).toISOString().slice(0,10),
      canEdit:true,
      canSeeFRD:true,
      templateId:newCustomerForm.templateId
    };
    setManagedCustomers([...managedCustomers, nm]);
    setSelectedManagedCustomerId(newId);
    setActiveCustomerContextId(newId);
    setShowAddCustomerModal(false);
    setLicenseInfo(prev=>({...prev, usedCustomers: prev.usedCustomers+1}));
    setLastAction(`Added customer ${nm.code} with ${nm.modules.length} modules + ${nm.extraModules.length} extra - Template ${nm.templateId}`);
    setToastMsg(`Customer ${nm.code} added - Share link generated`);
    setInteractionTick(t=>t+1);
    setNewCustomerForm({code:'', name:'', legal:'', templateId:'tpl-fin', mods:['General Ledger','Accounts Payable','Accounts Receivable','Fixed Assets'], extra:[], users:5});
  };
  const handleSaveManageModules = () => {
    if(!showManageModulesModal) return;
    const updated = managedCustomers.map(c=>{
      if(c.id!==showManageModulesModal.id) return c;
      const newLink=`https://ep-erp.com/c/${c.code}?view=customer&modules=${[...manageModulesSelection.mods.map(m=>m.split(' ')[0].toUpperCase()), ...manageModulesSelection.extra.map(e=>e.split(' ')[0].toUpperCase())].join(',')}`;
      return {...c, modules: manageModulesSelection.mods, extraModules: manageModulesSelection.extra, templateId: manageModulesSelection.templateId, sharedLink:newLink};
    });
    setManagedCustomers(updated);
    setShowManageModulesModal(null);
    setLastAction(`Updated modules for ${showManageModulesModal.code} -> ${manageModulesSelection.mods.length} modules`);
    setToastMsg(`Modules updated for ${showManageModulesModal.code}`);
    setInteractionTick(t=>t+1);
  };
  const openManageModules = (cust: ManagedCustomer) => {
    setShowManageModulesModal(cust);
    setManageModulesSelection({mods:cust.modules, extra:cust.extraModules, templateId:cust.templateId||''});
  };
  const applyTemplateToSelection = (tplId: string, target: 'new'|'manage') => {
    const tpl = MODULE_TEMPLATES.find(t=>t.id===tplId);
    if(!tpl) return;
    if(target==='new'){
      setNewCustomerForm({...newCustomerForm, templateId:tplId, mods:tpl.modules, extra:tpl.extra});
    } else {
      setManageModulesSelection({mods:tpl.modules, extra:tpl.extra, templateId:tplId});
    }
    setLastAction(`Applied template ${tpl.name}`);
  };
  const handleGenerateShareLink = (cust: ManagedCustomer) => {
    setShowShareModal(cust);
  };
  const handleCopyShareLink = (link: string) => {
    try{
      navigator.clipboard.writeText(link);
      setToastMsg('Share link copied to clipboard');
    }catch{
      setToastMsg(`Link: ${link} - Copy manually`);
    }
    setLastAction(`Copied share link ${link}`);
    setInteractionTick(t=>t+1);
  };

  // Auto-save simulation (in-memory only, no localStorage per boundary)
  useEffect(() => {
    setSavingState('Saving...');
    const t = setTimeout(() => setSavingState('Saved'), 650);
    return () => clearTimeout(t);
  }, [questions, postings, workflows, paramTabs, companies, roles, coaLines]);

  // Close dropdowns on outside click
  useEffect(()=>{
    const handler = (e:MouseEvent)=>{
      if(mainAccRef.current && !mainAccRef.current.contains(e.target as Node)) setShowMainAccDrop(false);
      if(postTypeRef.current && !postTypeRef.current.contains(e.target as Node)) setShowPostingTypeDrop(false);
      // COA builder dropdowns
      const target = e.target as Node;
      let insideCoa = false;
      Object.values(coaMainRefs.current).forEach(ref=>{ if(ref && ref.contains(target)) insideCoa = true; });
      Object.values(coaDeptRefs.current).forEach(ref=>{ if(ref && ref.contains(target)) insideCoa = true; });
      Object.values(coaCcRefs.current).forEach(ref=>{ if(ref && ref.contains(target)) insideCoa = true; });
      if(!insideCoa){
        setShowCoaMainDrop(null);
        setShowCoaDeptDrop(null);
        setShowCoaCcDrop(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return ()=>document.removeEventListener('mousedown', handler);
  },[]);

  // Toast auto-hide
  useEffect(()=>{
    if(!toastMsg) return;
    const t=setTimeout(()=>setToastMsg(null), 3000);
    return ()=>clearTimeout(t);
  },[toastMsg]);

  // AI Features effects: video timer + TTS cleanup + walkthrough reset on demo open
  useEffect(()=>{
    if(!videoPlaying) return;
    const iv=setInterval(()=>setVideoProgress(p=> (p>=204 ? 0 : p+1)), 1000);
    return ()=>clearInterval(iv);
  },[videoPlaying]);
  useEffect(()=>{
    // stop speech when demo closes
    if(activeDemo!=='tts'){
      try{ window.speechSynthesis?.cancel(); }catch{}
      setTtsPlaying(false);
      setTtsPaused(false);
    }
  },[activeDemo]);
  useEffect(()=>{
    if(activeDemo==='walkthrough') setWalkStep(0);
    if(activeDemo==='process'){
      setProcessRunning(true);
    }
    if(activeDemo==='video'){
      setVideoPlaying(false);
    }
  },[activeDemo]);

  // Reset search when selected posting changes
  useEffect(()=>{
    setPostingMainSearch('');
    setPostingTypeSearch('');
    setShowMainAccDrop(false);
    setShowPostingTypeDrop(false);
    setPostingErrors({});
    setIsPostingEdit(false);
  },[selectedPostId]);

  const selectedQuestion = questions.find(q => q.id === selectedQId);
  const filteredQuestions = moduleFilter === 'All' ? questions : questions.filter(q => q.module === moduleFilter);
  const selectedPosting = postings.find(p => p.id === selectedPostId);
  const selectedWorkflow = workflows.find(w => w.id === selectedWfId);
  const selectedParam = paramTabs.find(p => p.id === selectedParamId);

  // Demo constants for AI Features
  const WALKTHROUGH_STEPS = [
    { title:'Open Legal Entities', nav:'Organization administration > Organizations > Legal entities', detail:'Navigate to legal entities form. This is where company setup lives. Verify USMF, DEMF, INMF entries.', highlight:'Legal entities list page' },
    { title:'Click New', nav:'New button on Action Pane', detail:'Create new legal entity. Enter Company ID, Name, Address. Example: USMF - Contoso Entertainment System USA', highlight:'New button — top action pane' },
    { title:'Enter Company Name & Address', nav:'General FastTab', detail:'Fill Company Name, Address, Executive Summary. Address determines tax registration. Summary used for FRD generation.', highlight:'General FastTab — yellow fields when editing' },
    { title:'Set Fiscal Calendar & Ledger', nav:'General ledger > Ledger setup', detail:'Link fiscal calendar April-March, set chart of accounts 100000-900200, posting profiles. Validation: Main Account required.', highlight:'Ledger field — Ledger = USMF' },
    { title:'Save & Validate', nav:'Save button', detail:'Click Save. System validates posting combinations: Main Account - Department - Cost Center. Generates version entry.', highlight:'Save — bottom action bar' },
  ];
  const UAT_TEST_CASES = [
    { id:'TC-001', scenario:'Fiscal calendar setup April-March', module:'General Ledger', fitGap:'Fit' as FitGap, steps:'1. Open Fiscal Calendars > New 2. Set start April 1 3. Create 12 periods 4. Save', expected:'Fiscal year created with 12 periods, status Open' },
    { id:'TC-002', scenario:'Journal approval >10k requires 2 levels', module:'General Ledger', fitGap:'GAP' as FitGap, steps:'1. Create journal >10k 2. Submit workflow 3. Check Finance Manager + CFO approval', expected:'Workflow routes to Finance Manager then CFO, notification sent' },
    { id:'TC-003', scenario:'Vendor payment via Electronic', module:'Accounts Payable', fitGap:'Fit' as FitGap, steps:'1. Create vendor invoice 2. Select PaymMode Electronic 3. Generate payment file', expected:'Payment file generated, bank integration success' },
    { id:'TC-004', scenario:'FIFO inventory valuation', module:'Inventory', fitGap:'Partial Fit' as FitGap, steps:'1. Set model group FIFO 2. Post receipt 100 qty @10 3. Post receipt 100 qty @12 4. Issue 150 qty', expected:'Issue cost = (100*10 + 50*12) = 1600, remaining 50 @12' },
    { id:'TC-005', scenario:'Procurement requisition threshold 5k', module:'Procurement', fitGap:'Customization' as FitGap, steps:'1. Create requisition $6000 2. Submit 3. Verify approval triggered', expected:'Approval required, CAPEX category routes to Procurement Manager' },
    { id:'TC-006', scenario:'Sales order credit check block', module:'Sales and marketing', fitGap:'Fit' as FitGap, steps:'1. Create sales order for customer exceeding limit 2. Attempt confirm', expected:'Order blocked with message: Credit limit exceeded' },
    { id:'TC-007', scenario:'Batch tracking for Pharma', module:'Inventory', fitGap:'GAP' as FitGap, steps:'1. Create item with batch mandatory 2. Receive with batch number 3. Track expiry', expected:'Batch number required, expiry date validated' },
    { id:'TC-008', scenario:'Project billing T&M vs Fixed Price', module:'Project management', fitGap:'Partial Fit' as FitGap, steps:'1. Create T&M project 2. Post hours 3. Invoice', expected:'Invoice = hours * rate, revenue recognized per % completion' },
  ];
  const filteredUAT = uatFilter==='All' ? UAT_TEST_CASES : UAT_TEST_CASES.filter(tc=>tc.fitGap===uatFilter);
  const INTEGRATION_MAPPINGS = [
    { qNo:1, question:'How do you define fiscal calendar?', formName:'FiscalCal', tableName:'FiscalCalendar', dataEntity:'FiscalCalEnt', odata:'FiscalCalendar', configKey:'LedgerBasic', confidence:98 },
    { qNo:2, question:'Approval workflow for journals?', formName:'LedgerJournal', tableName:'LedgerJournalTable', dataEntity:'LedgerJournal', odata:'LedgerJournals', configKey:'Ledger', confidence:95 },
    { qNo:3, question:'Vendor payment method?', formName:'VendPay', tableName:'VendTable', dataEntity:'VendorEnt', odata:'Vendors', configKey:'AP', confidence:92 },
    { qNo:4, question:'Inventory valuation method?', formName:'InventModel', tableName:'InventTable', dataEntity:'InventItem', odata:'InventItems', configKey:'Invent', confidence:97 },
    { qNo:7, question:'Wave template strategy?', formName:'WHSWave', tableName:'WHSWaveTable', dataEntity:'WHSWaveEnt', odata:'WHSWave', configKey:'WHS', confidence:89 },
    { qNo:11, question:'Leave approval workflow?', formName:'HcmLeave', tableName:'HcmLeaveTable', dataEntity:'HcmLeaveEnt', odata:'HcmLeave', configKey:'HCM', confidence:93 },
  ];
  const filteredIntegration = INTEGRATION_MAPPINGS.filter(m=> m.confidence >= integrationThreshold);
  const PROCESS_STEPS = [
    { id:'q', label:'Questionnaire', desc:'15 questions captured', icon:'📋' },
    { id:'frd', label:'FRD', desc:'Auto-generated doc', icon:'📄' },
    { id:'gap', label:'Fit-GAP', desc:'4 Fit, 3 GAP, 3 Partial', icon:'🔍' },
    { id:'config', label:'Config Package', desc:'COA, Posting, Workflows', icon:'📦' },
    { id:'deploy', label:'D365 Deployment', desc:'UAT + Training', icon:'🚀' },
  ];
  const TRAINER_PLANS: Record<string, {duration:string, modules:{title:string, type:'video'|'doc'|'lab', duration:string, completed?:boolean}[]}[]> = {
    'Functional Consultant': [
      { title:'Core - GL, AP, AR Setup', duration:'2.5h', modules:[
        {title:'Fiscal calendars & Ledger', type:'video', duration:'32m'},
        {title:'Posting profiles deep dive', type:'lab', duration:'45m'},
        {title:'Workflow configuration', type:'video', duration:'28m'},
      ]},
      { title:'Advanced - Inventory & Procurement', duration:'1.8h', modules:[
        {title:'Model groups & Costing', type:'video', duration:'24m'},
        {title:'Procure-to-Pay flow', type:'doc', duration:'18m'},
      ]},
    ],
    'Business User - Finance': [
      { title:'Day in life - Accountant', duration:'1.2h', modules:[
        {title:'Journal entry', type:'video', duration:'18m'},
        {title:'Vendor invoice', type:'lab', duration:'22m'},
      ]},
    ],
    'IT Admin': [
      { title:'System Admin & Security', duration:'2h', modules:[
        {title:'Roles & Permissions', type:'video', duration:'26m'},
        {title:'COA import & Data entities', type:'lab', duration:'38m'},
      ]},
    ],
  };

  const handleRoleChange = (newRole: 'Consultant' | 'Customer') => {
    setRole(newRole);
    setInteractionTick(t=>t+1);
    setLastAction(`Role switched to ${newRole} View — ${newRole==='Customer' ? 'Integration hidden, delete disabled' : 'Full consultant permissions'}`);
  };
  const handleTabChange = (tabId: any) => {
    setActiveTab(tabId);
    setInteractionTick(t=>t+1);
    setLastAction(`Opened ${tabId} — ${new Date().toLocaleTimeString()}`);
  };

  // --- AI Features Handlers ---
  const handleTtsPlay = () => {
    try{
      if(ttsPaused){
        window.speechSynthesis.resume();
        setTtsPaused(false);
        setTtsPlaying(true);
        return;
      }
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(ttsText);
      utter.lang = ttsLang;
      utter.rate = ttsRate;
      utter.onstart = () => { setTtsPlaying(true); setTtsPaused(false); };
      utter.onend = () => { setTtsPlaying(false); setTtsPaused(false); };
      utter.onerror = () => { setTtsPlaying(false); };
      ttsUtterRef.current = utter;
      window.speechSynthesis.speak(utter);
      setLastAction(`TTS playing: "${ttsText.slice(0,40)}..."`);
      setInteractionTick(v=>v+1);
    }catch(e){
      setToastMsg('Speech Synthesis not supported in this browser');
      setTtsPlaying(true);
      setTimeout(()=>setTtsPlaying(false), 2500);
    }
  };
  const handleTtsPause = () => {
    try{
      if(window.speechSynthesis.speaking && !ttsPaused){
        window.speechSynthesis.pause();
        setTtsPaused(true);
        setLastAction('TTS paused');
      }
    }catch{}
  };
  const handleTtsStop = () => {
    try{ window.speechSynthesis.cancel(); }catch{}
    setTtsPlaying(false);
    setTtsPaused(false);
    setLastAction('TTS stopped');
    setInteractionTick(v=>v+1);
  };
  const handleApplyAssistantSuggestion = () => {
    // Apply suggested answers based on industry
    const suggestions: Record<string, {module: ModuleName, textValue: string, fitGap: FitGap}> = {
      'Manufacturing': {module:'Inventory', textValue:'Manufacturing: Apr-Mar fiscal, FIFO model group, Standard costing', fitGap:'Fit'},
      'Retail': {module:'Sales and marketing', textValue:'Retail: Jan-Dec fiscal, Weighted Avg, POS integration needed', fitGap:'Partial Fit'},
      'Pharma': {module:'Inventory', textValue:'Pharma: Batch tracking mandatory, FEFO, 2-level journal approval', fitGap:'GAP'},
    };
    const sug = suggestions[assistantIndustry] || suggestions['Manufacturing'];
    setQuestions(prev=>prev.map((q,i)=> i===0 ? {...q, textValue: sug.textValue, module: sug.module, fitGap: sug.fitGap} : q));
    setAssistantApplied(true);
    setToastMsg(`Applied ${assistantIndustry} suggestions to questionnaire`);
    setLastAction(`Assistant applied ${assistantIndustry} recommendations — updated Q1`);
    setInteractionTick(v=>v+1);
    setTimeout(()=>setAssistantApplied(false), 2000);
  };
  const handleExportUAT = () => {
    const csv = `Test ID,Scenario,Module,Fit/GAP,Steps,Expected Result\n`+
      filteredUAT.map(tc=>`${tc.id},"${tc.scenario}",${tc.module},${tc.fitGap},"${tc.steps}","${tc.expected}"`).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'UAT_TestCases.csv';
    a.click();
    URL.revokeObjectURL(url);
    setToastMsg('UAT Test Cases exported to Excel (CSV)');
    setLastAction('Exported UAT test cases — CSV download');
    setInteractionTick(v=>v+1);
  };

  const handleAddQuestion = () => {
    const newNo = Math.max(...questions.map(q=>q.no),0)+1;
    const newQ: Question = {
      id: 'q'+Date.now(), no: newNo, module: moduleFilter !== 'All' ? moduleFilter as ModuleName : 'General Ledger',
      question:'New discovery question?', type:'Text', why:'', impact:'', businessArea:'', navPath:'', fitGap:'Fit',
      textValue:'', radioOptions:[{code:'01',desc:'Option 1'}], attachmentName:null,
      integration:{formName:'',fieldName:'',tableName:'',menuItem:'',dataEntity:'',odataEntity:'',configKey:''}
    };
    setQuestions([...questions, newQ]);
    setSelectedQId(newQ.id);
  };
  const handleDeleteQuestion = () => {
    if(role==='Customer') return;
    if(!selectedQId) return;
    setQuestions(questions.filter(q=>q.id!==selectedQId));
    setSelectedQId(filteredQuestions[0]?.id || '');
  };
  const updateQuestion = (up: Partial<Question>) => {
    setQuestions(questions.map(q=> q.id===selectedQId ? {...q, ...up} : q));
  };
  const handleAddRadio = () => {
    if(!selectedQuestion) return;
    updateQuestion({radioOptions:[...selectedQuestion.radioOptions, {code:'',desc:''}]});
  };

  const handleAddPosting = () => {
    const np: PostingProfile = { id:'p'+Date.now(), module:'General Ledger', accType:'Summary', code:'NEW-CODE', mainAccount:'', desc:'', explanation:'', ledger:'USMF', postingType:'' };
    setPostings([...postings, np]);
    setSelectedPostId(np.id);
    setIsPostingEdit(true);
    setLastAction(`New posting profile created — Edit mode enabled`);
    setInteractionTick(t=>t+1);
  };
  const handleAddWorkflow = () => {
    const nw: WorkflowDef = { id:'w'+Date.now(), name:'New Workflow', module:'General Ledger', wType:'Approval', approver:'', condition:'', escalation:'', notification:'' };
    setWorkflows([...workflows, nw]);
    setSelectedWfId(nw.id);
  };

  // --- Posting helpers ---
  const getAccountDisplay = (accNum:string) => {
    const found = CHART_OF_ACCOUNTS.find(c=>c.account===accNum);
    return found ? `${found.account} - ${found.name}` : accNum || '';
  };
  const getAccountName = (accNum:string) => {
    const f = CHART_OF_ACCOUNTS.find(c=>c.account===accNum);
    return f ? f.name : '';
  };
  const translatePostingLabel = (pt:PostingTypeDef) => {
    if(lang==='DE' && pt.label_de) return pt.label_de;
    if(lang==='FR' && pt.label_fr) return pt.label_fr;
    return pt.label;
  };
  const filteredChartAccounts = CHART_OF_ACCOUNTS.filter(ca=>{
    if(!postingMainSearch) return true;
    const s = postingMainSearch.toLowerCase();
    return ca.account.toLowerCase().includes(s) || ca.name.toLowerCase().includes(s) || ca.type.toLowerCase().includes(s) || ca.module.toLowerCase().includes(s);
  });
  const filteredPostingTypes = POSTING_TYPES.filter(pt=>{
    if(!postingTypeSearch) return true;
    const s = postingTypeSearch.toLowerCase();
    return pt.value.toLowerCase().includes(s) || pt.label.toLowerCase().includes(s) || pt.module.toLowerCase().includes(s) || pt.desc.toLowerCase().includes(s);
  });
  const groupedPostingTypes = MODULES.map(mod=>{
    const items = filteredPostingTypes.filter(p=>p.module===mod);
    return { module: mod, items };
  }).filter(g=>g.items.length>0);

  const validatePosting = (p:PostingProfile | undefined) => {
    if(!p) return false;
    const errs:{mainAccount?:string, postingType?:string} = {};
    if(!p.mainAccount) errs.mainAccount = 'Main Account is required';
    else if(!CHART_OF_ACCOUNTS.some(c=>c.account===p.mainAccount)) errs.mainAccount = 'Select valid Chart of Account';
    if(!p.postingType) errs.postingType = 'Posting Type is required';
    setPostingErrors(errs);
    return Object.keys(errs).length===0;
  };
  const handlePostingSave = () => {
    if(!selectedPosting) return;
    const ok = validatePosting(selectedPosting);
    if(!ok){
      setLastAction('Validation failed — Main Account & Posting Type required');
      setInteractionTick(t=>t+1);
      return;
    }
    setIsPostingEdit(false);
    setPostingErrors({});
    setLastAction(`Posting profile ${selectedPosting.code} saved — ${getAccountDisplay(selectedPosting.mainAccount)} / ${selectedPosting.postingType}`);
    setInteractionTick(t=>t+1);
    setSavingState('Saving...');
    setTimeout(()=>setSavingState('Saved'), 600);
  };
  const handlePostingEditToggle = () => {
    if(isPostingEdit){
      // if currently editing, attempt save
      handlePostingSave();
    } else {
      setIsPostingEdit(true);
      setLastAction(`Edit mode enabled for ${selectedPosting?.code || 'posting'}`);
      setInteractionTick(t=>t+1);
    }
  };
  const updatePostingField = (field: keyof PostingProfile, value: string) => {
    setPostings(postings.map(x=>x.id===selectedPostId ? {...x, [field]: value} : x));
    if(field==='mainAccount' || field==='postingType'){
      // clear error on change
      setPostingErrors(prev=>({...prev, [field]: undefined}));
    }
    setLastAction(`Updated ${field} → ${value || '(empty)'} — dirty, auto-save queued`);
    setInteractionTick(t=>t+1);
  };

  // --- Parameters helpers (fixed Delete + Save) ---
  const markParamDirty = () => {
    if(!isParamDirty) setIsParamDirty(true);
    setSavingState('Draft');
  };
  const handleParamEditEnter = () => {
    if(role==='Customer') return;
    if(!selectedParamId) return;
    setParamSnapshot(JSON.parse(JSON.stringify(paramTabs)));
    setIsParamEdit(true);
    setIsParamDirty(false);
    setLastAction(`Parameters Edit mode enabled — ${selectedParam?.title || ''} — fields editable`);
    setInteractionTick(t=>t+1);
  };
  const handleParamSave = () => {
    // flush pending auto-saves conceptually
    setSavingState('Saving...');
    const ts = new Date().toLocaleString();
    const totalFields = paramTabs.reduce((a,b)=>a+b.fields.length,0);
    const newVer = { id: 'v'+(paramVersions.length+1), ts, count: totalFields, note: isParamDirty ? `Saved ${totalFields} fields — manual save` : `Saved — no changes` };
    setParamVersions([newVer, ...paramVersions].slice(0,20));
    setIsParamEdit(false);
    setIsParamDirty(false);
    setParamSnapshot(JSON.parse(JSON.stringify(paramTabs)));
    setLastAction(`Parameters saved — ${totalFields} fields — version ${newVer.id}`);
    setInteractionTick(t=>t+1);
    setToastMsg('Parameters saved');
    setTimeout(()=>setSavingState('Saved'), 500);
  };
  const handleParamCancel = () => {
    if(isParamDirty){
      if(!confirm('Discard changes to Parameters? Unsaved field edits will be lost.')) return;
    }
    setParamTabs(JSON.parse(JSON.stringify(paramSnapshot)));
    setIsParamEdit(false);
    setIsParamDirty(false);
    setLastAction('Parameters edit cancelled — reverted to last saved version');
    setInteractionTick(t=>t+1);
    setSavingState('Saved');
  };
  const handleOpenNewFastTab = () => {
    if(role==='Customer') return;
    setNewFastTabTitle('');
    setNewFastTabModule('General Ledger');
    setShowNewFastTabDialog(true);
  };
  const handleConfirmNewFastTab = () => {
    const title = newFastTabTitle.trim();
    if(!title){ alert('FastTab name required'); return; }
    const nt: ParamFastTab = { id:'ft'+Date.now(), title, module:newFastTabModule, fields:[] };
    const newList = [...paramTabs, nt];
    setParamTabs(newList);
    setSelectedParamId(nt.id);
    setParamSnapshot(JSON.parse(JSON.stringify(newList)));
    setIsParamEdit(true);
    setIsParamDirty(true);
    setShowNewFastTabDialog(false);
    setLastAction(`New FastTab '${title}' created — edit mode`);
    setInteractionTick(t=>t+1);
    setToastMsg(`FastTab '${title}' created`);
  };
  const handleRequestDeleteFastTab = () => {
    if(role==='Customer') return;
    if(!selectedParamId) return;
    setShowParamDeleteConfirm(true);
  };
  const handleConfirmDeleteFastTab = () => {
    const target = paramTabs.find(p=>p.id===selectedParamId);
    if(!target) { setShowParamDeleteConfirm(false); return; }
    const remaining = paramTabs.filter(p=>p.id!==selectedParamId);
    setParamTabs(remaining);
    setSelectedParamId(remaining[0]?.id || '');
    setShowParamDeleteConfirm(false);
    // auto-save version
    const ts = new Date().toLocaleString();
    const total = remaining.reduce((a,b)=>a+b.fields.length,0);
    setParamVersions([{id:'v'+(paramVersions.length+1), ts, count: total, note:`Deleted FastTab '${target.title}'`}, ...paramVersions].slice(0,20));
    setIsParamEdit(false);
    setIsParamDirty(false);
    setParamSnapshot(JSON.parse(JSON.stringify(remaining)));
    setSavingState('Saving...');
    setTimeout(()=>setSavingState('Saved'), 400);
    setLastAction(`Deleted FastTab '${target.title}' and its ${target.fields.length} fields — auto-saved`);
    setInteractionTick(t=>t+1);
    setToastMsg(`Deleted '${target.title}'`);
  };
  const handleAddParamField = () => {
    if(!isParamEdit){ handleParamEditEnter(); }
    const nf: ParamField = { id:'pf'+Date.now(), name:'New Field', importance:'Describe importance — e.g., Critical - Determines period closing logic' };
    setParamTabs(paramTabs.map(pt=>pt.id===selectedParamId?{...pt, fields:[...pt.fields, nf]}:pt));
    markParamDirty();
    setLastAction(`Field added to ${selectedParam?.title} — dirty`);
    setInteractionTick(t=>t+1);
  };
  const handleUpdateParamField = (fieldId:string, patch: Partial<ParamField>) => {
    setParamTabs(prev=>prev.map(pt=>{
      if(pt.id!==selectedParamId) return pt;
      return {...pt, fields: pt.fields.map(f=> f.id===fieldId ? {...f, ...patch} : f)};
    }));
    markParamDirty();
  };
  const handleRequestDeleteField = (ftId:string, fieldId:string, fieldName:string) => {
    if(role==='Customer') return;
    setShowFieldDeleteConfirm({ftId, fieldId, fieldName});
  };
  const handleConfirmDeleteField = () => {
    if(!showFieldDeleteConfirm) return;
    const {ftId, fieldId, fieldName} = showFieldDeleteConfirm;
    setParamTabs(prev=>prev.map(pt=> pt.id===ftId ? {...pt, fields: pt.fields.filter(f=>f.id!==fieldId)} : pt));
    setShowFieldDeleteConfirm(null);
    markParamDirty();
    setLastAction(`Deleted field '${fieldName}' from ${paramTabs.find(p=>p.id===ftId)?.title} — dirty, save required`);
    setInteractionTick(t=>t+1);
    setToastMsg(`Field '${fieldName}' deleted — save pending`);
  };

  // --- System Admin Company CRUD ---
  const selectedCompany = companies.find(c=>c.id===selectedCompanyId);
  const t = (k:string)=>{ const m = LANG_MAP[lang] || LANG_MAP.EN; return (m as any)[k] || k; };
  const markCompanyDirty = () => { if(!isCompanyDirty){ setIsCompanyDirty(true); setSavingState('Draft'); } };
  const handleNewCompany = () => {
    if(role==='Customer') { setToastMsg('Customer view cannot create company'); return; }
    const code = `NEW${companyCounter}`;
    const nc: Company = { id:'c'+Date.now(), code, name:'', address:'', summary:'', createdDate:new Date().toISOString().slice(0,10), status:'Active', ledger:code };
    setCompanies([...companies, nc]);
    setSelectedCompanyId(nc.id);
    setCompanySnapshot(JSON.parse(JSON.stringify([...companies, nc])));
    setIsCompanyEdit(true);
    setIsCompanyDirty(true);
    setCompanyCounter(v=>v+1);
    setLastAction(`New company draft ${code} created — enter details and Save`);
    setInteractionTick(v=>v+1);
    setToastMsg('New company draft created — edit mode');
  };
  const handleEditCompany = () => {
    if(!selectedCompanyId) return;
    if(role==='Customer') { setToastMsg('Customer view cannot edit company'); return; }
    setCompanySnapshot(JSON.parse(JSON.stringify(companies)));
    setIsCompanyEdit(true);
    setIsCompanyDirty(false);
    setLastAction(`Edit mode for company ${selectedCompany?.code} — fields enabled`);
    setInteractionTick(v=>v+1);
  };
  const handleCompanySave = () => {
    if(!selectedCompany) return;
    if(!selectedCompany.name.trim() || !selectedCompany.address.trim()){
      setToastMsg('Company Name and Address required');
      setLastAction('Validation failed — Company Name & Address required');
      return;
    }
    const isNew = !companies.some(c=>c.id===selectedCompany.id && initialCompanies.some(ic=>ic.id===c.id)) && companyCounter>0; // approx
    const wasNewDraft = selectedCompany.name==='' ? false : true;
    setIsCompanyEdit(false);
    setIsCompanyDirty(false);
    setCompanySnapshot(JSON.parse(JSON.stringify(companies)));
    setSavingState('Saving...');
    setTimeout(()=>setSavingState('Saved'), 500);
    setLastAction(`Company ${selectedCompany.code} ${selectedCompany.name} saved`);
    setInteractionTick(v=>v+1);
    setToastMsg(selectedCompany.name ? `Company '${selectedCompany.name}' saved` : `Company ${selectedCompany.code} saved`);
    // increment version conceptually
  };
  const handleCompanyCancel = () => {
    if(isCompanyDirty){
      if(!confirm('Discard company changes?')) return;
    }
    setCompanies(JSON.parse(JSON.stringify(companySnapshot)));
    setIsCompanyEdit(false);
    setIsCompanyDirty(false);
    setLastAction('Company edit cancelled');
    setInteractionTick(v=>v+1);
    setSavingState('Saved');
  };
  const handleCompanyDeleteRequest = (c: Company) => {
    if(role==='Customer'){ setToastMsg('Customer cannot delete company'); return; }
    setShowCompanyDeleteConfirm(c);
  };
  const handleCompanyDeleteConfirm = () => {
    if(!showCompanyDeleteConfirm) return;
    const del = showCompanyDeleteConfirm;
    const remaining = companies.filter(x=>x.id!==del.id);
    setCompanies(remaining);
    setSelectedCompanyId(remaining[0]?.id || '');
    setShowCompanyDeleteConfirm(null);
    setIsCompanyEdit(false);
    setIsCompanyDirty(false);
    setCompanySnapshot(JSON.parse(JSON.stringify(remaining)));
    setSavingState('Saving...');
    setTimeout(()=>setSavingState('Saved'), 400);
    setLastAction(`Deleted company ${del.code} ${del.name}`);
    setInteractionTick(v=>v+1);
    setToastMsg(`Deleted company '${del.name}'`);
  };
  const updateCompanyField = (field: keyof Company, value: string) => {
    setCompanies(prev=>prev.map(c=>c.id===selectedCompanyId ? {...c, [field]: value} as Company : c));
    markCompanyDirty();
    setLastAction(`Company ${field} updated — dirty`);
    setInteractionTick(v=>v+1);
  };

  // --- System Admin Role CRUD ---
  const selectedRole = roles.find(r=>r.id===selectedRoleId);
  const markRoleDirty = () => { if(!isRoleDirty){ setIsRoleDirty(true); setSavingState('Draft'); } };
  const handleNewRole = () => {
    if(role==='Customer'){ setToastMsg('Customer cannot create role'); return; }
    const nr: RoleDef = { id:'r'+Date.now(), name:'', createdBy:'Alex Kim', createdDate:new Date().toISOString().slice(0,10), summary:'', permissions: CAPABILITIES.reduce((acc, cap)=>{ (acc as any)[cap]={edit:false, del:false, view:true}; return acc; }, {} as any) };
    setRoles([...roles, nr]);
    setSelectedRoleId(nr.id);
    setRoleSnapshot(JSON.parse(JSON.stringify([...roles, nr])));
    setIsRoleEdit(true);
    setIsRoleDirty(true);
    setRoleCounter(v=>v+1);
    setLastAction('New role draft created');
    setInteractionTick(v=>v+1);
    setToastMsg('New role draft — enter name and permissions');
  };
  const handleEditRole = () => {
    if(!selectedRoleId) return;
    if(role==='Customer'){ setToastMsg('Customer cannot edit role'); return; }
    setRoleSnapshot(JSON.parse(JSON.stringify(roles)));
    setIsRoleEdit(true);
    setIsRoleDirty(false);
    setLastAction(`Edit role ${selectedRole?.name}`);
    setInteractionTick(v=>v+1);
  };
  const handleRoleSave = () => {
    if(!selectedRole) return;
    if(!selectedRole.name.trim()){ setToastMsg('Role Name required'); return; }
    setIsRoleEdit(false);
    setIsRoleDirty(false);
    setRoleSnapshot(JSON.parse(JSON.stringify(roles)));
    setSavingState('Saving...');
    setTimeout(()=>setSavingState('Saved'), 500);
    setLastAction(`Role ${selectedRole.name} saved`);
    setInteractionTick(v=>v+1);
    setToastMsg(`Role '${selectedRole.name}' saved`);
  };
  const handleRoleCancel = () => {
    if(isRoleDirty && !confirm('Discard role changes?')) return;
    setRoles(JSON.parse(JSON.stringify(roleSnapshot)));
    setIsRoleEdit(false);
    setIsRoleDirty(false);
    setLastAction('Role edit cancelled');
    setSavingState('Saved');
  };
  const handleRoleDeleteRequest = (r: RoleDef) => {
    if(role==='Customer'){ setToastMsg('Customer cannot delete role'); return; }
    setShowRoleDeleteConfirm(r);
  };
  const handleRoleDeleteConfirm = () => {
    if(!showRoleDeleteConfirm) return;
    const del = showRoleDeleteConfirm;
    const remaining = roles.filter(x=>x.id!==del.id);
    setRoles(remaining);
    setSelectedRoleId(remaining[0]?.id || '');
    setShowRoleDeleteConfirm(null);
    setIsRoleEdit(false);
    setIsRoleDirty(false);
    setRoleSnapshot(JSON.parse(JSON.stringify(remaining)));
    setSavingState('Saving...');
    setTimeout(()=>setSavingState('Saved'), 400);
    setLastAction(`Deleted role ${del.name}`);
    setInteractionTick(v=>v+1);
    setToastMsg(`Deleted role '${del.name}'`);
  };
  const updateRoleField = (field: keyof RoleDef, value: string) => {
    setRoles(prev=>prev.map(r=>r.id===selectedRoleId ? {...r, [field]: value} as RoleDef : r));
    markRoleDirty();
    setLastAction(`Role ${field} updated — dirty`);
    setInteractionTick(v=>v+1);
  };
  const toggleRolePerm = (cap: string, perm: keyof RolePermission) => {
    if(!isRoleEdit) return;
    if(cap==='Integration section' && role==='Customer') return;
    setRoles(prev=>prev.map(r=>{
      if(r.id!==selectedRoleId) return r;
      const cur = r.permissions[cap] || {edit:false, del:false, view:false};
      return {...r, permissions:{...r.permissions, [cap]: {...cur, [perm]: !cur[perm]}}};
    }));
    markRoleDirty();
  };

  // --- System Admin COA Builder CRUD ---
  const selectedCoaLine = coaLines.find(c=>c.id===selectedCoaLineId);
  const markCoaDirty = () => { if(!isCoaDirty){ setIsCoaDirty(true); setSavingState('Draft'); } };
  const filteredCoaMainAccounts = CHART_OF_ACCOUNTS.filter(ca=>{
    if(!coaMainSearch) return true;
    const s=coaMainSearch.toLowerCase();
    return ca.account.includes(s) || ca.name.toLowerCase().includes(s);
  });
  const filteredDepts = DEPARTMENTS.filter(d=>{
    if(!coaDeptSearch) return true;
    const s=coaDeptSearch.toLowerCase();
    return d.code.toLowerCase().includes(s) || d.name.toLowerCase().includes(s);
  });
  const filteredCC = COST_CENTERS.filter(cc=>{
    if(!coaCcSearch) return true;
    const s=coaCcSearch.toLowerCase();
    return cc.code.toLowerCase().includes(s) || cc.name.toLowerCase().includes(s);
  });
  const handleNewCoaLine = () => {
    const nl: CoaLine = { id:'coa'+Date.now(), mainAccount:'', accountName:'', accType:'Asset', department:'', costCenter:'', active:true, postingCombo:'' };
    setCoaLines([...coaLines, nl]);
    setSelectedCoaLineId(nl.id);
    setCoaSnapshot(JSON.parse(JSON.stringify([...coaLines, nl])));
    setIsCoaEdit(true);
    setIsCoaDirty(true);
    setCoaCounter(v=>v+1);
    setLastAction('New COA line draft created — select Main Account, Dept, Cost Center');
    setInteractionTick(v=>v+1);
    setToastMsg('New COA line draft created');
  };
  const handleEditCoa = () => {
    if(!selectedCoaLineId) return;
    setCoaSnapshot(JSON.parse(JSON.stringify(coaLines)));
    setIsCoaEdit(true);
    setIsCoaDirty(false);
    setLastAction(`Edit COA line ${selectedCoaLine?.postingCombo}`);
    setInteractionTick(v=>v+1);
  };
  const handleCoaSave = () => {
    if(!selectedCoaLine) return;
    if(!selectedCoaLine.mainAccount){ setToastMsg('Main Account required'); return; }
    const updated = coaLines.map(l=>{
      if(l.id!==selectedCoaLineId) return l;
      const combo = [l.mainAccount, l.department, l.costCenter].filter(Boolean).join('-');
      return {...l, postingCombo: combo};
    });
    setCoaLines(updated);
    setIsCoaEdit(false);
    setIsCoaDirty(false);
    setCoaSnapshot(JSON.parse(JSON.stringify(updated)));
    setSavingState('Saving...');
    setTimeout(()=>setSavingState('Saved'), 500);
    setLastAction(`COA line ${selectedCoaLine.mainAccount}-${selectedCoaLine.department}-${selectedCoaLine.costCenter} saved`);
    setInteractionTick(v=>v+1);
    setToastMsg('COA line saved — validates posting combinations');
  };
  const handleCoaCancel = () => {
    if(isCoaDirty && !confirm('Discard COA changes?')) return;
    setCoaLines(JSON.parse(JSON.stringify(coaSnapshot)));
    setIsCoaEdit(false);
    setIsCoaDirty(false);
    setLastAction('COA edit cancelled');
    setSavingState('Saved');
  };
  const handleCoaDeleteRequest = (l: CoaLine) => {
    setShowCoaDeleteConfirm(l);
  };
  const handleCoaDeleteConfirm = () => {
    if(!showCoaDeleteConfirm) return;
    const del = showCoaDeleteConfirm;
    const remaining = coaLines.filter(x=>x.id!==del.id);
    setCoaLines(remaining);
    setSelectedCoaLineId(remaining[0]?.id || '');
    setShowCoaDeleteConfirm(null);
    setIsCoaEdit(false);
    setIsCoaDirty(false);
    setCoaSnapshot(JSON.parse(JSON.stringify(remaining)));
    setSavingState('Saving...');
    setTimeout(()=>setSavingState('Saved'), 400);
    setLastAction(`Deleted COA line ${del.postingCombo}`);
    setInteractionTick(v=>v+1);
    setToastMsg(`Deleted COA line ${del.mainAccount}`);
  };
  const updateCoaField = (id: string, field: keyof CoaLine, value: string | boolean) => {
    setCoaLines(prev=>prev.map(l=>{
      if(l.id!==id) return l;
      let patch: any = {[field]: value};
      if(field==='mainAccount'){
        const acc = CHART_OF_ACCOUNTS.find(c=>c.account===value);
        if(acc){ patch.accountName = acc.name; patch.accType = acc.type; }
      }
      const newLine = {...l, ...patch};
      newLine.postingCombo = [newLine.mainAccount, newLine.department, newLine.costCenter].filter(Boolean).join('-');
      return newLine;
    }));
    markCoaDirty();
  };

  // --- Version Control Handlers (in-memory, no localStorage) ---
  const handleCreateVersion = () => {
    const newId = `v10.0.${39 + versions.length}`;
    const snapshot = {
      questions: JSON.parse(JSON.stringify(questions)),
      postings: JSON.parse(JSON.stringify(postings)),
      companies: JSON.parse(JSON.stringify(companies)),
      coaLines: JSON.parse(JSON.stringify(coaLines)),
      metadata: JSON.parse(JSON.stringify(metadataRows))
    };
    const newVer: VersionEntry = {
      id: newId,
      status: 'Draft',
      date: new Date().toLocaleString(),
      user: 'Alex Kim',
      changes: questions.length + postings.length,
      note: `Snapshot of ${questions.length} questions, ${postings.length} postings - safe draft`,
      snapshot
    };
    setVersions([...versions, newVer]);
    setVersionSnapshots({...versionSnapshots, [newId]: snapshot});
    setSelectedVersionId(newId);
    setLastAction(`Created version ${newId} — in-memory snapshot — Live untouched`);
    setInteractionTick(t=>t+1);
    setToastMsg(`Version ${newId} created — safe draft, Live untouched`);
    setIntegrationLogs(prev=>[...prev, `[${new Date().toLocaleTimeString()}] Created ${newId} — Draft — ${newVer.changes} changes`]);
  };
  const handleRollback = (ver: VersionEntry) => {
    if(!window.confirm(`Rollback to ${ver.id} (${ver.status}) from ${ver.date} by ${ver.user}?\n\nNote: ${ver.note}\n\nThis restores in-memory state from snapshot — Live remains untouched until Promote. Safe Mode: No write to D365.`)) return;
    const snap = versionSnapshots[ver.id] || ver.snapshot;
    if(!snap){
      if(window.confirm(`No in-memory snapshot for ${ver.id}. Create snapshot from current Live? This is safe — does not write to D365.`)){
        setToastMsg(`No snapshot for ${ver.id} — using current Live as base — Safe Mode`);
        setLastAction(`Rollback attempted for ${ver.id} — no snapshot — safe abort`);
        return;
      } else return;
    }
    setQuestions(snap.questions || questions);
    setPostings(snap.postings || postings);
    setCompanies(snap.companies || companies);
    setCoaLines(snap.coaLines || coaLines);
    if(snap.metadata) setMetadataRows(snap.metadata);
    setLastAction(`Rolled back to ${ver.id} — ${ver.changes} changes restored — in-memory only — Live untouched`);
    setInteractionTick(t=>t+1);
    setToastMsg(`Rolled back to ${ver.id} — in-memory restore — Safe Mode`);
    setIntegrationLogs(prev=>[...prev, `[${new Date().toLocaleTimeString()}] ROLLBACK to ${ver.id} — ${ver.status} — ${ver.changes} changes`]);
  };
  const handlePromote = (ver: VersionEntry) => {
    if(!window.confirm(`Promote ${ver.id} from ${ver.status} to Live?\n\nThis will mark ${ver.id} as Live and demote current Live to Staging. In Dry Run mode, no actual D365 write occurs — only in-memory promotion. Proceed?`)) return;
    const newVersions = versions.map(v=>{
      if(v.id===ver.id) return {...v, status:'Live' as const, date:new Date().toLocaleString()};
      if(v.status==='Live') return {...v, status:'Staging' as const};
      return v;
    });
    setVersions(newVersions);
    setLastAction(`Promoted ${ver.id} to Live — previous Live demoted to Staging — ${d365Config.dryRun ? 'Dry Run — no D365 write' : 'Would push to D365'}`);
    setInteractionTick(t=>t+1);
    setToastMsg(`Promoted ${ver.id} to Live — Safe Mode — Dry Run: ${d365Config.dryRun}`);
    setIntegrationLogs(prev=>[...prev, `[${new Date().toLocaleTimeString()}] PROMOTE ${ver.id} to Live — DryRun: ${d365Config.dryRun}`]);
  };

  // --- Metadata Repository Handlers ---
  const handleNewMetadata = () => {
    const nm: MetadataRow = { id:'m'+Date.now(), navPath:'', formName:'', tableName:'', dataEntity:'', odata:'', menuItem:'', module:'General Ledger' };
    setMetadataRows([...metadataRows, nm]);
    setSelectedMetadataId(nm.id);
    setMetadataSnapshot(JSON.parse(JSON.stringify([...metadataRows, nm])));
    setIsMetadataEdit(true);
    setIsMetadataDirty(true);
    setLastAction('New metadata row created — enter Navigation Path and D365 mapping');
    setInteractionTick(t=>t+1);
  };
  const handleEditMetadata = () => {
    if(!selectedMetadataId) return;
    setMetadataSnapshot(JSON.parse(JSON.stringify(metadataRows)));
    setIsMetadataEdit(true);
    setIsMetadataDirty(false);
    setLastAction(`Edit metadata ${selectedMetadataId} — fields enabled`);
    setInteractionTick(t=>t+1);
  };
  const handleSaveMetadata = () => {
    const row = metadataRows.find(r=>r.id===selectedMetadataId);
    if(!row) return;
    if(!row.navPath.trim() || !row.formName.trim()){
      setToastMsg('Navigation Path and FormName required');
      return;
    }
    setIsMetadataEdit(false);
    setIsMetadataDirty(false);
    setMetadataSnapshot(JSON.parse(JSON.stringify(metadataRows)));
    setLastAction(`Metadata ${row.formName} saved — ${row.navPath}`);
    setInteractionTick(t=>t+1);
    setToastMsg(`Metadata '${row.formName}' saved — in-memory`);
  };
  const handleCancelMetadata = () => {
    if(isMetadataDirty && !confirm('Discard metadata changes?')) return;
    if(metadataSnapshot.length>0) setMetadataRows(JSON.parse(JSON.stringify(metadataSnapshot)));
    setIsMetadataEdit(false);
    setIsMetadataDirty(false);
    setLastAction('Metadata edit cancelled');
  };
  const handleDeleteMetadata = (id:string) => {
    const target = metadataRows.find(r=>r.id===id);
    if(!target) return;
    if(!window.confirm(`Delete metadata row '${target.formName} - ${target.navPath}'? This cannot be undone.`)) return;
    const remaining = metadataRows.filter(r=>r.id!==id);
    setMetadataRows(remaining);
    setSelectedMetadataId(remaining[0]?.id || '');
    setIsMetadataEdit(false);
    setLastAction(`Deleted metadata ${target.formName}`);
    setInteractionTick(t=>t+1);
    setToastMsg(`Deleted metadata '${target.formName}'`);
  };
  const updateMetadataField = (id:string, field: keyof MetadataRow, value:string) => {
    setMetadataRows(prev=>prev.map(r=> r.id===id ? {...r, [field]: value} as MetadataRow : r));
    if(!isMetadataDirty){ setIsMetadataDirty(true); }
    setLastAction(`Metadata ${field} updated — dirty`);
  };
  const handleAutoFillFromQuestion = () => {
    if(!selectedQuestion) { setToastMsg('Select a questionnaire question first'); return; }
    const qNav = selectedQuestion.navPath;
    if(!qNav){ setToastMsg('Selected question has no Navigation Path'); return; }
    const match = metadataRows.find(m=> m.navPath.toLowerCase()===qNav.toLowerCase());
    if(match){
      setToastMsg(`Auto-fill: Found metadata for '${qNav}' -> Form: ${match.formName}, Table: ${match.tableName}`);
      setSelectedMetadataId(match.id);
      setLastAction(`Auto-filled from Question Q${selectedQuestion.no}: ${match.formName} - ${match.tableName}`);
    } else {
      const newRow: MetadataRow = {
        id:'m'+Date.now(),
        navPath: qNav,
        formName: selectedQuestion.integration.formName || 'NewForm',
        tableName: selectedQuestion.integration.tableName || 'NewTable',
        dataEntity: selectedQuestion.integration.dataEntity || 'NewEntity',
        odata: selectedQuestion.integration.odataEntity || 'NewOData',
        menuItem: selectedQuestion.integration.menuItem || 'NewMenu',
        module: selectedQuestion.module
      };
      setMetadataRows([...metadataRows, newRow]);
      setSelectedMetadataId(newRow.id);
      setToastMsg(`Created metadata from Q${selectedQuestion.no} Navigation Path — ${qNav}`);
      setLastAction(`Created metadata from Question Q${selectedQuestion.no} navPath -> ${newRow.formName}`);
    }
    setInteractionTick(t=>t+1);
  };

  // --- D365 Integration Handlers (safe, no real backend) ---
  const handleTestConnection = () => {
    setTestConnLoading(true);
    setD365Config(prev=>({...prev, odataStatus:'Testing'}));
    setLastAction(`Testing connection to ${d365Config.envUrl} — Dry Run: ${d365Config.dryRun}`);
    setIntegrationLogs(prev=>[...prev, `[${new Date().toLocaleTimeString()}] Test connection to ${d365Config.envUrl} — Tenant: ${d365Config.tenantId.slice(0,8)}...`]);
    setTimeout(()=>{
      setTestConnLoading(false);
      const success = d365Config.envUrl.includes('dynamics.com');
      setD365Config(prev=>({...prev, odataStatus: success ? 'Connected' : 'Not Connected'}));
      setToastMsg(success ? 'OData Endpoint Connected — Dry Run safe — No D365 write' : 'Connection failed — check Environment URL — Safe Mode: Live untouched');
      setLastAction(success ? `Connected to ${d365Config.envUrl} — OData ready — Dry Run mode active` : `Connection failed — ${d365Config.envUrl} — Safe Mode`);
      setIntegrationLogs(prev=>[...prev, `[${new Date().toLocaleTimeString()}] ${success ? 'Connected' : 'Failed'} — OData status: ${success ? 'Connected' : 'Not Connected'} — DryRun: ${d365Config.dryRun}`]);
      setInteractionTick(t=>t+1);
    }, 1400);
  };
  const handleSyncMetadata = () => {
    setSyncLoading(true);
    setLastAction(`Syncing metadata — ${metadataRows.length} rows — Dry Run: ${d365Config.dryRun}`);
    setIntegrationLogs(prev=>[...prev, `[${new Date().toLocaleTimeString()}] Sync Metadata — ${metadataRows.length} rows — DryRun: ${d365Config.dryRun}`]);
    setTimeout(()=>{
      setSyncLoading(false);
      setD365Config(prev=>({...prev, entitySync:'Synced'}));
      setToastMsg(`Metadata synced — ${metadataRows.length} entities — Safe Mode — ${d365Config.dryRun ? 'No D365 write, validated only' : 'Would push'}`);
      setLastAction(`Metadata sync complete — ${metadataRows.length} entities validated — Dry Run safe`);
      setIntegrationLogs(prev=>[...prev, `[${new Date().toLocaleTimeString()}] Synced ${metadataRows.length} entities — DataEntity validation passed — DryRun: ${d365Config.dryRun}`]);
      setInteractionTick(t=>t+1);
    }, 1600);
  };
  const handlePushToD365 = () => {
    if(!window.confirm(`Push to D365 F&O?\n\nEnvironment: ${d365Config.envUrl}\nDry Run: ${d365Config.dryRun ? 'ON — No write, only validates' : 'OFF — Would write (simulated)'}\n\nPayload: ${selectedPayloadType} + ${questions.length} questionnaire answers + ${postings.length} posting profiles\n\nIn Safe Mode, this generates Data Management package (JSON/XML/Excel) that can be imported via D365 Data Management workspace or OData REST API.\n\nProceed?`)) return;
    setPushLoading(true);
    setIntegrationLogs(prev=>[...prev, `[${new Date().toLocaleTimeString()}] Push to D365 — ${selectedPayloadType} — DryRun: ${d365Config.dryRun} — Generating package`]);
    setTimeout(()=>{
      setPushLoading(false);
      setToastMsg(d365Config.dryRun ? `Dry Run: ${selectedPayloadType} package validated — No D365 write — Ready for import via Data Management` : `Push simulated: ${selectedPayloadType} would be created in D365 — Safe Mode active`);
      setLastAction(`Push ${d365Config.dryRun ? 'Dry Run validated' : 'simulated'} — ${selectedPayloadType} — ${questions.length} questions — Safe Mode: Live untouched`);
      setIntegrationLogs(prev=>[...prev, `[${new Date().toLocaleTimeString()}] ${d365Config.dryRun ? 'DRY RUN OK' : 'PUSH SIMULATED'} — ${selectedPayloadType} — Questionnaire -> Data Entity -> OData -> D365 Parameter/Posting Profile`]);
      setInteractionTick(t=>t+1);
    }, 1800);
  };

  return (
    <div className="min-h-screen flex flex-col font-segoe antialiased selection:bg-[#0078D4]/20" style={{ fontFamily: 'Segoe UI, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Segoe+UI:wght@400;600&display=swap');
        .font-segoe { font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif; }
        .d365-grid-row:nth-child(even) { background:#F8F8F8; }
        .d365-grid-row:nth-child(odd) { background:#FFFFFF; }
        .d365-grid-row:hover { background:#F3F2F1; }
        .d365-selected { background:#E5F3FF !important; outline:1px solid #0078D4; outline-offset:-1px; }
        .scrollbar-thin::-webkit-scrollbar { width:6px; height:6px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background:#C8C6C4; border-radius:3px; }
      `}</style>

      {/* D365 Black Header */}
      <header className="h-[48px] bg-black text-white flex items-center justify-between px-4 sticky top-0 z-50" style={{ paddingTop: 'var(--safe-area-inset-top,0)' }}>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-[#0078D4] flex items-center justify-center font-bold text-[14px]">EP</div>
          <div>
            <div className="text-[14px] font-semibold leading-none tracking-[-0.01em]">EP_ERP Discovery Accelerator</div>
            <div className="text-[11px] opacity-70 leading-none mt-[2px]">Dynamics 365 Finance & Operations — Questionnaire Module</div>
          </div>
          <div className="hidden md:flex items-center gap-2 ml-6">
            <span className="text-[11px] bg-[#2B2B2B] px-2 py-[2px] rounded border border-[#3A3A3A]">{savingState}</span>
            {savingState==='Saving...' && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 text-[11px]">
            <span className="opacity-60">Legal entity:</span><span className="bg-[#1F1F1F] px-2 py-1 border border-[#333]">USMF — Contoso Entertainment System USA</span>
          </div>
          {/* Role Toggle */}
          <div className="flex items-center bg-[#1F1F1F] rounded-[2px] border border-[#333] p-[2px]">
            <button onClick={()=>handleRoleChange('Consultant')} data-active={role==='Consultant'} className={`px-3 py-1 text-[12px] font-semibold transition ${role==='Consultant' ? 'bg-[#0078D4] text-white' : 'text-[#A19F9D] hover:text-white'}`}>Consultant View</button>
            <button onClick={()=>handleRoleChange('Customer')} data-active={role==='Customer'} className={`px-3 py-1 text-[12px] font-semibold transition ${role==='Customer' ? 'bg-[#0078D4] text-white' : 'text-[#A19F9D] hover:text-white'}`}>Customer View</button>
          </div>
          <div className="w-7 h-7 rounded-full bg-[#5C2D91] flex items-center justify-center text-[11px] font-bold">AK</div>
        </div>
      </header>

      {/* Tab Navigation - D365 Style */}
      <div className="bg-[#F3F2F1] border-b border-[#E1DFDD] flex items-center overflow-x-auto scrollbar-thin">
        {[
          {id:'Questionnaire', label:'Questionnaire', icon:'📋', hideInCustomer:false},
          {id:'Posting', label:'Summary & Posting profiles', icon:'🏦', hideInCustomer:false},
          {id:'Workflow', label:'Workflow', icon:'🔄', hideInCustomer:false},
          {id:'Parameters', label:'Parameters', icon:'⚙️', hideInCustomer:false},
          {id:'System Admin', label:'System admin', icon:'🛡️', hideInCustomer:false},
          {id:'AI Features', label:'AI Features (10)', icon:'✨', hideInCustomer:false},
          {id:'Version Control', label:'Version Control', icon:'🕒', hideInCustomer:true},
          {id:'Low-Code Factory', label:'Low-Code Factory (New)', icon:'🏗️', hideInCustomer:true},
        ].filter(tab=> isConsultant || !tab.hideInCustomer).map(tab=>(
          <button key={tab.id} onClick={()=>handleTabChange(tab.id)} data-tab={tab.id} data-active={activeTab===tab.id} className={`h-[40px] px-4 flex items-center gap-2 text-[13px] whitespace-nowrap border-b-2 transition ${activeTab===tab.id ? 'border-[#0078D4] bg-white text-[#323130] font-semibold' : 'border-transparent text-[#605E5C] hover:bg-[#EDEBE9] hover:text-[#323130]'} ${tab.id==='Low-Code Factory' ? 'bg-[#FFF4CE]/50' : ''}`}>
            <span>{tab.icon}</span>{tab.label}{tab.id==='Low-Code Factory' && <span className="ml-1 text-[9px] bg-[#0078D4] text-white px-1 py-0.5 rounded-[2px]">NEW</span>}
          </button>
        ))}
        <div className="ml-auto hidden md:flex items-center gap-2 pr-4 text-[11px] text-[#605E5C]">
          <span>Environment: {licenseInfo.env} • License: {licenseInfo.plan} • {licenseInfo.usedCustomers}/{licenseInfo.maxCustomers} customers</span><span className="w-2 h-2 rounded-full bg-[#107C10] inline-block"></span>
          {activeManagedCustomer && <span className="bg-[#E5F3FF] border border-[#A9D0F5] px-2 py-0.5 text-[10px]">Customer: {activeManagedCustomer.code} ({activeManagedCustomer.modules.length}+{activeManagedCustomer.extraModules.length} modules)</span>}
        </div>
      </div>

      {/* Customer restriction banner */}
      {role==='Customer' && (
        <div className="bg-[#E5F3FF] border-b border-[#A9D0F5] px-4 py-[8px] text-[12px] text-[#323130] flex flex-col md:flex-row md:items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[14px]">👤</span>
            <span><b>Customer View - Only Questionnaire for FRD/GAP, No technical details</b> — You see only your subscribed modules: <b>{customerSubscribedModules.join(', ')}{activeManagedCustomer.extraModules.length>0 ? ', '+activeManagedCustomer.extraModules.join(', ') : ''}</b> — No Version Control, No Low-Code, No integration details</span>
          </div>
          <div className="md:ml-auto flex items-center gap-2 text-[11px]">
            <span className="bg-white border border-[#A9D0F5] px-2 py-0.5">Customer: {activeManagedCustomer.code} | {activeManagedCustomer.name}</span>
            <span className="bg-white border px-2 py-0.5">Shared Link Valid till {activeManagedCustomer.expiry}</span>
          </div>
        </div>
      )}
      {/* Consultant extra info banner */}
      {role==='Consultant' && (
        <div className="bg-[#FFF4CE] border-b border-[#FCE100] px-4 py-[4px] text-[11px] text-[#323130] flex flex-wrap items-center gap-2">
          <span>ⓘ Consultant View — All tabs visible — Customer {activeManagedCustomer.code} filtered modules: {customerSubscribedModules.length} — Total Questions: {questions.length} — Showing {filteredQuestionsByCustomer.length} for current filter — Use System Admin &gt; License &amp; Customer Management to add/edit customers</span>
          <select value={activeCustomerContextId} onChange={e=>{setActiveCustomerContextId(e.target.value); setLastAction(`Switched active customer context to ${e.target.value}`);}} className="ml-auto h-6 px-2 border border-[#8A8886] text-[11px] bg-white">
            {managedCustomers.map(c=><option key={c.id} value={c.id}>{c.code} - {c.name} ({c.modules.length} mods)</option>)}
          </select>
        </div>
      )}

      {/* Interaction feedback strip - ensures controls produce visible response */}
      <div className="bg-white border-b border-[#E1DFDD] px-4 py-1.5 flex items-center gap-3 text-[11px]">
        <span className="font-semibold text-[#323130]">Action:</span>
        <span className="text-[#605E5C] truncate">{lastAction}</span>
        <span className="ml-auto text-[10px] text-[#A19F9D]">tick:{interactionTick}</span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#FAF9F8] flex flex-col">

        {/* QUESTIONNAIRE FORM */}
        {activeTab==='Questionnaire' && (
          <>
            {/* Action Pane */}
            <div className="bg-[#F3F2F1] border-b border-[#E1DFDD] px-2 py-2 flex flex-wrap items-center gap-1">
              <div className="flex items-center gap-1">
                <button onClick={handleAddQuestion} disabled={role==='Customer' ? false : false} className="h-8 px-3 bg-white border border-[#8A8886] text-[12px] font-semibold text-[#323130] hover:bg-[#F3F2F1] flex items-center gap-1.5 disabled:opacity-40">
                  <span className="text-[14px]">＋</span> New
                </button>
                <button className={`h-8 px-3 bg-white border border-[#8A8886] text-[12px] font-semibold flex items-center gap-1.5 ${!selectedQId ? 'opacity-40' : ''}`}><span>✎</span> Edit</button>
                <button onClick={handleDeleteQuestion} disabled={role==='Customer' || !selectedQId} className="h-8 px-3 bg-white border border-[#8A8886] text-[12px] font-semibold flex items-center gap-1.5 disabled:opacity-40"><span>🗑</span> Delete</button>
                <div className="w-[1px] h-6 bg-[#E1DFDD] mx-2"></div>
                <select value={moduleFilter} onChange={e=>setModuleFilter(e.target.value as any)} className="h-8 px-2 bg-white border border-[#8A8886] text-[12px] min-w-[180px]">
                  <option value="All">All modules (15)</option>
                  {MODULES.map(m=><option key={m} value={m}>{m}</option>)}
                </select>
                <div className="ml-3 text-[11px] text-[#605E5C] hidden md:flex items-center gap-1"><span className="w-2 h-2 bg-[#107C10] rounded-full"></span>Auto-save enabled — Saving... → Saved</div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[11px] text-[#605E5C]">{filteredQuestions.length} records</span>
                <button onClick={()=>setShowIntegrationHelp(!showIntegrationHelp)} className="h-8 px-2 bg-white border border-[#8A8886] text-[11px]">Integration help</button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 min-h-0">
              {/* Grid */}
              <div className="lg:w-[48%] border-r border-[#E1DFDD] bg-white flex flex-col min-h-[300px]">
                <div className="h-8 bg-[#F3F2F1] border-b border-[#E1DFDD] flex items-center px-2 text-[11px] font-semibold text-[#323130] uppercase tracking-wide">
                  <span className="w-8">✓</span>
                  <span className="w-10">No.</span>
                  <span className="flex-1">Question</span>
                  <span className="w-24">Type</span>
                  <span className="w-24">Fit/GAP</span>
                  <span className="w-24">Module</span>
                </div>
                <div className="flex-1 overflow-auto scrollbar-thin max-h-[45vh] lg:max-h-none">
                  {filteredQuestions.map(q=>(
                    <div key={q.id} onClick={()=>setSelectedQId(q.id)} className={`d365-grid-row h-10 flex items-center px-2 text-[12px] border-b border-[#F3F2F1] cursor-pointer ${selectedQId===q.id ? 'd365-selected' : ''}`}>
                      <span className="w-8 flex items-center justify-center"><span className={`w-[14px] h-[14px] border flex items-center justify-center text-[10px] ${selectedQId===q.id ? 'bg-[#0078D4] border-[#0078D4] text-white' : 'border-[#8A8886] bg-white'}`}>{selectedQId===q.id?'✓':''}</span></span>
                      <span className="w-10 font-semibold">{String(q.no).padStart(2,'0')}</span>
                      <span className="flex-1 truncate pr-2">{q.question}</span>
                      <span className="w-24"><span className="px-1.5 py-0.5 bg-[#F3F2F1] border border-[#E1DFDD] text-[10px]">{q.type}</span></span>
                      <span className="w-24"><span className={`px-2 py-0.5 text-[10px] font-semibold rounded-[2px] ${q.fitGap==='Fit'?'bg-[#DFF6DD] text-[#107C10] border border-[#A7E3A5]': q.fitGap==='GAP'?'bg-[#FDE7E9] text-[#A80000] border border-[#F7B0B5]': q.fitGap==='Partial Fit'?'bg-[#FFF4CE] text-[#8A5700] border border-[#FCE100]':'bg-[#EDEBE9] text-[#323130] border border-[#E1DFDD]'}`}>{q.fitGap}</span></span>
                      <span className="w-24 truncate text-[11px] text-[#605E5C]">{q.module.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detail Form - FastTabs */}
              <div className="flex-1 bg-[#FAF9F8] overflow-auto scrollbar-thin">
                {selectedQuestion ? (
                  <div className="p-3 space-y-3">
                    {/* FastTab: General */}
                    <div className="bg-white border border-[#E1DFDD] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                      <div className="h-9 bg-[#F3F2F1] border-b border-[#E1DFDD] flex items-center px-3 text-[13px] font-semibold text-[#323130]">▾ General — Question No. {selectedQuestion.no} <span className="ml-2 text-[11px] font-normal text-[#605E5C]">Auto-numbering, non-editable, increments</span></div>
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="text-[12px] font-semibold text-[#323130] flex justify-between">Question <span className="font-normal text-[#605E5C]">{selectedQuestion.question.length}/50</span></label>
                          <input value={selectedQuestion.question} onChange={e=>updateQuestion({question:e.target.value.slice(0,50)})} className="w-full mt-1 h-8 px-2 border border-[#8A8886] text-[13px] focus:border-[#0078D4] focus:outline-none" />
                        </div>
                        <div>
                          <label className="text-[12px] font-semibold">Question type</label>
                          <select value={selectedQuestion.type} onChange={e=>updateQuestion({type:e.target.value as QType})} className="w-full mt-1 h-8 px-2 border border-[#8A8886] text-[13px] bg-white">
                            <option>RadioButton</option><option>Text</option><option>Workflow</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[12px] font-semibold">Fit/GAP — capture as Fit/GAP</label>
                          <select value={selectedQuestion.fitGap} onChange={e=>updateQuestion({fitGap:e.target.value as FitGap})} className="w-full mt-1 h-8 px-2 border border-[#8A8886] text-[13px] bg-white">
                            <option>Fit</option><option>GAP</option><option>Partial Fit</option><option>Customization</option>
                          </select>
                        </div>

                        {/* Conditional */}
                        {selectedQuestion.type==='Text' && (
                          <div className="col-span-2 bg-[#F8F8F8] border border-[#E1DFDD] p-3">
                            <label className="text-[12px] font-semibold flex justify-between">Answer (Text) <span>{selectedQuestion.textValue.length}/250</span></label>
                            <textarea value={selectedQuestion.textValue} onChange={e=>updateQuestion({textValue:e.target.value.slice(0,250)})} className="w-full mt-1 h-20 p-2 border border-[#8A8886] text-[13px] resize-none" placeholder="Enter detailed response..."></textarea>
                          </div>
                        )}
                        {selectedQuestion.type==='Workflow' && (
                          <div className="col-span-2 bg-[#FFF4CE] border border-[#FCE100] p-3">
                            <label className="text-[12px] font-semibold flex justify-between">Workflow details <span className="text-[#A80000]">* attachment mandatory</span> <span>{selectedQuestion.textValue.length}/250</span></label>
                            <textarea value={selectedQuestion.textValue} onChange={e=>updateQuestion({textValue:e.target.value.slice(0,250)})} className="w-full mt-1 h-20 p-2 border border-[#8A8886] text-[13px] resize-none"></textarea>
                            <div className="mt-2 flex items-center gap-2">
                              <input ref={fileInputRef} type="file" className="hidden" onChange={e=>{
                                const f=e.target.files?.[0]?.name;
                                if(f) updateQuestion({attachmentName:f});
                              }}/>
                              <button onClick={()=>fileInputRef.current?.click()} className="h-7 px-3 bg-white border border-[#8A8886] text-[11px] font-semibold">Attach file — All types allowed <span className="text-[#A80000]">*</span></button>
                              {selectedQuestion.attachmentName ? <span className="text-[11px] text-[#107C10]">📎 {selectedQuestion.attachmentName}</span> : <span className="text-[11px] text-[#A80000]">⚠ Attachment required for Workflow type</span>}
                            </div>
                          </div>
                        )}
                        {selectedQuestion.type==='RadioButton' && (
                          <div className="col-span-2 bg-white border border-[#E1DFDD]">
                            <div className="h-8 bg-[#F3F2F1] border-b border-[#E1DFDD] flex items-center justify-between px-3">
                              <span className="text-[12px] font-semibold">Radio options — Code (alphanumeric) & Description (50 chars)</span>
                              <button onClick={handleAddRadio} className="h-6 px-2 bg-white border border-[#8A8886] text-[11px]">+ Add row</button>
                            </div>
                            <div className="p-2 space-y-1">
                              {selectedQuestion.radioOptions.map((opt,i)=>(
                                <div key={i} className="flex gap-2">
                                  <input value={opt.code} onChange={e=>{
                                    const ro=[...selectedQuestion.radioOptions]; ro[i].code=e.target.value; updateQuestion({radioOptions:ro});
                                  }} placeholder="Code e.g. 01" className="w-24 h-7 px-2 border border-[#8A8886] text-[12px]" />
                                  <input value={opt.desc} onChange={e=>{
                                    const ro=[...selectedQuestion.radioOptions]; ro[i].desc=e.target.value.slice(0,50); updateQuestion({radioOptions:ro});
                                  }} placeholder="Description e.g. FIFO" className="flex-1 h-7 px-2 border border-[#8A8886] text-[12px]" />
                                  <button onClick={()=>{
                                    const ro=selectedQuestion.radioOptions.filter((_,idx)=>idx!==i);
                                    updateQuestion({radioOptions:ro});
                                  }} className="w-7 h-7 bg-white border border-[#8A8886] text-[12px]">×</button>
                                </div>
                              ))}
                              <div className="text-[10px] text-[#605E5C] mt-1">Example: Code: 01, Description: FIFO; Code: 02 Description: LIFO</div>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="text-[12px] font-semibold flex justify-between">Why we ask <span>{selectedQuestion.why.length}/100</span></label>
                          <input value={selectedQuestion.why} onChange={e=>updateQuestion({why:e.target.value.slice(0,100)})} className="w-full mt-1 h-8 px-2 border border-[#8A8886] text-[12px]" />
                        </div>
                        <div>
                          <label className="text-[12px] font-semibold flex justify-between">Business Impact <span>{selectedQuestion.impact.length}/100</span></label>
                          <input value={selectedQuestion.impact} onChange={e=>updateQuestion({impact:e.target.value.slice(0,100)})} className="w-full mt-1 h-8 px-2 border border-[#8A8886] text-[12px]" />
                        </div>
                        <div>
                          <label className="text-[12px] font-semibold flex justify-between">Business area in F&O <span>{selectedQuestion.businessArea.length}/100</span></label>
                          <input value={selectedQuestion.businessArea} onChange={e=>updateQuestion({businessArea:e.target.value.slice(0,100)})} className="w-full mt-1 h-8 px-2 border border-[#8A8886] text-[12px]" placeholder="e.g., General Ledger > Fiscal Calendars" />
                        </div>
                        <div>
                          <label className="text-[12px] font-semibold flex justify-between">Navigation path <span>{selectedQuestion.navPath.length}/100</span></label>
                          <input value={selectedQuestion.navPath} onChange={e=>updateQuestion({navPath:e.target.value.slice(0,100)})} className="w-full mt-1 h-8 px-2 border border-[#8A8886] text-[12px]" placeholder="e.g., Organization administration > ..." />
                        </div>
                      </div>
                    </div>

                    {/* Integration Section - Internal only */}
                    {role==='Consultant' ? (
                      <div className="bg-white border border-[#E1DFDD] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        <div className="h-9 bg-[#E5F3FF] border-b border-[#A9D0F5] flex items-center px-3 text-[13px] font-semibold text-[#004578]">▾ Integration section — Internal (Consultant/Admin) only — Visible to internal role</div>
                        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            {k:'formName', label:'Form Name'},
                            {k:'fieldName', label:'Field Name'},
                            {k:'tableName', label:'TableName'},
                            {k:'menuItem', label:'Menu item'},
                            {k:'dataEntity', label:'Data Entity'},
                            {k:'odataEntity', label:'OData entity'},
                            {k:'configKey', label:'Configuration key'},
                          ].map(f=>(
                            <div key={f.k}>
                              <label className="text-[11px] font-semibold flex justify-between">{f.label} <span>{(selectedQuestion.integration as any)[f.k]?.length||0}/15</span></label>
                              <input value={(selectedQuestion.integration as any)[f.k]} onChange={e=>{
                                const integ={...selectedQuestion.integration, [f.k]:e.target.value.slice(0,15)};
                                updateQuestion({integration:integ});
                              }} className="w-full mt-1 h-7 px-2 border border-[#8A8886] text-[11px] font-mono bg-[#FAF9F8]" />
                            </div>
                          ))}
                        </div>
                        <div className="px-4 pb-3 text-[10px] text-[#605E5C]">Each 15 chars max — Used for D365 F&O integration mapping</div>
                      </div>
                    ) : (
                      <div className="bg-[#F3F2F1] border border-dashed border-[#C8C6C4] p-4 text-[12px] text-[#605E5C] text-center">Integration section hidden in Customer View — Consultant/Admin role required</div>
                    )}

                    <div className="bg-white border border-[#E1DFDD] p-3 flex items-center gap-3 text-[11px]">
                      <span className="font-semibold">Attachment:</span>
                      <span>All file types per question allowed</span>
                      <span className="mx-2 w-[1px] h-4 bg-[#E1DFDD]"></span>
                      <span>Module: <b>{selectedQuestion.module}</b></span>
                      <span className="ml-auto text-[#605E5C]">Form: EP_DiscoveryQuestionnaire | Table: EP_DiscoveryTable</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-[#605E5C] text-[13px]">Select a record to edit — inline editing like D365 F&O</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* POSTING PROFILES - FIXED DROPDOWNS */}
        {activeTab==='Posting' && (
          <>
            <div className="bg-[#F3F2F1] border-b border-[#E1DFDD] px-2 py-2 flex flex-wrap items-center gap-1">
              <div className="flex items-center gap-1">
                <button onClick={handleAddPosting} className="h-8 px-3 bg-white border border-[#8A8886] text-[12px] font-semibold flex items-center gap-1.5 hover:bg-[#EDEBE9]"><span>＋</span> New</button>
                <button onClick={handlePostingEditToggle} disabled={!selectedPostId} className={`h-8 px-3 border text-[12px] font-semibold flex items-center gap-1.5 ${!selectedPostId ? 'opacity-40 bg-white border-[#8A8886]' : isPostingEdit ? 'bg-[#0078D4] border-[#0078D4] text-white' : 'bg-white border-[#8A8886] hover:bg-[#EDEBE9]'}`}>
                  <span>{isPostingEdit ? '💾' : '✎'}</span> {isPostingEdit ? 'Save' : 'Edit'}
                </button>
                {isPostingEdit && <button onClick={()=>{setIsPostingEdit(false); setPostingErrors({}); setLastAction('Edit cancelled — back to View mode');}} className="h-8 px-3 bg-white border border-[#8A8886] text-[12px] font-semibold">Cancel</button>}
                <button disabled={role==='Customer' || !selectedPostId || isPostingEdit} onClick={()=>{ if(!selectedPostId) return; setPostings(postings.filter(p=>p.id!==selectedPostId)); setSelectedPostId(postings[0]?.id || ''); }} className="h-8 px-3 bg-white border border-[#8A8886] text-[12px] font-semibold disabled:opacity-40">Delete</button>
                <div className="w-[1px] h-6 bg-[#E1DFDD] mx-2"></div>
                <select value={lang} onChange={e=>setLang(e.target.value as any)} className="h-8 px-2 bg-white border border-[#8A8886] text-[11px]">
                  <option value="EN">EN — English</option>
                  <option value="DE">DE — Deutsch</option>
                  <option value="FR">FR — Français</option>
                </select>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <span className="text-[11px] bg-[#E5F3FF] border border-[#A9D0F5] px-2 py-1">COA: {CHART_OF_ACCOUNTS.length} main accounts loaded from Chart of Accounts</span>
                <span className="text-[11px] bg-[#DFF6DD] border border-[#A7E3A5] px-2 py-1 hidden md:inline">💡 Why we map summary & posting profiles - avoids explanation to customer</span>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row flex-1 min-h-0">
              <div className="lg:w-[60%] bg-white border-r border-[#E1DFDD] flex flex-col min-h-[300px]">
                <div className="h-8 bg-[#F3F2F1] border-b border-[#E1DFDD] flex items-center px-2 text-[11px] font-semibold uppercase">
                  <span className="w-8">✓</span><span className="w-28">Module</span><span className="w-20">Type</span><span className="w-24">Code</span><span className="w-28">Main Account</span><span className="flex-1">Description</span><span className="w-20">Ledger</span>
                </div>
                <div className="flex-1 overflow-auto scrollbar-thin max-h-[45vh] lg:max-h-none">
                  {postings.map(p=>{
                    const accName = getAccountName(p.mainAccount);
                    return (
                    <div key={p.id} onClick={()=>setSelectedPostId(p.id)} title={`${p.mainAccount} - ${accName} | ${p.postingType} | ${p.module}`} className={`h-9 flex items-center px-2 text-[12px] border-b border-[#F3F2F1] cursor-pointer d365-grid-row ${selectedPostId===p.id?'d365-selected':''}`}>
                      <span className="w-8 flex justify-center"><span className={`w-[14px] h-[14px] border flex items-center justify-center ${selectedPostId===p.id?'bg-[#0078D4] border-[#0078D4] text-white text-[10px]':'border-[#8A8886] bg-white'}`}>{selectedPostId===p.id?'✓':''}</span></span>
                      <span className="w-28 truncate">{p.module}</span><span className="w-20"><span className={`px-1.5 py-0.5 text-[10px] border ${p.accType==='Summary'?'bg-[#E5F3FF] border-[#A9D0F5]':'bg-[#FFF4CE] border-[#FCE100]'}`}>{p.accType}</span></span>
                      <span className="w-24 font-mono text-[11px]">{p.code}</span>
                      <span className="w-28 font-mono flex flex-col leading-tight" title={`${p.mainAccount} - ${accName}`}>
                        <span className="font-semibold">{p.mainAccount}</span>
                        <span className="text-[10px] text-[#605E5C] truncate">{accName}</span>
                      </span>
                      <span className="flex-1 truncate pr-2">{p.desc}</span><span className="w-20">{p.ledger}</span>
                    </div>
                    );
                  })}
                </div>
                <div className="h-6 bg-[#FAF9F8] border-t border-[#E1DFDD] px-2 flex items-center text-[10px] text-[#605E5C] gap-3">
                  <span>Hover Main Account for name tooltip • Dropdown source: Chart of Accounts</span>
                  <span className="ml-auto">{postings.length} profiles</span>
                </div>
              </div>
              <div className="flex-1 bg-[#FAF9F8] p-3 overflow-auto scrollbar-thin">
                {selectedPosting ? (
                  <div className="bg-white border border-[#E1DFDD] shadow-sm">
                    <div className="h-9 bg-[#F3F2F1] border-b border-[#E1DFDD] px-3 flex items-center justify-between">
                      <span className="text-[13px] font-semibold flex items-center gap-2">▾ Summary account & Posting profiles — ALL modules
                        {isPostingEdit ? <span className="text-[10px] bg-[#FFF4CE] border border-[#FCE100] px-1.5 py-0.5">EDIT MODE — dropdowns enabled</span> : <span className="text-[10px] bg-[#EDEBE9] border border-[#E1DFDD] px-1.5 py-0.5">VIEW MODE — dropdowns locked</span>}
                      </span>
                      <span className="text-[10px] text-[#605E5C]">Form: LedgerPostingProfile | Table: MainAccount</span>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[12px] font-semibold">Module</label>
                        <select disabled={!isPostingEdit} value={selectedPosting.module} onChange={e=>updatePostingField('module', e.target.value)} className={`w-full mt-1 h-8 border px-2 text-[12px] ${!isPostingEdit ? 'bg-[#F3F2F1] text-[#605E5C]' : 'bg-white border-[#8A8886]'} `}>
                          {MODULES.map(m=><option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[12px] font-semibold">Account Type</label>
                        <select disabled={!isPostingEdit} value={selectedPosting.accType} onChange={e=>updatePostingField('accType', e.target.value)} className={`w-full mt-1 h-8 border px-2 text-[12px] ${!isPostingEdit ? 'bg-[#F3F2F1] text-[#605E5C]' : 'bg-white border-[#8A8886]'}`}>
                          <option>Summary</option><option>Posting</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[12px] font-semibold">Profile Code</label>
                        <input disabled={!isPostingEdit} value={selectedPosting.code} onChange={e=>updatePostingField('code', e.target.value)} className={`w-full mt-1 h-8 border px-2 text-[12px] ${!isPostingEdit ? 'bg-[#F3F2F1] text-[#605E5C]' : 'bg-white border-[#8A8886]'}`} />
                      </div>
                      {/* Main Account Dropdown - Chart of Accounts */}
                      <div ref={mainAccRef} className="relative">
                        <label className="text-[12px] font-semibold flex justify-between items-center">
                          <span>Main Account <span className="text-[#A80000]">*</span></span>
                          <span className="text-[10px] font-normal text-[#605E5C]">from Chart of Accounts ({CHART_OF_ACCOUNTS.length})</span>
                        </label>
                        <div className={`mt-1 relative flex items-center h-8 border px-2 text-[12px] font-mono ${postingErrors.mainAccount ? 'border-[#A80000] bg-[#FDE7E9]' : isPostingEdit ? 'bg-white border-[#8A8886] hover:border-[#323130] cursor-pointer' : 'bg-[#F3F2F1] border-[#E1DFDD] text-[#605E5C]'}`} onClick={()=>{
                          if(!isPostingEdit) return;
                          setShowMainAccDrop(!showMainAccDrop);
                          setShowPostingTypeDrop(false);
                        }}>
                          <span className="flex-1 truncate">{selectedPosting.mainAccount ? getAccountDisplay(selectedPosting.mainAccount) : '— Select main account —'}</span>
                          <span className={`ml-2 text-[14px] transition ${showMainAccDrop?'rotate-180':''}`}>▼</span>
                        </div>
                        {postingErrors.mainAccount && <div className="mt-1 text-[11px] text-[#A80000] flex items-center gap-1"><span>⚠</span>{postingErrors.mainAccount}</div>}
                        {showMainAccDrop && isPostingEdit && (
                          <div className="absolute z-20 top-[58px] left-0 right-0 bg-white border border-[#8A8886] shadow-[0_8px_24px_rgba(0,0,0,0.2)] max-h-[320px] flex flex-col">
                            <div className="p-2 border-b border-[#E1DFDD] bg-[#FAF9F8]">
                              <div className="relative">
                                <input autoFocus value={postingMainSearch} onChange={e=>setPostingMainSearch(e.target.value)} placeholder="Search account number or name... e.g. 100000 or Cash" className="w-full h-8 pl-8 pr-2 border border-[#8A8886] text-[12px] focus:border-[#0078D4] focus:outline-none" />
                                <span className="absolute left-2 top-1.5 text-[14px]">🔍</span>
                              </div>
                              <div className="mt-1 text-[10px] text-[#605E5C]">{filteredChartAccounts.length} accounts • Type to filter • D365 Lookup style</div>
                            </div>
                            <div className="overflow-auto scrollbar-thin flex-1">
                              {filteredChartAccounts.map(ca=>(
                                <div key={ca.account} onClick={()=>{
                                  updatePostingField('mainAccount', ca.account);
                                  setShowMainAccDrop(false);
                                  setPostingMainSearch('');
                                }} className={`h-10 px-2 flex items-center gap-2 cursor-pointer border-b border-[#F3F2F1] hover:bg-[#E5F3FF] ${selectedPosting.mainAccount===ca.account?'bg-[#E5F3FF]':''}`}>
                                  <span className="font-mono font-semibold w-20 text-[12px]">{ca.account}</span>
                                  <span className="flex-1 text-[12px] truncate">{ca.name}</span>
                                  <span className="text-[10px] bg-[#F3F2F1] border px-1">{ca.type}</span>
                                  <span className="text-[10px] text-[#605E5C] hidden md:inline truncate max-w-[90px]">{ca.module.split(' ')[0]}</span>
                                  {selectedPosting.mainAccount===ca.account && <span className="text-[#0078D4]">✓</span>}
                                </div>
                              ))}
                              {filteredChartAccounts.length===0 && <div className="p-4 text-center text-[11px] text-[#605E5C]">No matching accounts — try different search</div>}
                            </div>
                            <div className="h-7 bg-[#F3F2F1] border-t border-[#E1DFDD] px-2 flex items-center justify-between text-[10px] text-[#605E5C]">
                              <span>MainAccount table • Ledger: USMF</span>
                              <button onClick={()=>setShowMainAccDrop(false)} className="px-2 h-5 bg-white border border-[#8A8886] text-[10px]">Close</button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="col-span-2"><label className="text-[12px] font-semibold">Description</label><input disabled={!isPostingEdit} value={selectedPosting.desc} onChange={e=>updatePostingField('desc', e.target.value)} className={`w-full mt-1 h-8 border px-2 text-[12px] ${!isPostingEdit ? 'bg-[#F3F2F1] text-[#605E5C]' : 'bg-white border-[#8A8886]'}`} /></div>
                      <div className="col-span-2"><label className="text-[12px] font-semibold">Explanation (why we map this)</label><textarea disabled={!isPostingEdit} value={selectedPosting.explanation} onChange={e=>updatePostingField('explanation', e.target.value)} className={`w-full mt-1 h-16 border p-2 text-[12px] resize-none ${!isPostingEdit ? 'bg-[#F3F2F1] text-[#605E5C]' : 'bg-white border-[#8A8886]'}`} placeholder="Why we map summary & posting profiles - avoids explanation to customer" /></div>
                      <div><label className="text-[12px] font-semibold">Ledger</label><input disabled={!isPostingEdit} value={selectedPosting.ledger} onChange={e=>updatePostingField('ledger', e.target.value)} className={`w-full mt-1 h-8 border px-2 text-[12px] ${!isPostingEdit ? 'bg-[#F3F2F1] text-[#605E5C]' : 'bg-white border-[#8A8886]'}`} /></div>

                      {/* Posting Type Dropdown */}
                      <div ref={postTypeRef} className="relative">
                        <label className="text-[12px] font-semibold flex justify-between items-center">
                          <span>Posting Type <span className="text-[#A80000]">*</span></span>
                          <span className="text-[10px] font-normal text-[#605E5C]">{POSTING_TYPES.length} types • {lang} translation</span>
                        </label>
                        <div className={`mt-1 relative flex items-center h-8 border px-2 text-[12px] ${postingErrors.postingType ? 'border-[#A80000] bg-[#FDE7E9]' : isPostingEdit ? 'bg-white border-[#8A8886] hover:border-[#323130] cursor-pointer' : 'bg-[#F3F2F1] border-[#E1DFDD] text-[#605E5C]'}`} onClick={()=>{
                          if(!isPostingEdit) return;
                          setShowPostingTypeDrop(!showPostingTypeDrop);
                          setShowMainAccDrop(false);
                        }}>
                          <span className="flex-1 truncate">{selectedPosting.postingType ? `${selectedPosting.postingType} — ${POSTING_TYPES.find(p=>p.value===selectedPosting.postingType)?.desc || ''}` : '— Select posting type —'}</span>
                          <span className={`ml-2 text-[14px] transition ${showPostingTypeDrop?'rotate-180':''}`}>▼</span>
                        </div>
                        {postingErrors.postingType && <div className="mt-1 text-[11px] text-[#A80000] flex items-center gap-1"><span>⚠</span>{postingErrors.postingType}</div>}
                        {showPostingTypeDrop && isPostingEdit && (
                          <div className="absolute z-20 top-[58px] left-0 right-0 bg-white border border-[#8A8886] shadow-[0_8px_24px_rgba(0,0,0,0.2)] max-h-[380px] flex flex-col">
                            <div className="p-2 border-b border-[#E1DFDD] bg-[#FAF9F8]">
                              <div className="relative">
                                <input autoFocus value={postingTypeSearch} onChange={e=>setPostingTypeSearch(e.target.value)} placeholder="Search posting type, module, e.g. Vendor balance, Tax, Inventory" className="w-full h-8 pl-8 pr-2 border border-[#8A8886] text-[12px] focus:border-[#0078D4] focus:outline-none" />
                                <span className="absolute left-2 top-1.5 text-[14px]">🔍</span>
                              </div>
                              <div className="mt-1 flex items-center justify-between text-[10px] text-[#605E5C]">
                                <span>{filteredPostingTypes.length} types • Grouped by module • D365 posting definition</span>
                                <span className="bg-[#E5F3FF] border border-[#A9D0F5] px-1">{lang}</span>
                              </div>
                            </div>
                            <div className="overflow-auto scrollbar-thin flex-1">
                              {groupedPostingTypes.map(group=>(
                                <div key={group.module}>
                                  <div className="h-6 bg-[#F3F2F1] border-b border-[#E1DFDD] px-2 flex items-center text-[10px] font-semibold uppercase tracking-wide">{group.module} ({group.items.length})</div>
                                  {group.items.map(pt=>(
                                    <div key={pt.value} onClick={()=>{
                                      updatePostingField('postingType', pt.value);
                                      setShowPostingTypeDrop(false);
                                      setPostingTypeSearch('');
                                    }} className={`min-h-[36px] px-2 py-1 flex items-center gap-2 cursor-pointer border-b border-[#F3F2F1] hover:bg-[#E5F3FF] ${selectedPosting.postingType===pt.value?'bg-[#E5F3FF]':''}`}>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-[12px]">{translatePostingLabel(pt)}</span>
                                          <span className="text-[10px] bg-[#EDEBE9] border px-1">{pt.value}</span>
                                          {lang!=='EN' && <span className="text-[10px] text-[#605E5C]">({pt.label})</span>}
                                        </div>
                                        <div className="text-[10px] text-[#605E5C]">{pt.desc}</div>
                                      </div>
                                      {selectedPosting.postingType===pt.value && <span className="text-[#0078D4]">✓</span>}
                                    </div>
                                  ))}
                                </div>
                              ))}
                              {filteredPostingTypes.length===0 && <div className="p-4 text-center text-[11px] text-[#605E5C]">No matching posting types</div>}
                            </div>
                            <div className="h-7 bg-[#F3F2F1] border-t border-[#E1DFDD] px-2 flex items-center justify-between text-[10px] text-[#605E5C]">
                              <span>Posting type definition • SysPostingType table</span>
                              <button onClick={()=>setShowPostingTypeDrop(false)} className="px-2 h-5 bg-white border border-[#8A8886] text-[10px]">Close</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="px-4 pb-3 flex flex-wrap gap-2 text-[11px]">
                      <span className={`px-2 py-1 border ${isPostingEdit?'bg-[#FFF4CE] border-[#FCE100]':'bg-[#F3F2F1] border-[#E1DFDD]'}`}>{isPostingEdit ? '✎ Edit mode: dropdowns are searchable — Main Account pulls from Chart of Accounts' : '🔒 View mode: dropdowns locked — click Edit to enable'}</span>
                      <span className="px-2 py-1 bg-[#E5F3FF] border border-[#A9D0F5]">Main Account lookup: MainAccount table • {CHART_OF_ACCOUNTS.length} accounts</span>
                      <span className="px-2 py-1 bg-[#DFF6DD] border border-[#A7E3A5]">Posting Type: {POSTING_TYPES.length} D365 standard types • translated ({lang})</span>
                    </div>
                    {isPostingEdit && (
                      <div className="px-4 pb-4 flex gap-2">
                        <button onClick={handlePostingSave} className="h-8 px-4 bg-[#0078D4] text-white text-[12px] font-semibold flex items-center gap-1.5">💾 Save — Validate required</button>
                        <button onClick={()=>{setIsPostingEdit(false); setPostingErrors({});}} className="h-8 px-4 bg-white border border-[#8A8886] text-[12px] font-semibold">Cancel</button>
                        <span className="text-[11px] text-[#605E5C] flex items-center">Auto-save will trigger on field change — required fields: Main Account, Posting Type</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white border border-dashed border-[#C8C6C4] p-8 text-center text-[12px] text-[#605E5C]">Select a posting profile to view Main Account & Posting Type dropdowns</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* WORKFLOW */}
        {activeTab==='Workflow' && (
          <>
            <div className="bg-[#F3F2F1] border-b border-[#E1DFDD] px-2 py-2 flex items-center gap-1">
              <button onClick={handleAddWorkflow} className="h-8 px-3 bg-white border border-[#8A8886] text-[12px] font-semibold">＋ New</button>
              <button className="h-8 px-3 bg-white border border-[#8A8886] text-[12px] font-semibold">Edit</button>
              <button disabled={role==='Customer'} className="h-8 px-3 bg-white border border-[#8A8886] text-[12px] font-semibold disabled:opacity-40">Delete</button>
              <span className="ml-3 text-[11px] text-[#605E5C]">Minimum form entry for D365 F&O workflow creation on integration</span>
            </div>
            <div className="flex flex-col lg:flex-row flex-1">
              <div className="lg:w-[55%] bg-white border-r border-[#E1DFDD]">
                <div className="h-8 bg-[#F3F2F1] border-b border-[#E1DFDD] flex items-center px-2 text-[11px] font-semibold uppercase">
                  <span className="w-8">✓</span><span className="w-48">Workflow Name</span><span className="w-28">Module</span><span className="w-20">Type</span><span className="flex-1">Approver</span>
                </div>
                {workflows.map(w=>(
                  <div key={w.id} onClick={()=>setSelectedWfId(w.id)} className={`h-9 flex items-center px-2 text-[12px] border-b border-[#F3F2F1] cursor-pointer d365-grid-row ${selectedWfId===w.id?'d365-selected':''}`}>
                    <span className="w-8 flex justify-center"><span className={`w-[14px] h-[14px] border flex items-center justify-center ${selectedWfId===w.id?'bg-[#0078D4] border-[#0078D4] text-white text-[10px]':'border-[#8A8886] bg-white'}`}>{selectedWfId===w.id?'✓':''}</span></span>
                    <span className="w-48 truncate font-semibold">{w.name}</span><span className="w-28 truncate">{w.module}</span><span className="w-20"><span className="px-1.5 py-0.5 bg-[#F3F2F1] border text-[10px]">{w.wType}</span></span><span className="flex-1 truncate">{w.approver}</span>
                  </div>
                ))}
              </div>
              <div className="flex-1 bg-[#FAF9F8] p-3 space-y-3">
                {selectedWorkflow && (
                  <>
                    <div className="bg-white border border-[#E1DFDD]">
                      <div className="h-9 bg-[#F3F2F1] border-b px-3 flex items-center text-[13px] font-semibold">▾ Workflow — Create workflow with minimum form entry</div>
                      <div className="p-4 grid grid-cols-2 gap-4">
                        <div className="col-span-2"><label className="text-[12px] font-semibold">Workflow Name</label><input value={selectedWorkflow.name} onChange={e=>setWorkflows(workflows.map(x=>x.id===selectedWfId?{...x,name:e.target.value}:x))} className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[12px]" /></div>
                        <div><label className="text-[12px] font-semibold">Module</label><select value={selectedWorkflow.module} onChange={e=>setWorkflows(workflows.map(x=>x.id===selectedWfId?{...x,module:e.target.value as ModuleName}:x))} className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[12px] bg-white">{MODULES.map(m=><option key={m}>{m}</option>)}</select></div>
                        <div><label className="text-[12px] font-semibold">Workflow Type</label><select value={selectedWorkflow.wType} onChange={e=>setWorkflows(workflows.map(x=>x.id===selectedWfId?{...x,wType:e.target.value as any}:x))} className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[12px] bg-white"><option>Approval</option><option>Review</option><option>Task</option></select></div>
                        <div><label className="text-[12px] font-semibold">Approver</label><input value={selectedWorkflow.approver} onChange={e=>setWorkflows(workflows.map(x=>x.id===selectedWfId?{...x,approver:e.target.value}:x))} className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[12px]" /></div>
                        <div><label className="text-[12px] font-semibold">Condition</label><input value={selectedWorkflow.condition} onChange={e=>setWorkflows(workflows.map(x=>x.id===selectedWfId?{...x,condition:e.target.value}:x))} className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[12px]" /></div>
                        <div><label className="text-[12px] font-semibold">Escalation</label><input value={selectedWorkflow.escalation} onChange={e=>setWorkflows(workflows.map(x=>x.id===selectedWfId?{...x,escalation:e.target.value}:x))} className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[12px]" /></div>
                        <div><label className="text-[12px] font-semibold">Notification</label><input value={selectedWorkflow.notification} onChange={e=>setWorkflows(workflows.map(x=>x.id===selectedWfId?{...x,notification:e.target.value}:x))} className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[12px]" /></div>
                      </div>
                    </div>
                    <div className="bg-[#1F1F1F] border border-[#333] p-3">
                      <div className="text-[11px] font-semibold text-[#A19F9D] mb-2 uppercase tracking-wide">Preview: Workflow config JSON — for D365 F&O integration</div>
                      <pre className="text-[11px] font-mono text-[#D4D4D4] overflow-auto">{JSON.stringify({ workflowName: selectedWorkflow.name, module: selectedWorkflow.module, type: selectedWorkflow.wType, approval: { approver: selectedWorkflow.approver, condition: selectedWorkflow.condition, escalationPath: selectedWorkflow.escalation, notification: selectedWorkflow.notification }, integrationTarget: "WorkflowConfiguration", entity: "WorkflowTable" }, null, 2)}</pre>
                      <div className="mt-2 flex gap-2"><button onClick={()=>navigator.clipboard.writeText(JSON.stringify(selectedWorkflow))} className="h-7 px-3 bg-white text-black text-[11px] font-semibold">Copy JSON</button><button className="h-7 px-3 bg-[#0078D4] text-white text-[11px] font-semibold">Export to D365</button></div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* PARAMETERS */}
        {activeTab==='Parameters' && (
          <>
            <div className="bg-[#F3F2F1] border-b border-[#E1DFDD] px-2 py-2 flex flex-wrap items-center gap-1">
              <span className="text-[12px] font-semibold mr-2 hidden md:inline">FastTabs:</span>
              <button onClick={handleOpenNewFastTab} disabled={role==='Customer'} className={`h-8 px-3 bg-white border border-[#8A8886] text-[12px] font-semibold flex items-center gap-1 hover:bg-[#EDEBE9] ${role==='Customer'?'opacity-40 cursor-not-allowed':''}`}><span>＋</span> New FastTab</button>
              <button onClick={handleParamEditEnter} disabled={role==='Customer' || !selectedParamId || isParamEdit} className={`h-8 px-3 border text-[12px] font-semibold flex items-center gap-1 ${!selectedParamId || isParamEdit ? 'bg-[#F3F2F1] border-[#E1DFDD] text-[#A19F9D] opacity-60' : role==='Customer' ? 'bg-white border-[#8A8886] opacity-40' : 'bg-white border-[#8A8886] hover:bg-[#EDEBE9] text-[#323130]'}`}><span>✎</span> Edit</button>
              <button onClick={handleRequestDeleteFastTab} disabled={role==='Customer' || !selectedParamId} className={`h-8 px-3 bg-white border border-[#8A8886] text-[12px] font-semibold flex items-center gap-1 ${!selectedParamId || role==='Customer' ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#FDE7E9] hover:border-[#A80000] hover:text-[#A80000]'}`}><span>🗑</span> Delete</button>
              <button onClick={handleParamSave} disabled={!isParamEdit} className={`h-8 px-3 border text-[12px] font-semibold flex items-center gap-1.5 transition ${!isParamEdit ? 'bg-[#F3F2F1] border-[#E1DFDD] text-[#A19F9D] cursor-not-allowed' : isParamDirty ? 'bg-[#0078D4] border-[#0078D4] text-white hover:bg-[#106EBE]' : 'bg-white border-[#8A8886] text-[#323130] hover:bg-[#EDEBE9]'}`}><span>💾</span> Save {isParamDirty && <span className="w-1.5 h-1.5 bg-[#FFB900] rounded-full animate-pulse ml-1"></span>}</button>
              <button onClick={handleParamCancel} disabled={!isParamEdit} className={`h-8 px-3 bg-white border border-[#8A8886] text-[12px] font-semibold ${!isParamEdit ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#F3F2F1]'}`}>Cancel</button>
              <div className="w-[1px] h-6 bg-[#E1DFDD] mx-2 hidden md:block"></div>
              <button onClick={()=>setShowVersionHistory(!showVersionHistory)} className={`h-8 px-3 bg-white border text-[12px] font-semibold flex items-center gap-1 ${showVersionHistory ? 'border-[#0078D4] bg-[#E5F3FF] text-[#004578]' : 'border-[#8A8886] hover:bg-[#F3F2F1]'}`}><span>🕒</span> Version History ({paramVersions.length})</button>
              <div className="ml-auto flex items-center gap-2">
                <span className={`text-[11px] px-2 py-1 border ${isParamEdit ? (isParamDirty ? 'bg-[#FFF4CE] border-[#FCE100] text-[#8A5700]' : 'bg-[#E5F3FF] border-[#A9D0F5] text-[#004578]') : 'bg-[#F3F2F1] border-[#E1DFDD] text-[#605E5C]'}`}>{isParamEdit ? (isParamDirty ? '✎ Edit mode — dirty, Save required' : '✎ Edit mode — no changes') : '🔒 View mode'}</span>
                <span className="text-[11px] text-[#605E5C] hidden lg:inline">Like D365 F&O Parameters form — Every module has parameters which decide how module functions</span>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row flex-1 min-h-0">
              <div className="lg:w-[300px] bg-white border-r border-[#E1DFDD] flex flex-col min-h-[260px]">
                <div className="h-8 bg-[#F3F2F1] border-b border-[#E1DFDD] px-3 text-[11px] font-semibold uppercase flex items-center justify-between">
                  <span>Parameters FastTabs ({paramTabs.length})</span>
                  <span className="text-[10px] font-normal normal-case text-[#605E5C]">{paramTabs.reduce((a,b)=>a+b.fields.length,0)} fields</span>
                </div>
                <div className="flex-1 overflow-auto scrollbar-thin">
                  {paramTabs.map(ft=>(
                    <div key={ft.id} onClick={()=>{ setSelectedParamId(ft.id); setInteractionTick(t=>t+1); setLastAction(`Selected FastTab '${ft.title}' — ${ft.fields.length} fields`); }} className={`h-[52px] px-3 flex items-center gap-2 border-b border-[#F3F2F1] cursor-pointer group ${selectedParamId===ft.id?'bg-[#E5F3FF] border-l-4 border-l-[#0078D4] !border-b-[#A9D0F5]':'hover:bg-[#F3F2F1] border-l-4 border-l-transparent'}`}>
                      <span className={`w-[14px] h-[14px] border flex items-center justify-center text-[10px] shrink-0 ${selectedParamId===ft.id?'bg-[#0078D4] border-[#0078D4] text-white':'border-[#8A8886] bg-white group-hover:border-[#323130]'}`}>{selectedParamId===ft.id?'✓':''}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold truncate">{ft.title}</div>
                        <div className="text-[11px] text-[#605E5C] truncate">{ft.module} • {ft.fields.length} fields</div>
                      </div>
                      {selectedParamId===ft.id && <span className="text-[10px] bg-white border border-[#E1DFDD] px-1 hidden md:inline">SELECTED</span>}
                    </div>
                  ))}
                  {paramTabs.length===0 && <div className="p-8 text-center text-[12px] text-[#605E5C]">No FastTabs — Click + New FastTab to create</div>}
                </div>
                {showVersionHistory && (
                  <div className="border-t border-[#E1DFDD] bg-[#FAF9F8] max-h-[200px] overflow-auto">
                    <div className="h-7 bg-[#F3F2F1] border-b px-2 text-[10px] font-semibold uppercase flex items-center justify-between"><span>Version History — in-memory drafts</span><button onClick={()=>setShowVersionHistory(false)} className="w-5 h-5 bg-white border">×</button></div>
                    {paramVersions.map(v=>(
                      <div key={v.id} className="px-2 py-1.5 border-b border-[#F3F2F1] text-[11px] bg-white">
                        <div className="flex justify-between"><span className="font-semibold">{v.id}</span><span className="text-[10px] text-[#605E5C]">{v.ts}</span></div>
                        <div className="text-[#605E5C] truncate">{v.note} • {v.count} fields</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-1 bg-[#FAF9F8] p-3 flex flex-col gap-3 overflow-auto scrollbar-thin">
                {selectedParam ? (
                  <div className="bg-white border border-[#E1DFDD] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                    <div className="h-9 bg-[#F3F2F1] border-b border-[#E1DFDD] px-3 flex items-center justify-between">
                      <span className="text-[13px] font-semibold flex items-center gap-2">▾ {selectedParam.title} — {selectedParam.module} {isParamEdit && <span className="text-[10px] bg-[#FFF4CE] border border-[#FCE100] px-1.5 py-0.5 font-normal">EDITABLE</span>}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={handleAddParamField} disabled={role==='Customer'} className={`h-6 px-2 border text-[11px] font-semibold flex items-center gap-1 ${role==='Customer' ? 'opacity-40 bg-[#F3F2F1] border-[#E1DFDD]' : isParamEdit ? 'bg-[#0078D4] border-[#0078D4] text-white hover:bg-[#106EBE]' : 'bg-white border-[#8A8886] hover:bg-[#F3F2F1]'}`}>+ Add field</button>
                        {isParamEdit && <span className="text-[10px] text-[#605E5C] ml-2 hidden md:inline">Fields become editable — changes mark dirty</span>}
                      </div>
                    </div>
                    <div className="divide-y divide-[#F3F2F1]">
                      {selectedParam.fields.map(f=>(
                        <div key={f.id} className={`p-3 flex gap-3 items-start group ${isParamEdit ? 'bg-white' : 'bg-[#FAFAFA]'}`}>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-semibold flex justify-between">Field Name {isParamEdit && <span className="font-normal text-[10px] text-[#605E5C]">{f.name.length}/50</span>}</label>
                              <input disabled={!isParamEdit || role==='Customer'} value={f.name} onChange={e=>handleUpdateParamField(f.id, {name: e.target.value.slice(0,50)})} className={`w-full mt-1 h-7 px-2 text-[12px] border ${!isParamEdit ? 'bg-[#F3F2F1] border-[#E1DFDD] text-[#605E5C] cursor-not-allowed' : 'bg-white border-[#8A8886] focus:border-[#0078D4] focus:outline-none'}`} />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold flex justify-between">Importance / Description {isParamEdit && <span className="font-normal text-[10px] text-[#605E5C]">{f.importance.length}/100</span>}</label>
                              <input disabled={!isParamEdit || role==='Customer'} value={f.importance} onChange={e=>handleUpdateParamField(f.id, {importance: e.target.value.slice(0,100)})} className={`w-full mt-1 h-7 px-2 text-[12px] border ${!isParamEdit ? 'bg-[#F3F2F1] border-[#E1DFDD] text-[#605E5C] cursor-not-allowed' : 'bg-white border-[#8A8886] focus:border-[#0078D4] focus:outline-none'}`} />
                            </div>
                          </div>
                          <button onClick={()=>handleRequestDeleteField(selectedParam.id, f.id, f.name)} disabled={role==='Customer'} title={role==='Customer' ? 'Delete disabled in Customer View' : `Delete field '${f.name}'`} className={`w-7 h-7 border text-[12px] mt-5 flex items-center justify-center shrink-0 ${role==='Customer' ? 'bg-[#F3F2F1] border-[#E1DFDD] text-[#A19F9D] cursor-not-allowed opacity-40' : 'bg-white border-[#8A8886] hover:bg-[#FDE7E9] hover:border-[#A80000] hover:text-[#A80000] active:bg-[#F7B0B5]'}`}>×</button>
                        </div>
                      ))}
                      {selectedParam.fields.length===0 && <div className="p-8 text-center text-[12px] text-[#605E5C] flex flex-col items-center gap-2"><span>No fields — Add field to define parameter behavior</span><button onClick={handleAddParamField} disabled={role==='Customer'} className="h-7 px-3 bg-white border border-[#8A8886] text-[11px] font-semibold">+ Add first field</button></div>}
                    </div>
                    <div className="h-8 bg-[#FAF9F8] border-t border-[#E1DFDD] px-3 flex items-center justify-between text-[10px] text-[#605E5C]">
                      <span>{isParamEdit ? '✎ Edit mode: inputs enabled, X deletes field (with confirmation), Add field enabled' : '🔒 View mode: click Edit to enable field editing and deletion'}</span>
                      <span className="hidden md:inline">{selectedParam.fields.length} fields • Module: {selectedParam.module}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-dashed border-[#C8C6C4] p-12 text-center text-[13px] text-[#605E5C]">Select a FastTab from left list — or create new via + New FastTab button (requires Consultant role)</div>
                )}
                <div className="bg-white border border-[#E1DFDD] p-3 text-[11px] text-[#605E5C] leading-[1.5]">
                  <div className="font-semibold text-[#323130] mb-1">D365 Parameters form behavior — Fixed:</div>
                  <div>• <b>Save button</b> now visible: [+ New FastTab] [Edit] [Delete] [Save] [Cancel] [Version History] — Save disabled in View mode, enabled when dirty, flushes auto-saves, creates version entry, toast "Parameters saved"</div>
                  <div>• <b>Delete FastTab:</b> selects FastTab (e.g., General) → Delete → confirmation "Delete FastTab 'General' and its 2 fields? This cannot be undone." → removes from list, auto-save, increments version</div>
                  <div>• <b>Delete Field:</b> X button on right now functional — shows confirmation dialog, deletes field, marks dirty, requires Save</div>
                  <div>• <b>Edit flow:</b> Edit enters edit mode, enables inputs, Save/Cancel enabled. Delete enabled when FastTab selected (even in View mode) with confirmation per F&O pattern</div>
                  <div>• All data stays in-memory (no external persistence) — versions are local drafts, Status bar still shows Chart of Accounts etc</div>
                </div>
              </div>
            </div>
            {/* Delete FastTab Confirmation Dialog */}
            {showParamDeleteConfirm && selectedParam && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white border border-[#8A8886] shadow-[0_8px_32px_rgba(0,0,0,0.3)] w-[420px] max-w-[90vw]">
                  <div className="h-9 bg-black text-white px-3 flex items-center justify-between text-[12px] font-semibold"><span>Confirm Delete — FastTab</span><button onClick={()=>setShowParamDeleteConfirm(false)} className="w-6 h-6 bg-[#333] flex items-center justify-center">×</button></div>
                  <div className="p-4">
                    <div className="text-[13px] text-[#323130]">Delete FastTab <b>'{selectedParam.title}'</b> and its <b>{selectedParam.fields.length} fields</b>? This cannot be undone.</div>
                    <div className="mt-3 p-2 bg-[#FDE7E9] border border-[#F7B0B5] text-[11px] text-[#A80000]">⚠ This will remove the FastTab from parameters list and create a version entry.</div>
                    <div className="mt-4 flex justify-end gap-2">
                      <button onClick={()=>setShowParamDeleteConfirm(false)} className="h-8 px-4 bg-white border border-[#8A8886] text-[12px] font-semibold">Cancel</button>
                      <button onClick={handleConfirmDeleteFastTab} className="h-8 px-4 bg-[#A80000] text-white text-[12px] font-semibold hover:bg-[#7A0000]">Delete FastTab</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Delete Field Confirmation Dialog */}
            {showFieldDeleteConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white border border-[#8A8886] shadow-[0_8px_32px_rgba(0,0,0,0.3)] w-[400px] max-w-[90vw]">
                  <div className="h-9 bg-black text-white px-3 flex items-center justify-between text-[12px] font-semibold"><span>Confirm Delete — Field</span><button onClick={()=>setShowFieldDeleteConfirm(null)} className="w-6 h-6 bg-[#333] flex items-center justify-center">×</button></div>
                  <div className="p-4">
                    <div className="text-[13px]">Delete field <b>'{showFieldDeleteConfirm.fieldName}'</b>?</div>
                    <div className="mt-2 text-[11px] text-[#605E5C]">This will remove the field from FastTab. You will need to Save to commit.</div>
                    <div className="mt-4 flex justify-end gap-2">
                      <button onClick={()=>setShowFieldDeleteConfirm(null)} className="h-8 px-4 bg-white border border-[#8A8886] text-[12px] font-semibold">Cancel</button>
                      <button onClick={handleConfirmDeleteField} className="h-8 px-4 bg-[#A80000] text-white text-[12px] font-semibold">Delete Field</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* New FastTab Dialog */}
            {showNewFastTabDialog && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white border border-[#8A8886] shadow-[0_8px_32px_rgba(0,0,0,0.3)] w-[420px] max-w-[90vw]">
                  <div className="h-9 bg-black text-white px-3 flex items-center justify-between text-[12px] font-semibold"><span>Create New FastTab — Parameters</span><button onClick={()=>setShowNewFastTabDialog(false)} className="w-6 h-6 bg-[#333] flex items-center justify-center">×</button></div>
                  <div className="p-4 space-y-3">
                    <div><label className="text-[11px] font-semibold">FastTab Title <span className="text-[#A80000]">*</span></label><input autoFocus value={newFastTabTitle} onChange={e=>setNewFastTabTitle(e.target.value)} placeholder="e.g., General, Number sequences, Ledger" className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[12px] focus:border-[#0078D4] focus:outline-none" /></div>
                    <div><label className="text-[11px] font-semibold">Module</label><select value={newFastTabModule} onChange={e=>setNewFastTabModule(e.target.value as any)} className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[12px] bg-white">{MODULES.map(m=><option key={m} value={m}>{m}</option>)}</select></div>
                    <div className="text-[10px] text-[#605E5C]">Creates new FastTab, enters edit mode — D365 pattern: FastTab holds parameter fields</div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={()=>setShowNewFastTabDialog(false)} className="h-8 px-4 bg-white border border-[#8A8886] text-[12px] font-semibold">Cancel</button>
                      <button onClick={handleConfirmNewFastTab} className="h-8 px-4 bg-[#0078D4] text-white text-[12px] font-semibold hover:bg-[#106EBE]">Create & Edit</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* SYSTEM ADMIN - FULLY REBUILT */}
        {activeTab==='System Admin' && (
          <div className="flex flex-col flex-1 bg-[#FAF9F8] overflow-auto scrollbar-thin">
            {/* TOP Action Bar for System Admin */}
            <div className="bg-[#F3F2F1] border-b border-[#E1DFDD] px-2 py-2 flex flex-wrap items-center gap-1 sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <span className="text-[11px] bg-black text-white px-2 py-1">Action: Opened System Admin — {new Date().toLocaleTimeString()}</span>
                <span className="text-[11px] text-[#605E5C] hidden md:inline">Form: EP_SystemAdmin | Environment: UAT</span>
              </div>
              <div className="ml-auto flex items-center gap-2 text-[11px]">
                <span className="bg-white border border-[#E1DFDD] px-2 py-1">Companies: {companies.length} • Roles: {roles.length} • COA Lines: {coaLines.length}</span>
                <span className="w-2 h-2 rounded-full bg-[#107C10] inline-block"></span><span>UAT</span>
              </div>
            </div>

            <div className="p-3 space-y-4">
              {/* FASTTAB 1: Create Company */}
              <div className="bg-white border border-[#E1DFDD] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                <div className="h-[44px] bg-[#F3F2F1] border-b border-[#E1DFDD] px-3 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[13px] font-semibold">▼ Create Company</span>
                  <div className="flex items-center gap-1">
                    <button onClick={handleNewCompany} className="h-7 px-3 bg-white border border-[#8A8886] text-[11px] font-semibold hover:bg-[#EDEBE9] flex items-center gap-1"><span>＋</span> New Company</button>
                    <button onClick={handleEditCompany} disabled={!selectedCompanyId} className="h-7 px-2 bg-white border border-[#8A8886] text-[11px] font-semibold disabled:opacity-40 hover:bg-[#EDEBE9]">✎ Edit</button>
                    <button onClick={()=>selectedCompany && handleCompanyDeleteRequest(selectedCompany)} disabled={role==='Customer' || !selectedCompanyId} className={`h-7 px-2 border text-[11px] font-semibold ${role==='Customer'?'opacity-40 bg-[#F3F2F1]':'bg-white border-[#8A8886] hover:bg-[#FDE7E9] hover:border-[#A80000]'}`}>🗑 Delete</button>
                    <button onClick={handleCompanySave} disabled={!isCompanyEdit} className={`h-7 px-3 border text-[11px] font-semibold ${!isCompanyEdit?'bg-[#F3F2F1] border-[#E1DFDD] text-[#A19F9D] opacity-60':'bg-[#0078D4] border-[#0078D4] text-white hover:bg-[#106EBE]'}`}>💾 Save</button>
                    <button onClick={handleCompanyCancel} disabled={!isCompanyEdit} className="h-7 px-2 bg-white border border-[#8A8886] text-[11px] font-semibold disabled:opacity-40">Cancel</button>
                  </div>
                </div>
                <div className="flex flex-col lg:flex-row">
                  {/* Left grid */}
                  <div className="lg:w-[60%] border-r border-[#E1DFDD] flex flex-col">
                    <div className="h-8 bg-[#F3F2F1] border-b border-[#E1DFDD] flex items-center px-2 text-[11px] font-semibold uppercase">
                      <span className="w-8">✓</span><span className="w-20">Company ID</span><span className="w-40">Company Name</span><span className="w-40">Address</span><span className="flex-1">Executive Summary</span><span className="w-24">Created On</span>
                    </div>
                    <div className="max-h-[260px] overflow-auto scrollbar-thin">
                      {companies.map(c=>(
                        <div key={c.id} onClick={()=>{setSelectedCompanyId(c.id); setLastAction(`Selected company ${c.code} — ${c.name}`); setInteractionTick(t=>t+1);}} className={`h-9 flex items-center px-2 text-[12px] border-b border-[#F3F2F1] cursor-pointer ${selectedCompanyId===c.id?'bg-[#E5F3FF] !border-b-[#A9D0F5] outline outline-1 outline-[#0078D4] -outline-offset-1': 'd365-grid-row hover:bg-[#F3F2F1]'}`}>
                          <span className="w-8 flex justify-center"><span className={`w-[14px] h-[14px] border flex items-center justify-center text-[10px] ${selectedCompanyId===c.id?'bg-[#0078D4] border-[#0078D4] text-white':'bg-white border-[#8A8886]'}`}>{selectedCompanyId===c.id?'✓':''}</span></span>
                          <span className="w-20 font-mono font-semibold">{c.code}</span>
                          <span className="w-40 truncate font-semibold">{c.name || '(new)'}</span>
                          <span className="w-40 truncate text-[#605E5C]">{c.address}</span>
                          <span className="flex-1 truncate text-[#605E5C]">{c.summary}</span>
                          <span className="w-24 text-[11px]">{c.createdDate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Right form */}
                  <div className="flex-1 p-3 bg-[#FAF9F8]">
                    {selectedCompany ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[11px] font-semibold">Company Name <span className="text-[#A80000]">*</span></label>
                          <input disabled={!isCompanyEdit} value={selectedCompany.name} onChange={e=>updateCompanyField('name', e.target.value)} placeholder="Contoso Entertainment USA" className={`w-full mt-1 h-8 px-2 border text-[12px] ${!isCompanyEdit?'bg-[#F3F2F1] border-[#E1DFDD] text-[#605E5C]':'bg-[#FFF4CE] border-[#8A8886] focus:border-[#0078D4] focus:outline-none'}`} />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold">Address <span className="text-[#A80000]">*</span></label>
                          <input disabled={!isCompanyEdit} value={selectedCompany.address} onChange={e=>updateCompanyField('address', e.target.value)} placeholder="1234 Contoso Blvd, Seattle" className={`w-full mt-1 h-8 px-2 border text-[12px] ${!isCompanyEdit?'bg-[#F3F2F1] border-[#E1DFDD]':'bg-[#FFF4CE] border-[#8A8886]'}`} />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold">Executive Summary</label>
                          <textarea disabled={!isCompanyEdit} value={selectedCompany.summary} onChange={e=>updateCompanyField('summary', e.target.value)} placeholder="Leading entertainment company..." className={`w-full mt-1 h-24 p-2 border text-[12px] resize-none ${!isCompanyEdit?'bg-[#F3F2F1] border-[#E1DFDD]':'bg-[#FFF4CE] border-[#8A8886]'}`}></textarea>
                        </div>
                        <div className="text-[10px] text-[#605E5C]">Legal entity: {selectedCompany.code} • Ledger: {selectedCompany.ledger} • Organization administration &gt; Organizations &gt; Legal entities</div>
                        {!isCompanyEdit && <div className="text-[10px] bg-[#EDEBE9] border border-[#E1DFDD] px-2 py-1">🔒 View mode — click Edit or New Company to enable editing (fields turn yellow)</div>}
                      </div>
                    ) : (
                      <div className="text-[12px] text-[#605E5C] p-4">No company selected — click New Company</div>
                    )}
                  </div>
                </div>
              </div>

              {/* FASTTAB 2: Create Role */}
              <div className="bg-white border border-[#E1DFDD] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                <div className="h-[44px] bg-[#F3F2F1] border-b border-[#E1DFDD] px-3 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[13px] font-semibold">▼ Create Role — Permissions matrix</span>
                  <div className="flex items-center gap-1">
                    <button onClick={handleNewRole} className="h-7 px-3 bg-white border border-[#8A8886] text-[11px] font-semibold hover:bg-[#EDEBE9] flex items-center gap-1"><span>＋</span> New Role</button>
                    <button onClick={handleEditRole} disabled={!selectedRoleId} className="h-7 px-2 bg-white border border-[#8A8886] text-[11px] font-semibold disabled:opacity-40">✎ Edit</button>
                    <button onClick={()=>selectedRole && handleRoleDeleteRequest(selectedRole)} disabled={role==='Customer' || !selectedRoleId} className={`h-7 px-2 border text-[11px] font-semibold ${role==='Customer'?'opacity-40 bg-[#F3F2F1]':'bg-white border-[#8A8886] hover:bg-[#FDE7E9]'}`}>🗑 Delete</button>
                    <button onClick={handleRoleSave} disabled={!isRoleEdit} className={`h-7 px-3 border text-[11px] font-semibold ${!isRoleEdit?'bg-[#F3F2F1] border-[#E1DFDD] opacity-60':'bg-[#0078D4] border-[#0078D4] text-white'}`}>💾 Save</button>
                    <button onClick={handleRoleCancel} disabled={!isRoleEdit} className="h-7 px-2 bg-white border border-[#8A8886] text-[11px] font-semibold disabled:opacity-40">Cancel</button>
                  </div>
                </div>
                <div className="flex flex-col lg:flex-row">
                  <div className="lg:w-[38%] border-r border-[#E1DFDD]">
                    <div className="h-8 bg-[#F3F2F1] border-b flex items-center px-2 text-[11px] font-semibold uppercase"><span className="w-8">✓</span><span className="w-40">Role Name</span><span className="flex-1">Description</span><span className="w-20">Created</span></div>
                    <div className="max-h-[280px] overflow-auto scrollbar-thin">
                      {roles.map(r=>(
                        <div key={r.id} onClick={()=>{setSelectedRoleId(r.id); setLastAction(`Selected role ${r.name}`); setInteractionTick(t=>t+1);}} className={`h-9 flex items-center px-2 text-[12px] border-b border-[#F3F2F1] cursor-pointer ${selectedRoleId===r.id?'bg-[#E5F3FF] outline outline-1 outline-[#0078D4]': 'd365-grid-row'}`}>
                          <span className="w-8 flex justify-center"><span className={`w-[14px] h-[14px] border flex items-center justify-center text-[10px] ${selectedRoleId===r.id?'bg-[#0078D4] border-[#0078D4] text-white':'bg-white border-[#8A8886]'}`}>{selectedRoleId===r.id?'✓':''}</span></span>
                          <span className="w-40 font-semibold truncate">{r.name || '(new role)'}</span>
                          <span className="flex-1 truncate text-[#605E5C]">{r.summary}</span>
                          <span className="w-20 text-[11px]">{r.createdDate}</span>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-[#FAF9F8] border-t">
                      <label className="text-[11px] font-semibold">Role Name <span className="text-[#A80000]">*</span></label>
                      <input disabled={!isRoleEdit} value={selectedRole?.name || ''} onChange={e=>updateRoleField('name', e.target.value)} placeholder="EP_FinanceConsultant" className={`w-full mt-1 h-8 px-2 border text-[12px] ${!isRoleEdit?'bg-[#F3F2F1] border-[#E1DFDD]':'bg-[#FFF4CE] border-[#8A8886]'}`} />
                      <label className="text-[11px] font-semibold mt-2 block">Description</label>
                      <input disabled={!isRoleEdit} value={selectedRole?.summary || ''} onChange={e=>updateRoleField('summary', e.target.value)} placeholder="Full consultant access..." className={`w-full mt-1 h-8 px-2 border text-[12px] ${!isRoleEdit?'bg-[#F3F2F1]':'bg-[#FFF4CE] border-[#8A8886]'}`} />
                    </div>
                  </div>
                  <div className="flex-1 p-0">
                    <div className="h-8 bg-[#F3F2F1] border-b flex items-center px-3 text-[11px] font-semibold uppercase gap-2"><span className="flex-1">Form / Capability</span><span className="w-12 text-center">Edit</span><span className="w-12 text-center">Delete</span><span className="w-12 text-center">View</span></div>
                    {selectedRole && CAPABILITIES.map(cap=>{
                      const perm = selectedRole.permissions[cap] || {edit:false, del:false, view:false};
                      return (
                        <div key={cap} className="h-10 flex items-center px-3 border-b border-[#F3F2F1] text-[12px] bg-white hover:bg-[#F3F2F1]">
                          <span className="flex-1 truncate">{cap}</span>
                          <span className="w-12 flex justify-center"><input type="checkbox" disabled={!isRoleEdit} checked={perm.edit} onChange={()=>toggleRolePerm(cap,'edit')} className="w-4 h-4" /></span>
                          <span className="w-12 flex justify-center"><input type="checkbox" disabled={!isRoleEdit || (cap==='Integration section' && role==='Customer')} checked={perm.del} onChange={()=>toggleRolePerm(cap,'del')} className="w-4 h-4" /></span>
                          <span className="w-12 flex justify-center"><input type="checkbox" disabled={!isRoleEdit} checked={perm.view} onChange={()=>toggleRolePerm(cap,'view')} className="w-4 h-4" /></span>
                        </div>
                      );
                    })}
                    {!selectedRole && <div className="p-8 text-center text-[12px] text-[#605E5C]">Select role to edit permissions</div>}
                    <div className="p-2 bg-[#FAF9F8] border-t text-[10px] text-[#605E5C]">{isRoleEdit ? '✎ Edit mode: checkboxes enabled (yellow background), Save to commit' : '🔒 View mode'}</div>
                  </div>
                </div>
              </div>

              {/* FASTTAB 3: COA Management */}
              <div className="bg-white border border-[#E1DFDD] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                <div className="h-9 bg-[#F3F2F1] border-b px-3 text-[13px] font-semibold flex items-center">▼ COA Management</div>
                <div className="p-3 space-y-4">
                  <div className="border border-[#E1DFDD] p-3 bg-[#FAF9F8]">
                    <div className="text-[11px] font-semibold mb-2">Upload customer COA (Excel)</div>
                    <button onClick={()=>{setToastMsg('COA Excel upload simulated — 34 accounts loaded'); setLastAction('Upload customer COA clicked — Excel parsed'); setInteractionTick(t=>t+1);}} className="h-8 px-4 bg-white border border-[#8A8886] text-[11px] font-semibold flex items-center gap-2 hover:bg-[#EDEBE9]">📤 Upload customer COA (Excel)</button>
                    <div className="mt-2 text-[10px] text-[#605E5C]">Accepted: .xlsx • Chart of Accounts: {CHART_OF_ACCOUNTS.length} accounts • MainAccount table</div>
                  </div>

                  <div className="border border-[#E1DFDD]">
                    <div className="h-[44px] bg-[#F3F2F1] border-b px-3 flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[12px] font-semibold">Create COA Builder — Structure: Main Account - Department - Cost Center</span>
                      <div className="flex items-center gap-1">
                        <button onClick={handleNewCoaLine} className="h-7 px-3 bg-white border border-[#8A8886] text-[11px] font-semibold hover:bg-[#EDEBE9]">＋ New COA Line</button>
                        <button onClick={handleEditCoa} disabled={!selectedCoaLineId} className="h-7 px-2 bg-white border border-[#8A8886] text-[11px] font-semibold disabled:opacity-40">✎ Edit</button>
                        <button onClick={()=>selectedCoaLine && handleCoaDeleteRequest(selectedCoaLine)} disabled={!selectedCoaLineId} className="h-7 px-2 bg-white border border-[#8A8886] text-[11px] font-semibold disabled:opacity-40 hover:bg-[#FDE7E9]">🗑 Delete</button>
                        <button onClick={handleCoaSave} disabled={!isCoaEdit} className={`h-7 px-3 border text-[11px] font-semibold ${!isCoaEdit?'bg-[#F3F2F1] border-[#E1DFDD] opacity-60':'bg-[#0078D4] text-white border-[#0078D4]'}`}>💾 Save</button>
                        <button onClick={handleCoaCancel} disabled={!isCoaEdit} className="h-7 px-2 bg-white border border-[#8A8886] text-[11px] font-semibold disabled:opacity-40">Cancel</button>
                      </div>
                    </div>
                    <div className="overflow-auto scrollbar-thin max-h-[300px]">
                      <div className="h-8 bg-[#F3F2F1] border-b flex items-center px-2 text-[11px] font-semibold uppercase min-w-[700px]">
                        <span className="w-8">✓</span><span className="w-48">Main Account</span><span className="w-36">Department</span><span className="w-32">Cost Center</span><span className="w-48">Account Name</span><span className="w-20">Type</span><span className="flex-1">Posting Combo</span>
                      </div>
                      {coaLines.map(line=>{
                        const isSelected = selectedCoaLineId===line.id;
                        return (
                          <div key={line.id} onClick={()=>{setSelectedCoaLineId(line.id); setLastAction(`Selected COA ${line.postingCombo}`); setInteractionTick(t=>t+1);}} className={`h-10 flex items-center px-2 text-[12px] border-b border-[#F3F2F1] cursor-pointer min-w-[700px] ${isSelected?'bg-[#E5F3FF] outline outline-1 outline-[#0078D4]':'d365-grid-row'}`}>
                            <span className="w-8 flex justify-center"><span className={`w-[14px] h-[14px] border flex items-center justify-center text-[10px] ${isSelected?'bg-[#0078D4] border-[#0078D4] text-white':'bg-white border-[#8A8886]'}`}>{isSelected?'✓':''}</span></span>
                            <span className="w-48">
                              {isCoaEdit && isSelected ? (
                                <select value={line.mainAccount} onChange={e=>updateCoaField(line.id,'mainAccount', e.target.value)} className="w-full h-7 border border-[#8A8886] text-[11px] bg-[#FFF4CE]">
                                  <option value="">— Select —</option>
                                  {CHART_OF_ACCOUNTS.map(ca=><option key={ca.account} value={ca.account}>{ca.account} - {ca.name}</option>)}
                                </select>
                              ) : (
                                <span className="font-mono font-semibold">{line.mainAccount || '—'} - {line.accountName}</span>
                              )}
                            </span>
                            <span className="w-36">
                              {isCoaEdit && isSelected ? (
                                <select value={line.department} onChange={e=>updateCoaField(line.id,'department', e.target.value)} className="w-full h-7 border border-[#8A8886] text-[11px] bg-[#FFF4CE]">
                                  <option value="">— Dept —</option>
                                  {DEPARTMENTS.map(d=><option key={d.code} value={d.code}>{d.code} - {d.name}</option>)}
                                </select>
                              ) : (
                                <span>{line.department ? DEPARTMENTS.find(d=>d.code===line.department)?.name || line.department : '—'}</span>
                              )}
                            </span>
                            <span className="w-32">
                              {isCoaEdit && isSelected ? (
                                <select value={line.costCenter} onChange={e=>updateCoaField(line.id,'costCenter', e.target.value)} className="w-full h-7 border border-[#8A8886] text-[11px] bg-[#FFF4CE]">
                                  <option value="">— CC —</option>
                                  {COST_CENTERS.map(cc=><option key={cc.code} value={cc.code}>{cc.code} - {cc.name}</option>)}
                                </select>
                              ) : (
                                <span>{line.costCenter ? COST_CENTERS.find(cc=>cc.code===line.costCenter)?.name || line.costCenter : '—'}</span>
                              )}
                            </span>
                            <span className="w-48 truncate">{line.accountName}</span>
                            <span className="w-20"><span className="px-1.5 py-0.5 bg-[#F3F2F1] border text-[10px]">{line.accType}</span></span>
                            <span className="flex-1 font-mono text-[11px]">{line.postingCombo}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="h-7 bg-[#FAF9F8] border-t px-2 flex items-center justify-between text-[10px] text-[#605E5C]"><span>{isCoaEdit ? '✎ Edit mode: dropdowns are searchable selects, enabled (yellow), validates posting combinations' : '🔒 View mode — dropdowns locked — click Edit to enable'}</span><span>{coaLines.length} lines</span></div>
                  </div>

                  <div className="bg-white border border-[#E1DFDD]">
                    <div className="h-9 bg-[#F3F2F1] border-b px-3 text-[13px] font-semibold flex items-center">▾ Training Assets — Upload videos & Screenshots</div>
                    <div className="p-3 space-y-3">
                      <div onDragOver={e=>{e.preventDefault(); setDragOver(true)}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault(); setDragOver(false); setToastMsg('Training video uploaded — will generate FRD'); setLastAction('Drag-drop video uploaded'); setInteractionTick(t=>t+1);}} className={`border-2 border-dashed ${dragOver?'border-[#0078D4] bg-[#E5F3FF]':'border-[#C8C6C4] bg-[#FAF9F8]'} h-24 flex flex-col items-center justify-center gap-1 cursor-pointer`}>
                        <span className="text-[20px]">🎬</span><span className="text-[11px] font-semibold">Drag-drop training videos</span><span className="text-[10px] text-[#605E5C]">MP4, MOV — Auto-generates functional walkthrough</span>
                      </div>
                      <div className="border border-[#E1DFDD] bg-[#FAF9F8] p-2">
                        <div className="text-[11px] font-semibold flex justify-between"><span>Uploaded assets (3)</span><span className="text-[#107C10]">✓ Helps generate FRD, Test Cases, GAP-FIT</span></div>
                        <div className="mt-2 space-y-1 text-[11px]">
                          <div className="flex items-center gap-2 bg-white border p-1.5"><span>📹</span><span className="flex-1">GL_Journal_Approval_Demo.mp4</span><span className="text-[#605E5C]">12.4 MB</span></div>
                          <div className="flex items-center gap-2 bg-white border p-1.5"><span>🖼️</span><span className="flex-1">FiscalCalendar_Setup.png</span><span className="text-[#605E5C]">1.2 MB</span></div>
                          <div className="flex items-center gap-2 bg-white border p-1.5"><span>🖼️</span><span className="flex-1">VendorPosting_Profile.png</span><span className="text-[#605E5C]">0.9 MB</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* FASTTAB 4: D365 Metadata Repository */}
                  <div className="bg-white border border-[#E1DFDD] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                    <div className="h-[44px] bg-[#E5F3FF] border-b border-[#A9D0F5] px-3 flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[13px] font-semibold text-[#004578]">▼ D365 Metadata Repository — Navigation Path → FormName, TableName, DataEntity, OData, MenuItem, Module</span>
                      <div className="flex items-center gap-1">
                        <button onClick={handleNewMetadata} className="h-7 px-3 bg-white border border-[#8A8886] text-[11px] font-semibold hover:bg-[#EDEBE9]">＋ Add</button>
                        <button onClick={handleEditMetadata} disabled={!selectedMetadataId} className="h-7 px-2 bg-white border border-[#8A8886] text-[11px] font-semibold disabled:opacity-40">✎ Edit</button>
                        <button onClick={()=>selectedMetadataId && handleDeleteMetadata(selectedMetadataId)} disabled={!selectedMetadataId} className="h-7 px-2 bg-white border border-[#8A8886] text-[11px] font-semibold disabled:opacity-40 hover:bg-[#FDE7E9]">🗑 Delete</button>
                        <button onClick={handleSaveMetadata} disabled={!isMetadataEdit} className={`h-7 px-3 border text-[11px] font-semibold ${!isMetadataEdit?'bg-[#F3F2F1] border-[#E1DFDD] opacity-60':'bg-[#0078D4] text-white border-[#0078D4]'}`}>💾 Save</button>
                        <button onClick={handleCancelMetadata} disabled={!isMetadataEdit} className="h-7 px-2 bg-white border border-[#8A8886] text-[11px] font-semibold disabled:opacity-40">Cancel</button>
                        <button onClick={handleAutoFillFromQuestion} className="h-7 px-3 bg-[#FFF4CE] border border-[#FCE100] text-[11px] font-semibold hover:bg-[#FCE100]/30">Auto-fill from Questionnaire</button>
                      </div>
                    </div>
                    <div className="overflow-auto scrollbar-thin max-h-[340px]">
                      <div className="h-8 bg-[#F3F2F1] border-b flex items-center px-2 text-[11px] font-semibold uppercase min-w-[900px]">
                        <span className="w-8">✓</span><span className="w-[260px]">Navigation Path</span><span className="w-32">FormName</span><span className="w-32">TableName</span><span className="w-32">DataEntity</span><span className="w-32">OData</span><span className="w-28">MenuItem</span><span className="w-28">Module</span>
                      </div>
                      {metadataRows.map(row=>{
                        const isSel = selectedMetadataId===row.id;
                        return (
                          <div key={row.id} onClick={()=>{setSelectedMetadataId(row.id); setLastAction(`Selected metadata ${row.formName} — ${row.navPath}`); setInteractionTick(t=>t+1);}} className={`h-10 flex items-center px-2 text-[12px] border-b border-[#F3F2F1] cursor-pointer min-w-[900px] ${isSel?'bg-[#E5F3FF] outline outline-1 outline-[#0078D4]':'d365-grid-row'}`}>
                            <span className="w-8 flex justify-center"><span className={`w-[14px] h-[14px] border flex items-center justify-center text-[10px] ${isSel?'bg-[#0078D4] border-[#0078D4] text-white':'bg-white border-[#8A8886]'}`}>{isSel?'✓':''}</span></span>
                            <span className="w-[260px] truncate" title={row.navPath}>
                              {isMetadataEdit && isSel ? <input value={row.navPath} onChange={e=>updateMetadataField(row.id,'navPath', e.target.value)} className="w-full h-6 border border-[#8A8886] px-1 text-[11px] bg-[#FFF4CE]" /> : row.navPath}
                            </span>
                            <span className="w-32 truncate">{isMetadataEdit && isSel ? <input value={row.formName} onChange={e=>updateMetadataField(row.id,'formName', e.target.value)} className="w-full h-6 border border-[#8A8886] px-1 text-[11px] bg-[#FFF4CE]" /> : row.formName}</span>
                            <span className="w-32 truncate">{isMetadataEdit && isSel ? <input value={row.tableName} onChange={e=>updateMetadataField(row.id,'tableName', e.target.value)} className="w-full h-6 border border-[#8A8886] px-1 text-[11px] bg-[#FFF4CE]" /> : row.tableName}</span>
                            <span className="w-32 truncate">{isMetadataEdit && isSel ? <input value={row.dataEntity} onChange={e=>updateMetadataField(row.id,'dataEntity', e.target.value)} className="w-full h-6 border border-[#8A8886] px-1 text-[11px] bg-[#FFF4CE]" /> : row.dataEntity}</span>
                            <span className="w-32 truncate">{isMetadataEdit && isSel ? <input value={row.odata} onChange={e=>updateMetadataField(row.id,'odata', e.target.value)} className="w-full h-6 border border-[#8A8886] px-1 text-[11px] bg-[#FFF4CE]" /> : row.odata}</span>
                            <span className="w-28 truncate">{isMetadataEdit && isSel ? <input value={row.menuItem} onChange={e=>updateMetadataField(row.id,'menuItem', e.target.value)} className="w-full h-6 border border-[#8A8886] px-1 text-[11px] bg-[#FFF4CE]" /> : row.menuItem}</span>
                            <span className="w-28 truncate">{row.module}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="h-7 bg-[#FAF9F8] border-t px-2 flex items-center justify-between text-[10px] text-[#605E5C]">
                      <span>{isMetadataEdit ? '✎ Edit mode — fields yellow, Save required — Auto-fill from Questionnaire uses Navigation Path' : '🔒 View mode — When Questionnaire Navigation Path selected, auto-fill shows info text'}</span>
                      <span>{metadataRows.length} mappings — D365 Metadata Repository</span>
                    </div>
                    <div className="p-2 bg-[#FFF4CE] border-t border-[#FCE100] text-[11px] flex items-center gap-2">
                      <span className="font-semibold">ℹ Auto-fill:</span>
                      <span>Select a Question with Navigation Path (e.g., Organization administration &gt; Organizations &gt; Legal entities) → Click Auto-fill → Creates/Finds metadata mapping. Shows: Found metadata for path → Form: OMLegalEntity, Table: OMLegalEntity</span>
                    </div>
                  </div>
                  {/* FASTTAB 5: D365 Integration Status */}
                  <div className="bg-white border border-[#E1DFDD] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                    <div className="h-9 bg-black text-white px-3 text-[13px] font-semibold flex items-center justify-between">
                      <span>▼ D365 F&O Integration Status — Safe Mode — Dry Run prevents write</span>
                      <span className="text-[10px] bg-[#1F1F1F] border border-[#333] px-2 py-0.5">Generates JSON/XML/Excel Data Management packages for import via Data Management or OData REST API</span>
                    </div>
                    <div className="p-3 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold">Environment URL</label>
                            <input value={d365Config.envUrl} onChange={e=>setD365Config({...d365Config, envUrl:e.target.value})} className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[11px] font-mono bg-white" placeholder="https://xxx.cloud.onebox.dynamics.com" />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold">Tenant ID</label>
                            <input value={d365Config.tenantId} onChange={e=>setD365Config({...d365Config, tenantId:e.target.value})} className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[11px] font-mono bg-white" />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold">Client ID (Azure AD App)</label>
                            <input value={d365Config.clientId} onChange={e=>setD365Config({...d365Config, clientId:e.target.value})} className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[11px] font-mono bg-white" />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold">OData Endpoint Status</label>
                            <div className={`mt-1 h-8 border px-2 flex items-center gap-2 text-[11px] font-semibold ${d365Config.odataStatus==='Connected'?'bg-[#DFF6DD] border-[#A7E3A5] text-[#107C10]': d365Config.odataStatus==='Testing'?'bg-[#FFF4CE] border-[#FCE100] text-[#8A5700]':'bg-[#FDE7E9] border-[#F7B0B5] text-[#A80000]'}`}>
                              <span className={`w-2 h-2 rounded-full ${d365Config.odataStatus==='Connected'?'bg-[#107C10]': d365Config.odataStatus==='Testing'?'bg-[#FFB900] animate-pulse':'bg-[#A80000]'}`}></span>
                              {d365Config.odataStatus} {testConnLoading && '(Testing...)'}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="flex items-center gap-2 text-[11px] bg-[#FFF4CE] border border-[#FCE100] px-2 py-1 cursor-pointer">
                            <input type="checkbox" checked={d365Config.dryRun} onChange={e=>setD365Config({...d365Config, dryRun:e.target.checked})} className="w-4 h-4" />
                            <span className="font-semibold">Dry Run Mode (Safe - does not write to D365, only validates)</span>
                          </label>
                          <span className="text-[10px] text-[#605E5C]">Safe Mode: Live untouched — generates package for import, no direct write</span>
                        </div>
                        <div className="bg-[#1F1F1F] text-[#D4D4D4] p-3 text-[11px] font-mono leading-[1.4] border border-[#333]">
                          <div className="text-white font-semibold mb-1">Integration Flow — Questionnaire Answer → D365</div>
                          <div>Questionnaire Answer -&gt; Data Entity -&gt; OData -&gt; D365 F&amp;O Parameter/Posting Profile -&gt; Auto-creation</div>
                          <div className="mt-2 flex items-center gap-1 text-[10px]">
                            <span className="bg-[#0078D4] text-white px-1.5 py-0.5">Q: Fiscal calendar Apr-Mar</span><span>→</span><span className="bg-[#333] px-1.5 py-0.5">FiscalCalendarEntity</span><span>→</span><span className="bg-[#333] px-1.5 py-0.5">/data/FiscalCalendars</span><span>→</span><span className="bg-[#107C10] text-white px-1.5 py-0.5">Ledger Setup</span>
                          </div>
                          <div className="mt-2 text-[10px] opacity-60">This app generates JSON/XML/Excel Data Management packages that can be imported via D365 Data Management workspace or via OData REST API (POST /data/...)</div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={handleTestConnection} disabled={testConnLoading} className={`h-8 px-4 border text-[11px] font-semibold flex items-center gap-1.5 ${testConnLoading?'bg-[#F3F2F1] border-[#E1DFDD] opacity-60':'bg-white border-[#8A8886] hover:bg-[#EDEBE9]'}`}>
                            {testConnLoading ? <span className="w-3 h-3 border-2 border-[#8A8886] border-t-[#0078D4] rounded-full animate-spin"></span> : '🔗'} Test Connection
                          </button>
                          <button onClick={handleSyncMetadata} disabled={syncLoading} className={`h-8 px-4 border text-[11px] font-semibold flex items-center gap-1.5 ${syncLoading?'bg-[#F3F2F1] opacity-60':'bg-white border-[#8A8886] hover:bg-[#EDEBE9]'}`}>
                            {syncLoading ? <span className="w-3 h-3 border-2 border-[#8A8886] border-t-[#0078D4] rounded-full animate-spin"></span> : '🔄'} Sync Metadata ({metadataRows.length})
                          </button>
                          <button onClick={handlePushToD365} disabled={pushLoading} className={`h-8 px-4 border text-[11px] font-semibold flex items-center gap-1.5 ${pushLoading?'bg-[#F3F2F1] opacity-60': d365Config.dryRun ? 'bg-[#FFF4CE] border-[#FCE100] hover:bg-[#FCE100]/40' : 'bg-[#0078D4] text-white border-[#0078D4] hover:bg-[#106EBE]'}`}>
                            {pushLoading ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : '🚀'} Push to D365 — {d365Config.dryRun ? 'Dry Run Validate' : 'Simulate Write'}
                          </button>
                          <span className={`h-8 px-2 border text-[11px] flex items-center ${d365Config.entitySync==='Synced'?'bg-[#DFF6DD] border-[#A7E3A5] text-[#107C10]':'bg-[#F3F2F1] border-[#E1DFDD]'}`}>Entity Sync: {d365Config.entitySync}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="bg-white border border-[#E1DFDD]">
                          <div className="h-7 bg-[#F3F2F1] border-b px-2 flex items-center justify-between text-[11px] font-semibold">
                            <span>Sample OData JSON Payload — {selectedPayloadType}</span>
                            <select value={selectedPayloadType} onChange={e=>setSelectedPayloadType(e.target.value as any)} className="h-6 border border-[#8A8886] text-[10px] bg-white px-1">
                              <option value="FiscalCalendar">Fiscal Calendar</option>
                              <option value="Ledger">Ledger</option>
                              <option value="PostingProfile">Posting Profile</option>
                            </select>
                          </div>
                          <div className="p-2 bg-[#1F1F1F] text-[10px] font-mono text-[#D4D4D4] max-h-[260px] overflow-auto scrollbar-thin">
                            {selectedPayloadType==='FiscalCalendar' && (
                              <pre>{`{
  "@odata.type": "#Microsoft.Dynamics.DataEntities.FiscalCalendarEntity",
  "FiscalCalendarId": "FY-APR-MAR",
  "Description": "Calendar from April to March",
  "StartDate": "2024-04-01T00:00:00Z",
  "EndDate": "2025-03-31T00:00:00Z",
  "Periods": 12,
  "DataAreaId": "USMF",
  "QuestionSource": "Q1: ${questions[0]?.textValue || 'April-March'}",
  "Module": "General Ledger"
}`}</pre>
                            )}
                            {selectedPayloadType==='Ledger' && (
                              <pre>{`{
  "@odata.type": "#Microsoft.Dynamics.DataEntities.LedgerEntity",
  "LedgerId": "USMF",
  "Name": "${companies[0]?.name || 'Contoso USA'}",
  "ChartOfAccounts": "100000-900200",
  "FiscalCalendar": "FY-APR-MAR",
  "AccountingCurrency": "USD",
  "DataAreaId": "USMF",
  "PostingProfiles": ${postings.length},
  "Companies": ${companies.length}
}`}</pre>
                            )}
                            {selectedPayloadType==='PostingProfile' && (
                              <pre>{`{
  "@odata.type": "#Microsoft.Dynamics.DataEntities.LedgerPostingProfileEntity",
  "ProfileCode": "${postings[0]?.code || 'GL-SUM-001'}",
  "MainAccount": "${postings[0]?.mainAccount || '100000'}",
  "MainAccountName": "${getAccountName(postings[0]?.mainAccount || '100000')}",
  "PostingType": "${postings[0]?.postingType || 'Ledger'}",
  "Module": "${postings[0]?.module || 'General Ledger'}",
  "Ledger": "USMF",
  "Description": "${postings[0]?.desc || 'Cash Summary'}",
  "DataAreaId": "USMF",
  "Source": "Questionnaire -> Posting Profiles"
}`}</pre>
                            )}
                          </div>
                          <div className="h-6 bg-[#FAF9F8] border-t px-2 text-[9px] text-[#605E5C] flex items-center justify-between">
                            <span>Dry Run: {d365Config.dryRun ? 'Validates only — no POST to D365' : 'Would POST to /data/... — simulated'}</span>
                            <button onClick={()=>{navigator.clipboard.writeText('OData payload copied'); setToastMsg('OData payload copied — in-memory');}} className="h-5 px-2 bg-white border border-[#8A8886] text-[9px]">Copy JSON</button>
                          </div>
                        </div>
                        <div className="bg-black text-white p-2 text-[10px] max-h-[140px] overflow-auto scrollbar-thin border border-[#333]">
                          <div className="font-semibold mb-1">Integration Logs — in-memory — Safe Mode</div>
                          {integrationLogs.map((log,i)=><div key={i} className="opacity-80 leading-[1.3]">{log}</div>)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delete confirm dialogs reused */}
            {showCompanyDeleteConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white border border-[#8A8886] shadow-[0_8px_32px_rgba(0,0,0,0.3)] w-[420px] max-w-[90vw]">
                  <div className="h-9 bg-black text-white px-3 flex items-center justify-between text-[12px] font-semibold"><span>Confirm Delete — Company</span><button onClick={()=>setShowCompanyDeleteConfirm(null)} className="w-6 h-6 bg-[#333] flex items-center justify-center">×</button></div>
                  <div className="p-4">
                    <div className="text-[13px]">Delete company <b>'{showCompanyDeleteConfirm.code} - {showCompanyDeleteConfirm.name}'</b>? This cannot be undone.</div>
                    <div className="mt-4 flex justify-end gap-2">
                      <button onClick={()=>setShowCompanyDeleteConfirm(null)} className="h-8 px-4 bg-white border border-[#8A8886] text-[12px] font-semibold">Cancel</button>
                      <button onClick={handleCompanyDeleteConfirm} className="h-8 px-4 bg-[#A80000] text-white text-[12px] font-semibold">Delete Company</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {showRoleDeleteConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white border border-[#8A8886] shadow-[0_8px_32px_rgba(0,0,0,0.3)] w-[420px] max-w-[90vw]">
                  <div className="h-9 bg-black text-white px-3 flex items-center justify-between text-[12px] font-semibold"><span>Confirm Delete — Role</span><button onClick={()=>setShowRoleDeleteConfirm(null)} className="w-6 h-6 bg-[#333] flex items-center justify-center">×</button></div>
                  <div className="p-4">
                    <div className="text-[13px]">Delete role <b>'{showRoleDeleteConfirm.name}'</b>? This cannot be undone.</div>
                    <div className="mt-4 flex justify-end gap-2">
                      <button onClick={()=>setShowRoleDeleteConfirm(null)} className="h-8 px-4 bg-white border border-[#8A8886] text-[12px] font-semibold">Cancel</button>
                      <button onClick={handleRoleDeleteConfirm} className="h-8 px-4 bg-[#A80000] text-white text-[12px] font-semibold">Delete Role</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {showCoaDeleteConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white border border-[#8A8886] shadow-[0_8px_32px_rgba(0,0,0,0.3)] w-[400px] max-w-[90vw]">
                  <div className="h-9 bg-black text-white px-3 flex items-center justify-between text-[12px] font-semibold"><span>Confirm Delete — COA Line</span><button onClick={()=>setShowCoaDeleteConfirm(null)} className="w-6 h-6 bg-[#333] flex items-center justify-center">×</button></div>
                  <div className="p-4">
                    <div className="text-[13px]">Delete COA line <b>'{showCoaDeleteConfirm.postingCombo}'</b>?</div>
                    <div className="mt-4 flex justify-end gap-2">
                      <button onClick={()=>setShowCoaDeleteConfirm(null)} className="h-8 px-4 bg-white border border-[#8A8886] text-[12px] font-semibold">Cancel</button>
                      <button onClick={handleCoaDeleteConfirm} className="h-8 px-4 bg-[#A80000] text-white text-[12px] font-semibold">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI FEATURES */}
        {activeTab==='AI Features' && (
          <div className="p-4 bg-[#FAF9F8] flex-1">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <div className="text-[18px] font-semibold text-[#323130]">AI Features — 10 features from Excel with icons</div>
                <div className="text-[12px] text-[#605E5C]">Click card to show demo — Powered by Azure OpenAI + D365 Copilot — All Open demo buttons now working</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-2 text-[11px] bg-white border border-[#E1DFDD] px-3 py-1.5"><span className="w-2 h-2 bg-[#107C10] rounded-full animate-pulse"></span> AI Services Online — Model: GPT-4o</div>
                <span className="text-[10px] bg-[#0078D4] text-white px-2 py-1">10 demos live</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {[
                {id:'tts', title:'Text to speech', icon:'🔊', desc:'Converts questionnaire to audio for customer walkthrough', color:'#E5F3FF', demo:'Playing: How do you define fiscal calendar? — Audio generated'},
                {id:'video', title:'AI Generated Functional Videos', icon:'🎥', desc:'Auto-creates training videos from screenshots & parameters', color:'#DFF6DD', demo:'Generated: GL Fiscal Calendar Setup — 3:24 video'},
                {id:'walkthrough', title:'Interactive form walkthrough', icon:'👣', desc:'Step-by-step overlay guide on actual F&O forms', color:'#FFF4CE', demo:'Walkthrough: Organization administration > Legal entities'},
                {id:'screen', title:'AI Screen Generator', icon:'🖥️', desc:'Generates D365 screen mockups from questionnaire answers', color:'#F3F2F1', demo:'Generated screen: Vendor Payment Journal with custom fields'},
                {id:'learning', title:'Functional Consultant learning mode', icon:'🎓', desc:'Learn-as-you-answer with contextual D365 help', color:'#EDEBE9', demo:'Learning: Intercompany accounting requires 3-step setup'},
                {id:'assistant', title:'Questionnaire Assistant', icon:'🤖', desc:'AI suggests answers based on industry & past projects', color:'#E5F3FF', demo:'Suggestion: For FIFO inventory, use model group FIFO-STD'},
                {id:'uat', title:'AI UAT Assistant', icon:'✅', desc:'Auto-generates UAT test cases from Fit/GAP analysis', color:'#DFF6DD', demo:'Generated 24 test cases — 18 Fit, 6 GAP scripts'},
                {id:'integration', title:'AI Integration Assistant', icon:'🔗', desc:'Maps Form Name, TableName, Data Entity automatically', color:'#FFF4CE', demo:'Mapped: FiscalCalendar → FiscalCalendarEntity → OData'},
                {id:'process', title:'Process flow animation', icon:'🌊', desc:'Animates end-to-end business process from answers', color:'#FDE7E9', demo:'Animating: Procure-to-Pay — Requisition → PO → Receipt → Invoice'},
                {id:'trainer', title:'AI Trainer', icon:'🏋️', desc:'Creates role-based training plans from discovery data', color:'#EDEBE9', demo:'Training plan: 4 modules for AP Clerk — 2.5 hours'},
              ].map(card=>(
                <div key={card.id} className="bg-white border border-[#E1DFDD] shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all cursor-pointer group flex flex-col">
                  <div className="h-1" style={{background:card.color}}></div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-[2px] bg-[#F3F2F1] border border-[#E1DFDD] flex items-center justify-center text-[20px] group-hover:bg-[#0078D4] group-hover:text-white transition-colors">{card.icon}</div>
                      <span className="text-[10px] bg-[#E5F3FF] border border-[#A9D0F5] text-[#004578] px-1.5 py-0.5 font-semibold animate-pulse">DEMO LIVE</span>
                    </div>
                    <div className="mt-3 text-[13px] font-semibold text-[#323130] leading-tight">{card.title}</div>
                    <div className="mt-1 text-[11px] text-[#605E5C] leading-[1.4] min-h-[32px]">{card.desc}</div>
                    <div className="mt-3 bg-[#FAF9F8] border border-[#F3F2F1] p-2 text-[10px] font-mono text-[#605E5C]">▶ {card.demo}</div>
                    <button onClick={()=>{ setActiveDemo(card.id); setLastAction(`Opened ${card.title} demo — ${new Date().toLocaleTimeString()}`); setInteractionTick(v=>v+1); }} className="mt-3 w-full h-8 bg-[#0078D4] text-white border border-[#0078D4] text-[11px] font-semibold hover:bg-[#106EBE] active:bg-[#005A9E] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors">
                      <span>▶</span> Open demo
                    </button>
                    <div className="mt-1 text-[9px] text-[#A19F9D] text-center">Click to open working modal — state: {activeDemo===card.id ? 'OPEN' : 'ready'}</div>
                  </div>
                </div>
              ))}
            </div>
           <div className="mt-6 bg-black text-white p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
             <div className="text-[12px]"><span className="font-semibold">EP_ERP Discovery Accelerator — AI Layer</span><span className="opacity-60 ml-3">All features produce FRD, GAP-FIT analysis, test cases & training from single questionnaire source — Fixed: Open demo buttons now functional</span></div>
             <div className="flex gap-2">
               <button onClick={()=>{ setActiveDemo('tts'); setTtsText('How do you define fiscal calendar? Calendar from April to March. This determines period closing logic.'); }} className="h-8 px-4 bg-white text-black text-[12px] font-semibold hover:bg-[#F3F2F1] cursor-pointer">Quick TTS Demo</button>
               <button onClick={()=>{ setToastMsg('FRD Preview generated — 15 sections, 24 pages'); setLastAction('Generated FRD Preview'); setInteractionTick(v=>v+1); }} className="h-8 px-4 bg-[#0078D4] text-white text-[12px] font-semibold hover:bg-[#106EBE] cursor-pointer">Generate FRD Preview</button>
             </div>
           </div>
         </div>
       )}
        {activeTab==='Version Control' && (
          <div style={{height:'100%', overflowY:'auto', padding:'20px', background:'#f5f5f5', minHeight:'80vh', display:'block'}}>
            <div style={{background:'#e8f5e9', border:'2px solid #4caf50', padding:'12px 16px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'10px'}}>
              <span style={{fontSize:'18px'}}>🛡️</span>
              <span style={{fontWeight:'bold', fontSize:'13px', color:'#2e7d32'}}>Safe Mode Active - Live App Untouched - All changes go to Staging first</span>
              <span style={{marginLeft:'auto', background:'#4caf50', color:'white', padding:'2px 8px', fontSize:'11px'}}>DRY RUN ON</span>
            </div>
            <div style={{marginBottom:'20px'}}>
              <h3 style={{fontSize:'14px', fontWeight:'bold', marginBottom:'12px', color:'#323130'}}>Live vs Staging - Environment Comparison</h3>
              <div style={{display:'flex', gap:'16px', flexWrap:'wrap'}}>
                <div style={{flex:'1 1 300px', background:'white', border:'1px solid #a7e3a5', borderLeft:'4px solid #107C10', padding:'16px', minHeight:'120px'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px'}}>
                    <span style={{background:'#DFF6DD', border:'1px solid #a7e3a5', color:'#107C10', padding:'2px 8px', fontSize:'11px', fontWeight:'bold'}}>LIVE</span>
                    <span style={{fontWeight:'bold', fontSize:'14px'}}>v10.0.39</span>
                  </div>
                  <div style={{fontSize:'12px', color:'#605E5C', lineHeight:'1.4'}}>
                    <div>Deployed: 2024-01-15 09:30 - User: Alex Kim - Changes: 2</div>
                    <div style={{marginTop:'6px', background:'#f8f8f8', padding:'6px', border:'1px solid #eee', fontSize:'11px'}}>Initial Live release - 15 questions, 3 companies, 34 COA accounts</div>
                  </div>
                </div>
                <div style={{flex:'1 1 300px', background:'white', border:'1px solid #fce100', borderLeft:'4px solid #ffb900', padding:'16px', minHeight:'120px'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px'}}>
                    <span style={{background:'#FFF4CE', border:'1px solid #fce100', color:'#8a5700', padding:'2px 8px', fontSize:'11px', fontWeight:'bold'}}>STAGING</span>
                    <span style={{fontWeight:'bold', fontSize:'14px'}}>v10.0.40</span>
                    <span style={{background:'#FFF4CE', padding:'2px 6px', fontSize:'10px', border:'1px solid #fce100'}}>2 changes pending</span>
                  </div>
                  <div style={{fontSize:'12px', color:'#605E5C', lineHeight:'1.4'}}>
                    <div>Date: 2024-03-20 14:22 - User: Priya Shah - Changes: 5</div>
                    <div style={{marginTop:'6px', background:'#FFF4CE', padding:'6px', border:'1px solid #fce100', fontSize:'11px'}}>Staging - Ready for UAT - Dry Run validation passed</div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{background:'white', border:'1px solid #E1DFDD', padding:'0', marginBottom:'20px'}}>
              <div style={{height:'40px', background:'#F3F2F1', borderBottom:'1px solid #E1DFDD', display:'flex', alignItems:'center', padding:'0 12px', fontWeight:'bold', fontSize:'13px'}}>Version Timeline - Rollback and Promote</div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%', borderCollapse:'collapse', fontSize:'12px', minWidth:'700px'}}>
                  <thead>
                    <tr style={{background:'#F3F2F1', height:'32px', borderBottom:'1px solid #E1DFDD', textAlign:'left'}}>
                      <th style={{padding:'8px', fontSize:'11px'}}>Version</th>
                      <th style={{padding:'8px', fontSize:'11px'}}>Status</th>
                      <th style={{padding:'8px', fontSize:'11px'}}>Date</th>
                      <th style={{padding:'8px', fontSize:'11px'}}>User</th>
                      <th style={{padding:'8px', fontSize:'11px'}}>Changes</th>
                      <th style={{padding:'8px', fontSize:'11px'}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{height:'36px', borderBottom:'1px solid #f3f2f1', background:'#e8f5e9'}}>
                      <td style={{padding:'8px', fontFamily:'monospace', fontWeight:'bold'}}>v10.0.39</td>
                      <td style={{padding:'8px'}}><span style={{padding:'2px 6px', fontSize:'10px', fontWeight:'bold', background:'#DFF6DD', color:'#107C10', border:'1px solid #A7E3A5'}}>Live</span></td>
                      <td style={{padding:'8px'}}>2024-01-15 09:30</td>
                      <td style={{padding:'8px'}}>Alex Kim</td>
                      <td style={{padding:'8px'}}>2</td>
                      <td style={{padding:'8px'}}><div style={{display:'flex', gap:'4px'}}><button style={{height:'22px', padding:'0 8px', background:'white', border:'1px solid #8A8886', fontSize:'10px'}}>View</button><button style={{height:'22px', padding:'0 8px', background:'#f3f2f1', border:'1px solid #8A8886', fontSize:'10px'}}>Rollback</button><button style={{height:'22px', padding:'0 8px', background:'#FFF4CE', border:'1px solid #8A8886', fontSize:'10px'}}>Promote</button></div></td>
                    </tr>
                    <tr style={{height:'36px', borderBottom:'1px solid #f3f2f1', background:'#fffde7'}}>
                      <td style={{padding:'8px', fontFamily:'monospace', fontWeight:'bold'}}>v10.0.40</td>
                      <td style={{padding:'8px'}}><span style={{padding:'2px 6px', fontSize:'10px', fontWeight:'bold', background:'#FFF4CE', color:'#8A5700', border:'1px solid #FCE100'}}>Staging</span></td>
                      <td style={{padding:'8px'}}>2024-03-20 14:22</td>
                      <td style={{padding:'8px'}}>Priya Shah</td>
                      <td style={{padding:'8px'}}>5</td>
                      <td style={{padding:'8px'}}><div style={{display:'flex', gap:'4px'}}><button onClick={()=>setToastMsg('Viewing v10.0.40')} style={{height:'22px', padding:'0 8px', background:'white', border:'1px solid #8A8886', fontSize:'10px', cursor:'pointer'}}>View</button><button onClick={()=>{ const v=versions[1]; if(v) handleRollback(v); }} style={{height:'22px', padding:'0 8px', background:'white', border:'1px solid #8A8886', fontSize:'10px', cursor:'pointer'}}>Rollback</button><button onClick={()=>{ const v=versions[1]; if(v) handlePromote(v); }} style={{height:'22px', padding:'0 8px', background:'#0078D4', color:'white', border:'1px solid #8A8886', fontSize:'10px', cursor:'pointer'}}>Promote</button></div></td>
                    </tr>
                    <tr style={{height:'36px', borderBottom:'1px solid #f3f2f1', background:'white'}}>
                      <td style={{padding:'8px', fontFamily:'monospace', fontWeight:'bold'}}>v10.0.41</td>
                      <td style={{padding:'8px'}}><span style={{padding:'2px 6px', fontSize:'10px', fontWeight:'bold', background:'#F3F2F1', color:'#605E5C', border:'1px solid #E1DFDD'}}>Draft</span></td>
                      <td style={{padding:'8px'}}>2024-03-28 10:15</td>
                      <td style={{padding:'8px'}}>Alex Kim</td>
                      <td style={{padding:'8px'}}>8</td>
                      <td style={{padding:'8px'}}><div style={{display:'flex', gap:'4px'}}><button style={{height:'22px', padding:'0 8px', background:'white', border:'1px solid #8A8886', fontSize:'10px'}}>View</button><button style={{height:'22px', padding:'0 8px', background:'white', border:'1px solid #8A8886', fontSize:'10px'}}>Rollback</button><button style={{height:'22px', padding:'0 8px', background:'#0078D4', color:'white', border:'1px solid #8A8886', fontSize:'10px'}}>Promote</button></div></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{height:'28px', background:'#FAF9F8', borderTop:'1px solid #E1DFDD', display:'flex', alignItems:'center', padding:'0 12px', fontSize:'10px', color:'#605E5C'}}>
                <span>3 versions tracked - In-memory snapshots - No D365 write until Promote</span>
                <button onClick={handleCreateVersion} style={{marginLeft:'auto', height:'20px', padding:'0 8px', background:'white', border:'1px solid #8A8886', fontSize:'10px', cursor:'pointer'}}>+ Create Version Snapshot</button>
              </div>
            </div>
            <div style={{background:'white', border:'1px solid #E1DFDD', padding:'0', marginBottom:'20px'}}>
              <div style={{height:'36px', background:'#F3F2F1', borderBottom:'1px solid #E1DFDD', display:'flex', alignItems:'center', padding:'0 12px', fontWeight:'bold', fontSize:'12px'}}>Change Log - Sample Changes</div>
              <textarea style={{width:'100%', height:'120px', border:'none', padding:'12px', fontSize:'11px', fontFamily:'monospace'}} defaultValue="v10.0.39 Live - Initial release - 15 questions, 34 COA accounts, 3 companies\nv10.0.40 Staging - Added Posting Type dropdown, COA Builder, fiscal calendar integration\nv10.0.41 Draft - D365 Integration layer + Metadata Repository + Safe Mode"></textarea>
            </div>
            <div style={{background:'white', border:'2px solid #0078D4', padding:'0', marginBottom:'20px'}}>
              <div style={{height:'44px', background:'#0078D4', color:'white', display:'flex', alignItems:'center', padding:'0 12px', fontWeight:'bold', fontSize:'13px', justifyContent:'space-between'}}>
                <span>D365 F and O Integration Details to Capture - This was blank before fix</span>
                <span style={{fontSize:'10px', background:'#106EBE', padding:'4px 8px'}}>D365 Integration</span>
              </div>
              <div style={{padding:'16px'}}>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px'}}>
                  <div>
                    <label style={{fontSize:'11px', fontWeight:'bold', display:'block', marginBottom:'4px'}}>Environment URL *</label>
                    <input value={d365Config?.envUrl || 'https://usnconeboxax1aos.cloud.onebox.dynamics.com'} onChange={e=>setD365Config({...d365Config, envUrl:e.target.value} as any)} style={{width:'100%', height:'32px', border:'1px solid #8A8886', padding:'0 8px', fontSize:'11px', fontFamily:'monospace'}} />
                  </div>
                  <div>
                    <label style={{fontSize:'11px', fontWeight:'bold', display:'block', marginBottom:'4px'}}>Tenant ID</label>
                    <input value={d365Config?.tenantId || 'tenant-id'} onChange={e=>setD365Config({...d365Config, tenantId:e.target.value} as any)} style={{width:'100%', height:'32px', border:'1px solid #8A8886', padding:'0 8px', fontSize:'11px', fontFamily:'monospace'}} />
                  </div>
                  <div>
                    <label style={{fontSize:'11px', fontWeight:'bold', display:'block', marginBottom:'4px'}}>Client ID (Azure AD App)</label>
                    <input value={d365Config?.clientId || ''} onChange={e=>setD365Config({...d365Config, clientId:e.target.value} as any)} style={{width:'100%', height:'32px', border:'1px solid #8A8886', padding:'0 8px', fontSize:'11px', fontFamily:'monospace'}} placeholder="00000000-0000-0000-0000-000000000000" />
                  </div>
                  <div>
                    <label style={{fontSize:'11px', fontWeight:'bold', display:'block', marginBottom:'4px'}}>OData Endpoint Status</label>
                    <div style={{height:'32px', border:'1px solid #8A8886', display:'flex', alignItems:'center', padding:'0 8px', gap:'8px', fontSize:'11px', fontWeight:'bold', background: (d365Config?.odataStatus==='Connected') ? '#DFF6DD' : '#FDE7E9'}}>
                      <span style={{width:'8px', height:'8px', borderRadius:'50%', background: (d365Config?.odataStatus==='Connected') ? '#107C10' : '#A80000', display:'inline-block'}}></span>
                      {d365Config?.odataStatus || 'Not Connected'}
                    </div>
                  </div>
                </div>
                <div style={{background:'#1F1F1F', color:'#D4D4D4', padding:'12px', fontSize:'11px', fontFamily:'monospace', marginBottom:'16px', border:'1px solid #333'}}>
                  <div style={{color:'white', fontWeight:'bold', marginBottom:'6px'}}>Integration Flow Diagram: Questionnaire Answer to D365</div>
                  <div>Questionnaire Answer to Data Entity to OData to D365 Parameter slash Posting Profile to Auto-creation</div>
                  <div style={{marginTop:'8px', display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap'}}>
                    <span style={{background:'#0078D4', color:'white', padding:'2px 8px'}}>Q: Fiscal calendar Apr-Mar</span>
                    <span>to</span>
                    <span style={{background:'#333', padding:'2px 8px'}}>FiscalCalendarEntity</span>
                    <span>to</span>
                    <span style={{background:'#333', padding:'2px 8px'}}>data slash FiscalCalendars</span>
                    <span>to</span>
                    <span style={{background:'#107C10', color:'white', padding:'2px 8px'}}>Ledger Setup in D365</span>
                  </div>
                  <div style={{marginTop:'8px', fontSize:'10px', opacity:0.6}}>Generates JSON XML Excel Data Management packages for import via D365 Data Management workspace or OData REST API</div>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 380px', gap:'16px'}}>
                  <div>
                    <div style={{display:'flex', gap:'8px', marginBottom:'12px', flexWrap:'wrap'}}>
                      <button onClick={handleTestConnection} style={{height:'32px', padding:'0 12px', background:'white', border:'1px solid #8A8886', fontSize:'11px', fontWeight:'bold', cursor:'pointer'}}>Test Connection</button>
                      <button onClick={handleSyncMetadata} style={{height:'32px', padding:'0 12px', background:'white', border:'1px solid #8A8886', fontSize:'11px', fontWeight:'bold', cursor:'pointer'}}>Sync Metadata</button>
                      <button onClick={handlePushToD365} style={{height:'32px', padding:'0 12px', background: d365Config?.dryRun ? '#FFF4CE' : '#0078D4', border:'1px solid #8A8886', fontSize:'11px', fontWeight:'bold', cursor:'pointer', color: d365Config?.dryRun ? '#323130' : 'white'}}>Push to D365 - Dry Run</button>
                      <button style={{height:'32px', padding:'0 12px', background:'#107C10', color:'white', border:'1px solid #107C10', fontSize:'11px', fontWeight:'bold', cursor:'pointer'}}>Promote to Live</button>
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:'8px', background:'#FFF4CE', border:'1px solid #FCE100', padding:'8px', marginBottom:'12px'}}>
                      <input type="checkbox" checked={d365Config?.dryRun ?? true} onChange={e=>setD365Config({...d365Config, dryRun:e.target.checked} as any)} style={{width:'16px', height:'16px'}} />
                      <span style={{fontSize:'11px', fontWeight:'bold'}}>Dry Run Mode - Safe - does not write to D365, only validates</span>
                    </div>
                    <div style={{background:'black', color:'white', padding:'8px', fontSize:'10px', maxHeight:'120px', overflowY:'auto', border:'1px solid #333'}}>
                      <div style={{fontWeight:'bold', marginBottom:'4px'}}>Integration Logs - Safe Mode</div>
                      <div>Safe Mode: Live untouched - Dry Run enabled - Generates package</div>
                    </div>
                  </div>
                  <div style={{background:'white', border:'1px solid #E1DFDD'}}>
                    <div style={{height:'28px', background:'#F3F2F1', borderBottom:'1px solid #E1DFDD', display:'flex', alignItems:'center', padding:'0 8px', fontSize:'11px', fontWeight:'bold', justifyContent:'space-between'}}>
                      <span>Sample OData JSON Payload</span>
                      <select value={selectedPayloadType} onChange={e=>setSelectedPayloadType(e.target.value as any)} style={{height:'20px', border:'1px solid #8A8886', fontSize:'10px'}}>
                        <option value="FiscalCalendar">Fiscal Calendar</option>
                        <option value="Ledger">Ledger</option>
                        <option value="PostingProfile">Posting Profile</option>
                      </select>
                    </div>
                    <pre style={{padding:'8px', fontSize:'10px', fontFamily:'monospace', background:'#1F1F1F', color:'#D4D4D4', margin:0, minHeight:'180px', overflow:'auto', whiteSpace:'pre-wrap'}}>Sample payload: FiscalCalendarId FY-APR-MAR, Description April to March, StartDate 2024-04-01, DataAreaId USMF, QuestionSource Q1, Module GL, DryRun true, SafeMode Live Untouched</pre>
                    <div style={{height:'24px', background:'#FAF9F8', borderTop:'1px solid #E1DFDD', display:'flex', alignItems:'center', padding:'0 8px', fontSize:'9px', color:'#605E5C', justifyContent:'space-between'}}>
                      <span>Dry Run Validates only</span>
                      <button onClick={()=>{ setToastMsg('OData payload copied'); }} style={{height:'18px', padding:'0 6px', background:'white', border:'1px solid #8A8886', fontSize:'9px', cursor:'pointer'}}>Copy JSON</button>
                    </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}
        {activeTab==='Low-Code Factory' && (
          <div style={{height:'100%', overflowY:'auto', padding:'20px', background:'white', minHeight:'80vh', display:'block'}}>
            <div style={{background:'#e3f2fd', border:'2px solid #0078D4', padding:'12px 16px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'10px'}}>
              <span style={{fontSize:'18px'}}>🛡️</span>
              <span style={{fontWeight:'bold', fontSize:'13px', color:'#004578'}}>Isolated Tab - Does not disturb existing tabs - Only information, no app update - Staging v10.0.42</span>
              <span style={{marginLeft:'auto', background:'#0078D4', color:'white', padding:'2px 8px', fontSize:'10px'}}>NEW TAB - FIXED BLANK ISSUE</span>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'16px'}}>
              <div style={{border:'1px solid #E1DFDD', padding:'0', minHeight:'400px', background:'white'}}>
                <div style={{height:'36px', background:'#F3F2F1', borderBottom:'1px solid #E1DFDD', display:'flex', alignItems:'center', padding:'0 12px', fontWeight:'bold', fontSize:'12px'}}>1 Requirement Builder</div>
                <div style={{padding:'12px', display:'flex', flexDirection:'column', gap:'12px'}}>
                  <div>
                    <label style={{fontSize:'11px', fontWeight:'bold', display:'block', marginBottom:'4px'}}>Requirement Title *</label>
                    <input value={lcRequirement?.title || 'Skill Master'} onChange={e=>setLcRequirement({...lcRequirement, title:e.target.value} as any)} placeholder="Skill Master" style={{width:'100%', height:'28px', border:'1px solid #ccc', padding:'0 8px', fontSize:'12px'}} />
                  </div>
                  <div>
                    <label style={{fontSize:'11px', fontWeight:'bold', display:'block', marginBottom:'4px'}}>Plain English Requirement</label>
                    <textarea value={lcRequirement?.plainEnglish || 'Example: Create Skill Master table for HR module. Track employee skills - Skill Code, Name, Category, Proficiency, Certified Yes No, Valid Till date. If Certified Yes, Valid Till mandatory. Show in HcmWorker form.'} onChange={e=>setLcRequirement({...lcRequirement, plainEnglish:e.target.value} as any)} placeholder="Plain English" style={{width:'100%', height:'150px', border:'1px solid #ccc', padding:'8px', fontSize:'11px', fontFamily:'monospace'}} />
                  </div>
                  <div>
                    <label style={{fontSize:'11px', fontWeight:'bold', display:'block', marginBottom:'4px'}}>Customization Type</label>
                    <select value={lcRequirement?.custType || 'Full Module'} onChange={e=>setLcRequirement({...lcRequirement, custType:e.target.value} as any)} style={{width:'100%', height:'28px', border:'1px solid #ccc', padding:'0 8px', fontSize:'12px'}}>
                      <option>Table</option><option>Form Extension</option><option>Class Extension</option><option>SSRS Report</option><option>Full Module</option>
                    </select>
                  </div>
                  <div style={{border:'1px solid #E1DFDD', padding:'8px', background:'#FAF9F8'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                      <label style={{fontSize:'11px', fontWeight:'bold'}}>Fields - Dynamic List</label>
                      <button onClick={()=>{ const nf={id:'f'+Date.now(), name:'NewField', edt:'String', mandatory:false, relation:''}; setLcRequirement({...lcRequirement, fields:[...(lcRequirement?.fields||[]), nf]} as any); }} style={{height:'22px', padding:'0 8px', background:'white', border:'1px solid #8A8886', fontSize:'10px', cursor:'pointer'}}>+ Add Field</button>
                    </div>
                    {(lcRequirement?.fields || [{id:'1', name:'SkillCode', edt:'String', mandatory:true}, {id:'2', name:'SkillName', edt:'String', mandatory:true}]).map((f:any, idx:number)=>(
                      <div key={f.id || idx} style={{display:'flex', gap:'4px', marginBottom:'4px'}}>
                        <input value={f.name} onChange={e=>{ const fl=[...(lcRequirement?.fields||[])]; fl[idx].name=e.target.value; setLcRequirement({...lcRequirement, fields:fl} as any); }} placeholder="Field Name" style={{flex:1, height:'24px', border:'1px solid #ccc', padding:'0 6px', fontSize:'11px'}} />
                        <select value={f.edt} onChange={e=>{ const fl=[...(lcRequirement?.fields||[])]; fl[idx].edt=e.target.value; setLcRequirement({...lcRequirement, fields:fl} as any); }} style={{width:'70px', height:'24px', border:'1px solid #ccc', fontSize:'10px'}}>
                          <option>String</option><option>Int</option><option>Date</option><option>Enum</option><option>Real</option><option>Boolean</option>
                        </select>
                        <label style={{display:'flex', alignItems:'center', gap:'2px', fontSize:'10px'}}><input type="checkbox" checked={!!f.mandatory} onChange={e=>{ const fl=[...(lcRequirement?.fields||[])]; fl[idx].mandatory=e.target.checked; setLcRequirement({...lcRequirement, fields:fl} as any); }} />Mandatory</label>
                        <button onClick={()=>{ const fl=(lcRequirement?.fields||[]).filter((_:any,i:number)=>i!==idx); setLcRequirement({...lcRequirement, fields:fl} as any); }} style={{width:'20px', height:'24px', background:'white', border:'1px solid #ccc', fontSize:'10px', cursor:'pointer'}}>x</button>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label style={{fontSize:'11px', fontWeight:'bold', display:'block', marginBottom:'4px'}}>Logic / Validation</label>
                    <textarea value={lcRequirement?.logic || 'If Certified Yes, Valid Till mandatory'} onChange={e=>setLcRequirement({...lcRequirement, logic:e.target.value} as any)} style={{width:'100%', height:'60px', border:'1px solid #ccc', padding:'8px', fontSize:'11px'}} />
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                    <div>
                      <label style={{fontSize:'11px', fontWeight:'bold', display:'block', marginBottom:'4px'}}>Parent Form</label>
                      <select value={lcRequirement?.parentForm || 'HcmWorker'} onChange={e=>setLcRequirement({...lcRequirement, parentForm:e.target.value} as any)} style={{width:'100%', height:'28px', border:'1px solid #ccc', fontSize:'11px'}}>
                        <option>HcmWorker</option><option>VendTable</option><option>CustTable</option><option>InventTable</option><option>LedgerJournal</option>
                      </select>
                    </div>
                    <div>
                      <label style={{fontSize:'11px', fontWeight:'bold', display:'block', marginBottom:'4px'}}>FastTab</label>
                      <input value={lcRequirement?.fastTab || 'Skills'} onChange={e=>setLcRequirement({...lcRequirement, fastTab:e.target.value} as any)} style={{width:'100%', height:'28px', border:'1px solid #ccc', padding:'0 8px', fontSize:'11px'}} />
                    </div>
                  </div>
                  <div style={{border:'1px solid #E1DFDD', padding:'8px', background:'#FFF4CE'}}>
                    <div style={{fontSize:'11px', fontWeight:'bold', marginBottom:'6px'}}>SSRS Report Details</div>
                    <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
                      <input value={lcRequirement?.reportTitle || 'Employee Skills Report'} onChange={e=>setLcRequirement({...lcRequirement, reportTitle:e.target.value} as any)} placeholder="Report Title" style={{width:'100%', height:'24px', border:'1px solid #ccc', padding:'0 6px', fontSize:'11px'}} />
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px'}}>
                        <input value={(lcRequirement?.filters||['Department','Certified']).join(', ')} onChange={e=>setLcRequirement({...lcRequirement, filters:e.target.value.split(',').map((s:string)=>s.trim())} as any)} placeholder="Filters" style={{height:'24px', border:'1px solid #ccc', padding:'0 6px', fontSize:'11px'}} />
                        <input value={lcRequirement?.groupBy || 'Category'} onChange={e=>setLcRequirement({...lcRequirement, groupBy:e.target.value} as any)} placeholder="Group By" style={{height:'24px', border:'1px solid #ccc', padding:'0 6px', fontSize:'11px'}} />
                      </div>
                      <select value={lcRequirement?.chartType || 'Both'} onChange={e=>setLcRequirement({...lcRequirement, chartType:e.target.value} as any)} style={{height:'24px', border:'1px solid #ccc', fontSize:'11px'}}>
                        <option>Bar</option><option>Pie</option><option>Both</option><option>None</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{border:'1px solid #E1DFDD', padding:'0', minHeight:'400px', background:'white'}}>
                <div style={{height:'36px', background:'#F3F2F1', borderBottom:'1px solid #E1DFDD', display:'flex', alignItems:'center', padding:'0 12px', fontWeight:'bold', fontSize:'12px'}}>2 AI Code Preview</div>
                <div style={{padding:'8px', borderBottom:'1px solid #E1DFDD', display:'flex', gap:'4px', flexWrap:'wrap'}}>
                  {['Tables','Forms','Classes','Security','SSRS'].map((tab:any)=>(
                    <button key={tab} onClick={()=>setLcCodeTab(tab)} style={{height:'24px', padding:'0 8px', background: lcCodeTab===tab ? '#0078D4' : 'white', color: lcCodeTab===tab ? 'white' : '#323130', border:'1px solid #8A8886', fontSize:'10px', cursor:'pointer', fontWeight: lcCodeTab===tab ? 'bold' : 'normal'}}>{tab}</button>
                  ))}
                </div>
                <div style={{padding:'8px'}}>
                  <pre style={{background:'#f0f0f0', padding:'10px', minHeight:'300px', maxHeight:'400px', overflow:'auto', fontSize:'10px', fontFamily:'monospace', border:'1px solid #ccc', whiteSpace:'pre-wrap'}}>{lcGenerated ? (lcCodeTab==='Tables' ? lcGenerated.tables : lcCodeTab==='Forms' ? lcGenerated.forms : lcCodeTab==='Classes' ? lcGenerated.classes : lcCodeTab==='Security' ? lcGenerated.security : 'SSRS DP Contract Tmp RDL code preview - '+ (lcGenerated.ssrs?.dp?.substring(0,200) || '')) : 'Sample X++ Code Preview - Click Generate Code\n\nTable: EP_SkillMaster extends common\n Fields: SkillCode String Mandatory, SkillName String, Category Enum, Proficiency Int\n Relation: HcmWorker\n\nForm Extension: HcmWorker - FastTab Skills - Controls for each field\nLogic: If Certified Yes, Valid Till mandatory\n\nClass Extension: Validation logic for range 1-5'}</pre>
                  <div style={{marginTop:'8px', border:'1px solid #E1DFDD', padding:'8px', background:'#FAF9F8'}}>
                    <div style={{fontSize:'11px', fontWeight:'bold', marginBottom:'4px'}}>Properties - No Overlayering</div>
                    <div style={{fontSize:'10px', lineHeight:'1.4', whiteSpace:'pre-wrap'}}>{lcGenerated?.properties || 'Table EP_SkillMaster: AllowEdit Yes, Visible Yes, DeleteActions Restricted\nForm HcmWorker Extension: FastTab Skills AllowEdit Yes\nModel EP_Custom Layer ISV'}</div>
                  </div>
                </div>
              </div>
              <div style={{border:'1px solid #E1DFDD', padding:'0', minHeight:'400px', background:'white'}}>
                <div style={{height:'36px', background:'#F3F2F1', borderBottom:'1px solid #E1DFDD', display:'flex', alignItems:'center', padding:'0 12px', fontWeight:'bold', fontSize:'12px'}}>3 Deployment Preview</div>
                <div style={{padding:'12px', display:'flex', flexDirection:'column', gap:'12px'}}>
                  <button onClick={lcRunDryRun} style={{height:'32px', background:'#107C10', color:'white', border:'1px solid #107C10', fontSize:'11px', fontWeight:'bold', cursor:'pointer'}}>Dry Run Validate - Safe Check</button>
                  <div style={{border:'1px solid #E1DFDD', padding:'8px', minHeight:'80px', background:'#FAF9F8'}}>
                    <div style={{fontSize:'11px', fontWeight:'bold', marginBottom:'6px'}}>Validation Results - {(lcDryRun||[]).filter((r:any)=>r.status==='OK').length} OK</div>
                    {(lcDryRun && lcDryRun.length>0 ? lcDryRun : [{check:'Table relation valid', status:'OK', msg:'Relation HcmWorker exists'}, {check:'Form extension valid', status:'OK', msg:'Parent Form exists'}]).map((r:any,i:number)=>(
                      <div key={i} style={{display:'flex', gap:'6px', fontSize:'10px', marginBottom:'4px', padding:'4px', background: r.status==='OK' ? '#DFF6DD' : '#FFF4CE', border:'1px solid #eee'}}>
                        <span>{r.status==='OK' ? 'OK' : 'WARN'}</span><span style={{fontWeight:'bold'}}>{r.check}:</span><span>{r.msg}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{border:'2px solid #0078D4', padding:'8px', background:'white'}}>
                    <div style={{fontSize:'11px', fontWeight:'bold', marginBottom:'6px'}}>Report Mock Preview - PDF Layout</div>
                    <div style={{border:'1px solid #ccc', padding:'8px', background:'#f9f9f9', fontSize:'10px', lineHeight:'1.4'}}>
                      <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #ccc', paddingBottom:'4px', marginBottom:'6px'}}>
                        <span>Logo</span><span style={{fontWeight:'bold'}}>{lcRequirement?.reportTitle || 'Employee Skills Report'}</span><span>Date: 28-Mar-2024</span>
                      </div>
                      <div>Filters: Department, Certified - Group By: Category</div>
                      <div style={{marginTop:'6px', background:'#F3F2F1', padding:'4px', fontWeight:'bold'}}>Department: Head Office</div>
                      <div style={{display:'flex', gap:'8px', marginTop:'8px'}}>
                        <div style={{flex:1, border:'1px solid #ccc', padding:'4px', textAlign:'center'}}>Bar Chart: Skills by Category</div>
                        <div style={{flex:1, border:'1px solid #ccc', padding:'4px', textAlign:'center'}}>Pie Chart: Certified</div>
                      </div>
                    </div>
                  </div>
                  <div style={{border:'1px solid #E1DFDD', padding:'8px', background:'#1F1F1F', color:'#D4D4D4'}}>
                    <div style={{fontSize:'11px', fontWeight:'bold', marginBottom:'6px', color:'white'}}>Code Package Structure</div>
                    <pre style={{fontSize:'10px', fontFamily:'monospace', whiteSpace:'pre-wrap', margin:0}}>{lcGenerated?.packageStructure?.join('\n') || 'Model: EP_Custom [v10.0.42 Staging]\n Tables: EP_SkillMaster new, HcmWorker Ext\n Forms: HcmWorker FastTab Skills\n Classes: Validation Ext\n SSRS: SkillsReport RDL\n Deployable: EP_Custom_v10.0.42_Staging.zip'}</pre>
                  </div>
                  <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                    <button onClick={lcGenerateCodes} style={{height:'32px', padding:'0 12px', background: lcIsGenerating ? '#F3F2F1' : '#0078D4', color: lcIsGenerating ? '#605E5C' : 'white', border:'1px solid #0078D4', fontSize:'11px', fontWeight:'bold', cursor:'pointer'}}>{lcIsGenerating ? 'Generating' : 'Generate Code'}</button>
                    <button onClick={lcHandlePromote} style={{height:'32px', padding:'0 12px', background:'#FFF4CE', border:'1px solid #FCE100', fontSize:'11px', fontWeight:'bold', cursor:'pointer'}}>Promote Blocked Safe</button>
                    <button onClick={()=>setLcShowRollbackConfirm(true)} style={{height:'32px', padding:'0 12px', background:'white', border:'1px solid #8A8886', fontSize:'11px', fontWeight:'bold', cursor:'pointer'}}>Rollback</button>
                  </div>
                  <div style={{background:'#FFF4CE', border:'1px solid #FCE100', padding:'8px', fontSize:'11px'}}>
                    <span style={{fontWeight:'bold'}}>Only information, no application update</span> - Staging v10.0.42 - Generates deployable package for DevOps, does NOT auto-deploy - Safe Mode Live untouched
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar - D365 Style - now shows COA count */}
      <div className="h-6 bg-[#F3F2F1] border-t border-[#E1DFDD] flex items-center px-3 text-[11px] text-[#605E5C] justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${savingState==='Saved'?'bg-[#107C10]':'bg-[#FFB900] animate-pulse'}`}></span>{savingState} {savingState==='Saved' ? '— All changes auto-saved (in-memory draft, no persistence)' : '— Draft updating...'}</span>
          <span className="hidden md:inline">Form: EP_DiscoveryQuestionnaire | DataSource: EP_DiscoveryTable | Company: USMF</span>
          <span className="hidden lg:inline bg-white border border-[#E1DFDD] px-2 py-[1px]">Chart of Accounts: {CHART_OF_ACCOUNTS.length} accounts • MainAccount table • Posting Types: {POSTING_TYPES.length}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Records: {questions.length} • COA: {CHART_OF_ACCOUNTS.length}</span>
          <span className="hidden md:inline">User: Alex Kim (Consultant) | Role: {role} | Lang: {lang}</span>
          <span className="w-[1px] h-3 bg-[#E1DFDD]"></span>
          <span>Version: 10.0.39 — Platform Update 62</span>
        </div>
      </div>

      {/* Integration help flyout */}
      {showIntegrationHelp && (
        <div className="fixed right-4 top-[88px] w-[360px] bg-white border border-[#8A8886] shadow-[0_8px_24px_rgba(0,0,0,0.2)] z-40">
          <div className="h-9 bg-black text-white flex items-center justify-between px-3 text-[12px] font-semibold"><span>Integration Field Mapping — Help</span><button onClick={()=>setShowIntegrationHelp(false)} className="w-6 h-6 bg-[#333] flex items-center justify-center">×</button></div>
          <div className="p-3 text-[11px] space-y-2 leading-[1.5]">
            <div><b>Form Name (15 chars):</b> D365 form e.g. FiscalCal — used for personalization</div>
            <div><b>Field Name:</b> EDT field mapping — for extension</div>
            <div><b>TableName:</b> Base table — e.g. FiscalCalendar</div>
            <div><b>Menu item:</b> Navigation target</div>
            <div><b>Data Entity:</b> DIXF entity for data migration</div>
            <div><b>OData entity:</b> For Power Platform / Dual-write</div>
            <div><b>Configuration key:</b> License check — LedgerBasic, Invent etc</div>
            <div className="mt-2 p-2 bg-[#FFF4CE] border border-[#FCE100]">Visible ONLY to Internal role (Consultant/Admin). Customer role cannot see integration section per security.</div>
          </div>
        </div>
      )}
      {/* Toast - bottom right per spec */}
      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-[60] bg-[#323130] text-white text-[12px] px-4 py-2.5 rounded-[2px] shadow-[0_8px_24px_rgba(0,0,0,0.35)] flex items-center gap-2 min-w-[260px] max-w-[380px] border border-[#605E5C]">
          <span className="w-2 h-2 bg-[#6BB700] rounded-full animate-pulse shrink-0"></span>
          <span className="font-semibold">{toastMsg}</span>
          <span className="opacity-60 ml-auto text-[10px] hidden md:inline">— in-memory draft</span>
        </div>
      )}

      {/* AI Features Modals - Fully functional */}
      {activeDemo && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 md:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={()=>setActiveDemo(null)}></div>
          <div className="relative bg-white border border-[#8A8886] shadow-[0_12px_48px_rgba(0,0,0,0.4)] w-full max-w-[980px] max-h-[90vh] flex flex-col overflow-hidden animate-[slideIn_0.2s_ease]">
            <style>{`@keyframes slideIn{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}} @keyframes wave{0%,100%{height:8px}50%{height:28px}} @keyframes dotMove{0%{left:0%}100%{left:100%}} @keyframes flowPulse{0%{transform:scale(1)}50%{transform:scale(1.08)}100%{transform:scale(1)}}`}</style>
            {/* Modal Header */}
            <div className="h-[44px] bg-black text-white flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-[#0078D4] flex items-center justify-center text-[16px] font-bold">
                  {activeDemo==='tts'?'🔊': activeDemo==='video'?'🎥': activeDemo==='walkthrough'?'👣': activeDemo==='screen'?'🖥️': activeDemo==='learning'?'🎓': activeDemo==='assistant'?'🤖': activeDemo==='uat'?'✅': activeDemo==='integration'?'🔗': activeDemo==='process'?'🌊':'🏋️'}
                </span>
                <div>
                  <div className="text-[13px] font-semibold leading-none">
                    {activeDemo==='tts' && 'Text to Speech — Questionnaire Audio Walkthrough'}
                    {activeDemo==='video' && 'AI Generated Functional Videos — GL Fiscal Calendar Setup (3:24)'}
                    {activeDemo==='walkthrough' && 'Interactive Form Walkthrough — Organization administration > Legal entities'}
                    {activeDemo==='screen' && 'AI Screen Generator — D365 Screen Mockup from Answers'}
                    {activeDemo==='learning' && 'Functional Consultant Learning Mode — Intercompany Accounting'}
                    {activeDemo==='assistant' && 'Questionnaire Assistant — Industry Suggestions'}
                    {activeDemo==='uat' && 'AI UAT Assistant — Auto-generated Test Cases from Fit/GAP'}
                    {activeDemo==='integration' && 'AI Integration Assistant — Auto Mapping Form/Table/Data Entity'}
                    {activeDemo==='process' && 'Process Flow Animation — Questionnaire → FRD → Deployment'}
                    {activeDemo==='trainer' && 'AI Trainer — Role-based Training Plans'}
                  </div>
                  <div className="text-[10px] opacity-70 leading-none mt-1 flex items-center gap-2">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#6BB700] rounded-full animate-pulse"></span> DEMO LIVE — in-memory</span>
                    <span className="hidden md:inline">AI Services Online — Model: GPT-4o</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-[#1F1F1F] border border-[#333] px-2 py-1 hidden md:inline">ESC to close • Overlay click closes</span>
                <button onClick={()=>setActiveDemo(null)} className="w-8 h-8 bg-[#333] hover:bg-[#444] flex items-center justify-center text-[16px] transition">×</button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto scrollbar-thin bg-[#FAF9F8]">
              {/* TTS DEMO */}
              {activeDemo==='tts' && (
                <div className="p-4 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
                  <div className="space-y-3">
                    <div className="bg-white border border-[#E1DFDD] p-3">
                      <div className="text-[12px] font-semibold flex justify-between">Text Input — Questionnaire to Audio <span className="text-[10px] font-normal bg-[#E5F3FF] border border-[#A9D0F5] px-1">{ttsText.length} chars</span></div>
                      <textarea value={ttsText} onChange={e=>setTtsText(e.target.value)} className="w-full mt-2 h-[120px] border border-[#8A8886] p-2 text-[12px] resize-none focus:border-[#0078D4] focus:outline-none" placeholder="Enter text to speak..."></textarea>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold">Language / Voice</label>
                          <select value={ttsLang} onChange={e=>setTtsLang(e.target.value)} className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[11px] bg-white">
                            <option value="en-US">English US — Aria</option>
                            <option value="en-GB">English UK — Guy</option>
                            <option value="de-DE">German — Katja</option>
                            <option value="fr-FR">French — Denise</option>
                            <option value="hi-IN">Hindi — Swara</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold">Speed: {ttsRate}x</label>
                          <input type="range" min="0.5" max="1.5" step="0.1" value={ttsRate} onChange={e=>setTtsRate(parseFloat(e.target.value))} className="w-full mt-2" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-white border border-[#E1DFDD] p-3">
                      <div className="text-[11px] font-semibold mb-2">Quick Play — From Questionnaire</div>
                      <div className="space-y-1.5 max-h-[180px] overflow-auto scrollbar-thin">
                        {questions.slice(0,6).map(q=>(
                          <button key={q.id} onClick={()=>{ setTtsText(q.question + ' — ' + (q.textValue || q.why)); setTimeout(()=>handleTtsPlay(), 100); }} className="w-full text-left px-2 py-1.5 bg-[#FAF9F8] border border-[#F3F2F1] hover:bg-[#E5F3FF] hover:border-[#A9D0F5] text-[11px] flex items-center gap-2 group cursor-pointer">
                            <span className="w-6 h-6 bg-white border flex items-center justify-center group-hover:bg-[#0078D4] group-hover:text-white transition">▶</span>
                            <span className="flex-1 truncate"><b>Q{q.no}:</b> {q.question}</span>
                          </button>
                        ))}
                      </div>
                      <button onClick={()=>{ setTtsText('How do you define fiscal calendar? Calendar from April to March. This determines period closing logic and financial reporting.'); setTimeout(()=>handleTtsPlay(), 100); }} className="mt-2 w-full h-8 bg-[#FFF4CE] border border-[#FCE100] text-[11px] font-semibold hover:bg-[#FCE100]/50 flex items-center justify-center gap-1 cursor-pointer">🔊 Play: How do you define fiscal calendar?</button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-black text-white p-4 rounded-[2px]">
                      <div className="text-[11px] font-semibold uppercase tracking-wide opacity-70 mb-3 flex justify-between"><span>Audio Playback — Web Speech API</span><span className={`px-1.5 py-0.5 text-[10px] ${ttsPlaying?'bg-[#107C10]':'bg-[#333]'}`}>{ttsPlaying ? (ttsPaused ? 'PAUSED' : 'PLAYING') : 'STOPPED'}</span></div>
                      <div className="h-[64px] flex items-center justify-center gap-[3px] bg-[#1F1F1F] border border-[#333] p-2">
                        {Array.from({length:24}).map((_,i)=>(
                          <div key={i} className="w-[4px] bg-[#0078D4] rounded-full" style={{height: ttsPlaying && !ttsPaused ? `${8+Math.sin(Date.now()/200 + i)*12 + Math.random()*12}px` : '8px', animation: ttsPlaying && !ttsPaused ? `wave ${0.4 + Math.random()*0.4}s ease-in-out infinite` : 'none', animationDelay: `${i*0.05}s`}}></div>
                        ))}
                      </div>
                      <div className="mt-3 flex gap-2">
                        {!ttsPlaying || ttsPaused ? (
                          <button onClick={handleTtsPlay} className="flex-1 h-10 bg-[#0078D4] hover:bg-[#106EBE] text-white text-[12px] font-semibold flex items-center justify-center gap-2 cursor-pointer"><span>▶</span> {ttsPaused ? 'Resume' : 'Play'}</button>
                        ) : (
                          <button onClick={handleTtsPause} className="flex-1 h-10 bg-[#FFB900] hover:bg-[#FFA000] text-black text-[12px] font-semibold flex items-center justify-center gap-2 cursor-pointer"><span>⏸</span> Pause</button>
                        )}
                        <button onClick={handleTtsStop} className="w-20 h-10 bg-white text-black hover:bg-[#F3F2F1] text-[12px] font-semibold flex items-center justify-center gap-1 cursor-pointer"><span>⏹</span> Stop</button>
                      </div>
                      <div className="mt-3 text-[10px] font-mono opacity-60">Voice: {ttsLang} • Rate: {ttsRate}x • Using speechSynthesis • No persistence — in-memory</div>
                    </div>
                    <div className="bg-white border border-[#E1DFDD] p-3 text-[11px] leading-[1.5]">
                      <div className="font-semibold">Why TTS helps — D365 F&O scenario:</div>
                      <div className="text-[#605E5C] mt-1">• Converts questionnaire to audio for customer walkthrough — customer can listen while viewing form</div>
                      <div className="text-[#605E5C]">• Plays Fit/GAP analysis — helps business users understand impact without reading</div>
                      <div className="mt-2 p-2 bg-[#E5F3FF] border border-[#A9D0F5] text-[10px]">Demo LIVE badge shows this is using real Web Speech API, not mock. Click Play to hear actual speech.</div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIDEO DEMO */}
              {activeDemo==='video' && (
                <div className="p-4 space-y-4">
                  <div className="bg-black border border-[#333] overflow-hidden">
                    <div className="aspect-video relative bg-[#0F0F0F] flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#1F1F1F] to-black"></div>
                      <div className="relative z-10 text-center p-6">
                        <div className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center text-[32px] mb-3 border border-white/20">{videoPlaying ? '⏸' : '▶'}</div>
                        <div className="text-white text-[16px] font-semibold">GL Fiscal Calendar Setup</div>
                        <div className="text-white/60 text-[12px] mt-1">D365 F&O — Organization administration &gt; Fiscal calendars</div>
                        <div className="mt-4 inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1 text-[11px] text-white"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> AI Generated — Azure OpenAI + Screenshot to Video</div>
                      </div>
                      {/* Captions */}
                      {videoCaptionOn && (
                        <div className="absolute bottom-[56px] left-1/2 -translate-x-1/2 bg-black/80 text-white text-[12px] px-3 py-1.5 border border-white/20 max-w-[80%] text-center">
                          {videoProgress < 30 ? 'Step 1: Open Organization administration > Organizations > Legal entities' : videoProgress < 70 ? 'Step 2: Click Fiscal calendars > New calendar — Enter April to March' : videoProgress < 120 ? 'Step 3: Create 12 periods — Set period close status' : videoProgress < 170 ? 'Step 4: Link to ledger USMF — Validate chart of accounts' : 'Step 5: Save & Close — Fiscal calendar ready for transactions'}
                        </div>
                      )}
                    </div>
                    <div className="h-[48px] bg-[#1F1F1F] border-t border-[#333] flex items-center px-3 gap-3">
                      <button onClick={()=>setVideoPlaying(!videoPlaying)} className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center hover:bg-[#EDEBE9] cursor-pointer">{videoPlaying ? '⏸' : '▶'}</button>
                      <div className="text-white text-[11px] font-mono w-[90px]">{Math.floor(videoProgress/60)}:{String(videoProgress%60).padStart(2,'0')} / 3:24</div>
                      <div className="flex-1 h-1.5 bg-[#333] rounded-full relative cursor-pointer group" onClick={e=>{ const rect=e.currentTarget.getBoundingClientRect(); const x=e.clientX-rect.left; const pct=x/rect.width; setVideoProgress(Math.floor(pct*204)); }}>
                        <div className="absolute top-0 left-0 h-full bg-[#0078D4] rounded-full" style={{width:`${(videoProgress/204)*100}%`}}></div>
                        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow -translate-x-1/2" style={{left:`${(videoProgress/204)*100}%`}}></div>
                      </div>
                      <button onClick={()=>setVideoCaptionOn(!videoCaptionOn)} className={`h-7 px-2 border text-[10px] ${videoCaptionOn?'bg-white text-black border-white':'bg-transparent text-white border-[#555]'}`}>CC</button>
                      <span className="text-white/50 text-[10px]">HD</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
                    <div className="bg-white border border-[#E1DFDD] p-3">
                      <div className="text-[12px] font-semibold">Auto-generated Script — Timeline 3:24</div>
                      <div className="mt-2 space-y-2 text-[11px]">
                        <div className={`p-2 border-l-4 ${videoProgress<30?'border-[#0078D4] bg-[#E5F3FF]':'border-transparent bg-[#FAF9F8]'}`}><b>00:00 - 00:32</b> — Introduction: Fiscal calendar determines financial year, period closing, reporting. April-March for India entity.</div>
                        <div className={`p-2 border-l-4 ${videoProgress>=30 && videoProgress<70?'border-[#0078D4] bg-[#E5F3FF]':'border-transparent bg-[#FAF9F8]'}`}><b>00:32 - 01:10</b> — Create calendar: Organization administration {'>'} Fiscal calendars {'>'} New — Enter name FY-APR-MAR, start April 1.</div>
                        <div className={`p-2 border-l-4 ${videoProgress>=70 && videoProgress<120?'border-[#0078D4] bg-[#E5F3FF]':'border-transparent bg-[#FAF9F8]'}`}><b>01:10 - 02:00</b> — Periods: Generate 12 periods, set closing status — Open for current, Closed for prior.</div>
                        <div className={`p-2 border-l-4 ${videoProgress>=120?'border-[#0078D4] bg-[#E5F3FF]':'border-transparent bg-[#FAF9F8]'}`}><b>02:00 - 03:24</b> — Ledger link: General ledger {'>'} Ledger setup — Link USMF, validate COA, post test transaction.</div>
                      </div>
                    </div>
                    <div className="bg-[#FFF4CE] border border-[#FCE100] p-3 text-[11px]">
                      <div className="font-semibold">How AI generates video:</div>
                      <div className="mt-1 leading-[1.5]">1. Takes questionnaire answer: "Calendar from April to March" + screenshots FiscalCalendar_Setup.png</div>
                      <div>2. Azure OpenAI generates script + steps</div>
                      <div>3. Synthesizes D365 screen recordings into 3:24 walkthrough</div>
                      <div className="mt-2 p-2 bg-white border border-[#FCE100]">▶ Demo shows mock player with real timeline controls — Play/Pause, seek, captions toggle all work.</div>
                    </div>
                  </div>
                </div>
              )}

              {/* WALKTHROUGH DEMO */}
              {activeDemo==='walkthrough' && (
                <div className="p-4">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="lg:w-[260px] bg-white border border-[#E1DFDD] shrink-0">
                      <div className="h-8 bg-[#F3F2F1] border-b px-2 text-[11px] font-semibold uppercase flex items-center">Steps (5) — Interactive</div>
                      {WALKTHROUGH_STEPS.map((s,i)=>(
                        <div key={i} onClick={()=>setWalkStep(i)} className={`p-2 border-b border-[#F3F2F1] cursor-pointer ${walkStep===i?'bg-[#E5F3FF] border-l-4 border-l-[#0078D4]':'hover:bg-[#FAF9F8] border-l-4 border-l-transparent'}`}>
                          <div className="flex items-center gap-2"><span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${walkStep===i?'bg-[#0078D4] text-white': i<walkStep?'bg-[#107C10] text-white':'bg-[#F3F2F1] border'}`}>{i<walkStep?'✓':i+1}</span><span className="text-[11px] font-semibold">{s.title}</span></div>
                          <div className="text-[10px] text-[#605E5C] mt-1 truncate">{s.nav}</div>
                        </div>
                      ))}
                      <div className="p-2 flex gap-1">
                        <button disabled={walkStep===0} onClick={()=>setWalkStep(v=>Math.max(0,v-1))} className="flex-1 h-7 bg-white border border-[#8A8886] text-[11px] disabled:opacity-40 cursor-pointer">Prev</button>
                        <button disabled={walkStep===WALKTHROUGH_STEPS.length-1} onClick={()=>setWalkStep(v=>Math.min(WALKTHROUGH_STEPS.length-1,v+1))} className="flex-1 h-7 bg-[#0078D4] text-white border border-[#0078D4] text-[11px] disabled:opacity-40 cursor-pointer">Next</button>
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="bg-[#1F1F1F] border border-[#333] p-3 relative overflow-hidden min-h-[320px]">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#2B2B2B] to-black opacity-50"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between text-white text-[11px] mb-3">
                            <span className="bg-[#0078D4] px-2 py-1">D365 F&O — Mock Screen — {WALKTHROUGH_STEPS[walkStep].highlight}</span>
                            <span className="bg-[#333] px-2 py-1">Step {walkStep+1}/{WALKTHROUGH_STEPS.length}</span>
                          </div>
                          <div className="bg-white border border-[#E1DFDD] p-0 overflow-hidden">
                            <div className="h-8 bg-[#F3F2F1] border-b flex items-center px-2 gap-2 text-[11px]">
                              <span className="w-3 h-3 bg-[#E81123] rounded-full"></span><span className="w-3 h-3 bg-[#FFB900] rounded-full"></span><span className="w-3 h-3 bg-[#107C10] rounded-full"></span>
                              <span className="ml-4 font-semibold">Legal entities — USMF — Contoso Entertainment</span>
                            </div>
                            <div className="p-3 grid grid-cols-3 gap-2 text-[10px]">
                              <div className={`p-2 border-2 ${walkStep===0?'border-[#0078D4] bg-[#E5F3FF] shadow-[0_0_0_4px_rgba(0,120,212,0.2)]':'border-[#E1DFDD] bg-white'}`}><div className="font-semibold">Legal entities grid</div><div className="text-[#605E5C]">USMF, DEMF, INMF — {companies.length} records</div></div>
                              <div className={`p-2 border-2 ${walkStep===1?'border-[#0078D4] bg-[#E5F3FF] shadow-[0_0_0_4px_rgba(0,120,212,0.2)]':'border-[#E1DFDD] bg-white'}`}><div className="font-semibold">Action Pane — New</div><div className="bg-[#0078D4] text-white text-center py-1 mt-1">＋ New</div></div>
                              <div className={`p-2 border-2 ${walkStep===2?'border-[#0078D4] bg-[#E5F3FF] shadow-[0_0_0_4px_rgba(0,120,212,0.2)]':'border-[#E1DFDD] bg-white'}`}><div className="font-semibold">General FastTab</div><div className="mt-1 h-6 bg-[#FFF4CE] border border-[#8A8886]"></div><div className="mt-1 h-4 bg-[#F3F2F1] border"></div></div>
                            </div>
                            <div className="h-12 bg-[#FAF9F8] border-t flex items-center px-3 gap-2">
                              <div className={`h-6 px-3 text-[11px] flex items-center ${walkStep===4?'bg-[#0078D4] text-white border border-[#0078D4] shadow-[0_0_0_3px_rgba(0,120,212,0.3)]':'bg-white border border-[#8A8886]'}`}>💾 Save</div>
                              <div className="text-[10px] text-[#605E5C]">Form: EP_SystemAdmin — Validation: Main Account required</div>
                            </div>
                          </div>
                          <div className="mt-3 bg-[#0078D4] text-white p-2 text-[11px] flex gap-2">
                            <span className="text-[14px]">👣</span>
                            <div><b>Guide:</b> {WALKTHROUGH_STEPS[walkStep].detail}<div className="text-[10px] opacity-80 mt-1">{WALKTHROUGH_STEPS[walkStep].nav}</div></div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white border border-[#E1DFDD] p-3 flex justify-between items-center">
                        <div className="text-[11px]"><b>Progress:</b> {walkStep+1}/{WALKTHROUGH_STEPS.length} — {Math.round(((walkStep+1)/WALKTHROUGH_STEPS.length)*100)}% — Click steps left or Next/Prev to navigate, highlight overlay moves</div>
                        <button onClick={()=>setWalkStep(0)} className="h-7 px-3 bg-white border border-[#8A8886] text-[11px] cursor-pointer">Restart</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN GENERATOR */}
              {activeDemo==='screen' && (
                <div className="p-4 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
                  <div className="space-y-3">
                    <div className="bg-white border border-[#E1DFDD] p-3">
                      <div className="text-[11px] font-semibold">Questionnaire Answers — Source</div>
                      <div className="mt-2 space-y-1 max-h-[220px] overflow-auto">
                        {questions.slice(0,5).map(q=>(
                          <div key={q.id} className="p-1.5 bg-[#FAF9F8] border border-[#F3F2F1] text-[11px]"><div className="font-semibold truncate">{q.question}</div><div className="text-[#605E5C] truncate">{q.textValue || q.radioOptions[0]?.desc || '—'}</div></div>
                        ))}
                      </div>
                      <div className="mt-2">
                        <label className="text-[11px] font-semibold">Module for screen</label>
                        <select value={screenGenModule} onChange={e=>setScreenGenModule(e.target.value as ModuleName)} className="w-full mt-1 h-7 border border-[#8A8886] text-[11px] bg-white">
                          {MODULES.map(m=><option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <button onClick={()=>{ setScreenGenLoading(true); setLastAction(`Regenerating screen for ${screenGenModule} — v${screenGenVersion+1}`); setTimeout(()=>{ setScreenGenLoading(false); setScreenGenVersion(v=>v+1); setToastMsg(`Screen generated v${screenGenVersion+1}`); }, 1200); }} disabled={screenGenLoading} className="mt-3 w-full h-8 bg-[#0078D4] text-white text-[11px] font-semibold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
                        {screenGenLoading ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : '🔄'} Regenerate — v{screenGenVersion}
                      </button>
                    </div>
                    <div className="bg-[#E5F3FF] border border-[#A9D0F5] p-2 text-[10px] text-[#004578]">AI reads questionnaire + COA {CHART_OF_ACCOUNTS.length} accounts + posting profiles {postings.length} to generate F&O screen mockup — D365 pattern.</div>
                  </div>
                  <div className="bg-white border border-[#E1DFDD] shadow-sm overflow-hidden">
                    <div className="h-9 bg-[#F3F2F1] border-b flex items-center px-3 justify-between">
                      <span className="text-[12px] font-semibold">Generated D365 Screen Mockup — Vendor Payment Journal — {screenGenModule} — v{screenGenVersion}</span>
                      <span className="text-[10px] bg-[#DFF6DD] border border-[#A7E3A5] px-1.5 py-0.5">AI GENERATED</span>
                    </div>
                    {screenGenLoading ? (
                      <div className="h-[360px] flex flex-col items-center justify-center gap-3 bg-[#FAF9F8]">
                        <div className="w-8 h-8 border-3 border-[#E1DFDD] border-t-[#0078D4] rounded-full animate-spin"></div>
                        <div className="text-[11px] text-[#605E5C]">Generating D365 screen from questionnaire — mapping Form Name, TableName, Data Entity...</div>
                      </div>
                    ) : (
                      <div className="p-3 space-y-3">
                        <div className="h-8 bg-black text-white flex items-center px-2 text-[11px] gap-2"><span>Action Pane:</span><span className="bg-[#333] px-2 py-0.5">＋ New</span><span className="bg-[#333] px-2 py-0.5">✎ Edit</span><span className="bg-[#333] px-2 py-0.5">🗑 Delete</span><span className="bg-[#0078D4] px-2 py-0.5">Post</span></div>
                        <div className="grid grid-cols-4 gap-2 text-[11px]">
                          <div className="col-span-2"><label className="text-[10px] font-semibold">Journal Name</label><div className="mt-1 h-7 border border-[#8A8886] bg-white px-2 flex items-center">VendPay - {screenGenModule}</div></div>
                          <div><label className="text-[10px] font-semibold">Main Account</label><div className="mt-1 h-7 border border-[#8A8886] bg-[#FFF4CE] px-2 flex items-center">{postings[0]?.mainAccount || '200100'} - Vendor Balance</div></div>
                          <div><label className="text-[10px] font-semibold">Posting Type</label><div className="mt-1 h-7 border border-[#8A8886] bg-white px-2 flex items-center">{postings[0]?.postingType || 'Vendor balance'}</div></div>
                        </div>
                        <div className="border border-[#E1DFDD]">
                          <div className="h-7 bg-[#F3F2F1] border-b flex items-center px-2 text-[10px] font-semibold uppercase gap-2"><span className="w-4">✓</span><span className="flex-1">Account</span><span className="w-20">Amount</span><span className="w-24">Department</span><span className="w-20">Cost Center</span></div>
                          {coaLines.slice(0,3).map((l,i)=>(
                            <div key={l.id} className="h-8 flex items-center px-2 text-[11px] border-b border-[#F3F2F1] bg-white">
                              <span className="w-4"><span className="w-3 h-3 border border-[#8A8886] inline-block"></span></span>
                              <span className="flex-1 font-mono">{l.mainAccount} - {l.accountName}</span>
                              <span className="w-20">{(1000*(i+1)).toFixed(2)}</span>
                              <span className="w-24">{DEPARTMENTS.find(d=>d.code===l.department)?.name || l.department}</span>
                              <span className="w-20">{l.costCenter}</span>
                            </div>
                          ))}
                        </div>
                        <div className="bg-[#FAF9F8] border border-[#E1DFDD] p-2 text-[10px] text-[#605E5C]">Generated from: Q{qNo=>qNo} answers — Fit/GAP: {questions.filter(q=>q.fitGap==='Fit').length} Fit, {questions.filter(q=>q.fitGap==='GAP').length} GAP — Custom fields highlighted yellow per questionnaire.</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* LEARNING MODE */}
              {activeDemo==='learning' && (
                <div className="p-4 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
                  <div className="space-y-3">
                    <div className="bg-white border border-[#E1DFDD]">
                      <div className="h-9 bg-[#E5F3FF] border-b border-[#A9D0F5] px-3 flex items-center justify-between"><span className="text-[12px] font-semibold">🎓 Learning: Intercompany accounting requires 3-step setup</span><span className="text-[10px] bg-white border px-1">Progress 67%</span></div>
                      <div className="divide-y divide-[#F3F2F1]">
                        {[
                          {id:'lesson1', title:'Lesson 1: What is Intercompany?', duration:'8m', desc:'Intercompany accounting needed for multi-entity setup — USMF, DEMF, INMF share transactions. Eliminations required for consolidation.'},
                          {id:'lesson2', title:'Lesson 2: 3-Step Setup', duration:'12m', desc:'Step 1: Create intercompany relations in Organization administration > Organizations > Intercompany. Step 2: Set up due to/due from main accounts 100000-200100. Step 3: Configure posting profile — Intercompany journal.'},
                          {id:'lesson3', title:'Lesson 3: D365 Navigation', duration:'10m', desc:'Navigate: GL > Setup > Intercompany > Intercompany setup. Create journal, select legal entity DEMF, post invoice — system auto-creates due to/due from.'},
                        ].map(lesson=>(
                          <div key={lesson.id} className="p-3">
                            <button onClick={()=>setLearningExpanded(lesson.id)} className="w-full flex items-center justify-between text-left cursor-pointer">
                              <span className="text-[12px] font-semibold flex items-center gap-2"><span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${learningExpanded===lesson.id?'bg-[#0078D4] text-white':'bg-[#F3F2F1] border'}`}>{learningExpanded===lesson.id?'▾':'▸'}</span>{lesson.title} <span className="text-[10px] font-normal text-[#605E5C]">({lesson.duration})</span></span>
                              <span className={`text-[10px] px-1.5 py-0.5 border ${learningExpanded===lesson.id?'bg-[#DFF6DD] border-[#A7E3A5]':'bg-[#F3F2F1] border-[#E1DFDD]'}`}>{learningExpanded===lesson.id?'OPEN':'CLOSED'}</span>
                            </button>
                            {learningExpanded===lesson.id && <div className="mt-2 ml-7 p-2 bg-[#FAF9F8] border border-[#F3F2F1] text-[11px] leading-[1.5]">{lesson.desc}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white border border-[#E1DFDD] p-3">
                      <div className="text-[12px] font-semibold">Quick Quiz — Check understanding</div>
                      <div className="mt-2 text-[11px]">Q: Intercompany requires how many steps?</div>
                      <div className="mt-2 grid grid-cols-1 gap-1.5">
                        {['1 step — Just create legal entity','3 steps — Relations + Due to/From accounts + Posting profile','5 steps — Including tax setup','2 steps — Relations + Ledger'].map(opt=>(
                          <button key={opt} onClick={()=>setQuizSelected(opt)} className={`text-left px-2 py-1.5 border text-[11px] cursor-pointer ${quizSelected===opt ? (opt.includes('3 steps')?'bg-[#DFF6DD] border-[#A7E3A5]':'bg-[#FDE7E9] border-[#F7B0B5]') : 'bg-white border-[#E1DFDD] hover:bg-[#F3F2F1]'}`}>{opt} {quizSelected===opt && (opt.includes('3 steps') ? '✓ Correct' : '✗ Try again')}</button>
                        ))}
                      </div>
                      {quizSelected?.includes('3 steps') && <div className="mt-2 p-2 bg-[#DFF6DD] border border-[#A7E3A5] text-[11px]">✅ Correct! Intercompany = Relations + Main Accounts (Due to/Due From) + Posting Profile. See Q13: "Yes - 3 legal entities".</div>}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-[#323130] text-white p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide opacity-80">D365 Help Pane — Contextual</div>
                      <div className="mt-2 bg-[#1F1F1F] border border-[#444] p-2 text-[11px] leading-[1.5]">
                        <div className="font-semibold">Intercompany accounting — Learn more</div>
                        <div className="mt-1 opacity-80">Form: InterCompany — Table: Ledger — Configuration key: LedgerBasic — Menu item: InterCompany — Data Entity: LedgerEnt — 15 chars max each.</div>
                        <div className="mt-2 flex gap-1"><span className="bg-[#0078D4] px-1.5 py-0.5 text-[10px]">MS Docs</span><span className="bg-[#333] px-1.5 py-0.5 text-[10px]">Video 4:12</span></div>
                      </div>
                    </div>
                    <div className="bg-white border border-[#E1DFDD] p-3 text-[11px]">
                      <div className="font-semibold">Context from questionnaire:</div>
                      <div className="mt-1 p-2 bg-[#FFF4CE] border border-[#FCE100]">Q13: "Intercompany accounting needed? Yes - 3 legal entities" — Fit/GAP: Customization — Impact: Reconciliation effort — Nav: GL {'>'} Setup {'>'} Intercompany</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ASSISTANT */}
              {activeDemo==='assistant' && (
                <div className="p-4 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
                  <div className="space-y-3">
                    <div className="bg-white border border-[#E1DFDD] p-3">
                      <div className="text-[11px] font-semibold">Industry Profile</div>
                      <select value={assistantIndustry} onChange={e=>setAssistantIndustry(e.target.value)} className="w-full mt-2 h-8 border border-[#8A8886] px-2 text-[12px] bg-white">
                        <option>Manufacturing</option><option>Retail</option><option>Pharma</option><option>Services</option>
                      </select>
                      <div className="mt-3 p-2 bg-[#FAF9F8] border text-[10px] leading-[1.4]">
                        <div className="font-semibold">Past projects similar: 12</div>
                        <div className="text-[#605E5C]">• Contoso Manufacturing 2023 — Apr-Mar, FIFO, Standard costing</div>
                        <div className="text-[#605E5C]">• Fabrikam Pharma 2022 — Batch mandatory, FEFO</div>
                      </div>
                    </div>
                    <div className="bg-[#E5F3FF] border border-[#A9D0F5] p-3 text-[11px]">
                      <div className="font-semibold text-[#004578]">AI Suggestions — Based on {assistantIndustry}</div>
                      <div className="mt-2 space-y-1.5">
                        <div className="bg-white border p-2"><b>Q1 Fiscal calendar:</b> Apr-Mar for {assistantIndustry} (Manufacturing uses Apr-Mar for India compliance)</div>
                        <div className="bg-white border p-2"><b>Q4 Valuation:</b> FIFO recommended — Model group FIFO-STD</div>
                        <div className="bg-white border p-2"><b>Q8 Costing:</b> Standard costing — for manufacturing COGS accuracy</div>
                      </div>
                      <button onClick={handleApplyAssistantSuggestion} className={`mt-3 w-full h-8 text-[11px] font-semibold border flex items-center justify-center gap-2 cursor-pointer ${assistantApplied?'bg-[#107C10] text-white border-[#107C10]':'bg-[#0078D4] text-white border-[#0078D4] hover:bg-[#106EBE]'}`}>{assistantApplied?'✓ Applied to Q1 — Check Questionnaire tab':'Apply suggestions to Questionnaire'}</button>
                    </div>
                  </div>
                  <div className="bg-white border border-[#E1DFDD] flex flex-col">
                    <div className="h-8 bg-[#F3F2F1] border-b px-3 text-[11px] font-semibold flex items-center gap-2"><span className="w-2 h-2 bg-[#107C10] rounded-full animate-pulse"></span> Chat — Questionnaire Assistant — Azure OpenAI</div>
                    <div className="flex-1 p-3 space-y-3 overflow-auto max-h-[400px]">
                      <div className="flex gap-2"><div className="w-6 h-6 bg-[#5C2D91] rounded-full flex items-center justify-center text-white text-[10px]">AI</div><div className="flex-1 bg-[#F3F2F1] border border-[#E1DFDD] p-2 text-[11px] rounded-tl-none rounded-[6px]">Hi! I analyzed your questionnaire — {questions.length} questions, {companies.length} companies. For {assistantIndustry}, I recommend Apr-Mar fiscal, FIFO inventory, Standard costing. Want me to apply?</div></div>
                      <div className="flex gap-2 justify-end"><div className="flex-1 max-w-[80%] bg-[#0078D4] text-white p-2 text-[11px] rounded-tr-none rounded-[6px]">Yes, suggest best practice for Manufacturing — need audit trail.</div><div className="w-6 h-6 bg-[#0078D4] rounded-full flex items-center justify-center text-white text-[10px]">AK</div></div>
                      <div className="flex gap-2"><div className="w-6 h-6 bg-[#5C2D91] rounded-full flex items-center justify-center text-white text-[10px]">AI</div><div className="flex-1 bg-[#F3F2F1] border p-2 text-[11px] rounded-[6px]">For Manufacturing: Fiscal Apr-Mar, Journal approval 2-level {'>'}10k, FIFO model group, Batch tracking optional, Vendor payment Electronic, Number sequences mandatory for audit. Confidence 94% based on 12 similar projects. Click Apply to fill Q1.</div></div>
                    </div>
                    <div className="h-12 border-t p-2 flex gap-2 bg-[#FAF9F8]">
                      <input placeholder="Ask assistant — e.g., What model group for Pharma?" className="flex-1 h-8 border border-[#8A8886] px-2 text-[11px] bg-white" />
                      <button onClick={()=>setToastMsg('Assistant replied — suggestion added')} className="h-8 px-3 bg-[#0078D4] text-white text-[11px] cursor-pointer">Send</button>
                    </div>
                  </div>
                </div>
              )}

              {/* UAT */}
              {activeDemo==='uat' && (
                <div className="p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-[#E1DFDD] p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold">Filter by Fit/GAP:</span>
                      {(['All','Fit','GAP','Partial Fit'] as const).map(f=>(
                        <button key={f} onClick={()=>setUatFilter(f)} className={`h-7 px-2 border text-[11px] cursor-pointer ${uatFilter===f?'bg-[#0078D4] text-white border-[#0078D4]':'bg-white border-[#8A8886] hover:bg-[#F3F2F1]'}`}>{f}</button>
                      ))}
                      <span className="text-[11px] text-[#605E5C]">{filteredUAT.length} test cases</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={handleExportUAT} className="h-7 px-3 bg-[#107C10] text-white text-[11px] font-semibold hover:bg-[#0E6B0E] flex items-center gap-1 cursor-pointer">📊 Export to Excel</button>
                      <button onClick={()=>{ setToastMsg('UAT scripts generated — 8 scripts'); setLastAction('Generated UAT scripts'); }} className="h-7 px-3 bg-white border border-[#8A8886] text-[11px] cursor-pointer">Generate Scripts</button>
                    </div>
                  </div>
                  <div className="bg-white border border-[#E1DFDD] overflow-auto max-h-[380px]">
                    <div className="min-w-[800px]">
                      <div className="h-8 bg-[#F3F2F1] border-b flex items-center px-2 text-[11px] font-semibold uppercase sticky top-0">
                        <span className="w-20">Test ID</span><span className="w-56">Scenario</span><span className="w-24">Module</span><span className="w-24">Fit/GAP</span><span className="flex-1">Steps</span><span className="w-56">Expected</span>
                      </div>
                      {filteredUAT.map(tc=>(
                        <div key={tc.id} className="min-h-[44px] flex items-center px-2 text-[11px] border-b border-[#F3F2F1] hover:bg-[#F3F2F1]">
                          <span className="w-20 font-mono font-semibold">{tc.id}</span>
                          <span className="w-56 truncate pr-2">{tc.scenario}</span>
                          <span className="w-24 truncate">{tc.module.split(' ')[0]}</span>
                          <span className="w-24"><span className={`px-1.5 py-0.5 text-[10px] border ${tc.fitGap==='Fit'?'bg-[#DFF6DD] border-[#A7E3A5]': tc.fitGap==='GAP'?'bg-[#FDE7E9] border-[#F7B0B5]':'bg-[#FFF4CE] border-[#FCE100]'}`}>{tc.fitGap}</span></span>
                          <span className="flex-1 text-[10px] leading-[1.3] pr-2">{tc.steps}</span>
                          <span className="w-56 text-[10px] leading-[1.3]">{tc.expected}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-[#DFF6DD] border border-[#A7E3A5] p-2 text-[11px] flex justify-between"><span>Generated from {questions.length} questionnaire answers — {UAT_TEST_CASES.length} total test cases — {questions.filter(q=>q.fitGap==='Fit').length} Fit, {questions.filter(q=>q.fitGap==='GAP').length} GAP</span><span className="font-semibold">Click Export to Excel works — real CSV download</span></div>
                </div>
              )}

              {/* INTEGRATION */}
              {activeDemo==='integration' && (
                <div className="p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-3 bg-white border border-[#E1DFDD] p-2">
                    <span className="text-[11px] font-semibold">Confidence threshold:</span>
                    <input type="range" min="70" max="100" value={integrationThreshold} onChange={e=>setIntegrationThreshold(parseInt(e.target.value))} className="w-32" />
                    <span className="text-[11px] bg-[#E5F3FF] border border-[#A9D0F5] px-2 py-0.5">{integrationThreshold}% — {filteredIntegration.length} mappings</span>
                    <span className="ml-auto text-[10px] text-[#605E5C]">Form Name, TableName, Data Entity auto-detected from questionnaire</span>
                    <button onClick={()=>{ setToastMsg(`Integration package exported — ${filteredIntegration.length} entities`); setLastAction('Exported integration mappings'); }} className="h-7 px-3 bg-[#0078D4] text-white text-[11px] cursor-pointer">Export Package</button>
                  </div>
                  <div className="bg-white border border-[#E1DFDD] overflow-auto">
                    <div className="min-w-[900px]">
                      <div className="h-8 bg-[#F3F2F1] border-b flex items-center px-2 text-[10px] font-semibold uppercase">
                        <span className="w-10">Q No</span><span className="w-48">Question</span><span className="w-24">Form Name</span><span className="w-32">TableName</span><span className="w-32">Data Entity</span><span className="w-28">OData</span><span className="w-24">Config Key</span><span className="w-20">Confidence</span>
                      </div>
                      {filteredIntegration.map(m=>(
                        <div key={m.qNo} className="h-9 flex items-center px-2 text-[11px] border-b border-[#F3F2F1] hover:bg-[#E5F3FF]">
                          <span className="w-10 font-mono">{String(m.qNo).padStart(2,'0')}</span>
                          <span className="w-48 truncate pr-2">{m.question}</span>
                          <span className="w-24 font-mono bg-[#FAF9F8] border px-1">{m.formName}</span>
                          <span className="w-32 font-mono bg-[#FAF9F8] border px-1">{m.tableName}</span>
                          <span className="w-32 font-mono bg-[#E5F3FF] border border-[#A9D0F5] px-1">{m.dataEntity}</span>
                          <span className="w-28 font-mono bg-[#F3F2F1] border px-1">{m.odata}</span>
                          <span className="w-24 font-mono bg-[#FFF4CE] border px-1">{m.configKey}</span>
                          <span className="w-20 flex items-center gap-1"><div className="flex-1 h-1.5 bg-[#E1DFDD] rounded-full overflow-hidden"><div className="h-full bg-[#107C10]" style={{width:`${m.confidence}%`}}></div></div><span className="text-[10px] font-semibold">{m.confidence}%</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                    <div className="bg-[#FAF9F8] border border-[#E1DFDD] p-2"><b>How mapping works:</b> Reads Form Name (15 chars), Field Name, TableName, Menu item, Data Entity, OData entity, Configuration key from Integration section — visible only to Consultant role. AI auto-detects with 89-98% confidence.</div>
                    <div className="bg-[#FFF4CE] border border-[#FCE100] p-2"><b>Integration target:</b> DIXF Data Management — Entity: {filteredIntegration[0]?.dataEntity || 'LedgerEnt'} — For data migration & Dual-write — Power Platform — Confidence slider filters mappings.</div>
                  </div>
                </div>
              )}

              {/* PROCESS FLOW */}
              {activeDemo==='process' && (
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="text-[12px] font-semibold">End-to-End Process Flow — Animated — From Questionnaire Answers</div>
                    <div className="flex gap-2">
                      <button onClick={()=>setProcessRunning(!processRunning)} className={`h-7 px-3 border text-[11px] cursor-pointer ${processRunning?'bg-[#0078D4] text-white border-[#0078D4]':'bg-white border-[#8A8886]'}`}>{processRunning?'⏸ Pause':'▶ Play'} Animation</button>
                      <span className="text-[10px] bg-[#F3F2F1] border px-2 py-1">Dots moving along flow when playing</span>
                    </div>
                  </div>
                  <div className="relative bg-white border border-[#E1DFDD] p-8 overflow-x-auto">
                    <div className="flex items-center justify-between min-w-[700px] relative">
                      <div className="absolute top-[36px] left-[10%] right-[10%] h-[3px] bg-[#E1DFDD]"></div>
                      <div className="absolute top-[36px] left-[10%] h-[3px] bg-[#0078D4] transition-all duration-1000" style={{width: processRunning ? '80%' : '20%'}}></div>
                      {/* Moving dots */}
                      {processRunning && (
                        <>
                          <div className="absolute top-[28px] w-3 h-3 bg-[#0078D4] rounded-full border-2 border-white shadow animate-[dotMove_4s_linear_infinite]" style={{animationDelay:'0s'}}></div>
                          <div className="absolute top-[28px] w-2 h-2 bg-[#FFB900] rounded-full animate-[dotMove_4s_linear_infinite]" style={{animationDelay:'1.2s'}}></div>
                          <div className="absolute top-[28px] w-2 h-2 bg-[#107C10] rounded-full animate-[dotMove_4s_linear_infinite]" style={{animationDelay:'2.4s'}}></div>
                        </>
                      )}
                      {PROCESS_STEPS.map((step,i)=>(
                        <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                          <div className={`w-[64px] h-[64px] rounded-full border-4 flex items-center justify-center text-[24px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all ${i===0?'border-[#0078D4] animate-[flowPulse_2s_ease-in-out_infinite]': i===PROCESS_STEPS.length-1?'border-[#107C10]':'border-[#E1DFDD]'}`}>{step.icon}</div>
                          <div className="text-[11px] font-semibold text-center">{step.label}</div>
                          <div className="text-[10px] text-[#605E5C] text-center max-w-[100px] leading-[1.2]">{step.desc}</div>
                          <div className="text-[10px] bg-[#F3F2F1] border px-1.5 py-0.5">{i===0?`${questions.length} Qs`: i===1?`24 pages`: i===2?`${questions.filter(q=>q.fitGap==='Fit').length} Fit`: i===3?`${postings.length} profiles`:`UAT ${UAT_TEST_CASES.length}`}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                    <div className="bg-[#E5F3FF] border border-[#A9D0F5] p-3"><b>Questionnaire → FRD:</b> 15 questions auto-generates Functional Requirements Doc with business area, navigation path, Fit/GAP.</div>
                    <div className="bg-[#DFF6DD] border border-[#A7E3A5] p-3"><b>Fit-GAP → Config Package:</b> Posting profiles {postings.length}, Workflows {workflows.length}, COA lines {coaLines.length}, Parameters {paramTabs.length} FastTabs.</div>
                    <div className="bg-[#FFF4CE] border border-[#FCE100] p-3"><b>Config Package → D365 Deployment:</b> Data entities {filteredIntegration.length}, UAT {UAT_TEST_CASES.length} test cases, Training plans for {Object.keys(TRAINER_PLANS).length} roles.</div>
                  </div>
                  <div className="bg-black text-white p-3 flex items-center justify-between text-[11px]">
                    <span>Animation: CSS @keyframes dotMove — dots travel left 0% to 100% along flow — Play/Pause button controls animation-play-state — Real working demo</span>
                    <button onClick={()=>{ setActiveDemo(null); setActiveTab('Questionnaire'); }} className="h-7 px-3 bg-white text-black text-[11px] cursor-pointer">Go to Questionnaire</button>
                  </div>
                </div>
              )}

              {/* TRAINER */}
              {activeDemo==='trainer' && (
                <div className="p-4 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
                  <div className="space-y-3">
                    <div className="bg-white border border-[#E1DFDD] p-3">
                      <div className="text-[11px] font-semibold">Select Role for Training</div>
                      {Object.keys(TRAINER_PLANS).map(r=>(
                        <button key={r} onClick={()=>setTrainerRole(r)} className={`w-full mt-1.5 h-8 border text-[11px] text-left px-2 flex items-center justify-between cursor-pointer ${trainerRole===r?'bg-[#0078D4] text-white border-[#0078D4]':'bg-white border-[#8A8886] hover:bg-[#F3F2F1]'}`}><span>{r}</span><span className="text-[10px]">{TRAINER_PLANS[r].length} modules</span></button>
                      ))}
                    </div>
                    <div className="bg-[#323130] text-white p-3 text-[11px]">
                      <div className="font-semibold">Discovery data used:</div>
                      <div className="mt-1 opacity-80">• {questions.length} questions — {MODULES.length} modules</div>
                      <div className="opacity-80">• {companies.length} legal entities — {roles.length} roles</div>
                      <div className="opacity-80">• {coaLines.length} COA combinations — {paramTabs.reduce((a,b)=>a+b.fields.length,0)} parameters</div>
                      <div className="mt-2 p-1.5 bg-[#1F1F1F] border border-[#444] text-[10px]">AI generates role-specific training from discovery — no manual curriculum needed.</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white border border-[#E1DFDD]">
                      <div className="h-9 bg-[#F3F2F1] border-b flex items-center px-3 justify-between">
                        <span className="text-[12px] font-semibold">Training Plan — {trainerRole} — {TRAINER_PLANS[trainerRole]?.reduce((a,b)=>a+ b.modules.length,0)} items — {TRAINER_PLANS[trainerRole]?.[0]?.duration || '2.5h'} total</span>
                        <span className="text-[10px] bg-[#DFF6DD] border border-[#A7E3A5] px-1.5 py-0.5">{trainerCompleted.length} completed</span>
                      </div>
                      <div className="divide-y divide-[#F3F2F1]">
                        {TRAINER_PLANS[trainerRole]?.map((section, si)=>(
                          <div key={si} className="p-3">
                            <div className="flex items-center justify-between"><span className="text-[12px] font-semibold">{section.title}</span><span className="text-[10px] bg-[#F3F2F1] border px-1.5 py-0.5">{section.duration}</span></div>
                            <div className="mt-2 space-y-1.5">
                              {section.modules.map((mod, mi)=>{
                                const id = `${trainerRole}-${si}-${mi}`;
                                const done = trainerCompleted.includes(id);
                                return (
                                  <div key={mi} className={`flex items-center gap-2 p-2 border text-[11px] ${done?'bg-[#DFF6DD] border-[#A7E3A5]':'bg-[#FAF9F8] border-[#E1DFDD] hover:bg-white'}`}>
                                    <span className="w-6 h-6 bg-white border flex items-center justify-center text-[12px]">{mod.type==='video'?'🎥': mod.type==='lab'?'🧪':'📄'}</span>
                                    <span className="flex-1">{mod.title}</span>
                                    <span className="text-[10px] bg-white border px-1">{mod.duration}</span>
                                    <button onClick={()=>{ if(done){ setTrainerCompleted(prev=>prev.filter(x=>x!==id)); } else { setTrainerCompleted(prev=>[...prev,id]); setLastAction(`Completed training: ${mod.title}`); } }} className={`h-6 px-2 border text-[10px] cursor-pointer ${done?'bg-[#107C10] text-white border-[#107C10]':'bg-white border-[#8A8886] hover:bg-[#F3F2F1]'}`}>{done?'✓ Done':'Mark done'}</button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-[#FFF4CE] border border-[#FCE100] p-3 flex items-center justify-between text-[11px]">
                      <span><b>Export training plan:</b> Generates videos, docs, labs from discovery data — Role: {trainerRole} — {trainerCompleted.length}/{TRAINER_PLANS[trainerRole]?.reduce((a,b)=>a+ b.modules.length,0)} completed</span>
                      <button onClick={()=>{ setToastMsg(`Training plan for ${trainerRole} exported — ${TRAINER_PLANS[trainerRole]?.length} modules`); setLastAction(`Exported training plan for ${trainerRole}`); setInteractionTick(v=>v+1); }} className="h-7 px-3 bg-[#0078D4] text-white text-[11px] cursor-pointer">Export Plan</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="h-10 bg-[#F3F2F1] border-t border-[#E1DFDD] flex items-center justify-between px-3 shrink-0 text-[11px]">
              <div className="flex items-center gap-2"><span className="w-2 h-2 bg-[#107C10] rounded-full animate-pulse"></span><span>Demo LIVE — Working interactions — No persistence — in-memory draft — Model: GPT-4o — Azure OpenAI</span></div>
              <div className="flex gap-1">
                <button onClick={()=>setActiveDemo(null)} className="h-7 px-3 bg-white border border-[#8A8886] text-[11px] hover:bg-[#EDEBE9] cursor-pointer">Close</button>
                <button onClick={()=>{ setToastMsg(`${activeDemo} demo feedback saved — in-memory`); setLastAction(`Saved ${activeDemo} demo state`); setInteractionTick(v=>v+1); }} className="h-7 px-3 bg-[#0078D4] text-white border border-[#0078D4] text-[11px] hover:bg-[#106EBE] cursor-pointer">Save Demo State</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ESC handler */}
    </div>
  );
}
