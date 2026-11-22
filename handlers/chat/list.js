export const access="user";
export const methods=["GET"];
export default async function(req,res){
 const db=req.db;
 const caller=req.user.id;
 const r=await db.query("SELECT c.id,c.listing_id,c.requester_id,c.publisher_id,c.blocked_by,c.updated_at,l.display_name,l.headline,l.city,l.country,l.avatar_url,l.status AS listing_status, (SELECT body FROM mm_messages m WHERE m.conversation_id=c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message, (SELECT COUNT(*) FROM mm_messages m WHERE m.conversation_id=c.id AND m.sender_id<>$1 AND m.seen_at IS NULL) AS unread FROM mm_conversations c JOIN mm_listings l ON l.id=c.listing_id WHERE (c.requester_id=$1 OR c.publisher_id=$1) ORDER BY c.updated_at DESC LIMIT 70",[caller]);
 res.json({chats:r.rows.map(x=>({...x,is_publisher:x.publisher_id===caller,requester_id:undefined,publisher_id:undefined,blocked_by_me:x.blocked_by===caller,blocked:!!x.blocked_by,blocked_by:undefined}))});
}
