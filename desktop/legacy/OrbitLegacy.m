// Murdilimax Orbit Legacy — native Intel macOS 10.15+ desktop application.
// Apple AppKit + WebKit, no Python runtime or bundled modern Firefox dependencies.
// WebKit sessions are isolated by separate nonpersistent website data stores.
// No claim of fingerprint invisibility. Android screens use actual ADB PNG frames.
#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

static NSString *OrbitRun(NSString *exe, NSArray<NSString *> *args, NSData **binary) {
    if (!exe || ![[NSFileManager defaultManager] isExecutableFileAtPath:exe]) return @"Missing executable";
    NSTask *task = [[NSTask alloc] init];
    task.launchPath = exe; task.arguments = args;
    NSPipe *pipe = [NSPipe pipe];
    task.standardOutput=pipe;
    task.standardError=[NSPipe pipe];
    NSError *error=nil;
    if (![task launchAndReturnError:&error]) return error.localizedDescription ?: @"Unable to launch";
    NSData *data=[[pipe fileHandleForReading] readDataToEndOfFile];
    [task waitUntilExit];
    if(binary) *binary=data;
    return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] ?: @"";
}
static NSString *OrbitAdb(void) {
    NSString *sdk=NSProcessInfo.processInfo.environment[@"ANDROID_HOME"];
    NSArray *paths=@[
        [NSHomeDirectory() stringByAppendingPathComponent:@"Library/Android/sdk/platform-tools/adb"],
        @"/usr/local/bin/adb", @"/opt/homebrew/bin/adb",
        sdk ? [sdk stringByAppendingPathComponent:@"platform-tools/adb"] : @"/unlikely"
    ];
    for(NSString *p in paths) if([NSFileManager.defaultManager isExecutableFileAtPath:p])return p;
    NSString *envPath=NSProcessInfo.processInfo.environment[@"PATH"] ?: @"";
    for(NSString *dir in [envPath componentsSeparatedByString:@":"]){
        NSString *p=[dir stringByAppendingPathComponent:@"adb"];
        if([NSFileManager.defaultManager isExecutableFileAtPath:p])return p;
    }
    return nil;
}
static NSString *OrbitEmulator(void) {
    NSArray *paths=@[
        [NSHomeDirectory() stringByAppendingPathComponent:@"Library/Android/sdk/emulator/emulator"],
        @"/usr/local/bin/emulator"
    ];
    for(NSString *p in paths) if([NSFileManager.defaultManager isExecutableFileAtPath:p])return p;
    return nil;
}
static void OrbitAlert(NSString *title,NSString *message){
    NSAlert *alert=[[NSAlert alloc]init];
    alert.messageText=title;alert.informativeText=message ?: @"";
    [alert runModal];
}
static NSTextField *OrbitLabel(NSString *text,CGFloat size,BOOL bold){
    NSTextField *l=[NSTextField labelWithString:text ?: @""];
    l.font=bold?[NSFont boldSystemFontOfSize:size]:[NSFont systemFontOfSize:size];
    l.textColor=bold?[NSColor colorWithCalibratedRed:.86 green:.78 blue:1 alpha:1]:
                     [NSColor colorWithCalibratedRed:.76 green:.74 blue:.84 alpha:1];
    l.maximumNumberOfLines=3;l.lineBreakMode=NSLineBreakByWordWrapping;
    return l;
}
static NSButton *OrbitButton(NSString *title,id target,SEL sel){
    NSButton *b=[NSButton buttonWithTitle:title target:target action:sel];
    b.bezelStyle=NSBezelStyleRounded;
    b.font=[NSFont systemFontOfSize:12 weight:NSFontWeightMedium];
    [b setContentHuggingPriority:NSLayoutPriorityDefaultHigh forOrientation:NSLayoutConstraintOrientationHorizontal];
    return b;
}
static NSStackView *OrbitRow(NSArray<NSView *> *views){
    NSStackView *v=[NSStackView stackViewWithViews:views];
    v.orientation=NSUserInterfaceLayoutOrientationHorizontal;
    v.alignment=NSLayoutAttributeCenterY;v.spacing=10;
    return v;
}
static NSString *OrbitSavePath(void){
    NSString *folder=[NSHomeDirectory() stringByAppendingPathComponent:@"Library/Application Support/Murdilimax Orbit Legacy"];
    [NSFileManager.defaultManager createDirectoryAtPath:folder withIntermediateDirectories:YES attributes:nil error:nil];
    return [folder stringByAppendingPathComponent:@"preferences.plist"];
}

@class OrbitPhone;
@interface OrbitTouch : NSImageView
@property(nonatomic,weak) OrbitPhone *phone;
@end

@interface OrbitPhone : NSObject<NSWindowDelegate>
@property(nonatomic,strong) NSWindow *window;
@property(nonatomic,strong) OrbitTouch *screen;
@property(nonatomic,strong) NSTextField *message;
@property(nonatomic,strong) NSTimer *timer;
@property(nonatomic,strong) NSString *serial;
@property(nonatomic,strong) NSString *adb;
@property(nonatomic,assign) BOOL working;
-(instancetype)initWithSerial:(NSString*)serial adb:(NSString*)adb index:(NSUInteger)index;
-(void)refresh:(id)sender;
-(void)sendTapX:(NSInteger)x y:(NSInteger)y;
-(void)close;
@end

@implementation OrbitTouch
-(void)mouseDown:(NSEvent *)event{
    NSImage *im=self.image;
    if(!im || !self.phone) return;
    NSPoint p=[self convertPoint:event.locationInWindow fromView:nil];
    NSSize view=self.bounds.size, size=im.size;
    if(size.width<=0 || size.height<=0)return;
    CGFloat scale=MIN(view.width/size.width,view.height/size.height);
    CGFloat drawW=size.width*scale,drawH=size.height*scale;
    CGFloat left=(view.width-drawW)/2, bottom=(view.height-drawH)/2;
    if(p.x<left||p.x>left+drawW||p.y<bottom||p.y>bottom+drawH)return;
    NSInteger tx=(NSInteger)((p.x-left)/scale);
    NSInteger ty=(NSInteger)(size.height-(p.y-bottom)/scale);
    [self.phone sendTapX:MAX(0,tx) y:MAX(0,ty)];
}
@end

@implementation OrbitPhone
-(instancetype)initWithSerial:(NSString*)serial adb:(NSString*)adb index:(NSUInteger)index{
    if((self=[super init])){
        _serial=[serial copy];_adb=[adb copy];_working=NO;
        NSRect frame=NSMakeRect(160+(index%4)*65,140+(index%3)*50,315,630);
        _window=[[NSWindow alloc]initWithContentRect:frame
          styleMask:NSWindowStyleMaskTitled|NSWindowStyleMaskClosable|NSWindowStyleMaskMiniaturizable|NSWindowStyleMaskResizable
          backing:NSBackingStoreBuffered defer:NO];
        _window.title=[@"◈ Android · " stringByAppendingString:serial];
        _window.minSize=NSMakeSize(200,340);
        _window.delegate=self;
        NSView *content=_window.contentView;
        content.wantsLayer=YES;content.layer.backgroundColor=[[NSColor colorWithCalibratedRed:.08 green:.08 blue:.15 alpha:1] CGColor];
        _screen=[[OrbitTouch alloc]initWithFrame:NSZeroRect];
        _screen.phone=self;_screen.imageScaling=NSImageScaleProportionallyUpOrDown;
        _screen.translatesAutoresizingMaskIntoConstraints=NO;
        _message=OrbitLabel(@"Подключаем настоящий экран Android…",11,NO);
        _message.translatesAutoresizingMaskIntoConstraints=NO;
        [content addSubview:_screen];[content addSubview:_message];
        [NSLayoutConstraint activateConstraints:@[
          [_screen.topAnchor constraintEqualToAnchor:content.topAnchor constant:12],
          [_screen.leadingAnchor constraintEqualToAnchor:content.leadingAnchor constant:8],
          [_screen.trailingAnchor constraintEqualToAnchor:content.trailingAnchor constant:-8],
          [_screen.bottomAnchor constraintEqualToAnchor:_message.topAnchor constant:-6],
          [_message.leadingAnchor constraintEqualToAnchor:content.leadingAnchor constant:10],
          [_message.trailingAnchor constraintEqualToAnchor:content.trailingAnchor constant:-10],
          [_message.bottomAnchor constraintEqualToAnchor:content.bottomAnchor constant:-10],
          [_message.heightAnchor constraintEqualToConstant:34]
        ]];
        [_window makeKeyAndOrderFront:nil];
        _timer=[NSTimer scheduledTimerWithTimeInterval:1.6 target:self selector:@selector(refresh:) userInfo:nil repeats:YES];
        [self refresh:nil];
    }return self;
}
-(void)refresh:(id)sender{
    if(self.working || !self.window.isVisible)return;
    self.working=YES;
    NSString *adb=self.adb,*serial=self.serial;
    dispatch_async(dispatch_get_global_queue(QOS_CLASS_UTILITY,0), ^{
        NSData *binary=nil;
        OrbitRun(adb,@[@"-s",serial,@"exec-out",@"screencap",@"-p"],&binary);
        NSImage *image=binary.length>64?[[NSImage alloc]initWithData:binary]:nil;
        dispatch_async(dispatch_get_main_queue(), ^{
            self.working=NO;
            if(!self.window.isVisible)return;
            if(image){self.screen.image=image;self.message.stringValue=@"Живой ADB-экран · клик = касание · обновление ~1,6 с";}
            else self.message.stringValue=@"Нет картинки. Проверь, загружен ли Android и разрешён ли ADB.";
        });
    });
}
-(void)sendTapX:(NSInteger)x y:(NSInteger)y{
    dispatch_async(dispatch_get_global_queue(QOS_CLASS_UTILITY,0), ^{
        OrbitRun(self.adb,@[@"-s",self.serial,@"shell",@"input",@"tap",
          [NSString stringWithFormat:@"%ld",(long)x],
          [NSString stringWithFormat:@"%ld",(long)y]],NULL);
    });
}
-(void)close{[self.timer invalidate];self.timer=nil;[self.window close];}
-(void)windowWillClose:(NSNotification *)notification{[self.timer invalidate];self.timer=nil;}
@end

@interface OrbitMain : NSObject<NSApplicationDelegate>
@property(nonatomic,strong) NSWindow *window;
@property(nonatomic,strong) NSTextField *status;
@property(nonatomic,strong) NSTextField *browserName;
@property(nonatomic,strong) NSTextField *browserUrl;
@property(nonatomic,strong) NSTextField *avdName;
@property(nonatomic,strong) NSMutableArray<OrbitPhone*> *phones;
@property(nonatomic,strong) NSMutableDictionary<NSString*,NSWindow*> *browsers;
@property(nonatomic,strong) NSMutableDictionary<NSString*,WKWebsiteDataStore*> *browserStores;
@end

@implementation OrbitMain
-(void)applicationDidFinishLaunching:(NSNotification*)notification{
    self.phones=[NSMutableArray array];self.browsers=[NSMutableDictionary dictionary];
    self.browserStores=[NSMutableDictionary dictionary];
    self.window=[[NSWindow alloc]initWithContentRect:NSMakeRect(250,180,730,610)
      styleMask:NSWindowStyleMaskTitled|NSWindowStyleMaskClosable|NSWindowStyleMaskMiniaturizable|
       NSWindowStyleMaskResizable backing:NSBackingStoreBuffered defer:NO];
    self.window.title=@"Murdilimax Orbit Legacy · macOS 10.15+";
    self.window.minSize=NSMakeSize(620,550);
    NSView *content=self.window.contentView;
    content.wantsLayer=YES;
    content.layer.backgroundColor=[[NSColor colorWithCalibratedRed:.075 green:.075 blue:.15 alpha:1] CGColor];
    NSStackView *stack=[[NSStackView alloc]init];
    stack.orientation=NSUserInterfaceLayoutOrientationVertical;
    stack.alignment=NSLayoutAttributeLeading;
    stack.spacing=13;
    stack.edgeInsets=NSEdgeInsetsMake(20,22,20,22);
    stack.translatesAutoresizingMaskIntoConstraints=NO;
    [content addSubview:stack];
    [NSLayoutConstraint activateConstraints:@[
      [stack.topAnchor constraintEqualToAnchor:content.topAnchor constant:12],
      [stack.leadingAnchor constraintEqualToAnchor:content.leadingAnchor constant:8],
      [stack.trailingAnchor constraintLessThanOrEqualToAnchor:content.trailingAnchor constant:-8]
    ]];
    [stack addArrangedSubview:OrbitLabel(@"◈  MURDILIMAX  ORBIT  /  LEGACY",22,YES)];
    NSOperatingSystemVersion version=NSProcessInfo.processInfo.operatingSystemVersion;
    [stack addArrangedSubview:OrbitLabel([NSString stringWithFormat:
      @"Облегчённый Intel-клиент для старых Mac. Обнаружена macOS %ld.%ld. Без установки Python.",
      (long)version.majorVersion,(long)version.minorVersion],12,NO)];
    [stack addArrangedSubview:OrbitRow(@[
        OrbitButton(@"Мой аккаунт ↗",self,@selector(openAccount:)),
        OrbitButton(@"Диагностика",self,@selector(diagnose:)),
        OrbitButton(@"Инструкция ↗",self,@selector(openHelp:))
    ])];
    [stack addArrangedSubview:OrbitLabel(@"БРАУЗЕРНЫЕ СЕССИИ",15,YES)];
    [stack addArrangedSubview:OrbitLabel(@"Отдельные временные профили WebKit: cookies разных окон не смешиваются. Это не Camoufox и не антидетект.",11,NO)];
    self.browserName=[[NSTextField alloc]initWithFrame:NSMakeRect(0,0,155,25)];
    self.browserName.stringValue=@"Профиль 1";
    [self.browserName.widthAnchor constraintEqualToConstant:155].active=YES;
    self.browserUrl=[[NSTextField alloc]initWithFrame:NSMakeRect(0,0,255,25)];
    self.browserUrl.stringValue=@"https://example.org";
    [self.browserUrl.widthAnchor constraintEqualToConstant:255].active=YES;
    [stack addArrangedSubview:OrbitRow(@[
      OrbitLabel(@"Имя:",12,NO),self.browserName,
      OrbitLabel(@"URL:",12,NO),self.browserUrl
    ])];
    [stack addArrangedSubview:OrbitButton(@"＋ Открыть отдельный браузер",self,@selector(newBrowser:))];
    [stack addArrangedSubview:OrbitLabel(@"ANDROID · НАСТОЯЩИЕ ЭКРАНЫ",15,YES)];
    [stack addArrangedSubview:OrbitLabel(@"Управление подключёнными Android через ADB. Каждый телефон — отдельное свободно перемещаемое и масштабируемое окно.",11,NO)];
    [stack addArrangedSubview:OrbitRow(@[
      OrbitButton(@"◉ Открыть подключённые телефоны",self,@selector(openPhones:)),
      OrbitButton(@"▦ Сетка",self,@selector(gridPhones:)),
      OrbitButton(@"☷ В ряд",self,@selector(rowPhones:))
    ])];
    self.avdName=[[NSTextField alloc]initWithFrame:NSMakeRect(0,0,190,25)];
    self.avdName.placeholderString=@"Например: Pixel_2";
    [self.avdName.widthAnchor constraintEqualToConstant:190].active=YES;
    [stack addArrangedSubview:OrbitRow(@[
      OrbitLabel(@"AVD:",12,NO),self.avdName,
      OrbitButton(@"Запустить установленный AVD",self,@selector(startAVD:))
    ])];
    [stack addArrangedSubview:OrbitLabel(@"Для виртуальных устройств необходим совместимый со старой macOS Android SDK. Новые версии Android Studio обычно не подходят.",10,NO)];
    self.status=OrbitLabel(@"Готов к работе. Нажми «Диагностика» для проверки Android.",12,YES);
    self.status.textColor=[NSColor colorWithCalibratedRed:.62 green:.88 blue:.75 alpha:1];
    [stack addArrangedSubview:self.status];
    [self.window makeKeyAndOrderFront:nil];
    [NSApp activateIgnoringOtherApps:YES];
}
-(BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication*)sender{return YES;}
-(void)openAccount:(id)sender{
    [NSWorkspace.sharedWorkspace openURL:[NSURL URLWithString:@"https://murdilimax-orbit.hatchable.site/login?next=/account.html"]];
}
-(void)openHelp:(id)sender{
    [NSWorkspace.sharedWorkspace openURL:[NSURL URLWithString:@"https://github.com/virus53111/dogizen/blob/main/docs/ORBIT_LEGACY_MAC_RU.md"]];
}
-(void)diagnose:(id)sender{
    NSOperatingSystemVersion v=NSProcessInfo.processInfo.operatingSystemVersion;
    NSString *adb=OrbitAdb(),*emu=OrbitEmulator();
    NSString *devices=adb?OrbitRun(adb,@[@"devices"],NULL):@"ADB не установлен";
    NSString *list=emu?OrbitRun(emu,@[@"-list-avds"],NULL):@"Эмулятор не установлен";
    NSString *diag=[NSString stringWithFormat:@"macOS %ld.%ld.%ld\nАрхитектура: x86_64 (Legacy)\nADB: %@\nEmulator: %@\n\nУстройства:\n%@\n\nAVD:\n%@",
      (long)v.majorVersion,(long)v.minorVersion,(long)v.patchVersion,
      adb?:@"не найден",emu?:@"не найден",devices,list];
    OrbitAlert(@"Диагностика Murdilimax Orbit Legacy",diag);
}
-(void)newBrowser:(id)sender{
    for(NSString *key in [self.browsers.allKeys copy]) if(!self.browsers[key].isVisible){[self.browsers removeObjectForKey:key];[self.browserStores removeObjectForKey:key];}
    if(self.browsers.count>=2){OrbitAlert(@"Бесплатный тариф",@"Для бесплатного режима доступны две браузерные сессии. Платная лицензия Legacy пока не подключена.");return;}
    NSString *name=[self.browserName.stringValue stringByTrimmingCharactersInSet:NSCharacterSet.whitespaceCharacterSet];
    if(!name.length)name=[NSString stringWithFormat:@"Профиль %lu",(unsigned long)(self.browsers.count+1)];
    if(self.browsers[name]){[self.browsers[name] makeKeyAndOrderFront:nil];return;}
    NSString *str=self.browserUrl.stringValue;
    NSURLComponents *c=[NSURLComponents componentsWithString:str];
    if(!c || ![@[@"http",@"https"] containsObject:c.scheme.lowercaseString] || !c.host.length){
        OrbitAlert(@"Неправильный URL",@"Используй адрес вида https://example.org.");return;
    }
    WKWebViewConfiguration *config=[[WKWebViewConfiguration alloc]init];
    config.websiteDataStore=[WKWebsiteDataStore nonPersistentDataStore];
    config.processPool=[[WKProcessPool alloc]init];
    WKWebView *web=[[WKWebView alloc]initWithFrame:NSMakeRect(0,0,960,650) configuration:config];
    NSWindow *win=[[NSWindow alloc]initWithContentRect:NSMakeRect(210,140,960,650)
       styleMask:NSWindowStyleMaskTitled|NSWindowStyleMaskClosable|NSWindowStyleMaskResizable|NSWindowStyleMaskMiniaturizable
       backing:NSBackingStoreBuffered defer:NO];
    win.title=[@"◈ Orbit Browser · " stringByAppendingString:name];
    win.contentView=web;
    [win makeKeyAndOrderFront:nil];
    [web loadRequest:[NSURLRequest requestWithURL:c.URL cachePolicy:NSURLRequestReloadIgnoringLocalCacheData timeoutInterval:25]];
    self.browsers[name]=win;self.browserStores[name]=config.websiteDataStore;
    self.status.stringValue=[NSString stringWithFormat:@"WebKit сессий: %lu (временные, без постоянных cookies)",(unsigned long)self.browsers.count];
}
-(void)openPhones:(id)sender{
    NSString *adb=OrbitAdb();
    if(!adb){OrbitAlert(@"ADB не найден",@"Для реальных экранов Android установи совместимые с твоей системой Android platform-tools. Смотри инструкцию.");return;}
    NSString *devices=OrbitRun(adb,@[@"devices"],NULL);
    NSMutableArray *serials=[NSMutableArray array];
    for(NSString *line in [devices componentsSeparatedByString:@"\n"]){
        NSArray *parts=[[line stringByTrimmingCharactersInSet:NSCharacterSet.whitespaceCharacterSet] componentsSeparatedByCharactersInSet:NSCharacterSet.whitespaceCharacterSet];
        NSMutableArray *clean=[NSMutableArray array];
        for(NSString *p in parts)if(p.length)[clean addObject:p];
        if(clean.count>=2 && [clean[1] isEqualToString:@"device"]) [serials addObject:clean[0]];
    }
    if(!serials.count){OrbitAlert(@"Android не найден",@"Нет работающих устройств. Подключи реальный телефон с ADB или запусти ранее созданный Android AVD.");return;}
    NSUInteger freeLimit=1;
    if(serials.count>freeLimit){self.status.stringValue=@"Бесплатный режим Legacy: показываю первый Android."; }
    for(NSUInteger i=0;i<MIN(serials.count,freeLimit);i++){
        NSString *serial=serials[i];BOOL already=NO;
        for(OrbitPhone *p in self.phones)if([p.serial isEqualToString:serial] && p.window.isVisible){[p.window makeKeyAndOrderFront:nil];already=YES;break;}
        if(!already)[self.phones addObject:[[OrbitPhone alloc]initWithSerial:serial adb:adb index:i]];
    }
}
-(void)startAVD:(id)sender{
    NSString *exe=OrbitEmulator();
    if(!exe){OrbitAlert(@"Emulator не найден",@"Нужен совместимый старый Android SDK с эмулятором. Современный Android Studio не работает на macOS Catalina.");return;}
    NSString *name=[self.avdName.stringValue stringByTrimmingCharactersInSet:NSCharacterSet.whitespaceCharacterSet];
    NSCharacterSet *allowed=[NSCharacterSet characterSetWithCharactersInString:@"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_.-"];
    if(name.length<2 || name.length>70 || [name rangeOfCharacterFromSet:[allowed invertedSet]].location!=NSNotFound){
        OrbitAlert(@"Укажи имя AVD",@"Используй имя созданного ранее Android AVD из Android Device Manager.");return;
    }
    NSString *list=OrbitRun(exe,@[@"-list-avds"],NULL);
    if(![[list componentsSeparatedByString:@"\n"] containsObject:name]){
        OrbitAlert(@"AVD не найден",@"Создай виртуальный телефон в совместимой с macOS версии Android SDK. Доступные AVD смотри в «Диагностика».");return;
    }
    NSTask *task=[[NSTask alloc]init];task.launchPath=exe;
    task.arguments=@[@"-avd",name,@"-no-boot-anim",@"-gpu",@"swiftshader_indirect",@"-memory",@"1536"];
    task.standardOutput=[NSPipe pipe];task.standardError=[NSPipe pipe];
    NSError *err=nil;
    if(![task launchAndReturnError:&err]){OrbitAlert(@"Ошибка запуска",err.localizedDescription);return;}
    self.status.stringValue=[@"Запускается Android: " stringByAppendingString:name];
}
-(void)arrange:(BOOL)grid{
    NSMutableArray *visible=[NSMutableArray array];
    for(OrbitPhone *p in self.phones)if(p.window.isVisible)[visible addObject:p];
    if(!visible.count){OrbitAlert(@"Нет телефонов",@"Сначала открой Android-экраны.");return;}
    NSRect area=NSScreen.mainScreen.visibleFrame;
    CGFloat width=MIN(305,MAX(215,area.size.width/(grid?2:visible.count)-24));
    CGFloat height=MIN(555,area.size.height*.78);
    NSInteger cols=grid?MAX(1,(NSInteger)floor(area.size.width/(width+12))):(NSInteger)visible.count;
    for(NSUInteger i=0;i<visible.count;i++){
        OrbitPhone *p=visible[i];
        CGFloat x=area.origin.x+15+(i%cols)*(width+10);
        CGFloat y=NSMaxY(area)-height-15-(i/cols)*(height+10);
        [p.window setFrame:NSMakeRect(x,y,width,height) display:YES animate:YES];
    }
}
-(void)gridPhones:(id)sender{[self arrange:YES];}
-(void)rowPhones:(id)sender{[self arrange:NO];}
@end

int main(int argc,const char *argv[]) {
    @autoreleasepool{
        if(argc>=2 && strcmp(argv[1],"--check")==0){
            NSOperatingSystemVersion v=NSProcessInfo.processInfo.operatingSystemVersion;
            printf("Orbit Legacy x86_64 macOS %ld.%ld OK\n",(long)v.majorVersion,(long)v.minorVersion);
            return 0;
        }
        [NSApplication sharedApplication];
        OrbitMain *controller=[[OrbitMain alloc]init];
        NSApp.delegate=controller;
        [NSApp setActivationPolicy:NSApplicationActivationPolicyRegular];
        [NSApp run];
    }
    return 0;
}
