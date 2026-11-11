const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const tests=[
 '_round140_wechat_module_fix_test.cjs','_round140_widget_geometry_test.cjs','_round140_card_theme_test.cjs','_round140_gallery_wall_test.cjs',
 '_round138_appearance_spec_test.cjs','_round138_appearance_stability_test.cjs','_round138_app_background_upload_test.cjs',
 '_round139_all_app_preview_test.cjs','_round139_internal_app_pages_test.cjs','_round139_widget_background_all_types_test.cjs',
 '_round139_widget_add_live_test.cjs','_round131_full_page_regression.cjs','_round131_card_complete_test.cjs',
 path.resolve('..','_round124_modules_test.cjs'),path.resolve('..','_round124_wallet_test.cjs'),path.resolve('..','_round124_cards_gesture_test.cjs'),
 path.resolve('..','_round124_newchat_test.cjs'),path.resolve('..','_round124_back_audit.cjs'),path.resolve('..','_round123_financial_export_audit.cjs'),
 path.resolve('..','_round123_cards_responsive_test.cjs'),path.resolve('..','_qa_round122_persistence_audit_2026-11-07.cjs'),
 '_round141_card_safety_test.cjs','_round142_card_intent_test.cjs','_independent_wechat_abort_typing_2026-11-10.cjs','_independent_wechat_concurrency_2026-11-10.cjs'
];
let log='Round141 complete regression\n',fail=0;
for(const file of tests){const name=path.basename(file);const r=spawnSync(process.execPath,[file],{cwd:process.cwd(),encoding:'utf8',maxBuffer:96*1024*1024,timeout:240000});const ok=r.status===0;if(!ok)fail++;log+=`[${ok?'PASS':'FAIL'}] ${name} exit=${r.status}\n${r.stdout||''}${r.stderr?('\nSTDERR:\n'+r.stderr):''}\n`;console.log(`[${ok?'PASS':'FAIL'}] ${name}`);if(!ok)console.log((r.stdout||'')+(r.stderr||''));}
fs.writeFileSync('docs/testing/round142-full-regression-2026-11-11.log',log,'utf8');console.log(`PASS ${tests.length-fail}/${tests.length}`);console.log('fail='+fail);process.exitCode=fail?1:0;

