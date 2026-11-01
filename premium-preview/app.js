/* Murdilimax Premium Preview — UI only. No live account or payment writes. */
(() => {
  'use strict';
  const en = {
    neoEyebrow: 'PROFESSIONAL ANTI-DETECT BROWSER',
    neoSubtitle: 'Powerful <span class="c-cyan">browser profiles</span>, reliable <span class="c-pink">proxies</span> and a <span class="c-lilac">unified workspace</span>.',
    neoDescription: 'Manage isolated profiles and local sessions in one application. Murdilimax is currently in active beta development.',
    neoPrimary: 'Download free beta', neoSecondary: 'Explore the interface',
    neoMicro1: '3 free profiles', neoMicro2: 'Windows & macOS', neoMicro3: 'Early access',
    labProfiles: 'Profiles',labProxies: 'Proxies',labWorkspaces: 'Groups',
    labHistory: 'History',labSettings: 'Settings',labTitle: 'Browser profiles',
    labCount: 'Interface concept',labCreate: 'Create',
    labAll: 'All (12)',labRunning: 'Running (4)',labReady: 'Ready (8)',
    labColName: 'PROFILE',labColStatus: 'STATUS',labColProxy: 'PROXY',
    labOn: 'Running',labOff: 'Ready',
    neoCap1: 'Isolated sessions',neoCap2: 'HTTP / SOCKS5 proxies',
    neoCap3: 'Local profiles',neoCap4: 'Teams — coming later',neoConcept: 'INTERFACE CONCEPT',
    neoIndustries: 'ONE SPACE FOR',neoCase1: 'E-commerce',neoCase2: 'Marketing',
    neoCase3: 'Account workflows',neoCase4: 'Research',neoCase5: 'Automation*',
    neoFeature1Title: 'Browser profiles',neoFeature1Body: 'Separate site data and independent sessions for every project.',
    neoFeature2Title: 'Proxies',neoFeature2Body: 'Assign HTTP, HTTPS and SOCKS5 proxies to individual profiles.',
    neoFeature3Title: 'Workspaces',neoFeature3Body: 'Groups, tags and quick search. Team permissions are in development.',
    neoFeature4Title: 'Profile control',neoFeature4Body: 'Local profile storage, persistent fingerprints and proxy checks.',
    neoBenefitKicker: 'ALL IN ONE PLACE',
    neoBenefitTitle: 'Manage your workflow <em>in one browser.</em>',
    neoBenefitDesc: 'From small projects to managing many browser profiles. Murdilimax is being built around speed, usability and control over your data.',
    neoBenefit1: 'Create separate browser profiles',
    neoBenefit2: 'Assign proxies, groups and tags',
    neoBenefit3: 'Manage profiles in bulk',
    neoSeePrices: 'See pricing',
    neoFinalKicker: 'START FOR FREE',
    neoFinalTitle: 'Your browser. Your rules.',
    neoFinalDesc: '3 free profiles. Beta for Windows and modern Macs.',
    neoDisclosure: 'The browser interface illustration is an artistic concept, not a screenshot of the released application. The browser remains in beta; team and cloud synchronization features are not yet available.',
    skip: 'Skip to content',
    announcement: 'Murdilimax Browser · cosmic design and new possibilities',
    navProduct: 'Product', navPricing: 'Pricing', navWorkspace: 'Workspace',
    account: 'My account', download: 'Download',
    heroEyebrow: 'THE NEXT GENERATION OF BROWSER WORKSPACES',
    heroTitle: 'Every browser profile. <em>Under your control.</em>',
    heroDesc: 'Separate sessions, proxies and easy management in one powerful workspace. Less busywork. More freedom.',
    heroCta: 'Download the free beta', heroDemo: 'Explore the interface',
    heroTrust: 'Windows & macOS · Local storage · Early access',
    floatSecure: 'Independent sessions', shotReady: 'Workspace ready',
    shotOverview: 'OVERVIEW', shotHeading: 'My profiles', shotCreate: 'New profile',
    statProfiles: 'Profiles', statNew: 'new', statActive: 'Active', shotOnline: 'Online',
    statProxies: 'Proxies', tableProfile: 'PROFILE', tableGroup: 'GROUP',
    tableProxy: 'PROXY', tableStatus: 'STATUS', tableActions: 'ACTIONS',
    running: 'Running', stopped: 'Stopped',
    shotLocal: 'Local browser workspace', chipIsolated: 'Separate sessions',
    chipLocal: 'Profile data stays on your device',
    platformCaption: 'BUILT FOR', engineCaption: 'ENGINE',
    featureKicker: 'FEATURES', featureTitle: 'Everything important, <em>all in one place.</em>',
    featureSubtitle: 'A thoughtfully designed workspace for local browser profiles. Real beta features and a transparent product roadmap.',
    featureAvailable: 'AVAILABLE IN BETA', featureInProgress: 'ON THE ROADMAP',
    featureProfilesTitle: 'Profiles, without the chaos',
    featureProfilesDesc: 'Create, find, group and launch separate browser workspaces. Site data and cookies stay isolated.',
    featureExplore: 'Explore workspace', featureProxyTitle: 'Proxies in your control',
    featureProxyDesc: 'HTTP, HTTPS and SOCKS5 assigned per profile. Basic connectivity checks are already available.',
    featureSyncTitle: 'Teams and cloud', featureSyncDesc: 'Sync, team permissions, templates and automation are planned for upcoming releases.',
    previewDisclaimer: 'Images represent the target interface, not the current installed app UI. The product is in beta and platform compatibility is still being validated.',
    ctaKicker: 'GET STARTED', ctaTitle: 'Your next workspace starts here.',
    ctaDesc: '3 free profiles. Paid plans from $7/month. Windows and Mac preview installers.',
    ctaDownload: 'Download Murdilimax', ctaCompare: 'Compare plans',
    footerDesc: 'Building a simpler, more powerful and more affordable browser profile workspace.',
    privacy: 'Privacy', guides: 'Guides', allRights: 'All rights reserved.',
    footerNote: 'Murdilimax Browser · Early beta version', mobileApp: 'Mobile app',
    priceEyebrow: 'TRANSPARENT PRICING · NO UNNECESSARY COSTS',
    priceHeading: 'Professional tools. <em>Fair prices.</em>',
    priceIntro: 'Start for free, then choose the profile capacity you need. Card payments are processed by Stripe. All paid plans provide early access to a beta product.',
    monthly: 'Billed monthly', earlyAccess: 'Early access',
    payWith: 'Payment method', cardMethod: 'Card / Stripe',
    cryptoMethod: 'Crypto', soon: 'Soon',
    freeName: 'Get started', freeDesc: 'Discover the browser workspace.',
    perMonth: '/ month', freeCta: 'Download free',
    included: 'Included:', freeF1: '3 local profiles',
    freeF2: 'HTTP / SOCKS5 proxies', freeF3: 'Local profile storage',
    freeF4: '1 device',
    startName: 'For individuals', startDesc: 'More freedom for everyday workflows.',
    planCta: 'Choose plan', startF1: '20 local profiles',
    startF2: 'Groups and tags', startF3: 'Proxies and bulk actions',
    proName: 'For professionals', proDesc: 'Scale without overspending.',
    proF1: '100 local profiles', proF3: 'Bulk operations',
    businessName: 'For growing projects',
    businessDesc: 'More profiles on one device.',
    businessF1: '300 local profiles', businessF4: 'Team features in development',
    popular: 'MOST POPULAR',
    paymentNoticeTitle: 'Secure checkout, transparent limitations',
    paymentNotice: 'Card payments take place on Stripe. Crypto checkout is not connected yet; we do not accept manual transfers. Paid subscriptions renew monthly and can be cancelled in the account portal. Cloud Sync, teams and AI are not included in current paid features.',
    faqTitle: 'Everything upfront.',
    faqQ1: 'Are payments available now?',
    faqA1: 'Existing Stripe subscriptions can be purchased through the account portal when sales are enabled. Check OS compatibility and beta limitations before paying.',
    faqQ2: 'Can I pay with USDT or USDC?',
    faqA2: 'Not yet. We are preparing a crypto payment gateway with confirmed transactions and automated license activation. No payment wallet addresses are published at this stage.',
    faqQ3: 'Can I cancel my subscription?',
    faqA3: 'Yes. Manage your paid subscription through the Stripe customer portal in your account.',
    workspacePreview: 'INTERACTIVE INTERFACE PREVIEW',
    workspaceTitle: 'A cleaner <em>workspace.</em>',
    workspaceDesc: 'Try searching, filtering and creating demo profiles. This data stays in your browser and is not connected to your actual account.',
    realAccount: 'Open real account ↗',
    demoNotice: 'DESIGN DEMO — this is not a running browser manager. Real profiles are created in the Murdilimax desktop application.',
    navigation: 'NAVIGATION', dashProfiles: 'Profiles', dashProxies: 'Proxies',
    dashGroups: 'Groups', dashActivity: 'Activity',
    workspaceLabel: 'WORKSPACE', myWorkspace: 'My workspace',
    demoAccount: 'Demo account', localPreview: 'Local preview',
    dashSubtitle: 'PROFILE MANAGEMENT', dashTitle: 'All profiles',
    dashDesc: 'Manage all your workspaces from one place.',
    newProfile: 'Create profile', metricTotalDesc: 'In your workspace',
    metricActiveDesc: 'Demo mode', metricProxyDesc: 'Assigned to profiles',
    filterAll: 'All profiles', filterActive: 'Running', filterStopped: 'Stopped',
    searchPlaceholder: 'Search profiles...', resetDemo: 'Reset demo',
    workspaceFooter: 'Thoughtfully designed. The actual browser runs separately.',
    dialogTitle: 'New demo profile', profileName: 'Profile name',
    namePlaceholder: 'e.g. Atlas Studio', profileGroup: 'Group',
    profileLocation: 'Demo proxy', cancel: 'Cancel', addProfile: 'Add profile'
  };
  /* HTML initially contains Russian strings; keep exact per-element originals. */
  const original = new WeakMap();
  document.querySelectorAll('[data-i]').forEach(node => original.set(node, node.innerHTML));
  const initialPlaceholders = new WeakMap();
  document.querySelectorAll('[data-ph]').forEach(node => initialPlaceholders.set(node, node.placeholder));
  const languages = ['ru','en'];
  const params = new URLSearchParams(location.search);
  let lang = languages.includes(params.get('lang')) ? params.get('lang') : (localStorageSafeGet('murdilimax-preview-lang') || 'ru');
  if (!languages.includes(lang)) lang = 'ru';
  let paymentMethod = 'card';
  const seed = [
    {id:'a',name:'Atlas Studio',group:'Marketing',proxy:'NL',active:true},
    {id:'n',name:'Nova Commerce',group:'Commerce',proxy:'DE',active:false},
    {id:'o',name:'Orbit Research',group:'Research',proxy:'FR',active:true},
    {id:'p',name:'Pixel Projects',group:'Marketing',proxy:'US',active:false}
  ];
  const dataKey = 'murdilimax-premium-demo-v1';
  const countries = {NL:'🇳🇱',DE:'🇩🇪',FR:'🇫🇷',US:'🇺🇸'};
  let profiles = readProfiles();
  let filter = 'all';

  function localStorageSafeGet(key) {
    try { return window.localStorage.getItem(key); } catch { return null; }
  }
  function localStorageSafeSet(key,value) {
    try { window.localStorage.setItem(key,value); } catch { /* private mode */ }
  }
  function readProfiles() {
    try {
      const parsed = JSON.parse(localStorageSafeGet(dataKey) || 'null');
      if (Array.isArray(parsed) && parsed.length <= 150 && parsed.every(p => p && typeof p.name==='string' && typeof p.group==='string' && typeof p.id==='string' && Object.hasOwn(countries,p.proxy))) {
        return parsed.map(p => ({id:String(p.id).slice(0,50),name:p.name.slice(0,48),group:p.group.slice(0,40),proxy:p.proxy,active:p.active === true}));
      }
    } catch { /* use defaults */ }
    return seed.map(p=>({...p}));
  }
  function saveProfiles(){localStorageSafeSet(dataKey,JSON.stringify(profiles));}
  function t(key) { return lang==='en' ? (en[key] || key) : (ruDynamic[key] || key); }
  const ruDynamic = {planCta:'Выбрать тариф',running:'Активен',stopped:'Остановлен',run:'Запустить',stop:'Остановить',delete:'Удалить',noProfiles:'Профили не найдены',shown:'Показано',profiles:'профилей',cryptoUnavailable:'Криптооплата скоро',confirmDelete:'Удалить этот демо-профиль?',confirmReset:'Сбросить демонстрационные профили?',enterName:'Введите название профиля.'};
  const enDynamic = {run:'Launch',stop:'Stop',delete:'Delete',noProfiles:'No profiles found',shown:'Showing',profiles:'profiles',cryptoUnavailable:'Crypto coming soon',confirmDelete:'Delete this demo profile?',confirmReset:'Reset demo profiles?',enterName:'Enter a profile name.'};
  function d(key){return (lang==='en'?enDynamic:ruDynamic)[key]||key;}
  function setLanguage(next) {
    if(!languages.includes(next))return;
    lang=next;document.documentElement.lang=next;
    localStorageSafeSet('murdilimax-preview-lang',lang);
    document.querySelectorAll('[data-i]').forEach(node => {
      if (next==='ru') node.innerHTML=original.get(node);
      else if(en[node.dataset.i]) node.innerHTML=en[node.dataset.i];
    });
    document.querySelectorAll('[data-ph]').forEach(node => node.placeholder=next==='en' ? (en[node.dataset.ph] || node.placeholder) : initialPlaceholders.get(node));
    document.querySelectorAll('[data-lang]').forEach(b=>{const selected=b.dataset.lang===next;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
    document.title=next==='en'?'Murdilimax Browser — Premium Preview':'Murdilimax Browser — Новый дизайн';
    updatePaymentButtons();
    renderProfiles();
  }
  document.querySelectorAll('[data-lang]').forEach(button=>button.addEventListener('click',()=>setLanguage(button.dataset.lang)));
  function route(){
    const target=['home','pricing','workspace'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home';
    document.querySelectorAll('[data-page]').forEach(section=>{section.hidden=section.dataset.page!==target;});
    document.querySelectorAll('[data-nav]').forEach(a=>{a.classList.toggle('active',a.dataset.nav===target);if(a.dataset.nav===target)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    window.scrollTo({top:0,behavior:'auto'});
  }
  window.addEventListener('hashchange',route);

  function updatePaymentButtons(){
    const crypto=paymentMethod==='crypto';
    document.querySelectorAll('[data-method]').forEach(button=>{const selected=button.dataset.method===paymentMethod;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));});
    document.querySelectorAll('.pay-link').forEach(link=>{
      if(!link.dataset.cardHref)link.dataset.cardHref=link.getAttribute('href')||'';
      if(crypto){link.removeAttribute('href');link.setAttribute('aria-disabled','true');link.classList.add('disabled');link.textContent=d('cryptoUnavailable');}
      else{link.setAttribute('href',link.dataset.cardHref);link.removeAttribute('aria-disabled');link.classList.remove('disabled');link.textContent=t('planCta');}
    });
  }
  document.querySelectorAll('[data-method]').forEach(button=>button.addEventListener('click',()=>{paymentMethod=button.dataset.method;updatePaymentButtons();}));
  document.querySelectorAll('.pay-link').forEach(link=>link.addEventListener('click',event=>{if(paymentMethod==='crypto')event.preventDefault();}));

  function elt(tag,cls,txt){
    const node=document.createElement(tag);
    if(cls)node.className=cls;
    if(txt!==undefined)node.textContent=txt;
    return node;
  }
  function actionButton(label,cls,handler){
    const button=elt('button','tiny-action '+(cls||''),label);
    button.type='button';button.addEventListener('click',handler);return button;
  }
  function renderProfiles(){
    const body=document.getElementById('demo-rows');
    if(!body)return;
    const query=(document.getElementById('profile-search').value||'').trim().toLocaleLowerCase();
    const matches=profiles.filter(p=>(filter==='all'||(filter==='running'?p.active:!p.active)) && [p.name,p.group,p.proxy].join(' ').toLocaleLowerCase().includes(query));
    body.replaceChildren();
    for(const p of matches){
      const tr=elt('tr');
      const nameTd=elt('td');
      const person=elt('span','profile-person');
      const letter=(p.name.trim()[0]||'M').toLocaleUpperCase();
      const avatar=elt('i','avatar '+(['avatar-purple','avatar-blue','avatar-peach'][Math.abs(p.name.length)%3]),letter);
      const words=elt('span');words.append(elt('b','',p.name),elt('small','',String(p.id).startsWith('demo-')?'demo-local':'local-demo'));
      person.append(avatar,words);nameTd.append(person);
      tr.append(nameTd,elt('td','',p.group),elt('td','',countries[p.proxy]+' '+p.proxy));
      const statusCell=elt('td');const pill=elt('span','pill '+(p.active?'running':'stopped'));
      pill.append(elt('i','status-dot '+(p.active?'':'off')),elt('span','',p.active?t('running'):t('stopped')));
      statusCell.append(pill);tr.append(statusCell);
      const actCell=elt('td');const act=elt('div','row-actions');
      act.append(actionButton(p.active?d('stop'):d('run'),'',
        ()=>{p.active=!p.active;saveProfiles();renderProfiles();}));
      act.append(actionButton(d('delete'),'danger',
        ()=>{if(window.confirm(d('confirmDelete'))){profiles=profiles.filter(x=>x.id!==p.id);saveProfiles();renderProfiles();}}));
      actCell.append(act);tr.append(actCell);
      body.append(tr);
    }
    if(matches.length===0){const tr=elt('tr'),td=elt('td','no-data',d('noProfiles'));td.colSpan=5;tr.append(td);body.append(tr);}
    document.getElementById('table-count').textContent=d('shown')+' '+matches.length+' / '+profiles.length+' '+d('profiles');
    document.getElementById('metric-total').textContent=profiles.length;
    document.getElementById('metric-active').textContent=profiles.filter(p=>p.active).length;
    document.getElementById('metric-proxy').textContent=new Set(profiles.map(p=>p.proxy)).size;
    document.getElementById('profile-total').textContent=String(profiles.length).padStart(2,'0');
    document.getElementById('nav-count').textContent=profiles.length;
  }
  document.getElementById('profile-search').addEventListener('input',renderProfiles);
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b===button));renderProfiles();
  }));
  document.getElementById('reset-demo').addEventListener('click',()=>{
    if(window.confirm(d('confirmReset'))){profiles=seed.map(p=>({...p}));saveProfiles();document.getElementById('profile-search').value='';filter='all';document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b.dataset.filter==='all'));renderProfiles();}
  });
  const dialog=document.getElementById('profile-dialog');
  const openDialog=()=>{document.getElementById('new-name').value='';if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');};
  const closeDialog=()=>{if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');};
  document.getElementById('open-create').addEventListener('click',openDialog);
  document.getElementById('close-dialog').addEventListener('click',closeDialog);
  document.getElementById('cancel-dialog').addEventListener('click',closeDialog);
  document.getElementById('profile-form').addEventListener('submit',event=>{
    event.preventDefault();
    const name=document.getElementById('new-name').value.trim();
    if(!name){window.alert(d('enterName'));return;}
    if(profiles.length>=150)return;
    profiles.unshift({id:'demo-'+Date.now().toString(36),name:name.slice(0,48),group:document.getElementById('new-group').value,proxy:document.getElementById('new-country').value,active:false});
    saveProfiles();closeDialog();renderProfiles();
  });
  setLanguage(lang);route();
})();
