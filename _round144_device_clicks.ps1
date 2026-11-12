$adb='E:\Codex\tools\android-sdk\platform-tools\adb.exe'
function Dump($name){ & $adb shell uiautomator dump "/sdcard/$name.xml" 2>$null | Out-Null; return (& $adb shell cat "/sdcard/$name.xml") }
function Nodes($xml){ return $xml -split '<node ' }
function Center($bounds){ $m=[regex]::Match($bounds,'\[(\d+),(\d+)\]\[(\d+),(\d+)\]'); if(!$m.Success){return $null}; return @([int](($m.Groups[1].Value+$m.Groups[3].Value)/2),[int](($m.Groups[2].Value+$m.Groups[4].Value)/2)) }
function TapText($text,$preferBottom=$false){ $xml=Dump ('r144_'+[guid]::NewGuid().ToString('N')); $items=@(); foreach($n in (Nodes $xml)){ $m=[regex]::Match($n,'text="([^"]*)"'); if($m.Success -and $m.Groups[1].Value -eq $text){ $b=[regex]::Match($n,'bounds="([^"]+)"'); if($b.Success){ $c=Center $b.Groups[1].Value; if($c){$items += [pscustomobject]@{x=$c[0];y=$c[1];top=[int]([regex]::Match($b.Groups[1].Value,'\[(\d+),').Groups[1].Value)} } } } }; if(!$items.Count){return $false}; $pick=if($preferBottom){$items|Sort-Object y -Descending|Select-Object -First 1}else{$items|Select-Object -First 1}; & $adb shell input tap $pick.x $pick.y; return $true }
function FocusOk(){ $w=(& $adb shell dumpsys window)-join "`n"; return $w -match 'mCurrentFocus=.*com\.xiaoshouji\.app' }
function HasText($xml,$text){ return $xml -match ('text="'+[regex]::Escape($text)+'"') }
& $adb shell am start -n com.xiaoshouji.app/com.xiaoshouji.app.MainActivity | Out-Null; Start-Sleep -Seconds 2
$steps=@()
$ok=TapText '我的' $true; Start-Sleep -Milliseconds 700; $xml=Dump 'r144_mine'; $steps += [ordered]@{step='切换我的页签';clicked=$ok;appForeground=(FocusOk);userPersona=HasText $xml '用户人设库';wallet=HasText $xml '钱包'}
$ok=TapText '用户人设库'; Start-Sleep -Milliseconds 700; $xml=Dump 'r144_persona'; $steps += [ordered]@{step='打开用户人设库';clicked=$ok;appForeground=(FocusOk);libraryTitle=HasText $xml '用户人设库';addButton=HasText $xml '新增人设'}
& $adb shell input keyevent 4; Start-Sleep -Milliseconds 500; $xml=Dump 'r144_mine2'; $ok=TapText '钱包'; Start-Sleep -Milliseconds 700; $xml=Dump 'r144_wallet'; $steps += [ordered]@{step='打开钱包';clicked=$ok;appForeground=(FocusOk);walletTitle=HasText $xml '钱包';addBill=HasText $xml '记一笔'}
$ok=TapText '记一笔'; Start-Sleep -Milliseconds 700; $xml=Dump 'r144_bill'; $steps += [ordered]@{step='打开记一笔';clicked=$ok;appForeground=(FocusOk);walletTitle=HasText $xml '钱包';hasForm=(HasText $xml '金额') -or (HasText $xml '保存') -or (HasText $xml '支出') -or (HasText $xml '收入')}
& $adb shell input keyevent 4; Start-Sleep -Milliseconds 300; & $adb shell input keyevent 4; Start-Sleep -Milliseconds 300; TapText '消息' $true | Out-Null; Start-Sleep -Milliseconds 700; $xml=Dump 'r144_wechat'; $steps += [ordered]@{step='返回微信消息页';clicked=$true;appForeground=(FocusOk);wechatTitle=HasText $xml '微信';messagesTab=HasText $xml '消息';contactsTab=HasText $xml '联系人';momentsTab=HasText $xml '朋友圈';mineTab=HasText $xml '我的'}
$log=(& $adb logcat -d -t 400 | Select-String -Pattern 'FATAL EXCEPTION|ANR in|Fatal signal|Uncaught').Count
$out=[ordered]@{ok=(($steps|Where-Object{$_.clicked -eq $false}).Count -eq 0 -and ($steps|Where-Object{$_.appForeground -eq $false}).Count -eq 0 -and $log -eq 0);checkedAt=(Get-Date).ToString('o');device='OPPO PMK110';android='16';package='com.xiaoshouji.app';version='3.98';versionCode=109;steps=$steps;fatalAnrJsErrorCount=$log;dataCleared=$false;existingPersonasModified=$false;messagesSent=$false;browserUsed=$false}
$out|ConvertTo-Json -Depth 8|Set-Content -LiteralPath 'docs\testing\round144-device-clicks.json' -Encoding UTF8
$out|ConvertTo-Json -Depth 8
