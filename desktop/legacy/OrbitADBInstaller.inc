// Official Google ADB first-run installer for old Intel macOS.
// Installs only into user's Application Support, after explicit approval,
// and verifies a pinned SHA-256 before unpacking. Never uses shell scripts.
-(void)orbitInstallAdb:(id)sender {
    if(self.orbitInstallingAdb){[self orbitToast:@"Установка ADB уже идёт"];return;}
    NSAlert *alert=[[NSAlert alloc]init];
    alert.messageText=@"Установить Android ADB?";
    alert.informativeText=@"Murdilimax Orbit загрузит официальный Android Platform-Tools 34.0.5 с dl.google.com (около 11 МБ), проверит SHA-256 и установит ADB в твою папку Application Support. Это не Android-эмулятор: для виртуального телефона нужен совместимый Android SDK/AVD либо физический Android с USB-отладкой.\n\nПродолжая, ты подтверждаешь, что ознакомился с условиями использования Android SDK Google.";
    [alert addButtonWithTitle:@"Установить ADB"];
    [alert addButtonWithTitle:@"Отмена"];
    [alert addButtonWithTitle:@"Условия Google"];
    NSModalResponse result=[alert runModal];
    if(result==NSAlertThirdButtonReturn){
        [NSWorkspace.sharedWorkspace openURL:[NSURL URLWithString:@"https://developer.android.com/studio/terms"]];
        return;
    }
    if(result!=NSAlertFirstButtonReturn)return;
    self.orbitInstallingAdb=YES;
    [self orbitToast:@"Загрузка ADB с официального сервера Google…"];
    NSURL *url=[NSURL URLWithString:@"https://dl.google.com/android/repository/platform-tools_r34.0.5-darwin.zip"];
    NSURLSessionConfiguration *cfg=[NSURLSessionConfiguration ephemeralSessionConfiguration];
    cfg.timeoutIntervalForRequest=40;
    cfg.timeoutIntervalForResource=120;
    NSURLSession *session=[NSURLSession sessionWithConfiguration:cfg];
    NSURLSessionDataTask *download=[session dataTaskWithURL:url completionHandler:^(NSData *data,NSURLResponse *response,NSError *error){
        if(error || data.length<1000000 || data.length>40000000){
            dispatch_async(dispatch_get_main_queue(),^{
                self.orbitInstallingAdb=NO;
                [self orbitToast:[NSString stringWithFormat:@"Не удалось скачать ADB: %@",error.localizedDescription?:@"ошибка соединения"]];
            });return;
        }
        unsigned char hash[CC_SHA256_DIGEST_LENGTH];
        CC_SHA256(data.bytes,(CC_LONG)data.length,hash);
        NSMutableString *hex=[NSMutableString string];
        for(int i=0;i<CC_SHA256_DIGEST_LENGTH;i++)[hex appendFormat:@"%02x",hash[i]];
        NSString *expected=@"b2c9757744a9d01fcc616b893ac6236233caf1bdf2ef384d73371ab68bfc4a43";
        if(![hex isEqualToString:expected]){
            dispatch_async(dispatch_get_main_queue(),^{
                self.orbitInstallingAdb=NO;
                OrbitAlert(@"Проверка ADB не пройдена",@"Архив отличается от ожидаемой официальной версии. Установка прервана — повреждённый или изменённый файл не будет запущен.");
            });return;
        }
        NSFileManager *fm=NSFileManager.defaultManager;
        NSString *root=[NSHomeDirectory() stringByAppendingPathComponent:@"Library/Application Support/Murdilimax Orbit Legacy"];
        NSString *tmp=[NSTemporaryDirectory() stringByAppendingPathComponent:[[NSUUID UUID] UUIDString]];
        [fm createDirectoryAtPath:tmp withIntermediateDirectories:YES attributes:@{NSFilePosixPermissions:@0700} error:nil];
        NSString *zip=[tmp stringByAppendingPathComponent:@"tools.zip"];
        NSString *unpacked=[tmp stringByAppendingPathComponent:@"extract"];
        NSError *io=nil;
        if(![data writeToFile:zip options:NSDataWritingAtomic error:&io] ||
           ![fm createDirectoryAtPath:unpacked withIntermediateDirectories:YES attributes:nil error:&io]){
            dispatch_async(dispatch_get_main_queue(),^{self.orbitInstallingAdb=NO;OrbitAlert(@"ADB",@"Не удалось сохранить архив ADB.");});return;
        }
        OrbitRun(@"/usr/bin/ditto",@[@"-x",@"-k",zip,unpacked],NULL);
        NSString *adb=[unpacked stringByAppendingPathComponent:@"platform-tools/adb"];
        BOOL ok=[fm fileExistsAtPath:adb];
        if(ok){
            [fm setAttributes:@{NSFilePosixPermissions:@0755} ofItemAtPath:adb error:nil];
            NSString *target=[root stringByAppendingPathComponent:@"platform-tools"];
            [fm createDirectoryAtPath:root withIntermediateDirectories:YES attributes:nil error:nil];
            NSString *backup=[tmp stringByAppendingPathComponent:@"previous"];
            if([fm fileExistsAtPath:target])[fm moveItemAtPath:target toPath:backup error:nil];
            if(![fm moveItemAtPath:[unpacked stringByAppendingPathComponent:@"platform-tools"] toPath:target error:&io]){
                if([fm fileExistsAtPath:backup])[fm moveItemAtPath:backup toPath:target error:nil];
                ok=NO;
            }
        }
        if(ok){
            // Validate binary by calling adb version before claiming success.
            NSString *version=OrbitRun(OrbitPrivateAdbPath(),@[@"version"],NULL);
            ok=[version rangeOfString:@"Android Debug Bridge"].location!=NSNotFound;
        }
        [fm removeItemAtPath:tmp error:nil];
        dispatch_async(dispatch_get_main_queue(),^{
            self.orbitInstallingAdb=NO;
            if(ok){
                [self orbitToast:@"✓ Android ADB установлен. Подключи телефон или запусти AVD."];
                [self orbitReloadDevices];
            }else {
                OrbitAlert(@"ADB не запустился",@"ADB скачан и проверен, но не смог установиться или запуститься на этой macOS. Потребуется проверить версию системы и диагностические данные.");
            }
        });
    }];
    [download resume];
}
