import React, { useState, useEffect, useRef, useMemo } from 'react';

// Types
type ModuleName = 'General Ledger' | 'Accounts Payable' | 'Accounts Receivable' | 'Inventory' | 'Procurement' | 'Sales and marketing' | 'Warehouse management' | 'Production control' | 'Fixed Assets' | 'Project management' | 'Human resources';
type QType = 'RadioButton' | 'Text' | 'Workflow';
type FitGap = 'Fit' | 'GAP' | 'Partial Fit' | 'Customization';

interface RadioOpt { code: string; desc: string; }
interface Integration {
  formName: string; fieldName: string; tableName: string; menuItem: string; dataEntity: string; odataEntity: string; configKey: string;
}
interface Question {
  id: string; no: number; module: ModuleName; question: string; type: QType; why: string; impact: string; businessArea: string; navPath: string; fitGap: FitGap; textValue: string; radioOptions: RadioOpt[]; attachmentName: string | null; integration: Integration;
}
interface PostingProfile { id: string; module: ModuleName; accType: 'Summary' | 'Posting'; code: string; mainAccount: string; desc: string; explanation: string; ledger: string; postingType: string; }
interface WorkflowDef { id: string; name: string; module: ModuleName; wType: 'Approval' | 'Review' | 'Task'; approver: string; condition: string; escalation: string; notification: string; }
interface ParamField { id: string; name: string; importance: string; }
interface ParamFastTab { id: string; title: string; module: ModuleName; fields: ParamField[]; }

// Language
type Lang = 'EN'|'HI'|'KN'|'ES'|'FR'|'DE'|'AR'|'JA';
interface LangMeta { code: Lang; name: string; native: string; flag: string; }

const LANGUAGES: LangMeta[] = [
  {code:'EN', name:'English', native:'English', flag:'🇺🇸'},
  {code:'HI', name:'Hindi', native:'हिन्दी', flag:'🇮🇳'},
  {code:'KN', name:'Kannada', native:'ಕನ್ನಡ', flag:'🇮🇳'},
  {code:'ES', name:'Spanish', native:'Español', flag:'🇪🇸'},
  {code:'FR', name:'French', native:'Français', flag:'🇫🇷'},
  {code:'DE', name:'German', native:'Deutsch', flag:'🇩🇪'},
  {code:'AR', name:'Arabic', native:'العربية', flag:'🇸🇦'},
  {code:'JA', name:'Japanese', native:'日本語', flag:'🇯🇵'},
];

const moduleKeyMap: Record<ModuleName,string> = {
  'General Ledger':'modGL',
  'Accounts Payable':'modAP',
  'Accounts Receivable':'modAR',
  'Inventory':'modInventory',
  'Procurement':'modProcurement',
  'Sales and marketing':'modSales',
  'Warehouse management':'modWMS',
  'Production control':'modProduction',
  'Fixed Assets':'modFA',
  'Project management':'modProject',
  'Human resources':'modHR',
};

// Translations - comprehensive
const translations: Record<Lang, Record<string,string>> = {
EN: {
appTitle:'EP_ERP Discovery Accelerator',
appSubtitle:'Dynamics 365 Finance & Operations — Questionnaire Module',
legalEntityLabel:'Legal entity:',
legalEntityValue:'USMF — Contoso Entertainment System USA',
consultantView:'Consultant View',
customerView:'Customer View',
environment:'Environment: UAT',
tabQuestionnaire:'Questionnaire',
tabPosting:'Summary & Posting profiles',
tabWorkflow:'Workflow',
tabParameters:'Parameters',
tabSystemAdmin:'System admin',
tabAIFeatures:'AI Features (10)',
btnNew:'New',
btnEdit:'Edit',
btnDelete:'Delete',
btnAddRow:'+ Add row',
btnAddField:'+ Add field',
btnNewFastTab:'+ New FastTab',
btnCopyJson:'Copy JSON',
btnExportD365:'Export to D365',
btnGenerateFRD:'Generate FRD Preview',
btnExportAllDocs:'Export All Docs',
btnOpenDemo:'Open demo',
btnAttachFile:'Attach file — All types allowed',
gridNo:'No.',
gridQuestion:'Question',
gridType:'Type',
gridFitGap:'Fit/GAP',
gridModule:'Module',
gridRecords:'records',
gridAllModules:'All modules',
filterAllModules:'All modules (15)',
autoSaveEnabled:'Auto-save enabled — Saving... → Saved',
integrationHelp:'Integration help',
generalFastTab:'General — Question No.',
autoNumberNote:'Auto-numbering, non-editable, increments',
labelQuestion:'Question',
labelQuestionType:'Question type',
labelFitGap:'Fit/GAP — capture as Fit/GAP',
labelAnswerText:'Answer (Text)',
labelWorkflowDetails:'Workflow details',
labelAttachmentMandatory:'* attachment mandatory',
labelRadioOptions:'Radio options — Code (alphanumeric) & Description (50 chars)',
labelWhyAsk:'Why we ask',
labelBusinessImpact:'Business Impact',
labelBusinessArea:'Business area in F&O',
labelNavPath:'Navigation path',
labelFormName:'Form Name',
labelFieldName:'Field Name',
labelTableName:'TableName',
labelMenuItem:'Menu item',
labelDataEntity:'Data Entity',
labelODataEntity:'OData entity',
labelConfigKey:'Configuration key',
labelIntegrationSection:'Integration section — Internal (Consultant/Admin) only — Visible to internal role',
labelIntegrationHidden:'Integration section hidden in Customer View — Consultant/Admin role required',
labelAttachment:'Attachment:',
labelAllFileTypes:'All file types per question allowed',
labelModule:'Module:',
formLabel:'Form: EP_DiscoveryQuestionnaire',
tableLabel:'Table: EP_DiscoveryTable',
postingWhy:'Why we map summary & posting profiles - avoids explanation to customer',
postingGridModule:'Module',
postingGridType:'Type',
postingGridCode:'Code',
postingGridMainAccount:'Main Account',
postingGridDesc:'Description',
postingGridLedger:'Ledger',
postingSummaryTitle:'Summary account & Posting profiles — ALL modules',
postingAccountType:'Account Type',
postingProfileCode:'Profile Code',
postingMainAccount:'Main Account',
postingDesc:'Description',
postingExplanation:'Explanation (why we map this)',
postingLedger:'Ledger',
postingPostingType:'Posting type',
workflowMinEntry:'Minimum form entry for D365 F&O workflow creation on integration',
workflowGridName:'Workflow Name',
workflowGridModule:'Module',
workflowGridType:'Type',
workflowGridApprover:'Approver',
workflowCreateTitle:'Workflow — Create workflow with minimum form entry',
workflowName:'Workflow Name',
workflowModule:'Module',
workflowType:'Workflow Type',
workflowApprover:'Approver',
workflowCondition:'Condition',
workflowEscalation:'Escalation',
workflowNotification:'Notification',
workflowPreviewTitle:'Preview: Workflow config JSON — for D365 F&O integration',
paramFastTabs:'FastTabs:',
paramLikeD365:'Like D365 F&O Parameters form — Every module has parameters which decide how module functions',
paramParametersFastTabs:'Parameters FastTabs',
paramFieldName:'Field Name',
paramImportance:'Importance / Description',
paramLooksExactly:'Looks exactly like D365 Parameters form with FastTabs — Each FastTab can be Created/Edited/Deleted, Inside FastTab: fields list where we can ADD/EDIT/DELETE field: Field Name + Importance/Description',
paramNoFields:'No fields — Add field to define parameter behavior',
sysCreateCompany:'Create Company',
sysCompanyName:'Company Name',
sysAddress:'Address',
sysExecutiveSummary:'Executive Summary',
sysCreateRole:'Create Role — Permissions matrix',
sysFormCapability:'Form / Capability',
sysEdit:'Edit',
sysDelete:'Delete',
sysView:'View',
sysRoleNamePlaceholder:'Role Name e.g. Finance Consultant',
sysCOAManagement:'COA Management',
sysUploadCOA:'Upload customer COA (Excel)',
sysCreateCOABuilder:'Create COA Builder',
sysMainAccount:'Main Account',
sysDepartment:'Department',
sysCostCenter:'Cost Center',
sysStructureNote:'Structure: Main Account - Department - Cost Center — Validates posting combinations',
sysTrainingAssets:'Training Assets — Upload videos & Screenshots',
sysDragDrop:'Drag-drop training videos',
sysDragDropNote:'MP4, MOV — Auto-generates functional walkthrough',
sysUploadedAssets:'Uploaded assets (3)',
sysHelpsGenerate:'Helps generate FRD, Test Cases, GAP-FIT',
sysUploadHelp:'Show that uploads help generate docs — AI extracts process steps for FRD & test scenarios',
aiTitle:'AI Features — 10 features from Excel with icons',
aiSubtitle:'Click card to show demo — Powered by Azure OpenAI + D365 Copilot',
aiServicesOnline:'AI Services Online — Model: GPT-4o',
aiDemo:'DEMO',
aiLayerTitle:'EP_ERP Discovery Accelerator — AI Layer',
aiLayerDesc:'All features produce FRD, GAP-FIT analysis, test cases & training from single questionnaire source',
legalHelp:'Legal entity: USMF — Organization administration > Organizations > Legal entities',
bannerCustomerTitle:'Customer permissions:',
bannerCustomerText:'You can edit and save but cannot delete records. Integration section hidden per security role. — Form: EP_DiscoveryQuestionnaire',
actionLabel:'Action:',
readyQuestionnaire:'Ready — Questionnaire loaded',
toastLangChanged:'Language changed to',
selectLanguage:'Select Language',
searchLanguage:'Search language...',
saving:'Saving...',
saved:'Saved',
draft:'Draft',
statusForm:'Form: EP_DiscoveryQuestionnaire | DataSource: EP_DiscoveryTable | Company: USMF',
statusRecords:'Records:',
statusUser:'User: Alex Kim (Consultant) | Role:',
statusVersion:'Version: 10.0.39 — Platform Update 62',
statusAllSaved:'All changes auto-saved (in-memory draft, no persistence)',
statusDraftUpdating:'Draft updating...',
integrationHelpTitle:'Integration Field Mapping — Help',
integrationHelpFormName:'Form Name (15 chars): D365 form e.g. FiscalCal — used for personalization',
integrationHelpFieldName:'Field Name: EDT field mapping — for extension',
integrationHelpTableName:'TableName: Base table — e.g. FiscalCalendar',
integrationHelpMenuItem:'Menu item: Navigation target',
integrationHelpDataEntity:'Data Entity: DIXF entity for data migration',
integrationHelpODataEntity:'OData entity: For Power Platform / Dual-write',
integrationHelpConfigKey:'Configuration key: License check — LedgerBasic, Invent etc',
integrationHelpVisibleOnly:'Visible ONLY to Internal role (Consultant/Admin). Customer role cannot see integration section per security.',
attachmentRequired:'Attachment required for Workflow type',
exampleRadio:'Example: Code: 01, Description: FIFO; Code: 02 Description: LIFO',
charLimit:'chars',
selectRecord:'Select a record to edit — inline editing like D365 F&O',
fitFit:'Fit',
fitGap:'GAP',
fitPartial:'Partial Fit',
fitCustom:'Customization',
typeRadio:'RadioButton',
typeText:'Text',
typeWorkflow:'Workflow',
modGL:'General Ledger',
modAP:'Accounts Payable',
modAR:'Accounts Receivable',
modInventory:'Inventory',
modProcurement:'Procurement',
modSales:'Sales and marketing',
modWMS:'Warehouse management',
modProduction:'Production control',
modFA:'Fixed Assets',
modProject:'Project management',
modHR:'Human resources',
aiCard1Title:'Text to speech',
aiCard1Desc:'Converts questionnaire to audio for customer walkthrough',
aiCard1Demo:'Playing: How do you define fiscal calendar? — Audio generated',
aiCard2Title:'AI Generated Functional Videos',
aiCard2Desc:'Auto-creates training videos from screenshots & parameters',
aiCard2Demo:'Generated: GL Fiscal Calendar Setup — 3:24 video',
aiCard3Title:'Interactive form walkthrough',
aiCard3Desc:'Step-by-step overlay guide on actual F&O forms',
aiCard3Demo:'Walkthrough: Organization administration > Legal entities',
aiCard4Title:'AI Screen Generator',
aiCard4Desc:'Generates D365 screen mockups from questionnaire answers',
aiCard4Demo:'Generated screen: Vendor Payment Journal with custom fields',
aiCard5Title:'Functional Consultant learning mode',
aiCard5Desc:'Learn-as-you-answer with contextual D365 help',
aiCard5Demo:'Learning: Intercompany accounting requires 3-step setup',
aiCard6Title:'Questionnaire Assistant',
aiCard6Desc:'AI suggests answers based on industry & past projects',
aiCard6Demo:'Suggestion: For FIFO inventory, use model group FIFO-STD',
aiCard7Title:'AI UAT Assistant',
aiCard7Desc:'Auto-generates UAT test cases from Fit/GAP analysis',
aiCard7Demo:'Generated 24 test cases — 18 Fit, 6 GAP scripts',
aiCard8Title:'AI Integration Assistant',
aiCard8Desc:'Maps Form Name, TableName, Data Entity automatically',
aiCard8Demo:'Mapped: FiscalCalendar → FiscalCalendarEntity → OData',
aiCard9Title:'Process flow animation',
aiCard9Desc:'Animates end-to-end business process from answers',
aiCard9Demo:'Animating: Procure-to-Pay — Requisition → PO → Receipt → Invoice',
aiCard10Title:'AI Trainer',
aiCard10Desc:'Creates role-based training plans from discovery data',
aiCard10Demo:'Training plan: 4 modules for AP Clerk — 2.5 hours',
placeholderQuestion:'Enter question...',
placeholderBusinessArea:'e.g., General Ledger > Fiscal Calendars',
placeholderNavPath:'e.g., Organization administration > ...',
placeholderDetailedResponse:'Enter detailed response...',
labelChars:'/50',
labelChars100:'/100',
labelChars250:'/250',
labelChars15:'/15',
each15chars:'Each 15 chars max — Used for D365 F&O integration mapping',
summaryType:'Summary',
postingTypeOpt:'Posting',
approval:'Approval',
review:'Review',
task:'Task',
},
HI: {
appTitle:'EP_ERP डिस्कवरी एक्सेलेरेटर',
appSubtitle:'Dynamics 365 वित्त और संचालन — प्रश्नावली मॉड्यूल',
legalEntityLabel:'कानूनी इकाई:',
legalEntityValue:'USMF — कॉन्टोसो एंटरटेनमेंट सिस्टम USA',
consultantView:'सलाहकार दृश्य',
customerView:'ग्राहक दृश्य',
environment:'परिवेश: UAT',
tabQuestionnaire:'प्रश्नावली',
tabPosting:'सारांश और पोस्टिंग प्रोफाइल',
tabWorkflow:'कार्यप्रवाह',
tabParameters:'पैरामीटर',
tabSystemAdmin:'सिस्टम व्यवस्थापक',
tabAIFeatures:'AI सुविधाएँ (10)',
btnNew:'नया',
btnEdit:'संपादित करें',
btnDelete:'हटाएँ',
btnAddRow:'+ पंक्ति जोड़ें',
btnAddField:'+ फ़ील्ड जोड़ें',
btnNewFastTab:'+ नया फास्टटैब',
btnCopyJson:'JSON कॉपी करें',
btnExportD365:'D365 में निर्यात करें',
btnGenerateFRD:'FRD पूर्वावलोकन बनाएँ',
btnExportAllDocs:'सभी दस्तावेज़ निर्यात करें',
btnOpenDemo:'डेमो खोलें',
btnAttachFile:'फ़ाइल संलग्न करें — सभी प्रकार अनुमत',
gridNo:'सं.',
gridQuestion:'प्रश्न',
gridType:'प्रकार',
gridFitGap:'फिट/गैप',
gridModule:'मॉड्यूल',
gridRecords:'रिकॉर्ड',
gridAllModules:'सभी मॉड्यूल',
filterAllModules:'सभी मॉड्यूल (15)',
autoSaveEnabled:'स्वतः-सहेजना सक्षम — सहेजा जा रहा है... → सहेजा गया',
integrationHelp:'एकीकरण सहायता',
generalFastTab:'सामान्य — प्रश्न संख्या',
autoNumberNote:'स्वतः-क्रमांकन, संपादन योग्य नहीं',
labelQuestion:'प्रश्न',
labelQuestionType:'प्रश्न प्रकार',
labelFitGap:'फिट/गैप — फिट/गैप के रूप में कैप्चर करें',
labelAnswerText:'उत्तर (पाठ)',
labelWorkflowDetails:'कार्यप्रवाह विवरण',
labelAttachmentMandatory:'* अनुलग्नक अनिवार्य',
labelRadioOptions:'रेडियो विकल्प — कोड और विवरण',
labelWhyAsk:'हम क्यों पूछते हैं',
labelBusinessImpact:'व्यावसायिक प्रभाव',
labelBusinessArea:'F&O में व्यावसायिक क्षेत्र',
labelNavPath:'नेविगेशन पथ',
labelFormName:'फॉर्म नाम',
labelFieldName:'फ़ील्ड नाम',
labelTableName:'तालिका नाम',
labelMenuItem:'मेनू आइटम',
labelDataEntity:'डेटा एंटिटी',
labelODataEntity:'OData एंटिटी',
labelConfigKey:'कॉन्फ़िगरेशन कुंजी',
labelIntegrationSection:'एकीकरण अनुभाग — केवल आंतरिक',
labelIntegrationHidden:'ग्राहक दृश्य में एकीकरण अनुभाग छिपा है',
labelAttachment:'अनुलग्नक:',
labelAllFileTypes:'प्रति प्रश्न सभी फ़ाइल प्रकार अनुमत',
labelModule:'मॉड्यूल:',
formLabel:'फॉर्म: EP_डिस्कवरी प्रश्नावली',
tableLabel:'तालिका: EP_डिस्कवरी तालिका',
postingWhy:'हम सारांश और पोस्टिंग प्रोफाइल क्यों मैप करते हैं',
postingGridModule:'मॉड्यूल',
postingGridType:'प्रकार',
postingGridCode:'कोड',
postingGridMainAccount:'मुख्य खाता',
postingGridDesc:'विवरण',
postingGridLedger:'बहीखाता',
postingSummaryTitle:'सारांश खाता और पोस्टिंग प्रोफाइल — सभी मॉड्यूल',
postingAccountType:'खाता प्रकार',
postingProfileCode:'प्रोफाइल कोड',
postingMainAccount:'मुख्य खाता',
postingDesc:'विवरण',
postingExplanation:'स्पष्टीकरण',
postingLedger:'बहीखाता',
postingPostingType:'पोस्टिंग प्रकार',
workflowMinEntry:'D365 F&O कार्यप्रवाह निर्माण के लिए न्यूनतम प्रविष्टि',
workflowGridName:'कार्यप्रवाह नाम',
workflowGridModule:'मॉड्यूल',
workflowGridType:'प्रकार',
workflowGridApprover:'अनुमोदक',
workflowCreateTitle:'कार्यप्रवाह — न्यूनतम प्रविष्टि के साथ बनाएँ',
workflowName:'कार्यप्रवाह नाम',
workflowModule:'मॉड्यूल',
workflowType:'कार्यप्रवाह प्रकार',
workflowApprover:'अनुमोदक',
workflowCondition:'शर्त',
workflowEscalation:'एस्केलेशन',
workflowNotification:'सूचना',
workflowPreviewTitle:'पूर्वावलोकन: कार्यप्रवाह कॉन्फ़िग JSON',
paramFastTabs:'फास्टटैब:',
paramLikeD365:'D365 F&O पैरामीटर फॉर्म की तरह',
paramParametersFastTabs:'पैरामीटर फास्टटैब',
paramFieldName:'फ़ील्ड नाम',
paramImportance:'महत्व / विवरण',
paramLooksExactly:'D365 पैरामीटर फॉर्म जैसा दिखता है',
paramNoFields:'कोई फ़ील्ड नहीं — व्यवहार परिभाषित करने के लिए जोड़ें',
sysCreateCompany:'कंपनी बनाएँ',
sysCompanyName:'कंपनी नाम',
sysAddress:'पता',
sysExecutiveSummary:'कार्यकारी सारांश',
sysCreateRole:'भूमिका बनाएँ — अनुमति मैट्रिक्स',
sysFormCapability:'फॉर्म / क्षमता',
sysEdit:'संपादित करें',
sysDelete:'हटाएँ',
sysView:'दृश्य',
sysRoleNamePlaceholder:'भूमिका नाम उदा. वित्त सलाहकार',
sysCOAManagement:'COA प्रबंधन',
sysUploadCOA:'ग्राहक COA अपलोड करें (Excel)',
sysCreateCOABuilder:'COA बिल्डर बनाएँ',
sysMainAccount:'मुख्य खाता',
sysDepartment:'विभाग',
sysCostCenter:'लागत केंद्र',
sysStructureNote:'संरचना: मुख्य खाता - विभाग - लागत केंद्र',
sysTrainingAssets:'प्रशिक्षण संपत्ति — वीडियो और स्क्रीनशॉट अपलोड करें',
sysDragDrop:'ड्रैग-ड्रॉप प्रशिक्षण वीडियो',
sysDragDropNote:'MP4, MOV — स्वचालित वॉकथ्रू',
sysUploadedAssets:'अपलोड की गई संपत्ति (3)',
sysHelpsGenerate:'FRD, टेस्ट केस, GAP-FIT उत्पन्न करने में मदद करता है',
sysUploadHelp:'अपलोड दस्तावेज़ बनाने में मदद करते हैं',
aiTitle:'AI सुविधाएँ — Excel से 10 सुविधाएँ',
aiSubtitle:'डेमो दिखाने के लिए कार्ड पर क्लिक करें',
aiServicesOnline:'AI सेवाएँ ऑनलाइन — मॉडल: GPT-4o',
aiDemo:'डेमो',
aiLayerTitle:'EP_ERP डिस्कवरी एक्सेलेरेटर — AI लेयर',
aiLayerDesc:'सभी सुविधाएँ एकल स्रोत से FRD, GAP-FIT, टेस्ट केस बनाती हैं',
legalHelp:'कानूनी इकाई: USMF — संगठन प्रशासन',
bannerCustomerTitle:'ग्राहक अनुमतियाँ:',
bannerCustomerText:'आप संपादित और सहेज सकते हैं लेकिन हटा नहीं सकते। एकीकरण अनुभाग छिपा है।',
actionLabel:'क्रिया:',
readyQuestionnaire:'तैयार — प्रश्नावली लोड हुई',
toastLangChanged:'भाषा बदलकर',
selectLanguage:'भाषा चुनें',
searchLanguage:'भाषा खोजें...',
saving:'सहेजा जा रहा है...',
saved:'सहेजा गया',
draft:'मसौदा',
statusForm:'फॉर्म: EP_डिस्कवरी | डेटा स्रोत: EP_तालिका',
statusRecords:'रिकॉर्ड:',
statusUser:'उपयोगकर्ता: एलेक्स किम | भूमिका:',
statusVersion:'संस्करण: 10.0.39',
statusAllSaved:'सभी परिवर्तन स्वतः सहेजे गए',
statusDraftUpdating:'मसौदा अपडेट हो रहा है...',
integrationHelpTitle:'एकीकरण फ़ील्ड मैपिंग — सहायता',
integrationHelpFormName:'फॉर्म नाम (15 अक्षर): D365 फॉर्म',
integrationHelpFieldName:'फ़ील्ड नाम: EDT मैपिंग',
integrationHelpTableName:'तालिका नाम: बेस तालिका',
integrationHelpMenuItem:'मेनू आइटम: नेविगेशन लक्ष्य',
integrationHelpDataEntity:'डेटा एंटिटी: DIXF',
integrationHelpODataEntity:'OData एंटिटी: Power Platform',
integrationHelpConfigKey:'कॉन्फ़िगरेशन कुंजी: लाइसेंस जांच',
integrationHelpVisibleOnly:'केवल आंतरिक भूमिका के लिए दृश्य',
attachmentRequired:'कार्यप्रवाह प्रकार के लिए अनुलग्नक आवश्यक',
exampleRadio:'उदाहरण: कोड: 01, विवरण: FIFO',
charLimit:'अक्षर',
selectRecord:'संपादित करने के लिए रिकॉर्ड चुनें',
fitFit:'फिट',
fitGap:'गैप',
fitPartial:'आंशिक फिट',
fitCustom:'अनुकूलन',
typeRadio:'रेडियो बटन',
typeText:'पाठ',
typeWorkflow:'कार्यप्रवाह',
modGL:'सामान्य बहीखाता',
modAP:'देय खाते',
modAR:'प्राप्य खाते',
modInventory:'इन्वेंटरी',
modProcurement:'खरीद',
modSales:'बिक्री और विपणन',
modWMS:'गोदाम प्रबंधन',
modProduction:'उत्पादन नियंत्रण',
modFA:'स्थायी संपत्ति',
modProject:'परियोजना प्रबंधन',
modHR:'मानव संसाधन',
aiCard1Title:'टेक्स्ट टू स्पीच',
aiCard1Desc:'ग्राहक वॉकथ्रू के लिए ऑडियो में बदलें',
aiCard1Demo:'चल रहा है: वित्तीय कैलेंडर कैसे परिभाषित करें?',
aiCard2Title:'AI जनरेटेड कार्यात्मक वीडियो',
aiCard2Desc:'स्क्रीनशॉट से प्रशिक्षण वीडियो बनाएं',
aiCard2Demo:'बनाया गया: GL वित्तीय कैलेंडर सेटअप',
aiCard3Title:'इंटरैक्टिव फॉर्म वॉकथ्रू',
aiCard3Desc:'वास्तविक F&O फॉर्म पर गाइड',
aiCard3Demo:'वॉकथ्रू: संगठन प्रशासन',
aiCard4Title:'AI स्क्रीन जनरेटर',
aiCard4Desc:'उत्तरों से D365 स्क्रीन मॉकअप',
aiCard4Demo:'बनाई गई स्क्रीन: विक्रेता भुगतान जर्नल',
aiCard5Title:'कार्यात्मक सलाहकार शिक्षण मोड',
aiCard5Desc:'प्रासंगिक D365 सहायता के साथ सीखें',
aiCard5Demo:'सीखना: इंटरकंपनी के लिए 3 चरण',
aiCard6Title:'प्रश्नावली सहायक',
aiCard6Desc:'उद्योग के आधार पर उत्तर सुझाएं',
aiCard6Demo:'सुझाव: FIFO के लिए मॉडल समूह',
aiCard7Title:'AI UAT सहायक',
aiCard7Desc:'Fit/GAP से UAT टेस्ट केस बनाएं',
aiCard7Demo:'24 टेस्ट केस बनाए — 18 फिट, 6 गैप',
aiCard8Title:'AI एकीकरण सहायक',
aiCard8Desc:'फॉर्म नाम, तालिका स्वचालित मैप करें',
aiCard8Demo:'मैप किया: FiscalCalendar → एंटिटी',
aiCard9Title:'प्रक्रिया प्रवाह एनिमेशन',
aiCard9Desc:'उत्तरों से व्यवसाय प्रक्रिया एनिमेट करें',
aiCard9Demo:'एनिमेट: Procure-to-Pay',
aiCard10Title:'AI प्रशिक्षक',
aiCard10Desc:'खोज डेटा से प्रशिक्षण योजना',
aiCard10Demo:'प्रशिक्षण: AP क्लर्क के लिए 4 मॉड्यूल',
placeholderQuestion:'प्रश्न दर्ज करें...',
placeholderBusinessArea:'उदा., सामान्य बहीखाता > राजकोषीय कैलेंडर',
placeholderNavPath:'उदा., संगठन प्रशासन > ...',
placeholderDetailedResponse:'विस्तृत उत्तर दर्ज करें...',
labelChars:'/50',
labelChars100:'/100',
labelChars250:'/250',
labelChars15:'/15',
each15chars:'प्रत्येक 15 अक्षर अधिकतम — D365 एकीकरण के लिए',
summaryType:'सारांश',
postingTypeOpt:'पोस्टिंग',
approval:'अनुमोदन',
review:'समीक्षा',
task:'कार्य',
},
KN: {
appTitle:'EP_ERP ಅನ್ವೇಷಣೆ ವೇಗವರ್ಧಕ',
appSubtitle:'Dynamics 365 ಹಣಕಾಸು ಮತ್ತು ಕಾರ್ಯಾಚರಣೆಗಳು — ಪ್ರಶ್ನಾವಳಿ ಮಾಡ್ಯೂಲ್',
legalEntityLabel:'ಕಾನೂನು ಘಟಕ:',
legalEntityValue:'USMF — ಕಾಂಟೋಸೊ ಎಂಟರ್ಟೈನ್ಮೆಂಟ್ ಸಿಸ್ಟಮ್ USA',
consultantView:'ಸಲಹೆಗಾರ ವೀಕ್ಷಣೆ',
customerView:'ಗ್ರಾಹಕ ವೀಕ್ಷಣೆ',
environment:'ಪರಿಸರ: UAT',
tabQuestionnaire:'ಪ್ರಶ್ನಾವಳಿ',
tabPosting:'ಸಾರಾಂಶ ಮತ್ತು ಪೋಸ್ಟಿಂಗ್ ಪ್ರೊಫೈಲ್ಗಳು',
tabWorkflow:'ಕಾರ್ಯಪ್ರವಾಹ',
tabParameters:'ಪ್ಯಾರಾಮೀಟರ್ಗಳು',
tabSystemAdmin:'ಸಿಸ್ಟಮ್ ನಿರ್ವಾಹಕ',
tabAIFeatures:'AI ವೈಶಿಷ್ಟ್ಯಗಳು (10)',
btnNew:'ಹೊಸದು',
btnEdit:'ಸಂಪಾದಿಸಿ',
btnDelete:'ಅಳಿಸಿ',
btnAddRow:'+ ಸಾಲು ಸೇರಿಸಿ',
btnAddField:'+ ಫೀಲ್ಡ್ ಸೇರಿಸಿ',
btnNewFastTab:'+ ಹೊಸ ಫಾಸ್ಟ್‌ಟ್ಯಾಬ್',
btnCopyJson:'JSON ನಕಲಿಸಿ',
btnExportD365:'D365 ಗೆ ರಫ್ತು ಮಾಡಿ',
btnGenerateFRD:'FRD ಪೂರ್ವವೀಕ್ಷಣೆ ರಚಿಸಿ',
btnExportAllDocs:'ಎಲ್ಲಾ ದಾಖಲೆಗಳನ್ನು ರಫ್ತು ಮಾಡಿ',
btnOpenDemo:'ಡೆಮೊ ತೆರೆಯಿರಿ',
btnAttachFile:'ಫೈಲ್ ಲಗತ್ತಿಸಿ — ಎಲ್ಲಾ ಪ್ರಕಾರಗಳು ಅನುಮತಿಸಲಾಗಿದೆ',
gridNo:'ಸಂ.',
gridQuestion:'ಪ್ರಶ್ನೆ',
gridType:'ಪ್ರಕಾರ',
gridFitGap:'ಫಿಟ್/ಗ್ಯಾಪ್',
gridModule:'ಮಾಡ್ಯೂಲ್',
gridRecords:'ದಾಖಲೆಗಳು',
gridAllModules:'ಎಲ್ಲಾ ಮಾಡ್ಯೂಲ್ಗಳು',
filterAllModules:'ಎಲ್ಲಾ ಮಾಡ್ಯೂಲ್ಗಳು (15)',
autoSaveEnabled:'ಸ್ವಯಂ-ಉಳಿಸಿ ಸಕ್ರಿಯವಾಗಿದೆ — ಉಳಿಸಲಾಗುತ್ತಿದೆ... → ಉಳಿಸಲಾಗಿದೆ',
integrationHelp:'ಏಕೀಕರಣ ಸಹಾಯ',
generalFastTab:'ಸಾಮಾನ್ಯ — ಪ್ರಶ್ನೆ ಸಂಖ್ಯೆ',
autoNumberNote:'ಸ್ವಯಂ-ಸಂಖ್ಯೆ, ಸಂಪಾದಿಸಲಾಗದು',
labelQuestion:'ಪ್ರಶ್ನೆ',
labelQuestionType:'ಪ್ರಶ್ನೆ ಪ್ರಕಾರ',
labelFitGap:'ಫಿಟ್/ಗ್ಯಾಪ್ — ಫಿಟ್/ಗ್ಯಾಪ್ ಆಗಿ ಸೆರೆಹಿಡಿಯಿರಿ',
labelAnswerText:'ಉತ್ತರ (ಪಠ್ಯ)',
labelWorkflowDetails:'ಕಾರ್ಯಪ್ರವಾಹ ವಿವರಗಳು',
labelAttachmentMandatory:'* ಲಗತ್ತು ಕಡ್ಡಾಯ',
labelRadioOptions:'ರೇಡಿಯೋ ಆಯ್ಕೆಗಳು — ಕೋಡ್ ಮತ್ತು ವಿವರಣೆ',
labelWhyAsk:'ನಾವು ಏಕೆ ಕೇಳುತ್ತೇವೆ',
labelBusinessImpact:'ವ್ಯವಹಾರ ಪರಿಣಾಮ',
labelBusinessArea:'F&O ನಲ್ಲಿ ವ್ಯವಹಾರ ಪ್ರದೇಶ',
labelNavPath:'ನ್ಯಾವಿಗೇಶನ್ ಮಾರ್ಗ',
labelFormName:'ಫಾರ್ಮ್ ಹೆಸರು',
labelFieldName:'ಫೀಲ್ಡ್ ಹೆಸರು',
labelTableName:'ಟೇಬಲ್ ಹೆಸರು',
labelMenuItem:'ಮೆನು ಐಟಂ',
labelDataEntity:'ಡೇಟಾ ಎಂಟಿಟಿ',
labelODataEntity:'OData ಎಂಟಿಟಿ',
labelConfigKey:'ಕಾನ್ಫಿಗರೇಶನ್ ಕೀ',
labelIntegrationSection:'ಏಕೀಕರಣ ವಿಭಾಗ — ಆಂತರಿಕ ಮಾತ್ರ',
labelIntegrationHidden:'ಗ್ರಾಹಕ ವೀಕ್ಷಣೆಯಲ್ಲಿ ಏಕೀಕರಣ ಮರೆಮಾಡಲಾಗಿದೆ',
labelAttachment:'ಲಗತ್ತು:',
labelAllFileTypes:'ಪ್ರತಿ ಪ್ರಶ್ನೆಗೆ ಎಲ್ಲಾ ಫೈಲ್ ಪ್ರಕಾರಗಳು ಅನುಮತಿಸಲಾಗಿದೆ',
labelModule:'ಮಾಡ್ಯೂಲ್:',
formLabel:'ಫಾರ್ಮ್: EP_ಅನ್ವೇಷಣೆ ಪ್ರಶ್ನಾವಳಿ',
tableLabel:'ಟೇಬಲ್: EP_ಅನ್ವೇಷಣೆ ಟೇಬಲ್',
postingWhy:'ನಾವು ಸಾರಾಂಶ ಮತ್ತು ಪೋಸ್ಟಿಂಗ್ ಪ್ರೊಫೈಲ್‌ಗಳನ್ನು ಏಕೆ ಮ್ಯಾಪ್ ಮಾಡುತ್ತೇವೆ',
postingGridModule:'ಮಾಡ್ಯೂಲ್',
postingGridType:'ಪ್ರಕಾರ',
postingGridCode:'ಕೋಡ್',
postingGridMainAccount:'ಮುಖ್ಯ ಖಾತೆ',
postingGridDesc:'ವಿವರಣೆ',
postingGridLedger:'ಲೆಡ್ಜರ್',
postingSummaryTitle:'ಸಾರಾಂಶ ಖಾತೆ ಮತ್ತು ಪೋಸ್ಟಿಂಗ್ ಪ್ರೊಫೈಲ್‌ಗಳು — ಎಲ್ಲಾ ಮಾಡ್ಯೂಲ್‌ಗಳು',
postingAccountType:'ಖಾತೆ ಪ್ರಕಾರ',
postingProfileCode:'ಪ್ರೊಫೈಲ್ ಕೋಡ್',
postingMainAccount:'ಮುಖ್ಯ ಖಾತೆ',
postingDesc:'ವಿವರಣೆ',
postingExplanation:'ವಿವರಣೆ',
postingLedger:'ಲೆಡ್ಜರ್',
postingPostingType:'ಪೋಸ್ಟಿಂಗ್ ಪ್ರಕಾರ',
workflowMinEntry:'D365 F&O ಕಾರ್ಯಪ್ರವಾಹ ರಚನೆಗೆ ಕನಿಷ್ಠ ನಮೂದು',
workflowGridName:'ಕಾರ್ಯಪ್ರವಾಹ ಹೆಸರು',
workflowGridModule:'ಮಾಡ್ಯೂಲ್',
workflowGridType:'ಪ್ರಕಾರ',
workflowGridApprover:'ಅನುಮೋದಕ',
workflowCreateTitle:'ಕಾರ್ಯಪ್ರವಾಹ — ಕನಿಷ್ಠ ನಮೂದಿನೊಂದಿಗೆ ರಚಿಸಿ',
workflowName:'ಕಾರ್ಯಪ್ರವಾಹ ಹೆಸರು',
workflowModule:'ಮಾಡ್ಯೂಲ್',
workflowType:'ಕಾರ್ಯಪ್ರವಾಹ ಪ್ರಕಾರ',
workflowApprover:'ಅನುಮೋದಕ',
workflowCondition:'ಷರತ್ತು',
workflowEscalation:'ಎಸ್ಕಲೇಶನ್',
workflowNotification:'ಅಧಿಸೂಚನೆ',
workflowPreviewTitle:'ಪೂರ್ವವೀಕ್ಷಣೆ: ಕಾರ್ಯಪ್ರವಾಹ ಕಾನ್ಫಿಗ್ JSON',
paramFastTabs:'ಫಾಸ್ಟ್‌ಟ್ಯಾಬ್‌ಗಳು:',
paramLikeD365:'D365 F&O ಪ್ಯಾರಾಮೀಟರ್ ಫಾರ್ಮ್‌ನಂತೆ',
paramParametersFastTabs:'ಪ್ಯಾರಾಮೀಟರ್ ಫಾಸ್ಟ್‌ಟ್ಯಾಬ್‌ಗಳು',
paramFieldName:'ಫೀಲ್ಡ್ ಹೆಸರು',
paramImportance:'ಪ್ರಾಮುಖ್ಯತೆ / ವಿವರಣೆ',
paramLooksExactly:'D365 ಪ್ಯಾರಾಮೀಟರ್ ಫಾರ್ಮ್‌ನಂತೆ ಕಾಣುತ್ತದೆ',
paramNoFields:'ಯಾವುದೇ ಫೀಲ್ಡ್‌ಗಳಿಲ್ಲ — ನಡವಳಿಕೆ ವ್ಯಾಖ್ಯಾನಿಸಲು ಸೇರಿಸಿ',
sysCreateCompany:'ಕಂಪನಿ ರಚಿಸಿ',
sysCompanyName:'ಕಂಪನಿ ಹೆಸರು',
sysAddress:'ವಿಳಾಸ',
sysExecutiveSummary:'ಕಾರ್ಯನಿರ್ವಾಹಕ ಸಾರಾಂಶ',
sysCreateRole:'ಪಾತ್ರ ರಚಿಸಿ — ಅನುಮತಿ ಮ್ಯಾಟ್ರಿಕ್ಸ್',
sysFormCapability:'ಫಾರ್ಮ್ / ಸಾಮರ್ಥ್ಯ',
sysEdit:'ಸಂಪಾದಿಸಿ',
sysDelete:'ಅಳಿಸಿ',
sysView:'ವೀಕ್ಷಿಸಿ',
sysRoleNamePlaceholder:'ಪಾತ್ರದ ಹೆಸರು ಉದಾ. ಹಣಕಾಸು ಸಲಹೆಗಾರ',
sysCOAManagement:'COA ನಿರ್ವಹಣೆ',
sysUploadCOA:'ಗ್ರಾಹಕ COA ಅಪ್‌ಲೋಡ್ ಮಾಡಿ (Excel)',
sysCreateCOABuilder:'COA ಬಿಲ್ಡರ್ ರಚಿಸಿ',
sysMainAccount:'ಮುಖ್ಯ ಖಾತೆ',
sysDepartment:'ಇಲಾಖೆ',
sysCostCenter:'ವೆಚ್ಚ ಕೇಂದ್ರ',
sysStructureNote:'ರಚನೆ: ಮುಖ್ಯ ಖಾತೆ - ಇಲಾಖೆ - ವೆಚ್ಚ ಕೇಂದ್ರ',
sysTrainingAssets:'ತರಬೇತಿ ಸ್ವತ್ತುಗಳು — ವೀಡಿಯೊಗಳು ಮತ್ತು ಸ್ಕ್ರೀನ್‌ಶಾಟ್‌ಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
sysDragDrop:'ಡ್ರ್ಯಾಗ್-ಡ್ರಾಪ್ ತರಬೇತಿ ವೀಡಿಯೊಗಳು',
sysDragDropNote:'MP4, MOV — ಸ್ವಯಂ-ವಾಕ್‌ಥ್ರೂ ರಚಿಸುತ್ತದೆ',
sysUploadedAssets:'ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ಸ್ವತ್ತುಗಳು (3)',
sysHelpsGenerate:'FRD, ಟೆಸ್ಟ್ ಕೇಸ್‌ಗಳು, GAP-FIT ರಚಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ',
sysUploadHelp:'ಅಪ್‌ಲೋಡ್‌ಗಳು ದಾಖಲೆಗಳನ್ನು ರಚಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ',
aiTitle:'AI ವೈಶಿಷ್ಟ್ಯಗಳು — Excel ನಿಂದ 10 ವೈಶಿಷ್ಟ್ಯಗಳು',
aiSubtitle:'ಡೆಮೊ ತೋರಿಸಲು ಕಾರ್ಡ್ ಕ್ಲಿಕ್ ಮಾಡಿ',
aiServicesOnline:'AI ಸೇವೆಗಳು ಆನ್‌ಲೈನ್ — ಮಾದರಿ: GPT-4o',
aiDemo:'ಡೆಮೊ',
aiLayerTitle:'EP_ERP ಅನ್ವೇಷಣೆ ವೇಗವರ್ಧಕ — AI ಪದರ',
aiLayerDesc:'ಎಲ್ಲಾ ವೈಶಿಷ್ಟ್ಯಗಳು ಏಕೈಕ ಮೂಲದಿಂದ FRD, GAP-FIT, ಟೆಸ್ಟ್ ಕೇಸ್‌ಗಳನ್ನು ಉತ್ಪಾದಿಸುತ್ತವೆ',
legalHelp:'ಕಾನೂನು ಘಟಕ: USMF — ಸಂಸ್ಥೆ ಆಡಳಿತ',
bannerCustomerTitle:'ಗ್ರಾಹಕ ಅನುಮತಿಗಳು:',
bannerCustomerText:'ನೀವು ಸಂಪಾದಿಸಬಹುದು ಮತ್ತು ಉಳಿಸಬಹುದು ಆದರೆ ಅಳಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ. ಏಕೀಕರಣ ವಿಭಾಗ ಮರೆಮಾಡಲಾಗಿದೆ.',
actionLabel:'ಕ್ರಿಯೆ:',
readyQuestionnaire:'ಸಿದ್ಧ — ಪ್ರಶ್ನಾವಳಿ ಲೋಡ್ ಆಗಿದೆ',
toastLangChanged:'ಭಾಷೆಯನ್ನು ಬದಲಾಯಿಸಲಾಗಿದೆ',
selectLanguage:'ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ',
searchLanguage:'ಭಾಷೆ ಹುಡುಕಿ...',
saving:'ಉಳಿಸಲಾಗುತ್ತಿದೆ...',
saved:'ಉಳಿಸಲಾಗಿದೆ',
draft:'ಕರಡು',
statusForm:'ಫಾರ್ಮ್: EP_ಅನ್ವೇಷಣೆ | ಡೇಟಾ ಮೂಲ: EP_ಟೇಬಲ್',
statusRecords:'ದಾಖಲೆಗಳು:',
statusUser:'ಬಳಕೆದಾರ: ಅಲೆಕ್ಸ್ ಕಿಮ್ | ಪಾತ್ರ:',
statusVersion:'ಆವೃತ್ತಿ: 10.0.39',
statusAllSaved:'ಎಲ್ಲಾ ಬದಲಾವಣೆಗಳು ಸ್ವಯಂ-ಉಳಿಸಲಾಗಿದೆ',
statusDraftUpdating:'ಕರಡು ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ...',
integrationHelpTitle:'ಏಕೀಕರಣ ಫೀಲ್ಡ್ ಮ್ಯಾಪಿಂಗ್ — ಸಹಾಯ',
integrationHelpFormName:'ಫಾರ್ಮ್ ಹೆಸರು (15 ಅಕ್ಷರಗಳು): D365 ಫಾರ್ಮ್',
integrationHelpFieldName:'ಫೀಲ್ಡ್ ಹೆಸರು: EDT ಮ್ಯಾಪಿಂಗ್',
integrationHelpTableName:'ಟೇಬಲ್ ಹೆಸರು: ಬೇಸ್ ಟೇಬಲ್',
integrationHelpMenuItem:'ಮೆನು ಐಟಂ: ನ್ಯಾವಿಗೇಶನ್ ಗುರಿ',
integrationHelpDataEntity:'ಡೇಟಾ ಎಂಟಿಟಿ: DIXF',
integrationHelpODataEntity:'OData ಎಂಟಿಟಿ: Power Platform',
integrationHelpConfigKey:'ಕಾನ್ಫಿಗರೇಶನ್ ಕೀ: ಪರವಾನಗಿ ಪರಿಶೀಲನೆ',
integrationHelpVisibleOnly:'ಆಂತರಿಕ ಪಾತ್ರಕ್ಕೆ ಮಾತ್ರ ಗೋಚರ',
attachmentRequired:'ಕಾರ್ಯಪ್ರವಾಹ ಪ್ರಕಾರಕ್ಕೆ ಲಗತ್ತು ಅಗತ್ಯವಿದೆ',
exampleRadio:'ಉದಾಹರಣೆ: ಕೋಡ್: 01, ವಿವರಣೆ: FIFO',
charLimit:'ಅಕ್ಷರಗಳು',
selectRecord:'ಸಂಪಾದಿಸಲು ದಾಖಲೆ ಆಯ್ಕೆಮಾಡಿ',
fitFit:'ಫಿಟ್',
fitGap:'ಗ್ಯಾಪ್',
fitPartial:'ಭಾಗಶಃ ಫಿಟ್',
fitCustom:'ಗ್ರಾಹಕೀಕರಣ',
typeRadio:'ರೇಡಿಯೋ ಬಟನ್',
typeText:'ಪಠ್ಯ',
typeWorkflow:'ಕಾರ್ಯಪ್ರವಾಹ',
modGL:'ಸಾಮಾನ್ಯ ಲೆಡ್ಜರ್',
modAP:'ಪಾವತಿಸಬೇಕಾದ ಖಾತೆಗಳು',
modAR:'ಸ್ವೀಕರಿಸಬೇಕಾದ ಖಾತೆಗಳು',
modInventory:'ದಾಸ್ತಾನು',
modProcurement:'ಖರೀದಿ',
modSales:'ಮಾರಾಟ ಮತ್ತು ಮಾರ್ಕೆಟಿಂಗ್',
modWMS:'ಗೋದಾಮು ನಿರ್ವಹಣೆ',
modProduction:'ಉತ್ಪಾದನಾ ನಿಯಂತ್ರಣ',
modFA:'ಸ್ಥಿರ ಆಸ್ತಿಗಳು',
modProject:'ಯೋಜನಾ ನಿರ್ವಹಣೆ',
modHR:'ಮಾನವ ಸಂಪನ್ಮೂಲ',
aiCard1Title:'ಪಠ್ಯದಿಂದ ಭಾಷಣ',
aiCard1Desc:'ಗ್ರಾಹಕ ವಾಕ್‌ಥ್ರೂಗಾಗಿ ಆಡಿಯೊಗೆ ಪರಿವರ್ತಿಸಿ',
aiCard1Demo:'ಪ್ಲೇ ಆಗುತ್ತಿದೆ: ಹಣಕಾಸು ಕ್ಯಾಲೆಂಡರ್ ವ್ಯಾಖ್ಯಾನ?',
aiCard2Title:'AI ರಚಿತ ಕ್ರಿಯಾತ್ಮಕ ವೀಡಿಯೊಗಳು',
aiCard2Desc:'ಸ್ಕ್ರೀನ್‌ಶಾಟ್‌ಗಳಿಂದ ತರಬೇತಿ ವೀಡಿಯೊಗಳನ್ನು ರಚಿಸಿ',
aiCard2Demo:'ರಚಿಸಲಾಗಿದೆ: GL ಹಣಕಾಸು ಕ್ಯಾಲೆಂಡರ್ ಸೆಟಪ್',
aiCard3Title:'ಸಂವಾದಾತ್ಮಕ ಫಾರ್ಮ್ ವಾಕ್‌ಥ್ರೂ',
aiCard3Desc:'ನಿಜವಾದ F&O ಫಾರ್ಮ್‌ಗಳಲ್ಲಿ ಮಾರ್ಗದರ್ಶಿ',
aiCard3Demo:'ವಾಕ್‌ಥ್ರೂ: ಸಂಸ್ಥೆ ಆಡಳಿತ',
aiCard4Title:'AI ಸ್ಕ್ರೀನ್ ಜನರೇಟರ್',
aiCard4Desc:'ಉತ್ತರಗಳಿಂದ D365 ಸ್ಕ್ರೀನ್ ಮಾಕಪ್‌ಗಳು',
aiCard4Demo:'ರಚಿಸಿದ ಸ್ಕ್ರೀನ್: ಮಾರಾಟಗಾರ ಪಾವತಿ ಜರ್ನಲ್',
aiCard5Title:'ಕ್ರಿಯಾತ್ಮಕ ಸಲಹೆಗಾರ ಕಲಿಕೆ ಮೋಡ್',
aiCard5Desc:'ಸಂದರ್ಭೋಚಿತ D365 ಸಹಾಯದೊಂದಿಗೆ ಕಲಿಯಿರಿ',
aiCard5Demo:'ಕಲಿಕೆ: ಇಂಟರ್‌ಕಂಪನಿಗೆ 3 ಹಂತಗಳು',
aiCard6Title:'ಪ್ರಶ್ನಾವಳಿ ಸಹಾಯಕ',
aiCard6Desc:'ಉದ್ಯಮ ಆಧರಿಸಿ ಉತ್ತರಗಳನ್ನು ಸೂಚಿಸಿ',
aiCard6Demo:'ಸಲಹೆ: FIFO ಗಾಗಿ ಮಾದರಿ ಗುಂಪು',
aiCard7Title:'AI UAT ಸಹಾಯಕ',
aiCard7Desc:'Fit/GAP ನಿಂದ UAT ಟೆಸ್ಟ್ ಕೇಸ್‌ಗಳನ್ನು ರಚಿಸಿ',
aiCard7Demo:'24 ಟೆಸ್ಟ್ ಕೇಸ್‌ಗಳು — 18 ಫಿಟ್, 6 ಗ್ಯಾಪ್',
aiCard8Title:'AI ಏಕೀಕರಣ ಸಹಾಯಕ',
aiCard8Desc:'ಫಾರ್ಮ್ ಹೆಸರು, ಟೇಬಲ್ ಸ್ವಯಂ ಮ್ಯಾಪ್ ಮಾಡಿ',
aiCard8Demo:'ಮ್ಯಾಪ್ ಮಾಡಲಾಗಿದೆ: FiscalCalendar → ಎಂಟಿಟಿ',
aiCard9Title:'ಪ್ರಕ್ರಿಯೆ ಹರಿವು ಅನಿಮೇಷನ್',
aiCard9Desc:'ಉತ್ತರಗಳಿಂದ ವ್ಯವಹಾರ ಪ್ರಕ್ರಿಯೆಯನ್ನು ಅನಿಮೇಟ್ ಮಾಡಿ',
aiCard9Demo:'ಅನಿಮೇಟ್: Procure-to-Pay',
aiCard10Title:'AI ತರಬೇತುದಾರ',
aiCard10Desc:'ಅನ್ವೇಷಣೆ ಡೇಟಾದಿಂದ ತರಬೇತಿ ಯೋಜನೆ',
aiCard10Demo:'ತರಬೇತಿ: AP ಗುಮಾಸ್ತರಿಗೆ 4 ಮಾಡ್ಯೂಲ್‌ಗಳು',
placeholderQuestion:'ಪ್ರಶ್ನೆ ನಮೂದಿಸಿ...',
placeholderBusinessArea:'ಉದಾ., ಸಾಮಾನ್ಯ ಲೆಡ್ಜರ್ > ಹಣಕಾಸು ಕ್ಯಾಲೆಂಡರ್‌ಗಳು',
placeholderNavPath:'ಉದಾ., ಸಂಸ್ಥೆ ಆಡಳಿತ > ...',
placeholderDetailedResponse:'ವಿವರವಾದ ಪ್ರತಿಕ್ರಿಯೆ ನಮೂದಿಸಿ...',
labelChars:'/50',
labelChars100:'/100',
labelChars250:'/250',
labelChars15:'/15',
each15chars:'ಪ್ರತಿ 15 ಅಕ್ಷರಗಳು ಗರಿಷ್ಠ — D365 ಏಕೀಕರಣಕ್ಕೆ',
summaryType:'ಸಾರಾಂಶ',
postingTypeOpt:'ಪೋಸ್ಟಿಂಗ್',
approval:'ಅನುಮೋದನೆ',
review:'ವಿಮರ್ಶೆ',
task:'ಕಾರ್ಯ',
},
ES: {
appTitle:'EP_ERP Acelerador de Descubrimiento',
appSubtitle:'Dynamics 365 Finanzas y Operaciones — Módulo de Cuestionario',
legalEntityLabel:'Entidad legal:',
legalEntityValue:'USMF — Contoso Entertainment System USA',
consultantView:'Vista de Consultor',
customerView:'Vista de Cliente',
environment:'Entorno: UAT',
tabQuestionnaire:'Cuestionario',
tabPosting:'Perfiles de resumen y contabilización',
tabWorkflow:'Flujo de trabajo',
tabParameters:'Parámetros',
tabSystemAdmin:'Administración del sistema',
tabAIFeatures:'Funciones de IA (10)',
btnNew:'Nuevo',
btnEdit:'Editar',
btnDelete:'Eliminar',
btnAddRow:'+ Agregar fila',
btnAddField:'+ Agregar campo',
btnNewFastTab:'+ Nuevo FastTab',
btnCopyJson:'Copiar JSON',
btnExportD365:'Exportar a D365',
btnGenerateFRD:'Generar vista previa FRD',
btnExportAllDocs:'Exportar todos los documentos',
btnOpenDemo:'Abrir demo',
btnAttachFile:'Adjuntar archivo — Todos los tipos permitidos',
gridNo:'N.º',
gridQuestion:'Pregunta',
gridType:'Tipo',
gridFitGap:'Fit/GAP',
gridModule:'Módulo',
gridRecords:'registros',
gridAllModules:'Todos los módulos',
filterAllModules:'Todos los módulos (15)',
autoSaveEnabled:'Autoguardado activado — Guardando... → Guardado',
integrationHelp:'Ayuda de integración',
generalFastTab:'General — Pregunta N.º',
autoNumberNote:'Autonumeración, no editable, incrementa',
labelQuestion:'Pregunta',
labelQuestionType:'Tipo de pregunta',
labelFitGap:'Fit/GAP — capturar como Fit/GAP',
labelAnswerText:'Respuesta (Texto)',
labelWorkflowDetails:'Detalles del flujo de trabajo',
labelAttachmentMandatory:'* adjunto obligatorio',
labelRadioOptions:'Opciones de radio — Código y Descripción',
labelWhyAsk:'Por qué preguntamos',
labelBusinessImpact:'Impacto empresarial',
labelBusinessArea:'Área de negocio en F&O',
labelNavPath:'Ruta de navegación',
labelFormName:'Nombre del formulario',
labelFieldName:'Nombre del campo',
labelTableName:'Nombre de tabla',
labelMenuItem:'Elemento de menú',
labelDataEntity:'Entidad de datos',
labelODataEntity:'Entidad OData',
labelConfigKey:'Clave de configuración',
labelIntegrationSection:'Sección de integración — Solo interno (Consultor/Admin)',
labelIntegrationHidden:'Sección de integración oculta en Vista de Cliente',
labelAttachment:'Adjunto:',
labelAllFileTypes:'Todos los tipos de archivo por pregunta permitidos',
labelModule:'Módulo:',
formLabel:'Formulario: EP_CuestionarioDescubrimiento',
tableLabel:'Tabla: EP_TablaDescubrimiento',
postingWhy:'Por qué mapeamos perfiles de resumen y contabilización',
postingGridModule:'Módulo',
postingGridType:'Tipo',
postingGridCode:'Código',
postingGridMainAccount:'Cuenta principal',
postingGridDesc:'Descripción',
postingGridLedger:'Libro mayor',
postingSummaryTitle:'Cuenta de resumen y perfiles de contabilización — TODOS los módulos',
postingAccountType:'Tipo de cuenta',
postingProfileCode:'Código de perfil',
postingMainAccount:'Cuenta principal',
postingDesc:'Descripción',
postingExplanation:'Explicación',
postingLedger:'Libro mayor',
postingPostingType:'Tipo de contabilización',
workflowMinEntry:'Entrada mínima para creación de flujo de trabajo D365 F&O',
workflowGridName:'Nombre del flujo de trabajo',
workflowGridModule:'Módulo',
workflowGridType:'Tipo',
workflowGridApprover:'Aprobador',
workflowCreateTitle:'Flujo de trabajo — Crear con entrada mínima',
workflowName:'Nombre del flujo de trabajo',
workflowModule:'Módulo',
workflowType:'Tipo de flujo de trabajo',
workflowApprover:'Aprobador',
workflowCondition:'Condición',
workflowEscalation:'Escalada',
workflowNotification:'Notificación',
workflowPreviewTitle:'Vista previa: JSON de configuración de flujo de trabajo',
paramFastTabs:'FastTabs:',
paramLikeD365:'Como el formulario de Parámetros de D365 F&O',
paramParametersFastTabs:'FastTabs de Parámetros',
paramFieldName:'Nombre del campo',
paramImportance:'Importancia / Descripción',
paramLooksExactly:'Se ve exactamente como el formulario de Parámetros de D365',
paramNoFields:'Sin campos — Agregar campo para definir comportamiento',
sysCreateCompany:'Crear empresa',
sysCompanyName:'Nombre de empresa',
sysAddress:'Dirección',
sysExecutiveSummary:'Resumen ejecutivo',
sysCreateRole:'Crear rol — Matriz de permisos',
sysFormCapability:'Formulario / Capacidad',
sysEdit:'Editar',
sysDelete:'Eliminar',
sysView:'Ver',
sysRoleNamePlaceholder:'Nombre del rol ej. Consultor Financiero',
sysCOAManagement:'Gestión de COA',
sysUploadCOA:'Cargar COA del cliente (Excel)',
sysCreateCOABuilder:'Crear generador de COA',
sysMainAccount:'Cuenta principal',
sysDepartment:'Departamento',
sysCostCenter:'Centro de costo',
sysStructureNote:'Estructura: Cuenta principal - Departamento - Centro de costo',
sysTrainingAssets:'Activos de formación — Cargar videos y capturas',
sysDragDrop:'Arrastrar y soltar videos de formación',
sysDragDropNote:'MP4, MOV — Genera recorrido funcional automáticamente',
sysUploadedAssets:'Activos cargados (3)',
sysHelpsGenerate:'Ayuda a generar FRD, Casos de prueba, GAP-FIT',
sysUploadHelp:'Las cargas ayudan a generar documentos',
aiTitle:'Funciones de IA — 10 funciones de Excel',
aiSubtitle:'Haga clic en la tarjeta para mostrar demo',
aiServicesOnline:'Servicios de IA en línea — Modelo: GPT-4o',
aiDemo:'DEMO',
aiLayerTitle:'EP_ERP Acelerador — Capa de IA',
aiLayerDesc:'Todas las funciones producen FRD, análisis GAP-FIT, casos de prueba desde una sola fuente',
legalHelp:'Entidad legal: USMF — Administración de la organización',
bannerCustomerTitle:'Permisos de cliente:',
bannerCustomerText:'Puede editar y guardar pero no eliminar registros. Sección de integración oculta por rol de seguridad.',
actionLabel:'Acción:',
readyQuestionnaire:'Listo — Cuestionario cargado',
toastLangChanged:'Idioma cambiado a',
selectLanguage:'Seleccionar idioma',
searchLanguage:'Buscar idioma...',
saving:'Guardando...',
saved:'Guardado',
draft:'Borrador',
statusForm:'Formulario: EP_Cuestionario | Fuente: EP_Tabla',
statusRecords:'Registros:',
statusUser:'Usuario: Alex Kim | Rol:',
statusVersion:'Versión: 10.0.39',
statusAllSaved:'Todos los cambios autoguardados',
statusDraftUpdating:'Actualizando borrador...',
integrationHelpTitle:'Mapeo de campos de integración — Ayuda',
integrationHelpFormName:'Nombre del formulario (15 caracteres): formulario D365',
integrationHelpFieldName:'Nombre del campo: Mapeo EDT',
integrationHelpTableName:'Nombre de tabla: Tabla base',
integrationHelpMenuItem:'Elemento de menú: Destino de navegación',
integrationHelpDataEntity:'Entidad de datos: Entidad DIXF',
integrationHelpODataEntity:'Entidad OData: Para Power Platform',
integrationHelpConfigKey:'Clave de configuración: Verificación de licencia',
integrationHelpVisibleOnly:'Visible SOLO para rol interno',
attachmentRequired:'Adjunto requerido para tipo de flujo de trabajo',
exampleRadio:'Ejemplo: Código: 01, Descripción: FIFO',
charLimit:'caracteres',
selectRecord:'Seleccione un registro para editar',
fitFit:'Ajuste',
fitGap:'Brecha',
fitPartial:'Ajuste parcial',
fitCustom:'Personalización',
typeRadio:'Botón de radio',
typeText:'Texto',
typeWorkflow:'Flujo de trabajo',
modGL:'Libro mayor general',
modAP:'Cuentas por pagar',
modAR:'Cuentas por cobrar',
modInventory:'Inventario',
modProcurement:'Adquisiciones',
modSales:'Ventas y marketing',
modWMS:'Gestión de almacenes',
modProduction:'Control de producción',
modFA:'Activos fijos',
modProject:'Gestión de proyectos',
modHR:'Recursos humanos',
aiCard1Title:'Texto a voz',
aiCard1Desc:'Convierte cuestionario a audio para recorrido del cliente',
aiCard1Demo:'Reproduciendo: ¿Cómo define el calendario fiscal?',
aiCard2Title:'Videos funcionales generados por IA',
aiCard2Desc:'Crea automáticamente videos de formación desde capturas',
aiCard2Demo:'Generado: Configuración del calendario fiscal GL',
aiCard3Title:'Recorrido interactivo de formularios',
aiCard3Desc:'Guía paso a paso superpuesta en formularios reales de F&O',
aiCard3Demo:'Recorrido: Administración de la organización',
aiCard4Title:'Generador de pantallas IA',
aiCard4Desc:'Genera maquetas de pantallas D365 desde respuestas',
aiCard4Demo:'Pantalla generada: Diario de pagos a proveedores',
aiCard5Title:'Modo de aprendizaje de consultor funcional',
aiCard5Desc:'Aprende mientras respondes con ayuda contextual D365',
aiCard5Demo:'Aprendizaje: Contabilidad intercompañía requiere 3 pasos',
aiCard6Title:'Asistente de cuestionario',
aiCard6Desc:'IA sugiere respuestas según industria y proyectos pasados',
aiCard6Demo:'Sugerencia: Para inventario FIFO, use grupo modelo FIFO-STD',
aiCard7Title:'Asistente UAT de IA',
aiCard7Desc:'Genera automáticamente casos de prueba UAT desde análisis Fit/GAP',
aiCard7Demo:'Generados 24 casos de prueba — 18 Fit, 6 GAP',
aiCard8Title:'Asistente de integración IA',
aiCard8Desc:'Mapea Nombre de formulario, Nombre de tabla, Entidad de datos automáticamente',
aiCard8Demo:'Mapeado: FiscalCalendar → FiscalCalendarEntity',
aiCard9Title:'Animación de flujo de proceso',
aiCard9Desc:'Anima el proceso empresarial de extremo a extremo desde respuestas',
aiCard9Demo:'Animando: Procure-to-Pay — Requisición → OC',
aiCard10Title:'Entrenador IA',
aiCard10Desc:'Crea planes de formación basados en roles desde datos de descubrimiento',
aiCard10Demo:'Plan de formación: 4 módulos para Empleado AP — 2.5 horas',
placeholderQuestion:'Ingrese pregunta...',
placeholderBusinessArea:'ej., Libro mayor > Calendarios fiscales',
placeholderNavPath:'ej., Administración de la organización > ...',
placeholderDetailedResponse:'Ingrese respuesta detallada...',
labelChars:'/50',
labelChars100:'/100',
labelChars250:'/250',
labelChars15:'/15',
each15chars:'Cada 15 caracteres máx — Usado para mapeo de integración D365 F&O',
summaryType:'Resumen',
postingTypeOpt:'Contabilización',
approval:'Aprobación',
review:'Revisión',
task:'Tarea',
},
FR: {
appTitle:'Accélérateur de Découverte EP_ERP',
appSubtitle:'Dynamics 365 Finance & Opérations — Module Questionnaire',
legalEntityLabel:'Entité juridique:',
legalEntityValue:'USMF — Contoso Entertainment System USA',
consultantView:'Vue Consultant',
customerView:'Vue Client',
environment:'Environnement: UAT',
tabQuestionnaire:'Questionnaire',
tabPosting:'Profils de résumé et de comptabilisation',
tabWorkflow:'Flux de travail',
tabParameters:'Paramètres',
tabSystemAdmin:'Administration système',
tabAIFeatures:'Fonctionnalités IA (10)',
btnNew:'Nouveau',
btnEdit:'Modifier',
btnDelete:'Supprimer',
btnAddRow:'+ Ajouter une ligne',
btnAddField:'+ Ajouter un champ',
btnNewFastTab:'+ Nouveau FastTab',
btnCopyJson:'Copier JSON',
btnExportD365:'Exporter vers D365',
btnGenerateFRD:'Générer aperçu FRD',
btnExportAllDocs:'Exporter tous les documents',
btnOpenDemo:'Ouvrir la démo',
btnAttachFile:'Joindre un fichier — Tous types autorisés',
gridNo:'N°',
gridQuestion:'Question',
gridType:'Type',
gridFitGap:'Fit/GAP',
gridModule:'Module',
gridRecords:'enregistrements',
gridAllModules:'Tous les modules',
filterAllModules:'Tous les modules (15)',
autoSaveEnabled:'Sauvegarde auto activée — Enregistrement... → Enregistré',
integrationHelp:'Aide intégration',
generalFastTab:'Général — Question N°',
autoNumberNote:'Numérotation auto, non modifiable, incrémente',
labelQuestion:'Question',
labelQuestionType:'Type de question',
labelFitGap:'Fit/GAP — capturer comme Fit/GAP',
labelAnswerText:'Réponse (Texte)',
labelWorkflowDetails:'Détails du flux de travail',
labelAttachmentMandatory:'* pièce jointe obligatoire',
labelRadioOptions:'Options radio — Code et Description',
labelWhyAsk:'Pourquoi nous demandons',
labelBusinessImpact:'Impact métier',
labelBusinessArea:'Domaine métier dans F&O',
labelNavPath:'Chemin de navigation',
labelFormName:'Nom du formulaire',
labelFieldName:'Nom du champ',
labelTableName:'Nom de table',
labelMenuItem:'Élément de menu',
labelDataEntity:'Entité de données',
labelODataEntity:'Entité OData',
labelConfigKey:'Clé de configuration',
labelIntegrationSection:'Section intégration — Interne uniquement (Consultant/Admin)',
labelIntegrationHidden:'Section intégration masquée en Vue Client',
labelAttachment:'Pièce jointe:',
labelAllFileTypes:'Tous types de fichiers par question autorisés',
labelModule:'Module:',
formLabel:'Formulaire: EP_QuestionnaireDécouverte',
tableLabel:'Table: EP_TableDécouverte',
postingWhy:'Pourquoi nous mappons les profils de résumé et de comptabilisation',
postingGridModule:'Module',
postingGridType:'Type',
postingGridCode:'Code',
postingGridMainAccount:'Compte principal',
postingGridDesc:'Description',
postingGridLedger:'Grand livre',
postingSummaryTitle:'Compte de résumé et profils de comptabilisation — TOUS les modules',
postingAccountType:'Type de compte',
postingProfileCode:'Code profil',
postingMainAccount:'Compte principal',
postingDesc:'Description',
postingExplanation:'Explication',
postingLedger:'Grand livre',
postingPostingType:'Type de comptabilisation',
workflowMinEntry:'Entrée minimale pour création de flux de travail D365 F&O',
workflowGridName:'Nom du flux de travail',
workflowGridModule:'Module',
workflowGridType:'Type',
workflowGridApprover:'Approbateur',
workflowCreateTitle:'Flux de travail — Créer avec entrée minimale',
workflowName:'Nom du flux de travail',
workflowModule:'Module',
workflowType:'Type de flux de travail',
workflowApprover:'Approbateur',
workflowCondition:'Condition',
workflowEscalation:'Escalade',
workflowNotification:'Notification',
workflowPreviewTitle:'Aperçu: JSON de configuration du flux de travail',
paramFastTabs:'FastTabs:',
paramLikeD365:'Comme le formulaire Paramètres D365 F&O',
paramParametersFastTabs:'FastTabs Paramètres',
paramFieldName:'Nom du champ',
paramImportance:'Importance / Description',
paramLooksExactly:'Ressemble exactement au formulaire Paramètres D365',
paramNoFields:'Aucun champ — Ajouter un champ pour définir le comportement',
sysCreateCompany:'Créer une société',
sysCompanyName:'Nom de la société',
sysAddress:'Adresse',
sysExecutiveSummary:'Résumé exécutif',
sysCreateRole:'Créer un rôle — Matrice des permissions',
sysFormCapability:'Formulaire / Capacité',
sysEdit:'Modifier',
sysDelete:'Supprimer',
sysView:'Afficher',
sysRoleNamePlaceholder:'Nom du rôle ex. Consultant Finance',
sysCOAManagement:'Gestion COA',
sysUploadCOA:'Charger COA client (Excel)',
sysCreateCOABuilder:'Créer constructeur COA',
sysMainAccount:'Compte principal',
sysDepartment:'Département',
sysCostCenter:'Centre de coût',
sysStructureNote:'Structure: Compte principal - Département - Centre de coût',
sysTrainingAssets:'Actifs de formation — Charger vidéos et captures',
sysDragDrop:'Glisser-déposer vidéos de formation',
sysDragDropNote:'MP4, MOV — Génère automatiquement un parcours fonctionnel',
sysUploadedAssets:'Actifs chargés (3)',
sysHelpsGenerate:'Aide à générer FRD, Cas de test, GAP-FIT',
sysUploadHelp:'Les chargements aident à générer des documents',
aiTitle:'Fonctionnalités IA — 10 fonctionnalités d\'Excel',
aiSubtitle:'Cliquez sur la carte pour afficher la démo',
aiServicesOnline:'Services IA en ligne — Modèle: GPT-4o',
aiDemo:'DEMO',
aiLayerTitle:'Accélérateur de Découverte EP_ERP — Couche IA',
aiLayerDesc:'Toutes les fonctionnalités produisent FRD, analyse GAP-FIT, cas de test depuis une source unique',
legalHelp:'Entité juridique: USMF — Administration de l\'organisation',
bannerCustomerTitle:'Permissions client:',
bannerCustomerText:'Vous pouvez modifier et enregistrer mais pas supprimer. Section intégration masquée par rôle de sécurité.',
actionLabel:'Action:',
readyQuestionnaire:'Prêt — Questionnaire chargé',
toastLangChanged:'Langue changée en',
selectLanguage:'Sélectionner la langue',
searchLanguage:'Rechercher une langue...',
saving:'Enregistrement...',
saved:'Enregistré',
draft:'Brouillon',
statusForm:'Formulaire: EP_Questionnaire | Source: EP_Table',
statusRecords:'Enregistrements:',
statusUser:'Utilisateur: Alex Kim | Rôle:',
statusVersion:'Version: 10.0.39',
statusAllSaved:'Toutes les modifications auto-enregistrées',
statusDraftUpdating:'Mise à jour du brouillon...',
integrationHelpTitle:'Mappage des champs d\'intégration — Aide',
integrationHelpFormName:'Nom du formulaire (15 car.): formulaire D365',
integrationHelpFieldName:'Nom du champ: Mappage EDT',
integrationHelpTableName:'Nom de table: Table de base',
integrationHelpMenuItem:'Élément de menu: Cible de navigation',
integrationHelpDataEntity:'Entité de données: Entité DIXF',
integrationHelpODataEntity:'Entité OData: Pour Power Platform',
integrationHelpConfigKey:'Clé de configuration: Vérification de licence',
integrationHelpVisibleOnly:'Visible UNIQUEMENT pour rôle interne',
attachmentRequired:'Pièce jointe requise pour type flux de travail',
exampleRadio:'Exemple: Code: 01, Description: FIFO',
charLimit:'caractères',
selectRecord:'Sélectionnez un enregistrement à modifier',
fitFit:'Ajustement',
fitGap:'Écart',
fitPartial:'Ajustement partiel',
fitCustom:'Personnalisation',
typeRadio:'Bouton radio',
typeText:'Texte',
typeWorkflow:'Flux de travail',
modGL:'Grand livre général',
modAP:'Comptes fournisseurs',
modAR:'Comptes clients',
modInventory:'Stock',
modProcurement:'Approvisionnement',
modSales:'Ventes et marketing',
modWMS:'Gestion d\'entrepôt',
modProduction:'Contrôle de production',
modFA:'Immobilisations',
modProject:'Gestion de projet',
modHR:'Ressources humaines',
aiCard1Title:'Texte en parole',
aiCard1Desc:'Convertit le questionnaire en audio pour présentation client',
aiCard1Demo:'Lecture: Comment définissez-vous le calendrier fiscal?',
aiCard2Title:'Vidéos fonctionnelles générées par IA',
aiCard2Desc:'Crée automatiquement des vidéos de formation à partir de captures',
aiCard2Demo:'Généré: Configuration du calendrier fiscal GL',
aiCard3Title:'Parcours interactif de formulaires',
aiCard3Desc:'Guide superposé étape par étape sur les formulaires F&O réels',
aiCard3Demo:'Parcours: Administration de l\'organisation',
aiCard4Title:'Générateur d\'écrans IA',
aiCard4Desc:'Génère des maquettes d\'écrans D365 à partir des réponses',
aiCard4Demo:'Écran généré: Journal des paiements fournisseurs',
aiCard5Title:'Mode apprentissage consultant fonctionnel',
aiCard5Desc:'Apprenez en répondant avec aide contextuelle D365',
aiCard5Demo:'Apprentissage: Comptabilité inter-sociétés nécessite 3 étapes',
aiCard6Title:'Assistant questionnaire',
aiCard6Desc:'L\'IA suggère des réponses basées sur l\'industrie et projets passés',
aiCard6Demo:'Suggestion: Pour inventaire FIFO, utiliser groupe de modèles FIFO-STD',
aiCard7Title:'Assistant UAT IA',
aiCard7Desc:'Génère automatiquement des cas de test UAT depuis analyse Fit/GAP',
aiCard7Demo:'24 cas de test générés — 18 Fit, 6 GAP',
aiCard8Title:'Assistant intégration IA',
aiCard8Desc:'Mappe Nom formulaire, Nom table, Entité de données automatiquement',
aiCard8Demo:'Mappé: FiscalCalendar → FiscalCalendarEntity',
aiCard9Title:'Animation de flux de processus',
aiCard9Desc:'Anime le processus métier de bout en bout à partir des réponses',
aiCard9Demo:'Animation: Procure-to-Pay — Demande → BC',
aiCard10Title:'Formateur IA',
aiCard10Desc:'Crée des plans de formation par rôle depuis données de découverte',
aiCard10Demo:'Plan de formation: 4 modules pour Commis AP — 2.5 heures',
placeholderQuestion:'Entrez la question...',
placeholderBusinessArea:'ex., Grand livre > Calendriers fiscaux',
placeholderNavPath:'ex., Administration de l\'organisation > ...',
placeholderDetailedResponse:'Entrez une réponse détaillée...',
labelChars:'/50',
labelChars100:'/100',
labelChars250:'/250',
labelChars15:'/15',
each15chars:'Chaque 15 car. max — Utilisé pour mappage intégration D365 F&O',
summaryType:'Résumé',
postingTypeOpt:'Comptabilisation',
approval:'Approbation',
review:'Examen',
task:'Tâche',
},
DE: {
appTitle:'EP_ERP Discovery Accelerator',
appSubtitle:'Dynamics 365 Finanzen & Betrieb — Fragebogenmodul',
legalEntityLabel:'Juristische Person:',
legalEntityValue:'USMF — Contoso Entertainment System USA',
consultantView:'Berateransicht',
customerView:'Kundenansicht',
environment:'Umgebung: UAT',
tabQuestionnaire:'Fragebogen',
tabPosting:'Sammel- & Buchungsprofile',
tabWorkflow:'Workflow',
tabParameters:'Parameter',
tabSystemAdmin:'Systemadministration',
tabAIFeatures:'KI-Funktionen (10)',
btnNew:'Neu',
btnEdit:'Bearbeiten',
btnDelete:'Löschen',
btnAddRow:'+ Zeile hinzufügen',
btnAddField:'+ Feld hinzufügen',
btnNewFastTab:'+ Neuer FastTab',
btnCopyJson:'JSON kopieren',
btnExportD365:'Nach D365 exportieren',
btnGenerateFRD:'FRD-Vorschau generieren',
btnExportAllDocs:'Alle Dokumente exportieren',
btnOpenDemo:'Demo öffnen',
btnAttachFile:'Datei anhängen — Alle Typen erlaubt',
gridNo:'Nr.',
gridQuestion:'Frage',
gridType:'Typ',
gridFitGap:'Fit/GAP',
gridModule:'Modul',
gridRecords:'Datensätze',
gridAllModules:'Alle Module',
filterAllModules:'Alle Module (15)',
autoSaveEnabled:'Auto-Speichern aktiv — Speichern... → Gespeichert',
integrationHelp:'Integrationshilfe',
generalFastTab:'Allgemein — Frage Nr.',
autoNumberNote:'Automatische Nummerierung, nicht editierbar',
labelQuestion:'Frage',
labelQuestionType:'Fragetyp',
labelFitGap:'Fit/GAP — als Fit/GAP erfassen',
labelAnswerText:'Antwort (Text)',
labelWorkflowDetails:'Workflow-Details',
labelAttachmentMandatory:'* Anhang obligatorisch',
labelRadioOptions:'Radiooptionen — Code & Beschreibung',
labelWhyAsk:'Warum wir fragen',
labelBusinessImpact:'Geschäftsauswirkung',
labelBusinessArea:'Geschäftsbereich in F&O',
labelNavPath:'Navigationspfad',
labelFormName:'Formularname',
labelFieldName:'Feldname',
labelTableName:'Tabellenname',
labelMenuItem:'Menüelement',
labelDataEntity:'Datenentität',
labelODataEntity:'OData-Entität',
labelConfigKey:'Konfigurationsschlüssel',
labelIntegrationSection:'Integrationsabschnitt — Nur intern (Berater/Admin)',
labelIntegrationHidden:'Integrationsabschnitt in Kundenansicht ausgeblendet',
labelAttachment:'Anhang:',
labelAllFileTypes:'Alle Dateitypen pro Frage erlaubt',
labelModule:'Modul:',
formLabel:'Formular: EP_Entdeckungsfragebogen',
tableLabel:'Tabelle: EP_Entdeckungstabelle',
postingWhy:'Warum wir Sammel- & Buchungsprofile zuordnen',
postingGridModule:'Modul',
postingGridType:'Typ',
postingGridCode:'Code',
postingGridMainAccount:'Hauptkonto',
postingGridDesc:'Beschreibung',
postingGridLedger:'Ledger',
postingSummaryTitle:'Sammelkonto & Buchungsprofile — ALLE Module',
postingAccountType:'Kontotyp',
postingProfileCode:'Profilcode',
postingMainAccount:'Hauptkonto',
postingDesc:'Beschreibung',
postingExplanation:'Erklärung',
postingLedger:'Ledger',
postingPostingType:'Buchungstyp',
workflowMinEntry:'Mindesteingabe für D365 F&O Workflow-Erstellung',
workflowGridName:'Workflow-Name',
workflowGridModule:'Modul',
workflowGridType:'Typ',
workflowGridApprover:'Genehmiger',
workflowCreateTitle:'Workflow — Mit Mindesteingabe erstellen',
workflowName:'Workflow-Name',
workflowModule:'Modul',
workflowType:'Workflow-Typ',
workflowApprover:'Genehmiger',
workflowCondition:'Bedingung',
workflowEscalation:'Eskalation',
workflowNotification:'Benachrichtigung',
workflowPreviewTitle:'Vorschau: Workflow-Konfig JSON',
paramFastTabs:'FastTabs:',
paramLikeD365:'Wie D365 F&O Parameterformular',
paramParametersFastTabs:'Parameter FastTabs',
paramFieldName:'Feldname',
paramImportance:'Wichtigkeit / Beschreibung',
paramLooksExactly:'Sieht genau wie D365 Parameterformular aus',
paramNoFields:'Keine Felder — Feld hinzufügen um Verhalten zu definieren',
sysCreateCompany:'Firma erstellen',
sysCompanyName:'Firmenname',
sysAddress:'Adresse',
sysExecutiveSummary:'Management-Zusammenfassung',
sysCreateRole:'Rolle erstellen — Berechtigungsmatrix',
sysFormCapability:'Formular / Fähigkeit',
sysEdit:'Bearbeiten',
sysDelete:'Löschen',
sysView:'Anzeigen',
sysRoleNamePlaceholder:'Rollenname z.B. Finanzberater',
sysCOAManagement:'Kontenplan-Management',
sysUploadCOA:'Kunden-Kontenplan hochladen (Excel)',
sysCreateCOABuilder:'Kontenplan-Builder erstellen',
sysMainAccount:'Hauptkonto',
sysDepartment:'Abteilung',
sysCostCenter:'Kostenstelle',
sysStructureNote:'Struktur: Hauptkonto - Abteilung - Kostenstelle',
sysTrainingAssets:'Schulungsressourcen — Videos & Screenshots hochladen',
sysDragDrop:'Drag-Drop Schulungsvideos',
sysDragDropNote:'MP4, MOV — Generiert automatisch funktionalen Walkthrough',
sysUploadedAssets:'Hochgeladene Ressourcen (3)',
sysHelpsGenerate:'Hilft FRD, Testfälle, GAP-FIT zu generieren',
sysUploadHelp:'Uploads helfen Dokumente zu generieren',
aiTitle:'KI-Funktionen — 10 Funktionen aus Excel',
aiSubtitle:'Klicken Sie auf Karte um Demo zu zeigen',
aiServicesOnline:'KI-Dienste online — Modell: GPT-4o',
aiDemo:'DEMO',
aiLayerTitle:'EP_ERP Discovery Accelerator — KI-Ebene',
aiLayerDesc:'Alle Funktionen erzeugen FRD, GAP-FIT-Analyse, Testfälle aus einer Quelle',
legalHelp:'Juristische Person: USMF — Organisationsverwaltung',
bannerCustomerTitle:'Kundenberechtigungen:',
bannerCustomerText:'Sie können bearbeiten und speichern, aber nicht löschen. Integrationsabschnitt per Sicherheitsrolle ausgeblendet.',
actionLabel:'Aktion:',
readyQuestionnaire:'Bereit — Fragebogen geladen',
toastLangChanged:'Sprache geändert zu',
selectLanguage:'Sprache auswählen',
searchLanguage:'Sprache suchen...',
saving:'Speichern...',
saved:'Gespeichert',
draft:'Entwurf',
statusForm:'Formular: EP_Fragebogen | Datenquelle: EP_Tabelle',
statusRecords:'Datensätze:',
statusUser:'Benutzer: Alex Kim | Rolle:',
statusVersion:'Version: 10.0.39',
statusAllSaved:'Alle Änderungen automatisch gespeichert',
statusDraftUpdating:'Entwurf wird aktualisiert...',
integrationHelpTitle:'Integrationsfeld-Mapping — Hilfe',
integrationHelpFormName:'Formularname (15 Zeichen): D365 Formular',
integrationHelpFieldName:'Feldname: EDT-Mapping',
integrationHelpTableName:'Tabellenname: Basistabelle',
integrationHelpMenuItem:'Menüelement: Navigationsziel',
integrationHelpDataEntity:'Datenentität: DIXF-Entität',
integrationHelpODataEntity:'OData-Entität: Für Power Platform',
integrationHelpConfigKey:'Konfigurationsschlüssel: Lizenzprüfung',
integrationHelpVisibleOnly:'Nur für interne Rolle sichtbar',
attachmentRequired:'Anhang für Workflow-Typ erforderlich',
exampleRadio:'Beispiel: Code: 01, Beschreibung: FIFO',
charLimit:'Zeichen',
selectRecord:'Datensatz zum Bearbeiten auswählen',
fitFit:'Fit',
fitGap:'GAP',
fitPartial:'Teil-Fit',
fitCustom:'Anpassung',
typeRadio:'RadioButton',
typeText:'Text',
typeWorkflow:'Workflow',
modGL:'Hauptbuch',
modAP:'Kreditorenbuchhaltung',
modAR:'Debitorenbuchhaltung',
modInventory:'Bestand',
modProcurement:'Beschaffung',
modSales:'Vertrieb und Marketing',
modWMS:'Lagerverwaltung',
modProduction:'Produktionssteuerung',
modFA:'Anlagevermögen',
modProject:'Projektverwaltung',
modHR:'Personalwesen',
aiCard1Title:'Text zu Sprache',
aiCard1Desc:'Wandelt Fragebogen in Audio für Kunden-Walkthrough um',
aiCard1Demo:'Wiedergabe: Wie definieren Sie den Finanzkalender?',
aiCard2Title:'KI-generierte Funktionsvideos',
aiCard2Desc:'Erstellt automatisch Schulungsvideos aus Screenshots',
aiCard2Demo:'Generiert: GL Finanzkalender-Setup',
aiCard3Title:'Interaktiver Formular-Walkthrough',
aiCard3Desc:'Schritt-für-Schritt Overlay-Anleitung auf echten F&O-Formularen',
aiCard3Demo:'Walkthrough: Organisationsverwaltung',
aiCard4Title:'KI-Bildschirmgenerator',
aiCard4Desc:'Generiert D365 Bildschirm-Mockups aus Antworten',
aiCard4Demo:'Generierter Bildschirm: Kreditoren Zahlungsjournal',
aiCard5Title:'Funktionaler Berater Lernmodus',
aiCard5Desc:'Lernen beim Beantworten mit kontextbezogener D365 Hilfe',
aiCard5Demo:'Lernen: Intercompany-Buchhaltung erfordert 3 Schritte',
aiCard6Title:'Fragebogen-Assistent',
aiCard6Desc:'KI schlägt Antworten basierend auf Branche & Projekten vor',
aiCard6Demo:'Vorschlag: Für FIFO-Bestand Modellgruppe FIFO-STD verwenden',
aiCard7Title:'KI UAT-Assistent',
aiCard7Desc:'Generiert automatisch UAT-Testfälle aus Fit/GAP-Analyse',
aiCard7Demo:'24 Testfälle generiert — 18 Fit, 6 GAP',
aiCard8Title:'KI Integrationsassistent',
aiCard8Desc:'Mappt Formularname, Tabellenname, Datenentität automatisch',
aiCard8Demo:'Gemapped: FiscalCalendar → FiscalCalendarEntity',
aiCard9Title:'Prozessfluss-Animation',
aiCard9Desc:'Animiert End-to-End Geschäftsprozess aus Antworten',
aiCard9Demo:'Animiert: Procure-to-Pay — Anforderung → Bestellung',
aiCard10Title:'KI Trainer',
aiCard10Desc:'Erstellt rollenbasierte Schulungspläne aus Discovery-Daten',
aiCard10Demo:'Schulungsplan: 4 Module für AP-Sachbearbeiter — 2.5 Stunden',
placeholderQuestion:'Frage eingeben...',
placeholderBusinessArea:'z.B. Hauptbuch > Finanzkalender',
placeholderNavPath:'z.B. Organisationsverwaltung > ...',
placeholderDetailedResponse:'Detaillierte Antwort eingeben...',
labelChars:'/50',
labelChars100:'/100',
labelChars250:'/250',
labelChars15:'/15',
each15chars:'Je 15 Zeichen max — Für D365 F&O Integrationsmapping verwendet',
summaryType:'Sammelkonto',
postingTypeOpt:'Buchung',
approval:'Genehmigung',
review:'Prüfung',
task:'Aufgabe',
},
AR: {
appTitle:'مسرع اكتشاف EP_ERP',
appSubtitle:'Dynamics 365 المالية والعمليات — وحدة الاستبيان',
legalEntityLabel:'الكيان القانوني:',
legalEntityValue:'USMF — نظام كونتوسو للترفيه USA',
consultantView:'عرض الاستشاري',
customerView:'عرض العميل',
environment:'البيئة: UAT',
tabQuestionnaire:'الاستبيان',
tabPosting:'ملخص وملفات الترحيل',
tabWorkflow:'سير العمل',
tabParameters:'المعلمات',
tabSystemAdmin:'إدارة النظام',
tabAIFeatures:'ميزات الذكاء الاصطناعي (10)',
btnNew:'جديد',
btnEdit:'تعديل',
btnDelete:'حذف',
btnAddRow:'+ إضافة صف',
btnAddField:'+ إضافة حقل',
btnNewFastTab:'+ FastTab جديد',
btnCopyJson:'نسخ JSON',
btnExportD365:'تصدير إلى D365',
btnGenerateFRD:'إنشاء معاينة FRD',
btnExportAllDocs:'تصدير جميع المستندات',
btnOpenDemo:'فتح العرض',
btnAttachFile:'إرفاق ملف — جميع الأنواع مسموحة',
gridNo:'رقم',
gridQuestion:'سؤال',
gridType:'النوع',
gridFitGap:'Fit/GAP',
gridModule:'الوحدة',
gridRecords:'سجلات',
gridAllModules:'جميع الوحدات',
filterAllModules:'جميع الوحدات (15)',
autoSaveEnabled:'الحفظ التلقائي مفعل — جار الحفظ... → تم الحفظ',
integrationHelp:'مساعدة التكامل',
generalFastTab:'عام — رقم السؤال',
autoNumberNote:'ترقيم تلقائي، غير قابل للتحرير',
labelQuestion:'سؤال',
labelQuestionType:'نوع السؤال',
labelFitGap:'Fit/GAP — التقاط كـ Fit/GAP',
labelAnswerText:'الإجابة (نص)',
labelWorkflowDetails:'تفاصيل سير العمل',
labelAttachmentMandatory:'* المرفق إلزامي',
labelRadioOptions:'خيارات الراديو — الرمز والوصف',
labelWhyAsk:'لماذا نسأل',
labelBusinessImpact:'التأثير التجاري',
labelBusinessArea:'مجال العمل في F&O',
labelNavPath:'مسار التنقل',
labelFormName:'اسم النموذج',
labelFieldName:'اسم الحقل',
labelTableName:'اسم الجدول',
labelMenuItem:'عنصر القائمة',
labelDataEntity:'كيان البيانات',
labelODataEntity:'كيان OData',
labelConfigKey:'مفتاح التكوين',
labelIntegrationSection:'قسم التكامل — داخلي فقط (استشاري/مسؤول)',
labelIntegrationHidden:'قسم التكامل مخفي في عرض العميل',
labelAttachment:'المرفق:',
labelAllFileTypes:'جميع أنواع الملفات لكل سؤال مسموحة',
labelModule:'الوحدة:',
formLabel:'النموذج: EP_استبيان الاكتشاف',
tableLabel:'الجدول: EP_جدول الاكتشاف',
postingWhy:'لماذا نربط ملخص وملفات الترحيل',
postingGridModule:'الوحدة',
postingGridType:'النوع',
postingGridCode:'الرمز',
postingGridMainAccount:'الحساب الرئيسي',
postingGridDesc:'الوصف',
postingGridLedger:'دفتر الأستاذ',
postingSummaryTitle:'حساب الملخص وملفات الترحيل — جميع الوحدات',
postingAccountType:'نوع الحساب',
postingProfileCode:'رمز الملف',
postingMainAccount:'الحساب الرئيسي',
postingDesc:'الوصف',
postingExplanation:'الشرح',
postingLedger:'دفتر الأستاذ',
postingPostingType:'نوع الترحيل',
workflowMinEntry:'الحد الأدنى للإدخال لإنشاء سير عمل D365 F&O',
workflowGridName:'اسم سير العمل',
workflowGridModule:'الوحدة',
workflowGridType:'النوع',
workflowGridApprover:'المعتمد',
workflowCreateTitle:'سير العمل — إنشاء بحد أدنى من الإدخال',
workflowName:'اسم سير العمل',
workflowModule:'الوحدة',
workflowType:'نوع سير العمل',
workflowApprover:'المعتمد',
workflowCondition:'الشرط',
workflowEscalation:'التصعيد',
workflowNotification:'الإشعار',
workflowPreviewTitle:'معاينة: JSON تكوين سير العمل',
paramFastTabs:'FastTabs:',
paramLikeD365:'مثل نموذج معلمات D365 F&O',
paramParametersFastTabs:'FastTabs المعلمات',
paramFieldName:'اسم الحقل',
paramImportance:'الأهمية / الوصف',
paramLooksExactly:'يبدو تماما مثل نموذج معلمات D365',
paramNoFields:'لا توجد حقول — أضف حقل لتحديد السلوك',
sysCreateCompany:'إنشاء شركة',
sysCompanyName:'اسم الشركة',
sysAddress:'العنوان',
sysExecutiveSummary:'الملخص التنفيذي',
sysCreateRole:'إنشاء دور — مصفوفة الصلاحيات',
sysFormCapability:'النموذج / القدرة',
sysEdit:'تعديل',
sysDelete:'حذف',
sysView:'عرض',
sysRoleNamePlaceholder:'اسم الدور مثال مستشار مالي',
sysCOAManagement:'إدارة COA',
sysUploadCOA:'تحميل COA العميل (Excel)',
sysCreateCOABuilder:'إنشاء منشئ COA',
sysMainAccount:'الحساب الرئيسي',
sysDepartment:'القسم',
sysCostCenter:'مركز التكلفة',
sysStructureNote:'الهيكل: الحساب الرئيسي - القسم - مركز التكلفة',
sysTrainingAssets:'أصول التدريب — تحميل مقاطع الفيديو ولقطات الشاشة',
sysDragDrop:'سحب وإفلات فيديوهات التدريب',
sysDragDropNote:'MP4, MOV — ينشئ جولة وظيفية تلقائيا',
sysUploadedAssets:'الأصول المحملة (3)',
sysHelpsGenerate:'يساعد في إنشاء FRD، حالات الاختبار، GAP-FIT',
sysUploadHelp:'التحميلات تساعد في إنشاء المستندات',
aiTitle:'ميزات الذكاء الاصطناعي — 10 ميزات من Excel',
aiSubtitle:'انقر على البطاقة لعرض العرض التوضيحي',
aiServicesOnline:'خدمات الذكاء الاصطناعي متصلة — النموذج: GPT-4o',
aiDemo:'عرض',
aiLayerTitle:'مسرع اكتشاف EP_ERP — طبقة الذكاء الاصطناعي',
aiLayerDesc:'جميع الميزات تنتج FRD، تحليل GAP-FIT، حالات اختبار من مصدر واحد',
legalHelp:'الكيان القانوني: USMF — إدارة المنظمة',
bannerCustomerTitle:'صلاحيات العميل:',
bannerCustomerText:'يمكنك التعديل والحفظ ولكن لا يمكنك الحذف. قسم التكامل مخفي حسب دور الأمان.',
actionLabel:'الإجراء:',
readyQuestionnaire:'جاهز — تم تحميل الاستبيان',
toastLangChanged:'تم تغيير اللغة إلى',
selectLanguage:'اختر اللغة',
searchLanguage:'ابحث عن لغة...',
saving:'جار الحفظ...',
saved:'تم الحفظ',
draft:'مسودة',
statusForm:'النموذج: EP_استبيان | المصدر: EP_جدول',
statusRecords:'السجلات:',
statusUser:'المستخدم: أليكس كيم | الدور:',
statusVersion:'الإصدار: 10.0.39',
statusAllSaved:'تم حفظ جميع التغييرات تلقائيا',
statusDraftUpdating:'جار تحديث المسودة...',
integrationHelpTitle:'تخطيط حقول التكامل — مساعدة',
integrationHelpFormName:'اسم النموذج (15 حرفا): نموذج D365',
integrationHelpFieldName:'اسم الحقل: تخطيط EDT',
integrationHelpTableName:'اسم الجدول: الجدول الأساسي',
integrationHelpMenuItem:'عنصر القائمة: هدف التنقل',
integrationHelpDataEntity:'كيان البيانات: كيان DIXF',
integrationHelpODataEntity:'كيان OData: لـ Power Platform',
integrationHelpConfigKey:'مفتاح التكوين: فحص الترخيص',
integrationHelpVisibleOnly:'مرئي فقط للدور الداخلي',
attachmentRequired:'المرفق مطلوب لنوع سير العمل',
exampleRadio:'مثال: الرمز: 01، الوصف: FIFO',
charLimit:'حرف',
selectRecord:'حدد سجلا للتحرير',
fitFit:'ملائم',
fitGap:'فجوة',
fitPartial:'ملائم جزئيا',
fitCustom:'تخصيص',
typeRadio:'زر اختيار',
typeText:'نص',
typeWorkflow:'سير العمل',
modGL:'دفتر الأستاذ العام',
modAP:'حسابات الدفع',
modAR:'حسابات القبض',
modInventory:'المخزون',
modProcurement:'المشتريات',
modSales:'المبيعات والتسويق',
modWMS:'إدارة المستودعات',
modProduction:'التحكم في الإنتاج',
modFA:'الأصول الثابتة',
modProject:'إدارة المشاريع',
modHR:'الموارد البشرية',
aiCard1Title:'تحويل النص إلى كلام',
aiCard1Desc:'يحول الاستبيان إلى صوت لجولة العميل',
aiCard1Demo:'تشغيل: كيف تحدد التقويم المالي؟',
aiCard2Title:'فيديوهات وظيفية مولدة بالذكاء الاصطناعي',
aiCard2Desc:'ينشئ تلقائيا فيديوهات تدريبية من لقطات الشاشة',
aiCard2Demo:'تم إنشاؤه: إعداد التقويم المالي GL',
aiCard3Title:'جولة تفاعلية للنماذج',
aiCard3Desc:'دليل تراكبي خطوة بخطوة على نماذج F&O الفعلية',
aiCard3Demo:'جولة: إدارة المنظمة',
aiCard4Title:'مولد شاشات الذكاء الاصطناعي',
aiCard4Desc:'ينشئ نماذج شاشات D365 من الإجابات',
aiCard4Demo:'شاشة منشأة: يومية مدفوعات الموردين',
aiCard5Title:'وضع تعلم المستشار الوظيفي',
aiCard5Desc:'تعلم أثناء الإجابة بمساعدة D365 السياقية',
aiCard5Demo:'تعلم: المحاسبة بين الشركات تتطلب 3 خطوات',
aiCard6Title:'مساعد الاستبيان',
aiCard6Desc:'يقترح الذكاء الاصطناعي إجابات حسب الصناعة',
aiCard6Demo:'اقتراح: لمخزون FIFO، استخدم مجموعة نماذج FIFO-STD',
aiCard7Title:'مساعد UAT بالذكاء الاصطناعي',
aiCard7Desc:'ينشئ تلقائيا حالات اختبار UAT من تحليل Fit/GAP',
aiCard7Demo:'تم إنشاء 24 حالة اختبار — 18 ملائم، 6 فجوة',
aiCard8Title:'مساعد التكامل بالذكاء الاصطناعي',
aiCard8Desc:'يربط اسم النموذج، اسم الجدول، كيان البيانات تلقائيا',
aiCard8Demo:'تم الربط: FiscalCalendar → FiscalCalendarEntity',
aiCard9Title:'رسوم متحركة لتدفق العملية',
aiCard9Desc:'يحرك عملية الأعمال من البداية للنهاية من الإجابات',
aiCard9Demo:'تحريك: Procure-to-Pay — طلب → أمر شراء',
aiCard10Title:'مدرب الذكاء الاصطناعي',
aiCard10Desc:'ينشئ خطط تدريب قائمة على الأدوار من بيانات الاكتشاف',
aiCard10Demo:'خطة تدريب: 4 وحدات لكاتب AP — 2.5 ساعة',
placeholderQuestion:'أدخل السؤال...',
placeholderBusinessArea:'مثال، دفتر الأستاذ العام > التقويمات المالية',
placeholderNavPath:'مثال، إدارة المنظمة > ...',
placeholderDetailedResponse:'أدخل استجابة مفصلة...',
labelChars:'/50',
labelChars100:'/100',
labelChars250:'/250',
labelChars15:'/15',
each15chars:'كل 15 حرفا كحد أقصى — يستخدم لتخطيط تكامل D365 F&O',
summaryType:'ملخص',
postingTypeOpt:'ترحيل',
approval:'موافقة',
review:'مراجعة',
task:'مهمة',
},
JA: {
appTitle:'EP_ERP ディスカバリー アクセラレータ',
appSubtitle:'Dynamics 365 財務・業務 — アンケート モジュール',
legalEntityLabel:'法人:',
legalEntityValue:'USMF — Contoso エンターテインメント システム USA',
consultantView:'コンサルタント表示',
customerView:'顧客表示',
environment:'環境: UAT',
tabQuestionnaire:'アンケート',
tabPosting:'サマリーと転記プロファイル',
tabWorkflow:'ワークフロー',
tabParameters:'パラメータ',
tabSystemAdmin:'システム管理',
tabAIFeatures:'AI 機能 (10)',
btnNew:'新規',
btnEdit:'編集',
btnDelete:'削除',
btnAddRow:'+ 行を追加',
btnAddField:'+ フィールドを追加',
btnNewFastTab:'+ 新しい FastTab',
btnCopyJson:'JSON をコピー',
btnExportD365:'D365 にエクスポート',
btnGenerateFRD:'FRD プレビューを生成',
btnExportAllDocs:'すべてのドキュメントをエクスポート',
btnOpenDemo:'デモを開く',
btnAttachFile:'ファイルを添付 — すべてのタイプ許可',
gridNo:'No.',
gridQuestion:'質問',
gridType:'タイプ',
gridFitGap:'Fit/GAP',
gridModule:'モジュール',
gridRecords:'レコード',
gridAllModules:'すべてのモジュール',
filterAllModules:'すべてのモジュール (15)',
autoSaveEnabled:'自動保存有効 — 保存中... → 保存済み',
integrationHelp:'統合ヘルプ',
generalFastTab:'一般 — 質問 No.',
autoNumberNote:'自動採番、編集不可、インクリメント',
labelQuestion:'質問',
labelQuestionType:'質問タイプ',
labelFitGap:'Fit/GAP — Fit/GAP として取得',
labelAnswerText:'回答 (テキスト)',
labelWorkflowDetails:'ワークフロー詳細',
labelAttachmentMandatory:'* 添付ファイル必須',
labelRadioOptions:'ラジオオプション — コードと説明',
labelWhyAsk:'なぜ尋ねるのか',
labelBusinessImpact:'ビジネス影響',
labelBusinessArea:'F&O のビジネス領域',
labelNavPath:'ナビゲーションパス',
labelFormName:'フォーム名',
labelFieldName:'フィールド名',
labelTableName:'テーブル名',
labelMenuItem:'メニュー項目',
labelDataEntity:'データエンティティ',
labelODataEntity:'OData エンティティ',
labelConfigKey:'構成キー',
labelIntegrationSection:'統合セクション — 内部のみ (コンサル/管理者)',
labelIntegrationHidden:'顧客表示では統合セクションは非表示',
labelAttachment:'添付ファイル:',
labelAllFileTypes:'質問ごとにすべてのファイルタイプ許可',
labelModule:'モジュール:',
formLabel:'フォーム: EP_ディスカバリーアンケート',
tableLabel:'テーブル: EP_ディスカバリーテーブル',
postingWhy:'サマリーと転記プロファイルをマッピングする理由',
postingGridModule:'モジュール',
postingGridType:'タイプ',
postingGridCode:'コード',
postingGridMainAccount:'主勘定',
postingGridDesc:'説明',
postingGridLedger:'元帳',
postingSummaryTitle:'サマリー勘定と転記プロファイル — すべてのモジュール',
postingAccountType:'勘定タイプ',
postingProfileCode:'プロファイルコード',
postingMainAccount:'主勘定',
postingDesc:'説明',
postingExplanation:'説明',
postingLedger:'元帳',
postingPostingType:'転記タイプ',
workflowMinEntry:'D365 F&O ワークフロー作成の最小入力',
workflowGridName:'ワークフロー名',
workflowGridModule:'モジュール',
workflowGridType:'タイプ',
workflowGridApprover:'承認者',
workflowCreateTitle:'ワークフロー — 最小入力で作成',
workflowName:'ワークフロー名',
workflowModule:'モジュール',
workflowType:'ワークフロータイプ',
workflowApprover:'承認者',
workflowCondition:'条件',
workflowEscalation:'エスカレーション',
workflowNotification:'通知',
workflowPreviewTitle:'プレビュー: ワークフロー構成 JSON',
paramFastTabs:'FastTabs:',
paramLikeD365:'D365 F&O パラメータフォームのように',
paramParametersFastTabs:'パラメータ FastTabs',
paramFieldName:'フィールド名',
paramImportance:'重要度 / 説明',
paramLooksExactly:'D365 パラメータフォームとまったく同じように見える',
paramNoFields:'フィールドなし — 動作を定義するにはフィールドを追加',
sysCreateCompany:'会社を作成',
sysCompanyName:'会社名',
sysAddress:'住所',
sysExecutiveSummary:'エグゼクティブサマリー',
sysCreateRole:'ロールを作成 — 権限マトリックス',
sysFormCapability:'フォーム / 機能',
sysEdit:'編集',
sysDelete:'削除',
sysView:'表示',
sysRoleNamePlaceholder:'ロール名 例: 財務コンサルタント',
sysCOAManagement:'COA 管理',
sysUploadCOA:'顧客 COA をアップロード (Excel)',
sysCreateCOABuilder:'COA ビルダーを作成',
sysMainAccount:'主勘定',
sysDepartment:'部門',
sysCostCenter:'コストセンター',
sysStructureNote:'構造: 主勘定 - 部門 - コストセンター',
sysTrainingAssets:'トレーニング資産 — ビデオとスクリーンショットをアップロード',
sysDragDrop:'ドラッグ＆ドロップ トレーニングビデオ',
sysDragDropNote:'MP4, MOV — 機能的なウォークスルーを自動生成',
sysUploadedAssets:'アップロードされた資産 (3)',
sysHelpsGenerate:'FRD、テストケース、GAP-FIT の生成を支援',
sysUploadHelp:'アップロードはドキュメント生成に役立ちます',
aiTitle:'AI 機能 — Excel からの 10 機能',
aiSubtitle:'カードをクリックしてデモを表示',
aiServicesOnline:'AI サービス オンライン — モデル: GPT-4o',
aiDemo:'デモ',
aiLayerTitle:'EP_ERP ディスカバリー アクセラレータ — AI レイヤー',
aiLayerDesc:'すべての機能が単一ソースから FRD、GAP-FIT 分析、テストケースを生成',
legalHelp:'法人: USMF — 組織管理',
bannerCustomerTitle:'顧客権限:',
bannerCustomerText:'編集と保存はできますが、レコードを削除できません。統合セクションはセキュリティロールにより非表示。',
actionLabel:'アクション:',
readyQuestionnaire:'準備完了 — アンケート読み込み済み',
toastLangChanged:'言語が変更されました',
selectLanguage:'言語を選択',
searchLanguage:'言語を検索...',
saving:'保存中...',
saved:'保存済み',
draft:'下書き',
statusForm:'フォーム: EP_アンケート | データソース: EP_テーブル',
statusRecords:'レコード:',
statusUser:'ユーザー: Alex Kim | ロール:',
statusVersion:'バージョン: 10.0.39',
statusAllSaved:'すべての変更が自動保存されました',
statusDraftUpdating:'下書きを更新中...',
integrationHelpTitle:'統合フィールドマッピング — ヘルプ',
integrationHelpFormName:'フォーム名 (15文字): D365 フォーム',
integrationHelpFieldName:'フィールド名: EDT マッピング',
integrationHelpTableName:'テーブル名: ベーステーブル',
integrationHelpMenuItem:'メニュー項目: ナビゲーションターゲット',
integrationHelpDataEntity:'データエンティティ: DIXF エンティティ',
integrationHelpODataEntity:'OData エンティティ: Power Platform 用',
integrationHelpConfigKey:'構成キー: ライセンスチェック',
integrationHelpVisibleOnly:'内部ロールのみに表示',
attachmentRequired:'ワークフロータイプには添付ファイルが必要',
exampleRadio:'例: コード: 01, 説明: FIFO',
charLimit:'文字',
selectRecord:'編集するレコードを選択',
fitFit:'Fit',
fitGap:'GAP',
fitPartial:'部分 Fit',
fitCustom:'カスタマイズ',
typeRadio:'ラジオボタン',
typeText:'テキスト',
typeWorkflow:'ワークフロー',
modGL:'総勘定元帳',
modAP:'買掛金',
modAR:'売掛金',
modInventory:'在庫',
modProcurement:'調達',
modSales:'販売とマーケティング',
modWMS:'倉庫管理',
modProduction:'生産管理',
modFA:'固定資産',
modProject:'プロジェクト管理',
modHR:'人事',
aiCard1Title:'テキスト読み上げ',
aiCard1Desc:'顧客ウォークスルー用にアンケートを音声に変換',
aiCard1Demo:'再生中: 会計カレンダーをどのように定義しますか？',
aiCard2Title:'AI 生成 機能ビデオ',
aiCard2Desc:'スクリーンショットからトレーニングビデオを自動作成',
aiCard2Demo:'生成: GL 会計カレンダー設定',
aiCard3Title:'インタラクティブ フォーム ウォークスルー',
aiCard3Desc:'実際の F&O フォームでのステップバイステップ オーバーレイガイド',
aiCard3Demo:'ウォークスルー: 組織管理',
aiCard4Title:'AI 画面ジェネレータ',
aiCard4Desc:'回答から D365 画面モックアップを生成',
aiCard4Demo:'生成された画面: 仕入先支払仕訳帳',
aiCard5Title:'機能コンサルタント学習モード',
aiCard5Desc:'文脈的な D365 ヘルプで回答しながら学習',
aiCard5Demo:'学習: 会社間会計には 3 ステップが必要',
aiCard6Title:'アンケート アシスタント',
aiCard6Desc:'業界と過去のプロジェクトに基づいて AI が回答を提案',
aiCard6Demo:'提案: FIFO 在庫にはモデルグループ FIFO-STD を使用',
aiCard7Title:'AI UAT アシスタント',
aiCard7Desc:'Fit/GAP 分析から UAT テストケースを自動生成',
aiCard7Demo:'24 テストケース生成 — 18 Fit、6 GAP',
aiCard8Title:'AI 統合アシスタント',
aiCard8Desc:'フォーム名、テーブル名、データエンティティを自動マッピング',
aiCard8Demo:'マッピング: FiscalCalendar → FiscalCalendarEntity',
aiCard9Title:'プロセスフロー アニメーション',
aiCard9Desc:'回答からエンドツーエンドのビジネスプロセスをアニメーション化',
aiCard9Demo:'アニメーション: Procure-to-Pay — 要求 → 発注書',
aiCard10Title:'AI トレーナー',
aiCard10Desc:'発見データからロールベースのトレーニング計画を作成',
aiCard10Demo:'トレーニング計画: AP 担当者向け 4 モジュール — 2.5 時間',
placeholderQuestion:'質問を入力...',
placeholderBusinessArea:'例: 総勘定元帳 > 会計カレンダー',
placeholderNavPath:'例: 組織管理 > ...',
placeholderDetailedResponse:'詳細な回答を入力...',
labelChars:'/50',
labelChars100:'/100',
labelChars250:'/250',
labelChars15:'/15',
each15chars:'各 15 文字最大 — D365 F&O 統合マッピングに使用',
summaryType:'サマリー',
postingTypeOpt:'転記',
approval:'承認',
review:'レビュー',
task:'タスク',
},
};

// Mock data
const MODULES: ModuleName[] = ['General Ledger','Accounts Payable','Accounts Receivable','Inventory','Procurement','Sales and marketing','Warehouse management','Production control','Fixed Assets','Project management','Human resources'];

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
  { id:'p3', module:'Inventory', accType:'Posting', code:'INV-POST-002', mainAccount:'140100', desc:'Inventory Issue', explanation:'Posting for inventory transactions', ledger:'USMF', postingType:'Inventory' },
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

export default function App() {
  const [activeTab, setActiveTab] = useState<'Questionnaire'|'Posting'|'Workflow'|'Parameters'|'System Admin'|'AI Features'>('Questionnaire');
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

  // Language states
  const [currentLang, setCurrentLang] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem('ep_lang') as Lang | null;
      if (saved && LANGUAGES.some(l=>l.code===saved)) return saved;
    } catch {}
    return 'EN';
  });
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const [toast, setToast] = useState<{msg:string, visible:boolean}>({msg:'', visible:false});
  const [isTransitioning, setIsTransitioning] = useState(false);

  const t = useMemo(() => {
    return (key:string): string => {
      const dict = translations[currentLang] || translations.EN;
      return dict[key] || translations.EN[key] || key;
    };
  }, [currentLang]);

  const currentLangMeta = LANGUAGES.find(l=>l.code===currentLang) || LANGUAGES[0];

  const filteredLangs = LANGUAGES.filter(l => 
    l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.native.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.code.toLowerCase().includes(langSearch.toLowerCase())
  );

  // Auto-save simulation
  useEffect(() => {
    setSavingState(t('saving') as any);
    const tm = setTimeout(() => setSavingState(t('saved') as any), 650);
    return () => clearTimeout(tm);
  }, [questions, postings, workflows, paramTabs, t]);

  // Persist language + RTL + toast
  useEffect(() => {
    try { localStorage.setItem('ep_lang', currentLang); } catch {}
    const dir = currentLang === 'AR' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = currentLang.toLowerCase();
  }, [currentLang]);

  const handleLanguageChange = (lang: Lang) => {
    if (lang === currentLang) { setShowLangDropdown(false); return; }
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentLang(lang);
      const meta = LANGUAGES.find(l=>l.code===lang);
      const msg = `${t('toastLangChanged')} ${meta?.name} (${meta?.native})`;
      setToast({msg, visible:true});
      setShowLangDropdown(false);
      setLangSearch('');
      setLastAction(`${t('toastLangChanged')} ${meta?.name} — ${new Date().toLocaleTimeString()}`);
      setTimeout(()=> setIsTransitioning(false), 150);
      setTimeout(()=> setToast({msg:'', visible:false}), 3000);
    }, 180);
  };

  const selectedQuestion = questions.find(q => q.id === selectedQId);
  const filteredQuestions = moduleFilter === 'All' ? questions : questions.filter(q => q.module === moduleFilter);
  const selectedPosting = postings.find(p => p.id === selectedPostId);
  const selectedWorkflow = workflows.find(w => w.id === selectedWfId);
  const selectedParam = paramTabs.find(p => p.id === selectedParamId);

  const translateModule = (m: ModuleName) => t(moduleKeyMap[m] || m);
  const translateFitGap = (fg: FitGap) => {
    const map: Record<string,string> = {'Fit':'fitFit','GAP':'fitGap','Partial Fit':'fitPartial','Customization':'fitCustom'};
    return t(map[fg]||fg);
  };
  const translateQType = (qt: QType) => {
    const map: Record<string,string> = {'RadioButton':'typeRadio','Text':'typeText','Workflow':'typeWorkflow'};
    return t(map[qt]||qt);
  };

  const handleRoleChange = (newRole: 'Consultant' | 'Customer') => {
    setRole(newRole);
    setInteractionTick(tk=>tk+1);
    setLastAction(`Role switched to ${newRole} View — ${newRole==='Customer' ? 'Integration hidden, delete disabled' : 'Full consultant permissions'}`);
  };
  const handleTabChange = (tabId: any) => {
    setActiveTab(tabId);
    setInteractionTick(tk=>tk+1);
    setLastAction(`Opened ${tabId} — ${new Date().toLocaleTimeString()}`);
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
  };
  const handleAddWorkflow = () => {
    const nw: WorkflowDef = { id:'w'+Date.now(), name:'New Workflow', module:'General Ledger', wType:'Approval', approver:'', condition:'', escalation:'', notification:'' };
    setWorkflows([...workflows, nw]);
    setSelectedWfId(nw.id);
  };

  const aiCards = [
    {icon:'🔊', color:'#E5F3FF', titleKey:'aiCard1Title', descKey:'aiCard1Desc', demoKey:'aiCard1Demo'},
    {icon:'🎥', color:'#DFF6DD', titleKey:'aiCard2Title', descKey:'aiCard2Desc', demoKey:'aiCard2Demo'},
    {icon:'👣', color:'#FFF4CE', titleKey:'aiCard3Title', descKey:'aiCard3Desc', demoKey:'aiCard3Demo'},
    {icon:'🖥️', color:'#F3F2F1', titleKey:'aiCard4Title', descKey:'aiCard4Desc', demoKey:'aiCard4Demo'},
    {icon:'🎓', color:'#EDEBE9', titleKey:'aiCard5Title', descKey:'aiCard5Desc', demoKey:'aiCard5Demo'},
    {icon:'🤖', color:'#E5F3FF', titleKey:'aiCard6Title', descKey:'aiCard6Desc', demoKey:'aiCard6Demo'},
    {icon:'✅', color:'#DFF6DD', titleKey:'aiCard7Title', descKey:'aiCard7Desc', demoKey:'aiCard7Demo'},
    {icon:'🔗', color:'#FFF4CE', titleKey:'aiCard8Title', descKey:'aiCard8Desc', demoKey:'aiCard8Demo'},
    {icon:'🌊', color:'#FDE7E9', titleKey:'aiCard9Title', descKey:'aiCard9Desc', demoKey:'aiCard9Demo'},
    {icon:'🏋️', color:'#EDEBE9', titleKey:'aiCard10Title', descKey:'aiCard10Desc', demoKey:'aiCard10Demo'},
  ];

  const dirStyle = currentLang === 'AR' ? {direction:'rtl' as const} : {direction:'ltr' as const};

  return (
    <div className={`min-h-screen flex flex-col font-segoe antialiased selection:bg-[#0078D4]/20 transition-opacity duration-200 ${isTransitioning ? 'opacity-60' : 'opacity-100'}`} style={{ fontFamily: 'Segoe UI, -apple-system, BlinkMacSystemFont, sans-serif', ...dirStyle }}>
      <style>{`
        .font-segoe { font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif; }
        .d365-grid-row:nth-child(even) { background:#F8F8F8; }
        .d365-grid-row:nth-child(odd) { background:#FFFFFF; }
        .d365-grid-row:hover { background:#F3F2F1; }
        .d365-selected { background:#E5F3FF !important; outline:1px solid #0078D4; outline-offset:-1px; }
        .scrollbar-thin::-webkit-scrollbar { width:6px; height:6px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background:#C8C6C4; border-radius:3px; }
      `}</style>

      {/* Toast */}
      {toast.visible && (
        <div className="fixed top-[60px] left-1/2 -translate-x-1/2 z-[100] bg-[#323130] text-white px-4 py-2 rounded-[2px] shadow-[0_4px_12px_rgba(0,0,0,0.3)] text-[13px] flex items-center gap-2 animate-in">
          <span className="text-[16px]">{currentLangMeta.flag}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* D365 Black Header */}
      <header className="h-[52px] bg-black text-white flex items-center justify-between px-4 sticky top-0 z-50" style={{ paddingTop: 'var(--safe-area-inset-top,0)' }}>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-[#0078D4] flex items-center justify-center font-bold text-[14px]">EP</div>
          <div className="hidden md:block">
            <div className="text-[14px] font-semibold leading-none tracking-[-0.01em]">{t('appTitle')}</div>
            <div className="text-[11px] opacity-70 leading-none mt-[2px]">{t('appSubtitle')}</div>
          </div>
          <div className="hidden md:flex items-center gap-2 ml-6">
            <span className="text-[11px] bg-[#2B2B2B] px-2 py-[2px] rounded border border-[#3A3A3A]">{savingState}</span>
            {String(savingState).includes('Saving') || String(savingState).includes('सहेजा जा') || String(savingState).includes('Guardando') || String(savingState).includes('Speichern') || String(savingState).includes('Enregistrement') || String(savingState).includes('جار') || String(savingState).includes('保存') || String(savingState).includes('ಉಳಿಸ') ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector - D365 prominent */}
          <div className="relative">
            <button onClick={()=>setShowLangDropdown(!showLangDropdown)} className="h-8 bg-[#1F1F1F] border border-[#3A3A3A] hover:border-[#6B6B6B] px-3 flex items-center gap-2 text-[12px] font-semibold transition">
              <span className="text-[16px]">{currentLangMeta.flag}</span>
              <span className="hidden sm:inline">{currentLangMeta.code}</span>
              <span className="hidden lg:inline font-normal opacity-80">{currentLangMeta.native}</span>
              <span className="text-[10px] opacity-60">▼</span>
            </button>
            {showLangDropdown && (
              <div className="absolute top-[36px] right-0 w-[320px] bg-white border border-[#8A8886] shadow-[0_8px_24px_rgba(0,0,0,0.25)] z-50 text-[#323130]">
                <div className="h-10 bg-[#F3F2F1] border-b border-[#E1DFDD] flex items-center px-3 justify-between">
                  <span className="text-[12px] font-semibold">{t('selectLanguage')}</span>
                  <button onClick={()=>setShowLangDropdown(false)} className="w-6 h-6 bg-white border border-[#E1DFDD] flex items-center justify-center text-[12px]">×</button>
                </div>
                <div className="p-2 border-b border-[#E1DFDD]">
                  <input value={langSearch} onChange={e=>setLangSearch(e.target.value)} placeholder={t('searchLanguage')} className="w-full h-8 px-3 border border-[#8A8886] text-[12px] focus:border-[#0078D4] focus:outline-none" autoFocus />
                </div>
                <div className="max-h-[320px] overflow-auto scrollbar-thin">
                  {filteredLangs.map(l=>(
                    <button key={l.code} onClick={()=>handleLanguageChange(l.code)} className={`w-full h-12 flex items-center gap-3 px-3 text-left hover:bg-[#F3F2F1] border-b border-[#F3F2F1] transition ${currentLang===l.code ? 'bg-[#E5F3FF] border-l-4 border-l-[#0078D4]' : 'border-l-4 border-l-transparent'}`}>
                      <span className="text-[20px] w-7">{l.flag}</span>
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold flex items-center gap-2">{l.name} <span className="text-[10px] bg-[#F3F2F1] border border-[#E1DFDD] px-1">{l.code}</span></div>
                        <div className="text-[11px] text-[#605E5C]">{l.native}</div>
                      </div>
                      {currentLang===l.code && <span className="text-[#0078D4] text-[14px]">✓</span>}
                    </button>
                  ))}
                </div>
                <div className="p-2 bg-[#FAF9F8] border-t border-[#E1DFDD] text-[10px] text-[#605E5C]">
                  {currentLang==='AR' ? 'سيتم التبديل إلى تخطيط RTL' : t('selectLanguage') + ' — D365 F&O style, instant change'}
                </div>
              </div>
            )}
          </div>

          <div className="hidden xl:flex items-center gap-2 text-[11px]">
            <span className="opacity-60">{t('legalEntityLabel')}</span><span className="bg-[#1F1F1F] px-2 py-1 border border-[#333]">{t('legalEntityValue')}</span>
          </div>
          <div className="flex items-center bg-[#1F1F1F] rounded-[2px] border border-[#333] p-[2px]">
            <button onClick={()=>handleRoleChange('Consultant')} className={`px-3 py-1 text-[12px] font-semibold transition ${role==='Consultant' ? 'bg-[#0078D4] text-white' : 'text-[#A19F9D] hover:text-white'}`}>{t('consultantView')}</button>
            <button onClick={()=>handleRoleChange('Customer')} className={`px-3 py-1 text-[12px] font-semibold transition ${role==='Customer' ? 'bg-[#0078D4] text-white' : 'text-[#A19F9D] hover:text-white'}`}>{t('customerView')}</button>
          </div>
          <div className="w-7 h-7 rounded-full bg-[#5C2D91] flex items-center justify-center text-[11px] font-bold">AK</div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-[#F3F2F1] border-b border-[#E1DFDD] flex items-center overflow-x-auto scrollbar-thin">
        {[
          {id:'Questionnaire', label:t('tabQuestionnaire'), icon:'📋'},
          {id:'Posting', label:t('tabPosting'), icon:'🏦'},
          {id:'Workflow', label:t('tabWorkflow'), icon:'🔄'},
          {id:'Parameters', label:t('tabParameters'), icon:'⚙️'},
          {id:'System Admin', label:t('tabSystemAdmin'), icon:'🛡️'},
          {id:'AI Features', label:t('tabAIFeatures'), icon:'✨'},
        ].map(tab=>(
          <button key={tab.id} onClick={()=>handleTabChange(tab.id)} className={`h-[40px] px-4 flex items-center gap-2 text-[13px] whitespace-nowrap border-b-2 transition ${activeTab===tab.id ? 'border-[#0078D4] bg-white text-[#323130] font-semibold' : 'border-transparent text-[#605E5C] hover:bg-[#EDEBE9] hover:text-[#323130]'}`}>
            <span>{tab.icon}</span>{tab.label}
          </button>
        ))}
        <div className="ml-auto hidden md:flex items-center gap-2 pr-4 text-[11px] text-[#605E5C]">
          <span>{t('environment')}</span><span className="w-2 h-2 rounded-full bg-[#107C10] inline-block"></span>
          <span className="ml-2 hidden lg:flex items-center gap-1"><span className="text-[12px]">{currentLangMeta.flag}</span> {currentLangMeta.code}</span>
        </div>
      </div>

      {role==='Customer' && (
        <div className="bg-[#FFF4CE] border-b border-[#FCE100] px-4 py-[6px] text-[12px] text-[#323130] flex items-center gap-2">
          <span className="text-[14px]">ⓘ</span>
          <span><b>{t('bannerCustomerTitle')}</b> {t('bannerCustomerText')}</span>
        </div>
      )}

      <div className="bg-white border-b border-[#E1DFDD] px-4 py-1.5 flex items-center gap-3 text-[11px]">
        <span className="font-semibold text-[#323130]">{t('actionLabel')}</span>
        <span className="text-[#605E5C] truncate">{lastAction}</span>
        <span className="ml-auto text-[10px] text-[#A19F9D]">tick:{interactionTick} | {currentLangMeta.code}</span>
      </div>

      <div className="flex-1 bg-[#FAF9F8] flex flex-col">
        {activeTab==='Questionnaire' && (
          <>
            <div className="bg-[#F3F2F1] border-b border-[#E1DFDD] px-2 py-2 flex flex-wrap items-center gap-1">
              <div className="flex items-center gap-1">
                <button onClick={handleAddQuestion} className="h-8 px-3 bg-white border border-[#8A8886] text-[12px] font-semibold text-[#323130] hover:bg-[#F3F2F1] flex items-center gap-1.5">
                  <span className="text-[14px]">＋</span> {t('btnNew')}
                </button>
                <button className={`h-8 px-3 bg-white border border-[#8A8886] text-[12px] font-semibold flex items-center gap-1.5 ${!selectedQId ? 'opacity-40' : ''}`}><span>✎</span> {t('btnEdit')}</button>
                <button onClick={handleDeleteQuestion} disabled={role==='Customer' || !selectedQId} className="h-8 px-3 bg-white border border-[#8A8886] text-[12px] font-semibold flex items-center gap-1.5 disabled:opacity-40"><span>🗑</span> {t('btnDelete')}</button>
                <div className="w-[1px] h-6 bg-[#E1DFDD] mx-2"></div>
                <select value={moduleFilter} onChange={e=>setModuleFilter(e.target.value as any)} className="h-8 px-2 bg-white border border-[#8A8886] text-[12px] min-w-[180px]">
                  <option value="All">{t('filterAllModules')}</option>
                  {MODULES.map(m=><option key={m} value={m}>{translateModule(m)}</option>)}
                </select>
                <div className="ml-3 text-[11px] text-[#605E5C] hidden md:flex items-center gap-1"><span className="w-2 h-2 bg-[#107C10] rounded-full"></span>{t('autoSaveEnabled')}</div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[11px] text-[#605E5C]">{filteredQuestions.length} {t('gridRecords')}</span>
                <button onClick={()=>setShowIntegrationHelp(!showIntegrationHelp)} className="h-8 px-2 bg-white border border-[#8A8886] text-[11px]">{t('integrationHelp')}</button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 min-h-0">
              <div className="lg:w-[48%] border-r border-[#E1DFDD] bg-white flex flex-col min-h-[300px]">
                <div className="h-8 bg-[#F3F2F1] border-b border-[#E1DFDD] flex items-center px-2 text-[11px] font-semibold text-[#323130] uppercase tracking-wide">
                  <span className="w-8">✓</span>
                  <span className="w-10">{t('gridNo')}</span>
                  <span className="flex-1">{t('gridQuestion')}</span>
                  <span className="w-24">{t('gridType')}</span>
                  <span className="w-24">{t('gridFitGap')}</span>
                  <span className="w-24">{t('gridModule')}</span>
                </div>
                <div className="flex-1 overflow-auto scrollbar-thin max-h-[45vh] lg:max-h-none">
                  {filteredQuestions.map(q=>(
                    <div key={q.id} onClick={()=>setSelectedQId(q.id)} className={`d365-grid-row h-10 flex items-center px-2 text-[12px] border-b border-[#F3F2F1] cursor-pointer ${selectedQId===q.id ? 'd365-selected' : ''}`}>
                      <span className="w-8 flex items-center justify-center"><span className={`w-[14px] h-[14px] border flex items-center justify-center text-[10px] ${selectedQId===q.id ? 'bg-[#0078D4] border-[#0078D4] text-white' : 'border-[#8A8886] bg-white'}`}>{selectedQId===q.id?'✓':''}</span></span>
                      <span className="w-10 font-semibold">{String(q.no).padStart(2,'0')}</span>
                      <span className="flex-1 truncate pr-2">{q.question}</span>
                      <span className="w-24"><span className="px-1.5 py-0.5 bg-[#F3F2F1] border border-[#E1DFDD] text-[10px]">{translateQType(q.type)}</span></span>
                      <span className="w-24"><span className={`px-2 py-0.5 text-[10px] font-semibold rounded-[2px] ${q.fitGap==='Fit'?'bg-[#DFF6DD] text-[#107C10] border border-[#A7E3A5]': q.fitGap==='GAP'?'bg-[#FDE7E9] text-[#A80000] border border-[#F7B0B5]': q.fitGap==='Partial Fit'?'bg-[#FFF4CE] text-[#8A5700] border border-[#FCE100]':'bg-[#EDEBE9] text-[#323130] border border-[#E1DFDD]'}`}>{translateFitGap(q.fitGap)}</span></span>
                      <span className="w-24 truncate text-[11px] text-[#605E5C]">{translateModule(q.module).split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 bg-[#FAF9F8] overflow-auto scrollbar-thin">
                {selectedQuestion ? (
                  <div className="p-3 space-y-3">
                    <div className="bg-white border border-[#E1DFDD] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                      <div className="h-9 bg-[#F3F2F1] border-b border-[#E1DFDD] flex items-center px-3 text-[13px] font-semibold text-[#323130]">▾ {t('generalFastTab')} {selectedQuestion.no} <span className="ml-2 text-[11px] font-normal text-[#605E5C]">{t('autoNumberNote')}</span></div>
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="text-[12px] font-semibold text-[#323130] flex justify-between">{t('labelQuestion')} <span className="font-normal text-[#605E5C]">{selectedQuestion.question.length}{t('labelChars')}</span></label>
                          <input value={selectedQuestion.question} onChange={e=>updateQuestion({question:e.target.value.slice(0,50)})} placeholder={t('placeholderQuestion')} className="w-full mt-1 h-8 px-2 border border-[#8A8886] text-[13px] focus:border-[#0078D4] focus:outline-none" />
                        </div>
                        <div>
                          <label className="text-[12px] font-semibold">{t('labelQuestionType')}</label>
                          <select value={selectedQuestion.type} onChange={e=>updateQuestion({type:e.target.value as QType})} className="w-full mt-1 h-8 px-2 border border-[#8A8886] text-[13px] bg-white">
                            <option value="RadioButton">{t('typeRadio')}</option><option value="Text">{t('typeText')}</option><option value="Workflow">{t('typeWorkflow')}</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[12px] font-semibold">{t('labelFitGap')}</label>
                          <select value={selectedQuestion.fitGap} onChange={e=>updateQuestion({fitGap:e.target.value as FitGap})} className="w-full mt-1 h-8 px-2 border border-[#8A8886] text-[13px] bg-white">
                            <option>{t('fitFit')}</option><option>{t('fitGap')}</option><option>{t('fitPartial')}</option><option>{t('fitCustom')}</option>
                          </select>
                        </div>

                        {selectedQuestion.type==='Text' && (
                          <div className="col-span-2 bg-[#F8F8F8] border border-[#E1DFDD] p-3">
                            <label className="text-[12px] font-semibold flex justify-between">{t('labelAnswerText')} <span>{selectedQuestion.textValue.length}{t('labelChars250')}</span></label>
                            <textarea value={selectedQuestion.textValue} onChange={e=>updateQuestion({textValue:e.target.value.slice(0,250)})} className="w-full mt-1 h-20 p-2 border border-[#8A8886] text-[13px] resize-none" placeholder={t('placeholderDetailedResponse')}></textarea>
                          </div>
                        )}
                        {selectedQuestion.type==='Workflow' && (
                          <div className="col-span-2 bg-[#FFF4CE] border border-[#FCE100] p-3">
                            <label className="text-[12px] font-semibold flex justify-between">{t('labelWorkflowDetails')} <span className="text-[#A80000]">{t('labelAttachmentMandatory')}</span> <span>{selectedQuestion.textValue.length}{t('labelChars250')}</span></label>
                            <textarea value={selectedQuestion.textValue} onChange={e=>updateQuestion({textValue:e.target.value.slice(0,250)})} className="w-full mt-1 h-20 p-2 border border-[#8A8886] text-[13px] resize-none"></textarea>
                            <div className="mt-2 flex items-center gap-2">
                              <input ref={fileInputRef} type="file" className="hidden" onChange={e=>{ const f=e.target.files?.[0]?.name; if(f) updateQuestion({attachmentName:f}); }}/>
                              <button onClick={()=>fileInputRef.current?.click()} className="h-7 px-3 bg-white border border-[#8A8886] text-[11px] font-semibold">{t('btnAttachFile')} <span className="text-[#A80000]">*</span></button>
                              {selectedQuestion.attachmentName ? <span className="text-[11px] text-[#107C10]">📎 {selectedQuestion.attachmentName}</span> : <span className="text-[11px] text-[#A80000]">⚠ {t('attachmentRequired')}</span>}
                            </div>
                          </div>
                        )}
                        {selectedQuestion.type==='RadioButton' && (
                          <div className="col-span-2 bg-white border border-[#E1DFDD]">
                            <div className="h-8 bg-[#F3F2F1] border-b border-[#E1DFDD] flex items-center justify-between px-3">
                              <span className="text-[12px] font-semibold">{t('labelRadioOptions')}</span>
                              <button onClick={handleAddRadio} className="h-6 px-2 bg-white border border-[#8A8886] text-[11px]">{t('btnAddRow')}</button>
                            </div>
                            <div className="p-2 space-y-1">
                              {selectedQuestion.radioOptions.map((opt,i)=>(
                                <div key={i} className="flex gap-2">
                                  <input value={opt.code} onChange={e=>{ const ro=[...selectedQuestion.radioOptions]; ro[i].code=e.target.value; updateQuestion({radioOptions:ro}); }} placeholder="Code e.g. 01" className="w-24 h-7 px-2 border border-[#8A8886] text-[12px]" />
                                  <input value={opt.desc} onChange={e=>{ const ro=[...selectedQuestion.radioOptions]; ro[i].desc=e.target.value.slice(0,50); updateQuestion({radioOptions:ro}); }} placeholder="Description e.g. FIFO" className="flex-1 h-7 px-2 border border-[#8A8886] text-[12px]" />
                                  <button onClick={()=>{ const ro=selectedQuestion.radioOptions.filter((_,idx)=>idx!==i); updateQuestion({radioOptions:ro}); }} className="w-7 h-7 bg-white border border-[#8A8886] text-[12px]">×</button>
                                </div>
                              ))}
                              <div className="text-[10px] text-[#605E5C] mt-1">{t('exampleRadio')}</div>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="text-[12px] font-semibold flex justify-between">{t('labelWhyAsk')} <span>{selectedQuestion.why.length}{t('labelChars100')}</span></label>
                          <input value={selectedQuestion.why} onChange={e=>updateQuestion({why:e.target.value.slice(0,100)})} className="w-full mt-1 h-8 px-2 border border-[#8A8886] text-[12px]" />
                        </div>
                        <div>
                          <label className="text-[12px] font-semibold flex justify-between">{t('labelBusinessImpact')} <span>{selectedQuestion.impact.length}{t('labelChars100')}</span></label>
                          <input value={selectedQuestion.impact} onChange={e=>updateQuestion({impact:e.target.value.slice(0,100)})} className="w-full mt-1 h-8 px-2 border border-[#8A8886] text-[12px]" />
                        </div>
                        <div>
                          <label className="text-[12px] font-semibold flex justify-between">{t('labelBusinessArea')} <span>{selectedQuestion.businessArea.length}{t('labelChars100')}</span></label>
                          <input value={selectedQuestion.businessArea} onChange={e=>updateQuestion({businessArea:e.target.value.slice(0,100)})} className="w-full mt-1 h-8 px-2 border border-[#8A8886] text-[12px]" placeholder={t('placeholderBusinessArea')} />
                        </div>
                        <div>
                          <label className="text-[12px] font-semibold flex justify-between">{t('labelNavPath')} <span>{selectedQuestion.navPath.length}{t('labelChars100')}</span></label>
                          <input value={selectedQuestion.navPath} onChange={e=>updateQuestion({navPath:e.target.value.slice(0,100)})} className="w-full mt-1 h-8 px-2 border border-[#8A8886] text-[12px]" placeholder={t('placeholderNavPath')} />
                        </div>
                      </div>
                    </div>

                    {role==='Consultant' ? (
                      <div className="bg-white border border-[#E1DFDD] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        <div className="h-9 bg-[#E5F3FF] border-b border-[#A9D0F5] flex items-center px-3 text-[13px] font-semibold text-[#004578]">▾ {t('labelIntegrationSection')}</div>
                        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            {k:'formName', labelKey:'labelFormName'},
                            {k:'fieldName', labelKey:'labelFieldName'},
                            {k:'tableName', labelKey:'labelTableName'},
                            {k:'menuItem', labelKey:'labelMenuItem'},
                            {k:'dataEntity', labelKey:'labelDataEntity'},
                            {k:'odataEntity', labelKey:'labelODataEntity'},
                            {k:'configKey', labelKey:'labelConfigKey'},
                          ].map(f=>(
                            <div key={f.k}>
                              <label className="text-[11px] font-semibold flex justify-between">{t(f.labelKey)} <span>{(selectedQuestion.integration as any)[f.k]?.length||0}{t('labelChars15')}</span></label>
                              <input value={(selectedQuestion.integration as any)[f.k]} onChange={e=>{ const integ={...selectedQuestion.integration, [f.k]:e.target.value.slice(0,15)}; updateQuestion({integration:integ}); }} className="w-full mt-1 h-7 px-2 border border-[#8A8886] text-[11px] font-mono bg-[#FAF9F8]" />
                            </div>
                          ))}
                        </div>
                        <div className="px-4 pb-3 text-[10px] text-[#605E5C]">{t('each15chars')}</div>
                      </div>
                    ) : (
                      <div className="bg-[#F3F2F1] border border-dashed border-[#C8C6C4] p-4 text-[12px] text-[#605E5C] text-center">{t('labelIntegrationHidden')}</div>
                    )}

                    <div className="bg-white border border-[#E1DFDD] p-3 flex items-center gap-3 text-[11px]">
                      <span className="font-semibold">{t('labelAttachment')}</span>
                      <span>{t('labelAllFileTypes')}</span>
                      <span className="mx-2 w-[1px] h-4 bg-[#E1DFDD]"></span>
                      <span>{t('labelModule')} <b>{translateModule(selectedQuestion.module)}</b></span>
                      <span className="ml-auto text-[#605E5C]">{t('formLabel')} | {t('tableLabel')}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-[#605E5C] text-[13px]">{t('selectRecord')}</div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab==='Posting' && (
          <>
            <div className="bg-[#F3F2F1] border-b border-[#E1DFDD] px-2 py-2 flex items-center gap-1">
              <button onClick={handleAddPosting} className="h-8 px-3 bg-white border border-[#8A8886] text-[12px] font-semibold flex items-center gap-1.5"><span>＋</span> {t('btnNew')}</button>
              <button className="h-8 px-3 bg-white border border-[#8A8886] text-[12px] font-semibold">{t('btnEdit')}</button>
              <button disabled={role==='Customer'} className="h-8 px-3 bg-white border border-[#8A8886] text-[12px] font-semibold disabled:opacity-40">{t('btnDelete')}</button>
              <div className="ml-4 text-[11px] bg-[#DFF6DD] border border-[#A7E3A5] px-2 py-1">💡 {t('postingWhy')}</div>
            </div>
            <div className="flex flex-col lg:flex-row flex-1">
              <div className="lg:w-[60%] bg-white border-r border-[#E1DFDD]">
                <div className="h-8 bg-[#F3F2F1] border-b border-[#E1DFDD] flex items-center px-2 text-[11px] font-semibold uppercase">
                  <span className="w-8">✓</span><span className="w-28">{t('postingGridModule')}</span><span className="w-20">{t('postingGridType')}</span><span className="w-24">{t('postingGridCode')}</span><span className="w-24">{t('postingGridMainAccount')}</span><span className="flex-1">{t('postingGridDesc')}</span><span className="w-20">{t('postingGridLedger')}</span>
                </div>
                <div className="overflow-auto scrollbar-thin">
                  {postings.map(p=>(
                    <div key={p.id} onClick={()=>setSelectedPostId(p.id)} className={`h-9 flex items-center px-2 text-[12px] border-b border-[#F3F2F1] cursor-pointer d365-grid-row ${selectedPostId===p.id?'d365-selected':''}`}>
                      <span className="w-8 flex justify-center"><span className={`w-[14px] h-[14px] border flex items-center justify-center ${selectedPostId===p.id?'bg-[#0078D4] border-[#0078D4] text-white text-[10px]':'border-[#8A8886] bg-white'}`}>{selectedPostId===p.id?'✓':''}</span></span>
                      <span className="w-28 truncate">{translateModule(p.module)}</span><span className="w-20"><span className={`px-1.5 py-0.5 text-[10px] border ${p.accType==='Summary'?'bg-[#E5F3FF] border-[#A9D0F5]':'bg-[#FFF4CE] border-[#FCE100]'}`}>{p.accType=== 'Summary' ? t('summaryType') : t('postingTypeOpt')}</span></span>
                      <span className="w-24 font-mono text-[11px]">{p.code}</span><span className="w-24 font-mono">{p.mainAccount}</span><span className="flex-1 truncate">{p.desc}</span><span className="w-20">{p.ledger}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 bg-[#FAF9F8] p-3">
                {selectedPosting && (
                  <div className="bg-white border border-[#E1DFDD] shadow-sm">
                    <div className="h-9 bg-[#F3F2F1] border-b border-[#E1DFDD] px-3 flex items-center text-[13px] font-semibold">▾ {t('postingSummaryTitle')}</div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div><label className="text-[12px] font-semibold">{t('postingGridModule')}</label><select value={selectedPosting.module} onChange={e=>setPostings(postings.map(x=>x.id===selectedPostId?{...x,module:e.target.value as ModuleName}:x))} className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[12px] bg-white">{MODULES.map(m=><option key={m}>{translateModule(m as ModuleName)}</option>)}</select></div>
                      <div><label className="text-[12px] font-semibold">{t('postingAccountType')}</label><select value={selectedPosting.accType} onChange={e=>setPostings(postings.map(x=>x.id===selectedPostId?{...x,accType:e.target.value as any}:x))} className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[12px] bg-white"><option value="Summary">{t('summaryType')}</option><option value="Posting">{t('postingTypeOpt')}</option></select></div>
                      <div><label className="text-[12px] font-semibold">{t('postingProfileCode')}</label><input value={selectedPosting.code} onChange={e=>setPostings(postings.map(x=>x.id===selectedPostId?{...x,code:e.target.value}:x))} className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[12px]" /></div>
                      <div><label className="text-[12px] font-semibold">{t('postingMainAccount')}</label><input value={selectedPosting.mainAccount} onChange={e=>setPostings(postings.map(x=>x.id===selectedPostId?{...x,mainAccount:e.target.value}:x))} className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[12px] font-mono" /></div>
                      <div className="col-span-2"><label className="text-[12px] font-semibold">{t('postingDesc')}</label><input value={selectedPosting.desc} onChange={e=>setPostings(postings.map(x=>x.id===selectedPostId?{...x,desc:e.target.value}:x))} className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[12px]" /></div>
                      <div className="col-span-2"><label className="text-[12px] font-semibold">{t('postingExplanation')}</label><textarea value={selectedPosting.explanation} onChange={e=>setPostings(postings.map(x=>x.id===selectedPostId?{...x,explanation:e.target.value}:x))} className="w-full mt-1 h-16 border border-[#8A8886] p-2 text-[12px] resize-none" placeholder={t('postingWhy')} /></div>
                      <div><label className="text-[12px] font-semibold">{t('postingLedger')}</label><input value={selectedPosting.ledger} onChange={e=>setPostings(postings.map(x=>x.id===selectedPostId?{...x,ledger:e.target.value}:x))} className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[12px]" /></div>
                      <div><label className="text-[12px] font-semibold">{t('postingPostingType')}</label><input value={selectedPosting.postingType} onChange={e=>setPostings(postings.map(x=>x.id===selectedPostId?{...x,postingType:e.target.value}:x))} className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[12px]" /></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab==='Workflow' && (
          <>
            <div className="bg-[#F3F2F1] border-b border-[#E1DFDD] px-2 py-2 flex items-center gap-1">
              <button onClick={handleAddWorkflow} className="h-8 px-3 bg-white border border-[#8A8886] text-[12px] font-semibold">＋ {t('btnNew')}</button>
              <button className="h-8 px-3 bg-white border border-[#8A8886] text-[12px] font-semibold">{t('btnEdit')}</button>
              <button disabled={role==='Customer'} className="h-8 px-3 bg-white border border-[#8A8886] text-[12px] font-semibold disabled:opacity-40">{t('btnDelete')}</button>
              <span className="ml-3 text-[11px] text-[#605E5C]">{t('workflowMinEntry')}</span>
            </div>
            <div className="flex flex-col lg:flex-row flex-1">
              <div className="lg:w-[55%] bg-white border-r border-[#E1DFDD]">
                <div className="h-8 bg-[#F3F2F1] border-b border-[#E1DFDD] flex items-center px-2 text-[11px] font-semibold uppercase">
                  <span className="w-8">✓</span><span className="w-48">{t('workflowGridName')}</span><span className="w-28">{t('workflowGridModule')}</span><span className="w-20">{t('workflowGridType')}</span><span className="flex-1">{t('workflowGridApprover')}</span>
                </div>
                {workflows.map(w=>(
                  <div key={w.id} onClick={()=>setSelectedWfId(w.id)} className={`h-9 flex items-center px-2 text-[12px] border-b border-[#F3F2F1] cursor-pointer d365-grid-row ${selectedWfId===w.id?'d365-selected':''}`}>
                    <span className="w-8 flex justify-center"><span className={`w-[14px] h-[14px] border flex items-center justify-center ${selectedWfId===w.id?'bg-[#0078D4] border-[#0078D4] text-white text-[10px]':'border-[#8A8886] bg-white'}`}>{selectedWfId===w.id?'✓':''}</span></span>
                    <span className="w-48 truncate font-semibold">{w.name}</span><span className="w-28 truncate">{translateModule(w.module)}</span><span className="w-20"><span className="px-1.5 py-0.5 bg-[#F3F2F1] border text-[10px]">{w.wType}</span></span><span className="flex-1 truncate">{w.approver}</span>
                  </div>
                ))}
              </div>
              <div className="flex-1 bg-[#FAF9F8] p-3 space-y-3">
                {selectedWorkflow && (
                  <>
                    <div className="bg-white border border-[#E1DFDD]">
                      <div className="h-9 bg-[#F3F2F1] border-b px-3 flex items-center text-[13px] font-semibold">▾ {t('workflowCreateTitle')}</div>
                      <div className="p-4 grid grid-cols-2 gap-4">
                        <div className="col-span-2"><label className="text-[12px] font-semibold">{t('workflowName')}</label><input value={selectedWorkflow.name} onChange={e=>setWorkflows(workflows.map(x=>x.id===selectedWfId?{...x,name:e.target.value}:x))} className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[12px]" /></div>
                        <div><label className="text-[12px] font-semibold">{t('workflowModule')}</label><select value={selectedWorkflow.module} onChange={e=>setWorkflows(workflows.map(x=>x.id===selectedWfId?{...x,module:e.target.value as ModuleName}:x))} className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[12px] bg-white">{MODULES.map(m=><option key={m}>{translateModule(m as ModuleName)}</option>)}</select></div>
                        <div><label className="text-[12px] font-semibold">{t('workflowType')}</label><select value={selectedWorkflow.wType} onChange={e=>setWorkflows(workflows.map(x=>x.id===selectedWfId?{...x,wType:e.target.value as any}:x))} className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[12px] bg-white"><option>{t('approval')}</option><option>{t('review')}</option><option>{t('task')}</option></select></div>
                        <div><label className="text-[12px] font-semibold">{t('workflowApprover')}</label><input value={selectedWorkflow.approver} onChange={e=>setWorkflows(workflows.map(x=>x.id===selectedWfId?{...x,approver:e.target.value}:x))} className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[12px]" /></div>
                        <div><label className="text-[12px] font-semibold">{t('workflowCondition')}</label><input value={selectedWorkflow.condition} onChange={e=>setWorkflows(workflows.map(x=>x.id===selectedWfId?{...x,condition:e.target.value}:x))} className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[12px]" /></div>
                        <div><label className="text-[12px] font-semibold">{t('workflowEscalation')}</label><input value={selectedWorkflow.escalation} onChange={e=>setWorkflows(workflows.map(x=>x.id===selectedWfId?{...x,escalation:e.target.value}:x))} className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[12px]" /></div>
                        <div><label className="text-[12px] font-semibold">{t('workflowNotification')}</label><input value={selectedWorkflow.notification} onChange={e=>setWorkflows(workflows.map(x=>x.id===selectedWfId?{...x,notification:e.target.value}:x))} className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[12px]" /></div>
                      </div>
                    </div>
                    <div className="bg-[#1F1F1F] border border-[#333] p-3">
                      <div className="text-[11px] font-semibold text-[#A19F9D] mb-2 uppercase tracking-wide">{t('workflowPreviewTitle')}</div>
                      <pre className="text-[11px] font-mono text-[#D4D4D4] overflow-auto">{JSON.stringify({ workflowName: selectedWorkflow.name, module: selectedWorkflow.module, type: selectedWorkflow.wType, approval: { approver: selectedWorkflow.approver, condition: selectedWorkflow.condition, escalationPath: selectedWorkflow.escalation, notification: selectedWorkflow.notification }, integrationTarget: "WorkflowConfiguration", entity: "WorkflowTable" }, null, 2)}</pre>
                      <div className="mt-2 flex gap-2"><button onClick={()=>navigator.clipboard.writeText(JSON.stringify(selectedWorkflow))} className="h-7 px-3 bg-white text-black text-[11px] font-semibold">{t('btnCopyJson')}</button><button className="h-7 px-3 bg-[#0078D4] text-white text-[11px] font-semibold">{t('btnExportD365')}</button></div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab==='Parameters' && (
          <>
            <div className="bg-[#F3F2F1] border-b border-[#E1DFDD] px-2 py-2 flex items-center gap-1">
              <span className="text-[12px] font-semibold mr-2">{t('paramFastTabs')}</span>
              <button onClick={()=>{ const nt: ParamFastTab = { id:'ft'+Date.now(), title:'New FastTab', module:'General Ledger', fields:[] }; setParamTabs([...paramTabs, nt]); setSelectedParamId(nt.id); }} className="h-8 px-3 bg-white border border-[#8A8886] text-[12px] font-semibold">{t('btnNewFastTab')}</button>
              <button className="h-8 px-3 bg-white border border-[#8A8886] text-[12px] font-semibold">{t('btnEdit')}</button>
              <button disabled={role==='Customer'} className="h-8 px-3 bg-white border border-[#8A8886] text-[12px] font-semibold disabled:opacity-40">{t('btnDelete')}</button>
              <span className="ml-3 text-[11px] text-[#605E5C]">{t('paramLikeD365')}</span>
            </div>
            <div className="flex flex-col lg:flex-row flex-1">
              <div className="lg:w-[280px] bg-white border-r border-[#E1DFDD] flex flex-col">
                <div className="h-8 bg-[#F3F2F1] border-b px-3 text-[11px] font-semibold uppercase flex items-center">{t('paramParametersFastTabs')}</div>
                <div className="flex-1 overflow-auto scrollbar-thin">
                  {paramTabs.map(ft=>(
                    <div key={ft.id} onClick={()=>setSelectedParamId(ft.id)} className={`h-12 px-3 flex flex-col justify-center border-b border-[#F3F2F1] cursor-pointer ${selectedParamId===ft.id?'bg-[#E5F3FF] border-l-4 border-l-[#0078D4]':'hover:bg-[#F3F2F1] border-l-4 border-l-transparent'}`}>
                      <div className="text-[12px] font-semibold">{ft.title}</div>
                      <div className="text-[11px] text-[#605E5C]">{translateModule(ft.module)} • {ft.fields.length} fields</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 bg-[#FAF9F8] p-3">
                {selectedParam ? (
                  <div className="bg-white border border-[#E1DFDD]">
                    <div className="h-9 bg-[#F3F2F1] border-b px-3 flex items-center justify-between">
                      <span className="text-[13px] font-semibold">▾ {selectedParam.title} — {translateModule(selectedParam.module)}</span>
                      <div className="flex gap-1">
                        <button onClick={()=>{ const nf: ParamField = { id:'pf'+Date.now(), name:'New Field', importance:'Describe importance' }; setParamTabs(paramTabs.map(pt=>pt.id===selectedParamId?{...pt, fields:[...pt.fields, nf]}:pt)); }} className="h-6 px-2 bg-white border border-[#8A8886] text-[11px]">{t('btnAddField')}</button>
                      </div>
                    </div>
                    <div className="divide-y divide-[#F3F2F1]">
                      {selectedParam.fields.map(f=>(
                        <div key={f.id} className="p-3 flex gap-3 items-start">
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <div><label className="text-[11px] font-semibold">{t('paramFieldName')}</label><input value={f.name} onChange={e=>setParamTabs(paramTabs.map(pt=>pt.id===selectedParamId?{...pt, fields:pt.fields.map(fl=>fl.id===f.id?{...fl,name:e.target.value}:fl)}:pt))} className="w-full mt-1 h-7 border border-[#8A8886] px-2 text-[12px]" /></div>
                            <div><label className="text-[11px] font-semibold">{t('paramImportance')}</label><input value={f.importance} onChange={e=>setParamTabs(paramTabs.map(pt=>pt.id===selectedParamId?{...pt, fields:pt.fields.map(fl=>fl.id===f.id?{...fl,importance:e.target.value}:fl)}:pt))} className="w-full mt-1 h-7 border border-[#8A8886] px-2 text-[12px]" /></div>
                          </div>
                          <button onClick={()=>setParamTabs(paramTabs.map(pt=>pt.id===selectedParamId?{...pt, fields:pt.fields.filter(fl=>fl.id!==f.id)}:pt))} className="w-7 h-7 bg-white border border-[#8A8886] text-[12px] mt-5">×</button>
                        </div>
                      ))}
                      {selectedParam.fields.length===0 && <div className="p-8 text-center text-[12px] text-[#605E5C]">{t('paramNoFields')}</div>}
                    </div>
                  </div>
                ) : null}
                <div className="mt-3 bg-white border border-[#E1DFDD] p-3 text-[11px] text-[#605E5C]">{t('paramLooksExactly')}</div>
              </div>
            </div>
          </>
        )}

        {activeTab==='System Admin' && (
          <div className="p-3 grid grid-cols-1 lg:grid-cols-3 gap-3 bg-[#FAF9F8] flex-1">
            <div className="bg-white border border-[#E1DFDD] shadow-sm">
              <div className="h-9 bg-[#F3F2F1] border-b px-3 text-[13px] font-semibold flex items-center">▾ {t('sysCreateCompany')}</div>
              <div className="p-4 space-y-3">
                <div><label className="text-[11px] font-semibold">{t('sysCompanyName')}</label><input defaultValue="Contoso Entertainment USA" className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[12px]" /></div>
                <div><label className="text-[11px] font-semibold">{t('sysAddress')}</label><input defaultValue="1234 Contoso Blvd, Seattle, WA 98101" className="w-full mt-1 h-8 border border-[#8A8886] px-2 text-[12px]" /></div>
                <div><label className="text-[11px] font-semibold">{t('sysExecutiveSummary')}</label><textarea defaultValue="Leading entertainment company implementing D365 F&O for finance and operations transformation. 3 legal entities, multi-currency, intercompany." className="w-full mt-1 h-24 border border-[#8A8886] p-2 text-[12px] resize-none"></textarea></div>
                <div className="text-[10px] text-[#605E5C]">{t('legalHelp')}</div>
              </div>
            </div>
            <div className="bg-white border border-[#E1DFDD] shadow-sm">
              <div className="h-9 bg-[#F3F2F1] border-b px-3 text-[13px] font-semibold flex items-center">▾ {t('sysCreateRole')}</div>
              <div className="p-0">
                <div className="h-8 bg-[#F3F2F1] border-b flex items-center px-3 text-[11px] font-semibold uppercase gap-2"><span className="flex-1">{t('sysFormCapability')}</span><span className="w-12 text-center">{t('sysEdit')}</span><span className="w-12 text-center">{t('sysDelete')}</span><span className="w-12 text-center">{t('sysView')}</span></div>
                {[
                  {name:t('tabQuestionnaire'), edit:true, del:false, view:true},
                  {name:t('tabPosting'), edit:true, del:true, view:true},
                  {name:t('tabWorkflow'), edit:true, del:true, view:true},
                  {name:'Parameter forms', edit:true, del:true, view:true},
                  {name:t('labelIntegrationSection').split('—')[0], edit:true, del:true, view:false},
                ].map(r=>(
                  <div key={r.name} className="h-10 flex items-center px-3 border-b border-[#F3F2F1] text-[12px]">
                    <span className="flex-1 truncate">{r.name}</span>
                    <span className="w-12 flex justify-center"><input type="checkbox" defaultChecked={r.edit} className="w-4 h-4" /></span>
                    <span className="w-12 flex justify-center"><input type="checkbox" defaultChecked={r.del} className="w-4 h-4" /></span>
                    <span className="w-12 flex justify-center"><input type="checkbox" defaultChecked={r.view} className="w-4 h-4" /></span>
                  </div>
                ))}
                <div className="p-3"><input placeholder={t('sysRoleNamePlaceholder')} className="w-full h-8 border border-[#8A8886] px-2 text-[12px]" defaultValue="EP_FinanceConsultant" /></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-white border border-[#E1DFDD] shadow-sm">
                <div className="h-9 bg-[#F3F2F1] border-b px-3 text-[13px] font-semibold flex items-center">▾ {t('sysCOAManagement')}</div>
                <div className="p-3 space-y-2">
                  <button className="w-full h-9 bg-white border border-[#8A8886] text-[12px] font-semibold flex items-center justify-center gap-2">📤 {t('sysUploadCOA')}</button>
                  <div className="border border-[#E1DFDD] p-2">
                    <div className="text-[11px] font-semibold mb-2">{t('sysCreateCOABuilder')}</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-[#F3F2F1] border p-2 text-[11px]"><div className="font-semibold">{t('sysMainAccount')}</div><div className="mt-1 space-y-1"><div className="h-6 bg-white border px-1 flex items-center">100000 - Cash</div><div className="h-6 bg-white border px-1 flex items-center">200000 - AP</div><div className="h-6 bg-[#E5F3FF] border border-[#0078D4] px-1 flex items-center">300000 - Revenue</div></div></div>
                      <div className="bg-[#F3F2F1] border p-2 text-[11px]"><div className="font-semibold">{t('sysDepartment')}</div><div className="mt-1 space-y-1"><div className="h-6 bg-white border px-1">001 - Sales</div><div className="h-6 bg-white border px-1">002 - Finance</div></div></div>
                      <div className="bg-[#F3F2F1] border p-2 text-[11px]"><div className="font-semibold">{t('sysCostCenter')}</div><div className="mt-1 space-y-1"><div className="h-6 bg-white border px-1">CC100</div><div className="h-6 bg-white border px-1">CC200</div></div></div>
                    </div>
                    <div className="mt-2 text-[10px] text-[#605E5C]">{t('sysStructureNote')}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-[#E1DFDD] shadow-sm">
                <div className="h-9 bg-[#F3F2F1] border-b px-3 text-[13px] font-semibold flex items-center">▾ {t('sysTrainingAssets')}</div>
                <div className="p-3 space-y-3">
                  <div onDragOver={e=>{e.preventDefault(); setDragOver(true)}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault(); setDragOver(false);}} className={`border-2 border-dashed ${dragOver?'border-[#0078D4] bg-[#E5F3FF]':'border-[#C8C6C4] bg-[#FAF9F8]'} h-24 flex flex-col items-center justify-center gap-1 cursor-pointer`}>
                    <span className="text-[20px]">🎬</span><span className="text-[11px] font-semibold">{t('sysDragDrop')}</span><span className="text-[10px] text-[#605E5C]">{t('sysDragDropNote')}</span>
                  </div>
                  <div className="border border-[#E1DFDD] bg-[#FAF9F8] p-2">
                    <div className="text-[11px] font-semibold flex justify-between"><span>{t('sysUploadedAssets')}</span><span className="text-[#107C10]">✓ {t('sysHelpsGenerate')}</span></div>
                    <div className="mt-2 space-y-1 text-[11px]">
                      <div className="flex items-center gap-2 bg-white border p-1.5"><span>📹</span><span className="flex-1">GL_Journal_Approval_Demo.mp4</span><span className="text-[#605E5C]">12.4 MB</span></div>
                      <div className="flex items-center gap-2 bg-white border p-1.5"><span>🖼️</span><span className="flex-1">FiscalCalendar_Setup.png</span><span className="text-[#605E5C]">1.2 MB</span></div>
                      <div className="flex items-center gap-2 bg-white border p-1.5"><span>🖼️</span><span className="flex-1">VendorPosting_Profile.png</span><span className="text-[#605E5C]">0.9 MB</span></div>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#605E5C]">{t('sysUploadHelp')}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab==='AI Features' && (
          <div className="p-4 bg-[#FAF9F8] flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[18px] font-semibold text-[#323130]">{t('aiTitle')}</div>
                <div className="text-[12px] text-[#605E5C]">{t('aiSubtitle')}</div>
              </div>
              <div className="hidden md:flex items-center gap-2 text-[11px] bg-white border border-[#E1DFDD] px-3 py-1.5"><span className="w-2 h-2 bg-[#107C10] rounded-full animate-pulse"></span> {t('aiServicesOnline')}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {aiCards.map((card,i)=>(
                <div key={i} className="bg-white border border-[#E1DFDD] shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow cursor-pointer group">
                  <div className="h-1" style={{background:card.color}}></div>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-[2px] bg-[#F3F2F1] border border-[#E1DFDD] flex items-center justify-center text-[20px] group-hover:bg-[#0078D4] group-hover:text-white transition-colors">{card.icon}</div>
                      <span className="text-[10px] bg-[#F3F2F1] border border-[#E1DFDD] px-1.5 py-0.5">{t('aiDemo')}</span>
                    </div>
                    <div className="mt-3 text-[13px] font-semibold text-[#323130] leading-tight">{t(card.titleKey)}</div>
                    <div className="mt-1 text-[11px] text-[#605E5C] leading-[1.4] min-h-[32px]">{t(card.descKey)}</div>
                    <div className="mt-3 bg-[#FAF9F8] border border-[#F3F2F1] p-2 text-[10px] font-mono text-[#605E5C]">▶ {t(card.demoKey)}</div>
                    <button className="mt-3 w-full h-7 bg-white border border-[#8A8886] text-[11px] font-semibold hover:bg-[#F3F2F1]">{t('btnOpenDemo')}</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-black text-white p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="text-[12px]"><span className="font-semibold">{t('aiLayerTitle')}</span><span className="opacity-60 ml-3">{t('aiLayerDesc')}</span></div>
              <div className="flex gap-2"><button className="h-8 px-4 bg-white text-black text-[12px] font-semibold">{t('btnGenerateFRD')}</button><button className="h-8 px-4 bg-[#0078D4] text-white text-[12px] font-semibold">{t('btnExportAllDocs')}</button></div>
            </div>
          </div>
        )}
      </div>

      <div className="h-6 bg-[#F3F2F1] border-t border-[#E1DFDD] flex items-center px-3 text-[11px] text-[#605E5C] justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${String(savingState).includes('Saved')||String(savingState).includes('सहेजा')||String(savingState).includes('Guardado')||String(savingState).includes('Gespeichert')||String(savingState).includes('Enregistré')||String(savingState).includes('تم')||String(savingState).includes('保存')||String(savingState).includes('ಉಳಿಸ') ?'bg-[#107C10]':'bg-[#FFB900] animate-pulse'}`}></span>{savingState} {String(savingState).toLowerCase().includes('saved') || String(savingState).includes('सहेजा') || String(savingState).includes('Guardado') || String(savingState).includes('Gespeichert') || String(savingState).includes('Enregistré') || String(savingState).includes('تم') || String(savingState).includes('保存') || String(savingState).includes('ಉಳಿಸ') ? `— ${t('statusAllSaved')}` : `— ${t('statusDraftUpdating')}`}</span>
          <span className="hidden md:inline">{t('statusForm')}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{t('statusRecords')} {questions.length}</span>
          <span className="hidden md:inline">{t('statusUser')} {role}</span>
          <span className="w-[1px] h-3 bg-[#E1DFDD]"></span>
          <span>{t('statusVersion')}</span>
        </div>
      </div>

      {showIntegrationHelp && (
        <div className="fixed right-4 top-[88px] w-[360px] bg-white border border-[#8A8886] shadow-[0_8px_24px_rgba(0,0,0,0.2)] z-40" style={dirStyle}>
          <div className="h-9 bg-black text-white flex items-center justify-between px-3 text-[12px] font-semibold"><span>{t('integrationHelpTitle')}</span><button onClick={()=>setShowIntegrationHelp(false)} className="w-6 h-6 bg-[#333] flex items-center justify-center">×</button></div>
          <div className="p-3 text-[11px] space-y-2 leading-[1.5]">
            <div><b>{t('integrationHelpFormName')}</b></div>
            <div><b>{t('integrationHelpFieldName')}</b></div>
            <div><b>{t('integrationHelpTableName')}</b></div>
            <div><b>{t('integrationHelpMenuItem')}</b></div>
            <div><b>{t('integrationHelpDataEntity')}</b></div>
            <div><b>{t('integrationHelpODataEntity')}</b></div>
            <div><b>{t('integrationHelpConfigKey')}</b></div>
            <div className="mt-2 p-2 bg-[#FFF4CE] border border-[#FCE100]">{t('integrationHelpVisibleOnly')}</div>
          </div>
        </div>
      )}
    </div>
  );
}
