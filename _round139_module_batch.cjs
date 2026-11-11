const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const tests=[
 '_round124_modules_test.cjs','_round124_wallet_test.cjs','_round124_cards_gesture_test.cjs','_round124_newchat_test.cjs',
 '_round124_back_audit.cjs','_round123_financial_export_audit.cjs','_round123_cards_responsive_test.cjs','_qa_round122_persistence_audit_2026-11-07.cjs',
 '_round131_full_page_regression.cjs','_round139_all_app_preview_test.cjs','_round139_internal_app_pages_test.cjs',
 '_round139_widget_background_all_types_test.cjs','_round139_widget_add_live_test.cjs'
];
let log='Round139 module and appearance regression\n',fail=0;
for(const t of tests){const file=fs.existsSync(t)?t:path.resolve('..',t);const r=spawnSync(process.execPath,[file],{cwd:process.cwd(),encoding:'utf8',maxBuffer:64*1024*1024,timeout:180000});const ok=r.status===0;if(!ok)fail++;log+=`[${ok?'PASS':'FAIL'}] ${t} exit=${r.status}\n`;log+=(r.stdout||'')+((r.stderr)?('\nSTDERR:\n'+r.stderr):'')+'\n';console.log(`[${ok?'PASS':'FAIL'}] ${t}`);if(!ok)console.log((r.stdout||'')+(r.stderr||''));}
fs.writeFileSync('docs/testing/round139-full-regression-2026-11-09.log',log,'utf8');console.log(`fail=${fail}`);process.exitCode=fail?1:0;

