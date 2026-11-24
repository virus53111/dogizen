// Conservative, deterministic triage for newly submitted 18+ dating profiles.
// This is NOT photo/identity/age verification and cannot guarantee safe content.
// Uncertain cases go to the existing human moderation queue.
const REVIEW_CATEGORIES=new Set(['support','events']);
const bannedServices=/(?:эскорт|проститу|бордел|платн\w*\s+(?:интим|секс|встреч)|интимн\w*\s+услуг|секс\s+за\s+деньги|услуг\w*\s+за\s+деньги|(?:escort|prostitut\w*|paid\s+sex|sex\s+for\s+money|sexual\s+services?|incall|outcall|pay\s*per\s*meet|pay\s*for\s*meet|pay\s*for\s*sex)\b|(?:sexuelle\s+dienstleistung|bezahlter\s+sex|prostitution)\b|(?:seksuāl\w*\s+pakalpojum|prostitūc))/iu;
const minors=/(?:несовершеннолет|малолетн|школьниц|школьник|underage|schoolgirl|schoolboy|nepilngadīg|minderjährig|(?:^|\D)(?:1[0-7])\s*(?:лет|год(?:а)?|years?\s*old|y\/?o|yo|jahre|gadi)(?:\b|$))/iu;
const external=/(?:https?:\/\/|www\.|(?:t\.me|wa\.me|telegram\.me|onlyfans\.com|bit\.ly)\/|[\w.+-]+@[\w.-]+\.[a-z]{2,}|@\w{5,})/iu;
const contactDigits=/(?:\+?\d[\s.()-]*){9,}/u;
const patterned=/(.)\1{11,}|(?:\b[\p{L}\p{N}]{3,}\b\s*)\1{4,}/iu;
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
