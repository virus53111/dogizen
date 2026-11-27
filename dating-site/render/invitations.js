export const CODE=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export async function recordInvitation(q,user,ref,isNew){
 if(!isNew||!CODE.test(ref||''))return;
 await q("INSERT INTO mm_vip_referrals(invitee,inviter) SELECT $1,a.user_id FROM mm_vip_accounts a WHERE a.code=$2 AND a.user_id<>$1 AND NOT EXISTS(SELECT 1 FROM mm_vip_bans b WHERE b.user_id=a.user_id) ON CONFLICT(invitee) DO NOTHING",[user,ref]);
}
export async function invitationCode(db,user){
 await db.query('INSERT INTO mm_vip_accounts(user_id) VALUES($1) ON CONFLICT(user_id) DO NOTHING',[user]);
 return (await db.query('SELECT code FROM mm_vip_accounts WHERE user_id=$1',[user])).rows[0]?.code;
}
