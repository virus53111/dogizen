// Conservative, deterministic triage for newly submitted 18+ dating profiles.
// This is NOT photo/identity/age verification and cannot guarantee safe content.
// Uncertain cases go to the existing human moderation queue.
const REVIEW_CATEGORIES=new Set(['events']);
const bannedServices=/(?:эскорт|проститу|бордел|платн[\p{L}]*\s+(?:интим|секс|встреч)|интимн[\p{L}]*\s+услуг|секс\s+за\s+деньги|услуг[\p{L}]*\s+за\s+деньги|(?:escort|prostitut\w*|paid\s+sex|sex\s+for\s+money|sexual\s+services?|incall|outcall|pay\s*per\s*meet|pay\s*for\s*meet|pay\s*for\s*sex)\b|(?:sexuelle\s+dienstleistung|bezahlter\s+sex|prostitution)\b|(?:seksuāl\w*\s+pakalpojum|prostitūc))/iu;
const minors=/(?:несовершеннолет|малолетн|школьниц|школьник|underage|schoolgirl|schoolboy|nepilngadīg|minderjährig|(?:^|\D)(?:1[0-7])\s*(?:лет|год(?:а)?|years?\s*old|y\/?o|yo|jahre|gadi)(?=$|[\s.,!?;:]))/iu;
const external=/(?:https?:\/\/|www\.|(?:t\.me|wa\.me|telegram\.me|onlyfans\.com|bit\.ly)\/|[\w.+-]+@[\w.-]+\.[a-z]{2,}|@\w{5,})/iu;
const contactDigits=/(?:\+?\d[\s.()-]*){9,}/u;
const patterned=/(.)\1{11,}|(\b[\p{L}\p{N}]{3,}\b)(?:\s+\2){4,}/iu;
export function choosePublication({category='',display_name='',headline='',description='',interests='',languages='',isDuplicate=false}={}){
 const message=[display_name,headline,description,interests,languages].join(' ').normalize('NFKC');
 const signals=[];
 if(REVIEW_CATEGORIES.has(category))signals.push('sensitive_category');
 if(bannedServices.test(message))signals.push('possible_paid_service');
 if(minors.test(message))signals.push('possible_minor');
 if(external.test(message)||contactDigits.test(message))signals.push('external_contact');
 if(patterned.test(message))signals.push('repetitive_text');
 if(isDuplicate)signals.push('duplicate_post');
 return {status:signals.length?'pending':'approved',signals};
}

 // Self-service profiles are either published automatically or returned to the author for correction.
 // A neutral event category alone does not require a human decision.
// Only deliberate publication of the author's own contacts in a listing description
// is exempt. Other URLs, contacts in other fields, and all other moderation signals
// retain their previous rules; guestbooks still use choosePublication unchanged.
function allowedDescriptionContacts(input){
 if(input.publicContactsConfirmed!==true||input.isCommercial===true)return false;
 const other=[input.display_name,input.headline,input.interests,input.languages].join(' ').normalize('NFKC');
 if(external.test(other)||contactDigits.test(other))return false;
 const description=String(input.description||'').normalize('NFKC')
  .replace(/(?<![\w./@-])(?:https:\/\/)?(?:t\.me|telegram\.me)\/[a-z][a-z0-9_]{4,31}(?![a-z0-9_/?#&=%.-])/gi,' ')
  .replace(/(?<![\w./@-])[\w.+-]+@[\w.-]+\.[a-z]{2,}(?![\w./@-])/gi,' ')
  .replace(/(?<![\w./@-])@[a-z][a-z0-9_]{4,31}(?![\w./@-])/gi,' ');
 return !external.test(description);
}

export function selfPublication(input={}){
 const signals=choosePublication(input).signals.filter(s=>s!=='sensitive_category'&&!(s==='external_contact'&&allowedDescriptionContacts(input)));
 return {allowed:signals.length===0,signals};
}
