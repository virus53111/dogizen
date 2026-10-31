// Included inside @implementation OrbitMain; native ADB bridge for the legacy dashboard.
-(void)orbitNotify:(NSDictionary *)event {
    if(!event || !self.dashboard)return;
    if(![NSJSONSerialization isValidJSONObject:event])return;
    NSData *data=[NSJSONSerialization dataWithJSONObject:event options:0 error:nil];
    NSString *json=[[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    if(!json)return;
    NSString *script=[@"window.orbit&&window.orbit.onNative(" stringByAppendingFormat:@"%@);",json];
    dispatch_async(dispatch_get_main_queue(),^{[self.dashboard evaluateJavaScript:script completionHandler:nil];});
}
-(void)orbitToast:(NSString *)text {
    [self orbitNotify:@{@"event":@"toast",@"text":text?:@""}];
}
-(void)orbitSetupDashboard {
    self.phones=[NSMutableArray array];
    self.browsers=[NSMutableDictionary dictionary];
    self.browserStores=[NSMutableDictionary dictionary];
    self.orbitDeviceSerials=[NSMutableArray array];
    self.orbitBusySerials=[NSMutableSet set];
    self.browserName=[[NSTextField alloc]initWithFrame:NSZeroRect];
    self.browserUrl=[[NSTextField alloc]initWithFrame:NSZeroRect];
    self.avdName=[[NSTextField alloc]initWithFrame:NSZeroRect];
    self.status=OrbitLabel(@"Готов к подключению Android",12,NO);
    self.window=[[NSWindow alloc]initWithContentRect:NSMakeRect(140,110,1200,800)
        styleMask:NSWindowStyleMaskTitled|NSWindowStyleMaskClosable|
                  NSWindowStyleMaskMiniaturizable|NSWindowStyleMaskResizable
        backing:NSBackingStoreBuffered defer:NO];
    self.window.minSize=NSMakeSize(940,610);
    self.window.title=@"Murdilimax Orbit Studio · Legacy Intel";
    self.window.contentView.wantsLayer=YES;
    self.window.contentView.layer.backgroundColor=[[NSColor whiteColor] CGColor];
    WKWebViewConfiguration *configuration=[[WKWebViewConfiguration alloc]init];
    WKUserContentController *events=[[WKUserContentController alloc]init];
    [events addScriptMessageHandler:self name:@"orbit"];
    configuration.userContentController=events;
    configuration.websiteDataStore=[WKWebsiteDataStore nonPersistentDataStore];
    self.dashboard=[[WKWebView alloc]initWithFrame:self.window.contentView.bounds
                                      configuration:configuration];
    self.dashboard.autoresizingMask=NSViewWidthSizable|NSViewHeightSizable;
    self.dashboard.navigationDelegate=self;
    [self.window.contentView addSubview:self.dashboard];
    NSURL *url=[NSBundle.mainBundle URLForResource:@"dashboard" withExtension:@"html"];
    if(url)[self.dashboard loadFileURL:url allowingReadAccessToURL:[url URLByDeletingLastPathComponent]];
    else OrbitAlert(@"Не найден интерфейс",@"Файл dashboard.html отсутствует в приложении. Пожалуйста, скачай новую сборку.");
    [self.window center];
    [self.window makeKeyAndOrderFront:nil];
    [NSApp activateIgnoringOtherApps:YES];
    // Poll captures asynchronously: never freeze WebKit or block UI.
    self.orbitDashboardTimer=[NSTimer scheduledTimerWithTimeInterval:2.2
       target:self selector:@selector(orbitRefreshFrames:) userInfo:nil repeats:YES];
}
-(void)orbitReloadDevices {
    NSString *adb=OrbitAdb();
    if(!adb){
        [self.orbitDeviceSerials removeAllObjects];
        [self orbitNotify:@{@"event":@"devices",@"adb":@NO,@"devices":@[]}];
        return;
    }
    dispatch_async(dispatch_get_global_queue(QOS_CLASS_UTILITY,0), ^{
        NSString *output=OrbitRun(adb,@[@"devices"],NULL);
        NSMutableArray<NSString *> *devices=[NSMutableArray array];
        for(NSString *line in [output componentsSeparatedByString:@"\n"]){
            NSArray *parts=[line componentsSeparatedByCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
            NSMutableArray *clean=[NSMutableArray array];
            for(NSString *p in parts)if(p.length)[clean addObject:p];
            if(clean.count>1 && [clean[1] isEqualToString:@"device"] &&
               [clean[0] length]<=120 && devices.count<6)[devices addObject:clean[0]];
        }
        dispatch_async(dispatch_get_main_queue(), ^{
            self.orbitDeviceSerials=devices;
            [self orbitNotify:@{@"event":@"devices",@"adb":@YES,@"devices":devices}];
            [self orbitRefreshFrames:nil];
        });
    });
}
-(void)orbitRefreshFrames:(id)sender {
    NSString *adb=OrbitAdb();
    if(!adb || !self.dashboard)return;
    for(NSString *serial in [self.orbitDeviceSerials copy]){
        if([self.orbitBusySerials containsObject:serial])continue;
        [self.orbitBusySerials addObject:serial];
        dispatch_async(dispatch_get_global_queue(QOS_CLASS_UTILITY,0), ^{
            NSData *binary=nil;
            OrbitRun(adb,@[@"-s",serial,@"exec-out",@"screencap",@"-p"],&binary);
            if(binary.length>100 && binary.length<6*1024*1024){
                // PNG image bytes from the attached Android; no synthetic screens.
                NSString *b64=[binary base64EncodedStringWithOptions:0];
                if(b64)[self orbitNotify:@{@"event":@"frame",@"serial":serial,@"data":b64}];
            }
            dispatch_async(dispatch_get_main_queue(), ^{[self.orbitBusySerials removeObject:serial];});
        });
    }
}
-(void)webView:(WKWebView *)webView didFinishNavigation:(WKNavigation *)navigation {
    [self orbitReloadDevices];
}
-(void)userContentController:(WKUserContentController *)ctrl didReceiveScriptMessage:(WKScriptMessage *)msg {
    if(![msg.body isKindOfClass:[NSDictionary class]])return;
    NSDictionary *payload=msg.body;
    NSString *action=payload[@"action"];
    if(![action isKindOfClass:[NSString class]])return;
    NSDictionary *input=[payload[@"data"] isKindOfClass:[NSDictionary class]]?payload[@"data"]:@{};
    if([action isEqualToString:@"ready"] || [action isEqualToString:@"refresh"]){
        [self orbitReloadDevices];
    }else if([action isEqualToString:@"account"]){
        [self openAccount:nil];
    }else if([action isEqualToString:@"help"]){
        [self openHelp:nil];
    }else if([action isEqualToString:@"install_adb"]){
        [self orbitInstallAdb:nil];
    }else if([action isEqualToString:@"diagnose"]){
        [self diagnose:nil];
    }else if([action isEqualToString:@"browser"]){
        NSString *name=input[@"name"],*url=input[@"url"];
        if(![name isKindOfClass:[NSString class]] || ![url isKindOfClass:[NSString class]])return;
        if(name.length>100 || url.length>1024)return;
        self.browserName.stringValue=name;
        self.browserUrl.stringValue=url;
        [self newBrowser:nil];
        [self orbitToast:@"Создана отдельная браузерная сессия WebKit"];
    }else if([action isEqualToString:@"avd"]){
        NSString *name=input[@"name"];
        if([name isKindOfClass:[NSString class]]&&name.length<=70){
            self.avdName.stringValue=name;
            [self startAVD:nil];
        }
    }else if([action isEqualToString:@"tap"] || [action isEqualToString:@"key"]){
        NSString *serial=input[@"serial"];
        if(![serial isKindOfClass:[NSString class]] || ![self.orbitDeviceSerials containsObject:serial])return;
        NSString *adb=OrbitAdb();
        if(!adb)return;
        NSArray *args=nil;
        if([action isEqualToString:@"tap"]){
            NSInteger x=[input[@"x"] integerValue],y=[input[@"y"] integerValue];
            if(x<0||x>10000||y<0||y>10000)return;
            args=@[@"-s",serial,@"shell",@"input",@"tap",
               [NSString stringWithFormat:@"%ld",(long)x],
               [NSString stringWithFormat:@"%ld",(long)y]];
        } else {
            NSString *key=[input[@"key"] description];
            if(![@[@"3",@"4",@"187"] containsObject:key])return;
            args=@[@"-s",serial,@"shell",@"input",@"keyevent",key];
        }
        dispatch_async(dispatch_get_global_queue(QOS_CLASS_UTILITY,0),^{OrbitRun(adb,args,NULL);});
    }
}
