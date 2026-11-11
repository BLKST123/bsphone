const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const roots=path.resolve('..');
const tests=['_qa_chat_turn_reroll_2026-11-05.cjs','_qa_branch_export_delete_2026-11-06.cjs','_qa_forget_branch_memory_2026-11-06.cjs','_qa_forget_group_remark_scope_2026-11-07.cjs','_qa_mixed_group_edit_lifecycle_2026-11-06.cjs','_qa_turn_auto_memory_branch_fix_2026-11-05.cjs','_qa_prompt_layers_2026-11-05.cjs','_qa_turn_branch_switch_ui_2026-11-05.cjs','_round121_image_branch_hidden_zip_test.cjs','_independent_hidden_prompt_audit_2026-11-07.cjs'];
let log='Round141 WeChat/branch historical regression\n',fail=0;
for(const t of tests){const r=spawnSync(process.execPath,[path.join(roots,t)],{cwd:roots,encoding:'utf8',maxBuffer:96*1024*1024,timeout:240000});const ok=r.status===0;if(!ok)fail++;log+=`[${ok?'PASS':'FAIL'}] ${t} exit=${r.status}\n${r.stdout||''}${r.stderr?('\nSTDERR:\n'+r.stderr):''}\n`;console.log(`[${ok?'PASS':'FAIL'}] ${t}`);if(!ok)console.log((r.stdout||'')+(r.stderr||''));}
fs.writeFileSync('docs/testing/round141-wechat-branch-regression-2026-11-10.log',log,'utf8');console.log(`PASS ${tests.length-fail}/${tests.length}`);process.exitCode=fail?1:0;
